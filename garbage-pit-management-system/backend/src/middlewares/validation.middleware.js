/**
 * 垃圾储坑智能化管控系统 - 数据验证中间件
 *
 * 该文件负责：
 * 1. 基于 express-validator 的数据验证
 * 2. 请求体（body）、查询参数（query）、路径参数（params）验证
 * 3. 常见验证规则（必填、邮箱格式、手机号、数字范围、字符串长度等）
 * 4. 验证错误统一处理和响应
 * 5. 预定义的验证规则集（用户注册、登录、行车控制等）
 * 6. 支持自定义验证规则
 *
 * @module middlewares/validation.middleware
 * @author 华工三峰
 */

'use strict';

const { body, query, param, validationResult, matchedData } = require('express-validator');
const logger = require('../utils/logger');

// =====================================================
// 常量定义
// =====================================================

/**
 * 验证错误消息（中文）
 * 提供统一的错误提示，便于前端展示
 */
const ValidationMessages = {
  // 通用错误消息
  REQUIRED: '此字段为必填项',
  INVALID_FORMAT: '格式不正确',
  INVALID_TYPE: '类型不正确',

  // 字符串相关
  STRING_MIN: '长度不能少于 {min} 个字符',
  STRING_MAX: '长度不能超过 {max} 个字符',
  STRING_LENGTH: '长度必须在 {min} 到 {max} 个字符之间',
  STRING_EMPTY: '不能为空字符串',

  // 数字相关
  NUMBER_MIN: '不能小于 {min}',
  NUMBER_MAX: '不能大于 {max}',
  NUMBER_RANGE: '必须在 {min} 到 {max} 之间',
  NUMBER_INTEGER: '必须是整数',
  NUMBER_POSITIVE: '必须是正数',
  NUMBER_NEGATIVE: '必须是负数',

  // 邮箱相关
  EMAIL_INVALID: '邮箱格式不正确',
  EMAIL_DOMAIN: '邮箱域名不支持',

  // 手机号相关
  PHONE_INVALID: '手机号格式不正确',
  PHONE_LENGTH: '手机号长度必须为 11 位',

  // 密码相关
  PASSWORD_MIN: '密码长度不能少于 {min} 个字符',
  PASSWORD_MAX: '密码长度不能超过 {max} 个字符',
  PASSWORD_WEAK: '密码强度不足，需包含大小写字母、数字和特殊字符',
  PASSWORD_MISMATCH: '两次输入的密码不一致',

  // 用户名相关
  USERNAME_MIN: '用户名长度不能少于 {min} 个字符',
  USERNAME_MAX: '用户名长度不能超过 {max} 个字符',
  USERNAME_FORMAT: '用户名只能包含字母、数字和下划线',

  // 日期相关
  DATE_INVALID: '日期格式不正确',
  DATE_PAST: '日期不能早于当前时间',
  DATE_FUTURE: '日期不能晚于当前时间',
  DATE_RANGE: '日期必须在 {start} 到 {end} 之间',

  // 枚举相关
  ENUM_INVALID: '必须是以下值之一：{values}',

  // 数组相关
  ARRAY_MIN: '数组长度不能少于 {min}',
  ARRAY_MAX: '数组长度不能超过 {max}',
  ARRAY_EMPTY: '数组不能为空',

  // 对象相关
  OBJECT_INVALID: '必须是有效的对象',

  // MongoDB ObjectId
  OBJECT_ID_INVALID: 'ID 格式不正确',

  // UUID
  UUID_INVALID: 'UUID 格式不正确',

  // URL
  URL_INVALID: 'URL 格式不正确',
};

/**
 * 中国大陆手机号正则表达式
 * 支持：移动、联通、电信、广电等运营商号段
 */
const PHONE_REGEX = /^1[3-9]\d{9}$/;

/**
 * 用户名正则表达式
 * 只允许字母、数字、下划线
 */
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

/**
 * 密码强度正则表达式
 * 至少包含：一个大写字母、一个小写字母、一个数字、一个特殊字符
 */
const PASSWORD_STRONG_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

/**
 * 常用枚举值定义
 */
const Enums = {
  // 用户状态
  UserStatus: ['active', 'inactive', 'locked'],

  // 用户角色
  UserRole: ['operator', 'admin', 'super_admin'],

  // 行车状态
  CraneStatus: ['online', 'offline', 'running', 'standby', 'fault'],

  // 行车模式
  CraneMode: ['auto', 'manual'],

  // 行车职责
  CraneDuty: ['投料', '堆料', '翻料', '移料'],

  // 抓斗状态
  GrabStatus: ['open', 'closed', 'moving'],

  // 区域类型
  AreaType: ['stacking', 'feeding', 'transfer'],

  // 卸料门状态
  DischargeDoorStatus: ['open', 'closed', 'opening', 'closing'],

  // 任务类型
  TaskType: ['feeding', 'stacking', 'turning', 'moving'],

  // 任务状态
  TaskStatus: ['pending', 'running', 'completed', 'cancelled'],

  // 告警级别
  AlarmLevel: ['critical', 'major', 'minor'],

  // 告警状态
  AlarmStatus: ['active', 'acknowledged', 'resolved'],

  // 设备类型
  DeviceType: ['crane', 'discharge_door', 'transfer_door', 'camera', 'sensor'],

  // 车辆记录类型
  VehicleRecordType: ['discharge', 'enter', 'exit', 'transport'],

  // 控制动作
  ControlAction: ['start', 'stop', 'emergency_stop'],

  // 移动方向
  Direction: ['forward', 'backward', 'left', 'right', 'up', 'down'],
};

// =====================================================
// 辅助函数
// =====================================================

/**
 * 格式化错误消息
 * 将占位符替换为实际值
 *
 * @param {string} message - 包含占位符的消息模板
 * @param {Object} params - 参数对象
 * @returns {string} 格式化后的消息
 *
 * @example
 * formatMessage('长度不能少于 {min} 个字符', { min: 6 })
 * // 返回: '长度不能少于 6 个字符'
 */
function formatMessage(message, params = {}) {
  return Object.keys(params).reduce((msg, key) => {
    return msg.replace(new RegExp(`\\{${key}\\}`, 'g'), params[key]);
  }, message);
}

/**
 * 创建自定义验证错误消息
 *
 * @param {string} field - 字段名
 * @param {string} message - 错误消息
 * @param {string} [location='body'] - 字段位置：body, query, params
 * @returns {Object} 错误对象
 */
function createValidationError(field, message, location = 'body') {
  return {
    type: 'field',
    value: undefined,
    msg: message,
    path: field,
    location,
  };
}

/**
 * 检查值是否为空
 *
 * @param {*} value - 要检查的值
 * @returns {boolean} 是否为空
 */
function isEmpty(value) {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return true;
  }
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  if (typeof value === 'object' && Object.keys(value).length === 0) {
    return true;
  }
  return false;
}

/**
 * 清理字符串（去除首尾空格）
 *
 * @param {string} value - 要清理的字符串
 * @returns {string} 清理后的字符串
 */
function sanitizeString(value) {
  if (typeof value !== 'string') {
    return value;
  }
  return value.trim();
}

// =====================================================
// 基础验证规则工厂函数
// =====================================================

/**
 * 创建必填验证规则
 *
 * @param {string} field - 字段名
 * @param {string} [customMessage] - 自定义错误消息
 * @returns {Object} express-validator 验证链
 */
const required = (field, customMessage) => {
  return body(field)
    .notEmpty()
    .withMessage(customMessage || ValidationMessages.REQUIRED)
    .bail();
};

/**
 * 创建可选字段验证规则
 * 如果字段存在，则进行验证；不存在则跳过
 *
 * @param {string} field - 字段名
 * @returns {Object} express-validator 验证链
 */
const optional = (field) => {
  return body(field).optional({ nullable: true, checkFalsy: true });
};

// =====================================================
// 字符串验证规则
// =====================================================

/**
 * 字符串长度验证
 *
 * @param {string} field - 字段名
 * @param {Object} options - 配置选项
 * @param {number} [options.min] - 最小长度
 * @param {number} [options.max] - 最大长度
 * @param {boolean} [options.required] - 是否必填
 * @returns {Object} express-validator 验证链
 */
const stringLength = (field, options = {}) => {
  const { min, max, required = false } = options;
  let chain = required ? body(field).notEmpty().withMessage(ValidationMessages.REQUIRED).bail() : body(field).optional();

  if (min !== undefined) {
    chain = chain.isLength({ min }).withMessage(formatMessage(ValidationMessages.STRING_MIN, { min }));
  }
  if (max !== undefined) {
    chain = chain.isLength({ max }).withMessage(formatMessage(ValidationMessages.STRING_MAX, { max }));
  }

  return chain.trim();
};

/**
 * 字符串枚举值验证
 *
 * @param {string} field - 字段名
 * @param {string[]} values - 允许的枚举值
 * @param {boolean} [required=false] - 是否必填
 * @returns {Object} express-validator 验证链
 */
const enumValue = (field, values, required = false) => {
  const chain = required
    ? body(field).notEmpty().withMessage(ValidationMessages.REQUIRED).bail()
    : body(field).optional();

  return chain
    .isIn(values)
    .withMessage(formatMessage(ValidationMessages.ENUM_INVALID, { values: values.join(', ') }));
};

// =====================================================
// 数字验证规则
// =====================================================

/**
 * 整数验证
 *
 * @param {string} field - 字段名
 * @param {Object} options - 配置选项
 * @param {number} [options.min] - 最小值
 * @param {number} [options.max] - 最大值
 * @param {boolean} [options.required] - 是否必填
 * @param {boolean} [options.positive] - 是否必须为正数
 * @returns {Object} express-validator 验证链
 */
const int = (field, options = {}) => {
  const { min, max, required = false, positive = false } = options;
  let chain = required
    ? body(field).notEmpty().withMessage(ValidationMessages.REQUIRED).bail()
    : body(field).optional();

  chain = chain.isInt().withMessage(ValidationMessages.NUMBER_INTEGER).bail();

  if (min !== undefined) {
    chain = chain.isInt({ min }).withMessage(formatMessage(ValidationMessages.NUMBER_MIN, { min }));
  }
  if (max !== undefined) {
    chain = chain.isInt({ max }).withMessage(formatMessage(ValidationMessages.NUMBER_MAX, { max }));
  }
  if (positive) {
    chain = chain.isInt({ min: 1 }).withMessage(ValidationMessages.NUMBER_POSITIVE);
  }

  return chain.toInt();
};

/**
 * 浮点数验证
 *
 * @param {string} field - 字段名
 * @param {Object} options - 配置选项
 * @param {number} [options.min] - 最小值
 * @param {number} [options.max] - 最大值
 * @param {boolean} [options.required] - 是否必填
 * @param {boolean} [options.positive] - 是否必须为正数
 * @returns {Object} express-validator 验证链
 */
const float = (field, options = {}) => {
  const { min, max, required = false, positive = false } = options;
  let chain = required
    ? body(field).notEmpty().withMessage(ValidationMessages.REQUIRED).bail()
    : body(field).optional();

  chain = chain.isFloat().withMessage('必须是有效的数字').bail();

  if (min !== undefined) {
    chain = chain.isFloat({ min }).withMessage(formatMessage(ValidationMessages.NUMBER_MIN, { min }));
  }
  if (max !== undefined) {
    chain = chain.isFloat({ max }).withMessage(formatMessage(ValidationMessages.NUMBER_MAX, { max }));
  }
  if (positive) {
    chain = chain.isFloat({ min: 0.01 }).withMessage(ValidationMessages.NUMBER_POSITIVE);
  }

  return chain.toFloat();
};

// =====================================================
// 特殊格式验证规则
// =====================================================

/**
 * 邮箱验证
 *
 * @param {string} field - 字段名
 * @param {boolean} [required=false] - 是否必填
 * @returns {Object} express-validator 验证链
 */
const email = (field, required = false) => {
  const chain = required
    ? body(field).notEmpty().withMessage(ValidationMessages.REQUIRED).bail()
    : body(field).optional();

  return chain
    .isEmail()
    .withMessage(ValidationMessages.EMAIL_INVALID)
    .normalizeEmail()
    .trim();
};

/**
 * 中国大陆手机号验证
 *
 * @param {string} field - 字段名
 * @param {boolean} [required=false] - 是否必填
 * @returns {Object} express-validator 验证链
 */
const phone = (field, required = false) => {
  const chain = required
    ? body(field).notEmpty().withMessage(ValidationMessages.REQUIRED).bail()
    : body(field).optional();

  return chain
    .matches(PHONE_REGEX)
    .withMessage(ValidationMessages.PHONE_INVALID)
    .trim();
};

/**
 * 密码验证（基础版 - 只验证长度）
 *
 * @param {string} field - 字段名
 * @param {Object} options - 配置选项
 * @param {number} [options.min=6] - 最小长度
 * @param {number} [options.max=50] - 最大长度
 * @param {boolean} [options.required=true] - 是否必填
 * @returns {Object} express-validator 验证链
 */
const password = (field, options = {}) => {
  const { min = 6, max = 50, required = true } = options;
  let chain = required
    ? body(field).notEmpty().withMessage(ValidationMessages.REQUIRED).bail()
    : body(field).optional();

  chain = chain
    .isLength({ min, max })
    .withMessage(formatMessage(ValidationMessages.PASSWORD_MIN, { min, max }));

  return chain;
};

/**
 * 密码验证（强密码版）
 * 要求包含大小写字母、数字和特殊字符
 *
 * @param {string} field - 字段名
 * @param {Object} options - 配置选项
 * @param {number} [options.min=8] - 最小长度
 * @param {number} [options.max=50] - 最大长度
 * @returns {Object} express-validator 验证链
 */
const strongPassword = (field, options = {}) => {
  const { min = 8, max = 50 } = options;

  return body(field)
    .notEmpty()
    .withMessage(ValidationMessages.REQUIRED)
    .bail()
    .isLength({ min, max })
    .withMessage(formatMessage(ValidationMessages.PASSWORD_MIN, { min }))
    .bail()
    .matches(PASSWORD_STRONG_REGEX)
    .withMessage(ValidationMessages.PASSWORD_WEAK);
};

/**
 * 用户名验证
 *
 * @param {string} field - 字段名
 * @param {Object} options - 配置选项
 * @param {number} [options.min=3] - 最小长度
 * @param {number} [options.max=30] - 最大长度
 * @returns {Object} express-validator 验证链
 */
const username = (field, options = {}) => {
  const { min = 3, max = 30 } = options;

  return body(field)
    .notEmpty()
    .withMessage(ValidationMessages.REQUIRED)
    .bail()
    .isLength({ min, max })
    .withMessage(formatMessage(ValidationMessages.USERNAME_MIN, { min }))
    .bail()
    .matches(USERNAME_REGEX)
    .withMessage(ValidationMessages.USERNAME_FORMAT)
    .trim();
};

/**
 * URL 验证
 *
 * @param {string} field - 字段名
 * @param {boolean} [required=false] - 是否必填
 * @returns {Object} express-validator 验证链
 */
const url = (field, required = false) => {
  const chain = required
    ? body(field).notEmpty().withMessage(ValidationMessages.REQUIRED).bail()
    : body(field).optional();

  return chain.isURL().withMessage(ValidationMessages.URL_INVALID);
};

/**
 * UUID 验证
 *
 * @param {string} field - 字段名
 * @param {boolean} [required=false] - 是否必填
 * @returns {Object} express-validator 验证链
 */
const uuid = (field, required = false) => {
  const chain = required
    ? body(field).notEmpty().withMessage(ValidationMessages.REQUIRED).bail()
    : body(field).optional();

  return chain.isUUID().withMessage(ValidationMessages.UUID_INVALID);
};

/**
 * 日期验证
 *
 * @param {string} field - 字段名
 * @param {Object} options - 配置选项
 * @param {string} [options.format] - 日期格式
 * @param {boolean} [options.required] - 是否必填
 * @returns {Object} express-validator 验证链
 */
const date = (field, options = {}) => {
  const { required = false } = options;
  const chain = required
    ? body(field).notEmpty().withMessage(ValidationMessages.REQUIRED).bail()
    : body(field).optional();

  return chain.isISO8601().withMessage(ValidationMessages.DATE_INVALID).toDate();
};

/**
 * 布尔值验证
 *
 * @param {string} field - 字段名
 * @param {boolean} [required=false] - 是否必填
 * @returns {Object} express-validator 验证链
 */
const boolean = (field, required = false) => {
  const chain = required
    ? body(field).notEmpty().withMessage(ValidationMessages.REQUIRED).bail()
    : body(field).optional();

  return chain.isBoolean().withMessage('必须是布尔值').toBoolean();
};

/**
 * 数组验证
 *
 * @param {string} field - 字段名
 * @param {Object} options - 配置选项
 * @param {number} [options.min] - 最小长度
 * @param {number} [options.max] - 最大长度
 * @param {boolean} [options.required] - 是否必填
 * @returns {Object} express-validator 验证链
 */
const array = (field, options = {}) => {
  const { min, max, required = false } = options;
  let chain = required
    ? body(field).notEmpty().withMessage(ValidationMessages.REQUIRED).bail()
    : body(field).optional();

  chain = chain.isArray().withMessage('必须是数组').bail();

  if (min !== undefined) {
    chain = chain.isArray({ min }).withMessage(formatMessage(ValidationMessages.ARRAY_MIN, { min }));
  }
  if (max !== undefined) {
    chain = chain.isArray({ max }).withMessage(formatMessage(ValidationMessages.ARRAY_MAX, { max }));
  }

  return chain;
};

/**
 * JSON 对象验证
 *
 * @param {string} field - 字段名
 * @param {boolean} [required=false] - 是否必填
 * @returns {Object} express-validator 验证链
 */
const jsonObject = (field, required = false) => {
  const chain = required
    ? body(field).notEmpty().withMessage(ValidationMessages.REQUIRED).bail()
    : body(field).optional();

  return chain.isJSON().withMessage('必须是有效的 JSON 对象');
};

// =====================================================
// 路径参数验证规则
// =====================================================

/**
 * ID 验证（整数）
 *
 * @param {string} [field='id'] - 字段名
 * @returns {Object} express-validator 验证链
 */
const idParam = (field = 'id') => {
  return param(field)
    .notEmpty()
    .withMessage('ID 不能为空')
    .bail()
    .isInt({ min: 1 })
    .withMessage('ID 必须是正整数')
    .toInt();
};

/**
 * ID 验证（UUID）
 *
 * @param {string} [field='id'] - 字段名
 * @returns {Object} express-validator 验证链
 */
const uuidParam = (field = 'id') => {
  return param(field)
    .notEmpty()
    .withMessage('ID 不能为空')
    .bail()
    .isUUID()
    .withMessage(ValidationMessages.UUID_INVALID);
};

// =====================================================
// 查询参数验证规则
// =====================================================

/**
 * 分页参数验证
 *
 * @returns {Object[]} express-validator 验证链数组
 */
const pagination = () => {
  return [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是大于 0 的整数')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须是 1-100 之间的整数')
      .toInt(),
    query('keyword')
      .optional()
      .trim()
      .escape(),
  ];
};

/**
 * 日期范围查询参数验证
 *
 * @returns {Object[]} express-validator 验证链数组
 */
const dateRange = () => {
  return [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('开始日期格式不正确')
      .toDate(),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('结束日期格式不正确')
      .toDate(),
  ];
};

/**
 * 排序参数验证
 *
 * @param {string[]} [allowedFields] - 允许排序的字段列表
 * @returns {Object[]} express-validator 验证链数组
 */
const sorting = (allowedFields = []) => {
  const validators = [
    query('sortBy')
      .optional()
      .trim(),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc', 'ASC', 'DESC'])
      .withMessage('排序方向必须是 asc 或 desc'),
  ];

  // 如果指定了允许的字段，添加字段验证
  if (allowedFields.length > 0) {
    validators[0] = validators[0].isIn(allowedFields).withMessage(
      `排序字段必须是: ${allowedFields.join(', ')}`
    );
  }

  return validators;
};

// =====================================================
// 验证错误处理中间件
// =====================================================

/**
 * 验证结果处理中间件
 *
 * @description
 * 检查 express-validator 的验证结果
 * 如果有错误，返回 400 错误响应
 * 如果验证通过，将验证后的数据挂载到 req.validatedData
 *
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - 下一个中间件函数
 */
const validate = (req, res, next) => {
  // 获取验证结果
  const errors = validationResult(req);

  // 如果没有错误，继续执行
  if (errors.isEmpty()) {
    // 获取验证通过的数据（只包含经过验证的字段）
    req.validatedData = matchedData(req, { includeOptionals: true });
    return next();
  }

  // 格式化错误信息
  const formattedErrors = {};
  errors.array().forEach((error) => {
    // 每个字段只保留第一个错误信息
    if (!formattedErrors[error.path]) {
      formattedErrors[error.path] = error.msg;
    }
  });

  // 记录验证错误日志
  logger.warn('请求参数验证失败', {
    path: req.path,
    method: req.method,
    errors: formattedErrors,
    ip: req.ip,
  });

  // 返回错误响应
  return res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: '请求参数验证失败',
      details: formattedErrors,
    },
    timestamp: new Date().toISOString(),
  });
};

/**
 * 创建验证中间件
 *
 * @description
 * 将验证规则和错误处理合并为一个中间件数组
 *
 * @param {Object[]} validators - 验证规则数组
 * @returns {Object[]} 包含验证规则和错误处理的中间件数组
 *
 * @example
 * router.post('/users', createValidator([
 *   username('username'),
 *   email('email', true),
 *   password('password'),
 * ]), createUser);
 */
const createValidator = (validators) => {
  return [...validators, validate];
};

// =====================================================
// 预定义验证规则集
// =====================================================

/**
 * 用户注册验证规则
 *
 * @returns {Object[]} express-validator 验证链数组
 */
const userRegisterRules = () => {
  return createValidator([
    username('username', { min: 3, max: 30 }),
    email('email', true),
    strongPassword('password', { min: 8, max: 50 }),
    body('realName')
      .optional()
      .isLength({ max: 50 })
      .withMessage('真实姓名不能超过 50 个字符')
      .trim(),
    phone('phone', false),
    body('roleId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('角色 ID 必须是正整数')
      .toInt(),
  ]);
};

/**
 * 用户登录验证规则
 *
 * @returns {Object[]} express-validator 验证链数组
 */
const userLoginRules = () => {
  return createValidator([
    body('username')
      .notEmpty()
      .withMessage('用户名不能为空')
      .bail()
      .trim(),
    body('password')
      .notEmpty()
      .withMessage('密码不能为空'),
  ]);
};

/**
 * 用户更新验证规则
 *
 * @returns {Object[]} express-validator 验证链数组
 */
const userUpdateRules = () => {
  return createValidator([
    param('id')
      .notEmpty()
      .withMessage('用户 ID 不能为空')
      .bail()
      .isInt({ min: 1 })
      .withMessage('用户 ID 必须是正整数')
      .toInt(),
    body('email')
      .optional()
      .isEmail()
      .withMessage(ValidationMessages.EMAIL_INVALID)
      .normalizeEmail(),
    body('phone')
      .optional()
      .matches(PHONE_REGEX)
      .withMessage(ValidationMessages.PHONE_INVALID),
    body('realName')
      .optional()
      .isLength({ max: 50 })
      .withMessage('真实姓名不能超过 50 个字符')
      .trim(),
    body('roleId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('角色 ID 必须是正整数')
      .toInt(),
    body('status')
      .optional()
      .isIn(Enums.UserStatus)
      .withMessage(`状态必须是: ${Enums.UserStatus.join(', ')}`),
  ]);
};

/**
 * 修改密码验证规则
 *
 * @returns {Object[]} express-validator 验证链数组
 */
const changePasswordRules = () => {
  return createValidator([
    body('oldPassword')
      .notEmpty()
      .withMessage('原密码不能为空'),
    body('newPassword')
      .notEmpty()
      .withMessage('新密码不能为空')
      .bail()
      .isLength({ min: 6, max: 50 })
      .withMessage(formatMessage(ValidationMessages.PASSWORD_MIN, { min: 6 })),
    body('confirmPassword')
      .notEmpty()
      .withMessage('确认密码不能为空')
      .bail()
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error(ValidationMessages.PASSWORD_MISMATCH);
        }
        return true;
      }),
  ]);
};

/**
 * 重置密码验证规则
 *
 * @returns {Object[]} express-validator 验证链数组
 */
const resetPasswordRules = () => {
  return createValidator([
    body('userId')
      .notEmpty()
      .withMessage('用户 ID 不能为空')
      .bail()
      .isInt({ min: 1 })
      .withMessage('用户 ID 必须是正整数')
      .toInt(),
    body('newPassword')
      .notEmpty()
      .withMessage('新密码不能为空')
      .bail()
      .isLength({ min: 6, max: 50 })
      .withMessage(formatMessage(ValidationMessages.PASSWORD_MIN, { min: 6 })),
  ]);
};

/**
 * 行车控制验证规则
 *
 * @returns {Object[]} express-validator 验证链数组
 */
const craneControlRules = () => {
  return createValidator([
    param('id')
      .notEmpty()
      .withMessage('行车 ID 不能为空')
      .bail()
      .isInt({ min: 1 })
      .withMessage('行车 ID 必须是正整数')
      .toInt(),
    body('action')
      .notEmpty()
      .withMessage('控制动作不能为空')
      .bail()
      .isIn(Enums.ControlAction)
      .withMessage(`动作必须是: ${Enums.ControlAction.join(', ')}`),
    body('direction')
      .optional()
      .isIn(Enums.Direction)
      .withMessage(`方向必须是: ${Enums.Direction.join(', ')}`),
    body('speed')
      .optional()
      .isFloat({ min: 0.1, max: 5.0 })
      .withMessage('速度必须在 0.1 到 5.0 之间')
      .toFloat(),
  ]);
};

/**
 * 行车状态更新验证规则
 *
 * @returns {Object[]} express-validator 验证链数组
 */
const craneStatusRules = () => {
  return createValidator([
    param('id')
      .notEmpty()
      .withMessage('行车 ID 不能为空')
      .bail()
      .isInt({ min: 1 })
      .withMessage('行车 ID 必须是正整数')
      .toInt(),
    body('status')
      .optional()
      .isIn(Enums.CraneStatus)
      .withMessage(`状态必须是: ${Enums.CraneStatus.join(', ')}`),
    body('mode')
      .optional()
      .isIn(Enums.CraneMode)
      .withMessage(`模式必须是: ${Enums.CraneMode.join(', ')}`),
    body('duty')
      .optional()
      .isIn(Enums.CraneDuty)
      .withMessage(`职责必须是: ${Enums.CraneDuty.join(', ')}`),
    body('is_enabled')
      .optional()
      .isBoolean()
      .withMessage('启用状态必须是布尔值')
      .toBoolean(),
    body('emergency_stop')
      .optional()
      .isBoolean()
      .withMessage('紧急停止必须是布尔值')
      .toBoolean(),
  ]);
};

/**
 * 行车职责配置验证规则
 *
 * @returns {Object[]} express-validator 验证链数组
 */
const craneDutyRules = () => {
  return createValidator([
    param('id')
      .notEmpty()
      .withMessage('行车 ID 不能为空')
      .bail()
      .isInt({ min: 1 })
      .withMessage('行车 ID 必须是正整数')
      .toInt(),
    body('duty')
      .notEmpty()
      .withMessage('职责不能为空')
      .bail()
      .isIn(Enums.CraneDuty)
      .withMessage(`职责必须是: ${Enums.CraneDuty.join(', ')}`),
  ]);
};

/**
 * 区域创建验证规则
 *
 * @returns {Object[]} express-validator 验证链数组
 */
const areaCreateRules = () => {
  return createValidator([
    body('areaNo')
      .notEmpty()
      .withMessage('区域编号不能为空')
      .bail()
      .isLength({ max: 20 })
      .withMessage('区域编号不能超过 20 个字符')
      .trim(),
    body('name')
      .notEmpty()
      .withMessage('区域名称不能为空')
      .bail()
      .isLength({ max: 50 })
      .withMessage('区域名称不能超过 50 个字符')
      .trim(),
    body('type')
      .notEmpty()
      .withMessage('区域类型不能为空')
      .bail()
      .isIn(Enums.AreaType)
      .withMessage(`类型必须是: ${Enums.AreaType.join(', ')}`),
    body('coordinateX')
      .optional()
      .isFloat()
      .withMessage('X 坐标必须是数字')
      .toFloat(),
    body('coordinateY')
      .optional()
      .isFloat()
      .withMessage('Y 坐标必须是数字')
      .toFloat(),
    body('width')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('宽度必须是非负数')
      .toFloat(),
    body('height')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('高度必须是非负数')
      .toFloat(),
    body('depth')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('深度必须是非负数')
      .toFloat(),
    body('maxHeight')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('最大高度必须是非负数')
      .toFloat(),
  ]);
};

/**
 * 区域控制验证规则
 *
 * @returns {Object[]} express-validator 验证链数组
 */
const areaControlRules = () => {
  return createValidator([
    param('id')
      .notEmpty()
      .withMessage('区域 ID 不能为空')
      .bail()
      .isInt({ min: 1 })
      .withMessage('区域 ID 必须是正整数')
      .toInt(),
    body('coverStatus')
      .optional()
      .isIn(['open', 'closed'])
      .withMessage('盖板状态必须是 open 或 closed'),
    body('drainingStatus')
      .optional()
      .isIn(['open', 'closed'])
      .withMessage('排水状态必须是 open 或 closed'),
    body('cleaningStatus')
      .optional()
      .isIn(['open', 'closed'])
      .withMessage('清洗状态必须是 open 或 closed'),
  ]);
};

/**
 * 卸料门控制验证规则
 *
 * @returns {Object[]} express-validator 验证链数组
 */
const dischargeDoorControlRules = () => {
  return createValidator([
    param('id')
      .notEmpty()
      .withMessage('卸料门 ID 不能为空')
      .bail()
      .isInt({ min: 1 })
      .withMessage('卸料门 ID 必须是正整数')
      .toInt(),
    body('action')
      .notEmpty()
      .withMessage('控制动作不能为空')
      .bail()
      .isIn(['open', 'close'])
      .withMessage('动作必须是 open 或 close'),
    body('mode')
      .optional()
      .isIn(Enums.CraneMode)
      .withMessage(`模式必须是: ${Enums.CraneMode.join(', ')}`),
  ]);
};

/**
 * 任务创建验证规则
 *
 * @returns {Object[]} express-validator 验证链数组
 */
const taskCreateRules = () => {
  return createValidator([
    body('craneId')
      .notEmpty()
      .withMessage('行车 ID 不能为空')
      .bail()
      .isInt({ min: 1 })
      .withMessage('行车 ID 必须是正整数')
      .toInt(),
    body('taskType')
      .notEmpty()
      .withMessage('任务类型不能为空')
      .bail()
      .isIn(Enums.TaskType)
      .withMessage(`任务类型必须是: ${Enums.TaskType.join(', ')}`),
    body('sourceAreaId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('来源区域 ID 必须是正整数')
      .toInt(),
    body('targetAreaId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('目标区域 ID 必须是正整数')
      .toInt(),
    body('priority')
      .optional()
      .isInt({ min: 0, max: 10 })
      .withMessage('优先级必须在 0-10 之间')
      .toInt(),
    body('weight')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('重量必须是非负数')
      .toFloat(),
  ]);
};

/**
 * 告警确认验证规则
 *
 * @returns {Object[]} express-validator 验证链数组
 */
const alarmAcknowledgeRules = () => {
  return createValidator([
    param('id')
      .notEmpty()
      .withMessage('告警 ID 不能为空')
      .bail()
      .isInt({ min: 1 })
      .withMessage('告警 ID 必须是正整数')
      .toInt(),
  ]);
};

/**
 * 车辆记录创建验证规则
 *
 * @returns {Object[]} express-validator 验证链数组
 */
const vehicleRecordCreateRules = () => {
  return createValidator([
    body('vehicleNo')
      .notEmpty()
      .withMessage('车牌号不能为空')
      .bail()
      .isLength({ max: 20 })
      .withMessage('车牌号不能超过 20 个字符')
      .trim(),
    body('vehicleType')
      .optional()
      .isLength({ max: 50 })
      .withMessage('车辆类型不能超过 50 个字符')
      .trim(),
    body('driverName')
      .optional()
      .isLength({ max: 50 })
      .withMessage('司机姓名不能超过 50 个字符')
      .trim(),
    body('recordType')
      .notEmpty()
      .withMessage('记录类型不能为空')
      .bail()
      .isIn(Enums.VehicleRecordType)
      .withMessage(`记录类型必须是: ${Enums.VehicleRecordType.join(', ')}`),
    body('materialType')
      .optional()
      .isLength({ max: 50 })
      .withMessage('物料类型不能超过 50 个字符')
      .trim(),
    body('weight')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('重量必须是非负数')
      .toFloat(),
    body('areaId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('区域 ID 必须是正整数')
      .toInt(),
    body('gateNo')
      .optional()
      .isLength({ max: 20 })
      .withMessage('门禁编号不能超过 20 个字符')
      .trim(),
  ]);
};

/**
 * AI 发酵预测验证规则
 *
 * @returns {Object[]} express-validator 验证链数组
 */
const aiFermentationPredictionRules = () => {
  return createValidator([
    body('areaId')
      .notEmpty()
      .withMessage('区域 ID 不能为空')
      .bail()
      .isInt({ min: 1 })
      .withMessage('区域 ID 必须是正整数')
      .toInt(),
    body('timeRange')
      .optional()
      .isIn(['1h', '6h', '12h', '24h', '48h', '72h'])
      .withMessage('时间范围必须是: 1h, 6h, 12h, 24h, 48h, 72h 之一'),
  ]);
};

/**
 * AI 告警诊断验证规则
 *
 * @returns {Object[]} express-validator 验证链数组
 */
const aiAlarmDiagnosisRules = () => {
  return createValidator([
    body('alarmId')
      .notEmpty()
      .withMessage('告警 ID 不能为空')
      .bail()
      .isInt({ min: 1 })
      .withMessage('告警 ID 必须是正整数')
      .toInt(),
    body('alarmType')
      .notEmpty()
      .withMessage('告警类型不能为空')
      .bail()
      .isLength({ max: 50 })
      .withMessage('告警类型不能超过 50 个字符')
      .trim(),
    body('craneId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('行车 ID 必须是正整数')
      .toInt(),
    body('sensorData')
      .optional()
      .isObject()
      .withMessage('传感器数据必须是对象'),
  ]);
};

/**
 * AI 大物体检测验证规则
 *
 * @returns {Object[]} express-validator 验证链数组
 */
const aiObjectDetectionRules = () => {
  return createValidator([
    body('cameraId')
      .notEmpty()
      .withMessage('摄像头 ID 不能为空')
      .bail()
      .isInt({ min: 1 })
      .withMessage('摄像头 ID 必须是正整数')
      .toInt(),
    body('imageUrl')
      .optional()
      .isURL()
      .withMessage(ValidationMessages.URL_INVALID),
  ]);
};

/**
 * AI 调度优化验证规则
 *
 * @returns {Object[]} express-validator 验证链数组
 */
const aiScheduleOptimizationRules = () => {
  return createValidator([
    body('currentInventory')
      .notEmpty()
      .withMessage('当前库存数据不能为空')
      .bail()
      .isObject()
      .withMessage('当前库存数据必须是对象'),
    body('feedingDemand')
      .notEmpty()
      .withMessage('投料需求不能为空')
      .bail()
      .isObject()
      .withMessage('投料需求必须是对象'),
  ]);
};

// =====================================================
// 自定义验证规则工厂
// =====================================================

/**
 * 创建自定义验证规则
 *
 * @description
 * 允许使用自定义验证函数进行复杂的验证逻辑
 *
 * @param {string} field - 字段名
 * @param {Function} validateFn - 自定义验证函数，接收 (value, { req, location, path }) 参数
 * @param {string} message - 错误消息
 * @returns {Object} express-validator 验证链
 *
 * @example
 * // 自定义验证：检查密码和确认密码是否一致
 * createCustomValidator('confirmPassword', (value, { req }) => {
 *   if (value !== req.body.password) {
 *     throw new Error('两次输入的密码不一致');
 *   }
 *   return true;
 * }, '两次输入的密码不一致');
 */
const createCustomValidator = (field, validateFn, message) => {
  return body(field).custom(validateFn).withMessage(message);
};

/**
 * 创建条件验证规则
 *
 * @description
 * 根据条件决定是否执行验证
 *
 * @param {string} field - 字段名
 * @param {Function} condition - 条件函数，接收 (req) 参数，返回 boolean
 * @param {Object[]} validators - 验证规则数组
 * @returns {Object} express-validator 验证链
 *
 * @example
 * // 当 type 为 'admin' 时，验证 permission 字段必填
 * createConditionalValidator('permission', (req) => req.body.type === 'admin', [
 *   body('permission').notEmpty().withMessage('管理员必须指定权限'),
 * ]);
 */
const createConditionalValidator = (field, condition, validators) => {
  return body(field).if(condition).custom((value, { req }) => {
    validators.forEach((validator) => {
      validator.run(req);
    });
    return true;
  });
};

// =====================================================
// 导出模块
// =====================================================

module.exports = {
  // 验证错误处理中间件
  validate,
  createValidator,

  // 基础验证规则工厂
  required,
  optional,

  // 字符串验证
  stringLength,
  enumValue,

  // 数字验证
  int,
  float,

  // 特殊格式验证
  email,
  phone,
  password,
  strongPassword,
  username,
  url,
  uuid,
  date,
  boolean,
  array,
  jsonObject,

  // 路径参数验证
  idParam,
  uuidParam,

  // 查询参数验证
  pagination,
  dateRange,
  sorting,

  // 预定义验证规则集
  userRegisterRules,
  userLoginRules,
  userUpdateRules,
  changePasswordRules,
  resetPasswordRules,
  craneControlRules,
  craneStatusRules,
  craneDutyRules,
  areaCreateRules,
  areaControlRules,
  dischargeDoorControlRules,
  taskCreateRules,
  alarmAcknowledgeRules,
  vehicleRecordCreateRules,
  aiFermentationPredictionRules,
  aiAlarmDiagnosisRules,
  aiObjectDetectionRules,
  aiScheduleOptimizationRules,

  // 自定义验证规则工厂
  createCustomValidator,
  createConditionalValidator,

  // 常量和枚举
  ValidationMessages,
  Enums,
  PHONE_REGEX,
  USERNAME_REGEX,
  PASSWORD_STRONG_REGEX,

  // 辅助函数
  formatMessage,
  createValidationError,
  isEmpty,
  sanitizeString,

  // express-validator 原始方法（供高级用法）
  body,
  query,
  param,
  validationResult,
  matchedData,
};