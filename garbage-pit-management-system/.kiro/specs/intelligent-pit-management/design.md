# 垃圾储坑智能化管控系统设计文档

## 1. 系统架构设计

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层 (Frontend)                      │
│  Vue 3 + TypeScript + Vite + Pinia + Vue Router            │
│  Three.js + ECharts + HTML5 Video                          │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/WebSocket
┌─────────────────────┴───────────────────────────────────────┐
│                      后端层 (Backend)                         │
│  Node.js + Express + Socket.io                              │
│  JWT Authentication + RBAC                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────┴──────┐ ┌───┴────┐ ┌──────┴──────┐
│ PostgreSQL   │ │ Redis  │ │  AI Service │
│ (持久化存储)  │ │ (缓存) │ │  (LLM API)  │
└──────────────┘ └────────┘ └─────────────┘
```

### 1.2 技术栈选型说明

#### 1.2.1 前端技术栈
- **Vue 3**: 组件化开发，响应式数据绑定
- **TypeScript**: 类型安全，提高代码质量
- **Vite**: 快速开发构建工具
- **Pinia**: 新一代状态管理，简化状态管理
- **Vue Router**: 单页应用路由管理
- **Three.js**: 3D 可视化渲染
- **ECharts**: 图表可视化
- **Socket.io-client**: WebSocket 客户端

#### 1.2.2 后端技术栈
- **Node.js**: JavaScript 运行时，适合 I/O 密集型应用
- **Express**: 轻量级 Web 框架
- **Socket.io**: 实时通信
- **jsonwebtoken**: JWT 身份验证
- **bcryptjs**: 密码加密
- **Sequelize**: PostgreSQL ORM
- **ioredis**: Redis 客户端

#### 1.2.3 数据库技术栈
- **PostgreSQL**: 关系型数据库，支持复杂查询
- **Redis**: 内存数据库，用于缓存和实时状态

### 1.3 系统模块设计

```
┌─────────────────────────────────────────────────────────────┐
│                       系统模块架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  用户模块    │  │  权限模块    │  │  日志模块    │      │
│  │ (User)       │  │ (Permission) │  │ (Log)        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  行车模块    │  │  区域模块    │  │  告警模块    │      │
│  │ (Crane)      │  │ (Area)       │  │ (Alarm)      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  任务模块    │  │  设备模块    │  │  车辆模块    │      │
│  │ (Task)       │  │ (Device)     │  │ (Vehicle)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  监控模块    │  │  数据模块    │  │  AI 模块     │      │
│  │ (Monitor)    │  │ (Data)       │  │ (AI)         │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 2. 数据库设计

### 2.1 数据库表结构设计

#### 2.1.1 用户相关表

##### 用户表 (users)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    real_name VARCHAR(50),
    role_id INTEGER REFERENCES roles(id),
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, locked
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### 角色表 (roles)
```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- operator, admin, super_admin
    description TEXT,
    permissions JSONB, -- 权限列表
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### 操作日志表 (operation_logs)
```sql
CREATE TABLE operation_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50),
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_url TEXT,
    request_method VARCHAR(10),
    request_params TEXT,
    response_status INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### 系统日志表 (system_logs)
```sql
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL, -- error, warn, info, debug
    module VARCHAR(50),
    message TEXT,
    stack_trace TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.1.2 设备相关表

##### 行车表 (cranes)
```sql
CREATE TABLE cranes (
    id SERIAL PRIMARY KEY,
    crane_no VARCHAR(20) UNIQUE NOT NULL, -- crane01, crane02, crane03
    name VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'offline', -- online, offline, running, standby, fault
    mode VARCHAR(20) DEFAULT 'auto', -- auto, manual
    current_position_x DECIMAL(10, 2),
    current_position_y DECIMAL(10, 2),
    current_position_z DECIMAL(10, 2),
    grab_status VARCHAR(20), -- open, closed, moving
    load_weight DECIMAL(10, 2),
    speed DECIMAL(10, 2),
    duty VARCHAR(50), -- 投料, 堆料, 翻料, 移料
    is_enabled BOOLEAN DEFAULT true,
    emergency_stop BOOLEAN DEFAULT false,
    last_maintenance_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### 设备表 (devices)
```sql
CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    device_no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- crane, discharge_door, transfer_door, camera, sensor
    model VARCHAR(100),
    manufacturer VARCHAR(100),
    install_date DATE,
    location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'normal', -- normal, fault, maintenance
    ip_address VARCHAR(45),
    port INTEGER,
    config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### 卸料门表 (discharge_doors)
```sql
CREATE TABLE discharge_doors (
    id SERIAL PRIMARY KEY,
    door_no VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'closed', -- open, closed, opening, closing
    mode VARCHAR(20) DEFAULT 'auto', -- auto, manual
    area_id INTEGER REFERENCES areas(id),
    is_enabled BOOLEAN DEFAULT true,
    last_operation_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.1.3 区域相关表

##### 区域表 (areas)
```sql
CREATE TABLE areas (
    id SERIAL PRIMARY KEY,
    area_no VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL, -- stacking, feeding, transfer
    coordinate_x DECIMAL(10, 2),
    coordinate_y DECIMAL(10, 2),
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    depth DECIMAL(10, 2),
    current_height DECIMAL(10, 2), -- 当前堆料高度
    max_height DECIMAL(10, 2),
    cover_status VARCHAR(20) DEFAULT 'closed', -- open, closed
    draining_status VARCHAR(20) DEFAULT 'closed', -- open, closed
    cleaning_status VARCHAR(20) DEFAULT 'closed', -- open, closed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### 区域关系表 (area_relations)
```sql
CREATE TABLE area_relations (
    id SERIAL PRIMARY KEY,
    area_id INTEGER REFERENCES areas(id),
    discharge_door_id INTEGER REFERENCES discharge_doors(id),
    transfer_door_id INTEGER REFERENCES devices(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.1.4 告警相关表

##### 行车告警表 (crane_alarms)
```sql
CREATE TABLE crane_alarms (
    id SERIAL PRIMARY KEY,
    crane_id INTEGER REFERENCES cranes(id),
    alarm_type VARCHAR(50) NOT NULL, -- overload, position_error, grab_slip
    alarm_level VARCHAR(20) NOT NULL, -- critical, major, minor
    message TEXT,
    position_x DECIMAL(10, 2),
    position_y DECIMAL(10, 2),
    sensor_data JSONB,
    status VARCHAR(20) DEFAULT 'active', -- active, acknowledged, resolved
    acknowledged_by INTEGER REFERENCES users(id),
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### 大物告警表 (large_object_alarms)
```sql
CREATE TABLE large_object_alarms (
    id SERIAL PRIMARY KEY,
    camera_id INTEGER REFERENCES devices(id),
    image_url TEXT,
    detected_objects JSONB,
    confidence DECIMAL(5, 4),
    status VARCHAR(20) DEFAULT 'active',
    acknowledged_by INTEGER REFERENCES users(id),
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### 设备告警表 (device_alarms)
```sql
CREATE TABLE device_alarms (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(id),
    alarm_type VARCHAR(50) NOT NULL,
    alarm_level VARCHAR(20) NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'active',
    acknowledged_by INTEGER REFERENCES users(id),
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.1.5 任务相关表

##### 任务表 (tasks)
```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    task_no VARCHAR(50) UNIQUE NOT NULL,
    crane_id INTEGER REFERENCES cranes(id),
    task_type VARCHAR(50) NOT NULL, -- feeding, stacking, turning, moving
    source_area_id INTEGER REFERENCES areas(id),
    target_area_id INTEGER REFERENCES areas(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, running, completed, cancelled
    priority INTEGER DEFAULT 0,
    weight DECIMAL(10, 2),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration INTEGER, -- 秒
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### 调度指令表 (dispatch_instructions)
```sql
CREATE TABLE dispatch_instructions (
    id SERIAL PRIMARY KEY,
    instruction_no VARCHAR(50) UNIQUE NOT NULL,
    task_id INTEGER REFERENCES tasks(id),
    crane_id INTEGER REFERENCES cranes(id),
    instruction_type VARCHAR(50) NOT NULL,
    content TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, executed, failed
    sent_at TIMESTAMP,
    executed_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.1.6 数据相关表

##### 发酵数据表 (fermentation_data)
```sql
CREATE TABLE fermentation_data (
    id SERIAL PRIMARY KEY,
    area_id INTEGER REFERENCES areas(id),
    temperature DECIMAL(10, 2),
    humidity DECIMAL(10, 2),
    methane_concentration DECIMAL(10, 2),
    ph_value DECIMAL(5, 2),
    oxygen_concentration DECIMAL(10, 2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### 库存数据表 (inventory_data)
```sql
CREATE TABLE inventory_data (
    id SERIAL PRIMARY KEY,
    area_id INTEGER REFERENCES areas(id),
    total_weight DECIMAL(10, 2),
    garbage_type VARCHAR(50),
    stacking_height DECIMAL(10, 2),
    density DECIMAL(10, 4),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.1.7 车辆相关表

##### 车辆记录表 (vehicle_records)
```sql
CREATE TABLE vehicle_records (
    id SERIAL PRIMARY KEY,
    vehicle_no VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(50),
    driver_name VARCHAR(50),
    record_type VARCHAR(20) NOT NULL, -- discharge, enter, exit, transport
    material_type VARCHAR(50),
    weight DECIMAL(10, 2),
    area_id INTEGER REFERENCES areas(id),
    gate_no VARCHAR(20),
    enter_time TIMESTAMP,
    exit_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.1.8 系统配置表

##### 系统参数表 (system_parameters)
```sql
CREATE TABLE system_parameters (
    id SERIAL PRIMARY KEY,
    param_key VARCHAR(100) UNIQUE NOT NULL,
    param_value TEXT,
    param_type VARCHAR(20), -- string, number, boolean, json
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### 医废模式记录表 (medical_waste_mode_records)
```sql
CREATE TABLE medical_waste_mode_records (
    id SERIAL PRIMARY KEY,
    mode_status VARCHAR(20) NOT NULL, -- on, off
    operated_by INTEGER REFERENCES users(id),
    operated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.1.9 AI 相关表

##### AI 分析记录表 (ai_analysis_records)
```sql
CREATE TABLE ai_analysis_records (
    id SERIAL PRIMARY KEY,
    analysis_type VARCHAR(50) NOT NULL, -- fermentation, alarm_diagnosis, schedule_optimization
    input_data JSONB,
    output_data JSONB,
    model_name VARCHAR(100),
    tokens_used INTEGER,
    cost DECIMAL(10, 4),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 索引设计

```sql
-- 用户表索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);

-- 行车表索引
CREATE INDEX idx_cranes_crane_no ON cranes(crane_no);
CREATE INDEX idx_cranes_status ON cranes(status);

-- 区域表索引
CREATE INDEX idx_areas_area_no ON areas(area_no);
CREATE INDEX idx_areas_type ON areas(type);

-- 告警表索引
CREATE INDEX idx_crane_alarms_crane_id ON crane_alarms(crane_id);
CREATE INDEX idx_crane_alarms_status ON crane_alarms(status);
CREATE INDEX idx_crane_alarms_created_at ON crane_alarms(created_at);

-- 任务表索引
CREATE INDEX idx_tasks_task_no ON tasks(task_no);
CREATE INDEX idx_tasks_crane_id ON tasks(crane_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

-- 发酵数据表索引
CREATE INDEX idx_fermentation_data_area_id ON fermentation_data(area_id);
CREATE INDEX idx_fermentation_data_recorded_at ON fermentation_data(recorded_at);

-- 车辆记录表索引
CREATE INDEX idx_vehicle_records_vehicle_no ON vehicle_records(vehicle_no);
CREATE INDEX idx_vehicle_records_record_type ON vehicle_records(record_type);
CREATE INDEX idx_vehicle_records_created_at ON vehicle_records(created_at);

-- 日志表索引
CREATE INDEX idx_operation_logs_user_id ON operation_logs(user_id);
CREATE INDEX idx_operation_logs_created_at ON operation_logs(created_at);
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);
```

## 3. API 设计

### 3.1 RESTful API 设计

#### 3.1.1 API 基础信息
- **基础URL**: `http://localhost:3000/api/v1`
- **认证方式**: JWT Bearer Token
- **请求格式**: JSON
- **响应格式**: JSON

#### 3.1.2 通用响应格式
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### 3.1.3 错误响应格式
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 3.2 认证相关 API

#### 用户登录
```
POST /api/v1/auth/login
```
**请求体:**
```json
{
  "username": "admin",
  "password": "password123"
}
```
**响应:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "realName": "管理员",
      "role": {
        "id": 1,
        "name": "超级管理员",
        "code": "super_admin"
      }
    }
  }
}
```

#### 用户登出
```
POST /api/v1/auth/logout
```

#### 刷新 Token
```
POST /api/v1/auth/refresh
```

#### 获取当前用户信息
```
GET /api/v1/auth/me
```

### 3.3 用户管理 API

#### 获取用户列表
```
GET /api/v1/users?page=1&limit=10&keyword=admin
```

#### 创建用户
```
POST /api/v1/users
```
**请求体:**
```json
{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com",
  "realName": "新用户",
  "roleId": 2
}
```

#### 更新用户
```
PUT /api/v1/users/:id
```

#### 删除用户
```
DELETE /api/v1/users/:id
```

#### 重置密码
```
POST /api/v1/users/:id/reset-password
```

### 3.4 行车管理 API

#### 获取行车列表
```
GET /api/v1/cranes
```

#### 获取单个行车信息
```
GET /api/v1/cranes/:id
```

#### 更新行车状态
```
PUT /api/v1/cranes/:id/status
```
**请求体:**
```json
{
  "status": "running",
  "mode": "auto"
}
```

#### 行车控制
```
POST /api/v1/cranes/:id/control
```
**请求体:**
```json
{
  "action": "start", // start, stop, emergency_stop
  "direction": "forward", // forward, backward, left, right, up, down
  "speed": 1.5
}
```

#### 配置行车职责
```
PUT /api/v1/cranes/:id/duty
```
**请求体:**
```json
{
  "duty": "feeding"
}
```

#### 获取行车告警列表
```
GET /api/v1/cranes/:id/alarms
```

### 3.5 区域管理 API

#### 获取区域列表
```
GET /api/v1/areas
```

#### 创建区域
```
POST /api/v1/areas
```
**请求体:**
```json
{
  "areaNo": "area01",
  "name": "堆料区1",
  "type": "stacking",
  "coordinateX": 0,
  "coordinateY": 0,
  "width": 10,
  "height": 5,
  "depth": 3,
  "maxHeight": 8
}
```

#### 更新区域
```
PUT /api/v1/areas/:id
```

#### 删除区域
```
DELETE /api/v1/areas/:id
```

#### 控制区域设备
```
POST /api/v1/areas/:id/control
```
**请求体:**
```json
{
  "coverStatus": "open",
  "drainingStatus": "closed",
  "cleaningStatus": "closed"
}
```

### 3.6 卸料门管理 API

#### 获取卸料门列表
```
GET /api/v1/discharge-doors
```

#### 控制卸料门
```
POST /api/v1/discharge-doors/:id/control
```
**请求体:**
```json
{
  "action": "open", // open, close
  "mode": "manual" // auto, manual
}
```

### 3.7 任务管理 API

#### 获取任务列表
```
GET /api/v1/tasks?page=1&limit=10&status=pending&craneId=1
```

#### 创建任务
```
POST /api/v1/tasks
```
**请求体:**
```json
{
  "craneId": 1,
  "taskType": "feeding",
  "sourceAreaId": 1,
  "targetAreaId": 2,
  "priority": 1,
  "weight": 5.5
}
```

#### 取消任务
```
POST /api/v1/tasks/:id/cancel
```

#### 获取任务统计
```
GET /api/v1/tasks/statistics?startDate=2024-01-01&endDate=2024-01-31
```

### 3.8 告警管理 API

#### 获取行车告警列表
```
GET /api/v1/alarms/cranes?page=1&limit=10&status=active
```

#### 确认告警
```
POST /api/v1/alarms/cranes/:id/acknowledge
```

#### 获取大物告警列表
```
GET /api/v1/alarms/large-objects
```

#### 获取设备告警列表
```
GET /api/v1/alarms/devices
```

### 3.9 数据查询 API

#### 获取发酵数据
```
GET /api/v1/data/fermentation?areaId=1&startDate=2024-01-01&endDate=2024-01-31
```

#### 获取库存数据
```
GET /api/v1/data/inventory?startDate=2024-01-01&endDate=2024-01-31&groupBy=day
```

#### 获取车辆记录
```
GET /api/v1/data/vehicles?recordType=discharge&startDate=2024-01-01&endDate=2024-01-31
```

#### 导出数据
```
GET /api/v1/data/export?type=fermentation&format=excel&startDate=2024-01-01&endDate=2024-01-31
```

### 3.10 监控相关 API

#### 获取监控数据
```
GET /api/v1/monitor/dashboard
```

#### 获取摄像头列表
```
GET /api/v1/monitor/cameras
```

#### 截图
```
POST /api/v1/monitor/cameras/:id/capture
```

### 3.11 AI 服务 API

#### 发酵数据智能分析
```
POST /api/v1/ai/fermentation-prediction
```
**请求体:**
```json
{
  "areaId": 1,
  "timeRange": "24h"
}
```
**响应:**
```json
{
  "success": true,
  "data": {
    "prediction": {
      "temperature": 45.5,
      "humidity": 65.2,
      "methaneConcentration": 12.8
    },
    "recommendation": "建议在明天下午2点进行翻堆操作",
    "optimalTime": "2024-01-02T14:00:00Z",
    "confidence": 0.85
  }
}
```

#### 行车告警智能诊断
```
POST /api/v1/ai/alarm-diagnosis
```
**请求体:**
```json
{
  "alarmId": 1,
  "alarmType": "grab_slip",
  "craneId": 1,
  "sensorData": {
    "position": {"x": 10.5, "y": 5.2},
    "loadWeight": 3.5,
    "speed": 1.2
  }
}
```
**响应:**
```json
{
  "success": true,
  "data": {
    "possibleCauses": [
      "钢索磨损导致抓斗下降",
      "编码器故障导致位置计算错误",
      "液压系统泄漏"
    ],
    "recommendedActions": [
      "立即停止行车运行",
      "检查钢索磨损情况",
      "校验编码器读数",
      "检查液压系统密封性"
    ],
    "priority": "high",
    "estimatedRepairTime": "2小时"
  }
}
```

#### 大物体图像识别
```
POST /api/v1/ai/object-detection
```
**请求体:**
```json
{
  "cameraId": 1,
  "imageUrl": "http://example.com/image.jpg"
}
```
**响应:**
```json
{
  "success": true,
  "data": {
    "detected": true,
    "objects": [
      {
        "type": "furniture",
        "confidence": 0.92,
        "boundingBox": {"x": 100, "y": 150, "width": 200, "height": 180}
      }
    ],
    "isLargeObject": true,
    "alarmGenerated": true,
    "alarmId": 123
  }
}
```

#### 调度任务优化建议
```
POST /api/v1/ai/schedule-optimization
```
**请求体:**
```json
{
  "currentInventory": {
    "totalWeight": 150.5,
    "areas": [
      {"id": 1, "height": 6.5},
      {"id": 2, "height": 4.2}
    ]
  },
  "feedingDemand": {
    "targetWeight": 10.0,
    "urgency": "high"
  }
}
```
**响应:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "craneId": 1,
        "taskType": "feeding",
        "sourceAreaId": 2,
        "targetAreaId": 1,
        "estimatedWeight": 5.0,
        "priority": 1,
        "reason": "区域2堆料高度适中，适合投料"
      },
      {
        "craneId": 2,
        "taskType": "stacking",
        "sourceAreaId": 3,
        "targetAreaId": 2,
        "estimatedWeight": 3.0,
        "priority": 2,
        "reason": "平衡各区域堆料高度"
      }
    ],
    "optimizationScore": 0.88,
    "estimatedEfficiency": "提升15%"
  }
}
```

### 3.12 WebSocket 事件设计

#### 客户端连接
```javascript
// 连接 WebSocket
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

#### 服务端事件 (Server → Client)

##### 行车状态更新
```javascript
// 事件名: crane:status
{
  "craneId": 1,
  "status": "running",
  "position": {"x": 10.5, "y": 5.2, "z": 3.0},
  "grabStatus": "closed",
  "loadWeight": 3.5,
  "speed": 1.2,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

##### 告警通知
```javascript
// 事件名: alarm:new
{
  "id": 123,
  "type": "crane_alarm",
  "alarmType": "grab_slip",
  "craneId": 1,
  "message": "1号行车遛钩告警",
  "level": "critical",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

##### 任务状态更新
```javascript
// 事件名: task:status
{
  "taskId": 456,
  "status": "completed",
  "craneId": 1,
  "duration": 300,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

##### 发酵数据更新
```javascript
// 事件名: fermentation:update
{
  "areaId": 1,
  "temperature": 45.5,
  "humidity": 65.2,
  "methaneConcentration": 12.8,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### 客户端事件 (Client → Server)

##### 控制行车
```javascript
// 事件名: crane:control
socket.emit('crane:control', {
  craneId: 1,
  action: 'start',
  direction: 'forward',
  speed: 1.5
});
```

##### 控制卸料门
```javascript
// 事件名: door:control
socket.emit('door:control', {
  doorId: 1,
  action: 'open'
});
```

## 4. 安全设计

### 4.1 认证与授权

#### 4.1.1 JWT Token 设计
```javascript
// Token 载荷
{
  "userId": 1,
  "username": "admin",
  "roleId": 1,
  "permissions": ["user:read", "user:write", "crane:control"],
  "iat": 1516239022,
  "exp": 1516242622
}
```

#### 4.1.2 权限检查中间件
```javascript
// 权限检查中间件
const checkPermission = (permission) => {
  return (req, res, next) => {
    const userPermissions = req.user.permissions;
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: '权限不足'
        }
      });
    }
    next();
  };
};
```

### 4.2 数据安全

#### 4.2.1 密码加密
```javascript
// 使用 bcrypt 加密密码
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash(password, 10);
```

#### 4.2.2 SQL 注入防护
```javascript
// 使用 Sequelize 参数化查询
const user = await User.findOne({
  where: { username: username }
});
```

### 4.3 API 安全

#### 4.3.1 请求频率限制
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100 // 最多 100 次请求
});

app.use('/api/', limiter);
```

## 5. 性能优化设计

### 5.1 缓存策略

#### 5.1.1 Redis 缓存
```javascript
// 缓存用户权限
const cacheUserPermissions = async (userId, permissions) => {
  await redis.setex(`user:${userId}:permissions`, 3600, JSON.stringify(permissions));
};

// 获取缓存的用户权限
const getCachedUserPermissions = async (userId) => {
  const cached = await redis.get(`user:${userId}:permissions`);
  return cached ? JSON.parse(cached) : null;
};
```

#### 5.1.2 缓存实时状态
```javascript
// 缓存行车实时状态
const cacheCraneStatus = async (craneId, status) => {
  await redis.setex(`crane:${craneId}:status`, 60, JSON.stringify(status));
};
```

### 5.2 数据库优化

#### 5.2.1 连接池配置
```javascript
const sequelize = new Sequelize({
  database: 'garbage_pit',
  username: 'postgres',
  password: 'password',
  host: 'localhost',
  dialect: 'postgres',
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  }
});
```

#### 5.2.2 查询优化
```javascript
// 使用分页查询
const getUsers = async (page, limit) => {
  const offset = (page - 1) * limit;
  return await User.findAndCountAll({
    offset,
    limit,
    include: [{ model: Role }]
  });
};
```

## 6. 部署架构

### 6.1 Docker 部署

#### 6.1.1 Docker Compose 配置
```yaml
version: '3.8'

services:
  # PostgreSQL 数据库
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: garbage_pit
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # Redis 缓存
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # 后端服务
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://postgres:password@postgres:5432/garbage_pit
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-secret-key
      AI_API_KEY: your-ai-api-key
    depends_on:
      - postgres
      - redis

  # 前端服务
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

## 7. 监控与日志

### 7.1 应用监控

#### 7.1.1 健康检查
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### 7.2 日志记录

#### 7.2.1 日志级别
- **ERROR**: 系统{}