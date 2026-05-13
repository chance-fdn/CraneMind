/**
 * 响应格式化工具测试文件
 * 用于验证响应格式化工具的功能正确性
 */

const response = require('./response');

// 模拟 Express 响应对象
const createMockResponse = () => {
  const res = {
    statusCode: 200,
    jsonData: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.jsonData = data;
      return this;
    }
  };
  return res;
};

/**
 * 测试成功响应
 */
const testSuccessResponse = () => {
  console.log('测试成功响应...');
  const res = createMockResponse();
  
  response.success(res, { id: 1, name: '测试用户' }, '查询成功');
  
  console.log('状态码:', res.statusCode);
  console.log('响应数据:', JSON.stringify(res.jsonData, null, 2));
  
  if (res.statusCode === 200 && 
      res.jsonData.success === true && 
      res.jsonData.data.id === 1) {
    console.log('✓ 成功响应测试通过');
  } else {
    console.log('✗ 成功响应测试失败');
  }
  console.log();
};

/**
 * 测试错误响应
 */
const testErrorResponse = () => {
  console.log('测试错误响应...');
  const res = createMockResponse();
  
  response.error(res, 'VALIDATION_ERROR', '数据验证失败', { field: 'username' }, 400);
  
  console.log('状态码:', res.statusCode);
  console.log('响应数据:', JSON.stringify(res.jsonData, null, 2));
  
  if (res.statusCode === 400 && 
      res.jsonData.success === false && 
      res.jsonData.error.code === 'VALIDATION_ERROR') {
    console.log('✓ 错误响应测试通过');
  } else {
    console.log('✗ 错误响应测试失败');
  }
  console.log();
};

/**
 * 测试分页响应
 */
const testPaginationResponse = () => {
  console.log('测试分页响应...');
  const res = createMockResponse();
  
  const data = [
    { id: 1, name: '用户1' },
    { id: 2, name: '用户2' },
    { id: 3, name: '用户3' }
  ];
  
  response.pagination(res, data, 100, 2, 10, '分页查询成功');
  
  console.log('状态码:', res.statusCode);
  console.log('响应数据:', JSON.stringify(res.jsonData, null, 2));
  
  if (res.statusCode === 200 && 
      res.jsonData.success === true && 
      res.jsonData.data.items.length === 3 &&
      res.jsonData.data.pagination.total === 100) {
    console.log('✓ 分页响应测试通过');
  } else {
    console.log('✗ 分页响应测试失败');
  }
  console.log();
};

/**
 * 测试创建成功响应
 */
const testCreatedResponse = () => {
  console.log('测试创建成功响应...');
  const res = createMockResponse();
  
  response.created(res, { id: 1, name: '新用户' }, '用户创建成功');
  
  console.log('状态码:', res.statusCode);
  console.log('响应数据:', JSON.stringify(res.jsonData, null, 2));
  
  if (res.statusCode === 201 && 
      res.jsonData.success === true && 
      res.jsonData.data.id === 1) {
    console.log('✓ 创建成功响应测试通过');
  } else {
    console.log('✗ 创建成功响应测试失败');
  }
  console.log();
};

/**
 * 测试未授权响应
 */
const testUnauthorizedResponse = () => {
  console.log('测试未授权响应...');
  const res = createMockResponse();
  
  response.unauthorized(res, '请先登录');
  
  console.log('状态码:', res.statusCode);
  console.log('响应数据:', JSON.stringify(res.jsonData, null, 2));
  
  if (res.statusCode === 401 && 
      res.jsonData.success === false && 
      res.jsonData.error.code === 'UNAUTHORIZED') {
    console.log('✓ 未授权响应测试通过');
  } else {
    console.log('✗ 未授权响应测试失败');
  }
  console.log();
};

/**
 * 测试未找到响应
 */
const testNotFoundResponse = () => {
  console.log('测试未找到响应...');
  const res = createMockResponse();
  
  response.notFound(res, '用户不存在');
  
  console.log('状态码:', res.statusCode);
  console.log('响应数据:', JSON.stringify(res.jsonData, null, 2));
  
  if (res.statusCode === 404 && 
      res.jsonData.success === false && 
      res.jsonData.error.code === 'NOT_FOUND') {
    console.log('✓ 未找到响应测试通过');
  } else {
    console.log('✗ 未找到响应测试失败');
  }
  console.log();
};

/**
 * 测试服务器错误响应
 */
const testInternalErrorResponse = () => {
  console.log('测试服务器错误响应...');
  const res = createMockResponse();
  
  response.internalError(res, '数据库连接失败');
  
  console.log('状态码:', res.statusCode);
  console.log('响应数据:', JSON.stringify(res.jsonData, null, 2));
  
  if (res.statusCode === 500 && 
      res.jsonData.success === false && 
      res.jsonData.error.code === 'INTERNAL_ERROR') {
    console.log('✓ 服务器错误响应测试通过');
  } else {
    console.log('✗ 服务器错误响应测试失败');
  }
  console.log();
};

/**
 * 测试验证错误响应
 */
const testValidationErrorResponse = () => {
  console.log('测试验证错误响应...');
  const res = createMockResponse();
  
  const errors = [
    { field: 'username', message: '用户名不能为空' },
    { field: 'password', message: '密码长度至少6位' }
  ];
  
  response.validationError(res, errors, '表单验证失败');
  
  console.log('状态码:', res.statusCode);
  console.log('响应数据:', JSON.stringify(res.jsonData, null, 2));
  
  if (res.statusCode === 422 && 
      res.jsonData.success === false && 
      res.jsonData.error.code === 'VALIDATION_ERROR' &&
      res.jsonData.error.details.length === 2) {
    console.log('✓ 验证错误响应测试通过');
  } else {
    console.log('✗ 验证错误响应测试失败');
  }
  console.log();
};

/**
 * 测试自定义响应
 */
const testCustomResponse = () => {
  console.log('测试自定义响应...');
  const res = createMockResponse();
  
  response.custom(res)
    .status(201)
    .setData({ id: 1, name: '自定义用户' })
    .setMessage('自定义创建成功')
    .send();
  
  console.log('状态码:', res.statusCode);
  console.log('响应数据:', JSON.stringify(res.jsonData, null, 2));
  
  if (res.statusCode === 201 && 
      res.jsonData.success === true && 
      res.jsonData.data.id === 1) {
    console.log('✓ 自定义响应测试通过');
  } else {
    console.log('✗ 自定义响应测试失败');
  }
  console.log();
};

/**
 * 运行所有测试
 */
const runAllTests = () => {
  console.log('开始运行响应格式化工具测试...\n');
  
  testSuccessResponse();
  testErrorResponse();
  testPaginationResponse();
  testCreatedResponse();
  testUnauthorizedResponse();
  testNotFoundResponse();
  testInternalErrorResponse();
  testValidationErrorResponse();
  testCustomResponse();
  
  console.log('所有测试完成！');
};

// 运行测试
if (require.main === module) {
  runAllTests();
}

// 导出测试函数
module.exports = {
  testSuccessResponse,
  testErrorResponse,
  testPaginationResponse,
  testCreatedResponse,
  testUnauthorizedResponse,
  testNotFoundResponse,
  testInternalErrorResponse,
  testValidationErrorResponse,
  testCustomResponse,
  runAllTests
};