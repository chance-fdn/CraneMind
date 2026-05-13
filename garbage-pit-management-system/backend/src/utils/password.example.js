/**
 * 密码加密工具使用示例
 * 展示如何在项目中使用密码工具模块
 */

const passwordUtils = require('./password');

/**
 * 示例1: 用户注册流程
 */
async function userRegistrationExample() {
  console.log('=== 用户注册示例 ===\n');
  
  // 用户输入的密码
  const userPassword = 'MySecurePassword123!';
  
  // 1. 验证密码强度
  const strengthCheck = passwordUtils.validatePasswordStrength(userPassword);
  console.log('1. 密码强度验证:');
  console.log(`   密码: ${userPassword}`);
  console.log(`   是否有效: ${strengthCheck.isValid}`);
  console.log(`   强度等级: ${strengthCheck.strength}`);
  
  if (!strengthCheck.isValid) {
    console.log(`   错误: ${strengthCheck.errors.join(', ')}`);
    return;
  }
  
  // 2. 加密密码
  try {
    const hashedPassword = await passwordUtils.hashPassword(userPassword);
    console.log('\n2. 密码加密:');
    console.log(`   原始密码: ${userPassword}`);
    console.log(`   加密哈希: ${hashedPassword.substring(0, 30)}...`);
    
    // 3. 模拟保存到数据库
    console.log('\n3. 保存到数据库:');
    console.log('   INSERT INTO users (username, password) VALUES (?, ?)');
    console.log(`   ['user123', '${hashedPassword.substring(0, 30)}...']`);
    
    return hashedPassword;
  } catch (error) {
    console.error('密码加密失败:', error.message);
  }
}

/**
 * 示例2: 用户登录流程
 */
async function userLoginExample(hashedPasswordFromDB) {
  console.log('\n\n=== 用户登录示例 ===\n');
  
  // 用户输入的密码
  const userInputPassword = 'MySecurePassword123!';
  const wrongPassword = 'WrongPassword456@';
  
  // 1. 验证正确密码
  try {
    const isCorrect = await passwordUtils.comparePassword(userInputPassword, hashedPasswordFromDB);
    console.log('1. 验证正确密码:');
    console.log(`   用户输入: ${userInputPassword}`);
    console.log(`   数据库哈希: ${hashedPasswordFromDB.substring(0, 30)}...`);
    console.log(`   验证结果: ${isCorrect ? '✓ 密码正确' : '✗ 密码错误'}`);
  } catch (error) {
    console.error('密码验证失败:', error.message);
  }
  
  // 2. 验证错误密码
  try {
    const isWrong = await passwordUtils.comparePassword(wrongPassword, hashedPasswordFromDB);
    console.log('\n2. 验证错误密码:');
    console.log(`   用户输入: ${wrongPassword}`);
    console.log(`   验证结果: ${isWrong ? '✗ 不应该匹配' : '✓ 正确拒绝'}`);
  } catch (error) {
    console.error('密码验证失败:', error.message);
  }
}

/**
 * 示例3: 密码管理功能
 */
function passwordManagementExample() {
  console.log('\n\n=== 密码管理功能示例 ===\n');
  
  // 1. 生成随机密码
  const randomPassword = passwordUtils.generateRandomPassword(12);
  console.log('1. 生成随机密码:');
  console.log(`   随机密码: ${randomPassword}`);
  
  // 验证随机密码强度
  const randomStrength = passwordUtils.validatePasswordStrength(randomPassword);
  console.log(`   强度验证: ${randomStrength.isValid ? '✓ 有效' : '✗ 无效'}, 等级: ${randomStrength.strength}`);
  
  // 2. 检查密码过期
  const lastChangedDate = new Date('2024-01-01');
  const isExpired = passwordUtils.isPasswordExpired(lastChangedDate, 90);
  const daysLeft = passwordUtils.getPasswordExpirationDays(lastChangedDate, 90);
  
  console.log('\n2. 检查密码过期:');
  console.log(`   最后修改: ${lastChangedDate.toISOString().split('T')[0]}`);
  console.log(`   有效期: 90天`);
  console.log(`   是否过期: ${isExpired ? '✓ 已过期' : '✗ 未过期'}`);
  console.log(`   剩余天数: ${daysLeft}天`);
  
  // 3. 更新密码强度规则
  console.log('\n3. 更新密码强度规则:');
  console.log('   原始规则 - 需要特殊字符');
  
  // 临时修改规则（例如：内部系统可以降低要求）
  passwordUtils.updatePasswordStrengthRules({
    requireSpecialChars: false,
    minLength: 6
  });
  
  const simplePassword = 'Simple123';
  const simpleCheck = passwordUtils.validatePasswordStrength(simplePassword);
  console.log(`   新规则验证 "${simplePassword}": ${simpleCheck.isValid ? '✓ 有效' : '✗ 无效'}`);
  
  // 恢复原始规则
  passwordUtils.updatePasswordStrengthRules({
    requireSpecialChars: true,
    minLength: 8
  });
  
  const restoredCheck = passwordUtils.validatePasswordStrength(simplePassword);
  console.log(`   恢复规则验证 "${simplePassword}": ${restoredCheck.isValid ? '✓ 有效' : '✗ 无效'}`);
}

/**
 * 示例4: 批量密码检查
 */
function batchPasswordCheckExample() {
  console.log('\n\n=== 批量密码检查示例 ===\n');
  
  const passwords = [
    'weak',
    'weakpass',
    'MediumPass',
    'MediumPass123',
    'StrongPass123!',
    'Aa1!Bb2@Cc3#',
    'Admin@2024',
    'Test#1234'
  ];
  
  console.log('密码强度检查结果:');
  console.log('┌──────────────────────────────┬────────┬────────┬─────────────────────┐');
  console.log('│ 密码                          │ 有效   │ 强度   │ 错误                │');
  console.log('├──────────────────────────────┼────────┼────────┼─────────────────────┤');
  
  passwords.forEach(password => {
    const result = passwordUtils.validatePasswordStrength(password);
    const isValid = result.isValid ? '✓' : '✗';
    const errors = result.errors.length > 0 ? result.errors[0] : '-';
    
    // 截断长密码显示
    const displayPassword = password.length > 20 ? password.substring(0, 17) + '...' : password;
    console.log(`│ ${displayPassword.padEnd(28)} │ ${isValid.padEnd(6)} │ ${result.strength.padEnd(6)} │ ${errors.padEnd(19)} │`);
  });
  
  console.log('└──────────────────────────────┴────────┴────────┴─────────────────────┘');
}

/**
 * 运行所有示例
 */
async function runAllExamples() {
  console.log('密码加密工具使用示例\n');
  console.log('=' .repeat(60));
  
  // 运行示例1并获取哈希密码用于示例2
  const hashedPassword = await userRegistrationExample();
  
  if (hashedPassword) {
    await userLoginExample(hashedPassword);
  }
  
  passwordManagementExample();
  batchPasswordCheckExample();
  
  console.log('\n' + '=' .repeat(60));
  console.log('示例运行完成！');
}

// 如果直接运行此文件，则执行示例
if (require.main === module) {
  runAllExamples().catch(error => {
    console.error('示例运行失败:', error);
    process.exit(1);
  });
}

// 导出示例函数
module.exports = {
  userRegistrationExample,
  userLoginExample,
  passwordManagementExample,
  batchPasswordCheckExample,
  runAllExamples
};