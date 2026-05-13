/**
 * 垃圾储坑智能化管控系统 - 用户服务
 * 
 * 该文件实现了用户相关的业务逻辑，包括用户CRUD、密码管理、状态管理等。
 * 服务层负责处理业务逻辑，与数据库交互，为控制器提供数据服务。
 * 
 * 主要功能：
 * 1. 用户列表查询（分页、搜索、筛选）
 * 2. 用户信息获取（排除密码字段）
 * 3. 用户创建（密码加密、唯一性验证）
 * 4. 用户信息更新
 * 5. 用户删除
 * 6. 密码重置
 * 7. 用户状态管理
 * 
 * @module services/user.service
 * @author 华工三峰
 */

'use strict';

// 引入依赖
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { 
  ValidationError, 
  NotFoundError, 
  ConflictError,
  BusinessError,
} = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

/**
 * 用户服务类
 * 
 * @class UserService
 */
class UserService {
  /**
   * 构造函数
   * 
   * @constructor
   */
  constructor() {
    this.User = User;
  }

  /**
   * 获取用户列表（分页、搜索、筛选）
   * 
   * @description
   * 根据查询参数获取用户列表，支持分页、关键词搜索和状态/角色筛选
   * 查询结果排除密码字段，包含关联的角色信息
   * 
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码，默认1
   * @param {number} params.limit - 每页数量，默认10
   * @param {string} params.keyword - 关键词搜索（用户名、邮箱、真实姓名）
   * @param {string} params.status - 状态筛选（active/inactive/locked）
   * @param {number} params.roleId - 角色ID筛选
   * @returns {Promise<Object>} 分页结果对象
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const result = await userService.getUserList({
   *   page: 1,
   *   limit: 10,
   *   keyword: 'admin',
   *   status: 'active',
   *   roleId: 1,
   * });
   */
  async getUserList(params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        keyword,
        status,
        roleId,
      } = params;

      logger.info('用户服务 - 获取用户列表', { params });

      // 构建查询条件
      const where = {};

      // 状态筛选
      if (status) {
        where.status = status;
      }

      // 角色ID筛选
      if (roleId) {
        where.role_id = roleId;
      }

      // 关键词搜索（用户名、邮箱、真实姓名）
      if (keyword) {
        where.$or = [
          { username: { $like: `%${keyword}%` } },
          { email: { $like: `%${keyword}%` } },
          { real_name: { $like: `%${keyword}%` } },
        ];
      }

      // 计算偏移量
      const offset = (page - 1) * limit;

      // 执行查询
      const { count, rows } = await this.User.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']],
        include: [
          {
            model: this.User.sequelize.models.Role,
            as: 'role',
            required: false,
          },
        ],
        // 排除密码字段
        attributes: { exclude: ['password'] },
      });

      // 计算总页数
      const totalPages = Math.ceil(count / limit);

      logger.info('用户服务 - 获取用户列表成功', { 
        total: count, 
        page, 
        limit, 
        totalPages 
      });

      return {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        list: rows.map(user => user.toSafeObject()),
      };
    } catch (error) {
      logger.error('用户服务 - 获取用户列表失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 根据ID获取用户信息
   * 
   * @description
   * 根据用户ID获取用户详细信息，排除密码字段
   * 包含关联的角色信息
   * 
   * @param {number} id - 用户ID
   * @returns {Promise<Object>} 用户信息对象
   * @throws {NotFoundError} 用户不存在
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const user = await userService.getUserById(1);
   */
  async getUserById(id) {
    try {
      logger.info('用户服务 - 根据ID获取用户信息', { userId: id });

      // 查询用户，排除密码字段
      const user = await this.User.findByPk(id, {
        include: [
          {
            model: this.User.sequelize.models.Role,
            as: 'role',
            required: false,
          },
        ],
        attributes: { exclude: ['password'] },
      });

      // 检查用户是否存在
      if (!user) {
        logger.warn('用户服务 - 用户不存在', { userId: id });
        throw new NotFoundError('用户不存在');
      }

      logger.info('用户服务 - 获取用户信息成功', { userId: id });

      return user.toSafeObject();
    } catch (error) {
      logger.error('用户服务 - 获取用户信息失败', { 
        userId: id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 创建用户
   * 
   * @description
   * 创建新用户，自动加密密码
   * 验证用户名和邮箱的唯一性
   * 
   * @param {Object} userData - 用户数据
   * @param {string} userData.username - 用户名（必填）
   * @param {string} userData.password - 密码（必填）
   * @param {string} userData.email - 邮箱地址（可选）
   * @param {string} userData.phone - 手机号码（可选）
   * @param {string} userData.realName - 真实姓名（可选）
   * @param {number} userData.roleId - 角色ID（可选）
   * @returns {Promise<Object>} 创建的用户信息
   * @throws {ValidationError} 参数验证失败
   * @throws {ConflictError} 用户名或邮箱已存在
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const user = await userService.createUser({
   *   username: 'newuser',
   *   password: 'password123',
   *   email: 'user@example.com',
   *   phone: '13800138000',
   *   realName: '新用户',
   *   roleId: 2,
   * });
   */
  async createUser(userData) {
    try {
      const {
        username,
        password,
        email,
        phone,
        realName,
        roleId,
      } = userData;

      logger.info('用户服务 - 创建用户', { username, email });

      // 验证必填字段
      if (!username) {
        throw new ValidationError('用户名不能为空');
      }
      if (!password) {
        throw new ValidationError('密码不能为空');
      }

      // 验证密码长度
      if (password.length < 6) {
        throw new ValidationError('密码长度必须至少6个字符');
      }

      // 检查用户名是否已存在
      const existingUserByUsername = await this.User.findOne({ 
        where: { username } 
      });
      if (existingUserByUsername) {
        throw new ConflictError(`用户名 "${username}" 已存在`);
      }

      // 检查邮箱是否已存在
      if (email) {
        const existingUserByEmail = await this.User.findOne({ 
          where: { email } 
        });
        if (existingUserByEmail) {
          throw new ConflictError(`邮箱 "${email}" 已被使用`);
        }
      }

      // 准备创建数据
      const createData = {
        username,
        password, // 密码会在模型钩子中自动加密
        email: email || null,
        phone: phone || null,
        real_name: realName || null,
        role_id: roleId || null,
        status: 'active', // 默认状态为活跃
      };

      // 创建用户
      const user = await this.User.create(createData);

      logger.info('用户服务 - 创建用户成功', { 
        userId: user.id, 
        username 
      });

      // 返回用户信息（排除密码字段）
      return user.toSafeObject();
    } catch (error) {
      logger.error('用户服务 - 创建用户失败', { 
        username: userData.username, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 更新用户信息
   * 
   * @description
   * 更新用户基本信息，不包括密码
   * 验证邮箱的唯一性（如果修改了邮箱）
   * 
   * @param {number} id - 用户ID
   * @param {Object} userData - 更新数据
   * @param {string} userData.email - 邮箱地址（可选）
   * @param {string} userData.phone - 手机号码（可选）
   * @param {string} userData.realName - 真实姓名（可选）
   * @param {number} userData.roleId - 角色ID（可选）
   * @param {string} userData.status - 用户状态（可选）
   * @returns {Promise<Object>} 更新后的用户信息
   * @throws {NotFoundError} 用户不存在
   * @throws {ConflictError} 邮箱已被其他用户使用
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const user = await userService.updateUser(1, {
   *   email: 'newemail@example.com',
   *   phone: '13800138000',
   *   realName: '新名字',
   *   roleId: 2,
   *   status: 'active',
   * });
   */
  async updateUser(id, userData) {
    try {
      const {
        email,
        phone,
        realName,
        roleId,
        status,
      } = userData;

      logger.info('用户服务 - 更新用户信息', { 
        userId: id, 
        updateData: userData 
      });

      // 查找用户
      const user = await this.User.findByPk(id);
      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      // 准备更新数据
      const updateData = {};

      if (email !== undefined) {
        updateData.email = email || null;
      }
      if (phone !== undefined) {
        updateData.phone = phone || null;
      }
      if (realName !== undefined) {
        updateData.real_name = realName || null;
      }
      if (roleId !== undefined) {
        updateData.role_id = roleId || null;
      }
      if (status !== undefined) {
        // 验证状态值
        const validStatuses = ['active', 'inactive', 'locked'];
        if (!validStatuses.includes(status)) {
          throw new ValidationError(`状态值无效，必须是: ${validStatuses.join(', ')}`);
        }
        updateData.status = status;
      }

      // 更新用户信息
      await user.update(updateData);

      logger.info('用户服务 - 更新用户信息成功', { userId: id });

      // 返回更新后的用户信息（排除密码字段）
      return user.toSafeObject();
    } catch (error) {
      logger.error('用户服务 - 更新用户信息失败', { 
        userId: id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 删除用户
   * 
   * @description
   * 删除指定用户（物理删除）
   * 注意：删除操作不可逆，请谨慎使用
   * 
   * @param {number} id - 用户ID
   * @returns {Promise<boolean>} 删除成功标志
   * @throws {NotFoundError} 用户不存在
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const success = await userService.deleteUser(1);
   */
  async deleteUser(id) {
    try {
      logger.info('用户服务 - 删除用户', { userId: id });

      // 查找用户
      const user = await this.User.findByPk(id);
      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      // 删除用户
      await user.destroy();

      logger.info('用户服务 - 删除用户成功', { userId: id });

      return true;
    } catch (error) {
      logger.error('用户服务 - 删除用户失败', { 
        userId: id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 重置用户密码
   * 
   * @description
   * 重置指定用户的密码，需要管理员权限
   * 自动加密新密码
   * 
   * @param {number} id - 用户ID
   * @param {string} newPassword - 新密码
   * @returns {Promise<boolean>} 重置成功标志
   * @throws {NotFoundError} 用户不存在
   * @throws {ValidationError} 新密码不符合要求
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const success = await userService.resetPassword(1, 'newPassword123');
   */
  async resetPassword(id, newPassword) {
    try {
      logger.info('用户服务 - 重置用户密码', { userId: id });

      // 验证新密码
      if (!newPassword) {
        throw new ValidationError('新密码不能为空');
      }
      if (newPassword.length < 6) {
        throw new ValidationError('新密码长度必须至少6个字符');
      }

      // 查找用户
      const user = await this.User.findByPk(id);
      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      // 使用模型方法更新密码（会自动加密）
      await user.updatePassword(newPassword);

      logger.info('用户服务 - 重置用户密码成功', { userId: id });

      return true;
    } catch (error) {
      logger.error('用户服务 - 重置用户密码失败', { 
        userId: id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 更新用户状态
   * 
   * @description
   * 更新用户状态：active（活跃）、inactive（停用）、locked（锁定）
   * 
   * @param {number} id - 用户ID
   * @param {string} status - 新状态
   * @returns {Promise<Object>} 更新后的用户信息
   * @throws {NotFoundError} 用户不存在
   * @throws {ValidationError} 状态值无效
   * @throws {Error} 数据库操作错误
   * 
   * @example
   * const user = await userService.updateUserStatus(1, 'locked');
   */
  async updateUserStatus(id, status) {
    try {
      logger.info('用户服务 - 更新用户状态', { 
        userId: id, 
        newStatus: status 
      });

      // 验证状态值
      const validStatuses = ['active', 'inactive', 'locked'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError(`状态值无效，必须是: ${validStatuses.join(', ')}`);
      }

      // 查找用户
      const user = await this.User.findByPk(id);
      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      // 根据状态值调用相应的模型方法
      switch (status) {
        case 'active':
          await user.activate();
          break;
        case 'inactive':
          await user.deactivate();
          break;
        case 'locked':
          await user.lock();
          break;
      }

      logger.info('用户服务 - 更新用户状态成功', { 
        userId: id, 
        newStatus: status 
      });

      // 返回更新后的用户信息（排除密码字段）
      return user.toSafeObject();
    } catch (error) {
      logger.error('用户服务 - 更新用户状态失败', { 
        userId: id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 验证用户登录
   * 
   * @description
   * 验证用户名/邮箱和密码是否正确
   * 检查用户状态是否允许登录
   * 
   * @param {string} usernameOrEmail - 用户名或邮箱
   * @param {string} password - 密码
   * @returns {Promise<Object|null>} 验证成功返回用户信息，失败返回null
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const user = await userService.authenticate('admin', 'password123');
   * if (user) {
   *   // 登录成功
   * }
   */
  async authenticate(usernameOrEmail, password) {
    try {
      logger.info('用户服务 - 验证用户登录', { usernameOrEmail });

      // 使用模型方法验证登录
      const user = await this.User.authenticate(usernameOrEmail, password);

      if (!user) {
        logger.warn('用户服务 - 用户登录验证失败', { usernameOrEmail });
        return null;
      }

      logger.info('用户服务 - 用户登录验证成功', { 
        userId: user.id, 
        username: user.username 
      });

      // 返回用户信息（排除密码字段）
      return user.toSafeObject();
    } catch (error) {
      logger.error('用户服务 - 验证用户登录失败', { 
        usernameOrEmail, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 检查用户名是否已存在
   * 
   * @description
   * 检查用户名是否已被其他用户使用
   * 可用于注册时的用户名验证
   * 
   * @param {string} username - 用户名
   * @param {number} excludeId - 排除的用户ID（用于更新时排除自身）
   * @returns {Promise<boolean>} 是否存在
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const exists = await userService.isUsernameExists('admin');
   */
  async isUsernameExists(username, excludeId = null) {
    try {
      return await this.User.isUsernameExists(username, excludeId);
    } catch (error) {
      logger.error('用户服务 - 检查用户名是否存在失败', { 
        username, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 检查邮箱是否已存在
   * 
   * @description
   * 检查邮箱是否已被其他用户使用
   * 可用于注册时的邮箱验证
   * 
   * @param {string} email - 邮箱地址
   * @param {number} excludeId - 排除的用户ID（用于更新时排除自身）
   * @returns {Promise<boolean>} 是否存在
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const exists = await userService.isEmailExists('user@example.com');
   */
  async isEmailExists(email, excludeId = null) {
    try {
      return await this.User.isEmailExists(email, excludeId);
    } catch (error) {
      logger.error('用户服务 - 检查邮箱是否存在失败', { 
        email, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 获取用户统计信息
   * 
   * @description
   * 获取用户总数及各状态用户数量
   * 
   * @returns {Promise<Object>} 统计信息
   * @throws {Error} 数据库查询错误
   * 
   * @example
   * const stats = await userService.getUserStats();
   */
  async getUserStats() {
    try {
      logger.info('用户服务 - 获取用户统计信息');

      const stats = await this.User.getStats();

      logger.info('用户服务 - 获取用户统计信息成功', { stats });

      return stats;
    } catch (error) {
      logger.error('用户服务 - 获取用户统计信息失败', { 
        error: error.message 
      });
      throw error;
    }
  }
}

// =====================================================
// 创建服务实例并导出
// =====================================================

const userService = new UserService();

module.exports = userService;