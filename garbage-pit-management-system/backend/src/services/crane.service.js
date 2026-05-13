/**
 * 垃圾储坑智能化管控系统 - 行车服务
 * 
 * 该文件实现了行车相关的业务逻辑，包括行车状态管理、控制操作、职责配置等。
 * 服务层负责处理业务逻辑，与数据库交互，为控制器提供数据服务。
 * 
 * 主要功能：
 * 1. 行车列表查询（分页、搜索、筛选）
 * 2. 行车信息获取（详情、状态、位置等）
 * 3. 行车状态更新（在线/离线/运行中/待机/故障）
 * 4. 行车控制操作（启动/停止/急停）
 * 5. 行车职责配置（投料/堆料/翻料/移料）
 * 6. 行车告警查询（分页、状态筛选）
 * 7. 行车位置更新与查询
 * 8. 行车统计信息获取
 * 
 * @module services/crane.service
 * @author 华工三峰
 */

'use strict';

// 引入依赖
const { Crane, CraneAlarm } = require('../models');
const { 
  ValidationError, 
  NotFoundError, 
  BusinessError,
} = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

/**
 * 行车服务类
 * 
 * @class CraneService
 */
class CraneService {
  /**
   * 构造函数
   * 
   * @constructor
   */
  constructor() {
    this.Crane = Crane;
    this.CraneAlarm = CraneAlarm;
  }

  /**
   * 获取行车列表
   * 
   * @description
   * 获取所有行车信息，支持排序
   * 
   * @returns {Promise<Array<Object>>} 行车列表
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const cranes = await craneService.getCraneList();
   */
  async getCraneList() {
    try {
      logger.info('行车服务 - 获取行车列表');

      // 查询所有行车，按行车编号排序
      const cranes = await this.Crane.findAll({
        order: [['crane_no', 'ASC']],
      });

      logger.info('行车服务 - 获取行车列表成功', { 
        count: cranes.length 
      });

      return cranes;
    } catch (error) {
      logger.error('行车服务 - 获取行车列表失败', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 根据ID获取行车信息
   * 
   * @description
   * 根据行车ID获取行车详细信息
   * 
   * @param {number} id - 行车ID
   * @returns {Promise<Object>} 行车信息对象
   * @throws {NotFoundError} 行车不存在
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const crane = await craneService.getCraneById(1);
   */
  async getCraneById(id) {
    try {
      logger.info('行车服务 - 根据ID获取行车信息', { craneId: id });

      // 查询行车
      const crane = await this.Crane.findByPk(id);

      // 检查行车是否存在
      if (!crane) {
        logger.warn('行车服务 - 行车不存在', { craneId: id });
        throw new NotFoundError('行车不存在');
      }

      logger.info('行车服务 - 获取行车信息成功', { 
        craneId: id, 
        craneNo: crane.crane_no 
      });

      return crane;
    } catch (error) {
      logger.error('行车服务 - 获取行车信息失败', { 
        craneId: id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 更新行车状态
   * 
   * @description
   * 更新行车状态和控制模式
   * 验证行车状态和急停状态
   * 
   * @param {number} id - 行车ID
   * @param {Object} statusData - 状态数据
   * @param {string} statusData.status - 新状态（online/offline/running/standby/fault）
   * @param {string} statusData.mode - 控制模式（auto/manual）
   * @returns {Promise<Object>} 更新后的行车信息
   * @throws {NotFoundError} 行车不存在
   * @throws {ValidationError} 参数验证失败
   * @throws {BusinessError} 业务逻辑错误
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const crane = await craneService.updateCraneStatus(1, {
   *   status: 'running',
   *   mode: 'auto',
   * });
   */
  async updateCraneStatus(id, statusData) {
    try {
      const { status, mode } = statusData;

      logger.info('行车服务 - 更新行车状态', { 
        craneId: id, 
        statusData 
      });

      // 查询行车
      const crane = await this.Crane.findByPk(id);

      // 检查行车是否存在
      if (!crane) {
        throw new NotFoundError('行车不存在');
      }

      // 检查行车是否处于急停状态
      if (crane.emergency_stop && status !== 'fault') {
        throw new BusinessError('行车处于急停状态，必须先解除急停才能修改状态');
      }

      // 准备更新数据
      const updateData = {};

      // 更新状态
      if (status) {
        // 验证状态值
        const validStatuses = ['online', 'offline', 'running', 'standby', 'fault'];
        if (!validStatuses.includes(status)) {
          throw new ValidationError(`状态值无效，必须是: ${validStatuses.join(', ')}`);
        }
        updateData.status = status;
      }

      // 更新控制模式
      if (mode) {
        // 验证控制模式值
        const validModes = ['auto', 'manual'];
        if (!validModes.includes(mode)) {
          throw new ValidationError(`控制模式值无效，必须是: ${validModes.join(', ')}`);
        }

        // 如果行车正在运行，不允许切换模式
        if (crane.status === 'running' && mode !== crane.mode) {
          throw new BusinessError('行车正在运行中，请先停止任务后再切换控制模式');
        }

        updateData.mode = mode;
      }

      // 执行更新
      await crane.update(updateData);

      logger.info('行车服务 - 更新行车状态成功', { 
        craneId: id, 
        craneNo: crane.crane_no, 
        updateData 
      });

      return crane;
    } catch (error) {
      logger.error('行车服务 - 更新行车状态失败', { 
        craneId: id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 行车控制
   * 
   * @description
   * 执行行车控制操作：启动、停止、急停
   * 验证行车状态和可用性
   * 
   * @param {number} id - 行车ID
   * @param {Object} controlData - 控制数据
   * @param {string} controlData.action - 控制动作（start/stop/emergency_stop）
   * @param {string} controlData.direction - 方向（可选）
   * @param {number} controlData.speed - 速度（可选，米/秒）
   * @returns {Promise<Object>} 控制结果
   * @throws {NotFoundError} 行车不存在
   * @throws {ValidationError} 参数验证失败
   * @throws {BusinessError} 业务逻辑错误
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const result = await craneService.controlCrane(1, {
   *   action: 'start',
   *   direction: 'forward',
   *   speed: 2.5,
   * });
   */
  async controlCrane(id, controlData) {
    try {
      const { action, direction, speed } = controlData;

      logger.info('行车服务 - 行车控制操作', { 
        craneId: id, 
        controlData 
      });

      // 查询行车
      const crane = await this.Crane.findByPk(id);

      // 检查行车是否存在
      if (!crane) {
        throw new NotFoundError('行车不存在');
      }

      // 检查行车是否启用
      if (!crane.is_enabled) {
        throw new BusinessError('行车已被禁用，无法执行控制操作');
      }

      // 检查行车是否处于急停状态
      if (crane.emergency_stop) {
        throw new BusinessError('行车处于急停状态，无法执行控制操作');
      }

      // 处理不同的控制动作
      let result = {};
      switch (action) {
        case 'start':
          // 启动行车
          if (crane.status === 'running') {
            throw new BusinessError('行车已在运行中');
          }

          // 验证速度范围
          if (speed !== undefined) {
            if (speed < 0 || speed > 10) {
              throw new ValidationError('速度必须在0-10米/秒之间');
            }
          }

          await crane.update({
            status: 'running',
            speed: speed || crane.speed,
          });
          result = { 
            message: '行车已启动', 
            crane: crane,
            action: 'start',
            direction: direction,
            speed: speed || crane.speed,
          };
          break;

        case 'stop':
          // 停止行车
          if (crane.status !== 'running') {
            throw new BusinessError('行车未在运行中');
          }

          await crane.update({
            status: 'standby',
            speed: 0,
          });
          result = { 
            message: '行车已停止', 
            crane: crane,
            action: 'stop',
          };
          break;

        case 'emergency_stop':
          // 紧急停止
          await crane.triggerEmergencyStop();
          result = { 
            message: '行车已紧急停止', 
            crane: crane,
            action: 'emergency_stop',
          };
          break;

        default:
          throw new ValidationError('无效的控制动作，必须是: start, stop, emergency_stop');
      }

      logger.info('行车服务 - 行车控制操作成功', { 
        craneId: id, 
        craneNo: crane.crane_no, 
        action, 
        result 
      });

      return result;
    } catch (error) {
      logger.error('行车服务 - 行车控制操作失败', { 
        craneId: id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 配置行车职责
   * 
   * @description
   * 配置行车的职责：投料、堆料、翻料、移料
   * 验证行车状态和可用性
   * 
   * @param {number} id - 行车ID
   * @param {string} duty - 职责类型（feeding/stacking/turning/moving）
   * @returns {Promise<Object>} 配置结果
   * @throws {NotFoundError} 行车不存在
   * @throws {ValidationError} 参数验证失败
   * @throws {BusinessError} 业务逻辑错误
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const crane = await craneService.configureCraneDuty(1, 'feeding');
   */
  async configureCraneDuty(id, duty) {
    try {
      logger.info('行车服务 - 配置行车职责', { 
        craneId: id, 
        duty 
      });

      // 查询行车
      const crane = await this.Crane.findByPk(id);

      // 检查行车是否存在
      if (!crane) {
        throw new NotFoundError('行车不存在');
      }

      // 检查行车是否启用
      if (!crane.is_enabled) {
        throw new BusinessError('行车已被禁用，无法配置职责');
      }

      // 验证职责类型
      const validDuties = ['feeding', 'stacking', 'turning', 'moving'];
      if (!validDuties.includes(duty)) {
        throw new ValidationError(`职责类型无效，必须是: ${validDuties.join(', ')}`);
      }

      // 如果行车正在执行其他任务，需要先完成
      if (crane.status === 'running' && crane.duty && crane.duty !== duty) {
        throw new BusinessError(`行车正在执行${crane.duty}任务，请先完成当前任务`);
      }

      // 更新职责
      await crane.update({ duty });

      logger.info('行车服务 - 配置行车职责成功', { 
        craneId: id, 
        craneNo: crane.crane_no, 
        duty 
      });

      return crane;
    } catch (error) {
      logger.error('行车服务 - 配置行车职责失败', { 
        craneId: id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 获取行车告警列表
   * 
   * @description
   * 获取指定行车的告警列表，支持分页和状态筛选
   * 
   * @param {number} id - 行车ID
   * @param {Object} params - 查询参数
   * @param {string} params.status - 告警状态筛选（active/resolved）
   * @param {number} params.page - 页码，默认1
   * @param {number} params.limit - 每页数量，默认10
   * @returns {Promise<Object>} 分页结果对象
   * @throws {NotFoundError} 行车不存在
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const result = await craneService.getCraneAlarms(1, {
   *   status: 'active',
   *   page: 1,
   *   limit: 10,
   * });
   */
  async getCraneAlarms(id, params = {}) {
    try {
      const { status, page = 1, limit = 10 } = params;

      logger.info('行车服务 - 获取行车告警列表', { 
        craneId: id, 
        params 
      });

      // 检查行车是否存在
      const crane = await this.Crane.findByPk(id);
      if (!crane) {
        throw new NotFoundError('行车不存在');
      }

      // 构建查询条件
      const whereClause = { crane_id: id };
      if (status) {
        // 验证告警状态
        const validStatuses = ['active', 'resolved'];
        if (!validStatuses.includes(status)) {
          throw new ValidationError(`告警状态无效，必须是: ${validStatuses.join(', ')}`);
        }
        whereClause.status = status;
      }

      // 计算偏移量
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // 查询告警（分页）
      const { count, rows: alarms } = await this.CraneAlarm.findAndCountAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        offset,
        limit: parseInt(limit),
      });

      // 计算总页数
      const totalPages = Math.ceil(count / parseInt(limit));

      logger.info('行车服务 - 获取行车告警列表成功', { 
        craneId: id, 
        craneNo: crane.crane_no, 
        total: count, 
        page, 
        limit 
      });

      return {
        list: alarms,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
        },
      };
    } catch (error) {
      logger.error('行车服务 - 获取行车告警列表失败', { 
        craneId: id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 更新行车位置
   * 
   * @description
   * 更新行车的当前位置（X、Y、Z坐标）
   * 验证坐标范围
   * 
   * @param {number} id - 行车ID
   * @param {Object} positionData - 位置数据
   * @param {number} positionData.x - X坐标（米）
   * @param {number} positionData.y - Y坐标（米）
   * @param {number} positionData.z - Z坐标/高度（米）
   * @returns {Promise<Object>} 更新后的行车信息
   * @throws {NotFoundError} 行车不存在
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const crane = await craneService.updateCranePosition(1, {
   *   x: 10.5,
   *   y: 5.2,
   *   z: 3.0,
   * });
   */
  async updateCranePosition(id, positionData) {
    try {
      const { x, y, z } = positionData;

      logger.info('行车服务 - 更新行车位置', { 
        craneId: id, 
        positionData 
      });

      // 查询行车
      const crane = await this.Crane.findByPk(id);

      // 检查行车是否存在
      if (!crane) {
        throw new NotFoundError('行车不存在');
      }

      // 验证坐标范围
      if (x !== undefined) {
        if (x < -9999.99 || x > 9999.99) {
          throw new ValidationError('X坐标必须在-9999.99到9999.99之间');
        }
      }

      if (y !== undefined) {
        if (y < -9999.99 || y > 9999.99) {
          throw new ValidationError('Y坐标必须在-9999.99到9999.99之间');
        }
      }

      if (z !== undefined) {
        if (z < 0 || z > 999.99) {
          throw new ValidationError('Z坐标必须在0到999.99之间');
        }
      }

      // 使用模型方法更新位置
      await crane.updatePosition(x, y, z);

      logger.info('行车服务 - 更新行车位置成功', { 
        craneId: id, 
        craneNo: crane.crane_no, 
        position: { x, y, z } 
      });

      return crane;
    } catch (error) {
      logger.error('行车服务 - 更新行车位置失败', { 
        craneId: id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 获取行车统计信息
   * 
   * @description
   * 获取行车总数及各状态行车数量
   * 
   * @returns {Promise<Object>} 统计信息
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const stats = await craneService.getCraneStatistics();
   */
  async getCraneStatistics() {
    try {
      logger.info('行车服务 - 获取行车统计信息');

      const stats = await this.Crane.getStatistics();

      logger.info('行车服务 - 获取行车统计信息成功', { stats });

      return stats;
    } catch (error) {
      logger.error('行车服务 - 获取行车统计信息失败', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 查找可用的行车
   * 
   * @description
   * 查找所有可用的行车（启用、非急停、在线或待机状态）
   * 
   * @returns {Promise<Array<Object>>} 可用行车列表
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const availableCranes = await craneService.findAvailableCranes();
   */
  async findAvailableCranes() {
    try {
      logger.info('行车服务 - 查找可用的行车');

      const cranes = await this.Crane.findAvailableCranes();

      logger.info('行车服务 - 查找可用的行车成功', { 
        count: cranes.length 
      });

      return cranes;
    } catch (error) {
      logger.error('行车服务 - 查找可用的行车失败', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 根据职责查找行车
   * 
   * @description
   * 根据职责类型查找行车
   * 
   * @param {string} duty - 职责类型（feeding/stacking/turning/moving）
   * @returns {Promise<Array<Object>>} 行车列表
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const feedingCranes = await craneService.findCranesByDuty('feeding');
   */
  async findCranesByDuty(duty) {
    try {
      logger.info('行车服务 - 根据职责查找行车', { duty });

      // 验证职责类型
      const validDuties = ['feeding', 'stacking', 'turning', 'moving'];
      if (!validDuties.includes(duty)) {
        throw new ValidationError(`职责类型无效，必须是: ${validDuties.join(', ')}`);
      }

      const cranes = await this.Crane.findByDuty(duty);

      logger.info('行车服务 - 根据职责查找行车成功', { 
        duty, 
        count: cranes.length 
      });

      return cranes;
    } catch (error) {
      logger.error('行车服务 - 根据职责查找行车失败', { 
        duty, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 根据模式查找行车
   * 
   * @description
   * 根据控制模式查找行车
   * 
   * @param {string} mode - 控制模式（auto/manual）
   * @returns {Promise<Array<Object>>} 行车列表
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const autoCranes = await craneService.findCranesByMode('auto');
   */
  async findCranesByMode(mode) {
    try {
      logger.info('行车服务 - 根据模式查找行车', { mode });

      // 验证控制模式
      const validModes = ['auto', 'manual'];
      if (!validModes.includes(mode)) {
        throw new ValidationError(`控制模式无效，必须是: ${validModes.join(', ')}`);
      }

      const cranes = await this.Crane.findByMode(mode);

      logger.info('行车服务 - 根据模式查找行车成功', { 
        mode, 
        count: cranes.length 
      });

      return cranes;
    } catch (error) {
      logger.error('行车服务 - 根据模式查找行车失败', { 
        mode, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 批量更新行车状态
   * 
   * @description
   * 批量更新多个行车的状态
   * 
   * @param {Array<number>} craneIds - 行车ID列表
   * @param {string} status - 新状态（online/offline/running/standby/fault）
   * @returns {Promise<number>} 更新的记录数
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const updatedCount = await craneService.batchUpdateCraneStatus([1, 2, 3], 'online');
   */
  async batchUpdateCraneStatus(craneIds, status) {
    try {
      logger.info('行车服务 - 批量更新行车状态', { 
        craneIds, 
        status 
      });

      // 验证状态值
      const validStatuses = ['online', 'offline', 'running', 'standby', 'fault'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError(`状态值无效，必须是: ${validStatuses.join(', ')}`);
      }

      const updatedCount = await this.Crane.batchUpdateStatus(craneIds, status);

      logger.info('行车服务 - 批量更新行车状态成功', { 
        updatedCount, 
        craneIdsCount: craneIds.length 
      });

      return updatedCount;
    } catch (error) {
      logger.error('行车服务 - 批量更新行车状态失败', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 检查行车编号是否已存在
   * 
   * @description
   * 检查行车编号是否已被其他行车使用
   * 可用于创建或更新行车时的编号验证
   * 
   * @param {string} craneNo - 行车编号
   * @param {number} excludeId - 排除的行车ID（用于更新时排除自身）
   * @returns {Promise<boolean>} 是否存在
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const exists = await craneService.isCraneNoExists('crane01');
   */
  async isCraneNoExists(craneNo, excludeId = null) {
    try {
      return await this.Crane.isCraneNoExists(craneNo, excludeId);
    } catch (error) {
      logger.error('行车服务 - 检查行车编号是否存在失败', { 
        craneNo, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 获取需要维护的行车
   * 
   * @description
   * 获取超过指定天数未维护的行车
   * 
   * @param {number} days - 维护周期天数，默认30天
   * @returns {Promise<Array<Object>>} 需要维护的行车列表
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const needMaintenanceCranes = await craneService.findNeedMaintenanceCranes(30);
   */
  async findNeedMaintenanceCranes(days = 30) {
    try {
      logger.info('行车服务 - 获取需要维护的行车', { days });

      const cranes = await this.Crane.findNeedMaintenance(days);

      logger.info('行车服务 - 获取需要维护的行车成功', { 
        days, 
        count: cranes.length 
      });

      return cranes;
    } catch (error) {
      logger.error('行车服务 - 获取需要维护的行车失败', { 
        days, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 记录行车维护
   * 
   * @description
   * 记录行车的维护日期
   * 
   * @param {number} id - 行车ID
   * @returns {Promise<Object>} 更新后的行车信息
   * @throws {NotFoundError} 行车不存在
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const crane = await craneService.recordCraneMaintenance(1);
   */
  async recordCraneMaintenance(id) {
    try {
      logger.info('行车服务 - 记录行车维护', { craneId: id });

      // 查询行车
      const crane = await this.Crane.findByPk(id);

      // 检查行车是否存在
      if (!crane) {
        throw new NotFoundError('行车不存在');
      }

      // 使用模型方法记录维护
      await crane.recordMaintenance();

      logger.info('行车服务 - 记录行车维护成功', { 
        craneId: id, 
        craneNo: crane.crane_no 
      });

      return crane;
    } catch (error) {
      logger.error('行车服务 - 记录行车维护失败', { 
        craneId: id, 
        error: error.message 
      });
      throw error;
    }
  }
}

// =====================================================
// 创建服务实例并导出
// =====================================================

const craneService = new CraneService();

module.exports = craneService;