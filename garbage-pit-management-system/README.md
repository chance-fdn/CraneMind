# 垃圾储坑智能化管控系统

## 项目简介
垃圾储坑智能化管控系统，用于垃圾焚烧发电厂或固废处理中心的储坑管理。系统集成了 AI 智能调度、异常检测、数据预测等功能。

## 技术栈

### 前端
- Vue 3 + TypeScript + Vite
- Three.js (3D 可视化)
- ECharts (图表库)
- Pinia (状态管理)
- Vue Router (路由)
- WebSocket (实时通信)

### 后端
- Node.js + Express
- PostgreSQL (主数据库)
- Redis (缓存与实时状态)
- JWT (身份验证)

### AI 集成
- 大语言模型 API (GPT-4/Claude/Llama3)
- 图像识别 API

## 项目结构

```
garbage-pit-management-system/
├── frontend/                  # 前端项目
│   ├── src/
│   │   ├── api/              # API 接口封装
│   │   ├── assets/           # 静态资源
│   │   ├── components/       # 公共组件
│   │   ├── views/            # 页面视图
│   │   ├── stores/           # Pinia 状态管理
│   │   ├── router/           # 路由配置
│   │   ├── utils/            # 工具函数
│   │   ├── types/            # TypeScript 类型定义
│   │   └── styles/           # 样式文件
│   ├── public/               # 公共资源
│   └── package.json
│
├── backend/                   # 后端项目
│   ├── src/
│   │   ├── controllers/      # 控制器
│   │   ├── models/           # 数据模型
│   │   ├── routes/           # 路由
│   │   ├── services/         # 业务逻辑
│   │   ├── middlewares/      # 中间件
│   │   ├── utils/            # 工具函数
│   │   └── config/           # 配置文件
│   └── package.json
│
├── database/                  # 数据库
│   ├── migrations/           # 数据库迁移
│   ├── seeds/                # 种子数据
│   └── schema.sql            # 数据库结构
│
├── docs/                      # 文档
│   ├── api/                  # API 文档
│   ├── design/               # 设计文档
│   └── deployment.md         # 部署说明
│
└── docker-compose.yml        # Docker 编排文件
```

## 核心功能

### 1. 核心监控功能
- 大屏监控中心
- 3D 模型展示
- 行车运行趋势图
- 实时时间显示
- 全屏展示

### 2. 行车控制功能
- 行车状态监控
- 行车职责配置
- 行车告警系统
- 自动/手动模式切换
- 行车启停控制
- 任务管理

### 3. 区域管理功能
- 堆料区域设置
- 投料区转料设置
- 揭盖区域控制
- 沥水清底控制
- 卸料门管理

### 4. 记录查询功能
- 垃圾池发酵数据
- 垃圾池总库存量
- 调度记录
- 设备记录
- 车辆记录
- 告警记录

### 5. 系统管理功能
- 用户登录
- 权限管理
- 用户管理
- 参数设置
- 日志查询

### 6. AI 智能功能
- 发酵数据智能分析
- 行车告警智能诊断
- 大物体图像识别告警
- 行车调度任务优化建议

## 启动方式

### 前端
```bash
cd frontend
npm install
npm run dev
```

### 后端
```bash
cd backend
npm install
npm run dev
```

### 数据库
```bash
# 使用 Docker 启动 PostgreSQL 和 Redis
docker-compose up -d
```

## 环境变量配置

详见各模块的 `.env.example` 文件。

## 开发进度

- [x] 项目结构搭建
- [ ] 数据库设计
- [ ] 后端 API 开发
- [ ] 前端页面开发
- [ ] AI 集成
- [ ] 测试与部署
