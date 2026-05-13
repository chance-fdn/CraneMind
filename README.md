# CraneMind

**An AI-powered system for smart waste crane scheduling, garbage pit monitoring, alarm diagnosis, and operation management.**

CraneMind 是一个面向垃圾焚烧发电厂、固废处理中心等场景的智慧垃圾吊与垃圾池管理系统。系统集成了垃圾吊运行监控、垃圾池库容监测、车辆与卸料管理、设备故障记录、报警处置以及 AI 调度分析能力，可用于演示智慧垃圾吊的自动化、智能化管理流程。

## Core Features

- Smart waste crane scheduling and task management
- Garbage pit area monitoring and storage statistics
- Crane operation data, grab status, duty configuration, and task logs
- Vehicle dispatching, vehicle records, and unloading queue management
- Device monitoring, device data statistics, camera/video access, and fault records
- Alarm listing, acknowledgement, diagnosis, and handling workflow
- AI fermentation risk prediction
- AI crane alarm diagnosis
- AI large object detection analysis
- AI schedule optimization
- AI-generated crane dispatch plans with human confirmation
- Legacy API compatibility for the existing Vue frontend
- Demo mode for running the backend without a database

## Tech Stack

### Frontend

- Vue 2
- Vue Router
- Vuex
- Element UI
- Axios
- ECharts / ECharts GL
- Three.js

### Backend

- Node.js
- Express
- Socket.IO
- JWT authentication
- PostgreSQL / Sequelize support
- Redis support
- OpenAI-compatible AI service integration
- Local rule-based AI fallback

## Project Structure

```text
.
├── 0925/                              # Frontend Vue application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vue.config.js
└── garbage-pit-management-system/
    ├── backend/                       # Backend API service
    │   ├── src/
    │   ├── package.json
    │   └── .env.example
    └── README.md
```

## Quick Start

### Backend

```bash
cd garbage-pit-management-system/backend
npm install
npm run dev
```

The backend runs on `http://localhost:3000` by default.

### Frontend

```bash
cd 0925
npm install
npm run dev
```

The frontend development server runs on `http://localhost:9528` by default.

## AI Dispatch APIs

Standard AI endpoints:

- `POST /api/v1/ai/crane-dispatch`
- `POST /api/v1/ai/crane-dispatch/confirm`

Legacy-compatible frontend endpoints:

- `POST /disCrane/aiDispatch`
- `POST /disCrane/confirmAiDispatch`

## Repository Description

Use this as the GitHub repository description:

```text
An AI-powered system for smart waste crane scheduling, garbage pit monitoring, alarm diagnosis, and operation management.
```

## License

MIT
