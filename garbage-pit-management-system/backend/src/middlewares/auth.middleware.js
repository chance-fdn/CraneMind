/**
 * 垃圾储坑智能化管控系统 - 认证中间件
 *
 * 该文件负责：
 * 1. 验证 JWT Token 的有效性
 * 2. 从 Token 中提取用户信息
 * 3. 检查用户权限和角色
 * 4. 提供不同级别的权限验证功能
 *
 * @module middlewares/auth.middleware
 * @author 华工三峰
 */

'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

// =====================================================
// 错误消息定义
// =====================================================

/**
 * 认证相关的错误消息
 * 使用中文提示，便于理解和调试
 */
const ERROR_MESSAGES = {
  // Token 相关错误
  NO_TOKEN: '未提供认证令牌，请先登录',
  TOKEN_INVALID: '认证令牌无效，请重新登录',
  TOKEN_EXPIRED: '认证令牌已过期，请重新登录',
  TOKEN_MALFORMED: '认证令牌格式错误',
  TOKEN_MISSING_PREFIX: '认证令牌缺少 Bearer 前缀',

  // 用户状态相关错误
  USER_NOT_FOUND: '用户不存在',
  USER_DISABLED: '用户已被禁用，请联系管理员',
  USER_NOT_VERIFIED: '用户邮箱未验证',

  // 权限相关错误
  NO_PERMISSION: '您没有权限执行此操作',
  ROLE_REQUIRED: '需要特定角色权限',
  ADMIN_REQUIRED: '需要管理员权限',
  SUPER_ADMIN_REQUIRED: '需要超级管理员权限',

  // 其他错误
  AUTH_FAILED: '认证失败',
  INTERNAL_ERROR: '服务器内部错误',
};

// =====================================================
// 辅助函数
// =====================================================

/**
 * 从请求头中提取 Token
 *
 * @description
 * 支持两种方式：
 * 1. Authorization: Bearer <token> (推荐)
 * 2. Authorization: <token> (兼容旧版)
 *
 * @param {Object} req - Express 请求对象
 * @returns {string|null} Token 字符串，如果不存在则返回 null
 */
function extractToken(req) {
  // 获取 Authorization 头
  const authHeader = req.headers.authorization || req.headers.token || req.headers['x-token'];

  if (!authHeader) {
    return null;
  }

  // 检查是否有 Bearer 前缀
  const parts = authHeader.split(' ');

  // 格式: Bearer <token>
  if (parts.length === 2) {
    const [scheme, token] = parts;

    // 验证是否为 Bearer 方案
    if (/^Bearer$/i.test(scheme)) {
      return token;
    }

    // 兼容旧版：直接使用 token
    return authHeader;
  }

  // 格式: <token> (兼容旧版)
  if (parts.length === 1) {
    return authHeader;
  }

  return null;
}

/**
 * 验证 JWT Token
 *
 * @description
 * 使用 jsonwebtoken 库验证 token 的有效性
 * 包括：签名验证、过期时间检查、格式验证等
 *
 * @param {string} token - JWT Token 字符串
 * @returns {Promise<Object>} 解码后的载荷数据
 * @throws {Error} 如果 Token 无效则抛出错误
 */
function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      config.jwt.secret,
      {
        issuer: config.jwt.issuer,
        algorithms: [config.jwt.algorithm],
      },
      (err, decoded) => {
        if (err) {
          // 根据错误类型返回不同的错误消息
          if (err.name === 'TokenExpiredError') {
            reject(new Error(ERROR_MESSAGES.TOKEN_EXPIRED));
          } else if (err.name === 'JsonWebTokenError') {
            reject(new Error(ERROR_MESSAGES.TOKEN_INVALID));
          } else if (err.name === 'NotBeforeError') {
            reject(new Error(ERROR_MESSAGES.TOKEN_INVALID));
          } else {
            reject(new Error(ERROR_MESSAGES.TOKEN_INVALID));
          }
        } else {
          resolve(decoded);
        }
      }
    );
  });
}

/**
 * 格式化错误响应
 *
 * @description
 * 统一处理认证错误，返回标准化的错误响应
 *
 * @param {Object} res - Express 响应对象
 * @param {number} statusCode - HTTP 状态码
 * @param {string} message - 错误消息
 * @param {string} [code] - 错误代码 (可选)
 */
function sendError(res, statusCode, message, code = 'AUTH_ERROR') {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

/**
 * 检查用户是否拥有所需权限
 *
 * @description
 * 根据用户的角色和权限列表，检查是否拥有所需的权限
 * 支持多个权限的 AND 和 OR 逻辑
 *
 * @param {Object} user - 用户对象
 * @param {string|string[]} permissions - 需要的权限（可以是单个权限或权限数组）
 * @param {string} [mode='OR'] - 权限检查模式：'OR' (满足任一) 或 'AND' (满足全部)
 * @returns {boolean} 是否拥有权限
 */
function hasPermission(user, permissions, mode = 'OR') {
  // 如果用户没有权限信息，返回 false
  if (!user || !user.permissions) {
    return false;
  }

  // 用户权限列表
  const userPermissions = user.permissions || [];

  // 如果是超级管理员，拥有所有权限
  if (user.role === 'super_admin' || userPermissions.includes('*')) {
    return true;
  }

  // 处理权限参数
  const requiredPermissions = Array.isArray(permissions)
    ? permissions
    : [permissions];

  // 根据模式检查权限
  if (mode === 'AND') {
    // AND 模式：需要拥有所有权限
    return requiredPermissions.every((perm) =>
      userPermissions.some(
        (userPerm) =>
          userPerm === perm ||
          userPerm === '*' ||
          matchPermissionPattern(userPerm, perm)
      )
    );
  } else {
    // OR 模式：拥有任一权限即可
    return requiredPermissions.some((perm) =>
      userPermissions.some(
        (userPerm) =>
          userPerm === perm ||
          userPerm === '*' ||
          matchPermissionPattern(userPerm, perm)
      )
    );
  }
}

/**
 * 匹配权限模式
 *
 * @description
 * 支持通配符匹配，例如：
 * - 'user:*' 可以匹配 'user:create', 'user:read', 'user:update', 'user:delete'
 * - '*:read' 可以匹配 'user:read', 'role:read', 'device:read'
 *
 * @param {string} pattern - 权限模式（可能包含通配符）
 * @param {string} permission - 实际权限
 * @returns {boolean} 是否匹配
 */
function matchPermissionPattern(pattern, permission) {
  // 将通配符模式转换为正则表达式
  const regexPattern = pattern
    .replace(/\*/g, '.*') // * 匹配任意字符
    .replace(/:/g, '\\:'); // 转义冒号

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(permission);
}

/**
 * 检查用户是否拥有所需角色
 *
 * @description
 * 验证用户角色是否在允许的角色列表中
 *
 * @param {Object} user - 用户对象
 * @param {string|string[]} roles - 允许的角色（可以是单个角色或角色数组）
 * @returns {boolean} 是否拥有角色
 */
function hasRole(user, roles) {
  if (!user || !user.role) {
    return false;
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return allowedRoles.includes(user.role);
}

// =====================================================
// 中间件函数
// =====================================================

/**
 * 认证中间件 - 验证 JWT Token
 *
 * @description
 * 主要功能：
 * 1. 从请求头中提取 Token
 * 2. 验证 Token 的有效性
 * 3. 解码 Token 获取用户信息
 * 4. 将用户信息挂载到 req.user
 *
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - 下一个中间件函数
 */
async function authMiddleware(req, res, next) {
  try {
    // 1. 提取 Token
    const token = extractToken(req);

    if (!token) {
      logger.warn('认证失败: 未提供 Token', {
        ip: req.ip,
        path: req.path,
        method: req.method,
      });
      return sendError(res, 401, ERROR_MESSAGES.NO_TOKEN, 'NO_TOKEN');
    }

    // 2. 验证 Token
    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch (verifyError) {
      logger.warn('Token 验证失败', {
        error: verifyError.message,
        ip: req.ip,
        path: req.path,
      });
      return sendError(res, 401, verifyError.message, 'TOKEN_INVALID');
    }

    // 3. 检查用户是否存在且有效
    // 注意：这里需要从数据库获取最新的用户信息
    // 由于中间件层不应直接依赖模型，我们只做基本的验证
    // 更详细的用户验证应在路由处理层进行

    // 检查 Token 中的必要字段
    if (!decoded.userId && !decoded.id && !decoded.sub) {
      logger.warn('Token 缺少用户标识字段', { decoded });
      return sendError(res, 401, ERROR_MESSAGES.TOKEN_MALFORMED, 'TOKEN_MALFORMED');
    }

    // 4. 构建用户对象并挂载到请求
    req.user = {
      id: decoded.userId || decoded.id || decoded.sub,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
      // 保留完整的解码信息，供后续使用
      _tokenPayload: decoded,
    };

    // 5. 记录认证成功日志（调试级别）
    logger.debug('用户认证成功', {
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      ip: req.ip,
    });

    next();
  } catch (error) {
    // 捕获未预期的错误
    logger.error('认证中间件发生未知错误', {
      error: error.message,
      stack: error.stack,
    });
    return sendError(res, 500, ERROR_MESSAGES.INTERNAL_ERROR, 'INTERNAL_ERROR');
  }
}

/**
 * 可选认证中间件
 *
 * @description
 * 与 authMiddleware 类似，但允许无 Token 的情况
 * 如果提供了 Token，则验证并挂载用户信息
 * 如果没有提供 Token，则继续执行后续中间件
 *
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - 下一个中间件函数
 */
async function optionalAuthMiddleware(req, res, next) {
  try {
    const token = extractToken(req);

    // 没有 Token 时，直接放行
    if (!token) {
      req.user = null;
      return next();
    }

    // 有 Token 时，进行验证
    try {
      const decoded = await verifyToken(token);

      req.user = {
        id: decoded.userId || decoded.id || decoded.sub,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions || [],
        _tokenPayload: decoded,
      };
    } catch (verifyError) {
      // Token 无效时，设为 null 但不阻止请求
      req.user = null;
      logger.warn('可选认证: Token 无效', { error: verifyError.message });
    }

    next();
  } catch (error) {
    logger.error('可选认证中间件发生错误', { error: error.message });
    req.user = null;
    next();
  }
}

/**
 * 角色验证中间件
 *
 * @description
 * 检查用户是否拥有指定的角色
 * 支持单个角色或多个角色（满足任一即可）
 *
 * @param {string|string[]} roles - 允许的角色
 * @returns {Function} Express 中间件函数
 *
 * @example
 * // 单个角色
 * router.get('/admin', requireRole('admin'), handler);
 *
 * // 多个角色（满足任一即可）
 * router.get('/manage', requireRole(['admin', 'operator']), handler);
 */
function requireRole(roles) {
  return (req, res, next) => {
    // 确保已通过认证中间件
    if (!req.user) {
      logger.warn('角色验证失败: 用户未认证');
      return sendError(res, 401, ERROR_MESSAGES.NO_TOKEN, 'NO_TOKEN');
    }

    // 检查角色
    if (!hasRole(req.user, roles)) {
      logger.warn('角色验证失败', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
      });
      return sendError(res, 403, ERROR_MESSAGES.ROLE_REQUIRED, 'ROLE_REQUIRED');
    }

    next();
  };
}

/**
 * 权限验证中间件
 *
 * @description
 * 检查用户是否拥有指定的权限
 * 支持单个权限或多个权限，可配置检查模式
 *
 * @param {string|string[]} permissions - 需要的权限
 * @param {string} [mode='OR'] - 检查模式：'OR' (满足任一) 或 'AND' (满足全部)
 * @returns {Function} Express 中间件函数
 *
 * @example
 * // 单个权限
 * router.post('/users', requirePermission('user:create'), handler);
 *
 * // 多个权限（满足任一即可）
 * router.get('/data', requirePermission(['data:read', 'data:export']), handler);
 *
 * // 多个权限（必须全部满足）
 * router.put('/settings', requirePermission(['settings:read', 'settings:write'], 'AND'), handler);
 */
function requirePermission(permissions, mode = 'OR') {
  return (req, res, next) => {
    // 确保已通过认证中间件
    if (!req.user) {
      logger.warn('权限验证失败: 用户未认证');
      return sendError(res, 401, ERROR_MESSAGES.NO_TOKEN, 'NO_TOKEN');
    }

    // 检查权限
    if (!hasPermission(req.user, permissions, mode)) {
      logger.warn('权限验证失败', {
        userId: req.user.id,
        userPermissions: req.user.permissions,
        requiredPermissions: permissions,
        mode,
      });
      return sendError(res, 403, ERROR_MESSAGES.NO_PERMISSION, 'NO_PERMISSION');
    }

    next();
  };
}

/**
 * 管理员权限验证中间件
 *
 * @description
 * 快捷方法，验证用户是否为管理员或超级管理员
 *
 * @returns {Function} Express 中间件函数
 */
function requireAdmin() {
  return requireRole(['admin', 'super_admin']);
}

/**
 * 超级管理员权限验证中间件
 *
 * @description
 * 快捷方法，验证用户是否为超级管理员
 * 超级管理员拥有系统的最高权限
 *
 * @returns {Function} Express 中间件函数
 */
function requireSuperAdmin() {
  return requireRole('super_admin');
}

/**
 * 组合认证中间件
 *
 * @description
 * 同时进行认证和角色验证，简化中间件链
 *
 * @param {string|string[]} roles - 允许的角色
 * @returns {Function[]} Express 中间件数组
 *
 * @example
 * router.get('/admin', authWithRole('admin'), handler);
 */
function authWithRole(roles) {
  return [authMiddleware, requireRole(roles)];
}

/**
 * 组合认证中间件（权限版本）
 *
 * @description
 * 同时进行认证和权限验证，简化中间件链
 *
 * @param {string|string[]} permissions - 需要的权限
 * @param {string} [mode='OR'] - 检查模式
 * @returns {Function[]} Express 中间件数组
 *
 * @example
 * router.post('/users', authWithPermission('user:create'), handler);
 */
function authWithPermission(permissions, mode = 'OR') {
  return [authMiddleware, requirePermission(permissions, mode)];
}

/**
 * 资源所有权验证中间件工厂
 *
 * @description
 * 验证当前用户是否有权访问指定资源
 * 通常用于验证用户是否为资源的创建者或拥有者
 *
 * @param {Function} getResourceUserId - 获取资源所属用户ID的函数
 * @returns {Function} Express 中间件函数
 *
 * @example
 * router.delete('/posts/:id', requireOwnership(async (req) => {
 *   const post = await Post.findByPk(req.params.id);
 *   return post?.authorId;
 * }), handler);
 */
function requireOwnership(getResourceUserId) {
  return async (req, res, next) => {
    try {
      // 确保已通过认证中间件
      if (!req.user) {
        return sendError(res, 401, ERROR_MESSAGES.NO_TOKEN, 'NO_TOKEN');
      }

      // 获取资源所属用户ID
      const resourceUserId = await getResourceUserId(req);

      // 如果资源不存在，返回 404
      if (resourceUserId === null || resourceUserId === undefined) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: '请求的资源不存在',
          },
        });
      }

      // 检查所有权
      // 超级管理员和管理员可以访问所有资源
      const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
      const isOwner = String(resourceUserId) === String(req.user.id);

      if (!isAdmin && !isOwner) {
        logger.warn('资源所有权验证失败', {
          userId: req.user.id,
          resourceUserId,
          userRole: req.user.role,
        });
        return sendError(res, 403, ERROR_MESSAGES.NO_PERMISSION, 'NO_PERMISSION');
      }

      next();
    } catch (error) {
      logger.error('所有权验证中间件发生错误', {
        error: error.message,
        stack: error.stack,
      });
      return sendError(res, 500, ERROR_MESSAGES.INTERNAL_ERROR, 'INTERNAL_ERROR');
    }
  };
}

/**
 * 自定义权限验证中间件
 *
 * @description
 * 允许使用自定义验证函数进行权限检查
 * 适用于复杂的权限验证场景
 *
 * @param {Function} checkFn - 自定义验证函数，接收 (req, user) 参数，返回 boolean 或 Promise<boolean>
 * @returns {Function} Express 中间件函数
 *
 * @example
 * router.get('/special', requireCustom(async (req, user) => {
 *   // 自定义验证逻辑
 *   const department = await getDepartment(user.departmentId);
 *   return department.hasSpecialAccess;
 * }), handler);
 */
function requireCustom(checkFn) {
  return async (req, res, next) => {
    try {
      // 确保已通过认证中间件
      if (!req.user) {
        return sendError(res, 401, ERROR_MESSAGES.NO_TOKEN, 'NO_TOKEN');
      }

      // 执行自定义验证
      const hasAccess = await checkFn(req, req.user);

      if (!hasAccess) {
        logger.warn('自定义权限验证失败', {
          userId: req.user.id,
          path: req.path,
        });
        return sendError(res, 403, ERROR_MESSAGES.NO_PERMISSION, 'NO_PERMISSION');
      }

      next();
    } catch (error) {
      logger.error('自定义权限验证中间件发生错误', {
        error: error.message,
        stack: error.stack,
      });
      return sendError(res, 500, ERROR_MESSAGES.INTERNAL_ERROR, 'INTERNAL_ERROR');
    }
  };
}

/**
 * Token 刷新验证中间件
 *
 * @description
 * 用于验证刷新 Token 的请求
 * 检查 Token 是否为刷新 Token 类型
 *
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - 下一个中间件函数
 */
async function refreshTokenMiddleware(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      return sendError(res, 401, ERROR_MESSAGES.NO_TOKEN, 'NO_TOKEN');
    }

    // 验证 Token
    const decoded = await verifyToken(token);

    // 检查是否为刷新 Token
    // 通常刷新 Token 会在载荷中标记 type 字段
    if (decoded.type !== 'refresh') {
      logger.warn('尝试使用访问 Token 进行刷新', {
        userId: decoded.userId || decoded.id,
      });
      return sendError(res, 400, '请使用刷新 Token', 'INVALID_TOKEN_TYPE');
    }

    // 挂载用户信息
    req.user = {
      id: decoded.userId || decoded.id || decoded.sub,
      username: decoded.username,
      role: decoded.role,
      permissions: decoded.permissions || [],
      _tokenPayload: decoded,
    };

    next();
  } catch (error) {
    logger.error('刷新 Token 验证失败', { error: error.message });
    return sendError(res, 401, error.message, 'TOKEN_INVALID');
  }
}

/**
 * IP 白名单验证中间件
 *
 * @description
 * 检查请求 IP 是否在白名单中
 * 通常用于限制特定接口的访问来源
 *
 * @param {string[]} allowedIPs - 允许的 IP 列表
 * @returns {Function} Express 中间件函数
 */
function requireIPWhitelist(allowedIPs) {
  return (req, res, next) => {
    // 获取客户端 IP
    const clientIP = req.ip || req.connection.remoteAddress;

    // 检查是否在白名单中
    const isAllowed = allowedIPs.some((allowedIP) => {
      // 支持通配符匹配
      if (allowedIP.includes('*')) {
        const pattern = allowedIP.replace(/\./g, '\\.').replace(/\*/g, '.*');
        return new RegExp(`^${pattern}$`).test(clientIP);
      }
      return allowedIP === clientIP;
    });

    if (!isAllowed) {
      logger.warn('IP 白名单验证失败', {
        clientIP,
        allowedIPs,
        path: req.path,
      });
      return res.status(403).json({
        success: false,
        error: {
          code: 'IP_NOT_ALLOWED',
          message: '您的 IP 地址不在允许列表中',
        },
      });
    }

    next();
  };
}

/**
 * 验证用户状态中间件
 *
 * @description
 * 在认证通过后，进一步验证用户的状态
 * 检查用户是否被禁用、是否已验证邮箱等
 * 注意：需要配合数据库查询使用，此中间件仅做基础验证
 *
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - 下一个中间件函数
 */
function validateUserStatus(req, res, next) {
  // 确保已通过认证中间件
  if (!req.user) {
    return sendError(res, 401, ERROR_MESSAGES.NO_TOKEN, 'NO_TOKEN');
  }

  // 检查用户状态（从 Token 载荷中）
  const payload = req.user._tokenPayload || {};

  // 检查是否被禁用
  if (payload.status === 'disabled' || payload.isActive === false) {
    logger.warn('用户已被禁用', { userId: req.user.id });
    return sendError(res, 403, ERROR_MESSAGES.USER_DISABLED, 'USER_DISABLED');
  }

  // 如果系统要求邮箱验证，检查验证状态
  if (config.security.requireEmailVerification && !payload.emailVerified) {
    logger.warn('用户邮箱未验证', { userId: req.user.id });
    return sendError(res, 403, ERROR_MESSAGES.USER_NOT_VERIFIED, 'USER_NOT_VERIFIED');
  }

  next();
}

// =====================================================
// 导出模块
// =====================================================

Object.assign(authMiddleware, {
  // 主要认证中间件
  authenticate: authMiddleware,
  optionalAuth: optionalAuthMiddleware,

  // 别名（便于理解和使用）
  authMiddleware,
  optionalAuthMiddleware,

  // 角色验证
  requireRole,
  requireAdmin,
  requireSuperAdmin,

  // 权限验证
  requirePermission,

  // 组合中间件
  authWithRole,
  authWithPermission,

  // 资源所有权验证
  requireOwnership,

  // 自定义验证
  requireCustom,

  // Token 刷新
  refreshTokenMiddleware,

  // IP 白名单
  requireIPWhitelist,

  // 用户状态验证
  validateUserStatus,

  // 辅助函数（供外部使用）
  hasPermission,
  hasRole,
  extractToken,
  verifyToken,

  // 错误消息（供外部使用）
  ERROR_MESSAGES,
});

module.exports = authMiddleware;
