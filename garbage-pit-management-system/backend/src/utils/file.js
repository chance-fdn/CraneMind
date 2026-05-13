/**
 * 文件处理工具模块
 * 提供文件读写、删除、移动、复制和文件信息获取功能
 * 
 * 功能特性：
 * 1. 支持异步文件操作（使用 fs/promises）
 * 2. 完整的错误处理和输入验证
 * 3. 支持路径规范化
 * 4. 支持文件编码设置
 * 5. 支持文件信息获取（大小、创建时间、修改时间等）
 * 6. 支持文件存在性检查
 * 
 * 使用示例：
 * const fileUtils = require('./file');
 * 
 * // 读取文件
 * const content = await fileUtils.readFile('/path/to/file.txt', 'utf-8');
 * 
 * // 写入文件
 * const success = await fileUtils.writeFile('/path/to/file.txt', 'Hello World', 'utf-8');
 * 
 * // 删除文件
 * const deleted = await fileUtils.deleteFile('/path/to/file.txt');
 * 
 * // 移动文件
 * const moved = await fileUtils.moveFile('/path/to/source.txt', '/path/to/target.txt');
 * 
 * // 复制文件
 * const copied = await fileUtils.copyFile('/path/to/source.txt', '/path/to/target.txt');
 * 
 * // 获取文件信息
 * const info = await fileUtils.getFileInfo('/path/to/file.txt');
 * 
 * // 检查文件是否存在
 * const exists = await fileUtils.checkFileExists('/path/to/file.txt');
 */

const fs = require('fs/promises');
const path = require('path');
const fsSync = require('fs');

/**
 * 文件处理工具类
 * 提供文件相关的各种操作功能
 */
class FileUtils {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {string} options.defaultEncoding - 默认文件编码，默认 'utf-8'
   * @param {boolean} options.autoCreateDir - 是否自动创建目录，默认 true
   */
  constructor(options = {}) {
    this.defaultEncoding = options.defaultEncoding || 'utf-8';
    this.autoCreateDir = options.autoCreateDir !== false;
    
    // 支持的编码列表
    this.supportedEncodings = [
      'utf-8',
      'utf8',
      'ascii',
      'base64',
      'hex',
      'latin1',
      'binary'
    ];
  }

  /**
   * 读取文件内容
   * 读取指定文件的内容
   * 
   * @param {string} filePath - 文件路径
   * @param {string|null|undefined} encoding - 编码格式，如果为null或undefined则返回Buffer，否则使用指定编码
   * @returns {Promise<string|Buffer>} 文件内容（字符串或Buffer）
   * @throws {Error} 如果文件不存在、路径无效或编码无效
   * 
   * @example
   * const content = await fileUtils.readFile('/path/to/file.txt', 'utf-8');
   * // 返回: 文件内容字符串
   * 
   * @example
   * const content = await fileUtils.readFile('/path/to/file.txt');
   * // 返回: Buffer 对象（不指定编码）
   * 
   * @example
   * const content = await fileUtils.readFile('/path/to/file.bin', null);
   * // 返回: Buffer 对象
   * 
   * @example
   * const content = await fileUtils.readFile('/path/to/file.txt', undefined);
   * // 返回: Buffer 对象
   */
  async readFile(filePath, encoding = null) {
    try {
      // 验证输入参数
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('文件路径不能为空且必须是字符串');
      }

      if (filePath.trim().length === 0) {
        throw new Error('文件路径不能为空或只包含空格');
      }

      // 规范化路径
      const normalizedPath = path.normalize(filePath);

      // 检查文件是否存在
      await this.checkFileExists(normalizedPath);

      // 读取文件内容
      // 如果encoding为null或undefined，则返回Buffer
      // 否则验证编码格式并返回字符串
      if (encoding === null || encoding === undefined) {
        const content = await fs.readFile(normalizedPath);
        return content;
      } else {
        // 验证编码格式
        if (!this.supportedEncodings.includes(encoding.toLowerCase())) {
          throw new Error(`不支持的编码格式，支持的格式有: ${this.supportedEncodings.join(', ')}`);
        }
        
        const content = await fs.readFile(normalizedPath, encoding);
        return content;
      }
    } catch (error) {
      // 记录错误并重新抛出
      console.error('读取文件失败:', error.message);
      throw new Error(`读取文件失败: ${error.message}`);
    }
  }

  /**
   * 写入文件
   * 将内容写入指定文件
   * 
   * @param {string} filePath - 文件路径
   * @param {string|Buffer} content - 要写入的内容
   * @param {string} encoding - 编码格式，默认 'utf-8'
   * @returns {Promise<boolean>} 写入是否成功
   * @throws {Error} 如果路径无效、编码无效或写入失败
   * 
   * @example
   * const success = await fileUtils.writeFile('/path/to/file.txt', 'Hello World', 'utf-8');
   * // 返回: true
   * 
   * @example
   * const success = await fileUtils.writeFile('/path/to/file.txt', 'Hello World');
   * // 返回: true（使用默认编码）
   * 
   * @example
   * const buffer = Buffer.from('Hello World', 'utf-8');
   * const success = await fileUtils.writeFile('/path/to/file.bin', buffer);
   * // 返回: true
   */
  async writeFile(filePath, content, encoding = this.defaultEncoding) {
    try {
      // 验证输入参数
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('文件路径不能为空且必须是字符串');
      }

      if (filePath.trim().length === 0) {
        throw new Error('文件路径不能为空或只包含空格');
      }

      if (content === undefined || content === null) {
        throw new Error('内容不能为空');
      }

      // 验证编码格式
      if (!this.supportedEncodings.includes(encoding.toLowerCase())) {
        throw new Error(`不支持的编码格式，支持的格式有: ${this.supportedEncodings.join(', ')}`);
      }

      // 规范化路径
      const normalizedPath = path.normalize(filePath);

      // 如果需要自动创建目录，则创建父目录
      if (this.autoCreateDir) {
        const dirPath = path.dirname(normalizedPath);
        await this.ensureDirectoryExists(dirPath);
      }

      // 写入文件
      await fs.writeFile(normalizedPath, content, encoding);
      
      return true;
    } catch (error) {
      // 记录错误并重新抛出
      console.error('写入文件失败:', error.message);
      throw new Error(`写入文件失败: ${error.message}`);
    }
  }

  /**
   * 删除文件
   * 删除指定文件
   * 
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 删除是否成功
   * @throws {Error} 如果文件不存在、路径无效或删除失败
   * 
   * @example
   * const deleted = await fileUtils.deleteFile('/path/to/file.txt');
   * // 返回: true
   * 
   * @example
   * const deleted = await fileUtils.deleteFile('/path/to/nonexistent.txt');
   * // 抛出错误: 文件不存在
   */
  async deleteFile(filePath) {
    try {
      // 验证输入参数
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('文件路径不能为空且必须是字符串');
      }

      if (filePath.trim().length === 0) {
        throw new Error('文件路径不能为空或只包含空格');
      }

      // 规范化路径
      const normalizedPath = path.normalize(filePath);

      // 检查文件是否存在
      const exists = await this.checkFileExists(normalizedPath);
      if (!exists) {
        throw new Error('文件不存在');
      }

      // 删除文件
      await fs.unlink(normalizedPath);
      
      return true;
    } catch (error) {
      // 记录错误并重新抛出
      console.error('删除文件失败:', error.message);
      throw new Error(`删除文件失败: ${error.message}`);
    }
  }

  /**
   * 移动文件
   * 将文件从源路径移动到目标路径
   * 
   * @param {string} sourcePath - 源文件路径
   * @param {string} targetPath - 目标文件路径
   * @returns {Promise<boolean>} 移动是否成功
   * @throws {Error} 如果源文件不��在、路径无效或移动失败
   * 
   * @example
   * const moved = await fileUtils.moveFile('/path/to/source.txt', '/path/to/target.txt');
   * // 返回: true
   * 
   * @example
   * const moved = await fileUtils.moveFile('/path/to/source.txt', '/path/to/newdir/target.txt');
   * // 返回: true（自动创建目标目录）
   */
  async moveFile(sourcePath, targetPath) {
    try {
      // 验证输入参数
      if (!sourcePath || typeof sourcePath !== 'string') {
        throw new Error('源文件路径不能为空且必须是字符串');
      }

      if (!targetPath || typeof targetPath !== 'string') {
        throw new Error('目标文件路径不能为空且必须是字符串');
      }

      if (sourcePath.trim().length === 0) {
        throw new Error('源文件路径不能为空或只包含空格');
      }

      if (targetPath.trim().length === 0) {
        throw new Error('目标文件路径不能为空或只包含空格');
      }

      // 规范化路径
      const normalizedSourcePath = path.normalize(sourcePath);
      const normalizedTargetPath = path.normalize(targetPath);

      // 检查源文件是否存在
      const exists = await this.checkFileExists(normalizedSourcePath);
      if (!exists) {
        throw new Error('源文件不存在');
      }

      // 检查目标文件是否已存在
      const targetExists = await this.checkFileExists(normalizedTargetPath);
      if (targetExists) {
        throw new Error('目标文件已存在');
      }

      // 如果需要自动创建目录，则创建目标目录
      if (this.autoCreateDir) {
        const targetDir = path.dirname(normalizedTargetPath);
        await this.ensureDirectoryExists(targetDir);
      }

      // 移动文件
      await fs.rename(normalizedSourcePath, normalizedTargetPath);
      
      return true;
    } catch (error) {
      // 记录错误并重新抛出
      console.error('移动文件失败:', error.message);
      throw new Error(`移动文件失败: ${error.message}`);
    }
  }

  /**
   * 复制文件
   * 将文件从源路径复制到目标路径
   * 
   * @param {string} sourcePath - 源文件路径
   * @param {string} targetPath - 目标文件路径
   * @returns {Promise<boolean>} 复制是否成功
   * @throws {Error} 如果源文件不存在、路径无效或复制失败
   * 
   * @example
   * const copied = await fileUtils.copyFile('/path/to/source.txt', '/path/to/target.txt');
   * // 返回: true
   * 
   * @example
   * const copied = await fileUtils.copyFile('/path/to/source.txt', '/path/to/newdir/target.txt');
   * // 返回: true（自动创建目标目录）
   */
  async copyFile(sourcePath, targetPath) {
    try {
      // 验证输入参数
      if (!sourcePath || typeof sourcePath !== 'string') {
        throw new Error('源文件路径不能为空且必须是字符串');
      }

      if (!targetPath || typeof targetPath !== 'string') {
        throw new Error('目标文件路径不能为空且必须是字符串');
      }

      if (sourcePath.trim().length === 0) {
        throw new Error('源文件路径不能为空或只包含空格');
      }

      if (targetPath.trim().length === 0) {
        throw new Error('目标文件路径不能为空或只包含空格');
      }

      // 规范化路径
      const normalizedSourcePath = path.normalize(sourcePath);
      const normalizedTargetPath = path.normalize(targetPath);

      // 检查源文件是否存在
      const exists = await this.checkFileExists(normalizedSourcePath);
      if (!exists) {
        throw new Error('源文件不存在');
      }

      // 检查目标文件是否已存在
      const targetExists = await this.checkFileExists(normalizedTargetPath);
      if (targetExists) {
        throw new Error('目标文件已存在');
      }

      // 如果需要自动创建目录，则创建目标目录
      if (this.autoCreateDir) {
        const targetDir = path.dirname(normalizedTargetPath);
        await this.ensureDirectoryExists(targetDir);
      }

      // 复制文件
      await fs.copyFile(normalizedSourcePath, normalizedTargetPath);
      
      return true;
    } catch (error) {
      // 记录错误并重新抛出
      console.error('复制文件失败:', error.message);
      throw new Error(`复制文件失败: ${error.message}`);
    }
  }

  /**
   * 获取文件信息
   * 获取指定文件的详细信息
   * 
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 文件信息对象
   * @throws {Error} 如果文件不存在、路径无效或获取信息失败
   * 
   * @example
   * const info = await fileUtils.getFileInfo('/path/to/file.txt');
   * // 返回: {
   * //   size: 1024,
   * //   birthtime: '2024-01-01T00:00:00.000Z',
   * //   mtime: '2024-01-01T12:00:00.000Z',
   * //   ctime: '2024-01-01T12:00:00.000Z',
   * //   atime: '2024-01-01T12:00:00.000Z',
   * //   isFile: true,
   * //   isDirectory: false,
   * //   isSymbolicLink: false,
   * //   extension: '.txt',
   * //   filename: 'file.txt',
   * //   dirname: '/path/to',
   * //   fullPath: '/path/to/file.txt'
   * // }
   */
  async getFileInfo(filePath) {
    try {
      // 验证输入参数
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('文件路径不能为空且必须是字符串');
      }

      if (filePath.trim().length === 0) {
        throw new Error('文件路径不能为空或只包含空格');
      }

      // 规范化路径
      const normalizedPath = path.normalize(filePath);

      // 检查文件是否存在
      const exists = await this.checkFileExists(normalizedPath);
      if (!exists) {
        throw new Error('文件不存在');
      }

      // 获取文件状态
      const stats = await fs.stat(normalizedPath);

      // 解析路径信息
      const parsedPath = path.parse(normalizedPath);

      // 构建文件信息对象
      const fileInfo = {
        // 基本属性
        size: stats.size, // 文件大小（字节）
        birthtime: stats.birthtime, // 创建时间
        mtime: stats.mtime, // 修改时间
        ctime: stats.ctime, // 状态改变时间
        atime: stats.atime, // 访问时间
        
        // 文件类型
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        isSymbolicLink: stats.isSymbolicLink(),
        
        // 权限信息
        mode: stats.mode,
        uid: stats.uid,
        gid: stats.gid,
        
        // 路径信息
        extension: parsedPath.ext, // 扩展名
        filename: parsedPath.base, // 文件名（包含扩展名）
        name: parsedPath.name, // 文件名（不包含扩展名）
        dirname: parsedPath.dir, // 目录路径
        fullPath: normalizedPath, // 完整路径
        
        // 格式化时间
        birthtimeFormatted: stats.birthtime.toISOString(),
        mtimeFormatted: stats.mtime.toISOString(),
        ctimeFormatted: stats.ctime.toISOString(),
        atimeFormatted: stats.atime.toISOString(),
        
        // 格式化大小
        sizeFormatted: this.formatFileSize(stats.size)
      };
      
      return fileInfo;
    } catch (error) {
      // 记录错误并重新抛出
      console.error('获取文件信息失败:', error.message);
      throw new Error(`获取文件信息失败: ${error.message}`);
    }
  }

  /**
   * 检查文件是否存在
   * 检查指定文件是否存在
   * 
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 文件是否存在
   * 
   * @example
   * const exists = await fileUtils.checkFileExists('/path/to/file.txt');
   * // 返回: true 或 false
   * 
   * @example
   * const exists = await fileUtils.checkFileExists('/path/to/nonexistent.txt');
   * // 返回: false
   */
  async checkFileExists(filePath) {
    try {
      // 验证输入参数
      if (!filePath || typeof filePath !== 'string') {
        return false;
      }

      if (filePath.trim().length === 0) {
        return false;
      }

      // 规范化路径
      const normalizedPath = path.normalize(filePath);

      // 检查文件是否存在
      try {
        await fs.access(normalizedPath, fs.constants.F_OK);
        return true;
      } catch (error) {
        return false;
      }
    } catch (error) {
      // 如果发生错误，返回 false
      console.error('检查文件存在性失败:', error.message);
      return false;
    }
  }

  /**
   * 确保目录存在
   * 如果目录不存在，则创建它（包括所有父目录）
   * 
   * @param {string} dirPath - 目录路径
   * @returns {Promise<boolean>} 目录是否存在或创建成功
   * @private
   */
  async ensureDirectoryExists(dirPath) {
    try {
      // 检查目录是否存在
      const exists = await this.checkFileExists(dirPath);
      if (exists) {
        // 检查是否是目录
        const stats = await fs.stat(dirPath);
        if (!stats.isDirectory()) {
          throw new Error(`路径 ${dirPath} 已存在但不是目录`);
        }
        return true;
      }

      // 创建目录（包括所有父目录）
      await fs.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      console.error('创建目录失败:', error.message);
      throw new Error(`创建目录失败: ${error.message}`);
    }
  }

  /**
   * 格式化文件大小
   * 将字节数格式化为易读的字符串
   * 
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的文件大小
   * @private
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
  }

  /**
   * 更新默认编码
   * 更新默认的文件编码
   * 
   * @param {string} encoding - 新的默认编码
   * @returns {void}
   * @throws {Error} 如果编码无效
   */
  updateDefaultEncoding(encoding) {
    try {
      if (!encoding || typeof encoding !== 'string') {
        throw new Error('编码参数必须是字符串');
      }

      if (!this.supportedEncodings.includes(encoding.toLowerCase())) {
        throw new Error(`不支持的编码格式，支持的格式有: ${this.supportedEncodings.join(', ')}`);
      }

      this.defaultEncoding = encoding;
    } catch (error) {
      console.error('更新默认编码失败:', error.message);
      throw new Error(`更新默认编码失败: ${error.message}`);
    }
  }

  /**
   * 更新自动创建目录设置
   * 更新是否自动创建目录的设置
   * 
   * @param {boolean} autoCreateDir - 是否自动创建目录
   * @returns {void}
   */
  updateAutoCreateDir(autoCreateDir) {
    try {
      if (typeof autoCreateDir !== 'boolean') {
        throw new Error('自动创建目录参数必须是布尔值');
      }

      this.autoCreateDir = autoCreateDir;
    } catch (error) {
      console.error('更新自动创建目录设置失败:', error.message);
      throw new Error(`更新自动创建目录设置失败: ${error.message}`);
    }
  }

  /**
   * 添加支持的编码格式
   * 添加新的编码格式到支持列表中
   * 
   * @param {string|Array<string>} encodings - 要添加的编码格式或编码数组
   * @returns {void}
   * @throws {Error} 如果编码无效
   */
  addSupportedEncodings(encodings) {
    try {
      if (!encodings) {
        throw new Error('编码参数不能为空');
      }

      if (typeof encodings === 'string') {
        // 单个编码
        const encodingLower = encodings.toLowerCase();
        if (!this.supportedEncodings.includes(encodingLower)) {
          this.supportedEncodings.push(encodingLower);
        }
      } else if (Array.isArray(encodings)) {
        // 编码数组
        encodings.forEach(encoding => {
          if (typeof encoding === 'string') {
            const encodingLower = encoding.toLowerCase();
            if (!this.supportedEncodings.includes(encodingLower)) {
              this.supportedEncodings.push(encodingLower);
            }
          }
        });
      } else {
        throw new Error('编码参数必须是字符串或字符串数组');
      }
    } catch (error) {
      console.error('添加支持的编码失败:', error.message);
      throw new Error(`添加支持的编码失败: ${error.message}`);
    }
  }

  /**
   * 获取支持的编码格式列表
   * 获取所有支持的编码格式
   * 
   * @returns {Array<string>} 支持的编码格式列表
   */
  getSupportedEncodings() {
    return [...this.supportedEncodings];
  }

  /**
   * 列出目录内容
   * 列出指定目录中的所有文件和子目录
   * 
   * @param {string} dirPath - 目录路径
   * @param {Object} options - 选项
   * @param {boolean} options.recursive - 是否递归列出，默认 false
   * @param {boolean} options.withFileTypes - 是否包含文件类型信息，默认 false
   * @returns {Promise<Array<string|Object>>} 目录内容列表
   * @throws {Error} 如果目录不存在或路径无效
   * 
   * @example
   * const files = await fileUtils.listDirectory('/path/to/dir');
   * // 返回: ['file1.txt', 'file2.txt', 'subdir']
   * 
   * @example
   * const files = await fileUtils.listDirectory('/path/to/dir', { withFileTypes: true });
   * // 返回: [{ name: 'file1.txt', isFile: true, isDirectory: false }, ...]
   */
  async listDirectory(dirPath, options = {}) {
    try {
      // 验证输入参数
      if (!dirPath || typeof dirPath !== 'string') {
        throw new Error('目录路径不能为空且必须是字符串');
      }

      if (dirPath.trim().length === 0) {
        throw new Error('目录路径不能为空或只包含空格');
      }

      // 规范化路径
      const normalizedPath = path.normalize(dirPath);

      // 检查目录是否存在
      const exists = await this.checkFileExists(normalizedPath);
      if (!exists) {
        throw new Error('目录不存在');
      }

      // 检查是否是目录
      const stats = await fs.stat(normalizedPath);
      if (!stats.isDirectory()) {
        throw new Error(`路径 ${normalizedPath} 不是目录`);
      }

      const { recursive = false, withFileTypes = false } = options;

      if (recursive) {
        return await this.listDirectoryRecursive(normalizedPath, withFileTypes);
      } else {
        return await this.listDirectorySimple(normalizedPath, withFileTypes);
      }
    } catch (error) {
      console.error('列出目录内容失败:', error.message);
      throw new Error(`列出目录内容失败: ${error.message}`);
    }
  }

  /**
   * 简单列出目录内容
   * 列出指定目录中的直接内容（非递归）
   * 
   * @param {string} dirPath - 目录路径
   * @param {boolean} withFileTypes - 是否包含文件类型信息
   * @returns {Promise<Array<string|Object>>} 目录内容列表
   * @private
   */
  async listDirectorySimple(dirPath, withFileTypes) {
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: withFileTypes });

      if (withFileTypes) {
        return items.map(item => ({
          name: item.name,
          isFile: item.isFile(),
          isDirectory: item.isDirectory(),
          isSymbolicLink: item.isSymbolicLink(),
          fullPath: path.join(dirPath, item.name)
        }));
      } else {
        return items;
      }
    } catch (error) {
      throw new Error(`读取目录失败: ${error.message}`);
    }
  }

  /**
   * 递归列出目录内容
   * 递归列出指定目录中的所有内容
   * 
   * @param {string} dirPath - 目录路径
   * @param {boolean} withFileTypes - 是否包含文件类型信息
   * @returns {Promise<Array<Object>>} 目录内容列表
   * @private
   */
  async listDirectoryRecursive(dirPath, withFileTypes) {
    try {
      const result = [];
      const items = await fs.readdir(dirPath, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        
        if (withFileTypes) {
          const itemInfo = {
            name: item.name,
            isFile: item.isFile(),
            isDirectory: item.isDirectory(),
            isSymbolicLink: item.isSymbolicLink(),
            fullPath: itemPath
          };
          result.push(itemInfo);
        } else {
          result.push(itemPath);
        }

        // 如果是目录，递归处理
        if (item.isDirectory()) {
          const subItems = await this.listDirectoryRecursive(itemPath, withFileTypes);
          result.push(...subItems);
        }
      }

      return result;
    } catch (error) {
      throw new Error(`递归读取目录失败: ${error.message}`);
    }
  }
}

// 创建默认实例
const defaultInstance = new FileUtils();

// 导出类和方法
module.exports = {
  FileUtils,
  
  // 便捷方法 - 使用默认实例
  readFile: (filePath, encoding) => defaultInstance.readFile(filePath, encoding),
  writeFile: (filePath, content, encoding) => defaultInstance.writeFile(filePath, content, encoding),
  deleteFile: (filePath) => defaultInstance.deleteFile(filePath),
  moveFile: (sourcePath, targetPath) => defaultInstance.moveFile(sourcePath, targetPath),
  copyFile: (sourcePath, targetPath) => defaultInstance.copyFile(sourcePath, targetPath),
  getFileInfo: (filePath) => defaultInstance.getFileInfo(filePath),
  checkFileExists: (filePath) => defaultInstance.checkFileExists(filePath),
  ensureDirectoryExists: (dirPath) => defaultInstance.ensureDirectoryExists(dirPath),
  formatFileSize: (bytes) => defaultInstance.formatFileSize(bytes),
  updateDefaultEncoding: (encoding) => defaultInstance.updateDefaultEncoding(encoding),
  updateAutoCreateDir: (autoCreateDir) => defaultInstance.updateAutoCreateDir(autoCreateDir),
  addSupportedEncodings: (encodings) => defaultInstance.addSupportedEncodings(encodings),
  getSupportedEncodings: () => defaultInstance.getSupportedEncodings(),
  listDirectory: (dirPath, options) => defaultInstance.listDirectory(dirPath, options),
  
  // 导出默认实例
  default: defaultInstance
};

// 导出默认实例作为模块默认导出
module.exports.default = defaultInstance;