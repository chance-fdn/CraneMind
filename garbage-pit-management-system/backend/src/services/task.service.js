/**
 * 垃圾储坑智能化管控系统 - 任务服务
 * 
 * 该文件实现了任务相关的业务逻辑，包括任务管理、调度、统计等。
 * 服务层负责处理业务逻辑，与数据库交互，为控制器提供数据服务。
 * 
 * 主要功能：
 * 1. 任务列表查询（分页、状态筛选、行车筛选）
 * 2. 任务信息获取（详情、关联信息）
 * 3. 任务创建（验证关联资源、生成任务编号）
 * 4. 任务取消（状态验证、业务逻辑）
 * 5. 任务统计（按状态、类型、时间范围统计）
 * 6. 任务调度（优先级排序、行车分配）
 * 
 * @module services/task.service
 * @author 华工三峰
 */

'use strict';

// 引入依赖
const { Task, Crane, Area, User } = require('../models');
const { 
  ValidationError, 
  NotFoundError, 
  BusinessError,
} = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

/**
 * 任务服务类
 * 
 * @class TaskService
 */
class TaskService {
  /**
   * 构造函数
   * 
   * @constructor
   */
  constructor() {
    this.Task = Task;
    this.Crane = Crane;
    this.Area = Area;
    this.User = User;
  }

  /**
   * 获取任务列表（分页）
   * 
   * @description
   * 获取任务列表，支持分页、状态筛选、行车筛选
   * 按创建时间倒序排列
   * 
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码，默认1
   * @param {number} params.limit - 每页数量，默认10
   * @param {string} params.status - 任务状态筛选（pending/running/completed/cancelled）
   * @param {number} params.craneId - 行车ID筛选
   * @returns {Promise<Object>} 分页结果对象
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const result = await taskService.getTaskList({
   *   page: 1,
   *   limit: 10,
   *   status: 'pending',
   *   craneId: 1,
   * });
   */
  async getTaskList(params = {}) {
    try {
      const { page = 1, limit = 10, status, craneId } = params;

      logger.info('任务服务 - 获取任务列表', { params });

      // 构建查询条件
      const whereClause = {};
      
      // 状态筛选
      if (status) {
        // 验证状态值
        const validStatuses = ['pending', 'running', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
          throw new ValidationError(`任务状态无效，必须是: ${validStatuses.join(', ')}`);
        }
        whereClause.status = status;
      }

      // 行车筛选
      if (craneId) {
        // 验证行车ID
        if (isNaN(parseInt(craneId)) || parseInt(craneId) <= 0) {
          throw new ValidationError('行车ID必须为正整数');
        }
        whereClause.crane_id = parseInt(craneId);
      }

      // 计算偏移量
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // 查询任务（分页）
      const { count, rows: tasks } = await this.Task.findAndCountAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        offset,
        limit: parseInt(limit),
        include: [
          {
            model: this.Crane,
            as: 'crane',
            attributes: ['id', 'crane_no', 'name', 'status', 'duty'],
          },
          {
            model: this.Area,
            as: 'sourceArea',
            attributes: ['id', 'area_no', 'name', 'type'],
          },
          {
            model: this.Area,
            as: 'targetArea',
            attributes: ['id', 'area_no', 'name', 'type'],
          },
        ],
      });

      // 计算总页数
      const totalPages = Math.ceil(count / parseInt(limit));

      logger.info('任务服务 - 获取任务列表成功', { 
        total: count, 
        page, 
        limit,
        status,
        craneId,
      });

      return {
        list: tasks,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
        },
      };
    } catch (error) {
      logger.error('任务服务 - 获取任务列表失败', { 
        params,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 根据ID获取任务信息
   * 
   * @description
   * 根据任务ID获取任务详细信息，包含关联的行车和区域信息
   * 
   * @param {number} id - 任务ID
   * @returns {Promise<Object>} 任务信息对象
   * @throws {NotFoundError} 任务不存在
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const task = await taskService.getTaskById(1);
   */
  async getTaskById(id) {
    try {
      logger.info('任务服务 - 根据ID获取任务信息', { taskId: id });

      // 验证任务ID
      if (isNaN(parseInt(id)) || parseInt(id) <= 0) {
        throw new ValidationError('任务ID必须为正整数');
      }

      // 查询任务，包含关联信息
      const task = await this.Task.findByPk(parseInt(id), {
        include: [
          {
            model: this.Crane,
            as: 'crane',
            attributes: ['id', 'crane_no', 'name', 'status', 'duty', 'current_position_x', 'current_position_y', 'current_position_z'],
          },
          {
            model: this.Area,
            as: 'sourceArea',
            attributes: ['id', 'area_no', 'name', 'type', 'coordinate_x', 'coordinate_y', 'width', 'height', 'depth', 'current_height'],
          },
          {
            model: this.Area,
            as: 'targetArea',
            attributes: ['id', 'area_no', 'name', 'type', 'coordinate_x', 'coordinate_y', 'width', 'height', 'depth', 'current_height'],
          },
          {
            model: this.User,
            as: 'creator',
            attributes: ['id', 'username', 'real_name'],
          },
        ],
      });

      // 检查任务是否存在
      if (!task) {
        logger.warn('任务服务 - 任务不存在', { taskId: id });
        throw new NotFoundError('任务不存在');
      }

      logger.info('任务服务 - 获取任务信息成功', { 
        taskId: id, 
        taskNo: task.task_no,
      });

      return task;
    } catch (error) {
      logger.error('任务服务 - 获取任务信息失败', { 
        taskId: id, 
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 创建任务
   * 
   * @description
   * 创建新任务，验证关联资源（行车、区域）是否存在
   * 自动生成任务编号
   * 
   * @param {Object} taskData - 任务数据
   * @param {number} taskData.craneId - 行车ID（可选）
   * @param {string} taskData.taskType - 任务类型（feeding/stacking/turning/moving）
   * @param {number} taskData.sourceAreaId - 源区域ID（可选）
   * @param {number} taskData.targetAreaId - 目标区域ID（可选）
   * @param {number} taskData.priority - 任务优先级（0-3），默认0
   * @param {number} taskData.weight - 任务重量（吨，可选）
   * @param {number} userId - 创建人ID（可选）
   * @returns {Promise<Object>} 创建的任务信息
   * @throws {ValidationError} 参数验证失败
   * @throws {NotFoundError} 关联资源不存在
   * @throws {BusinessError} 业务逻辑错误
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const task = await taskService.createTask({
   *   craneId: 1,
   *   taskType: 'feeding',
   *   sourceAreaId: 1,
   *   targetAreaId: 2,
   *   priority: 1,
   *   weight: 5.5,
   * }, 1);
   */
  async createTask(taskData, userId = null) {
    try {
      const { craneId, taskType, sourceAreaId, targetAreaId, priority = 0, weight } = taskData;

      logger.info('任务服务 - 创建任务', { taskData, userId });

      // 验证任务类型
      const validTaskTypes = ['feeding', 'stacking', 'turning', 'moving'];
      if (!validTaskTypes.includes(taskType)) {
        throw new ValidationError(`任务类型无效，必须是: ${validTaskTypes.join(', ')}`);
      }

      // 验证优先级
      if (priority < 0 || priority > 3) {
        throw new ValidationError('任务优先级必须在0-3之间');
      }

      // 验证重量（如果提供）
      if (weight !== undefined) {
        if (weight < 0 || weight > 100) {
          throw new ValidationError('任务重量必须在0-100吨之间');
        }
      }

      // 验证行车是否存在（如果提供）
      if (craneId) {
        const crane = await this.Crane.findByPk(craneId);
        if (!crane) {
          throw new NotFoundError('指定的行车不存在');
        }
        // 检查行车是否可用
        if (!crane.is_enabled) {
          throw new BusinessError('指定的行车已被禁用，无法创建任务');
        }
        // 检查行车是否处于急停状态
        if (crane.emergency_stop) {
          throw new BusinessError('指定的行车处于急停状态，无法创建任务');
        }
      }

      // 验证源区域是否存在（如果提供）
      if (sourceAreaId) {
        const sourceArea = await this.Area.findByPk(sourceAreaId);
        if (!sourceArea) {
          throw new NotFoundError('指定的源区域不存在');
        }
      }

      // 验证目标区域是否存在（如果提供）
      if (targetAreaId) {
        const targetArea = await this.Area.findByPk(targetAreaId);
        if (!targetArea) {
          throw new NotFoundError('指定的目标区域不存在');
        }
      }

      // 验证创建人是否存在（如果提供）
      if (userId) {
        const user = await this.User.findByPk(userId);
        if (!user) {
          throw new NotFoundError('指定的创建人不存在');
        }
      }

      // 生成任务编号
      const taskNo = await this.Task.generateTaskNo();

      // 创建任务
      const task = await this.Task.create({
        task_no: taskNo,
        crane_id: craneId || null,
        task_type: taskType,
        source_area_id: sourceAreaId || null,
        target_area_id: targetAreaId || null,
        status: 'pending',
        priority: priority,
        weight: weight || null,
        created_by: userId || null,
      });

      logger.info('任务服务 - 创建任务成功', { 
        taskId: task.id, 
        taskNo: task.task_no,
        taskType,
        craneId,
        userId,
      });

      return task;
    } catch (error) {
      logger.error('任务服务 - 创建任务失败', { 
        taskData,
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 取消任务
   * 
   * @description
   * 取消指定任务，验证任务状态是否允许取消
   * 只有待执行和执行中的任务可以取消
   * 
   * @param {number} id - 任务ID
   * @param {string} reason - 取消原因（可选）
   * @returns {Promise<Object>} 取消后的任务信息
   * @throws {NotFoundError} 任务不存在
   * @throws {ValidationError} 参数验证失败
   * @throws {BusinessError} 业务逻辑错误
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const task = await taskService.cancelTask(1, '操作员手动取消');
   */
  async cancelTask(id, reason = null) {
    try {
      logger.info('任务服务 - 取消任务', { taskId: id, reason });

      // 验证任务ID
      if (isNaN(parseInt(id)) || parseInt(id) <= 0) {
        throw new ValidationError('任务ID必须为正整数');
      }

      // 查询任务
      const task = await this.Task.findByPk(parseInt(id));

      // 检查任务是否存在
      if (!task) {
        throw new NotFoundError('任务不存在');
      }

      // 检查任务是否可以取消
      if (!task.canCancel()) {
        throw new BusinessError(`任务当前状态为 ${task.getStatusName()}，无法取消`);
      }

      // 取消任务
      await task.cancel({ reason });

      logger.info('任务服务 - 取消任务成功', { 
        taskId: id, 
        taskNo: task.task_no,
        previousStatus: task.status,
        reason,
      });

      return task;
    } catch (error) {
      logger.error('任务服务 - 取消任务失败', { 
        taskId: id, 
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 获取任务统计
   * 
   * @description
   * 获取任务统计信息，包括任务总数、完成数、取消数、平均时长等
   * 支持按时间范围筛选
   * 
   * @param {Object} params - 统计参数
   * @param {string} params.startDate - 开始日期（YYYY-MM-DD格式）
   * @param {string} params.endDate - 结束日期（YYYY-MM-DD格式）
   * @returns {Promise<Object>} 统计信息对象
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const statistics = await taskService.getTaskStatistics({
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31',
   * });
   */
  async getTaskStatistics(params = {}) {
    try {
      const { startDate, endDate } = params;

      logger.info('任务服务 - 获取任务统计', { startDate, endDate });

      // 构建查询选项
      const options = {};

      // 验证并处理开始日期
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          throw new ValidationError('开始日期格式无效，应为YYYY-MM-DD格式');
        }
        options.startDate = start;
      }

      // 验证并处理结束日期
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          throw new ValidationError('结束日期格式无效，应为YYYY-MM-DD格式');
        }
        // 设置结束日期为当天的23:59:59
        end.setHours(23, 59, 59, 999);
        options.endDate = end;
      }

      // 获取任务统计
      const statistics = await this.Task.getStatistics(options);

      // 计算平均时长（仅已完成的任务）
      let avgDuration = 0;
      let totalDuration = 0;
      let completedCount = 0;

      // 获取已完成任务的详细信息
      const completedTasks = await this.Task.findAll({
        where: {
          status: 'completed',
          ...(options.startDate || options.endDate ? {
            created_at: {
              ...(options.startDate ? { [this.Task.sequelize.Sequelize.Op.gte]: options.startDate } : {}),
              ...(options.endDate ? { [this.Task.sequelize.Sequelize.Op.lte]: options.endDate } : {}),
            },
          } : {}),
        },
        attributes: ['duration'],
      });

      // 计算平均时长
      completedTasks.forEach(task => {
        if (task.duration && task.duration > 0) {
          totalDuration += task.duration;
          completedCount++;
        }
      });

      if (completedCount > 0) {
        avgDuration = Math.round(totalDuration / completedCount);
      }

      // 获取每日任务完成统计
      let dailyStatistics = [];
      if (options.startDate && options.endDate) {
        dailyStatistics = await this.Task.getDailyStatistics(options.startDate, options.endDate);
      }

      // 构建完整的统计结果
      const result = {
        // 基础统计
        total: statistics.total,
        byStatus: statistics.byStatus,
        byType: statistics.byType,
        
        // 性能统计
        performance: {
          completedCount: completedCount,
          avgDuration: avgDuration, // 秒
          avgDurationFormatted: this.formatDuration(avgDuration),
          totalDuration: totalDuration,
          totalDurationFormatted: this.formatDuration(totalDuration),
        },
        
        // 每日统计
        daily: dailyStatistics,
        
        // 时间范围
        timeRange: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      };

      logger.info('任务服务 - 获取任务统计成功', { 
        total: result.total,
        startDate,
        endDate,
      });

      return result;
    } catch (error) {
      logger.error('任务服务 - 获取任务统计失败', { 
        params,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 获取待执行任务列表
   * 
   * @description
   * 获取所有待执行的任务，按优先级和创建时间排序
   * 用于任务调度
   * 
   * @param {Object} options - 查询选项
   * @param {number} options.limit - 返回数量限制
   * @param {number} options.craneId - 行车ID筛选
   * @returns {Promise<Array<Object>>} 待执行任务列表
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const pendingTasks = await taskService.getPendingTasks({ limit: 10 });
   */
  async getPendingTasks(options = {}) {
    try {
      logger.info('任务服务 - 获取待执行任务列表', { options });

      const tasks = await this.Task.findPending(options);

      logger.info('任务服务 - 获取待执行任务列表成功', { 
        count: tasks.length,
        options,
      });

      return tasks;
    } catch (error) {
      logger.error('任务服务 - 获取待执行任务列表失败', { 
        options,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 获取执行中任务列表
   * 
   * @description
   * 获取所有执行中的任务
   * 
   * @param {Object} options - 查询选项
   * @param {number} options.craneId - 行车ID筛选
   * @returns {Promise<Array<Object>>} 执行中任务列表
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const runningTasks = await taskService.getRunningTasks({ craneId: 1 });
   */
  async getRunningTasks(options = {}) {
    try {
      logger.info('任务服务 - 获取执行中任务列表', { options });

      const tasks = await this.Task.findRunning(options);

      logger.info('任务服务 - 获取执行中任务列表成功', { 
        count: tasks.length,
        options,
      });

      return tasks;
    } catch (error) {
      logger.error('任务服务 - 获取执行中任务列表失败', { 
        options,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 获取指定行车的活跃任务
   * 
   * @description
   * 获取指定行车的活跃任务（包括待执行和执行中的任务）
   * 
   * @param {number} craneId - 行车ID
   * @returns {Promise<Array<Object>>} 活跃任务列表
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const activeTasks = await taskService.getActiveTasksByCrane(1);
   */
  async getActiveTasksByCrane(craneId) {
    try {
      logger.info('任务服务 - 获取指定行车的活跃任务', { craneId });

      // 验证行车ID
      if (isNaN(parseInt(craneId)) || parseInt(craneId) <= 0) {
        throw new ValidationError('行车ID必须为正整数');
      }

      const tasks = await this.Task.findActiveByCrane(parseInt(craneId));

      logger.info('任务服务 - 获取指定行车的活跃任务成功', { 
        craneId,
        count: tasks.length,
      });

      return tasks;
    } catch (error) {
      logger.error('任务服务 - 获取指定行车的活跃任务失败', { 
        craneId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 获取最高优先级的待执行任务
   * 
   * @description
   * 获取最高优先级的待执行任务，用于任务调度
   * 可以指定行车ID，查找分配给该行车或未分配行车的任务
   * 
   * @param {number} craneId - 行车ID（可选）
   * @returns {Promise<Object|null>} 最高优先级的待执行任务
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const nextTask = await taskService.getNextPendingTask(1);
   */
  async getNextPendingTask(craneId = null) {
    try {
      logger.info('任务服务 - 获取最高优先级的待执行任务', { craneId });

      const task = await this.Task.getNextPendingTask(craneId);

      logger.info('任务服务 - 获取最高优先级的待执行任务成功', { 
        craneId,
        taskId: task ? task.id : null,
        taskNo: task ? task.task_no : null,
      });

      return task;
    } catch (error) {
      logger.error('任务服务 - 获取最高优先级的待执行任务失败', { 
        craneId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 检查行车是否有执行中的任务
   * 
   * @description
   * 检查指定行车是否有执行中的任务
   * 
   * @param {number} craneId - 行车ID
   * @returns {Promise<boolean>} 是否有执行中的任务
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const hasRunningTask = await taskService.hasRunningTask(1);
   */
  async hasRunningTask(craneId) {
    try {
      logger.info('任务服务 - 检查行车是否有执行中的任务', { craneId });

      // 验证行车ID
      if (isNaN(parseInt(craneId)) || parseInt(craneId) <= 0) {
        throw new ValidationError('行车ID必须为正整数');
      }

      const hasRunning = await this.Task.hasRunningTask(parseInt(craneId));

      logger.info('任务服务 - 检查行车是否有执行中的任务成功', { 
        craneId,
        hasRunning,
      });

      return hasRunning;
    } catch (error) {
      logger.error('任务服务 - 检查行车是否有执行中的任务失败', { 
        craneId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 批量取消过期任务
   * 
   * @description
   * 批量取消创建时间超过指定天数且仍处于待执行状态的任务
   * 
   * @param {number} days - 过期天数
   * @returns {Promise<number>} 取消的任务数量
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const cancelledCount = await taskService.cancelExpiredTasks(7);
   */
  async cancelExpiredTasks(days) {
    try {
      logger.info('任务服务 - 批量取消过期任务', { days });

      // 验证天数
      if (isNaN(parseInt(days)) || parseInt(days) <= 0) {
        throw new ValidationError('过期天数必须为正整数');
      }

      const cancelledCount = await this.Task.cancelExpiredTasks(parseInt(days));

      logger.info('任务服务 - 批量取消过期任务成功', { 
        days,
        cancelledCount,
      });

      return cancelledCount;
    } catch (error) {
      logger.error('任务服务 - 批量取消过期任务失败', { 
        days,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 格式化持续时间
   * 
   * @description
   * 将秒数格式化为人类可读的时间字符串
   * 
   * @param {number} seconds - 秒数
   * @returns {string} 格式化的时间字符串
   * 
   * @example
   * const formatted = this.formatDuration(3661); // 返回 "1小时1分钟1秒"
   */
  formatDuration(seconds) {
    if (!seconds || seconds <= 0) {
      return '0秒';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hours > 0) {
      parts.push(`${hours}小时`);
    }
    if (minutes > 0) {
      parts.push(`${minutes}分钟`);
    }
    if (secs > 0 || parts.length === 0) {
      parts.push(`${secs}秒`);
    }

    return parts.join('');
  }

  /**
   * 开始任务
   * 
   * @description
   * 开始执行任务，将任务状态从待执行变更为执行中
   * 记录开始时间
   * 
   * @param {number} id - 任务ID
   * @param {Object} options - 选项参数
   * @param {number} options.craneId - 执行任务的行车ID
   * @returns {Promise<Object>} 更新后的任务信息
   * @throws {NotFoundError} 任务不存在
   * @throws {ValidationError} 参数验证失败
   * @throws {BusinessError} 业务逻辑错误
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const task = await taskService.startTask(1, { craneId: 1 });
   */
  async startTask(id, options = {}) {
    try {
      logger.info('任务服务 - 开始任务', { taskId: id, options });

      // 验证任务ID
      if (isNaN(parseInt(id)) || parseInt(id) <= 0) {
        throw new ValidationError('任务ID必须为正整数');
      }

      // 查询任务
      const task = await this.Task.findByPk(parseInt(id));

      // 检查任务是否存在
      if (!task) {
        throw new NotFoundError('任务不存在');
      }

      // 开始任务
      await task.start(options);

      logger.info('任务服务 - 开始任务成功', { 
        taskId: id, 
        taskNo: task.task_no,
        craneId: options.craneId,
      });

      return task;
    } catch (error) {
      logger.error('任务服务 - 开始任务失败', { 
        taskId: id, 
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 完成任务
   * 
   * @description
   * 完成任务，将任务状态从执行中变更为已完成
   * 记录结束时间和持续时间
   * 
   * @param {number} id - 任务ID
   * @param {Object} options - 选项参数
   * @param {number} options.weight - 实际处理重量
   * @returns {Promise<Object>} 更新后的任务信息
   * @throws {NotFoundError} 任务不存在
   * @throws {ValidationError} 参数验证失败
   * @throws {BusinessError} 业务逻辑错误
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const task = await taskService.completeTask(1, { weight: 5.2 });
   */
  async completeTask(id, options = {}) {
    try {
      logger.info('任务服务 - 完成任务', { taskId: id, options });

      // 验证任务ID
      if (isNaN(parseInt(id)) || parseInt(id) <= 0) {
        throw new ValidationError('任务ID必须为正整数');
      }

      // 查询任务
      const task = await this.Task.findByPk(parseInt(id));

      // 检查任务是否存在
      if (!task) {
        throw new NotFoundError('任务不存在');
      }

      // 完成任务
      await task.complete(options);

      logger.info('任务服务 - 完成任务成功', { 
        taskId: id, 
        taskNo: task.task_no,
        weight: options.weight,
      });

      return task;
    } catch (error) {
      logger.error('任务服务 - 完成任务失败', { 
        taskId: id, 
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 更新任务优先级
   * 
   * @description
   * 更新任务的优先级
   * 只有待执行的任务可以修改优先级
   * 
   * @param {number} id - 任务ID
   * @param {number} newPriority - 新的优先级值（0-3）
   * @returns {Promise<Object>} 更新后的任务信息
   * @throws {NotFoundError} 任务不存在
   * @throws {ValidationError} 参数验证失败
   * @throws {BusinessError} 业务逻辑错误
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const task = await taskService.updateTaskPriority(1, 2);
   */
  async updateTaskPriority(id, newPriority) {
    try {
      logger.info('任务服务 - 更新任务优先级', { taskId: id, newPriority });

      // 验证任务ID
      if (isNaN(parseInt(id)) || parseInt(id) <= 0) {
        throw new ValidationError('任务ID必须为正整数');
      }

      // 验证优先级
      if (newPriority < 0 || newPriority > 3) {
        throw new ValidationError('任务优先级必须在0-3之间');
      }

      // 查询任务
      const task = await this.Task.findByPk(parseInt(id));

      // 检查任务是否存在
      if (!task) {
        throw new NotFoundError('任务不存在');
      }

      // 更新优先级
      await task.updatePriority(newPriority);

      logger.info('任务服务 - 更新任务优先级成功', { 
        taskId: id, 
        taskNo: task.task_no,
        newPriority,
      });

      return task;
    } catch (error) {
      logger.error('任务服务 - 更新任务优先级失败', { 
        taskId: id, 
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 分配行车
   * 
   * @description
   * 为任务分配执行行车
   * 只有待执行的任务可以分配行车
   * 
   * @param {number} id - 任务ID
   * @param {number} craneId - 行车ID
   * @returns {Promise<Object>} 更新后的任务信息
   * @throws {NotFoundError} 任务不存在
   * @throws {ValidationError} 参数验证失败
   * @throws {BusinessError} 业务逻辑错误
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const task = await taskService.assignCrane(1, 1);
   */
  async assignCrane(id, craneId) {
    try {
      logger.info('任务服务 - 分配行车', { taskId: id, craneId });

      // 验证任务ID
      if (isNaN(parseInt(id)) || parseInt(id) <= 0) {
        throw new ValidationError('任务ID必须为正整数');
      }

      // 验证行车ID
      if (isNaN(parseInt(craneId)) || parseInt(craneId) <= 0) {
        throw new ValidationError('行车ID必须为正整数');
      }

      // 查询任务
      const task = await this.Task.findByPk(parseInt(id));

      // 检查任务是否存在
      if (!task) {
        throw new NotFoundError('任务不存在');
      }

      // 分配行车
      await task.assignCrane(parseInt(craneId));

      logger.info('任务服务 - 分配行车成功', { 
        taskId: id, 
        taskNo: task.task_no,
        craneId,
      });

      return task;
    } catch (error) {
      logger.error('任务服务 - 分配行车失败', { 
        taskId: id, 
        error: error.message,
      });
      throw error;
    }
  }
}

// =====================================================
// 创建服务实例并导出
// =====================================================

const taskService = new TaskService();

module.exports = taskService;