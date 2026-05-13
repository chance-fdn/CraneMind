/**
 * 密码工具测试文件
 * 测试密码加密工具的各种功能
 */

const passwordUtils = require('./password');

/**
 * 测试密码加密功能
 */
async function testHashPassword() {
  console.log('=== 测试密码加密功能 ===');
  
  try {
    // 测试正常密码加密
    const password = 'MySecurePassword123!';
    const hash = await passwordUtils.hashPassword(password);
    
    console.log('✓ 密码加密成功');
    console.log(`  原始密码: ${password}`);
    console.log(`  加密哈希: ${hash.substring(0, 20)}...`);
    console.log(`  哈希长度: ${hash.length} 字符`);
    
    // 测试空密码
    try {
      await passwordUtils.hashPassword('');
      console.log('✗ 空密码应该抛出错误');
    } catch (error) {
      console.log('✓ 空密码正确抛出错误:', error.message);
    }
    
    // 测试非字符串密码
    try {
      await passwordUtils.hashPassword(123);
      console.log('✗ 非字符串密码应该抛出错误');
    } catch (error) {
      console.log('✓ 非字符串密码正确抛出错误:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('✗ 密码加密测试失败:', error.message);
    return false;
  }
}

/**
 * 测试密码验证功能
 */
async function testComparePassword() {
  console.log('\n=== 测试密码验证功能 ===');
  
  try {
    const password = 'TestPassword456@';
    const wrongPassword = 'WrongPassword789#';
    
    // 先加密密码
    const hash = await passwordUtils.hashPassword(password);
    
    // 测试正确密码
    const isMatch = await passwordUtils.comparePassword(password, hash);
    console.log('✓ 正确密码验证成功:', isMatch ? '匹配' : '不匹配');
    
    // 测试错误密码
    const isWrongMatch = await passwordUtils.comparePassword(wrongPassword, hash);
    console.log('✓ 错误密码验证成功:', isWrongMatch ? '匹配' : '不匹配');
    
    if (isMatch && !isWrongMatch) {
      console.log('✓ 密码验证逻辑正确');
    } else {
      console.log('✗ 密码验证逻辑错误');
      return false;
    }
    
    // 测试无效哈希 - bcrypt.compare 对于格式错误的哈希返回 false 而不是抛出错误
    try {
      const invalidHashResult = await passwordUtils.comparePassword(password, 'invalid-hash');
      console.log('✓ 无效哈希比较结果:', invalidHashResult ? '匹配' : '不匹配');
      if (!invalidHashResult) {
        console.log('  ✓ 无效哈希正确返回 false');
      } else {
        console.log('  ✗ 无效哈希不应该返回 true');
        return false;
      }
    } catch (error) {
      console.log('✓ 无效哈希抛出错误:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('✗ 密码验证测试失败:', error.message);
    return false;
  }
}

/**
 * 测试密码强度验证功能
 */
function testValidatePasswordStrength() {
  console.log('\n=== 测试密码强度验证功能 ===');
  
  const testCases = [
    {
      password: 'weak',
      expected: { isValid: false, strength: 'weak' }
    },
    {
      password: 'weakpass',
      expected: { isValid: false, strength: 'weak' }
    },
    {
      password: 'MediumPass',
      expected: { isValid: false, strength: 'medium' }
    },
    {
      password: 'MediumPass123',
      expected: { isValid: false, strength: 'medium' }
    },
    {
      password: 'StrongPass123!',
      expected: { isValid: true, strength: 'strong' }
    },
    {
      password: 'Aa1!Bb2@Cc3#',
      expected: { isValid: true, strength: 'strong' }
    }
  ];
  
  let allPassed = true;
  
  testCases.forEach((testCase, index) => {
    const result = passwordUtils.validatePasswordStrength(testCase.password);
    
    console.log(`\n测试用例 ${index + 1}: "${testCase.password}"`);
    console.log(`  期望: 有效=${testCase.expected.isValid}, 强度=${testCase.expected.strength}`);
    console.log(`  实际: 有效=${result.isValid}, 强度=${result.strength}`);
    
    if (result.isValid === testCase.expected.isValid && 
        result.strength === testCase.expected.strength) {
      console.log('  ✓ 通过');
    } else {
      console.log('  ✗ 失败');
      console.log('  错误信息:', result.errors.join(', '));
      allPassed = false;
    }
  });
  
  // 测试空密码
  const emptyResult = passwordUtils.validatePasswordStrength('');
  console.log('\n测试空密码:');
  console.log(`  结果: 有效=${emptyResult.isValid}, 强度=${emptyResult.strength}`);
  console.log(`  错误: ${emptyResult.errors.join(', ')}`);
  
  if (!emptyResult.isValid && emptyResult.strength === 'weak') {
    console.log('  ✓ 空密码处理正确');
  } else {
    console.log('  ✗ 空密码处理错误');
    allPassed = false;
  }
  
  return allPassed;
}

/**
 * 测试随机密码生成功能
 */
function testGenerateRandomPassword() {
  console.log('\n=== 测试随机密码生成功能 ===');
  
  try {
    // 测试默认长度
    const defaultPassword = passwordUtils.generateRandomPassword();
    console.log(`✓ 默认长度密码生成成功: ${defaultPassword}`);
    console.log(`  长度: ${defaultPassword.length} 字符`);
    
    // 测试自定义长度
    const customLength = 16;
    const customPassword = passwordUtils.generateRandomPassword(customLength);
    console.log(`\n✓ 自定义长度密码生成成功: ${customPassword}`);
    console.log(`  长度: ${customPassword.length} 字符 (期望: ${customLength})`);
    
    // 验证密码强度
    const strength = passwordUtils.validatePasswordStrength(customPassword);
    console.log(`  强度验证: 有效=${strength.isValid}, 强度=${strength.strength}`);
    
    if (customPassword.length === customLength && strength.isValid) {
      console.log('  ✓ 随机密码符合要求');
    } else {
      console.log('  ✗ 随机密码不符合要求');
      return false;
    }
    
    // 测试无效长度
    try {
      passwordUtils.generateRandomPassword(5);
      console.log('✗ 过短长度应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 过短长度正确抛出错误:', error.message);
    }
    
    try {
      passwordUtils.generateRandomPassword(200);
      console.log('✗ 过长长度应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 过长长度正确抛出错误:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('✗ 随机密码生成测试失败:', error.message);
    return false;
  }
}

/**
 * 测试密码过期检查功能
 */
function testPasswordExpiration() {
  console.log('\n=== 测试密码过期检查功能 ===');
  
  try {
    // 测试未过期密码
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30); // 30天前
    
    const isExpiredRecent = passwordUtils.isPasswordExpired(recentDate, 90);
    console.log(`✓ 30天前修改的密码 (90天有效期): ${isExpiredRecent ? '已过期' : '未过期'}`);
    
    // 测试已过期密码
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 100); // 100天前
    
    const isExpiredOld = passwordUtils.isPasswordExpired(oldDate, 90);
    console.log(`✓ 100天前修改的密码 (90天有效期): ${isExpiredOld ? '已过期' : '未过期'}`);
    
    // 测试剩余天数计算
    const daysLeft = passwordUtils.getPasswordExpirationDays(recentDate, 90);
    console.log(`✓ 剩余天数计算: ${daysLeft} 天`);
    
    if (!isExpiredRecent && isExpiredOld && daysLeft > 0) {
      console.log('  ✓ 密码过期检查逻辑正确');
    } else {
      console.log('  ✗ 密码过期检查逻辑错误');
      return false;
    }
    
    // 测试无效日期
    try {
      passwordUtils.isPasswordExpired('invalid-date', 90);
      console.log('✗ 无效日期应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 无效日期正确抛出错误:', error.message);
    }
    
    // 测试无效天数
    try {
      passwordUtils.isPasswordExpired(new Date(), -10);
      console.log('✗ 无效天数应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 无效天数正确抛出错误:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('✗ 密码过期检查测试失败:', error.message);
    return false;
  }
}

/**
 * 测试密码强度规则更新功能
 */
function testUpdatePasswordStrengthRules() {
  console.log('\n=== 测试密码强度规则更新功能 ===');
  
  try {
    // 保存原始规则
    const originalPassword = 'Simple123';
    const originalResult = passwordUtils.validatePasswordStrength(originalPassword);
    console.log(`原始规则验证 "${originalPassword}": 有效=${originalResult.isValid}`);
    
    // 更新规则 - 降低要求
    passwordUtils.updatePasswordStrengthRules({
      minLength: 6,
      requireSpecialChars: false
    });
    
    const updatedResult = passwordUtils.validatePasswordStrength(originalPassword);
    console.log(`更新规则验证 "${originalPassword}": 有效=${updatedResult.isValid}`);
    
    // 恢复原始规则
    passwordUtils.updatePasswordStrengthRules({
      minLength: 8,
      requireSpecialChars: true
    });
    
    const restoredResult = passwordUtils.validatePasswordStrength(originalPassword);
    console.log(`恢复规则验证 "${originalPassword}": 有效=${restoredResult.isValid}`);
    
    if (!originalResult.isValid && updatedResult.isValid && !restoredResult.isValid) {
      console.log('  ✓ 规则更新功能正常');
      return true;
    } else {
      console.log('  ✗ 规则更新功能异常');
      return false;
    }
  } catch (error) {
    console.error('✗ 规则更新测试失败:', error.message);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('开始运行密码工具测试...\n');
  
  const results = {
    hashPassword: await testHashPassword(),
    comparePassword: await testComparePassword(),
    validatePasswordStrength: testValidatePasswordStrength(),
    generateRandomPassword: testGenerateRandomPassword(),
    passwordExpiration: testPasswordExpiration(),
    updateRules: testUpdatePasswordStrengthRules()
  };
  
  console.log('\n=== 测试结果汇总 ===');
  Object.entries(results).forEach(([testName, passed]) => {
    console.log(`${passed ? '✓' : '✗'} ${testName}: ${passed ? '通过' : '失败'}`);
  });
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('\n🎉 所有测试通过！');
  } else {
    console.log('\n❌ 部分测试失败，请检查代码。');
  }
  
  return allPassed;
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}

// 导出测试函数
module.exports = {
  testHashPassword,
  testComparePassword,
  testValidatePasswordStrength,
  testGenerateRandomPassword,
  testPasswordExpiration,
  testUpdatePasswordStrengthRules,
  runAllTests
};