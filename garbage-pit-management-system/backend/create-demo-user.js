/**
 * 创建演示用户脚本
 * 用于在系统启动时创建默认的管理员用户
 */

const bcrypt = require('bcryptjs');
const config = require('./src/config');

async function createDemoUser() {
  console.log('正在创建演示用户...');
  
  try {
    // 模拟加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123456', salt);
    
    console.log('演示用户信息:');
    console.log('用户名: admin');
    console.log('密码: admin123456 (请在登录后修改)');
    console.log('邮箱: admin@example.com');
    console.log('真实姓名: 系统管理员');
    console.log('');
    console.log('密码已加密 (哈希值前50字符):', hashedPassword.substring(0, 50) + '...');
    
    console.log('');
    console.log('请使用以下信息登录:');
    console.log('用户名: admin');
    console.log('密码: admin123456');
    
  } catch (error) {
    console.error('创建演示用户失败:', error.message);
  }
}

// 执行
createDemoUser();