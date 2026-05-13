/**
 * 垃圾储坑智能化管控系统 - 车辆记录模型
 *
 * 该文件定义了车辆记录表(VehicleRecord)的数据模型，用于管理车辆进出厂区及卸料记录。
 *
 * 功能特点：
 * 1. 车辆基本信息管理（车牌号、车辆类型、驾驶员信息）
 * 2. 车辆进出记录管理（进场时间、出场时间）
 * 3. 卸料记录管理（物料类型、重量、卸料区域）
 * 4. 车辆记录类型分类（卸料、进场、出场、运料）
 * 5. 区域关联查询
 *
 * 记录类型说明：
 * - discharge: 卸料记录，车辆进入厂区卸载垃圾
 * - enter: 进场记录，车辆进入厂区
 * - exit: 出场记录，车辆离开厂区
 * - transport: 运料记录，车辆在区域内运输物料
 *
 * @module models/vehicle
 * @author 华工三峰
 */

'use strict';

/**
 * 导出车辆记录模型定义
 *
 * @param {Sequelize} sequelize - Sequelize 实例
 * @param {DataTypes} DataTypes - Sequelize 数据类型
 * @returns {Model} VehicleRecord 模型
 */
module.exports = (sequelize, DataTypes) => {
  // =====================================================
  // 车辆记录模型定义
  // =====================================================

  /**
   * 车辆记录模型
   *
   * 对应数据库表: vehicle_records
   * 包含车辆基本信息、进出时间、物料信息等字段
   */
  const VehicleRecord = sequelize.define(
    'VehicleRecord',
    {
      // =====================================================
      // 主键字段
      // =====================================================

      /**
       * 记录ID（主键）
       * 自增整数类型
       */
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: '记录ID，主键，自增',
      },

      // =====================================================
      // 车辆基本信息字段
      // =====================================================

      /**
       * 车牌号
       * 唯一标识车辆的号码
       * 格式示例：粤A12345
       */
      vehicle_no: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: '车牌号',
        validate: {
          // 非空验证
          notEmpty: {
            msg: '车牌号不能为空',
          },
          // 长度验证
          len: {
            args: [1, 20],
            msg: '车牌号长度应在1-20个字符之间',
          },
          // 格式验证（支持中国大陆车牌格式）
          is: {
            args: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4,5}[A-Z0-9挂学警港澳]$/,
            msg: '车牌号格式不正确',
          },
        },
      },

      /**
       * 车辆类型
       * 描述车辆的类型，如垃圾车、运输车等
       */
      vehicle_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '车辆类型',
        validate: {
          // 长度验证
          len: {
            args: [0, 50],
            msg: '车辆类型长度不能超过50个字符',
          },
        },
      },

      /**
       * 驾驶员姓名
       * 记录驾驶员的名字
       */
      driver_name: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '驾驶员姓名',
        validate: {
          // 长度验证
          len: {
            args: [0, 50],
            msg: '驾驶员姓名长度不能超过50个字符',
          },
        },
      },

      // =====================================================
      // 记录类型字段
      // =====================================================

      /**
       * 记录类型
       * 枚举值：discharge(卸料), enter(进场), exit(出场), transport(运料)
       */
      record_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: '记录类型：discharge(卸料), enter(进场), exit(出场), transport(运料)',
        validate: {
          // 验证记录类型是否在允许的范围内
          isIn: {
            args: [['discharge', 'enter', 'exit', 'transport']],
            msg: '记录类型必须是 discharge、enter、exit 或 transport 之一',
          },
          notEmpty: {
            msg: '记录类型不能为空',
          },
        },
      },

      // =====================================================
      // 物料信息字段
      // =====================================================

      /**
       * 物料类型
       * 描述运输物料的类型，如生活垃圾、厨余垃圾等
       */
      material_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '物料类型',
        validate: {
          // 长度验证
          len: {
            args: [0, 50],
            msg: '物料类型长度不能超过50个字符',
          },
        },
      },

      /**
       * 重量（吨）
       * 记录物料的重量
       */
      weight: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: '物料重量，单位：吨',
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

      // =====================================================
      // 关联区域字段
      // =====================================================

      /**
       * 区域ID（外键）
       * 关联卸料或运输的区域
       */
      area_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '区域ID，关联areas表',
        validate: {
          isInt: {
            msg: '区域ID必须为整数',
          },
          min: {
            args: [1],
            msg: '区域ID必须大于0',
          },
        },
      },

      // =====================================================
      // 进出场信息字段
      // =====================================================

      /**
       * 门号
       * 记录车辆进出的门编号
       */
      gate_no: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: '门号',
        validate: {
          // 长度验证
          len: {
            args: [0, 20],
            msg: '门号长度不能超过20个字符',
          },
        },
      },

      /**
       * 进场时间
       * 车辆进入厂区的时间
       */
      enter_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '进场时间',
        validate: {
          isDate: {
            msg: '进场时间格式不正确',
          },
        },
      },

      /**
       * 出场时间
       * 车辆离开厂区的时间
       */
      exit_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '出场时间',
        validate: {
          isDate: {
            msg: '出场时间格式不正确',
          },
          // 自定义验证：出场时间必须大于进场时间
          isAfterEnterTime(value) {
            if (value && this.enter_time && new Date(value) <= new Date(this.enter_time)) {
              throw new Error('出场时间必须晚于进场时间');
            }
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

      // =====================================================
      // 索引信息（虚拟字段，用于文档说明）
      // =====================================================

      /**
       * 索引设计说明：
       *
       * 1. 主键索引: id (自动创建)
       * 2. 普通索引:
       *    - vehicle_no (按车牌号查询记录)
       *    - record_type (按记录类型筛选)
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
      tableName: 'vehicle_records',

      /**
       * 时间戳配置
       * 只启用创建时间，不启用更新时间
       */
      timestamps: true,

      /**
       * 时间戳字段名称配置
       * 只使用 created_at 字段
       */
      createdAt: 'created_at',
      updatedAt: false,

      /**
       * 索引配置
       * 定义数据库索引以优化查询性能
       */
      indexes: [
        // 车牌号索引（用于按车牌号查询）
        {
          fields: ['vehicle_no'],
          name: 'idx_vehicle_records_vehicle_no',
        },
        // 记录类型索引（用于按类型筛选）
        {
          fields: ['record_type'],
          name: 'idx_vehicle_records_record_type',
        },
        // 创建时间索引（用于按时间排序和范围查询）
        {
          fields: ['created_at'],
          name: 'idx_vehicle_records_created_at',
        },
        // 区域ID索引（用于按区域查询）
        {
          fields: ['area_id'],
          name: 'idx_vehicle_records_area_id',
        },
        // 复合索引：车牌号 + 记录类型（用于特定类型的车辆记录查询）
        {
          fields: ['vehicle_no', 'record_type'],
          name: 'idx_vehicle_records_no_type',
        },
        // 复合索引：进场时间 + 出场时间（用于在场车辆查询）
        {
          fields: ['enter_time', 'exit_time'],
          name: 'idx_vehicle_records_time_range',
        },
      ],

      /**
       * 模型名称配置
       * 用于 Sequelize 内部标识
       */
      modelName: 'VehicleRecord',

      /**
       * 注释配置
       * 添加表级别注释
       */
      comment: '车辆记录表，用于管理车辆进出厂区及卸料记录',

      /**
       * 钩子函数配置
       * 在特定操作前后执行的自定义逻辑
       */
      hooks: {
        /**
         * 创建记录前的钩子
         * 自动设置进场时间
         */
        beforeCreate: (record, options) => {
          // 如果是进场记录且没有进场时间，自动设置当前时间
          if (record.record_type === 'enter' && !record.enter_time) {
            record.enter_time = new Date();
          }
        },

        /**
         * 更新记录后的钩子
         * 自动设置出场时间
         */
        beforeUpdate: (record, options) => {
          // 如果是出场记录且没有出场时间，自动设置当前时间
          if (record.record_type === 'exit' && !record.exit_time) {
            record.exit_time = new Date();
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
        // 卸料记录
        discharge: {
          where: {
            record_type: 'discharge',
          },
        },
        // 进场记录
        enter: {
          where: {
            record_type: 'enter',
          },
        },
        // 出场记录
        exit: {
          where: {
            record_type: 'exit',
          },
        },
        // 运料记录
        transport: {
          where: {
            record_type: 'transport',
          },
        },
        // 今日记录
        today: {
          where: {
            created_at: {
              [sequelize.Sequelize.Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
              [sequelize.Sequelize.Op.lt]: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        },
        // 在场车辆（已进场未出场）
        inFactory: {
          where: {
            enter_time: {
              [sequelize.Sequelize.Op.ne]: null,
            },
            exit_time: null,
          },
        },
      },
    }
  );

  // =====================================================
  // 实例方法
  // =====================================================

  /**
   * 获取记录类型中文名称
   *
   * @returns {string} 记录类型的中文名称
   */
  VehicleRecord.prototype.getRecordTypeName = function () {
    const typeNames = {
      discharge: '卸料',
      enter: '进场',
      exit: '出场',
      transport: '运料',
    };
    return typeNames[this.record_type] || '未知类型';
  };

  /**
   * 获取在场时长（分钟）
   * 计算从进场到当前时间或出场时间的时长
   *
   * @returns {number|null} 在场时长（分钟），如果未进场则返回null
   */
  VehicleRecord.prototype.getDuration = function () {
    if (!this.enter_time) {
      return null;
    }

    const endTime = this.exit_time || new Date();
    const duration = Math.floor((endTime - new Date(this.enter_time)) / (1000 * 60));

    return duration > 0 ? duration : 0;
  };

  /**
   * 获取在场时长（可读格式）
   * 将时长转换为人类可读格式
   *
   * @returns {string} 格式化的时长字符串，如 "1小时30分钟"
   */
  VehicleRecord.prototype.getFormattedDuration = function () {
    const duration = this.getDuration();

    if (duration === null) {
      return '未进场';
    }

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    if (hours > 0) {
      return `${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`;
    } else {
      return `${minutes}分钟`;
    }
  };

  /**
   * 检查车辆是否在场
   *
   * @returns {boolean} 是否在场
   */
  VehicleRecord.prototype.isInFactory = function () {
    return this.enter_time && !this.exit_time;
  };

  /**
   * 设置出场时间
   *
   * @param {Object} [options] - 选项参数
   * @param {Object} [options.transaction] - 事务对象
   * @returns {Promise<VehicleRecord>} 更新后的记录实例
   */
  VehicleRecord.prototype.setExitTime = async function (options = {}) {
    this.exit_time = new Date();
    await this.save({
      transaction: options.transaction,
    });
    return this;
  };

  /**
   * 获取记录摘要信息
   * 用于列表展示
   *
   * @returns {Object} 摘要信息对象
   */
  VehicleRecord.prototype.getSummary = function () {
    return {
      id: this.id,
      vehicle_no: this.vehicle_no,
      vehicle_type: this.vehicle_type,
      driver_name: this.driver_name,
      record_type: this.record_type,
      record_type_name: this.getRecordTypeName(),
      material_type: this.material_type,
      weight: this.weight,
      gate_no: this.gate_no,
      enter_time: this.enter_time,
      exit_time: this.exit_time,
      duration: this.getFormattedDuration(),
      is_in_factory: this.isInFactory(),
      created_at: this.created_at,
    };
  };

  // =====================================================
  // 类方法（静态方法）
  // =====================================================

  /**
   * 根据车牌号查找记录
   *
   * @param {string} vehicleNo - 车牌号
   * @param {Object} [options] - 查询选项
   * @returns {Promise<Array<VehicleRecord>>} 记录列表
   */
  VehicleRecord.findByVehicleNo = async function (vehicleNo, options = {}) {
    return await this.findAll({
      where: { vehicle_no: vehicleNo },
      order: [['created_at', 'DESC']],
      ...options,
    });
  };

  /**
   * 根据记录类型查找记录
   *
   * @param {string} recordType - 记录类型
   * @param {Object} [options] - 查询选项
   * @returns {Promise<Array<VehicleRecord>>} 记录列表
   */
  VehicleRecord.findByType = async function (recordType, options = {}) {
    return await this.findAll({
      where: { record_type: recordType },
      order: [['created_at', 'DESC']],
      ...options,
    });
  };

  /**
   * 查找在场车辆
   * 已进场但未出场的车辆
   *
   * @param {Object} [options] - 查询选项
   * @returns {Promise<Array<VehicleRecord>>} 在场车辆列表
   */
  VehicleRecord.findInFactory = async function (options = {}) {
    return await this.findAll({
      where: {
        enter_time: {
          [sequelize.Sequelize.Op.ne]: null,
        },
        exit_time: null,
      },
      order: [['enter_time', 'ASC']],
      ...options,
    });
  };

  /**
   * 查找今日记录
   *
   * @param {Object} [options] - 查询选项
   * @returns {Promise<Array<VehicleRecord>>} 今日记录列表
   */
  VehicleRecord.findToday = async function (options = {}) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return await this.findAll({
      where: {
        created_at: {
          [sequelize.Sequelize.Op.gte]: startOfDay,
          [sequelize.Sequelize.Op.lte]: endOfDay,
        },
      },
      order: [['created_at', 'DESC']],
      ...options,
    });
  };

  /**
   * 获取指定时间范围内的记录
   *
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @param {Object} [options] - 查询选项
   * @returns {Promise<Array<VehicleRecord>>} 记录列表
   */
  VehicleRecord.findByDateRange = async function (startDate, endDate, options = {}) {
    return await this.findAll({
      where: {
        created_at: {
          [sequelize.Sequelize.Op.gte]: startDate,
          [sequelize.Sequelize.Op.lte]: endDate,
        },
      },
      order: [['created_at', 'DESC']],
      ...options,
    });
  };

  /**
   * 获取车辆统计数据
   * 按记录类型统计数量
   *
   * @param {Object} [options] - 查询选项
   * @param {Date} [options.startDate] - 开始日期
   * @param {Date} [options.endDate] - 结束日期
   * @returns {Promise<Object>} 统计数据
   */
  VehicleRecord.getStatistics = async function (options = {}) {
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

    // 按记录类型统计
    const typeCounts = await this.findAll({
      where,
      attributes: [
        'record_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('weight')), 'total_weight'],
      ],
      group: ['record_type'],
      raw: true,
    });

    // 格式化统计结果
    const result = {
      total: 0,
      byType: {
        discharge: { count: 0, totalWeight: 0 },
        enter: { count: 0, totalWeight: 0 },
        exit: { count: 0, totalWeight: 0 },
        transport: { count: 0, totalWeight: 0 },
      },
      inFactory: 0,
    };

    // 填充统计
    typeCounts.forEach((item) => {
      const count = parseInt(item.count, 10);
      const weight = parseFloat(item.total_weight) || 0;
      result.byType[item.record_type] = {
        count,
        totalWeight: weight,
      };
      result.total += count;
    });

    // 统计在场车辆数
    result.inFactory = await this.count({
      where: {
        enter_time: {
          [sequelize.Sequelize.Op.ne]: null,
        },
        exit_time: null,
      },
    });

    return result;
  };

  /**
   * 获取每日车辆统计
   *
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Promise<Array>} 每日统计数据
   */
  VehicleRecord.getDailyStatistics = async function (startDate, endDate) {
    const results = await this.findAll({
      where: {
        created_at: {
          [sequelize.Sequelize.Op.gte]: startDate,
          [sequelize.Sequelize.Op.lte]: endDate,
        },
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('weight')), 'total_weight'],
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true,
    });

    return results.map((item) => ({
      date: item.date,
      count: parseInt(item.count, 10),
      totalWeight: parseFloat(item.total_weight) || 0,
    }));
  };

  /**
   * 创建进场记录
   *
   * @param {Object} data - 进场数据
   * @param {string} data.vehicle_no - 车牌号
   * @param {string} [data.vehicle_type] - 车辆类型
   * @param {string} [data.driver_name] - 驾驶员姓名
   * @param {string} [data.gate_no] - 门号
   * @param {Object} [options] - 创建选项
   * @returns {Promise<VehicleRecord>} 创建的记录
   */
  VehicleRecord.createEnterRecord = async function (data, options = {}) {
    return await this.create(
      {
        vehicle_no: data.vehicle_no,
        vehicle_type: data.vehicle_type,
        driver_name: data.driver_name,
        gate_no: data.gate_no,
        record_type: 'enter',
        enter_time: new Date(),
      },
      options
    );
  };

  /**
   * 创建出场记录
   *
   * @param {Object} data - 出场数据
   * @param {string} data.vehicle_no - 车牌号
   * @param {string} [data.gate_no] - 门号
   * @param {Object} [options] - 创建选项
   * @returns {Promise<VehicleRecord>} 创建的记录
   */
  VehicleRecord.createExitRecord = async function (data, options = {}) {
    return await this.create(
      {
        vehicle_no: data.vehicle_no,
        gate_no: data.gate_no,
        record_type: 'exit',
        exit_time: new Date(),
      },
      options
    );
  };

  /**
   * 创建卸料记录
   *
   * @param {Object} data - 卸料数据
   * @param {string} data.vehicle_no - 车牌号
   * @param {string} [data.vehicle_type] - 车辆类型
   * @param {string} [data.driver_name] - 驾驶员姓名
   * @param {string} [data.material_type] - 物料类型
   * @param {number} [data.weight] - 重量
   * @param {number} [data.area_id] - 区域ID
   * @param {Object} [options] - 创建选项
   * @returns {Promise<VehicleRecord>} 创建的记录
   */
  VehicleRecord.createDischargeRecord = async function (data, options = {}) {
    return await this.create(
      {
        vehicle_no: data.vehicle_no,
        vehicle_type: data.vehicle_type,
        driver_name: data.driver_name,
        material_type: data.material_type,
        weight: data.weight,
        area_id: data.area_id,
        record_type: 'discharge',
        enter_time: data.enter_time || new Date(),
      },
      options
    );
  };

  /**
   * 获取记录列表（分页）
   *
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.limit - 每页数量
   * @param {string} [params.record_type] - 记录类型筛选
   * @param {string} [params.vehicle_no] - 车牌号筛选
   * @param {number} [params.area_id] - 区域ID筛选
   * @param {Date} [params.start_date] - 开始日期
   * @param {Date} [params.end_date] - 结束日期
   * @returns {Promise<Object>} 分页结果
   */
  VehicleRecord.getRecordList = async function (params = {}) {
    const {
      page = 1,
      limit = 10,
      record_type,
      vehicle_no,
      area_id,
      start_date,
      end_date,
    } = params;

    // 构建 where 条件
    const where = {};

    if (record_type) {
      where.record_type = record_type;
    }

    if (vehicle_no) {
      where.vehicle_no = {
        [sequelize.Sequelize.Op.iLike]: `%${vehicle_no}%`,
      };
    }

    if (area_id) {
      where.area_id = area_id;
    }

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) {
        where.created_at[sequelize.Sequelize.Op.gte] = start_date;
      }
      if (end_date) {
        where.created_at[sequelize.Sequelize.Op.lte] = end_date;
      }
    }

    // 计算偏移量
    const offset = (page - 1) * limit;

    // 查询
    const { count, rows } = await this.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: sequelize.models.Area,
          as: 'area',
          required: false,
        },
      ],
    });

    return {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      list: rows,
    };
  };

  // =====================================================
  // 导出模型
  // =====================================================

  return VehicleRecord;
};
