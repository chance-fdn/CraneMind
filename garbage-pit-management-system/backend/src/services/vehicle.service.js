/**
 * 垃圾储坑智能化管控系统 - 车辆服务
 * 
 * 该文件实现了车辆记录相关的业务逻辑，包括车辆记录管理、进出场时间更新等。
 * 服务层负责处理业务逻辑，与数据库交互，为控制器提供数据服务。
 * 
 * 主要功能：
 * 1. 车辆记录列表查询（分页、搜索、筛选）
 * 2. 车辆记录详情获取
 * 3. 车辆记录创建（业务验证、区域验证）
 * 4. 车辆离开时间更新（业务验证）
 * 
 * @module services/vehicle.service
 * @author 华工三峰
 */

'use strict';

// 引入依赖
const { VehicleRecord, Area } = require('../models');
const { 
  ValidationError, 
  NotFoundError, 
  BusinessError,
} = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

/**
 * 车辆服务类
 * 
 * @class VehicleService
 */
class VehicleService {
  /**
   * 构造函数
   * 
   * @constructor
   */
  constructor() {
    this.VehicleRecord = VehicleRecord;
    this.Area = Area;
  }

  /**
   * 获取车辆记录列表
   * 
   * @description
   * 根据查询参数获取车辆记录列表，支持分页、记录类型筛选和日期范围筛选
   * 查询结果包含车辆记录的基本信息和关联的区域信息
   * 
   * @param {Object} params - 查询参数
   * @param {string} params.recordType - 记录类型筛选（discharge/enter/exit/transport）
   * @param {string} params.startDate - 开始日期（YYYY-MM-DD格式）
   * @param {string} params.endDate - 结束日期（YYYY-MM-DD格式）
   * @param {number} params.page - 页码，默认1
   * @param {number} params.limit - 每页数量，默认10
   * @returns {Promise<Object>} 分页结果对象
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const result = await vehicleService.getVehicleList({
   *   recordType: 'discharge',
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31',
   *   page: 1,
   *   limit: 10,
   * });
   */
  async getVehicleList(params = {}) {
    try {
      const {
        recordType,
        startDate,
        endDate,
        page = 1,
        limit = 10,
      } = params;

      logger.info('车辆服务 - 获取车辆记录列表', { params });

      // 构建查询条件
      const where = {};

      // 记录类型筛选
      if (recordType) {
        where.record_type = recordType;
      }

      // 日期范围筛选
      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) {
          where.created_at[this.VehicleRecord.sequelize.Sequelize.Op.gte] = new Date(startDate);
        }
        if (endDate) {
          // 设置结束日期为当天的23:59:59
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          where.created_at[this.VehicleRecord.sequelize.Sequelize.Op.lte] = endOfDay;
        }
      }

      // 计算偏移量
      const offset = (page - 1) * limit;

      // 执行查询
      const { count, rows } = await this.VehicleRecord.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']],
        include: [
          {
            model: this.Area,
            as: 'area',
            required: false,
            attributes: ['id', 'area_no', 'name', 'type'],
          },
        ],
      });

      // 计算总页数
      const totalPages = Math.ceil(count / limit);

      // 格式化返回数据
      const formattedRows = rows.map(record => this.formatVehicleRecord(record));

      logger.info('车辆服务 - 获取车辆记录列表成功', { 
        total: count, 
        page, 
        limit, 
        totalPages 
      });

      return {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        list: formattedRows,
      };
    } catch (error) {
      logger.error('车辆服务 - 获取车辆记录列表失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 根据ID获取车辆记录
   * 
   * @description
   * 根据车辆记录ID获取详细信息，包含关联的区域信息
   * 
   * @param {number} id - 车辆记录ID
   * @returns {Promise<Object>} 车辆记录信息对象
   * @throws {NotFoundError} 车辆记录不存在
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const record = await vehicleService.getVehicleById(1);
   */
  async getVehicleById(id) {
    try {
      logger.info('车辆服务 - 根据ID获取车辆记录', { recordId: id });

      // 查询车辆记录
      const record = await this.VehicleRecord.findByPk(id, {
        include: [
          {
            model: this.Area,
            as: 'area',
            required: false,
            attributes: ['id', 'area_no', 'name', 'type'],
          },
        ],
      });

      // 检查记录是否存在
      if (!record) {
        logger.warn('车辆服务 - 车辆记录不存在', { recordId: id });
        throw new NotFoundError('车辆记录不存在');
      }

      logger.info('车辆服务 - 获取车辆记录成功', { recordId: id });

      return this.formatVehicleRecord(record);
    } catch (error) {
      logger.error('车辆服务 - 获取车辆记录失败', { 
        recordId: id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 创建车辆记录
   * 
   * @description
   * 创建新的车辆记录，验证区域是否存在，根据记录类型自动设置进出场时间
   * 
   * @param {Object} vehicleData - 车辆记录数据
   * @param {string} vehicleData.vehicleNo - 车牌号（必填）
   * @param {string} vehicleData.vehicleType - 车辆类型（可选）
   * @param {string} vehicleData.driverName - 驾驶员姓名（可选）
   * @param {string} vehicleData.recordType - 记录类型（必填，discharge/enter/exit/transport）
   * @param {string} vehicleData.materialType - 物料类型（可选）
   * @param {number} vehicleData.weight - 重量（吨，可选）
   * @param {number} vehicleData.areaId - 区域ID（可选）
   * @param {string} vehicleData.gateNo - 门号（可选）
   * @returns {Promise<Object>} 创建的车辆记录信息
   * @throws {ValidationError} 参数验证失败
   * @throws {NotFoundError} 区域不存在
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const record = await vehicleService.createVehicle({
   *   vehicleNo: '粤A12345',
   *   vehicleType: '垃圾车',
   *   driverName: '张三',
   *   recordType: 'discharge',
   *   materialType: '生活垃圾',
   *   weight: 5.5,
   *   areaId: 1,
   *   gateNo: '1号门',
   * });
   */
  async createVehicle(vehicleData) {
    try {
      const {
        vehicleNo,
        vehicleType,
        driverName,
        recordType,
        materialType,
        weight,
        areaId,
        gateNo,
      } = vehicleData;

      logger.info('车辆服务 - 创建车辆记录', { 
        vehicleNo, 
        recordType, 
        areaId 
      });

      // 验证必填字段
      if (!vehicleNo) {
        throw new ValidationError('车牌号不能为空');
      }
      if (!recordType) {
        throw new ValidationError('记录类型不能为空');
      }

      // 验证记录类型
      const validRecordTypes = ['discharge', 'enter', 'exit', 'transport'];
      if (!validRecordTypes.includes(recordType)) {
        throw new ValidationError(`记录类型无效，必须是: ${validRecordTypes.join(', ')}`);
      }

      // 如果提供了区域ID，检查区域是否存在
      if (areaId) {
        const area = await this.Area.findByPk(areaId);
        if (!area) {
          throw new NotFoundError('指定的区域不存在');
        }
      }

      // 准备创建数据
      const createData = {
        vehicle_no: vehicleNo,
        vehicle_type: vehicleType || null,
        driver_name: driverName || null,
        record_type: recordType,
        material_type: materialType || null,
        weight: weight || null,
        area_id: areaId || null,
        gate_no: gateNo || null,
      };

      // 根据记录类型设置进入时间
      if (recordType === 'enter' || recordType === 'discharge') {
        createData.enter_time = new Date();
      }

      // 如果是出场记录，设置出场时间
      if (recordType === 'exit') {
        createData.exit_time = new Date();
      }

      // 创建车辆记录
      const record = await this.VehicleRecord.create(createData);

      // 重新查询以获取完整数据（包括关联信息）
      const newRecord = await this.VehicleRecord.findByPk(record.id, {
        include: [
          {
            model: this.Area,
            as: 'area',
            required: false,
            attributes: ['id', 'area_no', 'name', 'type'],
          },
        ],
      });

      logger.info('车辆服务 - 创建车辆记录成功', { 
        recordId: record.id, 
        vehicleNo, 
        recordType 
      });

      return this.formatVehicleRecord(newRecord);
    } catch (error) {
      logger.error('车辆服务 - 创建车辆记录失败', { 
        vehicleNo: vehicleData.vehicleNo, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 更新车辆离开时间
   * 
   * @description
   * 更新指定车辆记录的离开时间，验证记录是否存在、是否有进场记录、是否已有离开时间
   * 
   * @param {number} id - 车辆记录ID
   * @returns {Promise<Object>} 更新后的车辆记录信息
   * @throws {NotFoundError} 车辆记录不存在
   * @throws {BusinessError} 业务逻辑验证失败（无进场记录、已有离开时间）
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const record = await vehicleService.updateVehicleExit(1);
   */
  async updateVehicleExit(id) {
    try {
      logger.info('车辆服务 - 更新车辆离开时间', { recordId: id });

      // 查询车辆记录
      const record = await this.VehicleRecord.findByPk(id);

      // 检查记录是否存在
      if (!record) {
        throw new NotFoundError('车辆记录不存在');
      }

      // 检查是否已有离开时间
      if (record.exit_time) {
        throw new BusinessError('该车辆已离开，无法重复设置离开时间');
      }

      // 检查是否有进场时间
      if (!record.enter_time) {
        throw new BusinessError('该车辆无进场记录，无法设置离开时间');
      }

      // 更新离开时间
      await record.update({
        exit_time: new Date(),
      });

      // 重新查询以获取完整数据
      const updatedRecord = await this.VehicleRecord.findByPk(id, {
        include: [
          {
            model: this.Area,
            as: 'area',
            required: false,
            attributes: ['id', 'area_no', 'name', 'type'],
          },
        ],
      });

      logger.info('车辆服务 - 更新车辆离开时间成功', { 
        recordId: id, 
        vehicleNo: record.vehicle_no, 
        exitTime: record.exit_time 
      });

      return this.formatVehicleRecord(updatedRecord);
    } catch (error) {
      logger.error('车辆服务 - 更新车辆离开时间失败', { 
        recordId: id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 格式化车辆记录返回数据
   * 
   * @description
   * 将数据库字段名转换为驼峰命名，并计算相关字段（在场时长、是否在场等）
   * 
   * @param {Object} record - 数据库记录对象
   * @returns {Object} 格式化后的数据
   * 
   * @private
   */
  formatVehicleRecord(record) {
    if (!record) return null;

    // 计算在场时长（分钟）
    const calculateDuration = (enterTime, exitTime) => {
      if (!enterTime) return null;

      const start = new Date(enterTime);
      const end = exitTime ? new Date(exitTime) : new Date();
      const duration = Math.floor((end - start) / (1000 * 60));

      return duration > 0 ? duration : 0;
    };

    // 获取记录类型中文名称
    const getRecordTypeName = (recordType) => {
      const typeNames = {
        discharge: '卸料',
        enter: '进场',
        exit: '出场',
        transport: '运料',
      };
      return typeNames[recordType] || '未知类型';
    };

    return {
      id: record.id,
      vehicleNo: record.vehicle_no,
      vehicleType: record.vehicle_type,
      driverName: record.driver_name,
      recordType: record.record_type,
      recordTypeName: getRecordTypeName(record.record_type),
      materialType: record.material_type,
      weight: record.weight ? parseFloat(record.weight) : null,
      areaId: record.area_id,
      gateNo: record.gate_no,
      enterTime: record.enter_time,
      exitTime: record.exit_time,
      createdAt: record.created_at,
      // 计算在场时长
      duration: calculateDuration(record.enter_time, record.exit_time),
      // 是否在场
      isInFactory: record.enter_time && !record.exit_time,
      // 区域信息
      area: record.area ? {
        id: record.area.id,
        areaNo: record.area.area_no,
        name: record.area.name,
        type: record.area.type,
      } : null,
    };
  }

  /**
   * 根据车牌号查找车辆记录
   * 
   * @description
   * 根据车牌号查找相关的车辆记录，按创建时间倒序排列
   * 
   * @param {string} vehicleNo - 车牌号
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Object>>} 车辆记录列表
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const records = await vehicleService.findByVehicleNo('粤A12345');
   */
  async findByVehicleNo(vehicleNo, options = {}) {
    try {
      logger.info('车辆服务 - 根据车牌号查找车辆记录', { vehicleNo });

      const records = await this.VehicleRecord.findByVehicleNo(vehicleNo, options);

      logger.info('车辆服务 - 根据车牌号查找车辆记录成功', { 
        vehicleNo, 
        count: records.length 
      });

      return records.map(record => this.formatVehicleRecord(record));
    } catch (error) {
      logger.error('车辆服务 - 根据车牌号查找车辆记录失败', { 
        vehicleNo, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 查找在场车辆
   * 
   * @description
   * 查找所有已进场但未出场的车辆记录
   * 
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Object>>} 在场车辆记录列表
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const inFactoryVehicles = await vehicleService.findInFactory();
   */
  async findInFactory(options = {}) {
    try {
      logger.info('车辆服务 - 查找在场车辆');

      const records = await this.VehicleRecord.findInFactory(options);

      logger.info('车辆服务 - 查找在场车辆成功', { 
        count: records.length 
      });

      return records.map(record => this.formatVehicleRecord(record));
    } catch (error) {
      logger.error('车辆服务 - 查找��场车辆失败', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 获取车辆统计信息
   * 
   * @description
   * 获取车辆记录总数、各类型记录数量、在场车辆数量等统计信息
   * 
   * @param {Object} options - 统计选项
   * @param {Date} options.startDate - 开始日期
   * @param {Date} options.endDate - 结束日期
   * @returns {Promise<Object>} 统计信息
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const stats = await vehicleService.getStatistics({
   *   startDate: new Date('2024-01-01'),
   *   endDate: new Date('2024-01-31'),
   * });
   */
  async getStatistics(options = {}) {
    try {
      logger.info('车辆服务 - 获取车辆统计信息');

      const stats = await this.VehicleRecord.getStatistics(options);

      logger.info('车辆服务 - 获取车辆统计信息成功', { stats });

      return stats;
    } catch (error) {
      logger.error('车辆服务 - 获取车辆统计信息失败', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 获取每日车辆统计
   * 
   * @description
   * 获取指定日期范围内的每日车辆记录统计
   * 
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Promise<Array<Object>>} 每日统计数据
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const dailyStats = await vehicleService.getDailyStatistics(
   *   new Date('2024-01-01'),
   *   new Date('2024-01-31')
   * );
   */
  async getDailyStatistics(startDate, endDate) {
    try {
      logger.info('车辆服务 - 获取每日车辆统计', { startDate, endDate });

      const dailyStats = await this.VehicleRecord.getDailyStatistics(startDate, endDate);

      logger.info('车辆服务 - 获取每日车辆统计成功', { 
        count: dailyStats.length 
      });

      return dailyStats;
    } catch (error) {
      logger.error('车辆服务 - 获取每日车辆统计失败', { 
        error: error.message 
      });
      throw error;
    }
  }
}

// =====================================================
// 创建服务实例并导出
// =====================================================

const vehicleService = new VehicleService();

module.exports = vehicleService;