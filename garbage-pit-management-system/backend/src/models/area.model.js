/**
 * 垃圾储坑智能化管控系统 - 区域模型
 *
 * 该文件定义了区域表(Area)的数据模型，用于管理垃圾储坑中的各类区域信息
 * 区域类型包括：堆料区(stacking)、卸料区(feeding)、转运区(transfer)等
 *
 * @module models/area
 * @author 华工三峰
 */

'use strict';

/**
 * 区域模型定义
 * @param {Sequelize} sequelize - Sequelize 实例
 * @param {DataTypes} DataTypes - Sequelize 数据类型
 * @returns {Model} Area 模型
 */
module.exports = (sequelize, DataTypes) => {
  /**
   * 区域模型定义
   * 
   * 区域是垃圾储坑管理的基本单元，用于划分不同的功能区域
   * 每个区域有明确的空间位置、尺寸信息和状态属性
   */
  const Area = sequelize.define(
    'Area',
    {
      /**
       * 区域ID - 主键
       * 使用 UUID 作为主键，确保全局唯一性
       */
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: '区域ID，UUID格式',
      },

      /**
       * 区域编号
       * 用于标识区域的唯一业务编号，如 A001, B002 等
       */
      area_no: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        comment: '区域编号，如A001、B002等',
        validate: {
          notEmpty: {
            msg: '区域编号不能为空',
          },
          len: {
            args: [1, 20],
            msg: '区域编号长度必须在1-20个字符之间',
          },
          // 验证区域编号格式：字母开头，后跟数字
          is: {
            args: /^[A-Za-z][A-Za-z0-9_-]*$/,
            msg: '区域编号格式无效，必须以字母开头，只能包含字母、数字、下划线和短横线',
          },
        },
      },

      /**
       * 区域名称
       * 区域的可读性名称，便于用户识别
       */
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '区域名称',
        validate: {
          notEmpty: {
            msg: '区域名称不能为空',
          },
          len: {
            args: [1, 50],
            msg: '区域名称长度必须在1-50个字符之间',
          },
        },
      },

      /**
       * 区域类型
       * stacking: 堆料区 - 用于堆放垃圾的区域
       * feeding: 卸料区 - 用于卸料的区域
       * transfer: 转运区 - 用于转运垃圾的区域
       */
      type: {
        type: DataTypes.ENUM('stacking', 'feeding', 'transfer'),
        allowNull: false,
        defaultValue: 'stacking',
        comment: '区域类型：stacking-堆料区, feeding-卸料区, transfer-转运区',
        validate: {
          isIn: {
            args: [['stacking', 'feeding', 'transfer']],
            msg: '区域类型必须是 stacking、feeding 或 transfer 之一',
          },
        },
      },

      /**
       * 区域中心X坐标
       * 用于在三维空间中定位区域位置（单位：米）
       */
      coordinate_x: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
        comment: '区域中心X坐标（米）',
        validate: {
          isDecimal: {
            msg: 'X坐标必须是有效的小数',
          },
          min: {
            args: [-9999.999],
            msg: 'X坐标不能小于-9999.999',
          },
          max: {
            args: [9999.999],
            msg: 'X坐标不能大于9999.999',
          },
        },
      },

      /**
       * 区域中心Y坐标
       * 用于在三维空间中定位区域位置（单位：米）
       */
      coordinate_y: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
        comment: '区域中心Y坐标（米）',
        validate: {
          isDecimal: {
            msg: 'Y坐标必须是有效的小数',
          },
          min: {
            args: [-9999.999],
            msg: 'Y坐标不能小于-9999.999',
          },
          max: {
            args: [9999.999],
            msg: 'Y坐标不能大于9999.999',
          },
        },
      },

      /**
       * 区域宽度
       * 区域的宽度尺寸（单位：米）
       */
      width: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
        defaultValue: 10.0,
        comment: '区域宽度（米）',
        validate: {
          isDecimal: {
            msg: '宽度必须是有效的小数',
          },
          min: {
            args: [0.1],
            msg: '宽度必须大于0.1米',
          },
          max: {
            args: [1000.0],
            msg: '宽度不能超过1000米',
          },
        },
      },

      /**
       * 区域长度/高度（Y轴方向）
       * 区域的长度尺寸（单位：米）
       */
      height: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
        defaultValue: 20.0,
        comment: '区域长度（米）',
        validate: {
          isDecimal: {
            msg: '长度必须是有效的小数',
          },
          min: {
            args: [0.1],
            msg: '长度必须大于0.1米',
          },
          max: {
            args: [1000.0],
            msg: '长度不能超过1000米',
          },
        },
      },

      /**
       * 区域深度
       * 区域的深度尺寸，即从地面到坑底的深度（单位：米）
       */
      depth: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
        defaultValue: 5.0,
        comment: '区域深度（米）',
        validate: {
          isDecimal: {
            msg: '深度必须是有效的小数',
          },
          min: {
            args: [0.1],
            msg: '深度必须大于0.1米',
          },
          max: {
            args: [50.0],
            msg: '深度不能超过50米',
          },
        },
      },

      /**
       * 当前堆料高度
       * 当前区域内垃圾堆料的高度（单位：米）
       * 该值会根据实际测量或估算动态更新
       */
      current_height: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
        defaultValue: 0.0,
        comment: '当前堆料高度（米）',
        validate: {
          isDecimal: {
            msg: '当前堆料高度必须是有效的小数',
          },
          min: {
            args: [0.0],
            msg: '当前堆料高度不能为负数',
          },
        },
      },

      /**
       * 最大堆料高度
       * 区域允许的最大堆料高度（单位：米）
       * 超过此高度将触发溢出告警
       */
      max_height: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
        defaultValue: 8.0,
        comment: '最大堆料高度（米）',
        validate: {
          isDecimal: {
            msg: '最大堆料高度必须是有效的小数',
          },
          min: {
            args: [0.1],
            msg: '最大堆料高度必须大于0.1米',
          },
          max: {
            args: [50.0],
            msg: '最大堆料高度不能超过50米',
          },
        },
      },

      /**
       * 覆盖状态
       * 表示区域是否有覆盖物（如雨棚、盖板等）
       * uncovered: 无覆盖
       * covered: 有覆盖
       * partial: 部分覆盖
       */
      cover_status: {
        type: DataTypes.ENUM('uncovered', 'covered', 'partial'),
        allowNull: false,
        defaultValue: 'uncovered',
        comment: '覆盖状态：uncovered-无覆盖, covered-有覆盖, partial-部分覆盖',
        validate: {
          isIn: {
            args: [['uncovered', 'covered', 'partial']],
            msg: '覆盖状态必须是 uncovered、covered 或 partial 之一',
          },
        },
      },

      /**
       * 排水状态
       * 表示区域的排水系统状态
       * normal: 正常
       * blocked: 堵塞
       * maintenance: 维护中
       */
      draining_status: {
        type: DataTypes.ENUM('normal', 'blocked', 'maintenance'),
        allowNull: false,
        defaultValue: 'normal',
        comment: '排水状态：normal-正常, blocked-堵塞, maintenance-维护中',
        validate: {
          isIn: {
            args: [['normal', 'blocked', 'maintenance']],
            msg: '排水状态必须是 normal、blocked 或 maintenance 之一',
          },
        },
      },

      /**
       * 清洁状态
       * 表示区域的清洁程度
       * clean: 清洁
       * dirty: 脏污
       * needs_cleaning: 需要清洁
       */
      cleaning_status: {
        type: DataTypes.ENUM('clean', 'dirty', 'needs_cleaning'),
        allowNull: false,
        defaultValue: 'clean',
        comment: '清洁状态：clean-清洁, dirty-脏污, needs_cleaning-需要清洁',
        validate: {
          isIn: {
            args: [['clean', 'dirty', 'needs_cleaning']],
            msg: '清洁状态必须是 clean、dirty 或 needs_cleaning 之一',
          },
        },
      },

      /**
       * 区域状态
       * 表示区域的可用状态
       * active: 激活中，正常使用
       * inactive: 未激活，暂停使用
       * maintenance: 维护中
       * full: 已满，无法继续堆料
       */
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'maintenance', 'full'),
        allowNull: false,
        defaultValue: 'active',
        comment: '区域状态：active-激活中, inactive-未激活, maintenance-维护中, full-已满',
        validate: {
          isIn: {
            args: [['active', 'inactive', 'maintenance', 'full']],
            msg: '区域状态必须是 active、inactive、maintenance 或 full 之一',
          },
        },
      },

      /**
       * 当前容量百分比
       * 当前堆料高度与最大高度的百分比
       * 计算公式：(current_height / max_height) * 100
       */
      capacity_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.0,
        comment: '当前容量百分比（0-100）',
        validate: {
          isDecimal: {
            msg: '容量百分比必须是有效的小数',
          },
          min: {
            args: [0.0],
            msg: '容量百分比不能小于0',
          },
          max: {
            args: [100.0],
            msg: '容量百分比不能超过100',
          },
        },
      },

      /**
       * 预估垃圾量
       * 区域内垃圾的预估体积（单位：立方米）
       * 根据当前高度和区域尺寸计算
       */
      estimated_volume: {
        type: DataTypes.DECIMAL(15, 3),
        allowNull: true,
        defaultValue: 0.0,
        comment: '预估垃圾量（立方米）',
        validate: {
          isDecimal: {
            msg: '预估垃圾量必须是有效的小数',
          },
          min: {
            args: [0.0],
            msg: '预估垃圾量不能为负数',
          },
        },
      },

      /**
       * 预估重量
       * 区域内垃圾的预估重量（单位：吨）
       * 根据预估体积和垃圾密度计算
       */
      estimated_weight: {
        type: DataTypes.DECIMAL(15, 3),
        allowNull: true,
        defaultValue: 0.0,
        comment: '预估重量（吨）',
        validate: {
          isDecimal: {
            msg: '预估重量必须是有效的小数',
          },
          min: {
            args: [0.0],
            msg: '预估重量不能为负数',
          },
        },
      },

      /**
       * 平均温度
       * 区域内垃圾堆的平均温度（单位：摄氏度）
       * 用于发酵监控
       */
      avg_temperature: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
        comment: '平均温度（摄氏度）',
        validate: {
          isDecimal: {
            msg: '温度必须是有效的小数',
          },
          min: {
            args: [-50.0],
            msg: '温度不能低于-50摄氏度',
          },
          max: {
            args: [150.0],
            msg: '温度不能超过150摄氏度',
          },
        },
      },

      /**
       * 平均湿度
       * 区域内垃圾堆的平均湿度（百分比：0-100）
       */
      avg_humidity: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: '平均湿度（百分比）',
        validate: {
          isDecimal: {
            msg: '湿度必须是有效的小数',
          },
          min: {
            args: [0.0],
            msg: '湿度不能小于0%',
          },
          max: {
            args: [100.0],
            msg: '湿度不能超过100%',
          },
        },
      },

      /**
       * 甲烷浓度
       * 区域内甲烷气体浓度（单位：百分比）
       * 用于安全监控，过高可能引发爆炸风险
       */
      methane_level: {
        type: DataTypes.DECIMAL(6, 3),
        allowNull: true,
        comment: '甲烷浓度（百分比）',
        validate: {
          isDecimal: {
            msg: '甲烷浓度必须是有效的小数',
          },
          min: {
            args: [0.0],
            msg: '甲烷浓度不能小于0%',
          },
          max: {
            args: [100.0],
            msg: '甲烷浓度不能超过100%',
          },
        },
      },

      /**
       * 堆料天数
       * 当前垃圾堆料的天数
       * 用于发酵周期管理
       */
      stacking_days: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: '堆料天数',
        validate: {
          isInt: {
            msg: '堆料天数必须是整数',
          },
          min: {
            args: [0],
            msg: '堆料天数不能为负数',
          },
          max: {
            args: 365,
            msg: '堆料天数不能超过365天',
          },
        },
      },

      /**
       * 最后进料时间
       * 最后一次向该区域添加垃圾的时间
       */
      last_feeding_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '最后进料时间',
      },

      /**
       * 最后出料时间
       * 最后一次从该区域取出垃圾的时间
       */
      last_discharge_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '最后出料时间',
      },

      /**
       * 负责人ID
       * 该区域负责人的用户ID
       */
      manager_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: '负责人ID',
      },

      /**
       * 备注
       * 区域的备注说明信息
       */
      remark: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '备注信息',
      },

      /**
       * 排序号
       * 用于区域列表显示的排序
       */
      sort_order: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: '排序号',
        validate: {
          isInt: {
            msg: '排序号必须是整数',
          },
          min: {
            args: [0],
            msg: '排序号不能为负数',
          },
        },
      },

      /**
       * 是否启用
       * 用于软删除和启用/禁用控制
       */
      is_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '是否启用',
      },

      /**
       * 创建人ID
       * 记录创建该区域的用户ID
       */
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: '创建人ID',
      },

      /**
       * 更新人ID
       * 记录最后更新该区域的用户ID
       */
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: '更新人ID',
      },
    },
    {
      // 表名配置
      tableName: 'areas',
      
      // 索引配置
      indexes: [
        {
          unique: true,
          fields: ['area_no'],
          name: 'idx_areas_area_no',
        },
        {
          fields: ['type'],
          name: 'idx_areas_type',
        },
        {
          fields: ['status'],
          name: 'idx_areas_status',
        },
        {
          fields: ['is_enabled'],
          name: 'idx_areas_is_enabled',
        },
        {
          fields: ['manager_id'],
          name: 'idx_areas_manager_id',
        },
        {
          fields: ['coordinate_x', 'coordinate_y'],
          name: 'idx_areas_coordinates',
        },
      ],
      
      // 钩子函数配置
      hooks: {
        /**
         * 创建前钩子
         * 在创建区域记录之前执行
         */
        beforeCreate: async (area, options) => {
          // 自动计算容量百分比
          if (area.current_height !== null && area.current_height !== undefined && 
              area.max_height !== null && area.max_height !== undefined) {
            area.capacity_percentage = (area.current_height / area.max_height) * 100;
          }
          
          // 自动计算预估体积
          if (area.width && area.height && area.current_height) {
            area.estimated_volume = area.width * area.height * area.current_height;
          }
          
          // 根据容量百分比自动更新状态
          if (area.capacity_percentage >= 95) {
            area.status = 'full';
          }
        },
        
        /**
         * 更新前钩子
         * 在更新区域记录之前执行
         */
        beforeUpdate: async (area, options) => {
          // 自动计算容量百分比
          if (area.changed('current_height') || area.changed('max_height')) {
            if (area.current_height !== null && area.current_height !== undefined && 
                area.max_height !== null && area.max_height !== undefined) {
              area.capacity_percentage = (area.current_height / area.max_height) * 100;
            }
          }
          
          // 自动计算预估体积
          if (area.changed('width') || area.changed('height') || area.changed('current_height')) {
            if (area.width && area.height && area.current_height) {
              area.estimated_volume = area.width * area.height * area.current_height;
            }
          }
          
          // 根据容量百分比自动更新状态
          if (area.changed('capacity_percentage')) {
            if (area.capacity_percentage >= 95 && area.status === 'active') {
              area.status = 'full';
            } else if (area.capacity_percentage < 95 && area.status === 'full') {
              area.status = 'active';
            }
          }
        },
      },
      
      // 模型方法配置
      scopes: {
        /**
         * 仅查询启用的区域
         */
        enabled: {
          where: {
            is_enabled: true,
          },
        },
        
        /**
         * 查询激活状态的区域
         */
        active: {
          where: {
            status: 'active',
            is_enabled: true,
          },
        },
        
        /**
         * 查询堆料区
         */
        stackingAreas: {
          where: {
            type: 'stacking',
          },
        },
        
        /**
         * 查询卸料区
         */
        feedingAreas: {
          where: {
            type: 'feeding',
          },
        },
        
        /**
         * 查询转运区
         */
        transferAreas: {
          where: {
            type: 'transfer',
          },
        },
        
        /**
         * 查询已满的区域
         */
        fullAreas: {
          where: {
            status: 'full',
          },
        },
        
        /**
         * 查询需要清洁的区域
         */
        needsCleaning: {
          where: {
            cleaning_status: 'needs_cleaning',
          },
        },
        
        /**
         * 查询排水堵塞的区域
         */
        blockedDraining: {
          where: {
            draining_status: 'blocked',
          },
        },
      },
    }
  );

  // =====================================================
  // 实例方法
  // =====================================================

  /**
   * 计算区域体积
   * 根据当前堆料高度计算体积
   * @returns {number} 体积（立方米）
   */
  Area.prototype.calculateVolume = function () {
    const width = this.width || 0;
    const height = this.height || 0;
    const currentHeight = this.current_height || 0;
    return width * height * currentHeight;
  };

  /**
   * 计算区域总容量
   * 根据最大高度计算总容量
   * @returns {number} 总容量（立方米）
   */
  Area.prototype.calculateTotalCapacity = function () {
    const width = this.width || 0;
    const height = this.height || 0;
    const maxHeight = this.max_height || 0;
    return width * height * maxHeight;
  };

  /**
   * 计算剩余容量
   * 计算区域还可以堆放多少垃圾
   * @returns {number} 剩余容量（立方米）
   */
  Area.prototype.calculateRemainingCapacity = function () {
    const totalCapacity = this.calculateTotalCapacity();
    const currentVolume = this.calculateVolume();
    return totalCapacity - currentVolume;
  };

  /**
   * 更新堆料高度
   * 更新当前堆料高度，并自动计算相关字段
   * @param {number} newHeight - 新的堆料高度（米）
   * @param {Object} options - 更新选项
   * @returns {Promise<Area>} 更新后的区域实例
   */
  Area.prototype.updateStackingHeight = async function (newHeight, options = {}) {
    // 验证新高度
    if (newHeight < 0) {
      throw new Error('堆料高度不能为负数');
    }
    if (newHeight > this.max_height) {
      console.warn(`警告：新高度 ${newHeight} 超过最大高度 ${this.max_height}`);
    }

    // 更新高度
    this.current_height = newHeight;

    // 自动计算容量百分比
    this.capacity_percentage = (newHeight / this.max_height) * 100;

    // 自动计算预估体积
    this.estimated_volume = this.calculateVolume();

    // 根据容量百分比更新状态
    if (this.capacity_percentage >= 95) {
      this.status = 'full';
    } else if (this.status === 'full' && this.capacity_percentage < 95) {
      this.status = 'active';
    }

    // 保存更新
    return await this.save(options);
  };

  /**
   * 增加堆料高度
   * 在当前高度基础上增加指定高度
   * @param {number} delta - 增加的高度（米）
   * @param {Object} options - 更新选项
   * @returns {Promise<Area>} 更新后的区域实例
   */
  Area.prototype.increaseHeight = async function (delta, options = {}) {
    if (delta <= 0) {
      throw new Error('增加的高度必须大于0');
    }
    const newHeight = (this.current_height || 0) + delta;
    return await this.updateStackingHeight(newHeight, options);
  };

  /**
   * 减少堆料高度
   * 在当前高度基础上减少指定高度
   * @param {number} delta - 减少的高度（米）
   * @param {Object} options - 更新选项
   * @returns {Promise<Area>} 更新后的区域实例
   */
  Area.prototype.decreaseHeight = async function (delta, options = {}) {
    if (delta <= 0) {
      throw new Error('减少的高度必须大于0');
    }
    const newHeight = Math.max(0, (this.current_height || 0) - delta);
    return await this.updateStackingHeight(newHeight, options);
  };

  /**
   * 检查区域是否已满
   * @returns {boolean} 是否已满
   */
  Area.prototype.isFull = function () {
    return this.status === 'full' || this.capacity_percentage >= 95;
  };

  /**
   * 检查区域是否可用
   * 检查区域是否可以接收新的垃圾
   * @returns {boolean} 是否可用
   */
  Area.prototype.isAvailable = function () {
    return this.is_enabled && this.status === 'active' && !this.isFull();
  };

  /**
   * 检查区域是否需要维护
   * @returns {boolean} 是否需要维护
   */
  Area.prototype.needsMaintenance = function () {
    return (
      this.status === 'maintenance' ||
      this.draining_status === 'blocked' ||
      this.draining_status === 'maintenance'
    );
  };

  /**
   * 更新发酵数据
   * 更新区域的发酵监测数据
   * @param {Object} data - 发酵数据
   * @param {number} data.temperature - 温度
   * @param {number} data.humidity - 湿度
   * @param {number} data.methane - 甲烷浓度
   * @param {Object} options - 更新选项
   * @returns {Promise<Area>} 更新后的区域实例
   */
  Area.prototype.updateFermentationData = async function (data, options = {}) {
    if (data.temperature !== undefined) {
      this.avg_temperature = data.temperature;
    }
    if (data.humidity !== undefined) {
      this.avg_humidity = data.humidity;
    }
    if (data.methane !== undefined) {
      this.methane_level = data.methane;
    }
    return await this.save(options);
  };

  /**
   * 记录进料操作
   * 更新最后进料时间和堆料天数
   * @param {Object} options - 更新选项
   * @returns {Promise<Area>} 更新后的区域实例
   */
  Area.prototype.recordFeeding = async function (options = {}) {
    this.last_feeding_time = new Date();
    
    // 如果是首次进料，重置堆料天数
    if (!this.last_discharge_time) {
      this.stacking_days = 0;
    }
    
    return await this.save(options);
  };

  /**
   * 记录出料操作
   * 更新最后出料时间
   * @param {Object} options - 更新选项
   * @returns {Promise<Area>} 更新后的区域实例
   */
  Area.prototype.recordDischarge = async function (options = {}) {
    this.last_discharge_time = new Date();
    return await this.save(options);
  };

  /**
   * 获取区域摘要信息
   * 返回区域的关键信息摘要
   * @returns {Object} 区域摘要
   */
  Area.prototype.getSummary = function () {
    return {
      id: this.id,
      area_no: this.area_no,
      name: this.name,
      type: this.type,
      status: this.status,
      capacity_percentage: this.capacity_percentage,
      current_height: this.current_height,
      max_height: this.max_height,
      estimated_volume: this.estimated_volume,
      is_enabled: this.is_enabled,
      is_full: this.isFull(),
      is_available: this.isAvailable(),
    };
  };

  /**
   * 转换为JSON格式
   * 重写默认的toJSON方法，添加计算字段
   * @returns {Object} JSON对象
   */
  Area.prototype.toJSON = function () {
    const values = { ...this.get() };
    
    // 添加计算字段
    values.remaining_capacity = this.calculateRemainingCapacity();
    values.total_capacity = this.calculateTotalCapacity();
    values.is_full = this.isFull();
    values.is_available = this.isAvailable();
    
    return values;
  };

  // =====================================================
  // 类方法（静态方法）
  // =====================================================

  /**
   * 查找所有堆料区
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Area>>} 堆料区列表
   */
  Area.findAllStackingAreas = async function (options = {}) {
    return await this.scope('stackingAreas').findAll({
      ...options,
      where: {
        ...(options.where || {}),
        is_enabled: true,
      },
      order: [['sort_order', 'ASC'], ['created_at', 'ASC']],
    });
  };

  /**
   * 查找所有卸料区
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Area>>} 卸料区列表
   */
  Area.findAllFeedingAreas = async function (options = {}) {
    return await this.scope('feedingAreas').findAll({
      ...options,
      where: {
        ...(options.where || {}),
        is_enabled: true,
      },
      order: [['sort_order', 'ASC'], ['created_at', 'ASC']],
    });
  };

  /**
   * 查找所有转运区
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Area>>} 转运区列表
   */
  Area.findAllTransferAreas = async function (options = {}) {
    return await this.scope('transferAreas').findAll({
      ...options,
      where: {
        ...(options.where || {}),
        is_enabled: true,
      },
      order: [['sort_order', 'ASC'], ['created_at', 'ASC']],
    });
  };

  /**
   * 查找可用的堆料区
   * 查找所有可用（未满且状态正常）的堆料区
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Area>>} 可用的堆料区列表
   */
  Area.findAvailableStackingAreas = async function (options = {}) {
    return await this.findAll({
      ...options,
      where: {
        type: 'stacking',
        status: 'active',
        is_enabled: true,
        capacity_percentage: {
          [sequelize.Sequelize.Op.lt]: 95,
        },
      },
      order: [
        ['capacity_percentage', 'ASC'], // 优先选择容量较低的区域
        ['sort_order', 'ASC'],
      ],
    });
  };

  /**
   * 根据区域编号查找
   * @param {string} areaNo - 区域编号
   * @param {Object} options - 查询选项
   * @returns {Promise<Area|null>} 区域实例
   */
  Area.findByAreaNo = async function (areaNo, options = {}) {
    return await this.findOne({
      ...options,
      where: {
        area_no: areaNo,
      },
    });
  };

  /**
   * 查找已满的区域
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Area>>} 已满的区域列表
   */
  Area.findFullAreas = async function (options = {}) {
    return await this.scope('fullAreas').findAll({
      ...options,
      where: {
        ...(options.where || {}),
        is_enabled: true,
      },
    });
  };

  /**
   * 查找需要清洁的区域
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Area>>} 需要清洁的区域列表
   */
  Area.findAreasNeedingCleaning = async function (options = {}) {
    return await this.scope('needsCleaning').findAll(options);
  };

  /**
   * 查找排水异常的区域
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Area>>} 排水异常的区域列表
   */
  Area.findAreasWithDrainingIssues = async function (options = {}) {
    return await this.scope('blockedDraining').findAll(options);
  };

  /**
   * 获取区域统计信息
   * 统计各类区域的数量和容量信息
   * @returns {Promise<Object>} 统计信息
   */
  Area.getStatistics = async function () {
    const { Op } = sequelize.Sequelize;

    // 总体统计
    const totalCount = await this.count();
    const enabledCount = await this.count({ where: { is_enabled: true } });

    // 按类型统计
    const stackingCount = await this.count({ where: { type: 'stacking' } });
    const feedingCount = await this.count({ where: { type: 'feeding' } });
    const transferCount = await this.count({ where: { type: 'transfer' } });

    // 按状态统计
    const activeCount = await this.count({ where: { status: 'active' } });
    const inactiveCount = await this.count({ where: { status: 'inactive' } });
    const maintenanceCount = await this.count({ where: { status: 'maintenance' } });
    const fullCount = await this.count({ where: { status: 'full' } });

    // 总容量和已用容量
    const areas = await this.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('estimated_volume')), 'totalVolume'],
        [sequelize.fn('SUM', sequelize.col('estimated_weight')), 'totalWeight'],
      ],
    });

    const statistics = {
      total: totalCount,
      enabled: enabledCount,
      disabled: totalCount - enabledCount,
      byType: {
        stacking: stackingCount,
        feeding: feedingCount,
        transfer: transferCount,
      },
      byStatus: {
        active: activeCount,
        inactive: inactiveCount,
        maintenance: maintenanceCount,
        full: fullCount,
      },
      volume: {
        total: areas[0]?.dataValues?.totalVolume || 0,
        weight: areas[0]?.dataValues?.totalWeight || 0,
      },
    };

    return statistics;
  };

  /**
   * 批量更新区域状态
   * @param {Array<string>} areaIds - 区域ID列表
   * @param {string} status - 新状态
   * @param {Object} options - 更新选项
   * @returns {Promise<number>} 更新的记录数
   */
  Area.batchUpdateStatus = async function (areaIds, status, options = {}) {
    return await this.update(
      { status },
      {
        where: {
          id: {
            [sequelize.Sequelize.Op.in]: areaIds,
          },
        },
        ...options,
      }
    );
  };

  /**
   * 查找指定坐标附近的区域
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} radius - 搜索半径（米）
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Area>>} 附近的区域列表
   */
  Area.findNearbyAreas = async function (x, y, radius = 10, options = {}) {
    const { Op } = sequelize.Sequelize;

    return await this.findAll({
      ...options,
      where: {
        coordinate_x: {
          [Op.between]: [x - radius, x + radius],
        },
        coordinate_y: {
          [Op.between]: [y - radius, y + radius],
        },
        is_enabled: true,
      },
    });
  };

  /**
   * 检查区域编号是否已存在
   * @param {string} areaNo - 区域编号
   * @param {string} excludeId - 排除的区域ID（用于更新时排除自身）
   * @returns {Promise<boolean>} 是否存在
   */
  Area.isAreaNoExists = async function (areaNo, excludeId = null) {
    const where = { area_no: areaNo };
    if (excludeId) {
      where.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count > 0;
  };

  // 返回模型
  return Area;
};
