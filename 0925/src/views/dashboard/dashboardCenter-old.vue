<template>
  <div class="center-main">
    <div class="per-view">
      <div class="container">
        <div class="face before">
          <div class="port-all">
            <div v-for="(item, index) in portList" :key="item.id" :class="['port', filterStatuStyle(item.isEnabled)]">
              <div :class="['port-pot', filterPortState(item.status)]" />
              <div class="port-text">{{ index + 1 }}</div>
              <!-- <div v-for="trucks in truckList[index].children" :key="trucks.sort" class="truck">
                <svg-icon icon-class="truck" />
              </div> -->
            </div>
          </div>
          <div class="port-footer" />
        </div>
        <div class="face after">
          <div class="bg-map after">
            <!-- <img v-if="bgShow" :src="BASE_URL + 'front.png'" alt=""> -->
          </div>
          <div class="scale-all">
            <div v-for="(item, index) in feedPort" :key="item.id" :class="['scale', showPortStatus(item.isEnabled)]" @mouseover="portShow = true" @mouseleave="portShow = false">
              <!--  :style="{height: item.degree + '%'}" -->
              <div :class="['scale-bg', filterScaleBg(item)]">{{ item.degree + '%' }}</div>
              <div class="scale-text">{{ item.materialPortName.slice(0,2) }}</div>
              <div v-show="portShow" class="scale-pop">
                <img :src="BASE_URL_TLK + `left${index + 1}.jpg`" alt="">
                <img :src="BASE_URL_TLK + `right${index + 1}.jpg`" alt="">
              </div>
            </div>
          </div>
          <div class="area-all">
            <div v-for="item in pitArea" ref="pitItem" :key="item.id" class="area">{{ item.areaName }}</div>
          </div>
        </div>
        <div class="face right">
          <div class="bg-map right">
            <!-- <img v-if="bgShow" :src="BASE_URL + 'right.png'" alt=""> -->
          </div>
        </div>
        <div class="face left">
          <div class="bg-map left">
            <!-- <img v-if="bgShow" :src="BASE_URL + 'left.png'" alt=""> -->
          </div>
        </div>
        <div class="face top">
          <div v-for="item in talonList" :key="item.info.deviceId" class="test" :style="filterDisScale(item, 'dc')">
            <el-popover
              placement="right"
              width="160"
              trigger="hover"
            >
              <div class="pop-content">
                <div class="pop-item">
                  当前位置：
                  <div>{{ numTofixed(item.info.x) + ', ' + numTofixed(item.info.y) }}</div>
                </div>
                <el-divider />
                <div class="pop-item">大车电流： {{ numTofixed(item.info.bigCarCurrent) }}</div>
                <div class="pop-item">大车速度： {{ numTofixed(item.info.bigCarSpeed) }}</div>
                <el-divider />
                <div class="pop-item">小车电流： {{ numTofixed(item.info.smallCarCurrent) }}</div>
                <div class="pop-item">小车速度： {{ numTofixed(item.info.smallCarSpeed) }}</div>
              </div>
              <div slot="reference" class="talon-main">
                <div class="crane-move">
                  <div :class="['sort', filterStatuStyle(item.info.isEnabled)]" />
                  <div class="arrow-box">
                    <div :class="['arrow-move', {'forward' : item.info.smallCarFrwdFlag}, {'backward' : item.info.smallCarBrwdFlag}]">
                      <svg-icon v-for="icon in testArrowList1" v-show="item.info.smallCarBrwdFlag" :key="icon" class="arrow-item" icon-class="arrow_down_width" />
                      <svg-icon v-for="icon in testArrowList2" v-show="item.info.smallCarFrwdFlag" :key="icon" class="arrow-item" icon-class="arrow_up_width" />
                    </div>
                    <div v-if="item.info.smallCarBLS" class="arrow-pot up">
                      <svg-icon icon-class="limit" />
                    </div>
                    <div v-if="item.info.smallCarFLS" class="arrow-pot down">
                      <svg-icon icon-class="limit" />
                    </div>
                  </div>
                  <div class="test-child" :style="filterDisScale(item, 'xc')" />
                  <div class="num">{{ item.value }}</div>
                </div>
              </div>
            </el-popover>
            <div :class="['flick', 'left', { 'start' : item.info.bigCarBrwdFlag}, {'limit' : item.info.bigCarLLS}]" />
            <div :class="['flick', 'right', { 'start' : item.info.bigCarFrwdFlag}, {'limit' : item.info.bigCarRLS}]" />
          </div>
        </div>
        <div class="face bottom">
          <div class="bg-map bottom">
            <!-- <img v-if="bgShow" :src="BASE_URL + 'top.png'" alt=""> -->
            <div id="pitBottomChar" style="width: 100%; height: 100%;" />
          </div>
        </div>
        <!-- 中间加一面 -->
        <div class="face face-other">
          <div class="bg-map after">
            <!-- <img v-if="bgShow" :src="BASE_URL + 'front.png'" alt=""> -->
            <!-- <div id="pitChar" style="width: 849.8px; height: 175px;" /> -->
            <div id="pitChar" style="width: 100%; height: 100%; filter: drop-shadow(16px -8px 20px #000);" />
          </div>
        </div>
        <div v-for="item in talonList" :key="'line' + item.value" class="talon-line" :style="filterDisScale(item, 'line')" />
        <div v-for="item in talonList" :key="'ljz' + item.value" class="face talon" :style="filterDisScale(item, 'ljz')">
          <el-popover
            placement="right"
            width="160"
            trigger="hover"
          >
            <div class="pop-content">
              <div class="pop-item">
                当前位置：
                <div>{{ numTofixed(item.info.x) + ', ' + numTofixed(item.info.y) + ', ' + numTofixed(item.info.z) }}</div>
              </div>
              <el-divider />
              <div class="pop-item">抓斗电流： {{ numTofixed(item.info.grabCurrent) }}</div>
              <div class="pop-item">抓斗速度： {{ numTofixed(item.info.grabSpeed) }}</div>
              <div class="pop-item">抓斗开度： {{ numTofixed(item.info.grabOpen) }}</div>
              <div class="pop-item">抓斗压力MA：{{ numTofixed(item.info.grabPreMa) }}</div>
              <div class="pop-item">抓斗压力MB：{{ numTofixed(item.info.grabPreMb) }}</div>
              <div class="pop-item">抓斗压力MP：{{ numTofixed(item.info.grabPreMp) }}</div>
              <div class="pop-item">抓斗压力MP1：{{ numTofixed(item.info.grabPreMp1) }}</div>
              <div class="pop-item">抓斗压力MP2：{{ numTofixed(item.info.grabPreMp2) }}</div>
            </div>
            <div slot="reference" class="talon-main">
              <!-- <svg-icon icon-class="talon" /> -->
              <div class="talon-container">
                <!-- 根据抓点位置和状态确定 爪子开合   -->
                <div :class="['talon-content', {'close': !item.info.grabOpen}]">
                  <svg-icon icon-class="talon_open" />
                  <svg-icon icon-class="talon_close" />
                </div>
              </div>
            </div>
          </el-popover>
        </div>
        <div v-for="item in talonList" :key="'arrow' + item.value" class="arrow-list" :style="filterDisScale(item, 'arrow')">
          <div v-if="item.info.grabUrwdFlag" :class="['arrow']">
            <svg-icon icon-class="arrow_up" />
          </div>
          <div v-if="item.info.grabULS" :class="['arrow', 'limit']">
            <svg-icon icon-class="arrow_up" />
          </div>
          <div v-if="item.info.grabDrwdFlag" :class="['arrow']">
            <svg-icon icon-class="arrow_down" />
          </div>
          <div v-if="item.info.grabDLS" :class="['arrow', 'limit']">
            <svg-icon icon-class="arrow_down" />
          </div>
          <div class="arrow-tips">
            <div v-if="item.info.bigCarWait">等待</div>
            <div v-if="item.info.bigCarAvoid">避障</div>
          </div>
        </div>

      </div>
    </div>
    <div class="out-trucks">
      <div v-for="(item, index) in truckList" :key="item.sort" class="door">
        <div v-for="(trucks, nums) in truckList[index].children" v-show="nums < 3" :key="trucks" class="truck">
          <el-tooltip class="item" effect="dark" :content="trucks" placement="right">
            <svg-icon icon-class="truck" />
          </el-tooltip>
        </div>
      </div>
    </div>
    <div style="width: 90%; margin: 0 auto">
      <dataCard height="195" title="垃圾吊任务表">
        <!-- <taskTable /> -->
        <nativeTable :table-data="taskTableData" :table-column="taskTableColumn" :max-height="111">
          <template #craneNo="scope">
            {{ filterCraneNo(scope.row.craneNo) }}
          </template>
          <template #taskType="scope">
            {{ filterDisCraneTaskType(scope.row.taskType) }}
          </template>
          <template #executionType="scope">
            {{ filterDisCraneExecutionType(scope.row.executionType) }}
          </template>
          <template #startPointX="scope">
            {{ `${numTofixed(scope.row.startPointX)},${numTofixed(scope.row.startPointY)},${numTofixed(scope.row.startPointZ)}` }}
          </template>
          <template #x1="scope">
            {{ `${numTofixed(scope.row.x1)},${numTofixed(scope.row.y1)},${numTofixed(scope.row.z1)}` }}
          </template>
          <template #x2="scope">
            {{ `${numTofixed(scope.row.x2)},${numTofixed(scope.row.y2)},${numTofixed(scope.row.z2)}` }}
          </template>
          <template #taskStatus="scope">
            <div :class="['tasktable-status', taskStatusClass(scope.row.taskStatus)]">{{ filterDisCraneTaskStatus(scope.row.taskStatus) }}</div>
          </template>
        </nativeTable>
      </dataCard>
    </div>
    <!-- 设备异常表 -->
    <div style="width: 90%; margin: 0 auto">
      <dataCard height="195" title="设备异常告警">
        <nativeTable :table-data="faultTableData" :table-column="faultTableColumn" :max-height="111">
          <!-- <template #deviceType="scope">
            {{ filterDeviceType(scope.row.deviceType) }}
          </template> -->
          <template #faultCode="scope">
            <div style="color: #f56c68;">{{ scope.row.faultCode }}</div>
          </template>
        </nativeTable>
      </dataCard>
    </div>
    <!-- 投料口监控 -->
    <!-- <div class="feed-video">
      <el-carousel indicator-position="none" height="137px" :interval="5000">
        <el-carousel-item v-for="item in filterfeedData" :key="item.id">
          <div class="feed-video-item" @click="handleVideoClick(item.url, item.materialPortName)">
            <video-test :rtsp="item.url" />
            <div class="feed-video-title">{{ item.materialPortName }}</div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div> -->
    <!-- 投料口监控-放大 -->
    <el-dialog
      :title="currentTlkDialogTitle"
      :visible.sync="tlkVisible"
      width="70%"
      :modal="false"
      :destroy-on-close="true"
      @close="handleTlkDialogClose"
    >
      <video-test v-if="currentDialogRtsp" :rtsp="currentDialogRtsp" />
    </el-dialog>
  </div>
</template>

<script>
import SvgIcon from '@/components/SvgIcon'
import { disAreaInfo, findPutMaterialPortList } from '@/api/pitArea'
import { filterDisArea } from '@/utils/filter'
import { findDoorQueue } from '@/api/car'
import { findParamSet } from '@/api/setting'
import { findTaskList, readDriveData, tlState } from '@/api/disCrane'
import dataCard from '@/components/dataCard'
import nativeTable from '@/components/nativeTable'
import { filterDisCraneTaskType, filterDisCraneExecutionType, filterDisCraneTaskStatus, filterDeviceType } from '@/utils/filter'
import { findDeviceFaultList } from '@/api/device'
import videoTest from './component/jsmpegVideo.vue'
import { glChar } from './char'
import charData from './test/data.json'
import * as echarts from 'echarts'
import { getPointCloud } from '@/api/jeecg'

export default {
  name: 'DashboardCenter',
  components: { SvgIcon, dataCard, nativeTable, videoTest },
  inject: ['parent'],
  data() {
    return {
      doorList: [
        {
          sort: 1,
          state: 0,
          fill: 50
        },
        {
          sort: 2,
          state: 0,
          fill: 50
        },
        {
          sort: 3,
          state: 1,
          fill: 50
        },
        {
          sort: 4,
          state: 2,
          fill: 50
        }
      ],
      pitArea: [
        {
          id: 1,
          areaName: ''
        },
        {
          id: 2,
          areaName: ''
        },
        {
          id: 3,
          areaName: ''
        },
        {
          id: 4,
          areaName: ''
        },
        {
          id: 5,
          areaName: ''
        },
        {
          id: 6,
          areaName: ''
        },
        {
          id: 7,
          areaName: ''
        },
        {
          id: 8,
          areaName: ''
        },
        {
          id: 9,
          areaName: ''
        },
        {
          id: 10,
          areaName: ''
        }
      ],
      portList: [
        {
          sort: '001',
          state: 0,
          children: []
        },
        {
          sort: '002',
          state: 0,
          children: []
        },
        {
          sort: '003',
          state: 0,
          children: []
        },
        {
          sort: '004',
          state: 0,
          children: []
        },
        {
          sort: '005',
          state: 1,
          children: []
        },
        {
          sort: '006',
          state: 2,
          children: []
        },
        {
          sort: '007',
          state: 3,
          children: []
        },
        {
          sort: '008',
          state: 0,
          children: []
        },
        {
          sort: '009',
          state: 0,
          children: []
        },
        {
          sort: '0010',
          state: 0,
          children: []
        },
        {
          sort: '0011',
          state: 0,
          children: []
        },
        {
          sort: '0012',
          state: 1,
          children: []
        },
        {
          sort: '0013',
          state: 2,
          children: []
        },
        {
          sort: '0014',
          state: 3,
          children: []
        },
        {
          sort: '0015',
          state: 0,
          children: []
        },
        {
          sort: '0016',
          state: 0,
          children: []
        }
      ],
      talonList: [
        {
          value: 1, // 序号
          info: {
            x: 0,
            y: 0,
            z: 0
          }
        },
        {
          value: 2,
          info: {
            x: 0,
            y: 0,
            z: 0
          }
        },
        {
          value: 3,
          info: {
            x: 0,
            y: 0,
            z: 0
          }
        }
      ],
      disArea: {
        totalWidth: 121.4,
        height: 26.8,
        deep: 32,
        area1: 0,
        area10: 0,
        areaOthers: 0
      },
      taskTableData: [],
      taskTableColumn: [
        {
          label: '行车',
          key: 'craneNo'
        },
        {
          label: '任务',
          key: 'taskType'
        },
        {
          label: '执行',
          key: 'executionType'
        },
        {
          label: '抓取位置',
          key: 'startPointX'
        },
        {
          label: '投放位置1',
          key: 'x1'
        },
        {
          label: '投放位置2',
          key: 'x2'
        },
        {
          label: '状态',
          key: 'taskStatus'
        }
      ],
      BASE_URL: process.env.VUE_APP_PHOTO_API + 'ljc/',
      BASE_URL_TLK: process.env.VUE_APP_PHOTO_API + 'tlk/',
      bgShow: true,
      feedPort: [],
      portShow: false,
      truckList: [
        {
          sort: '01',
          children: []
        },
        {
          sort: '02',
          children: []
        },
        {
          sort: '03',
          children: []
        },
        {
          sort: '04',
          children: []
        },
        {
          sort: '05',
          children: []
        },
        {
          sort: '06',
          children: []
        },
        {
          sort: '07',
          children: []
        },
        {
          sort: '08',
          children: []
        },
        {
          sort: '09',
          children: []
        },
        {
          sort: '10',
          children: []
        },
        {
          sort: '11',
          children: []
        },
        {
          sort: '12',
          children: []
        },
        {
          sort: '13',
          children: []
        },
        {
          sort: '14',
          children: []
        },
        {
          sort: '15',
          children: []
        },
        {
          sort: '16',
          children: []
        }
      ],
      faultTableData: [],
      faultTableColumn: [
        {
          label: '设备名',
          prop: 'deviceName'
        },
        {
          label: '设备IP',
          prop: 'deviceIp'
        },
        {
          label: '故障时间',
          prop: 'falultTime'
        },
        {
          label: '状态',
          key: 'faultCode'
        }
      ],
      feedingList: [],
      feedLackList: [],
      currentUrl: 0,
      currentCamera: true,
      filterfeedData: [],
      tlkVisible: false,
      currentTlkDialogTitle: '',
      currentDialogRtsp: '',
      charArr: [],
      pitChar: null,
      pitBottomChar: null,
      testArrowList1: ['1-1111', '2-1111', '3-1111', '4-1111', '5-1111', '6-1111', '7-1111', '8-1111', '9-1111', '10-1111', '11-1111', '12-1111', '13-1111', '14-1111', '15-1111', '16-1111', '17-1111', '18-1111', '19-1111', '20-1111', '21-1111', '22-1111', '23-1111', '24-1111', '25-1111', '26-1111', '27-1111', '28-1111', '29-1111', '30-1111'],
      testArrowList2: ['1-2222', '2-2222', '3-2222', '4-2222', '5-2222', '6-2222', '7-2222', '8-2222', '9-2222', '10-2222', '11-2222', '12-2222', '13-2222', '14-2222', '15-2222', '16-2222', '17-2222', '18-2222', '19-2222', '20-2222', '21-2222', '22-2222', '23-2222', '24-2222', '25-2222', '26-2222', '27-2222', '28-2222', '29-2222', '30-2222']
    }
  },
  watch: {
    'parent.craneData': {
      handler(newVal, oldVal) {
        // console.log('---------------', newVal)
        this.talonList.forEach((ele, index) => {
          ele.info = newVal.find(el => {
            if (el?.deviceId) {
              return el.deviceId.includes(index + 1)
            }
          })
          if (!ele.info?.deviceId) {
            ele.info = { deviceId: 'crane0' + (index + 1) }
          }
        })
      },
      // immediate: true,
      deep: true // 可以深度检测到 对象的属性值的变化
    },
    'parent.doorData': {
      handler(newVal, oldVal) {
        // console.log('---------------', newVal)
        newVal && (this.portList = newVal)
      },
      deep: true // 可以深度检测到 对象的属性值的变化
    }
  },
  created() {
    // this.getDisDeviceInfo() // 行车信息
    this.getDisAreaInfo() // 发酵数据
    this.getDisArea() // 分区
    this.getTaskList() // 任务记录
    this.handleGetPortList() // 投料口信息
    this.getDoorQueue() // 卸料门-车辆
    this.getfaultData() // 设备异常
    this.handleGetSet() // 参数设置数据 - 投料口阈值
    // this.handleDealCharData() // 三维点云测试数据
    setInterval(() => {
      this.handleGetPortList() // 投料口信息
      this.getDoorQueue() // 卸料门-车辆
      this.getTaskList() // 任务记录
      this.getfaultData() // 设备异常
    }, 60000)
  },
  mounted() {
    // 解决 垃圾吊的线会单独加载 的问题
    const tests = document.getElementsByClassName('test')
    const childs = document.getElementsByClassName('test-child')
    const talonLines = document.getElementsByClassName('talon-line')
    const talons = document.getElementsByClassName('talon')
    const arr = [tests, childs, talonLines, talons]
    setTimeout(() => {
      // 进入页面时,垃圾吊的线会单独加载动画
      arr.map((el) => {
        for (const iterator of el) {
          iterator.style.transition = 'all .5s'
        }
      })
      // this.getDisDeviceInfo() // 测试-------------------
    }, 1000)

    // 垃圾池分区
    setTimeout(() => {
      this.$refs.pitItem[0].style.width = this.disArea.area1
      this.$refs.pitItem[9].style.width = this.disArea.area10
      this.$refs.pitItem.slice(1, this.$refs.pitItem.length - 1).map((el) => {
        el.style.width = this.disArea.areaOthers / (this.$refs.pitItem.length - 2) + '%'
      })
    }, 1000)
    // 垃圾池三维图表展示
    this.pitChar = echarts.init(document.getElementById('pitChar'))
    this.pitBottomChar = echarts.init(document.getElementById('pitBottomChar'))
    this.handleShowPitChar()
    setInterval(() => {
      this.handleShowPitChar()
    }, 600000)
  },
  methods: {
    filterDisArea,
    filterDisCraneTaskType,
    filterDisCraneExecutionType,
    filterDisCraneTaskStatus,
    filterDeviceType,
    taskStatusClass(key) {
      let val = ''
      switch (key) {
        case '0':
          val = 'prepare'
          break
        case '1':
          val = 'issue'
          break
        case '2':
          val = 'issued'
          break
        case '3':
          val = 'doing'
          break
        case '4':
          val = 'done'
          break
        default:
          val = key
          break
      }
      return val
    },
    dischargeStatus(key) {
      let str = ''
      switch (key) {
        case '1':
          str = 'normal'
          break
        case '0':
          str = 'error'
          break
        default:
          break
      }
      return str
    },
    numTofixed(val) {
      if (typeof val !== 'number') {
        val = parseFloat(val)
      }
      return val.toFixed(2)
    },
    filterCraneNo(str) {
      return str.match(/\d/g)?.join('') || ''
    },
    filterArrow(info) {
      if (info.smallCarFrwdFlag) {
        return 'arrow_down_width'
      }
      if (info.smallCarBrwdFlag) {
        return 'arrow_up_width'
      }
    },
    async getTaskList(val) {
      // 数据改变,重新获取数据
      // val && Object.assign(this.tableForm, val)
      const { data, success } = await findTaskList({
        pageNum: 1,
        pageSize: 20
      })
      // success && (this.tableData = data)
      if (success) {
        this.taskTableData = JSON.parse(JSON.stringify(data.list))
        // this.tableForm.total = data.total
      }
    },
    async getDisArea() {
      const { success, data } = await findParamSet()
      if (success) {
        // 分区宽度设置
        const res = {
          area1: 0,
          area10: 0,
          total: 121.4 // 垃圾池真实宽度
        }
        data.ljc.map((ele) => {
          switch (ele.areaNo) {
            case 'area01':
              res.area1 = parseFloat(ele.width)
              break
            case 'area10':
              res.area10 = parseFloat(ele.width)
              break
            default:
              break
          }
        })
        const { area1, area10, total } = res
        this.disArea.area1 = (Math.round((area1 / total) * 10000) / 100) + '%'
        this.disArea.area10 = (Math.round((area10 / total) * 10000) / 100) + '%'
        this.disArea.areaOthers = (Math.round(((total - area1 - area10) / total) * 10000) / 100)

        // 行车状态
        // this.talonList.forEach((el, index) => {
        //   el.status = data.ljd[index].isEnabled
        // })
      }
    },
    async handleGetSet() {
      const { success, data } = await findParamSet()
      if (success) {
        // 投料口阈值数据
        this.feedLackList = data.tlk
      }
    },
    filterScaleBg(data) {
      let str = ''
      this.feedLackList.map((el) => {
        if (el.materialPortNo === data.materialPortNo && data.degree < el.materialPortThreshold) {
          str = 'error'
        }
      })
      return str
    },
    async getDisAreaInfo() {
      const { data, success } = await disAreaInfo({
        pageNum: 1,
        pageSize: 10
      })
      if (success) {
        this.pitArea = data.list
      }
    },
    async getDoorQueue() {
      const { success, data } = await findDoorQueue({
        pageNum: 1,
        pageSize: 20
      })
      // console.log('-------', data.list['0'].license.split(','))
      success && this.truckList.forEach((el) => {
        data.list.map((item) => {
          if (item.doorNo.includes(el.sort)) {
            el.children = item.license ? item.license?.split(',') : []
          }
        })
      })
    },
    async getDisDeviceInfo() {
      const { success, data } = await readDriveData()
      success && this.talonList.forEach((ele, index) => {
        ele.info = data.find(el => el?.deviceId.includes(index + 1))
      })
    },
    async getfaultData() {
      const { success, data } = await findDeviceFaultList({
        pageNum: 1,
        pageSize: 50,
        notEnd: 1
      })
      if (success) {
        this.faultTableData = data.list
      }
    },
    filterStatuStyle(key) {
      let str = ''
      switch (key) {
        case '1':
          str = 'open'
          break
        case '0':
          str = 'close'
          break
        default:
          break
      }
      return str
    },
    filterDoorState(key) {
      // 打开到位、关闭到位、打开中、关闭中、故障
      let val = ''
      switch (key) {
        case 0:
          val = 'normal'
          break
        case 1:
          val = 'starving'
          break
        case 2:
          val = 'error'
          break
        default:
          val = 'error'
          break
      }
      return val
    },
    filterPortState(key) {
      // 显示每个投料口的当前状态(是否可用?)
      let str = ''
      switch (key) {
        case 1:
          str = 'opened'
          break
        case 2:
          str = 'closed'
          break
        case 3:
          str = 'opening'
          break
        case 4:
          str = 'closeing'
          break
        default:
          str = 'failure'
          break
      }
      return str
    },
    filterdoorFill(key) {
      if (key >= 20) { // 缺料阈值
        return 'success'
      } else {
        return 'error'
      }
    },
    /**
     * @val 位置信息 x,y,z 长,宽,高
     * @type 大车 dc / 小车 xc / 垃圾爪 ljz
     * 直角坐标系, 坐标点 - 左上前角
     */
    filterDisScale(data, type) {
      const val = data.info
      const width = this.disArea.totalWidth + 8
      if (type === 'dc') { // 0 - 98%  0点为-8m
        const num = Math.round(val.x / width * 10000) / 100
        return { left: ((num > 98) && (val.x <= width)) ? '98%' : (num + '%') }
      }
      if (type === 'xc') { // 93% - 0
        const num = Math.round(val.y / this.disArea.height * 10000) / 100
        const resNum = 93 - num
        return { top: ((resNum < 0) && (val.y <= this.disArea.height)) ? '0' : (resNum + '%') }
      }
      if (type === 'ljz' || type === 'line') {
        /**
         * x: 0     -   97%
         * y: 0     -   85%
         * z: 86.8px  到  -86.8px
         */
        const left = Math.round((val.x - 8) / this.disArea.totalWidth * 10000) / 100
        const top = Math.round(val.z / this.disArea.deep * 10000) / 100
        // 0 - 173.6(187.6-7*2)
        const tlzRace = (val.y / this.disArea.height) * 187.6 // 同步修改 93.8/86.8
        // 减去 7 是小车高度的一半(使线居中)
        const tlz = tlzRace > 93.8 ? '-' + (tlzRace - 93.8 + 7) : (93.8 - tlzRace - 7)
        // 超出y的范围 设置
        // let tlzRes = ''
        // switch (tlz) {
        //   case tlz > 86.8:
        //     tlzRes = 'translateZ(86.8px)'
        //     break
        //   case tlz < -86.8:
        //     tlzRes = 'translateZ(-86.8px)'
        //     break
        //   default:
        //     tlzRes = `translateZ(${tlz}px)`
        //     break
        // }
        const style = type === 'ljz' ? {
          left: left > 97 ? '97%' : (left + '%'),
          top: top > 85 ? '85%' : (top + '%'),
          transform: `translateZ(${tlz}px)`
        } : {
          left: left > 97 ? '97%' : (left + '%'),
          height: top > 85 ? '85%' : (top + '%'),
          transform: `translateZ(${tlz}px)`
        }
        return style
      }
      if (type === 'arrow') {
        const num = Math.round((val.x - 8) / this.disArea.totalWidth * 10000) / 100
        return { left: ((num > 98) && (val.x <= width)) ? '98%' : (num + '%') }
      }
    },
    async handleGetPortList() {
      // 正在投料的投料口
      const res = await tlState()
      res.data.map((current) => {
        this.feedingList.push(current.materialPortNo)
      })
      // 投料口数据
      const { success, data } = await findPutMaterialPortList({
        pageNum: 1,
        pageSize: 10
      })
      if (success) {
        this.feedPort = data.list
        // 正在投料的投料口 监控地址
        // this.filterfeedData.length = 0
        // data.list.map((el, index) => {
        //   if (index === 0) {
        //     this.filterfeedData.push({
        //       materialPortName: '全视图',
        //       url: el.fullViewRtsp
        //     })
        //   }
        //   if (!this.feedingList.includes(el.materialPortNo)) return
        //   this.filterfeedData.push({
        //     materialPortName: el.materialPortName + ' - 左',
        //     url: el.leftRtsp
        //   })
        //   this.filterfeedData.push({
        //     materialPortName: el.materialPortName + ' - 右',
        //     url: el.rightRtsp
        // })
        // })
        // 轮播
        // this.currentUrl = 0;
        // (this.filterfeedData.length > 1) && setInterval(() => {
        //   this.currentCamera = false
        //   setTimeout(() => {
        //     if (this.currentUrl + 1 < this.filterfeedData.length) {
        //       this.currentUrl = this.currentUrl + 1
        //     } else {
        //       this.currentUrl = 0
        //     }
        //     this.currentCamera = true
        //   }, 100)
        // }, 5000)
      }
    },
    showPortStatus(key) {
      let str = ''
      switch (key) {
        case '1':
          str = 'open'
          break
        case '0':
          str = 'close'
          break
        default:
          break
      }
      return str
    },
    handleShowPort(data) {
      console.log('------------', data)
      this.portShow = true
    },
    handleVideoClick(url, name) {
      if (!url) return
      this.currentDialogRtsp = url
      this.currentTlkDialogTitle = name
      this.tlkVisible = true
    },
    handleTlkDialogClose() {
      this.tlkVisible = false
      this.currentDialogRtsp = ''
      this.currentTlkDialogTitle = ''
    },
    handleDealCharData() {
      const orginArr = charData.result
      const len = orginArr.length
      for (let i = 0; i < len / 5; i++) {
        // if (orginArr[i].z > 19) continue
        this.charArr.push([orginArr[4 * i].x, orginArr[4 * i].y, orginArr[4 * i].z])
      }
    },
    async handleShowPitChar() {
      const { success, result } = await getPointCloud()
      if (success) {
        const len = result.length
        this.charArr.length = 0
        for (let i = 0; i < len / 5; i++) {
          // if (result[i].z > 20) continue
          this.charArr.push([result[4 * i].x, result[4 * i].y, result[4 * i].z])
        }

        // this.handleDealCharData()
        setTimeout(() => {
          glChar(this.pitChar, this.charArr)
        // glBottomChar(this.pitBottomChar, this.charArr)
        }, 3000)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@keyframes warn {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0.1;
  }
}
@keyframes moveForward {
  0% {
    top: -300%;
  }
  100% {
    top: 0;
  }
}
@keyframes moveBackward {
  0% {
    top: 0;
  }
  100% {
    top: -300%;
  }
}
.el-divider--horizontal {
  margin: 5px 0;
}
.center-main {
  /* 长宽高 - *7; filterDisScale里的 134 要改; */
  $pit-multiple: 7; // 不能用在calc()里

  $pit-long: 849.8px; // 121.4
  $pit-wide: 187.6px; // 26.8 134
  $pit-height: 224px; // 32
  $pit-realHeight: 175px;  // 25
  position: relative;

  .pit-show {
    width: 80%;
    height: 300px;
    margin: 0 auto;
    border: 1px solid #fff;
  }
  .per-view {
    perspective: 550px;
  }
  .container {
    width: $pit-long;
    height: $pit-height;
    margin: 60px auto 80px;
    /* 指示元素的子元素应位于 3D 空间中 */
    transform-style: preserve-3d;
    /* 为了让其更有立体效果 */
    transform: rotateX(-30deg);
    .face {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      position: absolute;
      backface-visibility: inherit;
      font-size: 24px;
      color: #fff;
      .bg-map {
        width: 100%;
        height: 100%;
        &.after {
          transform: rotateY(180deg);
        }
        &.right {
          transform: rotateY(180deg);
        }
        &.left {
          transform: rotateY(180deg);
        }
        &.bottom {
          transform: rotateX(180deg);
        }
        img {
          width: 100%;
          height: 100%;
          display: block;
        }
      }

    }
    .face:nth-child(1), .face:nth-child(2), .face-other {
      width: $pit-long;
      height: $pit-realHeight;
    }
    .face:nth-child(3), .face:nth-child(4) {
      width: $pit-wide;
      height: $pit-realHeight;
      pointer-events: none;
    }
    .face:nth-child(5), .face:nth-child(6) {
      width: $pit-long;
      height: $pit-wide;
    }
    .face-other {
      bottom: 0;
      transform: rotateY(180deg) translateZ(-($pit-wide / 2 - 1));
      pointer-events: none;
      opacity: 0.8;
      img {
        filter: drop-shadow(16px -8px 20px #000);
      }
    }
    /* 宽的一半 */
    .face:nth-child(1) {
      height: 0;
      bottom: 0;
      transform: translateZ($pit-wide / 2);
      background-color: rgba(0,0,0,.1);
      .port-all {
        @include flex(space-evenly);
        position: absolute;
        bottom: 45.5px; // 黑边高度的一半
        left: 0;
        width: 100%;
        height: 40px;
        .port {
          position: relative;
          width: 20px;
          height: 100%;
          border: 2px solid #000;
          background-color: #2a1c13;
          font-size: 16px;
          &.open {
            color: $state-success;
          }
          &.close {
            color: $state-error;
          }
          .port-pot {
            position: absolute;
            top: 0;
            left: 50%;
            width: 8px;
            height: 8px;
            transform: translate(-50%, -50%);
            border-radius: 50%;
            border: 1px solid #000;
            background-color: #fff;
            &.opened {
              background-color: $state-success;
            }
            &.opening {
              background-color: $state-success;
              animation: warn 1s linear 0s infinite;
            }
            &.closeing {
              background-color: red;
              animation: warn 1s linear 0s infinite;
            }
            &.closed {
              background-color: red;
            }
            &.failure {
              background-color: $state-warning;
            }
          }
          .port-text {
            @include flex(center);
            width: 100%;
            height: 100%;
          }
          .truck {
            font-size: 24px;
            color: $state-warning;
            &:first-child {
              color: $state-success;
            }
          }
        }
      }
      .port-footer {
        width: 100%;
        height: calc(#{$pit-multiple} * 13px); // 同步修改 port-all的bottom
        background-color: #000;
      }
    }
    .face:nth-child(2) {
      bottom: 0;
      transform: rotateY(180deg) translateZ($pit-wide / 2);
      background: url(~@/assets/bg_pit.jpg);
      background-size: 100% 100%;
      background-position: 50%;
      pointer-events: none; // 事件穿透
      .scale-all {
        @include flex;
        position: absolute;
        top: -30px;
        left: calc(#{$pit-multiple} * -3px);
        width: 100%;
        height: 30px;
        transform: rotateY(180deg);
        .scale {
          position: relative;
          width: calc(#{$pit-multiple} * 16px);
          height: 100%;
          margin-right: calc(#{$pit-multiple} * 17px);
          border-left: 1px solid #fff;
          border-right: 1px solid #fff;
          border-top: 1px solid #fff;
          text-align: center;
          pointer-events: auto;
          cursor: pointer;
          &.open {
            color: $state-success;
          }
          &.close {
            color: $state-error;
          }
          .scale-bg {
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 100%;
            /* color: ; */
            /* background-color: $state-warning; */
            &.error {
              /* background-color: red; */
              color: red;
            }
          }
          .scale-text {
            @include flex(center);
            position: absolute;
            top: -30px;
            width: 100%;
            height: 100%;
          }
          .scale-pop {
            position: absolute;
            left: -50%;
            bottom: 100%;
            width: 200%;
            height: 50px;
            overflow: hidden;
            img {
              width: 50%;
              height: 100%;
            }
          }
        }
        .scale:last-child {
          margin-right: 0;
        }
      }
      .area-all {
        @include flex;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 25px;
        transform: rotateY(180deg);
        border-right: 2px solid #000;
        box-sizing: border-box;
        font-size: 18px;
        color: #000;
        .area {
          width: 10%;
          height: 100%;
          line-height: 25px;
          border-left: 2px solid #000;
          text-align: center;
        }
      }
    }
    /* 长 - 宽的一半 */
    .face:nth-child(3) {
      bottom: 0;
      transform: rotateY(90deg) translateZ($pit-long - $pit-wide / 2);
      background: url(~@/assets/bg_pit.jpg);
      background-size: 100% 100%;
      background-position: 50%;
    }
    /* 宽的一半 */
    .face:nth-child(4) {
      bottom: 0;
      transform: rotateY(-90deg) translateZ($pit-wide / 2);
      background: url(~@/assets/bg_pit.jpg);
      background-size: 100% 100%;
      background-position: 50%;
    }
    .face:nth-child(5) {
      /* height: 0; */
      /* width: calc($pit-long + 8px * 7); // 无效 */
      width: calc(#{$pit-long} + 8px * #{$pit-multiple});
      top: -93px;
      left: calc(#{$pit-multiple} * -8px);
      transform: rotateX(90deg) translateZ(0);
      background-color: rgba(0,0,0, 0);
      border: 2px solid #000;
      pointer-events: none;
      .crane-move {
        cursor: pointer;
        pointer-events: auto;
      }
    }
    /* 高 - 宽的一半 */
    .face:nth-child(6) {
      bottom: 0;
      transform: rotateX(-90deg) translateZ($pit-realHeight - $pit-wide / 2);
      background: url(~@/assets/bg_pit.jpg);
      background-size: 100% 100%;
      background-position: 50%;
    }
    .test {
      position: absolute;
      left: 0;
      width: 48px;
      height: $pit-wide; /* 宽 */
      /* background-color: #792f0f; */
      /* padding-left: 12px; */
      /* border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px; */
      /* border: 3px solid #792f0f; */
      box-sizing: border-box;
      font-size: 36px;
      opacity: 0.8;
      /* transition: all 4s; */
      .sort {
        width: 24px;
        height: $pit-wide;
        margin-left: 12px;
        /* border-bottom-left-radius: 5px; */
        /* border-bottom-right-radius: 5px; */
        background-color: $state-success;
        &.open {
          background-color: $state-success;
        }
        &.close {
          background-color: #808080;
        }
      }
      .num {
        @include flex(center);
        position: absolute;
        top: 0;
        left: 12px;
        width: 24px;
        height: $pit-wide;
      }
      .flick {
        position: absolute;
        top: 0;
        width: 12px;
        height: 100%;
        background-color: $state-warning-dark;
        &.left {
          left: 0;
        }
        &.right {
          right: 0;
        }
        &.start {
          animation: warn .5s linear 0s infinite;
        }
        &.limit {
          background-color: #f00;
        }
      }
      .arrow-box {
        position: absolute;
        top: 0;
        left: 12px;
        width: 24px;
        height: $pit-wide;
        overflow: hidden;
        .arrow-pot {
          position: absolute;
          width: 24px;
          height: 15px;
          font-size: 24px;
          color: #f00;
          background-color: #800;
          overflow: hidden;
          &.up {
            bottom: 0;
          }
          &.down {
            top: 0;
            height: 30px;
          }
        }
      }
      .arrow-move {
        position: absolute;
        top: 0;
        left: 0;
        width: 24px;
        height: 100%;
        color: #fff;
        .arrow-item {
          display: block;
          font-size: 24px;
        }
        &.forward {
          animation: moveForward 8s linear 0s infinite;
        }
        &.backward {
          animation: moveBackward 8s linear 0s infinite;
        }
        &.limit-for {
          color: #f00;
        }
        &.limit-back {
          color: #f00;
        }
      }
    }
    .test-child {
      position: absolute;
      top: 10px;
      left: 12px;
      width: 24px;
      height: 14px;
      background-color: rgba($color: #2a1c13, $alpha: .6);
      border-radius: 5px;
      font-size: 16px;
      /* transition: all 4s; */
    }
    .talon {
      width: 48px;
      height: 48px;
      margin-top: -8px;
      margin-left: 0; // 图标的空白部分
      transform: translateZ($pit-wide / 2);
      color: #411c18;
      /* font-size: 24px; */
      cursor: pointer;
      /* transition: all 4s; */
    }
    .talon-line {
      position: absolute;
      width: 2px;
      height: 1px;
      margin-left: 22px;
      background-color: black;
      /* transition: all 4s; */
    }
    .arrow-list {
      position: absolute;
      width: 36px;
      height: 36px;
      margin-left: 6px;
      transform: translateZ($pit-wide / 2);
      .arrow {
        position: absolute;
        top: 0;
        left: 0;
        width: 36px;
        height: 36px;
        /* transform: rotateX(-90deg); */
        font-size: 36px;
        color: green;
        &.limit {
          color: red;
        }
      }
      .arrow-tips {
        position: absolute;
        top: -20px;
        width: fit-content;
        color: #000;
      }
    }
  }
  .out-trucks {
    @include flex(space-evenly);
    position: relative;
    top: -40px;
    width: $pit-long;
    height: 8px;
    margin: 0 auto;
    transform: scaleX(1.08);
    .door {
      width: 20px;
      cursor: pointer;
      .truck {
        font-size: 24px;
        color: $state-warning;
        &:first-child {
          color: $state-success;
        }
      }
    }
  }
  .feed-video {
    position: absolute;
    top: -172px;
    left: -110px;
    width: 226px;
    height: 137px;
    border: 1px solid;
    border-radius: 4px;
    background-color: #eee;
    box-sizing: border-box;
    .feed-video-item {
      /* position: relative; */
      width: 100%;
      height: 100%;
      cursor: pointer;
      .feed-video-title {
        @include flex(center);
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 25px;
        background-color: rgba($color: #000000, $alpha: .1);
        color: $state-success;
        font-size: 24px;
      }
    }
  }
}
.talon-container {
  width: 48px;
  height: 48px;
  overflow: hidden;
  .talon-content {
    width: 48px;
    height: 100px;
    font-size: 48px;
    color: $state-success-dark;
    &.close {
      margin-top: -55px;
      color: red;
    }
  }
}
.tasktable-status {
  &.prepare {
    color: ghostwhite;
  }
  &.issue {
    color: $state-error;
  }
  &.issued {
    color: $state-warning;
  }
  &.doing {
    color: $state-information;
  }
  &.done {
    color: $state-success;
  }
}
</style>
