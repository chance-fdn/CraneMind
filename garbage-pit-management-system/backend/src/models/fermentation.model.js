/**
 * 垃圾储坑智能化管控系统 - 发酵数据模型
 *
 * 该文件定义了发酵数据表(fermentation_data)的数据模型，用于管理垃圾储坑发酵过程中的监测数据
 * 发酵数据包括温度、湿度、甲烷浓度、PH值、氧气浓度等关键指标
 *
 * 功能特点：
 * 1. 发酵环境参数记录（温度、湿度、甲烷浓度等）
 * 2. 与区域关联，支持按区域查询发酵数据
 * 3. 支持时间范围查询，便于分析发酵趋势
 * 4. 提供统计分析功能，辅助AI发酵预测
 *
 * @module models/fermentation
 * @author 华工三峰
 */

'use strict';

/**
 * 导出发酵数据模型定义
 *
 * @param {Sequelize} sequelize - Sequelize 实例
 * @param {DataTypes} DataTypes - Sequelize 数据类型
 * @returns {Model} FermentationData 模型
 */
module.exports = (sequelize, DataTypes) => {
  // =====================================================
  // 发酵数据模型定义
  // =====================================================

  /**
   * 发酵数据模型
   *
   * 对应数据库表: fermentation_data
   * 包含发酵监测的各项指标数据，用于发酵状态分析和AI预测
   */
  const FermentationData = sequelize.define(
    'FermentationData',
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
      // 关联字段
      // =====================================================

      /**
       * 区域ID（外键）
       * 关联采集发酵数据的区域
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
      // 发酵参数字段
      // =====================================================

      /**
       * 温度
       * 垃圾堆内部的温度（单位：摄氏度）
       * 正常范围：30-70℃，过高可能导致自燃风险
       */
      temperature: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: '温度（℃），垃圾堆内部温度',
        validate: {
          isDecimal: {
            msg: '温度必须为有效的小数',
          },
          min: {
            args: [-50.0],
            msg: '温度不能低于-50℃',
          },
          max: {
            args: [150.0],
            msg: '温度不能超过150℃',
          },
        },
      },

      /**
       * 湿度
       * 垃圾堆的含水率（单位：百分比）
       * 正常范围：40-60%，影响发酵效率
       */
      humidity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: '湿度（%），垃圾堆含水率',
        validate: {
          isDecimal: {
            msg: '湿度必须为有效的小数',
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
       * 垃圾堆中甲烷气体的浓度（单位：百分比）
       * 甲烷是厌氧发酵的主要产物，浓度过高有爆炸风险
       */
      methane_concentration: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: '甲烷浓度（%），安全监测指标',
        validate: {
          isDecimal: {
            msg: '甲烷浓度必须为有效的小数',
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
       * PH值
       * 垃圾堆渗滤液的酸碱度
       * 正常范围：6.5-8.5，影响微生物活性
       */
      ph_value: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'PH值，酸碱度指标',
        validate: {
          isDecimal: {
            msg: 'PH值必须为有效的小数',
          },
          min: {
            args: [0.0],
            msg: 'PH值不能小于0',
          },
          max: {
            args: [14.0],
            msg: 'PH值不能超过14',
          },
        },
      },

      /**
       * 含水率
       * 垃圾堆的整体含水率（单位：百分比）
       * 用于评估垃圾的干湿程度，影响发酵效果
       */
      moisture_content: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: '含水率（%），垃圾整体含水率',
        validate: {
          isDecimal: {
            msg: '含水率必须为有效的小数',
          },
          min: {
            args: [0.0],
            msg: '含水率不能小于0%',
          },
          max: {
            args: [100.0],
            msg: '含水率不能超过100%',
          },
        },
      },

      /**
       * 有机物含量
       * 垃圾中有机物质的含量（单位：百分比）
       * 有机物是发酵的主要原料，含量影响产气量
       */
      organic_matter: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: '有机物含量（%），影响发酵效率',
        validate: {
          isDecimal: {
            msg: '有机物含量必须为有效的小数',
          },
          min: {
            args: [0.0],
            msg: '有机物含量不能小于0%',
          },
          max: {
            args: [100.0],
            msg: '有机物含量不能超过100%',
          },
        },
      },

      /**
       * 氧气浓度
       * 垃圾堆中的氧气浓度（单位：百分比）
       * 用于判断好氧/厌氧发酵状态
       */
      oxygen_concentration: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: '氧气浓度（%），判断发酵类型',
        validate: {
          isDecimal: {
            msg: '氧气浓度必须为有效的小数',
          },
          min: {
            args: [0.0],
            msg: '氧气浓度不能小于0%',
          },
          max: {
            args: [100.0],
            msg: '氧气浓度不能超过100%',
          },
        },
      },

      // =====================================================
      // 时间戳字段
      // =====================================================

      /**
       * 记录时间
       * 数据采集的时间点
       */
      record_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '数据记录时间',
        validate: {
          isDate: {
            msg: '记录时间格式不正确',
          },
        },
      },

      /**
       * 创建时间
       * 记录入库的时间，自动生成
       */
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '记录创建时间',
      },

      /**
       * 更新时间
       * 记录最后更新的时间
       */
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '记录更新时间',
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
      tableName: 'fermentation_data',

      /**
       * 时间戳配置
       * 启用 createdAt 和 updatedAt
       */
      timestamps: true,

      /**
       * 时间戳字段名称配置
       */
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      /**
       * 索引配置
       * 定义数据库索引以优化查询性能
       */
      indexes: [
        // 区域ID索引（用于按区域查询发酵数据）
        {
          fields: ['area_id'],
          name: 'idx_fermentation_data_area_id',
        },
        // 记录时间索引（用于按时间排序和范围查询）
        {
          fields: ['record_time'],
          name: 'idx_fermentation_data_record_time',
        },
        // 创建时间索引
        {
          fields: ['created_at'],
          name: 'idx_fermentation_data_created_at',
        },
        // 复合索引：区域 + 记录时间（用于查询特定区域的时间序列数据）
        {
          fields: ['area_id', 'record_time'],
          name: 'idx_fermentation_data_area_time',
        },
      ],

      /**
       * 模型名称配置
       */
      modelName: 'FermentationData',

      /**
       * 注释配置
       */
      comment: '发酵数据表，用于管理垃圾储坑发酵监测数据',

      /**
       * 默认作用域配置
       */
      defaultScope: {
        // 默认按记录时间倒序排列
        order: [['record_time', 'DESC']],
      },

      /**
       * 作用域配置
       * 定义常用的查询模板
       */
      scopes: {
        // 按区域查询
        byArea: (areaId) => ({
          where: {
            area_id: areaId,
          },
        }),
        // 最近24小时的数据
        last24Hours: {
          where: {
            record_time: {
              [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        },
        // 最近7天的数据
        last7Days: {
          where: {
            record_time: {
              [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
        // 最近30天的数据
        last30Days: {
          where: {
            record_time: {
              [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        // 高温记录（温度超过55℃）
        highTemperature: {
          where: {
            temperature: {
              [sequelize.Sequelize.Op.gt]: 55.0,
            },
          },
        },
        // 高甲烷浓度（甲烷浓度超过15%）
        highMethane: {
          where: {
            methane_concentration: {
              [sequelize.Sequelize.Op.gt]: 15.0,
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
   * 检查温度是否异常
   * 温度超过60℃视为异常
   *
   * @returns {boolean} 是否温度异常
   */
  FermentationData.prototype.isTemperatureAbnormal = function () {
    return this.temperature !== null && this.temperature > 60.0;
  };

  /**
   * 检查湿度是否在正常范围
   * 正常湿度范围：40%-60%
   *
   * @returns {boolean} 是否湿度正常
   */
  FermentationData.prototype.isHumidityNormal = function () {
    if (this.humidity === null) return true;
    return this.humidity >= 40.0 && this.humidity <= 60.0;
  };

  /**
   * 检查甲烷浓度是否危险
   * 甲烷浓度超过25%视为危险
   *
   * @returns {boolean} 是否甲烷浓度危险
   */
  FermentationData.prototype.isMethaneDangerous = function () {
    return this.methane_concentration !== null && this.methane_concentration > 25.0;
  };

  /**
   * 检查PH值是否正常
   * 正常PH范围：6.5-8.5
   *
   * @returns {boolean} 是否PH正常
   */
  FermentationData.prototype.isPHNormal = function () {
    if (this.ph_value === null) return true;
    return this.ph_value >= 6.5 && this.ph_value <= 8.5;
  };

  /**
   * 获取发酵状态评估
   * 根据各项指标综合评估发酵状态
   *
   * @returns {Object} 发酵状态评估结果
   */
  FermentationData.prototype.evaluateFermentationStatus = function () {
    const status = {
      overall: 'normal', // normal, warning, danger
      warnings: [],
      dangers: [],
    };

    // 检查温度
    if (this.temperature !== null) {
      if (this.temperature > 70.0) {
        status.overall = 'danger';
        status.dangers.push(`温度过高(${this.temperature}℃)，存在自燃风险`);
      } else if (this.temperature > 60.0) {
        if (status.overall !== 'danger') status.overall = 'warning';
        status.warnings.push(`温度偏高(${this.temperature}℃)`);
      }
    }

    // 检查甲烷浓度
    if (this.methane_concentration !== null) {
      if (this.methane_concentration > 25.0) {
        status.overall = 'danger';
        status.dangers.push(`甲烷浓度过高(${this.methane_concentration}%)，存在爆炸风险`);
      } else if (this.methane_concentration > 15.0) {
        if (status.overall !== 'danger') status.overall = 'warning';
        status.warnings.push(`甲烷浓度偏高(${this.methane_concentration}%)`);
      }
    }

    // 检查PH值
    if (this.ph_value !== null) {
      if (this.ph_value < 5.5 || this.ph_value > 9.5) {
        if (status.overall !== 'danger') status.overall = 'warning';
        status.warnings.push(`PH值异常(${this.ph_value})`);
      }
    }

    // 检查湿度
    if (this.humidity !== null) {
      if (this.humidity < 30.0) {
        status.warnings.push(`湿度过低(${this.humidity}%)，影响发酵效率`);
      } else if (this.humidity > 70.0) {
        status.warnings.push(`湿度过高(${this.humidity}%)，可能产生过多渗滤液`);
      }
    }

    return status;
  };

  /**
   * 获取数据摘要
   * 返回关键数据的摘要信息
   *
   * @returns {Object} 数据摘要
   */
  FermentationData.prototype.getSummary = function () {
    return {
      id: this.id,
      area_id: this.area_id,
      temperature: this.temperature,
      humidity: this.humidity,
      methane_concentration: this.methane_concentration,
      ph_value: this.ph_value,
      record_time: this.record_time,
    };
  };

  /**
   * 转换为JSON格式
   * 重写默认的toJSON方法
   *
   * @returns {Object} JSON对象
   */
  FermentationData.prototype.toJSON = function () {
    const values = { ...this.get() };
    // 添加发酵状态评估
    values.fermentation_status = this.evaluateFermentationStatus();
    return values;
  };

  // =====================================================
  // 类方法（静态方法）
  // =====================================================

  /**
   * 按区域查询发酵数据
   *
   * @param {number} areaId - 区域ID
   * @param {Object} [options] - 查询选项
   * @param {number} [options.limit] - 返回数量限制
   * @returns {Promise<Array<FermentationData>>} 发酵数据列表
   *
   * @example
   * const data = await FermentationData.findByArea(1);
   */
  FermentationData.findByArea = async function (areaId, options = {}) {
    return await this.findAll({
      where: {
        area_id: areaId,
      },
      order: [['record_time', 'DESC']],
      limit: options.limit,
    });
  };

  /**
   * 按时间范围查询发酵数据
   *
   * @param {Date} startTime - 开始时间
   * @param {Date} endTime - 结束时间
   * @param {number} [areaId] - 区域ID（可选）
   * @returns {Promise<Array<FermentationData>>} 发酵数据列表
   *
   * @example
   * const data = await FermentationData.findByTimeRange(
   *   new Date('2024-01-01'),
   *   new Date('2024-01-31'),
   *   1
   * );
   */
  FermentationData.findByTimeRange = async function (startTime, endTime, areaId = null) {
    const where = {
      record_time: {
        [sequelize.Sequelize.Op.between]: [startTime, endTime],
      },
    };

    if (areaId) {
      where.area_id = areaId;
    }

    return await this.findAll({
      where,
      order: [['record_time', 'ASC']],
    });
  };

  /**
   * 获取最新的发酵数据
   *
   * @param {number} [areaId] - 区域ID（可选）
   * @returns {Promise<FermentationData|null>} 最新的发酵数据
   *
   * @example
   * const latest = await FermentationData.getLatest(1);
   */
  FermentationData.getLatest = async function (areaId = null) {
    const where = {};
    if (areaId) {
      where.area_id = areaId;
    }

    return await this.findOne({
      where,
      order: [['record_time', 'DESC']],
    });
  };

  /**
   * 获取发酵数据统计数据
   * 计算指定时间范围内的平均值、最大值、最小值
   *
   * @param {Date} startTime - 开始时间
   * @param {Date} endTime - 结束时间
   * @param {number} [areaId] - 区域ID（可选）
   * @returns {Promise<Object>} 统计数据
   *
   * @example
   * const stats = await FermentationData.getStatistics(
   *   new Date('2024-01-01'),
   *   new Date('2024-01-31')
   * );
   */
  FermentationData.getStatistics = async function (startTime, endTime, areaId = null) {
    const where = {
      record_time: {
        [sequelize.Sequelize.Op.between]: [startTime, endTime],
      },
    };

    if (areaId) {
      where.area_id = areaId;
    }

    const result = await this.findOne({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_count'],
        [sequelize.fn('AVG', sequelize.col('temperature')), 'avg_temperature'],
        [sequelize.fn('MAX', sequelize.col('temperature')), 'max_temperature'],
        [sequelize.fn('MIN', sequelize.col('temperature')), 'min_temperature'],
        [sequelize.fn('AVG', sequelize.col('humidity')), 'avg_humidity'],
        [sequelize.fn('AVG', sequelize.col('methane_concentration')), 'avg_methane'],
        [sequelize.fn('MAX', sequelize.col('methane_concentration')), 'max_methane'],
        [sequelize.fn('AVG', sequelize.col('ph_value')), 'avg_ph'],
        [sequelize.fn('AVG', sequelize.col('moisture_content')), 'avg_moisture'],
        [sequelize.fn('AVG', sequelize.col('organic_matter')), 'avg_organic'],
      ],
      raw: true,
    });

    return {
      total_count: parseInt(result?.total_count || 0, 10),
      temperature: {
        avg: result?.avg_temperature ? parseFloat(result.avg_temperature) : null,
        max: result?.max_temperature ? parseFloat(result.max_temperature) : null,
        min: result?.min_temperature ? parseFloat(result.min_temperature) : null,
      },
      humidity: {
        avg: result?.avg_humidity ? parseFloat(result.avg_humidity) : null,
      },
      methane_concentration: {
        avg: result?.avg_methane ? parseFloat(result.avg_methane) : null,
        max: result?.max_methane ? parseFloat(result.max_methane) : null,
      },
      ph_value: {
        avg: result?.avg_ph ? parseFloat(result.avg_ph) : null,
      },
      moisture_content: {
        avg: result?.avg_moisture ? parseFloat(result.avg_moisture) : null,
      },
      organic_matter: {
        avg: result?.avg_organic ? parseFloat(result.avg_organic) : null,
      },
    };
  };

  /**
   * 获取每日平均发酵数据
   * 按天聚合发酵数据
   *
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @param {number} [areaId] - 区域ID（可选）
   * @returns {Promise<Array>} 每日平均数据
   *
   * @example
   * const dailyData = await FermentationData.getDailyAverage(
   *   new Date('2024-01-01'),
   *   new Date('2024-01-31')
   * );
   */
  FermentationData.getDailyAverage = async function (startDate, endDate, areaId = null) {
    const where = {
      record_time: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate],
      },
    };

    if (areaId) {
      where.area_id = areaId;
    }

    const results = await this.findAll({
      where,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('record_time')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('temperature')), 'avg_temperature'],
        [sequelize.fn('AVG', sequelize.col('humidity')), 'avg_humidity'],
        [sequelize.fn('AVG', sequelize.col('methane_concentration')), 'avg_methane'],
        [sequelize.fn('AVG', sequelize.col('ph_value')), 'avg_ph'],
        [sequelize.fn('AVG', sequelize.col('moisture_content')), 'avg_moisture'],
        [sequelize.fn('AVG', sequelize.col('organic_matter')), 'avg_organic'],
      ],
      group: [sequelize.fn('DATE', sequelize.col('record_time'))],
      order: [[sequelize.fn('DATE', sequelize.col('record_time')), 'ASC']],
      raw: true,
    });

    return results.map((item) => ({
      date: item.date,
      count: parseInt(item.count, 10),
      avg_temperature: item.avg_temperature ? parseFloat(item.avg_temperature) : null,
      avg_humidity: item.avg_humidity ? parseFloat(item.avg_humidity) : null,
      avg_methane: item.avg_methane ? parseFloat(item.avg_methane) : null,
      avg_ph: item.avg_ph ? parseFloat(item.avg_ph) : null,
      avg_moisture: item.avg_moisture ? parseFloat(item.avg_moisture) : null,
      avg_organic: item.avg_organic ? parseFloat(item.avg_organic) : null,
    }));
  };

  /**
   * 获取小时平均发酵数据
   * 用于展示短期趋势
   *
   * @param {number} [hours=24] - 最近的小时数
   * @param {number} [areaId] - 区域ID（可选）
   * @returns {Promise<Array>} 小时平均数据
   *
   * @example
   * const hourlyData = await FermentationData.getHourlyAverage(48, 1);
   */
  FermentationData.getHourlyAverage = async function (hours = 24, areaId = null) {
    const where = {
      record_time: {
        [sequelize.Sequelize.Op.gte]: new Date(Date.now() - hours * 60 * 60 * 1000),
      },
    };

    if (areaId) {
      where.area_id = areaId;
    }

    const results = await this.findAll({
      where,
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'hour', sequelize.col('record_time')), 'hour'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('temperature')), 'avg_temperature'],
        [sequelize.fn('AVG', sequelize.col('humidity')), 'avg_humidity'],
        [sequelize.fn('AVG', sequelize.col('methane_concentration')), 'avg_methane'],
      ],
      group: [sequelize.fn('DATE_TRUNC', 'hour', sequelize.col('record_time'))],
      order: [[sequelize.fn('DATE_TRUNC', 'hour', sequelize.col('record_time')), 'ASC']],
      raw: true,
    });

    return results.map((item) => ({
      hour: item.hour,
      count: parseInt(item.count, 10),
      avg_temperature: item.avg_temperature ? parseFloat(item.avg_temperature) : null,
      avg_humidity: item.avg_humidity ? parseFloat(item.avg_humidity) : null,
      avg_methane: item.avg_methane ? parseFloat(item.avg_methane) : null,
    }));
  };

  /**
   * 创建发酵数据记录
   *
   * @param {Object} data - 发酵数据
   * @param {number} [data.areaId] - 区域ID
   * @param {number} [data.temperature] - 温度
   * @param {number} [data.humidity] - 湿度
   * @param {number} [data.methaneConcentration] - 甲烷浓度
   * @param {number} [data.phValue] - PH值
   * @param {number} [data.moistureContent] - 含水率
   * @param {number} [data.organicMatter] - 有机物含量
   * @param {number} [data.oxygenConcentration] - 氧气浓度
   * @param {Date} [data.recordTime] - 记录时间
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<FermentationData>} 创建的发酵数据实例
   *
   * @example
   * const data = await FermentationData.createRecord({
   *   areaId: 1,
   *   temperature: 45.5,
   *   humidity: 55.2,
   *   methaneConcentration: 12.8,
   *   phValue: 7.2
   * });
   */
  FermentationData.createRecord = async function (data, transaction = null) {
    return await this.create(
      {
        area_id: data.areaId,
        temperature: data.temperature,
        humidity: data.humidity,
        methane_concentration: data.methaneConcentration,
        ph_value: data.phValue,
        moisture_content: data.moistureContent,
        organic_matter: data.organicMatter,
        oxygen_concentration: data.oxygenConcentration,
        record_time: data.recordTime || new Date(),
      },
      { transaction }
    );
  };

  /**
   * 批量创建发酵数据记录
   *
   * @param {Array<Object>} dataArray - 发酵数据数组
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<Array<FermentationData>>} 创建的发酵数据实例数组
   *
   * @example
   * const records = await FermentationData.bulkCreate([
   *   { areaId: 1, temperature: 45.5, humidity: 55.2 },
   *   { areaId: 1, temperature: 46.0, humidity: 54.8 }
   * ]);
   */
  FermentationData.bulkCreateRecords = async function (dataArray, transaction = null) {
    const records = dataArray.map((data) => ({
      area_id: data.areaId,
      temperature: data.temperature,
      humidity: data.humidity,
      methane_concentration: data.methaneConcentration,
      ph_value: data.phValue,
      moisture_content: data.moistureContent,
      organic_matter: data.organicMatter,
      oxygen_concentration: data.oxygenConcentration,
      record_time: data.recordTime || new Date(),
    }));

    return await this.bulkCreate(records, { transaction });
  };

  /**
   * 清理过期的发酵数据
   * 删除指定天数之前的数据
   *
   * @param {number} days - 保留天数
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<number>} 删除的记录数
   *
   * @example
   * const count = await FermentationData.cleanOldData(90);
   */
  FermentationData.cleanOldData = async function (days, transaction = null) {
    const expirationDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await this.destroy({
      where: {
        record_time: {
          [sequelize.Sequelize.Op.lt]: expirationDate,
        },
      },
      transaction,
    });

    return result;
  };

  /**
   * 获取异常发酵数据
   * 获取温度或甲烷浓度异常的记录
   *
   * @param {Object} [options] - 查询选项
   * @param {number} [options.temperatureThreshold=60] - 温度阈值
   * @param {number} [options.methaneThreshold=20] - 甲烷浓度阈值
   * @param {number} [options.limit] - 返回数量限制
   * @returns {Promise<Array<FermentationData>>} 异常发酵数据列表
   *
   * @example
   * const abnormalData = await FermentationData.findAbnormal({
   *   temperatureThreshold: 65,
   *   methaneThreshold: 18
   * });
   */
  FermentationData.findAbnormal = async function (options = {}) {
    const temperatureThreshold = options.temperatureThreshold || 60;
    const methaneThreshold = options.methaneThreshold || 20;
    const { Op } = sequelize.Sequelize;

    return await this.findAll({
      where: {
        [Op.or]: [
          { temperature: { [Op.gt]: temperatureThreshold } },
          { methane_concentration: { [Op.gt]: methaneThreshold } },
        ],
      },
      order: [['record_time', 'DESC']],
      limit: options.limit,
    });
  };

  // 返回模型
  return FermentationData;
};
