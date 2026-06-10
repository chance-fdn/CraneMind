/**
 * 垃圾储坑智能化管控系统 - 后端主入口文件
 * 
 * 功能：
 * - Express 应用初始化
 * - 中间件配置
 * - 路由注册
 * - WebSocket 服务初始化
 * - 错误处理
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

// 导入配置
const config = require('./config');
const logger = require('./utils/logger');
const db = require('./models');

// 导入路由
const authRoutes = require('./routes/auth.routes');
const demoAuthRoutes = require('./routes/demo-auth.routes');
const userRoutes = require('./routes/user.routes');
const craneRoutes = require('./routes/crane.routes');
const areaRoutes = require('./routes/area.routes');
const taskRoutes = require('./routes/task.routes');
const alarmRoutes = require('./routes/alarm.routes');
const dataRoutes = require('./routes/data.routes');
const deviceRoutes = require('./routes/device.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const monitorRoutes = require('./routes/monitor.routes');
const aiRoutes = require('./routes/ai.routes');
const legacyRoutes = require('./routes/legacy.routes');

// 导入中间件
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');
const { requestLogger } = require('./middlewares/logger.middleware');
const rateLimitMiddleware = require('./middlewares/rateLimit.middleware');

// 创建 Express 应用
const app = express();
const httpServer = createServer(app);

// 创建 WebSocket 服务器
const io = new Server(httpServer, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// 基础中间件
app.use(helmet()); // 安全头设置

// 添加详细的CORS日志
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log(`🔍 CORS请求: ${req.method} ${req.path} | 来源: ${origin}`);
  next();
});

app.use(cors({
  ...config.cors,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'token']
})); // 跨域配置

app.use(compression()); // 响应压缩
app.use(express.json({ limit: '10mb' })); // JSON 解析
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL 编码解析
app.use(express.static(path.join(__dirname, '../public'))); // 静态文件

// 请求日志中间件
app.use(requestLogger);

// API 请求频率限制
app.use('/api/', rateLimitMiddleware.api);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API 路由注册
// 检查是否为演示模式，使用相应路由
const isDemoMode = process.env.DEMO_MODE === 'true' || process.env.DB_DIALECT === 'sqlite';
if (isDemoMode) {
  app.use('/api/v1/auth', demoAuthRoutes);
  console.log('🔧 演示模式：使用演示认证路由');
} else {
  app.use('/api/v1/auth', authRoutes);
  console.log('🔧 生产模式：使用标准认证路由');
}

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/cranes', craneRoutes);
app.use('/api/v1/areas', areaRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/alarms', alarmRoutes);
app.use('/api/v1/data', dataRoutes);
app.use('/api/v1/devices', deviceRoutes);
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/monitor', monitorRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/', legacyRoutes);

// 404 处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// WebSocket 连接处理
io.on('connection', (socket) => {
  logger.info(`WebSocket 客户端连接: ${socket.id}`);

  // 加入房间（按权限分组）
  socket.on('join', (room) => {
    socket.join(room);
    logger.info(`客户端 ${socket.id} 加入房间: ${room}`);
  });

  // 离开房间
  socket.on('leave', (room) => {
    socket.leave(room);
    logger.info(`客户端 ${socket.id} 离开房间: ${room}`);
  });

  // 断开连接
  socket.on('disconnect', () => {
    logger.info(`WebSocket 客户端断开: ${socket.id}`);
  });
});

// 将 io 实例挂载到 app
app.set('io', io);

// 数据库连接测试
async function testDatabaseConnection() {
  // 检查是否为演示模式
  const isDemoMode = process.env.DEMO_MODE === 'true' || process.env.DB_DIALECT === 'sqlite';
  
  if (isDemoMode) {
    logger.warn('DEMO_MODE 已启用，使用SQLite演示数据库');
    
    try {
      // 使用SQLite演示数据库
      const { initDemoMode } = require('./demo-init');
      await initDemoMode();
      logger.info('演示模式数据库初始化完成');
      return;
    } catch (error) {
      logger.error('演示模式数据库初始化失败:', error);
      // 尝试回退到原始数据库连接
      logger.info('尝试使用原始数据库连接...');
    }
  }

  try {
    await db.sequelize.authenticate();
    logger.info('数据库连接成功');
    
    // 同步模型（开发环境）
    if (process.env.NODE_ENV === 'development' || process.env.DB_SYNC === 'true') {
      await db.sequelize.sync({ alter: true });
      logger.info('数据库模型同步完成');
    }
  } catch (error) {
    logger.error('数据库连接失败:', error);
    // 如果是演示模式，尝试创建简单连接
    if (isDemoMode) {
      logger.error('演示模式数据库连接失败，系统可能无法正常工作');
    } else {
      process.exit(1);
    }
  }
}

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    await testDatabaseConnection();

    // 启动 HTTP 服务器
    const PORT = config.server.port;
    httpServer.listen(PORT, () => {
      logger.info(`服务器运行在端口 ${PORT}`);
      logger.info(`环境: ${process.env.NODE_ENV}`);
      logger.info(`API 文档: http://localhost:${PORT}/api-docs`);
    });

    // 优雅关闭
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭函数
function gracefulShutdown() {
  logger.info('收到关闭信号，开始优雅关闭...');
  
  httpServer.close(() => {
    logger.info('HTTP 服务器已关闭');
    
    // 关闭数据库连接
    db.sequelize.close().then(() => {
      logger.info('数据库连接已关闭');
      process.exit(0);
    }).catch((error) => {
      logger.error('关闭数据库连接失败:', error);
      process.exit(1);
    });
  });

  // 强制关闭超时
  setTimeout(() => {
    logger.error('优雅关闭超时，强制退出');
    process.exit(1);
  }, 10000);
}

// 导出 app 供测试使用
module.exports = app;

// 启动服务器
if (require.main === module) {
  startServer();
}
