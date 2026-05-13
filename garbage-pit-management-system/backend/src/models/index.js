/**
 * 垃圾储坑智能化管控系统 - 数据库模型入口文件
 *
 * 该文件负责：
 * 1. 初始化 Sequelize 数据库连接
 * 2. 导入并注册所有模型文件
 * 3. 建立模型之间的关联关系
 * 4. 导出统一的 db 对象供其他模块使用
 *
 * @module models/index
 * @author 华工三峰
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config');

// =====================================================
// 1. 初始化 Sequelize 连接
// =====================================================

/**
 * Sequelize 实例
 * 使用配置文件中的数据库连接信息创建连接
 */
const sequelize = config.database.url
  ? new Sequelize(config.database.url, config.sequelize)
  : new Sequelize(
      config.database.name,
      config.database.user,
      config.database.password,
      config.sequelize
    );

/**
 * 数据库对象
 * 包含所有模型和 Sequelize 实例
 */
const db = {
  sequelize,
  Sequelize,
  DataTypes,
};

// =====================================================
// 2. 导入所有模型文件
// =====================================================

/**
 * 模型文件所在目录
 */
const modelsDir = __dirname;

/**
 * 自动导入该目录下所有的模型文件
 * 每个模型文件应该导出一个函数，接收 sequelize 和 DataTypes 参数
 */
fs.readdirSync(modelsDir)
  .filter((file) => {
    // 排除当前文件和非 JavaScript 文件
    return (
      file.indexOf('.') !== 0 &&
      file !== path.basename(__filename) &&
      file.slice(-3) === '.js'
    );
  })
  .forEach((file) => {
    /**
     * 导入模型定义
     * 模型文件应该导出一个函数: (sequelize, DataTypes) => Model
     */
    const modelPath = path.join(modelsDir, file);
    const modelDefinition = require(modelPath);
    
    // 检查模型定义是否为函数
    if (typeof modelDefinition === 'function') {
      const model = modelDefinition(sequelize, DataTypes);
      // 将模型添加到 db 对象中，使用模型名称作为键
      db[model.name] = model;
    }
  });

// =====================================================
// 3. 手动注册模型（确保所有模型都已加载）
// =====================================================

// 如果某些模型未通过自动导入加载，可以在此手动注册
// 以下是系统中所有模型的清单（按照依赖关系排序）：

/**
 * 系统中的所有模型列表
 * 用于确保所有必要的模型都已正确注册
 */
const expectedModels = [
  // 用户相关模型
  'Role',           // 角色表
  'User',           // 用户表
  'OperationLog',   // 操作日志表
  'SystemLog',      // 系统日志表
  
  // 设备相关模型
  'Crane',          // 行车表
  'Device',         // 设备表
  'DischargeDoor',  // 卸料门表
  
  // 区域相关模型
  'Area',           // 区域表
  'AreaRelation',   // 区域关系表
  
  // 告警相关模型
  'CraneAlarm',     // 行车告警表
  'LargeObjectAlarm', // 大物告警表
  'DeviceAlarm',    // 设备告警表
  
  // 任务相关模型
  'Task',           // 任务表
  'DispatchInstruction', // 调度指令表
  
  // 数据相关模型
  'FermentationData',  // 发酵数据表
  'InventoryData',     // 库存数据表
  
  // 车辆相关模型
  'VehicleRecord',     // 车辆记录表
  
  // 系统配置模型
  'SystemParameter',   // 系统参数表
  'MedicalWasteModeRecord', // 医废模式记录表
  
  // AI 相关模型
  'AIAnalysisRecord',  // AI 分析记录表
];

// =====================================================
// 4. 建立模型关联关系
// =====================================================

/**
 * 设置模型之间的关联关系
 * 包括：belongsTo, hasMany, hasOne, belongsToMany 等
 */
function setupAssociations() {
  // ---------------------------------------------
  // 4.1 用户与角色的关联关系
  // ---------------------------------------------
  
  // 用户属于一个角色 (User -> Role: n:1)
  if (db.User && db.Role) {
    // 用户属于某个角色
    db.User.belongsTo(db.Role, {
      foreignKey: 'role_id',
      as: 'role',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    
    // 一个角色拥有多个用户
    db.Role.hasMany(db.User, {
      foreignKey: 'role_id',
      as: 'users',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  }

  // ---------------------------------------------
  // 4.2 操作日志与用户的关联关系
  // ---------------------------------------------
  
  if (db.OperationLog && db.User) {
    // 操作日志属于某个用户
    db.OperationLog.belongsTo(db.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    
    // 一个用户有多条操作日志
    db.User.hasMany(db.OperationLog, {
      foreignKey: 'user_id',
      as: 'operationLogs',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  }

  // ---------------------------------------------
  // 4.3 区域与卸料门的关联关系
  // ---------------------------------------------
  
  if (db.Area && db.DischargeDoor) {
    // 卸料门属于某个区域
    db.DischargeDoor.belongsTo(db.Area, {
      foreignKey: 'area_id',
      as: 'area',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    
    // 一个区域有多个卸料门
    db.Area.hasMany(db.DischargeDoor, {
      foreignKey: 'area_id',
      as: 'dischargeDoors',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  }

  // ---------------------------------------------
  // 4.4 区域关系表的关联关系
  // ---------------------------------------------
  
  if (db.AreaRelation) {
    // 区域关系属于某个区域
    if (db.Area) {
      db.AreaRelation.belongsTo(db.Area, {
        foreignKey: 'area_id',
        as: 'area',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
      
      // 一个区域有多条区域关系记录
      db.Area.hasMany(db.AreaRelation, {
        foreignKey: 'area_id',
        as: 'areaRelations',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
    
    // 区域关系关联卸料门
    if (db.DischargeDoor) {
      db.AreaRelation.belongsTo(db.DischargeDoor, {
        foreignKey: 'discharge_door_id',
        as: 'dischargeDoor',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
      
      db.DischargeDoor.hasMany(db.AreaRelation, {
        foreignKey: 'discharge_door_id',
        as: 'areaRelations',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
    
    // 区域关系关联转料门（设备）
    if (db.Device) {
      db.AreaRelation.belongsTo(db.Device, {
        foreignKey: 'transfer_door_id',
        as: 'transferDoor',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
      
      db.Device.hasMany(db.AreaRelation, {
        foreignKey: 'transfer_door_id',
        as: 'areaRelations',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
  }

  // ---------------------------------------------
  // 4.5 行车告警的关联关系
  // ---------------------------------------------
  
  if (db.CraneAlarm) {
    // 行车告警属于某个行车
    if (db.Crane) {
      db.CraneAlarm.belongsTo(db.Crane, {
        foreignKey: 'crane_id',
        as: 'crane',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
      
      // 一个行车有多条告警记录
      db.Crane.hasMany(db.CraneAlarm, {
        foreignKey: 'crane_id',
        as: 'craneAlarms',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
    
    // 行车告警的确认人
    if (db.User) {
      db.CraneAlarm.belongsTo(db.User, {
        foreignKey: 'acknowledged_by',
        as: 'acknowledger',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
      
      db.User.hasMany(db.CraneAlarm, {
        foreignKey: 'acknowledged_by',
        as: 'acknowledgedCraneAlarms',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
  }

  // ---------------------------------------------
  // 4.6 大物告警的关联关系
  // ---------------------------------------------
  
  if (db.LargeObjectAlarm) {
    // 大物告警关联摄像头（设备）
    if (db.Device) {
      db.LargeObjectAlarm.belongsTo(db.Device, {
        foreignKey: 'camera_id',
        as: 'camera',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
      
      // 一个摄像头（设备）有多条大物告警
      db.Device.hasMany(db.LargeObjectAlarm, {
        foreignKey: 'camera_id',
        as: 'largeObjectAlarms',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
    
    // 大物告警的确认人
    if (db.User) {
      db.LargeObjectAlarm.belongsTo(db.User, {
        foreignKey: 'acknowledged_by',
        as: 'acknowledger',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
      
      db.User.hasMany(db.LargeObjectAlarm, {
        foreignKey: 'acknowledged_by',
        as: 'acknowledgedLargeObjectAlarms',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
  }

  // ---------------------------------------------
  // 4.7 设备告警的关联关系
  // ---------------------------------------------
  
  if (db.DeviceAlarm) {
    // 设备告警属于某个设备
    if (db.Device) {
      db.DeviceAlarm.belongsTo(db.Device, {
        foreignKey: 'device_id',
        as: 'device',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
      
      // 一个设备有多条告警记录
      db.Device.hasMany(db.DeviceAlarm, {
        foreignKey: 'device_id',
        as: 'deviceAlarms',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
    
    // 设备告警的确认人
    if (db.User) {
      db.DeviceAlarm.belongsTo(db.User, {
        foreignKey: 'acknowledged_by',
        as: 'acknowledger',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
      
      db.User.hasMany(db.DeviceAlarm, {
        foreignKey: 'acknowledged_by',
        as: 'acknowledgedDeviceAlarms',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
  }

  // ---------------------------------------------
  // 4.8 任务的关联关系
  // ---------------------------------------------
  
  if (db.Task) {
    // 任务属于某个行车
    if (db.Crane) {
      db.Task.belongsTo(db.Crane, {
        foreignKey: 'crane_id',
        as: 'crane',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
      
      // 一个行车有多个任务
      db.Crane.hasMany(db.Task, {
        foreignKey: 'crane_id',
        as: 'tasks',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
    
    // 任务的源区域
    if (db.Area) {
      db.Task.belongsTo(db.Area, {
        foreignKey: 'source_area_id',
        as: 'sourceArea',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
      
      // 任务的源区域有多个任务
      db.Area.hasMany(db.Task, {
        foreignKey: 'source_area_id',
        as: 'sourceTasks',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
      
      // 任务的目标区域
      db.Task.belongsTo(db.Area, {
        foreignKey: 'target_area_id',
        as: 'targetArea',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
      
      // 任务的目标区域有多个任务
      db.Area.hasMany(db.Task, {
        foreignKey: 'target_area_id',
        as: 'targetTasks',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
    
    // 任务的创建人
    if (db.User) {
      db.Task.belongsTo(db.User, {
        foreignKey: 'created_by',
        as: 'creator',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
      
      db.User.hasMany(db.Task, {
        foreignKey: 'created_by',
        as: 'createdTasks',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
  }

  // ---------------------------------------------
  // 4.9 调度指令的关联关系
  // ---------------------------------------------
  
  if (db.DispatchInstruction) {
    // 调度指令属于某个任务
    if (db.Task) {
      db.DispatchInstruction.belongsTo(db.Task, {
        foreignKey: 'task_id',
        as: 'task',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
      
      // 一个任务有多条调度指令
      db.Task.hasMany(db.DispatchInstruction, {
        foreignKey: 'task_id',
        as: 'dispatchInstructions',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
    
    // 调度指令属于某个行车
    if (db.Crane) {
      db.DispatchInstruction.belongsTo(db.Crane, {
        foreignKey: 'crane_id',
        as: 'crane',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
      
      db.Crane.hasMany(db.DispatchInstruction, {
        foreignKey: 'crane_id',
        as: 'dispatchInstructions',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
    
    // 调度指令的创建人
    if (db.User) {
      db.DispatchInstruction.belongsTo(db.User, {
        foreignKey: 'created_by',
        as: 'creator',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
      
      db.User.hasMany(db.DispatchInstruction, {
        foreignKey: 'created_by',
        as: 'createdDispatchInstructions',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
  }

  // ---------------------------------------------
  // 4.10 发酵数据的关联关系
  // ---------------------------------------------
  
  if (db.FermentationData && db.Area) {
    // 发酵数据属于某个区域
    db.FermentationData.belongsTo(db.Area, {
      foreignKey: 'area_id',
      as: 'area',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    
    // 一个区域有多条发酵数据记录
    db.Area.hasMany(db.FermentationData, {
      foreignKey: 'area_id',
      as: 'fermentationData',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }

  // ---------------------------------------------
  // 4.11 库存数据的关联关系
  // ---------------------------------------------
  
  if (db.InventoryData && db.Area) {
    // 库存数据属于某个区域
    db.InventoryData.belongsTo(db.Area, {
      foreignKey: 'area_id',
      as: 'area',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    
    // 一个区域有多条库存数据记录
    db.Area.hasMany(db.InventoryData, {
      foreignKey: 'area_id',
      as: 'inventoryData',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }

  // ---------------------------------------------
  // 4.12 车辆记录的关联关系
  // ---------------------------------------------
  
  if (db.VehicleRecord && db.Area) {
    // 车辆记录关联区域
    db.VehicleRecord.belongsTo(db.Area, {
      foreignKey: 'area_id',
      as: 'area',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    
    // 一个区域有多条车辆记录
    db.Area.hasMany(db.VehicleRecord, {
      foreignKey: 'area_id',
      as: 'vehicleRecords',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  }

  // ---------------------------------------------
  // 4.13 医废模式记录的关联关系
  // ---------------------------------------------
  
  if (db.MedicalWasteModeRecord && db.User) {
    // 医废模式记录的操作人
    db.MedicalWasteModeRecord.belongsTo(db.User, {
      foreignKey: 'operated_by',
      as: 'operator',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    
    // 一个用户有多条医废模式操作记录
    db.User.hasMany(db.MedicalWasteModeRecord, {
      foreignKey: 'operated_by',
      as: 'medicalWasteModeRecords',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  }

  // ---------------------------------------------
  // 4.14 AI分析记录的关联关系
  // ---------------------------------------------
  
  if (db.AIAnalysisRecord && db.User) {
    // AI分析记录的创建人
    db.AIAnalysisRecord.belongsTo(db.User, {
      foreignKey: 'created_by',
      as: 'creator',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    
    // 一个用户创建多条AI分析记录
    db.User.hasMany(db.AIAnalysisRecord, {
      foreignKey: 'created_by',
      as: 'aiAnalysisRecords',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  }
}

// 执行关联关系设置
setupAssociations();

// =====================================================
// 5. 数据库连接测试与同步
// =====================================================

/**
 * 测试数据库连接
 * @returns {Promise<boolean>} 连接是否成功
 */
db.testConnection = async function () {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    throw error;
  }
};

/**
 * 同步数据库模型
 * 注意：生产环境应该使用迁移(migration)而不是同步
 * @param {Object} options - 同步选项
 * @param {boolean} options.force - 是否强制同步(删除并重建表)
 * @param {boolean} options.alter - 是否自动修改表结构
 * @returns {Promise<void>}
 */
db.sync = async function (options = {}) {
  try {
    const syncOptions = {
      force: options.force || false,
      alter: options.alter || false,
    };
    
    await sequelize.sync(syncOptions);
    console.log('✅ 数据库模型同步成功');
  } catch (error) {
    console.error('❌ 数据库模型同步失败:', error.message);
    throw error;
  }
};

/**
 * 关闭数据库连接
 * @returns {Promise<void>}
 */
db.close = async function () {
  try {
    await sequelize.close();
    console.log('✅ 数据库连接已关闭');
  } catch (error) {
    console.error('❌ 关闭数据库连接失败:', error.message);
    throw error;
  }
};

/**
 * 执行原始 SQL 查询
 * @param {string} sql - SQL 语句
 * @param {Object} options - 查询选项
 * @returns {Promise<Array>} 查询结果
 */
db.query = async function (sql, options = {}) {
  try {
    const results = await sequelize.query(sql, {
      type: sequelize.QueryTypes.SELECT,
      ...options,
    });
    return results;
  } catch (error) {
    console.error('❌ SQL 查询执行失败:', error.message);
    throw error;
  }
};

/**
 * 开始事务
 * @param {Object} options - 事务选项
 * @returns {Promise<Transaction>} 事务实例
 */
db.beginTransaction = async function (options = {}) {
  return await sequelize.transaction(options);
};

/**
 * 获取所有已注册的模型名称
 * @returns {Array<string>} 模型名称列表
 */
db.getModelNames = function () {
  return Object.keys(db).filter(
    (key) => db[key] && db[key].prototype instanceof Sequelize.Model
  );
};

/**
 * 检查所有预期的模型是否都已注册
 * @returns {Object} 检查结果，包含已注册和缺失的模型
 */
db.checkModels = function () {
  const registeredModels = db.getModelNames();
  const missingModels = expectedModels.filter(
    (modelName) => !registeredModels.includes(modelName)
  );
  
  return {
    registered: registeredModels,
    expected: expectedModels,
    missing: missingModels,
    isComplete: missingModels.length === 0,
  };
};

// =====================================================
// 6. 导出 db 对象
// =====================================================

/**
 * 导出数据库对象
 *
 * 使用方式:
 * const db = require('./models');
 * const { User, Role, Crane } = db;
 *
 * 或者在模型文件中:
 * module.exports = (sequelize, DataTypes) => {
 *   const User = sequelize.define('User', { ... });
 *   return User;
 * };
 */
module.exports = db;
