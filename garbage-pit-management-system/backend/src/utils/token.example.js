/**
 * Token工具使用示例
 * 演示如何使用Token工具模块的各种功能
 */

const tokenUtils = require('./token');

// 示例用户数据
const exampleUser = {
  userId: 123,
  username: 'admin',
  roleId: 1,
  permissions: ['user:read', 'user:write', 'crane:control']
};

console.log('=== Token工具使用示例 ===\n');

// 1. 生成访问Token
console.log('1. 生成访问Token:');
try {
  const accessToken = tokenUtils.generateAccessToken(exampleUser);
  console.log('   生成的访问Token:', accessToken.substring(0, 50) + '...');
  console.log('   Token长度:', accessToken.length, '字符');
} catch (error) {
  console.error('   生成访问Token失败:', error.message);
}

// 2. 生成刷新Token
console.log('\n2. 生成刷新Token:');
try {
  const refreshToken = tokenUtils.generateRefreshToken({
    userId: exampleUser.userId,
    username: exampleUser.username
  });
  console.log('   生成的刷新Token:', refreshToken.substring(0, 50) + '...');
  console.log('   Token长度:', refreshToken.length, '字符');
} catch (error) {
  console.error('   生成刷新Token失败:', error.message);
}

// 3. 验证Token
console.log('\n3. 验证Token:');
try {
  const accessToken = tokenUtils.generateAccessToken(exampleUser);
  const payload = tokenUtils.verifyToken(accessToken, 'access');
  console.log('   验证成功!');
  console.log('   用户ID:', payload.userId);
  console.log('   用户名:', payload.username);
  console.log('   Token类型:', payload.tokenType);
  console.log('   签发时间:', new Date(payload.iat * 1000).toLocaleString());
  console.log('   过期时间:', new Date(payload.exp * 1000).toLocaleString());
} catch (error) {
  console.error('   验证Token失败:', error.message);
}

// 4. 解码Token（不验证）
console.log('\n4. 解码Token（不验证）:');
try {
  const accessToken = tokenUtils.generateAccessToken(exampleUser);
  const decoded = tokenUtils.decodeToken(accessToken);
  console.log('   解码成功!');
  console.log('   用户ID:', decoded.userId);
  console.log('   Token类型:', decoded.tokenType);
} catch (error) {
  console.error('   解码Token失败:', error.message);
}

// 5. 刷新访问Token
console.log('\n5. 刷新访问Token:');
try {
  const refreshToken = tokenUtils.generateRefreshToken({
    userId: exampleUser.userId,
    username: exampleUser.username
  });
  const newAccessToken = tokenUtils.refreshAccessToken(refreshToken);
  console.log('   刷新成功!');
  console.log('   新的访问Token:', newAccessToken.substring(0, 50) + '...');
  
  // 验证新Token
  const payload = tokenUtils.verifyToken(newAccessToken, 'access');
  console.log('   新Token用户ID:', payload.userId);
} catch (error) {
  console.error('   刷新访问Token失败:', error.message);
}

// 6. 从请求头提取Token
console.log('\n6. 从请求头提取Token:');
try {
  const accessToken = tokenUtils.generateAccessToken(exampleUser);
  const authHeader = `Bearer ${accessToken}`;
  const extractedToken = tokenUtils.getTokenFromHeader(authHeader);
  
  console.log('   原始Authorization头:', authHeader.substring(0, 60) + '...');
  console.log('   提取的Token:', extractedToken ? '成功提取' : '提取失败');
  console.log('   提取的Token长度:', extractedToken ? extractedToken.length : 0, '字符');
  
  // 测试无效的Authorization头
  const invalidHeaders = [
    null,
    '',
    '   ',
    'InvalidHeader',
    'Bearer',
    'Bearer ',
    'Basic token',
    'Bearer token1 token2'
  ];
  
  console.log('   无效Authorization头测试:');
  invalidHeaders.forEach(header => {
    const token = tokenUtils.getTokenFromHeader(header);
    console.log(`     "${header}" -> ${token ? '提取成功' : '提取失败'}`);
  });
} catch (error) {
  console.error('   提取Token失败:', error.message);
}

// 7. 检查Token是否过期
console.log('\n7. 检查Token是否过期:');
try {
  const accessToken = tokenUtils.generateAccessToken(exampleUser);
  const isExpired = tokenUtils.isTokenExpired(accessToken);
  console.log('   Token是否过期:', isExpired ? '是' : '否');
  
  const secondsLeft = tokenUtils.getTokenExpirationSeconds(accessToken);
  console.log('   Token剩余有效期:', secondsLeft, '秒');
  console.log('   Token剩余有效期:', Math.floor(secondsLeft / 60), '分钟');
  
  const expirationDate = tokenUtils.getTokenExpirationDate(accessToken);
  console.log('   Token过期时间:', expirationDate.toLocaleString());
  
  const issuedAtDate = tokenUtils.getTokenIssuedAtDate(accessToken);
  console.log('   Token签发时间:', issuedAtDate.toLocaleString());
} catch (error) {
  console.error('   检查Token过期失败:', error.message);
}

// 8. 验证Token并获取用户信息
console.log('\n8. 验证Token并获取用户信息:');
try {
  const accessToken = tokenUtils.generateAccessToken(exampleUser);
  const userInfo = tokenUtils.verifyAndGetUserInfo(accessToken);
  console.log('   获取用户信息成功!');
  console.log('   用户ID:', userInfo.userId);
  console.log('   用户名:', userInfo.username);
  console.log('   角色ID:', userInfo.roleId);
  console.log('   权限列表:', userInfo.permissions.join(', '));
} catch (error) {
  console.error('   获取用户信息失败:', error.message);
}

// 9. 批量验证Token
console.log('\n9. 批量验证Token:');
try {
  const tokens = [
    tokenUtils.generateAccessToken(exampleUser),
    tokenUtils.generateRefreshToken({ userId: 123, username: 'admin' }),
    'invalid-token-1',
    'invalid.token.string'
  ];
  
  const results = tokenUtils.batchVerifyTokens(tokens, 'access');
  console.log('   批量验证结果:');
  results.forEach((result, index) => {
    console.log(`   Token ${index + 1}: ${result.valid ? '有效' : '无效'} - ${result.error || '验证成功'}`);
  });
} catch (error) {
  console.error('   批量验证Token失败:', error.message);
}

// 10. 更新配置
console.log('\n10. 更新配置:');
try {
  console.log('   原始配置:');
  console.log('   - 访问Token有效期: 15分钟');
  console.log('   - 刷新Token有效期: 7天');
  
  // 更新配置
  tokenUtils.updateConfig({
    accessTokenExpiresIn: '30m',
    refreshTokenExpiresIn: '14d'
  });
  
  console.log('   更新后配置:');
  console.log('   - 访问Token有效期: 30分钟');
  console.log('   - 刷新Token有效期: 14天');
  
  // 使用新配置生成Token
  const newToken = tokenUtils.generateAccessToken(exampleUser);
  console.log('   使用新配置生成的Token:', newToken.substring(0, 50) + '...');
  
  // 恢复默认配置
  tokenUtils.updateConfig({
    accessTokenExpiresIn: '15m',
    refreshTokenExpiresIn: '7d'
  });
  console.log('   已恢复默认配置');
} catch (error) {
  console.error('   更新配置失败:', error.message);
}

// 11. 使用TokenUtils类实例
console.log('\n11. 使用TokenUtils类实例:');
try {
  const customTokenUtils = new tokenUtils.TokenUtils({
    jwtSecret: 'custom-secret-key-for-example',
    accessTokenExpiresIn: '1h',
    refreshTokenExpiresIn: '30d'
  });
  
  const customToken = customTokenUtils.generateAccessToken(exampleUser);
  console.log('   使用自定义配置生成的Token:', customToken.substring(0, 50) + '...');
  
  const customPayload = customTokenUtils.verifyToken(customToken, 'access');
  console.log('   验证自定义Token成功!');
  console.log('   用户ID:', customPayload.userId);
} catch (error) {
  console.error('   使用TokenUtils类实例失败:', error.message);
}

// 12. 错误处理示例
console.log('\n12. 错误处理示例:');
console.log('   测试各种错误情况:');

const errorTests = [
  { name: '生成访问Token - 空载荷', test: () => tokenUtils.generateAccessToken(null) },
  { name: '生成访问Token - 空对象', test: () => tokenUtils.generateAccessToken({}) },
  { name: '生成刷新Token - 缺少userId', test: () => tokenUtils.generateRefreshToken({ username: 'test' }) },
  { name: '验证Token - 空字符串', test: () => tokenUtils.verifyToken('', 'access') },
  { name: '验证Token - 无效类型', test: () => tokenUtils.verifyToken('some-token', 'invalid') },
  { name: '解码Token - 格式错误', test: () => tokenUtils.decodeToken('invalid.token.string') },
  { name: '刷新访问Token - 无效Token', test: () => tokenUtils.refreshAccessToken('invalid-refresh-token') },
  { name: '更新配置 - 空密钥', test: () => tokenUtils.updateConfig({ jwtSecret: '' }) }
];

errorTests.forEach(testCase => {
  try {
    testCase.test();
    console.log(`   ${testCase.name}: 未抛出错误（异常）`);
  } catch (error) {
    console.log(`   ${testCase.name}: ${error.message}`);
  }
});

console.log('\n=== 示例完成 ===');
console.log('\n总结:');
console.log('1. Token工具提供了完整的JWT Token管理功能');
console.log('2. 支持访问Token（15分钟有效期）和刷新Token（7天有效期）');
console.log('3. 包含完整的错误处理和输入验证');
console.log('4. 支持从请求头提取Token');
console.log('5. 支持Token刷新机制');
console.log('6. 提供Token过期检查和剩余有效期计算');
console.log('7. 支持批量验证和配置更新');
console.log('8. 所有代码都有中文注释，符合项目要求');