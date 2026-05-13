/**
 * 垃圾储坑智能化管控系统 - 请求频率限制中间件
 *
 * 该文件负责：
 * 1. 防止 API 被恶意滥用和 DDoS 攻击
 * 2. 提供全局限流和特定路由限流功能
 * 3. 登录接口单独限流，防止暴力破解
 * 4. 支持可配置的时间窗口和最大请求数
 * 5. 提供友好的限流提示信息
 *
 * @module middlewares/rateLimit.middleware
 * @author 华工三峰
 */

'use strict';

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// =====================================================
// 限流配置常量
// =====================================================

/**
 * 默认限流配置
 *
 * @description
 * - windowMs: 时间窗口（毫秒）
 * - max: 在时间窗口内允许的最大请求数
 * - message: 超过限制时的错误消息
 */
const DEFAULT_CONFIG = {
  // 全局限流配置：15分钟内最多100个请求
  global: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 每个IP最多100个请求
    message: '请求过于频繁，请稍后再试',
  },

  // 登录接口限流配置：15分钟内最多5次尝试
  login: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 5, // 每个IP最多5次登录尝试
    message: '登录尝试次数过多，请15分钟后再试',
  },

  // API接口限流配置：1分钟内最多60个请求
  api: {
    windowMs: 60 * 1000, // 1分钟
    max: 60, // 每个IP最多60个请求
    message: 'API请求过于频繁，请稍后再试',
  },

  // 敏感操作限流配置：1小时内最多10次
  sensitive: {
    windowMs: 60 * 60 * 1000, // 1小时
    max: 10, // 每个IP最多10次操作
    message: '敏感操作次数过多，请1小时后再试',
  },

  // 文件上传限流配置：1小时内最多20次
  upload: {
    windowMs: 60 * 60 * 1000, // 1小时
    max: 20, // 每个IP最多20次上传
    message: '文件上传次数过多，请稍后再试',
  },

  // 密码重置限流配置：1小时内最多3次
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1小时
    max: 3, // 每个IP最多3次重置请求
    message: '密码重置请求过多，请1小时后再试',
  },
};

/**
 * 限流错误代码
 */
const RATE_LIMIT_CODES = {
  GLOBAL_LIMIT: 'GLOBAL_RATE_LIMIT_EXCEEDED',
  LOGIN_LIMIT: 'LOGIN_RATE_LIMIT_EXCEEDED',
  API_LIMIT: 'API_RATE_LIMIT_EXCEEDED',
  SENSITIVE_LIMIT: 'SENSITIVE_RATE_LIMIT_EXCEEDED',
  UPLOAD_LIMIT: 'UPLOAD_RATE_LIMIT_EXCEEDED',
  PASSWORD_RESET_LIMIT: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
  CUSTOM_LIMIT: 'CUSTOM_RATE_LIMIT_EXCEEDED',
};

// =====================================================
// 辅助函数
// =====================================================

/**
 * 获取客户端真实IP地址
 *
 * @description
 * 考虑代理和负载均衡的情况，获取真实的客户端IP
 * 支持多种代理头的解析
 *
 * @param {Object} req - Express 请求对象
 * @returns {string} 客户端IP地址
 */
function getClientIP(req) {
  // 尝试从不同的头部获取真实IP
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For 可能包含多个IP，取第一个
    return forwarded.split(',')[0].trim();
  }

  // 尝试其他常见的代理头
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }

  // 使用 Express 提供的 IP
  return req.ip || req.connection.remoteAddress || 'unknown';
}

/**
 * 生成限流键
 *
 * @description
 * 根据请求信息生成唯一的限流键
 * 可以基于IP、用户ID或自定义规则
 *
 * @param {Object} req - Express 请求对象
 * @param {string} [keyType='ip'] - 键类型：'ip', 'user', 'ip+path'
 * @returns {string} 限流键
 */
function generateKey(req, keyType = 'ip') {
  const ip = getClientIP(req);
  const path = req.path;

  switch (keyType) {
    case 'user':
      // 基于用户ID限流（适用于已登录用户）
      return req.user ? `user_${req.user.id}` : `ip_${ip}`;

    case 'ip+path':
      // 基于IP和路径限流
      return `${ip}_${path}`;

    case 'ip':
    default:
      // 基于IP限流
      return ip;
  }
}

/**
 * 创建标准化的限流响应
 *
 * @description
 * 当请求超过限流时，返回统一的错误响应格式
 *
 * @param {Object} options - 响应选项
 * @param {string} options.message - 错误消息
 * @param {string} options.code - 错误代码
 * @param {number} options.retryAfter - 重试等待时间（秒）
 * @returns {Object} 响应对象
 */
function createLimitResponse(options) {
  const { message, code, retryAfter } = options;

  return {
    success: false,
    error: {
      code,
      message,
      retryAfter: Math.ceil(retryAfter / 1000), // 转换为秒
    },
  };
}

/**
 * 限流事件处理器
 *
 * @description
 * 当触发限流时，记录日志并执行其他操作
 *
 * @param {Object} req - Express 请求对象
 * @param {string} limitType - 限流类型
 * @param {Object} limitInfo - 限流信息
 */
function handleLimitReached(req, limitType, limitInfo) {
  const ip = getClientIP(req);
  const { current, limit, remainingTime } = limitInfo;

  logger.warn(`请求频率限制触发: ${limitType}`, {
    ip,
    path: req.path,
    method: req.method,
    current,
    limit,
    limitType,
    remainingTime,
    userAgent: req.headers['user-agent'],
  });

  // 可以在这里添加其他操作，如发送告警通知
}

// =====================================================
// 限流中间件工厂函数
// =====================================================

/**
 * 创建自定义限流中间件
 *
 * @description
 * 通用的限流中间件工厂函数，支持自定义配置
 *
 * @param {Object} options - 限流配置选项
 * @param {number} [options.windowMs=60000] - 时间窗口（毫秒）
 * @param {number} [options.max=100] - 最大请求数
 * @param {string} [options.message] - 超过限制时的错误消息
 * @param {string} [options.code] - 错误代码
 * @param {string} [options.keyType='ip'] - 键类型：'ip', 'user', 'ip+path'
 * @param {boolean} [options.skipFailedRequests=false] - 是否跳过失败的请求
 * @param {boolean} [options.skipSuccessfulRequests=false] - 是否跳过成功的请求
 * @param {Function} [options.keyGenerator] - 自定义键生成函数
 * @param {Function} [options.handler] - 自定义处理函数
 * @param {Function} [options.skip] - 跳过限流的条件函数
 * @returns {Function} Express 中间件函数
 *
 * @example
 * // 创建自定义限流中间件
 * const customLimiter = createRateLimiter({
 *   windowMs: 5 * 60 * 1000, // 5分钟
 *   max: 50,
 *   message: '自定义限流消息',
 *   keyType: 'user'
 * });
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = DEFAULT_CONFIG.global.windowMs,
    max = DEFAULT_CONFIG.global.max,
    message = DEFAULT_CONFIG.global.message,
    code = RATE_LIMIT_CODES.CUSTOM_LIMIT,
    keyType = 'ip',
    skipFailedRequests = false,
    skipSuccessfulRequests = false,
    keyGenerator,
    handler,
    skip,
  } = options;

  // 创建 express-rate-limit 实例
  const limiter = rateLimit({
    // 时间窗口（毫秒）
    windowMs,

    // 最大请求数
    max,

    // 响应状态码
    statusCode: 429,

    // 响应消息
    message: createLimitResponse({
      message,
      code,
      retryAfter: windowMs,
    }),

    // 是否跳过失败的请求（4xx/5xx响应）
    skipFailedRequests,

    // 是否跳过成功的请求
    skipSuccessfulRequests,

    // 键生成器
    keyGenerator: keyGenerator || ((req) => generateKey(req, keyType)),

    // 自定义处理函数
    handler:
      handler ||
      ((req, res) => {
        // 记录限流日志
        handleLimitReached(req, code, {
          current: res.getHeader('X-RateLimit-Limit'),
          limit: max,
          remainingTime: windowMs,
        });

        // 返回错误响应
        res.status(429).json(
          createLimitResponse({
            message,
            code,
            retryAfter: windowMs,
          })
        );
      }),

    // 跳过条件
    skip: skip || (() => false),

    // 添加响应头
    headers: true,

  });

  return limiter;
}

// =====================================================
// 预定义的限流中间件
// =====================================================

/**
 * 全局限流中间件
 *
 * @description
 * 应用于所有路由的全局限流
 * 默认：15分钟内每个IP最多100个请求
 *
 * 建议在 app.js 中作为全局中间件使用
 *
 * @example
 * // 在 app.js 中使用
 * app.use(rateLimitMiddleware.global);
 */
const globalLimiter = createRateLimiter({
  windowMs: DEFAULT_CONFIG.global.windowMs,
  max: DEFAULT_CONFIG.global.max,
  message: DEFAULT_CONFIG.global.message,
  code: RATE_LIMIT_CODES.GLOBAL_LIMIT,
});

/**
 * 登录接口限流中间件
 *
 * @description
 * 专门用于登录接口的限流，防止暴力破解
 * 默认：15分钟内每个IP最多5次登录尝试
 *
 * @example
 * // 在登录路由中使用
 * router.post('/login', rateLimitMiddleware.login, loginController);
 */
const loginLimiter = createRateLimiter({
  windowMs: DEFAULT_CONFIG.login.windowMs,
  max: DEFAULT_CONFIG.login.max,
  message: DEFAULT_CONFIG.login.message,
  code: RATE_LIMIT_CODES.LOGIN_LIMIT,
  // 登录失败不计入限流（可选）
  skipFailedRequests: false,
});

/**
 * API接口限流中间件
 *
 * @description
 * 用于一般API接口的限流
 * 默认：1分钟内每个IP最多60个请求
 *
 * @example
 * // 在API路由中使用
 * router.use('/api', rateLimitMiddleware.api);
 */
const apiLimiter = createRateLimiter({
  windowMs: DEFAULT_CONFIG.api.windowMs,
  max: DEFAULT_CONFIG.api.max,
  message: DEFAULT_CONFIG.api.message,
  code: RATE_LIMIT_CODES.API_LIMIT,
});

/**
 * 敏感操作限流中间件
 *
 * @description
 * 用于敏感操作（如删除、修改关键配置等）的限流
 * 默认：1小时内每个IP最多10次操作
 *
 * @example
 * // 在敏感操作路由中使用
 * router.delete('/users/:id', rateLimitMiddleware.sensitive, deleteUserController);
 */
const sensitiveLimiter = createRateLimiter({
  windowMs: DEFAULT_CONFIG.sensitive.windowMs,
  max: DEFAULT_CONFIG.sensitive.max,
  message: DEFAULT_CONFIG.sensitive.message,
  code: RATE_LIMIT_CODES.SENSITIVE_LIMIT,
});

/**
 * 文件上传限流中间件
 *
 * @description
 * 用于文件上传接口的限流
 * 默认：1小时内每个IP最多20次上传
 *
 * @example
 * // 在上传路由中使用
 * router.post('/upload', rateLimitMiddleware.upload, uploadController);
 */
const uploadLimiter = createRateLimiter({
  windowMs: DEFAULT_CONFIG.upload.windowMs,
  max: DEFAULT_CONFIG.upload.max,
  message: DEFAULT_CONFIG.upload.message,
  code: RATE_LIMIT_CODES.UPLOAD_LIMIT,
});

/**
 * 密码重置限流中间件
 *
 * @description
 * 用于密码重置接口的限流，防止滥用
 * 默认：1小时内每个IP最多3次重置请求
 *
 * @example
 * // 在密码重置路由中使用
 * router.post('/password/reset', rateLimitMiddleware.passwordReset, resetController);
 */
const passwordResetLimiter = createRateLimiter({
  windowMs: DEFAULT_CONFIG.passwordReset.windowMs,
  max: DEFAULT_CONFIG.passwordReset.max,
  message: DEFAULT_CONFIG.passwordReset.message,
  code: RATE_LIMIT_CODES.PASSWORD_RESET_LIMIT,
});

// =====================================================
// 特殊用途的限流中间件
// =====================================================

/**
 * 基于用户ID的限流中间件
 *
 * @description
 * 对已登录用户进行限流，基于用户ID而非IP
 * 适用于需要控制用户操作频率的场景
 *
 * @example
 * // 在需要用户认证的路由中使用
 * router.post('/comments', auth, rateLimitMiddleware.byUser(10, 60000), createComment);
 */
function createUserLimiter(max = 50, windowMs = 60000) {
  return createRateLimiter({
    windowMs,
    max,
    message: '您的操作过于频繁，请稍后再试',
    code: RATE_LIMIT_CODES.CUSTOM_LIMIT,
    keyType: 'user',
    // 如果用户未登录，回退到IP限流
    keyGenerator: (req) => {
      if (req.user && req.user.id) {
        return `user_${req.user.id}`;
      }
      return `ip_${getClientIP(req)}`;
    },
  });
}

/**
 * 基于路径的限流中间件
 *
 * @description
 * 对特定路径进行限流，每个路径独立计数
 * 适用于需要按路径分别限制的场景
 *
 * @example
 * // 在特定路由组中使用
 * router.use('/api/data', rateLimitMiddleware.byPath(30, 60000));
 */
function createPathLimiter(max = 30, windowMs = 60000) {
  return createRateLimiter({
    windowMs,
    max,
    message: '该接口请求过于频繁，请稍后再试',
    code: RATE_LIMIT_CODES.CUSTOM_LIMIT,
    keyType: 'ip+path',
  });
}

/**
 * 渐进式限流中间件
 *
 * @description
 * 当触发限流时，逐渐增加限制时间
 * 适用于需要更严格惩罚重复违规者的场景
 *
 * @example
 * // 在需要防刷的路由中使用
 * router.use(rateLimitMiddleware.progressive());
 */
function createProgressiveLimiter(baseWindowMs = 60000, baseMax = 10) {
  // 存储每个键的违规次数
  const violationCount = new Map();

  return createRateLimiter({
    windowMs: baseWindowMs,
    max: baseMax,
    code: RATE_LIMIT_CODES.CUSTOM_LIMIT,
    message: '请求过于频繁，限制时间已延长',
    keyGenerator: (req) => getClientIP(req),
    handler: (req, res, next, options) => {
      const ip = getClientIP(req);
      const violations = violationCount.get(ip) || 0;

      // 增加违规次数
      violationCount.set(ip, violations + 1);

      // 根据违规次数延长限制时间
      const extendedWindow = baseWindowMs * Math.pow(2, violations);
      const maxExtended = 24 * 60 * 60 * 1000; // 最长24小时
      const actualWindow = Math.min(extendedWindow, maxExtended);

      handleLimitReached(req, 'PROGRESSIVE_LIMIT', {
        current: violations + 1,
        limit: baseMax,
        remainingTime: actualWindow,
      });

      res.status(429).json(
        createLimitResponse({
          message: `请求过于频繁，请在 ${Math.ceil(actualWindow / 60000)} 分钟后再试`,
          code: RATE_LIMIT_CODES.CUSTOM_LIMIT,
          retryAfter: actualWindow,
        })
      );
    },
    skip: (req) => {
      // 在时间窗口过后重置违规计数
      const ip = getClientIP(req);
      setTimeout(() => {
        violationCount.delete(ip);
      }, baseWindowMs);
      return false;
    },
  });
}

/**
 * 白名单限流中间件
 *
 * @description
 * 允许特定IP跳过限流的中间件
 * 适用于内部服务或信任的IP
 *
 * @param {string[]} whitelistedIPs - 白名单IP列表
 * @param {Object} limitConfig - 限流配置
 * @returns {Function} Express 中间件函数
 *
 * @example
 * // 允许内网IP跳过限流
 * router.use(rateLimitMiddleware.withWhitelist(
 *   ['192.168.0.0/16', '10.0.0.0/8'],
 *   { max: 100, windowMs: 60000 }
 * ));
 */
function createWhitelistLimiter(whitelistedIPs = [], limitConfig = {}) {
  return createRateLimiter({
    windowMs: limitConfig.windowMs || DEFAULT_CONFIG.api.windowMs,
    max: limitConfig.max || DEFAULT_CONFIG.api.max,
    message: limitConfig.message || DEFAULT_CONFIG.api.message,
    code: RATE_LIMIT_CODES.API_LIMIT,
    skip: (req) => {
      const ip = getClientIP(req);

      // 检查IP是否在白名单中
      return whitelistedIPs.some((allowedIP) => {
        // 支持简单的通配符匹配
        if (allowedIP.includes('*')) {
          const pattern = allowedIP
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*');
          return new RegExp(`^${pattern}$`).test(ip);
        }

        // 支持CIDR表示法（简单实现）
        if (allowedIP.includes('/')) {
          // 简化的CIDR匹配，实际应用中应使用专门的库
          const [network, bits] = allowedIP.split('/');
          const networkParts = network.split('.').map(Number);
          const ipParts = ip.split('.').map(Number);
          const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1);

          const networkNum =
            (networkParts[0] << 24) +
            (networkParts[1] << 16) +
            (networkParts[2] << 8) +
            networkParts[3];
          const ipNum =
            (ipParts[0] << 24) +
            (ipParts[1] << 16) +
            (ipParts[2] << 8) +
            ipParts[3];

          return (networkNum & mask) === (ipNum & mask);
        }

        return allowedIP === ip;
      });
    },
  });
}

/**
 * 条件性限流中间件
 *
 * @description
 * 根据条件动态决定是否应用限流
 * 适用于需要根据请求内容判断的场景
 *
 * @param {Function} condition - 条件函数，返回 true 则应用限流
 * @param {Object} limitConfig - 限流配置
 * @returns {Function} Express 中间件函数
 *
 * @example
 * // 只对未认证用户应用限流
 * router.use(rateLimitMiddleware.conditional(
 *   (req) => !req.user,
 *   { max: 30, windowMs: 60000 }
 * ));
 */
function createConditionalLimiter(condition, limitConfig = {}) {
  return createRateLimiter({
    windowMs: limitConfig.windowMs || DEFAULT_CONFIG.api.windowMs,
    max: limitConfig.max || DEFAULT_CONFIG.api.max,
    message: limitConfig.message || DEFAULT_CONFIG.api.message,
    code: RATE_LIMIT_CODES.API_LIMIT,
    skip: (req) => {
      // 条件为 true 时应用限流，所以这里返回条件的否定
      return !condition(req);
    },
  });
}

// =====================================================
// 组合限流中间件
// =====================================================

/**
 * API路由组合限流
 *
 * @description
 * 同时应用全局限流和API限流
 * 用于API路由的保护
 *
 * @example
 * router.use('/api', rateLimitMiddleware.apiRoute);
 */
const apiRouteLimiter = [globalLimiter, apiLimiter];

/**
 * 认证路由组合限流
 *
 * @description
 * 专门用于认证相关路由的组合限流
 * 包括登录、注册等
 *
 * @example
 * router.use('/auth', rateLimitMiddleware.authRoute);
 */
const authRouteLimiter = [
  globalLimiter,
  createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1小时
    max: 20, // 认证相关接口限制更严格
    message: '认证请求过于频繁，请稍后再试',
    code: RATE_LIMIT_CODES.API_LIMIT,
  }),
];

// =====================================================
// 导出模块
// =====================================================

module.exports = {
  // 预定义的限流中间件
  global: globalLimiter,
  login: loginLimiter,
  api: apiLimiter,
  sensitive: sensitiveLimiter,
  upload: uploadLimiter,
  passwordReset: passwordResetLimiter,

  // 组合限流中间件
  apiRoute: apiRouteLimiter,
  authRoute: authRouteLimiter,

  // 限流中间件工厂函数
  create: createRateLimiter,
  createUser: createUserLimiter,
  createPath: createPathLimiter,
  createProgressive: createProgressiveLimiter,
  createWhitelist: createWhitelistLimiter,
  createConditional: createConditionalLimiter,

  // 辅助函数
  getClientIP,
  generateKey,
  createLimitResponse,

  // 配置常量
  DEFAULT_CONFIG,
  RATE_LIMIT_CODES,
};
