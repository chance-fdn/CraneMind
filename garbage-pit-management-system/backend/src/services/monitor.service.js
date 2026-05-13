/**
 * 垃圾储坑智能化管控系统 - 监控服务
 * 
 * 该文件实现了监控相关的业务逻辑，包括大屏数据汇总、摄像头管理等。
 * 服务层负责处理业务逻辑，与数据库交互，为控制器提供数据服务。
 * 
 * 主要功能：
 * 1. 获取监控大屏数据（行车状态统计、区域库存统计、告警统计、任务状态统计）
 * 2. 获取摄像头列表（从设备表中查询类型为camera的设备）
 * 3. 摄像头截图（占位实现，返回模拟数据）
 * 
 * @module services/monitor.service
 * @author 华工三峰
 */

'use strict';

// 引入依赖
const { 
  Crane, 
  Area, 
  CraneAlarm, 
  Task, 
  Device,
  InventoryData,
} = require('../models');
const { 
  ValidationError, 
  NotFoundError, 
  BusinessError,
} = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

/**
 * 监控服务类
 * 
 * @class MonitorService
 */
class MonitorService {
  /**
   * 构造函数
   * 
   * @constructor
   */
  constructor() {
    this.Crane = Crane;
    this.Area = Area;
    this.CraneAlarm = CraneAlarm;
    this.Task = Task;
    this.Device = Device;
    this.InventoryData = InventoryData;
  }

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
   * @returns {Promise<Object>} 大屏数据对象
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const dashboardData = await monitorService.getDashboardData();
   */
  async getDashboardData() {
    try {
      logger.info('监控服务 - 获取监控大屏数据');

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
        const cranes = await this.Crane.findAll({
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
        logger.error('监控服务 - 获取行车状态失败', { error: error.message });
        // 不抛出错误，继续执行其他统计
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
        const areas = await this.Area.findAll({
          attributes: ['id', 'area_no', 'name', 'type', 'current_height', 'max_height'],
        });

        // 查询各区域的库存数据
        const inventoryRecords = await this.InventoryData.findAll({
          attributes: ['area_id', 'total_weight', 'stacking_height'],
          where: {
            recorded_at: this.sequelize.literal(
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
        logger.error('监控服务 - 获取区域库存失败', { error: error.message });
        // 不抛出错误，继续执行其他统计
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
        const craneAlarms = await this.CraneAlarm.findAll({
          attributes: [
            'alarm_level',
            [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count'],
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

        const todayAlarms = await this.CraneAlarm.count({
          where: {
            created_at: {
              [this.Sequelize.Op.gte]: today,
            },
          },
        });

        alarmStatistics.todayNew = todayAlarms;
      } catch (error) {
        logger.error('监控��务 - 获取告警统计失败', { error: error.message });
        // 不抛出错误，继续执行其他统计
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
        const taskCounts = await this.Task.findAll({
          attributes: [
            'status',
            [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count'],
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

        const todayCompletedTasks = await this.Task.count({
          where: {
            status: 'completed',
            end_time: {
              [this.Sequelize.Op.gte]: today,
            },
          },
        });

        taskStatus.completedToday = todayCompletedTasks;

        // 查询今日取消任务数
        const todayCancelledTasks = await this.Task.count({
          where: {
            status: 'cancelled',
            updated_at: {
              [this.Sequelize.Op.gte]: today,
            },
          },
        });

        taskStatus.cancelledToday = todayCancelledTasks;

        // 查询进行中的任务详情
        const runningTasks = await this.Task.findAll({
          where: { status: 'running' },
          include: [
            {
              model: this.Crane,
              as: 'crane',
              attributes: ['id', 'crane_no', 'name'],
            },
            {
              model: this.Area,
              as: 'sourceArea',
              attributes: ['id', 'area_no', 'name'],
            },
            {
              model: this.Area,
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
        logger.error('监控服务 - 获取任务状态失败', { error: error.message });
        // 不抛出错误，继续执行其他统计
      }

      // =====================================================
      // 5. 返回汇总数据
      // =====================================================
      const dashboardData = {
        craneStatus,
        areaInventory,
        alarmStatistics,
        taskStatus,
        timestamp: new Date().toISOString(),
      };

      logger.info('监控服务 - 获取监控大屏数据成功', {
        craneCount: craneStatus.total,
        areaCount: areaInventory.areas.length,
        activeAlarms: alarmStatistics.activeTotal,
        runningTasks: taskStatus.running,
      });

      return dashboardData;
    } catch (error) {
      logger.error('监控服务 - 获取监控大屏数据失败', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 获取摄像头列表
   * 
   * @description
   * 获取系统中所有摄像头的列表信息
   * 支持按区域ID筛选
   * 
   * @param {Object} params - 查询参数
   * @param {string} params.areaId - 区域ID（可选）
   * @returns {Promise<Object>} 摄像头列表对象
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const cameras = await monitorService.getCameras({ areaId: '1' });
   */
  async getCameras(params = {}) {
    try {
      const { areaId } = params;

      logger.info('监控服务 - 获取摄像头列表', {
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
      const cameras = await this.Device.findAll({
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

      const result = {
        cameras: cameraList,
        total: cameraList.length,
      };

      logger.info('监控服务 - 获取摄像头列表成功', {
        count: cameraList.length,
        areaId: areaId || '全部',
      });

      return result;
    } catch (error) {
      logger.error('监控服务 - 获取摄像头列表失败', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 摄像头截图
   * 
   * @description
   * 对指定摄像头进行截图操作
   * 返回截图的URL地址（占位实现）
   * 
   * @param {number} id - 摄像头ID
   * @returns {Promise<Object>} 截图结果对象
   * @throws {NotFoundError} 摄像头不存在
   * @throws {BusinessError} 摄像头状态异常
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const result = await monitorService.captureCamera(1);
   */
  async captureCamera(id) {
    try {
      logger.info('监控服务 - 摄像头截图请求', {
        cameraId: id,
      });

      // 查询摄像头
      const camera = await this.Device.findOne({
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
        throw new BusinessError('摄像头故障，无法截图');
      }

      if (camera.status === 'maintenance') {
        throw new BusinessError('摄像头维护中，无法截图');
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
      logger.info('监控服务 - 摄像头截图成功', {
        cameraId: camera.id,
        cameraNo: camera.device_no,
        cameraName: camera.name,
        screenshotUrl,
      });

      // 返回成功响应
      const result = {
        cameraId: camera.id,
        cameraNo: camera.device_no,
        cameraName: camera.name,
        imageUrl: screenshotUrl,
        capturedAt: new Date().toISOString(),
      };

      return result;
    } catch (error) {
      logger.error('监控服务 - 摄像头截图失败', { 
        cameraId: id,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 获取摄像头详情
   * 
   * @description
   * 根据摄像头ID获取摄像头详细信息
   * 
   * @param {number} id - 摄像头ID
   * @returns {Promise<Object>} 摄像头详情对象
   * @throws {NotFoundError} 摄像头不存在
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const camera = await monitorService.getCameraById(1);
   */
  async getCameraById(id) {
    try {
      logger.info('监控服务 - 获取摄像头详情', { cameraId: id });

      // 查询摄像头
      const camera = await this.Device.findOne({
        where: {
          id,
          type: 'camera',
        },
      });

      // 检查摄像头是否存在
      if (!camera) {
        throw new NotFoundError('摄像头不存在');
      }

      // 格式化返回数据
      const cameraDetail = {
        id: camera.id,
        deviceNo: camera.device_no,
        name: camera.name,
        type: camera.type,
        model: camera.model,
        location: camera.location,
        status: camera.status,
        ipAddress: camera.ip_address,
        config: camera.config,
        // 从配置中提取详细信息
        rtspUrl: camera.config?.rtspUrl || null,
        resolution: camera.config?.resolution || '1920x1080',
        fps: camera.config?.fps || 25,
        bitrate: camera.config?.bitrate || '2048kbps',
        codec: camera.config?.codec || 'H.264',
        // 其他配置信息
        manufacturer: camera.config?.manufacturer || '未知',
        installDate: camera.config?.installDate || null,
        lastMaintenance: camera.config?.lastMaintenance || null,
      };

      logger.info('监控服务 - 获取摄像头详情成功', {
        cameraId: id,
        cameraNo: camera.device_no,
      });

      return cameraDetail;
    } catch (error) {
      logger.error('监控服务 - 获取摄像头详情失败', { 
        cameraId: id,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 更新摄像头状态
   * 
   * @description
   * 更新摄像头的状态信息
   * 
   * @param {number} id - 摄像头ID
   * @param {Object} statusData - 状态数据
   * @param {string} statusData.status - 新状态（normal/fault/maintenance）
   * @returns {Promise<Object>} 更新后的摄像头信息
   * @throws {NotFoundError} 摄像头不存在
   * @throws {ValidationError} 参数验证失败
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const camera = await monitorService.updateCameraStatus(1, { status: 'fault' });
   */
  async updateCameraStatus(id, statusData) {
    try {
      const { status } = statusData;

      logger.info('监控服务 - 更新摄像头状态', { 
        cameraId: id, 
        statusData 
      });

      // 查询摄像头
      const camera = await this.Device.findOne({
        where: {
          id,
          type: 'camera',
        },
      });

      // 检查摄像头是否存在
      if (!camera) {
        throw new NotFoundError('摄像头不存在');
      }

      // 验证状态值
      const validStatuses = ['normal', 'fault', 'maintenance'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError(`状态值无效，必须是: ${validStatuses.join(', ')}`);
      }

      // 更新状态
      await camera.update({ status });

      logger.info('监控服务 - 更新摄像头状态成功', { 
        cameraId: id, 
        cameraNo: camera.device_no, 
        status 
      });

      return camera;
    } catch (error) {
      logger.error('监控服务 - 更新摄像头状态失败', { 
        cameraId: id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 获取监控统计信息
   * 
   * @description
   * 获取监控相关的统计信息
   * 
   * @returns {Promise<Object>} 监控统计信息
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const stats = await monitorService.getMonitorStatistics();
   */
  async getMonitorStatistics() {
    try {
      logger.info('监控服务 - 获取监控统计信息');

      // 获取摄像头总数
      const cameraCount = await this.Device.count({
        where: { type: 'camera' },
      });

      // 获取正常工作的摄像头数量
      const normalCameraCount = await this.Device.count({
        where: { 
          type: 'camera',
          status: 'normal',
        },
      });

      // 获取故障摄像头数量
      const faultCameraCount = await this.Device.count({
        where: { 
          type: 'camera',
          status: 'fault',
        },
      });

      // 获取维护中的摄像头数量
      const maintenanceCameraCount = await this.Device.count({
        where: { 
          type: 'camera',
          status: 'maintenance',
        },
      });

      // 获取今日截图次数（模拟数据）
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // TODO: 实际应用中需要记录截图日志
      const todayCaptureCount = 0;

      const statistics = {
        camera: {
          total: cameraCount,
          normal: normalCameraCount,
          fault: faultCameraCount,
          maintenance: maintenanceCameraCount,
          availability: cameraCount > 0 ? Math.round((normalCameraCount / cameraCount) * 100) : 0,
        },
        capture: {
          today: todayCaptureCount,
          // 模拟历史数据
          last7Days: [12, 15, 18, 20, 22, 25, 28],
        },
        timestamp: new Date().toISOString(),
      };

      logger.info('监控服务 - 获取监控统计信息成功', { statistics });

      return statistics;
    } catch (error) {
      logger.error('监控服务 - 获取监控统计信息失败', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 获取区域摄像头分布
   * 
   * @description
   * 获取各区域的摄像头分布情况
   * 
   * @returns {Promise<Array<Object>>} 区域摄像头分布列表
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const distribution = await monitorService.getCameraDistribution();
   */
  async getCameraDistribution() {
    try {
      logger.info('监控服务 - 获取区域摄像头分布');

      // 查询所有区域
      const areas = await this.Area.findAll({
        attributes: ['id', 'area_no', 'name', 'type'],
      });

      // 查询所有摄像头
      const cameras = await this.Device.findAll({
        where: { type: 'camera' },
        attributes: ['id', 'device_no', 'name', 'location', 'status'],
      });

      // 构建区域摄像头分布
      const distribution = areas.map((area) => {
        // 查找属于该区域的摄像头
        const areaCameras = cameras.filter((camera) => 
          camera.location === area.id.toString()
        );

        // 统计各状态摄像头数量
        const normalCount = areaCameras.filter(c => c.status === 'normal').length;
        const faultCount = areaCameras.filter(c => c.status === 'fault').length;
        const maintenanceCount = areaCameras.filter(c => c.status === 'maintenance').length;

        return {
          areaId: area.id,
          areaNo: area.area_no,
          areaName: area.name,
          areaType: area.type,
          cameraCount: areaCameras.length,
          normalCount,
          faultCount,
          maintenanceCount,
          availability: areaCameras.length > 0 ? Math.round((normalCount / areaCameras.length) * 100) : 0,
          cameras: areaCameras.map(camera => ({
            id: camera.id,
            deviceNo: camera.device_no,
            name: camera.name,
            status: camera.status,
          })),
        };
      });

      logger.info('监控服务 - 获取区域摄像头分布成功', {
        areaCount: distribution.length,
        totalCameras: cameras.length,
      });

      return distribution;
    } catch (error) {
      logger.error('监控服务 - 获取区域摄像头分布失败', { 
        error: error.message 
      });
      throw error;
    }
  }
}

// =====================================================
// 创建服务实例并导出
// =====================================================

const monitorService = new MonitorService();

module.exports = monitorService;