/**
 * 日期工具使用示例
 * 展示日期处理工具的各种用法
 */

const dateUtils = require('./date');

/**
 * 运行所有示例
 */
async function runExamples() {
  console.log('=== 日期工具使用示例 ===\n');
  
  try {
    // 示例1: 格式化日期
    console.log('1. 格式化日期示例:');
    const now = new Date();
    const formattedDate = dateUtils.formatDate(now, 'YYYY-MM-DD HH:mm:ss');
    console.log(`   当前时间: ${formattedDate}`);
    
    const customFormatted = dateUtils.formatDate('2024-01-15', 'YYYY年MM月DD日');
    console.log(`   自定义格式: ${customFormatted}`);
    
    // 示例2: 解析日期字符串
    console.log('\n2. 解析日期字符串示例:');
    const parsedDate = dateUtils.parseDate('2024-01-15', 'YYYY-MM-DD');
    console.log(`   解析结果: ${parsedDate.toISOString()}`);
    
    const parsedDateTime = dateUtils.parseDate('2024/01/15 14:30:45', 'YYYY/MM/DD HH:mm:ss');
    console.log(`   解析日期时间: ${parsedDateTime.toISOString()}`);
    
    // 示例3: 添加和减去天数
    console.log('\n3. 日期计算示例:');
    const originalDate = new Date('2024-01-15');
    const after7Days = dateUtils.addDays(originalDate, 7);
    console.log(`   原始日期: ${dateUtils.formatDate(originalDate, 'YYYY-MM-DD')}`);
    console.log(`   7天后: ${dateUtils.formatDate(after7Days, 'YYYY-MM-DD')}`);
    
    const before3Days = dateUtils.subtractDays(originalDate, 3);
    console.log(`   3天前: ${dateUtils.formatDate(before3Days, 'YYYY-MM-DD')}`);
    
    // 示例4: 获取日期范围
    console.log('\n4. 获取日期范围示例:');
    const dateRange = dateUtils.getDateRange('2024-01-01', '2024-01-07');
    console.log(`   日期范围 (2024-01-01 到 2024-01-07):`);
    console.log(`   ${dateRange.join(', ')}`);
    
    // 示例5: 验证日期有效性
    console.log('\n5. 验证日期有效性示例:');
    const validDate = dateUtils.isValidDate('2024-01-15');
    const invalidDate = dateUtils.isValidDate('2024-02-30');
    console.log(`   "2024-01-15" 是否有效: ${validDate ? '是' : '否'}`);
    console.log(`   "2024-02-30" 是否有效: ${invalidDate ? '是' : '否'}`);
    
    // 示例6: 计算日期差
    console.log('\n6. 计算日期差示例:');
    const daysDiff = dateUtils.getDateDifference('2024-01-10', '2024-01-01', 'days');
    const hoursDiff = dateUtils.getDateDifference('2024-01-01 14:00:00', '2024-01-01 10:00:00', 'hours');
    console.log(`   "2024-01-10" 和 "2024-01-01" 相差: ${daysDiff} 天`);
    console.log(`   "2024-01-01 14:00:00" 和 "2024-01-01 10:00:00" 相差: ${hoursDiff} 小时`);
    
    // 示例7: 其他实用功能
    console.log('\n7. 其他实用功能示例:');
    
    // 获取当前时间
    const currentTime = dateUtils.getNow();
    console.log(`   当前时间: ${currentTime}`);
    
    // 获取日期开始和结束时间
    const startOfDay = dateUtils.getStartOfDay('2024-01-15 14:30:45');
    const endOfDay = dateUtils.getEndOfDay('2024-01-15 14:30:45');
    console.log(`   "2024-01-15 14:30:45" 的开始时间: ${startOfDay.toISOString()}`);
    console.log(`   "2024-01-15 14:30:45" 的结束时间: ${endOfDay.toISOString()}`);
    
    // 检查日期是否在范围内
    const isInRange = dateUtils.isDateInRange('2024-01-05', '2024-01-01', '2024-01-10');
    console.log(`   "2024-01-05" 是否在 "2024-01-01" 到 "2024-01-10" 范围内: ${isInRange ? '是' : '否'}`);
    
    // 获取月份天数
    const daysInFeb2024 = dateUtils.getDaysInMonth('2024-02-01');
    const daysInFeb2023 = dateUtils.getDaysInMonth('2023-02-01');
    console.log(`   2024年2月天数: ${daysInFeb2024} 天`);
    console.log(`   2023年2月天数: ${daysInFeb2023} 天`);
    
    // 示例8: 使用 DateUtils 类实例
    console.log('\n8. 使用 DateUtils 类实例示例:');
    const customDateUtils = new dateUtils.DateUtils({
      defaultFormat: 'YYYY/MM/DD HH:mm',
      locale: 'zh-cn'
    });
    
    const customFormattedDate = customDateUtils.formatDate(new Date());
    console.log(`   自定义实例格式化: ${customFormattedDate}`);
    
    // 添加支持的格式
    customDateUtils.addSupportedFormats('YYYY年MM月DD日');
    console.log(`   添加新格式后支持 ${customDateUtils.getSupportedFormats().length} 种格式`);
    
    // 示例9: 错误处理示例
    console.log('\n9. 错误处理示例:');
    try {
      dateUtils.formatDate('invalid-date', 'YYYY-MM-DD');
    } catch (error) {
      console.log(`   错误处理 - 格式化无效日期: ${error.message}`);
    }
    
    try {
      dateUtils.parseDate('2024-01-15', 'DD/MM/YYYY');
    } catch (error) {
      console.log(`   错误处理 - 格式不匹配: ${error.message}`);
    }
    
    // 示例10: 实际应用场景
    console.log('\n10. 实际应用场景示例:');
    
    // 场景1: 生成最近7天的日期
    const today = new Date();
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = dateUtils.subtractDays(today, i);
      last7Days.push(dateUtils.formatDate(date, 'YYYY-MM-DD'));
    }
    console.log(`   最近7天日期: ${last7Days.join(', ')}`);
    
    // 场景2: 计算任务持续时间
    const taskStart = '2024-01-01 09:00:00';
    const taskEnd = '2024-01-01 17:30:00';
    const taskDurationHours = dateUtils.getDateDifference(taskEnd, taskStart, 'hours');
    const taskDurationMinutes = dateUtils.getDateDifference(taskEnd, taskStart, 'minutes');
    console.log(`   任务持续时间: ${taskDurationHours} 小时 (${taskDurationMinutes} 分钟)`);
    
    // 场景3: 检查日期是否在工作日内
    const checkDate = '2024-01-15';
    const monday = '2024-01-15'; // 假设是周一
    const friday = '2024-01-19'; // 假设是周五
    const isWeekday = dateUtils.isDateInRange(checkDate, monday, friday);
    console.log(`   "${checkDate}" 是否在工作日内: ${isWeekday ? '是' : '否'}`);
    
    console.log('\n=== 示例完成 ===');
    console.log('所有示例运行成功！');
    
  } catch (error) {
    console.error('示例运行失败:', error.message);
    console.error(error.stack);
  }
}

// 如果直接运行此文件，则执行示例
if (require.main === module) {
  runExamples().catch(error => {
    console.error('示例运行失败:', error);
    process.exit(1);
  });
}

// 导出示例函数
module.exports = {
  runExamples
};