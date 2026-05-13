'use strict';

const logger = require('../utils/logger');
const aiEngine = require('../services/ai.engine');

function success(res, data, message) {
  res.json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  });
}

async function fermentationPrediction(req, res) {
  const result = await aiEngine.analyzeFermentation({
    ...req.body,
    userId: req.user?.id,
  });

  logger.info('AI 发酵分析完成', {
    userId: req.user?.id,
    areaId: req.body.areaId,
    mode: result.mode,
    riskLevel: result.riskLevel,
  });

  success(res, result, 'AI 发酵数据智能分析完成');
}

async function alarmDiagnosis(req, res) {
  const result = await aiEngine.diagnoseAlarm({
    ...req.body,
    userId: req.user?.id,
  });

  logger.info('AI 行车告警诊断完成', {
    userId: req.user?.id,
    alarmId: req.body.alarmId,
    mode: result.mode,
    priority: result.priority,
  });

  success(res, result, 'AI 行车告警智能诊断完成');
}

async function objectDetection(req, res) {
  const result = await aiEngine.detectObject({
    ...req.body,
    userId: req.user?.id,
  });

  logger.info('AI 大物体识别完成', {
    userId: req.user?.id,
    cameraId: req.body.cameraId,
    mode: result.mode,
    isLargeObject: result.isLargeObject,
  });

  success(res, result, result.isLargeObject ? '检测到大物体，已生成处置建议' : '图像分析完成，未发现大物体');
}

async function scheduleOptimization(req, res) {
  const result = await aiEngine.optimizeSchedule({
    ...req.body,
    userId: req.user?.id,
  });

  logger.info('AI 调度优化完成', {
    userId: req.user?.id,
    mode: result.mode,
    tasks: result.recommendations?.length || 0,
  });

  success(res, result, 'AI 调度任务优化建议生成完成');
}

async function craneDispatch(req, res) {
  const result = await aiEngine.generateCraneDispatch({
    ...req.body,
    userId: req.user?.id,
  });

  logger.info('AI 垃圾吊调度方案生成完成', {
    userId: req.user?.id,
    planNo: result.planNo,
    tasks: result.tasks?.length || 0,
  });

  success(res, result, 'AI 垃圾吊调度方案生成完成');
}

async function confirmCraneDispatch(req, res) {
  const result = await aiEngine.confirmCraneDispatch({
    ...req.body,
    userId: req.user?.id,
  });

  logger.info('AI 垃圾吊调度方案确认完成', {
    userId: req.user?.id,
    planNo: result.planNo,
    dispatchedTaskNos: result.dispatchedTaskNos,
  });

  success(res, result, 'AI 垃圾吊调度方案确认完成');
}

async function getServiceStatus(req, res) {
  const result = await aiEngine.getStatus();
  success(res, result, 'AI 服务状态正常');
}

module.exports = {
  fermentationPrediction,
  alarmDiagnosis,
  objectDetection,
  scheduleOptimization,
  craneDispatch,
  confirmCraneDispatch,
  getServiceStatus,
};
