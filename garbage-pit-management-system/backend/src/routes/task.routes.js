/**
 * 垃圾储坑智能化管控系统 - 任务路由
 * 
 * 该文件定义了所有任务管理和调度相关的 API 路由
 * 包括：任务列表查询、任务创建、任务取消、任务统计等
 * 
 * @module routes/task.routes
 * @author 华工三峰
 */

'use strict';

const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const { asyncHandler } = require('../middlewares/error.middleware');
const { authMiddleware } = require('../middlewares/auth.middleware');
const taskController = require('../controllers/task.controller');

// =====================================================
// 输入验证规则定义
// =====================================================

/**
 * 任务类型枚举
 */
const TASK_TYPES = ['feeding', 'stacking', 'turning', 'moving'];

/**
 * 任务状态枚举
 */
const TASK_STATUS = ['pending', 'running', 'completed', 'cancelled'];

/**
 * 任务列表查询参数验证规则
 */
const taskListValidationRules = [
  // 页码验证（可选）
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于 0 的整数')
    .toInt(),
  
  // 每页数量验证（可选）
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是 1-100 之间的整数')
    .toInt(),
  
  // 任务状态验证（可选）
  query('status')
    .optional()
    .isIn(TASK_STATUS)
    .withMessage(`任务状态必须是: ${TASK_STATUS.join(', ')}`),
  
  // 行车ID验证（可选）
  query('craneId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('行车ID必须是正整数')
    .toInt(),
];

/**
 * 任务ID路径参数验证规则
 */
const taskIdValidationRules = [
  param('id')
    .notEmpty()
    .withMessage('任务ID不能为空')
    .bail()
    .isInt({ min: 1 })
    .withMessage('任务ID必须是正整数')
    .toInt(),
];

/**
 * 创建任务请求体验证规则
 */
const createTaskValidationRules = [
  // 行车ID验证（必填）
  body('craneId')
    .notEmpty()
    .withMessage('行车ID不能为空')
    .bail()
    .isInt({ min: 1 })
    .withMessage('行车ID必须是正整数')
    .toInt(),
  
  // 任务类型验证（必填）
  body('taskType')
    .notEmpty()
    .withMessage('任务类型不能为空')
    .bail()
    .isIn(TASK_TYPES)
    .withMessage(`任务类型必须是: ${TASK_TYPES.join(', ')}`),
  
  // 源区域ID验证（可选）
  body('sourceAreaId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('源区域ID必须是正整数')
    .toInt(),
  
  // 目标区域ID验证（可选）
  body('targetAreaId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('目标区域ID必须是正整数')
    .toInt(),
  
  // 优先级验证（可选）
  body('priority')
    .optional()
    .isInt({ min: 0, max: 3 })
    .withMessage('优先级必须在 0-3 之间')
    .toInt(),
  
  // 重量验证（可选）
  body('weight')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('重量必须在 0-100 吨之间')
    .toFloat(),
];

/**
 * 任务统计查询参数验证规则
 */
const taskStatisticsValidationRules = [
  // 开始日期验证（可选）
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式不正确')
    .toDate(),
  
  // 结束日期验证（可选）
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式不正确')
    .toDate(),
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
 * GET /api/v1/tasks
 * 获取任务列表（分页）
 * 
 * @route GET /api/v1/tasks
 * @query {number} [page=1] - 页码
 * @query {number} [limit=10] - 每页数量
 * @query {string} [status] - 任务状态筛选
 * @query {number} [craneId] - 行车ID筛选
 * @returns {object} 200 - 任务列表及分页信息
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.get('/',
  authMiddleware,
  taskListValidationRules,
  validate,
  asyncHandler(taskController.getTaskList)
);

/**
 * GET /api/v1/tasks/statistics
 * 获取任务统计
 * 
 * 注意：此路由必须放在 /:id 路由之前，否则 'statistics' 会被当作ID处理
 * 
 * @route GET /api/v1/tasks/statistics
 * @query {string} [startDate] - 开始日期（ISO8601格式）
 * @query {string} [endDate] - 结束日期（ISO8601格式）
 * @returns {object} 200 - 任务统计数据
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.get('/statistics',
  authMiddleware,
  taskStatisticsValidationRules,
  validate,
  asyncHandler(taskController.getTaskStatistics)
);

/**
 * GET /api/v1/tasks/:id
 * 获取单个任务信息
 * 
 * @route GET /api/v1/tasks/:id
 * @param {number} id.path.required - 任务ID
 * @returns {object} 200 - 任务详情
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 任务不存在
 * @access Private - 需要JWT认证
 */
router.get('/:id',
  authMiddleware,
  taskIdValidationRules,
  validate,
  asyncHandler(taskController.getTaskById)
);

/**
 * POST /api/v1/tasks
 * 创建任务
 * 
 * @route POST /api/v1/tasks
 * @body {number} craneId.required - 行车ID
 * @body {string} taskType.required - 任务类型（feeding/stacking/turning/moving）
 * @body {number} [sourceAreaId] - 源区域ID
 * @body {number} [targetAreaId] - 目标区域ID
 * @body {number} [priority=0] - 优先级（0-3）
 * @body {number} [weight] - 重量（吨）
 * @returns {object} 201 - 创建成功的任务
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 关联资源不存在
 * @returns {Error} 422 - 业务逻辑错误
 * @access Private - 需要JWT认证
 */
router.post('/',
  authMiddleware,
  createTaskValidationRules,
  validate,
  asyncHandler(taskController.createTask)
);

/**
 * POST /api/v1/tasks/:id/cancel
 * 取消任务
 * 
 * @route POST /api/v1/tasks/:id/cancel
 * @param {number} id.path.required - 任务ID
 * @returns {object} 200 - 取消成功的任务
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 任务不存在
 * @returns {Error} 422 - 任务状态不允许取消
 * @access Private - 需要JWT认证
 */
router.post('/:id/cancel',
  authMiddleware,
  taskIdValidationRules,
  validate,
  asyncHandler(taskController.cancelTask)
);

// =====================================================
// 导出路由
// =====================================================

module.exports = router;
