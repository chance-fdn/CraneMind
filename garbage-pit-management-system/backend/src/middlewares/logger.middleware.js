/**
 * 垃圾储坑智能化管控系统 - 请求日志中间件
 *
 * 该文件负责：
 * 1. 记录所有 HTTP 请求的详细信息
 * 2. 记录请求方法、路径、参数
 * 3. 记录响应状态码、响应时间
 * 4. 支持排除某些路径（如健康检查）
 * 5. 使用 logger 工具统一记录日志
 *
 * @module middlewares/logger.middleware
 * @author 华工三峰
 */

'use strict';

const logger = require('../utils/logger');

// =====================================================
// 默认配置
// =====================================================

/**
 * 默认排除的路径列表
 * 这些路径的请求不会被记录，避免日志冗余
 */
const DEFAULT_EXCLUDED_PATHS = [
  '/health',           // 健康检查接口
  '/api/health',       // API 健康检查
  '/favicon.ico',      // 网站图标
  '/robots.txt',       // 爬虫配置
];

/**
 * 默认排除的路径前缀列表
 * 匹配这些前缀的路径不会被记录
 */
const DEFAULT_EXCLUDED_PREFIXES = [
  '/static/',          // 静态资源
  '/public/',          // 公共资源
  '/assets/',          // 前端资源
];

/**
 * 请求体最大记录长度
 * 超过此长度的请求体将被截断
 */
const MAX_BODY_LENGTH = 1000;

/**
 * 敏感字段列表
 * 这些字段的值将被脱敏处理（显示为 ***）
 */
const SENSITIVE_FIELDS = [
  'password',
  'passwd',
  'pwd',
  'confirmPassword',
  'oldPassword',
  'newPassword',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'apiSecret',
  'authorization',
];

// =====================================================
// 辅助函数
// =====================================================

/**
 * 检查路径是否应该被排除
 *
 * @description
 * 判断请求路径是否在排除列表中，避免记录不需要的日志
 *
 * @param {string} path - 请求路径
 * @param {string[]} excludedPaths - 排除的完整路径列表
 * @param {string[]} excludedPrefixes - 排除的路径前缀列表
 * @returns {boolean} 是否应该排除
 */
function shouldExcludePath(path, excludedPaths, excludedPrefixes) {
  // 检查完整路径匹配
  if (excludedPaths.includes(path)) {
    return true;
  }

  // 检查路径前缀匹配
  for (const prefix of excludedPrefixes) {
    if (path.startsWith(prefix)) {
      return true;
    }
  }

  return false;
}

/**
 * 脱敏处理敏感数据
 *
 * @description
 * 将敏感字段的值替换为 ***，保护用户隐私和系统安全
 *
 * @param {any} data - 需要脱敏的数据
 * @returns {any} 脱敏后的数据
 */
function sanitizeData(data) {
  // 处理 null 或 undefined
  if (data === null || data === undefined) {
    return data;
  }

  // 处理字符串（尝试解析 JSON）
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return JSON.stringify(sanitizeData(parsed));
    } catch {
      // 不是 JSON 字符串，直接返回
      return data;
    }
  }

  // 处理数组
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  // 处理对象
  if (typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      // 检查是否为敏感字段
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_FIELDS.some(field =>
        lowerKey.includes(field.toLowerCase())
      );

      if (isSensitive) {
        sanitized[key] = '***';
      } else if (typeof value === 'object' && value !== null) {
        // 递归处理嵌套对象
        sanitized[key] = sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return data;
}

/**
 * 截断过长的字符串
 *
 * @description
 * 当数据过长时进行截断，避免日志过于庞大
 *
 * @param {string} str - 需要截断的字符串
 * @param {number} maxLength - 最大长度
 * @returns {string} 截断后的字符串
 */
function truncateString(str, maxLength) {
  if (!str || str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength) + '... (已截断)';
}

/**
 * 格式化请求参数
 *
 * @description
 * 提取并格式化请求中的各种参数，包括查询参数、路径参数、请求体等
 *
 * @param {Object} req - Express 请求对象
 * @returns {Object} 格式化后的参数对象
 */
function formatRequestParams(req) {
  const params = {};

  // 查询参数 (Query Parameters)
  if (req.query && Object.keys(req.query).length > 0) {
    params.query = sanitizeData(req.query);
  }

  // 路径参数 (Route Parameters)
  if (req.params && Object.keys(req.params).length > 0) {
    params.params = sanitizeData(req.params);
  }

  // 请求体 (Request Body)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = sanitizeData(req.body);

    // 如果是对象，转换为 JSON 字符串并截断
    if (typeof sanitizedBody === 'object') {
      const bodyStr = JSON.stringify(sanitizedBody);
      params.body = truncateString(bodyStr, MAX_BODY_LENGTH);
    } else {
      params.body = truncateString(String(sanitizedBody), MAX_BODY_LENGTH);
    }
  }

  return params;
}

/**
 * 格式化响应信息
 *
 * @description
 * 提取并格式化响应的相关信息
 *
 * @param {Object} res - Express 响应对象
 * @returns {Object} 格式化后的响应信息
 */
function formatResponseInfo(res) {
  const info = {
    statusCode: res.statusCode,
    statusMessage: res.statusMessage || getStatusMessage(res.statusCode),
  };

  // 如果响应头中有内容类型，记录下来
  const contentType = res.getHeader('content-type');
  if (contentType) {
    info.contentType = contentType;
  }

  // 如果响应头中有内容长度，记录下来
  const contentLength = res.getHeader('content-length');
  if (contentLength) {
    info.contentLength = `${contentLength} bytes`;
  }

  return info;
}

/**
 * 根据状态码获取状态消息
 *
 * @description
 * 提供常见的 HTTP 状态码描述
 *
 * @param {number} statusCode - HTTP 状态码
 * @returns {string} 状态消息
 */
function getStatusMessage(statusCode) {
  const messages = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  };
  return messages[statusCode] || 'Unknown';
}

/**
 * 获取客户端 IP 地址
 *
 * @description
 * 从请求中获取真实的客户端 IP 地址
 * 支持代理服务器场景
 *
 * @param {Object} req - Express 请求对象
 * @returns {string} 客户端 IP 地址
 */
function getClientIP(req) {
  // 尝试从 X-Forwarded-For 头获取（代理场景）
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For 可能包含多个 IP，取第一个
    const ips = forwarded.split(',').map(ip => ip.trim());
    return ips[0];
  }

  // 尝试从 X-Real-IP 头获取（Nginx 常用）
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }

  // 使用 Express 默认的 ip 属性
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

/**
 * 获取日志级别
 *
 * @description
 * 根据响应状态码确定日志级别
 * - 2xx, 3xx: info
 * - 4xx: warn
 * - 5xx: error
 *
 * @param {number} statusCode - HTTP 状态码
 * @returns {string} 日志级别
 */
function getLogLevel(statusCode) {
  if (statusCode >= 500) {
    return 'error';
  } else if (statusCode >= 400) {
    return 'warn';
  }
  return 'info';
}

// =====================================================
// 中间件函数
// =====================================================

/**
 * 创建请求日志中间件
 *
 * @description
 * 创建一个可配置的请求日志中间件实例
 * 支持自定义排除路径、日志格式等
 *
 * @param {Object} [options] - 配置选项
 * @param {string[]} [options.excludedPaths] - 排除的完整路径列表
 * @param {string[]} [options.excludedPrefixes] - 排除的路径前缀列表
 * @param {boolean} [options.logRequestBody=true] - 是否记录请求体
 * @param {boolean} [options.logRequestQuery=true] - 是否记录查询参数
 * @param {boolean} [options.logResponseHeaders=false] - 是否记录响应头
 * @param {boolean} [options.logUserInfo=true] - 是否记录用户信息
 * @param {number} [options.slowRequestThreshold=1000] - 慢请求阈值（毫秒）
 * @returns {Function} Express 中间件函数
 *
 * @example
 * // 使用默认配置
 * app.use(createRequestLogger());
 *
 * // 自定义配置
 * app.use(createRequestLogger({
 *   excludedPaths: ['/health', '/metrics'],
 *   excludedPrefixes: ['/static/'],
 *   logRequestBody: true,
 *   slowRequestThreshold: 500
 * }));
 */
function createRequestLogger(options = {}) {
  // 合并默认配置和用户配置
  const config = {
    excludedPaths: [...DEFAULT_EXCLUDED_PATHS, ...(options.excludedPaths || [])],
    excludedPrefixes: [...DEFAULT_EXCLUDED_PREFIXES, ...(options.excludedPrefixes || [])],
    logRequestBody: options.logRequestBody !== false,
    logRequestQuery: options.logRequestQuery !== false,
    logResponseHeaders: options.logResponseHeaders || false,
    logUserInfo: options.logUserInfo !== false,
    slowRequestThreshold: options.slowRequestThreshold || 1000,
  };

  /**
   * 请求日志中间件
   *
   * @param {Object} req - Express 请求对象
   * @param {Object} res - Express 响应对象
   * @param {Function} next - 下一个中间件函数
   */
  return function requestLoggerMiddleware(req, res, next) {
    // 获取请求开始时间
    const startTime = Date.now();
    const startHRTime = process.hrtime();

    // 检查是否应该排除该路径
    if (shouldExcludePath(req.path, config.excludedPaths, config.excludedPrefixes)) {
      return next();
    }

    // 记录请求开始（调试级别）
    logger.debug(`请求开始: ${req.method} ${req.originalUrl || req.url}`, {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: getClientIP(req),
    });

    // 构建请求日志数据
    const requestData = {
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      referer: req.headers['referer'] || req.headers['referrer'] || '-',
      host: req.headers['host'] || 'unknown',
    };

    // 记录用户信息（如果已认证）
    if (config.logUserInfo && req.user) {
      requestData.user = {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
      };
    }

    // 记录查询参数
    if (config.logRequestQuery && req.query && Object.keys(req.query).length > 0) {
      requestData.query = sanitizeData(req.query);
    }

    // 记录请求体
    if (config.logRequestBody && req.body && Object.keys(req.body).length > 0) {
      const sanitizedBody = sanitizeData(req.body);
      const bodyStr = typeof sanitizedBody === 'object'
        ? JSON.stringify(sanitizedBody)
        : String(sanitizedBody);
      requestData.body = truncateString(bodyStr, MAX_BODY_LENGTH);
    }

    // 记录路径参数
    if (req.params && Object.keys(req.params).length > 0) {
      requestData.params = req.params;
    }

    // 监听响应完成事件
    res.on('finish', () => {
      // 计算响应时间（高精度）
      const hrTimeDiff = process.hrtime(startHRTime);
      const responseTimeMs = hrTimeDiff[0] * 1000 + hrTimeDiff[1] / 1000000;
      const responseTime = Math.round(responseTimeMs * 100) / 100; // 保留两位小数

      // 构建响应日志数据
      const logData = {
        ...requestData,
        statusCode: res.statusCode,
        statusMessage: res.statusMessage || getStatusMessage(res.statusCode),
        responseTime: `${responseTime}ms`,
      };

      // 记录响应头（如果配置了）
      if (config.logResponseHeaders) {
        const headers = {};
        const headerNames = ['content-type', 'content-length', 'cache-control'];
        headerNames.forEach(name => {
          const value = res.getHeader(name);
          if (value) {
            headers[name] = value;
          }
        });
        if (Object.keys(headers).length > 0) {
          logData.responseHeaders = headers;
        }
      }

      // 标记慢请求
      if (responseTimeMs > config.slowRequestThreshold) {
        logData.isSlowRequest = true;
        logData.slowRequestThreshold = `${config.slowRequestThreshold}ms`;
      }

      // 根据状态码获取日志级别
      const logLevel = getLogLevel(res.statusCode);

      // 构建日志消息
      let logMessage = `HTTP ${req.method} ${req.path} - ${res.statusCode} (${responseTime}ms)`;

      // 慢请求警告
      if (logData.isSlowRequest) {
        logMessage += ' [慢请求]';
      }

      // 根据日志级别输出
      if (logLevel === 'error') {
        logger.error(logMessage, logData);
      } else if (logLevel === 'warn') {
        // 慢请求使用 warn 级别
        if (logData.isSlowRequest) {
          logger.warn(logMessage, logData);
        } else {
          logger.warn(logMessage, logData);
        }
      } else {
        logger.info(logMessage, logData);
      }
    });

    // 监听响应错误事件
    res.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      logger.error(`响应错误: ${req.method} ${req.path}`, {
        ...requestData,
        responseTime: `${responseTime}ms`,
        error: error.message,
        stack: error.stack,
      });
    });

    // 监听请求中止事件
    req.on('aborted', () => {
      const responseTime = Date.now() - startTime;
      logger.warn(`请求被中止: ${req.method} ${req.path}`, {
        ...requestData,
        responseTime: `${responseTime}ms`,
      });
    });

    // 继续处理请求
    next();
  };
}

/**
 * 请求日志中间件（默认实例）
 *
 * @description
 * 使用默认配置创建的请求日志中间件
 * 适用于大多数场景，开箱即用
 *
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - 下一个中间件函数
 *
 * @example
 * // 直接使用默认中间件
 * app.use(requestLogger);
 *
 * // 或使用 createRequestLogger 创建自定义实例
 * app.use(createRequestLogger({ excludedPaths: ['/health'] }));
 */
const requestLogger = createRequestLogger();

/**
 * 错误请求日志中间件
 *
 * @description
 * 专门用于记录错误请求的中间件
 * 通常与错误处理中间件配合使用
 *
 * @param {Object} err - 错误对象
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - 下一个中间件函数
 */
function errorRequestLogger(err, req, res, next) {
  const requestData = {
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    ip: getClientIP(req),
    userAgent: req.headers['user-agent'],
  };

  // 记录用户信息（如果已认证）
  if (req.user) {
    requestData.user = {
      id: req.user.id,
      username: req.user.username,
    };
  }

  // 记录请求参数
  const params = formatRequestParams(req);
  if (Object.keys(params).length > 0) {
    requestData.params = params;
  }

  // 记录错误信息
  logger.error(`请求错误: ${req.method} ${req.path}`, {
    ...requestData,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      status: err.status,
      code: err.code,
    },
  });

  next(err);
}

/**
 * API 请求统计中间件
 *
 * @description
 * 收集 API 请求的统计信息
 * 可用于监控和分析 API 使用情况
 *
 * @param {Object} [options] - 配置选项
 * @returns {Function} Express 中间件函数
 */
function createAPIStatsLogger(options = {}) {
  // 统计数据存储
  const stats = {
    totalRequests: 0,
    requestsByMethod: {},
    requestsByPath: {},
    errors: 0,
    slowRequests: 0,
    avgResponseTime: 0,
  };

  /**
   * 统计中间件
   */
  return function apiStatsMiddleware(req, res, next) {
    const startTime = Date.now();

    // 监听响应完成
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;

      // 更新统计数据
      stats.totalRequests++;

      // 按方法统计
      const method = req.method;
      stats.requestsByMethod[method] = (stats.requestsByMethod[method] || 0) + 1;

      // 按路径统计
      const path = req.route ? req.route.path : req.path;
      if (!stats.requestsByPath[path]) {
        stats.requestsByPath[path] = { count: 0, avgTime: 0, errors: 0 };
      }
      stats.requestsByPath[path].count++;

      // 计算平均响应时间
      const currentAvg = stats.avgResponseTime;
      stats.avgResponseTime = (currentAvg * (stats.totalRequests - 1) + responseTime) / stats.totalRequests;

      // 错误统计
      if (res.statusCode >= 400) {
        stats.errors++;
        stats.requestsByPath[path].errors++;
      }

      // 慢请求统计
      if (responseTime > (options.slowThreshold || 1000)) {
        stats.slowRequests++;
      }
    });

    next();
  };
}

// =====================================================
// 导出模块
// =====================================================

module.exports = {
  // 主要中间件
  requestLogger,
  createRequestLogger,

  // 错误日志中间件
  errorRequestLogger,

  // API 统计中间件
  createAPIStatsLogger,

  // 辅助函数（供外部使用）
  sanitizeData,
  getClientIP,
  getLogLevel,
  shouldExcludePath,
  formatRequestParams,
  formatResponseInfo,

  // 默认配置（供外部使用）
  DEFAULT_EXCLUDED_PATHS,
  DEFAULT_EXCLUDED_PREFIXES,
  SENSITIVE_FIELDS,
  MAX_BODY_LENGTH,
};
