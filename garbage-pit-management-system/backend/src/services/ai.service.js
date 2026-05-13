/**
 * 垃圾储坑智能化管控系统 - AI服务
 * 
 * 该文件实现了AI相关的业务逻辑，包括发酵预测、告警诊断、图像识别、调度优化等。
 * 服务层负责处理AI业务逻辑，为控制器提供数据服务。
 * 
 * 主要功能：
 * 1. 获取AI服务状态
 * 2. 发酵数据智能分析
 * 3. 行车告警智能诊断
 * 4. 大物体图像识别
 * 5. 调度任务优化建议
 * 
 * 注意：当前为占位实现，返回模拟数据，后续可对接真实AI服务
 * 
 * @module services/ai.service
 * @author 华工三峰
 */

'use strict';

// 引入依赖
const logger = require('../utils/logger');
const { 
  ValidationError, 
  NotFoundError, 
  BusinessError,
} = require('../middlewares/error.middleware');

/**
 * AI服务状态枚举
 */
const AIServiceStatus = {
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable',
  BUSY: 'busy',
};

/**
 * AI服务类
 * 
 * @class AIService
 */
class AIService {
  /**
   * 构造函数
   * 
   * @constructor
   */
  constructor() {
    // 当前AI服务状态（占位实现）
    this.aiServiceStatus = AIServiceStatus.AVAILABLE;
    
    // AI模型状态（占位实现）
    this.modelStatus = {
      fermentationPrediction: 'available',
      alarmDiagnosis: 'available',
      objectDetection: 'available',
      scheduleOptimization: 'available',
    };
  }

  /**
   * 获取AI服务状态
   * 
   * @description
   * 检查AI服务的可用性状态，包括各AI模型的状态
   * 
   * @returns {Promise<Object>} AI服务状态信息
   * @throws {Error} 服务状态检查错误
   * 
   * @example
   * const status = await aiService.getAIStatus();
   * // 返回: { status: 'available', models: {...}, lastCheckedAt: '...' }
   */
  async getAIStatus() {
    try {
      logger.info('AI服务 - 获取AI服务状态');

      // TODO: 对接真实的AI服务健康检查
      // 当前返回占位数据
      const statusInfo = {
        status: this.aiServiceStatus,
        models: this.modelStatus,
        lastCheckedAt: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      };

      logger.info('AI服务 - 获取AI服务状态成功', { 
        status: statusInfo.status,
        modelCount: Object.keys(statusInfo.models).length,
      });

      return statusInfo;
    } catch (error) {
      logger.error('AI服务 - 获取AI服务状态失败', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 发酵数据智能分析
   * 
   * @description
   * 根据区域ID和时间范围，使用AI模型分析发酵数据
   * 预测发酵趋势，给出操作建议
   * 
   * @param {Object} params - 分析参数
   * @param {number} params.areaId - 区域ID（必填）
   * @param {string} params.timeRange - 时间范围，默认'24h'（可选）
   * @param {Object} params.additionalData - 附加数据（可选）
   * @returns {Promise<Object>} 分析结果
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} AI分析错误
   * 
   * @example
   * const result = await aiService.analyzeFermentation({
   *   areaId: 1,
   *   timeRange: '24h',
   *   additionalData: { temperature: 45.5, humidity: 65.2 }
   * });
   */
  async analyzeFermentation(params) {
    try {
      const { areaId, timeRange = '24h', additionalData } = params;

      logger.info('AI服务 - 发酵数据智能分析', { 
        areaId, 
        timeRange,
        service: 'fermentationPrediction',
      });

      // 参数验证
      if (!areaId) {
        throw new ValidationError('区域ID不能为空');
      }

      if (typeof areaId !== 'number' || areaId <= 0) {
        throw new ValidationError('区域ID必须是正整数');
      }

      // 验证时间范围格式
      const timeRangeRegex = /^\d+[hdwm]$/;
      if (!timeRangeRegex.test(timeRange)) {
        throw new ValidationError('时间范围格式无效，应为数字+单位（h/d/w/m），如：24h、7d');
      }

      // TODO: 对接真实的AI服务进行发酵数据分析
      // 当前返回占位数据
      const analysisResult = {
        prediction: {
          temperature: 45.5,
          humidity: 65.2,
          methaneConcentration: 12.8,
          trend: '上升',
          estimatedCompletionTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          next24h: {
            temperature: [45.5, 46.2, 47.1, 46.8, 45.9, 45.2],
            humidity: [65.2, 64.8, 65.5, 66.2, 65.8, 65.1],
            methane: [12.8, 13.2, 13.8, 14.1, 13.9, 13.5],
          },
        },
        recommendation: '建议在明天下午2点进行翻堆操作，当前发酵状态良好',
        optimalTime: new Date(Date.now() + 38 * 60 * 60 * 1000).toISOString(),
        confidence: 0.85,
        riskLevel: 'low', // low, medium, high
        analyzedAt: new Date().toISOString(),
        modelUsed: 'fermentation_prediction_v1',
        processingTime: 1250, // 毫秒
      };

      // 记录AI分析记录
      logger.info('AI服务 - 发酵数据分析完成', {
        areaId,
        confidence: analysisResult.confidence,
        riskLevel: analysisResult.riskLevel,
        processingTime: analysisResult.processingTime,
      });

      return analysisResult;
    } catch (error) {
      logger.error('AI服务 - 发酵数据分析失败', { 
        areaId: params.areaId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 行车告警智能诊断
   * 
   * @description
   * 根据告警信息和传感器数据，使用AI模型诊断告警原因
   * 提供可能原因列表和推荐操作
   * 
   * @param {Object} params - 诊断参数
   * @param {number} params.alarmId - 告警ID（必填）
   * @param {string} params.alarmType - 告警类型（必填）
   * @param {number} params.craneId - 行车ID（必填）
   * @param {Object} params.sensorData - 传感器数据（可选）
   * @param {Object} params.contextData - 上下文数据（可选）
   * @returns {Promise<Object>} 诊断结果
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} AI诊断错误
   * 
   * @example
   * const result = await aiService.diagnoseAlarm({
   *   alarmId: 1,
   *   alarmType: 'grab_slip',
   *   craneId: 1,
   *   sensorData: { position: { x: 10.5, y: 5.2 }, loadWeight: 3.5 },
   *   contextData: { recentAlarms: [...], maintenanceHistory: [...] }
   * });
   */
  async diagnoseAlarm(params) {
    try {
      const { alarmId, alarmType, craneId, sensorData = {}, contextData = {} } = params;

      logger.info('AI服务 - 行车告警智能诊断', { 
        alarmId, 
        alarmType, 
        craneId,
        service: 'alarmDiagnosis',
      });

      // 参数验证
      if (!alarmId) {
        throw new ValidationError('告警ID不能为空');
      }

      if (!alarmType) {
        throw new ValidationError('告警类型不能为空');
      }

      if (!craneId) {
        throw new ValidationError('行车ID不能为空');
      }

      // 验证告警类型
      const validAlarmTypes = ['overload', 'position_error', 'grab_slip', 'collision_warning', 'sensor_fault'];
      if (!validAlarmTypes.includes(alarmType)) {
        throw new ValidationError(`告警类型无效，必须是: ${validAlarmTypes.join(', ')}`);
      }

      // 告警类型映射到中文
      const alarmTypeMap = {
        overload: '超载告警',
        position_error: '位置偏差告警',
        grab_slip: '遛钩告警',
        collision_warning: '碰撞预警',
        sensor_fault: '传感器故障',
      };

      const alarmName = alarmTypeMap[alarmType] || alarmType;

      // TODO: 对接真实的AI服务进行告警诊断
      // 当前返回占位数据
      const diagnosisResult = {
        alarmId,
        alarmType,
        alarmName,
        craneId,
        possibleCauses: [
          '钢索磨损导致抓斗下降',
          '编码器故障导致位置计算错误',
          '液压系统泄漏',
          '负载超过额定值',
          '控制系统软件故障',
          '电源电压不稳定',
        ],
        recommendedActions: [
          '立即停止行车运行',
          '检查钢索磨损情况',
          '校验编码器读数',
          '检查液压系统密封性',
          '确认负载是否在合理范围内',
          '检查控制系统日志',
          '测量电源电压',
        ],
        priority: 'high', // critical, high, medium, low
        estimatedRepairTime: '2小时',
        requiresImmediateAttention: true,
        safetyChecklist: [
          '确认周围区域无人员',
          '检查行车是否有异常振动',
          '确认紧急停止按钮可用',
          '检查安全防护装置',
          '确认操作人员已撤离',
        ],
        confidence: 0.78,
        modelUsed: 'alarm_diagnosis_v1',
        processingTime: 850, // 毫秒
        diagnosedAt: new Date().toISOString(),
      };

      // 根据告警类型调整优先级
      if (alarmType === 'overload' || alarmType === 'grab_slip') {
        diagnosisResult.priority = 'critical';
        diagnosisResult.requiresImmediateAttention = true;
        diagnosisResult.estimatedRepairTime = '立即处理';
      } else if (alarmType === 'position_error') {
        diagnosisResult.priority = 'high';
        diagnosisResult.requiresImmediateAttention = true;
      } else if (alarmType === 'collision_warning') {
        diagnosisResult.priority = 'high';
        diagnosisResult.requiresImmediateAttention = true;
      } else {
        diagnosisResult.priority = 'medium';
        diagnosisResult.requiresImmediateAttention = false;
      }

      // 如果有传感器数据，可以进一步分析
      if (sensorData && Object.keys(sensorData).length > 0) {
        diagnosisResult.sensorAnalysis = {
          hasSensorData: true,
          dataPoints: Object.keys(sensorData).length,
          analysis: '传感器数据已接收，正在分析中...',
        };
      }

      logger.info('AI服务 - 行车告警诊断完成', {
        alarmId,
        alarmType,
        priority: diagnosisResult.priority,
        requiresImmediateAttention: diagnosisResult.requiresImmediateAttention,
        confidence: diagnosisResult.confidence,
      });

      return diagnosisResult;
    } catch (error) {
      logger.error('AI服务 - 行车告警诊断失败', { 
        alarmId: params.alarmId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 大物体图像识别
   * 
   * @description
   * 使用AI模型分析摄像头图像，检测是否存在大物体
   * 如果检测到大物体，自动生成告警
   * 
   * @param {Object} params - 识别参数
   * @param {number} params.cameraId - 摄像头ID（必填）
   * @param {string} params.imageUrl - 图像URL（必填）
   * @param {Object} params.options - 识别选项（可选）
   * @param {number} params.options.confidenceThreshold - 置信度阈值，默认0.8
   * @param {boolean} params.options.detectMultiple - 是否检测多个物体，默认true
   * @returns {Promise<Object>} 识别结果
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 图像识别错误
   * 
   * @example
   * const result = await aiService.detectObject({
   *   cameraId: 1,
   *   imageUrl: 'http://example.com/image.jpg',
   *   options: { confidenceThreshold: 0.8, detectMultiple: true }
   * });
   */
  async detectObject(params) {
    try {
      const { cameraId, imageUrl, options = {} } = params;
      const { confidenceThreshold = 0.8, detectMultiple = true } = options;

      logger.info('AI服务 - 大物体图像识别', { 
        cameraId, 
        imageUrl,
        confidenceThreshold,
        service: 'objectDetection',
      });

      // 参数验证
      if (!cameraId) {
        throw new ValidationError('摄像头ID不能为空');
      }

      if (!imageUrl) {
        throw new ValidationError('图像URL不能为空');
      }

      // 验证URL格式
      const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
      if (!urlRegex.test(imageUrl)) {
        throw new ValidationError('图像URL格式无效');
      }

      // 验证置信度阈值
      if (confidenceThreshold < 0 || confidenceThreshold > 1) {
        throw new ValidationError('置信度阈值必须在0到1之间');
      }

      // TODO: 对接真实的AI服务进行图像识别
      // 当前返回占位数据
      const detectionResult = {
        detected: true,
        objects: [
          {
            type: 'furniture',
            label: '家具',
            confidence: 0.92,
            boundingBox: {
              x: 100,
              y: 150,
              width: 200,
              height: 180,
            },
            isLarge: true,
            estimatedSize: {
              width: 1.5, // 米
              height: 1.2,
              depth: 0.8,
            },
            material: 'wood',
            color: 'brown',
            orientation: 'horizontal',
          },
          {
            type: 'metal_piece',
            label: '金属块',
            confidence: 0.85,
            boundingBox: {
              x: 350,
              y: 200,
              width: 80,
              height: 60,
            },
            isLarge: false,
            estimatedSize: {
              width: 0.3,
              height: 0.2,
              depth: 0.1,
            },
            material: 'metal',
            color: 'silver',
          },
          {
            type: 'plastic_container',
            label: '塑料容器',
            confidence: 0.78,
            boundingBox: {
              x: 500,
              y: 300,
              width: 120,
              height: 90,
            },
            isLarge: false,
            estimatedSize: {
              width: 0.5,
              height: 0.4,
              depth: 0.3,
            },
            material: 'plastic',
            color: 'blue',
          },
        ],
        isLargeObject: true,
        alarmGenerated: true,
        alarmId: Math.floor(Math.random() * 1000) + 1, // 占位，后续返回真实告警ID
        analysisTime: 1250, // 毫秒
        detectedAt: new Date().toISOString(),
        recommendations: [
          '检测到大物体，建议暂停该区域卸料',
          '通知操作人员手动处理大物体',
          '检查周边摄像头以获取更多信息',
          '记录大物体类型和位置',
          '评估是否需要特殊处理设备',
        ],
        modelUsed: 'object_detection_v1',
        confidenceThreshold,
        imageResolution: '1920x1080',
        processingTime: 1250, // 毫秒
      };

      // 过滤掉置信度低于阈值的物体
      detectionResult.objects = detectionResult.objects.filter(
        obj => obj.confidence >= confidenceThreshold
      );

      // 更新是否检测到大物体
      detectionResult.isLargeObject = detectionResult.objects.some(obj => obj.isLarge);

      // 如果没有检测到��体
      if (detectionResult.objects.length === 0) {
        detectionResult.detected = false;
        detectionResult.isLargeObject = false;
        detectionResult.alarmGenerated = false;
        detectionResult.recommendations = ['图像分析完成，未检测到物体'];
      }

      // 记录检测结果
      logger.info('AI服务 - 大物体图像识别完成', {
        cameraId,
        objectCount: detectionResult.objects.length,
        isLargeObject: detectionResult.isLargeObject,
        alarmGenerated: detectionResult.alarmGenerated,
        processingTime: detectionResult.processingTime,
      });

      return detectionResult;
    } catch (error) {
      logger.error('AI服务 - 大物体图像识别失败', { 
        cameraId: params.cameraId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 调度任务优化建议
   * 
   * @description
   * 根据当前库存情况和投料需求，使用AI模型生成调度任务优化建议
   * 提高行车调度效率，降低能耗
   * 
   * @param {Object} params - 优化参数
   * @param {Object} params.currentInventory - 当前库存情况（必填）
   * @param {Object} params.feedingDemand - 投料需求（必填）
   * @param {Object} params.constraints - 约束条件（可选）
   * @param {Object} params.options - 优化选项（可选）
   * @returns {Promise<Object>} 优化建议
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 调度优化错误
   * 
   * @example
   * const result = await aiService.optimizeSchedule({
   *   currentInventory: {
   *     totalWeight: 150.5,
   *     areas: [{ id: 1, height: 6.5 }, { id: 2, height: 4.2 }]
   *   },
   *   feedingDemand: {
   *     targetWeight: 10.0,
   *     urgency: 'high'
   *   },
   *   constraints: {
   *     craneAvailability: { crane01: 'available', crane02: 'maintenance' },
   *     maxTasksPerCrane: 3
   *   }
   * });
   */
  async optimizeSchedule(params) {
    try {
      const { currentInventory, feedingDemand, constraints = {}, options = {} } = params;

      logger.info('AI服务 - 调度任务优化建议', { 
        totalWeight: currentInventory?.totalWeight,
        targetWeight: feedingDemand?.targetWeight,
        urgency: feedingDemand?.urgency,
        service: 'scheduleOptimization',
      });

      // 参数验证
      if (!currentInventory) {
        throw new ValidationError('当前库存情况不能为空');
      }

      if (!feedingDemand) {
        throw new ValidationError('投料需求不能为空');
      }

      // 验证库存数据
      if (typeof currentInventory.totalWeight !== 'number' || currentInventory.totalWeight < 0) {
        throw new ValidationError('库存总重量必须是正数');
      }

      if (!Array.isArray(currentInventory.areas)) {
        throw new ValidationError('库存区域数据必须是数组');
      }

      // 验证投料需求
      if (typeof feedingDemand.targetWeight !== 'number' || feedingDemand.targetWeight < 0) {
        throw new ValidationError('目标投料重量必须是正数');
      }

      if (feedingDemand.urgency && !['low', 'medium', 'high', 'critical'].includes(feedingDemand.urgency)) {
        throw new ValidationError('紧急程度必须是: low, medium, high, critical');
      }

      // TODO: 对接真实的AI服务进行调度优化
      // 当前返回占位数据
      const optimizationResult = {
        recommendations: [
          {
            craneId: 1,
            taskType: 'feeding',
            taskTypeName: '投料',
            sourceAreaId: 2,
            sourceAreaName: '堆料区2',
            targetAreaId: 1,
            targetAreaName: '投料区',
            estimatedWeight: 5.0,
            priority: 1,
            reason: '区域2堆料高度适中，适合投料',
            estimatedDuration: 300, // 秒
            energyConsumption: 2.5, // kWh
            distance: 45.2, // 米
            efficiencyScore: 0.92,
            safetyScore: 0.95,
          },
          {
            craneId: 2,
            taskType: 'stacking',
            taskTypeName: '堆料',
            sourceAreaId: 3,
            sourceAreaName: '卸料区',
            targetAreaId: 2,
            targetAreaName: '堆料区2',
            estimatedWeight: 3.0,
            priority: 2,
            reason: '平衡各区域堆料高度',
            estimatedDuration: 240,
            energyConsumption: 1.8,
            distance: 32.5,
            efficiencyScore: 0.88,
            safetyScore: 0.93,
          },
          {
            craneId: 1,
            taskType: 'turning',
            taskTypeName: '翻料',
            sourceAreaId: 1,
            sourceAreaName: '堆料区1',
            targetAreaId: 1,
            targetAreaName: '堆料区1',
            estimatedWeight: 8.0,
            priority: 3,
            reason: '发酵数据分析显示需要翻堆',
            estimatedDuration: 450,
            energyConsumption: 3.2,
            distance: 0,
            efficiencyScore: 0.85,
            safetyScore: 0.90,
          },
          {
            craneId: 3,
            taskType: 'moving',
            taskTypeName: '移料',
            sourceAreaId: 4,
            sourceAreaName: '临时堆放区',
            targetAreaId: 3,
            targetAreaName: '卸料区',
            estimatedWeight: 4.5,
            priority: 4,
            reason: '清理临时堆放区，为卸料做准备',
            estimatedDuration: 320,
            energyConsumption: 2.1,
            distance: 58.7,
            efficiencyScore: 0.80,
            safetyScore: 0.88,
          },
        ],
        optimizationScore: 0.88,
        estimatedEfficiency: '提升15%',
        estimatedTimeSaved: 45, // 分钟
        estimatedEnergySaved: 5.5, // kWh
        constraints: {
          craneAvailability: {
            crane01: 'available',
            crane02: 'available',
            crane03: 'maintenance',
          },
          areaCapacity: {
            area01: { current: 6.5, max: 8.0, percentage: 81.25 },
            area02: { current: 4.2, max: 8.0, percentage: 52.5 },
            area03: { current: 3.8, max: 8.0, percentage: 47.5 },
            area04: { current: 2.1, max: 5.0, percentage: 42.0 },
          },
          timeWindows: {
            peakHours: ['08:00-12:00', '14:00-18:00'],
            maintenanceWindow: '22:00-06:00',
          },
        },
        analysisTime: 850, // 毫秒
        analyzedAt: new Date().toISOString(),
        modelUsed: 'schedule_optimization_v1',
        algorithm: 'genetic_algorithm',
        iterations: 1000,
        processingTime: 850, // 毫秒
      };

      // 根据紧急程度调整优先级
      if (feedingDemand.urgency === 'high' || feedingDemand.urgency === 'critical') {
        optimizationResult.recommendations.forEach((rec, index) => {
          if (rec.taskType === 'feeding') {
            rec.priority = 1;
            rec.reason += ' (紧急投料需求)';
          }
        });
        
        // 重新排序
        optimizationResult.recommendations.sort((a, b) => a.priority - b.priority);
      }

      // 应用约束条件
      if (constraints.craneAvailability) {
        optimizationResult.recommendations = optimizationResult.recommendations.filter(rec => {
          const craneKey = `crane0${rec.craneId}`;
          return constraints.craneAvailability[craneKey] === 'available';
        });
      }

      // 计算总体统计
      const totalWeight = optimizationResult.recommendations.reduce((sum, rec) => sum + rec.estimatedWeight, 0);
      const totalDuration = optimizationResult.recommendations.reduce((sum, rec) => sum + rec.estimatedDuration, 0);
      const totalEnergy = optimizationResult.recommendations.reduce((sum, rec) => sum + rec.energyConsumption, 0);

      optimizationResult.summary = {
        totalTasks: optimizationResult.recommendations.length,
        totalWeight,
        totalDuration,
        totalEnergy,
        averageEfficiency: optimizationResult.recommendations.reduce((sum, rec) => sum + rec.efficiencyScore, 0) / optimizationResult.recommendations.length,
        averageSafety: optimizationResult.recommendations.reduce((sum, rec) => sum + rec.safetyScore, 0) / optimizationResult.recommendations.length,
      };

      // 记录优化结果
      logger.info('AI服务 - 调度任务优化建议生成完成', {
        recommendationCount: optimizationResult.recommendations.length,
        optimizationScore: optimizationResult.optimizationScore,
        estimatedEfficiency: optimizationResult.estimatedEfficiency,
        totalWeight: optimizationResult.summary.totalWeight,
        processingTime: optimizationResult.processingTime,
      });

      return optimizationResult;
    } catch (error) {
      logger.error('AI服务 - 调度任务优化建议失败', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 更新AI服务状态
   * 
   * @description
   * 更新AI服务状态，可用于手动控制服务状态
   * 
   * @param {string} status - 新状态
   * @returns {Promise<Object>} 更新后的状态信息
   * @throws {ValidationError} 状态值无效
   * 
   * @example
   * const status = await aiService.updateServiceStatus('busy');
   */
  async updateServiceStatus(status) {
    try {
      logger.info('AI服务 - 更新AI服务状态', { newStatus: status });

      // 验证状态值
      const validStatuses = Object.values(AIServiceStatus);
      if (!validStatuses.includes(status)) {
        throw new ValidationError(`状态值无效，必须是: ${validStatuses.join(', ')}`);
      }

      // 更新状态
      const oldStatus = this.aiServiceStatus;
      this.aiServiceStatus = status;

      logger.info('AI服务 - 更新AI服务状态成功', { 
        oldStatus, 
        newStatus: status 
      });

      return {
        oldStatus,
        newStatus: this.aiServiceStatus,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('AI服务 - 更新AI服务状态失败', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 更新AI模型状态
   * 
   * @description
   * 更新指定AI模型的状态
   * 
   * @param {string} modelName - 模型名称
   * @param {string} status - 新状态
   * @returns {Promise<Object>} 更新后的模型状态
   * @throws {ValidationError} 参数验证失败
   * 
   * @example
   * const result = await aiService.updateModelStatus('fermentationPrediction', 'unavailable');
   */
  async updateModelStatus(modelName, status) {
    try {
      logger.info('AI服务 - 更新AI模型状态', { modelName, newStatus: status });

      // 验证模型名称
      const validModels = Object.keys(this.modelStatus);
      if (!validModels.includes(modelName)) {
        throw new ValidationError(`模型名称无效，必须是: ${validModels.join(', ')}`);
      }

      // 验证状态值
      const validStatuses = ['available', 'unavailable', 'busy', 'maintenance'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError(`状态值无效，必须是: ${validStatuses.join(', ')}`);
      }

      // 更新模型状态
      const oldStatus = this.modelStatus[modelName];
      this.modelStatus[modelName] = status;

      logger.info('AI服务 - 更新AI模型状态成功', { 
        modelName, 
        oldStatus, 
        newStatus: status 
      });

      return {
        modelName,
        oldStatus,
        newStatus: status,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('AI服务 - 更新AI模型状态失败', { 
        modelName, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 获取所有AI模型状态
   * 
   * @description
   * 获取所有AI模型的当前状态
   * 
   * @returns {Promise<Object>} 所有模型状态
   * 
   * @example
   * const modelStatus = await aiService.getAllModelStatus();
   */
  async getAllModelStatus() {
    try {
      logger.info('AI服务 - 获取所有AI模型状态');

      const modelStatus = {
        ...this.modelStatus,
        lastUpdatedAt: new Date().toISOString(),
        totalModels: Object.keys(this.modelStatus).length,
        availableModels: Object.values(this.modelStatus).filter(status => status === 'available').length,
        unavailableModels: Object.values(this.modelStatus).filter(status => status === 'unavailable').length,
        busyModels: Object.values(this.modelStatus).filter(status => status === 'busy').length,
      };

      logger.info('AI服务 - 获取所有AI模型状态成功', { 
        totalModels: modelStatus.totalModels,
        availableModels: modelStatus.availableModels,
      });

      return modelStatus;
    } catch (error) {
      logger.error('AI服务 - 获取所有AI模型状态失败', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 验证AI服务参数
   * 
   * @description
   * 验证AI服务调用参数，确保参数格式正确
   * 
   * @param {Object} params - 参数对象
   * @param {string} serviceType - 服务类型
   * @returns {Promise<boolean>} 验证结果
   * @throws {ValidationError} 参数验证失败
   * 
   * @example
   * const isValid = await aiService.validateParams(params, 'fermentationPrediction');
   */
  async validateParams(params, serviceType) {
    try {
      logger.info('AI服务 - 验证参数', { serviceType });

      // 根据服务类型进行不同的验证
      switch (serviceType) {
        case 'fermentationPrediction':
          if (!params.areaId) {
            throw new ValidationError('发酵分析需要区域ID');
          }
          break;

        case 'alarmDiagnosis':
          if (!params.alarmId || !params.alarmType || !params.craneId) {
            throw new ValidationError('告警诊断需要告警ID、告警类型和行车ID');
          }
          break;

        case 'objectDetection':
          if (!params.cameraId || !params.imageUrl) {
            throw new ValidationError('图像识别需要摄像头ID和图像URL');
          }
          break;

        case 'scheduleOptimization':
          if (!params.currentInventory || !params.feedingDemand) {
            throw new ValidationError('调度优化需要当前库存和投料需求');
          }
          break;

        default:
          throw new ValidationError(`未知的服务类型: ${serviceType}`);
      }

      logger.info('AI服务 - 参数验证成功', { serviceType });
      return true;
    } catch (error) {
      logger.error('AI服务 - 参数验证失败', { 
        serviceType, 
        error: error.message 
      });
      throw error;
    }
  }
}

// =====================================================
// 创建服务实例并导出
// =====================================================

const aiService = new AIService();

module.exports = aiService;
