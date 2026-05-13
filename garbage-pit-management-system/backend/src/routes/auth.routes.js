/**
 * 垃圾储坑智能化管控系统 - 认证路由
 * 
 * 该文件定义了所有认证相关的 API 路由
 * 包括：登录、登出、刷新token、获取用户信息等
 * 
 * @module routes/auth.routes
 * @author 华工三峰
 */

'use strict';

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middlewares/error.middleware');
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// =====================================================
// 输入验证规则定义
// =====================================================

/**
 * 登录输入验证规则
 */
const loginValidationRules = [
  // 用户名验证
  body('username')
    .trim()
    .notEmpty()
    .withMessage('用户名不能为空')
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在3-50个字符之间'),
  
  // 密码验证
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 6 })
    .withMessage('密码长度不能少于6个字符'),
];

/**
 * 刷新Token验证规则
 */
const refreshTokenValidationRules = [
  body('refreshToken')
    .notEmpty()
    .withMessage('刷新Token不能为空'),
];

// =====================================================
// 路由定义
// =====================================================

/**
 * POST /api/v1/auth/login
 * 用户登录
 * 
 * @route POST /api/v1/auth/login
 * @param {string} username.body.required - 用户名
 * @param {string} password.body.required - 密码
 * @returns {object} 200 - 登录成功，返回JWT Token和用户信息
 * @returns {Error} 401 - 认证失败
 * @access Public
 */
router.post('/login', 
  loginValidationRules,
  asyncHandler(authController.login)
);

/**
 * POST /api/v1/auth/logout
 * 用户登出
 * 
 * @route POST /api/v1/auth/logout
 * @returns {object} 200 - 登出成功
 * @access Private - 需要JWT认证
 */
router.post('/logout',
  authMiddleware,
  asyncHandler(authController.logout)
);

/**
 * POST /api/v1/auth/refresh
 * 刷新访问Token
 * 
 * @route POST /api/v1/auth/refresh
 * @param {string} refreshToken.body.required - 刷新Token
 * @returns {object} 200 - 刷新成功，返回新的Token
 * @returns {Error} 401 - Token无效或已过期
 * @access Public
 */
router.post('/refresh',
  refreshTokenValidationRules,
  asyncHandler(authController.refreshToken)
);

/**
 * GET /api/v1/auth/profile
 * 获取当前登录用户信息
 * 
 * @route GET /api/v1/auth/profile
 * @returns {object} 200 - 返回当前用户信息
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.get('/profile',
  authMiddleware,
  asyncHandler(authController.getCurrentUser)
);

/**
 * GET /api/v1/auth/me
 * 获取当前登录用户信息（/profile的别名）
 * 
 * @route GET /api/v1/auth/me
 * @returns {object} 200 - 返回当前用户信息
 * @returns {Error} 401 - 未授权
 * @access Private - 需要JWT认证
 */
router.get('/me',
  authMiddleware,
  asyncHandler(authController.getCurrentUser)
);

/**
 * PUT /api/v1/auth/password
 * 修改密码
 * 
 * @route PUT /api/v1/auth/password
 * @param {string} oldPassword.body.required - 旧密码
 * @param {string} newPassword.body.required - 新密码
 * @returns {object} 200 - 密码修改成功
 * @returns {Error} 400 - 旧密码错误
 * @access Private - 需要JWT认证
 */
router.put('/password',
  authMiddleware,
  [
    body('oldPassword').notEmpty().withMessage('旧密码不能为空'),
    body('newPassword')
      .notEmpty().withMessage('新密码不能为空')
      .isLength({ min: 6 }).withMessage('新密码长度不能少于6个字符'),
  ],
  asyncHandler(authController.changePassword)
);

/**
 * POST /api/v1/auth/validate-token
 * 验证Token是否有效
 * 
 * @route POST /api/v1/auth/validate-token
 * @param {string} token.body.required - 需要验证的Token
 * @returns {object} 200 - Token有效
 * @returns {Error} 401 - Token无效
 * @access Public
 */
router.post('/validate-token',
  [
    body('token').notEmpty().withMessage('Token不能为空'),
  ],
  asyncHandler(authController.validateToken)
);

// =====================================================
// 导出路由
// =====================================================

module.exports = router;