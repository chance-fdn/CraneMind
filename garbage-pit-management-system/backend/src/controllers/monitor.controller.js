/**
 * 垃圾储坑智能化管控系统 - 监控控制器
 * 
 * 该文件负责处理所有监控相关的业务逻辑
 * 包括：监控大屏数据获取、摄像头列表、摄像头截图等
 * 
 * @module controllers/monitor.controller
 * @author 华工三峰
 */

'use strict';

const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError } = require('../middlewares/error.middleware');
const db = require('../models');

// =====================================================
// 辅助函数
// =====================================================

/**
 * 格式化验证错误
 * 
 * @param {Array} errors - 验证错误数组
 * @returns {Object} 格式化后的错误对象
 */
const formatValidationErrors = (errors) => {
  const formatted = {};
  errors.forEach((error) => {
    formatted[error.path] = error.msg;
  });
  return formatted;
};

// =====================================================
// 控制器方法
// =====================================================

/**
 * 获取监控大屏数据
 * 
 * @description
 * 返回监控大屏所需的所有汇总数据，包括：
 * - 行车状态统计（在线、离线、运行、故障等）
 * - 区域库存统计（各区域垃圾量、堆料高度等）
 * - 告警统计（各类型告警数量、活跃告警等）
 * - 任务状态统计（待执行、执行中、已完成等）
 * 
 * @route GET /api/v1/monitor/dashboard
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const getDashboard = async (req, res, next) => {
  try {
    logger.info('获取监控大屏数据', {
      userId: req.user.id,
      username: req.user.username,
    });

    // =====================================================
    // 1. 行车状态统计
    // =====================================================
    const craneStatus = {
      // 总数
      total: 0,
      // 在线数量
      online: 0,
      // 离线数量
      offline: 0,
      // 运行中数量
      running: 0,
      // 待机数量
      standby: 0,
      // 故障数量
      fault: 0,
      // 详细列表
      list: [],
    };

    try {
      // 查询所有行车
      const cranes = await db.Crane.findAll({
        attributes: ['id', 'crane_no', 'name', 'status', 'mode', 'duty'],
        where: { is_enabled: true },
      });

      craneStatus.total = cranes.length;
      craneStatus.list = cranes.map((crane) => ({
        id: crane.id,
        craneNo: crane.crane_no,
        name: crane.name,
        status: crane.status,
        mode: crane.mode,
        duty: crane.duty,
      }));

      // 统计各状态数量
      cranes.forEach((crane) => {
        switch (crane.status) {
          case 'online':
            craneStatus.online++;
            break;
          case 'offline':
            craneStatus.offline++;
            break;
          case 'running':
            craneStatus.running++;
            break;
          case 'standby':
            craneStatus.standby++;
            break;
          case 'fault':
            craneStatus.fault++;
            break;
        }
      });
    } catch (error) {
      logger.error('获取行车状态失败', { error: error.message });
    }

    // =====================================================
    // 2. 区域库存统计
    // =====================================================
    const areaInventory = {
      // 总库存量（吨）
      totalWeight: 0,
      // 区域列表
      areas: [],
    };

    try {
      // 查询所有区域
      const areas = await db.Area.findAll({
        attributes: ['id', 'area_no', 'name', 'type', 'current_height', 'max_height'],
      });

      // 查询各区域的库存数据
      const inventoryRecords = await db.InventoryData.findAll({
        attributes: ['area_id', 'total_weight', 'stacking_height'],
        where: {
          recorded_at: db.sequelize.literal(
            "recorded_at = (SELECT MAX(recorded_at) FROM inventory_data WHERE area_id = inventory_data.area_id)"
          ),
        },
        group: ['area_id'],
      });

      // 构建库存映射
      const inventoryMap = {};
      inventoryRecords.forEach((record) => {
        inventoryMap[record.area_id] = {
          totalWeight: record.total_weight || 0,
          stackingHeight: record.stacking_height || 0,
        };
      });

      // 组装区域库存数据
      areaInventory.areas = areas.map((area) => {
        const inventory = inventoryMap[area.id] || { totalWeight: 0, stackingHeight: 0 };
        areaInventory.totalWeight += inventory.totalWeight;

        return {
          id: area.id,
          areaNo: area.area_no,
          name: area.name,
          type: area.type,
          currentHeight: area.current_height,
          maxHeight: area.max_height,
          totalWeight: inventory.totalWeight,
          stackingHeight: inventory.stackingHeight,
          // 计算填充率
          fillRate: area.max_height
            ? Math.round((area.current_height / area.max_height) * 100)
            : 0,
        };
      });
    } catch (error) {
      logger.error('获取区域库存失败', { error: error.message });
    }

    // =====================================================
    // 3. 告警统计
    // =====================================================
    const alarmStatistics = {
      // 活跃告警总数
      activeTotal: 0,
      // 严重告警
      critical: 0,
      // 主要告警
      major: 0,
      // 次要告警
      minor: 0,
      // 今日新增
      todayNew: 0,
    };

    try {
      // 查询活跃告警统计
      const craneAlarms = await db.CraneAlarm.findAll({
        attributes: [
          'alarm_level',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
        ],
        where: { status: 'active' },
        group: ['alarm_level'],
      });

      craneAlarms.forEach((alarm) => {
        const count = parseInt(alarm.dataValues.count, 10);
        alarmStatistics.activeTotal += count;

        switch (alarm.alarm_level) {
          case 'critical':
            alarmStatistics.critical = count;
            break;
          case 'major':
            alarmStatistics.major = count;
            break;
          case 'minor':
            alarmStatistics.minor = count;
            break;
        }
      });

      // 查询今日新增告警数
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayAlarms = await db.CraneAlarm.count({
        where: {
          created_at: {
            [db.Sequelize.Op.gte]: today,
          },
        },
      });

      alarmStatistics.todayNew = todayAlarms;
    } catch (error) {
      logger.error('获取告警统计失败', { error: error.message });
    }

    // =====================================================
    // 4. 任务状态统计
    // =====================================================
    const taskStatus = {
      // 待执行任务数
      pending: 0,
      // 执行中任务数
      running: 0,
      // 今日完成任务数
      completedToday: 0,
      // 今日取消任务数
      cancelledToday: 0,
      // 进行中的任务列表
      runningTasks: [],
    };

    try {
      // 查询各状态任务数量
      const taskCounts = await db.Task.findAll({
        attributes: [
          'status',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
        ],
        group: ['status'],
      });

      taskCounts.forEach((task) => {
        const count = parseInt(task.dataValues.count, 10);
        switch (task.status) {
          case 'pending':
            taskStatus.pending = count;
            break;
          case 'running':
            taskStatus.running = count;
            break;
        }
      });

      // 查询今日完成任务数
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayCompletedTasks = await db.Task.count({
        where: {
          status: 'completed',
          end_time: {
            [db.Sequelize.Op.gte]: today,
          },
        },
      });

      taskStatus.completedToday = todayCompletedTasks;

      // 查询今日取消任务数
      const todayCancelledTasks = await db.Task.count({
        where: {
          status: 'cancelled',
          updated_at: {
            [db.Sequelize.Op.gte]: today,
          },
        },
      });

      taskStatus.cancelledToday = todayCancelledTasks;

      // 查询进行中的任务详情
      const runningTasks = await db.Task.findAll({
        where: { status: 'running' },
        include: [
          {
            model: db.Crane,
            as: 'crane',
            attributes: ['id', 'crane_no', 'name'],
          },
          {
            model: db.Area,
            as: 'sourceArea',
            attributes: ['id', 'area_no', 'name'],
          },
          {
            model: db.Area,
            as: 'targetArea',
            attributes: ['id', 'area_no', 'name'],
          },
        ],
        limit: 10,
        order: [['priority', 'DESC'], ['created_at', 'ASC']],
      });

      taskStatus.runningTasks = runningTasks.map((task) => ({
        id: task.id,
        taskNo: task.task_no,
        taskType: task.task_type,
        crane: task.crane ? {
          id: task.crane.id,
          craneNo: task.crane.crane_no,
          name: task.crane.name,
        } : null,
        sourceArea: task.sourceArea ? {
          id: task.sourceArea.id,
          areaNo: task.sourceArea.area_no,
          name: task.sourceArea.name,
        } : null,
        targetArea: task.targetArea ? {
          id: task.targetArea.id,
          areaNo: task.targetArea.area_no,
          name: task.targetArea.name,
        } : null,
        weight: task.weight,
        startTime: task.start_time,
        priority: task.priority,
      }));
    } catch (error) {
      logger.error('获取任务状态失败', { error: error.message });
    }

    // =====================================================
    // 5. 返回汇总数据
    // =====================================================
    res.json({
      success: true,
      data: {
        craneStatus,
        areaInventory,
        alarmStatistics,
        taskStatus,
        timestamp: new Date().toISOString(),
      },
      message: '获取监控大屏数据成功',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取摄像头列表
 * 
 * @description
 * 获取系统中所有摄像头的列表信息
 * 支持按区域ID筛选
 * 
 * @route GET /api/v1/monitor/cameras
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const getCameras = async (req, res, next) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('输入验证失败', formatValidationErrors(errors.array()));
    }

    const { areaId } = req.query;

    logger.info('获取摄像头列表', {
      userId: req.user.id,
      username: req.user.username,
      areaId: areaId || '全部',
    });

    // 构建查询条件
    const whereClause = {
      type: 'camera',
    };

    // 如果指定了区域ID，添加筛选条件
    if (areaId) {
      whereClause.location = areaId.toString();
    }

    // 查询摄像头设备
    const cameras = await db.Device.findAll({
      where: whereClause,
      attributes: [
        'id',
        'device_no',
        'name',
        'type',
        'model',
        'location',
        'status',
        'ip_address',
        'config',
      ],
      order: [['id', 'ASC']],
    });

    // 格式化返回数据
    const cameraList = cameras.map((camera) => ({
      id: camera.id,
      deviceNo: camera.device_no,
      name: camera.name,
      model: camera.model,
      location: camera.location,
      status: camera.status,
      ipAddress: camera.ip_address,
      // 从配置中提取RTSP地址
      rtspUrl: camera.config?.rtspUrl || null,
      // 从配置中提取其他信息
      resolution: camera.config?.resolution || '1920x1080',
      fps: camera.config?.fps || 25,
    }));

    res.json({
      success: true,
      data: {
        cameras: cameraList,
        total: cameraList.length,
      },
      message: '获取摄像头列表成功',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 摄像头截图
 * 
 * @description
 * 对指定摄像头进行截图操作
 * 返回截图的URL地址
 * 
 * @route POST /api/v1/monitor/cameras/:id/capture
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const captureCamera = async (req, res, next) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('输入验证失败', formatValidationErrors(errors.array()));
    }

    const { id } = req.params;

    logger.info('摄像头截图请求', {
      userId: req.user.id,
      username: req.user.username,
      cameraId: id,
    });

    // 查询摄像头
    const camera = await db.Device.findOne({
      where: {
        id,
        type: 'camera',
      },
    });

    // 检查摄像头是否存在
    if (!camera) {
      throw new NotFoundError('摄像头不存在');
    }

    // 检查摄像头状态
    if (camera.status === 'fault') {
      throw new ValidationError('摄像头故障，无法截图');
    }

    if (camera.status === 'maintenance') {
      throw new ValidationError('摄像头维护中，无法截图');
    }

    // =====================================================
    // TODO: 实现实际的截图逻辑
    // 这里需要根据实际的摄像头协议实现截图功能
    // 例如：通过RTSP流截取帧、调用摄像头API等
    // =====================================================

    // 生成截图文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `capture_${camera.device_no}_${timestamp}.jpg`;

    // 模拟截图URL（实际应用中需要实现真实的截图存储）
    const screenshotUrl = `/uploads/captures/${fileName}`;

    // 记录操作日志
    logger.info('摄像头截图成功', {
      cameraId: camera.id,
      cameraNo: camera.device_no,
      cameraName: camera.name,
      screenshotUrl,
      operator: req.user.username,
    });

    // 返回成功响应
    res.json({
      success: true,
      data: {
        cameraId: camera.id,
        cameraNo: camera.device_no,
        cameraName: camera.name,
        imageUrl: screenshotUrl,
        capturedAt: new Date().toISOString(),
      },
      message: '截图成功',
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// 导出控制器方法
// =====================================================

module.exports = {
  getDashboard,
  getCameras,
  captureCamera,
};
