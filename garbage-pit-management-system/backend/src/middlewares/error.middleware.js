/**
 * 垃圾储坑智能化管控系统 - 全局错误处理中间件
 *
 * 该文件负责：
 * 1. 全局错误捕获和处理
 * 2. 区分不同类型的错误（验证错误、认证错误、数据库错误等）
 * 3. 统一的错误响应格式
 * 4. 404 资源不存在处理
 * 5. 错误日志记录
 *
 * @module middlewares/error.middleware
 * @author 华工三峰
 */

'use strict';

const logger = require('../utils/logger');

// =====================================================
// 错误类型定义
// =====================================================

/**
 * 自定义错误类型枚举
 * 用于区分不同类型的错误，便于针对性处理
 */
const ErrorTypes = {
  // 验证错误 - 400
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',

  // 认证错误 - 401
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',

  // 权限错误 - 403
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // 资源错误 - 404
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  // 冲突错误 - 409
  CONFLICT: 'CONFLICT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // 业务逻辑错误 - 422
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  BUSINESS_ERROR: 'BUSINESS_ERROR',

  // 服务器错误 - 500
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // 服务不可用 - 503
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
};

// =====================================================
// HTTP 状态码映射
// =====================================================

/**
 * 错误类型到 HTTP 状态码的映射
 */
const StatusCodeMap = {
  // 400 - 客户端请求错误
  [ErrorTypes.VALIDATION_ERROR]: 400,
  [ErrorTypes.BAD_REQUEST]: 400,

  // 401 - 认证错误
  [ErrorTypes.UNAUTHORIZED]: 401,
  [ErrorTypes.TOKEN_EXPIRED]: 401,
  [ErrorTypes.TOKEN_INVALID]: 401,

  // 403 - 权限错误
  [ErrorTypes.FORBIDDEN]: 403,
  [ErrorTypes.INSUFFICIENT_PERMISSIONS]: 403,

  // 404 - 资源不存在
  [ErrorTypes.NOT_FOUND]: 404,
  [ErrorTypes.RESOURCE_NOT_FOUND]: 404,

  // 409 - 冲突错误
  [ErrorTypes.CONFLICT]: 409,
  [ErrorTypes.DUPLICATE_ENTRY]: 409,

  // 422 - 业务逻辑错误
  [ErrorTypes.UNPROCESSABLE_ENTITY]: 422,
  [ErrorTypes.BUSINESS_ERROR]: 422,

  // 500 - 服务器错误
  [ErrorTypes.INTERNAL_SERVER_ERROR]: 500,
  [ErrorTypes.DATABASE_ERROR]: 500,
  [ErrorTypes.EXTERNAL_SERVICE_ERROR]: 500,

  // 503 - 服务不可用
  [ErrorTypes.SERVICE_UNAVAILABLE]: 503,
};

// =====================================================
// 中文错误消息定义
// =====================================================

/**
 * 默认的错误消息（中文）
 */
const DefaultErrorMessages = {
  // 400 错误
  [ErrorTypes.VALIDATION_ERROR]: '请求参数验证失败',
  [ErrorTypes.BAD_REQUEST]: '错误的请求',

  // 401 错误
  [ErrorTypes.UNAUTHORIZED]: '未授权，请先登录',
  [ErrorTypes.TOKEN_EXPIRED]: '登录已过期，请重新登录',
  [ErrorTypes.TOKEN_INVALID]: '认证令牌无效',

  // 403 错误
  [ErrorTypes.FORBIDDEN]: '禁止访问',
  [ErrorTypes.INSUFFICIENT_PERMISSIONS]: '权限不足',

  // 404 错误
  [ErrorTypes.NOT_FOUND]: '请求的资源不存在',
  [ErrorTypes.RESOURCE_NOT_FOUND]: '请求的资源不存在',

  // 409 错误
  [ErrorTypes.CONFLICT]: '资源冲突',
  [ErrorTypes.DUPLICATE_ENTRY]: '数据已存在，请检查后重试',

  // 422 错误
  [ErrorTypes.UNPROCESSABLE_ENTITY]: '无法处理的请求',
  [ErrorTypes.BUSINESS_ERROR]: '业务处理失败',

  // 500 错误
  [ErrorTypes.INTERNAL_SERVER_ERROR]: '服务器内部错误',
  [ErrorTypes.DATABASE_ERROR]: '数据库操作失败',
  [ErrorTypes.EXTERNAL_SERVICE_ERROR]: '外部服务调用失败',

  // 503 错误
  [ErrorTypes.SERVICE_UNAVAILABLE]: '服务暂时不可用，请稍后重试',
};

// =====================================================
// 自定义错误类
// =====================================================

/**
 * 应用程序错误基类
 *
 * @description
 * 所有自定义错误都应继承此类
 * 提供统一的错误结构，便于错误处理中间件识别和处理
 *
 * @class AppError
 * @extends Error
 *
 * @example
 * throw new AppError('用户不存在', ErrorTypes.NOT_FOUND, 404);
 */
class AppError extends Error {
  /**
   * 创建应用错误实例
   *
   * @param {string} message - 错误消息
   * @param {string} [type='INTERNAL_SERVER_ERROR'] - 错误类型
   * @param {number} [statusCode] - HTTP 状态码（可选，会根据 type 自动推断）
   * @param {Object} [details] - 额外的错误详情
   */
  constructor(message, type = ErrorTypes.INTERNAL_SERVER_ERROR, statusCode, details = null) {
    super(message);

    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode || StatusCodeMap[type] || 500;
    this.details = details;
    this.isOperational = true; // 标记为可预期的错误
    this.timestamp = new Date().toISOString();

    // 捕获堆栈信息（排除构造函数调用）
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 验证错误类
 *
 * @description
 * 用于请求参数验证失败的场景
 * 通常包含详细的验证错误信息
 *
 * @class ValidationError
 * @extends AppError
 *
 * @example
 * throw new ValidationError('参数验证失败', { username: '用户名不能为空' });
 */
class ValidationError extends AppError {
  /**
   * 创建验证错误实例
   *
   * @param {string} [message='请求参数验证失败'] - 错误消息
   * @param {Object} [errors] - 验证错误详情，字段名为键，错误消息为值
   */
  constructor(message = '请求参数验证失败', errors = null) {
    super(message, ErrorTypes.VALIDATION_ERROR, 400, errors);
    this.name = 'ValidationError';
    this.errors = errors; // 便于前端显示具体的字段错误
  }
}

/**
 * 认证错误类
 *
 * @description
 * 用于用户未登录或认证失败的场景
 *
 * @class UnauthorizedError
 * @extends AppError
 *
 * @example
 * throw new UnauthorizedError('请先登录');
 */
class UnauthorizedError extends AppError {
  /**
   * 创建认证错误实例
   *
   * @param {string} [message='未授权，请先登录'] - 错误消息
   * @param {string} [type=ErrorTypes.UNAUTHORIZED] - 具体错误类型
   */
  constructor(message = '未授权，请先登录', type = ErrorTypes.UNAUTHORIZED) {
    super(message, type, StatusCodeMap[type] || 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 权限错误类
 *
 * @description
 * 用于用户已登录但权限不足的场景
 *
 * @class ForbiddenError
 * @extends AppError
 *
 * @example
 * throw new ForbiddenError('您没有权限执行此操作');
 */
class ForbiddenError extends AppError {
  /**
   * 创建权限错误实例
   *
   * @param {string} [message='禁止访问'] - 错误消息
   * @param {Object} [details] - 额外的错误详情
   */
  constructor(message = '禁止访问', details = null) {
    super(message, ErrorTypes.FORBIDDEN, 403, details);
    this.name = 'ForbiddenError';
  }
}

/**
 * 资源不存在错误类
 *
 * @description
 * 用于请求的资源不存在的场景
 *
 * @class NotFoundError
 * @extends AppError
 *
 * @example
 * throw new NotFoundError('用户不存在');
 * throw new NotFoundError('设备不存在', { resourceId: 'device-001' });
 */
class NotFoundError extends AppError {
  /**
   * 创建资源不存在错误实例
   *
   * @param {string} [message='请求的资源不存在'] - 错误消息
   * @param {Object} [details] - 额外的错误详情（如资源ID等）
   */
  constructor(message = '请求的资源不存在', details = null) {
    super(message, ErrorTypes.NOT_FOUND, 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * 冲突错误类
 *
 * @description
 * 用于资源冲突的场景，如重复创建、版本冲突等
 *
 * @class ConflictError
 * @extends AppError
 *
 * @example
 * throw new ConflictError('用户名已存在');
 * throw new ConflictError('数据已被其他用户修改', { currentVersion: 1, requestVersion: 0 });
 */
class ConflictError extends AppError {
  /**
   * 创建冲突错误实例
   *
   * @param {string} [message='资源冲突'] - 错误消息
   * @param {Object} [details] - 额外的错误详情
   */
  constructor(message = '资源冲突', details = null) {
    super(message, ErrorTypes.CONFLICT, 409, details);
    this.name = 'ConflictError';
  }
}

/**
 * 业务逻辑错误类
 *
 * @description
 * 用于业务逻辑校验失败的场景
 * 如：库存不足、状态不允许操作等
 *
 * @class BusinessError
 * @extends AppError
 *
 * @example
 * throw new BusinessError('库存不足，无法创建出库单', { availableStock: 10, requestedStock: 20 });
 */
class BusinessError extends AppError {
  /**
   * 创建业务逻辑错误实例
   *
   * @param {string} message - 错误消息
   * @param {Object} [details] - 额外的错误详情
   */
  constructor(message, details = null) {
    super(message, ErrorTypes.BUSINESS_ERROR, 422, details);
    this.name = 'BusinessError';
  }
}

/**
 * 数据库错误类
 *
 * @description
 * 用于数据库操作失败的场景
 * 注意：数据库错误不应暴露给客户端详细的错误信息
 *
 * @class DatabaseError
 * @extends AppError
 *
 * @example
 * throw new DatabaseError('数据库查询失败', err);
 */
class DatabaseError extends AppError {
  /**
   * 创建数据库错误实例
   *
   * @param {string} [message='数据库操作失败'] - 错误消息（对外显示）
   * @param {Error} [originalError] - 原始错误对象（仅用于日志记录）
   */
  constructor(message = '数据库操作失败', originalError = null) {
    super(message, ErrorTypes.DATABASE_ERROR, 500);
    this.name = 'DatabaseError';
    this.originalError = originalError; // 保存原始错误，便于调试
  }
}

// =====================================================
// 错误识别和分类函数
// =====================================================

/**
 * 识别 Sequelize 数据库错误类型
 *
 * @description
 * 根据 Sequelize 错误的特征，识别具体的错误类型
 * 并返回对应的 HTTP 状态码和错误消息
 *
 * @param {Error} err - Sequelize 错误对象
 * @returns {Object} 包含 statusCode、message、type 的对象
 */
function identifySequelizeError(err) {
  // 唯一键冲突错误
  if (err.name === 'SequelizeUniqueConstraintError') {
    // 尝试提取冲突的字段名
    const fields = err.fields || {};
    const fieldNames = Object.keys(fields).join(', ');
    return {
      type: ErrorTypes.DUPLICATE_ENTRY,
      statusCode: 409,
      message: fieldNames ? `${fieldNames} 已存在` : '数据已存在，请检查后重试',
    };
  }

  // 外键约束错误
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return {
      type: ErrorTypes.BUSINESS_ERROR,
      statusCode: 422,
      message: '关联数据不存在或无法删除',
    };
  }

  // 验证错误
  if (err.name === 'SequelizeValidationError') {
    // 提取验证错误详情
    const errors = {};
    err.errors.forEach((e) => {
      errors[e.path] = e.message;
    });
    return {
      type: ErrorTypes.VALIDATION_ERROR,
      statusCode: 400,
      message: '数据验证失败',
      details: errors,
    };
  }

  // 数据库连接错误
  if (
    err.name === 'SequelizeConnectionError' ||
    err.name === 'SequelizeConnectionRefusedError' ||
    err.name === 'SequelizeHostNotFoundError'
  ) {
    return {
      type: ErrorTypes.DATABASE_ERROR,
      statusCode: 503,
      message: '数据库连接失败',
    };
  }

  // 数据库查询超时
  if (err.name === 'SequelizeDatabaseError' && err.original?.code === 'ETIMEDOUT') {
    return {
      type: ErrorTypes.DATABASE_ERROR,
      statusCode: 503,
      message: '数据库操作超时',
    };
  }

  // 默认数据库错误
  return {
    type: ErrorTypes.DATABASE_ERROR,
    statusCode: 500,
    message: '数据库操作失败',
  };
}

/**
 * 识别 JWT 认证错误类型
 *
 * @description
 * 根据 JWT 错误的特征，识别具体的错误类型
 *
 * @param {Error} err - JWT 错误对象
 * @returns {Object} 包含 statusCode、message、type 的对象
 */
function identifyJWTError(err) {
  // Token 过期
  if (err.name === 'TokenExpiredError') {
    return {
      type: ErrorTypes.TOKEN_EXPIRED,
      statusCode: 401,
      message: '登录已过期，请重新登录',
    };
  }

  // Token 无效
  if (err.name === 'JsonWebTokenError') {
    return {
      type: ErrorTypes.TOKEN_INVALID,
      statusCode: 401,
      message: '认证令牌无效',
    };
  }

  // Token 未生效
  if (err.name === 'NotBeforeError') {
    return {
      type: ErrorTypes.TOKEN_INVALID,
      statusCode: 401,
      message: '认证令牌尚未生效',
    };
  }

  // 默认认证错误
  return {
    type: ErrorTypes.UNAUTHORIZED,
    statusCode: 401,
    message: '认证失败',
  };
}

/**
 * 识别 Express 验证错误（express-validator）
 *
 * @description
 * 处理 express-validator 产生的验证错误
 *
 * @param {Error} err - 验证错误对象
 * @returns {Object} 包含 statusCode、message、type、details 的对象
 */
function identifyExpressValidatorError(err) {
  // express-validator 的错误通常有 array() 方法
  if (typeof err.array === 'function') {
    const errors = {};
    err.array().forEach((e) => {
      // e.path 或 e.param 是字段名，e.msg 是错误消息
      const field = e.path || e.param || 'unknown';
      if (!errors[field]) {
        errors[field] = e.msg;
      }
    });

    return {
      type: ErrorTypes.VALIDATION_ERROR,
      statusCode: 400,
      message: '请求参数验证失败',
      details: errors,
    };
  }

  return null;
}

/**
 * 根据错误对象识别错误类型
 *
 * @description
 * 这是一个统一的错误识别入口，根据错误的特征判断其类型
 * 支持：自定义错误、Sequelize 错误、JWT 错误、Express 验证错误等
 *
 * @param {Error} err - 错误对象
 * @returns {Object} 包含 statusCode、message、type、details 的对象
 */
function identifyError(err) {
  // 1. 如果是自定义错误，直接返回
  if (err instanceof AppError) {
    return {
      type: err.type,
      statusCode: err.statusCode,
      message: err.message,
      details: err.details,
    };
  }

  // 2. 识别 Sequelize 数据库错误
  if (err.name && err.name.startsWith('Sequelize')) {
    return identifySequelizeError(err);
  }

  // 3. 识别 JWT 错误
  if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
    return identifyJWTError(err);
  }

  // 4. 识别 Express 验证错误
  if (err.name === 'ValidationError' || (err.array && typeof err.array === 'function')) {
    const expressError = identifyExpressValidatorError(err);
    if (expressError) {
      return expressError;
    }
  }

  // 5. 识别语法错误（如 JSON 解析错误）
  if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    return {
      type: ErrorTypes.BAD_REQUEST,
      statusCode: 400,
      message: '请求体格式错误，JSON 解析失败',
    };
  }

  // 6. 识别 HTTP 错误（如来自 http-errors 库）
  if (err.status && err.message) {
    const type = Object.keys(StatusCodeMap).find(
      (key) => StatusCodeMap[key] === err.status
    ) || ErrorTypes.INTERNAL_SERVER_ERROR;
    return {
      type,
      statusCode: err.status,
      message: err.message,
    };
  }

  // 7. 默认：内部服务器错误
  return {
    type: ErrorTypes.INTERNAL_SERVER_ERROR,
    statusCode: 500,
    message: process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : err.message || '服务器内部错误',
  };
}

// =====================================================
// 错误响应格式化
// =====================================================

/**
 * 格式化错误响应
 *
 * @description
 * 构建统一的错误响应格式，便于前端处理
 *
 * @param {Object} options - 配置选项
 * @param {string} options.type - 错误类型
 * @param {number} options.statusCode - HTTP 状态码
 * @param {string} options.message - 错误消息
 * @param {Object} [options.details] - 错误详情
 * @param {string} [options.stack] - 错误堆栈（仅开发环境）
 * @param {Object} [req] - Express 请求对象（用于获取请求信息）
 * @returns {Object} 格式化后的错误响应对象
 */
function formatErrorResponse(options, req = null) {
  const { type, statusCode, message, details, stack } = options;

  // 基础响应结构
  const response = {
    success: false,
    error: {
      code: type, // 错误代码，便于前端判断错误类型
      message, // 用户友好的错误消息
      timestamp: new Date().toISOString(), // 错误发生时间
    },
  };

  // 如果有详细的错误信息，添加到响应中
  if (details) {
    response.error.details = details;
  }

  // 如果有请求信息，添加请求 ID 便于追踪
  if (req) {
    response.error.requestId = req.id || generateRequestId(req);
    response.error.path = req.path;
    response.error.method = req.method;
  }

  // 开发环境下添加堆栈信息
  if (process.env.NODE_ENV !== 'production' && stack) {
    response.error.stack = stack;
  }

  return response;
}

/**
 * 生成请求 ID
 *
 * @description
 * 为每个请求生成唯一的标识符，便于日志追踪
 *
 * @param {Object} req - Express 请求对象
 * @returns {string} 请求 ID
 */
function generateRequestId(req) {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}

// =====================================================
// 错误日志记录
// =====================================================

/**
 * 记录错误日志
 *
 * @description
 * 根据错误类型和严重程度，选择合适的日志级别进行记录
 *
 * @param {Error} err - 错误对象
 * @param {Object} errorInfo - 错误识别结果
 * @param {Object} req - Express 请求对象
 */
function logError(err, errorInfo, req) {
  // 构建日志数据
  const logData = {
    // 错误信息
    error: {
      type: errorInfo.type,
      message: errorInfo.message,
      stack: err.stack,
    },
    // 请求信息
    request: {
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
    },
  };

  // 如果有用户信息，记录用户 ID
  if (req.user) {
    logData.user = {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
    };
  }

  // 如果有请求体，记录请求参数（注意脱敏）
  if (req.body && Object.keys(req.body).length > 0) {
    logData.request.body = sanitizeRequestBody(req.body);
  }

  // 根据状态码选择日志级别
  const { statusCode } = errorInfo;

  if (statusCode >= 500) {
    // 服务器错误 - 使用 error 级别
    logger.error(`服务器错误 [${errorInfo.type}]: ${errorInfo.message}`, logData);
  } else if (statusCode >= 400) {
    // 客户端错误 - 使用 warn 级别
    logger.warn(`客户端错误 [${errorInfo.type}]: ${errorInfo.message}`, logData);
  } else {
    // 其他错误 - 使用 info 级别
    logger.info(`请求错误 [${errorInfo.type}]: ${errorInfo.message}`, logData);
  }
}

/**
 * 脱敏请求体中的敏感信息
 *
 * @description
 * 移除或隐藏请求体中的敏感字段，如密码、令牌等
 *
 * @param {Object} body - 请求体对象
 * @returns {Object} 脱敏后的请求体
 */
function sanitizeRequestBody(body) {
  // 敏感字段列表
  const sensitiveFields = [
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

  const sanitized = { ...body };

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = '***';
    }
  });

  return sanitized;
}

// =====================================================
// 中间件函数
// =====================================================

/**
 * 全局错误处理中间件
 *
 * @description
 * 这是 Express 错误处理的最后一个中间件
 * 捕获所有未处理的错误，进行统一处理和响应
 *
 * 功能：
 * 1. 识别错误类型
 * 2. 记录错误日志
 * 3. 格式化错误响应
 * 4. 发送响应给客户端
 *
 * @param {Error} err - 错误对象
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - 下一个中间件函数
 *
 * @example
 * // 在 app.js 中使用
 * app.use(errorHandler);
 */
function errorHandler(err, req, res, next) {
  // 如果响应已经发送，则交给默认的 Express 错误处理
  if (res.headersSent) {
    return next(err);
  }

  // 识别错误类型
  const errorInfo = identifyError(err);

  // 记录错误日志
  logError(err, errorInfo, req);

  // 格式化错误响应
  const errorResponse = formatErrorResponse(
    {
      type: errorInfo.type,
      statusCode: errorInfo.statusCode,
      message: errorInfo.message,
      details: errorInfo.details,
      stack: err.stack,
    },
    req
  );

  // 发送错误响应
  res.status(errorInfo.statusCode).json(errorResponse);
}

/**
 * 404 资源不存在处理中间件
 *
 * @description
 * 捕获所有未匹配到路由的请求，返回 404 错误
 * 应该在所有路由之后、错误处理中间件之前使用
 *
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - 下一个中间件函数
 *
 * @example
 * // 在 app.js 中使用
 * app.use(notFoundHandler); // 放在所有路由之后
 * app.use(errorHandler);    // 错误处理中间件
 */
function notFoundHandler(req, res, next) {
  // 记录 404 日志
  logger.warn(`资源不存在: ${req.method} ${req.originalUrl || req.url}`, {
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  // 构建错误响应
  const errorResponse = formatErrorResponse(
    {
      type: ErrorTypes.NOT_FOUND,
      statusCode: 404,
      message: `请求的资源不存在: ${req.method} ${req.path}`,
    },
    req
  );

  // 返回 404 响应
  res.status(404).json(errorResponse);
}

/**
 * 异步错误包装器
 *
 * @description
 * 用于包装异步路由处理函数，自动捕获 Promise 错误
 * 避免在每个异步函数中写 try-catch
 *
 * @param {Function} fn - 异步路由处理函数
 * @returns {Function} 包装后的路由处理函数
 *
 * @example
 * // 使用前
 * router.get('/users', async (req, res, next) => {
 *   try {
 *     const users = await User.findAll();
 *     res.json(users);
 *   } catch (err) {
 *     next(err);
 *   }
 * });
 *
 * // 使用后
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.findAll();
 *   res.json(users);
 * }));
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// =====================================================
// 辅助函数：创建特定错误
// =====================================================

/**
 * 快捷创建验证错误
 *
 * @param {Object} errors - 验证错误对象，键为字段名，值为错误消息
 * @returns {ValidationError} 验证错误实例
 *
 * @example
 * throw createValidationError({ username: '用户名不能为空', email: '邮箱格式不正确' });
 */
function createValidationError(errors) {
  return new ValidationError('请求参数验证失败', errors);
}

/**
 * 快捷创建未找到错误
 *
 * @param {string} resourceName - 资源名称
 * @param {string|number} [resourceId] - 资源 ID
 * @returns {NotFoundError} 未找到错误实例
 *
 * @example
 * throw createNotFoundError('用户', userId);
 */
function createNotFoundError(resourceName, resourceId) {
  const message = resourceId
    ? `${resourceName}不存在 (ID: ${resourceId})`
    : `${resourceName}不存在`;
  return new NotFoundError(message, resourceId ? { resourceId } : null);
}

/**
 * 快捷创建业务错误
 *
 * @param {string} message - 错误消息
 * @param {Object} [details] - 错误详情
 * @returns {BusinessError} 业务错误实例
 */
function createBusinessError(message, details) {
  return new BusinessError(message, details);
}

// =====================================================
// 导出模块
// =====================================================

module.exports = {
  // 主要中间件
  errorHandler,
  notFoundHandler,
  asyncHandler,

  // 自定义错误类
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  BusinessError,
  DatabaseError,

  // 错误类型常量
  ErrorTypes,

  // 快捷创建错误函数
  createValidationError,
  createNotFoundError,
  createBusinessError,

  // 错误识别函数（供外部使用）
  identifyError,
  identifySequelizeError,
  identifyJWTError,

  // 错误格式化函数（供外部使用）
  formatErrorResponse,
};
