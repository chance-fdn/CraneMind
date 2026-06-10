/**
 * 演示模式数据库初始化脚本
 * 使用SQLite内存数据库快速启动系统
 */

const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

// 创建数据目录
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 使用SQLite内存数据库
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(dataDir, 'demo.db'),
  logging: console.log,
});

// 简单的演示模式初始化
async function initDemoMode() {
  console.log('🔧 初始化演示模式...');
  
  try {
    // 测试连接
    await sequelize.authenticate();
    console.log('✅ SQLite数据库连接成功');
    
    // 创建角色和用户表的简单版本
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        permissions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        real_name TEXT,
        role_id INTEGER,
        status TEXT DEFAULT 'active',
        last_login_at DATETIME,
        last_login_ip TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      );
    `);
    
    console.log('✅ 创建演示表结构');
    
    // 添加演示角色
    const [roleResult] = await sequelize.query(`
      INSERT OR IGNORE INTO roles (name, code, permissions) 
      VALUES (?, ?, ?)
    `, {
      replacements: [
        '系统管理员',
        'admin',
        JSON.stringify({
          system: ['*'],
          crane: ['*'],
          task: ['*'],
          user: ['*'],
          area: ['*']
        })
      ]
    });
    
    console.log('✅ 创建管理员角色');
    
    // 添加演示用户 (密码: admin123456)
    const hashedPassword = '$2a$10$3pX0avRiBf2tzAk24ENT1OkJeUNpFSunAbM6wlIZ2HOPwEcyhb.yK'; // admin123456
    await sequelize.query(`
      INSERT OR IGNORE INTO users (username, password, email, real_name, role_id, status) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        'admin',
        hashedPassword,
        'admin@example.com',
        '系统管理员',
        1,
        'active'
      ]
    });
    
    console.log('✅ 创建演示用户');
    console.log('📋 登录信息:');
    console.log('   用户名: admin');
    console.log('   密码: admin123456');
    
    // 创建其他必要的演示表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS cranes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'idle',
        current_x REAL,
        current_y REAL,
        current_z REAL,
        speed REAL DEFAULT 1.5,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS areas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        width REAL,
        length REAL,
        depth REAL,
        current_volume REAL DEFAULT 0,
        max_volume REAL,
        status TEXT DEFAULT 'normal',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ 创建行车和区域表');
    
    // 添加一些演示数据
    await sequelize.query(`
      INSERT OR IGNORE INTO cranes (number, name, status, current_x, current_y, current_z) 
      VALUES 
        ('crane-01', '1号行车', 'idle', 10.5, 20.3, 5.2),
        ('crane-02', '2号行车', 'working', 15.8, 18.7, 6.1),
        ('crane-03', '3号行车', 'maintenance', 8.2, 22.4, 5.8)
    `);
    
    await sequelize.query(`
      INSERT OR IGNORE INTO areas (name, type, width, length, depth, max_volume) 
      VALUES 
        ('堆料区-A', 'stacking', 20, 30, 6, 3600),
        ('堆料区-B', 'stacking', 18, 25, 5, 2250),
        ('喂料区-1', 'feeding', 10, 15, 4, 600),
        ('喂料区-2', 'feeding', 12, 18, 4, 864),
        ('转运区', 'transfer', 8, 10, 3, 240)
    `);
    
    console.log('✅ 添加演示数据');
    console.log('🎉 演示模式初始化完成！');
    
    return sequelize;
    
  } catch (error) {
    console.error('❌ 演示模式初始化失败:', error.message);
    throw error;
  }
}

// 导出函数
module.exports = { initDemoMode, sequelize };

// 如果直接运行此脚本
if (require.main === module) {
  initDemoMode().catch((error) => {
    console.error('初始化失败:', error);
    process.exit(1);
  });
}