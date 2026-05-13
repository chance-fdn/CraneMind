/**
 * 日期处理工具模块
 * 提供日期格式化、解析、计算和比较功能，基于 moment.js 实现
 * 
 * 功能特性：
 * 1. 支持多种日期格式（YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY等）
 * 2. 日期计算：添加/减去天数、获取日期范围
 * 3. 日期比较：计算日期差、验证日期有效性
 * 4. 完整的错误处理和输入验证
 * 5. 支持多种日期输入类型（Date对象、字符串、时间戳）
 * 
 * 使用示例：
 * const dateUtils = require('./date');
 * 
 * // 格式化日期
 * const formatted = dateUtils.formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
 * 
 * // 解析日期字符串
 * const dateObj = dateUtils.parseDate('2024-01-01', 'YYYY-MM-DD');
 * 
 * // 添加天数
 * const newDate = dateUtils.addDays(new Date(), 7);
 * 
 * // 获取日期范围
 * const dateRange = dateUtils.getDateRange('2024-01-01', '2024-01-07');
 * 
 * // 验证日期有效性
 * const isValid = dateUtils.isValidDate('2024-02-30');
 * 
 * // 计算日期差
 * const diff = dateUtils.getDateDifference('2024-01-01', '2024-01-10', 'days');
 */

const moment = require('moment');

/**
 * 日期处理工具类
 * 提供日期相关的各种操作功能
 */
class DateUtils {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {string} options.defaultFormat - 默认日期格式，默认 'YYYY-MM-DD HH:mm:ss'
   * @param {string} options.locale - 本地化设置，默认 'zh-cn'
   */
  constructor(options = {}) {
    this.defaultFormat = options.defaultFormat || 'YYYY-MM-DD HH:mm:ss';
    this.locale = options.locale || 'zh-cn';
    
    // 设置 moment 本地化
    moment.locale(this.locale);
    
    // 支持的日期格式列表
    this.supportedFormats = [
      'YYYY-MM-DD',
      'YYYY/MM/DD',
      'DD/MM/YYYY',
      'MM/DD/YYYY',
      'YYYY-MM-DD HH:mm:ss',
      'YYYY/MM/DD HH:mm:ss',
      'DD/MM/YYYY HH:mm:ss',
      'MM/DD/YYYY HH:mm:ss',
      'YYYY-MM-DD HH:mm',
      'YYYY/MM/DD HH:mm',
      'DD/MM/YYYY HH:mm',
      'MM/DD/YYYY HH:mm',
      'YYYY-MM-DDTHH:mm:ssZ', // ISO 8601
      'YYYY-MM-DDTHH:mm:ss.SSSZ' // ISO 8601 with milliseconds
    ];
  }

  /**
   * 格式化日期
   * 将日期对象或字符串格式化为指定格式的字符串
   * 
   * @param {Date|string|number} date - 日期对象、日期字符串或时间戳
   * @param {string} format - 目标格式字符串，默认使用构造函数中设置的默认格式
   * @param {boolean} utc - 是否使用UTC时间，默认false（使用本地时间）
   * @returns {string} 格式化后的日期字符串
   * @throws {Error} 如果日期无效或格式无效
   * 
   * @example
   * const formatted = dateUtils.formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
   * // 返回: '2024-01-01 12:30:45'
   * 
   * @example
   * const formatted = dateUtils.formatDate('2024-01-01', 'YYYY/MM/DD');
   * // 返回: '2024/01/01'
   * 
   * @example
   * const formatted = dateUtils.formatDate('2024-01-01', 'YYYY-MM-DD', true);
   * // 返回: '2024-01-01' (UTC时间)
   */
  formatDate(date, format = this.defaultFormat, utc = false) {
    try {
      // 验证输入参数
      if (!date) {
        throw new Error('日期参数不能为空');
      }

      if (!format || typeof format !== 'string') {
        throw new Error('格式参数必须是字符串');
      }

      // 创建 moment 对象
      let momentDate;
      if (utc) {
        momentDate = moment.utc(date);
      } else {
        momentDate = moment(date);
      }
      
      // 验证日期有效性
      if (!momentDate.isValid()) {
        throw new Error('无效的日期格式');
      }

      // 格式化日期
      const formatted = momentDate.format(format);
      
      return formatted;
    } catch (error) {
      // 记录错误并重新抛出
      console.error('日期格式化失败:', error.message);
      throw new Error(`日期格式化失败: ${error.message}`);
    }
  }

  /**
   * 解析日期字符串
   * 将日期字符串解析为 Date 对象
   * 
   * @param {string} dateString - 日期字符串
   * @param {string} format - 日期字符串的格式，如果未指定则尝试自动解析
   * @param {boolean} utc - 是否使用UTC时间解析，默认false（使用本地时间）
   * @returns {Date} 解析后的 Date 对象
   * @throws {Error} 如果日期字符串无效或无法解析
   * 
   * @example
   * const dateObj = dateUtils.parseDate('2024-01-01', 'YYYY-MM-DD');
   * // 返回: Date 对象
   * 
   * @example
   * const dateObj = dateUtils.parseDate('2024/01/01 12:30:45', 'YYYY/MM/DD HH:mm:ss');
   * // 返回: Date 对象
   * 
   * @example
   * const dateObj = dateUtils.parseDate('2024-01-01', 'YYYY-MM-DD', true);
   * // 返回: Date 对象 (UTC时间)
   */
  parseDate(dateString, format = null, utc = false) {
    try {
      // 验证输入参数
      if (!dateString || typeof dateString !== 'string') {
        throw new Error('日期字符串不能为空且必须是字符串');
      }

      if (dateString.trim().length === 0) {
        throw new Error('日期字符串不能为空或只包含空格');
      }

      let momentDate;
      
      if (format) {
        // 使用指定格式解析
        if (typeof format !== 'string') {
          throw new Error('格式参数必须是字符串');
        }
        
        if (utc) {
          momentDate = moment.utc(dateString, format, true); // strict mode, UTC
        } else {
          momentDate = moment(dateString, format, true); // strict mode
        }
      } else {
        // 尝试自动解析
        if (utc) {
          momentDate = moment.utc(dateString, this.supportedFormats, true); // strict mode, UTC
        } else {
          momentDate = moment(dateString, this.supportedFormats, true); // strict mode
        }
      }

      // 验证解析结果
      if (!momentDate.isValid()) {
        throw new Error('无法解析日期字符串，请检查格式是否正确');
      }

      // 转换为 Date 对象
      const dateObj = momentDate.toDate();
      
      return dateObj;
    } catch (error) {
      // 记录错误并重新抛出
      console.error('日期解析失败:', error.message);
      throw new Error(`日期解析失败: ${error.message}`);
    }
  }

  /**
   * 添加天数
   * 在指定日期上添加指定天数
   * 
   * @param {Date|string|number} date - 原始日期
   * @param {number} days - 要添加的天数（可以为负数）
   * @returns {Date} 添加天数后的 Date 对象
   * @throws {Error} 如果日期无效或天数无效
   * 
   * @example
   * const newDate = dateUtils.addDays(new Date(), 7);
   * // 返回: 7天后的 Date 对象
   * 
   * @example
   * const newDate = dateUtils.addDays('2024-01-01', -3);
   * // 返回: 3天前的 Date 对象
   */
  addDays(date, days) {
    try {
      // 验证输入参数
      if (!date) {
        throw new Error('日期参数不能为空');
      }

      if (typeof days !== 'number' || isNaN(days)) {
        throw new Error('天数必须是有效的数字');
      }

      // 创建 moment 对象
      const momentDate = moment(date);
      
      // 验证日期有效性
      if (!momentDate.isValid()) {
        throw new Error('无效的日期格式');
      }

      // 添加天数
      const newMomentDate = momentDate.add(days, 'days');
      
      // 转换为 Date 对象
      const newDate = newMomentDate.toDate();
      
      return newDate;
    } catch (error) {
      // 记录错误并重新抛出
      console.error('添加天数失败:', error.message);
      throw new Error(`添加天数失败: ${error.message}`);
    }
  }

  /**
   * 减去天数
   * 在指定日期上减去指定天数
   * 
   * @param {Date|string|number} date - 原始日期
   * @param {number} days - 要减去的天数（可以为负数）
   * @returns {Date} 减去天数后的 Date 对象
   * @throws {Error} 如果日期无效或天数无效
   * 
   * @example
   * const newDate = dateUtils.subtractDays(new Date(), 7);
   * // 返回: 7天前的 Date 对象
   * 
   * @example
   * const newDate = dateUtils.subtractDays('2024-01-01', -3);
   * // 返回: 3天后的 Date 对象
   */
  subtractDays(date, days) {
    try {
      // 验证输入参数
      if (!date) {
        throw new Error('日期参数不能为空');
      }

      if (typeof days !== 'number' || isNaN(days)) {
        throw new Error('天数必须是有效的数字');
      }

      // 创建 moment 对象
      const momentDate = moment(date);
      
      // 验证日期有效性
      if (!momentDate.isValid()) {
        throw new Error('无效的日期格式');
      }

      // 减去天数
      const newMomentDate = momentDate.subtract(days, 'days');
      
      // 转换为 Date 对象
      const newDate = newMomentDate.toDate();
      
      return newDate;
    } catch (error) {
      // 记录错误并重新抛出
      console.error('减去天数失败:', error.message);
      throw new Error(`减去天数失败: ${error.message}`);
    }
  }

  /**
   * 获取日期范围
   * 获取开始日期和结束日期之间的所有日期
   * 
   * @param {Date|string|number} startDate - 开始日期
   * @param {Date|string|number} endDate - 结束日期
   * @param {string} format - 输出日期的格式，默认 'YYYY-MM-DD'
   * @returns {Array<string>} 日期范围内的所有日期字符串数组
   * @throws {Error} 如果日期无效或开始日期晚于结束日期
   * 
   * @example
   * const dateRange = dateUtils.getDateRange('2024-01-01', '2024-01-07');
   * // 返回: ['2024-01-01', '2024-01-02', ..., '2024-01-07']
   * 
   * @example
   * const dateRange = dateUtils.getDateRange('2024-01-01', '2024-01-07', 'YYYY/MM/DD');
   * // 返回: ['2024/01/01', '2024/01/02', ..., '2024/01/07']
   */
  getDateRange(startDate, endDate, format = 'YYYY-MM-DD') {
    try {
      // 验证输入参数
      if (!startDate) {
        throw new Error('开始日期不能为空');
      }

      if (!endDate) {
        throw new Error('结束日期不能为空');
      }

      if (!format || typeof format !== 'string') {
        throw new Error('格式参数必须是字符串');
      }

      // 创建 moment 对象
      const startMoment = moment(startDate);
      const endMoment = moment(endDate);
      
      // 验证日期有效性
      if (!startMoment.isValid()) {
        throw new Error('无效的开始日期格式');
      }

      if (!endMoment.isValid()) {
        throw new Error('无效的结束日期格式');
      }

      // 检查开始日期是否晚于结束日期
      if (startMoment.isAfter(endMoment)) {
        throw new Error('开始日期不能晚于结束日期');
      }

      // 获取日期范围
      const dateRange = [];
      let currentMoment = startMoment.clone();
      
      while (currentMoment.isSameOrBefore(endMoment, 'day')) {
        dateRange.push(currentMoment.format(format));
        currentMoment = currentMoment.add(1, 'days');
      }
      
      return dateRange;
    } catch (error) {
      // 记录错误并重新抛出
      console.error('获取日期范围失败:', error.message);
      throw new Error(`获取日期范围失败: ${error.message}`);
    }
  }

  /**
   * 验证日期是否有效
   * 检查日期是否有效且格式正确
   * 
   * @param {Date|string|number} date - 要验证的日期
   * @returns {boolean} 日期是否有效
   * 
   * @example
   * const isValid = dateUtils.isValidDate('2024-01-01');
   * // 返回: true
   * 
   * @example
   * const isValid = dateUtils.isValidDate('2024-02-30');
   * // 返回: false
   * 
   * @example
   * const isValid = dateUtils.isValidDate('invalid-date');
   * // 返回: false
   */
  isValidDate(date) {
    try {
      // 验证输入参数
      if (!date) {
        return false;
      }

      // 创建 moment 对象
      const momentDate = moment(date);
      
      // 检查日期是否有效
      return momentDate.isValid();
    } catch (error) {
      // 如果发生错误，返回 false
      console.error('日期验证失败:', error.message);
      return false;
    }
  }

  /**
   * 获取日期差
   * 计算两个日期之间的差值
   * 
   * @param {Date|string|number} date1 - 第一个日期
   * @param {Date|string|number} date2 - 第二个日期
   * @param {string} unit - 差值单位：'days'（天）、'hours'（小时）、'minutes'（分钟）
   * @returns {number} 日期差值（正数表示 date1 晚于 date2，负数表示 date1 早于 date2）
   * @throws {Error} 如果日期无效或单位无效
   * 
   * @example
   * const diff = dateUtils.getDateDifference('2024-01-10', '2024-01-01', 'days');
   * // 返回: 9
   * 
   * @example
   * const diff = dateUtils.getDateDifference('2024-01-01', '2024-01-10', 'days');
   * // 返回: -9
   * 
   * @example
   * const diff = dateUtils.getDateDifference('2024-01-01 12:00:00', '2024-01-01 10:00:00', 'hours');
   * // 返回: 2
   */
  getDateDifference(date1, date2, unit = 'days') {
    try {
      // 验证输入参数
      if (!date1) {
        throw new Error('第一个日期不能为空');
      }

      if (!date2) {
        throw new Error('第二个日期不能为空');
      }

      // 验证单位参数
      const validUnits = ['days', 'hours', 'minutes'];
      if (!validUnits.includes(unit)) {
        throw new Error(`单位参数无效，必须是以下之一: ${validUnits.join(', ')}`);
      }

      // 创建 moment 对象
      const momentDate1 = moment(date1);
      const momentDate2 = moment(date2);
      
      // 验证日期有效性
      if (!momentDate1.isValid()) {
        throw new Error('无效的第一个日期格式');
      }

      if (!momentDate2.isValid()) {
        throw new Error('无效的第二个日期格式');
      }

      // 计算日期差
      const diff = momentDate1.diff(momentDate2, unit);
      
      return diff;
    } catch (error) {
      // 记录错误并重新抛出
      console.error('计算日期差失败:', error.message);
      throw new Error(`计算日期差失败: ${error.message}`);
    }
  }

  /**
   * 获取当前日期时间
   * 获取当前日期时间的格式化字符串
   * 
   * @param {string} format - 日期格式，默认使用构造函数中设置的默认格式
   * @returns {string} 当前日期时间的格式化字符串
   * 
   * @example
   * const now = dateUtils.getNow();
   * // 返回: '2024-01-01 12:30:45'
   * 
   * @example
   * const now = dateUtils.getNow('YYYY/MM/DD');
   * // 返回: '2024/01/01'
   */
  getNow(format = this.defaultFormat) {
    try {
      if (!format || typeof format !== 'string') {
        throw new Error('格式参数必须是字符串');
      }

      return moment().format(format);
    } catch (error) {
      console.error('获取当前时间失败:', error.message);
      throw new Error(`获取当前时间失败: ${error.message}`);
    }
  }

  /**
   * 获取日期开始时间
   * 获取指定日期的开始时间（00:00:00）
   * 
   * @param {Date|string|number} date - 日期
   * @returns {Date} 日期开始时间的 Date 对象
   * @throws {Error} 如果日期无效
   * 
   * @example
   * const startOfDay = dateUtils.getStartOfDay('2024-01-01');
   * // 返回: Date 对象，时间为 2024-01-01 00:00:00
   */
  getStartOfDay(date) {
    try {
      if (!date) {
        throw new Error('日期参数不能为空');
      }

      const momentDate = moment(date);
      
      if (!momentDate.isValid()) {
        throw new Error('无效的日期格式');
      }

      return momentDate.startOf('day').toDate();
    } catch (error) {
      console.error('获取日期开始时间失败:', error.message);
      throw new Error(`获取日期开始时间失败: ${error.message}`);
    }
  }

  /**
   * 获取日期结束时间
   * 获取指定日期的结束时间（23:59:59.999）
   * 
   * @param {Date|string|number} date - 日期
   * @returns {Date} 日期结束时间的 Date 对象
   * @throws {Error} 如果日期无效
   * 
   * @example
   * const endOfDay = dateUtils.getEndOfDay('2024-01-01');
   * // 返回: Date 对象，时间为 2024-01-01 23:59:59.999
   */
  getEndOfDay(date) {
    try {
      if (!date) {
        throw new Error('日期参数不能为空');
      }

      const momentDate = moment(date);
      
      if (!momentDate.isValid()) {
        throw new Error('无效的日期格式');
      }

      return momentDate.endOf('day').toDate();
    } catch (error) {
      console.error('获取日期结束时间失败:', error.message);
      throw new Error(`获取日期结束时间失败: ${error.message}`);
    }
  }

  /**
   * 检查日期是否在范围内
   * 检查指定日期是否在开始日期和结束日期之间（包含边界）
   * 
   * @param {Date|string|number} date - 要检查的日期
   * @param {Date|string|number} startDate - 开始日期
   * @param {Date|string|number} endDate - 结束日期
   * @returns {boolean} 日期是否在范围内
   * @throws {Error} 如果日期无效
   * 
   * @example
   * const isInRange = dateUtils.isDateInRange('2024-01-05', '2024-01-01', '2024-01-10');
   * // 返回: true
   * 
   * @example
   * const isInRange = dateUtils.isDateInRange('2024-01-15', '2024-01-01', '2024-01-10');
   * // 返回: false
   */
  isDateInRange(date, startDate, endDate) {
    try {
      if (!date) {
        throw new Error('要检查的日期不能为空');
      }

      if (!startDate) {
        throw new Error('开始日期不能为空');
      }

      if (!endDate) {
        throw new Error('结束日期不能为空');
      }

      const momentDate = moment(date);
      const momentStart = moment(startDate);
      const momentEnd = moment(endDate);
      
      if (!momentDate.isValid()) {
        throw new Error('无效的要检查的日期格式');
      }

      if (!momentStart.isValid()) {
        throw new Error('无效的开始日期格式');
      }

      if (!momentEnd.isValid()) {
        throw new Error('无效的结束日期格式');
      }

      return momentDate.isBetween(momentStart, momentEnd, 'day', '[]'); // [] 表示包含边界
    } catch (error) {
      console.error('检查日期范围失败:', error.message);
      throw new Error(`检查日期范围失败: ${error.message}`);
    }
  }

  /**
   * 获取月份天数
   * 获取指定日期所在月份的天数
   * 
   * @param {Date|string|number} date - 日期
   * @returns {number} 月份天数
   * @throws {Error} 如果日期无效
   * 
   * @example
   * const daysInMonth = dateUtils.getDaysInMonth('2024-02-01');
   * // 返回: 29（闰年）
   * 
   * @example
   * const daysInMonth = dateUtils.getDaysInMonth('2023-02-01');
   * // 返回: 28
   */
  getDaysInMonth(date) {
    try {
      if (!date) {
        throw new Error('日期参数不能为空');
      }

      const momentDate = moment(date);
      
      if (!momentDate.isValid()) {
        throw new Error('无效的日期格式');
      }

      return momentDate.daysInMonth();
    } catch (error) {
      console.error('获取月份天数失败:', error.message);
      throw new Error(`获取月份天数失败: ${error.message}`);
    }
  }

  /**
   * 更新默认格式
   * 更新默认的日期格式
   * 
   * @param {string} format - 新的默认格式
   * @returns {void}
   * @throws {Error} 如果格式无效
   */
  updateDefaultFormat(format) {
    try {
      if (!format || typeof format !== 'string') {
        throw new Error('格式参数必须是字符串');
      }

      this.defaultFormat = format;
    } catch (error) {
      console.error('更新默认格式失败:', error.message);
      throw new Error(`更新默认格式失败: ${error.message}`);
    }
  }

  /**
   * 更新本地化设置
   * 更新日期本地化设置
   * 
   * @param {string} locale - 新的本地化设置
   * @returns {void}
   * @throws {Error} 如果本地化设置无效
   */
  updateLocale(locale) {
    try {
      if (!locale || typeof locale !== 'string') {
        throw new Error('本地化参数必须是字符串');
      }

      this.locale = locale;
      moment.locale(locale);
    } catch (error) {
      console.error('更新本地化设置失败:', error.message);
      throw new Error(`更新本地化设置失败: ${error.message}`);
    }
  }

  /**
   * 添加支持的日期格式
   * 添加新的日期格式到支持列表中
   * 
   * @param {string|Array<string>} formats - 要添加的日期格式或格式数组
   * @returns {void}
   * @throws {Error} 如果格式无效
   */
  addSupportedFormats(formats) {
    try {
      if (!formats) {
        throw new Error('格式参数不能为空');
      }

      if (typeof formats === 'string') {
        // 单个格式
        if (!this.supportedFormats.includes(formats)) {
          this.supportedFormats.push(formats);
        }
      } else if (Array.isArray(formats)) {
        // 格式数组
        formats.forEach(format => {
          if (typeof format === 'string' && !this.supportedFormats.includes(format)) {
            this.supportedFormats.push(format);
          }
        });
      } else {
        throw new Error('格式参数必须是字符串或字符串数组');
      }
    } catch (error) {
      console.error('添加支持的格式失败:', error.message);
      throw new Error(`添加支持的格式失败: ${error.message}`);
    }
  }

  /**
   * 获取支持的日期格式列表
   * 获取所有支持的日期格式
   * 
   * @returns {Array<string>} 支持的日期格式列表
   */
  getSupportedFormats() {
    return [...this.supportedFormats];
  }
}

// 创建默认实例
const defaultInstance = new DateUtils();

// 导出类和方法
module.exports = {
  DateUtils,
  
  // 便捷方法 - 使用默认实例
  formatDate: (date, format, utc) => defaultInstance.formatDate(date, format, utc),
  parseDate: (dateString, format, utc) => defaultInstance.parseDate(dateString, format, utc),
  addDays: (date, days) => defaultInstance.addDays(date, days),
  subtractDays: (date, days) => defaultInstance.subtractDays(date, days),
  getDateRange: (startDate, endDate, format) => defaultInstance.getDateRange(startDate, endDate, format),
  isValidDate: (date) => defaultInstance.isValidDate(date),
  getDateDifference: (date1, date2, unit) => defaultInstance.getDateDifference(date1, date2, unit),
  getNow: (format) => defaultInstance.getNow(format),
  getStartOfDay: (date) => defaultInstance.getStartOfDay(date),
  getEndOfDay: (date) => defaultInstance.getEndOfDay(date),
  isDateInRange: (date, startDate, endDate) => defaultInstance.isDateInRange(date, startDate, endDate),
  getDaysInMonth: (date) => defaultInstance.getDaysInMonth(date),
  updateDefaultFormat: (format) => defaultInstance.updateDefaultFormat(format),
  updateLocale: (locale) => defaultInstance.updateLocale(locale),
  addSupportedFormats: (formats) => defaultInstance.addSupportedFormats(formats),
  getSupportedFormats: () => defaultInstance.getSupportedFormats(),
  
  // 导出默认实例
  default: defaultInstance
};

// 导出默认实例作为模块默认导出
module.exports.default = defaultInstance;