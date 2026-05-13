/**
 * 文件处理工具使用示例
 * 展示如何使用文件处理工具的各种功能
 */

const fileUtils = require('./file');

/**
 * 演示文件处理工具的基本用法
 */
async function demonstrateFileUtils() {
  console.log('=== 文件处理工具使用示例 ===\n');
  
  try {
    // 示例1: 读取文件
    console.log('1. 读取文件示例:');
    try {
      // 注意：这里需要实际存在的文件路径
      // const content = await fileUtils.readFile('/path/to/file.txt', 'utf-8');
      // console.log(`   文件内容: ${content}`);
      console.log('   // 代码示例:');
      console.log('   const content = await fileUtils.readFile(\'/path/to/file.txt\', \'utf-8\');');
      console.log('   console.log(content);');
    } catch (error) {
      console.log(`   示例文件不存在，跳过此示例`);
    }
    
    // 示例2: 写入文件
    console.log('\n2. 写入文件示例:');
    console.log('   // 代码示例:');
    console.log('   const success = await fileUtils.writeFile(\'/path/to/newfile.txt\', \'Hello World\', \'utf-8\');');
    console.log('   console.log(`写入成功: ${success}`);');
    
    // 示例3: 删除文件
    console.log('\n3. 删除文件示例:');
    console.log('   // 代码示例:');
    console.log('   const deleted = await fileUtils.deleteFile(\'/path/to/file.txt\');');
    console.log('   console.log(`删除成功: ${deleted}`);');
    
    // 示例4: 移动文件
    console.log('\n4. 移动文件示例:');
    console.log('   // 代码示例:');
    console.log('   const moved = await fileUtils.moveFile(\'/path/to/source.txt\', \'/path/to/target.txt\');');
    console.log('   console.log(`移动成功: ${moved}`);');
    
    // 示例5: 复制文件
    console.log('\n5. 复制文件示例:');
    console.log('   // 代码示例:');
    console.log('   const copied = await fileUtils.copyFile(\'/path/to/source.txt\', \'/path/to/target.txt\');');
    console.log('   console.log(`复制成功: ${copied}`);');
    
    // 示例6: 获取文件信息
    console.log('\n6. 获取文件信息示例:');
    console.log('   // 代码示例:');
    console.log('   const info = await fileUtils.getFileInfo(\'/path/to/file.txt\');');
    console.log('   console.log(`文件大小: ${info.sizeFormatted}`);');
    console.log('   console.log(`创建时间: ${info.birthtimeFormatted}`);');
    console.log('   console.log(`修改时间: ${info.mtimeFormatted}`);');
    console.log('   console.log(`是文件: ${info.isFile}`);');
    console.log('   console.log(`是目录: ${info.isDirectory}`);');
    
    // 示例7: 检查文件是否存在
    console.log('\n7. 检查文件是否存在示例:');
    console.log('   // 代码示例:');
    console.log('   const exists = await fileUtils.checkFileExists(\'/path/to/file.txt\');');
    console.log('   console.log(`文件存在: ${exists}`);');
    
    // 示例8: 使用类实例
    console.log('\n8. 使用 FileUtils 类实例示例:');
    console.log('   // 代码示例:');
    console.log('   const { FileUtils } = require(\'./file\');');
    console.log('   const myFileUtils = new FileUtils({');
    console.log('     defaultEncoding: \'utf-8\',');
    console.log('     autoCreateDir: true');
    console.log('   });');
    console.log('   ');
    console.log('   // 使用实例方法');
    console.log('   const content = await myFileUtils.readFile(\'/path/to/file.txt\', \'utf-8\');');
    console.log('   const success = await myFileUtils.writeFile(\'/path/to/newfile.txt\', \'Content\');');
    
    // 示例9: 错误处理
    console.log('\n9. 错误处理示例:');
    console.log('   // 代码示例:');
    console.log('   try {');
    console.log('     const content = await fileUtils.readFile(\'/path/to/nonexistent.txt\', \'utf-8\');');
    console.log('   } catch (error) {');
    console.log('     console.error(`读取文件失败: ${error.message}`);');
    console.log('     // 处理错误，例如创建文件或记录日志');
    console.log('   }');
    
    // 示例10: 高级功能
    console.log('\n10. 高级功能示例:');
    console.log('    // 列出目录内容');
    console.log('    const items = await fileUtils.listDirectory(\'/path/to/dir\');');
    console.log('    console.log(`目录内容: ${items.join(\', \')}`);');
    console.log('    ');
    console.log('    // 递归列出目录内容');
    console.log('    const allItems = await fileUtils.listDirectory(\'/path/to/dir\', { recursive: true });');
    console.log('    console.log(`所有项目: ${allItems.length} 个`);');
    console.log('    ');
    console.log('    // 带文件类型信息列出');
    console.log('    const detailedItems = await fileUtils.listDirectory(\'/path/to/dir\', { withFileTypes: true });');
    console.log('    detailedItems.forEach(item => {');
    console.log('      console.log(`${item.name} - ${item.isFile ? \'文件\' : \'目录\'}`);');
    console.log('    });');
    
    console.log('\n=== 示例结束 ===');
    
  } catch (error) {
    console.error('演示过程中发生错误:', error.message);
  }
}

/**
 * 演示实际文件操作
 */
async function demonstrateActualOperations() {
  console.log('\n=== 实际文件操作演示 ===\n');
  
  const testDir = './test_demo';
  const testFile = `${testDir}/demo.txt`;
  const testFile2 = `${testDir}/demo2.txt`;
  const testFileMoved = `${testDir}/demo_moved.txt`;
  const testFileCopied = `${testDir}/demo_copied.txt`;
  
  try {
    // 1. 创建测试目录和文件
    console.log('1. 创建测试文件:');
    const writeSuccess = await fileUtils.writeFile(testFile, '这是一个演示文件内容\n第二行内容', 'utf-8');
    console.log(`   创建文件 ${testFile}: ${writeSuccess ? '成功' : '失败'}`);
    
    // 2. 读取文件
    console.log('\n2. 读取文件内容:');
    const content = await fileUtils.readFile(testFile, 'utf-8');
    console.log(`   文件内容:\n${content}`);
    
    // 3. 获取文件信息
    console.log('\n3. 获取文件信息:');
    const info = await fileUtils.getFileInfo(testFile);
    console.log(`   文件名: ${info.filename}`);
    console.log(`   文件大小: ${info.sizeFormatted}`);
    console.log(`   创建时间: ${info.birthtimeFormatted}`);
    console.log(`   是文件: ${info.isFile}`);
    
    // 4. 检查文件是否存在
    console.log('\n4. 检查文件是否存在:');
    const exists = await fileUtils.checkFileExists(testFile);
    console.log(`   文件 ${testFile} 存在: ${exists}`);
    
    const notExists = await fileUtils.checkFileExists(`${testDir}/nonexistent.txt`);
    console.log(`   文件 ${testDir}/nonexistent.txt 存在: ${notExists}`);
    
    // 5. 复制文件
    console.log('\n5. 复制文件:');
    const copied = await fileUtils.copyFile(testFile, testFileCopied);
    console.log(`   复制 ${testFile} 到 ${testFileCopied}: ${copied ? '成功' : '失败'}`);
    
    // 6. 移动文件
    console.log('\n6. 移动文件:');
    // 先创建另一个文件用于移动
    await fileUtils.writeFile(testFile2, '要移动的文件内容', 'utf-8');
    const moved = await fileUtils.moveFile(testFile2, testFileMoved);
    console.log(`   移动 ${testFile2} 到 ${testFileMoved}: ${moved ? '成功' : '失败'}`);
    
    // 7. 列出目录内容
    console.log('\n7. 列出目录内容:');
    const items = await fileUtils.listDirectory(testDir);
    console.log(`   目录 ${testDir} 包含 ${items.length} 个项目:`);
    items.forEach((item, index) => {
      console.log(`     ${index + 1}. ${item}`);
    });
    
    // 8. 删除文件
    console.log('\n8. 删除文件:');
    const deleted1 = await fileUtils.deleteFile(testFile);
    console.log(`   删除 ${testFile}: ${deleted1 ? '成功' : '失败'}`);
    
    const deleted2 = await fileUtils.deleteFile(testFileCopied);
    console.log(`   删除 ${testFileCopied}: ${deleted2 ? '成功' : '失败'}`);
    
    const deleted3 = await fileUtils.deleteFile(testFileMoved);
    console.log(`   删除 ${testFileMoved}: ${deleted3 ? '成功' : '失败'}`);
    
    // 9. 清理测试目录
    console.log('\n9. 清理测试目录:');
    // 注意：这里只删除文件，不删除目录本身
    console.log('   测试文件已全部删除');
    
    console.log('\n=== 实际演示结束 ===');
    
  } catch (error) {
    console.error('实际演示过程中发生错误:', error.message);
    
    // 尝试清理
    try {
      const files = [testFile, testFile2, testFileMoved, testFileCopied];
      for (const file of files) {
        if (await fileUtils.checkFileExists(file)) {
          await fileUtils.deleteFile(file);
        }
      }
      console.log('已清理测试文件');
    } catch (cleanupError) {
      console.error('清理失败:', cleanupError.message);
    }
  }
}

/**
 * 运行演示
 */
async function runDemo() {
  console.log('文件处理工具演示程序\n');
  
  await demonstrateFileUtils();
  await demonstrateActualOperations();
  
  console.log('\n演示完成！');
}

// 如果直接运行此文件，则执行演示
if (require.main === module) {
  runDemo().catch(error => {
    console.error('演示运行失败:', error);
    process.exit(1);
  });
}

// 导出演示函数
module.exports = {
  demonstrateFileUtils,
  demonstrateActualOperations,
  runDemo
};