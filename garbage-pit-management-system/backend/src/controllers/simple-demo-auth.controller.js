/**
 * 简单演示模式认证控制器
 * 直接使用预定义令牌
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

// 演示用户数据 - 使用简单密码
const DEMO_USERS = {
  'admin': {
    id: 1,
    username: 'admin',
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
};

/**
 * 简单演示登录
 */
const simpleDemoLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 基本验证
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    // 检查是否为演示用户
    if (username === 'admin' && password === 'admin123456') {
      const user = DEMO_USERS['admin'];
      
      // 生成Token
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          roleId: user.role_id,
        },
        config.jwt.secret,
        {
          expiresIn: config.jwt.expiresIn,
          issuer: config.jwt.issuer,
        }
      );

      // 返回成功响应
      return res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
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
    }

    // 认证失败
    res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  } catch (error) {
    console.error('演示登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 简单获取当前用户
 */
const simpleDemoGetCurrentUser = async (req, res, next) => {
  try {
    // 从token中提取用户ID或使用默认
    const userId = req.user?.userId || 1;
    
    const user = DEMO_USERS['admin'];

    // 返回用户信息
    const safeUser = {
      id: user.id,
      username: user.username,
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
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 简单登出
 */
const simpleDemoLogout = async (req, res, next) => {
  res.json({
    success: true,
    message: '登出成功',
  });
};

module.exports = {
  simpleDemoLogin,
  simpleDemoGetCurrentUser,
  simpleDemoLogout,
};