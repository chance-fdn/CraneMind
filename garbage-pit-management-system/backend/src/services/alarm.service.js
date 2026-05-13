/**
 * 垃圾储坑智能化管控系统 - 告警服务
 * 
 * 该文件实现了告警相关的业务逻辑，包括告警查询、确认、统计等。
 * 服务层负责处理业务逻辑，与数据库交互，为控制器提供数据服务。
 * 
 * 主要功能：
 * 1. 行车告警列表查询（分页、状态筛选）
 * 2. 行车告警确认（状态流转、记录确认人）
 * 3. 大物告警列表查询（占位实现）
 * 4. 设备告警列表查询（占位实现）
 * 5. 告警统计信息获取
 * 6. 告警状态验证和业务逻辑处理
 * 
 * @module services/alarm.service
 * @author 华工三峰
 */

'use strict';

// 引入依赖
const { CraneAlarm, Crane, User } = require('../models');
const { 
  ValidationError, 
  NotFoundError, 
  BusinessError,
} = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

/**
 * 告警服务类
 * 
 * @class AlarmService
 */
class AlarmService {
  /**
   * 构造函数
   * 
   * @constructor
   */
  constructor() {
    this.CraneAlarm = CraneAlarm;
    this.Crane = Crane;
    this.User = User;
  }

  /**
   * 获取行车告警列表
   * 
   * @description
   * 查询行车告警列表，支持分页和状态筛选
   * 返回告警详细信息，包括关联的行车信息和确认人信息
   * 
   * @param {Object} params - 查询参数
   * @param {string} params.status - 告警状态筛选（active/acknowledged/resolved）
   * @param {number} params.page - 页码，默认第1页
   * @param {number} params.limit - 每页数量，默认10条
   * @returns {Promise<Object>} 分页结果对象
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const result = await alarmService.getCraneAlarms({
   *   status: 'active',
   *   page: 1,
   *   limit: 10,
   * });
   */
  async getCraneAlarms(params = {}) {
    try {
      const { status, page = 1, limit = 10 } = params;

      logger.info('告警服务 - 获取行车告警列表', { params });

      // 验证页码和每页数量
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      if (pageNum < 1) {
        throw new ValidationError('页码必须大于等于1');
      }

      if (limitNum < 1 || limitNum > 100) {
        throw new ValidationError('每页数量必须在1到100之间');
      }

      // 构建查询条件
      const whereClause = {};
      if (status) {
        // 验证告警状态
        const validStatuses = ['active', 'acknowledged', 'resolved'];
        if (!validStatuses.includes(status)) {
          throw new ValidationError(`告警状态无效，必须是: ${validStatuses.join(', ')}`);
        }
        whereClause.status = status;
      }

      // 计算偏移量
      const offset = (pageNum - 1) * limitNum;

      // 查询告警列表（包含关联数据）
      const { count, rows: alarms } = await this.CraneAlarm.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: this.Crane,
            as: 'crane',
            attributes: ['id', 'crane_no', 'name', 'status'],
            required: false,
          },
          {
            model: this.User,
            as: 'acknowledger',
            attributes: ['id', 'username', 'real_name'],
            required: false,
          },
        ],
        order: [
          ['alarm_level', 'DESC'], // 按告警级别排序（critical > major > minor）
          ['created_at', 'DESC'], // 按创建时间倒序
        ],
        limit: limitNum,
        offset,
      });

      // 计算总页数
      const totalPages = Math.ceil(count / limitNum);

      logger.info('告警服务 - 获取行车告警列表成功', { 
        total: count, 
        page: pageNum, 
        limit: limitNum,
        totalPages,
      });

      return {
        list: alarms,
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('告警服务 - 获取行车告警列表失败', { 
        error: error.message,
        stack: error.stack,
        params,
      });
      throw error;
    }
  }

  /**
   * 确认行车告警
   * 
   * @description
   * 将指定的行车告警状态从 active 更改为 acknowledged
   * 记录确认人和确认时间
   * 验证告警状态是否允许确认
   * 
   * @param {number} id - 告警ID
   * @param {number} userId - 用户ID（确认人）
   * @returns {Promise<Object>} 确认后的告警信息
   * @throws {NotFoundError} 告警不存在
   * @throws {BusinessError} 告警状态不允许确认
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const alarm = await alarmService.acknowledgeCraneAlarm(1, 1001);
   */
  async acknowledgeCraneAlarm(id, userId) {
    try {
      logger.info('告警服务 - 确认行车告警', { 
        alarmId: id, 
        userId 
      });

      // 验证参数
      if (!id || id <= 0) {
        throw new ValidationError('告警ID必须为正整数');
      }

      if (!userId || userId <= 0) {
        throw new ValidationError('用户ID必须为正整数');
      }

      // 查询告警记录
      const alarm = await this.CraneAlarm.findByPk(id);

      // 检查告警是否存在
      if (!alarm) {
        logger.warn('告警服务 - 行车告警不存在', { alarmId: id });
        throw new NotFoundError('行车告警不存在', { alarmId: id });
      }

      // 检查告警状态是否允许确认
      if (alarm.status !== 'active') {
        logger.warn('告警服务 - 告警状态不允许确认', { 
          alarmId: id, 
          currentStatus: alarm.status 
        });
        throw new BusinessError(
          `无法确认告警：当前告警状态为 ${alarm.getStatusName()}，只有活跃状态的告警可以确认`,
          { currentStatus: alarm.status, alarmId: id }
        );
      }

      // 使用模型实例方法确认告警
      await alarm.acknowledge({ userId });

      // 重新查询以获取关联数据
      const updatedAlarm = await this.CraneAlarm.findByPk(id, {
        include: [
          {
            model: this.Crane,
            as: 'crane',
            attributes: ['id', 'crane_no', 'name', 'status'],
            required: false,
          },
          {
            model: this.User,
            as: 'acknowledger',
            attributes: ['id', 'username', 'real_name'],
            required: false,
          },
        ],
      });

      // 记录操作日志
      logger.info('告警服务 - 行车告警已确认', {
        alarmId: id,
        alarmType: alarm.alarm_type,
        alarmLevel: alarm.alarm_level,
        acknowledgedBy: userId,
      });

      return updatedAlarm;
    } catch (error) {
      logger.error('告警服务 - 确认行车告警失败', { 
        alarmId: id, 
        userId, 
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * 获取大物告警列表
   * 
   * @description
   * 查询大物告警列表，支持分页和状态筛选
   * 由于大物告警模型尚未实现，返回空列表（占位实现）
   * 
   * @param {Object} params - 查询参数
   * @param {string} params.status - 告警状态筛选
   * @param {number} params.page - 页码，默认第1页
   * @param {number} params.limit - 每页数量，默认10条
   * @returns {Promise<Object>} 分页结果对象（空列表）
   * @throws {ValidationError} 参数验证失败
   * 
   * @example
   * const result = await alarmService.getLargeObjectAlarms({
   *   status: 'active',
   *   page: 1,
   *   limit: 10,
   * });
   */
  async getLargeObjectAlarms(params = {}) {
    try {
      const { status, page = 1, limit = 10 } = params;

      logger.info('告警服务 - 获取大物告警列表', { params });

      // 验证页码和每页数量
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      if (pageNum < 1) {
        throw new ValidationError('页码必须大于等于1');
      }

      if (limitNum < 1 || limitNum > 100) {
        throw new ValidationError('每页数量必须在1到100之间');
      }

      // 验证告警状态（如果提供）
      if (status) {
        const validStatuses = ['active', 'acknowledged', 'resolved'];
        if (!validStatuses.includes(status)) {
          throw new ValidationError(`告警状态无效，必须是: ${validStatuses.join(', ')}`);
        }
      }

      // 大物告警模型尚未实现，返回空列表
      logger.info('告警服务 - 大物告警模型尚未实现，返回空列表');

      return {
        list: [],
        pagination: {
          total: 0,
          page: pageNum,
          limit: limitNum,
          totalPages: 0,
        },
      };
    } catch (error) {
      logger.error('告警服务 - 获取大物告警列表失败', { 
        error: error.message,
        params,
      });
      throw error;
    }
  }

  /**
   * 获取设备告警列表
   * 
   * @description
   * 查询设备告警列表，支持分页和状态筛选
   * 由于设备告警模型尚未实现，返回空列表（占位实现）
   * 
   * @param {Object} params - 查询参数
   * @param {string} params.status - 告警状态筛选
   * @param {number} params.page - 页码，默认第1页
   * @param {number} params.limit - 每页数量，默认10条
   * @returns {Promise<Object>} 分页结果对象（空列表）
   * @throws {ValidationError} 参数验证失败
   * 
   * @example
   * const result = await alarmService.getDeviceAlarms({
   *   status: 'active',
   *   page: 1,
   *   limit: 10,
   * });
   */
  async getDeviceAlarms(params = {}) {
    try {
      const { status, page = 1, limit = 10 } = params;

      logger.info('告警服务 - 获取设备告警列表', { params });

      // 验证页码和每页数量
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      if (pageNum < 1) {
        throw new ValidationError('页码必须大于等于1');
      }

      if (limitNum < 1 || limitNum > 100) {
        throw new ValidationError('每页数量必须在1到100之间');
      }

      // 验证告警状态（如果提供）
      if (status) {
        const validStatuses = ['active', 'acknowledged', 'resolved'];
        if (!validStatuses.includes(status)) {
          throw new ValidationError(`告警状态无效，必须是: ${validStatuses.join(', ')}`);
        }
      }

      // 设备告警模型尚未实现，返回空列表
      logger.info('告警服务 - 设备告警模型尚未实现，返回空列表');

      return {
        list: [],
        pagination: {
          total: 0,
          page: pageNum,
          limit: limitNum,
          totalPages: 0,
        },
      };
    } catch (error) {
      logger.error('告警服务 - 获取设备告警列表失败', { 
        error: error.message,
        params,
      });
      throw error;
    }
  }

  /**
   * 获取告警统计信息
   * 
   * @description
   * 获取告警总数及各状态告警数量
   * 支持按日期范围和行车ID筛选
   * 
   * @param {Object} options - 统计选项
   * @param {Date} options.startDate - 开始日期
   * @param {Date} options.endDate - 结束日期
   * @param {number} options.craneId - 行车ID筛选
   * @returns {Promise<Object>} 统计信息
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const stats = await alarmService.getAlarmStatistics({
   *   startDate: new Date('2024-01-01'),
   *   endDate: new Date('2024-01-31'),
   *   craneId: 1,
   * });
   */
  async getAlarmStatistics(options = {}) {
    try {
      const { startDate, endDate, craneId } = options;

      logger.info('告警服务 - 获取告警统计信息', { options });

      // 验证日期范围
      if (startDate && !(startDate instanceof Date)) {
        throw new ValidationError('开始日期必须是Date对象');
      }

      if (endDate && !(endDate instanceof Date)) {
        throw new ValidationError('结束日期必须是Date对象');
      }

      if (startDate && endDate && startDate > endDate) {
        throw new ValidationError('开始日期不能晚于结束日期');
      }

      // 验证行车ID
      if (craneId && (craneId <= 0 || !Number.isInteger(craneId))) {
        throw new ValidationError('行车ID必须为正整数');
      }

      // 使用模型类方法获取统计信息
      const stats = await this.CraneAlarm.getStatistics({
        startDate,
        endDate,
        craneId,
      });

      logger.info('告警服务 - 获取告警统计信息成功', { stats });

      return stats;
    } catch (error) {
      logger.error('告警服务 - 获取告警统计信息失败', { 
        error: error.message,
        options,
      });
      throw error;
    }
  }

  /**
   * 获取需要立即处理的告警数量
   * 
   * @description
   * 获取严重或重要级别的活跃告警数量
   * 这些告警需要立即处理
   * 
   * @returns {Promise<number>} 需要立即处理的告警数量
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const count = await alarmService.getImmediateAttentionCount();
   */
  async getImmediateAttentionCount() {
    try {
      logger.info('告警服务 - 获取需要立即处理的告警数量');

      const count = await this.CraneAlarm.getImmediateAttentionCount();

      logger.info('告警服务 - 获取需要立即处理的告警数量成功', { count });

      return count;
    } catch (error) {
      logger.error('告警服务 - 获取需要立即处理的告警数量失败', { 
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 获取每日告警统计
   * 
   * @description
   * 获取指定日期范围内的每日告警统计
   * 
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @param {number} craneId - 行车ID筛选（可选）
   * @returns {Promise<Array>} 每日统计数据
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const dailyStats = await alarmService.getDailyAlarmStatistics(
   *   new Date('2024-01-01'),
   *   new Date('2024-01-31'),
   *   1
   * );
   */
  async getDailyAlarmStatistics(startDate, endDate, craneId = null) {
    try {
      logger.info('告警服务 - 获取每日告警统计', { 
        startDate, 
        endDate, 
        craneId 
      });

      // 验证参数
      if (!(startDate instanceof Date)) {
        throw new ValidationError('开始日期必须是Date对象');
      }

      if (!(endDate instanceof Date)) {
        throw new ValidationError('结束日期必须是Date对象');
      }

      if (startDate > endDate) {
        throw new ValidationError('开始日期不能晚于结束日��');
      }

      if (craneId && (craneId <= 0 || !Number.isInteger(craneId))) {
        throw new ValidationError('行车ID必须为正整数');
      }

      const dailyStats = await this.CraneAlarm.getDailyStatistics(
        startDate,
        endDate,
        craneId
      );

      logger.info('告警服务 - 获取每日告警统计成功', { 
        count: dailyStats.length 
      });

      return dailyStats;
    } catch (error) {
      logger.error('告警服务 - 获取每日告警统计失败', { 
        error: error.message,
        startDate,
        endDate,
        craneId,
      });
      throw error;
    }
  }

  /**
   * 批量确认告警
   * 
   * @description
   * 批量确认多个告警
   * 只有活跃状态的告警可以被确认
   * 
   * @param {Array<number>} alarmIds - 告警ID列表
   * @param {number} userId - 确认人ID
   * @returns {Promise<number>} 确认的告警数量
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const count = await alarmService.batchAcknowledgeAlarms([1, 2, 3], 1001);
   */
  async batchAcknowledgeAlarms(alarmIds, userId) {
    try {
      logger.info('告警服务 - 批量确认告警', { 
        alarmIds, 
        userId 
      });

      // 验证参数
      if (!Array.isArray(alarmIds) || alarmIds.length === 0) {
        throw new ValidationError('告警ID列表不能为空');
      }

      for (const id of alarmIds) {
        if (id <= 0 || !Number.isInteger(id)) {
          throw new ValidationError('告警ID必须为正整数');
        }
      }

      if (!userId || userId <= 0) {
        throw new ValidationError('用户ID必须为正整数');
      }

      const count = await this.CraneAlarm.batchAcknowledge(alarmIds, userId);

      logger.info('告警服务 - 批量确认告警成功', { 
        count, 
        alarmIdsCount: alarmIds.length 
      });

      return count;
    } catch (error) {
      logger.error('告警服务 - 批量确认告警失败', { 
        error: error.message,
        alarmIds,
        userId,
      });
      throw error;
    }
  }

  /**
   * 批量解决告警
   * 
   * @description
   * 批量解决多个告警
   * 只有活跃和已确认状态的告警可以被解决
   * 
   * @param {Array<number>} alarmIds - 告警ID列表
   * @param {number} userId - 解决人ID（可选，用于自动确认活跃告警）
   * @returns {Promise<number>} 解决的告警数量
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const count = await alarmService.batchResolveAlarms([1, 2, 3], 1001);
   */
  async batchResolveAlarms(alarmIds, userId = null) {
    try {
      logger.info('告警服务 - 批量解决告警', { 
        alarmIds, 
        userId 
      });

      // 验证参数
      if (!Array.isArray(alarmIds) || alarmIds.length === 0) {
        throw new ValidationError('告警ID列表不能为空');
      }

      for (const id of alarmIds) {
        if (id <= 0 || !Number.isInteger(id)) {
          throw new ValidationError('告警ID必须为正整数');
        }
      }

      if (userId && userId <= 0) {
        throw new ValidationError('用户ID必须为正整数');
      }

      const count = await this.CraneAlarm.batchResolve(alarmIds, userId);

      logger.info('告警服务 - 批量解决告警成功', { 
        count, 
        alarmIdsCount: alarmIds.length 
      });

      return count;
    } catch (error) {
      logger.error('告警服务 - 批量解决告警失败', { 
        error: error.message,
        alarmIds,
        userId,
      });
      throw error;
    }
  }

  /**
   * 创建行车告警
   * 
   * @description
   * 创建新的行车告警记录
   * 验证行车存在性和告警参数
   * 
   * @param {Object} alarmData - 告警数据
   * @param {number} alarmData.craneId - 行车ID
   * @param {string} alarmData.alarmType - 告警类型
   * @param {string} alarmData.alarmLevel - 告警级别
   * @param {string} alarmData.message - 告警消息
   * @param {number} alarmData.positionX - X坐标（可选）
   * @param {number} alarmData.positionY - Y坐标（可选）
   * @param {Object} alarmData.sensorData - 传感器数据（可选）
   * @returns {Promise<Object>} 创建的告警实例
   * @throws {NotFoundError} 行车不存在
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const alarm = await alarmService.createCraneAlarm({
   *   craneId: 1,
   *   alarmType: 'overload',
   *   alarmLevel: 'critical',
   *   message: '1号行车超载告警',
   *   positionX: 10.5,
   *   positionY: 5.2,
   *   sensorData: { loadWeight: 5.5 }
   * });
   */
  async createCraneAlarm(alarmData) {
    try {
      const { craneId, alarmType, alarmLevel, message, positionX, positionY, sensorData } = alarmData;

      logger.info('告警服务 - 创建行车告警', { alarmData });

      // 验证参数
      if (!craneId || craneId <= 0) {
        throw new ValidationError('行车ID必须为正整数');
      }

      if (!alarmType) {
        throw new ValidationError('告警类型不能为空');
      }

      if (!alarmLevel) {
        throw new ValidationError('告警级别不能为空');
      }

      // 验证告警类型
      const validAlarmTypes = [
        'overload',
        'position_error',
        'grab_slip',
        'collision_warning',
        'speed_abnormal',
        'sensor_fault',
        'communication_error',
        'emergency_stop',
      ];
      if (!validAlarmTypes.includes(alarmType)) {
        throw new ValidationError(`告警类型无效，必须是: ${validAlarmTypes.join(', ')}`);
      }

      // 验证告警级别
      const validAlarmLevels = ['critical', 'major', 'minor'];
      if (!validAlarmLevels.includes(alarmLevel)) {
        throw new ValidationError(`告警级别无效，必须是: ${validAlarmLevels.join(', ')}`);
      }

      // 检查行车是否存在
      const crane = await this.Crane.findByPk(craneId);
      if (!crane) {
        throw new NotFoundError('行车不存在', { craneId });
      }

      // 使用模型类方法创建告警
      const alarm = await this.CraneAlarm.createAlarm({
        craneId,
        alarmType,
        alarmLevel,
        message,
        positionX,
        positionY,
        sensorData,
      });

      logger.info('告警服务 - 创建行车告警成功', {
        alarmId: alarm.id,
        craneId,
        alarmType,
        alarmLevel,
      });

      return alarm;
    } catch (error) {
      logger.error('告警服务 - 创建行车告警失败', { 
        error: error.message,
        alarmData,
      });
      throw error;
    }
  }

  /**
   * 检查行车是否有活跃告警
   * 
   * @description
   * 检查指定行车是否有活跃状态的告警
   * 
   * @param {number} craneId - 行车ID
   * @returns {Promise<boolean>} 是否有活跃告警
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const hasAlarm = await alarmService.hasActiveCraneAlarm(1);
   */
  async hasActiveCraneAlarm(craneId) {
    try {
      logger.info('告警服务 - 检查行车是否有活跃告警', { craneId });

      // 验证参数
      if (!craneId || craneId <= 0) {
        throw new ValidationError('行车ID必须为正整数');
      }

      const hasAlarm = await this.CraneAlarm.hasActiveAlarm(craneId);

      logger.info('告警服务 - 检查行车是否有活跃告警成功', { 
        craneId, 
        hasAlarm 
      });

      return hasAlarm;
    } catch (error) {
      logger.error('告警服务 - 检查行车是否有活跃告警失败', { 
        error: error.message,
        craneId,
      });
      throw error;
    }
  }

  /**
   * 获取告警详情
   * 
   * @description
   * 根据告警ID获取告警详细信息，包括关联的行车和确认人信息
   * 
   * @param {number} id - 告警ID
   * @returns {Promise<Object>} 告警详细信息
   * @throws {NotFoundError} 告警不存在
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const alarm = await alarmService.getAlarmById(1);
   */
  async getAlarmById(id) {
    try {
      logger.info('告警服务 - 获取告警详情', { alarmId: id });

      // 验证参数
      if (!id || id <= 0) {
        throw new ValidationError('告警ID必须为正整数');
      }

      // 查询告警详情（包含关联数据）
      const alarm = await this.CraneAlarm.findByPk(id, {
        include: [
          {
            model: this.Crane,
            as: 'crane',
            attributes: ['id', 'crane_no', 'name', 'status'],
            required: false,
          },
          {
            model: this.User,
            as: 'acknowledger',
            attributes: ['id', 'username', 'real_name'],
            required: false,
          },
        ],
      });

      // 检查告警是否存在
      if (!alarm) {
        logger.warn('告警服务 - 告警不存在', { alarmId: id });
        throw new NotFoundError('告警不存在', { alarmId: id });
      }

      logger.info('告警服务 - 获取告警详情成功', { 
        alarmId: id, 
        alarmType: alarm.alarm_type 
      });

      return alarm;
    } catch (error) {
      logger.error('告警服务 - 获取告警详情失败', { 
        alarmId: id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 解决告警
   * 
   * @description
   * 将告警状态变更为已解决
   * 只有活跃和已确认状态的告警可以被解决
   * 如果告警是活跃状态且提供了用户ID，会自动确认
   * 
   * @param {number} id - 告警ID
   * @param {number} userId - 用户ID（可选，用于自动确认活跃告警）
   * @returns {Promise<Object>} 解决后的告警信息
   * @throws {NotFoundError} 告警不存在
   * @throws {BusinessError} 告警状态不允许解决
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const alarm = await alarmService.resolveAlarm(1, 1001);
   */
  async resolveAlarm(id, userId = null) {
    try {
      logger.info('告警服务 - 解决告警', { 
        alarmId: id, 
        userId 
      });

      // 验证参数
      if (!id || id <= 0) {
        throw new ValidationError('告警ID必须为正整数');
      }

      if (userId && userId <= 0) {
        throw new ValidationError('用户ID必须为正整数');
      }

      // 查询告警记录
      const alarm = await this.CraneAlarm.findByPk(id);

      // 检查告警是否存在
      if (!alarm) {
        logger.warn('告警服务 - 告警不存在', { alarmId: id });
        throw new NotFoundError('告警不存在', { alarmId: id });
      }

      // 使用模型实例方法解决告警
      await alarm.resolve({ userId });

      // 重新查询以获取关联数据
      const updatedAlarm = await this.CraneAlarm.findByPk(id, {
        include: [
          {
            model: this.Crane,
            as: 'crane',
            attributes: ['id', 'crane_no', 'name', 'status'],
            required: false,
          },
          {
            model: this.User,
            as: 'acknowledger',
            attributes: ['id', 'username', 'real_name'],
            required: false,
          },
        ],
      });

      // 记录操作日志
      logger.info('告警服务 - 告警已解决', {
        alarmId: id,
        alarmType: alarm.alarm_type,
        alarmLevel: alarm.alarm_level,
        resolvedBy: userId,
      });

      return updatedAlarm;
    } catch (error) {
      logger.error('告警服务 - 解决告警失败', { 
        alarmId: id, 
        userId, 
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

// =====================================================
// 创建服务实例并导出
// =====================================================

const alarmService = new AlarmService();

module.exports = alarmService;