/**
 * 垃圾储坑智能化管控系统 - 数据路由
 *
 * 该文件定义了所有数据查询和导出相关的 API 路由
 * 包括：发酵数据查询、库存数据查询、车辆记录查询、数据导出等
 *
 * @module routes/data.routes
 * @author 华工三峰
 */

'use strict';

const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const { asyncHandler } = require('../middlewares/error.middleware');
const dataController = require('../controllers/data.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// =====================================================
// 输入验证规则定义
// =====================================================

/**
 * 日期格式验证正则
 * 格式：YYYY-MM-DD
 */
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 发酵数据查询验证规则
 */
const fermentationQueryValidation = [
  // 区域ID验证（可选）
  query('areaId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('区域ID必须是正整数')
    .toInt(),

  // 开始日期验证
  query('startDate')
    .optional()
    .matches(dateRegex)
    .withMessage('开始日期格式必须为 YYYY-MM-DD'),

  // 结束日期验证
  query('endDate')
    .optional()
    .matches(dateRegex)
    .withMessage('结束日期格式必须为 YYYY-MM-DD')
    .custom((endDate, { req }) => {
      // 如果同时提供了开始和结束日期，验证结束日期不小于开始日期
      if (req.query.startDate && endDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(endDate);
        if (end < start) {
          throw new Error('结束日期不能早于开始日期');
        }
      }
      return true;
    }),
];

/**
 * 库存数据查询验证规则
 */
const inventoryQueryValidation = [
  // 开始日期验证
  query('startDate')
    .optional()
    .matches(dateRegex)
    .withMessage('开始日期格式必须为 YYYY-MM-DD'),

  // 结束日期验证
  query('endDate')
    .optional()
    .matches(dateRegex)
    .withMessage('结束日期格式必须为 YYYY-MM-DD')
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(endDate);
        if (end < start) {
          throw new Error('结束日期不能早于开始日期');
        }
      }
      return true;
    }),

  // 分组方式验证
  query('groupBy')
    .optional()
    .isIn(['day', 'week', 'month', 'area'])
    .withMessage('分组方式必须是 day、week、month 或 area'),
];

/**
 * 车辆记录查询验证规则
 */
const vehiclesQueryValidation = [
  // 记录类型验证（可选）
  query('recordType')
    .optional()
    .isIn(['discharge', 'enter', 'exit', 'transport'])
    .withMessage('记录类型必须是 discharge、enter、exit 或 transport'),

  // 开始日期验证
  query('startDate')
    .optional()
    .matches(dateRegex)
    .withMessage('开始日期格式必须为 YYYY-MM-DD'),

  // 结束日期验证
  query('endDate')
    .optional()
    .matches(dateRegex)
    .withMessage('结束日期格式必须为 YYYY-MM-DD')
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(endDate);
        if (end < start) {
          throw new Error('结束日期不能早于开始日期');
        }
      }
      return true;
    }),
];

/**
 * 数据导出验证规则
 */
const exportQueryValidation = [
  // 数据类型验证（必填）
  query('type')
    .notEmpty()
    .withMessage('数据类型不能为空')
    .isIn(['fermentation', 'inventory', 'vehicles', 'tasks', 'alarms'])
    .withMessage('数据类型必须是 fermentation、inventory、vehicles、tasks 或 alarms'),

  // 导出格式验证（必填）
  query('format')
    .notEmpty()
    .withMessage('导出格式不能为空')
    .isIn(['excel', 'csv', 'json'])
    .withMessage('导出格式必须是 excel、csv 或 json'),

  // 开始日期验证
  query('startDate')
    .optional()
    .matches(dateRegex)
    .withMessage('开始日期格式必须为 YYYY-MM-DD'),

  // 结束日期验证
  query('endDate')
    .optional()
    .matches(dateRegex)
    .withMessage('结束日期格式必须为 YYYY-MM-DD')
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(endDate);
        if (end < start) {
          throw new Error('结束日期不能早于开始日期');
        }
      }
      return true;
    }),
];

// =====================================================
// 路由定义
// =====================================================

/**
 * GET /api/v1/data/fermentation
 * 获取发酵数据
 *
 * @route GET /api/v1/data/fermentation
 * @param {number} [areaId] query - 区域ID（可选）
 * @param {string} [startDate] query - 开始日期，格式 YYYY-MM-DD（可选）
 * @param {string} [endDate] query - 结束日期，格式 YYYY-MM-DD（可选）
 * @returns {object} 200 - 返回发酵数据列表
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.get('/fermentation',
  authMiddleware,
  fermentationQueryValidation,
  asyncHandler(dataController.getFermentationData)
);

/**
 * GET /api/v1/data/inventory
 * 获取库存数据
 *
 * @route GET /api/v1/data/inventory
 * @param {string} [startDate] query - 开始日期，格式 YYYY-MM-DD（可选）
 * @param {string} [endDate] query - 结束日期，格式 YYYY-MM-DD（可选）
 * @param {string} [groupBy] query - 分组方式：day/week/month/area（可选）
 * @returns {object} 200 - 返回库存数据列表
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.get('/inventory',
  authMiddleware,
  inventoryQueryValidation,
  asyncHandler(dataController.getInventoryData)
);

/**
 * GET /api/v1/data/vehicles
 * 获取车辆记录
 *
 * @route GET /api/v1/data/vehicles
 * @param {string} [recordType] query - 记录类型：discharge/enter/exit/transport（可选）
 * @param {string} [startDate] query - 开始日期，格式 YYYY-MM-DD（可选）
 * @param {string} [endDate] query - 结束日期，格式 YYYY-MM-DD（可选）
 * @returns {object} 200 - 返回车辆记录列表
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.get('/vehicles',
  authMiddleware,
  vehiclesQueryValidation,
  asyncHandler(dataController.getVehicleRecords)
);

/**
 * GET /api/v1/data/export
 * 导出数据
 *
 * @route GET /api/v1/data/export
 * @param {string} type query.required - 数据类型：fermentation/inventory/vehicles/tasks/alarms
 * @param {string} format query.required - 导出格式：excel/csv/json
 * @param {string} [startDate] query - 开始日期，格式 YYYY-MM-DD（可选）
 * @param {string} [endDate] query - 结束日期，格式 YYYY-MM-DD（可选）
 * @returns {file} 200 - 返回导出的文件
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.get('/export',
  authMiddleware,
  exportQueryValidation,
  asyncHandler(dataController.exportData)
);

// =====================================================
// 导出路由
// =====================================================

module.exports = router;
