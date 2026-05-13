<template>
  <div ref="dashboard_main" class="dashboard-container">
    <div class="dashboard-top">
      <div class="pre-screenfull">
        <svg-icon icon-class="screenfull" class="screenfull" @click="handleFullscreen" />
        <div v-if="operationShow" class="monitoring trend" @click="craneDutyDialogVisible = true">
          行车职责配置
        </div>
        <div v-if="operationShow" class="monitoring trend" style="left: 150px;" @click="handleOpenLarge">
          {{ parent.isOpenLarge ? '关闭' : '开启' }}大物告警
        </div>
        <!-- <el-button type="primary" @click="grabLoseControl = true">测试</el-button> -->
      </div>
      <div class="top-title">
        <span>垃圾储坑智能化管控系统</span>
      </div>
      <div class="top-info">
        <div class="time">{{ time }}</div>
        <div class="monitoring" @click="handleShowMonitoring">
          <svg-icon icon-class="3D" style="font-size: 22px; vertical-align: sub" />
          3D模型
        </div>
        <div class="monitoring trend" @click="resizeVisible = true">
          行车运行趋势图
        </div>
      </div>
    </div>
    <!-- <div v-if="isLarge" class="dashboard-center"> -->
    <div class="dashboard-center">
      <el-row type="flex" justify="space-around">
        <el-col :span="4">
          <div class="center-left">
            <dashboardLeft ref="dashboardLeftPage" />
          </div>
        </el-col>
        <el-col :span="15">
          <div class="center">
            <dashboardCenter />
          </div>
        </el-col>
        <el-col :span="4">
          <div class="center-right">
            <dashboardRight ref="dashboardRightPage" />
          </div>
        </el-col>
      </el-row>
    </div>
    <!-- 行车告警的 Notification 通知 -->
    <div v-if="showNotic" :class="['crane-alarm', {'show' : isNotic}]">
      <div class="alarm-icon">
        <svg-icon icon-class="warning" />
      </div>
      <div class="alarm-info">
        <div class="alarm-text">{{ craneInfo.craneNo && craneInfo.craneNo.slice(-1) }}号行车异常，请人工移动到准确位置后，再点击确认！</div>
        <div class="alarm-btn" @click="handleCheckCrane">确定</div>
      </div>
    </div>

    <!-- <div style="width: 100%; border: 1px solid;">
      <nativeTable :table-data="" :table-column="" :max-height="100">
      </nativeTable>
    </div> -->

    <el-dialog
      title="垃圾坑三维模型"
      :visible="dialogVisible"
      width="70%"
      class="pit-dialog"
      :modal="false"
      :destroy-on-close="true"
      @close="dialogVisible = false"
    >
      <pitMode />
    </el-dialog>
    <VueDragResize v-if="resizeVisible" drag-handle=".resize-close-top" :is-active="false" :w="1000" :h="600" content-class="drag-resize-box" @resizestop="handleResize">
      <div class="resize-close-top">
        <div class="resize-title">行车运行趋势图</div>
        <i class="el-icon-close resize-close" @click="resizeVisible = false" />
      </div>
      <craneTrend v-if="testVisible" ref="craneTrend" />
    </VueDragResize>
    <!-- <el-dialog
      ref="craneTrendDialog"
      title="行车趋势"
      :visible="craneTrendVisible"
      width="70%"
      custom-class="crane-trend-dialog"
      :modal="false"
      :destroy-on-close="true"
      :before-close="handleCraneTrendClose"
      :close-on-click-modal="false"
      :modal-append-to-body="false"
      :append-to-body="false"
      @close="craneTrendVisible = false"
    >
      <craneTrend />
    </el-dialog> -->
    <!-- 职责配置 -->
    <el-dialog
      title="行车职责配置"
      :visible="craneDutyDialogVisible"
      width="80%"
      :modal="false"
      @close="craneDutyDialogVisible = false"
    >
      <craneDutyConfig ref="craneDutyConfigRef" />
    </el-dialog>

    <!-- 告警 -->
    <el-dialog
      title="行车异常"
      :visible.sync="craneDialogVisible"
      width="30%"
      top="30vh"
      class="warn-dialog"
      :modal="false"
      @close="()=>{openCraneNotic()}"
    >
      <div class="warn-cont">
        <img class="warn-img" src="~@/assets/warning.png" alt="">
        <div class="warn-desc">
          <div>需要把行车移动至({{ craneInfo.positionX+ ', ' +craneInfo.positionY }})处</div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="()=>{openCraneNotic()}">确定</el-button>
      </span>
    </el-dialog>
    <!-- 行车告警 再次确认 -->
    <el-dialog
      title="行车位置校验"
      :visible.sync="craneReconfirmVisible"
      width="30%"
      top="30vh"
      :modal="false"
      @close="handleForceCheckCrane"
    >
      <div class="dia-cont">{{ craneMessage }}</div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="handleForceCheckCrane">{{ craneStatus ? '确定' : '确定已移动到指定位置' }}</el-button>
      </span>
    </el-dialog>

    <!-- 遛钩告警 -->
    <!-- <el-dialog
      title="遛钩告警"
      :visible.sync="grabLoseControl"
      width="30%"
      top="30vh"
      class="warn-dialog"
      :modal="false"
    >
      <div class="warn-cont">
        <img class="warn-img" src="~@/assets/warning.png" alt="">
        <div class="warn-desc" style="font-size: 36px;">
          <div>一号行车遛钩!</div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="grabLoseControl = false">确定</el-button>
      </span>
    </el-dialog> -->

    <!-- 设备操作设置 -->
    <div v-if="operationShow" class="operation" @mouseover="drawerVisible = true">状态设置</div>
    <el-drawer
      title="调度参数设置"
      size="20%"
      :visible.sync="drawerVisible"
      :modal="false"
      @open="handleDrawerOpen"
      @close="handleDrawerClose"
    >
      <div class="set-list">
        <div v-for="(item, idx) in setList" :key="item.type" class="set-item">
          <div v-if="item.type === 'allSet'" class="single-set">
            <el-divider content-position="left">{{ item.name }}</el-divider>
            <div class="set-status">当前状态: {{ filterSetStatus(currentStatus) }}</div>
            <el-button v-for="(btn, index) in item.list" :key="item.type + index" plain @click="handleStatusChange(btn.type)">{{ btn.name }}</el-button>
          </div>
          <div v-if="item.type === 'single'" class="single-set">
            <el-divider content-position="left">{{ item.name }}</el-divider>
            <div v-for="(single, index) in item.list" :key="single.craneNo" class="single-item">
              <div class="label">
                <span>{{ single.name + '行车' }}</span>
                <el-button type="danger" style="margin-left: 20px;" @click="handleCancelTask(single.craneNo)">取消任务</el-button>
              </div>
              <div class="content">
                <el-switch v-model="single.isAuto" active-value="1" inactive-value="2" active-text="自动" inactive-text="手动" active-color="#13ce66" inactive-color="#ff4949" @change="handleCraneAutoChange(single.craneNo, single.isAuto, index)" />
                <div class="crane-stop">
                  <el-switch v-model="single.isStart" active-value="1" inactive-value="2" active-text="启动" inactive-text="停止" active-color="#13ce66" inactive-color="#fda643" @change="handleCraneStartChange(single.craneNo, single.isStart, index)" />
                  <div v-if="single.emergencyStop" class="stop-tips">急停</div>
                </div>
                <div class="desc-item">
                  <div class="desc">是否启用:</div>
                  <el-switch v-model="single.isEnabled" active-value="1" inactive-value="0" active-color="#13ce66" inactive-color="#ff4949" @change="handleCraneChange(single.craneNo, single.isEnabled, index)" />
                </div>
              </div>
              <!-- <el-divider />
              <div class="content">
                <div style="font-size: 14px;">急停设置: </div>
                <el-radio-group v-model="single.isStart" @change="handleCraneStartChange(single.craneNo, single.isStart)">
                  <el-radio label="1">启动</el-radio>
                  <el-radio label="3">急停</el-radio>
                  <el-radio label="2">初始化清除任务</el-radio>
                </el-radio-group>
              </div>
              <el-divider /> -->
            </div>
          </div>
          <div v-if="item.type === 'DL'" class="single-set">
            <el-divider content-position="left">设置堆料和投料区域</el-divider>
            <div style="margin: 15px 0;">
              <span>堆料区:</span>
              <el-select v-model="currentDLAreaValue" size="mini" style="width: 75px; margin-left: 10px; margin-right: 10px;" placeholder="堆料">
                <el-option
                  v-for="xlm in areaSetOptions"
                  :key="xlm.value"
                  :label="xlm.label"
                  :value="xlm.value"
                />
              </el-select>
              <span>投料区:</span>
              <el-select v-model="currentTLAreaValue" size="mini" style="width: 75px; margin-left: 10px; margin-right: 10px;" placeholder="投料">
                <el-option
                  v-for="xlm in areaSetOptions2"
                  :key="xlm.value"
                  :label="xlm.label"
                  :value="xlm.value"
                />
              </el-select>
              <el-button type="primary" @click="handleSetDLTLArea(currentDLAreaValue, currentTLAreaValue)">设置</el-button>
            </div>
            <div v-if="item.list.length">
              <el-divider content-position="left">{{ item.name }}</el-divider>
              <div v-for="(tagItem, tagItemIndex) in item.list" :key="tagItem.areaNo">
                <div class="single-item" style="display: flex; align-items: center;">
                  <div style="margin-right: 15px; font-weight: 700;">主区域: {{ tagItem.areaNo.slice(-2) }}</div>
                  <!-- <el-button type="primary" @click="handleChangeDlArea">切换区域</el-button> -->
                  <span>副区域:</span>
                  <el-select v-model="tagItem.areaValue" clearable size="mini" style="width: 60px; margin-left: 10px; margin-right: 10px;">
                    <el-option
                      v-for="xlm in areaOptions"
                      :key="xlm.value"
                      :label="xlm.label"
                      :value="xlm.value"
                    />
                  </el-select>
                  <el-button type="primary" @click="handleUpdateDlArea(tagItem.id, tagItem.areaValue)">设置</el-button>
                  <el-popconfirm
                    title="是否删除？"
                    @onConfirm="handleUpdateDlArea(tagItem.id, '')"
                  >
                    <el-tag
                      slot="reference"
                      type="danger"
                      style="margin-left: 10px;cursor: pointer;"
                    >
                      删除
                    </el-tag>
                  </el-popconfirm>
                </div>
                <!-- <div class="single-item" style="display: flex; align-items: center;">
                <div style="margin-right: 15px;">副区域: {{ tagItem.dlAreaNo.slice(-2) }}</div>
                <el-popconfirm
                  title="是否删除？"
                  @onConfirm="handleUpdateDlArea(tagItem.id, '')"
                >
                  <el-tag
                    v-if="tagItem.type === 'area'"
                    slot="reference"
                    type="danger"
                    style="margin-left: 10px;cursor: pointer;"
                  >
                    删除副区域
                  </el-tag>
                </el-popconfirm>
              </div> -->

                <div class="tag-item">
                  <div style="display: flex; align-items: center; margin: 10px 0;">
                    <span>卸料门： </span>
                    <div>
                      <el-popconfirm
                        v-for="tag in tagItem.children"
                        :key="tag.id"
                        title="是否删除？"
                        @onConfirm="handleTagClose(tag, tagItemIndex)"
                      >
                        <el-tag
                          slot="reference"
                          style="margin-right: 10px;cursor: pointer;"
                        >
                          {{ tag.doorNo.slice(-2) }}
                        </el-tag>
                      </el-popconfirm>
                    </div>
                  </div>
                  <div>
                    <el-select v-model="tagItem.value" clearable size="mini" style="width: 110px; margin-right: 10px;" placeholder="选择卸料门">
                      <el-option
                        v-for="xlm in xlmOrginOptions"
                        :key="xlm.value"
                        :label="xlm.label"
                        :value="xlm.value"
                      />
                    </el-select>
                    <el-button type="primary" @click="handleAddTag(tagItem)">添加卸料门</el-button>
                  </div>
                </div>
              <!-- <el-divider v-if="tagItemIndex !== (item.list.length-1)" class="item-divider" /> -->
              </div>
            </div>

          </div>
          <div v-if="item.type === 'areaSet'" class="single-set">
            <div v-if="item.list.length">
              <el-divider content-position="left">{{ item.name }}</el-divider>
              <div v-for="area in item.list" :key="area.id" style="margin-bottom: 20px;">
                <!-- <el-button type="primary" @click="handleChangeArea">切换投料区</el-button> -->

                <span style="margin-right: 10px;">投料区: {{ area.areaName }}</span>

                <span>卸料门: </span>
                <el-select v-model="area.zlDoorNo" clearable size="mini" style="width: 70px; margin-left: 5px; margin-right: 5px;" placeholder="转料">
                  <el-option
                    v-for="xlm in xlmOrginOptions"
                    :key="xlm.value"
                    :label="xlm.label"
                    :value="xlm.value"
                  />
                </el-select>
                <el-switch v-model="area.zlStatus" active-value="XYZL" inactive-value="BXYZL" active-text="开启" inactive-text="关闭" active-color="#13ce66" inactive-color="#ff4949" @change="handleZLSet(area.zlStatus, area.areaNo, area.zlDoorNo)" />

              </div>
            </div>

            <el-divider content-position="left">揭盖区域设置</el-divider>
            <div style="margin: 15px 0;">
              <span>选择区域:</span>
              <el-select v-model="currentAreaValue" size="mini" style="width: 75px; margin-left: 10px; margin-right: 20px;" placeholder="当前">
                <el-option
                  v-for="xlm in areaOptions"
                  :key="xlm.value"
                  :label="xlm.label"
                  :value="xlm.value"
                />
              </el-select>
              <span>揭盖区:</span>
              <el-select v-model="currentJGAreaValue" size="mini" style="width: 75px; margin-left: 10px; margin-right: 10px;" placeholder="揭盖">
                <el-option
                  v-for="xlm in areaJGOptions"
                  :key="xlm.value"
                  :label="xlm.label"
                  :value="xlm.value"
                />
              </el-select>
              <!-- <el-button type="primary" @click="handleUpdateJGArea(currentAreaValue, currentJGAreaValue)">开启</el-button> -->
              <el-switch v-model="currentJGValue" style="margin-top: 10px;" active-value="1" inactive-value="0" active-text="开启" inactive-text="关闭" active-color="#13ce66" inactive-color="#ff4949" @change="handleUpdateJGArea" />
            </div>
            <el-divider content-position="left">设置区域沥水清底</el-divider>
            <div style="margin: 15px 0;">
              <div>
                <span>沥水:</span>
                <el-select v-model="currentLSAreaValue" clearable size="mini" style="width: 80px; margin-left: 10px; margin-right: 10px;" placeholder="区域">
                  <el-option
                    v-for="xlm in areaOptions"
                    :key="xlm.value"
                    :label="xlm.label"
                    :value="xlm.value"
                  />
                </el-select>
                <el-button type="primary" @click="handleSetLSArea('open')">开启</el-button>
                <el-button type="primary" @click="handleSetLSArea('close')">关闭</el-button>
              </div>
              <div style="margin-top: 10px;">
                <span>清底:</span>
                <el-select v-model="currentQDAreaValue" clearable size="mini" style="width: 80px; margin-left: 10px; margin-right: 10px;" placeholder="当前">
                  <el-option
                    v-for="xlm in areaOptions"
                    :key="xlm.value"
                    :label="xlm.label"
                    :value="xlm.value"
                  />
                </el-select>
                <el-select v-model="qDAreaValue" clearable size="mini" style="width: 80px; margin-left: 10px; margin-right: 10px;" placeholder="清底">
                  <el-option
                    v-for="xlm in areaOptions"
                    :key="xlm.value"
                    :label="xlm.label"
                    :value="xlm.value"
                  />
                </el-select>
                <el-button type="primary" @click="handleSetQDArea('open')">开启</el-button>
                <el-button type="primary" @click="handleSetQDArea('close')">关闭</el-button>
              </div>
            </div>
          </div>
          <div v-if="idx === 1">
            <el-divider content-position="left">卸料门手动/自动设置</el-divider>
            <div class="xlm-set">
              <span style="margin-right: 10px;">当前卸料门操作状态:</span>
              <el-switch v-model="xlmStatus" :active-value="1" :inactive-value="0" active-text="自动" inactive-text="手动" active-color="#13ce66" inactive-color="#ff4949" @change="handleChangeXlmStatus" />
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import SvgIcon from '@/components/SvgIcon'
import screenfull from 'screenfull'
import dayjs from 'dayjs'
import dashboardLeft from './dashboardLeft.vue'
import dashboardCenter from './dashboardCenter.vue'
import dashboardRight from './dashboardRight.vue'
import pitMode from './component/modePage'
import { ackCranePlace, handleCraneAlarm, findCraneAlarmList, readDriveData } from '@/api/disCrane'
import { autoModel, artificialModel, normalStop, reset, getOperationStatus, startOrStopCrane, selectAllCraneStatus, updateCraneStatus, restoreSingleCrane, emergencyStopSingleCrane, selectAllCranePauseStatus, areaStatusToggle, toggleTlArea, cancelTaskByCraneNo, openJg, closeJg, updateAreaStatus, openZl, closeZl, openLs, closeLs, openQd, closeQd } from '@/api/jeecg'
import craneTrend from './component/trend.vue'
import { findDlPortList, addDlPort, delDlPort, disAreaInfo, updateArea } from '@/api/pitArea'
import VueDragResize from 'vue-drag-resize'
import craneDutyConfig from './component/craneDutyConfig.vue'
import { getAutomaticStatus, openAutomatic } from '@/api/xlm'

export default {
  name: 'Dashboard',
  components: { SvgIcon, dashboardLeft, dashboardCenter, dashboardRight, pitMode, craneTrend, VueDragResize, craneDutyConfig },
  inject: ['parent'],
  data() {
    return {
      time: '',
      dialogVisible: false,
      craneDialogVisible: false,
      craneInfo: {}, // 告警时的弹窗信息
      cranInfoList: [], // 获得具体的id信息 使数据可删除
      noticList: [], // notify列表 操控notic的关闭(找不到id ↑)
      craneMessage: '', // 行车告警 确定后 的提示信息
      craneStatus: true, // 行车告警 确定后 是否符合
      currentCraneIndex: null, // 多个notice时做区别
      craneReconfirmVisible: false,
      drawerVisible: false,
      setList: [
        {
          type: 'allSet',
          name: '所有行车设置',
          list: [
            {
              name: '启动',
              type: autoModel
            },
            {
              name: '取消任务',
              type: artificialModel
            },
            {
              name: '停止',
              type: normalStop
            },
            // {
            //   name: '急停',
            //   type: emergencyStop
            // },
            {
              name: '复位',
              type: reset
            }
          ]
        },
        {
          type: 'single',
          name: '单个行车设置',
          list: [
            {
              name: '1号',
              craneNo: 'crane01',
              isEnabled: '0',
              isAuto: '1',
              isStart: '3',
              emergencyStop: true
            },
            {
              name: '2号',
              craneNo: 'crane02',
              isEnabled: '0',
              isAuto: '1',
              isStart: '3',
              emergencyStop: true
            },
            {
              name: '3号',
              craneNo: 'crane03',
              isEnabled: '0',
              isAuto: '1',
              isStart: '3',
              emergencyStop: true
            }
          ]
        },
        {
          type: 'DL',
          name: '堆料区域设置',
          list: []
        },
        {
          type: 'areaSet',
          name: '投料区转料设置',
          list: []
        }
      ],
      currentStatus: '',
      operationShow: false,
      craneTrendVisible: false,
      isLarge: true,
      BASE_URL: process.env.VUE_APP_PHOTO_API + 'other/',
      isNotic: false,
      showNotic: false,
      timer: null,
      isDragging: false,
      isResizing: false,
      startX: 0,
      startY: 0,
      startWidth: 0,
      startHeight: 0,
      xlmOrginOptions: [
        {
          value: 'door01',
          label: '01'
        },
        {
          value: 'door02',
          label: '02'
        },
        {
          value: 'door03',
          label: '03'
        },
        {
          value: 'door04',
          label: '04'
        },
        {
          value: 'door05',
          label: '05'
        },
        {
          value: 'door06',
          label: '06'
        },
        {
          value: 'door07',
          label: '07'
        },
        {
          value: 'door08',
          label: '08'
        },
        {
          value: 'door09',
          label: '09'
        },
        {
          value: 'door10',
          label: '10'
        },
        {
          value: 'door11',
          label: '11'
        },
        {
          value: 'door12',
          label: '12'
        },
        {
          value: 'door13',
          label: '13'
        },
        {
          value: 'door14',
          label: '14'
        },
        {
          value: 'door15',
          label: '15'
        },
        {
          value: 'door16',
          label: '16'
        }
      ],
      xlmOptions: [],
      resizeVisible: false,
      testVisible: false,
      timer1: null,
      craneDutyVisible: false,
      areaOptions: [
        {
          value: 'area01',
          label: '01'
        },
        {
          value: 'area02',
          label: '02'
        },
        {
          value: 'area03',
          label: '03'
        },
        {
          value: 'area04',
          label: '04'
        },
        {
          value: 'area05',
          label: '05'
        },
        {
          value: 'area06',
          label: '06'
        },
        {
          value: 'area07',
          label: '07'
        },
        {
          value: 'area08',
          label: '08'
        },
        {
          value: 'area09',
          label: '09'
        },
        {
          value: 'area10',
          label: '10'
        }
      ],
      areaSetOptions: [
        {
          value: 'area01',
          label: '01/10'
        },
        {
          value: 'area02',
          label: '02'
        },
        {
          value: 'area03',
          label: '03'
        },
        {
          value: 'area04',
          label: '04'
        },
        {
          value: 'area05',
          label: '05'
        },
        {
          value: 'area06',
          label: '06'
        },
        {
          value: 'area07',
          label: '07'
        },
        {
          value: 'area08',
          label: '08'
        },
        {
          value: 'area09',
          label: '09'
        }
      ],
      areaSetOptions2: [
        {
          value: 'area01',
          label: '01/10'
        },
        {
          value: 'area02',
          label: '02'
        },
        {
          value: 'area03',
          label: '03'
        },
        {
          value: 'area04',
          label: '04'
        },
        {
          value: 'area05',
          label: '05'
        },
        {
          value: 'area06',
          label: '06'
        },
        {
          value: 'area07',
          label: '07'
        },
        {
          value: 'area08',
          label: '08'
        },
        {
          value: 'area09',
          label: '09'
        },
        {
          value: 'area10',
          label: '10'
        }
      ],
      currentDLAreaValue: '',
      currentTLAreaValue: '',
      currentAreaValue: '',
      currentJGAreaValue: '',
      currentJGValue: '',
      areaJGOptions: [],
      areaInfoList: [],
      craneDutyDialogVisible: false,
      currentLSAreaValue: '',
      currentQDAreaValue: '',
      qDAreaValue: '',
      xlmStatus: 0
      // grabLoseControl: false
    }
  },
  watch: {
    'parent.craneAlarmInfo': {
      handler(newVal, oldVal) {
        if ((Object.keys(newVal).length !== 0) && (newVal.id !== oldVal.id)) {
          console.log('-----------', newVal)
          this.openCraneAlarm(newVal)
        }
      },
      // immediate: true,
      deep: true
    },
    resizeVisible: function(val) {
      setTimeout(() => {
        this.testVisible = val
      }, 0)
    },
    // 'parent.dialogVisible': {
    //   handler(newVal, oldVal) {
    //     const bg = this.$refs['dashboard_main']
    //     // console.log('---------------', parent.largeInfo)
    //     if (newVal) {
    //       this.isLarge = false
    //       // bg.style['background-image'] = `url(${this.BASE_URL}left1.jpg)`
    //       bg.style['background-image'] = `url(${this.BASE_URL + parent.largeInfo.capturePhoto})`
    //     } else {
    //       this.isLarge = true
    //       bg.style['background-image'] = ''
    //     }
    //   },
    //   // immediate: true,
    //   deep: true // 可以深度检测到 对象的属性值的变化
    // },
    '$store.state.user.userInfo': {
      handler(newVal, oldVal) {
        if (newVal.userIdentity !== 1) {
          this.operationShow = true
        }
      },
      immediate: true,
      deep: true // 可以深度检测到 对象的属性值的变化
    },
    currentAreaValue: function(val) {
      this.areaJGOptions = this.areaOptions.filter((el) => el.value !== val)
      const list = this.areaInfoList.find((el) => el.areaNo === val)
      this.currentJGAreaValue = this.filterJGAreaNo(list.areaNo)
      this.currentJGValue = list.isjg
    }
  },
  created() {
    this.time = dayjs().format('YYYY年MM月DD日') + ' ' + this.getWeek()
    this.timer = setInterval(() => {
      this.time = dayjs().format('YYYY年MM月DD日') + ' ' + this.getWeek()
    }, 600000)
  },
  mounted() {
    this.getCraneList()

    // document.addEventListener('mousedown', this.startDragOrResize)
    // document.addEventListener('mousemove', this.handleMouseMove)
    // document.addEventListener('mouseup', this.handleMouseUp)
  },
  beforeDestroy() {
    clearInterval(this.timer)
    clearInterval(this.timer1)
    // document.removeEventListener('mousedown', this.startDragOrResize)
    // document.removeEventListener('mousemove', this.handleMouseMove)
    // document.removeEventListener('mouseup', this.handleMouseUp)
  },
  methods: {
    filterJGAreaNo(area) {
      let str = ''
      switch (area) {
        case 'area01':
          str = 'area09'
          break
        case 'area02':
          str = 'area01'
          break
        case 'area03':
          str = 'area02'
          break
        case 'area04':
          str = 'area03'
          break
        case 'area05':
          str = 'area04'
          break
        case 'area06':
          str = 'area05'
          break
        case 'area07':
          str = 'area06'
          break
        case 'area08':
          str = 'area07'
          break
        case 'area09':
          str = 'area08'
          break
        case 'area10':
          str = 'area09'
          break
        default:
          break
      }
      return str
    },
    filterDLDoor(data) {
      // const str = []
      // data.length && data.map((el) => {
      //   if (!str.includes(el.areaNo.slice(-2))) {
      //     str.push(el.areaNo.slice(-2))
      //   }
      // })
      // return str.join()
    },
    filterSetStatus(key) {
      // 1：自动，2人工，3：正常停止
      let str = ''
      switch (key) {
        case '1':
          str = '自动模式'
          break
        case '2':
          str = '人工模式'
          break
        case '3':
          str = '正常停止'
          break
        default:
          str = ''
          break
      }
      return str
    },
    openCraneAlarm(data) {
      this.craneInfo = data
      this.craneDialogVisible = true

      // const arr = this.cranInfoList.filter((el) => el.id === data.id)
      // !arr.length && this.cranInfoList.push(data)
    },
    // 初始获取行车告警信息
    async getCraneList() {
      const { success, data } = await findCraneAlarmList({
        pageNum: 1,
        pageSize: 1,
        status: 0
      })
      if (success && data.list.length) {
        this.openCraneNotic(data.list[0])
      }
    },
    openCraneNotic(info) {
      this.craneDialogVisible = false
      if (info) {
        this.craneInfo = info
      }
      this.showNotic = true
      setTimeout(() => {
        this.isNotic = true
      }, 100)
    },
    handleOpenLarge() {
      this.parent.handleChangeLargeStatus()
    },
    // openCraneNotic(info) {
    //   const h = this.$createElement
    //   this.craneDialogVisible = false
    //   // const isExist = this.noticList.find
    //   this.noticList.push(this.$notify({
    //     title: '',
    //     type: 'warning',
    //     dangerouslyUseHTMLString: true,
    //     message: h('div', {
    //       class: 'notice-box'
    //     }, [
    //       h('div', {
    //         class: 'notice-content'
    //       }, [
    //         h('div', {
    //           class: 'notice-text'
    //         }, info.craneNo.slice(-1) + '号行车异常，请人工移动到准确位置后，再点击确认！')
    //       ]),
    //       h('div', {
    //         class: 'notice-btnbox'
    //       }, [
    //         h('div', {
    //           class: 'notice-btn',
    //           on: {
    //             click: this.handleCheckCrane.bind(this, info.id)
    //           }
    //         }, '确定')
    //       ])
    //     ]),
    //     position: 'bottom-right',
    //     duration: 0,
    //     showClose: false
    //   }))
    // },
    async handleCheckCrane() {
      // console.log('------行车校验------', id, this.noticList)
      // const index = this.cranInfoList.findIndex((el) => el.id === id)
      const { code, message } = await ackCranePlace({
        id: this.craneInfo.id
      })
      if (code === 200) {
        // this.noticList[index].close()
        // this.noticList.splice(index, 1)
        this.showNotic = false
        this.craneMessage = '行车位置校验成功！'
        this.craneStatus = true
      } else {
        this.craneMessage = message
        this.craneStatus = false
      }
      // this.currentCraneIndex = index
      this.craneReconfirmVisible = true
    },
    // 强制确认行车位置正常
    async handleForceCheckCrane() {
      // if (this.craneStatus) {
      //   this.craneReconfirmVisible = false
      //   // this.cranInfoList.splice(this.currentCraneIndex, 1)
      // } else {
      const { success } = await handleCraneAlarm({
        id: this.craneInfo.id
      })
      if (success) {
        this.showNotic = false
        this.$message({
          message: '行车异常已处理',
          type: 'success'
        })
      }
      this.craneReconfirmVisible = false
      // }
    },
    handleFullscreen() {
      if (screenfull.isEnabled) {
        // 控制是否全屏的按钮
        screenfull.toggle(this.$refs.dashboard_main)
      }
    },
    getWeek(num) {
      var datas = dayjs().day()
      var week = ['日', '一', '二', '三', '四', '五', '六']
      return '星期' + week[datas]
    },
    handleShowMonitoring() {
      this.dialogVisible = true
    },
    async handleGetStatus() {
      const { result } = await getOperationStatus()
      this.currentStatus = result
    },
    async handleStatusChange(api) {
      const { success } = await api()
      if (success) {
        this.$message({
          message: '操作成功',
          type: 'success'
        })
        this.handleGetStatus()
        this.handleGetCraneAutoStatus()
      }
    },
    async handleGetCraneStatus() {
      const { success, data } = await readDriveData()
      if (success) {
        this.setList[1].list.forEach((el) => {
          data.map((ele) => {
            if (el.craneNo === ele.deviceId) {
              el.isEnabled = ele.isEnabled
            }
          })
        })
      }
    },
    async handleCraneChange(craneNo, isEnabled, index) {
      startOrStopCrane({
        craneNo,
        isEnabled
      }).then(({ success }) => {
        if (success) {
          this.$message({
            message: '操作成功',
            type: 'success'
          })
          this.handleGetCraneStatus()
        } else {
          this.setList[1].list[index].isEnabled = isEnabled === '1' ? '0' : '1'
        }
      }).catch(() => {
        this.setList[1].list[index].isEnabled = isEnabled === '1' ? '0' : '1'
      })
    },
    handleCraneTrendClose(done) {
      this.craneTrendVisible = false
      // 重置状态
      this.isDragging = false
      this.isResizing = false
      done()
    },
    startDragOrResize(event) {
      if (this.craneTrendVisible && event.target.className === 'el-dialog__header') {
        const dialogRect = this.$refs.craneTrendDialog.$el.querySelector('.el-dialog').getBoundingClientRect()
        const offsetX = event.clientX - dialogRect.left
        const offsetY = event.clientY - dialogRect.top

        if (offsetX >= 0 && offsetX <= dialogRect.width && offsetY >= 0 && offsetY <= dialogRect.height) {
          this.isDragging = true
          this.startX = offsetX
          this.startY = offsetY
        } else if (
          (offsetX <= 5 && offsetY <= 5) || // Top-left corner
        (offsetX >= dialogRect.width - 5 && offsetY <= 5) || // Top-right corner
        (offsetX <= 5 && offsetY >= dialogRect.height - 5) || // Bottom-left corner
        (offsetX >= dialogRect.width - 5 && offsetY >= dialogRect.height - 5) // Bottom-right corner
        ) {
          this.isResizing = true
          this.startX = event.clientX
          this.startY = event.clientY
          this.startWidth = dialogRect.width
          this.startHeight = dialogRect.height
        }
      }
    },
    handleMouseMove(event) {
      document.body.style.cursor = ''
      if (this.craneTrendVisible) {
        const dialogRect = this.$refs.craneTrendDialog.$el.querySelector('.el-dialog').getBoundingClientRect()
        const offsetX = event.clientX - dialogRect.left
        const offsetY = event.clientY - dialogRect.top

        if (offsetX >= 0 && offsetX <= dialogRect.width && offsetY >= 0 && offsetY <= dialogRect.height) {
          if (event.target.className === 'el-dialog__header') {
            document.body.style.cursor = 'grab'
          }
        } else if (
          (offsetX >= dialogRect.width - 5 && offsetY <= 5) || // Top-right corner
          (offsetX <= 5 && offsetY >= dialogRect.height - 5) // Bottom-left corner
        ) {
          document.body.style.cursor = 'ne-resize'
        } else if (
          (offsetX <= 5 && offsetY <= 5) || // Top-left corner
          (offsetX >= dialogRect.width - 5 && offsetY >= dialogRect.height - 5) // Bottom-right corner
        ) {
          document.body.style.cursor = 'nw-resize'
        }

        if (this.isDragging) {
          const newX = event.clientX - this.startX
          const newY = event.clientY - this.startY
          this.$refs.craneTrendDialog.$el.querySelector('.el-dialog').style.left = newX + 'px'
          this.$refs.craneTrendDialog.$el.querySelector('.el-dialog').style.top = newY + 'px'
        } else if (this.isResizing) {
          const newWidth = this.startWidth + (event.clientX - this.startX)
          const newHeight = this.startHeight + (event.clientY - this.startY)
          this.$refs.craneTrendDialog.$el.querySelector('.el-dialog').style.width = newWidth + 'px'
          this.$refs.craneTrendDialog.$el.querySelector('.el-dialog').style.height = newHeight + 'px'
        }
      }
    },
    handleMouseUp() {
      this.isDragging = false
      this.isResizing = false
      // if (this.$refs.craneTrendDialog.$el.querySelector('.el-dialog').style.cursor) {
      //   this.$refs.craneTrendDialog.$el.querySelector('.el-dialog').style.cursor = ''
      // }
    },
    handleDrawerOpen() {
      this.handleGetDLSet()
      this.handleGetStatus()
      this.handleGetCraneStatus()
      this.handleGetCraneAutoStatus()
      this.handleGetCraneStartStatus()
      this.handleGetAreaInfo()
      clearInterval(this.timer1)
      this.timer1 = setInterval(() => {
        this.handleDrawerOpen()
      }, 10000)
    },
    handleDrawerClose() {
      clearInterval(this.timer1)
      this.$refs.craneDutyConfigRef && this.$refs.craneDutyConfigRef.handleGetTableData()
      this.$refs.dashboardLeftPage && this.$refs.dashboardLeftPage.handleGetDoorCameraUrl()
    },
    async handleGetDLSet() {
      const { data, success } = await findDlPortList()
      if (success) {
        this.setList[2].list = []
        // this.xlmOptions = JSON.parse(JSON.stringify(this.xlmOrginOptions))
        data.areas.map((el) => {
          this.setList[2].list.push({
            id: el.id,
            areaNo: el.areaNo,
            value: '',
            areaValue: el.dlAreaNo,
            // type: el.dlAreaNo ? 'area' : 'disArea',
            children: []
          })
          // if (el.dlAreaNo) {
          //   this.setList[2].list.push({
          //     id: el.id,
          //     areaNo: el.dlAreaNo,
          //     value: '',
          //     type: 'dlArea',
          //     children: []
          //   })
          // }
        })
        data.list.map((el) => {
          if (this.setList[2].list.some((ele) => ele.areaNo === el.areaNo)) {
            this.setList[2].list.forEach((ele) => {
              if (el.areaNo === ele.areaNo) {
                ele.children.push(el)
              }
            })
          }
          // else {
          //   this.setList[2].list.push({
          //     areaNo: el.areaNo,
          //     value: '',
          //     children: [el]
          //   })
          // }
          // indexOf 不可以 因为是个新的对象,所以找不到

          // const idx = this.xlmOptions.findIndex((ele) => ele.value === el.doorNo)
          // if (idx !== -1) {
          //   this.xlmOptions.splice(idx, 1)
          // }
        })
      }
    },
    handleTagClose(tag, index) {
      // 删除
      delDlPort({
        id: tag.id
      }).then(() => {
        this.handleGetDLSet()
        // indexOf 可以 因为tag是引用,所以找得到
        // this.setList[2].list[index].children.splice(this.setList[2].list[index].children.indexOf(tag), 1)
      })
    },
    handleAddTag(data) {
      const { areaNo, value } = data
      // 添加
      addDlPort({
        areaNo,
        doorNo: value
      }).then(() => {
        this.handleGetDLSet()
        this.$message({
          type: 'success',
          message: '添加成功'
        })
      })
    },
    handleResize(newRect) {
      this.$refs.craneTrend.speedChar && this.$refs.craneTrend.speedChar.resize()
    },
    async handleGetCraneAutoStatus() {
      const { success, result } = await selectAllCraneStatus()
      if (success) {
        this.setList[1].list.forEach((el) => {
          el.isAuto = result[el.craneNo] === '1' ? '1' : '2'
        })
      }
    },
    handleCraneAutoChange(craneNo, craneStatus, index) {
      updateCraneStatus({
        craneNo,
        craneStatus
      }).then(({ success }) => {
        if (success) {
          this.$message({
            message: '操作成功',
            type: 'success'
          })
          this.handleGetCraneAutoStatus()
        } else {
          this.setList[1].list[index].isAuto = craneStatus === '1' ? '2' : '1'
        }
      }).catch(() => {
        this.setList[1].list[index].isAuto = craneStatus === '1' ? '2' : '1'
      })
    },
    async handleGetCraneStartStatus() {
      const { success, result } = await selectAllCranePauseStatus()
      if (success) {
        this.setList[1].list.forEach((el) => {
          el.isStart = result[el.craneNo]
          el.emergencyStop = (result[el.craneNo] === '3')
        })
      }
    },
    handleCraneStartChange(craneNo, craneStatus, index) {
      const api = (craneStatus === '1') ? restoreSingleCrane : emergencyStopSingleCrane
      api({
        craneNo
      }).then(({ success }) => {
        if (success) {
          this.$message({
            message: '操作成功',
            type: 'success'
          })
        } else {
          this.setList[1].list[index].isStart = craneStatus === '1' ? '2' : '1'
        }
      }).catch(() => {
        this.setList[1].list[index].isStart = craneStatus === '1' ? '2' : '1'
      }).finally(() => {
        this.handleGetCraneStartStatus()
      })
    },
    async handleChangeDlArea() {
      const { success } = await areaStatusToggle()
      if (success) {
        this.$message({
          message: '操作成功',
          type: 'success'
        })
      }
      this.handleGetDLSet()
      this.handleGetAreaInfo()
      this.$refs.dashboardRightPage.loadBarChar()
    },
    async handleChangeArea() {
      const { success } = await toggleTlArea()
      if (success) {
        this.$message({
          message: '操作成功',
          type: 'success'
        })
      }
      this.handleGetAreaInfo()
      this.$refs.dashboardRightPage.loadBarChar()
    },
    async handleGetAreaInfo() {
      const { success, data } = await disAreaInfo({
        pageNum: 1,
        pageSize: 10
      })
      if (success) {
        // this.setList[3].list[0].area = data.list.find((el) => el.areaStatus === 'TL').areaName
        this.setList[3].list = data.list.filter((el) => el.areaStatus === 'TL' && el.istl === '1')
        this.areaInfoList = data.list
        // this.currentTLAreaValue = data.list.find((el) => el.areaStatus === 'TL').areaNo
        // this.currentDLAreaValue = data.list.find((el) => el.areaStatus === 'DL').areaNo
      }
    },
    async handleCancelTask(id) {
      const { success } = cancelTaskByCraneNo({
        craneNo: id
      })
      if (success) {
        this.$message({
          message: '操作成功',
          type: 'success'
        })
      }
    },
    async handleUpdateDlArea(id, dlAreaNo) {
      const { success } = await updateArea({
        id,
        dlAreaNo
      })
      if (success) {
        this.$message({
          message: '操作成功',
          type: 'success'
        })
        this.handleGetDLSet()
      }
    },
    async handleUpdateJGArea(type) {
      let api = ''
      let data = {}
      switch (type) {
        case '1':
          api = openJg
          data = { jgArea: this.currentJGAreaValue, currentArea: this.currentAreaValue }
          break
        case '0':
          api = closeJg
          data = { jgArea: this.currentJGAreaValue }
          break

        default:
          break
      }
      const { success } = await api(data)
      if (success) {
        this.$message({
          message: '操作成功',
          type: 'success'
        })
        this.handleGetAreaInfo()
      }
    },
    async handleZLSet(val, tl, zl) {
      const data = val === 'XYZL' ? { tlArea: tl, zlDoor: zl } : { tlArea: tl }
      const api = val === 'XYZL' ? openZl : closeZl
      const { success } = await api(data)
      if (success) {
        this.$message({
          message: '修改成功，行车职责已更新，请到行车职责配置中查看！',
          type: 'success'
        })
        this.handleGetAreaInfo()
      }
    },
    async handleSetDLTLArea(dl, tl) {
      const { success } = await updateAreaStatus({
        dlArea: dl,
        tlArea: tl
      })
      if (success) {
        this.$message({
          message: '修改成功，行车职责已更新，请到行车职责配置中查看！',
          type: 'success'
        })
        this.handleGetAreaInfo()
      }
    },
    async handleSetLSArea(type) {
      const api = type === 'open' ? openLs : closeLs
      const { success } = await api({ currentArea: this.currentLSAreaValue })
      if (success) {
        this.$message({
          message: '区域沥水设置成功',
          type: 'success'
        })
      }
    },
    async handleSetQDArea(type) {
      const api = type === 'open' ? openQd : closeQd
      const data = type === 'open' ? { currentArea: this.currentQDAreaValue, qdArea: this.qDAreaValue } : { currentArea: this.currentQDAreaValue }
      const { success } = await api(data)
      if (success) {
        this.$message({
          message: '区域清底设置成功',
          type: 'success'
        })
      }
    },
    async hadleGetXlmStatus() {
      const { success, data } = await getAutomaticStatus()
      if (success) {
        this.xlmStatus = data
      }
    },
    async handleChangeXlmStatus() {
      const { success } = await openAutomatic({ status: this.xlmStatus })
      if (success) {
        this.$message({
          message: '卸料门操作状态设置成功',
          type: 'success'
        })
      }
      this.hadleGetXlmStatus()
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard {
  &-container {
    position: relative;
    padding: 15px;
    height: 100%;
    background-color: $logo-main;
    box-sizing: border-box;
    color: $word-normal;
    user-select: none;
    /* background-image: url(~@/assets/avatar.png); */
    background-size: 100% 100%;
    background-position: 50%;
    .crane-alarm {
      @include flex;
      position: absolute;
      top: 10px;
      right: -20%;
      width: fit-content;
      padding: 5px;
      border-radius: 8px;
      background-color: #fff;
      color: #606266;
      font-size: 14px;
      transition: all 1s;
      &.show {
        right: 10px;
      }
      .alarm-icon {
        color: red;
        font-size: 24px;
      }
      .alarm-info {
        @include flex;
        margin: 0 13px;
        line-height: 20px;
        .alarm-text {
          width: 176px;
          margin-right: 10px;
        }
        .alarm-btn {
          padding: 3px 10px;
          border: 1px solid;
          border-radius: 20px;
          cursor: pointer;
          user-select: none;
          &:hover {
            color: $state-success;
          }
        }
      }
    }
    ::v-deep .el-drawer__header {
      margin-bottom: 0
    }
  }
  &-top {
    @include flex(space-between);
    height: 100px;
    .pre-screenfull {
      width: 15%;
      height: 100%;
      font-size: 24px;
      .screenfull {
        cursor: pointer;
      }
      .monitoring {
        position: absolute;
        top: 50px;
        width: 100px;
        padding: 5px 10px;
        line-height: 30px;
        border-radius: 10px;
        background-color: $logo-special;
        color: $word-white;
        font-size: 16px;
        cursor: pointer;
        user-select: none;
        &:hover {
          background-color: $logo-hover;
        }
        &.trend {
          /* left: 110px; */
          width: auto;
        }
      }
    }
    .top-title {
      width: 70%;
      height: 100px;
      line-height: 90px;
      background: url(~@/assets/dashboard_top.png);
      background-size: 100% 100%;
      background-position: 50%;
      font-size: 36px;
      font-weight: 700;
      color: $word-white;
      text-shadow: #fff 0 0 15px;
      text-align: center;
    }
    .top-info {
      position: relative;
      width: 15%;
      margin-top: -50px;
      .monitoring {
        position: absolute;
        top: 35px;
        width: 100px;
        padding: 5px 10px;
        line-height: 30px;
        border-radius: 10px;
        background-color: $logo-special;
        color: $word-white;
        cursor: pointer;
        user-select: none;
        &:hover {
          background-color: $logo-hover;
        }
        &.trend {
          left: 110px;
          width: auto;
        }
      }
    }
  }
  &-center {
    /* @include flex(space-between); */
    width: 100%;
    height: 90%;
    box-sizing: border-box;
    ::v-deep .el-row--flex.is-justify-space-around{
      height: 100%;
    }
    .center-left {
      /* width: 100%; */
      height: 100%;
    }
    /* .center {
      width: 65%;
    } */
    .center-right {
      height: 100%;
    }
  }
}
.pit-dialog {
  ::v-deep .el-dialog {
    height: 70%;
    /* height: 500px; */
    .el-dialog__body {
      height: 100%;
      padding: 0;
    }
  }
}
::v-deep .crane-trend-dialog {
  height: 70%;
  margin: 0 !important;
  top: 15%;
  left: 15%;
  .el-dialog__body {
    height: 100%;
    padding: 0;
  }
}
.warn-dialog {
  ::v-deep .el-dialog {
    border: 5px solid red;
  }
  .warn-cont {
    display: flex;
    align-items: center;
    justify-content: center;
    .warn-img {
      width: 50px;
      height: 50px;
    }
    .warn-desc {
      margin-left: 10px;
      font-weight: 700;
      .show-img {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 5px;
        .img-list {
          width: 24px;
          height: 24px;
          margin-left: 5px;
        }
      }
    }
  }
}
.notice-box {
  @include flex;
  .notice-content {
    width: 176px;
    margin-right: 10px;
  }
  .notice-btnbox {
    @include flex(flex-end);
    .notice-btn {
      padding: 3px 10px;
      border: 1px solid;
      border-radius: 20px;
      cursor: pointer;
      user-select: none;
      &:hover {
        color: $state-success;
      }
    }
  }

}
.operation {
  position: fixed;
  top: 50%;
  right: 0;
  padding: 10px;
  writing-mode: vertical-rl;
  color: $state-error;
  cursor: pointer;
  &:hover {
    color: $state-success;
  }
}
.set-list {
  height: 76%;
  padding: 12px;
  box-sizing: border-box;
  overflow-y: auto;
  color: #000;
  /* 滚动条宽度 */
  &::-webkit-scrollbar {
    width: 6px;
    background-color: transparent;
  }
  /* 滚动条颜色 */
  &::-webkit-scrollbar-thumb {
    background-color: rgba(28,81,148,0.6);
    border-radius: 3px;
  }
  .single-set {
    ::v-deep .el-divide {
      background-color: #000;
    }
    ::v-deep .el-button {
      padding: 6px 10px;
    }
    ::v-deep .el-divider--horizontal.item-divider {
      margin: 10px 0;
    }
  }
  .set-status {
    margin-bottom: 20px;
    font-weight: 700;
  }
  .single-item {
    width: 100%;
    padding: 2px 10px;
    margin-top: 10px;
    ::v-deep .el-divider--horizontal {
      margin: 10px 0 0;
    }
    ::v-deep .el-radio-group {
      .el-radio {
        margin-right: 12px;
        .el-radio__label {
          padding-left: 5px;
        }
      }
    }
    .label {
      font-weight: 700;
    }
    .content {
      @include flex(space-between);
      margin-top: 15px;
      ::v-deep .el-switch {
        .el-switch__label--left {
          margin-right: 5px;
        }
        .el-switch__label--right {
          margin-left: 5px;
        }
      }
      .desc-item {
        @include flex;
      }
      .desc {
         margin-right: 5px;
         font-size: 14px;
      }
      .crane-stop {
        position: relative;
        .stop-tips {
          position: absolute;
          top: -15px;
          left: 0;
          font-size: 14px;
          color: red;
        }
      }
    }
  }
  .tag-item {
    padding: 2px 10px;
    margin-top: 5px;
  }
}
.drag-resize-box {
  transform: translate(400px, 100px);
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
  z-index: 1000 !important;
}
.resize-close-top {
  @include flex(space-between);
  width: 100%;
  height: 50px;
  padding: 20px 20px 0;
  background-color: #fff;
  color: #606266;
  .resize-title {
    font-weight: 700;
  }
  .resize-close {
    cursor: pointer;
  }
}
.xlm-set {
  @include flex;
}
</style>
