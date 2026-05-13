/**
 * 垃圾储坑智能化管控系统 - 区域路由
 * 
 * 该文件定义了所有区域相关的 API 路由
 * 包括：区域列表查询、区域创建、区域更新、区域删除、区域设备控制等
 * 
 * @module routes/area.routes
 * @author 华工三峰
 */

'use strict';

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { asyncHandler } = require('../middlewares/error.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const areaController = require('../controllers/area.controller');

// =====================================================
// 输入验证规则定义
// =====================================================

/**
 * 区域ID参数验证规则
 * 用于验证路由参数中的区域ID
 */
const areaIdValidationRules = [
  param('id')
    .notEmpty()
    .withMessage('区域ID不能为空')
    .isUUID(4)
    .withMessage('区域ID格式无效，必须是有效的UUID'),
];

/**
 * 创建区域输入验证规则
 * 验证创建区域时提交的字段
 */
const createAreaValidationRules = [
  // 区域编号验证：必填，1-20个字符，字母开头
  body('areaNo')
    .trim()
    .notEmpty()
    .withMessage('区域编号不能为空')
    .isLength({ min: 1, max: 20 })
    .withMessage('区域编号长度必须在1-20个字符之间')
    .matches(/^[A-Za-z][A-Za-z0-9_-]*$/)
    .withMessage('区域编号格式无效，必须以字母开头，只能包含字母、数字、下划线和短横线'),
  
  // 区域名称验证：必填，1-50个字符
  body('name')
    .trim()
    .notEmpty()
    .withMessage('区域名称不能为空')
    .isLength({ min: 1, max: 50 })
    .withMessage('区域名称长度必须在1-50个字符之间'),
  
  // 区域类型验证：必填，只能是 stacking、feeding 或 transfer
  body('type')
    .notEmpty()
    .withMessage('区域类型不能为空')
    .isIn(['stacking', 'feeding', 'transfer'])
    .withMessage('区域类型必须是 stacking（堆料区）、feeding（卸料区）或 transfer（转运区）之一'),
  
  // X坐标验证：可选，必须是有效的小数
  body('coordinateX')
    .optional()
    .isFloat({ min: -9999.999, max: 9999.999 })
    .withMessage('X坐标必须是-9999.999到9999.999之间的数值'),
  
  // Y坐标验证：可选，必须是有效的小数
  body('coordinateY')
    .optional()
    .isFloat({ min: -9999.999, max: 9999.999 })
    .withMessage('Y坐标必须是-9999.999到9999.999之间的数值'),
  
  // 宽度验证：可选，必须是有效的小数
  body('width')
    .optional()
    .isFloat({ min: 0.1, max: 1000.0 })
    .withMessage('宽度必须是0.1到1000之间的数值'),
  
  // 高度（长度）验证：可选，必须是有效的小数
  body('height')
    .optional()
    .isFloat({ min: 0.1, max: 1000.0 })
    .withMessage('高度必须是0.1到1000之间的数值'),
  
  // 深度验证：可选，必须是有效的小数
  body('depth')
    .optional()
    .isFloat({ min: 0.1, max: 50.0 })
    .withMessage('深度必须是0.1到50之间的数值'),
  
  // 最大堆料高度验证：可选，必须是有效的小数
  body('maxHeight')
    .optional()
    .isFloat({ min: 0.1, max: 50.0 })
    .withMessage('最大堆料高度必须是0.1到50之间的数值'),
];

/**
 * 更新区域输入验证规则
 * 验证更新区域时提交的字段
 */
const updateAreaValidationRules = [
  // 区域名称验证：可选，但如果提供则必须有效
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('区域名称不能为空')
    .isLength({ min: 1, max: 50 })
    .withMessage('区域名称长度必须在1-50个字符之间'),
  
  // 宽度验证：可选，但如果提供则必须有效
  body('width')
    .optional()
    .isFloat({ min: 0.1, max: 1000.0 })
    .withMessage('宽度必须是0.1到1000之间的数值'),
  
  // 高度（长度）验证：可选，但如果提供则必须有效
  body('height')
    .optional()
    .isFloat({ min: 0.1, max: 1000.0 })
    .withMessage('高度必须是0.1到1000之间的数值'),
  
  // 深度验证：可选，但如果提供则必须有效
  body('depth')
    .optional()
    .isFloat({ min: 0.1, max: 50.0 })
    .withMessage('深度必须是0.1到50之间的数值'),
  
  // 最大堆料高度验证：可选，但如果提供则必须有效
  body('maxHeight')
    .optional()
    .isFloat({ min: 0.1, max: 50.0 })
    .withMessage('最大堆料高度必须是0.1到50之间的数值'),
];

/**
 * 区域设备控制输入验证规则
 * 验证控制区域设备时提交的字段
 */
const controlAreaValidationRules = [
  // 盖板状态验证：可选，只能是 open 或 closed
  body('coverStatus')
    .optional()
    .isIn(['open', 'closed'])
    .withMessage('盖板状态必须是 open（打开）或 closed（关闭）之一'),
  
  // 排水状态验证：可选，只能是 open 或 closed
  body('drainingStatus')
    .optional()
    .isIn(['open', 'closed'])
    .withMessage('排水状态必须是 open（打开）或 closed（关闭）之一'),
  
  // 清洗状态验证：可选，只能是 open 或 closed
  body('cleaningStatus')
    .optional()
    .isIn(['open', 'closed'])
    .withMessage('清洗状态必须是 open（打开）或 closed（关闭）之一'),
  
  // 至少提供一个控制状态
  body()
    .custom((value) => {
      if (!value.coverStatus && !value.drainingStatus && !value.cleaningStatus) {
        throw new Error('至少需要提供一个控制状态（coverStatus、drainingStatus 或 cleaningStatus）');
      }
      return true;
    }),
];

/**
 * 查询参数验证规则
 * 验证查询区域列表时的分页和过滤参数
 */
const getAreasQueryValidationRules = [
  // 页码验证：可选，必须是正整数
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  
  // 每页数量验证：可选，必须是正整数且在合理范围内
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数'),
  
  // 区域类型过滤验证：可选
  query('type')
    .optional()
    .isIn(['stacking', 'feeding', 'transfer'])
    .withMessage('区域类型必须是 stacking、feeding 或 transfer 之一'),
  
  // 区域状态过滤验证：可选
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'maintenance', 'full'])
    .withMessage('区域状态必须是 active、inactive、maintenance 或 full 之一'),
];

// =====================================================
// 路由定义
// =====================================================

/**
 * GET /api/v1/areas
 * 获取区域列表
 * 
 * @route GET /api/v1/areas
 * @query {number} page - 页码（默认1）
 * @query {number} limit - 每页数量（默认10）
 * @query {string} type - 区域类型过滤（stacking/feeding/transfer）
 * @query {string} status - 区域状态过滤（active/inactive/maintenance/full）
 * @returns {object} 200 - 区域列表
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.get('/',
  authMiddleware,
  getAreasQueryValidationRules,
  asyncHandler(areaController.getAreas)
);

/**
 * GET /api/v1/areas/:id
 * 获取单个区域信息
 * 
 * @route GET /api/v1/areas/:id
 * @param {string} id.path.required - 区域ID（UUID格式）
 * @returns {object} 200 - 区域详情
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 区域不存在
 * @access Private - 需要JWT认证
 */
router.get('/:id',
  authMiddleware,
  areaIdValidationRules,
  asyncHandler(areaController.getAreaById)
);

/**
 * POST /api/v1/areas
 * 创建区域
 * 
 * @route POST /api/v1/areas
 * @param {string} areaNo.body.required - 区域编号
 * @param {string} name.body.required - 区域名称
 * @param {string} type.body.required - 区域类型（stacking/feeding/transfer）
 * @param {number} coordinateX.body - X坐标
 * @param {number} coordinateY.body - Y坐标
 * @param {number} width.body - 宽度
 * @param {number} height.body - 高度/长度
 * @param {number} depth.body - 深度
 * @param {number} maxHeight.body - 最大堆料高度
 * @returns {object} 201 - 创建成功
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @returns {Error} 409 - 区域编号已存在
 * @access Private - 需要JWT认证
 */
router.post('/',
  authMiddleware,
  createAreaValidationRules,
  asyncHandler(areaController.createArea)
);

/**
 * PUT /api/v1/areas/:id
 * 更新区域
 * 
 * @route PUT /api/v1/areas/:id
 * @param {string} id.path.required - 区域ID（UUID格式）
 * @param {string} name.body - 区域名称
 * @param {number} width.body - 宽度
 * @param {number} height.body - 高度/长度
 * @param {number} depth.body - 深度
 * @param {number} maxHeight.body - 最大堆料高度
 * @returns {object} 200 - 更新成功
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 区域不存在
 * @access Private - 需要JWT认证
 */
router.put('/:id',
  authMiddleware,
  [...areaIdValidationRules, ...updateAreaValidationRules],
  asyncHandler(areaController.updateArea)
);

/**
 * DELETE /api/v1/areas/:id
 * 删除区域
 * 
 * @route DELETE /api/v1/areas/:id
 * @param {string} id.path.required - 区域ID（UUID格式）
 * @returns {object} 200 - 删除成功
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 区域不存在
 * @returns {Error} 409 - 区域存在关联数据，无法删除
 * @access Private - 需要JWT认证
 */
router.delete('/:id',
  authMiddleware,
  areaIdValidationRules,
  asyncHandler(areaController.deleteArea)
);

/**
 * POST /api/v1/areas/:id/control
 * 控制区域设备
 * 
 * 控制区域的设备，包括盖板、排水系统、清洗系统等
 * 
 * @route POST /api/v1/areas/:id/control
 * @param {string} id.path.required - 区域ID（UUID格式）
 * @param {string} coverStatus.body - 盖板状态（open/closed）
 * @param {string} drainingStatus.body - 排水状态（open/closed）
 * @param {string} cleaningStatus.body - 清洗状态（open/closed）
 * @returns {object} 200 - 控制成功
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 区域不存在
 * @access Private - 需要JWT认证
 */
router.post('/:id/control',
  authMiddleware,
  [...areaIdValidationRules, ...controlAreaValidationRules],
  asyncHandler(areaController.controlArea)
);

// =====================================================
// 导出路由
// =====================================================

module.exports = router;
