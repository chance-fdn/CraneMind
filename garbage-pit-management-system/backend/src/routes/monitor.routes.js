/**
 * 垃圾储坑智能化管控系统 - 监控路由
 * 
 * 该文件定义了所有监控相关的 API 路由
 * 包括：监控大屏数据、摄像头列表、摄像头截图等
 * 
 * @module routes/monitor.routes
 * @author 华工三峰
 */

'use strict';

const express = require('express');
const router = express.Router();
const { query, param, validationResult } = require('express-validator');
const { asyncHandler } = require('../middlewares/error.middleware');
const monitorController = require('../controllers/monitor.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// =====================================================
// 输入验证规则定义
// =====================================================

/**
 * 摄像头列表查询验证规则
 */
const getCamerasValidationRules = [
  // 区域ID验证（可选）
  query('areaId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('区域ID必须是正整数'),
];

/**
 * 摄像头截图验证规则
 */
const captureValidationRules = [
  // 摄像头ID验证
  param('id')
    .isInt({ min: 1 })
    .withMessage('摄像头ID必须是正整数'),
];

// =====================================================
// 路由定义
// =====================================================

/**
 * GET /api/v1/monitor/dashboard
 * 获取监控大屏数据
 * 
 * @route GET /api/v1/monitor/dashboard
 * @returns {object} 200 - 返回监控大屏汇总数据
 *   - craneStatus: 行车状态统计
 *   - areaInventory: 区域库存统计
 *   - alarmStatistics: 告警统计
 *   - taskStatus: 任务状态统计
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.get('/dashboard',
  authMiddleware,
  asyncHandler(monitorController.getDashboard)
);

/**
 * GET /api/v1/monitor/cameras
 * 获取摄像头列表
 * 
 * @route GET /api/v1/monitor/cameras
 * @param {number} [areaId] query - 区域ID（可选，用于筛选特定区域的摄像头）
 * @returns {object} 200 - 返回摄像头列表
 *   - cameras: 摄像头数组，包含ID、名称、位置、状态、RTSP地址等
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.get('/cameras',
  authMiddleware,
  getCamerasValidationRules,
  asyncHandler(monitorController.getCameras)
);

/**
 * POST /api/v1/monitor/cameras/:id/capture
 * 摄像头截图
 * 
 * @route POST /api/v1/monitor/cameras/:id/capture
 * @param {number} id.path.required - 摄像头ID
 * @returns {object} 200 - 返回截图结果
 *   - imageUrl: 截图URL地址
 *   - capturedAt: 截图时间
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 摄像头不存在
 * @access Private - 需要JWT认证
 */
router.post('/cameras/:id/capture',
  authMiddleware,
  captureValidationRules,
  asyncHandler(monitorController.captureCamera)
);

// =====================================================
// 导出路由
// =====================================================

module.exports = router;
