/**
 * 垃圾储坑智能化管控系统 - 行车控制器
 * 
 * 该文件负责处理所有行车相关的业务逻辑
 * 包括：行车列表查询、状态更新、控制操作、职责配置、告警查询等
 * 
 * @module controllers/crane.controller
 * @author 华工三峰
 */

'use strict';

const logger = require('../utils/logger');
const { ValidationError, NotFoundError, BusinessError } = require('../middlewares/error.middleware');
const db = require('../models');

// =====================================================
// 控制器方法
// =====================================================

/**
 * 获取行车列表
 * 
 * @route GET /api/v1/cranes
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const getCraneList = async (req, res, next) => {
  try {
    // 查询所有行车
    const cranes = await db.Crane.findAll({
      order: [['crane_no', 'ASC']],
    });

    // 记录查询日志
    logger.info('查询行车列表', {
      count: cranes.length,
      userId: req.user?.id,
    });

    // 返回成功响应
    res.json({
      success: true,
      data: cranes,
      message: '获取行车列表成功',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取单个行车信息
 * 
 * @route GET /api/v1/cranes/:id
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const getCraneById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 查询行车
    const crane = await db.Crane.findByPk(id);

    // 检查行车是否存在
    if (!crane) {
      throw new NotFoundError('行车不存在');
    }

    // 记录查询日志
    logger.info('查询行车详情', {
      craneId: id,
      craneNo: crane.crane_no,
      userId: req.user?.id,
    });

    // 返回成功响应
    res.json({
      success: true,
      data: crane,
      message: '获取行车信息成功',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新行车状态
 * 
 * @route PUT /api/v1/cranes/:id/status
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const updateCraneStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, mode } = req.body;

    // 查询行车
    const crane = await db.Crane.findByPk(id);

    // 检查行车是否存在
    if (!crane) {
      throw new NotFoundError('行车不存在');
    }

    // 检查行车是否处于急停状态
    if (crane.emergency_stop && status !== 'fault') {
      throw new BusinessError('行车处于急停状态，必须先解除急停才能修改状态');
    }

    // 更新状态
    const updateData = {};
    if (status) {
      updateData.status = status;
    }
    if (mode) {
      // 如果行车正在运行，不允许切换模式
      if (crane.status === 'running' && mode !== crane.mode) {
        throw new BusinessError('行车正在运行中，请先停止任务后再切换控制模式');
      }
      updateData.mode = mode;
    }

    // 执行更新
    await crane.update(updateData);

    // 记录操作日志
    logger.info('更新行车状态', {
      craneId: id,
      craneNo: crane.crane_no,
      updateData,
      userId: req.user?.id,
    });

    // 返回成功响应
    res.json({
      success: true,
      data: crane,
      message: '行车状态更新成功',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 行车控制
 * 
 * @route POST /api/v1/cranes/:id/control
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const controlCrane = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, direction, speed } = req.body;

    // 查询行车
    const crane = await db.Crane.findByPk(id);

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
        await crane.update({
          status: 'running',
          speed: speed || crane.speed,
        });
        result = { message: '行车已启动', crane };
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
        result = { message: '行车已停止', crane };
        break;

      case 'emergency_stop':
        // 紧急停止
        await crane.triggerEmergencyStop();
        result = { message: '行车已紧急停止', crane };
        break;

      default:
        throw new ValidationError('无效的控制动作');
    }

    // 记录操作日志
    logger.info('行车控制操作', {
      craneId: id,
      craneNo: crane.crane_no,
      action,
      direction,
      speed,
      userId: req.user?.id,
    });

    // 返回成功响应
    res.json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 配置行车职责
 * 
 * @route PUT /api/v1/cranes/:id/duty
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const configureCraneDuty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { duty } = req.body;

    // 查询行车
    const crane = await db.Crane.findByPk(id);

    // 检查行车是否存在
    if (!crane) {
      throw new NotFoundError('行车不存在');
    }

    // 检查行车是否启用
    if (!crane.is_enabled) {
      throw new BusinessError('行车已被禁用，无法配置职责');
    }

    // 如果行车正在执行其他任务，需要先完成
    if (crane.status === 'running' && crane.duty && crane.duty !== duty) {
      throw new BusinessError(`行车正在执行${crane.duty}任务，请先完成当前任务`);
    }

    // 更新职责
    await crane.update({ duty });

    // 记录操作日志
    logger.info('配置行车职责', {
      craneId: id,
      craneNo: crane.crane_no,
      duty,
      userId: req.user?.id,
    });

    // 返回成功响应
    res.json({
      success: true,
      data: crane,
      message: '行车职责配置成功',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取行车告警列表
 * 
 * @route GET /api/v1/cranes/:id/alarms
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const getCraneAlarms = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // 检查行车是否存在
    const crane = await db.Crane.findByPk(id);
    if (!crane) {
      throw new NotFoundError('行车不存在');
    }

    // 构建查询条件
    const whereClause = { crane_id: id };
    if (status) {
      whereClause.status = status;
    }

    // 查询告警（分页）
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows: alarms } = await db.CraneAlarm.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(limit),
    });

    // 记录查询日志
    logger.info('查询行车告警列表', {
      craneId: id,
      craneNo: crane.crane_no,
      status,
      page,
      limit,
      total: count,
      userId: req.user?.id,
    });

    // 返回成功响应
    res.json({
      success: true,
      data: {
        list: alarms,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
      message: '获取行车告警列表成功',
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// 导出控制器方法
// =====================================================

module.exports = {
  getCraneList,
  getCraneById,
  updateCraneStatus,
  controlCrane,
  configureCraneDuty,
  getCraneAlarms,
};
