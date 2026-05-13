/**
 * 日期工具测试文件
 * 测试日期处理工具的各种功能
 */

const dateUtils = require('./date');

/**
 * 测试日期格式化功能
 */
function testFormatDate() {
  console.log('=== 测试日期格式化功能 ===');
  
  try {
    // 测试使用 Date 对象
    const testDate = new Date('2024-01-15T12:30:45');
    const formatted1 = dateUtils.formatDate(testDate, 'YYYY-MM-DD HH:mm:ss');
    console.log('✓ Date 对象格式化成功');
    console.log(`  原始: ${testDate.toISOString()}`);
    console.log(`  结果: ${formatted1}`);
    
    // 测试使用日期字符串
    const formatted2 = dateUtils.formatDate('2024-01-15', 'YYYY/MM/DD');
    console.log('\n✓ 日期字符串格式化成功');
    console.log(`  原始: 2024-01-15`);
    console.log(`  结果: ${formatted2}`);
    
    // 测试使用时间戳
    const timestamp = new Date('2024-01-15').getTime();
    const formatted3 = dateUtils.formatDate(timestamp, 'DD/MM/YYYY');
    console.log('\n✓ 时间戳格式化成功');
    console.log(`  原始: ${timestamp}`);
    console.log(`  结果: ${formatted3}`);
    
    // 测试默认格式
    const formatted4 = dateUtils.formatDate(testDate);
    console.log('\n✓ 默认格式格式化成功');
    console.log(`  结果: ${formatted4}`);
    
    // 测试无效日期
    try {
      dateUtils.formatDate('invalid-date', 'YYYY-MM-DD');
      console.log('✗ 无效日期应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 无效日期正确抛出错误:', error.message);
    }
    
    // 测试无效格式
    try {
      dateUtils.formatDate(testDate, 123);
      console.log('✗ 无效格式应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 无效格式正确抛出错误:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('✗ 日期格式化测试失败:', error.message);
    return false;
  }
}

/**
 * 测试日期解析功能
 */
function testParseDate() {
  console.log('\n=== 测试日期解析功能 ===');
  
  try {
    // 测试使用指定格式解析
    const dateString1 = '2024-01-15';
    const parsed1 = dateUtils.parseDate(dateString1, 'YYYY-MM-DD');
    console.log('✓ 指定格式解析成功');
    console.log(`  原始: ${dateString1}`);
    console.log(`  结果: ${parsed1.toISOString()}`);
    
    // 测试使用不同格式解析
    const dateString2 = '15/01/2024';
    const parsed2 = dateUtils.parseDate(dateString2, 'DD/MM/YYYY');
    console.log('\n✓ 不同格式解析成功');
    console.log(`  原始: ${dateString2}`);
    console.log(`  结果: ${parsed2.toISOString()}`);
    
    // 测试自动解析
    const dateString3 = '2024-01-15 12:30:45';
    const parsed3 = dateUtils.parseDate(dateString3);
    console.log('\n✓ 自动解析成功');
    console.log(`  原始: ${dateString3}`);
    console.log(`  结果: ${parsed3.toISOString()}`);
    
    // 测试无效日期字符串
    try {
      dateUtils.parseDate('invalid-date-string', 'YYYY-MM-DD');
      console.log('✗ 无效日期字符串应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 无效日期字符串正确抛出错误:', error.message);
    }
    
    // 测试空字符串
    try {
      dateUtils.parseDate('', 'YYYY-MM-DD');
      console.log('✗ 空字符串应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 空字符串正确抛出错误:', error.message);
    }
    
    // 测试格式不匹配
    try {
      dateUtils.parseDate('2024-01-15', 'DD/MM/YYYY');
      console.log('✗ 格式不匹配应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 格式不匹配正确抛出错误:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('✗ 日期解析测试失败:', error.message);
    return false;
  }
}

/**
 * 测试添加天数功能
 */
function testAddDays() {
  console.log('\n=== 测试添加天数功能 ===');
  
  try {
    // 测试添加正数天数
    const startDate1 = new Date('2024-01-15');
    const result1 = dateUtils.addDays(startDate1, 7);
    console.log('✓ 添加正数天数成功');
    console.log(`  开始: ${startDate1.toISOString()}`);
    console.log(`  结果: ${result1.toISOString()}`);
    console.log(`  预期: 2024-01-22`);
    
    // 测试添加负数天数（相当于减去天数）
    const startDate2 = new Date('2024-01-15');
    const result2 = dateUtils.addDays(startDate2, -3);
    console.log('\n✓ 添加负数天数成功');
    console.log(`  开始: ${startDate2.toISOString()}`);
    console.log(`  结果: ${result2.toISOString()}`);
    console.log(`  预期: 2024-01-12`);
    
    // 测试使用字符串日期
    const result3 = dateUtils.addDays('2024-01-15', 10);
    console.log('\n✓ 字符串日期添加天数成功');
    console.log(`  开始: 2024-01-15`);
    console.log(`  结果: ${result3.toISOString()}`);
    console.log(`  预期: 2024-01-25`);
    
    // 测试无效日期
    try {
      dateUtils.addDays('invalid-date', 5);
      console.log('✗ 无效日期应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 无效日期正确抛出错误:', error.message);
    }
    
    // 测试无效天数
    try {
      dateUtils.addDays('2024-01-15', 'five');
      console.log('✗ 无效天数应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 无效天数正确抛出错误:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('✗ 添加天数测试失败:', error.message);
    return false;
  }
}

/**
 * 测试减去天数功能
 */
function testSubtractDays() {
  console.log('\n=== 测试减去天数功能 ===');
  
  try {
    // 测试减去正数天数
    const startDate1 = new Date('2024-01-15');
    const result1 = dateUtils.subtractDays(startDate1, 7);
    console.log('✓ 减去正数天数成功');
    console.log(`  开始: ${startDate1.toISOString()}`);
    console.log(`  结果: ${result1.toISOString()}`);
    console.log(`  预期: 2024-01-08`);
    
    // 测试减去负数天数（相当于添加天数）
    const startDate2 = new Date('2024-01-15');
    const result2 = dateUtils.subtractDays(startDate2, -3);
    console.log('\n✓ 减去负数天数成功');
    console.log(`  开始: ${startDate2.toISOString()}`);
    console.log(`  结果: ${result2.toISOString()}`);
    console.log(`  预期: 2024-01-18`);
    
    // 测试使用字符串日期
    const result3 = dateUtils.subtractDays('2024-01-15', 10);
    console.log('\n✓ 字符串日期减去天数成功');
    console.log(`  开始: 2024-01-15`);
    console.log(`  结果: ${result3.toISOString()}`);
    console.log(`  预期: 2024-01-05`);
    
    // 验证 addDays 和 subtractDays 的对称性
    const testDate = new Date('2024-01-15');
    const addResult = dateUtils.addDays(testDate, 5);
    const subtractResult = dateUtils.subtractDays(addResult, 5);
    
    console.log('\n✓ 验证对称性:');
    console.log(`  原始: ${testDate.toISOString()}`);
    console.log(`  加5天: ${addResult.toISOString()}`);
    console.log(`  减5天: ${subtractResult.toISOString()}`);
    
    if (testDate.getTime() === subtractResult.getTime()) {
      console.log('  ✓ 对称性验证通过');
    } else {
      console.log('  ✗ 对称性验证失败');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('✗ 减去天数测试失败:', error.message);
    return false;
  }
}

/**
 * 测试获取日期范围功能
 */
function testGetDateRange() {
  console.log('\n=== 测试获取日期范围功能 ===');
  
  try {
    // 测试基本日期范围
    const startDate1 = '2024-01-01';
    const endDate1 = '2024-01-07';
    const range1 = dateUtils.getDateRange(startDate1, endDate1);
    
    console.log('✓ 基本日期范围获取成功');
    console.log(`  开始: ${startDate1}`);
    console.log(`  结束: ${endDate1}`);
    console.log(`  范围: ${range1.join(', ')}`);
    console.log(`  天数: ${range1.length} 天`);
    
    // 验证范围正确性
    if (range1.length === 7 && 
        range1[0] === '2024-01-01' && 
        range1[6] === '2024-01-07') {
      console.log('  ✓ 日期范围正确');
    } else {
      console.log('  ✗ 日期范围错误');
      return false;
    }
    
    // 测试自定义格式
    const range2 = dateUtils.getDateRange('2024-01-01', '2024-01-03', 'YYYY/MM/DD');
    console.log('\n✓ 自定义格式日期范围获取成功');
    console.log(`  范围: ${range2.join(', ')}`);
    
    // 测试单日范围
    const range3 = dateUtils.getDateRange('2024-01-01', '2024-01-01');
    console.log('\n✓ 单日范围获取成功');
    console.log(`  范围: ${range3.join(', ')}`);
    console.log(`  天数: ${range3.length} 天`);
    
    if (range3.length === 1 && range3[0] === '2024-01-01') {
      console.log('  ✓ 单日范围正确');
    } else {
      console.log('  ✗ 单日范围错误');
      return false;
    }
    
    // 测试开始日期晚于结束日期
    try {
      dateUtils.getDateRange('2024-01-10', '2024-01-01');
      console.log('✗ 开始日期晚于结束日期应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 开始日期晚于结束日期正确抛出错误:', error.message);
    }
    
    // 测试无效日期
    try {
      dateUtils.getDateRange('invalid-date', '2024-01-07');
      console.log('✗ 无效开始日期应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 无效开始日期正确抛出错误:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('✗ 获取日期范围测试失败:', error.message);
    return false;
  }
}

/**
 * 测试验证日期有效性功能
 */
function testIsValidDate() {
  console.log('\n=== 测试验证日期有效性功能 ===');
  
  try {
    const testCases = [
      { date: '2024-01-15', expected: true, description: '有效日期字符串' },
      { date: '2024-02-30', expected: false, description: '无效日期（2月30日）' },
      { date: new Date(), expected: true, description: 'Date 对象' },
      { date: 'invalid-date', expected: false, description: '无效日期字符串' },
      { date: '2024-13-01', expected: false, description: '无效月份' },
      { date: '2024-01-32', expected: false, description: '无效日期' },
      { date: '', expected: false, description: '空字符串' },
      { date: null, expected: false, description: 'null' },
      { date: undefined, expected: false, description: 'undefined' },
      { date: 1705276800000, expected: true, description: '有效时间戳' }
    ];
    
    let allPassed = true;
    
    testCases.forEach((testCase, index) => {
      const result = dateUtils.isValidDate(testCase.date);
      const passed = result === testCase.expected;
      
      console.log(`测试用例 ${index + 1}: ${testCase.description}`);
      console.log(`  输入: ${testCase.date}`);
      console.log(`  期望: ${testCase.expected ? '有效' : '无效'}`);
      console.log(`  实际: ${result ? '有效' : '无效'}`);
      console.log(`  ${passed ? '✓ 通过' : '✗ 失败'}`);
      
      if (!passed) {
        allPassed = false;
      }
    });
    
    return allPassed;
  } catch (error) {
    console.error('✗ 验证日期有效性测试失败:', error.message);
    return false;
  }
}

/**
 * 测试获取日期差功能
 */
function testGetDateDifference() {
  console.log('\n=== 测试获取日期差功能 ===');
  
  try {
    // 测试天数差
    const diff1 = dateUtils.getDateDifference('2024-01-10', '2024-01-01', 'days');
    console.log('✓ 天数差计算成功');
    console.log(`  日期1: 2024-01-10`);
    console.log(`  日期2: 2024-01-01`);
    console.log(`  天数差: ${diff1} 天`);
    
    if (diff1 === 9) {
      console.log('  ✓ 天数差计算正确');
    } else {
      console.log('  ✗ 天数差计算错误');
      return false;
    }
    
    // 测试小时差
    const diff2 = dateUtils.getDateDifference('2024-01-01 14:00:00', '2024-01-01 10:00:00', 'hours');
    console.log('\n✓ 小时差计算成功');
    console.log(`  日期1: 2024-01-01 14:00:00`);
    console.log(`  日期2: 2024-01-01 10:00:00`);
    console.log(`  小时差: ${diff2} 小时`);
    
    if (diff2 === 4) {
      console.log('  ✓ 小时差计算正确');
    } else {
      console.log('  ✗ 小时差计算错误');
      return false;
    }
    
    // 测试分钟差
    const diff3 = dateUtils.getDateDifference('2024-01-01 12:30:00', '2024-01-01 12:00:00', 'minutes');
    console.log('\n✓ 分钟差计算成功');
    console.log(`  日期1: 2024-01-01 12:30:00`);
    console.log(`  日期2: 2024-01-01 12:00:00`);
    console.log(`  分钟差: ${diff3} 分钟`);
    
    if (diff3 === 30) {
      console.log('  ✓ 分钟差计算正确');
    } else {
      console.log('  ✗ 分钟差计算错误');
      return false;
    }
    
    // 测试负数差（日期1早于日期2）
    const diff4 = dateUtils.getDateDifference('2024-01-01', '2024-01-10', 'days');
    console.log('\n✓ 负数差计算成功');
    console.log(`  日期1: 2024-01-01`);
    console.log(`  日期2: 2024-01-10`);
    console.log(`  天数差: ${diff4} 天`);
    
    if (diff4 === -9) {
      console.log('  ✓ 负数差计算正确');
    } else {
      console.log('  ✗ 负数差计算错误');
      return false;
    }
    
    // 测试无效单位
    try {
      dateUtils.getDateDifference('2024-01-01', '2024-01-10', 'weeks');
      console.log('✗ 无效单位应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 无效单位正确抛出错误:', error.message);
    }
    
    // 测试无效日期
    try {
      dateUtils.getDateDifference('invalid-date', '2024-01-10', 'days');
      console.log('✗ 无效日期应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 无效日期正确抛出错误:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('✗ 获取日期差测试失败:', error.message);
    return false;
  }
}

/**
 * 测试其他辅助功能
 */
function testOtherFunctions() {
  console.log('\n=== 测试其他辅助功能 ===');
  
  try {
    // 测试获取当前时间
    const now = dateUtils.getNow();
    console.log('✓ 获取当前时间成功');
    console.log(`  当前时间: ${now}`);
    
    // 测试获取日期开始时间
    const startOfDay = dateUtils.getStartOfDay('2024-01-15 14:30:45');
    console.log('\n✓ 获取日期开始时间成功');
    console.log(`  原始: 2024-01-15 14:30:45`);
    console.log(`  开始时间: ${startOfDay.toISOString()}`);
    
    // 测试获取日期结束时间
    const endOfDay = dateUtils.getEndOfDay('2024-01-15 14:30:45');
    console.log('\n✓ 获取日期结束时间成功');
    console.log(`  原始: 2024-01-15 14:30:45`);
    console.log(`  结束时间: ${endOfDay.toISOString()}`);
    
    // 测试检查日期是否在范围内
    const isInRange1 = dateUtils.isDateInRange('2024-01-05', '2024-01-01', '2024-01-10');
    console.log('\n✓ 检查日期是否在范围内成功 (在范围内)');
    console.log(`  日期: 2024-01-05`);
    console.log(`  范围: 2024-01-01 到 2024-01-10`);
    console.log(`  结果: ${isInRange1 ? '在范围内' : '不在范围内'}`);
    
    const isInRange2 = dateUtils.isDateInRange('2024-01-15', '2024-01-01', '2024-01-10');
    console.log('\n✓ 检查日期是否在范围内成功 (不在范围内)');
    console.log(`  日期: 2024-01-15`);
    console.log(`  范围: 2024-01-01 到 2024-01-10`);
    console.log(`  结果: ${isInRange2 ? '在范围内' : '不在范围内'}`);
    
    // 测试获取月份天数
    const daysInMonth1 = dateUtils.getDaysInMonth('2024-02-01'); // 闰年
    console.log('\n✓ 获取月份天数成功 (闰年2月)');
    console.log(`  日期: 2024-02-01`);
    console.log(`  天数: ${daysInMonth1} 天`);
    
    const daysInMonth2 = dateUtils.getDaysInMonth('2023-02-01'); // 平年
    console.log('\n✓ 获取月份天数成功 (平年2月)');
    console.log(`  日期: 2023-02-01`);
    console.log(`  天数: ${daysInMonth2} 天`);
    
    // 测试更新默认格式
    const originalFormat = dateUtils.getNow();
    dateUtils.updateDefaultFormat('YYYY/MM/DD');
    const newFormat = dateUtils.getNow();
    dateUtils.updateDefaultFormat('YYYY-MM-DD HH:mm:ss'); // 恢复默认
    
    console.log('\n✓ 更新默认格式成功');
    console.log(`  原始格式: ${originalFormat}`);
    console.log(`  新格式: ${newFormat}`);
    
    // 测试获取支持的格式
    const supportedFormats = dateUtils.getSupportedFormats();
    console.log('\n✓ 获取支持的格式成功');
    console.log(`  支持 ${supportedFormats.length} 种格式`);
    console.log(`  示例: ${supportedFormats.slice(0, 3).join(', ')}...`);
    
    return true;
  } catch (error) {
    console.error('✗ 其他功能测试失败:', error.message);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('开始运行日期工具测试...\n');
  
  const results = {
    formatDate: testFormatDate(),
    parseDate: testParseDate(),
    addDays: testAddDays(),
    subtractDays: testSubtractDays(),
    getDateRange: testGetDateRange(),
    isValidDate: testIsValidDate(),
    getDateDifference: testGetDateDifference(),
    otherFunctions: testOtherFunctions()
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
  testFormatDate,
  testParseDate,
  testAddDays,
  testSubtractDays,
  testGetDateRange,
  testIsValidDate,
  testGetDateDifference,
  testOtherFunctions,
  runAllTests
};