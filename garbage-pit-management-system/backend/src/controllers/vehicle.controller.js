/**
 * 垃圾储坑智能化管控系统 - 车辆记录控制器
 *
 * 该文件负责处理所有车辆记录相关的业务逻辑
 * 包括：获取列表、获取详情、创建记录、更新离开时间等
 *
 * @module controllers/vehicle.controller
 * @author 华工三峰
 */

'use strict';

const logger = require('../utils/logger');
const { NotFoundError, BusinessError, ValidationError } = require('../middlewares/error.middleware');
const db = require('../models');

// =====================================================
// 辅助函数
// =====================================================

/**
 * 格式化车辆记录返回数据
 * 将数据库字段名转换为驼峰命名
 *
 * @param {Object} record - 数据库记录对象
 * @returns {Object} 格式化后的数据
 */
const formatVehicleRecord = (record) => {
  if (!record) return null;

  return {
    id: record.id,
    vehicleNo: record.vehicle_no,
    vehicleType: record.vehicle_type,
    driverName: record.driver_name,
    recordType: record.record_type,
    recordTypeName: record.getRecordTypeName ? record.getRecordTypeName() : getRecordTypeName(record.record_type),
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
  };
};

/**
 * 获取记录类型中文名称
 *
 * @param {string} recordType - 记录类型代码
 * @returns {string} 中文名称
 */
const getRecordTypeName = (recordType) => {
  const typeNames = {
    discharge: '卸料',
    enter: '进场',
    exit: '出场',
    transport: '运料',
  };
  return typeNames[recordType] || '未知类型';
};

/**
 * 计算在场时长（分钟）
 *
 * @param {Date|string} enterTime - 进场时间
 * @param {Date|string} exitTime - 出场时间
 * @returns {number|null} 在场时长（分钟）
 */
const calculateDuration = (enterTime, exitTime) => {
  if (!enterTime) return null;

  const start = new Date(enterTime);
  const end = exitTime ? new Date(exitTime) : new Date();
  const duration = Math.floor((end - start) / (1000 * 60));

  return duration > 0 ? duration : 0;
};

// =====================================================
// 控制器方法
// =====================================================

/**
 * 获取车辆记录列表
 *
 * @route GET /api/v1/vehicles
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const getVehicleList = async (req, res, next) => {
  try {
    // 获取查询参数
    const {
      recordType,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

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
        where.created_at[db.Sequelize.Op.gte] = new Date(startDate);
      }
      if (endDate) {
        // 设置结束日期为当天的23:59:59
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.created_at[db.Sequelize.Op.lte] = endOfDay;
      }
    }

    // 计算偏移量
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 查询数据库
    const { count, rows } = await db.VehicleRecord.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
      // 可以选择性地关联区域信息
      include: [
        {
          model: db.Area,
          as: 'area',
          required: false,
          attributes: ['id', 'area_no', 'name', 'type'],
        },
      ],
    });

    // 格式化返回数据
    const formattedRows = rows.map(formatVehicleRecord);

    // 记录日志
    logger.info('获取车辆记录列表', {
      userId: req.user?.id,
      query: req.query,
      total: count,
    });

    // 返回成功响应
    res.json({
      success: true,
      data: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
        list: formattedRows,
      },
    });
  } catch (error) {
    logger.error('获取车辆记录列表失败', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * 获取单条车辆记录
 *
 * @route GET /api/v1/vehicles/:id
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 查询记录
    const record = await db.VehicleRecord.findByPk(id, {
      include: [
        {
          model: db.Area,
          as: 'area',
          required: false,
          attributes: ['id', 'area_no', 'name', 'type'],
        },
      ],
    });

    // 检查记录是否存在
    if (!record) {
      throw new NotFoundError('车辆记录不存在');
    }

    // 记录日志
    logger.info('获取车辆记录详情', {
      userId: req.user?.id,
      recordId: id,
    });

    // 返回成功响应
    res.json({
      success: true,
      data: formatVehicleRecord(record),
    });
  } catch (error) {
    logger.error('获取车辆记录详情失败', {
      error: error.message,
      recordId: req.params.id,
    });
    next(error);
  }
};

/**
 * 创建车辆记录
 *
 * @route POST /api/v1/vehicles
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const createVehicle = async (req, res, next) => {
  try {
    // 获取请求体数据
    const {
      vehicleNo,
      vehicleType,
      driverName,
      recordType,
      materialType,
      weight,
      areaId,
      gateNo,
    } = req.body;

    // 如果提供了区域ID，检查区域是否存在
    if (areaId) {
      const area = await db.Area.findByPk(areaId);
      if (!area) {
        throw new BusinessError('指定的区域不存在');
      }
    }

    // 创建记录数据
    const recordData = {
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
      recordData.enter_time = new Date();
    }

    // 如果是出场记录，设置出场时间
    if (recordType === 'exit') {
      recordData.exit_time = new Date();
    }

    // 创建记录
    const record = await db.VehicleRecord.create(recordData);

    // 重新查询以获取完整数据（包括关联信息）
    const newRecord = await db.VehicleRecord.findByPk(record.id, {
      include: [
        {
          model: db.Area,
          as: 'area',
          required: false,
          attributes: ['id', 'area_no', 'name', 'type'],
        },
      ],
    });

    // 记录日志
    logger.info('创建车辆记录', {
      userId: req.user?.id,
      recordId: record.id,
      vehicleNo,
      recordType,
    });

    // 返回成功响应
    res.status(201).json({
      success: true,
      data: formatVehicleRecord(newRecord),
      message: '车辆记录创建成功',
    });
  } catch (error) {
    logger.error('创建车辆记录失败', {
      error: error.message,
      stack: error.stack,
      body: req.body,
    });
    next(error);
  }
};

/**
 * 更新车辆离开时间
 *
 * @route PUT /api/v1/vehicles/:id/exit
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const updateExitTime = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 查询记录
    const record = await db.VehicleRecord.findByPk(id);

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
    const updatedRecord = await db.VehicleRecord.findByPk(id, {
      include: [
        {
          model: db.Area,
          as: 'area',
          required: false,
          attributes: ['id', 'area_no', 'name', 'type'],
        },
      ],
    });

    // 记录日志
    logger.info('更新车辆离开时间', {
      userId: req.user?.id,
      recordId: id,
      vehicleNo: record.vehicle_no,
      exitTime: record.exit_time,
    });

    // 返回成功响应
    res.json({
      success: true,
      data: formatVehicleRecord(updatedRecord),
      message: '离开时间更新成功',
    });
  } catch (error) {
    logger.error('更新车辆离开时间失败', {
      error: error.message,
      recordId: req.params.id,
    });
    next(error);
  }
};

// =====================================================
// 导出控制器方法
// =====================================================

module.exports = {
  getVehicleList,
  getVehicleById,
  createVehicle,
  updateExitTime,
};
