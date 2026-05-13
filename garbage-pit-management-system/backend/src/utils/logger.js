/**
 * 日志工具模块
 * 使用 winston 库实现统一的日志记录功能
 * 
 * 功能特性：
 * 1. 支持多种日志级别：error, warn, info, debug
 * 2. 支持控制台输出和文件输出
 * 3. 支持日志文件按日期轮转
 * 4. 支持错误日志单独存储
 * 5. 支持自定义日志格式
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// 日志文件存储目录
const LOG_DIR = path.join(__dirname, '../../logs');

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * 自定义日志格式
 * 包含时间戳、日志级别、消息内容和额外元数据
 */
const customFormat = winston.format.combine(
  // 添加时间戳
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  // 添加错误堆栈信息（如果存在）
  winston.format.errors({ stack: true }),
  // 自定义输出格式
  winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
    // 基础日志信息：时间 - 级别 - 消息
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // 如果存在错误堆栈，添加到日志中
    if (stack) {
      log += `\n堆栈信息: ${stack}`;
    }
    
    // 如果存在额外元数据，添加到日志中
    if (Object.keys(metadata).length > 0) {
      log += `\n附加信息: ${JSON.stringify(metadata, null, 2)}`;
    }
    
    return log;
  })
);

/**
 * 控制台输出格式
 * 带颜色区分，便于开发调试
 */
const consoleFormat = winston.format.combine(
  // 添加颜色
  winston.format.colorize({ all: true }),
  // 添加时间戳
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  // 添加错误堆栈信息
  winston.format.errors({ stack: true }),
  // 自定义控制台输出格式
  winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    if (Object.keys(metadata).length > 0) {
      log += ` ${JSON.stringify(metadata)}`;
    }
    
    return log;
  })
);

/**
 * 日志传输配置
 */
const transports = [
  // 控制台输出 - 所有级别的日志
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: consoleFormat,
    handleExceptions: true,  // 捕获未处理的异常
    handleRejections: true   // 捕获未处理的 Promise 拒绝
  }),

  // 所有日志文件 - 按日期轮转
  new winston.transports.File({
    level: 'debug',
    filename: path.join(LOG_DIR, 'application-%DATE%.log'),
    format: customFormat,
    // 使用 winston-daily-rotate-file 实现日志轮转（如果已安装）
    // 否则使用普通文件输出
    maxsize: 5242880,  // 5MB - 单个文件最大大小
    maxFiles: 30,       // 保留最近30个日志文件
    tailable: true,     // 启用文件轮转
    handleExceptions: true,
    handleRejections: true
  }),

  // 错误日志文件 - 单独存储错误级别日志
  new winston.transports.File({
    level: 'error',
    filename: path.join(LOG_DIR, 'error-%DATE%.log'),
    format: customFormat,
    maxsize: 5242880,  // 5MB
    maxFiles: 30,
    handleExceptions: true,
    handleRejections: true
  }),

  // 警告日志文件 - 单独存储警告级别日志
  new winston.transports.File({
    level: 'warn',
    filename: path.join(LOG_DIR, 'warn-%DATE%.log'),
    format: customFormat,
    maxsize: 5242880,  // 5MB
    maxFiles: 14       // 警告日志保留14天
  })
];

/**
 * 创建 Winston Logger 实例
 */
const logger = winston.createLogger({
  // 默认日志级别
  level: process.env.LOG_LEVEL || 'debug',
  
  // 默认格式
  format: customFormat,
  
  // 传输配置
  transports: transports,
  
  // 不退出程序当出现未捕获的异常
  exitOnError: false
});

/**
 * 日志级别说明：
 * - error: 错误信息，系统出现严重问题需要立即关注
 * - warn: 警告信息，可能存在的问题或潜在风险
 * - info: 一般信息，记录系统运行状态
 * - debug: 调试信息，详细的程序运行信息，仅开发环境使用
 */

/**
 * 封装日志方法，添加额外功能
 */
const Logger = {
  /**
   * 记录错误日志
   * @param {string} message - 日志消息
   * @param {Error|Object} [meta] - 错误对象或额外元数据
   */
  error: (message, meta = {}) => {
    if (meta instanceof Error) {
      logger.error(message, { 
        stack: meta.stack,
        name: meta.name,
        ...meta 
      });
    } else {
      logger.error(message, meta);
    }
  },

  /**
   * 记录警告日志
   * @param {string} message - 日志消息
   * @param {Object} [meta] - 额外元数据
   */
  warn: (message, meta = {}) => {
    logger.warn(message, meta);
  },

  /**
   * 记录信息日志
   * @param {string} message - 日志消息
   * @param {Object} [meta] - 额外元数据
   */
  info: (message, meta = {}) => {
    logger.info(message, meta);
  },

  /**
   * 记录调试日志
   * @param {string} message - 日志消息
   * @param {Object} [meta] - 额外元数据
   */
  debug: (message, meta = {}) => {
    logger.debug(message, meta);
  },

  /**
   * 记录 HTTP 请求日志
   * @param {Object} req - Express 请求对象
   * @param {number} statusCode - HTTP 状态码
   * @param {number} responseTime - 响应时间（毫秒）
   */
  http: (req, statusCode, responseTime) => {
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    };
    
    if (statusCode >= 400) {
      logger.warn(`HTTP ${statusCode}`, logData);
    } else {
      logger.info(`HTTP ${statusCode}`, logData);
    }
  },

  /**
   * 记录数据库操作日志
   * @param {string} operation - 操作类型（SELECT, INSERT, UPDATE, DELETE）
   * @param {string} table - 表名
   * @param {number} duration - 执行时间（毫秒）
   * @param {Object} [meta] - 额外元数据
   */
  database: (operation, table, duration, meta = {}) => {
    logger.debug(`数据库操作 [${operation}] 表: ${table}`, {
      operation,
      table,
      duration: `${duration}ms`,
      ...meta
    });
  },

  /**
   * 记录设备通信日志
   * @param {string} deviceId - 设备ID
   * @param {string} action - 操作类型
   * @param {string} status - 状态（success/failure）
   * @param {Object} [meta] - 额外元数据
   */
  device: (deviceId, action, status, meta = {}) => {
    const level = status === 'success' ? 'info' : 'error';
    logger[level](`设备通信 [${deviceId}] ${action} - ${status}`, {
      deviceId,
      action,
      status,
      ...meta
    });
  },

  /**
   * 记录天车控制日志
   * @param {string} craneId - 天车ID
   * @param {string} operation - 操作类型
   * @param {Object} params - 操作参数
   * @param {string} result - 执行结果
   */
  crane: (craneId, operation, params, result) => {
    logger.info(`天车控制 [${craneId}] ${operation}`, {
      craneId,
      operation,
      params,
      result
    });
  },

  /**
   * 创建带有模块标识的子日志记录器
   * @param {string} module - 模块名称
   * @returns {Object} 子日志记录器
   */
  child: (module) => {
    return {
      error: (message, meta = {}) => logger.error(`[${module}] ${message}`, meta),
      warn: (message, meta = {}) => logger.warn(`[${module}] ${message}`, meta),
      info: (message, meta = {}) => logger.info(`[${module}] ${message}`, meta),
      debug: (message, meta = {}) => logger.debug(`[${module}] ${message}`, meta)
    };
  }
};

// 导出日志实例和封装方法
module.exports = Logger;
module.exports.logger = logger;
module.exports.LOG_DIR = LOG_DIR;
