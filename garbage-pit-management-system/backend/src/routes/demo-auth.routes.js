/**
 * 演示模式认证路由
 * 使用演示认证控制器
 */

'use strict';

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { asyncHandler } = require('../middlewares/error.middleware');
const demoAuthController = require('../controllers/simple-demo-auth.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// 演示登录验证规则
const loginValidationRules = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('用户名不能为空')
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在3-50个字符之间'),
  
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 6 })
    .withMessage('密码长度不能少于6个字符'),
];

/**
 * 演示登录端点
 */
router.post('/login', 
  loginValidationRules,
  asyncHandler(demoAuthController.simpleDemoLogin)
);

/**
 * 演示登出
 */
router.post('/logout',
  authMiddleware,
  asyncHandler(demoAuthController.simpleDemoLogout)
);

/**
 * 获取当前用户信息
 */
router.get('/me',
  authMiddleware,
  asyncHandler(demoAuthController.simpleDemoGetCurrentUser)
);

// 别名
router.get('/profile',
  authMiddleware,
  asyncHandler(demoAuthController.simpleDemoGetCurrentUser)
);

module.exports = router;