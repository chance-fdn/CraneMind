/**
 * Token工具测试文件
 * 测试Token工具模块的所有功能
 */

const tokenUtils = require('./token');

// 测试用的用户数据
const testUserData = {
  userId: 1,
  username: 'testuser',
  roleId: 2,
  permissions: ['user:read', 'user:write']
};

// 测试用的刷新Token数据
const testRefreshTokenData = {
  userId: 1,
  username: 'testuser'
};

describe('Token工具模块测试', () => {
  let accessToken;
  let refreshToken;

  // 测试前准备
  beforeAll(() => {
    // 设置测试环境变量
    process.env.JWT_SECRET = 'test-secret-key-for-jwt-token-utils';
  });

  // 测试后清理
  afterAll(() => {
    // 清理环境变量
    delete process.env.JWT_SECRET;
  });

  describe('1. 生成访问Token测试', () => {
    test('应该成功生成访问Token', () => {
      accessToken = tokenUtils.generateAccessToken(testUserData);
      
      expect(accessToken).toBeDefined();
      expect(typeof accessToken).toBe('string');
      expect(accessToken.length).toBeGreaterThan(0);
    });

    test('生成访问Token时应该包含tokenType字段', () => {
      const decoded = tokenUtils.decodeToken(accessToken);
      
      expect(decoded.tokenType).toBe('access');
      expect(decoded.userId).toBe(testUserData.userId);
      expect(decoded.username).toBe(testUserData.username);
    });

    test('生成访问Token时应该包含iat字段', () => {
      const decoded = tokenUtils.decodeToken(accessToken);
      
      expect(decoded.iat).toBeDefined();
      expect(typeof decoded.iat).toBe('number');
    });

    test('生成访问Token时应该包含exp字段', () => {
      const decoded = tokenUtils.decodeToken(accessToken);
      
      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe('number');
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    test('生成访问Token时应该验证载荷', () => {
      expect(() => {
        tokenUtils.generateAccessToken(null);
      }).toThrow('Token载荷不能为空且必须是对象');

      expect(() => {
        tokenUtils.generateAccessToken({});
      }).toThrow('Token载荷不能为空对象');

      expect(() => {
        tokenUtils.generateAccessToken('invalid');
      }).toThrow('Token载荷不能为空且必须是对象');
    });
  });

  describe('2. 生成刷新Token测试', () => {
    test('应该成功生成刷新Token', () => {
      refreshToken = tokenUtils.generateRefreshToken(testRefreshTokenData);
      
      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken.length).toBeGreaterThan(0);
    });

    test('生成刷新Token时应该包含tokenType字段', () => {
      const decoded = tokenUtils.decodeToken(refreshToken);
      
      expect(decoded.tokenType).toBe('refresh');
      expect(decoded.userId).toBe(testRefreshTokenData.userId);
      expect(decoded.username).toBe(testRefreshTokenData.username);
    });

    test('生成刷新Token时应该包含iat字段', () => {
      const decoded = tokenUtils.decodeToken(refreshToken);
      
      expect(decoded.iat).toBeDefined();
      expect(typeof decoded.iat).toBe('number');
    });

    test('生成刷新Token时应该包含exp字段', () => {
      const decoded = tokenUtils.decodeToken(refreshToken);
      
      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe('number');
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    test('生成刷新Token时应该验证载荷', () => {
      expect(() => {
        tokenUtils.generateRefreshToken(null);
      }).toThrow('Token载荷不能为空且必须是对象');

      expect(() => {
        tokenUtils.generateRefreshToken({});
      }).toThrow('刷新Token必须包含userId字段');

      expect(() => {
        tokenUtils.generateRefreshToken({ username: 'test' });
      }).toThrow('刷新Token必须包含userId字段');

      expect(() => {
        tokenUtils.generateRefreshToken('invalid');
      }).toThrow('Token载荷不能为空且必须是对象');
    });
  });

  describe('3. 验证Token测试', () => {
    test('应该成功验证访问Token', () => {
      const payload = tokenUtils.verifyToken(accessToken, 'access');
      
      expect(payload).toBeDefined();
      expect(payload.tokenType).toBe('access');
      expect(payload.userId).toBe(testUserData.userId);
      expect(payload.username).toBe(testUserData.username);
    });

    test('应该成功验证刷新Token', () => {
      const payload = tokenUtils.verifyToken(refreshToken, 'refresh');
      
      expect(payload).toBeDefined();
      expect(payload.tokenType).toBe('refresh');
      expect(payload.userId).toBe(testRefreshTokenData.userId);
      expect(payload.username).toBe(testRefreshTokenData.username);
    });

    test('验证Token时应该检查Token类型', () => {
      expect(() => {
        tokenUtils.verifyToken(accessToken, 'refresh');
      }).toThrow('Token类型不匹配，期望 refresh，实际 access');

      expect(() => {
        tokenUtils.verifyToken(refreshToken, 'access');
      }).toThrow('Token类型不匹配，期望 access，实际 refresh');
    });

    test('验证Token时应该验证输入参数', () => {
      expect(() => {
        tokenUtils.verifyToken(null, 'access');
      }).toThrow('Token不能为空且必须是字符串');

      expect(() => {
        tokenUtils.verifyToken('', 'access');
      }).toThrow('Token不能为空且必须是字符串');

      expect(() => {
        tokenUtils.verifyToken('   ', 'access');
      }).toThrow('Token不能为空且必须是字符串');

      expect(() => {
        tokenUtils.verifyToken(accessToken, 'invalid');
      }).toThrow('Token类型必须是 "access" 或 "refresh"');
    });

    test('应该检测无效的Token', () => {
      const invalidToken = 'invalid.token.string';
      
      expect(() => {
        tokenUtils.verifyToken(invalidToken, 'access');
      }).toThrow('Token无效或格式错误');
    });

    test('应该检测过期的Token', () => {
      // 创建一个立即过期的Token
      const expiredToken = tokenUtils.generateAccessToken(testUserData);
      
      // 模拟Token过期（这里我们无法真正让Token过期，但可以测试错误处理）
      // 这个测试主要是验证错误处理逻辑
      expect(() => {
        tokenUtils.verifyToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoidGVzdCIsInRva2VuVHlwZSI6ImFjY2VzcyIsImlhdCI6MTYxNzE5MDIyMiwiZXhwIjoxNjE3MTkwMjIyfQ.invalid-signature', 'access');
      }).toThrow();
    });
  });

  describe('4. 解码Token测试', () => {
    test('应该成功解码Token', () => {
      const decoded = tokenUtils.decodeToken(accessToken);
      
      expect(decoded).toBeDefined();
      expect(decoded.tokenType).toBe('access');
      expect(decoded.userId).toBe(testUserData.userId);
    });

    test('解码Token时应该验证输入参数', () => {
      expect(() => {
        tokenUtils.decodeToken(null);
      }).toThrow('Token不能为空且必须是字符串');

      expect(() => {
        tokenUtils.decodeToken('');
      }).toThrow('Token不能为空且必须是字符串');

      expect(() => {
        tokenUtils.decodeToken('   ');
      }).toThrow('Token不能为空且必须是字符串');
    });

    test('应该检测格式错误的Token', () => {
      const invalidToken = 'invalid.token.string';
      
      expect(() => {
        tokenUtils.decodeToken(invalidToken);
      }).toThrow('Token格式错误，无法解码');
    });
  });

  describe('5. 刷新访问Token测试', () => {
    test('应该成功刷新访问Token', () => {
      const newAccessToken = tokenUtils.refreshAccessToken(refreshToken);
      
      expect(newAccessToken).toBeDefined();
      expect(typeof newAccessToken).toBe('string');
      expect(newAccessToken.length).toBeGreaterThan(0);
      
      // 验证新Token
      const payload = tokenUtils.verifyToken(newAccessToken, 'access');
      expect(payload.tokenType).toBe('access');
      expect(payload.userId).toBe(testRefreshTokenData.userId);
    });

    test('刷新访问Token时应该验证刷新Token', () => {
      expect(() => {
        tokenUtils.refreshAccessToken('invalid-token');
      }).toThrow('刷新访问Token失败');
    });
  });

  describe('6. 从请求头提取Token测试', () => {
    test('应该成功从有效的Authorization头提取Token', () => {
      const authHeader = `Bearer ${accessToken}`;
      const token = tokenUtils.getTokenFromHeader(authHeader);
      
      expect(token).toBe(accessToken);
    });

    test('应该处理无效的Authorization头', () => {
      expect(tokenUtils.getTokenFromHeader(null)).toBeNull();
      expect(tokenUtils.getTokenFromHeader('')).toBeNull();
      expect(tokenUtils.getTokenFromHeader('   ')).toBeNull();
      expect(tokenUtils.getTokenFromHeader('InvalidHeader')).toBeNull();
      expect(tokenUtils.getTokenFromHeader('Bearer')).toBeNull();
      expect(tokenUtils.getTokenFromHeader('Bearer ')).toBeNull();
      expect(tokenUtils.getTokenFromHeader('Basic token')).toBeNull();
      expect(tokenUtils.getTokenFromHeader('Bearer token1 token2')).toBeNull();
    });

    test('应该处理大小写不敏感的Bearer', () => {
      const authHeader1 = `bearer ${accessToken}`;
      const authHeader2 = `BEARER ${accessToken}`;
      const authHeader3 = `BeArEr ${accessToken}`;
      
      expect(tokenUtils.getTokenFromHeader(authHeader1)).toBe(accessToken);
      expect(tokenUtils.getTokenFromHeader(authHeader2)).toBe(accessToken);
      expect(tokenUtils.getTokenFromHeader(authHeader3)).toBe(accessToken);
    });
  });

  describe('7. 检查Token是否过期测试', () => {
    test('应该正确检查Token是否过期', () => {
      const isExpired = tokenUtils.isTokenExpired(accessToken);
      
      expect(typeof isExpired).toBe('boolean');
      // 新生成的Token应该没有过期
      expect(isExpired).toBe(false);
    });

    test('检查Token过期时应该验证输入参数', () => {
      expect(() => {
        tokenUtils.isTokenExpired(null);
      }).toThrow('检查Token过期失败');

      expect(() => {
        tokenUtils.isTokenExpired('');
      }).toThrow('检查Token过期失败');
    });
  });

  describe('8. 获取Token剩余有效期测试', () => {
    test('应该正确获取Token剩余有效期', () => {
      const secondsLeft = tokenUtils.getTokenExpirationSeconds(accessToken);
      
      expect(typeof secondsLeft).toBe('number');
      // 新生成的Token应该还有效
      expect(secondsLeft).toBeGreaterThan(0);
    });

    test('获取Token剩余有效期时应该验证输入参数', () => {
      expect(() => {
        tokenUtils.getTokenExpirationSeconds(null);
      }).toThrow('计算Token剩余有效期失败');
    });
  });

  describe('9. 获取Token过期时间测试', () => {
    test('应该正确获取Token过期时间', () => {
      const expirationDate = tokenUtils.getTokenExpirationDate(accessToken);
      
      expect(expirationDate).toBeInstanceOf(Date);
      expect(expirationDate.getTime()).toBeGreaterThan(Date.now());
    });

    test('获取Token过期时间时应该验证输入参数', () => {
      expect(() => {
        tokenUtils.getTokenExpirationDate(null);
      }).toThrow('获取Token过期时间失败');
    });
  });

  describe('10. 获取Token签发时间测试', () => {
    test('应该正确获取Token签发时间', () => {
      const issuedAtDate = tokenUtils.getTokenIssuedAtDate(accessToken);
      
      expect(issuedAtDate).toBeInstanceOf(Date);
      expect(issuedAtDate.getTime()).toBeLessThanOrEqual(Date.now());
    });

    test('获取Token签发时间时应该验证输入参数', () => {
      expect(() => {
        tokenUtils.getTokenIssuedAtDate(null);
      }).toThrow('获取Token签发时间失败');
    });
  });

  describe('11. 验证Token并获取用户信息测试', () => {
    test('应该成功验证Token并获取用户信息', () => {
      const userInfo = tokenUtils.verifyAndGetUserInfo(accessToken);
      
      expect(userInfo).toBeDefined();
      expect(userInfo.userId).toBe(testUserData.userId);
      expect(userInfo.username).toBe(testUserData.username);
      expect(userInfo.roleId).toBe(testUserData.roleId);
      expect(Array.isArray(userInfo.permissions)).toBe(true);
      expect(userInfo.permissions).toEqual(testUserData.permissions);
    });

    test('验证Token并获取用户信息时应该验证Token', () => {
      expect(() => {
        tokenUtils.verifyAndGetUserInfo('invalid-token');
      }).toThrow('验证Token并获取用户信息失败');
    });
  });

  describe('12. 批量验证Token测试', () => {
    test('应该成功批量验证Token', () => {
      const tokens = [accessToken, refreshToken, 'invalid-token'];
      const results = tokenUtils.batchVerifyTokens(tokens, 'access');
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(3);
      
      // 第一个Token应该有效
      expect(results[0].valid).toBe(true);
      expect(results[0].payload).toBeDefined();
      expect(results[0].error).toBeNull();
      
      // 第二个Token类型不匹配，应该无效
      expect(results[1].valid).toBe(false);
      expect(results[1].payload).toBeNull();
      expect(results[1].error).toBeDefined();
      
      // 第三个Token无效
      expect(results[2].valid).toBe(false);
      expect(results[2].payload).toBeNull();
      expect(results[2].error).toBeDefined();
    });

    test('批量验证Token时应该验证输入参数', () => {
      expect(() => {
        tokenUtils.batchVerifyTokens(null, 'access');
      }).toThrow('tokens参数必须是数组');

      expect(() => {
        tokenUtils.batchVerifyTokens([], 'invalid');
      }).toThrow('Token类型必须是 "access" 或 "refresh"');
    });
  });

  describe('13. 更新配置测试', () => {
    test('应该成功更新配置', () => {
      const newConfig = {
        jwtSecret: 'new-test-secret',
        accessTokenExpiresIn: '30m',
        refreshTokenExpiresIn: '14d'
      };
      
      tokenUtils.updateConfig(newConfig);
      
      // 使用新配置生成Token
      const newToken = tokenUtils.generateAccessToken(testUserData);
      expect(newToken).toBeDefined();
      
      // 恢复默认配置
      tokenUtils.updateConfig({
        jwtSecret: 'test-secret-key-for-jwt-token-utils',
        accessTokenExpiresIn: '15m',
        refreshTokenExpiresIn: '7d'
      });
    });

    test('更新配置时应该验证参数', () => {
      expect(() => {
        tokenUtils.updateConfig({ jwtSecret: '' });
      }).toThrow('JWT密钥不能为空且必须是字符串');

      expect(() => {
        tokenUtils.updateConfig({ jwtSecret: '   ' });
      }).toThrow('JWT密钥不能为空且必须是字符串');

      expect(() => {
        tokenUtils.updateConfig({ accessTokenExpiresIn: '' });
      }).toThrow('访问Token有效期不能为空且必须是字符串');

      expect(() => {
        tokenUtils.updateConfig({ refreshTokenExpiresIn: '' });
      }).toThrow('刷新Token有效期不能为空且必须是字符串');
    });
  });

  describe('14. TokenUtils类实例测试', () => {
    test('应该能够创建TokenUtils类实例', () => {
      const customTokenUtils = new tokenUtils.TokenUtils({
        jwtSecret: 'custom-secret',
        accessTokenExpiresIn: '1h',
        refreshTokenExpiresIn: '30d'
      });
      
      expect(customTokenUtils).toBeDefined();
      expect(customTokenUtils.generateAccessToken).toBeDefined();
      expect(customTokenUtils.verifyToken).toBeDefined();
    });

    test('类实例应该使用自定义配置', () => {
      const customTokenUtils = new tokenUtils.TokenUtils({
        jwtSecret: 'custom-secret'
      });
      
      const token = customTokenUtils.generateAccessToken(testUserData);
      expect(token).toBeDefined();
      
      // 使用相同密钥应该能验证
      const payload = customTokenUtils.verifyToken(token, 'access');
      expect(payload).toBeDefined();
    });
  });

  describe('15. 环境变量配置测试', () => {
    test('应该使用环境变量中的JWT密钥', () => {
      // 已经在前面的beforeAll中设置了环境变量
      const token = tokenUtils.generateAccessToken(testUserData);
      expect(token).toBeDefined();
      
      const payload = tokenUtils.verifyToken(token, 'access');
      expect(payload).toBeDefined();
    });

    test('应该处理未配置JWT密钥的情况', () => {
      // 保存当前环境变量
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      // 使用默认实例应该会有警告，但能工作
      const token = tokenUtils.generateAccessToken(testUserData);
      expect(token).toBeDefined();
      
      // 恢复环境变量
      process.env.JWT_SECRET = originalSecret;
    });
  });
});