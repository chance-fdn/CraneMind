/**
 * 文件处理工具测试文件
 * 测试文件处理工具的各种功能
 */

const fs = require('fs/promises');
const path = require('path');
const fileUtils = require('./file');

// 测试目录和文件路径
const TEST_DIR = path.join(__dirname, 'test_temp');
const TEST_FILE1 = path.join(TEST_DIR, 'test1.txt');
const TEST_FILE2 = path.join(TEST_DIR, 'test2.txt');
const TEST_FILE3 = path.join(TEST_DIR, 'test3.txt');
const TEST_SUBDIR = path.join(TEST_DIR, 'subdir');
const TEST_FILE_IN_SUBDIR = path.join(TEST_SUBDIR, 'subfile.txt');

/**
 * 清理测试环境
 */
async function cleanupTestEnvironment() {
  try {
    // 检查测试目录是否存在
    const exists = await fileUtils.checkFileExists(TEST_DIR);
    if (exists) {
      // 递归删除测试目录
      await fs.rm(TEST_DIR, { recursive: true, force: true });
      console.log('✓ 清理测试环境成功');
    }
  } catch (error) {
    console.error('清理测试环境失败:', error.message);
  }
}

/**
 * 设置测试环境
 */
async function setupTestEnvironment() {
  try {
    // 创建测试目录
    await fs.mkdir(TEST_DIR, { recursive: true });
    console.log('✓ 创建测试目录成功');
    
    // 创建测试文件1
    await fs.writeFile(TEST_FILE1, 'Hello World!', 'utf-8');
    console.log('✓ 创建测试文件1成功');
    
    // 创建测试文件2
    await fs.writeFile(TEST_FILE2, 'Test content for file 2', 'utf-8');
    console.log('✓ 创建测试文件2成功');
    
    // 创建子目录
    await fs.mkdir(TEST_SUBDIR, { recursive: true });
    console.log('✓ 创建子目录成功');
    
    // 创建子目录中的文件
    await fs.writeFile(TEST_FILE_IN_SUBDIR, 'File in subdirectory', 'utf-8');
    console.log('✓ 创建子目录文件成功');
    
    return true;
  } catch (error) {
    console.error('设置测试环境失败:', error.message);
    return false;
  }
}

/**
 * 测试读取文件功能
 */
async function testReadFile() {
  console.log('=== 测试读取文件功能 ===');
  
  try {
    // 测试读取文件内容
    const content1 = await fileUtils.readFile(TEST_FILE1, 'utf-8');
    console.log('✓ 读取文件内容成功');
    console.log(`  文件: ${TEST_FILE1}`);
    console.log(`  内容: "${content1}"`);
    
    if (content1 === 'Hello World!') {
      console.log('  ✓ 内容正确');
    } else {
      console.log('  ✗ 内容错误');
      return false;
    }
    
    // 测试使用默认编码（现在应该返回Buffer）
    const content2 = await fileUtils.readFile(TEST_FILE1);
    console.log('\n✓ 不指定编码读取文件成功');
    console.log(`  类型: ${typeof content2}`);
    console.log(`  是Buffer: ${Buffer.isBuffer(content2)}`);
    
    if (Buffer.isBuffer(content2)) {
      console.log('  ✓ 正确返回Buffer');
    } else {
      console.log('  ✗ 应该返回Buffer');
      return false;
    }
    
    // 测试使用字符串编码
    const content2a = await fileUtils.readFile(TEST_FILE1, 'utf-8');
    console.log('\n✓ 使用utf-8编码读取文件成功');
    console.log(`  内容: "${content2a}"`);
    
    if (content2a === 'Hello World!') {
      console.log('  ✓ 内容正确');
    } else {
      console.log('  ✗ 内容错误');
      return false;
    }
    
    // 测试读取文件为Buffer（不指定编码）
    const content3 = await fileUtils.readFile(TEST_FILE1, null);
    console.log('\n✓ 读取文件为Buffer成功');
    console.log(`  类型: ${typeof content3}`);
    console.log(`  是Buffer: ${Buffer.isBuffer(content3)}`);
    
    if (Buffer.isBuffer(content3)) {
      console.log('  ✓ 正确返回Buffer');
    } else {
      console.log('  ✗ 应该返回Buffer');
      return false;
    }
    
    // 测试读取文件为Buffer（使用undefined）
    const content4 = await fileUtils.readFile(TEST_FILE1, undefined);
    console.log('\n✓ 使用undefined读取文件为Buffer成功');
    console.log(`  是Buffer: ${Buffer.isBuffer(content4)}`);
    
    if (Buffer.isBuffer(content4)) {
      console.log('  ✓ 正确返回Buffer');
    } else {
      console.log('  ✗ 应该返回Buffer');
      return false;
    }
    
    // 测试文件不存在
    try {
      await fileUtils.readFile(path.join(TEST_DIR, 'nonexistent.txt'), 'utf-8');
      console.log('✗ 文件不存在应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 文件不存在正确抛出错误:', error.message);
    }
    
    // 测试无效路径
    try {
      await fileUtils.readFile('', 'utf-8');
      console.log('✗ 空路径应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 空路径正确抛出错误:', error.message);
    }
    
    // 测试无效编码
    try {
      await fileUtils.readFile(TEST_FILE1, 'invalid-encoding');
      console.log('✗ 无效编码应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 无效编码正确抛出错误:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('✗ 读取文件测试失败:', error.message);
    return false;
  }
}

/**
 * 测试写入文件功能
 */
async function testWriteFile() {
  console.log('\n=== 测试写入文件功能 ===');
  
  try {
    // 测试写入新文件
    const newFilePath = path.join(TEST_DIR, 'newfile.txt');
    const success1 = await fileUtils.writeFile(newFilePath, 'New file content', 'utf-8');
    
    console.log('✓ 写入新文件成功');
    console.log(`  文件: ${newFilePath}`);
    console.log(`  结果: ${success1 ? '成功' : '失败'}`);
    
    // 验证文件内容
    const content = await fs.readFile(newFilePath, 'utf-8');
    if (content === 'New file content') {
      console.log('  ✓ 文件内容正确');
    } else {
      console.log('  ✗ 文件内容错误');
      return false;
    }
    
    // 测试覆盖现有文件
    const success2 = await fileUtils.writeFile(newFilePath, 'Updated content', 'utf-8');
    console.log('\n✓ 覆盖现有文件成功');
    console.log(`  结果: ${success2 ? '成功' : '失败'}`);
    
    // 验证更新后的内容
    const updatedContent = await fs.readFile(newFilePath, 'utf-8');
    if (updatedContent === 'Updated content') {
      console.log('  ✓ 文件内容已更新');
    } else {
      console.log('  ✗ 文件内容未更新');
      return false;
    }
    
    // 测试写入Buffer
    const bufferFilePath = path.join(TEST_DIR, 'bufferfile.bin');
    const buffer = Buffer.from('Binary content', 'utf-8');
    const success3 = await fileUtils.writeFile(bufferFilePath, buffer);
    
    console.log('\n✓ 写入Buffer成功');
    console.log(`  文件: ${bufferFilePath}`);
    console.log(`  结果: ${success3 ? '成功' : '失败'}`);
    
    // 验证Buffer内容
    const bufferContent = await fs.readFile(bufferFilePath);
    if (bufferContent.equals(buffer)) {
      console.log('  ✓ Buffer内容正确');
    } else {
      console.log('  ✗ Buffer内容错误');
      return false;
    }
    
    // 测试自动创建目录
    const deepFilePath = path.join(TEST_DIR, 'deep', 'dir', 'file.txt');
    const success4 = await fileUtils.writeFile(deepFilePath, 'Deep file content', 'utf-8');
    
    console.log('\n✓ 自动创建目录成功');
    console.log(`  文件: ${deepFilePath}`);
    console.log(`  结果: ${success4 ? '成功' : '失败'}`);
    
    // 验证文件是否存在
    const exists = await fileUtils.checkFileExists(deepFilePath);
    if (exists) {
      console.log('  ✓ 文件已创建');
    } else {
      console.log('  ✗ 文件未创建');
      return false;
    }
    
    // 测试无效路径
    try {
      await fileUtils.writeFile('', 'content', 'utf-8');
      console.log('✗ 空路径应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 空路径正确抛出错误:', error.message);
    }
    
    // 测试空内容
    try {
      await fileUtils.writeFile(path.join(TEST_DIR, 'empty.txt'), null, 'utf-8');
      console.log('✗ 空内容应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 空内容正确抛出错误:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('✗ 写入文件测试失败:', error.message);
    return false;
  }
}

/**
 * 测试删除文件功能
 */
async function testDeleteFile() {
  console.log('\n=== 测试删除文件功能 ===');
  
  try {
    // 创建要删除的测试文件
    const fileToDelete = path.join(TEST_DIR, 'todelete.txt');
    await fs.writeFile(fileToDelete, 'Delete me', 'utf-8');
    
    // 验证文件存在
    const existsBefore = await fileUtils.checkFileExists(fileToDelete);
    if (!existsBefore) {
      console.log('✗ 测试文件未创建');
      return false;
    }
    
    // 测试删除文件
    const success = await fileUtils.deleteFile(fileToDelete);
    console.log('✓ 删除文件成功');
    console.log(`  文件: ${fileToDelete}`);
    console.log(`  结果: ${success ? '成功' : '失败'}`);
    
    // 验证文件已删除
    const existsAfter = await fileUtils.checkFileExists(fileToDelete);
    if (!existsAfter) {
      console.log('  ✓ 文件已删除');
    } else {
      console.log('  ✗ 文件未删除');
      return false;
    }
    
    // 测试删除不存在的文件
    try {
      await fileUtils.deleteFile(path.join(TEST_DIR, 'nonexistent.txt'));
      console.log('✗ 删除不存在的文件应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 删除不存在的文件正确抛出错误:', error.message);
    }
    
    // 测试删除目录（应该失败）
    try {
      await fileUtils.deleteFile(TEST_SUBDIR);
      console.log('✗ 删除目录应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 删除目录正确抛出错误:', error.message);
    }
    
    // 测试无效路径
    try {
      await fileUtils.deleteFile('');
      console.log('✗ 空路径应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 空路径正确抛出错误:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('✗ 删除文件测试失败:', error.message);
    return false;
  }
}

/**
 * 测试移动文件功能
 */
async function testMoveFile() {
  console.log('\n=== 测试移动文件功能 ===');
  
  try {
    // 创建源文件
    const sourceFile = path.join(TEST_DIR, 'source.txt');
    await fs.writeFile(sourceFile, 'Source file content', 'utf-8');
    
    // 目标文件路径
    const targetFile = path.join(TEST_DIR, 'target.txt');
    
    // 验证源文件存在，目标文件不存在
    const sourceExists = await fileUtils.checkFileExists(sourceFile);
    const targetExists = await fileUtils.checkFileExists(targetFile);
    
    if (!sourceExists) {
      console.log('✗ 源文件未创建');
      return false;
    }
    
    if (targetExists) {
      console.log('✗ 目标文件已存在');
      return false;
    }
    
    // 测试移动文件
    const success = await fileUtils.moveFile(sourceFile, targetFile);
    console.log('✓ 移动文件成功');
    console.log(`  源文件: ${sourceFile}`);
    console.log(`  目标文件: ${targetFile}`);
    console.log(`  结果: ${success ? '成功' : '失败'}`);
    
    // 验证源文件已不存在，目标文件已存在
    const sourceExistsAfter = await fileUtils.checkFileExists(sourceFile);
    const targetExistsAfter = await fileUtils.checkFileExists(targetFile);
    
    if (!sourceExistsAfter && targetExistsAfter) {
      console.log('  ✓ 文件移动成功');
    } else {
      console.log('  ✗ 文件移动失败');
      return false;
    }
    
    // 验证目标文件内容
    const targetContent = await fs.readFile(targetFile, 'utf-8');
    if (targetContent === 'Source file content') {
      console.log('  ✓ 文件内容正确');
    } else {
      console.log('  ✗ 文件内容错误');
      return false;
    }
    
    // 测试移动到新目录（自动创建目录）
    const newTargetFile = path.join(TEST_DIR, 'newdir', 'moved.txt');
    const success2 = await fileUtils.moveFile(targetFile, newTargetFile);
    
    console.log('\n✓ 移动到新目录成功');
    console.log(`  目标文件: ${newTargetFile}`);
    console.log(`  结果: ${success2 ? '成功' : '失败'}`);
    
    // 验证文件已移动到新目录
    const newTargetExists = await fileUtils.checkFileExists(newTargetFile);
    if (newTargetExists) {
      console.log('  ✓ 文件已移动到新目录');
    } else {
      console.log('  ✗ 文件未移动到新目录');
      return false;
    }
    
    // 测试移动不存在的文件
    try {
      await fileUtils.moveFile(path.join(TEST_DIR, 'nonexistent.txt'), targetFile);
      console.log('✗ 移动不存在的文件应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 移动不存在的文件正确抛出错误:', error.message);
    }
    
    // 测试移动到已存在的文件
    const existingFile = path.join(TEST_DIR, 'existing.txt');
    await fs.writeFile(existingFile, 'Existing file', 'utf-8');
    
    try {
      await fileUtils.moveFile(newTargetFile, existingFile);
      console.log('✗ 移动到已存在的文件应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 移动到已存在的文件正确抛出错误:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('✗ 移动文件测试失败:', error.message);
    return false;
  }
}

/**
 * 测试复制文件功能
 */
async function testCopyFile() {
  console.log('\n=== 测试复制文件功能 ===');
  
  try {
    // 创建源文件
    const sourceFile = path.join(TEST_DIR, 'source_copy.txt');
    await fs.writeFile(sourceFile, 'Source file for copy', 'utf-8');
    
    // 目标文件路径
    const targetFile = path.join(TEST_DIR, 'target_copy.txt');
    
    // 验证源文件存在，目标文件不存在
    const sourceExists = await fileUtils.checkFileExists(sourceFile);
    const targetExists = await fileUtils.checkFileExists(targetFile);
    
    if (!sourceExists) {
      console.log('✗ 源文件未创建');
      return false;
    }
    
    if (targetExists) {
      console.log('✗ 目标文件已存在');
      return false;
    }
    
    // 测试复制文件
    const success = await fileUtils.copyFile(sourceFile, targetFile);
    console.log('✓ 复制文件成功');
    console.log(`  源文件: ${sourceFile}`);
    console.log(`  目标文件: ${targetFile}`);
    console.log(`  结果: ${success ? '成功' : '失败'}`);
    
    // 验证源文件和目标文件都存在
    const sourceExistsAfter = await fileUtils.checkFileExists(sourceFile);
    const targetExistsAfter = await fileUtils.checkFileExists(targetFile);
    
    if (sourceExistsAfter && targetExistsAfter) {
      console.log('  ✓ 文件复制成功');
    } else {
      console.log('  ✗ 文件复制失败');
      return false;
    }
    
    // 验证两个文件内容相同
    const sourceContent = await fs.readFile(sourceFile, 'utf-8');
    const targetContent = await fs.readFile(targetFile, 'utf-8');
    
    if (sourceContent === targetContent) {
      console.log('  ✓ 文件内容相同');
    } else {
      console.log('  ✗ 文件内容不同');
      return false;
    }
    
    // 测试复制到新目录（自动创建目录）
    const newTargetFile = path.join(TEST_DIR, 'copydir', 'copied.txt');
    const success2 = await fileUtils.copyFile(sourceFile, newTargetFile);
    
    console.log('\n✓ 复制到新目录成功');
    console.log(`  目标文件: ${newTargetFile}`);
    console.log(`  结果: ${success2 ? '成功' : '失败'}`);
    
    // 验证文件已复制到新目录
    const newTargetExists = await fileUtils.checkFileExists(newTargetFile);
    if (newTargetExists) {
      console.log('  ✓ 文件已复制到新目录');
    } else {
      console.log('  ✗ 文件未复制到新目录');
      return false;
    }
    
    // 测试复制不存在的文件
    try {
      await fileUtils.copyFile(path.join(TEST_DIR, 'nonexistent.txt'), targetFile);
      console.log('✗ 复制不存在的文件应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 复制不存在的文件正确抛出错误:', error.message);
    }
    
    // 测试复制到已存在的文件
    const existingFile = path.join(TEST_DIR, 'existing_copy.txt');
    await fs.writeFile(existingFile, 'Existing file', 'utf-8');
    
    try {
      await fileUtils.copyFile(sourceFile, existingFile);
      console.log('✗ 复制到已存在的文件应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 复制到已存在的文件正确抛出错误:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('✗ 复制文件测试失败:', error.message);
    return false;
  }
}

/**
 * 测试获取文件信息功能
 */
async function testGetFileInfo() {
  console.log('\n=== 测试获取文件信息功能 ===');
  
  try {
    // 测试获取文件信息
    const fileInfo = await fileUtils.getFileInfo(TEST_FILE1);
    
    console.log('✓ 获取文件信息成功');
    console.log(`  文件: ${TEST_FILE1}`);
    console.log(`  大小: ${fileInfo.size} 字节 (${fileInfo.sizeFormatted})`);
    console.log(`  创建时间: ${fileInfo.birthtimeFormatted}`);
    console.log(`  修改时间: ${fileInfo.mtimeFormatted}`);
    console.log(`  文件名: ${fileInfo.filename}`);
    console.log(`  扩展名: ${fileInfo.extension}`);
    console.log(`  目录: ${fileInfo.dirname}`);
    console.log(`  是文件: ${fileInfo.isFile}`);
    console.log(`  是目录: ${fileInfo.isDirectory}`);
    
    // 验证基本信息
    if (fileInfo.isFile && !fileInfo.isDirectory) {
      console.log('  ✓ 文件类型正确');
    } else {
      console.log('  ✗ 文件类型错误');
      return false;
    }
    
    if (fileInfo.filename === 'test1.txt') {
      console.log('  ✓ 文件名正确');
    } else {
      console.log('  ✗ 文件名错误');
      return false;
    }
    
    if (fileInfo.extension === '.txt') {
      console.log('  ✓ 扩展名正确');
    } else {
      console.log('  ✗ 扩展名错误');
      return false;
    }
    
    // 测试获取目录信息
    const dirInfo = await fileUtils.getFileInfo(TEST_SUBDIR);
    
    console.log('\n✓ 获取目录信息成功');
    console.log(`  目录: ${TEST_SUBDIR}`);
    console.log(`  是文件: ${dirInfo.isFile}`);
    console.log(`  是目录: ${dirInfo.isDirectory}`);
    
    if (!dirInfo.isFile && dirInfo.isDirectory) {
      console.log('  ✓ 目录类型正确');
    } else {
      console.log('  ✗ 目录类型错误');
      return false;
    }
    
    // 测试获取不存在的文件信息
    try {
      await fileUtils.getFileInfo(path.join(TEST_DIR, 'nonexistent.txt'));
      console.log('✗ 获取不存在的文件信息应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 获取不存在的文件信息正确抛出错误:', error.message);
    }
    
    // 测试无效路径
    try {
      await fileUtils.getFileInfo('');
      console.log('✗ 空路径应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 空路径正确抛出错误:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('✗ 获取文件信息测试失败:', error.message);
    return false;
  }
}

/**
 * 测试检查文件是否存在功能
 */
async function testCheckFileExists() {
  console.log('\n=== 测试检查文件是否存在功能 ===');
  
  try {
    // 测试存在的文件
    const exists1 = await fileUtils.checkFileExists(TEST_FILE1);
    console.log('✓ 检查存在的文件成功');
    console.log(`  文件: ${TEST_FILE1}`);
    console.log(`  存在: ${exists1 ? '是' : '否'}`);
    
    if (exists1) {
      console.log('  ✓ 正确检测到文件存在');
    } else {
      console.log('  ✗ 应该检测到文件存在');
      return false;
    }
    
    // 测试不存在的文件
    const exists2 = await fileUtils.checkFileExists(path.join(TEST_DIR, 'nonexistent.txt'));
    console.log('\n✓ 检查不存在的文件成功');
    console.log(`  文件: ${path.join(TEST_DIR, 'nonexistent.txt')}`);
    console.log(`  存在: ${exists2 ? '是' : '否'}`);
    
    if (!exists2) {
      console.log('  ✓ 正确检测到文件不存在');
    } else {
      console.log('  ✗ 应该检测到文件不存在');
      return false;
    }
    
    // 测试存在的目录
    const exists3 = await fileUtils.checkFileExists(TEST_SUBDIR);
    console.log('\n✓ 检查存在的目录成功');
    console.log(`  目录: ${TEST_SUBDIR}`);
    console.log(`  存在: ${exists3 ? '是' : '否'}`);
    
    if (exists3) {
      console.log('  ✓ 正确检测到目录存在');
    } else {
      console.log('  ✗ 应该检测到目录存在');
      return false;
    }
    
    // 测试空路径
    const exists4 = await fileUtils.checkFileExists('');
    console.log('\n✓ 检查空路径成功');
    console.log(`  路径: (空)`);
    console.log(`  存在: ${exists4 ? '是' : '否'}`);
    
    if (!exists4) {
      console.log('  ✓ 正确检测到空路径不存在');
    } else {
      console.log('  ✗ 应该检测到空路径不存在');
      return false;
    }
    
    // 测试无效路径
    const exists5 = await fileUtils.checkFileExists(null);
    console.log('\n✓ 检查无效路径成功');
    console.log(`  路径: null`);
    console.log(`  存在: ${exists5 ? '是' : '否'}`);
    
    if (!exists5) {
      console.log('  ✓ 正确检测到无效路径不存在');
    } else {
      console.log('  ✗ 应该检测到无效路径不存在');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('✗ 检查文件是否存在测试失败:', error.message);
    return false;
  }
}

/**
 * 测试其他辅助功能
 */
async function testOtherFunctions() {
  console.log('\n=== 测试其他辅助功能 ===');
  
  try {
    // 测试格式化文件大小
    const testCases = [
      { bytes: 0, expected: '0 B' },
      { bytes: 500, expected: '500 B' },
      { bytes: 1024, expected: '1 KB' },
      { bytes: 1536, expected: '1.5 KB' },
      { bytes: 1048576, expected: '1 MB' },
      { bytes: 1073741824, expected: '1 GB' },
      { bytes: 1099511627776, expected: '1 TB' }
    ];
    
    console.log('✓ 测试格式化文件大小:');
    testCases.forEach((testCase, index) => {
      const formatted = fileUtils.formatFileSize(testCase.bytes);
      const passed = formatted === testCase.expected;
      
      console.log(`  测试 ${index + 1}: ${testCase.bytes} 字节`);
      console.log(`    期望: ${testCase.expected}`);
      console.log(`    实际: ${formatted}`);
      console.log(`    ${passed ? '✓ 通过' : '✗ 失败'}`);
      
      if (!passed) {
        throw new Error(`格式化文件大小测试失败: ${testCase.bytes} 字节`);
      }
    });
    
    // 测试更新默认编码
    const originalEncoding = 'utf-8';
    const newEncoding = 'ascii';
    
    console.log('\n✓ 测试更新默认编码:');
    console.log(`  原始编码: ${originalEncoding}`);
    
    fileUtils.updateDefaultEncoding(newEncoding);
    console.log(`  新编码: ${newEncoding}`);
    
    // 恢复原始编码
    fileUtils.updateDefaultEncoding(originalEncoding);
    console.log(`  恢复编码: ${originalEncoding}`);
    
    // 测试获取支持的编码
    const supportedEncodings = fileUtils.getSupportedEncodings();
    console.log('\n✓ 测试获取支持的编码:');
    console.log(`  支持 ${supportedEncodings.length} 种编码`);
    console.log(`  示例: ${supportedEncodings.slice(0, 3).join(', ')}...`);
    
    if (supportedEncodings.length > 0) {
      console.log('  ✓ 成功获取支持的编码列表');
    } else {
      console.log('  ✗ 未获取到支持的编码');
      return false;
    }
    
    // 测试列出目录内容
    console.log('\n✓ 测试列出目录内容:');
    
    // 简单列出
    const simpleList = await fileUtils.listDirectory(TEST_DIR);
    console.log(`  简单列出: ${simpleList.length} 个项目`);
    console.log(`  示例: ${simpleList.slice(0, 3).join(', ')}...`);
    
    if (simpleList.length > 0) {
      console.log('  ✓ 成功列出目录内容');
    } else {
      console.log('  ✗ 未列出目录内容');
      return false;
    }
    
    // 带文件类型信息列出
    const detailedList = await fileUtils.listDirectory(TEST_DIR, { withFileTypes: true });
    console.log(`  详细列出: ${detailedList.length} 个项目`);
    
    const hasFiles = detailedList.some(item => item.isFile);
    const hasDirs = detailedList.some(item => item.isDirectory);
    
    if (hasFiles && hasDirs) {
      console.log('  ✓ 成功获取文件类型信息');
    } else {
      console.log('  ✗ 未获取到完整的文件类型信息');
      return false;
    }
    
    // 测试递归列出
    const recursiveList = await fileUtils.listDirectory(TEST_DIR, { recursive: true });
    console.log(`  递归列出: ${recursiveList.length} 个项目`);
    
    if (recursiveList.length > simpleList.length) {
      console.log('  ✓ 递归列出包含更多项目');
    } else {
      console.log('  ✗ 递归列出未包含更多项目');
      return false;
    }
    
    // 测试列出不存在的目录
    try {
      await fileUtils.listDirectory(path.join(TEST_DIR, 'nonexistent'));
      console.log('✗ 列出不存在的目录应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 列出不存在的目录正确抛出错误:', error.message);
    }
    
    // 测试列出文件（不是目录）
    try {
      await fileUtils.listDirectory(TEST_FILE1);
      console.log('✗ 列出文件应该抛出错误');
      return false;
    } catch (error) {
      console.log('✓ 列出文件正确抛出错误:', error.message);
    }
    
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
  console.log('开始运行文件处理工具测试...\n');
  
  // 清理并设置测试环境
  await cleanupTestEnvironment();
  const setupSuccess = await setupTestEnvironment();
  
  if (!setupSuccess) {
    console.error('❌ 测试环境设置失败，无法继续测试');
    return false;
  }
  
  const results = {
    readFile: await testReadFile(),
    writeFile: await testWriteFile(),
    deleteFile: await testDeleteFile(),
    moveFile: await testMoveFile(),
    copyFile: await testCopyFile(),
    getFileInfo: await testGetFileInfo(),
    checkFileExists: await testCheckFileExists(),
    otherFunctions: await testOtherFunctions()
  };
  
  // 清理测试环境
  await cleanupTestEnvironment();
  
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
  testReadFile,
  testWriteFile,
  testDeleteFile,
  testMoveFile,
  testCopyFile,
  testGetFileInfo,
  testCheckFileExists,
  testOtherFunctions,
  runAllTests
};