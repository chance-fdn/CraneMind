/**
 * 响应格式化工具使用示例
 * 展示如何在 Express 应用中使用响应格式化工具
 */

const express = require('express');
const response = require('./response');

// 创建 Express 应用
const app = express();
app.use(express.json());

// 示例 1: 成功响应
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  
  // 模拟从数据库获取用户数据
  const user = {
    id: userId,
    username: 'admin',
    realName: '管理员',
    email: 'admin@example.com'
  };
  
  // 使用 success 方法返回成功响应
  return response.success(res, user, '用户信息获取成功');
});

// 示例 2: 分页响应
app.get('/api/users', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  // 模拟从数据库获取分页数据
  const users = Array.from({ length: limit }, (_, i) => ({
    id: (page - 1) * limit + i + 1,
    username: `user${(page - 1) * limit + i + 1}`,
    realName: `用户${(page - 1) * limit + i + 1}`
  }));
  
  const total = 100; // 模拟总记录数
  
  // 使用 pagination 方法返回分页响应
  return response.pagination(res, users, total, page, limit, '用户列表查询成功');
});

// 示例 3: 创建成功响应
app.post('/api/users', (req, res) => {
  const userData = req.body;
  
  // 模拟创建用户
  const newUser = {
    id: 101,
    ...userData,
    createdAt: new Date().toISOString()
  };
  
  // 使用 created 方法返回创建成功响应
  return response.created(res, newUser, '用户创建成功');
});

// 示例 4: 验证错误响应
app.post('/api/register', (req, res) => {
  const { username, password, email } = req.body;
  
  // 模拟验证逻辑
  const errors = [];
  
  if (!username) {
    errors.push({ field: 'username', message: '用户名不能为空' });
  }
  
  if (!password) {
    errors.push({ field: 'password', message: '密码不能为空' });
  } else if (password.length < 6) {
    errors.push({ field: 'password', message: '密码长度至少6位' });
  }
  
  if (!email) {
    errors.push({ field: 'email', message: '邮箱不能为空' });
  } else if (!email.includes('@')) {
    errors.push({ field: 'email', message: '邮箱格式不正确' });
  }
  
  if (errors.length > 0) {
    // 使用 validationError 方法返回验证错误响应
    return response.validationError(res, errors, '注册信息验证失败');
  }
  
  // 模拟注册成功
  const user = {
    id: 102,
    username,
    email,
    createdAt: new Date().toISOString()
  };
  
  return response.created(res, user, '注册成功');
});

// 示例 5: 未授权响应
app.get('/api/profile', (req, res) => {
  const token = req.headers.authorization;
  
  if (!token) {
    // 使用 unauthorized 方法返回未授权响应
    return response.unauthorized(res, '请先登录');
  }
  
  // 模拟获取用户信息
  const profile = {
    id: 1,
    username: 'admin',
    realName: '管理员'
  };
  
  return response.success(res, profile, '个人信息获取成功');
});

// 示例 6: 未找到响应
app.get('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  
  // 模拟查询产品
  if (productId > 100) {
    // 使用 notFound 方法返回未找到响应
    return response.notFound(res, '产品不存在');
  }
  
  const product = {
    id: productId,
    name: `产品${productId}`,
    price: 99.99
  };
  
  return response.success(res, product, '产品信息获取成功');
});

// 示例 7: 服务器错误响应
app.get('/api/system/status', (req, res) => {
  // 模拟数据库连接失败
  const dbConnected = false;
  
  if (!dbConnected) {
    // 使用 internalError 方法返回服务器错误响应
    return response.internalError(res, '数据库连接失败');
  }
  
  const status = {
    database: 'connected',
    redis: 'connected',
    uptime: process.uptime()
  };
  
  return response.success(res, status, '系统状态获取成功');
});

// 示例 8: 自定义响应
app.put('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const userData = req.body;
  
  // 使用 custom 方法进行链式调用
  return response.custom(res)
    .status(200)
    .setData({
      id: userId,
      ...userData,
      updatedAt: new Date().toISOString()
    })
    .setMessage('用户信息更新成功')
    .send();
});

// 示例 9: 冲突响应
app.post('/api/users/check-username', (req, res) => {
  const { username } = req.body;
  
  // 模拟检查用户名是否已存在
  const existingUsernames = ['admin', 'user1', 'user2'];
  
  if (existingUsernames.includes(username)) {
    // 使用 conflict 方法返回冲突响应
    return response.conflict(res, '用户名已存在', { 
      suggestion: `${username}_${Date.now()}` 
    });
  }
  
  return response.success(res, { available: true }, '用户名可用');
});

// 示例 10: 服务不可用响应
app.get('/api/maintenance/status', (req, res) => {
  // 模拟系统维护状态
  const isMaintenance = true;
  
  if (isMaintenance) {
    // 使用 serviceUnavailable 方法返回服务不可用响应
    return response.serviceUnavailable(res, '系统正在维护中，请稍后再试');
  }
  
  return response.success(res, { status: 'normal' }, '系统运行正常');
});

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`示例服务器运行在 http://localhost:${PORT}`);
  console.log('可用端点:');
  console.log('  GET  /api/users/:id          - 获取用户信息');
  console.log('  GET  /api/users              - 获取用户列表（分页）');
  console.log('  POST /api/users              - 创建用户');
  console.log('  POST /api/register           - 用户注册（验证示例）');
  console.log('  GET  /api/profile            - 获取个人信息（授权示例）');
  console.log('  GET  /api/products/:id       - 获取产品信息（未找到示例）');
  console.log('  GET  /api/system/status      - 获取系统状态（错误示例）');
  console.log('  PUT  /api/users/:id          - 更新用户信息（自定义响应示例）');
  console.log('  POST /api/users/check-username - 检查用户名（冲突示例）');
  console.log('  GET  /api/maintenance/status - 获取维护状态（服务不可用示例）');
});

// 导出应用（用于测试）
module.exports = app;