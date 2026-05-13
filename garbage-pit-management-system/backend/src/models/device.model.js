/**
 * 垃圾储坑智能化管控系统 - 设备模型
 *
 * 该文件定义了设备表(Device)的数据模型，用于管理垃圾储坑中的各类设备信息
 * 设备类型包括：行车、卸料门、转料门、摄像头、传感器等
 *
 * 主要功能：
 * 1. 设备基本信息管理（编号、名称、类型、型号等）
 * 2. 设备状态管理（在线/离线/故障/维护）
 * 3. 设备位置信息管理
 * 4. 设备网络配置（IP地址、端口）
 * 5. 设备扩展配置（JSON格式）
 * 6. 设备心跳监控
 *
 * @module models/device
 * @author 华工三峰
 */

'use strict';

/**
 * 设备模型定义
 * @param {Sequelize} sequelize - Sequelize 实例
 * @param {DataTypes} DataTypes - Sequelize 数据类型
 * @returns {Model} Device 模型
 */
module.exports = (sequelize, DataTypes) => {
  /**
   * 设备模型定义
   *
   * 设备是垃圾储坑智能化管控系统的基础设施
   * 包括行车、卸料门、转料门、摄像头、传感器等各类设备
   */
  const Device = sequelize.define(
    'Device',
    {
      /**
       * 设备ID - 主键
       * 使用自增整数作为主键
       */
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '设备ID，自增主键',
      },

      /**
       * 设备编号
       * 用于标识设备的唯一业务编号，如 CAM001, SENSOR002 等
       */
      device_no: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: '设备编号，如CAM001、SENSOR002等',
        validate: {
          notEmpty: {
            msg: '设备编号不能为空',
          },
          len: {
            args: [1, 50],
            msg: '设备编号长度必须在1-50个字符之间',
          },
          // 验证设备编号格式：字母开头，后跟字母、数字、下划线或短横线
          is: {
            args: /^[A-Za-z][A-Za-z0-9_-]*$/,
            msg: '设备编号格式无效，必须以字母开头，只能包含字母、数字、下划线和短横线',
          },
        },
      },

      /**
       * 设备名称
       * 设备的可读性名称，便于用户识别
       */
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '设备名称',
        validate: {
          notEmpty: {
            msg: '设备名称不能为空',
          },
          len: {
            args: [1, 100],
            msg: '设备名称长度必须在1-100个字符之间',
          },
        },
      },

      /**
       * 设备类型
       * crane: 行车 - 垃圾抓取和搬运设备
       * discharge_door: 卸料门 - 卸料区域门控设备
       * transfer_door: 转料门 - 转料区域门控设备
       * camera: 摄像头 - 视频监控设备
       * sensor: 传感器 - 各类传感器设备
       * plc: PLC控制器 - 可编程逻辑控制器
       * other: 其他设备
       */
      type: {
        type: DataTypes.ENUM('crane', 'discharge_door', 'transfer_door', 'camera', 'sensor', 'plc', 'other'),
        allowNull: false,
        comment: '设备类型：crane-行车, discharge_door-卸料门, transfer_door-转料门, camera-摄像头, sensor-传感器, plc-PLC控制器, other-其他',
        validate: {
          isIn: {
            args: [['crane', 'discharge_door', 'transfer_door', 'camera', 'sensor', 'plc', 'other']],
            msg: '设备类型必须是 crane、discharge_door、transfer_door、camera、sensor、plc 或 other 之一',
          },
        },
      },

      /**
       * 设备型号
       * 设备的具体型号信息
       */
      model: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '设备型号',
        validate: {
          len: {
            args: [0, 100],
            msg: '设备型号长度不能超过100个字符',
          },
        },
      },

      /**
       * 制造商
       * 设备的生产厂商信息
       */
      manufacturer: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '制造商',
        validate: {
          len: {
            args: [0, 100],
            msg: '制造商长度不能超过100个字符',
          },
        },
      },

      /**
       * 安装日期
       * 设备的安装日期
       */
      install_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '安装日期',
      },

      /**
       * 安装位置
       * 设备的安装位置描述
       */
      location: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '安装位置',
        validate: {
          len: {
            args: [0, 100],
            msg: '安装位置长度不能超过100个字符',
          },
        },
      },

      /**
       * 所属区域ID
       * 设备所属区域的ID，关联区域表
       */
      area_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '所属区域ID',
      },

      /**
       * 位置坐标X
       * 设备在三维空间中的X坐标（单位：米）
       */
      position_x: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
        comment: '位置坐标X（米）',
        validate: {
          isDecimal: {
            msg: 'X坐标必须是有效的小数',
          },
        },
      },

      /**
       * 位置坐标Y
       * 设备在三维空间中的Y坐标（单位：米）
       */
      position_y: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
        comment: '位置坐标Y（米）',
        validate: {
          isDecimal: {
            msg: 'Y坐标必须是有效的小数',
          },
        },
      },

      /**
       * 位置坐标Z
       * 设备在三维空间中的Z坐标/高度（单位：米）
       */
      position_z: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
        comment: '位置坐标Z/高度（米）',
        validate: {
          isDecimal: {
            msg: 'Z坐标必须是有效的小数',
          },
        },
      },

      /**
       * 设备状态
       * online: 在线 - 设备已连接并正常工作
       * offline: 离线 - 设备未连接或断开连接
       * fault: 故障 - 设备出现故障
       * maintenance: 维护中 - 设备正在维护
       */
      status: {
        type: DataTypes.ENUM('online', 'offline', 'fault', 'maintenance'),
        allowNull: false,
        defaultValue: 'offline',
        comment: '状态：online-在线, offline-离线, fault-故障, maintenance-维护中',
        validate: {
          isIn: {
            args: [['online', 'offline', 'fault', 'maintenance']],
            msg: '设备状态必须是 online、offline、fault 或 maintenance 之一',
          },
        },
      },

      /**
       * IP地址
       * 设备的网络IP地址
       */
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: 'IP地址',
        validate: {
          isIP: {
            msg: 'IP地址格式无效',
          },
        },
      },

      /**
       * 端口号
       * 设备的网络端口号
       */
      port: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '端口号',
        validate: {
          isInt: {
            msg: '端口号必须是整数',
          },
          min: {
            args: [1],
            msg: '端口号必须大于0',
          },
          max: {
            args: [65535],
            msg: '端口号不能超过65535',
          },
        },
      },

      /**
       * 最后心跳时间
       * 设备最后一次上报心跳的时间
       * 用于判断设备是否在线
       */
      last_heartbeat: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '最后心跳时间',
      },

      /**
       * 扩展配置
       * 设备的扩展配置信息，以JSON格式存储
       * 可包含各类设备的特定配置参数
       */
      config: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: '扩展配置（JSON格式）',
      },

      /**
       * 设备描述
       * 设备的详细描述信息
       */
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '设备描述',
      },

      /**
       * 是否启用
       * 用于控制设备的启用/禁用状态
       */
      is_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '是否启用',
      },

      /**
       * 最后维护日期
       * 记录设备最后一次维护保养的日期
       */
      last_maintenance_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '最后维护日期',
      },

      /**
       * 下次维护日期
       * 计划进行下次维护的日期
       */
      next_maintenance_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '下次维护日期',
      },

      /**
       * 创建人ID
       * 记录创建该设备记录的用户ID
       */
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: '创建人ID',
      },

      /**
       * 更新人ID
       * 记录最后更新该设备记录的用户ID
       */
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: '更新人ID',
      },
    },
    {
      // 表名配置
      tableName: 'devices',

      // 索引配置
      indexes: [
        {
          unique: true,
          fields: ['device_no'],
          name: 'idx_devices_device_no',
        },
        {
          fields: ['type'],
          name: 'idx_devices_type',
        },
        {
          fields: ['status'],
          name: 'idx_devices_status',
        },
        {
          fields: ['area_id'],
          name: 'idx_devices_area_id',
        },
        {
          fields: ['is_enabled'],
          name: 'idx_devices_is_enabled',
        },
        {
          fields: ['last_heartbeat'],
          name: 'idx_devices_last_heartbeat',
        },
        {
          fields: ['position_x', 'position_y'],
          name: 'idx_devices_position',
        },
      ],

      // 钩子函数配置
      hooks: {
        /**
         * 创建前钩子
         * 在创建设备记录之前执行
         */
        beforeCreate: async (device, options) => {
          // 如果设备处于维护状态，确保状态正确
          if (device.status === 'maintenance') {
            console.log(`设备 ${device.device_no} 正在创建为维护状态`);
          }
        },

        /**
         * 更新前钩子
         * 在更新设备记录之前执行
         */
        beforeUpdate: async (device, options) => {
          // 如果状态从在线变为离线，记录日志
          if (device.changed('status') && device.previous('status') === 'online' && device.status === 'offline') {
            console.log(`设备 ${device.device_no} 从在线变为离线`);
          }

          // 如果设备从故障恢复，清除维护相关状态
          if (device.changed('status') && device.previous('status') === 'fault' && device.status === 'online') {
            console.log(`设备 ${device.device_no} 从故障恢复为在线`);
          }
        },
      },

      // 模型作用域配置
      scopes: {
        // 仅查询启用的设备
        enabled: {
          where: {
            is_enabled: true,
          },
        },
        // 查询在线的设备
        online: {
          where: {
            status: 'online',
            is_enabled: true,
          },
        },
        // 查询离线的设备
        offline: {
          where: {
            status: 'offline',
          },
        },
        // 查询故障设备
        fault: {
          where: {
            status: 'fault',
          },
        },
        // 查询维护中的设备
        maintenance: {
          where: {
            status: 'maintenance',
          },
        },
        // 查询摄像头设备
        cameras: {
          where: {
            type: 'camera',
          },
        },
        // 查询传感器设备
        sensors: {
          where: {
            type: 'sensor',
          },
        },
        // 查询PLC设备
        plcs: {
          where: {
            type: 'plc',
          },
        },
        // 查询卸料门设备
        dischargeDoors: {
          where: {
            type: 'discharge_door',
          },
        },
        // 查询转料门设备
        transferDoors: {
          where: {
            type: 'transfer_door',
          },
        },
      },
    }
  );

  // =====================================================
  // 实例方法
  // =====================================================

  /**
   * 更新设备状态
   * @param {string} status - 新状态
   * @param {Object} options - 更新选项
   * @returns {Promise<Device>} 更新后的设备实例
   */
  Device.prototype.updateStatus = async function (status, options = {}) {
    const validStatuses = ['online', 'offline', 'fault', 'maintenance'];
    if (!validStatuses.includes(status)) {
      throw new Error(`无效的状态值: ${status}`);
    }
    this.status = status;
    return await this.save(options);
  };

  /**
   * 更新心跳时间
   * @param {Object} options - 更新选项
   * @returns {Promise<Device>} 更新后的设备实例
   */
  Device.prototype.updateHeartbeat = async function (options = {}) {
    this.last_heartbeat = new Date();
    // 如果设备之前是离线状态，更新为在线
    if (this.status === 'offline') {
      this.status = 'online';
    }
    return await this.save(options);
  };

  /**
   * 检查心跳是否超时
   * @param {number} timeoutSeconds - 超时时间（秒），默认60秒
   * @returns {boolean} 是否超时
   */
  Device.prototype.isHeartbeatTimeout = function (timeoutSeconds = 60) {
    if (!this.last_heartbeat) {
      return true;
    }
    const now = new Date();
    const lastHeartbeat = new Date(this.last_heartbeat);
    const diffSeconds = (now - lastHeartbeat) / 1000;
    return diffSeconds > timeoutSeconds;
  };

  /**
   * 设置设备为维护状态
   * @param {Object} options - 更新选项
   * @returns {Promise<Device>} 更新后的设备实例
   */
  Device.prototype.setMaintenance = async function (options = {}) {
    this.status = 'maintenance';
    return await this.save(options);
  };

  /**
   * 解除维护状态
   * @param {Object} options - 更新选项
   * @returns {Promise<Device>} 更新后的设备实例
   */
  Device.prototype.releaseMaintenance = async function (options = {}) {
    this.status = 'online';
    this.last_maintenance_date = new Date();
    return await this.save(options);
  };

  /**
   * 报告故障
   * @param {string} description - 故障描述
   * @param {Object} options - 更新选项
   * @returns {Promise<Device>} 更新后的设备实例
   */
  Device.prototype.reportFault = async function (description, options = {}) {
    this.status = 'fault';
    if (description) {
      this.description = description;
    }
    return await this.save(options);
  };

  /**
   * 启用设备
   * @param {Object} options - 更新选项
   * @returns {Promise<Device>} 更新后的设备实例
   */
  Device.prototype.enable = async function (options = {}) {
    this.is_enabled = true;
    return await this.save(options);
  };

  /**
   * 禁用设备
   * @param {Object} options - 更新选项
   * @returns {Promise<Device>} 更新后的设备实例
   */
  Device.prototype.disable = async function (options = {}) {
    this.is_enabled = false;
    this.status = 'offline';
    return await this.save(options);
  };

  /**
   * 更新位置信息
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} z - Z坐标
   * @param {Object} options - 更新选项
   * @returns {Promise<Device>} 更新后的设备实例
   */
  Device.prototype.updatePosition = async function (x, y, z, options = {}) {
    this.position_x = x;
    this.position_y = y;
    this.position_z = z;
    return await this.save(options);
  };

  /**
   * 更新配置
   * @param {Object} newConfig - 新的配置信息
   * @param {Object} options - 更新选项
   * @returns {Promise<Device>} 更新后的设备实例
   */
  Device.prototype.updateConfig = async function (newConfig, options = {}) {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    return await this.save(options);
  };

  /**
   * 检查设备是否可用
   * @returns {boolean} 是否可用
   */
  Device.prototype.isAvailable = function () {
    return (
      this.is_enabled &&
      this.status === 'online'
    );
  };

  /**
   * 检查设备是否在线
   * @returns {boolean} 是否在线
   */
  Device.prototype.isOnline = function () {
    return this.status === 'online' && this.is_enabled;
  };

  /**
   * 检查设备是否故障
   * @returns {boolean} 是否故障
   */
  Device.prototype.isFault = function () {
    return this.status === 'fault';
  };

  /**
   * 检查设备是否在维护中
   * @returns {boolean} 是否在维护中
   */
  Device.prototype.isInMaintenance = function () {
    return this.status === 'maintenance';
  };

  /**
   * 获取设备位置信息
   * @returns {Object} 位置信息对象
   */
  Device.prototype.getPosition = function () {
    return {
      x: this.position_x,
      y: this.position_y,
      z: this.position_z,
    };
  };

  /**
   * 获取设备摘要信息
   * @returns {Object} 摘要信息对象
   */
  Device.prototype.getSummary = function () {
    return {
      id: this.id,
      device_no: this.device_no,
      name: this.name,
      type: this.type,
      status: this.status,
      location: this.location,
      area_id: this.area_id,
      is_enabled: this.is_enabled,
      is_available: this.isAvailable(),
      last_heartbeat: this.last_heartbeat,
    };
  };

  /**
   * 转换为JSON格式
   * @returns {Object} JSON对象
   */
  Device.prototype.toJSON = function () {
    const values = { ...this.get() };
    values.is_available = this.isAvailable();
    values.is_online = this.isOnline();
    values.position = this.getPosition();
    return values;
  };

  // =====================================================
  // 类方法（静态方法）
  // =====================================================

  /**
   * 查找所有在线的设备
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Device>>} 在线设备列表
   */
  Device.findAllOnline = async function (options = {}) {
    return await this.scope('online').findAll({
      ...options,
      order: [['device_no', 'ASC']],
    });
  };

  /**
   * 查找所有离线的设备
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Device>>} 离线设备列表
   */
  Device.findAllOffline = async function (options = {}) {
    return await this.scope('offline').findAll({
      ...options,
      order: [['device_no', 'ASC']],
    });
  };

  /**
   * 查找所有故障设备
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Device>>} 故障设备列表
   */
  Device.findAllFault = async function (options = {}) {
    return await this.scope('fault').findAll({
      ...options,
      order: [['device_no', 'ASC']],
    });
  };

  /**
   * 查找所有维护中的设备
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Device>>} 维护中设备列表
   */
  Device.findAllMaintenance = async function (options = {}) {
    return await this.scope('maintenance').findAll({
      ...options,
      order: [['device_no', 'ASC']],
    });
  };

  /**
   * 根据设备编号查找
   * @param {string} deviceNo - 设备编号
   * @param {Object} options - 查询选项
   * @returns {Promise<Device|null>} 设备实例
   */
  Device.findByDeviceNo = async function (deviceNo, options = {}) {
    return await this.findOne({
      ...options,
      where: {
        device_no: deviceNo,
      },
    });
  };

  /**
   * 根据设备类型查找
   * @param {string} type - 设备类型
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Device>>} 设备列表
   */
  Device.findByType = async function (type, options = {}) {
    const validTypes = ['crane', 'discharge_door', 'transfer_door', 'camera', 'sensor', 'plc', 'other'];
    if (!validTypes.includes(type)) {
      throw new Error(`无效的设备类型: ${type}`);
    }
    return await this.scope('enabled').findAll({
      ...options,
      where: {
        type: type,
      },
      order: [['device_no', 'ASC']],
    });
  };

  /**
   * 查找所有摄像头
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Device>>} 摄像头列表
   */
  Device.findAllCameras = async function (options = {}) {
    return await this.scope('cameras').findAll({
      ...options,
      where: {
        ...(options.where || {}),
        is_enabled: true,
      },
      order: [['device_no', 'ASC']],
    });
  };

  /**
   * 查找所有传感器
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Device>>} 传感器列表
   */
  Device.findAllSensors = async function (options = {}) {
    return await this.scope('sensors').findAll({
      ...options,
      where: {
        ...(options.where || {}),
        is_enabled: true,
      },
      order: [['device_no', 'ASC']],
    });
  };

  /**
   * 根据区域ID查找设备
   * @param {number} areaId - 区域ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Device>>} 设备列表
   */
  Device.findByAreaId = async function (areaId, options = {}) {
    return await this.scope('enabled').findAll({
      ...options,
      where: {
        area_id: areaId,
      },
      order: [['device_no', 'ASC']],
    });
  };

  /**
   * 查找心跳超时的设备
   * @param {number} timeoutSeconds - 超时时间（秒）
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Device>>} 超时设备列表
   */
  Device.findHeartbeatTimeout = async function (timeoutSeconds = 60, options = {}) {
    const { Op } = sequelize.Sequelize;
    const timeoutDate = new Date();
    timeoutDate.setSeconds(timeoutDate.getSeconds() - timeoutSeconds);

    return await this.scope('enabled').findAll({
      ...options,
      where: {
        status: 'online',
        [Op.or]: [
          {
            last_heartbeat: {
              [Op.lt]: timeoutDate,
            },
          },
          {
            last_heartbeat: null,
          },
        ],
      },
      order: [['device_no', 'ASC']],
    });
  };

  /**
   * 查找需要维护的设备
   * @param {number} days - 提前天数
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Device>>} 需要维护的设备列表
   */
  Device.findNeedMaintenance = async function (days = 7, options = {}) {
    const { Op } = sequelize.Sequelize;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    return await this.scope('enabled').findAll({
      ...options,
      where: {
        [Op.or]: [
          {
            next_maintenance_date: {
              [Op.lte]: targetDate,
            },
          },
          {
            last_maintenance_date: null,
          },
        ],
        status: {
          [Op.ne]: 'maintenance',
        },
      },
      order: [['next_maintenance_date', 'ASC']],
    });
  };

  /**
   * 获取设备统计信息
   * @returns {Promise<Object>} 统计信息
   */
  Device.getStatistics = async function () {
    const { Op } = sequelize.Sequelize;

    // 总体统计
    const totalCount = await this.count();
    const enabledCount = await this.count({ where: { is_enabled: true } });

    // 按状态统计
    const onlineCount = await this.count({ where: { status: 'online' } });
    const offlineCount = await this.count({ where: { status: 'offline' } });
    const faultCount = await this.count({ where: { status: 'fault' } });
    const maintenanceCount = await this.count({ where: { status: 'maintenance' } });

    // 按类型统计
    const cameraCount = await this.count({ where: { type: 'camera' } });
    const sensorCount = await this.count({ where: { type: 'sensor' } });
    const plcCount = await this.count({ where: { type: 'plc' } });
    const dischargeDoorCount = await this.count({ where: { type: 'discharge_door' } });
    const transferDoorCount = await this.count({ where: { type: 'transfer_door' } });

    // 可用设备统计
    const availableCount = await this.count({
      where: {
        is_enabled: true,
        status: 'online',
      },
    });

    return {
      total: totalCount,
      enabled: enabledCount,
      disabled: totalCount - enabledCount,
      byStatus: {
        online: onlineCount,
        offline: offlineCount,
        fault: faultCount,
        maintenance: maintenanceCount,
      },
      byType: {
        camera: cameraCount,
        sensor: sensorCount,
        plc: plcCount,
        discharge_door: dischargeDoorCount,
        transfer_door: transferDoorCount,
      },
      available: availableCount,
    };
  };

  /**
   * 批量更新设备状态
   * @param {Array<number>} deviceIds - 设备ID列表
   * @param {string} status - 新状态
   * @param {Object} options - 更新选项
   * @returns {Promise<number>} 更新的记录数
   */
  Device.batchUpdateStatus = async function (deviceIds, status, options = {}) {
    const validStatuses = ['online', 'offline', 'fault', 'maintenance'];
    if (!validStatuses.includes(status)) {
      throw new Error(`无效的状态值: ${status}`);
    }
    return await this.update(
      { status },
      {
        where: {
          id: {
            [sequelize.Sequelize.Op.in]: deviceIds,
          },
        },
        ...options,
      }
    );
  };

  /**
   * 检查设备编号是否已存在
   * @param {string} deviceNo - 设备编号
   * @param {number} excludeId - 排除的设备ID（用于更新时排除自身）
   * @returns {Promise<boolean>} 是否存在
   */
  Device.isDeviceNoExists = async function (deviceNo, excludeId = null) {
    const where = { device_no: deviceNo };
    if (excludeId) {
      where.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count > 0;
  };

  /**
   * 查找指定坐标附近的设备
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} radius - 搜索半径（米）
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Device>>} 附近的设备列表
   */
  Device.findNearbyDevices = async function (x, y, radius = 10, options = {}) {
    const { Op } = sequelize.Sequelize;
    return await this.scope('enabled').findAll({
      ...options,
      where: {
        position_x: {
          [Op.between]: [x - radius, x + radius],
        },
        position_y: {
          [Op.between]: [y - radius, y + radius],
        },
        ...(options.where || {}),
      },
      order: [['device_no', 'ASC']],
    });
  };

  // 返回模型
  return Device;
};
