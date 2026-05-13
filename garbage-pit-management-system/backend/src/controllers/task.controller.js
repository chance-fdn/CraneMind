/**
 * 垃圾储坑智能化管控系统 - 任务控制器
 * 
 * 该文件负责处理所有任务相关的业务逻辑
 * 包括：任务列表查询、任务创建、任务取消、任务统计等
 * 
 * @module controllers/task.controller
 * @author 华工三峰
 */

'use strict';

const logger = require('../utils/logger');
const { NotFoundError, BusinessError, ValidationError } = require('../middlewares/error.middleware');
const db = require('../models');

// =====================================================
// 控制器方法
// =====================================================

/**
 * 获取任务列表（分页）
 * 
 * @route GET /api/v1/tasks
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const getTaskList = async (req, res, next) => {
  try {
    // 获取查询参数
    const { page = 1, limit = 10, status, craneId } = req.query;

    // 构建查询条件
    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (craneId) {
      whereClause.crane_id = craneId;
    }

    // 分页查询
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows: tasks } = await db.Task.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(limit),
    });

    // 记录查询日志
    logger.info('查询任务列表', {
      status,
      craneId,
      page,
      limit,
      total: count,
      userId: req.user?.id,
    });

    // 返回成功响应
    res.json({
      success: true,
      data: {
        list: tasks,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
      message: '获取任务列表成功',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取单个任务信息
 * 
 * @route GET /api/v1/tasks/:id
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 查询任务
    const task = await db.Task.findByPk(id);

    // 检查任务是否存在
    if (!task) {
      throw new NotFoundError('任务不存在');
    }

    // 记录查询日志
    logger.info('查询任务详情', {
      taskId: id,
      taskNo: task.task_no,
      userId: req.user?.id,
    });

    // 返回成功响应
    res.json({
      success: true,
      data: task,
      message: '获取任务信息成功',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 创建任务
 * 
 * @route POST /api/v1/tasks
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const createTask = async (req, res, next) => {
  try {
    const { craneId, taskType, sourceAreaId, targetAreaId, priority, weight } = req.body;

    // 验证行车是否存在
    if (craneId) {
      const crane = await db.Crane.findByPk(craneId);
      if (!crane) {
        throw new NotFoundError('指定的行车不存在');
      }
      // 检查行车是否可用
      if (!crane.is_enabled) {
        throw new BusinessError('指定的行车已被禁用，无法创建任务');
      }
    }

    // 验证源区域是否存在
    if (sourceAreaId) {
      const sourceArea = await db.Area.findByPk(sourceAreaId);
      if (!sourceArea) {
        throw new NotFoundError('指定的源区域不存在');
      }
    }

    // 验证目标区域是否存在
    if (targetAreaId) {
      const targetArea = await db.Area.findByPk(targetAreaId);
      if (!targetArea) {
        throw new NotFoundError('指定的目标区域不存在');
      }
    }

    // 生成任务编号
    const taskNo = await db.Task.generateTaskNo();

    // 创建任务
    const task = await db.Task.create({
      task_no: taskNo,
      crane_id: craneId || null,
      task_type: taskType,
      source_area_id: sourceAreaId || null,
      target_area_id: targetAreaId || null,
      status: 'pending',
      priority: priority || 0,
      weight: weight || null,
      created_by: req.user?.id,
    });

    // 记录创建日志
    logger.info('创建任务', {
      taskId: task.id,
      taskNo: task.task_no,
      taskType,
      craneId,
      userId: req.user?.id,
    });

    // 返回成功响应
    res.status(201).json({
      success: true,
      data: task,
      message: '任务创建成功',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 取消任务
 * 
 * @route POST /api/v1/tasks/:id/cancel
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const cancelTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 查询任务
    const task = await db.Task.findByPk(id);

    // 检查任务是否存在
    if (!task) {
      throw new NotFoundError('任务不存在');
    }

    // 检查任务是否可以取消
    if (!task.canCancel()) {
      throw new BusinessError(`任务当前状态为 ${task.getStatusName()}，无法取消`);
    }

    // 取消任务
    await task.cancel();

    // 记录操作日志
    logger.info('取消任务', {
      taskId: id,
      taskNo: task.task_no,
      previousStatus: task.status,
      userId: req.user?.id,
    });

    // 返回成功响应
    res.json({
      success: true,
      data: task,
      message: '任务已取消',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取任务统计
 * 
 * @route GET /api/v1/tasks/statistics
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const getTaskStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // 构建查询选项
    const options = {};
    if (startDate) {
      options.startDate = new Date(startDate);
    }
    if (endDate) {
      options.endDate = new Date(endDate);
    }

    // 获取任务统计
    const statistics = await db.Task.getStatistics(options);

    // 记录查询日志
    logger.info('查询任务统计', {
      startDate,
      endDate,
      total: statistics.total,
      userId: req.user?.id,
    });

    // 返回成功响应
    res.json({
      success: true,
      data: statistics,
      message: '获取任务统计成功',
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// 导出控制器方法
// =====================================================

module.exports = {
  getTaskList,
  getTaskById,
  createTask,
  cancelTask,
  getTaskStatistics,
};
