/**
 * 垃圾储坑智能化管控系统 - 区域服务
 * 
 * 该文件实现了区域相关的业务逻辑，包括区域管理、设备控制等。
 * 服务层负责处理业务逻辑，与数据库交互，为控制器提供数据服务。
 * 
 * 主要功能：
 * 1. 区域列表查询（分页、搜索、筛选）
 * 2. 区域信息获取
 * 3. 区域创建（唯一性检查、业务验证）
 * 4. 区域信息更新
 * 5. 区域删除
 * 6. 区域设备控制（盖板、排水、清洗）
 * 
 * @module services/area.service
 * @author 华工三峰
 */

'use strict';

// 引入依赖
const { Area } = require('../models');
const { 
  ValidationError, 
  NotFoundError, 
  ConflictError,
  BusinessError,
} = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

/**
 * 区域服务类
 * 
 * @class AreaService
 */
class AreaService {
  /**
   * 构造函数
   * 
   * @constructor
   */
  constructor() {
    this.Area = Area;
  }

  /**
   * 获取区域列表
   * 
   * @description
   * 根据查询参数获取区域列表，支持分页、关键词搜索和类型/状态筛选
   * 查询结果包含区域的基本信息和状态信息
   * 
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码，默认1
   * @param {number} params.limit - 每页数量，默认10
   * @param {string} params.keyword - 关键词搜索（区域编号、区域名称）
   * @param {string} params.type - 类型筛选（stacking/feeding/transfer）
   * @param {string} params.status - 状态筛选（active/inactive/maintenance/full）
   * @returns {Promise<Object>} 分页结果对象
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const result = await areaService.getAreaList({
   *   page: 1,
   *   limit: 10,
   *   keyword: 'A001',
   *   type: 'stacking',
   *   status: 'active',
   * });
   */
  async getAreaList(params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        keyword,
        type,
        status,
      } = params;

      logger.info('区域服务 - 获取区域列表', { params });

      // 构建查询条件
      const where = {
        is_enabled: true, // 默认只查询启用的区域
      };

      // 类型筛选
      if (type) {
        where.type = type;
      }

      // 状态筛选
      if (status) {
        where.status = status;
      }

      // 关键词搜索（区域编号、区域名称）
      if (keyword) {
        where.$or = [
          { area_no: { $like: `%${keyword}%` } },
          { name: { $like: `%${keyword}%` } },
        ];
      }

      // 计算偏移量
      const offset = (page - 1) * limit;

      // 执行查询
      const { count, rows } = await this.Area.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['sort_order', 'ASC'], ['created_at', 'ASC']],
      });

      // 计算总页数
      const totalPages = Math.ceil(count / limit);

      logger.info('区域服务 - 获取区域列表成功', { 
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
        list: rows.map(area => area.toJSON()),
      };
    } catch (error) {
      logger.error('区域服务 - 获取区域列表失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 根据ID获取区域信息
   * 
   * @description
   * 根据区域ID获取区域详细信息
   * 包含区域的所有属性和计算字段
   * 
   * @param {string} id - 区域ID（UUID格式）
   * @returns {Promise<Object>} 区域信息对象
   * @throws {NotFoundError} 区域不存在
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const area = await areaService.getAreaById('123e4567-e89b-12d3-a456-426614174000');
   */
  async getAreaById(id) {
    try {
      logger.info('区域服务 - 根据ID获取区域信息', { areaId: id });

      // 查询区域
      const area = await this.Area.findByPk(id);

      // 检查区域是否存在
      if (!area) {
        logger.warn('区域服务 - 区域不存在', { areaId: id });
        throw new NotFoundError('区域不存在');
      }

      // 检查区域是否启用
      if (!area.is_enabled) {
        logger.warn('区域服务 - 区域已禁用', { areaId: id });
        throw new NotFoundError('区域不存在或已禁用');
      }

      logger.info('区域服务 - 获取区域信息成功', { areaId: id });

      return area.toJSON();
    } catch (error) {
      logger.error('区域服务 - 获取区域信息失败', { 
        areaId: id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 创建区域
   * 
   * @description
   * 创建新区域，验证区域编号的唯一性
   * 自动计算相关字段（容量百分比、预估体积等）
   * 
   * @param {Object} areaData - 区域数据
   * @param {string} areaData.areaNo - 区域编号（必填）
   * @param {string} areaData.name - 区域名称（必填）
   * @param {string} areaData.type - 区域类型（必填，stacking/feeding/transfer）
   * @param {number} areaData.coordinateX - X坐标（可选）
   * @param {number} areaData.coordinateY - Y坐标（可选）
   * @param {number} areaData.width - 宽度（可选，默认10.0）
   * @param {number} areaData.height - 长度（可选，默认20.0）
   * @param {number} areaData.depth - 深度（可选，默认5.0）
   * @param {number} areaData.maxHeight - 最大堆料高度（必填）
   * @returns {Promise<Object>} 创建的区域信息
   * @throws {ValidationError} 参数验证失败
   * @throws {ConflictError} 区域编号已存在
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const area = await areaService.createArea({
   *   areaNo: 'A001',
   *   name: '堆料区1',
   *   type: 'stacking',
   *   coordinateX: 100.5,
   *   coordinateY: 200.3,
   *   width: 15.0,
   *   height: 25.0,
   *   depth: 6.0,
   *   maxHeight: 8.0,
   * });
   */
  async createArea(areaData) {
    try {
      const {
        areaNo,
        name,
        type,
        coordinateX,
        coordinateY,
        width,
        height,
        depth,
        maxHeight,
      } = areaData;

      logger.info('区域服务 - 创建区域', { areaNo, name, type });

      // 验证必填字段
      if (!areaNo) {
        throw new ValidationError('区域编号不能为空');
      }
      if (!name) {
        throw new ValidationError('区域名称不能为空');
      }
      if (!type) {
        throw new ValidationError('区域类型不能为空');
      }
      if (!maxHeight) {
        throw new ValidationError('最大堆料高度不能为空');
      }

      // 验证区域类型
      const validTypes = ['stacking', 'feeding', 'transfer'];
      if (!validTypes.includes(type)) {
        throw new ValidationError(`区域类型无效，必须是: ${validTypes.join(', ')}`);
      }

      // 验证最大堆料高度
      if (maxHeight <= 0) {
        throw new ValidationError('最大堆料高度必须大于0');
      }

      // 检查区域编号是否已存在
      const existingArea = await this.Area.findOne({ 
        where: { area_no: areaNo } 
      });
      if (existingArea) {
        throw new ConflictError(`区域编号 "${areaNo}" 已存在`);
      }

      // 准备创建数据
      const createData = {
        area_no: areaNo,
        name,
        type,
        coordinate_x: coordinateX || null,
        coordinate_y: coordinateY || null,
        width: width || 10.0,
        height: height || 20.0,
        depth: depth || 5.0,
        max_height: maxHeight,
        current_height: 0.0, // 默认当前高度为0
        status: 'active', // 默认状态为激活
        is_enabled: true, // 默认启用
      };

      // 创建区域
      const area = await this.Area.create(createData);

      logger.info('区域服务 - 创建区域成功', { 
        areaId: area.id, 
        areaNo, 
        name 
      });

      return area.toJSON();
    } catch (error) {
      logger.error('区域服务 - 创建区域失败', { 
        areaNo: areaData.areaNo, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 更新区域信息
   * 
   * @description
   * 更新区域基本信息，不包括区域编号
   * 验证更新数据的合法性
   * 
   * @param {string} id - 区域ID
   * @param {Object} areaData - 更新数据
   * @param {string} areaData.name - 区域名称（可选）
   * @param {number} areaData.width - 宽度（可选）
   * @param {number} areaData.height - 长度（可选）
   * @param {number} areaData.depth - 深度（可选）
   * @param {number} areaData.maxHeight - 最大堆料高度（可选）
   * @returns {Promise<Object>} 更新后的区域信息
   * @throws {NotFoundError} 区域不存在
   * @throws {ValidationError} 更新数据验证失败
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const area = await areaService.updateArea('123e4567-e89b-12d3-a456-426614174000', {
   *   name: '堆料区1（更新）',
   *   width: 18.0,
   *   height: 30.0,
   *   depth: 7.0,
   *   maxHeight: 9.0,
   * });
   */
  async updateArea(id, areaData) {
    try {
      const {
        name,
        width,
        height,
        depth,
        maxHeight,
      } = areaData;

      logger.info('区域服务 - 更新区域信息', { 
        areaId: id, 
        updateData: areaData 
      });

      // 查找区域
      const area = await this.Area.findByPk(id);
      if (!area) {
        throw new NotFoundError('区域不存在');
      }

      // 检查区域是否启用
      if (!area.is_enabled) {
        throw new NotFoundError('区域不存在或已禁用');
      }

      // 准备更新数据
      const updateData = {};

      if (name !== undefined) {
        if (!name.trim()) {
          throw new ValidationError('区域名称不能为空');
        }
        updateData.name = name;
      }

      if (width !== undefined) {
        if (width <= 0) {
          throw new ValidationError('宽度必须大于0');
        }
        updateData.width = width;
      }

      if (height !== undefined) {
        if (height <= 0) {
          throw new ValidationError('长度必须大于0');
        }
        updateData.height = height;
      }

      if (depth !== undefined) {
        if (depth <= 0) {
          throw new ValidationError('深度必须大于0');
        }
        updateData.depth = depth;
      }

      if (maxHeight !== undefined) {
        if (maxHeight <= 0) {
          throw new ValidationError('最大堆料高度必须大于0');
        }
        updateData.max_height = maxHeight;
      }

      // 如果更新了最大高度，需要检查当前高度是否超过新最大高度
      if (maxHeight !== undefined && area.current_height > maxHeight) {
        logger.warn('区域服务 - 当前高度超过新最大高度', { 
          areaId: id, 
          currentHeight: area.current_height, 
          newMaxHeight: maxHeight 
        });
        // 自动调整当前高度为最大高度
        updateData.current_height = maxHeight;
      }

      // 更新区域信息
      await area.update(updateData);

      logger.info('区域服务 - 更新区域信息成功', { areaId: id });

      return area.toJSON();
    } catch (error) {
      logger.error('区域服务 - 更新区域信息失败', { 
        areaId: id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 删除区域
   * 
   * @description
   * 删除指定区域（软删除，设置is_enabled为false）
   * 注意：删除操作会禁用区域，但保留历史数据
   * 
   * @param {string} id - 区域ID
   * @returns {Promise<boolean>} 删除成功标志
   * @throws {NotFoundError} 区域不存在
   * @throws {BusinessError} 区域有关联数据无法删除
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const success = await areaService.deleteArea('123e4567-e89b-12d3-a456-426614174000');
   */
  async deleteArea(id) {
    try {
      logger.info('区域服务 - 删除区域', { areaId: id });

      // 查找区域
      const area = await this.Area.findByPk(id);
      if (!area) {
        throw new NotFoundError('区域不存在');
      }

      // 检查区域是否已禁用
      if (!area.is_enabled) {
        throw new NotFoundError('区域已删除');
      }

      // TODO: 检查区域是否有未完成的作业或关联数据
      // 这里可以添加业务逻辑检查，例如：
      // 1. 检查是否有未完成的作业
      // 2. 检查是否有未处理的告警
      // 3. 检查是否有未完成的设备控制任务
      
      // 暂时只检查当前高度是否为0（表示没有垃圾）
      if (area.current_height > 0) {
        throw new BusinessError('区域当前有垃圾，无法删除。请先清空区域后再删除。');
      }

      // 软删除：禁用区域
      await area.update({ is_enabled: false });

      logger.info('区域服务 - 删除区域成功', { areaId: id });

      return true;
    } catch (error) {
      logger.error('区域服务 - 删除区域失败', { 
        areaId: id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 控制区域设备
   * 
   * @description
   * 控制区域的相关设备，包括盖板、排水系统、清洗系统
   * 更新区域状态并记录操作日志
   * 
   * @param {string} id - 区域ID
   * @param {Object} controlData - 控制数据
   * @param {string} controlData.coverStatus - 盖板状态（uncovered/covered/partial）
   * @param {string} controlData.drainingStatus - 排水状态（normal/blocked/maintenance）
   * @param {string} controlData.cleaningStatus - 清洗状态（clean/dirty/needs_cleaning）
   * @returns {Promise<Object>} 控制结果
   * @throws {NotFoundError} 区域不存在
   * @throws {ValidationError} 控制参数验证失败
   * @throws {BusinessError} 控制操作不允许
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const result = await areaService.controlArea('123e4567-e89b-12d3-a456-426614174000', {
   *   coverStatus: 'covered',
   *   drainingStatus: 'normal',
   *   cleaningStatus: 'clean',
   * });
   */
  async controlArea(id, controlData) {
    try {
      const {
        coverStatus,
        drainingStatus,
        cleaningStatus,
      } = controlData;

      logger.info('区域服务 - 控制区域设备', { 
        areaId: id, 
        controlData 
      });

      // 验证控制数据
      if (!coverStatus && !drainingStatus && !cleaningStatus) {
        throw new ValidationError('至少需要指定一个控制参数');
      }

      // 查找区域
      const area = await this.Area.findByPk(id);
      if (!area) {
        throw new NotFoundError('区域不存在');
      }

      // 检查区域是否启用
      if (!area.is_enabled) {
        throw new NotFoundError('区域不存在或已禁用');
      }

      // 检查区域状态是否允许控制
      if (area.status === 'maintenance') {
        throw new BusinessError('区域正在维护中，无法进行设备控制');
      }

      // 准备更新数据
      const updateData = {};

      // 验证并设置盖板状态
      if (coverStatus !== undefined) {
        const validCoverStatuses = ['uncovered', 'covered', 'partial'];
        if (!validCoverStatuses.includes(coverStatus)) {
          throw new ValidationError(`盖板状态无效，必须是: ${validCoverStatuses.join(', ')}`);
        }
        updateData.cover_status = coverStatus;
      }

      // 验证并设置排水状态
      if (drainingStatus !== undefined) {
        const validDrainingStatuses = ['normal', 'blocked', 'maintenance'];
        if (!validDrainingStatuses.includes(drainingStatus)) {
          throw new ValidationError(`排水状态无效，必须是: ${validDrainingStatuses.join(', ')}`);
        }
        updateData.draining_status = drainingStatus;
      }

      // 验证并设置清洗状态
      if (cleaningStatus !== undefined) {
        const validCleaningStatuses = ['clean', 'dirty', 'needs_cleaning'];
        if (!validCleaningStatuses.includes(cleaningStatus)) {
          throw new ValidationError(`清洗状态无效，必须是: ${validCleaningStatuses.join(', ')}`);
        }
        updateData.cleaning_status = cleaningStatus;
      }

      // 更新区域设备状态
      await area.update(updateData);

      // TODO: 发送控制指令到实际设备
      // 这里可以添加设备控制逻辑，例如：
      // 1. 调用设备API发送控制指令
      // 2. 记录设备控制日志
      // 3. 监控设备执行结果

      logger.info('区域服务 - 控制区域设备成功', { 
        areaId: id, 
        controlData 
      });

      return {
        success: true,
        areaId: id,
        controlData,
        message: '区域设备控制指令已发送',
      };
    } catch (error) {
      logger.error('区域服务 - 控制区域设备失败', { 
        areaId: id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 检查区域编号是否已存在
   * 
   * @description
   * 检查区域编号是否已被其他区域使用
   * 可用于创建或更新时的区域编号验证
   * 
   * @param {string} areaNo - 区域编号
   * @param {string} excludeId - 排除的区域ID（用于更新时排除自身）
   * @returns {Promise<boolean>} 是否存在
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const exists = await areaService.isAreaNoExists('A001');
   */
  async isAreaNoExists(areaNo, excludeId = null) {
    try {
      return await this.Area.isAreaNoExists(areaNo, excludeId);
    } catch (error) {
      logger.error('区域服务 - 检查区域编号是否存在失败', { 
        areaNo, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 获取区域统计信息
   * 
   * @description
   * 获取区域总数、各类型区域数量、各状态区域数量
   * 以及总体容量统计信息
   * 
   * @returns {Promise<Object>} 统计信息
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const stats = await areaService.getAreaStats();
   */
  async getAreaStats() {
    try {
      logger.info('区域服务 - 获取区域统计信息');

      const stats = await this.Area.getStatistics();

      logger.info('区域服务 - 获取区域统计信息成功', { stats });

      return stats;
    } catch (error) {
      logger.error('区域服务 - 获取区域统计信息失败', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 查找可用的堆料区
   * 
   * @description
   * 查找所有可用（未满且状态正常）的堆料区
   * 按容量百分比升序排列，优先选择容量较低的区域
   * 
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Object>>} 可用的堆料区列表
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const availableAreas = await areaService.findAvailableStackingAreas();
   */
  async findAvailableStackingAreas(options = {}) {
    try {
      logger.info('区域服务 - 查找可用的堆料区');

      const areas = await this.Area.findAvailableStackingAreas(options);

      logger.info('区域服务 - 查找可用的堆料区成功', { 
        count: areas.length 
      });

      return areas.map(area => area.toJSON());
    } catch (error) {
      logger.error('区域服务 - 查找可用的堆料区失败', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 更新堆料高度
   * 
   * @description
   * 更新区域的当前堆料高度，并自动计算相关字段
   * 
   * @param {string} id - 区域ID
   * @param {number} newHeight - 新的堆料高度（米）
   * @returns {Promise<Object>} 更新后的区域信息
   * @throws {NotFoundError} 区域不存在
   * @throws {ValidationError} 高度值无效
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const area = await areaService.updateStackingHeight('123e4567-e89b-12d3-a456-426614174000', 3.5);
   */
  async updateStackingHeight(id, newHeight) {
    try {
      logger.info('区域服务 - 更新堆料高度', { 
        areaId: id, 
        newHeight 
      });

      // 查找区域
      const area = await this.Area.findByPk(id);
      if (!area) {
        throw new NotFoundError('区域不存在');
      }

      // 检查区域是否启用
      if (!area.is_enabled) {
        throw new NotFoundError('区域不存在或已禁用');
      }

      // 使用模型方法更新高度
      await area.updateStackingHeight(newHeight);

      logger.info('区域服务 - 更新堆料高度成功', { 
        areaId: id, 
        newHeight 
      });

      return area.toJSON();
    } catch (error) {
      logger.error('区域服务 - 更新堆料高度失败', { 
        areaId: id, 
        error: error.message 
      });
      throw error;
    }
  }
}

// =====================================================
// 创建服务实例并导出
// =====================================================

const areaService = new AreaService();

module.exports = areaService;