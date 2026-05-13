/**
 * 垃圾储坑智能化管控系统 - 后端配置文件
 * 
 * 该文件集中管理所有配置项，从环境变量读取配置并提供默认值
 * 配置项包括：数据库、Redis、JWT、AI服务、文件上传、日志、CORS等
 * 
 * @module config
 * @author 华工三峰
 */

require('dotenv').config();

/**
 * 应用配置对象
 */
const config = {
  /**
   * ================================
   * 服务器基础配置
   * ================================
   */
  server: {
    /** 服务端口号 */
    port: parseInt(process.env.PORT, 10) || 3000,
    /** 运行环境: development | production | test */
    env: process.env.NODE_ENV || 'development',
    /** 是否为开发环境 */
    isDev: process.env.NODE_ENV === 'development',
    /** 是否为生产环境 */
    isProd: process.env.NODE_ENV === 'production',
    /** 是否为测试环境 */
    isTest: process.env.NODE_ENV === 'test',
    /** API 版本号 */
    apiVersion: process.env.API_VERSION || 'v1',
    /** API 基础路径 */
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    /** 请求体大小限制 */
    bodyLimit: process.env.BODY_LIMIT || '10mb',
    /** 时区设置 */
    timezone: process.env.TZ || 'Asia/Shanghai',
  },

  /**
   * ================================
   * 数据库配置 (PostgreSQL)
   * ================================
   */
  database: {
    /** 数据库主机地址 */
    host: process.env.DB_HOST || 'localhost',
    /** 数据库端口号 */
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    /** 数据库名称 */
    name: process.env.DB_NAME || 'garbage_pit',
    /** 数据库用户名 */
    user: process.env.DB_USER || 'postgres',
    /** 数据库密码 */
    password: process.env.DB_PASSWORD || 'password',
    /** 数据库连接 URL (优先使用) */
    url: process.env.DATABASE_URL || null,
    /** 最小连接数 */
    poolMin: parseInt(process.env.DB_POOL_MIN, 10) || 5,
    /** 最大连接数 */
    poolMax: parseInt(process.env.DB_POOL_MAX, 10) || 20,
    /** 连接获取超时时间(毫秒) */
    poolAcquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
    /** 连接空闲超时时间(毫秒) */
    poolIdle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
    /** 是否开启 SQL 日志 (仅开发环境) */
    logging: process.env.DB_LOGGING === 'true' || false,
    /** 是否同步数据库表结构 (仅开发环境使用，生产环境必须为 false) */
    sync: process.env.DB_SYNC === 'true' || false,
  },

  /**
   * ================================
   * Redis 缓存配置
   * ================================
   */
  redis: {
    /** Redis 主机地址 */
    host: process.env.REDIS_HOST || 'localhost',
    /** Redis 端口号 */
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    /** Redis 密码 (可选) */
    password: process.env.REDIS_PASSWORD || undefined,
    /** Redis 数据库索引 */
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    /** Redis 连接 URL (优先使用) */
    url: process.env.REDIS_URL || null,
    /** 键前缀，用于区分不同应用 */
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'garbage_pit:',
    /** 默认缓存过期时间(秒) */
    defaultTTL: parseInt(process.env.REDIS_DEFAULT_TTL, 10) || 3600,
    /** 重连策略 */
    retryStrategy: {
      /** 重试次数 */
      maxRetries: parseInt(process.env.REDIS_MAX_RETRIES, 10) || 3,
      /** 重试延迟(毫秒) */
      retryDelay: parseInt(process.env.REDIS_RETRY_DELAY, 10) || 1000,
    },
  },

  /**
   * ================================
   * JWT 认证配置
   * ================================
   */
  jwt: {
    /** JWT 密钥 (生产环境必须修改) */
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    /** JWT 过期时间 */
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    /** 刷新 Token 过期时间 */
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    /** Token 签发者 */
    issuer: process.env.JWT_ISSUER || 'garbage-pit-system',
    /** Token 受众 */
    audience: process.env.JWT_AUDIENCE || 'garbage-pit-users',
    /** Token 算法 */
    algorithm: process.env.JWT_ALGORITHM || 'HS256',
    /** Token 载荷中的用户ID字段名 */
    userIdField: 'userId',
  },

  /**
   * ================================
   * AI 服务配置
   * ================================
   */
  ai: {
    /** AI API 密钥 */
    apiKey: process.env.AI_API_KEY || '',
    /** AI API 地址 */
    apiUrl: process.env.AI_API_URL || 'https://api.openai.com/v1',
    /** 使用的 AI 模型 */
    model: process.env.AI_MODEL || 'gpt-4',
    /** 备用模型 */
    fallbackModel: process.env.AI_FALLBACK_MODEL || 'gpt-3.5-turbo',
    /** 最大 Token 数 */
    maxTokens: parseInt(process.env.AI_MAX_TOKENS, 10) || 2000,
    /** 温度参数 (0-1，越高越随机) */
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
    /** 请求超时时间(毫秒) */
    timeout: parseInt(process.env.AI_TIMEOUT, 10) || 30000,
    /** 最大重试次数 */
    maxRetries: parseInt(process.env.AI_MAX_RETRIES, 10) || 3,
    /** 是否启用 AI 服务 */
    enabled: process.env.AI_ENABLED !== 'false',
    /** AI 服务类型: openai | azure | custom */
    provider: process.env.AI_PROVIDER || 'openai',
    /** 图像识别 API 端点 */
    visionEndpoint: process.env.AI_VISION_ENDPOINT || '/vision/analyze',
    /** 图像识别置信度阈值 */
    confidenceThreshold: parseFloat(process.env.AI_CONFIDENCE_THRESHOLD) || 0.8,
  },

  /**
   * ================================
   * 文件上传配置
   * ================================
   */
  upload: {
    /** 文件上传目录 */
    dir: process.env.UPLOAD_DIR || './uploads',
    /** 单个文件最大大小(字节) */
    maxSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB
    /** 允许的图片类型 */
    imageTypes: (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(','),
    /** 允许的文档类型 */
    documentTypes: (process.env.ALLOWED_DOC_TYPES || 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document').split(','),
    /** 允许的视频类型 */
    videoTypes: (process.env.ALLOWED_VIDEO_TYPES || 'video/mp4,video/mpeg,video/quicktime').split(','),
    /** 临时文件目录 */
    tempDir: process.env.UPLOAD_TEMP_DIR || './uploads/temp',
    /** 是否保留原始文件名 */
    keepOriginalName: process.env.KEEP_ORIGINAL_NAME === 'true',
    /** URL 访问路径前缀 */
    urlPrefix: process.env.UPLOAD_URL_PREFIX || '/uploads',
  },

  /**
   * ================================
   * CORS 跨域配置
   * ================================
   */
  cors: {
    /** 允许的跨域来源 (多个用逗号分隔) */
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',') 
      : ['http://localhost:5173', 'http://localhost:3000'],
    /** 允许的请求方法 */
    methods: (process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE').split(','),
    /** 允许的请求头 */
    allowedHeaders: (process.env.CORS_ALLOWED_HEADERS || 'Content-Type,Authorization,X-Requested-With,Accept,Origin').split(','),
    /** 是否允许携带凭证 (cookies) */
    credentials: process.env.CORS_CREDENTIALS !== 'false',
    /** 预检请求缓存时间(秒) */
    maxAge: parseInt(process.env.CORS_MAX_AGE, 10) || 86400,
    /** 暴露给客户端的响应头 */
    exposedHeaders: (process.env.CORS_EXPOSED_HEADERS || 'X-Total-Count,X-Page,X-Per-Page').split(','),
  },

  /**
   * ================================
   * WebSocket 配置
   * ================================
   */
  websocket: {
    /** WebSocket 端口号 */
    port: parseInt(process.env.WS_PORT, 10) || 3001,
    /** 心跳间隔(毫秒) */
    pingInterval: parseInt(process.env.WS_PING_INTERVAL, 10) || 25000,
    /** 心跳超时时间(毫秒) */
    pingTimeout: parseInt(process.env.WS_PING_TIMEOUT, 10) || 60000,
    /** 最大连接数 */
    maxConnections: parseInt(process.env.WS_MAX_CONNECTIONS, 10) || 1000,
    /** 是否启用 WebSocket */
    enabled: process.env.WS_ENABLED !== 'false',
    /** 命名空间列表 */
    namespaces: {
      /** 行车监控命名空间 */
      crane: '/crane',
      /** 告警命名空间 */
      alarm: '/alarm',
      /** 任务命名空间 */
      task: '/task',
      /** 监控命名空间 */
      monitor: '/monitor',
    },
  },

  /**
   * ================================
   * 日志配置
   * ================================
   */
  log: {
    /** 日志级别: error | warn | info | http | debug */
    level: process.env.LOG_LEVEL || 'info',
    /** 日志文件路径 */
    file: process.env.LOG_FILE || './logs/app.log',
    /** 错误日志文件路径 */
    errorFile: process.env.LOG_ERROR_FILE || './logs/error.log',
    /** 日志文件最大大小 (字节) */
    maxSize: parseInt(process.env.LOG_MAX_SIZE, 10) || 20 * 1024 * 1024, // 20MB
    /** 保留日志文件数量 */
    maxFiles: parseInt(process.env.LOG_MAX_FILES, 10) || 14,
    /** 日志格式: json | simple | combined */
    format: process.env.LOG_FORMAT || 'combined',
    /** 是否输出到控制台 */
    console: process.env.LOG_CONSOLE !== 'false',
    /** 是否记录 SQL 查询 */
    sql: process.env.LOG_SQL === 'true',
  },

  /**
   * ================================
   * 安全配置
   * ================================
   */
  security: {
    /** 密码加密轮次 */
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
    /** 是否启用 Helmet 安全头 */
    helmet: process.env.HELMET_ENABLED !== 'false',
    /** 是否启用请求频率限制 */
    rateLimit: process.env.RATE_LIMIT_ENABLED !== 'false',
    /** 请求频率限制配置 */
    rateLimitOptions: {
      /** 时间窗口(毫秒) */
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15 * 60 * 1000, // 15分钟
      /** 最大请求数 */
      max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
      /** 登录接口最大请求数 */
      loginMax: parseInt(process.env.RATE_LIMIT_LOGIN_MAX, 10) || 5,
      /** 提示消息 */
      message: process.env.RATE_LIMIT_MESSAGE || '请求过于频繁，请稍后再试',
    },
    /** 是否启用 IP 黑名单 */
    ipBlacklist: process.env.IP_BLACKLIST_ENABLED === 'true',
    /** IP 黑名单列表 */
    blacklistedIPs: process.env.IP_BLACKLIST 
      ? process.env.IP_BLACKLIST.split(',') 
      : [],
    /** 是否强制 HTTPS (生产环境建议开启) */
    forceHttps: process.env.FORCE_HTTPS === 'true',
  },

  /**
   * ================================
   * 行车配置
   * ================================
   */
  crane: {
    /** 行车数量 */
    count: parseInt(process.env.CRANE_COUNT, 10) || 3,
    /** 默认速度 (米/秒) */
    defaultSpeed: parseFloat(process.env.CRANE_DEFAULT_SPEED) || 1.5,
    /** 最大速度 (米/秒) */
    maxSpeed: parseFloat(process.env.CRANE_MAX_SPEED) || 3.0,
    /** 最大负载 (吨) */
    maxLoad: parseFloat(process.env.CRANE_MAX_LOAD) || 10.0,
    /** 安全距离 (米) */
    safetyDistance: parseFloat(process.env.CRANE_SAFETY_DISTANCE) || 2.0,
    /** 位置更新频率 (毫秒) */
    positionUpdateInterval: parseInt(process.env.CRANE_POSITION_INTERVAL, 10) || 1000,
    /** 行车编号前缀 */
    numberPrefix: process.env.CRANE_NUMBER_PREFIX || 'crane',
    /** 状态同步间隔 (毫秒) */
    statusSyncInterval: parseInt(process.env.CRANE_STATUS_SYNC_INTERVAL, 10) || 5000,
  },

  /**
   * ================================
   * 区域配置
   * ================================
   */
  area: {
    /** 区域类型 */
    types: ['stacking', 'feeding', 'transfer'],
    /** 最大堆料高度 (米) */
    maxStackingHeight: parseFloat(process.env.AREA_MAX_HEIGHT) || 8.0,
    /** 默认区域宽度 (米) */
    defaultWidth: parseFloat(process.env.AREA_DEFAULT_WIDTH) || 10.0,
    /** 默认区域长度 (米) */
    defaultLength: parseFloat(process.env.AREA_DEFAULT_LENGTH) || 20.0,
    /** 默认区域深度 (米) */
    defaultDepth: parseFloat(process.env.AREA_DEFAULT_DEPTH) || 5.0,
  },

  /**
   * ================================
   * 告警配置
   * ================================
   */
  alarm: {
    /** 告警级别 */
    levels: ['critical', 'major', 'minor', 'warning'],
    /** 告警类型 */
    types: {
      crane: ['overload', 'position_error', 'grab_slip', 'collision_warning', 'system_fault'],
      device: ['offline', 'communication_error', 'sensor_failure'],
      area: ['overflow', 'temperature_high', 'methane_high'],
    },
    /** 告警通知方式 */
    notification: {
      /** 是否启用邮件通知 */
      email: process.env.ALARM_EMAIL_ENABLED === 'true',
      /** 是否启用短信通知 */
      sms: process.env.ALARM_SMS_ENABLED === 'true',
      /** 是否启用 WebSocket 推送 */
      websocket: process.env.ALARM_WEBSOCKET_ENABLED !== 'false',
    },
    /** 告警自动确认时间(小时)，超时后自动确认 */
    autoAcknowledgeHours: parseInt(process.env.ALARM_AUTO_ACK_HOURS, 10) || 24,
  },

  /**
   * ================================
   * 任务调度配置
   * ================================
   */
  task: {
    /** 任务类型 */
    types: ['feeding', 'stacking', 'turning', 'moving'],
    /** 任务优先级范围 */
    priorityRange: {
      min: 0,
      max: 10,
    },
    /** 默认任务优先级 */
    defaultPriority: parseInt(process.env.TASK_DEFAULT_PRIORITY, 10) || 5,
    /** 任务超时时间 (分钟) */
    timeout: parseInt(process.env.TASK_TIMEOUT, 10) || 60,
    /** 最大并发任务数 */
    maxConcurrent: parseInt(process.env.TASK_MAX_CONCURRENT, 10) || 10,
    /** 任务重试次数 */
    maxRetries: parseInt(process.env.TASK_MAX_RETRIES, 10) || 3,
    /** 任务调度间隔 (毫秒) */
    scheduleInterval: parseInt(process.env.TASK_SCHEDULE_INTERVAL, 10) || 5000,
  },

  /**
   * ================================
   * 监控配置
   * ================================
   */
  monitor: {
    /** 数据采集间隔 (毫秒) */
    dataCollectionInterval: parseInt(process.env.MONITOR_DATA_INTERVAL, 10) || 5000,
    /** 发酵数据采集间隔 (毫秒) */
    fermentationInterval: parseInt(process.env.MONITOR_FERMENTATION_INTERVAL, 10) || 60000,
    /** 摄像头快照间隔 (毫秒) */
    cameraSnapshotInterval: parseInt(process.env.MONITOR_CAMERA_INTERVAL, 10) || 10000,
    /** 历史数据保留天数 */
    historyRetentionDays: parseInt(process.env.MONITOR_HISTORY_DAYS, 10) || 90,
    /** 实时数据保留天数 */
    realtimeRetentionDays: parseInt(process.env.MONITOR_REALTIME_DAYS, 10) || 7,
  },

  /**
   * ================================
   * 分页配置
   * ================================
   */
  pagination: {
    /** 默认每页数量 */
    defaultLimit: parseInt(process.env.PAGINATION_DEFAULT_LIMIT, 10) || 10,
    /** 最大每页数量 */
    maxLimit: parseInt(process.env.PAGINATION_MAX_LIMIT, 10) || 100,
    /** 默认页码 */
    defaultPage: 1,
  },

  /**
   * ================================
   * 医废模式配置
   * ================================
   */
  medicalWaste: {
    /** 是否启用医废模式 */
    enabled: process.env.MEDICAL_WASTE_ENABLED === 'true',
    /** 医废模式操作员权限 */
    requiredPermission: 'medical_waste:operate',
    /** 操作记录保留天数 */
    recordRetentionDays: parseInt(process.env.MEDICAL_WASTE_RECORD_DAYS, 10) || 365,
  },

  /**
   * ================================
   * 数据导出配置
   * ================================
   */
  export: {
    /** 支持的导出格式 */
    formats: ['excel', 'csv', 'pdf'],
    /** 单次导出最大记录数 */
    maxRecords: parseInt(process.env.EXPORT_MAX_RECORDS, 10) || 10000,
    /** 导出文件临时目录 */
    tempDir: process.env.EXPORT_TEMP_DIR || './uploads/exports',
    /** 导出文件过期时间(小时) */
    fileExpiration: parseInt(process.env.EXPORT_FILE_EXPIRATION, 10) || 24,
  },

  /**
   * ================================
   * 第三方服务配置
   * ================================
   */
  services: {
    /** 邮件服务配置 */
    email: {
      /** SMTP 服务器地址 */
      host: process.env.SMTP_HOST || 'smtp.example.com',
      /** SMTP 端口 */
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      /** 是否使用 TLS */
      secure: process.env.SMTP_SECURE === 'true',
      /** 发件人邮箱 */
      user: process.env.SMTP_USER || '',
      /** 发件人密码 */
      password: process.env.SMTP_PASSWORD || '',
      /** 发件人名称 */
      fromName: process.env.EMAIL_FROM_NAME || '垃圾储坑智能化管控系统',
      /** 发件人地址 */
      fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@example.com',
    },
    /** 短信服务配置 */
    sms: {
      /** 短信服务商 */
      provider: process.env.SMS_PROVIDER || '',
      /** API 密钥 */
      apiKey: process.env.SMS_API_KEY || '',
      /** API 密钥 */
      apiSecret: process.env.SMS_API_SECRET || '',
      /** 签名 */
      signName: process.env.SMS_SIGN_NAME || '',
    },
    /** 对象存储配置 */
    storage: {
      /** 存储类型: local | oss | s3 | cos */
      type: process.env.STORAGE_TYPE || 'local',
      /** 存储桶名称 */
      bucket: process.env.STORAGE_BUCKET || '',
      /** 存储区域 */
      region: process.env.STORAGE_REGION || '',
      /** 访问密钥 */
      accessKey: process.env.STORAGE_ACCESS_KEY || '',
      /** 私密密钥 */
      secretKey: process.env.STORAGE_SECRET_KEY || '',
      /** 自定义域名 */
      customDomain: process.env.STORAGE_CUSTOM_DOMAIN || '',
    },
  },

  /**
   * ================================
   * 健康检查配置
   * ================================
   */
  healthCheck: {
    /** 健康检查路径 */
    path: process.env.HEALTH_CHECK_PATH || '/health',
    /** 数据库检查超时(毫秒) */
    dbTimeout: parseInt(process.env.HEALTH_DB_TIMEOUT, 10) || 5000,
    /** Redis 检查超时(毫秒) */
    redisTimeout: parseInt(process.env.HEALTH_REDIS_TIMEOUT, 10) || 5000,
  },

  /**
   * ================================
   * 性能监控配置
   * ================================
   */
  performance: {
    /** 是否启用性能监控 */
    enabled: process.env.PERFORMANCE_ENABLED === 'true',
    /** 慢查询阈值(毫秒) */
    slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD, 10) || 1000,
    /** 慢请求阈值(毫秒) */
    slowRequestThreshold: parseInt(process.env.SLOW_REQUEST_THRESHOLD, 10) || 3000,
    /** 内存告警阈值(MB) */
    memoryThreshold: parseInt(process.env.MEMORY_THRESHOLD, 10) || 512,
  },
};

/**
 * 数据库连接配置 (Sequelize 格式)
 */
config.sequelize = {
  database: config.database.name,
  username: config.database.user,
  password: config.database.password,
  host: config.database.host,
  port: config.database.port,
  dialect: 'postgres',
  logging: config.database.logging ? console.log : false,
  pool: {
    max: config.database.poolMax,
    min: config.database.poolMin,
    acquire: config.database.poolAcquire,
    idle: config.database.poolIdle,
  },
  define: {
    /** 自动添加 createdAt 和 updatedAt 字段 */
    timestamps: true,
    /** 禁用默认的表名复数化 */
    freezeTableName: true,
    /** 创建人字段 */
    createdBy: 'created_by',
    /** 更新人字段 */
    updatedBy: 'updated_by',
  },
  timezone: config.server.timezone,
};

// 如果配置了数据库 URL，优先使用
if (config.database.url) {
  config.sequelize.url = config.database.url;
}

/**
 * Redis 连接配置 (ioredis 格式)
 */
config.ioredis = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  keyPrefix: config.redis.keyPrefix,
  retryStrategy: (times) => {
    if (times > config.redis.retryStrategy.maxRetries) {
      return null; // 停止重试
    }
    return config.redis.retryStrategy.retryDelay;
  },
  maxRetriesPerRequest: config.redis.retryStrategy.maxRetries,
};

// 如果配置了 Redis URL，优先使用
if (config.redis.url) {
  config.ioredis.url = config.redis.url;
}

/**
 * 获取配置值
 * @param {string} key - 配置键，支持点分隔符，如 'server.port'
 * @param {*} defaultValue - 默认值
 * @returns {*} 配置值
 */
function get(key, defaultValue = undefined) {
  const keys = key.split('.');
  let value = config;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return defaultValue;
    }
  }
  
  return value !== undefined ? value : defaultValue;
}

/**
 * 验证必要的环境变量是否配置
 * @throws {Error} 如果缺少必要配置则抛出错误
 */
function validate() {
  const requiredEnvVars = [
    { key: 'jwt.secret', name: 'JWT_SECRET', env: 'JWT_SECRET' },
  ];

  // 生产环境需要更多必要配置
  if (config.server.isProd) {
    requiredEnvVars.push(
      { key: 'database.password', name: 'DB_PASSWORD', env: 'DB_PASSWORD' },
      { key: 'jwt.secret', name: 'JWT_SECRET (生产环境必须修改默认值)', env: 'JWT_SECRET' }
    );
    
    // 检查是否使用了默认密钥
    if (config.jwt.secret === 'your-secret-key-change-in-production') {
      throw new Error('生产环境必须修改 JWT_SECRET 默认值');
    }
  }

  const missing = [];
  
  for (const item of requiredEnvVars) {
    const value = get(item.key);
    if (!value || value === '') {
      missing.push(item.name);
    }
  }

  if (missing.length > 0) {
    throw new Error(`缺少必要的环境变量配置: ${missing.join(', ')}`);
  }
}

// 导出配置
module.exports = {
  ...config,
  get,
  validate,
};
