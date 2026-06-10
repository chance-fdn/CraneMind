/**
 * 演示模式配置
 * 覆盖默认配置以支持SQLite和内存Redis
 */

const originalConfig = require('./index');

// 修改数据库配置为SQLite
const demoConfig = {
  ...originalConfig,
  database: {
    ...originalConfig.database,
    dialect: 'sqlite',
    storage: './data/demo.db',
    logging: true,
    sync: true,
  },
  
  sequelize: {
    dialect: 'sqlite',
    storage: './data/demo.db',
    logging: true,
  },
  
  // 禁用AI服务
  ai: {
    ...originalConfig.ai,
    enabled: false,
  },
};

module.exports = demoConfig;