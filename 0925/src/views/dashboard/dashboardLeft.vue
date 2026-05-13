<template>
  <div class="left-main">

    <dataCard height="400">
      <div class="sala-card-title">
        <div class="title">垃圾接收大厅</div>
        <el-button type="primary" size="medium" style="padding: 10px" @click="handleOpenSalaPage">查看大厅详情</el-button>
        <el-button type="primary" size="medium" style="padding: 10px" @click="handleOpenFeedPortPage">查看投料口详情</el-button>
      </div>
      <div class="sala">
        <div class="sala-top">
          <svg-icon icon-class="strobe" class="strobe" />
          <span>进厂道闸状态</span>
          <!-- 打开到位、关闭到位、打开中、关闭中、故障 -->
          <span :class="['value', filterStrobeClass(strobeStatus)]">{{ filterStrobeStatus(strobeStatus) }}</span>
        </div>
        <div class="sala-top">
          <svg-icon icon-class="car" class="strobe" />
          <span>大厅已有车辆</span>
          <span class="value">{{ carCount }}</span>
        </div>
        <div class="sala-top">
          <!-- <svg-icon icon-class="plate" class="strobe" /> -->
          <div style="font-weight: 700;">车辆卸料实时信息</div>
          <!-- <span class="value">{{ currentPlate }}</span> -->
          <!-- <div class="sala-table"> -->
          <el-table
            :data="tableData"
            stripe
            :row-key="(row) => row.id"
            style="max-width: 98%"
          >
            <el-table-column
              label="车牌"
              prop="current"
            />
            <el-table-column
              label="卸料门"
              align="center"
            >
              <template slot-scope="scope">
                {{ scope.row.doorNo.slice(-2) }}
              </template>
            </el-table-column>
            <el-table-column
              label="状态"
            >
              <template slot-scope="scope">
                <div :class="['table-status', filterCarStatus(scope.row.status)]">{{ scope.row.status }}</div>
              </template>
            </el-table-column>
          </el-table>
          <!-- </div> -->
        </div>
      </div>
    </dataCard>
    <dataCard height="300" title="卸料门监控">
      <!-- <div v-if="doorCameraUrlList[currentUrl]" class="video-content">
        <video-test v-if="currentCamera" :rtsp="doorCameraUrlList[currentUrl].doorCameraUrl" />
      </div>
      <div class="camera-box">
        <div class="camera-list">
          <div v-for="(item, index) in doorCameraUrlList" :key="item.doorNo" :class="['camera-item', {'current': currentUrl === index}]" @click="changeCurrent(index)">
            {{ item.name }}
          </div>
        </div>
      </div> -->
      <el-carousel indicator-position="outside" trigger="click" height="200px" :interval="5000" @change="handleCarouselChange">
        <el-carousel-item v-for="item in doorCameraUrlList" :key="item.doorNo" :label="item.doorNo.slice(-2)">
          <div style="width: 100%; height: 100%; cursor: pointer;" @click="handleVideoClick(item.doorCameraUrl, item.doorNo.slice(-2))">
            <video-test :rtsp="item.doorCameraUrl" />
          </div>
        </el-carousel-item>
      </el-carousel>
    </dataCard>

    <el-dialog
      :title="'卸料门摄像头 - ' + currentXlmDialogTitle"
      :visible.sync="xlmVisible"
      width="70%"
      :modal="false"
      :destroy-on-close="true"
      @close="handleXlmDialogClose"
    >
      <video-test v-if="currentDialogRtsp" :rtsp="currentDialogRtsp" />
    </el-dialog>
  </div>
</template>

<script>
import dataCard from '@/components/dataCard'
import SvgIcon from '@/components/SvgIcon'
import { findCarCount, findCarInOutList, findDoorQueue } from '@/api/car'
import { getTgState } from '@/api/device'
import videoTest from './component/jsmpegVideo.vue'
import { getDoorCameraUrl } from '@/api/xlm'

export default {
  name: 'DashboardLeft',
  components: { dataCard, SvgIcon, videoTest },
  data() {
    return {
      strobeStatus: '',
      carCount: 0,
      currentPlate: '',
      tableData: [],
      currentUrl: 0,
      doorCameraUrlList: [],
      currentCamera: true,
      xlmVisible: false,
      currentDialogRtsp: '',
      currentXlmDialogTitle: '',
      timer: null
    }
  },
  mounted() {
    this.getCarCount()
    this.getStrobe()
    this.getDoorQueue()
    // this.getRecentlyCar()
    this.handleGetDoorCameraUrl()
    this.timer = setInterval(() => {
      this.getCarCount()
      this.getStrobe()
      this.getDoorQueue()
    }, 10000)
  },
  beforeDestroy() {
    clearInterval(this.timer)
  },
  methods: {
    filterStrobeStatus(key) {
      // 1：打开到位 2：关闭到位 3：打开中 4：关闭中 5：故障
      let str = ''
      switch (key) {
        case '1':
          str = '打开到位'
          break
        case '2':
          str = '关闭到位'
          break
        case '3':
          str = '打开中'
          break
        case '4':
          str = '关闭中'
          break
        case '5':
          str = '故障'
          break
        default:
          break
      }
      return str
    },
    filterStrobeClass(key) {
      let str = ''
      switch (key) {
        case '1':
          str = 'opened'
          break
        case '2':
          str = 'closed'
          break
        case '3':
          str = 'open'
          break
        case '4':
          str = 'close'
          break
        case '5':
          str = 'error'
          break
        default:
          break
      }
      return str
    },
    async getCarCount() {
      const { data, success } = await findCarCount()
      success && (this.carCount = data)
    },
    async getStrobe() {
      const { data, success } = await getTgState()
      success && (this.strobeStatus = data[0]?.status)
    },
    async getRecentlyCar() {
      const { data, success } = await findCarInOutList({
        starTime: '',
        endTime: '',
        pageNum: 1,
        pageSize: 1
      })
      success && (this.currentPlate = data.list[0].license)
    },
    async getDoorQueue() {
      const { success, data } = await findDoorQueue({
        pageNum: 1,
        pageSize: 20
      })
      if (success) {
        this.tableData = []
        data.list.map((el) => {
          // 提取车牌
          el.license && el.license.split(',').map((ele, index) => {
            this.tableData.push({
              id: index.toString() + el.id,
              doorNo: el.doorNo,
              current: ele,
              status: index === 0 ? '正在卸料' : '等待卸料'
            })
          })
          // 监控地址
          // el.license && this.doorCameraUrlList.push({
          //   name: el.doorNo.slice(-2),
          //   doorNo: el.doorNo,
          //   doorCameraUrl: el.doorCameraUrl
          // })
        })
        // this.currentUrl = 0;
        // (this.doorCameraUrlList.length > 1) && setInterval(() => {
        //   this.currentCamera = false
        //   setTimeout(() => {
        //     if (this.currentUrl + 1 < this.doorCameraUrlList.length) {
        //       this.currentUrl = this.currentUrl + 1
        //     } else {
        //       this.currentUrl = 0
        //     }
        //     this.currentCamera = true
        //   }, 100)
        // }, 5000)
      }
    },
    async handleGetDoorCameraUrl() {
      const { success, data } = await getDoorCameraUrl()
      if (success) {
        this.doorCameraUrlList = data
      }
    },
    filterCarStatus(key) {
      let val = ''
      switch (key) {
        case '正在卸料':
          val = 'current'
          break
        case '等待卸料':
          val = 'wait'
          break
        default:
          break
      }
      return val
    },
    changeCurrent(index) {
      if (this.currentUrl !== index) {
        this.currentCamera = false
        setTimeout(() => {
          this.currentUrl = index
          this.currentCamera = true
        }, 100)
      }
    },
    handleOpenSalaPage() {
      this.$router.push(`sala`)
    },
    handleOpenFeedPortPage() {
      this.$router.push(`feedPort`)
    },
    handleCarouselChange(val) {
      this.currentUrl = val
    },
    handleVideoClick(url, name) {
      if (!url) return
      this.currentDialogRtsp = url
      this.currentXlmDialogTitle = name
      this.xlmVisible = true
    },
    handleXlmDialogClose() {
      this.xlmVisible = false
      this.currentDialogRtsp = ''
      this.currentXlmDialogTitle = ''
    }
  }
}
</script>

<style lang="scss" scoped>
.left-main {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  height: 100%;
  /* grid-row-gap: 20px; */
  .sala {
    margin-top: 8px;
    .sala-top {
      line-height: 30px;
      font-size: 14px;
      .strobe {
        margin-right: 5px;
        font-size: 24px;
        /* color: red; */
        vertical-align: sub;
      }
      .value {
        margin-left: 5px;
        /* font-size: 12px; */
        &.opened {
          color: $state-success;
        }
        &.closed {
          color: $state-information;
        }
        &.open {
          color: $state-warning;
        }
        &.close {
          color: $state-error;
        }
        &.error {
          color: red;
        }
      }
    }
  }
}
.table-status {
  &.current {
    color: $state-success;
  }
  &.wait {
    color: $state-warning;
  }
}
.sala-card-title {
  .title {
    margin-left: 8px;
    margin-bottom: 10px;
    font-size: 18px;
    font-weight: 700;
  }
}
::v-deep .el-carousel__indicators--labels .el-carousel__indicator {
  .el-carousel__button {
    padding: 2px 10px;
    font-size: 14px;
    font-weight: 600;
  }
}
::v-deep .el-carousel__indicators--outside button {
  background-color: #fff;
  color: $state-success;
}
.video-content {
  width: 100%;
  height: 80%;
}
.camera-box {
  width: 100%;
  overflow-x: auto;
  /* 滚动条宽度 */
  &::-webkit-scrollbar {
    width: 6px;
    height: 8px;
    background-color: transparent;
  }

  /* 滚动条颜色 */
  &::-webkit-scrollbar-thumb {
    background-color: rgba(28,81,148,0.6);
    border-radius: 10px;
  }
}
.camera-list {
  @include flex;
  .camera-item {
    padding: 2px 5px;
    margin-right: 5px;
    border: 1px solid #fff;
    line-height: 20px;
    cursor: pointer;
    &.current {
      border-color: $state-success;
      color: $state-success;
    }
    &:hover {
      border-color: $state-success;
    }
  }
}
::v-deep .el-table {
  color: $word-normal;
  background-color: transparent;
  & th>.cell {
    padding-left: 3px;
    padding-right: 3px;
  }
  & .cell {
    padding-left: 3px;
    padding-right: 3px;
  }
  & thead {
    color: $word-normal;
  }
  & th,& tr {
    background-color: rgba(25, 25, 112,0.9);
  }
  /*& td,& th.is-leaf { // 下边框
     border-bottom: none;
  }*/
  &.el-table--striped .el-table__body tr.el-table__row--striped td {
    background-color: rgba(25, 25, 112,0.8);
  }
  &.el-table--mini .el-table__body tr.hover-row:hover>td {
    background-color: rgba(25, 25, 112,0.9);
  }
  & .el-table__body tr.hover-row.current-row>td, & .el-table__body tr.hover-row.el-table__row--striped.current-row>td,  & .el-table__body tr.hover-row.el-table__row--striped>td, & .el-table__body tr.hover-row>td {
    background-color: rgba(25, 25, 112,0.9);
  }
  &.el-table--enable-row-hover .el-table__body tr:hover>td {
    background-color: rgba(25, 25, 112,0.9);
  }
  /* 滚动条 */
  & .el-table__body-wrapper {
    height: 150px;
    overflow-y: auto;
    overflow-x: hidden;
    &::-webkit-scrollbar {
      width: 5px;
      height: 5px;
      &:horizontal {
        width: 6px;
        height: 6px;
      }
    }
    /* 两个滚动条交接处 -- x轴和y轴 */
    &::-webkit-scrollbar-corner {
      background-color: $logo-main;
    }
    &::-webkit-scrollbar-thumb {
      background-color: rgba(28,81,148,0.6);
      border-radius: 3px;
    }
    &::-webkit-scrollbar-track {
      background-color: $logo-main;
      /* border-radius: 3px; */
    }
  }
  /* 空值时 */
  & .el-table__empty-block {
    width: 100% !important;
    background-color: $logo-main;
  }
  /* 下边框 */
  &::before {
    background-color: unset;
  }
}
</style>
