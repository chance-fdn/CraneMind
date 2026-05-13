/**
 * 垃圾储坑智能化管控系统 - 数据服务
 * 
 * 该文件实现了数据查询和导出相关的业务逻辑，包括发酵数据、库存数据、车辆记录等。
 * 服务层负责处理业务逻辑，与数据库交互，为控制器提供数据服务。
 * 
 * 主要功能：
 * 1. 发酵数据查询（按区域、时间范围筛选）
 * 2. 库存数据查询（按时间范围、分组方式统计）
 * 3. 车辆记录查询（按记录类型、时间范围筛选）
 * 4. 数据导出（支持JSON、CSV格式）
 * 
 * @module services/data.service
 * @author 华工三峰
 */

'use strict';

// 引入依赖
const { Op } = require('sequelize');
const { FermentationData, InventoryData, VehicleRecord } = require('../models');
const { 
  ValidationError, 
  NotFoundError, 
  BusinessError,
} = require('../middlewares/error.middleware');
const logger = require('../utils/logger');
const { Parser } = require('json2csv');

/**
 * 数据服务类
 * 
 * @class DataService
 */
class DataService {
  /**
   * 构造函数
   * 
   * @constructor
   */
  constructor() {
    this.FermentationData = FermentationData;
    this.InventoryData = InventoryData;
    this.VehicleRecord = VehicleRecord;
  }

  /**
   * 获取发酵数据
   * 
   * @description
   * 根据查询条件获取发酵数据列表
   * 支持按区域ID、时间范围进行筛选
   * 
   * @param {Object} params - 查询参数
   * @param {number} params.areaId - 区域ID（可选）
   * @param {string} params.startDate - 开始日期（可选，ISO格式）
   * @param {string} params.endDate - 结束日期（可选，ISO格式）
   * @param {number} params.page - 页码，默认1
   * @param {number} params.limit - 每页数量，默认10
   * @returns {Promise<Object>} 分页结果对象
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const result = await dataService.getFermentationData({
   *   areaId: 1,
   *   startDate: '2024-01-01T00:00:00.000Z',
   *   endDate: '2024-01-31T23:59:59.999Z',
   *   page: 1,
   *   limit: 10,
   * });
   */
  async getFermentationData(params = {}) {
    try {
      const {
        areaId,
        startDate,
        endDate,
        page = 1,
        limit = 10,
      } = params;

      logger.info('数据服务 - 获取发酵数据', { params });

      // 构建查询条件
      const where = {};

      // 区域ID筛选
      if (areaId) {
        if (isNaN(areaId) || areaId <= 0) {
          throw new ValidationError('区域ID必须为正整数');
        }
        where.area_id = parseInt(areaId);
      }

      // 时间范围筛选
      if (startDate || endDate) {
        where.record_time = {};

        if (startDate) {
          const start = new Date(startDate);
          if (isNaN(start.getTime())) {
            throw new ValidationError('开始日期格式不正确');
          }
          where.record_time[Op.gte] = start;
        }

        if (endDate) {
          const end = new Date(endDate);
          if (isNaN(end.getTime())) {
            throw new ValidationError('结束日期格式不正确');
          }
          where.record_time[Op.lte] = end;
        }
      }

      // 计算偏移量
      const offset = (page - 1) * limit;

      // 执行查询
      const { count, rows } = await this.FermentationData.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['record_time', 'DESC']],
      });

      // 计算总页数
      const totalPages = Math.ceil(count / limit);

      // 获取统计数据
      let statistics = null;
      if (count > 0) {
        statistics = await this.FermentationData.getStatistics(
          startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate ? new Date(endDate) : new Date(),
          areaId
        );
      }

      logger.info('数据服务 - 获取发酵数据成功', { 
        total: count, 
        page, 
        limit, 
        totalPages 
      });

      return {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        list: rows.map(data => data.toJSON()),
        statistics,
        query: { areaId, startDate, endDate },
      };
    } catch (error) {
      logger.error('数据服务 - 获取发酵数据失败', { 
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * 获取库存数据
   * 
   * @description
   * 根据查询条件获取库存数据列表
   * 支持按时间范围筛选，支持按天/周/月/区域分组
   * 
   * @param {Object} params - 查询参数
   * @param {string} params.startDate - 开始日期（可选，ISO格式）
   * @param {string} params.endDate - 结束日期（可选，ISO格式）
   * @param {string} params.groupBy - 分组方式（day/week/month/area，默认day）
   * @param {number} params.page - 页码，默认1
   * @param {number} params.limit - 每页数量，默认10
   * @returns {Promise<Object>} 分页结果对象
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const result = await dataService.getInventoryData({
   *   startDate: '2024-01-01T00:00:00.000Z',
   *   endDate: '2024-01-31T23:59:59.999Z',
   *   groupBy: 'day',
   *   page: 1,
   *   limit: 10,
   * });
   */
  async getInventoryData(params = {}) {
    try {
      const {
        startDate,
        endDate,
        groupBy = 'day',
        page = 1,
        limit = 10,
      } = params;

      logger.info('数据服务 - 获取库存数据', { params });

      // 验证分组方式
      const validGroupBy = ['day', 'week', 'month', 'area'];
      if (!validGroupBy.includes(groupBy)) {
        throw new ValidationError(`分组方式无效，必须是: ${validGroupBy.join(', ')}`);
      }

      // 构建查询条件
      const where = {};

      // 时间范围筛选
      if (startDate || endDate) {
        where.recorded_at = {};

        if (startDate) {
          const start = new Date(startDate);
          if (isNaN(start.getTime())) {
            throw new ValidationError('开始日期格式不正确');
          }
          where.recorded_at[Op.gte] = start;
        }

        if (endDate) {
          const end = new Date(endDate);
          if (isNaN(end.getTime())) {
            throw new ValidationError('结束日期格式不正确');
          }
          where.recorded_at[Op.lte] = end;
        }
      }

      // 计算偏移量
      const offset = (page - 1) * limit;

      // 执行查询
      const { count, rows } = await this.InventoryData.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['recorded_at', 'DESC']],
      });

      // 计算总页数
      const totalPages = Math.ceil(count / limit);

      // 计算汇总统计
      let summary = null;
      if (count > 0) {
        const totalWeight = rows.reduce((sum, item) => sum + (item.total_weight || 0), 0);
        const avgHeight = rows.reduce((sum, item) => sum + (item.stacking_height || 0), 0) / count;
        const avgDensity = rows.reduce((sum, item) => sum + (item.density || 0), 0) / count;

        summary = {
          totalWeight: parseFloat(totalWeight.toFixed(2)),
          avgHeight: parseFloat(avgHeight.toFixed(2)),
          avgDensity: parseFloat(avgDensity.toFixed(2)),
          totalAreas: new Set(rows.map(item => item.area_id)).size,
        };
      }

      logger.info('数据服务 - 获取库存数据成功', { 
        total: count, 
        page, 
        limit, 
        totalPages 
      });

      return {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        list: rows.map(data => data.toJSON()),
        summary,
        query: { startDate, endDate, groupBy },
      };
    } catch (error) {
      logger.error('数据服务 - 获取库存数据失败', { 
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * 获取车辆记录
   * 
   * @description
   * 根据查询条件获取车辆进出记录
   * 支持按记录类型、时间范围进行筛选
   * 
   * @param {Object} params - 查询参数
   * @param {string} params.recordType - 记录类型（discharge/load/transfer，可选）
   * @param {string} params.startDate - 开始日期（可选，ISO格式）
   * @param {string} params.endDate - 结束日期（可选，ISO格式）
   * @param {number} params.page - 页码，默认1
   * @param {number} params.limit - 每页数量，默认10
   * @returns {Promise<Object>} 分页结果对象
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const result = await dataService.getVehicleRecords({
   *   recordType: 'discharge',
   *   startDate: '2024-01-01T00:00:00.000Z',
   *   endDate: '2024-01-31T23:59:59.999Z',
   *   page: 1,
   *   limit: 10,
   * });
   */
  async getVehicleRecords(params = {}) {
    try {
      const {
        recordType,
        startDate,
        endDate,
        page = 1,
        limit = 10,
      } = params;

      logger.info('数据服务 - 获取车辆记录', { params });

      // 构建查询条件
      const where = {};

      // 记录类型筛选
      if (recordType) {
        const validRecordTypes = ['discharge', 'load', 'transfer'];
        if (!validRecordTypes.includes(recordType)) {
          throw new ValidationError(`记录类型无效，必须是: ${validRecordTypes.join(', ')}`);
        }
        where.record_type = recordType;
      }

      // 时间范围筛选
      if (startDate || endDate) {
        where.enter_time = {};

        if (startDate) {
          const start = new Date(startDate);
          if (isNaN(start.getTime())) {
            throw new ValidationError('开始日期格式不正确');
          }
          where.enter_time[Op.gte] = start;
        }

        if (endDate) {
          const end = new Date(endDate);
          if (isNaN(end.getTime())) {
            throw new ValidationError('结束日期格式不正确');
          }
          where.enter_time[Op.lte] = end;
        }
      }

      // 计算偏移量
      const offset = (page - 1) * limit;

      // 执行查询
      const { count, rows } = await this.VehicleRecord.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['enter_time', 'DESC']],
      });

      // 计算总页数
      const totalPages = Math.ceil(count / limit);

      // 计算汇总统计
      let summary = null;
      if (count > 0) {
        const totalWeight = rows.reduce((sum, item) => sum + (item.weight || 0), 0);
        const avgWeight = totalWeight / count;
        const totalVehicles = new Set(rows.map(item => item.vehicle_no)).size;

        summary = {
          totalVehicles,
          totalWeight: parseFloat(totalWeight.toFixed(2)),
          avgWeight: parseFloat(avgWeight.toFixed(2)),
          totalRecords: count,
        };
      }

      logger.info('数据服务 - 获取车辆记录成功', { 
        total: count, 
        page, 
        limit, 
        totalPages 
      });

      return {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        list: rows.map(data => data.toJSON()),
        summary,
        query: { recordType, startDate, endDate },
      };
    } catch (error) {
      logger.error('数据服务 - 获取车辆记录失败', { 
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * 导出数据
   * 
   * @description
   * 根据指定类型和格式导出数据
   * 支持 JSON、CSV 格式
   * 
   * @param {Object} params - 导出参数
   * @param {string} params.type - 数据类型（fermentation/inventory/vehicle）
   * @param {string} params.format - 导出格式（json/csv）
   * @param {string} params.startDate - 开始日期（可选，ISO格式）
   * @param {string} params.endDate - 结束日期（可选，ISO格式）
   * @param {number} params.areaId - 区域ID（可选，仅对发酵数据有效）
   * @param {string} params.recordType - 记录类型（可选，仅对车辆记录有效）
   * @returns {Promise<Object>} 导出结果对象
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const result = await dataService.exportData({
   *   type: 'fermentation',
   *   format: 'csv',
   *   startDate: '2024-01-01T00:00:00.000Z',
   *   endDate: '2024-01-31T23:59:59.999Z',
   *   areaId: 1,
   * });
   */
  async exportData(params = {}) {
    try {
      const {
        type,
        format,
        startDate,
        endDate,
        areaId,
        recordType,
      } = params;

      logger.info('数据服务 - 导出数据', { params });

      // 验证必填参数
      if (!type) {
        throw new ValidationError('数据类型不能为空');
      }
      if (!format) {
        throw new ValidationError('导出格式不能为空');
      }

      // 验证数据类型
      const validTypes = ['fermentation', 'inventory', 'vehicle'];
      if (!validTypes.includes(type)) {
        throw new ValidationError(`数据类型无效，必须是: ${validTypes.join(', ')}`);
      }

      // 验证导出格式
      const validFormats = ['json', 'csv'];
      if (!validFormats.includes(format)) {
        throw new ValidationError(`导出格式无效，必须是: ${validFormats.join(', ')}`);
      }

      // 构建查询条件
      const where = {};

      // 时间范围筛选
      if (startDate || endDate) {
        const timeField = type === 'fermentation' ? 'record_time' : 
                         type === 'inventory' ? 'recorded_at' : 'enter_time';
        
        where[timeField] = {};

        if (startDate) {
          const start = new Date(startDate);
          if (isNaN(start.getTime())) {
            throw new ValidationError('开始日期格式不正确');
          }
          where[timeField][Op.gte] = start;
        }

        if (endDate) {
          const end = new Date(endDate);
          if (isNaN(end.getTime())) {
            throw new ValidationError('结束日期格式不正确');
          }
          where[timeField][Op.lte] = end;
        }
      }

      // 区域ID筛选（仅对发酵数据有效）
      if (areaId && type === 'fermentation') {
        if (isNaN(areaId) || areaId <= 0) {
          throw new ValidationError('区域ID必须为正整数');
        }
        where.area_id = parseInt(areaId);
      }

      // 记录类型筛选（仅对车辆记录有效）
      if (recordType && type === 'vehicle') {
        const validRecordTypes = ['discharge', 'load', 'transfer'];
        if (!validRecordTypes.includes(recordType)) {
          throw new ValidationError(`记录类型无效���必须是: ${validRecordTypes.join(', ')}`);
        }
        where.record_type = recordType;
      }

      // 根据数据类型选择模型
      let Model;
      let orderField;
      switch (type) {
        case 'fermentation':
          Model = this.FermentationData;
          orderField = 'record_time';
          break;
        case 'inventory':
          Model = this.InventoryData;
          orderField = 'recorded_at';
          break;
        case 'vehicle':
          Model = this.VehicleRecord;
          orderField = 'enter_time';
          break;
      }

      // 查询数据
      const data = await Model.findAll({
        where,
        order: [[orderField, 'DESC']],
      });

      // 转换为JSON格式
      const jsonData = data.map(item => item.toJSON());

      // 根据格式处理数据
      let exportData;
      let contentType;
      let filename;

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      filename = `${type}_export_${timestamp}`;

      if (format === 'json') {
        exportData = JSON.stringify({
          type,
          exportedAt: new Date().toISOString(),
          totalCount: jsonData.length,
          data: jsonData,
          query: params,
        }, null, 2);
        contentType = 'application/json';
        filename += '.json';
      } else if (format === 'csv') {
        try {
          // 定义CSV字段
          const fields = this._getCSVFields(type);
          const json2csvParser = new Parser({ fields });
          exportData = json2csvParser.parse(jsonData);
          contentType = 'text/csv; charset=utf-8';
          filename += '.csv';
        } catch (csvError) {
          logger.error('数据服务 - CSV转换失败', { error: csvError.message });
          throw new BusinessError('CSV数据转换失败');
        }
      }

      logger.info('数据服务 - 导出数据成功', { 
        type, 
        format, 
        count: jsonData.length 
      });

      return {
        success: true,
        data: exportData,
        contentType,
        filename,
        count: jsonData.length,
        exportedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('数据服务 - 导出数据失败', { 
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * 获取CSV字段定义
   * 
   * @private
   * @param {string} type - 数据类型
   * @returns {Array<Object>} CSV字段定义数组
   */
  _getCSVFields(type) {
    switch (type) {
      case 'fermentation':
        return [
          { label: '记录ID', value: 'id' },
          { label: '区域ID', value: 'area_id' },
          { label: '温度(℃)', value: 'temperature' },
          { label: '湿度(%)', value: 'humidity' },
          { label: '甲烷浓度(%)', value: 'methane_concentration' },
          { label: 'PH值', value: 'ph_value' },
          { label: '含水率(%)', value: 'moisture_content' },
          { label: '有机物含量(%)', value: 'organic_matter' },
          { label: '氧气浓度(%)', value: 'oxygen_concentration' },
          { label: '记录时间', value: 'record_time' },
          { label: '创建时间', value: 'created_at' },
        ];
      case 'inventory':
        return [
          { label: '记录ID', value: 'id' },
          { label: '区域ID', value: 'area_id' },
          { label: '区域名称', value: 'area_name' },
          { label: '总重量(吨)', value: 'total_weight' },
          { label: '垃圾类型', value: 'garbage_type' },
          { label: '堆料高度(米)', value: 'stacking_height' },
          { label: '密度(吨/立方米)', value: 'density' },
          { label: '记录时间', value: 'recorded_at' },
        ];
      case 'vehicle':
        return [
          { label: '记录ID', value: 'id' },
          { label: '车牌号', value: 'vehicle_no' },
          { label: '车辆类型', value: 'vehicle_type' },
          { label: '司机姓名', value: 'driver_name' },
          { label: '记录类型', value: 'record_type' },
          { label: '物料类型', value: 'material_type' },
          { label: '重量(吨)', value: 'weight' },
          { label: '区域ID', value: 'area_id' },
          { label: '区域名称', value: 'area_name' },
          { label: '闸口编号', value: 'gate_no' },
          { label: '进入时间', value: 'enter_time' },
          { label: '离开时间', value: 'exit_time' },
        ];
      default:
        return [];
    }
  }

  /**
   * 获取发酵数据统计
   * 
   * @description
   * 获取指定时间范围内的发酵数据统计信息
   * 包括平均值、最大值、最小值等
   * 
   * @param {Object} params - 查询参数
   * @param {string} params.startDate - 开始日期（可选，ISO格式）
   * @param {string} params.endDate - 结束日期（可选，ISO格式）
   * @param {number} params.areaId - 区域ID（可选）
   * @returns {Promise<Object>} 统计信息对象
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const stats = await dataService.getFermentationStats({
   *   startDate: '2024-01-01T00:00:00.000Z',
   *   endDate: '2024-01-31T23:59:59.999Z',
   *   areaId: 1,
   * });
   */
  async getFermentationStats(params = {}) {
    try {
      const {
        startDate,
        endDate,
        areaId,
      } = params;

      logger.info('数据服务 - 获取发酵数据统计', { params });

      // 验证时间范围
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      if (isNaN(start.getTime())) {
        throw new ValidationError('开始日期格式不正确');
      }
      if (isNaN(end.getTime())) {
        throw new ValidationError('结束日期格式不正确');
      }
      if (start > end) {
        throw new ValidationError('开始日期不能晚于结束日期');
      }

      // 获取统计数据
      const stats = await this.FermentationData.getStatistics(start, end, areaId);

      logger.info('数据服务 - 获取发酵数据统计成功', { 
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        areaId,
      });

      return {
        query: { startDate: start.toISOString(), endDate: end.toISOString(), areaId },
        statistics: stats,
      };
    } catch (error) {
      logger.error('数据服务 - 获取发酵数据统计失败', { 
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * 获取每日平均发酵数据
   * 
   * @description
   * 获取指定时间范围内的每日平均发酵数据
   * 用于趋势分析和图表展示
   * 
   * @param {Object} params - 查询参数
   * @param {string} params.startDate - 开始日期（可选，ISO格式）
   * @param {string} params.endDate - 结束日期（可选，ISO格式）
   * @param {number} params.areaId - 区域ID（可选）
   * @returns {Promise<Object>} 每日平均数据对象
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const dailyData = await dataService.getDailyFermentationData({
   *   startDate: '2024-01-01T00:00:00.000Z',
   *   endDate: '2024-01-31T23:59:59.999Z',
   *   areaId: 1,
   * });
   */
  async getDailyFermentationData(params = {}) {
    try {
      const {
        startDate,
        endDate,
        areaId,
      } = params;

      logger.info('数据服务 - 获取每日平均发酵数据', { params });

      // 验证时间范围
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      if (isNaN(start.getTime())) {
        throw new ValidationError('开始日期格式不正确');
      }
      if (isNaN(end.getTime())) {
        throw new ValidationError('结束日期格式不正确');
      }
      if (start > end) {
        throw new ValidationError('开始日期不能晚于结束日期');
      }

      // 获取每日平均数据
      const dailyData = await this.FermentationData.getDailyAverage(start, end, areaId);

      logger.info('数据服务 - 获取每日平均发酵数据成功', { 
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        areaId,
        count: dailyData.length,
      });

      return {
        query: { startDate: start.toISOString(), endDate: end.toISOString(), areaId },
        dailyData,
      };
    } catch (error) {
      logger.error('数据服务 - 获取每日平均发酵数据失败', { 
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * 获取异常发酵数据
   * 
   * @description
   * 获取温度或甲烷浓度异常的发酵数据
   * 用于安全监测和告警
   * 
   * @param {Object} params - 查询参数
   * @param {string} params.startDate - 开始日期（可选，ISO格式）
   * @param {string} params.endDate - 结束日期（可选，ISO格式）
   * @param {number} params.areaId - 区域ID（可选）
   * @param {number} params.temperatureThreshold - 温度阈值（可选，默认60）
   * @param {number} params.methaneThreshold - 甲烷浓度阈值（可选，默认20）
   * @param {number} params.limit - 返回数量限制（可选，默认50）
   * @returns {Promise<Object>} 异常数据对象
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const abnormalData = await dataService.getAbnormalFermentationData({
   *   startDate: '2024-01-01T00:00:00.000Z',
   *   endDate: '2024-01-31T23:59:59.999Z',
   *   areaId: 1,
   *   temperatureThreshold: 65,
   *   methaneThreshold: 18,
   *   limit: 100,
   * });
   */
  async getAbnormalFermentationData(params = {}) {
    try {
      const {
        startDate,
        endDate,
        areaId,
        temperatureThreshold = 60,
        methaneThreshold = 20,
        limit = 50,
      } = params;

      logger.info('数据服务 - 获取异常发酵数据', { params });

      // 验证阈值
      if (temperatureThreshold <= 0) {
        throw new ValidationError('温度阈值必须大于0');
      }
      if (methaneThreshold <= 0) {
        throw new ValidationError('甲烷浓度阈值必须大于0');
      }

      // 构建查询条件
      const where = {
        [Op.or]: [
          { temperature: { [Op.gt]: temperatureThreshold } },
          { methane_concentration: { [Op.gt]: methaneThreshold } },
        ],
      };

      // 时间范围筛选
      if (startDate || endDate) {
        where.record_time = {};

        if (startDate) {
          const start = new Date(startDate);
          if (isNaN(start.getTime())) {
            throw new ValidationError('开始日期格式不正确');
          }
          where.record_time[Op.gte] = start;
        }

        if (endDate) {
          const end = new Date(endDate);
          if (isNaN(end.getTime())) {
            throw new ValidationError('结束日期格式不正确');
          }
          where.record_time[Op.lte] = end;
        }
      }

      // 区域ID筛选
      if (areaId) {
        if (isNaN(areaId) || areaId <= 0) {
          throw new ValidationError('区域ID必须为正整数');
        }
        where.area_id = parseInt(areaId);
      }

      // 查询异常数据
      const abnormalData = await this.FermentationData.findAll({
        where,
        order: [['record_time', 'DESC']],
        limit: parseInt(limit),
      });

      // 统计异常类型
      const stats = {
        total: abnormalData.length,
        temperatureAbnormal: abnormalData.filter(item => item.temperature > temperatureThreshold).length,
        methaneAbnormal: abnormalData.filter(item => item.methane_concentration > methaneThreshold).length,
        bothAbnormal: abnormalData.filter(item => 
          item.temperature > temperatureThreshold && item.methane_concentration > methaneThreshold
        ).length,
      };

      logger.info('数据服务 - 获取异常发酵数据成功', { 
        count: abnormalData.length,
        stats,
      });

      return {
        query: params,
        stats,
        list: abnormalData.map(data => data.toJSON()),
      };
    } catch (error) {
      logger.error('数据服务 - 获取异常发酵数据失败', { 
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

// =====================================================
// 创建服务实例并导出
// =====================================================

const dataService = new DataService();

module.exports = dataService;