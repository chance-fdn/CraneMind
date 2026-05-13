/**
 * 垃圾储坑智能化管控系统 - 车辆路由
 *
 * 该文件定义了所有车辆记录相关的 API 路由
 * 包括：获取车辆列表、获取单条记录、创建记录、更新离开时间等
 *
 * @module routes/vehicle.routes
 * @author 华工三峰
 */

'use strict';

const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const { asyncHandler } = require('../middlewares/error.middleware');
const vehicleController = require('../controllers/vehicle.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// =====================================================
// 输入验证规则定义
// =====================================================

/**
 * 获取车辆列表验证规则
 */
const getVehicleListRules = [
  // 记录类型（可选）
  query('recordType')
    .optional()
    .isIn(['discharge', 'enter', 'exit', 'transport'])
    .withMessage('记录类型必须是 discharge、enter、exit 或 transport 之一'),

  // 开始日期（可选）
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式不正确')
    .toDate(),

  // 结束日期（可选）
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式不正确')
    .toDate(),

  // 页码（可选，默认1）
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数')
    .toInt(),

  // 每页数量（可选，默认10）
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数')
    .toInt(),
];

/**
 * 获取单条记录验证规则
 */
const getVehicleByIdRules = [
  // 记录ID
  param('id')
    .notEmpty()
    .withMessage('记录ID不能为空')
    .bail()
    .isInt({ min: 1 })
    .withMessage('记录ID必须是正整数')
    .toInt(),
];

/**
 * 创建车辆记录验证规则
 */
const createVehicleRules = [
  // 车牌号（必填）
  body('vehicleNo')
    .notEmpty()
    .withMessage('车牌号不能为空')
    .bail()
    .isLength({ min: 1, max: 20 })
    .withMessage('车牌号长度应在1-20个字符之间')
    .trim(),

  // 车辆类型（可选）
  body('vehicleType')
    .optional()
    .isLength({ max: 50 })
    .withMessage('车辆类型长度不能超过50个字符')
    .trim(),

  // 驾驶员姓名（可选）
  body('driverName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('驾驶员姓名长度不能超过50个字符')
    .trim(),

  // 记录类型（必填）
  body('recordType')
    .notEmpty()
    .withMessage('记录类型不能为空')
    .bail()
    .isIn(['discharge', 'enter', 'exit', 'transport'])
    .withMessage('记录类型必须是 discharge、enter、exit 或 transport 之一'),

  // 物料类型（可选）
  body('materialType')
    .optional()
    .isLength({ max: 50 })
    .withMessage('物料类型长度不能超过50个字符')
    .trim(),

  // 重量（可选）
  body('weight')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('重量必须是0-100之间的数字')
    .toFloat(),

  // 区域ID（可选）
  body('areaId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('区域ID必须是正整数')
    .toInt(),

  // 门号（可选）
  body('gateNo')
    .optional()
    .isLength({ max: 20 })
    .withMessage('门号长度不能超过20个字符')
    .trim(),
];

/**
 * 更新车辆离开时间验证规则
 */
const updateExitTimeRules = [
  // 记录ID
  param('id')
    .notEmpty()
    .withMessage('记录ID不能为空')
    .bail()
    .isInt({ min: 1 })
    .withMessage('记录ID必须是正整数')
    .toInt(),
];

/**
 * 验证结果处理中间件
 * 检查验证结果，如有错误则返回400响应
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // 格式化错误信息
    const formattedErrors = {};
    errors.array().forEach((error) => {
      if (!formattedErrors[error.path]) {
        formattedErrors[error.path] = error.msg;
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
 * GET /api/v1/vehicles
 * 获取车辆记录列表
 *
 * @route GET /api/v1/vehicles
 * @query {string} [recordType] - 记录类型筛选（discharge/enter/exit/transport）
 * @query {string} [startDate] - 开始日期（ISO8601格式）
 * @query {string} [endDate] - 结束日期（ISO8601格式）
 * @query {number} [page=1] - 页码
 * @query {number} [limit=10] - 每页数量
 * @returns {object} 200 - 返回车辆记录列表
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.get('/',
  authMiddleware,
  getVehicleListRules,
  validate,
  asyncHandler(vehicleController.getVehicleList)
);

/**
 * GET /api/v1/vehicles/:id
 * 获取单条车辆记录
 *
 * @route GET /api/v1/vehicles/:id
 * @param {number} id.path.required - 记录ID
 * @returns {object} 200 - 返回车辆记录详情
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 记录不存在
 * @access Private - 需要JWT认证
 */
router.get('/:id',
  authMiddleware,
  getVehicleByIdRules,
  validate,
  asyncHandler(vehicleController.getVehicleById)
);

/**
 * POST /api/v1/vehicles
 * 创建车辆记录
 *
 * @route POST /api/v1/vehicles
 * @body {string} vehicleNo.required - 车牌号
 * @body {string} [vehicleType] - 车辆类型
 * @body {string} [driverName] - 驾驶员姓名
 * @body {string} recordType.required - 记录类型
 * @body {string} [materialType] - 物料类型
 * @body {number} [weight] - 重量
 * @body {number} [areaId] - 区域ID
 * @body {string} [gateNo] - 门号
 * @returns {object} 201 - 创建成功，返回记录详情
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.post('/',
  authMiddleware,
  createVehicleRules,
  validate,
  asyncHandler(vehicleController.createVehicle)
);

/**
 * PUT /api/v1/vehicles/:id/exit
 * 更新车辆离开时间
 *
 * @route PUT /api/v1/vehicles/:id/exit
 * @param {number} id.path.required - 记录ID
 * @returns {object} 200 - 更新成功，返回记录详情
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 记录不存在
 * @returns {Error} 422 - 业务逻辑错误（如已离开）
 * @access Private - 需要JWT认证
 */
router.put('/:id/exit',
  authMiddleware,
  updateExitTimeRules,
  validate,
  asyncHandler(vehicleController.updateExitTime)
);

// =====================================================
// 导出路由
// =====================================================

module.exports = router;
