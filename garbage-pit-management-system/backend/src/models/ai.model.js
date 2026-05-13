/**
 * 垃圾储坑智能化管控系统 - AI分析记录模型
 *
 * 该文件定义了AI分析记录表(ai_analysis_records)的数据模型，用于管理AI服务的调用记录
 * AI分析记录包括发酵分析、告警诊断、大物体识别、调度优化等类型的分析记录
 *
 * 功能特点：
 * 1. 记录AI服务的调用详情（输入数据、输出结果）
 * 2. 统计AI服务的使用情况（token消耗、响应时间）
 * 3. 支持多种分析类型（发酵分析、告警诊断、调度优化）
 * 4. 提供成本分析和统计功能
 *
 * @module models/ai
 * @author 华工三峰
 */

'use strict';

/**
 * 导出AI分析记录模型定义
 *
 * @param {Sequelize} sequelize - Sequelize 实例
 * @param {DataTypes} DataTypes - Sequelize 数据类型
 * @returns {Model} AIAnalysisRecord 模型
 */
module.exports = (sequelize, DataTypes) => {
  // =====================================================
  // AI分析记录模型定义
  // =====================================================

  /**
   * AI分析记录模型
   *
   * 对应数据库表: ai_analysis_records
   * 记录AI服务的调用信息，包括输入输出数据、使用的模型、消耗的token等
   */
  const AIAnalysisRecord = sequelize.define(
    'AIAnalysisRecord',
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
      // 分析类型字段
      // =====================================================

      /**
       * 分析类型
       * 用于区分不同类型的AI分析任务
       * - fermentation: 发酵分析 - 分析垃圾池发酵状态，预测发酵趋势
       * - alarm_diagnosis: 告警诊断 - 诊断行车告警原因，提供处理建议
       * - object_detection: 大物体识别 - 识别卸料口的大物体，生成告警
       * - schedule_optimization: 调度优化 - 优化行车调度任务，提高效率
       */
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '分析类型：fermentation-发酵分析, alarm_diagnosis-告警诊断, object_detection-大物体识别, schedule_optimization-调度优化',
        validate: {
          notNull: {
            msg: '分析类型不能为空',
          },
          isIn: {
            args: [['fermentation', 'alarm_diagnosis', 'object_detection', 'schedule_optimization']],
            msg: '分析类型必须是：fermentation, alarm_diagnosis, object_detection, schedule_optimization 之一',
          },
        },
      },

      // =====================================================
      // 数据字段
      // =====================================================

      /**
       * 输入数据
       * AI分析服务的输入数据，JSON格式存储
       * 不同类型的分析有不同的数据结构
       */
      input_data: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: '输入数据（JSON格式），AI分析的原始输入',
        validate: {
          isValidJson(value) {
            if (value && typeof value !== 'object') {
              throw new Error('输入数据必须是有效的JSON对象');
            }
          },
        },
      },

      /**
       * 输出结果
       * AI分析服务的输出结果，JSON格式存储
       * 包含AI分析的结果数据和建议信息
       */
      output_data: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: '输出结果（JSON格式），AI分析的结果数据',
        validate: {
          isValidJson(value) {
            if (value && typeof value !== 'object') {
              throw new Error('输出数据必须是有效的JSON对象');
            }
          },
        },
      },

      // =====================================================
      // 模型信息字段
      // =====================================================

      /**
       * 使用的模型
       * 记录本次AI分析使用的模型名称
       * 例如：gpt-4, claude-3-opus, llama3 等
       */
      model_used: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '使用的模型名称，如gpt-4, claude-3-opus等',
      },

      // =====================================================
      // 性能统计字段
      // =====================================================

      /**
       * 消耗token数
       * 记录本次AI调用消耗的token数量
       * 用于成本分析和资源使用统计
       */
      tokens_used: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: '消耗的token数量',
        validate: {
          isInt: {
            msg: 'token数量必须为整数',
          },
          min: {
            args: [0],
            msg: 'token数量不能为负数',
          },
        },
      },

      /**
       * 响应时间
       * AI服务的响应时间（毫秒）
       * 用于性能监控和优化
       */
      response_time: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '响应时间（毫秒），AI服务响应耗时',
        validate: {
          isInt: {
            msg: '响应时间必须为整数',
          },
          min: {
            args: [0],
            msg: '响应时间不能为负数',
          },
        },
      },

      // =====================================================
      // 状态字段
      // =====================================================

      /**
       * 处理状态
       * 记录AI分析任务的处理状态
       * - processing: 处理中 - AI分析任务正在执行
       * - success: 成功 - AI分析任务执行成功
       * - failed: 失败 - AI分析任务执行失败
       */
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'processing',
        comment: '状态：processing-处理中, success-成功, failed-失败',
        validate: {
          isIn: {
            args: [['processing', 'success', 'failed']],
            msg: '状态必须是：processing, success, failed 之一',
          },
        },
      },

      /**
       * 错误信息
       * 当状态为failed时，记录错误详情
       */
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '错误信息，当处理失败时记录错误详情',
      },

      // =====================================================
      // 关联字段
      // =====================================================

      /**
       * 创建人ID
       * 触发AI分析的用户ID
       */
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '创建人ID，触发分析的用户',
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
       * 记录创建的时间，自动生成
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
      tableName: 'ai_analysis_records',

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
        // 分析类型索引（用于按类型查询分析记录）
        {
          fields: ['type'],
          name: 'idx_ai_analysis_records_type',
        },
        // 创建时间索引（用于按时间排序和范围查询）
        {
          fields: ['created_at'],
          name: 'idx_ai_analysis_records_created_at',
        },
        // 状态索引（用于按状态查询）
        {
          fields: ['status'],
          name: 'idx_ai_analysis_records_status',
        },
        // 创建人索引（用于查询用户的分析记录）
        {
          fields: ['created_by'],
          name: 'idx_ai_analysis_records_created_by',
        },
        // 模型索引（用于统计各模型使用情况）
        {
          fields: ['model_used'],
          name: 'idx_ai_analysis_records_model_used',
        },
        // 复合索引：类型 + 创建时间（用于按类型统计时间趋势）
        {
          fields: ['type', 'created_at'],
          name: 'idx_ai_analysis_records_type_time',
        },
      ],

      /**
       * 模型名称配置
       */
      modelName: 'AIAnalysisRecord',

      /**
       * 注释配置
       */
      comment: 'AI分析记录表，用于管理AI服务调用记录',

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
        // 按分析类型查询
        fermentation: {
          where: {
            type: 'fermentation',
          },
        },
        alarmDiagnosis: {
          where: {
            type: 'alarm_diagnosis',
          },
        },
        objectDetection: {
          where: {
            type: 'object_detection',
          },
        },
        scheduleOptimization: {
          where: {
            type: 'schedule_optimization',
          },
        },
        // 按状态查询
        processing: {
          where: {
            status: 'processing',
          },
        },
        success: {
          where: {
            status: 'success',
          },
        },
        failed: {
          where: {
            status: 'failed',
          },
        },
        // 最近24小时
        last24Hours: {
          where: {
            created_at: {
              [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        },
        // 最近7天
        last7Days: {
          where: {
            created_at: {
              [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
        // 最近30天
        last30Days: {
          where: {
            created_at: {
              [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        // 高token消耗（超过1000 token）
        highTokenUsage: {
          where: {
            tokens_used: {
              [sequelize.Sequelize.Op.gt]: 1000,
            },
          },
        },
        // 慢响应（超过5秒）
        slowResponse: {
          where: {
            response_time: {
              [sequelize.Sequelize.Op.gt]: 5000,
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
   * 检查是否处理成功
   *
   * @returns {boolean} 是否处理成功
   */
  AIAnalysisRecord.prototype.isSuccess = function () {
    return this.status === 'success';
  };

  /**
   * 检查是否处理失败
   *
   * @returns {boolean} 是否处理失败
   */
  AIAnalysisRecord.prototype.isFailed = function () {
    return this.status === 'failed';
  };

  /**
   * 检查是否正在处理中
   *
   * @returns {boolean} 是否正在处理中
   */
  AIAnalysisRecord.prototype.isProcessing = function () {
    return this.status === 'processing';
  };

  /**
   * 获取分析类型的中文名称
   *
   * @returns {string} 分析类型的中文名称
   */
  AIAnalysisRecord.prototype.getTypeName = function () {
    const typeNames = {
      fermentation: '发酵分析',
      alarm_diagnosis: '告警诊断',
      object_detection: '大物体识别',
      schedule_optimization: '调度优化',
    };
    return typeNames[this.type] || this.type;
  };

  /**
   * 获取状态的中文名称
   *
   * @returns {string} 状态的中文名称
   */
  AIAnalysisRecord.prototype.getStatusName = function () {
    const statusNames = {
      processing: '处理中',
      success: '成功',
      failed: '失败',
    };
    return statusNames[this.status] || this.status;
  };

  /**
   * 获取响应时间的友好格式
   *
   * @returns {string} 响应时间的友好格式
   */
  AIAnalysisRecord.prototype.getFormattedResponseTime = function () {
    if (this.response_time === null) return '-';
    if (this.response_time < 1000) {
      return `${this.response_time}ms`;
    }
    return `${(this.response_time / 1000).toFixed(2)}s`;
  };

  /**
   * 获取数据摘要
   * 返回关键数据的摘要信息
   *
   * @returns {Object} 数据摘要
   */
  AIAnalysisRecord.prototype.getSummary = function () {
    return {
      id: this.id,
      type: this.type,
      typeName: this.getTypeName(),
      model_used: this.model_used,
      tokens_used: this.tokens_used,
      response_time: this.response_time,
      formattedResponseTime: this.getFormattedResponseTime(),
      status: this.status,
      statusName: this.getStatusName(),
      created_at: this.created_at,
    };
  };

  /**
   * 转换为JSON格式
   * 重写默认的toJSON方法
   *
   * @returns {Object} JSON对象
   */
  AIAnalysisRecord.prototype.toJSON = function () {
    const values = { ...this.get() };
    // 添加类型和状态的中文名称
    values.type_name = this.getTypeName();
    values.status_name = this.getStatusName();
    values.formatted_response_time = this.getFormattedResponseTime();
    return values;
  };

  // =====================================================
  // 类方法（静态方法）
  // =====================================================

  /**
   * 按分析类型查询记录
   *
   * @param {string} type - 分析类型
   * @param {Object} [options] - 查询选项
   * @param {number} [options.limit] - 返回数量限制
   * @returns {Promise<Array<AIAnalysisRecord>>} 分析记录列表
   *
   * @example
   * const records = await AIAnalysisRecord.findByType('fermentation');
   */
  AIAnalysisRecord.findByType = async function (type, options = {}) {
    return await this.findAll({
      where: {
        type: type,
      },
      order: [['created_at', 'DESC']],
      limit: options.limit,
    });
  };

  /**
   * 按状态查询记录
   *
   * @param {string} status - 状态
   * @param {Object} [options] - 查询选项
   * @param {number} [options.limit] - 返回数量限制
   * @returns {Promise<Array<AIAnalysisRecord>>} 分析记录列表
   *
   * @example
   * const records = await AIAnalysisRecord.findByStatus('failed');
   */
  AIAnalysisRecord.findByStatus = async function (status, options = {}) {
    return await this.findAll({
      where: {
        status: status,
      },
      order: [['created_at', 'DESC']],
      limit: options.limit,
    });
  };

  /**
   * 按时间范围查询记录
   *
   * @param {Date} startTime - 开始时间
   * @param {Date} endTime - 结束时间
   * @param {string} [type] - 分析类型（可选）
   * @returns {Promise<Array<AIAnalysisRecord>>} 分析记录列表
   *
   * @example
   * const records = await AIAnalysisRecord.findByTimeRange(
   *   new Date('2024-01-01'),
   *   new Date('2024-01-31'),
   *   'fermentation'
   * );
   */
  AIAnalysisRecord.findByTimeRange = async function (startTime, endTime, type = null) {
    const where = {
      created_at: {
        [sequelize.Sequelize.Op.between]: [startTime, endTime],
      },
    };

    if (type) {
      where.type = type;
    }

    return await this.findAll({
      where,
      order: [['created_at', 'ASC']],
    });
  };

  /**
   * 获取用户的分析记录
   *
   * @param {number} userId - 用户ID
   * @param {Object} [options] - 查询选项
   * @param {number} [options.limit] - 返回数量限制
   * @returns {Promise<Array<AIAnalysisRecord>>} 分析记录列表
   *
   * @example
   * const records = await AIAnalysisRecord.findByUser(1);
   */
  AIAnalysisRecord.findByUser = async function (userId, options = {}) {
    return await this.findAll({
      where: {
        created_by: userId,
      },
      order: [['created_at', 'DESC']],
      limit: options.limit,
    });
  };

  /**
   * 获取最新的分析记录
   *
   * @param {string} [type] - 分析类型（可选）
   * @returns {Promise<AIAnalysisRecord|null>} 最新的分析记录
   *
   * @example
   * const latest = await AIAnalysisRecord.getLatest('fermentation');
   */
  AIAnalysisRecord.getLatest = async function (type = null) {
    const where = {};
    if (type) {
      where.type = type;
    }

    return await this.findOne({
      where,
      order: [['created_at', 'DESC']],
    });
  };

  /**
   * 获取统计数据
   * 计算指定时间范围内的统计数据
   *
   * @param {Date} startTime - 开始时间
   * @param {Date} endTime - 结束时间
   * @param {string} [type] - 分析类型（可选）
   * @returns {Promise<Object>} 统计数据
   *
   * @example
   * const stats = await AIAnalysisRecord.getStatistics(
   *   new Date('2024-01-01'),
   *   new Date('2024-01-31')
   * );
   */
  AIAnalysisRecord.getStatistics = async function (startTime, endTime, type = null) {
    const where = {
      created_at: {
        [sequelize.Sequelize.Op.between]: [startTime, endTime],
      },
    };

    if (type) {
      where.type = type;
    }

    const result = await this.findOne({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_count'],
        [sequelize.fn('SUM', sequelize.col('tokens_used')), 'total_tokens'],
        [sequelize.fn('AVG', sequelize.col('tokens_used')), 'avg_tokens'],
        [sequelize.fn('AVG', sequelize.col('response_time')), 'avg_response_time'],
        [sequelize.fn('MAX', sequelize.col('response_time')), 'max_response_time'],
        [sequelize.fn('MIN', sequelize.col('response_time')), 'min_response_time'],
      ],
      raw: true,
    });

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
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('tokens_used')), 'tokens'],
      ],
      group: ['type'],
      raw: true,
    });

    // 按模型统计
    const modelCounts = await this.findAll({
      where,
      attributes: [
        'model_used',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('tokens_used')), 'tokens'],
      ],
      group: ['model_used'],
      raw: true,
    });

    return {
      total_count: parseInt(result?.total_count || 0, 10),
      total_tokens: parseInt(result?.total_tokens || 0, 10),
      avg_tokens: result?.avg_tokens ? parseFloat(result.avg_tokens) : 0,
      avg_response_time: result?.avg_response_time ? parseFloat(result.avg_response_time) : 0,
      max_response_time: result?.max_response_time ? parseInt(result.max_response_time, 10) : 0,
      min_response_time: result?.min_response_time ? parseInt(result.min_response_time, 10) : 0,
      by_status: statusCounts.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count, 10);
        return acc;
      }, {}),
      by_type: typeCounts.reduce((acc, item) => {
        acc[item.type] = {
          count: parseInt(item.count, 10),
          tokens: parseInt(item.tokens || 0, 10),
        };
        return acc;
      }, {}),
      by_model: modelCounts.reduce((acc, item) => {
        if (item.model_used) {
          acc[item.model_used] = {
            count: parseInt(item.count, 10),
            tokens: parseInt(item.tokens || 0, 10),
          };
        }
        return acc;
      }, {}),
    };
  };

  /**
   * 获取每日统计数据
   * 按天聚合分析记录
   *
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @param {string} [type] - 分析类型（可选）
   * @returns {Promise<Array>} 每日统计数据
   *
   * @example
   * const dailyStats = await AIAnalysisRecord.getDailyStatistics(
   *   new Date('2024-01-01'),
   *   new Date('2024-01-31')
   * );
   */
  AIAnalysisRecord.getDailyStatistics = async function (startDate, endDate, type = null) {
    const where = {
      created_at: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate],
      },
    };

    if (type) {
      where.type = type;
    }

    const results = await this.findAll({
      where,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('tokens_used')), 'total_tokens'],
        [sequelize.fn('AVG', sequelize.col('response_time')), 'avg_response_time'],
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true,
    });

    return results.map((item) => ({
      date: item.date,
      count: parseInt(item.count, 10),
      total_tokens: parseInt(item.total_tokens || 0, 10),
      avg_response_time: item.avg_response_time ? parseFloat(item.avg_response_time) : 0,
    }));
  };

  /**
   * 创建分析记录
   *
   * @param {Object} data - 分析数据
   * @param {string} data.type - 分析类型
   * @param {Object} [data.inputData] - 输入数据
   * @param {Object} [data.outputData] - 输出数据
   * @param {string} [data.modelUsed] - 使用的模型
   * @param {number} [data.tokensUsed] - 消耗的token数
   * @param {number} [data.responseTime] - 响应时间
   * @param {string} [data.status] - 状态
   * @param {string} [data.errorMessage] - 错误信息
   * @param {number} [data.createdBy] - 创建人ID
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<AIAnalysisRecord>} 创建的分析记录实例
   *
   * @example
   * const record = await AIAnalysisRecord.createRecord({
   *   type: 'fermentation',
   *   inputData: { areaId: 1, timeRange: '24h' },
   *   modelUsed: 'gpt-4',
   *   createdBy: 1
   * });
   */
  AIAnalysisRecord.createRecord = async function (data, transaction = null) {
    return await this.create(
      {
        type: data.type,
        input_data: data.inputData,
        output_data: data.outputData,
        model_used: data.modelUsed,
        tokens_used: data.tokensUsed || 0,
        response_time: data.responseTime,
        status: data.status || 'processing',
        error_message: data.errorMessage,
        created_by: data.createdBy,
      },
      { transaction }
    );
  };

  /**
   * 更新分析结果
   * 用于在AI分析完成后更新记录
   *
   * @param {number} id - 记录ID
   * @param {Object} data - 更新数据
   * @param {Object} [data.outputData] - 输出数据
   * @param {number} [data.tokensUsed] - 消耗的token数
   * @param {number} [data.responseTime] - 响应时间
   * @param {string} [data.status] - 状态
   * @param {string} [data.errorMessage] - 错误信息
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<AIAnalysisRecord>} 更新后的记录
   *
   * @example
   * const record = await AIAnalysisRecord.updateResult(1, {
   *   outputData: { prediction: '...' },
   *   tokensUsed: 1500,
   *   responseTime: 2500,
   *   status: 'success'
   * });
   */
  AIAnalysisRecord.updateResult = async function (id, data, transaction = null) {
    const record = await this.findByPk(id);
    if (!record) {
      throw new Error(`未找到ID为${id}的分析记录`);
    }

    return await record.update(
      {
        output_data: data.outputData,
        tokens_used: data.tokensUsed,
        response_time: data.responseTime,
        status: data.status,
        error_message: data.errorMessage,
      },
      { transaction }
    );
  };

  /**
   * 标记分析失败
   *
   * @param {number} id - 记录ID
   * @param {string} errorMessage - 错误信息
   * @param {number} [responseTime] - 响应时间
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<AIAnalysisRecord>} 更新后的记录
   *
   * @example
   * const record = await AIAnalysisRecord.markAsFailed(1, 'API调用超时');
   */
  AIAnalysisRecord.markAsFailed = async function (id, errorMessage, responseTime = null, transaction = null) {
    const record = await this.findByPk(id);
    if (!record) {
      throw new Error(`未找到ID为${id}的分析记录`);
    }

    return await record.update(
      {
        status: 'failed',
        error_message: errorMessage,
        response_time: responseTime,
      },
      { transaction }
    );
  };

  /**
   * 标记分析成功
   *
   * @param {number} id - 记录ID
   * @param {Object} outputData - 输出数据
   * @param {number} tokensUsed - 消耗的token数
   * @param {number} responseTime - 响应时间
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<AIAnalysisRecord>} 更新后的记录
   *
   * @example
   * const record = await AIAnalysisRecord.markAsSuccess(1, { prediction: '...' }, 1500, 2500);
   */
  AIAnalysisRecord.markAsSuccess = async function (id, outputData, tokensUsed, responseTime, transaction = null) {
    const record = await this.findByPk(id);
    if (!record) {
      throw new Error(`未找到ID为${id}的分析记录`);
    }

    return await record.update(
      {
        status: 'success',
        output_data: outputData,
        tokens_used: tokensUsed,
        response_time: responseTime,
      },
      { transaction }
    );
  };

  /**
   * 清理过期记录
   * 删除指定天数之前的记录
   *
   * @param {number} days - 保留天数
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<number>} 删除的记录数
   *
   * @example
   * const count = await AIAnalysisRecord.cleanOldRecords(90);
   */
  AIAnalysisRecord.cleanOldRecords = async function (days, transaction = null) {
    const expirationDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await this.destroy({
      where: {
        created_at: {
          [sequelize.Sequelize.Op.lt]: expirationDate,
        },
      },
      transaction,
    });

    return result;
  };

  /**
   * 获取失败的分析记录
   *
   * @param {Object} [options] - 查询选项
   * @param {number} [options.limit] - 返回数量限制
   * @returns {Promise<Array<AIAnalysisRecord>>} 失败的分析记录列表
   *
   * @example
   * const failedRecords = await AIAnalysisRecord.getFailedRecords({ limit: 10 });
   */
  AIAnalysisRecord.getFailedRecords = async function (options = {}) {
    return await this.findAll({
      where: {
        status: 'failed',
      },
      order: [['created_at', 'DESC']],
      limit: options.limit,
    });
  };

  /**
   * 获取高token消耗的记录
   *
   * @param {number} [threshold=1000] - token阈值
   * @param {Object} [options] - 查询选项
   * @param {number} [options.limit] - 返回数量限制
   * @returns {Promise<Array<AIAnalysisRecord>>} 高token消耗的记录列表
   *
   * @example
   * const records = await AIAnalysisRecord.getHighTokenRecords(2000, { limit: 10 });
   */
  AIAnalysisRecord.getHighTokenRecords = async function (threshold = 1000, options = {}) {
    return await this.findAll({
      where: {
        tokens_used: {
          [sequelize.Sequelize.Op.gt]: threshold,
        },
      },
      order: [['tokens_used', 'DESC']],
      limit: options.limit,
    });
  };

  // 返回模型
  return AIAnalysisRecord;
};
