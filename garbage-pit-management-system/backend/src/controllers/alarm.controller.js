/**
 * 垃圾储坑智能化管控系统 - 告警控制器
 * 
 * 该文件负责处理告警相关的业务逻辑
 * 包括：行车告警查询和确认、大物告警查询、设备告警查询等
 * 
 * @module controllers/alarm.controller
 * @author 华工三峰
 */

'use strict';

const db = require('../models');
const { NotFoundError, BusinessError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

// =====================================================
// 行车告警相关控制器
// =====================================================

/**
 * 获取行车告警列表
 * 
 * @description
 * 查询行车告警列表，支持分页和状态筛选
 * 返回告警详细信息，包括关联的行车信息
 * 
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
async function getCraneAlarms(req, res) {
  try {
    // 获取查询参数
    const {
      status, // 告警状态筛选
      page = 1, // 页码，默认第1页
      limit = 10, // 每页数量，默认10条
    } = req.query;

    // 构建查询条件
    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    // 计算偏移量
    const offset = (page - 1) * limit;

    // 查询告警列表
    const { count, rows } = await db.CraneAlarm.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.Crane,
          as: 'crane',
          attributes: ['id', 'crane_no', 'name', 'status'],
          required: false,
        },
        {
          model: db.User,
          as: 'acknowledger',
          attributes: ['id', 'username', 'real_name'],
          required: false,
        },
      ],
      order: [
        ['alarm_level', 'DESC'], // 按告警级别排序（critical > major > minor）
        ['created_at', 'DESC'], // 按创建时间倒序
      ],
      limit,
      offset,
    });

    // 返回响应
    res.json({
      success: true,
      data: {
        list: rows,
        pagination: {
          total: count,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(count / limit),
        },
      },
      message: '获取行车告警列表成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('获取行车告警列表失败', {
      error: error.message,
      stack: error.stack,
      query: req.query,
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
 * 
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
async function acknowledgeCraneAlarm(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 查询告警记录
    const alarm = await db.CraneAlarm.findByPk(id);

    // 检查告警是否存在
    if (!alarm) {
      throw new NotFoundError('行车告警不存在', { alarmId: id });
    }

    // 检查告警状态是否允许确认
    if (alarm.status !== 'active') {
      throw new BusinessError(
        `无法确认告警：当前告警状态为 ${alarm.getStatusName()}，只有活跃状态的告警可以确认`,
        { currentStatus: alarm.status, alarmId: id }
      );
    }

    // 使用模型实例方法确认告警
    await alarm.acknowledge({ userId });

    // 重新查询以获取关联数据
    const updatedAlarm = await db.CraneAlarm.findByPk(id, {
      include: [
        {
          model: db.Crane,
          as: 'crane',
          attributes: ['id', 'crane_no', 'name', 'status'],
          required: false,
        },
        {
          model: db.User,
          as: 'acknowledger',
          attributes: ['id', 'username', 'real_name'],
          required: false,
        },
      ],
    });

    // 记录操作日志
    logger.info('行车告警已确认', {
      alarmId: id,
      alarmType: alarm.alarm_type,
      alarmLevel: alarm.alarm_level,
      acknowledgedBy: userId,
    });

    // 返回响应
    res.json({
      success: true,
      data: updatedAlarm,
      message: '行车告警确认成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('确认行车告警失败', {
      error: error.message,
      stack: error.stack,
      params: req.params,
      userId: req.user?.id,
    });
    throw error;
  }
}

// =====================================================
// 大物告警相关控制器
// =====================================================

/**
 * 获取大物告警列表
 * 
 * @description
 * 查询大物告警列表，支持分页和状态筛选
 * 返回告警详细信息，包括关联的摄像头信息
 * 
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
async function getLargeObjectAlarms(req, res) {
  try {
    // 获取查询参数
    const {
      status, // 告警状态筛选
      page = 1, // 页码，默认第1页
      limit = 10, // 每页数量，默认10条
    } = req.query;

    // 构建查询条件
    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    // 计算偏移量
    const offset = (page - 1) * limit;

    // 检查 LargeObjectAlarm 模型是否存在
    if (!db.LargeObjectAlarm) {
      // 如果模型不存在，返回空列表（占位实现）
      return res.json({
        success: true,
        data: {
          list: [],
          pagination: {
            total: 0,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            totalPages: 0,
          },
        },
        message: '大物告警模型尚未实现，返回空列表',
        timestamp: new Date().toISOString(),
      });
    }

    // 查询告警列表
    const { count, rows } = await db.LargeObjectAlarm.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.Device,
          as: 'camera',
          attributes: ['id', 'device_no', 'name', 'type'],
          required: false,
        },
        {
          model: db.User,
          as: 'acknowledger',
          attributes: ['id', 'username', 'real_name'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']], // 按创建时间倒序
      limit,
      offset,
    });

    // 返回响应
    res.json({
      success: true,
      data: {
        list: rows,
        pagination: {
          total: count,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(count / limit),
        },
      },
      message: '获取大物告警列表成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('获取大物告警列表失败', {
      error: error.message,
      stack: error.stack,
      query: req.query,
    });
    throw error;
  }
}

// =====================================================
// 设备告警相关控制器
// =====================================================

/**
 * 获取设备告警列表
 * 
 * @description
 * 查询设备告警列表，支持分页和状态筛选
 * 返回告警详细信息，包括关联的设备信息
 * 
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
async function getDeviceAlarms(req, res) {
  try {
    // 获取查询参数
    const {
      status, // 告警状态筛选
      page = 1, // 页码，默认第1页
      limit = 10, // 每页数量，默认10条
    } = req.query;

    // 构建查询条件
    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    // 计算偏移量
    const offset = (page - 1) * limit;

    // 检查 DeviceAlarm 模型是否存在
    if (!db.DeviceAlarm) {
      // 如果模型不存在，返回空列表（占位实现）
      return res.json({
        success: true,
        data: {
          list: [],
          pagination: {
            total: 0,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            totalPages: 0,
          },
        },
        message: '设备告警模型尚未实现，返回空列表',
        timestamp: new Date().toISOString(),
      });
    }

    // 查询告警列表
    const { count, rows } = await db.DeviceAlarm.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.Device,
          as: 'device',
          attributes: ['id', 'device_no', 'name', 'type', 'status'],
          required: false,
        },
        {
          model: db.User,
          as: 'acknowledger',
          attributes: ['id', 'username', 'real_name'],
          required: false,
        },
      ],
      order: [
        ['alarm_level', 'DESC'], // 按告警级别排序
        ['created_at', 'DESC'], // 按创建时间倒序
      ],
      limit,
      offset,
    });

    // 返回响应
    res.json({
      success: true,
      data: {
        list: rows,
        pagination: {
          total: count,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(count / limit),
        },
      },
      message: '获取设备告警列表成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('获取设备告警列表失败', {
      error: error.message,
      stack: error.stack,
      query: req.query,
    });
    throw error;
  }
}

// =====================================================
// 导出控制器
// =====================================================

module.exports = {
  // 行车告警
  getCraneAlarms,
  acknowledgeCraneAlarm,

  // 大物告警
  getLargeObjectAlarms,

  // 设备告警
  getDeviceAlarms,
};
