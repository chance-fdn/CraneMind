/**
 * 密码加密工具模块
 * 提供密码加密、验证、强度检查和随机密码生成功能
 * 
 * 功能特性：
 * 1. 使用 bcryptjs 进行安全的密码哈希加密
 * 2. 密码强度验证，符合安全要求
 * 3. 随机密码生成，支持自定义长度
 * 4. 密码过期检查，增强安全性
 * 5. 完整的错误处理和输入验证
 * 
 * 使用示例：
 * const passwordUtils = require('./password');
 * 
 * // 加密密码
 * const hash = await passwordUtils.hashPassword('MyPassword123!');
 * 
 * // 验证密码
 * const isValid = await passwordUtils.comparePassword('MyPassword123!', hash);
 * 
 * // 检查密码强度
 * const strength = passwordUtils.validatePasswordStrength('MyPassword123!');
 * 
 * // 生成随机密码
 * const randomPassword = passwordUtils.generateRandomPassword(12);
 * 
 * // 检查密码是否过期
 * const isExpired = passwordUtils.isPasswordExpired(lastChangedDate, 90);
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * 密码加密工具类
 * 提供密码相关的各种操作功能
 */
class PasswordUtils {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {number} options.saltRounds - bcrypt 盐轮数，默认10
   */
  constructor(options = {}) {
    this.saltRounds = options.saltRounds || 10;
    this.passwordStrengthRules = {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };
  }

  /**
   * 加密密码
   * 使用 bcrypt 对明文密码进行哈希加密
   * 
   * @param {string} password - 明文密码
   * @returns {Promise<string>} 加密后的密码哈希
   * @throws {Error} 如果密码为空或加密失败
   * 
   * @example
   * const hash = await passwordUtils.hashPassword('MyPassword123!');
   */
  async hashPassword(password) {
    try {
      // 验证输入参数
      if (!password || typeof password !== 'string') {
        throw new Error('密码不能为空且必须是字符串');
      }

      if (password.trim().length === 0) {
        throw new Error('密码不能为空或只包含空格');
      }

      // 使用 bcrypt 进行哈希加密
      const salt = await bcrypt.genSalt(this.saltRounds);
      const hash = await bcrypt.hash(password, salt);
      
      return hash;
    } catch (error) {
      // 记录错误并重新抛出
      console.error('密码加密失败:', error.message);
      throw new Error(`密码加密失败: ${error.message}`);
    }
  }

  /**
   * 验证密码
   * 比较明文密码和加密哈希是否匹配
   * 
   * @param {string} password - 明文密码
   * @param {string} hash - 加密后的密码哈希
   * @returns {Promise<boolean>} 密码是否匹配
   * @throws {Error} 如果参数无效或验证失败
   * 
   * @example
   * const isValid = await passwordUtils.comparePassword('MyPassword123!', hash);
   */
  async comparePassword(password, hash) {
    try {
      // 验证输入参数
      if (!password || typeof password !== 'string') {
        throw new Error('密码不能为空且必须是字符串');
      }

      if (!hash || typeof hash !== 'string') {
        throw new Error('密码哈希不能为空且必须是字符串');
      }

      if (password.trim().length === 0) {
        throw new Error('密码不能为空或只包含空格');
      }

      // 使用 bcrypt 比较密码
      const isMatch = await bcrypt.compare(password, hash);
      return isMatch;
    } catch (error) {
      // 记录错误并重新抛出
      console.error('密码验证失败:', error.message);
      throw new Error(`密码验证失败: ${error.message}`);
    }
  }

  /**
   * 验证密码强度
   * 检查密码是否符合安全要求
   * 
   * @param {string} password - 明文密码
   * @returns {Object} 验证结果对象
   * @property {boolean} isValid - 密码是否有效
   * @property {string} strength - 强度等级 (weak, medium, strong)
   * @property {Array<string>} errors - 错误消息数组
   * @property {Object} details - 详细验证信息
   * 
   * @example
   * const result = passwordUtils.validatePasswordStrength('MyPassword123!');
   * // 返回: { isValid: true, strength: 'strong', errors: [], details: {...} }
   */
  validatePasswordStrength(password) {
    const errors = [];
    const details = {
      length: 0,
      hasUppercase: false,
      hasLowercase: false,
      hasNumbers: false,
      hasSpecialChars: false
    };

    // 检查密码是否为空
    if (!password || typeof password !== 'string') {
      errors.push('密码不能为空');
      return {
        isValid: false,
        strength: 'weak',
        errors,
        details
      };
    }

    const passwordStr = password;
    details.length = passwordStr.length;

    // 检查最小长度
    if (passwordStr.length < this.passwordStrengthRules.minLength) {
      errors.push(`密码长度至少需要 ${this.passwordStrengthRules.minLength} 个字符`);
    }

    // 检查大写字母
    if (this.passwordStrengthRules.requireUppercase) {
      details.hasUppercase = /[A-Z]/.test(passwordStr);
      if (!details.hasUppercase) {
        errors.push('密码必须包含至少一个大写字母');
      }
    }

    // 检查小写字母
    if (this.passwordStrengthRules.requireLowercase) {
      details.hasLowercase = /[a-z]/.test(passwordStr);
      if (!details.hasLowercase) {
        errors.push('密码必须包含至少一个小写字母');
      }
    }

    // 检查数字
    if (this.passwordStrengthRules.requireNumbers) {
      details.hasNumbers = /\d/.test(passwordStr);
      if (!details.hasNumbers) {
        errors.push('密码必须包含至少一个数字');
      }
    }

    // 检查特殊字符
    if (this.passwordStrengthRules.requireSpecialChars) {
      const escapedSpecialChars = this.escapeForCharacterClass(this.passwordStrengthRules.specialChars);
      const specialCharsRegex = new RegExp(`[${escapedSpecialChars}]`);
      details.hasSpecialChars = specialCharsRegex.test(passwordStr);
      if (!details.hasSpecialChars) {
        errors.push(`密码必须包含至少一个特殊字符 (${this.passwordStrengthRules.specialChars})`);
      }
    }

    // 计算强度等级
    let strength = 'weak';
    const passedChecks = [
      details.length >= this.passwordStrengthRules.minLength,
      this.passwordStrengthRules.requireUppercase ? details.hasUppercase : true,
      this.passwordStrengthRules.requireLowercase ? details.hasLowercase : true,
      this.passwordStrengthRules.requireNumbers ? details.hasNumbers : true,
      this.passwordStrengthRules.requireSpecialChars ? details.hasSpecialChars : true
    ].filter(Boolean).length;

    // 计算实际需要满足的条件数量
    const requiredChecksCount = [
      this.passwordStrengthRules.requireUppercase,
      this.passwordStrengthRules.requireLowercase,
      this.passwordStrengthRules.requireNumbers,
      this.passwordStrengthRules.requireSpecialChars
    ].filter(Boolean).length + 1; // +1 表示长度检查

    if (passedChecks === requiredChecksCount) {
      strength = 'strong';
    } else if (passedChecks >= Math.ceil(requiredChecksCount * 0.6)) {
      strength = 'medium';
    }

    return {
      isValid: errors.length === 0,
      strength,
      errors,
      details
    };
  }

  /**
   * 生成随机密码
   * 生成符合安全要求的随机密码
   * 
   * @param {number} length - 密码长度，默认12
   * @returns {string} 随机生成的密码
   * @throws {Error} 如果长度无效
   * 
   * @example
   * const randomPassword = passwordUtils.generateRandomPassword(12);
   */
  generateRandomPassword(length = 12) {
    try {
      // 验证长度参数
      if (typeof length !== 'number' || length < 8) {
        throw new Error('密码长度必须至少为8个字符');
      }

      if (length > 128) {
        throw new Error('密码长度不能超过128个字符');
      }

      // 定义字符集
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const specialChars = this.passwordStrengthRules.specialChars;

      // 确保每种类型至少有一个字符
      let password = '';
      password += this.getRandomChar(uppercase);
      password += this.getRandomChar(lowercase);
      password += this.getRandomChar(numbers);
      password += this.getRandomChar(specialChars);

      // 填充剩余长度
      const allChars = uppercase + lowercase + numbers + specialChars;
      const remainingLength = length - password.length;
      
      for (let i = 0; i < remainingLength; i++) {
        password += this.getRandomChar(allChars);
      }

      // 打乱密码字符顺序
      password = this.shuffleString(password);

      return password;
    } catch (error) {
      console.error('生成随机密码失败:', error.message);
      throw new Error(`生成随机密码失败: ${error.message}`);
    }
  }

  /**
   * 检查密码是否过期
   * 根据最后修改日期和最大天数检查密码是否过期
   * 
   * @param {Date|string} lastChangedDate - 最后修改日期
   * @param {number} maxDays - 最大有效天数，默认90天
   * @returns {boolean} 密码是否过期
   * @throws {Error} 如果参数无效
   * 
   * @example
   * const isExpired = passwordUtils.isPasswordExpired(lastChangedDate, 90);
   */
  isPasswordExpired(lastChangedDate, maxDays = 90) {
    try {
      // 验证输入参数
      if (!lastChangedDate) {
        throw new Error('最后修改日期不能为空');
      }

      if (typeof maxDays !== 'number' || maxDays <= 0) {
        throw new Error('最大天数必须是大于0的数字');
      }

      // 转换日期为 Date 对象
      const lastChanged = new Date(lastChangedDate);
      if (isNaN(lastChanged.getTime())) {
        throw new Error('无效的日期格式');
      }

      // 计算过期日期
      const expirationDate = new Date(lastChanged);
      expirationDate.setDate(expirationDate.getDate() + maxDays);

      // 检查是否过期
      const currentDate = new Date();
      return currentDate > expirationDate;
    } catch (error) {
      console.error('检查密码过期失败:', error.message);
      throw new Error(`检查密码过期失败: ${error.message}`);
    }
  }

  /**
   * 获取密码过期剩余天数
   * 计算密码还有多少天过期
   * 
   * @param {Date|string} lastChangedDate - 最后修改日期
   * @param {number} maxDays - 最大有效天数，默认90天
   * @returns {number} 剩余天数（负数表示已过期）
   * @throws {Error} 如果参数无效
   * 
   * @example
   * const daysLeft = passwordUtils.getPasswordExpirationDays(lastChangedDate, 90);
   */
  getPasswordExpirationDays(lastChangedDate, maxDays = 90) {
    try {
      // 验证输入参数
      if (!lastChangedDate) {
        throw new Error('最后修改日期不能为空');
      }

      if (typeof maxDays !== 'number' || maxDays <= 0) {
        throw new Error('最大天数必须是大于0的数字');
      }

      // 转换日期为 Date 对象
      const lastChanged = new Date(lastChangedDate);
      if (isNaN(lastChanged.getTime())) {
        throw new Error('无效的日期格式');
      }

      // 计算过期日期
      const expirationDate = new Date(lastChanged);
      expirationDate.setDate(expirationDate.getDate() + maxDays);

      // 计算剩余天数
      const currentDate = new Date();
      const timeDiff = expirationDate.getTime() - currentDate.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

      return daysLeft;
    } catch (error) {
      console.error('计算密码过期天数失败:', error.message);
      throw new Error(`计算密码过期天数失败: ${error.message}`);
    }
  }

  /**
   * 转义正则表达式特殊字符
   * 用于构建包含特殊字符的正则表达式
   * 特别注意：在字符类 [] 中，- 需要特殊处理
   * 
   * @param {string} string - 需要转义的字符串
   * @returns {string} 转义后的字符串
   * @private
   */
  escapeRegExp(string) {
    // 转义所有正则表达式特殊字符
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 转义字符类中的特殊字符
   * 专门用于构建字符类 [] 中的正则表达式
   * 
   * @param {string} string - 需要转义的字符串
   * @returns {string} 转义后的字符串
   * @private
   */
  escapeForCharacterClass(string) {
    // 转义字符类中的特殊字符：] \ ^ - 
    let escaped = string.replace(/[\]\\^-]/g, '\\$&');
    return escaped;
  }

  /**
   * 从字符串中随机获取一个字符
   * 使用加密安全的随机数生成器
   * 
   * @param {string} string - 源字符串
   * @returns {string} 随机字符
   * @private
   */
  getRandomChar(string) {
    const randomIndex = crypto.randomInt(0, string.length);
    return string[randomIndex];
  }

  /**
   * 打乱字符串顺序
   * 使用 Fisher-Yates 洗牌算法
   * 
   * @param {string} string - 需要打乱的字符串
   * @returns {string} 打乱后的字符串
   * @private
   */
  shuffleString(string) {
    const array = string.split('');
    
    for (let i = array.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    
    return array.join('');
  }

  /**
   * 更新密码强度规则
   * 允许动态修改密码强度验证规则
   * 
   * @param {Object} rules - 新的密码强度规则
   * @param {number} rules.minLength - 最小长度
   * @param {boolean} rules.requireUppercase - 是否需要大写字母
   * @param {boolean} rules.requireLowercase - 是否需要小写字母
   * @param {boolean} rules.requireNumbers - 是否需要数字
   * @param {boolean} rules.requireSpecialChars - 是否需要特殊字符
   * @param {string} rules.specialChars - 特殊字符集
   * @returns {void}
   */
  updatePasswordStrengthRules(rules) {
    if (rules.minLength !== undefined) {
      if (typeof rules.minLength !== 'number' || rules.minLength < 1) {
        throw new Error('最小长度必须是大于0的数字');
      }
      this.passwordStrengthRules.minLength = rules.minLength;
    }

    if (rules.requireUppercase !== undefined) {
      this.passwordStrengthRules.requireUppercase = Boolean(rules.requireUppercase);
    }

    if (rules.requireLowercase !== undefined) {
      this.passwordStrengthRules.requireLowercase = Boolean(rules.requireLowercase);
    }

    if (rules.requireNumbers !== undefined) {
      this.passwordStrengthRules.requireNumbers = Boolean(rules.requireNumbers);
    }

    if (rules.requireSpecialChars !== undefined) {
      this.passwordStrengthRules.requireSpecialChars = Boolean(rules.requireSpecialChars);
    }

    if (rules.specialChars !== undefined) {
      if (typeof rules.specialChars !== 'string') {
        throw new Error('特殊字符集必须是字符串');
      }
      this.passwordStrengthRules.specialChars = rules.specialChars;
    }
  }
}

// 创建默认实例
const defaultInstance = new PasswordUtils();

// 导出类和方法
module.exports = {
  PasswordUtils,
  
  // 便捷方法 - 使用默认实例
  hashPassword: (password) => defaultInstance.hashPassword(password),
  comparePassword: (password, hash) => defaultInstance.comparePassword(password, hash),
  validatePasswordStrength: (password) => defaultInstance.validatePasswordStrength(password),
  generateRandomPassword: (length) => defaultInstance.generateRandomPassword(length),
  isPasswordExpired: (lastChangedDate, maxDays) => defaultInstance.isPasswordExpired(lastChangedDate, maxDays),
  getPasswordExpirationDays: (lastChangedDate, maxDays) => defaultInstance.getPasswordExpirationDays(lastChangedDate, maxDays),
  updatePasswordStrengthRules: (rules) => defaultInstance.updatePasswordStrengthRules(rules),
  
  // 导出默认实例
  default: defaultInstance
};

// 导出默认实例作为模块默认导出
module.exports.default = defaultInstance;