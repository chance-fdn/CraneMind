/**
 * 响应格式化工具模块
 * 提供统一的API响应格式，包括成功响应、错误响应、分页响应等
 * 
 * 功能特性：
 * 1. 统一的响应格式，便于前端处理
 * 2. 支持链式调用，提高代码可读性
 * 3. 包含时间戳字段，便于日志追踪
 * 4. 支持多种HTTP状态码对应的响应格式
 * 5. 完整的错误处理机制
 */

const moment = require('moment');

/**
 * 响应格式化工具类
 * 提供统一的API响应格式
 */
class ResponseFormatter {
  /**
   * 构造函数
   * @param {Object} res - Express响应对象
   */
  constructor(res) {
    this.res = res;
    this.statusCode = 200;
    this.success = true;
    this.data = null;
    this.message = '';
    this.error = null;
    this.timestamp = moment().toISOString();
  }

  /**
   * 设置HTTP状态码
   * @param {number} statusCode - HTTP状态码
   * @returns {ResponseFormatter} 当前实例，支持链式调用
   */
  status(statusCode) {
    this.statusCode = statusCode;
    return this;
  }

  /**
   * 设置响应数据
   * @param {any} data - 响应数据
   * @returns {ResponseFormatter} 当前实例，支持链式调用
   */
  setData(data) {
    this.data = data;
    return this;
  }

  /**
   * 设置响应消息
   * @param {string} message - 响应消息
   * @returns {ResponseFormatter} 当前实例，支持链式调用
   */
  setMessage(message) {
    this.message = message;
    return this;
  }

  /**
   * 设置错误信息
   * @param {string} code - 错误码
   * @param {string} message - 错误消息
   * @param {any} details - 错误详情
   * @returns {ResponseFormatter} 当前实例，支持链式调用
   */
  setError(code, message, details = null) {
    this.success = false;
    this.error = {
      code,
      message,
      details
    };
    return this;
  }

  /**
   * 发送响应
   * @returns {Object} Express响应对象
   */
  send() {
    const response = {
      success: this.success,
      timestamp: this.timestamp
    };

    if (this.success) {
      if (this.data !== null && this.data !== undefined) {
        response.data = this.data;
      }
      if (this.message) {
        response.message = this.message;
      }
    } else {
      response.error = this.error;
    }

    return this.res.status(this.statusCode).json(response);
  }
}

/**
 * 成功响应
 * @param {Object} res - Express响应对象
 * @param {any} data - 响应数据
 * @param {string} message - 成功消息
 * @returns {Object} Express响应对象
 */
const success = (res, data = null, message = '操作成功') => {
  return new ResponseFormatter(res)
    .status(200)
    .setData(data)
    .setMessage(message)
    .send();
};

/**
 * 错误响应
 * @param {Object} res - Express响应对象
 * @param {string} code - 错误码
 * @param {string} message - 错误消息
 * @param {any} details - 错误详情
 * @param {number} statusCode - HTTP状态码，默认400
 * @returns {Object} Express响应对象
 */
const error = (res, code, message, details = null, statusCode = 400) => {
  return new ResponseFormatter(res)
    .status(statusCode)
    .setError(code, message, details)
    .send();
};

/**
 * 分页响应
 * @param {Object} res - Express响应对象
 * @param {Array} data - 数据列表
 * @param {number} total - 总数
 * @param {number} page - 当前页
 * @param {number} limit - 每页数量
 * @param {string} message - 成功消息
 * @returns {Object} Express响应对象
 */
const pagination = (res, data, total, page, limit, message = '查询成功') => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const paginationData = {
    items: data,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      pageSize: limit,
      hasNext,
      hasPrev
    }
  };

  return new ResponseFormatter(res)
    .status(200)
    .setData(paginationData)
    .setMessage(message)
    .send();
};

/**
 * 创建成功响应 (201)
 * @param {Object} res - Express响应对象
 * @param {any} data - 创建的数据
 * @param {string} message - 成功消息
 * @returns {Object} Express响应对象
 */
const created = (res, data = null, message = '创建成功') => {
  return new ResponseFormatter(res)
    .status(201)
    .setData(data)
    .setMessage(message)
    .send();
};

/**
 * 无内容响应 (204)
 * @param {Object} res - Express响应对象
 * @param {string} message - 消息
 * @returns {Object} Express响应对象
 */
const noContent = (res, message = '无内容') => {
  return new ResponseFormatter(res)
    .status(204)
    .setMessage(message)
    .send();
};

/**
 * 错误请求响应 (400)
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @param {any} details - 错误详情
 * @returns {Object} Express响应对象
 */
const badRequest = (res, message = '请求参数错误', details = null) => {
  return error(res, 'BAD_REQUEST', message, details, 400);
};

/**
 * 未授权响应 (401)
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @returns {Object} Express响应对象
 */
const unauthorized = (res, message = '未授权访问') => {
  return error(res, 'UNAUTHORIZED', message, null, 401);
};

/**
 * 禁止访问响应 (403)
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @returns {Object} Express响应对象
 */
const forbidden = (res, message = '禁止访问') => {
  return error(res, 'FORBIDDEN', message, null, 403);
};

/**
 * 未找到响应 (404)
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @returns {Object} Express响应对象
 */
const notFound = (res, message = '资源未找到') => {
  return error(res, 'NOT_FOUND', message, null, 404);
};

/**
 * 服务器错误响应 (500)
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @returns {Object} Express响应对象
 */
const internalError = (res, message = '服务器内部错误') => {
  return error(res, 'INTERNAL_ERROR', message, null, 500);
};

/**
 * 验证错误响应 (422)
 * @param {Object} res - Express响应对象
 * @param {Array} errors - 验证错误数组
 * @param {string} message - 错误消息
 * @returns {Object} Express响应对象
 */
const validationError = (res, errors, message = '数据验证失败') => {
  return error(res, 'VALIDATION_ERROR', message, errors, 422);
};

/**
 * 冲突响应 (409)
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @param {any} details - 错误详情
 * @returns {Object} Express响应对象
 */
const conflict = (res, message = '资源冲突', details = null) => {
  return error(res, 'CONFLICT', message, details, 409);
};

/**
 * 服务不可用响应 (503)
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @returns {Object} Express响应对象
 */
const serviceUnavailable = (res, message = '服务暂时不可用') => {
  return error(res, 'SERVICE_UNAVAILABLE', message, null, 503);
};

/**
 * 网关超时响应 (504)
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @returns {Object} Express响应对象
 */
const gatewayTimeout = (res, message = '网关超时') => {
  return error(res, 'GATEWAY_TIMEOUT', message, null, 504);
};

/**
 * 自定义响应
 * @param {Object} res - Express响应对象
 * @returns {ResponseFormatter} 响应格式化器实例
 */
const custom = (res) => {
  return new ResponseFormatter(res);
};

// 导出所有响应方法
module.exports = {
  ResponseFormatter,
  success,
  error,
  pagination,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  internalError,
  validationError,
  conflict,
  serviceUnavailable,
  gatewayTimeout,
  custom
};

// 导出默认的成功响应方法
module.exports.default = success;