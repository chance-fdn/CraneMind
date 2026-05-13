/**
 * 垃圾储坑智能化管控系统 - 用户模型
 *
 * 该文件定义了用户表的数据模型，用于存储系统用户信息。
 * 用户是系统访问的主体，通过关联角色获得相应的权限。
 *
 * 主要功能：
 * 1. 定义用户表结构和字段验证规则
 * 2. 实现密码加密和验证方法（使用 bcryptjs）
 * 3. 提供用户 CRUD 操作方法
 * 4. 提供用户状态管理方法
 * 5. 提供用户权限和角色查询方法
 *
 * @module models/user.model
 * @author 华工三峰
 */

'use strict';

// 引入 bcryptjs 用于密码加密
const bcrypt = require('bcryptjs');

/**
 * 用户模型定义
 * @param {Object} sequelize - Sequelize 实例
 * @param {Object} DataTypes - 数据类型定义
 * @returns {Object} 用户模型
 */
module.exports = (sequelize, DataTypes) => {
  // =====================================================
  // 模型定义
  // =====================================================

  /**
   * 用户模型
   * 
   * 数据表名: users
   * 
   * 字段说明:
   * - id: 主键，自增
   * - username: 用户名，唯一标识
   * - password: 密码（bcrypt 加密存储）
   * - email: 邮箱地址
   * - phone: 手机号码
   * - real_name: 真实姓名
   * - role_id: 关联的角色ID
   * - status: 用户状态：active-活跃，inactive-不活跃，locked-锁定
   * - last_login_at: 最后登录时间
   * - last_login_ip: 最后登录IP地址
   * - created_at: 创建时间
   * - updated_at: 更新时间
   */
  const User = sequelize.define(
    // 模型名称
    'User',
    // 字段定义
    {
      /**
       * 主键ID
       * - 类型: 整数
       * - 自增
       * - 主键
       */
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '用户ID',
      },

      /**
       * 用户名
       * - 类型: 字符串
       * - 必填，不能为空
       * - 长度限制: 3-50 个字符
       * - 唯一标识
       * - 只能包含字母、数字、下划线和连字符
       */
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: '用户名',
        validate: {
          // 验证：不能为空
          notEmpty: {
            msg: '用户名不能为空',
          },
          // 验证：长度范围
          len: {
            args: [3, 50],
            msg: '用户名长度必须在3-50个字符之间',
          },
          // 验证：格式（只允许字母、数字、下划线和连字符）
          is: {
            args: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
            msg: '用户名必须以字母开头，只能包含字母、数字、下划线和连字符',
          },
        },
      },

      /**
       * 密码
       * - 类型: 字符串
       * - 必填，不能为空
       * - 长度限制: 最大 255 个字符（bcrypt 哈希值）
       * - 使用 bcrypt 加密存储
       */
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: '密码（bcrypt加密存储）',
        validate: {
          // 验证：不能为空
          notEmpty: {
            msg: '密码不能为空',
          },
          // 验证：最小长度（原始密码，非哈希值）
          len: {
            args: [6, 255],
            msg: '密码长度必须在6-50个字符之间',
          },
        },
      },

      /**
       * 邮箱地址
       * - 类型: 字符串
       * - 可选
       * - 长度限制: 最大 100 个字符
       * - 必须符合邮箱格式
       * - 唯一
       */
      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
        comment: '邮箱地址',
        validate: {
          // 验证：邮箱格式
          isEmail: {
            msg: '邮箱格式不正确',
          },
          // 验证：长度限制
          len: {
            args: [0, 100],
            msg: '邮箱长度不能超过100个字符',
          },
        },
      },

      /**
       * 手机号码
       * - 类型: 字符串
       * - 可选
       * - 长度限制: 最大 20 个字符
       * - 必须符合手机号格式
       */
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: '手机号码',
        validate: {
          // 验证：手机号格式（中国大陆手机号）
          is: {
            args: /^1[3-9]\d{9}$/,
            msg: '手机号格式不正确',
          },
          // 验证：长度限制
          len: {
            args: [0, 20],
            msg: '手机号长度不能超过20个字符',
          },
        },
      },

      /**
       * 真实姓名
       * - 类型: 字符串
       * - 可选
       * - 长度限制: 最大 50 个字符
       */
      real_name: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '真实姓名',
        validate: {
          // 验证：长度限制
          len: {
            args: [0, 50],
            msg: '真实姓名长度不能超过50个字符',
          },
        },
      },

      /**
       * 角色ID
       * - 类型: 整数
       * - 外键，关联 roles 表
       * - 可为空（表示未分配角色）
       */
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '角色ID',
        references: {
          model: 'roles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      /**
       * 用户状态
       * - 类型: 枚举
       * - 可选值: active（活跃）、inactive（不活跃）、locked（锁定）
       * - 默认值: active
       */
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'locked'),
        allowNull: false,
        defaultValue: 'active',
        comment: '用户状态：active-活跃，inactive-不活跃，locked-锁定',
      },

      /**
       * 最后登录时间
       * - 类型: 时间戳
       * - 可选
       */
      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '最后登录时间',
      },

      /**
       * 最后登录IP地址
       * - 类型: 字符串
       * - 可选
       * - 支持 IPv4 和 IPv6
       */
      last_login_ip: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: '最后登录IP地址',
        validate: {
          // 验证：IP 地址格式
          isIP: {
            msg: 'IP地址格式不正确',
          },
        },
      },
    },
    // 模型选项
    {
      // 表名
      tableName: 'users',
      
      // 时间戳
      timestamps: true,
      
      // 创建时间字段名
      createdAt: 'created_at',
      
      // 更新时间字段名
      updatedAt: 'updated_at',
      
      // 索引定义
      indexes: [
        // 用户名唯一索引
        {
          unique: true,
          fields: ['username'],
          name: 'idx_users_username',
        },
        // 邮箱唯一索引
        {
          unique: true,
          fields: ['email'],
          name: 'idx_users_email',
          // 允许空值
          where: {
            email: {
              [sequelize.Sequelize.Op.ne]: null,
            },
          },
        },
        // 角色ID索引
        {
          fields: ['role_id'],
          name: 'idx_users_role_id',
        },
        // 状态索引
        {
          fields: ['status'],
          name: 'idx_users_status',
        },
        // 创建时间索引
        {
          fields: ['created_at'],
          name: 'idx_users_created_at',
        },
      ],
      
      // 钩子函数
      hooks: {
        /**
         * 创建前钩子
         * - 自动加密密码
         * - 检查用户名和邮箱是否已存在
         */
        beforeCreate: async (user, options) => {
          // 加密密码
          if (user.password) {
            user.password = await User.hashPassword(user.password);
          }
          
          // 检查用户名是否已存在
          const existingUserByUsername = await User.findOne({
            where: { username: user.username },
            transaction: options.transaction,
          });
          
          if (existingUserByUsername) {
            throw new Error(`用户名 "${user.username}" 已存在`);
          }
          
          // 检查邮箱是否已存在
          if (user.email) {
            const existingUserByEmail = await User.findOne({
              where: { email: user.email },
              transaction: options.transaction,
            });
            
            if (existingUserByEmail) {
              throw new Error(`邮箱 "${user.email}" 已被使用`);
            }
          }
        },
        
        /**
         * 更新前钩子
         * - 如果密码被修改，自动加密
         * - 检查用户名和邮箱是否与其他用户重复
         */
        beforeUpdate: async (user, options) => {
          // 如果密码被修改，加密新密码
          if (user.changed('password') && user.password) {
            user.password = await User.hashPassword(user.password);
          }
          
          // 如果修改了用户名，检查是否与其他用户重复
          if (user.changed('username')) {
            const existingUser = await User.findOne({
              where: { username: user.username },
              transaction: options.transaction,
            });
            
            if (existingUser && existingUser.id !== user.id) {
              throw new Error(`用户名 "${user.username}" 已存在`);
            }
          }
          
          // 如果修改了邮箱，检查是否与其他用户重复
          if (user.changed('email') && user.email) {
            const existingUser = await User.findOne({
              where: { email: user.email },
              transaction: options.transaction,
            });
            
            if (existingUser && existingUser.id !== user.id) {
              throw new Error(`邮箱 "${user.email}" 已被使用`);
            }
          }
        },
      },
      
      // 实例方法
      instanceMethods: {},
      
      // 类方法
      classMethods: {},
    }
  );

  // =====================================================
  // 实例方法
  // =====================================================

  /**
   * 验证密码是否正确
   * @param {string} password - 待验证的明文密码
   * @returns {Promise<boolean>} 密码是否正确
   * 
   * @example
   * const isValid = await user.validatePassword('password123');
   */
  User.prototype.validatePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

  /**
   * 更新密码（自动加密）
   * @param {string} newPassword - 新密码（明文）
   * @param {Object} options - 更新选项
   * @returns {Promise<User>} 更新后的用户实例
   * 
   * @example
   * await user.updatePassword('newPassword123');
   */
  User.prototype.updatePassword = async function (newPassword, options = {}) {
    // 验证新密码
    if (!newPassword || newPassword.length < 6) {
      throw new Error('新密码长度必须至少6个字符');
    }
    
    // 加密新密码
    this.password = await User.hashPassword(newPassword);
    
    // 保存
    return await this.save(options);
  };

  /**
   * 激活用户
   * @param {Object} options - 更新选项
   * @returns {Promise<User>} 更新后的用户实例
   * 
   * @example
   * await user.activate();
   */
  User.prototype.activate = async function (options = {}) {
    this.status = 'active';
    return await this.save(options);
  };

  /**
   * 停用用户
   * @param {Object} options - 更新选项
   * @returns {Promise<User>} 更新后的用户实例
   * 
   * @example
   * await user.deactivate();
   */
  User.prototype.deactivate = async function (options = {}) {
    this.status = 'inactive';
    return await this.save(options);
  };

  /**
   * 锁定用户
   * @param {Object} options - 更新选项
   * @returns {Promise<User>} 更新后的用户实例
   * 
   * @example
   * await user.lock();
   */
  User.prototype.lock = async function (options = {}) {
    this.status = 'locked';
    return await this.save(options);
  };

  /**
   * 解锁用户
   * @param {Object} options - 更新选项
   * @returns {Promise<User>} 更新后的用户实例
   * 
   * @example
   * await user.unlock();
   */
  User.prototype.unlock = async function (options = {}) {
    this.status = 'active';
    return await this.save(options);
  };

  /**
   * 更新最后登录信息
   * @param {string} ip - 登录IP地址
   * @param {Object} options - 更新选项
   * @returns {Promise<User>} 更新后的用户实例
   * 
   * @example
   * await user.updateLoginInfo('192.168.1.1');
   */
  User.prototype.updateLoginInfo = async function (ip, options = {}) {
    this.last_login_at = new Date();
    this.last_login_ip = ip;
    return await this.save(options);
  };

  /**
   * 检查用户是否处于活跃状态
   * @returns {boolean} 是否活跃
   * 
   * @example
   * if (user.isActive()) {
   *   // 用户可以正常使用系统
   * }
   */
  User.prototype.isActive = function () {
    return this.status === 'active';
  };

  /**
   * 检查用户是否被锁定
   * @returns {boolean} 是否被锁定
   * 
   * @example
   * if (user.isLocked()) {
   *   // 用户被锁定，无法登录
   * }
   */
  User.prototype.isLocked = function () {
    return this.status === 'locked';
  };

  /**
   * 检查用户是否被停用
   * @returns {boolean} 是否被停用
   * 
   * @example
   * if (user.isInactive()) {
   *   // 用户被停用
   * }
   */
  User.prototype.isInactive = function () {
    return this.status === 'inactive';
  };

  /**
   * 获取用户的角色信息
   * @param {Object} options - 查询选项
   * @returns {Promise<Role|null>} 角色实例
   * 
   * @example
   * const role = await user.getRoleInfo();
   */
  User.prototype.getRoleInfo = async function (options = {}) {
    if (!this.role_id) {
      return null;
    }
    
    // 如果已经加载了关联的 role，直接返回
    if (this.role) {
      return this.role;
    }
    
    // 否则查询数据库
    const Role = sequelize.models.Role;
    if (!Role) {
      throw new Error('Role 模型未定义');
    }
    
    return await Role.findByPk(this.role_id, options);
  };

  /**
   * 检查用户是否拥有指定权限
   * @param {string} module - 模块名称
   * @param {string} resource - 资源名称
   * @param {string} action - 操作名称
   * @returns {Promise<boolean>} 是否拥有该权限
   * 
   * @example
   * const hasPermission = await user.hasPermission('system', 'user', 'create');
   */
  User.prototype.hasPermission = async function (module, resource, action) {
    // 如果用户不是活跃状态，则没有权限
    if (!this.isActive()) {
      return false;
    }
    
    // 获取角色信息
    const role = await this.getRoleInfo();
    
    // 如果没有角色，则没有权限
    if (!role) {
      return false;
    }
    
    // 检查角色权限
    return role.hasPermission(module, resource, action);
  };

  /**
   * 检查用户是否拥有指定模块的任意权限
   * @param {string} module - 模块名称
   * @returns {Promise<boolean>} 是否拥有该模块的任意权限
   * 
   * @example
   * const hasModulePermission = await user.hasModulePermission('crane');
   */
  User.prototype.hasModulePermission = async function (module) {
    if (!this.isActive()) {
      return false;
    }
    
    const role = await this.getRoleInfo();
    
    if (!role) {
      return false;
    }
    
    return role.hasModulePermission(module);
  };

  /**
   * 获取用户的所有权限列表
   * @returns {Promise<Array>} 权限列表
   * 
   * @example
   * const permissions = await user.getAllPermissions();
   */
  User.prototype.getAllPermissions = async function () {
    if (!this.isActive()) {
      return [];
    }
    
    const role = await this.getRoleInfo();
    
    if (!role) {
      return [];
    }
    
    return role.getAllPermissions();
  };

  /**
   * 获取用户的安全表示（过滤敏感信息）
   * 不包含密码等敏感字段
   * @returns {Object} 安全的用户对象
   * 
   * @example
   * const safeUser = user.toSafeObject();
   */
  User.prototype.toSafeObject = function () {
    const safeUser = {
      id: this.id,
      username: this.username,
      email: this.email,
      phone: this.phone,
      real_name: this.real_name,
      role_id: this.role_id,
      status: this.status,
      last_login_at: this.last_login_at,
      last_login_ip: this.last_login_ip,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
    
    // 如果加载了角色信息，也包含进去
    if (this.role) {
      safeUser.role = this.role.toSafeObject ? this.role.toSafeObject() : this.role;
    }
    
    return safeUser;
  };

  /**
   * 获取用户的公开信息（用于展示）
   * 只包含基本信息
   * @returns {Object} 公开的用户对象
   * 
   * @example
   * const publicUser = user.toPublicObject();
   */
  User.prototype.toPublicObject = function () {
    return {
      id: this.id,
      username: this.username,
      real_name: this.real_name,
      status: this.status,
    };
  };

  // =====================================================
  // 类方法（静态方法）
  // =====================================================

  /**
   * 加密密码
   * @param {string} password - 明文密码
   * @param {number} rounds - 加密轮次，默认 10
   * @returns {Promise<string>} 加密后的密码
   * 
   * @example
   * const hashedPassword = await User.hashPassword('password123');
   */
  User.hashPassword = async function (password, rounds = 10) {
    // 生成盐
    const salt = await bcrypt.genSalt(rounds);
    // 加密密码
    return await bcrypt.hash(password, salt);
  };

  /**
   * 根据用户名查找用户
   * @param {string} username - 用户名
   * @param {Object} options - 查询选项
   * @returns {Promise<User|null>} 用户实例
   * 
   * @example
   * const user = await User.findByUsername('admin');
   */
  User.findByUsername = async function (username, options = {}) {
    return await this.findOne({
      where: { username },
      ...options,
    });
  };

  /**
   * 根据邮箱查找用户
   * @param {string} email - 邮箱地址
   * @param {Object} options - 查询选项
   * @returns {Promise<User|null>} 用户实例
   * 
   * @example
   * const user = await User.findByEmail('user@example.com');
   */
  User.findByEmail = async function (email, options = {}) {
    return await this.findOne({
      where: { email },
      ...options,
    });
  };

  /**
   * 根据用户名或邮箱查找用户
   * @param {string} usernameOrEmail - 用户名或邮箱
   * @param {Object} options - 查询选项
   * @returns {Promise<User|null>} 用户实例
   * 
   * @example
   * const user = await User.findByUsernameOrEmail('admin');
   * const user2 = await User.findByUsernameOrEmail('admin@example.com');
   */
  User.findByUsernameOrEmail = async function (usernameOrEmail, options = {}) {
    return await this.findOne({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { username: usernameOrEmail },
          { email: usernameOrEmail },
        ],
      },
      ...options,
    });
  };

  /**
   * 验证用户登录
   * @param {string} usernameOrEmail - 用户名或邮箱
   * @param {string} password - 密码
   * @param {Object} options - 查询选项
   * @returns {Promise<User|null>} 验证成功返回用户实例，失败返回 null
   * 
   * @example
   * const user = await User.authenticate('admin', 'password123');
   * if (user) {
   *   // 登录成功
   * }
   */
  User.authenticate = async function (usernameOrEmail, password, options = {}) {
    // 查找用户
    const user = await this.findByUsernameOrEmail(usernameOrEmail, options);
    
    // 用户不存在
    if (!user) {
      return null;
    }
    
    // 用户被锁定或停用
    if (!user.isActive()) {
      return null;
    }
    
    // 验证密码
    const isValid = await user.validatePassword(password);
    
    if (!isValid) {
      return null;
    }
    
    return user;
  };

  /**
   * 获取所有活跃用户
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<User>>} 用户列表
   * 
   * @example
   * const users = await User.findActive();
   */
  User.findActive = async function (options = {}) {
    return await this.findAll({
      where: { status: 'active' },
      order: [['created_at', 'DESC']],
      ...options,
    });
  };

  /**
   * 根据角色ID查找用户
   * @param {number} roleId - 角色ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<User>>} 用户列表
   * 
   * @example
   * const users = await User.findByRoleId(1);
   */
  User.findByRoleId = async function (roleId, options = {}) {
    return await this.findAll({
      where: { role_id: roleId },
      order: [['created_at', 'DESC']],
      ...options,
    });
  };

  /**
   * 根据状态查找用户
   * @param {string} status - 用户状态
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<User>>} 用户列表
   * 
   * @example
   * const lockedUsers = await User.findByStatus('locked');
   */
  User.findByStatus = async function (status, options = {}) {
    return await this.findAll({
      where: { status },
      order: [['created_at', 'DESC']],
      ...options,
    });
  };

  /**
   * 检查用户名是否已存在
   * @param {string} username - 用户名
   * @param {number} excludeId - 排除的用户ID（用于更新时排除自身）
   * @returns {Promise<boolean>} 是否存在
   * 
   * @example
   * const exists = await User.isUsernameExists('admin');
   */
  User.isUsernameExists = async function (username, excludeId = null) {
    const whereClause = { username };
    
    if (excludeId) {
      whereClause.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }
    
    const count = await this.count({ where: whereClause });
    return count > 0;
  };

  /**
   * 检查邮箱是否已存在
   * @param {string} email - 邮箱地址
   * @param {number} excludeId - 排除的用户ID（用于更新时排除自身）
   * @returns {Promise<boolean>} 是否存在
   * 
   * @example
   * const exists = await User.isEmailExists('user@example.com');
   */
  User.isEmailExists = async function (email, excludeId = null) {
    const whereClause = { email };
    
    if (excludeId) {
      whereClause.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }
    
    const count = await this.count({ where: whereClause });
    return count > 0;
  };

  /**
   * 创建用户
   * @param {Object} userData - 用户数据
   * @param {Object} options - 创建选项
   * @returns {Promise<User>} 创建的用户实例
   * 
   * @example
   * const user = await User.createUser({
   *   username: 'newuser',
   *   password: 'password123',
   *   email: 'user@example.com',
   *   real_name: '新用户',
   *   role_id: 2,
   * });
   */
  User.createUser = async function (userData, options = {}) {
    // 检查必填字段
    if (!userData.username) {
      throw new Error('用户名不能为空');
    }
    if (!userData.password) {
      throw new Error('密码不能为空');
    }
    
    // 创建用户（密码会在 beforeCreate 钩子中自动加密）
    return await this.create(userData, options);
  };

  /**
   * 更新用户信息
   * @param {number} userId - 用户ID
   * @param {Object} updateData - 更新数据
   * @param {Object} options - 更新选项
   * @returns {Promise<User>} 更新后的用户实例
   * 
   * @example
   * const user = await User.updateUser(1, {
   *   real_name: '新名字',
   *   phone: '13800138000',
   * });
   */
  User.updateUser = async function (userId, updateData, options = {}) {
    // 查找用户
    const user = await this.findByPk(userId, options);
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 更新用户信息
    return await user.update(updateData, options);
  };

  /**
   * 删除用户
   * @param {number} userId - 用户ID
   * @param {Object} options - 删除选项
   * @returns {Promise<boolean>} 是否删除成功
   * 
   * @example
   * await User.deleteUser(1);
   */
  User.deleteUser = async function (userId, options = {}) {
    // 查找用户
    const user = await this.findByPk(userId, options);
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 删除用户
    await user.destroy(options);
    return true;
  };

  /**
   * 批量更新用户状态
   * @param {Array<number>} userIds - 用户ID列表
   * @param {string} status - 新状态
   * @param {Object} options - 更新选项
   * @returns {Promise<number>} 更新的记录数
   * 
   * @example
   * // 批量锁定用户
   * await User.batchUpdateStatus([1, 2, 3], 'locked');
   */
  User.batchUpdateStatus = async function (userIds, status, options = {}) {
    return await this.update(
      { status },
      {
        where: {
          id: { [sequelize.Sequelize.Op.in]: userIds },
        },
        ...options,
      }
    );
  };

  /**
   * 获取用户统计信息
   * @returns {Promise<Object>} 统计信息
   * 
   * @example
   * const stats = await User.getStats();
   */
  User.getStats = async function () {
    const total = await this.count();
    const active = await this.count({ where: { status: 'active' } });
    const inactive = await this.count({ where: { status: 'inactive' } });
    const locked = await this.count({ where: { status: 'locked' } });
    
    return {
      total,
      active,
      inactive,
      locked,
    };
  };

  /**
   * 获取用户列表（分页）
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.limit - 每页数量
   * @param {string} params.status - 状态筛选
   * @param {number} params.role_id - 角色ID筛选
   * @param {string} params.keyword - 关键词搜索（用户名、邮箱、真实姓名）
   * @returns {Promise<Object>} 分页结果
   * 
   * @example
   * const result = await User.getUserList({
   *   page: 1,
   *   limit: 10,
   *   status: 'active',
   *   keyword: 'admin',
   * });
   */
  User.getUserList = async function (params = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      role_id,
      keyword,
    } = params;
    
    // 构建 where 条件
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (role_id) {
      where.role_id = role_id;
    }
    
    if (keyword) {
      where[sequelize.Sequelize.Op.or] = [
        { username: { [sequelize.Sequelize.Op.iLike]: `%${keyword}%` } },
        { email: { [sequelize.Sequelize.Op.iLike]: `%${keyword}%` } },
        { real_name: { [sequelize.Sequelize.Op.iLike]: `%${keyword}%` } },
      ];
    }
    
    // 计算偏移量
    const offset = (page - 1) * limit;
    
    // 查询
    const { count, rows } = await this.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: sequelize.models.Role,
          as: 'role',
          required: false,
        },
      ],
    });
    
    return {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      list: rows,
    };
  };

  // =====================================================
  // 返回模型
  // =====================================================

  return User;
};
