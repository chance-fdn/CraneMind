/**
 * 垃圾储坑智能化管控系统 - 设备路由
 * 
 * 该文件定义了所有设备管理相关的 API 路由
 * 包括：设备列表查询、设备详情、设备创建、设备更新、设备删除等
 * 
 * @module routes/device.routes
 * @author 华工三峰
 */

'use strict';

const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const { asyncHandler } = require('../middlewares/error.middleware');
const deviceController = require('../controllers/device.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// =====================================================
// 输入验证规则定义
// =====================================================

/**
 * 设备类型枚举值
 * 与设备模型中定义的类型保持一致
 */
const DEVICE_TYPES = ['crane', 'discharge_door', 'transfer_door', 'camera', 'sensor', 'plc', 'other'];

/**
 * 设备状态枚举值
 * 与设备模型中定义的状态保持一致
 */
const DEVICE_STATUSES = ['online', 'offline', 'fault', 'maintenance'];

/**
 * 创建设备输入验证规则
 */
const createDeviceValidationRules = [
  // 设备编号验证
  body('deviceNo')
    .trim()
    .notEmpty()
    .withMessage('设备编号不能为空')
    .isLength({ min: 1, max: 50 })
    .withMessage('设备编号长度必须在1-50个字符之间')
    .matches(/^[A-Za-z][A-Za-z0-9_-]*$/)
    .withMessage('设备编号必须以字母开头，只能包含字母、数字、下划线和短横线'),
  
  // 设备名称验证
  body('name')
    .trim()
    .notEmpty()
    .withMessage('设备名称不能为空')
    .isLength({ min: 1, max: 100 })
    .withMessage('设备名称长度必须在1-100个字符之间'),
  
  // 设备类型验证
  body('type')
    .notEmpty()
    .withMessage('设备类型不能为空')
    .isIn(DEVICE_TYPES)
    .withMessage(`设备类型必须是 ${DEVICE_TYPES.join('、')} 之一`),
  
  // 设备型号验证（可选）
  body('model')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('设备型号长度不能超过100个字符'),
  
  // 制造商验证（可选）
  body('manufacturer')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('制造商长度不能超过100个字符'),
  
  // 安装日期验证（可选）
  body('installDate')
    .optional()
    .isISO8601()
    .withMessage('安装日期格式无效，请使用YYYY-MM-DD格式'),
  
  // 安装位置验证（可选）
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('安装位置长度不能超过100个字符'),
  
  // IP地址验证（可选）
  body('ipAddress')
    .optional()
    .trim()
    .isIP()
    .withMessage('IP地址格式无效'),
  
  // 端口号验证（可选）
  body('port')
    .optional()
    .isInt({ min: 1, max: 65535 })
    .withMessage('端口号必须是1-65535之间的整数'),
  
  // 配置信息验证（可选）
  body('config')
    .optional()
    .isObject()
    .withMessage('配置信息必须是JSON对象'),
];

/**
 * 更新设备输入验证规则
 */
const updateDeviceValidationRules = [
  // 设备名称验证（可选）
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('设备名称不能为空')
    .isLength({ min: 1, max: 100 })
    .withMessage('设备名称长度必须在1-100个字符之间'),
  
  // 设备型号验证（可选）
  body('model')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('设备型号长度不能超过100个字符'),
  
  // 制造商验证（可选）
  body('manufacturer')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('制造商长度不能超过100个字符'),
  
  // 安装位置验证（可选）
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('安装位置长度不能超过100个字符'),
  
  // 设备状态验证（可选）
  body('status')
    .optional()
    .isIn(DEVICE_STATUSES)
    .withMessage(`设备状态必须是 ${DEVICE_STATUSES.join('、')} 之一`),
  
  // 配置信息验证（可选）
  body('config')
    .optional()
    .isObject()
    .withMessage('配置信息必须是JSON对象'),
];

/**
 * 设备ID参数验证规则
 */
const deviceIdValidationRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('设备ID必须是正整数'),
];

/**
 * 设备列表查询参数验证规则
 */
const listDevicesValidationRules = [
  // 设备类型筛选（可选）
  query('type')
    .optional()
    .isIn(DEVICE_TYPES)
    .withMessage(`设备类型必须是 ${DEVICE_TYPES.join('、')} 之一`),
  
  // 设备状态筛选（可选）
  query('status')
    .optional()
    .isIn(DEVICE_STATUSES)
    .withMessage(`设备状态必须是 ${DEVICE_STATUSES.join('、')} 之一`),
];

// =====================================================
// 路由定义
// =====================================================

/**
 * GET /api/v1/devices
 * 获取设备列表
 * 
 * @route GET /api/v1/devices
 * @query {string} [type] - 设备类型筛选
 * @query {string} [status] - 设备状态筛选
 * @returns {object} 200 - 设备列表
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.get('/',
  authMiddleware,
  listDevicesValidationRules,
  asyncHandler(deviceController.getDevices)
);

/**
 * GET /api/v1/devices/:id
 * 获取单个设备信息
 * 
 * @route GET /api/v1/devices/:id
 * @param {number} id.path.required - 设备ID
 * @returns {object} 200 - 设备详细信息
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 设备不存在
 * @access Private - 需要JWT认证
 */
router.get('/:id',
  authMiddleware,
  deviceIdValidationRules,
  asyncHandler(deviceController.getDeviceById)
);

/**
 * POST /api/v1/devices
 * 创建设备
 * 
 * @route POST /api/v1/devices
 * @param {string} deviceNo.body.required - 设备编号
 * @param {string} name.body.required - 设备名称
 * @param {string} type.body.required - 设备类型
 * @param {string} [model] - 设备型号
 * @param {string} [manufacturer] - 制造商
 * @param {string} [installDate] - 安装日期
 * @param {string} [location] - 安装位置
 * @param {string} [ipAddress] - IP地址
 * @param {number} [port] - 端口号
 * @param {object} [config] - 配置信息
 * @returns {object} 201 - 创建成功，返回设备信息
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @returns {Error} 409 - 设备编号已存在
 * @access Private - 需要JWT认证
 */
router.post('/',
  authMiddleware,
  createDeviceValidationRules,
  asyncHandler(deviceController.createDevice)
);

/**
 * PUT /api/v1/devices/:id
 * 更新设备
 * 
 * @route PUT /api/v1/devices/:id
 * @param {number} id.path.required - 设备ID
 * @param {string} [name] - 设备名称
 * @param {string} [model] - 设备型号
 * @param {string} [manufacturer] - 制造商
 * @param {string} [location] - 安装位置
 * @param {string} [status] - 设备状态
 * @param {object} [config] - 配置信息
 * @returns {object} 200 - 更新成功，返回设备信息
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 设备不存在
 * @access Private - 需要JWT认证
 */
router.put('/:id',
  authMiddleware,
  [...deviceIdValidationRules, ...updateDeviceValidationRules],
  asyncHandler(deviceController.updateDevice)
);

/**
 * DELETE /api/v1/devices/:id
 * 删除设备
 * 
 * @route DELETE /api/v1/devices/:id
 * @param {number} id.path.required - 设备ID
 * @returns {object} 200 - 删除成功
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 设备不存在
 * @access Private - 需要JWT认证
 */
router.delete('/:id',
  authMiddleware,
  deviceIdValidationRules,
  asyncHandler(deviceController.deleteDevice)
);

// =====================================================
// 导出路由
// =====================================================

module.exports = router;
