/**
 * 垃圾储坑智能化管控系统 - AI 路由
 *
 * 该文件定义了所有 AI 服务相关的 API 路由
 * 包括：发酵数据智能分析、行车告警智能诊断、大物体图像识别、调度任务优化建议
 *
 * @module routes/ai.routes
 * @author 华工三峰
 */

'use strict';

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middlewares/error.middleware');
const aiController = require('../controllers/ai.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// =====================================================
// 输入验证规则定义
// =====================================================

/**
 * 发酵数据智能分析验证规则
 */
const fermentationPredictionValidationRules = [
  // 区域 ID 验证
  body('areaId')
    .notEmpty()
    .withMessage('区域ID不能为空')
    .isInt({ min: 1 })
    .withMessage('区域ID必须是正整数'),
  
  // 时间范围验证
  body('timeRange')
    .optional()
    .isIn(['1h', '6h', '12h', '24h', '48h', '72h', '1w'])
    .withMessage('时间范围必须是 1h, 6h, 12h, 24h, 48h, 72h 或 1w'),
];

/**
 * 行车告警智能诊断验证规则
 */
const alarmDiagnosisValidationRules = [
  // 告警 ID 验证
  body('alarmId')
    .notEmpty()
    .withMessage('告警ID不能为空')
    .isInt({ min: 1 })
    .withMessage('告警ID必须是正整数'),
  
  // 告警类型验证
  body('alarmType')
    .notEmpty()
    .withMessage('告警类型不能为空')
    .isIn(['overload', 'position_error', 'grab_slip', 'collision_warning', 'sensor_fault'])
    .withMessage('告警类型必须是 overload, position_error, grab_slip, collision_warning 或 sensor_fault'),
  
  // 行车 ID 验证
  body('craneId')
    .notEmpty()
    .withMessage('行车ID不能为空')
    .isInt({ min: 1 })
    .withMessage('行车ID必须是正整数'),
  
  // 传感器数据验证（可选，但需要是对象）
  body('sensorData')
    .optional()
    .isObject()
    .withMessage('传感器数据必须是对象'),
];

/**
 * 大物体图像识别验证规则
 */
const objectDetectionValidationRules = [
  // 摄像头 ID 验证
  body('cameraId')
    .notEmpty()
    .withMessage('摄像头ID不能为空')
    .isInt({ min: 1 })
    .withMessage('摄像头ID必须是正整数'),
  
  // 图像 URL 验证
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('图像URL格式不正确'),

  body('detections')
    .optional()
    .isArray()
    .withMessage('模拟检测结果必须是数组'),
];

/**
 * 调度任务优化建议验证规则
 */
const scheduleOptimizationValidationRules = [
  // 当前库存验证
  body('currentInventory')
    .notEmpty()
    .withMessage('当前库存数据不能为空')
    .isObject()
    .withMessage('当前库存数据必须是对象'),
  
  // 当前库存总重量验证
  body('currentInventory.totalWeight')
    .notEmpty()
    .withMessage('总重量不能为空')
    .isFloat({ min: 0 })
    .withMessage('总重量必须是非负数'),
  
  // 当前库存区域数据验证（可选）
  body('currentInventory.areas')
    .optional()
    .isArray()
    .withMessage('区域数据必须是数组'),
  
  // 投料需求验证
  body('feedingDemand')
    .notEmpty()
    .withMessage('投料需求数据不能为空')
    .isObject()
    .withMessage('投料需求数据必须是对象'),
  
  // 投料需求目标重量验证
  body('feedingDemand.targetWeight')
    .notEmpty()
    .withMessage('目标重量不能为空')
    .isFloat({ min: 0 })
    .withMessage('目标重量必须是非负数'),
  
  // 紧急程度验证（可选）
  body('feedingDemand.urgency')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('紧急程度必须是 low, medium 或 high'),
];

/**
 * 验证结果检查中间件
 *
 * @description
 * 统一处理 express-validator 验证结果
 * 如果有验证错误，返回 400 错误响应
 *
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - 下一个中间件函数
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // 格式化错误信息
    const formattedErrors = {};
    errors.array().forEach((error) => {
      const field = error.path || error.param || 'unknown';
      if (!formattedErrors[field]) {
        formattedErrors[field] = error.msg;
      }
    });
    
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '请求参数验证失败',
        details: formattedErrors,
      },
      timestamp: new Date().toISOString(),
    });
  }
  
  next();
};

// =====================================================
// 路由定义
// =====================================================

/**
 * GET /api/v1/ai/status
 * 获取 AI 服务状态
 *
 * @route GET /api/v1/ai/status
 * @returns {object} 200 - 返回 AI 服务状态信息
 * @access Private - 需要JWT认证
 */
router.get('/status',
  authMiddleware,
  asyncHandler(aiController.getServiceStatus)
);

/**
 * POST /api/v1/ai/fermentation-prediction
 * 发酵数据智能分析
 *
 * @description
 * 根据区域 ID 和时间范围，使用 AI 模型分析发酵数据
 * 预测发酵趋势，给出操作建议
 *
 * @route POST /api/v1/ai/fermentation-prediction
 * @param {number} areaId.body.required - 区域ID
 * @param {string} [timeRange="24h"].body - 时间范围 (1h, 6h, 12h, 24h, 48h, 72h, 1w)
 * @returns {object} 200 - 分析成功，返回预测结果、建议、最佳时间、置信度
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.post('/fermentation-prediction',
  authMiddleware,
  fermentationPredictionValidationRules,
  validateRequest,
  asyncHandler(aiController.fermentationPrediction)
);

/**
 * POST /api/v1/ai/alarm-diagnosis
 * 行车告警智能诊断
 *
 * @description
 * 根据告警信息和传感器数据，使用 AI 模型诊断告警原因
 * 提供可能原因列表和推荐操作
 *
 * @route POST /api/v1/ai/alarm-diagnosis
 * @param {number} alarmId.body.required - 告警ID
 * @param {string} alarmType.body.required - 告警类型 (overload, position_error, grab_slip, collision_warning, sensor_fault)
 * @param {number} craneId.body.required - 行车ID
 * @param {object} [sensorData].body - 传感器数据
 * @returns {object} 200 - 诊断成功，返回可能原因、推荐操作、优先级、预计修复时间
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.post('/alarm-diagnosis',
  authMiddleware,
  alarmDiagnosisValidationRules,
  validateRequest,
  asyncHandler(aiController.alarmDiagnosis)
);

/**
 * POST /api/v1/ai/object-detection
 * 大物体图像识别
 *
 * @description
 * 使用 AI 模型分析摄像头图像，检测是否存在大物体
 * 如果检测到大物体，自动生成告警
 *
 * @route POST /api/v1/ai/object-detection
 * @param {number} cameraId.body.required - 摄像头ID
 * @param {string} imageUrl.body.required - 图像URL
 * @returns {object} 200 - 识别成功，返回检测结果、是否大物体、告警ID
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.post('/object-detection',
  authMiddleware,
  objectDetectionValidationRules,
  validateRequest,
  asyncHandler(aiController.objectDetection)
);

/**
 * POST /api/v1/ai/schedule-optimization
 * 调度任务优化建议
 *
 * @description
 * 根据当前库存情况和投料需求，使用 AI 模型生成调度任务优化建议
 * 提高行车调度效率，降低能耗
 *
 * @route POST /api/v1/ai/schedule-optimization
 * @param {object} currentInventory.body.required - 当前库存数据
 * @param {number} currentInventory.totalWeight.body.required - 总重量
 * @param {array} [currentInventory.areas].body - 各区域库存详情
 * @param {object} feedingDemand.body.required - 投料需求
 * @param {number} feedingDemand.targetWeight.body.required - 目标重量
 * @param {string} [feedingDemand.urgency].body - 紧急程度 (low, medium, high)
 * @returns {object} 200 - 优化成功，返回推荐任务列表、优化分数、效率预估
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.post('/schedule-optimization',
  authMiddleware,
  scheduleOptimizationValidationRules,
  validateRequest,
  asyncHandler(aiController.scheduleOptimization)
);

/**
 * POST /api/v1/ai/crane-dispatch
 * 垃圾吊 AI 调度方案
 *
 * 根据当前库存、投料需求、行车状态生成可确认下发的调度任务和指令。
 */
router.post('/crane-dispatch',
  authMiddleware,
  asyncHandler(aiController.craneDispatch)
);

/**
 * POST /api/v1/ai/crane-dispatch/confirm
 * 确认 AI 调度方案
 *
 * 演示模式下模拟 PLC 下发前安全校验，并返回确认结果。
 */
router.post('/crane-dispatch/confirm',
  authMiddleware,
  [
    body('planNo').notEmpty().withMessage('调度方案编号不能为空'),
    body('selectedTaskNos').optional().isArray().withMessage('任务编号列表必须是数组'),
  ],
  validateRequest,
  asyncHandler(aiController.confirmCraneDispatch)
);

// =====================================================
// 导出路由
// =====================================================

module.exports = router;
