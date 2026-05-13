'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config');
const demo = require('../demo.store');
const aiEngine = require('../services/ai.engine');

const router = express.Router();

function send(res, data, message) {
  res.json(demo.success(data, message));
}

function list(res, rows, message) {
  send(res, demo.paged(rows), message);
}

router.post('/user/login', (req, res) => {
  const username = req.body?.lgName || req.body?.username || 'admin';
  const token = jwt.sign(
    {
      userId: 1,
      username,
      role: 'super_admin',
      permissions: ['*'],
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
      issuer: config.jwt.issuer,
    }
  );

  send(res, {
    token,
    id: 1,
    userName: username,
    realName: '系统管理员',
    userIdentity: 3,
    roleName: '超级管理员',
  }, '登录成功');
});

router.post('/user/exit', (req, res) => send(res, null, '退出成功'));
router.post('/user/registration', (req, res) => send(res, { id: Date.now(), ...req.body }, '注册成功'));
router.post('/user/update', (req, res) => send(res, req.body, '用户更新成功'));
router.post('/user/uploadPhoto', (req, res) => send(res, { url: '/uploads/avatar.png' }, '上传成功'));
router.post('/user/find', (req, res) => list(res, [
  { id: 1, userName: 'admin', realName: '系统管理员', userIdentity: 3, status: 1 },
  { id: 2, userName: 'operator', realName: '中控操作员', userIdentity: 1, status: 1 },
], '用户列表'));
router.post('/user/promotion', (req, res) => send(res, null, '权限调整成功'));
router.post('/user/blockUser', (req, res) => send(res, null, '用户状态调整成功'));
router.post('/user/findLogs', (req, res) => list(res, [
  { id: 1, userName: 'admin', action: '登录系统', module: '认证', createTime: demo.now() },
  { id: 2, userName: 'operator', action: '执行急停检查', module: '行车控制', createTime: demo.daysAgo(1) },
], '日志列表'));

router.post('/disCrane/readDriveData', (req, res) => send(res, demo.cranes.map((crane) => ({
  craneNo: crane.craneNo,
  x: crane.x,
  y: crane.y,
  z: crane.z,
  speed: crane.speed,
  loadWeight: crane.loadWeight,
  status: crane.status,
  mode: crane.mode,
})), '行车实时位置'));
router.post('/disCrane/readPawlData', (req, res) => send(res, demo.cranes.map((crane) => ({
  craneNo: crane.craneNo,
  pawlStatus: crane.grabStatus,
  weight: crane.loadWeight,
  height: crane.z,
})), '抓斗实时数据'));
router.post('/disCrane/findLargeObjectList', (req, res) => list(res, demo.alarms.filter((item) => item.alarmType === 'large_object'), '大物告警记录'));
router.post('/disCrane/findCraneAlarmList', (req, res) => list(res, demo.alarms.filter((item) => item.alarmType !== 'large_object'), '行车告警记录'));
router.post('/disCrane/findPutMaterialList', (req, res) => list(res, demo.tasks.filter((item) => item.taskType === 'feeding'), '投料记录'));
router.post('/disCrane/findTaskList', (req, res) => list(res, demo.tasks, '任务列表'));
router.post('/disCrane/countTask', (req, res) => send(res, [
  { craneNo: '1#', completeCount: 28, runningCount: 1 },
  { craneNo: '2#', completeCount: 21, runningCount: 0 },
  { craneNo: '3#', completeCount: 17, runningCount: 1 },
], '任务统计'));
router.post('/disCrane/countTaskTime', (req, res) => send(res, [
  { craneNo: '1#', avgDuration: 412, maxDuration: 820 },
  { craneNo: '2#', avgDuration: 386, maxDuration: 760 },
  { craneNo: '3#', avgDuration: 438, maxDuration: 930 },
], '任务时间统计'));
router.post('/disCrane/findCraneDutyConfig', (req, res) => list(res, demo.cranes.map((item) => ({
  id: item.id,
  craneNo: item.craneNo,
  dutyType: item.duty,
  dutyName: { feeding: '投料', stacking: '堆料', turning: '翻料' }[item.duty] || item.duty,
  status: 1,
})), '行车职责配置'));
router.post('/disCrane/findBriefCraneDuty', (req, res) => send(res, demo.cranes, '行车职责简表'));
router.post('/disCrane/craneDutyConfig', (req, res) => send(res, req.body, '职责配置成功'));
router.post('/disCrane/delCraneDutyConfig', (req, res) => send(res, null, '职责配置删除成功'));
router.post('/disCrane/delBriefCraneDuty', (req, res) => send(res, null, '简略职责删除成功'));
router.post('/disCrane/updateCraneDutyDoor', (req, res) => send(res, null, '卸料门配置成功'));
router.post('/disCrane/findTaskLog', (req, res) => list(res, [
  { id: 1, taskNo: 'T20260513001', content: 'AI建议优先投料A2区', createTime: demo.now() },
], '任务计算日志'));
router.post('/disCrane/aiDispatch', async (req, res, next) => {
  try {
    const result = await aiEngine.generateCraneDispatch(req.body || {});
    send(res, result, 'AI垃圾吊调度方案生成成功');
  } catch (error) {
    next(error);
  }
});
router.post('/disCrane/confirmAiDispatch', async (req, res, next) => {
  try {
    const selectedTaskNos = Array.isArray(req.body?.selectedTaskNos)
      ? req.body.selectedTaskNos
      : String(req.body?.selectedTaskNos || '').split(',').filter(Boolean);
    const result = await aiEngine.confirmCraneDispatch({
      planNo: req.body?.planNo,
      selectedTaskNos,
    });
    send(res, result, 'AI垃圾吊调度方案确认成功');
  } catch (error) {
    next(error);
  }
});
router.post('/disCrane/tlState', (req, res) => send(res, [
  { portNo: 'P1', status: 'feeding', weight: 3.5 },
  { portNo: 'P2', status: 'standby', weight: 0 },
], '投料口状态'));
router.post('/disCrane/ackAlarm', (req, res) => send(res, null, '告警处理成功'));
router.post('/disCrane/ackCranePlace', (req, res) => send(res, null, '位置校验确认成功'));
router.post('/disCrane/handleCraneAlarm', (req, res) => send(res, null, '行车告警处理成功'));

router.post('/disAreaInfo/findList', (req, res) => list(res, demo.fermentation, '发酵数据'));
router.post('/disAreaInfo/findPutMaterialPortList', (req, res) => send(res, [
  { id: 1, portNo: 'P1', name: '1号投料口', status: 'running' },
  { id: 2, portNo: 'P2', name: '2号投料口', status: 'standby' },
], '投料口信息'));
router.post('/disAreaInfo/findPartTrash', (req, res) => send(res, demo.areas, '各区垃圾量'));
router.post('/disAreaInfo/findTrashSum', (req, res) => send(res, {
  totalWeight: demo.areas.reduce((sum, area) => sum + area.trashWeight, 0),
  updateTime: demo.now(),
}, '垃圾总量'));
router.post('/disAreaInfo/findDlPortList', (req, res) => list(res, [
  { id: 1, areaNo: 'A1', doorNo: 'D1', status: 'open' },
  { id: 2, areaNo: 'A5', doorNo: 'D3', status: 'closed' },
], '开门信息'));
router.post('/disAreaInfo/addDlPort', (req, res) => send(res, null, '添加成功'));
router.post('/disAreaInfo/delDlPort', (req, res) => send(res, null, '删除成功'));
router.post('/disAreaInfo/updateArea', (req, res) => send(res, req.body, '区域更新成功'));

router.post('/car/findCarDisList', (req, res) => list(res, demo.vehicles.filter((item) => item.status === '已卸料'), '车辆卸料列表'));
router.post('/car/findCarInOutList', (req, res) => list(res, demo.vehicles, '车辆进出列表'));
router.post('/car/findCarInfoList', (req, res) => list(res, demo.vehicles, '车辆运料列表'));
router.post('/car/addCarInfo', (req, res) => send(res, { id: Date.now(), ...req.body }, '车辆记录添加成功'));
router.post('/car/findCarCount', (req, res) => send(res, { count: demo.vehicles.length, waiting: 1 }, '在场车辆数'));
router.post('/car/findDoorQueue', (req, res) => send(res, [
  { doorNo: 'D1', queueCount: 2 },
  { doorNo: 'D3', queueCount: 1 },
], '卸料门排队信息'));

router.post('/device/findDeviceFaultList', (req, res) => list(res, demo.alarms.filter((item) => item.level !== 'critical'), '设备告警'));
router.post('/device/findDeviceList', (req, res) => list(res, demo.devices, '设备列表'));
router.post('/device/findDeviceDataList', (req, res) => list(res, demo.cranes.map((item) => ({
  craneNo: item.craneNo,
  speed: item.speed,
  loadWeight: item.loadWeight,
  recordTime: demo.now(),
})), '设备运行数据'));
router.post('/device/getTgState', (req, res) => send(res, { status: 1, name: '抬杆已开启' }, '抬杆状态'));
router.post('/device/statisticsDeviceData', (req, res) => send(res, demo.cranes.map((item) => ({
  craneNo: item.craneNo,
  avgSpeed: item.speed,
  avgLoad: item.loadWeight,
})), '设备统计'));
router.post('/device/findDtCameraVideo', (req, res) => send(res, demo.devices.filter((item) => item.type === 'camera'), '摄像头视频'));

router.post('/plc/findInstructionList', (req, res) => list(res, demo.tasks.map((item) => ({
  id: item.id,
  instructionNo: `INS-${item.id}`,
  taskNo: item.taskNo,
  content: `${item.craneNo}${item.taskName}: ${item.sourceArea} -> ${item.targetArea}`,
  status: item.status,
  createTime: item.createdAt,
})), '调度指令'));
router.post('/plc/findPlcStepNodeList', (req, res) => list(res, demo.tasks, '调度任务'));

router.post('/xlm/findCloseMsg', (req, res) => list(res, [
  { id: 1, doorNo: 'D1', action: 'open', status: '已确认', createTime: demo.now() },
  { id: 2, doorNo: 'D3', action: 'close', status: '待确认', createTime: demo.daysAgo(1) },
], '卸料门记录'));
router.post('/xlm/ackClose', (req, res) => send(res, null, '确认成功'));
router.post('/xlm/getAutomaticStatus', (req, res) => send(res, { status: 1 }, '自动状态'));
router.post('/xlm/openAutomatic', (req, res) => send(res, null, '自动状态已切换'));
router.post('/xlm/getDoorCameraUrl', (req, res) => send(res, demo.devices.filter((item) => item.type === 'camera'), '卸料门摄像头'));

router.post('/disParamSet/findParamSet', (req, res) => send(res, [
  { id: 1, paramKey: 'alarm.methane.max', paramName: '甲烷告警阈值', paramValue: '15', unit: '%' },
  { id: 2, paramKey: 'ai.schedule.interval', paramName: 'AI调度分析间隔', paramValue: '10', unit: '分钟' },
], '参数配置'));
router.post('/disParamSet/paramSet', (req, res) => send(res, req.body, '参数保存成功'));

module.exports = router;
