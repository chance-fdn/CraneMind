/**
 * 垃圾储坑智能化管控系统 - 设备控制器
 * 
 * 该文件负责处理所有设备管理相关的业务逻辑
 * 包括：设备列表查询、设备详情、设备创建、设备更新、设备删除等
 * 
 * @module controllers/device.controller
 * @author 华工三峰
 */

'use strict';

const { validationResult } = require('express-validator');
const { ValidationError, NotFoundError, ConflictError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');
const db = require('../models');

// =====================================================
// 辅助函数
// =====================================================

/**
 * 构建设备查询条件
 * 
 * @param {Object} queryParams - 查询参数
 * @param {string} [queryParams.type] - 设备类型
 * @param {string} [queryParams.status] - 设备状态
 * @returns {Object} Sequelize查询条件对象
 */
const buildWhereClause = (queryParams) => {
  const where = {};
  
  // 设备类型筛选
  if (queryParams.type) {
    where.type = queryParams.type;
  }
  
  // 设备状态筛选
  if (queryParams.status) {
    where.status = queryParams.status;
  }
  
  return where;
};

/**
 * 格式化设备响应数据
 * 将数据库字段转换为驼峰命名
 * 
 * @param {Object} device - 设备数据对象
 * @returns {Object} 格式化后的设备数据
 */
const formatDeviceResponse = (device) => {
  if (!device) return null;
  
  return {
    id: device.id,
    deviceNo: device.device_no,
    name: device.name,
    type: device.type,
    model: device.model,
    manufacturer: device.manufacturer,
    installDate: device.install_date,
    location: device.location,
    areaId: device.area_id,
    position: {
      x: device.position_x,
      y: device.position_y,
      z: device.position_z,
    },
    status: device.status,
    ipAddress: device.ip_address,
    port: device.port,
    config: device.config || {},
    description: device.description,
    isEnabled: device.is_enabled,
    lastHeartbeat: device.last_heartbeat,
    lastMaintenanceDate: device.last_maintenance_date,
    nextMaintenanceDate: device.next_maintenance_date,
    createdAt: device.created_at,
    updatedAt: device.updated_at,
  };
};

// =====================================================
// 控制器方法
// =====================================================

/**
 * 获取设备列表
 * 
 * @route GET /api/v1/devices
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const getDevices = async (req, res, next) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('输入验证失败', errors.array());
    }
    
    // 构建查询条件
    const where = buildWhereClause(req.query);
    
    // 查询设备列表
    const devices = await db.Device.findAll({
      where,
      order: [['device_no', 'ASC']],
      attributes: { exclude: ['created_by', 'updated_by'] },
    });
    
    // 记录查询日志
    logger.info('查询设备列表', {
      userId: req.user?.id,
      query: req.query,
      count: devices.length,
    });
    
    // 返回成功响应
    res.json({
      success: true,
      data: devices.map(formatDeviceResponse),
      message: '获取设备列表成功',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取单个设备信息
 * 
 * @route GET /api/v1/devices/:id
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const getDeviceById = async (req, res, next) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('输入验证失败', errors.array());
    }
    
    const { id } = req.params;
    
    // 查询设备
    const device = await db.Device.findByPk(id, {
      attributes: { exclude: ['created_by', 'updated_by'] },
    });
    
    // 检查设备是否存在
    if (!device) {
      throw new NotFoundError(`设备不存在 (ID: ${id})`);
    }
    
    // 记录查询日志
    logger.info('查询设备详情', {
      userId: req.user?.id,
      deviceId: id,
      deviceNo: device.device_no,
    });
    
    // 返回成功响应
    res.json({
      success: true,
      data: formatDeviceResponse(device),
      message: '获取设备信息成功',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 创建设备
 * 
 * @route POST /api/v1/devices
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const createDevice = async (req, res, next) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('输入验证失败', errors.array());
    }
    
    const {
      deviceNo,
      name,
      type,
      model,
      manufacturer,
      installDate,
      location,
      ipAddress,
      port,
      config,
    } = req.body;
    
    // 检查设备编号是否已存在
    const existingDevice = await db.Device.findByDeviceNo(deviceNo);
    if (existingDevice) {
      throw new ConflictError(`设备编号已存在: ${deviceNo}`);
    }
    
    // 创建设备
    const device = await db.Device.create({
      device_no: deviceNo,
      name,
      type,
      model: model || null,
      manufacturer: manufacturer || null,
      install_date: installDate || null,
      location: location || null,
      ip_address: ipAddress || null,
      port: port || null,
      config: config || {},
      status: 'offline', // 新建设备默认为离线状态
      is_enabled: true, // 新建设备默认启用
      created_by: req.user?.id,
    });
    
    // 记录创建日志
    logger.info('创建设备成功', {
      userId: req.user?.id,
      deviceId: device.id,
      deviceNo: device.device_no,
      deviceName: device.name,
      deviceType: device.type,
    });
    
    // 返回成功响应
    res.status(201).json({
      success: true,
      data: formatDeviceResponse(device),
      message: '创建设备成功',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新设备
 * 
 * @route PUT /api/v1/devices/:id
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const updateDevice = async (req, res, next) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('输入验证失败', errors.array());
    }
    
    const { id } = req.params;
    const {
      name,
      model,
      manufacturer,
      location,
      status,
      config,
    } = req.body;
    
    // 查询设备
    const device = await db.Device.findByPk(id);
    
    // 检查设备是否存在
    if (!device) {
      throw new NotFoundError(`设备不存在 (ID: ${id})`);
    }
    
    // 构建更新数据
    const updateData = {
      updated_by: req.user?.id,
    };
    
    // 只更新提供的字段
    if (name !== undefined) updateData.name = name;
    if (model !== undefined) updateData.model = model;
    if (manufacturer !== undefined) updateData.manufacturer = manufacturer;
    if (location !== undefined) updateData.location = location;
    if (status !== undefined) updateData.status = status;
    if (config !== undefined) {
      // 合并配置信息
      updateData.config = {
        ...device.config,
        ...config,
      };
    }
    
    // 更新设备
    await device.update(updateData);
    
    // 记录更新日志
    logger.info('更新设备成功', {
      userId: req.user?.id,
      deviceId: device.id,
      deviceNo: device.device_no,
      updatedFields: Object.keys(updateData).filter(key => key !== 'updated_by'),
    });
    
    // 返回成功响应
    res.json({
      success: true,
      data: formatDeviceResponse(device),
      message: '更新设备成功',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 删除设备
 * 
 * @route DELETE /api/v1/devices/:id
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const deleteDevice = async (req, res, next) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('输入验证失败', errors.array());
    }
    
    const { id } = req.params;
    
    // 查询设备
    const device = await db.Device.findByPk(id);
    
    // 检查设备是否存在
    if (!device) {
      throw new NotFoundError(`设备不存在 (ID: ${id})`);
    }
    
    // 保存设备信息用于日志记录
    const deviceInfo = {
      id: device.id,
      deviceNo: device.device_no,
      name: device.name,
      type: device.type,
    };
    
    // 删除设备
    await device.destroy();
    
    // 记录删除日志
    logger.info('删除设备成功', {
      userId: req.user?.id,
      deviceId: deviceInfo.id,
      deviceNo: deviceInfo.deviceNo,
      deviceName: deviceInfo.name,
    });
    
    // 返回成功响应
    res.json({
      success: true,
      message: '删除设备成功',
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// 导出控制器方法
// =====================================================

module.exports = {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
};
