/**
 * 垃圾储坑智能化管控系统 - 行车路由
 * 
 * 该文件定义了所有行车相关的 API 路由
 * 包括：行车列表查询、状态更新、控制操作、职责配置、告警查询等
 * 
 * @module routes/crane.routes
 * @author 华工三峰
 */

'use strict';

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { asyncHandler } = require('../middlewares/error.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const craneController = require('../controllers/crane.controller');

// =====================================================
// 输入验证规则定义
// =====================================================

/**
 * 行车ID路径参数验证规则
 */
const craneIdValidation = [
  // 行车ID验证 - 必须是正整数
  param('id')
    .notEmpty()
    .withMessage('行车ID不能为空')
    .bail()
    .isInt({ min: 1 })
    .withMessage('行车ID必须是正整数')
    .toInt(),
];

/**
 * 行车状态更新验证规则
 */
const updateStatusValidation = [
  ...craneIdValidation,
  // 状态验证 - 可选，必须是有效枚举值
  body('status')
    .optional()
    .isIn(['online', 'offline', 'running', 'standby', 'fault'])
    .withMessage('状态必须是 online、offline、running、standby 或 fault 之一'),
  // 模式验证 - 可选，必须是有效枚举值
  body('mode')
    .optional()
    .isIn(['auto', 'manual'])
    .withMessage('模式必须是 auto 或 manual 之一'),
];

/**
 * 行车控制验证规则
 */
const controlValidation = [
  ...craneIdValidation,
  // 控制动作验证 - 必填
  body('action')
    .notEmpty()
    .withMessage('控制动作不能为空')
    .bail()
    .isIn(['start', 'stop', 'emergency_stop'])
    .withMessage('动作必须是 start、stop 或 emergency_stop 之一'),
  // 方向验证 - 可选
  body('direction')
    .optional()
    .isIn(['forward', 'backward', 'left', 'right', 'up', 'down'])
    .withMessage('方向必须是 forward、backward、left、right、up 或 down 之一'),
  // 速度验证 - 可选，必须在合理范围内
  body('speed')
    .optional()
    .isFloat({ min: 0.1, max: 10.0 })
    .withMessage('速度必须在 0.1 到 10.0 米/秒之间')
    .toFloat(),
];

/**
 * 行车职责配置验证规则
 */
const dutyValidation = [
  ...craneIdValidation,
  // 职责验证 - 必填
  body('duty')
    .notEmpty()
    .withMessage('职责不能为空')
    .bail()
    .isIn(['feeding', 'stacking', 'turning', 'moving'])
    .withMessage('职责必须是 feeding（投料）、stacking（堆料）、turning（翻料）或 moving（移料）之一'),
];

/**
 * 告警查询验证规则
 */
const alarmQueryValidation = [
  ...craneIdValidation,
  // 告警状态验证 - 可选
  query('status')
    .optional()
    .isIn(['active', 'acknowledged', 'resolved'])
    .withMessage('告警状态必须是 active、acknowledged 或 resolved 之一'),
  // 页码验证 - 可选
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于 0 的整数')
    .toInt(),
  // 每页数量验证 - 可选
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是 1-100 之间的整数')
    .toInt(),
];

// =====================================================
// 验证结果处理中间件
// =====================================================

/**
 * 验证结果处理中间件
 * 检查验证结果，如果有错误则返回 400 错误响应
 * 
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // 格式化错误信息
    const formattedErrors = {};
    errors.array().forEach((error) => {
      // 每个字段只保留第一个错误信息
      if (!formattedErrors[error.path]) {
        formattedErrors[error.path] = error.msg;
      }
    });

    // 返回错误响应
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
 * GET /api/v1/cranes
 * 获取行车列表
 * 
 * @route GET /api/v1/cranes
 * @returns {object} 200 - 返回行车列表
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.get('/',
  authMiddleware,
  asyncHandler(craneController.getCraneList)
);

/**
 * GET /api/v1/cranes/:id
 * 获取单个行车信息
 * 
 * @route GET /api/v1/cranes/:id
 * @param {number} id.path.required - 行车ID
 * @returns {object} 200 - 返回行车详细信息
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 行车不存在
 * @access Private - 需要JWT认证
 */
router.get('/:id',
  authMiddleware,
  craneIdValidation,
  validate,
  asyncHandler(craneController.getCraneById)
);

/**
 * PUT /api/v1/cranes/:id/status
 * 更新行车状态
 * 
 * @route PUT /api/v1/cranes/:id/status
 * @param {number} id.path.required - 行车ID
 * @param {string} [status.body] - 状态（online/offline/running/standby/fault）
 * @param {string} [mode.body] - 模式（auto/manual）
 * @returns {object} 200 - 更新成功，返回更新后的行车信息
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 行车不存在
 * @returns {Error} 422 - 业务逻辑错误
 * @access Private - 需要JWT认证
 */
router.put('/:id/status',
  authMiddleware,
  updateStatusValidation,
  validate,
  asyncHandler(craneController.updateCraneStatus)
);

/**
 * POST /api/v1/cranes/:id/control
 * 行车控制
 * 
 * @route POST /api/v1/cranes/:id/control
 * @param {number} id.path.required - 行车ID
 * @param {string} action.body.required - 控制动作（start/stop/emergency_stop）
 * @param {string} [direction.body] - 移动方向（forward/backward/left/right/up/down）
 * @param {number} [speed.body] - 速度（0.1-10.0 米/秒）
 * @returns {object} 200 - 控制成功
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 行车不存在
 * @returns {Error} 422 - 业务逻辑错误
 * @access Private - 需要JWT认证
 */
router.post('/:id/control',
  authMiddleware,
  controlValidation,
  validate,
  asyncHandler(craneController.controlCrane)
);

/**
 * PUT /api/v1/cranes/:id/duty
 * 配置行车职责
 * 
 * @route PUT /api/v1/cranes/:id/duty
 * @param {number} id.path.required - 行车ID
 * @param {string} duty.body.required - 职责（feeding/stacking/turning/moving）
 * @returns {object} 200 - 配置成功
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 行车不存在
 * @returns {Error} 422 - 业务逻辑错误
 * @access Private - 需要JWT认证
 */
router.put('/:id/duty',
  authMiddleware,
  dutyValidation,
  validate,
  asyncHandler(craneController.configureCraneDuty)
);

/**
 * GET /api/v1/cranes/:id/alarms
 * 获取行车告警列表
 * 
 * @route GET /api/v1/cranes/:id/alarms
 * @param {number} id.path.required - 行车ID
 * @param {string} [status.query] - 告警状态筛选（active/acknowledged/resolved）
 * @param {number} [page.query] - 页码（默认1）
 * @param {number} [limit.query] - 每页数量（默认10，最大100）
 * @returns {object} 200 - 返回告警列表和分页信息
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 行车不存在
 * @access Private - 需要JWT认证
 */
router.get('/:id/alarms',
  authMiddleware,
  alarmQueryValidation,
  validate,
  asyncHandler(craneController.getCraneAlarms)
);

// =====================================================
// 导出路由
// =====================================================

module.exports = router;
