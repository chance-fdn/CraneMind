/**
 * Token工具模块
 * 提供JWT Token的生成、验证、刷新和解析功能
 * 
 * 功能特性：
 * 1. 生成访问Token（有效期：15分钟）
 * 2. 生成刷新Token（有效期：7天）
 * 3. 验证Token（支持访问Token和刷新Token）
 * 4. 解码Token（不验证）
 * 5. 刷新访问Token
 * 6. 从请求头提取Token
 * 7. 检查Token是否过期
 * 8. 使用环境变量配置JWT密钥
 * 9. 完整的错误处理和输入验证
 * 
 * 使用示例：
 * const tokenUtils = require('./token');
 * 
 * // 生成访问Token
 * const accessToken = tokenUtils.generateAccessToken({ userId: 1, username: 'admin' });
 * 
 * // 生成刷新Token
 * const refreshToken = tokenUtils.generateRefreshToken({ userId: 1, username: 'admin' });
 * 
 * // 验证Token
 * const payload = tokenUtils.verifyToken(accessToken, 'access');
 * 
 * // 解码Token
 * const decoded = tokenUtils.decodeToken(accessToken);
 * 
 * // 刷新访问Token
 * const newAccessToken = tokenUtils.refreshAccessToken(refreshToken);
 * 
 * // 从请求头提取Token
 * const token = tokenUtils.getTokenFromHeader('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
 * 
 * // 检查Token是否过期
 * const isExpired = tokenUtils.isTokenExpired(accessToken);
 */

const jwt = require('jsonwebtoken');
const moment = require('moment');

/**
 * Token工具类
 * 提供JWT Token相关的各种操作功能
 */
class TokenUtils {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {string} options.jwtSecret - JWT密钥，默认从环境变量读取
   * @param {string} options.accessTokenExpiresIn - 访问Token有效期，默认15分钟
   * @param {string} options.refreshTokenExpiresIn - 刷新Token有效期，默认7天
   */
  constructor(options = {}) {
    this.jwtSecret = options.jwtSecret || process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.accessTokenExpiresIn = options.accessTokenExpiresIn || '15m';
    this.refreshTokenExpiresIn = options.refreshTokenExpiresIn || '7d';
    
    // 验证配置
    if (!this.jwtSecret || this.jwtSecret === 'your-secret-key-change-in-production') {
      console.warn('警告：JWT_SECRET未配置或使用默认值，生产环境请务必修改');
    }
  }

  /**
   * 生成访问Token
   * 生成用于API访问的JWT Token，有效期15分钟
   * 
   * @param {Object} payload - Token载荷，包含用户信息
   * @param {string} payload.userId - 用户ID
   * @param {string} payload.username - 用户名
   * @param {string} payload.roleId - 角色ID
   * @param {Array} payload.permissions - 权限列表
   * @returns {string} 生成的访问Token
   * @throws {Error} 如果载荷无效或生成失败
   * 
   * @example
   * const accessToken = tokenUtils.generateAccessToken({
   *   userId: 1,
   *   username: 'admin',
   *   roleId: 1,
   *   permissions: ['user:read', 'user:write']
   * });
   */
  generateAccessToken(payload) {
    try {
      // 验证输入参数
      if (!payload || typeof payload !== 'object') {
        throw new Error('Token载荷不能为空且必须是对象');
      }

      if (Object.keys(payload).length === 0) {
        throw new Error('Token载荷不能为空对象');
      }

      // 添加Token类型标识
      const tokenPayload = {
        ...payload,
        tokenType: 'access',
        iat: Math.floor(Date.now() / 1000)
      };

      // 生成Token
      const token = jwt.sign(tokenPayload, this.jwtSecret, {
        expiresIn: this.accessTokenExpiresIn
      });

      return token;
    } catch (error) {
      console.error('生成访问Token失败:', error.message);
      throw new Error(`生成访问Token失败: ${error.message}`);
    }
  }

  /**
   * 生成刷新Token
   * 生成用于刷新访问Token的JWT Token，有效期7天
   * 
   * @param {Object} payload - Token载荷，包含用户信息
   * @param {string} payload.userId - 用户ID
   * @param {string} payload.username - 用户名
   * @returns {string} 生成的刷新Token
   * @throws {Error} 如果载荷无效或生成失败
   * 
   * @example
   * const refreshToken = tokenUtils.generateRefreshToken({
   *   userId: 1,
   *   username: 'admin'
   * });
   */
  generateRefreshToken(payload) {
    try {
      // 验证输入参数
      if (!payload || typeof payload !== 'object') {
        throw new Error('Token载荷不能为空且必须是对象');
      }

      if (!payload.userId) {
        throw new Error('刷新Token必须包含userId字段');
      }

      // 添加Token类型标识
      const tokenPayload = {
        userId: payload.userId,
        username: payload.username,
        tokenType: 'refresh',
        iat: Math.floor(Date.now() / 1000)
      };

      // 生成Token
      const token = jwt.sign(tokenPayload, this.jwtSecret, {
        expiresIn: this.refreshTokenExpiresIn
      });

      return token;
    } catch (error) {
      console.error('生成刷新Token失败:', error.message);
      throw new Error(`生成刷新Token失败: ${error.message}`);
    }
  }

  /**
   * 验证Token
   * 验证JWT Token的有效性，支持访问Token和刷新Token
   * 
   * @param {string} token - JWT Token字符串
   * @param {string} type - Token类型：'access' 或 'refresh'
   * @returns {Object} 解码后的Token载荷
   * @throws {Error} 如果Token无效、过期或类型不匹配
   * 
   * @example
   * const payload = tokenUtils.verifyToken(accessToken, 'access');
   */
  verifyToken(token, type = 'access') {
    try {
      // 验证输入参数
      if (!token || typeof token !== 'string') {
        throw new Error('Token不能为空且必须是字符串');
      }

      if (token.trim().length === 0) {
        throw new Error('Token不能为空且必须是字符串');
      }

      if (!['access', 'refresh'].includes(type)) {
        throw new Error('Token类型必须是 "access" 或 "refresh"');
      }

      // 验证Token
      const decoded = jwt.verify(token, this.jwtSecret);

      // 检查Token类型
      if (decoded.tokenType !== type) {
        throw new Error(`Token类型不匹配，期望 ${type}，实际 ${decoded.tokenType}`);
      }

      return decoded;
    } catch (error) {
      // 处理JWT特定错误
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Token无效或格式错误');
      } else if (error.name === 'TokenExpiredError') {
        throw new Error('Token已过期');
      } else if (error.name === 'NotBeforeError') {
        throw new Error('Token尚未生效');
      } else {
        console.error('验证Token失败:', error.message);
        throw new Error(`验证Token失败: ${error.message}`);
      }
    }
  }

  /**
   * 解码Token
   * 解码JWT Token但不验证其有效性
   * 
   * @param {string} token - JWT Token字符串
   * @returns {Object} 解码后的Token载荷
   * @throws {Error} 如果Token格式错误
   * 
   * @example
   * const decoded = tokenUtils.decodeToken(token);
   */
  decodeToken(token) {
    try {
      // 验证输入参数
      if (!token || typeof token !== 'string') {
        throw new Error('Token不能为空且必须是字符串');
      }

      if (token.trim().length === 0) {
        throw new Error('Token不能为空且必须是字符串');
      }

      // 解码Token（不验证）
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded) {
        throw new Error('Token格式错误，无法解码');
      }

      return decoded.payload;
    } catch (error) {
      console.error('解码Token失败:', error.message);
      throw new Error(`解码Token失败: ${error.message}`);
    }
  }

  /**
   * 刷新访问Token
   * 使用刷新Token生成新的访问Token
   * 
   * @param {string} refreshToken - 刷新Token
   * @returns {string} 新的访问Token
   * @throws {Error} 如果刷新Token无效或过期
   * 
   * @example
   * const newAccessToken = tokenUtils.refreshAccessToken(refreshToken);
   */
  refreshAccessToken(refreshToken) {
    try {
      // 验证刷新Token
      const decoded = this.verifyToken(refreshToken, 'refresh');

      // 生成新的访问Token
      const newAccessToken = this.generateAccessToken({
        userId: decoded.userId,
        username: decoded.username,
        roleId: decoded.roleId,
        permissions: decoded.permissions
      });

      return newAccessToken;
    } catch (error) {
      console.error('刷新访问Token失败:', error.message);
      throw new Error(`刷新访问Token失败: ${error.message}`);
    }
  }

  /**
   * 从请求头提取Token
   * 从Authorization请求头中提取Bearer Token
   * 
   * @param {string} authHeader - Authorization请求头
   * @returns {string|null} Token字符串，如果格式错误则返回null
   * 
   * @example
   * const token = tokenUtils.getTokenFromHeader('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
   */
  getTokenFromHeader(authHeader) {
    try {
      // 验证输入参数
      if (!authHeader || typeof authHeader !== 'string') {
        return null;
      }

      if (authHeader.trim().length === 0) {
        return null;
      }

      // 检查Bearer Token格式
      const parts = authHeader.split(' ');
      
      if (parts.length !== 2) {
        return null;
      }

      const scheme = parts[0];
      const token = parts[1];

      if (!/^Bearer$/i.test(scheme)) {
        return null;
      }

      if (!token || token.trim().length === 0) {
        return null;
      }

      return token;
    } catch (error) {
      console.error('提取Token失败:', error.message);
      return null;
    }
  }

  /**
   * 检查Token是否过期
   * 检查JWT Token是否已过期
   * 
   * @param {string} token - JWT Token字符串
   * @returns {boolean} Token是否过期
   * @throws {Error} 如果Token格式错误
   * 
   * @example
   * const isExpired = tokenUtils.isTokenExpired(token);
   */
  isTokenExpired(token) {
    try {
      // 解码Token获取过期时间
      const decoded = this.decodeToken(token);

      if (!decoded.exp) {
        // 如果没有过期时间，视为永不过期
        return false;
      }

      // 检查是否过期
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('检查Token过期失败:', error.message);
      throw new Error(`检查Token过期失败: ${error.message}`);
    }
  }

  /**
   * 获取Token剩余有效期
   * 计算Token还有多少秒过期
   * 
   * @param {string} token - JWT Token字符串
   * @returns {number} 剩余秒数（负数表示已过期）
   * @throws {Error} 如果Token格式错误
   * 
   * @example
   * const secondsLeft = tokenUtils.getTokenExpirationSeconds(token);
   */
  getTokenExpirationSeconds(token) {
    try {
      // 解码Token获取过期时间
      const decoded = this.decodeToken(token);

      if (!decoded.exp) {
        // 如果没有过期时间，返回一个很大的数
        return 999999999;
      }

      // 计算剩余秒数
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp - currentTime;
    } catch (error) {
      console.error('计算Token剩余有效期失败:', error.message);
      throw new Error(`计算Token剩余有效期失败: ${error.message}`);
    }
  }

  /**
   * 获取Token过期时间
   * 获取Token的过期时间戳
   * 
   * @param {string} token - JWT Token字符串
   * @returns {Date|null} 过期时间，如果Token没有过期时间则返回null
   * @throws {Error} 如果Token格式错误
   * 
   * @example
   * const expirationDate = tokenUtils.getTokenExpirationDate(token);
   */
  getTokenExpirationDate(token) {
    try {
      // 解码Token获取过期时间
      const decoded = this.decodeToken(token);

      if (!decoded.exp) {
        return null;
      }

      // 转换为Date对象
      return new Date(decoded.exp * 1000);
    } catch (error) {
      console.error('获取Token过期时间失败:', error.message);
      throw new Error(`获取Token过期时间失败: ${error.message}`);
    }
  }

  /**
   * 获取Token签发时间
   * 获取Token的签发时间戳
   * 
   * @param {string} token - JWT Token字符串
   * @returns {Date|null} 签发时间，如果Token没有签发时间则返回null
   * @throws {Error} 如果Token格式错误
   * 
   * @example
   * const issuedAtDate = tokenUtils.getTokenIssuedAtDate(token);
   */
  getTokenIssuedAtDate(token) {
    try {
      // 解码Token获取签发时间
      const decoded = this.decodeToken(token);

      if (!decoded.iat) {
        return null;
      }

      // 转换为Date对象
      return new Date(decoded.iat * 1000);
    } catch (error) {
      console.error('获取Token签发时间失败:', error.message);
      throw new Error(`获取Token签发时间失败: ${error.message}`);
    }
  }

  /**
   * 验证Token并获取用户信息
   * 验证Token并提取用户信息，用于中间件
   * 
   * @param {string} token - JWT Token字符串
   * @returns {Object} 用户信息
   * @property {string} userId - 用户ID
   * @property {string} username - 用户名
   * @property {string} roleId - 角色ID
   * @property {Array} permissions - 权限列表
   * @throws {Error} 如果Token无效或过期
   * 
   * @example
   * const userInfo = tokenUtils.verifyAndGetUserInfo(token);
   */
  verifyAndGetUserInfo(token) {
    try {
      // 验证Token
      const decoded = this.verifyToken(token, 'access');

      // 提取用户信息
      const userInfo = {
        userId: decoded.userId,
        username: decoded.username,
        roleId: decoded.roleId,
        permissions: decoded.permissions || []
      };

      return userInfo;
    } catch (error) {
      console.error('验证Token并获取用户信息失败:', error.message);
      throw new Error(`验证Token并获取用户信息失败: ${error.message}`);
    }
  }

  /**
   * 批量验证Token
   * 验证多个Token，返回验证结果数组
   * 
   * @param {Array<string>} tokens - Token数组
   * @param {string} type - Token类型：'access' 或 'refresh'
   * @returns {Array<Object>} 验证结果数组
   * @property {string} token - 原始Token
   * @property {boolean} valid - 是否有效
   * @property {Object|null} payload - 解码后的载荷（如果有效）
   * @property {string|null} error - 错误信息（如果无效）
   * 
   * @example
   * const results = tokenUtils.batchVerifyTokens(tokens, 'access');
   */
  batchVerifyTokens(tokens, type = 'access') {
    try {
      // 验证输入参数
      if (!Array.isArray(tokens)) {
        throw new Error('tokens参数必须是数组');
      }

      if (!['access', 'refresh'].includes(type)) {
        throw new Error('Token类型必须是 "access" 或 "refresh"');
      }

      const results = [];

      for (const token of tokens) {
        try {
          const payload = this.verifyToken(token, type);
          results.push({
            token,
            valid: true,
            payload,
            error: null
          });
        } catch (error) {
          results.push({
            token,
            valid: false,
            payload: null,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('批量验证Token失败:', error.message);
      throw new Error(`批量验证Token失败: ${error.message}`);
    }
  }

  /**
   * 更新配置
   * 动态更新Token工具配置
   * 
   * @param {Object} config - 新的配置
   * @param {string} config.jwtSecret - JWT密钥
   * @param {string} config.accessTokenExpiresIn - 访问Token有效期
   * @param {string} config.refreshTokenExpiresIn - 刷新Token有效期
   * @returns {void}
   */
  updateConfig(config) {
    if (config.jwtSecret !== undefined) {
      if (typeof config.jwtSecret !== 'string' || config.jwtSecret.trim().length === 0) {
        throw new Error('JWT密钥不能为空且必须是字符串');
      }
      this.jwtSecret = config.jwtSecret;
    }

    if (config.accessTokenExpiresIn !== undefined) {
      if (typeof config.accessTokenExpiresIn !== 'string' || config.accessTokenExpiresIn.trim().length === 0) {
        throw new Error('访问Token有效期不能为空且必须是字符串');
      }
      this.accessTokenExpiresIn = config.accessTokenExpiresIn;
    }

    if (config.refreshTokenExpiresIn !== undefined) {
      if (typeof config.refreshTokenExpiresIn !== 'string' || config.refreshTokenExpiresIn.trim().length === 0) {
        throw new Error('刷新Token有效期不能为空且必须是字符串');
      }
      this.refreshTokenExpiresIn = config.refreshTokenExpiresIn;
    }
  }
}

// 创建默认实例
const defaultInstance = new TokenUtils();

// 导出类和方法
module.exports = {
  TokenUtils,
  
  // 便捷方法 - 使用默认实例
  generateAccessToken: (payload) => defaultInstance.generateAccessToken(payload),
  generateRefreshToken: (payload) => defaultInstance.generateRefreshToken(payload),
  verifyToken: (token, type) => defaultInstance.verifyToken(token, type),
  decodeToken: (token) => defaultInstance.decodeToken(token),
  refreshAccessToken: (refreshToken) => defaultInstance.refreshAccessToken(refreshToken),
  getTokenFromHeader: (authHeader) => defaultInstance.getTokenFromHeader(authHeader),
  isTokenExpired: (token) => defaultInstance.isTokenExpired(token),
  getTokenExpirationSeconds: (token) => defaultInstance.getTokenExpirationSeconds(token),
  getTokenExpirationDate: (token) => defaultInstance.getTokenExpirationDate(token),
  getTokenIssuedAtDate: (token) => defaultInstance.getTokenIssuedAtDate(token),
  verifyAndGetUserInfo: (token) => defaultInstance.verifyAndGetUserInfo(token),
  batchVerifyTokens: (tokens, type) => defaultInstance.batchVerifyTokens(tokens, type),
  updateConfig: (config) => defaultInstance.updateConfig(config),
  
  // 导出默认实例
  default: defaultInstance
};

// 导出默认实例作为模块默认导出
module.exports.default = defaultInstance;