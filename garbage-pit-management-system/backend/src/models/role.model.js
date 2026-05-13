/**
 * 垃圾储坑智能化管控系统 - 角色模型
 *
 * 该文件定义了角色表的数据模型，用于存储系统中的角色信息。
 * 角色是权限管理的重要组成部分，用户通过关联角色获得相应的权限。
 *
 * 主要功能：
 * 1. 定义角色表结构和字段验证规则
 * 2. 管理角色的权限信息（JSONB 类型）
 * 3. 提供权限检查的实例方法
 * 4. 定义与其他表的关联关系
 *
 * @module models/role.model
 * @author 华工三峰
 */

'use strict';

/**
 * 角色模型定义
 * @param {Object} sequelize - Sequelize 实例
 * @param {Object} DataTypes - 数据类型定义
 * @returns {Object} 角色模型
 */
module.exports = (sequelize, DataTypes) => {
  // =====================================================
  // 模型定义
  // =====================================================

  /**
   * 角色模型
   * 
   * 数据表名: roles
   * 
   * 字段说明:
   * - id: 主键，自增
   * - name: 角色名称，如"系统管理员"、"操作员"等
   * - code: 角色编码，唯一标识，如"admin"、"operator"等
   * - description: 角色描述
   * - permissions: 权限列表，JSONB 类型存储权限树
   * - level: 角色级别，数值越大权限越高
   * - status: 角色状态：active-启用，inactive-禁用
   * - is_system: 是否为系统内置角色（内置角色不可删除）
   * - created_at: 创建时间
   * - updated_at: 更新时间
   */
  const Role = sequelize.define(
    // 模型名称
    'Role',
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
        comment: '角色ID',
      },

      /**
       * 角色名称
       * - 类型: 字符串
       * - 必填，不能为空
       * - 长度限制: 2-50 个字符
       * - 不能重复
       */
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '角色名称',
        validate: {
          // 验证：不能为空
          notEmpty: {
            msg: '角色名称不能为空',
          },
          // 验证：长度范围
          len: {
            args: [2, 50],
            msg: '角色名称长度必须在2-50个字符之间',
          },
        },
      },

      /**
       * 角色编码
       * - 类型: 字符串
       * - 必填，不能为空
       * - 长度限制: 2-50 个字符
       * - 唯一标识
       * - 只能包含字母、数字、下划线和连字符
       */
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: '角色编码',
        validate: {
          // 验证：不能为空
          notEmpty: {
            msg: '角色编码不能为空',
          },
          // 验证：长度范围
          len: {
            args: [2, 50],
            msg: '角色编码长度必须在2-50个字符之间',
          },
          // 验证：格式（只允许字母、数字、下划线和连字符）
          is: {
            args: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
            msg: '角色编码必须以字母开头，只能包含字母、数字、下划线和连字符',
          },
        },
      },

      /**
       * 角色描述
       * - 类型: 字符串
       * - 可选
       * - 长度限制: 最大 500 个字符
       */
      description: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '角色描述',
        validate: {
          // 验证：长度限制
          len: {
            args: [0, 500],
            msg: '角色描述长度不能超过500个字符',
          },
        },
      },

      /**
       * 权限列表
       * - 类型: JSONB
       * - 存储权限树结构
       * - 默认为空对象
       * 
       * 权限结构示例:
       * {
       *   "system": {
       *     "user": ["create", "read", "update", "delete"],
       *     "role": ["create", "read", "update", "delete"],
       *     "config": ["read", "update"]
       *   },
       *   "crane": {
       *     "control": ["operate", "manual", "auto"],
       *     "monitor": ["view", "export"]
       *   },
       *   "area": {
       *     "manage": ["create", "read", "update", "delete"],
       *     "monitor": ["view"]
       *   },
       *   "task": {
       *     "dispatch": ["create", "cancel", "priority"],
       *     "history": ["view", "export"]
       *   },
       *   "alarm": {
       *     "handle": ["acknowledge", "resolve"],
       *     "config": ["read", "update"]
       *   },
       *   "report": {
       *     "view": ["daily", "weekly", "monthly"],
       *     "export": ["excel", "pdf"]
       *   }
       * }
       */
      permissions: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: '权限列表（JSONB格式）',
        validate: {
          // 验证：必须是有效的权限对象
          isValidPermissions(value) {
            if (value === null || value === undefined) {
              return;
            }

            // 检查是否为对象
            if (typeof value !== 'object' || Array.isArray(value)) {
              throw new Error('权限必须是有效的JSON对象');
            }

            // 验证权限结构
            this.validatePermissionStructure(value);
          },
        },
      },

      /**
       * 角色级别
       * - 类型: 整数
       * - 数值越大权限越高
       * - 用于权限比较和继承
       * - 默认值: 0（最低级别）
       */
      level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '角色级别（数值越大权限越高）',
        validate: {
          // 验证：最小值
          min: {
            args: [0],
            msg: '角色级别不能小于0',
          },
          // 验证：最大值
          max: {
            args: [100],
            msg: '角色级别不能大于100',
          },
        },
      },

      /**
       * 角色状态
       * - 类型: 枚举
       * - 可选值: active（启用）、inactive（禁用）
       * - 默认值: active
       */
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
        comment: '角色状态：active-启用，inactive-禁用',
      },

      /**
       * 是否为系统内置角色
       * - 类型: 布尔值
       * - 系统内置角色不可删除
       * - 默认值: false
       */
      is_system: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否为系统内置角色',
      },
    },
    // 模型选项
    {
      // 表名
      tableName: 'roles',
      
      // 时间戳
      timestamps: true,
      
      // 创建时间字段名
      createdAt: 'created_at',
      
      // 更新时间字段名
      updatedAt: 'updated_at',
      
      // 索引定义
      indexes: [
        // 角色编码唯一索引
        {
          unique: true,
          fields: ['code'],
          name: 'idx_roles_code',
        },
        // 角色名称索引
        {
          fields: ['name'],
          name: 'idx_roles_name',
        },
        // 角色状态索引
        {
          fields: ['status'],
          name: 'idx_roles_status',
        },
        // 角色级别索引
        {
          fields: ['level'],
          name: 'idx_roles_level',
        },
        // JSONB 权限字段索引（GIN 索引，支持 JSONB 查询）
        {
          using: 'GIN',
          fields: [sequelize.literal('permissions')],
          name: 'idx_roles_permissions',
        },
      ],
      
      // 钩子函数
      hooks: {
        // 创建前验证
        beforeCreate: async (role, options) => {
          // 检查角色编码是否已存在
          const existingRole = await Role.findOne({
            where: { code: role.code },
            transaction: options.transaction,
          });
          
          if (existingRole) {
            throw new Error(`角色编码 "${role.code}" 已存在`);
          }
        },
        
        // 更新前验证
        beforeUpdate: async (role, options) => {
          // 如果修改了角色编码，检查是否与其他角色重复
          if (role.changed('code')) {
            const existingRole = await Role.findOne({
              where: { code: role.code },
              transaction: options.transaction,
            });
            
            if (existingRole && existingRole.id !== role.id) {
              throw new Error(`角色编码 "${role.code}" 已存在`);
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
   * 检查是否拥有指定权限
   * @param {string} module - 模块名称，如 'system'、'crane'
   * @param {string} resource - 资源名称，如 'user'、'control'
   * @param {string} action - 操作名称，如 'create'、'read'、'update'、'delete'
   * @returns {boolean} 是否拥有该权限
   * 
   * @example
   * // 检查是否有用户创建权限
   * role.hasPermission('system', 'user', 'create');
   * 
   * // 检查是否有行车操作权限
   * role.hasPermission('crane', 'control', 'operate');
   */
  Role.prototype.hasPermission = function (module, resource, action) {
    // 如果角色被禁用，则没有权限
    if (this.status !== 'active') {
      return false;
    }

    const permissions = this.permissions || {};

    // 检查模块是否存在
    if (!permissions[module]) {
      return false;
    }

    // 检查资源是否存在
    if (!permissions[module][resource]) {
      return false;
    }

    // 检查操作是否在权限列表中
    const actions = permissions[module][resource];
    
    // 支持 '*' 通配符（表示拥有所有权限）
    if (actions.includes('*')) {
      return true;
    }

    return Array.isArray(actions) && actions.includes(action);
  };

  /**
   * 检查是否拥有模块的任意权限
   * @param {string} module - 模块名称
   * @returns {boolean} 是否拥有该模块的任意权限
   * 
   * @example
   * // 检查是否有行车模块的任意权限
   * role.hasModulePermission('crane');
   */
  Role.prototype.hasModulePermission = function (module) {
    if (this.status !== 'active') {
      return false;
    }

    const permissions = this.permissions || {};
    return !!permissions[module];
  };

  /**
   * 检查是否拥有资源的任意权限
   * @param {string} module - 模块名称
   * @param {string} resource - 资源名称
   * @returns {boolean} 是否拥有该资源的任意权限
   * 
   * @example
   * // 检查是否有用户资源的任意权限
   * role.hasResourcePermission('system', 'user');
   */
  Role.prototype.hasResourcePermission = function (module, resource) {
    if (this.status !== 'active') {
      return false;
    }

    const permissions = this.permissions || {};
    return !!(permissions[module] && permissions[module][resource]);
  };

  /**
   * 获取指定模块和资源的所有权限
   * @param {string} module - 模块名称
   * @param {string} resource - 资源名称
   * @returns {Array} 权限列表
   * 
   * @example
   * // 获取用户资源的所有权限
   * role.getResourcePermissions('system', 'user');
   * // 返回: ['create', 'read', 'update', 'delete']
   */
  Role.prototype.getResourcePermissions = function (module, resource) {
    const permissions = this.permissions || {};
    
    if (!permissions[module] || !permissions[module][resource]) {
      return [];
    }

    const actions = permissions[module][resource];
    return Array.isArray(actions) ? actions : [];
  };

  /**
   * 获取所有权限（扁平化结构）
   * @returns {Array} 权限列表，格式为 ['module:resource:action', ...]
   * 
   * @example
   * // 获取所有权限
   * role.getAllPermissions();
   * // 返回: ['system:user:create', 'system:user:read', 'crane:control:operate']
   */
  Role.prototype.getAllPermissions = function () {
    const permissions = this.permissions || {};
    const result = [];

    for (const module in permissions) {
      if (typeof permissions[module] !== 'object') continue;
      
      for (const resource in permissions[module]) {
        const actions = permissions[module][resource];
        
        if (Array.isArray(actions)) {
          actions.forEach(action => {
            result.push(`${module}:${resource}:${action}`);
          });
        }
      }
    }

    return result;
  };

  /**
   * 添加权限
   * @param {string} module - 模块名称
   * @param {string} resource - 资源名称
   * @param {string|Array} actions - 操作名称或操作列表
   * @returns {Object} 更新后的权限对象
   * 
   * @example
   * // 添加单个权限
   * role.addPermission('system', 'user', 'create');
   * 
   * // 添加多个权限
   * role.addPermission('system', 'user', ['create', 'read', 'update']);
   */
  Role.prototype.addPermission = function (module, resource, actions) {
    const permissions = { ...this.permissions } || {};
    
    // 初始化模块
    if (!permissions[module]) {
      permissions[module] = {};
    }
    
    // 初始化资源
    if (!permissions[module][resource]) {
      permissions[module][resource] = [];
    }
    
    // 确保当前权限是数组
    const currentActions = permissions[module][resource];
    if (!Array.isArray(currentActions)) {
      permissions[module][resource] = [];
    }
    
    // 将 actions 转换为数组
    const actionsArray = Array.isArray(actions) ? actions : [actions];
    
    // 添加新权限（去重）
    actionsArray.forEach(action => {
      if (action && !permissions[module][resource].includes(action)) {
        permissions[module][resource].push(action);
      }
    });
    
    // 更新权限
    this.permissions = permissions;
    
    return permissions;
  };

  /**
   * 移除权限
   * @param {string} module - 模块名称
   * @param {string} resource - 资源名称
   * @param {string|Array} actions - 操作名称或操作列表
   * @returns {Object} 更新后的权限对象
   * 
   * @example
   * // 移除单个权限
   * role.removePermission('system', 'user', 'delete');
   * 
   * // 移除多个权限
   * role.removePermission('system', 'user', ['create', 'delete']);
   */
  Role.prototype.removePermission = function (module, resource, actions) {
    const permissions = { ...this.permissions } || {};
    
    // 检查模块和资源是否存在
    if (!permissions[module] || !permissions[module][resource]) {
      return permissions;
    }
    
    // 将 actions 转换为数组
    const actionsArray = Array.isArray(actions) ? actions : [actions];
    
    // 移除权限
    permissions[module][resource] = permissions[module][resource].filter(
      action => !actionsArray.includes(action)
    );
    
    // 如果资源权限为空，移除资源
    if (permissions[module][resource].length === 0) {
      delete permissions[module][resource];
    }
    
    // 如果模块权限为空，移除模块
    if (Object.keys(permissions[module]).length === 0) {
      delete permissions[module];
    }
    
    // 更新权限
    this.permissions = permissions;
    
    return permissions;
  };

  /**
   * 清空所有权限
   * @returns {Object} 更新后的权限对象（空对象）
   */
  Role.prototype.clearPermissions = function () {
    this.permissions = {};
    return this.permissions;
  };

  /**
   * 检查角色是否为系统内置角色
   * @returns {boolean} 是否为系统内置角色
   */
  Role.prototype.isSystem = function () {
    return this.is_system === true;
  };

  /**
   * 检查角色是否处于激活状态
   * @returns {boolean} 是否处于激活状态
   */
  Role.prototype.isActive = function () {
    return this.status === 'active';
  };

  /**
   * 验证权限结构是否有效
   * @param {Object} permissions - 权限对象
   * @returns {boolean} 是否有效
   */
  Role.prototype.validatePermissionStructure = function (permissions) {
    const validActions = [
      'create', 'read', 'update', 'delete', 'export', 'import',
      'operate', 'manual', 'auto', 'view', 'acknowledge', 'resolve',
      'cancel', 'priority', '*', 'daily', 'weekly', 'monthly', 'excel', 'pdf'
    ];

    for (const module in permissions) {
      if (typeof module !== 'string') {
        throw new Error('权限模块名称必须是字符串');
      }

      if (typeof permissions[module] !== 'object' || permissions[module] === null) {
        throw new Error(`模块 "${module}" 的权限配置必须是对象`);
      }

      for (const resource in permissions[module]) {
        if (typeof resource !== 'string') {
          throw new Error('资源名称必须是字符串');
        }

        const actions = permissions[module][resource];
        if (!Array.isArray(actions)) {
          throw new Error(`资源 "${module}.${resource}" 的操作必须是数组`);
        }

        // 验证每个操作
        actions.forEach(action => {
          if (typeof action !== 'string') {
            throw new Error(`操作必须是字符串，当前类型: ${typeof action}`);
          }
          // 注意：这里不限制只能使用预定义的操作，允许自定义操作
        });
      }
    }

    return true;
  };

  /**
   * 获取角色的安全表示（过滤敏感信息）
   * @returns {Object} 安全的角色对象
   */
  Role.prototype.toSafeObject = function () {
    return {
      id: this.id,
      name: this.name,
      code: this.code,
      description: this.description,
      permissions: this.permissions,
      level: this.level,
      status: this.status,
      is_system: this.is_system,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  };

  // =====================================================
  // 类方法（静态方法）
  // =====================================================

  /**
   * 根据角色编码查找角色
   * @param {string} code - 角色编码
   * @param {Object} options - 查询选项
   * @returns {Promise<Role|null>} 角色实例
   * 
   * @example
   * const role = await Role.findByCode('admin');
   */
  Role.findByCode = async function (code, options = {}) {
    return await this.findOne({
      where: { code },
      ...options,
    });
  };

  /**
   * 获取所有活跃的角色
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Role>>} 角色列表
   * 
   * @example
   * const roles = await Role.findActive();
   */
  Role.findActive = async function (options = {}) {
    return await this.findAll({
      where: { status: 'active' },
      order: [['level', 'DESC'], ['created_at', 'ASC']],
      ...options,
    });
  };

  /**
   * 获取所有系统内置角色
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Role>>} 系统内置角色列表
   * 
   * @example
   * const systemRoles = await Role.findSystemRoles();
   */
  Role.findSystemRoles = async function (options = {}) {
    return await this.findAll({
      where: { is_system: true },
      order: [['level', 'DESC']],
      ...options,
    });
  };

  /**
   * 根据级别查找角色
   * @param {number} minLevel - 最小级别
   * @param {number} maxLevel - 最大级别
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Role>>} 角色列表
   * 
   * @example
   * // 获取级别在 50-100 之间的角色
   * const roles = await Role.findByLevel(50, 100);
   */
  Role.findByLevel = async function (minLevel, maxLevel, options = {}) {
    const whereClause = {};
    
    if (minLevel !== undefined) {
      whereClause.level = { ...whereClause.level, [sequelize.Sequelize.Op.gte]: minLevel };
    }
    
    if (maxLevel !== undefined) {
      whereClause.level = { ...whereClause.level, [sequelize.Sequelize.Op.lte]: maxLevel };
    }

    return await this.findAll({
      where: whereClause,
      order: [['level', 'DESC']],
      ...options,
    });
  };

  /**
   * 检查角色编码是否已存在
   * @param {string} code - 角色编码
   * @param {number} excludeId - 排除的角色ID（用于更新时排除自身）
   * @returns {Promise<boolean>} 是否存在
   * 
   * @example
   * const exists = await Role.isCodeExists('admin');
   */
  Role.isCodeExists = async function (code, excludeId = null) {
    const whereClause = { code };
    
    if (excludeId) {
      whereClause.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }

    const count = await this.count({ where: whereClause });
    return count > 0;
  };

  /**
   * 创建默认的系统角色
   * @param {Object} transaction - 事务对象
   * @returns {Promise<Array<Role>>} 创建的角色列表
   * 
   * 创建的系统角色包括：
   * 1. 超级管理员 (super_admin) - 拥有所有权限
   * 2. 系统管理员 (admin) - 拥有系统管理权限
   * 3. 操作员 (operator) - 拥有操作权限
   * 4. 观察者 (viewer) - 只有查看权限
   */
  Role.createDefaultRoles = async function (transaction = null) {
    // 定义默认角色
    const defaultRoles = [
      {
        name: '超级管理员',
        code: 'super_admin',
        description: '系统超级管理员，拥有所有权限',
        level: 100,
        status: 'active',
        is_system: true,
        permissions: {
          '*': {
            '*': ['*']  // 拥有所有权限
          }
        },
      },
      {
        name: '系统管理员',
        code: 'admin',
        description: '系统管理员，拥有大部分管理权限',
        level: 80,
        status: 'active',
        is_system: true,
        permissions: {
          system: {
            user: ['create', 'read', 'update', 'delete'],
            role: ['create', 'read', 'update'],
            config: ['read', 'update'],
            log: ['read', 'export'],
          },
          crane: {
            control: ['operate', 'manual', 'auto'],
            monitor: ['view', 'export'],
          },
          area: {
            manage: ['create', 'read', 'update', 'delete'],
            monitor: ['view'],
          },
          task: {
            dispatch: ['create', 'cancel', 'priority'],
            history: ['view', 'export'],
          },
          alarm: {
            handle: ['acknowledge', 'resolve'],
            config: ['read', 'update'],
          },
          report: {
            view: ['daily', 'weekly', 'monthly'],
            export: ['excel', 'pdf'],
          },
        },
      },
      {
        name: '操作员',
        code: 'operator',
        description: '操作员，拥有日常操作权限',
        level: 50,
        status: 'active',
        is_system: true,
        permissions: {
          crane: {
            control: ['operate', 'manual', 'auto'],
            monitor: ['view'],
          },
          area: {
            manage: ['read'],
            monitor: ['view'],
          },
          task: {
            dispatch: ['create'],
            history: ['view'],
          },
          alarm: {
            handle: ['acknowledge'],
            config: ['read'],
          },
          report: {
            view: ['daily', 'weekly'],
            export: [],
          },
        },
      },
      {
        name: '观察者',
        code: 'viewer',
        description: '观察者，只有查看权限',
        level: 10,
        status: 'active',
        is_system: true,
        permissions: {
          crane: {
            control: [],
            monitor: ['view'],
          },
          area: {
            manage: ['read'],
            monitor: ['view'],
          },
          task: {
            dispatch: [],
            history: ['view'],
          },
          alarm: {
            handle: [],
            config: ['read'],
          },
          report: {
            view: ['daily', 'weekly', 'monthly'],
            export: [],
          },
        },
      },
    ];

    // 创建角色
    const createdRoles = [];
    for (const roleData of defaultRoles) {
      // 检查角色是否已存在
      const existingRole = await this.findByCode(roleData.code, { transaction });
      
      if (!existingRole) {
        const role = await this.create(roleData, { transaction });
        createdRoles.push(role);
      }
    }

    return createdRoles;
  };

  // =====================================================
  // 返回模型
  // =====================================================

  return Role;
};
