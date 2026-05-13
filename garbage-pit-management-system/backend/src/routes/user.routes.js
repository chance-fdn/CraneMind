/**
 * 垃圾储坑智能化管控系统 - 用户路由
 * 
 * 该文件定义了所有用户管理相关的 API 路由
 * 包括：用户列表、用户创建、用户更新、用户删除、密码重置、状态更新等
 * 
 * @module routes/user.routes
 * @author 华工三峰
 */

'use strict';

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { asyncHandler } = require('../middlewares/error.middleware');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// =====================================================
// 输入验证规则定义
// =====================================================

/**
 * 用户ID参数验证规则
 */
const userIdValidationRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('用户ID必须是正整数'),
];

/**
 * 创建用户输入验证规则
 */
const createUserValidationRules = [
  // 用户名验证
  body('username')
    .trim()
    .notEmpty()
    .withMessage('用户名不能为空')
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在3-50个字符之间')
    .matches(/^[a-zA-Z][a-zA-Z0-9_-]*$/)
    .withMessage('用户名必须以字母开头，只能包含字母、数字、下划线和连字符'),
  
  // 密码验证
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 6, max: 50 })
    .withMessage('密码长度必须在6-50个字符之间'),
  
  // 邮箱验证（可选）
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('邮箱格式不正确')
    .isLength({ max: 100 })
    .withMessage('邮箱长度不能超过100个字符'),
  
  // 手机号验证（可选）
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('手机号格式不正确'),
  
  // 真实姓名验证（可选）
  body('real_name')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('真实姓名长度不能超过50个字符'),
  
  // 角色ID验证
  body('role_id')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('角色ID必须是正整数'),
];

/**
 * 更新用户输入验证规则
 */
const updateUserValidationRules = [
  // 邮箱验证（可选）
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('邮箱格式不正确')
    .isLength({ max: 100 })
    .withMessage('邮箱长度不能超过100个字符'),
  
  // 手机号验证（可选）
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('手机号格式不正确'),
  
  // 真实姓名验证（可选）
  body('real_name')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('真实姓名长度不能超过50个字符'),
  
  // 角色ID验证（可选）
  body('role_id')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('角色ID必须是正整数'),
  
  // 状态验证（可选）
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'locked'])
    .withMessage('用户状态只能是 active、inactive 或 locked'),
];

/**
 * 重置密码输入验证规则
 */
const resetPasswordValidationRules = [
  // 新密码验证
  body('newPassword')
    .notEmpty()
    .withMessage('新密码不能为空')
    .isLength({ min: 6, max: 50 })
    .withMessage('新密码长度必须在6-50个字符之间'),
];

/**
 * 更新用户状态输入验证规则
 */
const updateStatusValidationRules = [
  // 状态验证
  body('status')
    .notEmpty()
    .withMessage('状态不能为空')
    .isIn(['active', 'inactive', 'locked'])
    .withMessage('用户状态只能是 active、inactive 或 locked'),
];

/**
 * 用户列表查询参数验证规则
 */
const getUserListValidationRules = [
  // 页码验证
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  
  // 每页数量验证
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数'),
  
  // 状态验证
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'locked'])
    .withMessage('用户状态只能是 active、inactive 或 locked'),
  
  // 角色ID验证
  query('role_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('角色ID必须是正整数'),
  
  // 关键词验证
  query('keyword')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('搜索关键词长度不能超过100个字符'),
];

/**
 * 验证结果处理中间件
 * 
 * @description
 * 检查 express-validator 的验证结果，如果有错误则返回 400 响应
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - 下一个中间件函数
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // 提取第一个错误消息
    const firstError = errors.array()[0];
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: firstError.msg,
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
        })),
      },
    });
  }
  
  next();
};

// =====================================================
// 路由定义
// =====================================================

/**
 * GET /api/v1/users
 * 获取用户列表（分页、搜索）
 * 
 * @route GET /api/v1/users
 * @query {number} [page=1] - 页码
 * @query {number} [limit=10] - 每页数量
 * @query {string} [keyword] - 搜索关键词（用户名、邮箱、真实姓名）
 * @query {string} [status] - 用户状态筛选
 * @query {number} [role_id] - 角色ID筛选
 * @returns {object} 200 - 用户列表和分页信息
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.get('/',
  authMiddleware,
  getUserListValidationRules,
  validate,
  asyncHandler(userController.getUserList)
);

/**
 * GET /api/v1/users/:id
 * 获取单个用户信息
 * 
 * @route GET /api/v1/users/:id
 * @param {number} id.path.required - 用户ID
 * @returns {object} 200 - 用户详细信息
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 用户不存在
 * @access Private - 需要JWT认证
 */
router.get('/:id',
  authMiddleware,
  userIdValidationRules,
  validate,
  asyncHandler(userController.getUserById)
);

/**
 * POST /api/v1/users
 * 创建用户
 * 
 * @route POST /api/v1/users
 * @body {string} username.required - 用户名
 * @body {string} password.required - 密码
 * @body {string} [email] - 邮箱
 * @body {string} [phone] - 手机号
 * @body {string} [real_name] - 真实姓名
 * @body {number} [role_id] - 角色ID
 * @returns {object} 201 - 创建成功的用户信息
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @returns {Error} 409 - 用户名或邮箱已存在
 * @access Private - 需要JWT认证
 */
router.post('/',
  authMiddleware,
  createUserValidationRules,
  validate,
  asyncHandler(userController.createUser)
);

/**
 * PUT /api/v1/users/:id
 * 更新用户信息
 * 
 * @route PUT /api/v1/users/:id
 * @param {number} id.path.required - 用户ID
 * @body {string} [email] - 邮箱
 * @body {string} [phone] - 手机号
 * @body {string} [real_name] - 真实姓名
 * @body {number} [role_id] - 角色ID
 * @body {string} [status] - 用户状态
 * @returns {object} 200 - 更新后的用户信息
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 用户不存在
 * @returns {Error} 409 - 邮箱已被其他用户使用
 * @access Private - 需要JWT认证
 */
router.put('/:id',
  authMiddleware,
  [...userIdValidationRules, ...updateUserValidationRules],
  validate,
  asyncHandler(userController.updateUser)
);

/**
 * DELETE /api/v1/users/:id
 * 删除用户
 * 
 * @route DELETE /api/v1/users/:id
 * @param {number} id.path.required - 用户ID
 * @returns {object} 200 - 删除成功
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 用户不存在
 * @access Private - 需要JWT认证
 */
router.delete('/:id',
  authMiddleware,
  userIdValidationRules,
  validate,
  asyncHandler(userController.deleteUser)
);

/**
 * POST /api/v1/users/:id/reset-password
 * 重置用户密码
 * 
 * @route POST /api/v1/users/:id/reset-password
 * @param {number} id.path.required - 用户ID
 * @body {string} newPassword.required - 新密码
 * @returns {object} 200 - 密码重置成功
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 用户不存在
 * @access Private - 需要JWT认证
 */
router.post('/:id/reset-password',
  authMiddleware,
  [...userIdValidationRules, ...resetPasswordValidationRules],
  validate,
  asyncHandler(userController.resetPassword)
);

/**
 * PUT /api/v1/users/:id/status
 * 更新用户状态
 * 
 * @route PUT /api/v1/users/:id/status
 * @param {number} id.path.required - 用户ID
 * @body {string} status.required - 新状态（active/inactive/locked）
 * @returns {object} 200 - 状态更新成功
 * @returns {Error} 400 - 参数验证失败
 * @returns {Error} 401 - 未授权
 * @returns {Error} 404 - 用户不存在
 * @access Private - 需要JWT认证
 */
router.put('/:id/status',
  authMiddleware,
  [...userIdValidationRules, ...updateStatusValidationRules],
  validate,
  asyncHandler(userController.updateUserStatus)
);

// =====================================================
// 导出路由
// =====================================================

module.exports = router;
