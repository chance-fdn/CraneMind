/**
 * 垃圾储坑智能化管控系统 - 行车告警模型
 *
 * 该文件定义了行车告警表(crane_alarms)的数据模型，用于管理行车作业过程中的告警信息。
 *
 * 功能特点：
 * 1. 告警基本信息管理（告警类型、级别、消息等）
 * 2. 告警位置和传感器数据记录
 * 3. 告警状态流转（活跃 -> 已确认 -> 已解决）
 * 4. 告警确认和解决流程
 * 5. 告警统计和查询功能
 *
 * 告警类型说明：
 * - overload: 超载告警，抓斗负载超过额定重量
 * - position_error: 位置偏差告警，行车位置与预期不符
 * - grab_slip: 遛钩告警，抓斗意外滑落
 * - collision_warning: 碰撞预警，与其他设备或结构距离过近
 * - speed_abnormal: 速度异常，行车速度超出正常范围
 * - sensor_fault: 传感器故障，传感器数据异常或失联
 * - communication_error: 通信故障，与PLC通信中断
 * - emergency_stop: 急停触发，紧急停止按钮被按下
 *
 * 告警级别说明：
 * - critical: 严重告警，需要立即处理，可能导致设备损坏或安全事故
 * - major: 重要告警，需要尽快处理，影响作业效率
 * - minor: 一般告警，需要关注，不影响正常作业
 *
 * 告警状态说明：
 * - active: 活跃状态，告警正在发生，尚未被确认
 * - acknowledged: 已确认状态，操作人员已知晓告警
 * - resolved: 已解决状态，告警已被处理并消除
 *
 * @module models/alarm
 * @author 华工三峰
 */

'use strict';

/**
 * 导出行车告警模型定义
 *
 * @param {Sequelize} sequelize - Sequelize 实例
 * @param {DataTypes} DataTypes - Sequelize 数据类型
 * @returns {Model} CraneAlarm 模型
 */
module.exports = (sequelize, DataTypes) => {
  // =====================================================
  // 行车告警模型定义
  // =====================================================

  /**
   * 行车告警模型
   *
   * 对应数据库表: crane_alarms
   * 包含告警的基本信息、位置数据、传感器数据、状态流转等字段
   */
  const CraneAlarm = sequelize.define(
    'CraneAlarm',
    {
      // =====================================================
      // 主键字段
      // =====================================================

      /**
       * 告警ID（主键）
       * 自增整数类型
       */
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: '告警ID，主键，自增',
      },

      // =====================================================
      // 关联字段
      // =====================================================

      /**
       * 行车ID（外键）
       * 关联触发告警的行车
       */
      crane_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '行车ID，关联cranes表',
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

      // =====================================================
      // 告警基本信息字段
      // =====================================================

      /**
       * 告警类型
       * 枚举值：overload(超载), position_error(位置偏差), grab_slip(遛钩),
       *        collision_warning(碰撞预警), speed_abnormal(速度异常),
       *        sensor_fault(传感器故障), communication_error(通信故障),
       *        emergency_stop(急停触发)
       */
      alarm_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '告警类型：overload(超载), position_error(位置偏差), grab_slip(遛钩)等',
        validate: {
          isIn: {
            args: [[
              'overload',
              'position_error',
              'grab_slip',
              'collision_warning',
              'speed_abnormal',
              'sensor_fault',
              'communication_error',
              'emergency_stop',
            ]],
            msg: '告警类型无效',
          },
          notEmpty: {
            msg: '告警类型不能为空',
          },
        },
      },

      /**
       * 告警级别
       * 枚举值：critical(严重), major(重要), minor(一般)
       */
      alarm_level: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: '告警级别：critical(严重), major(重要), minor(一般)',
        validate: {
          isIn: {
            args: [['critical', 'major', 'minor']],
            msg: '告警级别必须是 critical、major 或 minor 之一',
          },
          notEmpty: {
            msg: '告警级别不能为空',
          },
        },
      },

      /**
       * 告警消息
       * 告警的详细描述信息
       */
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '告警消息，详细描述告警内容',
        validate: {
          len: {
            args: [0, 2000],
            msg: '告警消息长度不能超过2000个字符',
          },
        },
      },

      // =====================================================
      // 位置和传感器数据字段
      // =====================================================

      /**
       * 告警发生位置X坐标
       * 行车在池坑中的X轴坐标位置
       */
      position_x: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: '告警发生位置X坐标（米）',
        validate: {
          isDecimal: {
            msg: 'X坐标必须为数字',
          },
        },
      },

      /**
       * 告警发生位置Y坐标
       * 行车在池坑中的Y轴坐标位置
       */
      position_y: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: '告警发生位置Y坐标（米）',
        validate: {
          isDecimal: {
            msg: 'Y坐标必须为数字',
          },
        },
      },

      /**
       * 传感器数据
       * JSONB 类型，存储告警发生时各传感器的数据快照
       * 
       * 数据结构示例：
       * {
       *   "loadWeight": 3.5,          // 负载重量（吨）
       *   "speed": 1.2,               // 运行速度（米/秒）
       *   "grabStatus": "closed",     // 抓斗状态
       *   "motorCurrent": 15.5,       // 电机电流（安培）
       *   "motorTemperature": 45.2,   // 电机温度（摄氏度）
       *   "ropeTension": 2800,        // 钢索张力（牛顿）
       *   "encoderValue": 12500,      // 编码器数值
       *   "hydraulicPressure": 16.5,  // 液压压力（MPa）
       *   "vibrationLevel": 0.8       // 振动等级
       * }
       */
      sensor_data: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: '传感器数据快照（JSONB格式）',
      },

      // =====================================================
      // 告警状态字段
      // =====================================================

      /**
       * 告警状态
       * 枚举值：active(活跃), acknowledged(已确认), resolved(已解决)
       */
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'active',
        comment: '告警状态：active(活跃), acknowledged(已确认), resolved(已解决)',
        validate: {
          isIn: {
            args: [['active', 'acknowledged', 'resolved']],
            msg: '告警状态必须是 active、acknowledged 或 resolved 之一',
          },
        },
      },

      // =====================================================
      // 确认和解决信息字段
      // =====================================================

      /**
       * 确认人ID（外键）
       * 确认告警的用户
       */
      acknowledged_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '确认人ID，关联users表',
        validate: {
          isInt: {
            msg: '确认人ID必须为整数',
          },
          min: {
            args: [1],
            msg: '确认人ID必须大于0',
          },
        },
      },

      /**
       * 确认时间
       * 告警被确认的时间点
       */
      acknowledged_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '告警确认时间',
        validate: {
          isDate: {
            msg: '确认时间格式不正确',
          },
        },
      },

      /**
       * 解决时间
       * 告警被解决的时间点
       */
      resolved_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '告警解决时间',
        validate: {
          isDate: {
            msg: '解决时间格式不正确',
          },
        },
      },

      // =====================================================
      // 时间戳字段
      // =====================================================

      /**
       * 创建时间
       * 告警发生的时间，自动生成
       */
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '告警创建时间（告警发生时间）',
      },
    },
    {
      // =====================================================
      // 模型配置选项
      // =====================================================

      /**
       * 表名配置
       * 明确指定数据库中的表名
       */
      tableName: 'crane_alarms',

      /**
       * 时间戳配置
       * 只启用 createdAt，不启用 updatedAt
       */
      timestamps: true,
      updatedAt: false,

      /**
       * 时间戳字段名称配置
       */
      createdAt: 'created_at',

      /**
       * 索引配置
       * 定义数据库索引以优化查询性能
       */
      indexes: [
        // 行车ID索引（用于按行车查询告警）
        {
          fields: ['crane_id'],
          name: 'idx_crane_alarms_crane_id',
        },
        // 告警状态索引（用于按状态筛选）
        {
          fields: ['status'],
          name: 'idx_crane_alarms_status',
        },
        // 告警级别索引（用于按级别筛选）
        {
          fields: ['alarm_level'],
          name: 'idx_crane_alarms_alarm_level',
        },
        // 告警类型索引（用于按类型筛选）
        {
          fields: ['alarm_type'],
          name: 'idx_crane_alarms_alarm_type',
        },
        // 创建时间索引（用于按时间排序和范围查询）
        {
          fields: ['created_at'],
          name: 'idx_crane_alarms_created_at',
        },
        // 复合索引：行车 + 状态（用于查询特定行车的活跃告警）
        {
          fields: ['crane_id', 'status'],
          name: 'idx_crane_alarms_crane_status',
        },
        // 复合索引：状态 + 级别（用于告警列表排序）
        {
          fields: ['status', 'alarm_level'],
          name: 'idx_crane_alarms_status_level',
        },
        // JSONB 传感器数据字段索引（GIN 索引，支持 JSONB 查询）
        {
          using: 'GIN',
          fields: [sequelize.literal('sensor_data')],
          name: 'idx_crane_alarms_sensor_data',
        },
      ],

      /**
       * 模型名称配置
       */
      modelName: 'CraneAlarm',

      /**
       * 注释配置
       */
      comment: '行车告警表，用于管理行车作业告警信息',

      /**
       * 默认作用域配置
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
        // 活跃告警
        active: {
          where: {
            status: 'active',
          },
          order: [['alarm_level', 'DESC'], ['created_at', 'DESC']],
        },
        // 已确认告警
        acknowledged: {
          where: {
            status: 'acknowledged',
          },
        },
        // 已解决告警
        resolved: {
          where: {
            status: 'resolved',
          },
        },
        // 严重告警
        critical: {
          where: {
            alarm_level: 'critical',
          },
        },
        // 重要告警
        major: {
          where: {
            alarm_level: 'major',
          },
        },
        // 一般告警
        minor: {
          where: {
            alarm_level: 'minor',
          },
        },
        // 今日告警
        today: {
          where: {
            created_at: {
              [sequelize.Sequelize.Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
              [sequelize.Sequelize.Op.lt]: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        },
        // 未处理告警（活跃和已确认状态）
        unresolved: {
          where: {
            status: {
              [sequelize.Sequelize.Op.in]: ['active', 'acknowledged'],
            },
          },
          order: [['alarm_level', 'DESC'], ['created_at', 'DESC']],
        },
      },
    }
  );

  // =====================================================
  // 实例方法
  // =====================================================

  /**
   * 确认告警
   * 将告警状态从活跃变更为已确认
   *
   * @param {Object} options - 选项参数
   * @param {number} options.userId - 确认人ID
   * @param {Object} [options.transaction] - 事务对象
   * @returns {Promise<CraneAlarm>} 更新后的告警实例
   * @throws {Error} 如果告警状态不允许确认
   * 
   * @example
   * // 确认告警
   * await alarm.acknowledge({ userId: 1 });
   */
  CraneAlarm.prototype.acknowledge = async function (options = {}) {
    // 验证当前状态
    if (this.status !== 'active') {
      throw new Error(`无法确认告警：当前告警状态为 ${this.status}，只有活跃(active)状态的告警可以确认`);
    }

    // 验证确认人ID
    if (!options.userId) {
      throw new Error('确认人ID不能为空');
    }

    // 更新告警状态
    this.status = 'acknowledged';
    this.acknowledged_by = options.userId;
    this.acknowledged_at = new Date();

    // 保存更新
    await this.save({
      transaction: options.transaction,
    });

    return this;
  };

  /**
   * 解决告警
   * 将告警状态变更为已解决
   *
   * @param {Object} options - 选项参数
   * @param {number} [options.userId] - 解决人ID（可选，如果未确认则自动确认）
   * @param {Object} [options.transaction] - 事务对象
   * @returns {Promise<CraneAlarm>} 更新后的告警实例
   * @throws {Error} 如果告警状态不允许解决
   * 
   * @example
   * // 解决已确认的告警
   * await alarm.resolve();
   * 
   * // 直接解决活跃告警（自动确认）
   * await alarm.resolve({ userId: 1 });
   */
  CraneAlarm.prototype.resolve = async function (options = {}) {
    // 验证当前状态（只有活跃和已确认状态的告警可以解决）
    if (!['active', 'acknowledged'].includes(this.status)) {
      throw new Error(`无法解决告警：当前告警状态为 ${this.status}，只有活跃(active)或已确认(acknowledged)状态的告警可以解决`);
    }

    // 如果告警还是活跃状态，先自动确认
    if (this.status === 'active' && options.userId) {
      this.acknowledged_by = options.userId;
      this.acknowledged_at = new Date();
    }

    // 更新告警状态
    this.status = 'resolved';
    this.resolved_at = new Date();

    // 保存更新
    await this.save({
      transaction: options.transaction,
    });

    return this;
  };

  /**
   * 检查告警是否为活跃状态
   *
   * @returns {boolean} 是否为活跃状态
   */
  CraneAlarm.prototype.isActive = function () {
    return this.status === 'active';
  };

  /**
   * 检查告警是否已确认
   *
   * @returns {boolean} 是否已确认
   */
  CraneAlarm.prototype.isAcknowledged = function () {
    return this.status === 'acknowledged';
  };

  /**
   * 检查告警是否已解决
   *
   * @returns {boolean} 是否已解决
   */
  CraneAlarm.prototype.isResolved = function () {
    return this.status === 'resolved';
  };

  /**
   * 检查告警是否为严重级别
   *
   * @returns {boolean} 是否为严重级别
   */
  CraneAlarm.prototype.isCritical = function () {
    return this.alarm_level === 'critical';
  };

  /**
   * 检查告警是否需要立即处理
   * 严重或重要级别的活跃告警需要立即处理
   *
   * @returns {boolean} 是否需要立即处理
   */
  CraneAlarm.prototype.requiresImmediateAttention = function () {
    return this.status === 'active' && ['critical', 'major'].includes(this.alarm_level);
  };

  /**
   * 获取告警状态中文名称
   *
   * @returns {string} 状态的中文名称
   */
  CraneAlarm.prototype.getStatusName = function () {
    const statusNames = {
      active: '活跃',
      acknowledged: '已确认',
      resolved: '已解决',
    };
    return statusNames[this.status] || '未知状态';
  };

  /**
   * 获取告警类型中文名称
   *
   * @returns {string} 告警类型的中文名称
   */
  CraneAlarm.prototype.getAlarmTypeName = function () {
    const typeNames = {
      overload: '超载告警',
      position_error: '位置偏差告警',
      grab_slip: '遛钩告警',
      collision_warning: '碰撞预警',
      speed_abnormal: '速度异常',
      sensor_fault: '传感器故障',
      communication_error: '通信故障',
      emergency_stop: '急停触发',
    };
    return typeNames[this.alarm_type] || '未知类型';
  };

  /**
   * 获取告警级别中文名称
   *
   * @returns {string} 告警级别的中文名称
   */
  CraneAlarm.prototype.getAlarmLevelName = function () {
    const levelNames = {
      critical: '严重',
      major: '重要',
      minor: '一般',
    };
    return levelNames[this.alarm_level] || '未知级别';
  };

  /**
   * 获取告警持续时间（秒）
   * 从告警创建到解决的时间间隔
   *
   * @returns {number|null} 持续时间（秒），如果未解决则返回null
   */
  CraneAlarm.prototype.getDuration = function () {
    if (!this.resolved_at) {
      return null;
    }
    return Math.floor((new Date(this.resolved_at) - new Date(this.created_at)) / 1000);
  };

  /**
   * 获取告警持续时间（可读格式）
   *
   * @returns {string} 格式化的时长字符串
   */
  CraneAlarm.prototype.getFormattedDuration = function () {
    const duration = this.getDuration();
    if (duration === null) {
      return '未解决';
    }

    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    if (hours > 0) {
      return `${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds > 0 ? seconds + '秒' : ''}`;
    } else {
      return `${seconds}秒`;
    }
  };

  /**
   * 获取传感器数据中的指定值
   *
   * @param {string} key - 传感器数据键名
   * @returns {*} 传感器数据值
   */
  CraneAlarm.prototype.getSensorValue = function (key) {
    if (!this.sensor_data || typeof this.sensor_data !== 'object') {
      return null;
    }
    return this.sensor_data[key];
  };

  /**
   * 获取告警的安全表示（过滤敏感信息）
   *
   * @returns {Object} 安全的告警对象
   */
  CraneAlarm.prototype.toSafeObject = function () {
    return {
      id: this.id,
      crane_id: this.crane_id,
      alarm_type: this.alarm_type,
      alarm_level: this.alarm_level,
      message: this.message,
      position_x: this.position_x,
      position_y: this.position_y,
      sensor_data: this.sensor_data,
      status: this.status,
      acknowledged_by: this.acknowledged_by,
      acknowledged_at: this.acknowledged_at,
      resolved_at: this.resolved_at,
      created_at: this.created_at,
    };
  };

  // =====================================================
  // 类方法（静态方法）
  // =====================================================

  /**
   * 查找所有活跃告警
   * 按告警级别和创建时间排序
   *
   * @param {Object} [options] - 查询选项
   * @param {number} [options.limit] - 返回数量限制
   * @param {number} [options.craneId] - 行车ID筛选
   * @returns {Promise<Array<CraneAlarm>>} 告警列表
   * 
   * @example
   * // 获取所有活跃告警
   * const alarms = await CraneAlarm.findActive();
   * 
   * // 获取指定行车的活跃告警
   * const alarms = await CraneAlarm.findActive({ craneId: 1 });
   */
  CraneAlarm.findActive = async function (options = {}) {
    const where = { status: 'active' };

    if (options.craneId) {
      where.crane_id = options.craneId;
    }

    return await this.findAll({
      where,
      order: [
        ['alarm_level', 'DESC'], // critical > major > minor
        ['created_at', 'DESC'],
      ],
      limit: options.limit,
    });
  };

  /**
   * 查找所有未解决告警
   * 包括活跃和已确认状态的告警
   *
   * @param {Object} [options] - 查询选项
   * @param {number} [options.craneId] - 行车ID筛选
   * @returns {Promise<Array<CraneAlarm>>} 告警列表
   * 
   * @example
   * const alarms = await CraneAlarm.findUnresolved();
   */
  CraneAlarm.findUnresolved = async function (options = {}) {
    const where = {
      status: {
        [sequelize.Sequelize.Op.in]: ['active', 'acknowledged'],
      },
    };

    if (options.craneId) {
      where.crane_id = options.craneId;
    }

    return await this.findAll({
      where,
      order: [
        ['alarm_level', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });
  };

  /**
   * 查找指定行车的活跃告警
   *
   * @param {number} craneId - 行车ID
   * @returns {Promise<Array<CraneAlarm>>} 告警列表
   * 
   * @example
   * const alarms = await CraneAlarm.findActiveByCrane(1);
   */
  CraneAlarm.findActiveByCrane = async function (craneId) {
    return await this.findAll({
      where: {
        crane_id: craneId,
        status: 'active',
      },
      order: [['created_at', 'DESC']],
    });
  };

  /**
   * 查找严重告警
   *
   * @param {Object} [options] - 查询选项
   * @param {string} [options.status] - 状态筛选
   * @returns {Promise<Array<CraneAlarm>>} 告警列表
   * 
   * @example
   * const criticalAlarms = await CraneAlarm.findCritical();
   */
  CraneAlarm.findCritical = async function (options = {}) {
    const where = { alarm_level: 'critical' };

    if (options.status) {
      where.status = options.status;
    }

    return await this.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
  };

  /**
   * 按告警类型查找告警
   *
   * @param {string} alarmType - 告警类型
   * @param {Object} [options] - 查询选项
   * @returns {Promise<Array<CraneAlarm>>} 告警列表
   * 
   * @example
   * const overloadAlarms = await CraneAlarm.findByType('overload');
   */
  CraneAlarm.findByType = async function (alarmType, options = {}) {
    const where = { alarm_type: alarmType };

    if (options.status) {
      where.status = options.status;
    }

    return await this.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: options.limit,
    });
  };

  /**
   * 获取告警统计数据
   * 按状态、级别、类型统计告警数量
   *
   * @param {Object} [options] - 查询选项
   * @param {Date} [options.startDate] - 开始日期
   * @param {Date} [options.endDate] - 结束日期
   * @param {number} [options.craneId] - 行车ID筛选
   * @returns {Promise<Object>} 统计数据
   * 
   * @example
   * const stats = await CraneAlarm.getStatistics({
   *   startDate: new Date('2024-01-01'),
   *   endDate: new Date('2024-01-31')
   * });
   */
  CraneAlarm.getStatistics = async function (options = {}) {
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

    // 行车筛选
    if (options.craneId) {
      where.crane_id = options.craneId;
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

    // 按级别统计
    const levelCounts = await this.findAll({
      where,
      attributes: [
        'alarm_level',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['alarm_level'],
      raw: true,
    });

    // 按类型统计
    const typeCounts = await this.findAll({
      where,
      attributes: [
        'alarm_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['alarm_type'],
      raw: true,
    });

    // 格式化统计结果
    const result = {
      total: 0,
      byStatus: {
        active: 0,
        acknowledged: 0,
        resolved: 0,
      },
      byLevel: {
        critical: 0,
        major: 0,
        minor: 0,
      },
      byType: {},
    };

    // 填充状态统计
    statusCounts.forEach((item) => {
      const count = parseInt(item.count, 10);
      result.byStatus[item.status] = count;
      result.total += count;
    });

    // 填充级别统计
    levelCounts.forEach((item) => {
      result.byLevel[item.alarm_level] = parseInt(item.count, 10);
    });

    // 填充类型统计
    typeCounts.forEach((item) => {
      result.byType[item.alarm_type] = parseInt(item.count, 10);
    });

    return result;
  };

  /**
   * 获取每日告警统计
   *
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @param {number} [craneId] - 行车ID筛选
   * @returns {Promise<Array>} 每日统计数据
   * 
   * @example
   * const dailyStats = await CraneAlarm.getDailyStatistics(
   *   new Date('2024-01-01'),
   *   new Date('2024-01-31')
   * );
   */
  CraneAlarm.getDailyStatistics = async function (startDate, endDate, craneId = null) {
    const where = {
      created_at: {
        [sequelize.Sequelize.Op.gte]: startDate,
        [sequelize.Sequelize.Op.lte]: endDate,
      },
    };

    if (craneId) {
      where.crane_id = craneId;
    }

    const results = await this.findAll({
      where,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.literal(`COUNT(CASE WHEN status = 'active' THEN 1 END)`), 'active'],
        [sequelize.literal(`COUNT(CASE WHEN status = 'acknowledged' THEN 1 END)`), 'acknowledged'],
        [sequelize.literal(`COUNT(CASE WHEN status = 'resolved' THEN 1 END)`), 'resolved'],
        [sequelize.literal(`COUNT(CASE WHEN alarm_level = 'critical' THEN 1 END)`), 'critical'],
        [sequelize.literal(`COUNT(CASE WHEN alarm_level = 'major' THEN 1 END)`), 'major'],
        [sequelize.literal(`COUNT(CASE WHEN alarm_level = 'minor' THEN 1 END)`), 'minor'],
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true,
    });

    return results.map((item) => ({
      date: item.date,
      total: parseInt(item.total, 10),
      active: parseInt(item.active, 10),
      acknowledged: parseInt(item.acknowledged, 10),
      resolved: parseInt(item.resolved, 10),
      critical: parseInt(item.critical, 10),
      major: parseInt(item.major, 10),
      minor: parseInt(item.minor, 10),
    }));
  };

  /**
   * 获取告警数量趋势
   * 按小时统计最近24小时的告警数量
   *
   * @param {number} [craneId] - 行车ID筛选
   * @returns {Promise<Array>} 小时统计数据
   * 
   * @example
   * const hourlyTrend = await CraneAlarm.getHourlyTrend();
   */
  CraneAlarm.getHourlyTrend = async function (craneId = null) {
    const where = {
      created_at: {
        [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    };

    if (craneId) {
      where.crane_id = craneId;
    }

    const results = await this.findAll({
      where,
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'hour', sequelize.col('created_at')), 'hour'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: [sequelize.fn('DATE_TRUNC', 'hour', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE_TRUNC', 'hour', sequelize.col('created_at')), 'ASC']],
      raw: true,
    });

    return results.map((item) => ({
      hour: item.hour,
      count: parseInt(item.count, 10),
    }));
  };

  /**
   * 批量确认告警
   *
   * @param {Array<number>} alarmIds - 告警ID列表
   * @param {number} userId - 确认人ID
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<number>} 确认的告警数量
   * 
   * @example
   * const count = await CraneAlarm.batchAcknowledge([1, 2, 3], 1);
   */
  CraneAlarm.batchAcknowledge = async function (alarmIds, userId, transaction = null) {
    const result = await this.update(
      {
        status: 'acknowledged',
        acknowledged_by: userId,
        acknowledged_at: new Date(),
      },
      {
        where: {
          id: {
            [sequelize.Sequelize.Op.in]: alarmIds,
          },
          status: 'active',
        },
        transaction,
      }
    );

    return result[0]; // 返回更新的记录数
  };

  /**
   * 批量解决告警
   *
   * @param {Array<number>} alarmIds - 告警ID列表
   * @param {number} [userId] - 解决人ID
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<number>} 解决的告警数量
   * 
   * @example
   * const count = await CraneAlarm.batchResolve([1, 2, 3]);
   */
  CraneAlarm.batchResolve = async function (alarmIds, userId = null, transaction = null) {
    const updateData = {
      status: 'resolved',
      resolved_at: new Date(),
    };

    // 如果提供了用户ID，对于活跃告警自动确认
    if (userId) {
      updateData.acknowledged_by = userId;
      updateData.acknowledged_at = new Date();
    }

    const result = await this.update(updateData, {
      where: {
        id: {
          [sequelize.Sequelize.Op.in]: alarmIds,
        },
        status: {
          [sequelize.Sequelize.Op.in]: ['active', 'acknowledged'],
        },
      },
      transaction,
    });

    return result[0];
  };

  /**
   * 创建告警
   * 创建新的告警记录
   *
   * @param {Object} data - 告警数据
   * @param {number} data.craneId - 行车ID
   * @param {string} data.alarmType - 告警类型
   * @param {string} data.alarmLevel - 告警级别
   * @param {string} [data.message] - 告警消息
   * @param {number} [data.positionX] - X坐标
   * @param {number} [data.positionY] - Y坐标
   * @param {Object} [data.sensorData] - 传感器数据
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<CraneAlarm>} 创建的告警实例
   * 
   * @example
   * const alarm = await CraneAlarm.createAlarm({
   *   craneId: 1,
   *   alarmType: 'overload',
   *   alarmLevel: 'critical',
   *   message: '1号行车超载告警',
   *   positionX: 10.5,
   *   positionY: 5.2,
   *   sensorData: { loadWeight: 5.5 }
   * });
   */
  CraneAlarm.createAlarm = async function (data, transaction = null) {
    return await this.create(
      {
        crane_id: data.craneId,
        alarm_type: data.alarmType,
        alarm_level: data.alarmLevel,
        message: data.message,
        position_x: data.positionX,
        position_y: data.positionY,
        sensor_data: data.sensorData || {},
        status: 'active',
      },
      { transaction }
    );
  };

  /**
   * 检查行车是否有活跃告警{}

  /**
   * 检查行车是否有活跃告警
   *
   * @param {number} craneId - 行车ID
   * @returns {Promise<boolean>} 是否有活跃告警
   * 
   * @example
   * const hasAlarm = await CraneAlarm.hasActiveAlarm(1);
   */
  CraneAlarm.hasActiveAlarm = async function (craneId) {
    const count = await this.count({
      where: {
        crane_id: craneId,
        status: 'active',
      },
    });
    return count > 0;
  };

  /**
   * 获取需要立即处理的告警数量
   * 严重或重要级别的活跃告警
   *
   * @returns {Promise<number>} 需要立即处理的告警数量
   * 
   * @example
   * const count = await CraneAlarm.getImmediateAttentionCount();
   */
  CraneAlarm.getImmediateAttentionCount = async function () {
    return await this.count({
      where: {
        status: 'active',
        alarm_level: {
          [sequelize.Sequelize.Op.in]: ['critical', 'major'],
        },
      },
    });
  };

  /**
   * 清理过期的已解决告警
   * 删除指定天数之前的已解决告警记录
   *
   * @param {number} days - 保留天数
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<number>} 删除的记录数
   * 
   * @example
   * // 删除30天前的已解决告警
   * const count = await CraneAlarm.cleanResolvedAlarms(30);
   */
  CraneAlarm.cleanResolvedAlarms = async function (days, transaction = null) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - days);

    const result = await this.destroy({
      where: {
        status: 'resolved',
        created_at: {
          [sequelize.Sequelize.Op.lt]: expirationDate,
        },
      },
      transaction,
    });

    return result;
  };

  // =====================================================
  // 导出模型
  // =====================================================

  return CraneAlarm;
};
