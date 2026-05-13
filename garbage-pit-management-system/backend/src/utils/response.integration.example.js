/**
 * 响应格式化工具集成示例
 * 展示如何在现有的控制器中使用响应格式化工具
 * 
 * 这个示例展示了如何将现有的控制器代码迁移到使用统一的响应格式化工具
 */

const response = require('./response');

/**
 * 示例：改造现有的登录控制器方法
 * 原始代码使用 res.json() 直接返回响应
 * 改造后使用 response.success() 和 response.error() 方法
 */

// 原始登录方法（不使用响应格式化工具）
const loginOriginal = async (req, res, next) => {
  try {
    // ... 业务逻辑 ...
    const user = {
      id: 1,
      username: 'admin',
      email: 'admin@example.com'
    };
    
    const token = 'jwt-token-here';
    
    // 原始响应方式
    res.json({
      success: true,
      data: {
        token,
        user
      },
      message: '登录成功'
    });
  } catch (error) {
    next(error);
  }
};

// 改造后的登录方法（使用响应格式化工具）
const loginWithResponseFormatter = async (req, res, next) => {
  try {
    // ... 业务逻辑 ...
    const user = {
      id: 1,
      username: 'admin',
      email: 'admin@example.com'
    };
    
    const token = 'jwt-token-here';
    
    // 使用响应格式化工具
    return response.success(res, {
      token,
      user
    }, '登录成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 示例：改造现有的错误处理
 */

// 原始错误处理方式
const getUserOriginal = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    // 模拟用户不存在的情况
    if (userId > 100) {
      // 原始错误响应方式
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用户不存在'
        }
      });
    }
    
    const user = {
      id: userId,
      username: `user${userId}`
    };
    
    res.json({
      success: true,
      data: user,
      message: '用户信息获取成功'
    });
  } catch (error) {
    next(error);
  }
};

// 改造后的错误处理（使用响应格式化工具）
const getUserWithResponseFormatter = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    // 模拟用户不存在的情况
    if (userId > 100) {
      // 使用响应格式化工具的错误响应
      return response.notFound(res, '用户不存在');
    }
    
    const user = {
      id: userId,
      username: `user${userId}`
    };
    
    // 使用响应格式化工具的成功响应
    return response.success(res, user, '用户信息获取成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 示例：改造分页查询
 */

// 原始分页查询方式
const getUsersOriginal = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // 模拟数据
    const users = Array.from({ length: limit }, (_, i) => ({
      id: (page - 1) * limit + i + 1,
      username: `user${(page - 1) * limit + i + 1}`
    }));
    
    const total = 100;
    const totalPages = Math.ceil(total / limit);
    
    // 原始分页响应方式
    res.json({
      success: true,
      data: {
        items: users,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      },
      message: '用户列表查询成功'
    });
  } catch (error) {
    next(error);
  }
};

// 改造后的分页查询（使用响应格式化工具）
const getUsersWithResponseFormatter = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // 模拟数据
    const users = Array.from({ length: limit }, (_, i) => ({
      id: (page - 1) * limit + i + 1,
      username: `user${(page - 1) * limit + i + 1}`
    }));
    
    const total = 100;
    
    // 使用响应格式化工具的分页响应
    return response.pagination(res, users, total, page, limit, '用户列表查询成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 示例：改造验证错误处理
 */

// 原始验证错误处理方式
const registerOriginal = async (req, res, next) => {
  try {
    const { username, password, email } = req.body;
    
    // 模拟验证逻辑
    const errors = [];
    
    if (!username) {
      errors.push({ field: 'username', message: '用户名不能为空' });
    }
    
    if (!password) {
      errors.push({ field: 'password', message: '密码不能为空' });
    }
    
    if (errors.length > 0) {
      // 原始验证错误响应方式
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '注册信息验证失败',
          details: errors
        }
      });
    }
    
    // 模拟注册成功
    const user = {
      id: 101,
      username,
      email
    };
    
    res.status(201).json({
      success: true,
      data: user,
      message: '注册成功'
    });
  } catch (error) {
    next(error);
  }
};

// 改造后的验证错误处理（使用响应格式化工具）
const registerWithResponseFormatter = async (req, res, next) => {
  try {
    const { username, password, email } = req.body;
    
    // 模拟验证逻辑
    const errors = [];
    
    if (!username) {
      errors.push({ field: 'username', message: '用户名不能为空' });
    }
    
    if (!password) {
      errors.push({ field: 'password', message: '密码不能为空' });
    }
    
    if (errors.length > 0) {
      // 使用响应格式化工具的验证错误响应
      return response.validationError(res, errors, '注册信息验证失败');
    }
    
    // 模拟注册成功
    const user = {
      id: 101,
      username,
      email
    };
    
    // 使用响应格式化工具的创建成功响应
    return response.created(res, user, '注册成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 示例：使用自定义响应进行复杂操作
 */

// 使用自定义响应进行复杂操作
const updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const userData = req.body;
    
    // 模拟复杂的业务逻辑
    const updatedUser = {
      id: userId,
      ...userData,
      updatedAt: new Date().toISOString(),
      // 添加额外的计算字段
      fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
      // 添加状态字段
      status: 'active'
    };
    
    // 使用自定义响应进行链式调用
    return response.custom(res)
      .status(200)
      .setData(updatedUser)
      .setMessage('用户资料更新成功')
      .send();
  } catch (error) {
    next(error);
  }
};

/**
 * 示例：在中间件中使用响应格式化工具
 */

// 认证中间件
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  
  if (!token) {
    // 在中间件中使用响应格式化工具
    return response.unauthorized(res, '请先登录');
  }
  
  // 验证token逻辑...
  
  next();
};

// 权限检查中间件
const permissionMiddleware = (requiredPermission) => {
  return (req, res, next) => {
    const userPermissions = req.user?.permissions || [];
    
    if (!userPermissions.includes(requiredPermission)) {
      // 在中间件中使用响应格式化工具
      return response.forbidden(res, '权限不足');
    }
    
    next();
  };
};

// 导出所有示例方法
module.exports = {
  // 原始方法
  loginOriginal,
  getUserOriginal,
  getUsersOriginal,
  registerOriginal,
  
  // 使用响应格式化工具的方法
  loginWithResponseFormatter,
  getUserWithResponseFormatter,
  getUsersWithResponseFormatter,
  registerWithResponseFormatter,
  updateUserProfile,
  
  // 中间件示例
  authMiddleware,
  permissionMiddleware
};

/**
 * 使用响应格式化工具的优势：
 * 
 * 1. 统一的响应格式
 *    - 所有API返回相同结构的响应
 *    - 前端处理更简单
 *    - 便于日志分析和监控
 * 
 * 2. 减少重复代码
 *    - 不需要在每个控制器中重复编写响应结构
 *    - 错误处理更统一
 * 
 * 3. 更好的可维护性
 *    - 响应格式的修改只需在一个地方进行
 *    - 添加新的响应类型更方便
 * 
 * 4. 链式调用支持
 *    - 代码更简洁易读
 *    - 支持复杂的响应构建
 * 
 * 5. 完整的错误处理
 *    - 内置常见的HTTP状态码响应
 *    - 支持自定义错误码和详情
 */