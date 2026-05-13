/**
 * 垃圾储坑智能化管控系统 - 行车模型
 *
 * 该文件定义了行车表(Crane)的数据模型，用于管理垃圾储坑中的行车设备信息
 * 行车是垃圾储坑管理中的核心设备，负责垃圾的抓取、搬运、堆料、投料等操作
 *
 * 主要功能：
 * 1. 行车基本信息管理（编号、名称、状态等）
 * 2. 行车位置跟踪（X、Y、Z三维坐标）
 * 3. 行车状态管理（在线/离线/运行中/待机/故障）
 * 4. 行车控制模式管理（自动/手动）
 * 5. 行车职责配置（投料/堆料/翻料/移料）
 * 6. 行车负载与速度监控
 * 7. 行车抓斗状态管理
 *
 * @module models/crane
 * @author 华工三峰
 */

'use strict';

/**
 * 行车模型定义
 * @param {Sequelize} sequelize - Sequelize 实例
 * @param {DataTypes} DataTypes - Sequelize 数据类型
 * @returns {Model} Crane 模型
 */
module.exports = (sequelize, DataTypes) => {
  /**
   * 行车模型定义
   *
   * 行车是垃圾储坑智能化管控系统的核心设备
   * 每台行车有唯一的编号、实时的位置信息、工作状态和控制模式
   */
  const Crane = sequelize.define(
    'Crane',
    {
      /**
       * 行车ID - 主键
       * 使用自增整数作为主键
       */
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '行车ID，自增主键',
      },

      /**
       * 行车编号
       * 用于标识行车的唯一业务编号，如 crane01, crane02, crane03
       */
      crane_no: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        comment: '行车编号，如crane01、crane02等',
        validate: {
          notEmpty: {
            msg: '行车编号不能为空',
          },
          len: {
            args: [1, 20],
            msg: '行车编号长度必须在1-20个字符之间',
          },
          // 验证行车编号格式：字母开头，后跟字母或数字
          is: {
            args: /^[A-Za-z][A-Za-z0-9]*$/,
            msg: '行车编号格式无效，必须以字母开头，只能包含字母和数字',
          },
        },
      },

      /**
       * 行车名称
       * 行车的可读性名称，便于用户识别
       */
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '行车名称',
        validate: {
          notEmpty: {
            msg: '行车名称不能为空',
          },
          len: {
            args: [1, 50],
            msg: '行车名称长度必须在1-50个字符之间',
          },
        },
      },

      /**
       * 行车状态
       * online: 在线 - 行车已连接并可用
       * offline: 离线 - 行车未连接或断开连接
       * running: 运行中 - 行车正在执行任务
       * standby: 待机 - 行车在线但未执行任务
       * fault: 故障 - 行车出现故障
       */
      status: {
        type: DataTypes.ENUM('online', 'offline', 'running', 'standby', 'fault'),
        allowNull: false,
        defaultValue: 'offline',
        comment: '状态：online-在线, offline-离线, running-运行中, standby-待机, fault-故障',
        validate: {
          isIn: {
            args: [['online', 'offline', 'running', 'standby', 'fault']],
            msg: '行车状态必须是 online、offline、running、standby 或 fault 之一',
          },
        },
      },

      /**
       * 控制模式
       * auto: 自动模式 - 由系统自动调度控制
       * manual: 手动模式 - 由操作员手动控制
       */
      mode: {
        type: DataTypes.ENUM('auto', 'manual'),
        allowNull: false,
        defaultValue: 'auto',
        comment: '控制模式：auto-自动, manual-手动',
        validate: {
          isIn: {
            args: [['auto', 'manual']],
            msg: '控制模式必须是 auto 或 manual 之一',
          },
        },
      },

      /**
       * 当前X坐标
       * 行车在大车行走方向的位置（单位：米）
       */
      current_position_x: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: '当前X坐标（米）',
        validate: {
          isDecimal: {
            msg: 'X坐标必须是有效的小数',
          },
          min: {
            args: [-9999.99],
            msg: 'X坐标不能小于-9999.99',
          },
          max: {
            args: [9999.99],
            msg: 'X坐标不能大于9999.99',
          },
        },
      },

      /**
       * 当前Y坐标
       * 行车在小车行走方向的位置（单位：米）
       */
      current_position_y: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: '当前Y坐标（米）',
        validate: {
          isDecimal: {
            msg: 'Y坐标必须是有效的小数',
          },
          min: {
            args: [-9999.99],
            msg: 'Y坐标不能小于-9999.99',
          },
          max: {
            args: [9999.99],
            msg: 'Y坐标不能大于9999.99',
          },
        },
      },

      /**
       * 当前Z坐标（高度）
       * 行车抓斗的升降高度（单位：米）
       */
      current_position_z: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: '当前Z坐标/高度（米）',
        validate: {
          isDecimal: {
            msg: 'Z坐标必须是有效的小数',
          },
          min: {
            args: [0],
            msg: 'Z坐标不能小于0',
          },
          max: {
            args: [999.99],
            msg: 'Z坐标不能大于999.99',
          },
        },
      },

      /**
       * 抓斗状态
       * open: 打开 - 抓斗处于打开状态
       * closed: 关闭 - 抓斗处于关闭状态
       * moving: 移动中 - 抓斗正在开合过程中
       */
      grab_status: {
        type: DataTypes.ENUM('open', 'closed', 'moving'),
        allowNull: true,
        comment: '抓斗状态：open-打开, closed-关闭, moving-移动中',
        validate: {
          isIn: {
            args: [['open', 'closed', 'moving']],
            msg: '抓斗状态必须是 open、closed 或 moving 之一',
          },
        },
      },

      /**
       * 当前负载重量
       * 抓斗当前抓取的垃圾重量（单位：吨）
       */
      load_weight: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: '当前负载重量（吨）',
        validate: {
          isDecimal: {
            msg: '负载重量必须是有效的小数',
          },
          min: {
            args: [0],
            msg: '负载重量不能为负数',
          },
          max: {
            args: [100.00],
            msg: '负载重量不能超过100吨',
          },
        },
      },

      /**
       * 当前速度
       * 行车的当前运行速度（单位：米/秒）
       */
      speed: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: '当前速度（米/秒）',
        validate: {
          isDecimal: {
            msg: '速度必须是有效的小数',
          },
          min: {
            args: [0],
            msg: '速度不能为负数',
          },
          max: {
            args: [10.00],
            msg: '速度不能超过10米/秒',
          },
        },
      },

      /**
       * 行车职责
       * feeding: 投料 - 将垃圾投入焚烧炉
       * stacking: 堆料 - 将垃圾堆放到指定区域
       * turning: 翻料 - 翻动垃圾促进发酵
       * moving: 移料 - 将垃圾从一个区域移动到另一个区域
       */
      duty: {
        type: DataTypes.ENUM('feeding', 'stacking', 'turning', 'moving'),
        allowNull: true,
        comment: '行车职责：feeding-投料, stacking-堆料, turning-翻料, moving-移料',
        validate: {
          isIn: {
            args: [['feeding', 'stacking', 'turning', 'moving']],
            msg: '行车职责必须是 feeding、stacking、turning 或 moving 之一',
          },
        },
      },

      /**
       * 是否启用
       * 用于控制行车的启用/禁用状态
       */
      is_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '是否启用',
      },

      /**
       * 是否急停
       * 标识行车是否处于紧急停止状态
       * 急停状态下行车不能执行任何操作
       */
      emergency_stop: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否急停',
      },

      /**
       * 最后维护日期
       * 记录行车最后一次维护保养的日期
       */
      last_maintenance_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '最后维护日期',
      },

      /**
       * 创建人ID
       * 记录创建该行车记录的用户ID
       */
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: '创建人ID',
      },

      /**
       * 更新人ID
       * 记录最后更新该行车记录的用户ID
       */
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: '更新人ID',
      },
    },
    {
      // 表名配置
      tableName: 'cranes',

      // 索引配置
      indexes: [
        {
          unique: true,
          fields: ['crane_no'],
          name: 'idx_cranes_crane_no',
        },
        {
          fields: ['status'],
          name: 'idx_cranes_status',
        },
        {
          fields: ['mode'],
          name: 'idx_cranes_mode',
        },
        {
          fields: ['duty'],
          name: 'idx_cranes_duty',
        },
        {
          fields: ['is_enabled'],
          name: 'idx_cranes_is_enabled',
        },
        {
          fields: ['current_position_x', 'current_position_y'],
          name: 'idx_cranes_position',
        },
      ],

      // 钩子函数配置
      hooks: {
        /**
         * 创建前钩子
         * 在创建行车记录之前执行
         */
        beforeCreate: async (crane, options) => {
          // 如果行车处于急停状态，确保状态为故障
          if (crane.emergency_stop && crane.status !== 'fault') {
            console.warn(`行车 ${crane.crane_no} 处于急停状态，建议将状态设置为故障`);
          }
        },

        /**
         * 更新前钩子
         * 在更新行车记录之前执行
         */
        beforeUpdate: async (crane, options) => {
          // 如果急停状态被激活，更新状态
          if (crane.changed('emergency_stop') && crane.emergency_stop) {
            if (crane.status !== 'fault') {
              crane.status = 'fault';
            }
          }

          // 如果状态从离线变为在线，且未指定状态，设置为待机
          if (crane.changed('status') && crane.status === 'online' && !crane.duty) {
            crane.status = 'standby';
          }
        },
      },

      // 模型作用域配置
      scopes: {
        // 仅查询启用的行车
        enabled: {
          where: {
            is_enabled: true,
          },
        },
        // 查询在线的行车
        online: {
          where: {
            status: 'online',
            is_enabled: true,
          },
        },
        // 查询运行中的行车
        running: {
          where: {
            status: 'running',
            is_enabled: true,
          },
        },
        // 查询待机中的行车
        standby: {
          where: {
            status: 'standby',
            is_enabled: true,
          },
        },
        // 查询故障行车
        fault: {
          where: {
            status: 'fault',
          },
        },
        // 查询离线行车
        offline: {
          where: {
            status: 'offline',
          },
        },
        // 查询自动模式的行车
        autoMode: {
          where: {
            mode: 'auto',
            is_enabled: true,
          },
        },
        // 查询手动模式的行车
        manualMode: {
          where: {
            mode: 'manual',
            is_enabled: true,
          },
        },
        // 查询投料职责的行车
        feedingDuty: {
          where: {
            duty: 'feeding',
            is_enabled: true,
          },
        },
        // 查询堆料职责的行车
        stackingDuty: {
          where: {
            duty: 'stacking',
            is_enabled: true,
          },
        },
        // 查询翻料职责的行车
        turningDuty: {
          where: {
            duty: 'turning',
            is_enabled: true,
          },
        },
        // 查询移料职责的行车
        movingDuty: {
          where: {
            duty: 'moving',
            is_enabled: true,
          },
        },
      },
    }
  );

  // =====================================================
  // 实例方法
  // =====================================================

  /**
   * 更新行车位置
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} z - Z坐标（高度）
   * @param {Object} options - 更新选项
   * @returns {Promise<Crane>} 更新后的行车实例
   */
  Crane.prototype.updatePosition = async function (x, y, z, options = {}) {
    this.current_position_x = x;
    this.current_position_y = y;
    this.current_position_z = z;
    return await this.save(options);
  };

  /**
   * 更新行车状态
   * @param {string} status - 新状态
   * @param {Object} options - 更新选项
   * @returns {Promise<Crane>} 更新后的行车实例
   */
  Crane.prototype.updateStatus = async function (status, options = {}) {
    const validStatuses = ['online', 'offline', 'running', 'standby', 'fault'];
    if (!validStatuses.includes(status)) {
      throw new Error(`无效的状态值: ${status}`);
    }
    // 如果处于急停状态，不允许修改为非故障状态
    if (this.emergency_stop && status !== 'fault') {
      throw new Error('行车处于急停状态，必须先解除急停才能修改状态');
    }
    this.status = status;
    return await this.save(options);
  };

  /**
   * 切换控制模式
   * @param {string} mode - 控制模式：auto 或 manual
   * @param {Object} options - 更新选项
   * @returns {Promise<Crane>} 更新后的行车实例
   */
  Crane.prototype.switchMode = async function (mode, options = {}) {
    const validModes = ['auto', 'manual'];
    if (!validModes.includes(mode)) {
      throw new Error(`无效的控制模式: ${mode}`);
    }
    // 如果行车正在运行，需要先停止才能切换模式
    if (this.status === 'running') {
      throw new Error('行车正在运行中，请先停止任务后再切换控制模式');
    }
    // 如果行车处于故障或急停状态，不允许切换模式
    if (this.status === 'fault' || this.emergency_stop) {
      throw new Error('行车处于故障或急停状态，无法切换控制模式');
    }
    this.mode = mode;
    return await this.save(options);
  };

  /**
   * 设置行车职责
   * @param {string} duty - 职责类型
   * @param {Object} options - 更新选项
   * @returns {Promise<Crane>} 更新后的行车实例
   */
  Crane.prototype.setDuty = async function (duty, options = {}) {
    const validDuties = ['feeding', 'stacking', 'turning', 'moving'];
    if (!validDuties.includes(duty)) {
      throw new Error(`无效的职责类型: ${duty}`);
    }
    // 如果行车正在执行其他任务，需要先完成当前任务
    if (this.status === 'running' && this.duty && this.duty !== duty) {
      throw new Error(`行车正在执行${this.duty}任务，请先完成当前任务`);
    }
    this.duty = duty;
    return await this.save(options);
  };

  /**
   * 触发紧急停止
   * @param {Object} options - 更新选项
   * @returns {Promise<Crane>} 更新后的行车实例
   */
  Crane.prototype.triggerEmergencyStop = async function (options = {}) {
    this.emergency_stop = true;
    this.status = 'fault';
    this.speed = 0;
    return await this.save(options);
  };

  /**
   * 解除紧急停止
   * @param {Object} options - 更新选项
   * @returns {Promise<Crane>} 更新后的行车实例
   */
  Crane.prototype.releaseEmergencyStop = async function (options = {}) {
    this.emergency_stop = false;
    this.status = 'standby';
    return await this.save(options);
  };

  /**
   * 启用行车
   * @param {Object} options - 更新选项
   * @returns {Promise<Crane>} 更新后的行车实例
   */
  Crane.prototype.enable = async function (options = {}) {
    this.is_enabled = true;
    return await this.save(options);
  };

  /**
   * 禁用行车
   * @param {Object} options - 更新选项
   * @returns {Promise<Crane>} 更新后的行车实例
   */
  Crane.prototype.disable = async function (options = {}) {
    if (this.status === 'running') {
      throw new Error('行车正在运行中，请先停止任务后再禁用');
    }
    this.is_enabled = false;
    this.status = 'offline';
    return await this.save(options);
  };

  /**
   * 更新抓斗状态
   * @param {string} grabStatus - 抓斗状态
   * @param {Object} options - 更新选项
   * @returns {Promise<Crane>} 更新后的行车实例
   */
  Crane.prototype.updateGrabStatus = async function (grabStatus, options = {}) {
    const validStatuses = ['open', 'closed', 'moving'];
    if (!validStatuses.includes(grabStatus)) {
      throw new Error(`无效的抓斗状态: ${grabStatus}`);
    }
    this.grab_status = grabStatus;
    return await this.save(options);
  };

  /**
   * 更新负载重量
   * @param {number} weight - 负载重量（吨）
   * @param {Object} options - 更新选项
   * @returns {Promise<Crane>} 更新后的行车实例
   */
  Crane.prototype.updateLoadWeight = async function (weight, options = {}) {
    if (weight < 0) {
      throw new Error('负载重量不能为负数');
    }
    this.load_weight = weight;
    return await this.save(options);
  };

  /**
   * 更新速度
   * @param {number} speed - 速度（米/秒）
   * @param {Object} options - 更新选项
   * @returns {Promise<Crane>} 更新后的行车实例
   */
  Crane.prototype.updateSpeed = async function (speed, options = {}) {
    if (speed < 0) {
      throw new Error('速度不能为负数');
    }
    this.speed = speed;
    return await this.save(options);
  };

  /**
   * 记录维护日期
   * @param {Object} options - 更新选项
   * @returns {Promise<Crane>} 更新后的行车实例
   */
  Crane.prototype.recordMaintenance = async function (options = {}) {
    this.last_maintenance_date = new Date();
    return await this.save(options);
  };

  /**
   * 检查行车是否可用
   * @returns {boolean} 是否可用
   */
  Crane.prototype.isAvailable = function () {
    return (
      this.is_enabled &&
      !this.emergency_stop &&
      this.status !== 'fault' &&
      this.status !== 'offline'
    );
  };

  /**
   * 检查行车是否正在执行任务
   * @returns {boolean} 是否正在执行任务
   */
  Crane.prototype.isRunning = function () {
    return this.status === 'running';
  };

  /**
   * 检查行车是否处于故障状态
   * @returns {boolean} 是否故障
   */
  Crane.prototype.isFault = function () {
    return this.status === 'fault' || this.emergency_stop;
  };

  /**
   * 检查行车是否在线
   * @returns {boolean} 是否在线
   */
  Crane.prototype.isOnline = function () {
    return this.status !== 'offline' && this.is_enabled;
  };

  /**
   * 检查行车是否处于自动模式
   * @returns {boolean} 是否自动模式
   */
  Crane.prototype.isAutoMode = function () {
    return this.mode === 'auto';
  };

  /**
   * 获取行车位置信息
   * @returns {Object} 位置信息对象
   */
  Crane.prototype.getPosition = function () {
    return {
      x: this.current_position_x,
      y: this.current_position_y,
      z: this.current_position_z,
    };
  };

  /**
   * 获取行车摘要信息
   * @returns {Object} 摘要信息对象
   */
  Crane.prototype.getSummary = function () {
    return {
      id: this.id,
      crane_no: this.crane_no,
      name: this.name,
      status: this.status,
      mode: this.mode,
      duty: this.duty,
      position: this.getPosition(),
      grab_status: this.grab_status,
      load_weight: this.load_weight,
      speed: this.speed,
      is_enabled: this.is_enabled,
      emergency_stop: this.emergency_stop,
      is_available: this.isAvailable(),
      is_running: this.isRunning(),
      is_fault: this.isFault(),
    };
  };

  /**
   * 转换为JSON格式
   * @returns {Object} JSON对象
   */
  Crane.prototype.toJSON = function () {
    const values = { ...this.get() };
    values.is_available = this.isAvailable();
    values.is_running = this.isRunning();
    values.is_fault = this.isFault();
    values.position = this.getPosition();
    return values;
  };

  // =====================================================
  // 类方法（静态方法）
  // =====================================================

  /**
   * 查找所有在线的行车
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Crane>>} 在线行车列表
   */
  Crane.findAllOnline = async function (options = {}) {
    return await this.scope('online').findAll({
      ...options,
      order: [['crane_no', 'ASC']],
    });
  };

  /**
   * 查找所有运行中的行车
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Crane>>} 运行中行车列表
   */
  Crane.findAllRunning = async function (options = {}) {
    return await this.scope('running').findAll({
      ...options,
      order: [['crane_no', 'ASC']],
    });
  };

  /**
   * 查找所有待机中的行车
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Crane>>} 待机中行车列表
   */
  Crane.findAllStandby = async function (options = {}) {
    return await this.scope('standby').findAll({
      ...options,
      order: [['crane_no', 'ASC']],
    });
  };

  /**
   * 查找所有故障行车
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Crane>>} 故障行车列表
   */
  Crane.findAllFault = async function (options = {}) {
    return await this.scope('fault').findAll({
      ...options,
      order: [['crane_no', 'ASC']],
    });
  };

  /**
   * 查找所有离线行车
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Crane>>} 离线行车列表
   */
  Crane.findAllOffline = async function (options = {}) {
    return await this.scope('offline').findAll({
      ...options,
      order: [['crane_no', 'ASC']],
    });
  };

  /**
   * 查找可用的行车
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Crane>>} 可用行车列表
   */
  Crane.findAvailableCranes = async function (options = {}) {
    const { Op } = sequelize.Sequelize;
    return await this.scope('enabled').findAll({
      ...options,
      where: {
        ...(options.where || {}),
        status: {
          [Op.in]: ['online', 'standby'],
        },
        emergency_stop: false,
      },
      order: [['crane_no', 'ASC']],
    });
  };

  /**
   * 根据行车编号查找
   * @param {string} craneNo - 行车编号
   * @param {Object} options - 查询选项
   * @returns {Promise<Crane|null>} 行车实例
   */
  Crane.findByCraneNo = async function (craneNo, options = {}) {
    return await this.findOne({
      ...options,
      where: {
        crane_no: craneNo,
      },
    });
  };

  /**
   * 根据职责查找行车
   * @param {string} duty - 职责类型
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Crane>>} 行车列表
   */
  Crane.findByDuty = async function (duty, options = {}) {
    const validDuties = ['feeding', 'stacking', 'turning', 'moving'];
    if (!validDuties.includes(duty)) {
      throw new Error(`无效的职责类型: ${duty}`);
    }
    return await this.findAll({
      ...options,
      where: {
        duty: duty,
        is_enabled: true,
      },
      order: [['crane_no', 'ASC']],
    });
  };

  /**
   * 根据模式查找行车
   * @param {string} mode - 控制模式
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Crane>>} 行车列表
   */
  Crane.findByMode = async function (mode, options = {}) {
    const validModes = ['auto', 'manual'];
    if (!validModes.includes(mode)) {
      throw new Error(`无效的控制模式: ${mode}`);
    }
    const scopeName = mode === 'auto' ? 'autoMode' : 'manualMode';
    return await this.scope(scopeName).findAll({
      ...options,
      order: [['crane_no', 'ASC']],
    });
  };

  /**
   * 获取行车统计信息
   * @returns {Promise<Object>} 统计信息
   */
  Crane.getStatistics = async function () {
    const { Op } = sequelize.Sequelize;

    // 总体统计
    const totalCount = await this.count();
    const enabledCount = await this.count({ where: { is_enabled: true } });

    // 按状态统计
    const onlineCount = await this.count({ where: { status: 'online' } });
    const offlineCount = await this.count({ where: { status: 'offline' } });
    const runningCount = await this.count({ where: { status: 'running' } });
    const standbyCount = await this.count({ where: { status: 'standby' } });
    const faultCount = await this.count({ where: { status: 'fault' } });

    // 按模式统计
    const autoModeCount = await this.count({ where: { mode: 'auto', is_enabled: true } });
    const manualModeCount = await this.count({ where: { mode: 'manual', is_enabled: true } });

    // 按职责统计
    const feedingCount = await this.count({ where: { duty: 'feeding', is_enabled: true } });
    const stackingCount = await this.count({ where: { duty: 'stacking', is_enabled: true } });
    const turningCount = await this.count({ where: { duty: 'turning', is_enabled: true } });
    const movingCount = await this.count({ where: { duty: 'moving', is_enabled: true } });

    // 急停和可用统计
    const emergencyStopCount = await this.count({ where: { emergency_stop: true } });
    const availableCount = await this.count({
      where: {
        is_enabled: true,
        emergency_stop: false,
        status: {
          [Op.in]: ['online', 'standby'],
        },
      },
    });

    return {
      total: totalCount,
      enabled: enabledCount,
      disabled: totalCount - enabledCount,
      byStatus: {
        online: onlineCount,
        offline: offlineCount,
        running: runningCount,
        standby: standbyCount,
        fault: faultCount,
      },
      byMode: {
        auto: autoModeCount,
        manual: manualModeCount,
      },
      byDuty: {
        feeding: feedingCount,
        stacking: stackingCount,
        turning: turningCount,
        moving: movingCount,
      },
      emergency: {
        emergencyStopCount: emergencyStopCount,
      },
      available: availableCount,
    };
  };

  /**
   * 批量更新行车状态
   * @param {Array<number>} craneIds - 行车ID列表
   * @param {string} status - 新状态
   * @param {Object} options - 更新选项
   * @returns {Promise<number>} 更新的记录数
   */
  Crane.batchUpdateStatus = async function (craneIds, status, options = {}) {
    const validStatuses = ['online', 'offline', 'running', 'standby', 'fault'];
    if (!validStatuses.includes(status)) {
      throw new Error(`无效的状态值: ${status}`);
    }
    return await this.update(
      { status },
      {
        where: {
          id: {
            [sequelize.Sequelize.Op.in]: craneIds,
          },
        },
        ...options,
      }
    );
  };

  /**
   * 批量切换控制模式
   * @param {Array<number>} craneIds - 行车ID列表
   * @param {string} mode - 控制模式
   * @param {Object} options - 更新选项
   * @returns {Promise<number>} 更新的记录数
   */
  Crane.batchSwitchMode = async function (craneIds, mode, options = {}) {
    const validModes = ['auto', 'manual'];
    if (!validModes.includes(mode)) {
      throw new Error(`无效的控制模式: ${mode}`);
    }
    const { Op } = sequelize.Sequelize;
    // 只更新非运行状态的行车
    return await this.update(
      { mode },
      {
        where: {
          id: {
            [Op.in]: craneIds,
          },
          status: {
            [Op.ne]: 'running',
          },
          emergency_stop: false,
          is_enabled: true,
        },
        ...options,
      }
    );
  };

  /**
   * 批量设置职责
   * @param {Array<number>} craneIds - 行车ID列表
   * @param {string} duty - 职责类型
   * @param {Object} options - 更新选项
   * @returns {Promise<number>} 更新的记录数
   */
  Crane.batchSetDuty = async function (craneIds, duty, options = {}) {
    const validDuties = ['feeding', 'stacking', 'turning', 'moving'];
    if (!validDuties.includes(duty)) {
      throw new Error(`无效的职责类型: ${duty}`);
    }
    return await this.update(
      { duty },
      {
        where: {
          id: {
            [sequelize.Sequelize.Op.in]: craneIds,
          },
          is_enabled: true,
        },
        ...options,
      }
    );
  };

  /**
   * 查找指定坐标附近的行车
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} radius - 搜索半径（米）
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Crane>>} 附近的行车列表
   */
  Crane.findNearbyCranes = async function (x, y, radius = 10, options = {}) {
    const { Op } = sequelize.Sequelize;
    return await this.scope('enabled').findAll({
      ...options,
      where: {
        current_position_x: {
          [Op.between]: [x - radius, x + radius],
        },
        current_position_y: {
          [Op.between]: [y - radius, y + radius],
        },
        ...(options.where || {}),
      },
      order: [['crane_no', 'ASC']],
    });
  };

  /**
   * 检查行车编号是否已存在
   * @param {string} craneNo - 行车编号
   * @param {number} excludeId - 排除的行车ID（用于更新时排除自身）
   * @returns {Promise<boolean>} 是否存在
   */
  Crane.isCraneNoExists = async function (craneNo, excludeId = null) {
    const where = { crane_no: craneNo };
    if (excludeId) {
      where.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count > 0;
  };

  /**
   * 获取所有急停的行车
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Crane>>} 急停行车列表
   */
  Crane.findAllEmergencyStop = async function (options = {}) {
    return await this.findAll({
      ...options,
      where: {
        emergency_stop: true,
      },
      order: [['crane_no', 'ASC']],
    });
  };

  /**
   * 获取需要维护的行车
   * @param {number} days - 维护周期天数
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Crane>>} 需要维护的行车列表
   */
  Crane.findNeedMaintenance = async function (days = 30, options = {}) {
    const { Op } = sequelize.Sequelize;
    const maintenanceDate = new Date();
    maintenanceDate.setDate(maintenanceDate.getDate() - days);

    return await this.scope('enabled').findAll({
      ...options,
      where: {
        [Op.or]: [
          {
            last_maintenance_date: {
              [Op.lt]: maintenanceDate,
            },
          },
          {
            last_maintenance_date: null,
          },
        ],
      },
      order: [['last_maintenance_date', 'ASC']],
    });
  };

  // 返回模型
  return Crane;
};
