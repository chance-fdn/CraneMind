'use strict';

const now = () => new Date().toISOString();
const daysAgo = (day) => new Date(Date.now() - day * 24 * 60 * 60 * 1000).toISOString();

const cranes = [
  { id: 1, craneNo: '1#', crane_no: 'crane01', name: '1号垃圾吊', status: 'running', mode: 'auto', duty: 'feeding', x: 24.6, y: 11.2, z: 7.5, grabStatus: 'closed', loadWeight: 4.8, speed: 1.4 },
  { id: 2, craneNo: '2#', crane_no: 'crane02', name: '2号垃圾吊', status: 'standby', mode: 'auto', duty: 'stacking', x: 46.3, y: 16.8, z: 6.9, grabStatus: 'open', loadWeight: 0.6, speed: 0 },
  { id: 3, craneNo: '3#', crane_no: 'crane03', name: '3号垃圾吊', status: 'running', mode: 'manual', duty: 'turning', x: 71.4, y: 9.7, z: 8.1, grabStatus: 'moving', loadWeight: 3.2, speed: 1.1 },
];

const areas = Array.from({ length: 9 }, (_, index) => {
  const height = [5.8, 4.2, 6.9, 3.6, 7.1, 5.2, 4.8, 6.1, 3.9][index];
  return {
    id: index + 1,
    areaNo: `A${index + 1}`,
    area_no: `A${index + 1}`,
    name: `储坑${index + 1}区`,
    type: index % 3 === 0 ? 'feeding' : 'stacking',
    coordinateX: (index % 3) * 24,
    coordinateY: Math.floor(index / 3) * 18,
    width: 22,
    depth: 16,
    currentHeight: height,
    maxHeight: 8,
    trashWeight: Math.round(height * 86),
    temperature: +(38 + index * 1.7).toFixed(1),
    humidity: +(61 + index * 1.2).toFixed(1),
    methane: +(7.5 + index * 0.8).toFixed(1),
    coverStatus: index % 2 === 0 ? 'closed' : 'open',
  };
});

const alarms = [
  { id: 101, alarmType: 'grab_slip', alarmName: '遛钩告警', craneNo: '1#', level: 'critical', message: '1号垃圾吊抓斗高度异常下降', status: 'active', createdAt: now() },
  { id: 102, alarmType: 'position_error', alarmName: '位置校验超差', craneNo: '3#', level: 'major', message: '3号垃圾吊编码器位置偏差超过阈值', status: 'active', createdAt: daysAgo(1) },
  { id: 103, alarmType: 'large_object', alarmName: '大物体告警', cameraNo: 'CAM-02', level: 'major', message: '卸料口检测到疑似家具大件', status: 'pending', createdAt: daysAgo(2) },
];

const tasks = [
  { id: 201, taskNo: 'T20260513001', craneNo: '1#', taskType: 'feeding', taskName: '投料', sourceArea: 'A2', targetArea: '投料口1', status: 'running', priority: 1, weight: 5.2, duration: 420, createdAt: now() },
  { id: 202, taskNo: 'T20260513002', craneNo: '2#', taskType: 'stacking', taskName: '堆料', sourceArea: '卸料门3', targetArea: 'A5', status: 'pending', priority: 2, weight: 4.5, duration: 0, createdAt: now() },
  { id: 203, taskNo: 'T20260512008', craneNo: '3#', taskType: 'turning', taskName: '翻料', sourceArea: 'A7', targetArea: 'A7', status: 'completed', priority: 3, weight: 8.1, duration: 760, createdAt: daysAgo(1) },
];

const vehicles = [
  { id: 301, vehicleNo: '粤A8K219', materialType: '生活垃圾', weight: 12.6, doorNo: 'D3', status: '已卸料', enterTime: daysAgo(0), exitTime: now() },
  { id: 302, vehicleNo: '粤B31R06', materialType: '厨余混合', weight: 9.8, doorNo: 'D1', status: '排队中', enterTime: now(), exitTime: '' },
  { id: 303, vehicleNo: '粤E72L51', materialType: '园区垃圾', weight: 11.4, doorNo: 'D4', status: '运输中', enterTime: daysAgo(1), exitTime: daysAgo(1) },
];

const devices = [
  { id: 401, deviceNo: 'CAM-01', name: '大厅全景摄像头', type: 'camera', status: 'normal', location: '垃圾大厅', videoUrl: '' },
  { id: 402, deviceNo: 'CAM-02', name: '卸料口2摄像头', type: 'camera', status: 'normal', location: '卸料口2', videoUrl: '' },
  { id: 403, deviceNo: 'SEN-CH4-01', name: '甲烷传感器1', type: 'sensor', status: 'normal', location: 'A1区' },
  { id: 404, deviceNo: 'XLM-03', name: '3号卸料门', type: 'discharge_door', status: 'normal', location: 'D3' },
];

const fermentation = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  areaNo: `A${(index % 9) + 1}`,
  temperature: +(40 + Math.sin(index) * 5).toFixed(2),
  humidity: +(63 + Math.cos(index) * 4).toFixed(2),
  methaneConcentration: +(9 + index * 0.35).toFixed(2),
  recordedAt: daysAgo(11 - index),
}));

const success = (data = {}, message = '操作成功') => ({
  code: 200,
  success: true,
  data,
  message,
  timestamp: now(),
});

const paged = (list, page = 1, limit = 10) => ({
  records: list,
  list,
  rows: list,
  total: list.length,
  page: Number(page) || 1,
  limit: Number(limit) || 10,
});

module.exports = {
  now,
  daysAgo,
  cranes,
  areas,
  alarms,
  tasks,
  vehicles,
  devices,
  fermentation,
  success,
  paged,
};
