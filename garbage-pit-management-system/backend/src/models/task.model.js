/**
 * 垃圾储坑智能化管控系统 - 任务模型
 *
 * 该文件定义了任务表(Task)的数据模型，用于管理行车作业任务信息。
 *
 * 功能特点：
 * 1. 任务基本信息管理（任务编号、类型、状态等）
 * 2. 任务关联关系（行车、源区域、目标区域、创建人）
 * 3. 任务状态流转（待执行 -> 执行中 -> 已完成/已取消）
 * 4. 任务优先级管理
 * 5. 任务执行统计（开始时间、结束时间、持续时间）
 *
 * 任务类型说明：
 * - feeding: 投料任务，将物料从堆料区移动到投料区
 * - stacking: 堆料任务，将新卸载的物料堆放到堆料区
 * - turning: 翻料任务，对物料进行翻堆处理以促进发酵
 * - moving: 移料任务，在不同区域之间移动物料
 *
 * @module models/task
 * @author 华工三峰
 */

'use strict';

/**
 * 导出任务模型定义
 *
 * @param {Sequelize} sequelize - Sequelize 实例
 * @param {DataTypes} DataTypes - Sequelize 数据类型
 * @returns {Model} Task 模型
 */
module.exports = (sequelize, DataTypes) => {
  // =====================================================
  // 任务模型定义
  // =====================================================

  /**
   * 任务模型
   *
   * 对应数据库表: tasks
   * 包含任务的基本信息、状态、优先级、执行时间等字段
   */
  const Task = sequelize.define(
    'Task',
    {
      // =====================================================
      // 主键字段
      // =====================================================

      /**
       * 任务ID（主键）
       * 自增整数类型
       */
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: '任务ID，主键，自增',
      },

      // =====================================================
      // 任务基本信息字段
      // =====================================================

      /**
       * 任务编号
       * 唯一标识符，格式如：TASK20240101001
       * 由系统自动生成，规则：TASK + 年月日 + 三位序号
       */
      task_no: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: '任务编号，唯一标识，格式：TASK + 年月日 + 三位序号',
        validate: {
          // 验证任务编号格式
          is: {
            args: /^TASK\d{10}$/,
            msg: '任务编号格式不正确，应为TASK + 10位数字',
          },
          // 非空验证
          notEmpty: {
            msg: '任务编号不能为空',
          },
          // 长度验证
          len: {
            args: [1, 50],
            msg: '任务编号长度应在1-50个字符之间',
          },
        },
      },

      /**
       * 行车ID（外键）
       * 关联执行该任务的行车
       */
      crane_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // 允许为空，表示任务尚未分配行车
        comment: '执行任务的行车ID，关联cranes表',
        validate: {
          isInt: {
            msg: '行车ID必须为整数',
          },
          min: {
            args: [1],
            msg: '行车ID必须大于0',
          },
        },
      },

      /**
       * 任务类型
       * 枚举值：feeding(投料), stacking(堆料), turning(翻料), moving(移料)
       */
      task_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '任务类型：feeding(投料), stacking(堆料), turning(翻料), moving(移料)',
        validate: {
          // 验证任务类型是否在允许的范围内
          isIn: {
            args: [['feeding', 'stacking', 'turning', 'moving']],
            msg: '任务类型必须是 feeding、stacking、turning 或 moving 之一',
          },
          notEmpty: {
            msg: '任务类型不能为空',
          },
        },
      },

      /**
       * 源区域ID（外键）
       * 物料的来源区域
       */
      source_area_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // 允许为空，某些任务可能不需要源区域
        comment: '源区域ID，物料的来源区域，关联areas表',
        validate: {
          isInt: {
            msg: '源区域ID必须为整数',
          },
          min: {
            args: [1],
            msg: '源区域ID必须大于0',
          },
        },
      },

      /**
       * 目标区域ID（外键）
       * 物料的目标区域
       */
      target_area_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // 允许为空，某些任务可能不需要目标区域
        comment: '目标区域ID，物料的目标区域，关联areas表',
        validate: {
          isInt: {
            msg: '目标区域ID必须为整数',
          },
          min: {
            args: [1],
            msg: '目标区域ID必须大于0',
          },
        },
      },

      // =====================================================
      // 任务状态字段
      // =====================================================

      /**
       * 任务状态
       * 枚举值：pending(待执行), running(执行中), completed(已完成), cancelled(已取消)
       */
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pending',
        comment: '任务状态：pending(待执行), running(执行中), completed(已完成), cancelled(已取消)',
        validate: {
          isIn: {
            args: [['pending', 'running', 'completed', 'cancelled']],
            msg: '任务状态必须是 pending、running、completed 或 cancelled 之一',
          },
        },
      },

      /**
       * 任务优先级
       * 数值越大优先级越高，默认为0（普通优先级）
       * - 0: 普通
       * - 1: 较高
       * - 2: 高
       * - 3: 紧急
       */
      priority: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '任务优先级，数值越大优先级越高，0=普通，1=较高，2=高，3=紧急',
        validate: {
          isInt: {
            msg: '优先级必须为整数',
          },
          min: {
            args: [0],
            msg: '优先级不能小于0',
          },
          max: {
            args: [3],
            msg: '优先级不能大于3',
          },
        },
      },

      // =====================================================
      // 任务执行数据字段
      // =====================================================

      /**
       * 任务重量（吨）
       * 记录本次任务处理的物料重量
       */
      weight: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: '任务重量，单位：吨',
        validate: {
          isDecimal: {
            msg: '重量必须为数字',
          },
          min: {
            args: [0],
            msg: '重量不能为负数',
          },
          max: {
            args: [100],
            msg: '重量不能超过100吨',
          },
        },
      },

      /**
       * 任务开始时间
       * 任务开始执行的时间点
       */
      start_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '任务开始时间',
        validate: {
          isDate: {
            msg: '开始时间格式不正确',
          },
        },
      },

      /**
       * 任务结束时间
       * 任务完成或取消的时间点
       */
      end_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '任务结束时间',
        validate: {
          isDate: {
            msg: '结束时间格式不正确',
          },
          // 自定义验证：结束时间必须大于开始时间
          isAfterStartTime(value) {
            if (value && this.start_time && new Date(value) <= new Date(this.start_time)) {
              throw new Error('结束时间必须晚于开始时间');
            }
          },
        },
      },

      /**
       * 任务持续时间（秒）
       * 任务执行的总耗时
       */
      duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '任务持续时间，单位：秒',
        validate: {
          isInt: {
            msg: '持续时间必须为整数',
          },
          min: {
            args: [0],
            msg: '持续时间不能为负数',
          },
        },
      },

      // =====================================================
      // 任务创建信息字段
      // =====================================================

      /**
       * 任务创建人ID（外键）
       * 创建该任务的用户
       */
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true, // 允许为空，系统自动创建的任务可能没有创建人
        comment: '任务创建人ID，关联users表',
        validate: {
          isInt: {
            msg: '创建人ID必须为整数',
          },
          min: {
            args: [1],
            msg: '创建人ID必须大于0',
          },
        },
      },

      // =====================================================
      // 时间戳字段
      // =====================================================

      /**
       * 创建时间
       * 记录创建时间，自动生成
       */
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '创建时间',
      },

      /**
       * 更新时间
       * 记录最后更新时间，自动更新
       */
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '更新时间',
      },

      // =====================================================
      // 索引信息（虚拟字段，用于文档说明）
      // =====================================================

      /**
       * 索引设计说明：
       *
       * 1. 主键索引: id (自动创建)
       * 2. 唯一索引: task_no (确保任务编号唯一)
       * 3. 普通索引:
       *    - crane_id (按行车查询任务)
       *    - status (按状态筛选任务)
       *    - created_at (按创建时间排序)
       *
       * 注意：索引定义应在数据库迁移文件中完成
       */
    },
    {
      // =====================================================
      // 模型配置选项
      // =====================================================

      /**
       * 表名配置
       * 明确指定数据库中的表名
       */
      tableName: 'tasks',

      /**
       * 时间戳配置
       * 启用自动时间戳管理
       */
      timestamps: true,

      /**
       * 时间戳字段名称配置
       * 指定创建时间和更新时间的字段名
       */
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      /**
       * 索引配置
       * 定义数据库索引以优化查询性能
       */
      indexes: [
        // 任务编号唯一索引
        {
          unique: true,
          fields: ['task_no'],
          name: 'idx_tasks_task_no',
        },
        // 行车ID索引（用于按行车查询任务）
        {
          fields: ['crane_id'],
          name: 'idx_tasks_crane_id',
        },
        // 任务状态索引（用于按状态筛选）
        {
          fields: ['status'],
          name: 'idx_tasks_status',
        },
        // 创建时间索引（用于按时间排序和范围查询）
        {
          fields: ['created_at'],
          name: 'idx_tasks_created_at',
        },
        // 复合索引：状态 + 优先级（用于任务队列调度）
        {
          fields: ['status', 'priority'],
          name: 'idx_tasks_status_priority',
        },
        // 复合索引：行车 + 状态（用于查询特定行车的活跃任务）
        {
          fields: ['crane_id', 'status'],
          name: 'idx_tasks_crane_status',
        },
      ],

      /**
       * 模型名称配置
       * 用于 Sequelize 内部标识
       */
      modelName: 'Task',

      /**
       * 注释配置
       * 添加表级别注释
       */
      comment: '任务表，用于管理行车作业任务',

      /**
       * 钩子函数配置
       * 在特定操作前后执行的自定义逻辑
       */
      hooks: {
        /**
         * 创建任务前的钩子
         * 自动生成任务编号
         */
        beforeCreate: async (task, options) => {
          // 如果没有提供任务编号，则自动生成
          if (!task.task_no) {
            task.task_no = await Task.generateTaskNo();
          }
        },

        /**
         * 更新任务后的钩子
         * 自动计算任务持续时间
         */
        afterUpdate: (task, options) => {
          // 如果任务已完成且有开始时间和结束时间，自动计算持续时间
          if (
            task.status === 'completed' &&
            task.start_time &&
            task.end_time &&
            !task.duration
          ) {
            const duration = Math.floor(
              (new Date(task.end_time) - new Date(task.start_time)) / 1000
            );
            task.duration = duration > 0 ? duration : 0;
          }
        },
      },

      /**
       * 默认作用域配置
       * 定义默认查询行为
       */
      defaultScope: {
        // 默认按创建时间倒序排列
        order: [['created_at', 'DESC']],
      },

      /**
       * 作用域配置
       * 定义常用的查询模板
       */
      scopes: {
        // 待执行任务
        pending: {
          where: {
            status: 'pending',
          },
          order: [['priority', 'DESC'], ['created_at', 'ASC']],
        },
        // 执行中任务
        running: {
          where: {
            status: 'running',
          },
        },
        // 已完成任务
        completed: {
          where: {
            status: 'completed',
          },
        },
        // 已取消任务
        cancelled: {
          where: {
            status: 'cancelled',
          },
        },
        // 高优先级任务
        highPriority: {
          where: {
            priority: {
              [sequelize.Sequelize.Op.gte]: 2,
            },
          },
          order: [['priority', 'DESC']],
        },
        // 今日任务
        today: {
          where: {
            created_at: {
              [sequelize.Sequelize.Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
              [sequelize.Sequelize.Op.lt]: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        },
      },
    }
  );

  // =====================================================
  // 实例方法
  // =====================================================

  /**
   * 开始任务
   * 将任务状态从待执行变更为执行中，记录开始时间
   *
   * @param {Object} options - 选项参数
   * @param {number} options.craneId - 执行任务的行车ID
   * @param {Object} [options.transaction] - 事务对象
   * @returns {Promise<Task>} 更新后的任务实例
   * @throws {Error} 如果任务状态不允许开始
   */
  Task.prototype.start = async function (options = {}) {
    // 验证当前状态
    if (this.status !== 'pending') {
      throw new Error(`无法开始任务：当前任务状态为 ${this.status}，只有待执行(pending)状态的任务可以开始`);
    }

    // 更新任务状态
    this.status = 'running';
    this.start_time = new Date();

    // 如果提供了行车ID，则分配行车
    if (options.craneId) {
      this.crane_id = options.craneId;
    }

    // 保存更新
    await this.save({
      transaction: options.transaction,
    });

    return this;
  };

  /**
   * 完成任务
   * 将任务状态从执行中变更为已完成，记录结束时间和持续时间
   *
   * @param {Object} options - 选项参数
   * @param {number} [options.weight] - 实际处理重量
   * @param {Object} [options.transaction] - 事务对象
   * @returns {Promise<Task>} 更新后的任务实例
   * @throws {Error} 如果任务状态不允许完成
   */
  Task.prototype.complete = async function (options = {}) {
    // 验证当前状态
    if (this.status !== 'running') {
      throw new Error(`无法完成任务：当前任务状态为 ${this.status}，只有执行中(running)状态的任务可以完成`);
    }

    // 计算持续时间
    const endTime = new Date();
    let duration = 0;

    if (this.start_time) {
      duration = Math.floor((endTime - new Date(this.start_time)) / 1000);
    }

    // 更新任务状态和数据
    this.status = 'completed';
    this.end_time = endTime;
    this.duration = duration > 0 ? duration : 0;

    // 如果提供了实际重量，则更新
    if (options.weight !== undefined) {
      this.weight = options.weight;
    }

    // 保存更新
    await this.save({
      transaction: options.transaction,
    });

    return this;
  };

  /**
   * 取消任务
   * 将任务状态变更为已取消
   *
   * @param {Object} options - 选项参数
   * @param {string} [options.reason] - 取消原因
   * @param {Object} [options.transaction] - 事务对象
   * @returns {Promise<Task>} 更新后的任务实例
   * @throws {Error} 如果任务状态不允许取消
   */
  Task.prototype.cancel = async function (options = {}) {
    // 验证当前状态（只有待执行和执行中的任务可以取消）
    if (!['pending', 'running'].includes(this.status)) {
      throw new Error(`无法取消任务：当前任务状态为 ${this.status}，只有待执行(pending)或执行中(running)状态的任务可以取消`);
    }

    // 更新任务状态
    this.status = 'cancelled';
    this.end_time = new Date();

    // 如果任务正在执行中，计算已执行的持续时间
    if (this.status === 'running' && this.start_time) {
      const duration = Math.floor((this.end_time - new Date(this.start_time)) / 1000);
      this.duration = duration > 0 ? duration : 0;
    }

    // 保存更新（可以在扩展字段中存储取消原因）
    await this.save({
      transaction: options.transaction,
    });

    return this;
  };

  /**
   * 更新优先级
   * 修改任务的优先级
   *
   * @param {number} newPriority - 新的优先级值 (0-3)
   * @param {Object} [options] - 选项参数
   * @param {Object} [options.transaction] - 事务对象
   * @returns {Promise<Task>} 更新后的任务实例
   * @throws {Error} 如果优先级值无效
   */
  Task.prototype.updatePriority = async function (newPriority, options = {}) {
    // 验证优先级范围
    if (newPriority < 0 || newPriority > 3) {
      throw new Error('优先级必须在 0-3 之间');
    }

    // 只有待执行的任务可以修改优先级
    if (this.status !== 'pending') {
      throw new Error('只有待执行状态的任务可以修改优先级');
    }

    // 更新优先级
    this.priority = newPriority;

    // 保存更新
    await this.save({
      transaction: options.transaction,
    });

    return this;
  };

  /**
   * 分配行车
   * 为任务分配执行行车
   *
   * @param {number} craneId - 行车ID
   * @param {Object} [options] - 选项参数
   * @param {Object} [options.transaction] - 事务对象
   * @returns {Promise<Task>} 更新后的任务实例
   * @throws {Error} 如果任务状态不允许分配行车
   */
  Task.prototype.assignCrane = async function (craneId, options = {}) {
    // 只有待执行的任务可以分配行车
    if (this.status !== 'pending') {
      throw new Error('只有待执行状态的任务可以分配行车');
    }

    // 更新行车ID
    this.crane_id = craneId;

    // 保存更新
    await this.save({
      transaction: options.transaction,
    });

    return this;
  };

  /**
   * 获取任务执行时长（可读格式）
   * 将持续时间转换为人类可读格式
   *
   * @returns {string} 格式化的时长字符串，如 "1小时30分钟"
   */
  Task.prototype.getFormattedDuration = function () {
    if (!this.duration) {
      return '未执行';
    }

    const hours = Math.floor(this.duration / 3600);
    const minutes = Math.floor((this.duration % 3600) / 60);
    const seconds = this.duration % 60;

    if (hours > 0) {
      return `${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds > 0 ? seconds + '秒' : ''}`;
    } else {
      return `${seconds}秒`;
    }
  };

  /**
   * 获取任务状态中文名称
   *
   * @returns {string} 状态的中文名称
   */
  Task.prototype.getStatusName = function () {
    const statusNames = {
      pending: '待执行',
      running: '执行中',
      completed: '已完成',
      cancelled: '已取消',
    };
    return statusNames[this.status] || '未知状态';
  };

  /**
   * 获取任务类型中文名称
   *
   * @returns {string} 任务类型的中文名称
   */
  Task.prototype.getTaskTypeName = function () {
    const typeNames = {
      feeding: '投料',
      stacking: '堆料',
      turning: '翻料',
      moving: '移料',
    };
    return typeNames[this.task_type] || '未知类型';
  };

  /**
   * 获取优先级中文名称
   *
   * @returns {string} 优先级的中文名称
   */
  Task.prototype.getPriorityName = function () {
    const priorityNames = {
      0: '普通',
      1: '较高',
      2: '高',
      3: '紧急',
    };
    return priorityNames[this.priority] || '未知优先级';
  };

  /**
   * 检查任务是否可以开始
   *
   * @returns {boolean} 是否可以开始
   */
  Task.prototype.canStart = function () {
    return this.status === 'pending' && this.crane_id !== null;
  };

  /**
   * 检查任务是否可以取消
   *
   * @returns {boolean} 是否可以取消
   */
  Task.prototype.canCancel = function () {
    return ['pending', 'running'].includes(this.status);
  };

  /**
   * 检查任务是否可以修改优先级
   *
   * @returns {boolean} 是否可以修改优先级
   */
  Task.prototype.canUpdatePriority = function () {
    return this.status === 'pending';
  };

  // =====================================================
  // 类方法（静态方法）
  // =====================================================

  /**
   * 生成任务编号
   * 格式：TASK + 年月日 + 三位序号
   * 例如：TASK20240101001
   *
   * @returns {Promise<string>} 生成的任务编号
   */
  Task.generateTaskNo = async function () {
    // 获取当前日期
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // 查询当天最大序号
    const prefix = `TASK${dateStr}`;
    const latestTask = await this.findOne({
      where: {
        task_no: {
          [sequelize.Sequelize.Op.like]: `${prefix}%`,
        },
      },
      order: [['task_no', 'DESC']],
      attributes: ['task_no'],
    });

    let sequence = 1;
    if (latestTask && latestTask.task_no) {
      // 提取序号部分并加1
      const lastSequence = parseInt(latestTask.task_no.slice(-3), 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    // 生成三位序号
    const sequenceStr = String(sequence).padStart(3, '0');
    return `${prefix}${sequenceStr}`;
  };

  /**
   * 查找待执行任务列表
   * 按优先级和创建时间排序
   *
   * @param {Object} [options] - 查询选项
   * @param {number} [options.limit] - 返回数量限制
   * @param {number} [options.craneId] - 行车ID筛选
   * @returns {Promise<Array<Task>>} 任务列表
   */
  Task.findPending = async function (options = {}) {
    const where = { status: 'pending' };

    if (options.craneId) {
      where.crane_id = options.craneId;
    }

    return await this.findAll({
      where,
      order: [
        ['priority', 'DESC'],
        ['created_at', 'ASC'],
      ],
      limit: options.limit,
    });
  };

  /**
   * 查找执行中任务列表
   *
   * @param {Object} [options] - 查询选项
   * @param {number} [options.craneId] - 行车ID筛选
   * @returns {Promise<Array<Task>>} 任务列表
   */
  Task.findRunning = async function (options = {}) {
    const where = { status: 'running' };

    if (options.craneId) {
      where.crane_id = options.craneId;
    }

    return await this.findAll({
      where,
      order: [['start_time', 'DESC']],
    });
  };

  /**
   * 查找指定行车的活跃任务
   * 包括待执行和执行中的任务
   *
   * @param {number} craneId - 行车ID
   * @returns {Promise<Array<Task>>} 任务列表
   */
  Task.findActiveByCrane = async function (craneId) {
    return await this.findAll({
      where: {
        crane_id: craneId,
        status: {
          [sequelize.Sequelize.Op.in]: ['pending', 'running'],
        },
      },
      order: [
        ['priority', 'DESC'],
        ['created_at', 'ASC'],
      ],
    });
  };

  /**
   * 获取任务统计数据
   * 按状态统计任务数量
   *
   * @param {Object} [options] - 查询选项
   * @param {Date} [options.startDate] - 开始日期
   * @param {Date} [options.endDate] - 结束日期
   * @returns {Promise<Object>} 统计数据
   */
  Task.getStatistics = async function (options = {}) {
    const where = {};

    // 日期范围筛选
    if (options.startDate || options.endDate) {
      where.created_at = {};
      if (options.startDate) {
        where.created_at[sequelize.Sequelize.Op.gte] = options.startDate;
      }
      if (options.endDate) {
        where.created_at[sequelize.Sequelize.Op.lte] = options.endDate;
      }
    }

    // 按状态统计
    const statusCounts = await this.findAll({
      where,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    // 按类型统计
    const typeCounts = await this.findAll({
      where,
      attributes: [
        'task_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['task_type'],
      raw: true,
    });

    // 格式化统计结果
    const result = {
      total: 0,
      byStatus: {
        pending: 0,
        running: 0,
        completed: 0,
        cancelled: 0,
      },
      byType: {
        feeding: 0,
        stacking: 0,
        turning: 0,
        moving: 0,
      },
    };

    // 填充状态统计
    statusCounts.forEach((item) => {
      const count = parseInt(item.count, 10);
      result.byStatus[item.status] = count;
      result.total += count;
    });

    // 填充类型统计
    typeCounts.forEach((item) => {
      result.byType[item.task_type] = parseInt(item.count, 10);
    });

    return result;
  };

  /**
   * 获取每日任务完成统计
   *
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Promise<Array>} 每日统计数据
   */
  Task.getDailyStatistics = async function (startDate, endDate) {
    const results = await this.findAll({
      where: {
        status: 'completed',
        end_time: {
          [sequelize.Sequelize.Op.gte]: startDate,
          [sequelize.Sequelize.Op.lte]: endDate,
        },
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('end_time')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('weight')), 'totalWeight'],
        [sequelize.fn('AVG', sequelize.col('duration')), 'avgDuration'],
      ],
      group: [sequelize.fn('DATE', sequelize.col('end_time'))],
      order: [[sequelize.fn('DATE', sequelize.col('end_time')), 'ASC']],
      raw: true,
    });

    return results.map((item) => ({
      date: item.date,
      count: parseInt(item.count, 10),
      totalWeight: parseFloat(item.totalWeight) || 0,
      avgDuration: Math.round(parseFloat(item.avgDuration)) || 0,
    }));
  };

  /**
   * 批量取消过期任务
   * 取消创建时间超过指定天数且仍处于待执行状态的任务
   *
   * @param {number} days - 过期天数
   * @param {Object} [options] - 选项参数
   * @param {Object} [options.transaction] - 事务对象
   * @returns {Promise<number>} 取消的任务数量
   */
  Task.cancelExpiredTasks = async function (days, options = {}) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - days);

    const result = await this.update(
      {
        status: 'cancelled',
        end_time: new Date(),
      },
      {
        where: {
          status: 'pending',
          created_at: {
            [sequelize.Sequelize.Op.lt]: expirationDate,
          },
        },
        transaction: options.transaction,
      }
    );

    return result[0]; // 返回更新的记录数
  };

  /**
   * 获取最高优先级的待执行任务
   * 用于任务调度
   *
   * @param {number} [craneId] - 指定行车ID
   * @returns {Promise<Task|null>} 优先级最高的待执行任务
   */
  Task.getNextPendingTask = async function (craneId = null) {
    const where = { status: 'pending' };

    if (craneId) {
      // 如果指定了行车，查找分配给该行车或未分配行车的任务
      where[sequelize.Sequelize.Op.or] = [
        { crane_id: craneId },
        { crane_id: null },
      ];
    }

    return await this.findOne({
      where,
      order: [
        ['priority', 'DESC'],
        ['created_at', 'ASC'],
      ],
    });
  };

  /**
   * 检查行车是否有执行中的任务
   *
   * @param {number} craneId - 行车ID
   * @returns {Promise<boolean>} 是否有执行中的任务
   */
  Task.hasRunningTask = async function (craneId) {
    const count = await this.count({
      where: {
        crane_id: craneId,
        status: 'running',
      },
    });
    return count > 0;
  };

  // =====================================================
  // 导出模型
  // =====================================================

  return Task;
};
