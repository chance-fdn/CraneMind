/**
 * 演示模式认证控制器
 * 使用SQLite演示数据库进行快速认证
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { ValidationError, UnauthorizedError } = require('../middlewares/error.middleware');
const config = require('../config');

// 演示用户数据
const DEMO_USERS = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$10$3pX0avRiBf2tzAk24ENT1OkJeUNpFSunAbM6wlIZ2HOPwEcyhb.yK', // admin123456
    email: 'admin@example.com',
    real_name: '系统管理员',
    role_id: 1,
    role: {
      id: 1,
      name: '系统管理员',
      code: 'admin',
      permissions: JSON.stringify({
        system: ['*'],
        crane: ['*'],
        task: ['*'],
        user: ['*'],
        area: ['*']
      })
    },
    status: 'active'
  }
];

/**
 * 生成 JWT Token
 */
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    roleId: user.role_id,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: config.jwt.issuer,
  });
};

/**
 * 演示模式用户登录
 */
const demoLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 基本验证
    if (!username || !password) {
      throw new ValidationError('用户名和密码不能为空');
    }

    if (password.length < 6) {
      throw new ValidationError('密码长度不能少于6个字符');
    }

    // 查找演示用户
    const user = DEMO_USERS.find(u => u.username === username);
    
    if (!user) {
      throw new UnauthorizedError('用户名或密码错误');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('用户名或密码错误');
    }

    // 检查用户状态
    if (user.status !== 'active') {
      throw new UnauthorizedError('账号已被禁用或锁定');
    }

    // 生成Token
    const token = generateToken(user);

    // 返回成功响应
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          realName: user.real_name,
          role: user.role ? {
            id: user.role.id,
            name: user.role.name,
            code: user.role.code,
            permissions: user.role.permissions,
          } : null,
        },
      },
      message: '登录成功',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 演示模式获取当前用户
 */
const demoGetCurrentUser = async (req, res, next) => {
  try {
    // 从token中提取用户ID
    const userId = req.user?.id || 1; // 默认管理员
    
    const user = DEMO_USERS.find(u => u.id === userId);
    
    if (!user) {
      throw new UnauthorizedError('用户不存在');
    }

    // 返回用户信息（过滤密码）
    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      real_name: user.real_name,
      role_id: user.role_id,
      status: user.status,
      role: user.role ? {
        id: user.role.id,
        name: user.role.name,
        code: user.role.code,
        permissions: user.role.permissions,
      } : null,
    };

    res.json({
      success: true,
      data: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 演示模式登出
 */
const demoLogout = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: '登出成功',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  demoLogin,
  demoGetCurrentUser,
  demoLogout,
};