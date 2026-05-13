/**
 * 垃圾储坑智能化管控系统 - 认证控制器
 * 
 * 该文件负责处理所有认证相关的业务逻辑
 * 包括：登录、登出、Token刷新、用户信息获取等
 * 
 * @module controllers/auth.controller
 * @author 华工三峰
 */

'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const config = require('../config');
const logger = require('../utils/logger');
const { ValidationError, UnauthorizedError } = require('../middlewares/error.middleware');
const db = require('../models');

// =====================================================
// 辅助函数
// =====================================================

/**
 * 生成 JWT Token
 * 
 * @param {Object} user - 用户对象
 * @returns {string} JWT Token
 */
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    roleId: user.role_id,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: config.jwt.issuer,
  });
};

/**
 * 生成刷新Token
 * 
 * @param {Object} user - 用户对象
 * @returns {string} 刷新Token
 */
const generateRefreshToken = (user) => {
  const payload = {
    userId: user.id,
    type: 'refresh',
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
    issuer: config.jwt.issuer,
  });
};

/**
 * 验证密码
 * 
 * @param {string} inputPassword - 用户输入的密码
 * @param {string} storedPassword - 存储的加密密码
 * @returns {Promise<boolean>} 密码是否匹配
 */
const comparePassword = async (inputPassword, storedPassword) => {
  return await bcrypt.compare(inputPassword, storedPassword);
};

// =====================================================
// 控制器方法
// =====================================================

/**
 * 用户登录
 * 
 * @route POST /api/v1/auth/login
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const login = async (req, res, next) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('输入验证失败', errors.array());
    }

    const { username, password } = req.body;

    // 查找用户（包含角色信息）
    const user = await db.User.findOne({
      where: { username },
      include: [{
        model: db.Role,
        as: 'role',
        attributes: ['id', 'name', 'code', 'permissions'],
      }],
    });

    // 检查用户是否存在
    if (!user) {
      logger.warn(`登录失败: 用户不存在 - ${username}`);
      throw new UnauthorizedError('用户名或密码错误');
    }

    // 检查用户状态
    if (user.status !== 'active') {
      logger.warn(`登录失败: 用户状态异常 - ${username}, status: ${user.status}`);
      throw new UnauthorizedError('账号已被禁用或锁定');
    }

    // 验证密码
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`登录失败: 密码错误 - ${username}`);
      throw new UnauthorizedError('用户名或密码错误');
    }

    // 生成Token
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // 更新最后登录时间
    await user.update({ last_login_at: new Date() });

    // 记录登录日志
    logger.info(`用户登录成功: ${username}`, {
      userId: user.id,
      username: user.username,
      roleId: user.role_id,
      ip: req.ip,
    });

    // 返回成功响应
    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          realName: user.real_name,
          role: user.role ? {
            id: user.role.id,
            name: user.role.name,
            code: user.role.code,
            permissions: user.role.permissions,
          } : null,
        },
      },
      message: '登录成功',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 用户登出
 * 
 * @route POST /api/v1/auth/logout
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const logout = async (req, res, next) => {
  try {
    const user = req.user;

    // 记录登出日志
    logger.info(`用户登出: ${user.username}`, {
      userId: user.id,
      username: user.username,
    });

    // 返回成功响应
    res.json({
      success: true,
      message: '登出成功',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 刷新Token
 * 
 * @route POST /api/v1/auth/refresh
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // 验证刷新Token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.secret);
    } catch (error) {
      throw new UnauthorizedError('刷新Token无效或已过期');
    }

    // 检查Token类型
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('无效的Token类型');
    }

    // 查找用户
    const user = await db.User.findByPk(decoded.userId, {
      include: [{
        model: db.Role,
        as: 'role',
        attributes: ['id', 'name', 'code', 'permissions'],
      }],
    });

    if (!user) {
      throw new UnauthorizedError('用户不存在');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedError('账号已被禁用或锁定');
    }

    // 生成新的Token
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // 返回成功响应
    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
      message: 'Token刷新成功',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取当前用户信息
 * 
 * @route GET /api/v1/auth/me
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 查找用户详细信息
    const user = await db.User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: [{
        model: db.Role,
        as: 'role',
        attributes: ['id', 'name', 'code', 'permissions'],
      }],
    });

    if (!user) {
      throw new UnauthorizedError('用户不存在');
    }

    // 返回成功响应
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 修改密码
 * 
 * @route PUT /api/v1/auth/password
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const changePassword = async (req, res, next) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('输入验证失败', errors.array());
    }

    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    // 查找用户
    const user = await db.User.findByPk(userId);

    if (!user) {
      throw new UnauthorizedError('用户不存在');
    }

    // 验证旧密码
    const isPasswordValid = await comparePassword(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new ValidationError('旧密码错误');
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);

    // 更新密码
    await user.update({ password: hashedPassword });

    // 记录日志
    logger.info(`用户修改密码: ${user.username}`, {
      userId: user.id,
    });

    // 返回成功响应
    res.json({
      success: true,
      message: '密码修改成功',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 验证Token
 * 
 * @route POST /api/v1/auth/validate-token
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const validateToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    // 验证Token
    try {
      const decoded = jwt.verify(token, config.jwt.secret);

      // 返回成功响应
      res.json({
        success: true,
        data: {
          valid: true,
          decoded,
        },
        message: 'Token有效',
      });
    } catch (error) {
      throw new UnauthorizedError('Token无效或已过期');
    }
  } catch (error) {
    next(error);
  }
};

// =====================================================
// 导出控制器方法
// =====================================================

module.exports = {
  login,
  logout,
  refreshToken,
  getCurrentUser,
  changePassword,
  validateToken,
};
