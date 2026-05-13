-- =====================================================
-- 垃圾储坑智能化管控系统 - 数据库建表脚本
-- 数据库: PostgreSQL 14+
-- 创建时间: 2024-01-01
-- =====================================================

-- 删除已存在的表（按依赖顺序删除）
DROP TABLE IF EXISTS ai_analysis_records CASCADE;
DROP TABLE IF EXISTS medical_waste_mode_records CASCADE;
DROP TABLE IF EXISTS system_parameters CASCADE;
DROP TABLE IF EXISTS vehicle_records CASCADE;
DROP TABLE IF EXISTS inventory_data CASCADE;
DROP TABLE IF EXISTS fermentation_data CASCADE;
DROP TABLE IF EXISTS dispatch_instructions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS device_alarms CASCADE;
DROP TABLE IF EXISTS large_object_alarms CASCADE;
DROP TABLE IF EXISTS crane_alarms CASCADE;
DROP TABLE IF EXISTS area_relations CASCADE;
DROP TABLE IF EXISTS areas CASCADE;
DROP TABLE IF EXISTS discharge_doors CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS cranes CASCADE;
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS operation_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- =====================================================
-- 1. 用户相关表
-- =====================================================

-- 1.1 角色表
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL COMMENT '角色名称',
    code VARCHAR(50) UNIQUE NOT NULL COMMENT '角色代码',
    description TEXT COMMENT '角色描述',
    permissions JSONB COMMENT '权限列表',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
);

COMMENT ON TABLE roles IS '角色表';
COMMENT ON COLUMN roles.id IS '主键ID';
COMMENT ON COLUMN roles.name IS '角色名称';
COMMENT ON COLUMN roles.code IS '角色代码';
COMMENT ON COLUMN roles.description IS '角色描述';
COMMENT ON COLUMN roles.permissions IS '权限列表（JSON格式）';

-- 1.2 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码（加密存储）',
    email VARCHAR(100) UNIQUE COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '手机号',
    real_name VARCHAR(50) COMMENT '真实姓名',
    role_id INTEGER REFERENCES roles(id) COMMENT '角色ID',
    status VARCHAR(20) DEFAULT 'active' COMMENT '状态：active-活跃，inactive-不活跃，locked-锁定',
    last_login_at TIMESTAMP COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
);

COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.id IS '主键ID';
COMMENT ON COLUMN users.username IS '用户名';
COMMENT ON COLUMN users.password IS '密码（bcrypt加密）';
COMMENT ON COLUMN users.email IS '邮箱';
COMMENT ON COLUMN users.phone IS '手机号';
COMMENT ON COLUMN users.real_name IS '真实姓名';
COMMENT ON COLUMN users.role_id IS '角色ID';
COMMENT ON COLUMN users.status IS '状态：active-活跃，inactive-不活跃，locked-锁定';
COMMENT ON COLUMN users.last_login_at IS '最后登录时间';

-- 1.3 操作日志表
CREATE TABLE operation_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) COMMENT '用户ID',
    action VARCHAR(100) NOT NULL COMMENT '操作动作',
    module VARCHAR(50) COMMENT '模块名称',
    description TEXT COMMENT '操作描述',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent TEXT COMMENT '用户代理',
    request_url TEXT COMMENT '请求URL',
    request_method VARCHAR(10) COMMENT '请求方法',
    request_params TEXT COMMENT '请求参数',
    response_status INTEGER COMMENT '响应状态码',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
);

COMMENT ON TABLE operation_logs IS '操作日志表';
COMMENT ON COLUMN operation_logs.id IS '主键ID';
COMMENT ON COLUMN operation_logs.user_id IS '用户ID';
COMMENT ON COLUMN operation_logs.action IS '操作动作';
COMMENT ON COLUMN operation_logs.module IS '模块名称';
COMMENT ON COLUMN operation_logs.description IS '操作描述';
COMMENT ON COLUMN operation_logs.ip_address IS 'IP地址';
COMMENT ON COLUMN operation_logs.user_agent IS '用户代理';
COMMENT ON COLUMN operation_logs.request_url IS '请求URL';
COMMENT ON COLUMN operation_logs.request_method IS '请求方法';
COMMENT ON COLUMN operation_logs.request_params IS '请求参数';
COMMENT ON COLUMN operation_logs.response_status IS '响应状态码';

-- 1.4 系统日志表
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL COMMENT '日志级别：error, warn, info, debug',
    module VARCHAR(50) COMMENT '模块名称',
    message TEXT COMMENT '日志消息',
    stack_trace TEXT COMMENT '堆栈跟踪',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
);

COMMENT ON TABLE system_logs IS '系统日志表';
COMMENT ON COLUMN system_logs.id IS '主键ID';
COMMENT ON COLUMN system_logs.level IS '日志级别：error, warn, info, debug';
COMMENT ON COLUMN system_logs.module IS '模块名称';
COMMENT ON COLUMN system_logs.message IS '日志消息';
COMMENT ON COLUMN system_logs.stack_trace IS '堆栈跟踪';

-- =====================================================
-- 2. 设备相关表
-- =====================================================

-- 2.1 行车表
CREATE TABLE cranes (
    id SERIAL PRIMARY KEY,
    crane_no VARCHAR(20) UNIQUE NOT NULL COMMENT '行车编号：crane01, crane02, crane03',
    name VARCHAR(50) NOT NULL COMMENT '行车名称',
    status VARCHAR(20) DEFAULT 'offline' COMMENT '状态：online-在线, offline-离线, running-运行中, standby-待机, fault-故障',
    mode VARCHAR(20) DEFAULT 'auto' COMMENT '模式：auto-自动, manual-手动',
    current_position_x DECIMAL(10, 2) COMMENT '当前X坐标',
    current_position_y DECIMAL(10, 2) COMMENT '当前Y坐标',
    current_position_z DECIMAL(10, 2) COMMENT '当前Z坐标（高度）',
    grab_status VARCHAR(20) COMMENT '抓斗状态：open-打开, closed-关闭, moving-移动中',
    load_weight DECIMAL(10, 2) COMMENT '当前负载重量（吨）',
    speed DECIMAL(10, 2) COMMENT '当前速度（米/秒）',
    duty VARCHAR(50) COMMENT '职责：feeding-投料, stacking-堆料, turning-翻料, moving-移料',
    is_enabled BOOLEAN DEFAULT true COMMENT '是否启用',
    emergency_stop BOOLEAN DEFAULT false COMMENT '是否急停',
    last_maintenance_date DATE COMMENT '最后维护日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
);

COMMENT ON TABLE cranes IS '行车表';
COMMENT ON COLUMN cranes.id IS '主键ID';
COMMENT ON COLUMN cranes.crane_no IS '行车编号';
COMMENT ON COLUMN cranes.name IS '行车名称';
COMMENT ON COLUMN cranes.status IS '状态：online-在线, offline-离线, running-运行中, standby-待机, fault-故障';
COMMENT ON COLUMN cranes.mode IS '模式：auto-自动, manual-手动';
COMMENT ON COLUMN cranes.current_position_x IS '当前X坐标';
COMMENT ON COLUMN cranes.current_position_y IS '当前Y坐标';
COMMENT ON COLUMN cranes.current_position_z IS '当前Z坐标（高度）';
COMMENT ON COLUMN cranes.grab_status IS '抓斗状态：open-打开, closed-关闭, moving-移动中';
COMMENT ON COLUMN cranes.load_weight IS '当前负载重量（吨）';
COMMENT ON COLUMN cranes.speed IS '当前速度（米/秒）';
COMMENT ON COLUMN cranes.duty IS '职责：feeding-投料, stacking-堆料, turning-翻料, moving-移料';
COMMENT ON COLUMN cranes.is_enabled IS '是否启用';
COMMENT ON COLUMN cranes.emergency_stop IS '是否急停';
COMMENT ON COLUMN cranes.last_maintenance_date IS '最后维护日期';

-- 2.2 设备表
CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    device_no VARCHAR(50) UNIQUE NOT NULL COMMENT '设备编号',
    name VARCHAR(100) NOT NULL COMMENT '设备名称',
    type VARCHAR(50) NOT NULL COMMENT '设备类型：crane-行车, discharge_door-卸料门, transfer_door-转料门, camera-摄像头, sensor-传感器',
    model VARCHAR(100) COMMENT '设备型号',
    manufacturer VARCHAR(100) COMMENT '制造商',
    install_date DATE COMMENT '安装日期',
    location VARCHAR(100) COMMENT '安装位置',
    status VARCHAR(20) DEFAULT 'normal' COMMENT '状态：normal-正常, fault-故障, maintenance-维护中',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    port INTEGER COMMENT '端口号',
    config JSONB COMMENT '配置信息（JSON格式）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
);

COMMENT ON TABLE devices IS '设备表';
COMMENT ON COLUMN devices.id IS '主键ID';
COMMENT ON COLUMN devices.device_no IS '设备编号';
COMMENT ON COLUMN devices.name IS '设备名称';
COMMENT ON COLUMN devices.type IS '设备类型';
COMMENT ON COLUMN devices.model IS '设备型号';
COMMENT ON COLUMN devices.manufacturer IS '制造商';
COMMENT ON COLUMN devices.install_date IS '安装日期';
COMMENT ON COLUMN devices.location IS '安装位置';
COMMENT ON COLUMN devices.status IS '状态：normal-正常, fault-故障, maintenance-维护中';
COMMENT ON COLUMN devices.ip_address IS 'IP地址';
COMMENT ON COLUMN devices.port IS '端口号';
COMMENT ON COLUMN devices.config IS '配置信息（JSON格式）';

-- 2.3 卸料门表
CREATE TABLE discharge_doors (
    id SERIAL PRIMARY KEY,
    door_no VARCHAR(20) UNIQUE NOT NULL COMMENT '卸料门编号',
    name VARCHAR(50) NOT NULL COMMENT '卸料门名称',
    status VARCHAR(20) DEFAULT 'closed' COMMENT '状态：open-打开, closed-关闭, opening-正在打开, closing-正在关闭',
    mode VARCHAR(20) DEFAULT 'auto' COMMENT '模式：auto-自动, manual-手动',
    area_id INTEGER COMMENT '关联区域ID',
    is_enabled BOOLEAN DEFAULT true COMMENT '是否启用',
    last_operation_at TIMESTAMP COMMENT '最后操作时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
);

COMMENT ON TABLE discharge_doors IS '卸料门表';
COMMENT ON COLUMN discharge_doors.id IS '主键ID';
COMMENT ON COLUMN discharge_doors.door_no IS '卸料门编号';
COMMENT ON COLUMN discharge_doors.name IS '卸料门名称';
COMMENT ON COLUMN discharge_doors.status IS '状态：open-打开, closed-关闭, opening-正在打开, closing-正在关闭';
COMMENT ON COLUMN discharge_doors.mode IS '模式：auto-自动, manual-手动';
COMMENT ON COLUMN discharge_doors.area_id IS '关联区域ID';
COMMENT ON COLUMN discharge_doors.is_enabled IS '是否启用';
COMMENT ON COLUMN discharge_doors.last_operation_at IS '最后操作时间';

-- =====================================================
-- 3. 区域相关表
-- =====================================================

-- 3.1 区域表
CREATE TABLE areas (
    id SERIAL PRIMARY KEY,
    area_no VARCHAR(20) UNIQUE NOT NULL COMMENT '区域编号',
    name VARCHAR(50) NOT NULL COMMENT '区域名称',
    type VARCHAR(20) NOT NULL COMMENT '区域类型：stacking-堆料区, feeding-投料区, transfer-转料区',
    coordinate_x DECIMAL(10, 2) COMMENT 'X坐标',
    coordinate_y DECIMAL(10, 2) COMMENT 'Y坐标',
    width DECIMAL(10, 2) COMMENT '宽度（米）',
    height DECIMAL(10, 2) COMMENT '长度（米）',
    depth DECIMAL(10, 2) COMMENT '深度（米）',
    current_height DECIMAL(10, 2) COMMENT '当前堆料高度（米）',
    max_height DECIMAL(10, 2) COMMENT '最大堆料高度（米）',
    cover_status VARCHAR(20) DEFAULT 'closed' COMMENT '盖板状态：open-打开, closed-关闭',
    draining_status VARCHAR(20) DEFAULT 'closed' COMMENT '沥水状态：open-开启, closed-关闭',
    cleaning_status VARCHAR(20) DEFAULT 'closed' COMMENT '清底状态：open-开启, closed-关闭',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
);

COMMENT ON TABLE areas IS '区域表';
COMMENT ON COLUMN areas.id IS '主键ID';
COMMENT ON COLUMN areas.area_no IS '区域编号';
COMMENT ON COLUMN areas.name IS '区域名称';
COMMENT ON COLUMN areas.type IS '区域类型：stacking-堆料区, feeding-投料区, transfer-转料区';
COMMENT ON COLUMN areas.coordinate_x IS 'X坐标';
COMMENT ON COLUMN areas.coordinate_y IS 'Y坐标';
COMMENT ON COLUMN areas.width IS '宽度（米）';
COMMENT ON COLUMN areas.height IS '长度（米）';
COMMENT ON COLUMN areas.depth IS '深度（米）';
COMMENT ON COLUMN areas.current_height IS '当前堆料高度（米）';
COMMENT ON COLUMN areas.max_height IS '最大堆料高度（米）';
COMMENT ON COLUMN areas.cover_status IS '盖板状态：open-打开, closed-关闭';
COMMENT ON COLUMN areas.draining_status IS '沥水状态：open-开启, closed-关闭';
COMMENT ON COLUMN areas.cleaning_status IS '清底状态：open-开启, closed-关闭';

-- 3.2 区域关系表
CREATE TABLE area_relations (
    id SERIAL PRIMARY KEY,
    area_id INTEGER REFERENCES areas(id) COMMENT '区域ID',
    discharge_door_id INTEGER REFERENCES discharge_doors(id) COMMENT '卸料门ID',
    transfer_door_id INTEGER REFERENCES devices(id) COMMENT '转料门ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
);

COMMENT ON TABLE area_relations IS '区域关系表';
COMMENT ON COLUMN area_relations.id IS '主键ID';
COMMENT ON COLUMN area_relations.area_id IS '区域ID';
COMMENT ON COLUMN area_relations.discharge_door_id IS '卸料门ID';
COMMENT ON COLUMN area_relations.transfer_door_id IS '转料门ID';

-- =====================================================
-- 4. 告警相关表
-- =====================================================

-- 4.1 行车告警表
CREATE TABLE crane_alarms (
    id SERIAL PRIMARY KEY,
    crane_id INTEGER REFERENCES cranes(id) COMMENT '行车ID',
    alarm_type VARCHAR(50) NOT NULL COMMENT '告警类型：overload-过载, position_error-位置偏差, grab_slip-遛钩',
    alarm_level VARCHAR(20) NOT NULL COMMENT '告警级别：critical-严重, major-主要, minor-次要',
    message TEXT COMMENT '告警消息',
    position_x DECIMAL(10, 2) COMMENT '告警位置X坐标',
    position_y DECIMAL(10, 2) COMMENT '告警位置Y坐标',
    sensor_data JSONB COMMENT '传感器数据（JSON格式）',
    status VARCHAR(20) DEFAULT 'active' COMMENT '状态：active-活跃, acknowledged-已确认, resolved-已解决',
    acknowledged_by INTEGER REFERENCES users(id) COMMENT '确认人ID',
    acknowledged_at TIMESTAMP COMMENT '确认时间',
    resolved_at TIMESTAMP COMMENT '解决时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
);

COMMENT ON TABLE crane_alarms IS '行车告警表';
COMMENT ON COLUMN crane_alarms.id IS '主键ID';
COMMENT ON COLUMN crane_alarms.crane_id IS '行车ID';
COMMENT ON COLUMN crane_alarms.alarm_type IS '告警类型：overload-过载, position_error-位置偏差, grab_slip-遛钩';
COMMENT ON COLUMN crane_alarms.alarm_level IS '告警级别：critical-严重, major-主要, minor-次要';
COMMENT ON COLUMN crane_alarms.message IS '告警消息';
COMMENT ON COLUMN crane_alarms.position_x IS '告警位置X坐标';
COMMENT ON COLUMN crane_alarms.position_y IS '告警位置Y坐标';
COMMENT ON COLUMN crane_alarms.sensor_data IS '传感器数据（JSON格式）';
COMMENT ON COLUMN crane_alarms.status IS '状态：active-活跃, acknowledged-已确认, resolved-已解决';
COMMENT ON COLUMN crane_alarms.acknowledged_by IS '确认人ID';
COMMENT ON COLUMN crane_alarms.acknowledged_at IS '确认时间';
COMMENT ON COLUMN crane_alarms.resolved_at IS '解决时间';

-- 4.2 大物告警表
CREATE TABLE large_object_alarms (
    id SERIAL PRIMARY KEY,
    camera_id INTEGER REFERENCES devices(id) COMMENT '摄像头ID',
    image_url TEXT COMMENT '图片URL',
    detected_objects JSONB COMMENT '检测到的物体（JSON格式）',
    confidence DECIMAL(5, 4) COMMENT '置信度（0-1）',
    status VARCHAR(20) DEFAULT 'active' COMMENT '状态：active-活跃, acknowledged-已确认',
    acknowledged_by INTEGER REFERENCES users(id) COMMENT '确认人ID',
    acknowledged_at TIMESTAMP COMMENT '确认时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
);

COMMENT ON TABLE large_object_alarms IS '大物告警表';
COMMENT ON COLUMN large_object_alarms.id IS '主键ID';
COMMENT ON COLUMN large_object_alarms.camera_id IS '摄像头ID';
COMMENT ON COLUMN large_object_alarms.image_url IS '图片URL';
COMMENT ON COLUMN large_object_alarms.detected_objects IS '检测到的物体（JSON格式）';
COMMENT ON COLUMN large_object_alarms.confidence IS '置信度（0-1）';
COMMENT ON COLUMN large_object_alarms.status IS '状态：active-活跃, acknowledged-已确认';
COMMENT ON COLUMN large_object_alarms.acknowledged_by IS '确认人ID';
COMMENT ON COLUMN large_object_alarms.acknowledged_at IS '确认时间';

-- 4.3 设备告警表
CREATE TABLE device_alarms (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(id) COMMENT '设备ID',
    alarm_type VARCHAR(50) NOT NULL COMMENT '告警类型',
    alarm_level VARCHAR(20) NOT NULL COMMENT '告警级别：critical-严重, major-主要, minor-次要',
    message TEXT COMMENT '告警消息',
    status VARCHAR(20) DEFAULT 'active' COMMENT '状态：active-活跃, acknowledged-已确认, resolved-已解决',
    acknowledged_by INTEGER REFERENCES users(id) COMMENT '确认人ID',
    acknowledged_at TIMESTAMP COMMENT '确认时间',
    resolved_at TIMESTAMP COMMENT '解决时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
);

COMMENT ON TABLE device_alarms IS '设备告警表';
COMMENT ON COLUMN device_alarms.id IS '主键ID';
COMMENT ON COLUMN device_alarms.device_id IS '设备ID';
COMMENT ON COLUMN device_alarms.alarm_type IS '告警类型';
COMMENT ON COLUMN device_alarms.alarm_level IS '告警级别：critical-严重, major-主要, minor-次要';
COMMENT ON COLUMN device_alarms.message IS '告警消息';
COMMENT ON COLUMN device_alarms.status IS '状态：active-活跃, acknowledged-已确认, resolved-已解决';
COMMENT ON COLUMN device_alarms.acknowledged_by IS '确认人ID';
COMMENT ON COLUMN device_alarms.acknowledged_at IS '确认时间';
COMMENT ON COLUMN device_alarms.resolved_at IS '解决时间';

-- =====================================================
-- 5. 任务相关表
-- =====================================================

-- 5.1 任务表
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    task_no VARCHAR(50) UNIQUE NOT NULL COMMENT '任务编号',
    crane_id INTEGER REFERENCES cranes(id) COMMENT '行车ID',
    task_type VARCHAR(50) NOT NULL COMMENT '任务类型：feeding-投料, stacking-堆料, turning-翻料, moving-移料',
    source_area_id INTEGER REFERENCES areas(id) COMMENT '源区域ID',
    target_area_id INTEGER REFERENCES areas(id) COMMENT '目标区域ID',
    status VARCHAR(20) DEFAULT 'pending' COMMENT '状态：pending-待执行, running-执行中, completed-已完成, cancelled-已取消',
    priority INTEGER DEFAULT 0 COMMENT '优先级（数字越大优先级越高）',
    weight DECIMAL(10, 2) COMMENT '重量（吨）',
    start_time TIMESTAMP COMMENT '开始时间',
    end_time TIMESTAMP COMMENT '结束时间',
    duration INTEGER COMMENT '持续时长（秒）',
    created_by INTEGER REFERENCES users(id) COMMENT '创建人ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
);

COMMENT ON TABLE tasks IS '任务表';
COMMENT ON COLUMN tasks.id IS '主键ID';
COMMENT ON COLUMN tasks.task_no IS '任务编号';
COMMENT ON COLUMN tasks.crane_id IS '行车ID';
COMMENT ON COLUMN tasks.task_type IS '任务类型：feeding-投料, stacking-堆料, turning-翻料, moving-移料';
COMMENT ON COLUMN tasks.source_area_id IS '源区域ID';
COMMENT ON COLUMN tasks.target_area_id IS '目标区域ID';
COMMENT ON COLUMN tasks.status IS '状态：pending-待执行, running-执行中, completed-已完成, cancelled-已取消';
COMMENT ON COLUMN tasks.priority IS '优先级（数字越大优先级越高）';
COMMENT ON COLUMN tasks.weight IS '重量（吨）';
COMMENT ON COLUMN tasks.start_time IS '开始时间';
COMMENT ON COLUMN tasks.end_time IS '结束时间';
COMMENT ON COLUMN tasks.duration IS '持续时长（秒）';
COMMENT ON COLUMN tasks.created_by IS '创建人ID';

-- 5.2 调度指令表
CREATE TABLE dispatch_instructions (
    id SERIAL PRIMARY KEY,
    instruction_no VARCHAR(50) UNIQUE NOT NULL COMMENT '指令编号',
    task_id INTEGER REFERENCES tasks(id) COMMENT '任务ID',
    crane_id INTEGER REFERENCES cranes(id) COMMENT '行车ID',
    instruction_type VARCHAR(50) NOT NULL COMMENT '指令类型',
    content TEXT COMMENT '指令内容',
    status VARCHAR(20) DEFAULT 'pending' COMMENT '状态：pending-待发送, sent-已发送, executed-已执行, failed-失败',
    sent_at TIMESTAMP COMMENT '发送时间',
    executed_at TIMESTAMP COMMENT '执行时间',
    created_by INTEGER REFERENCES users(id) COMMENT '创建人ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
);

COMMENT ON TABLE dispatch_instructions IS '调度指令表';
COMMENT ON COLUMN dispatch_instructions.id IS '主键ID';
COMMENT ON COLUMN dispatch_instructions.instruction_no IS '指令编号';
COMMENT ON COLUMN dispatch_instructions.task_id IS '任务ID';
COMMENT ON COLUMN dispatch_instructions.crane_id IS '行车ID';
COMMENT ON COLUMN dispatch_instructions.instruction_type IS '指令类型';
COMMENT ON COLUMN dispatch_instructions.content IS '指令内容';
COMMENT ON COLUMN dispatch_instructions.status IS '状态：pending-待发送, sent-已发送, executed-已执行, failed-失败';
COMMENT ON COLUMN dispatch_instructions.sent_at IS '发送时间';
COMMENT ON COLUMN dispatch_instructions.executed_at IS '执行时间';
COMMENT ON COLUMN dispatch_instructions.created_by IS '创建人ID';

-- =====================================================
-- 6. 数据相关表
-- =====================================================

-- 6.1 发酵数据表
CREATE TABLE fermentation_data (
    id SERIAL PRIMARY KEY,
    area_id INTEGER REFERENCES areas(id) COMMENT '区域ID',
    temperature DECIMAL(10, 2) COMMENT '温度（℃）',
    humidity DECIMAL(10, 2) COMMENT '湿度（%）',
    methane_concentration DECIMAL(10, 2) COMMENT '甲烷浓度（%）',
    ph_value DECIMAL(5, 2) COMMENT 'PH值',
    oxygen_concentration DECIMAL(10, 2) COMMENT '氧气浓度（%）',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间'
);

COMMENT ON TABLE fermentation_data IS '发酵数据表';
COMMENT ON COLUMN fermentation_data.id IS '主键ID';
COMMENT ON COLUMN fermentation_data.area_id IS '区域ID';
COMMENT ON COLUMN fermentation_data.temperature IS '温度（℃）';
COMMENT ON COLUMN fermentation_data.humidity IS '湿度（%）';
COMMENT ON COLUMN fermentation_data.methane_concentration IS '甲烷浓度（%）';
COMMENT ON COLUMN fermentation_data.ph_value IS 'PH值';
COMMENT ON COLUMN fermentation_data.oxygen_concentration IS '氧气浓度（%）';
COMMENT ON COLUMN fermentation_data.recorded_at IS '记录时间';

-- 6.2 库存数据表
CREATE TABLE inventory_data (
    id SERIAL PRIMARY KEY,
    area_id INTEGER REFERENCES areas(id) COMMENT '区域ID',
    total_weight DECIMAL(10, 2) COMMENT '总重量（吨）',
    garbage_type VARCHAR(50) COMMENT '垃圾类型',
    stacking_height DECIMAL(10, 2) COMMENT '堆料高度（米）',
    density DECIMAL(10, 4) COMMENT '密度（吨/立方米）',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间'
);

COMMENT ON TABLE inventory_data IS '库存数据表';
COMMENT ON COLUMN inventory_data.id IS '主键ID';
COMMENT ON COLUMN inventory_data.area_id IS '区域ID';
COMMENT ON COLUMN inventory_data.total_weight IS '总重量（吨）';
COMMENT ON COLUMN inventory_data.garbage_type IS '垃圾类型';
COMMENT ON COLUMN inventory_data.stacking_height IS '堆料高度（米）';
COMMENT ON COLUMN inventory_data.density IS '密度（吨/立方米）';
COMMENT ON COLUMN inventory_data.recorded_at IS '记录时间';

-- =====================================================
-- 7. 车辆相关表
-- =====================================================

-- 7.1 车辆记录表
CREATE TABLE vehicle_records (
    id SERIAL PRIMARY KEY,
    vehicle_no VARCHAR(20) NOT NULL COMMENT '车牌号',
    vehicle_type VARCHAR(50) COMMENT '车辆类型',
    driver_name VARCHAR(50) COMMENT '驾驶员姓名',
    record_type VARCHAR(20) NOT NULL COMMENT '记录类型：discharge-卸料, enter-进场, exit-出场, transport-运料',
    material_type VARCHAR(50) COMMENT '物料类型',
    weight DECIMAL(10, 2) COMMENT '重量（吨）',
    area_id INTEGER REFERENCES areas(id) COMMENT '区域ID',
    gate_no VARCHAR(20) COMMENT '门号',
    enter_time TIMESTAMP COMMENT '进场时间',
    exit_time TIMESTAMP COMMENT '出场时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
);

COMMENT ON TABLE vehicle_records IS '车辆记录表';
COMMENT ON COLUMN vehicle_records.id IS '主键ID';
COMMENT ON COLUMN vehicle_records.vehicle_no IS '车牌号';
COMMENT ON COLUMN vehicle_records.vehicle_type IS '车辆类型';
COMMENT ON COLUMN vehicle_records.driver_name IS '驾驶员姓名';
COMMENT ON COLUMN vehicle_records.record_type IS '记录类型：discharge-卸料, enter-进场, exit-出场, transport-运料';
COMMENT ON COLUMN vehicle_records.material_type IS '物料类型';
COMMENT ON COLUMN vehicle_records.weight IS '重量（吨）';
COMMENT ON COLUMN vehicle_records.area_id IS '区域ID';
COMMENT ON COLUMN vehicle_records.gate_no IS '门号';
COMMENT ON COLUMN vehicle_records.enter_time IS '进场时间';
COMMENT ON COLUMN vehicle_records.exit_time IS '出场时间';

-- =====================================================
-- 8. 系统配置表
-- =====================================================

-- 8.1 系统参数表
CREATE TABLE system_parameters (
    id SERIAL PRIMARY KEY,
    param_key VARCHAR(100) UNIQUE NOT NULL COMMENT '参数键',
    param_value TEXT COMMENT '参数值',
    param_type VARCHAR(20) COMMENT '参数类型：string, number, boolean, json',
    description TEXT COMMENT '参数描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
);

COMMENT ON TABLE system_parameters IS '系统参数表';
COMMENT ON COLUMN system_parameters.id IS '主键ID';
COMMENT ON COLUMN system_parameters.param_key IS '参数键';
COMMENT ON COLUMN system_parameters.param_value IS '参数值';
COMMENT ON COLUMN system_parameters.param_type IS '参数类型：string, number, boolean, json';
COMMENT ON COLUMN system_parameters.description IS '参数描述';

-- 8.2 医废模式记录表
CREATE TABLE medical_waste_mode_records (
    id SERIAL PRIMARY KEY,
    mode_status VARCHAR(20) NOT NULL COMMENT '模式状态：on-开启, off-关闭',
    operated_by INTEGER REFERENCES users(id) COMMENT '操作人ID',
    operated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间'
);

COMMENT ON TABLE medical_waste_mode_records IS '医废模式记录表';
COMMENT ON COLUMN medical_waste_mode_records.id IS '主键ID';
COMMENT ON COLUMN medical_waste_mode_records.mode_status IS '模式状态：on-开启, off-关闭';
COMMENT ON COLUMN medical_waste_mode_records.operated_by IS '操作人ID';
COMMENT ON COLUMN medical_waste_mode_records.operated_at IS '操作时间';

-- =====================================================
-- 9. AI 相关表
-- =====================================================

-- 9.1 AI 分析记录表
CREATE TABLE ai_analysis_records (
    id SERIAL PRIMARY KEY,
    analysis_type VARCHAR(50) NOT NULL COMMENT '分析类型：fermentation-发酵分析, alarm_diagnosis-告警诊断, schedule_optimization-调度优化',
    input_data JSONB COMMENT '输入数据（JSON格式）',
    output_data JSONB COMMENT '输出数据（JSON格式）',
    model_name VARCHAR(100) COMMENT '模型名称',
    tokens_used INTEGER COMMENT '使用的token数量',
    cost DECIMAL(10, 4) COMMENT '费用（元）',
    created_by INTEGER REFERENCES users(id) COMMENT '创建人ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
);

COMMENT ON TABLE ai_analysis_records IS 'AI分析记录表';
COMMENT ON COLUMN ai_analysis_records.id IS '主键ID';
COMMENT ON COLUMN ai_analysis_records.analysis_type IS '分析类型：fermentation-发酵分析, alarm_diagnosis-告警诊断, schedule_optimization-调度优化';
COMMENT ON COLUMN ai_analysis_records.input_data IS '输入数据（JSON格式）';
COMMENT ON COLUMN ai_analysis_records.output_data IS '输出数据（JSON格式）';
COMMENT ON COLUMN ai_analysis_records.model_name IS '模型名称';
COMMENT ON COLUMN ai_analysis_records.tokens_used IS '使用的token数量';
COMMENT ON COLUMN ai_analysis_records.cost IS '费用（元）';
COMMENT ON COLUMN ai_analysis_records.created_by IS '创建人ID';

-- =====================================================
-- 10. 创建索引
-- =====================================================

-- 用户表索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_status ON users(status);

-- 操作日志表索引
CREATE INDEX idx_operation_logs_user_id ON operation_logs(user_id);
CREATE INDEX idx_operation_logs_action ON operation_logs(action);
CREATE INDEX idx_operation_logs_module ON operation_logs(module);
CREATE INDEX idx_operation_logs_created_at ON operation_logs(created_at);

-- 系统日志表索引
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_module ON system_logs(module);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);

-- 行车表索引
CREATE INDEX idx_cranes_crane_no ON cranes(crane_no);
CREATE INDEX idx_cranes_status ON cranes(status);
CREATE INDEX idx_cranes_mode ON cranes(mode);

-- 设备表索引
CREATE INDEX idx_devices_device_no ON devices(device_no);
CREATE INDEX idx_devices_type ON devices(type);
CREATE INDEX idx_devices_status ON devices(status);

-- 卸料门表索引
CREATE INDEX idx_discharge_doors_door_no ON discharge_doors(door_no);
CREATE INDEX idx_discharge_doors_status ON discharge_doors(status);
CREATE INDEX idx_discharge_doors_area_id ON discharge_doors(area_id);

-- 区域表索引
CREATE INDEX idx_areas_area_no ON areas(area_no);
CREATE INDEX idx_areas_type ON areas(type);

-- 行车告警表索引
CREATE INDEX idx_crane_alarms_crane_id ON crane_alarms(crane_id);
CREATE INDEX idx_crane_alarms_alarm_type ON crane_alarms(alarm_type);
CREATE INDEX idx_crane_alarms_status ON crane_alarms(status);
CREATE INDEX idx_crane_alarms_created_at ON crane_alarms(created_at);

-- 大物告警表索引
CREATE INDEX idx_large_object_alarms_camera_id ON large_object_alarms(camera_id);
CREATE INDEX idx_large_object_alarms_status ON large_object_alarms(status);
CREATE INDEX idx_large_object_alarms_created_at ON large_object_alarms(created_at);

-- 设备告警表索引
CREATE INDEX idx_device_alarms_device_id ON device_alarms(device_id);
CREATE INDEX idx_device_alarms_status ON device_alarms(status);
CREATE INDEX idx_device_alarms_created_at ON device_alarms(created_at);

-- 任务表索引
CREATE INDEX idx_tasks_task_no ON tasks(task_no);
CREATE INDEX idx_tasks_crane_id ON tasks(crane_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_task_type ON tasks(task_type);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

-- 调度指令表索引
CREATE INDEX idx_dispatch_instructions_instruction_no ON dispatch_instructions(instruction_no);
CREATE INDEX idx_dispatch_instructions_task_id ON dispatch_instructions(task_id);
CREATE INDEX idx_dispatch_instructions_status ON dispatch_instructions(status);

-- 发酵数据表索引
CREATE INDEX idx_fermentation_data_area_id ON fermentation_data(area_id);
CREATE INDEX idx_fermentation_data_recorded_at ON fermentation_data(recorded_at);

-- 库存数据表索引
CREATE INDEX idx_inventory_data_area_id ON inventory_data(area_id);
CREATE INDEX idx_inventory_data_recorded_at ON inventory_data(recorded_at);

-- 车辆记录表索引
CREATE INDEX idx_vehicle_records_vehicle_no ON vehicle_records(vehicle_no);
CREATE INDEX idx_vehicle_records_record_type ON vehicle_records(record_type);
CREATE INDEX idx_vehicle_records_created_at ON vehicle_records(created_at);

-- 系统参数表索引
CREATE INDEX idx_system_parameters_param_key ON system_parameters(param_key);

-- AI 分析记录表索引
CREATE INDEX idx_ai_analysis_records_analysis_type ON ai_analysis_records(analysis_type);
CREATE INDEX idx_ai_analysis_records_created_at ON ai_analysis_records(created_at);

-- =====================================================
-- 数据库建表脚本结束
-- =====================================================
