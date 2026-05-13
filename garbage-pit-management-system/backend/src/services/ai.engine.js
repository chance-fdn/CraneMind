'use strict';

const axios = require('axios');
const config = require('../config');
const demo = require('../demo.store');
const logger = require('../utils/logger');

const ALARM_KNOWLEDGE = {
  overload: {
    name: '超载告警',
    baseSeverity: 90,
    causes: ['抓斗负载超过额定值', '称重传感器漂移', '垃圾密度异常偏高', '抓斗闭合角度异常'],
    actions: ['立即停止提升动作', '卸载部分物料后复核重量', '检查称重传感器零点', '确认抓斗闭合机构状态'],
  },
  grab_slip: {
    name: '遛钩告警',
    baseSeverity: 96,
    causes: ['制动器抱闸力不足', '钢丝绳打滑或磨损', '变频器制动参数异常', '抓斗液压系统泄漏'],
    actions: ['立即急停并拉开作业区域', '检查制动器间隙和磨损', '复核钢丝绳状态', '检查液压压力与回油情况'],
  },
  position_error: {
    name: '位置校验超差',
    baseSeverity: 78,
    causes: ['编码器读数漂移', '轨道定位标定偏移', '限位开关信号抖动', 'PLC 与上位机坐标不同步'],
    actions: ['切换低速手动模式', '重新校准编码器与零点', '检查限位开关信号', '同步 PLC 与上位机坐标基准'],
  },
  collision_warning: {
    name: '碰撞预警',
    baseSeverity: 88,
    causes: ['多台行车安全距离不足', '避障区域配置不完整', '任务路径交叉', '定位数据更新延迟'],
    actions: ['暂停相关行车任务', '确认行车间距和轨迹', '重新计算任务路径', '检查 WebSocket/PLC 状态刷新延迟'],
  },
  sensor_fault: {
    name: '传感器故障',
    baseSeverity: 62,
    causes: ['传感器离线', '线缆接触不良', '采集模块供电异常', '传感器量程或标定参数错误'],
    actions: ['检查传感器在线状态', '检查线缆和端子', '重启采集模块', '复核传感器标定参数'],
  },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 2) {
  return Number(Number(value || 0).toFixed(digits));
}

function getProviderInfo() {
  const apiKey = config.ai.apiKey || '';
  const enabled = config.ai.enabled && apiKey && !apiKey.includes('your-ai-api-key');

  return {
    enabled,
    provider: config.ai.provider,
    model: config.ai.model,
    apiUrl: config.ai.apiUrl,
  };
}

function extractJson(text) {
  if (!text || typeof text !== 'string') return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch (_) {
      return null;
    }
  }
}

async function callChatModel(task, context, schemaHint) {
  const provider = getProviderInfo();
  if (!provider.enabled) {
    return null;
  }

  try {
    const response = await axios.post(
      `${provider.apiUrl.replace(/\/$/, '')}/chat/completions`,
      {
        model: provider.model,
        temperature: config.ai.temperature,
        max_tokens: Math.min(config.ai.maxTokens, 1600),
        messages: [
          {
            role: 'system',
            content: [
              '你是垃圾焚烧厂智慧垃圾吊和垃圾储坑管控专家。',
              '你必须根据现场数据给出可执行建议，避免空泛表达。',
              '只返回合法 JSON，不要返回 Markdown。',
            ].join(''),
          },
          {
            role: 'user',
            content: JSON.stringify({ task, context, schemaHint }, null, 2),
          },
        ],
      },
      {
        timeout: config.ai.timeout,
        headers: {
          Authorization: `Bearer ${config.ai.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    return extractJson(content);
  } catch (error) {
    logger.warn('AI 大模型调用失败，使用本地智能推理结果', {
      task,
      message: error.message,
    });
    return null;
  }
}

function buildFermentationContext(areaId, timeRange, measurements = []) {
  const area = demo.areas.find((item) => Number(item.id) === Number(areaId)) || demo.areas[0];
  const series = measurements.length > 0
    ? measurements
    : demo.fermentation
        .filter((item) => item.areaNo === area.areaNo)
        .concat(demo.fermentation.slice(0, 6));

  const latest = series[series.length - 1] || {
    temperature: area.temperature,
    humidity: area.humidity,
    methaneConcentration: area.methane,
  };

  const tempTrend = round((latest.temperature || area.temperature) - (series[0]?.temperature || area.temperature), 2);
  const methaneTrend = round((latest.methaneConcentration || area.methane) - (series[0]?.methaneConcentration || area.methane), 2);
  const fillRate = area.maxHeight ? round((area.currentHeight / area.maxHeight) * 100, 1) : 0;

  let riskScore = 28;
  riskScore += tempTrend > 3 ? 14 : 0;
  riskScore += methaneTrend > 2 ? 18 : 0;
  riskScore += latest.temperature > 55 ? 25 : latest.temperature > 48 ? 12 : 0;
  riskScore += latest.methaneConcentration > 15 ? 25 : latest.methaneConcentration > 12 ? 12 : 0;
  riskScore += fillRate > 85 ? 12 : 0;
  riskScore = clamp(riskScore, 0, 100);

  const riskLevel = riskScore >= 75 ? 'high' : riskScore >= 50 ? 'medium' : 'low';
  const nextMethane = round((latest.methaneConcentration || area.methane) + Math.max(0.3, methaneTrend * 0.45), 2);
  const nextTemp = round((latest.temperature || area.temperature) + Math.max(0.2, tempTrend * 0.35), 2);

  return {
    area,
    timeRange,
    latest,
    trends: { temperatureDelta: tempTrend, methaneDelta: methaneTrend, fillRate },
    riskScore,
    riskLevel,
    prediction: {
      temperature: nextTemp,
      humidity: round((latest.humidity || area.humidity) + 0.8, 2),
      methaneConcentration: nextMethane,
      trend: riskLevel === 'high' ? '快速升高' : riskLevel === 'medium' ? '缓慢升高' : '平稳',
    },
  };
}

async function analyzeFermentation(params) {
  const { areaId, timeRange = '24h', measurements = [] } = params;
  const context = buildFermentationContext(areaId, timeRange, measurements);
  const hoursToTurn = context.riskLevel === 'high' ? 2 : context.riskLevel === 'medium' ? 8 : 18;
  const optimalTime = new Date(Date.now() + hoursToTurn * 60 * 60 * 1000).toISOString();

  const local = {
    mode: 'hybrid-local',
    areaId: Number(areaId),
    areaName: context.area.name,
    riskLevel: context.riskLevel,
    riskScore: context.riskScore,
    confidence: context.riskLevel === 'high' ? 0.89 : 0.82,
    prediction: context.prediction,
    optimalTime,
    recommendation: context.riskLevel === 'high'
      ? `${context.area.name}温度/甲烷指标升高，建议2小时内安排翻堆并加强通风。`
      : context.riskLevel === 'medium'
        ? `${context.area.name}发酵进入活跃段，建议本班次内翻堆并复测甲烷浓度。`
        : `${context.area.name}发酵状态平稳，建议按计划巡检，暂不需要提前翻堆。`,
    evidence: [
      `堆料填充率 ${context.trends.fillRate}%`,
      `温度变化 ${context.trends.temperatureDelta}℃`,
      `甲烷变化 ${context.trends.methaneDelta}%`,
    ],
    actions: [
      '复核区域温度、湿度、甲烷传感器读数',
      context.riskLevel === 'low' ? '保持常规翻堆计划' : '安排垃圾吊执行翻料任务',
      context.riskLevel === 'high' ? '开启区域通风并提醒中控关注告警阈值' : '持续观察未来2小时趋势',
    ],
    analyzedAt: new Date().toISOString(),
  };

  const llm = await callChatModel('fermentation_analysis', context, {
    fields: ['recommendation', 'actions', 'riskLevel', 'riskScore', 'prediction'],
  });

  return llm ? { ...local, ...llm, mode: 'hybrid-llm' } : local;
}

async function diagnoseAlarm(params) {
  const { alarmId, alarmType, craneId, sensorData = {}, contextData = {} } = params;
  const knowledge = ALARM_KNOWLEDGE[alarmType] || ALARM_KNOWLEDGE.sensor_fault;
  const crane = demo.cranes.find((item) => Number(item.id) === Number(craneId)) || demo.cranes[0];

  const load = Number(sensorData.loadWeight ?? crane.loadWeight ?? 0);
  const speed = Number(sensorData.speed ?? crane.speed ?? 0);
  const positionError = Number(sensorData.positionError ?? sensorData.position_error ?? 0);
  const recentAlarmCount = Number(contextData.recentAlarmCount || 0);

  let severityScore = knowledge.baseSeverity;
  severityScore += load > 8 ? 8 : load > 6 ? 4 : 0;
  severityScore += speed > 2 ? 4 : 0;
  severityScore += positionError > 1 ? 10 : positionError > 0.5 ? 5 : 0;
  severityScore += recentAlarmCount >= 3 ? 8 : 0;
  severityScore = clamp(severityScore, 0, 100);

  const priority = severityScore >= 90 ? 'critical' : severityScore >= 75 ? 'high' : severityScore >= 55 ? 'medium' : 'low';
  const immediate = priority === 'critical' || priority === 'high';

  const local = {
    mode: 'hybrid-local',
    alarmId,
    alarmType,
    alarmName: knowledge.name,
    craneId,
    craneName: crane.name,
    priority,
    severityScore,
    confidence: clamp(0.72 + severityScore / 500, 0.72, 0.94),
    requiresImmediateAttention: immediate,
    possibleCauses: knowledge.causes.map((cause, index) => ({
      cause,
      probability: round(clamp(0.86 - index * 0.11 + (recentAlarmCount > 1 ? 0.04 : 0), 0.35, 0.95), 2),
    })),
    recommendedActions: knowledge.actions,
    safetyChecklist: [
      '确认作业半径内无人员',
      '将相关行车切到低速或停止状态',
      '通知设备点检人员到场确认',
      '处理完成前禁止自动任务重新下发',
    ],
    sensorInterpretation: {
      loadWeight: load,
      speed,
      positionError,
      summary: `当前负载${load}吨、速度${speed}m/s、位置偏差${positionError}m。`,
    },
    estimatedRepairTime: priority === 'critical' ? '立即处理，预计30-120分钟' : '预计1-2小时',
    diagnosedAt: new Date().toISOString(),
  };

  const llm = await callChatModel('crane_alarm_diagnosis', { ...params, local }, {
    fields: ['priority', 'possibleCauses', 'recommendedActions', 'safetyChecklist', 'summary'],
  });

  return llm ? { ...local, ...llm, mode: 'hybrid-llm' } : local;
}

async function detectObject(params) {
  const { cameraId, imageUrl = '', detections = [] } = params;
  const camera = demo.devices.find((item) => Number(item.id) === Number(cameraId)) || demo.devices.find((item) => item.type === 'camera');
  const objects = detections.length > 0 ? detections : [
    { type: 'furniture', label: '疑似家具/木板', confidence: 0.91, width: 1.5, height: 1.1, material: 'wood' },
    { type: 'metal_piece', label: '金属块', confidence: 0.83, width: 0.42, height: 0.28, material: 'metal' },
  ];

  const enriched = objects.map((item) => {
    const area = Number(item.width || 0) * Number(item.height || 0);
    const isLarge = area >= 0.8 || Number(item.width || 0) >= 1.2 || ['furniture', 'mattress', 'construction_waste'].includes(item.type);
    return {
      ...item,
      estimatedArea: round(area, 2),
      isLarge,
      riskScore: clamp(Math.round((item.confidence || 0.7) * 70 + (isLarge ? 25 : 0)), 0, 100),
    };
  });

  const largeObjects = enriched.filter((item) => item.isLarge && item.confidence >= config.ai.confidenceThreshold);
  const local = {
    mode: 'hybrid-local',
    cameraId,
    cameraName: camera?.name || `摄像头${cameraId}`,
    imageUrl,
    detected: enriched.length > 0,
    objects: enriched,
    isLargeObject: largeObjects.length > 0,
    alarmGenerated: largeObjects.length > 0,
    alarmId: largeObjects.length > 0 ? Date.now() % 100000 : null,
    confidence: enriched.length ? round(Math.max(...enriched.map((item) => item.confidence)), 2) : 0,
    recommendations: largeObjects.length > 0
      ? ['暂停对应卸料门进料', '通知现场人员处理大物体', '联动相邻摄像头复核位置', '处理完成后记录物体类别和处置结果']
      : ['未发现需要拦截的大物体，保持常规监控'],
    detectedAt: new Date().toISOString(),
  };

  const llm = await callChatModel('large_object_detection_review', { ...params, local }, {
    fields: ['objects', 'isLargeObject', 'recommendations', 'riskSummary'],
  });

  return llm ? { ...local, ...llm, mode: 'hybrid-llm' } : local;
}

function normalizeArea(area, index) {
  return {
    id: Number(area.id ?? area.areaId ?? index + 1),
    name: area.name || area.areaName || `区域${index + 1}`,
    height: Number(area.height ?? area.currentHeight ?? area.stackingHeight ?? 0),
    maxHeight: Number(area.maxHeight ?? 8),
    weight: Number(area.weight ?? area.totalWeight ?? area.trashWeight ?? 0),
    type: area.type || 'stacking',
  };
}

async function optimizeSchedule(params) {
  const currentInventory = params.currentInventory || {};
  const feedingDemand = params.feedingDemand || {};
  const cranes = (params.cranes || demo.cranes).filter((item) => item.status !== 'fault');
  const areas = (currentInventory.areas?.length ? currentInventory.areas : demo.areas).map(normalizeArea);
  const targetWeight = Number(feedingDemand.targetWeight || 8);

  const scoredAreas = areas.map((area) => {
    const fillRate = area.maxHeight ? area.height / area.maxHeight : 0;
    const fermentation = demo.fermentation.find((item) => item.areaNo === area.areaNo || item.areaNo === area.name);
    const methane = Number(fermentation?.methaneConcentration || area.methane || 8);
    const score = round(fillRate * 55 + methane * 2 + (area.type === 'stacking' ? 10 : 0), 2);
    return { ...area, fillRate: round(fillRate * 100, 1), methane, score };
  }).sort((a, b) => b.score - a.score);

  const availableCranes = cranes.filter((item) => item.status !== 'offline');
  const recommendations = scoredAreas.slice(0, 4).map((area, index) => {
    const crane = availableCranes[index % availableCranes.length] || cranes[0];
    const taskType = index === 0 ? 'feeding' : area.methane > 12 ? 'turning' : 'stacking';
    return {
      craneId: crane.id,
      craneNo: crane.craneNo || crane.crane_no,
      taskType,
      taskTypeName: { feeding: '投料', turning: '翻料', stacking: '堆料', moving: '移料' }[taskType],
      sourceAreaId: area.id,
      sourceAreaName: area.name,
      targetAreaId: taskType === 'feeding' ? 'feed-port-1' : area.id,
      targetAreaName: taskType === 'feeding' ? '1号投料口' : area.name,
      estimatedWeight: round(Math.min(targetWeight, Math.max(2.5, area.weight / 80 || area.height)), 1),
      priority: index + 1,
      reason: `${area.name}填充率${area.fillRate}%、甲烷${area.methane}%，综合评分${area.score}，适合优先${{ feeding: '投料', turning: '翻料', stacking: '堆料' }[taskType]}。`,
      estimatedDuration: Math.round(240 + index * 70 + area.fillRate * 2),
      energyConsumption: round(1.6 + index * 0.4 + area.fillRate / 100, 2),
      safetyScore: round(clamp(0.96 - area.fillRate / 500 - (area.methane > 14 ? 0.08 : 0), 0.65, 0.98), 2),
    };
  });

  const totalDuration = recommendations.reduce((sum, item) => sum + item.estimatedDuration, 0);
  const avgSafety = recommendations.reduce((sum, item) => sum + item.safetyScore, 0) / Math.max(recommendations.length, 1);

  const local = {
    mode: 'hybrid-local',
    recommendations,
    optimizationScore: round(clamp(avgSafety * 0.55 + Math.min(recommendations.length, 4) * 0.1, 0, 0.96), 2),
    estimatedEfficiency: feedingDemand.urgency === 'high' ? '预计提升18%' : '预计提升12%',
    estimatedTimeSaved: Math.round(totalDuration * 0.12 / 60),
    estimatedEnergySaved: round(recommendations.reduce((sum, item) => sum + item.energyConsumption, 0) * 0.16, 2),
    summary: {
      totalTasks: recommendations.length,
      totalWeight: round(recommendations.reduce((sum, item) => sum + item.estimatedWeight, 0), 1),
      totalDuration,
      averageSafety: round(avgSafety, 2),
    },
    constraints: {
      availableCranes: availableCranes.map((item) => item.name),
      highRiskAreas: scoredAreas.filter((item) => item.methane > 14 || item.fillRate > 85).map((item) => item.name),
    },
    analyzedAt: new Date().toISOString(),
  };

  const llm = await callChatModel('schedule_optimization', { ...params, local }, {
    fields: ['recommendations', 'optimizationScore', 'estimatedEfficiency', 'dispatchStrategy'],
  });

  return llm ? { ...local, ...llm, mode: 'hybrid-llm' } : local;
}

function buildDispatchInstruction(task, index) {
  const direction = task.taskType === 'feeding' ? 'source_to_feed_port' : 'area_operation';
  return {
    instructionNo: `AI-INS-${Date.now()}-${index + 1}`,
    taskNo: task.taskNo,
    craneId: task.craneId,
    craneNo: task.craneNo,
    instructionType: task.taskType,
    content: `${task.craneNo}执行${task.taskTypeName}: ${task.sourceAreaName} -> ${task.targetAreaName}`,
    route: {
      mode: direction,
      sourceAreaId: task.sourceAreaId,
      sourceAreaName: task.sourceAreaName,
      targetAreaId: task.targetAreaId,
      targetAreaName: task.targetAreaName,
      estimatedDistance: round(28 + index * 11 + task.estimatedWeight * 1.6, 1),
    },
    safety: {
      maxSpeed: task.priority === 1 ? 1.2 : 1.5,
      minCraneDistance: 2.5,
      requireManualConfirm: task.safetyScore < 0.82 || task.priority === 1,
      interlocks: ['limit_switch', 'load_weight', 'anti_collision', 'area_permission'],
    },
    status: 'pending_confirm',
  };
}

async function generateCraneDispatch(params = {}) {
  const currentInventory = params.currentInventory || {
    totalWeight: demo.areas.reduce((sum, area) => sum + area.trashWeight, 0),
    areas: demo.areas.map((area) => ({
      id: area.id,
      name: area.name,
      height: area.currentHeight,
      maxHeight: area.maxHeight,
      weight: area.trashWeight,
      type: area.type,
      methane: area.methane,
    })),
  };

  const feedingDemand = params.feedingDemand || {
    targetWeight: 12,
    urgency: 'high',
    feedPorts: [
      { id: 'feed-port-1', name: '1号投料口', demandWeight: 7, status: 'feeding' },
      { id: 'feed-port-2', name: '2号投料口', demandWeight: 5, status: 'standby' },
    ],
  };

  const optimization = await optimizeSchedule({
    ...params,
    currentInventory,
    feedingDemand,
    cranes: params.cranes || demo.cranes,
  });

  const nowText = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const tasks = (optimization.recommendations || []).map((item, index) => ({
    ...item,
    taskNo: `AI-TASK-${nowText}-${String(index + 1).padStart(2, '0')}`,
    dispatchSource: 'ai',
    status: 'pending_confirm',
    canAutoDispatch: item.safetyScore >= 0.86 && item.priority > 1,
    controlMode: item.priority === 1 ? 'manual_confirm' : 'auto_candidate',
  }));

  const instructions = tasks.map(buildDispatchInstruction);
  const urgentTasks = tasks.filter((item) => item.priority === 1 || item.safetyScore < 0.82);
  const totalEnergy = round(tasks.reduce((sum, item) => sum + item.energyConsumption, 0), 2);
  const totalDuration = tasks.reduce((sum, item) => sum + item.estimatedDuration, 0);

  const dispatchPlan = {
    mode: optimization.mode,
    planNo: `AI-DISPATCH-${nowText}`,
    strategy: feedingDemand.urgency === 'high'
      ? '优先保障投料口需求，同时兼顾高甲烷区域翻料'
      : '均衡堆料高度，降低行车空驶和能耗',
    status: 'generated',
    tasks,
    instructions,
    summary: {
      taskCount: tasks.length,
      urgentTaskCount: urgentTasks.length,
      totalWeight: round(tasks.reduce((sum, item) => sum + item.estimatedWeight, 0), 1),
      totalDuration,
      totalEnergy,
      estimatedEfficiency: optimization.estimatedEfficiency,
      optimizationScore: optimization.optimizationScore,
    },
    riskControl: {
      requireHumanConfirm: urgentTasks.length > 0,
      reasons: urgentTasks.length > 0
        ? urgentTasks.map((item) => `${item.taskNo}(${item.taskTypeName})需人工确认`)
        : ['当前调度方案安全评分满足自动下发条件'],
      globalInterlocks: ['急停状态', '行车在线状态', '卸料门状态', '作业区人员检测', '负载上限'],
    },
    timeline: tasks.map((item, index) => ({
      step: index + 1,
      taskNo: item.taskNo,
      craneNo: item.craneNo,
      startAfterSeconds: index * 45,
      estimatedEndAfterSeconds: index * 45 + item.estimatedDuration,
    })),
    generatedAt: new Date().toISOString(),
  };

  const llm = await callChatModel('garbage_crane_ai_dispatch_plan', dispatchPlan, {
    fields: ['strategy', 'tasks', 'instructions', 'riskControl', 'summary'],
  });

  return llm ? { ...dispatchPlan, ...llm, mode: 'hybrid-llm' } : dispatchPlan;
}

async function confirmCraneDispatch(params = {}) {
  const planNo = params.planNo || `AI-DISPATCH-${Date.now()}`;
  const selectedTaskNos = params.selectedTaskNos || [];

  return {
    planNo,
    status: 'confirmed',
    dispatchedTaskNos: selectedTaskNos,
    message: selectedTaskNos.length > 0
      ? `已确认下发 ${selectedTaskNos.length} 条 AI 调度任务`
      : '已确认 AI 调度方案，等待选择任务下发',
    plcWriteMode: 'simulation',
    safetyCheck: {
      emergencyStop: 'normal',
      craneOnline: 'passed',
      antiCollision: 'passed',
      areaPermission: 'passed',
    },
    confirmedAt: new Date().toISOString(),
  };
}

async function getStatus() {
  const provider = getProviderInfo();
  return {
    status: 'available',
    mode: provider.enabled ? 'hybrid-llm' : 'hybrid-local',
    provider: provider.enabled ? provider.provider : 'local-rule-engine',
    model: provider.enabled ? provider.model : 'garbage-crane-rule-engine-v1',
    capabilities: {
      fermentationPrediction: 'available',
      alarmDiagnosis: 'available',
      objectDetection: 'available',
      scheduleOptimization: 'available',
    },
    notes: provider.enabled
      ? '已配置大模型接口，将使用规则引擎加大模型增强。'
      : '未配置有效 AI_API_KEY，当前使用本地规则推理，可直接演示。',
    lastCheckedAt: new Date().toISOString(),
  };
}

module.exports = {
  analyzeFermentation,
  diagnoseAlarm,
  detectObject,
  optimizeSchedule,
  generateCraneDispatch,
  confirmCraneDispatch,
  getStatus,
};
