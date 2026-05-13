/**
 * 垃圾储坑智能化管控系统 - 告警路由
 * 
 * 该文件定义了所有告警相关的 API 路由
 * 包括：行车告警查询和确认、大物告警查询、设备告警查询等
 * 
 * @module routes/alarm.routes
 * @author 华工三峰
 */

'use strict';

const express = require('express');
const router = express.Router();
const { param, query, validationResult } = require('express-validator');
const { asyncHandler } = require('../middlewares/error.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const alarmController = require('../controllers/alarm.controller');

// =====================================================
// 输入验证规则定义
// =====================================================

/**
 * 告警ID路径参数验证规则
 */
const alarmIdValidation = [
  // 告警ID验证 - 必须是正整数
  param('id')
    .notEmpty()
    .withMessage('告警ID不能为空')
    .bail()
    .isInt({ min: 1 })
    .withMessage('告警ID必须是正整数')
    .toInt(),
];

/**
 * 行车告警查询验证规则
 */
const craneAlarmQueryValidation = [
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

/**
 * 大物告警查询验证规则
 */
const largeObjectAlarmQueryValidation = [
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

/**
 * 设备告警查询验证规则
 */
const deviceAlarmQueryValidation = [
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
 * GET /api/v1/alarms/cranes
 * 获取行车告警列表
 * 
 * @route GET /api/v1/alarms/cranes
 * @param {string} [status.query] - 告警状态筛选（active/acknowledged/resolved）
 * @param {number} [page.query] - 页码（默认1）
 * @param {number} [limit.query] - 每页数量（默认10，最大100）
 * @returns {object} 200 - 返回行车告警列表和分页信息
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.get('/cranes',
  authMiddleware,
  craneAlarmQueryValidation,
  validate,
  asyncHandler(alarmController.getCraneAlarms)
);

/**
 * POST /api/v1/alarms/cranes/:id/acknowledge
 * 确认行车告警
 * 
 * @route POST /api/v1/alarms/cranes/:id/acknowledge
 * @param {number} id.path.required - 告警ID
 * @returns {object} 200 - 确认成功，返回更新后的告警信息
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 告警不存在
 * @returns {Error} 422 - 业务逻辑错误（告警状态不允许确认）
 * @access Private - 需要JWT认证
 */
router.post('/cranes/:id/acknowledge',
  authMiddleware,
  alarmIdValidation,
  validate,
  asyncHandler(alarmController.acknowledgeCraneAlarm)
);

/**
 * GET /api/v1/alarms/large-objects
 * 获取大物告警列表
 * 
 * @route GET /api/v1/alarms/large-objects
 * @param {string} [status.query] - 告警状态筛选（active/acknowledged/resolved）
 * @param {number} [page.query] - 页码（默认1）
 * @param {number} [limit.query] - 每页数量（默认10，最大100）
 * @returns {object} 200 - 返回大物告警列表和分页信息
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.get('/large-objects',
  authMiddleware,
  largeObjectAlarmQueryValidation,
  validate,
  asyncHandler(alarmController.getLargeObjectAlarms)
);

/**
 * GET /api/v1/alarms/devices
 * 获取设备告警列表
 * 
 * @route GET /api/v1/alarms/devices
 * @param {string} [status.query] - 告警状态筛选（active/acknowledged/resolved）
 * @param {number} [page.query] - 页码（默认1）
 * @param {number} [limit.query] - 每页数量（默认10，最大100）
 * @returns {object} 200 - 返回设备告警列表和分页信息
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.get('/devices',
  authMiddleware,
  deviceAlarmQueryValidation,
  validate,
  asyncHandler(alarmController.getDeviceAlarms)
);

// =====================================================
// 导出路由
// =====================================================

module.exports = router;
