<template>
  <div class="center-main">
    <div class="center-container">
      <centerSence />

    </div>
    <div style="width: 100%; margin: 0 auto">
      <dataCard height="195">
        <div class="task-table">
          <div class="task-table-title" @click="isTask = true">垃圾吊任务表</div>
          <div class="task-table-title">|</div>
          <div class="task-table-title" @click="isTask = false">任务计算过程</div>
        </div>
        <nativeTable v-if="isTask" :table-data="taskTableData" :table-column="taskTableColumn" :max-height="111">
          <template #craneNo="scope">
            {{ filterCraneNo(scope.row.craneNo) }}
          </template>
          <template #taskType="scope">
            {{ filterDisCraneTaskType(scope.row.taskType) + filterTl(scope.row.taskType, scope.row.materialPortNo) }}
          </template>
          <template #executionType="scope">
            {{ filterDisCraneExecutionType(scope.row.executionType) + filterTl(scope.row.executionType, scope.row.materialPortNo) }}
          </template>
          <template #startPointX="scope">
            {{ `${numTofixed(scope.row.startPointX + 8.8)},${numTofixed(scope.row.startPointY - 1.5)},${numTofixed(37 - scope.row.startPointZ)}` }}
          </template>
          <template #x1="scope">
            {{ `${numTofixed(scope.row.x1 + 8.8)},${numTofixed(scope.row.y1 - 1.5)},${numTofixed(37 - scope.row.z1)}` }}
          </template>
          <template #x2="scope">
            {{ `${numTofixed(scope.row.x2 + 8.8)},${numTofixed(scope.row.y2 - 1.5)},${numTofixed(37 - scope.row.z2)}` }}
          </template>
          <template #taskStatus="scope">
            <div :class="['tasktable-status', taskStatusClass(scope.row.taskStatus)]">{{ filterDisCraneTaskStatus(scope.row.taskStatus) }}</div>
          </template>
        </nativeTable>
        <nativeTable v-else :table-data="taskLogTableData" :table-column="taskLogTableColumn" :max-height="111">
          <template #craneNo="scope">
            {{ filterCraneNo(scope.row.craneNo) }}
          </template>
          <template #status="scope">
            <div style="color: #fda64a;">{{ taskFilter[scope.row.status] }}</div>
          </template>
        </nativeTable>
      </dataCard>
    </div>
    <!-- 设备异常表 -->
    <div style="width: 100%; margin: 0 auto">
      <dataCard height="195" title="异常告警">
        <div class="fault-box">
          <nativeTable style="width: 49%;" :table-data="faultTableData[0]" :table-column="faultTableColumn1" :max-height="111">
            <template #deviceName="scope">
              <div>{{ scope.row.deviceName ? scope.row.deviceName : scope.row.deviceNo }}</div>
            </template>
            <template #faultCode="scope">
              <div style="color: #f56c68;">{{ scope.row.faultCode }}</div>
            </template>
          </nativeTable>
          <nativeTable style="width: 49%;" :table-data="faultTableData[1]" :table-column="faultTableColumn2" :max-height="111">
            <template #deviceName="scope">
              <div>{{ scope.row.deviceName ? scope.row.deviceName : scope.row.deviceNo }}</div>
            </template>
            <template #faultCode="scope">
              <div style="color: #f56c68;">{{ scope.row.faultCode }}</div>
            </template>
          </nativeTable>
        </div>
      </dataCard>
    </div>
  </div>
</template>

<script>
import { findTaskList, findTaskLog } from '@/api/disCrane'
import dataCard from '@/components/dataCard'
import nativeTable from '@/components/nativeTable'
import { filterDisCraneTaskType, filterDisCraneExecutionType, filterDisCraneTaskStatus, filterDeviceType } from '@/utils/filter'
import { findDeviceFaultList } from '@/api/device'
import centerSence from './component/3dSence'

// import WebrtcPlayer from '@/components/webrtc/webrtcPlayer.vue'

export default {
  name: 'DashboardCenter',
  components: { dataCard, nativeTable, centerSence },
  inject: ['parent'],
  data() {
    return {
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
          label: '起点位置',
          key: 'startPointX'
        },
        {
          label: '任务位置1',
          key: 'x1'
        },
        {
          label: '任务位置2',
          key: 'x2'
        },
        {
          label: '任务编号',
          prop: 'taskNo'
        },
        {
          label: '状态',
          key: 'taskStatus'
        }
      ],
      bgShow: true,
      faultTableData: [],
      faultTableColumn1: [
        {
          label: '卸料大厅告警',
          key: 'deviceName'
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
      faultTableColumn2: [
        {
          label: '垃圾坑内告警',
          key: 'deviceName'
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
      timer1: null,
      timer2: null,
      faultOptions: [
        { text: '抬杆', value: 'TG' },
        { text: '卸料门', value: 'XLM' },
        { text: '行车', value: 'HC' },
        { text: '爪吊', value: 'ZD' },
        { text: '摄像头', value: 'SXT' },
        { text: 'LED灯', value: 'LED' },
        { text: '电机设备', value: 'DJ' },
        { text: '雷达设备', value: 'LD' },
        { text: '语音播报设备', value: 'YYBB' }
      ],
      faultFilter: [
        ['TG', 'XLM', 'LED', 'YYBB'],
        ['HC', 'ZD', 'DJ', 'LD', 'AREA', '自动计算状态']
      ],
      taskLogTableData: [],
      taskLogTableColumn: [
        {
          label: '行车',
          key: 'craneNo'
        },
        {
          label: '任务名称',
          prop: 'taskName'
        },
        {
          label: '任务类型',
          prop: 'taskType'
        },
        {
          label: '任务编号',
          prop: 'taskNo'
        },
        {
          label: '时间',
          prop: 'createTime'
        },
        {
          label: '备注',
          prop: 'remarks'
        },
        {
          label: '状态',
          key: 'status'
        }
      ],
      isTask: true,
      taskFilter: ['错误', '计算中', '有任务', '无任务']
      // filterStatus: []
    }
  },
  watch: {
    'parent.taskLogInfo': {
      handler(newVal, oldVal) {
        newVal && this.getTaskLogList()
      },
      deep: true
    }
  },
  created() {
    this.getTaskList() // 任务记录
    this.getfaultData() // 设备异常
    this.getTaskLogList() // 调度任务计算记录
    // this.timer1 = setInterval(() => {
    //   this.getfaultData() // 设备异常
    // }, 60000)
    this.timer2 = setInterval(() => {
      this.getTaskList() // 任务记录
      this.getfaultData() // 设备异常
    }, 5000)
  },
  mounted() {
  },
  beforeDestroy() {
    // clearInterval(this.timer1)
    clearInterval(this.timer2)
  },
  methods: {
    filterDisCraneTaskType,
    filterDisCraneExecutionType,
    filterDisCraneTaskStatus,
    filterDeviceType,
    numTofixed(val) {
      if (typeof val !== 'number') {
        val = parseFloat(val)
      }
      return val.toFixed(2)
    },
    filterCraneNo(str) {
      return str.match(/\d/g)?.join('') || ''
    },
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
    filterTl(type, portNo) {
      let str = ''
      if (type === 'TL') {
        str = ' - ' + portNo.slice(-2)
      }
      return str
    },
    async getTaskList(val) {
      // 数据改变,重新获取数据
      // val && Object.assign(this.tableForm, val)
      const { data, success } = await findTaskList({
        pageNum: 1,
        pageSize: 20
      })
      if (success) {
        this.taskTableData = data.list.filter((el) => el.taskStatus === '1' || el.taskStatus === '2')
      }
    },
    async getfaultData() {
      const { success, data } = await findDeviceFaultList({
        pageNum: 1,
        pageSize: 50,
        notEnd: 1
      })
      if (success) {
        this.faultTableData = [[], []]
        data.list.map((el) => {
          const conditions = this.faultFilter[1].includes(el.deviceType) || el.deviceNo.includes('TLK')
          if (conditions) {
            this.faultTableData[1].push(el)
          } else {
            // if (el.deviceType === 'XLM' && this. .includes(el.faultType)) {

            // }
            this.faultTableData[0].push(el)
          }
        })
      }
    },
    async getTaskLogList() {
      const { data, success } = await findTaskLog()
      if (success) {
        this.taskLogTableData = data
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
  .center-container {
    width: 100%;
    height: 400px;
    /* height: 700px; */
  }
  .pit-show {
    width: 80%;
    height: 300px;
    margin: 0 auto;
    border: 1px solid #fff;
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
.task-table {
  @include flex;
  margin-left: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  .task-table-title {
    margin-right: 15px;
    cursor: pointer;
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
.fault-box {
  @include flex(space-between);
}
</style>
