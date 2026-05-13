<template>
  <div ref="dashboard_main" class="dashboard-container">
    <div class="dashboard-top">
      <div class="pre-screenfull">
        <svg-icon icon-class="screenfull" class="screenfull" @click="handleFullscreen" />
        <!-- <div>
          <el-button type="primary" style="font-size: 16px; margin-top: 5px; padding: 6px 12px;">
            <a :href="BASE_URL" target="_blank">小坑页面</a>
          </el-button>
          <el-button type="primary" style="font-size: 16px; padding: 6px 12px;" size="small" @click="handleChange">轮播</el-button>
        </div> -->
      </div>
      <div class="top-title">
        <div style="height: 10px; margin-top: -15px;">垃圾储坑智能化管控系统</div>
        <div style="font-size: 21px; line-height: 120px; margin-top: 3px;">Intelligent Management System for Waste Landfill Site</div>
      </div>
      <div class="top-info">
        <!-- <el-button type="primary" style="font-size: 16px; padding: 6px 12px;" size="small" @click="changePage(1)">垃圾坑</el-button> -->
        <!-- <el-button type="primary" style="font-size: 16px; padding: 6px 12px;" size="small" @click="changePage(2)">接收大厅</el-button> -->
        <!-- <el-button type="primary" style="font-size: 16px; padding: 6px 12px;" size="small" @click="changePage(3)">数据展示</el-button> -->
        <svg-icon icon-class="arrow_left_fill" style="font-size: 24px;" @mouseover="drawer = true" />
      </div>
    </div>
    <!-- <div class="center-left">
      <dataCard class="data-card" height="300" title="行车电流趋势" overflow="unset">
        <el-select v-model="currentDevice" size="mini" class="char-select" placeholder="请选择">
          <el-option
            v-for="item in deviceOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <div id="current" style="width: 100%; height: 88%; margin-top: 10px" />
      </dataCard>
      <dataCard class="data-card" height="250" title="运行速度趋势" overflow="unset">
        <div id="speed" style="width: 100%; height: 88%;" />
      </dataCard>
      <dataCard class="data-card" height="250" title="重量趋势" overflow="unset">
        <div id="weight" style="width: 100%; height: 88%;" />
      </dataCard>
    </div> -->
    <!-- <div class="center-right">
      <dataCard class="data-card" height="300" title="每台炉入炉量" overflow="unset">
        <div id="barChar" style="width: 100%; height: 88%; margin-top: 10px" />
      </dataCard>
      <dataCard class="data-card" height="400" title="垃圾池发酵天数统计" overflow="unset">
        <div id="barChar" style="width: 100%; height: 88%; margin-top: 10px" />
      </dataCard>
    </div> -->
    <div class="dashboard-center">
      <div class="center">
        <centerSence ref="centerSence1" :current-language="language" />
        <centerData ref="centerSence2" :current-language="language" />
        <!-- <centerData2 ref="centerSence3" /> -->
      </div>
    </div>

    <el-drawer
      :visible.sync="drawer"
      :with-header="false"
      size="15%"
      :modal="false"
      style="background-color: unset;"
    >
      <div class="drawer-box">
        <el-button type="primary" style="font-size: 16px; margin: 5px 0 0; padding: 6px 12px; display: block;" size="small" @click="handleChange">{{ '轮播 / ' + 'Loop' }}</el-button>
        <el-button type="primary" style="font-size: 16px; margin: 5px 0 0; padding: 6px 12px; display: block;" size="small" @click="changePage(1)">{{ '垃圾坑 / ' + 'Waste Pit' }}</el-button>
        <el-button type="primary" style="font-size: 16px; margin: 5px 0 0; padding: 6px 12px; display: block;" size="small" @click="changePage(2)">{{ '接收大厅 / ' + 'Reception Hall' }}</el-button>
        <el-button type="primary" style="font-size: 16px; margin: 5px 0 0; padding: 6px 12px;">
          <a :href="BASE_URL" target="_blank">小坑页面 / Demo Page</a>
        </el-button>
      </div>
    </el-drawer>

  </div>
</template>

<script>
import SvgIcon from '@/components/SvgIcon'
import screenfull from 'screenfull'
import centerSence from './3dSence'
import centerData from './3dSenceCopy'
import centerData2 from './test2'
import dataCard from '@/components/dataCard'
import { barChar } from './char'
import * as echarts from 'echarts'
import { disAreaInfo } from '@/api/pitArea'
import { lineChars } from '@/views/dashboard/component/char'

export default {
  inject: ['parent'],
  components: { SvgIcon, centerSence, centerData, centerData2, dataCard },
  data() {
    return {
      current: 1,
      timer: null,
      BASE_URL: 'http://' + process.env.VUE_APP_LOCALHOST_IP + ':9001',
      fermenChar: null,
      currentChar: null,
      speedChar: null,
      weightChar: null,
      currentDevice: 'crane01',
      currentSpeedDevice: 'crane01',
      currentWeightDevice: 'crane01',
      deviceOptions: [
        {
          label: '一号',
          value: 'crane01'
        },
        {
          label: '二号',
          value: 'crane02'
        },
        {
          label: '三号',
          value: 'crane03'
        }
      ],
      showValue: 30,
      charSet: {
        fontSize: 18,
        color: '#fff'
      },
      drawer: false,
      language: true
    }
  },
  // watch: {
  //   'parent.craneList': {
  //     handler(newVal, oldVal) {
  //       this.handleLoadCurrentChar(newVal)
  //       this.handleLoadSpeedChar(newVal)
  //       this.handleLoadWeightChar(newVal)
  //     },
  //     // immediate: true,
  //     deep: true // 可以深度检测到 对象的属性值的变化
  //   }
  // },
  mounted() {
    this.$refs.centerSence2.$el.style.left = '100%'
    setTimeout(() => {
      this.handleChange()
    }, 10000)

    // this.$refs.centerSence3.$el.style.left = '100%'

    // this.fermenChar = echarts.init(document.getElementById('barChar'))
    // this.currentChar = echarts.init(document.getElementById('current'))
    // this.speedChar = echarts.init(document.getElementById('speed'))
    // this.weightChar = echarts.init(document.getElementById('weight'))
    // this.loadBarChar()
  },
  beforeDestroy() {
    clearInterval(this.timer)
  },
  methods: {
    handleFullscreen() {
      if (screenfull.isEnabled) {
        // 控制是否全屏的按钮
        screenfull.toggle(this.$refs.dashboard_main)
      }
    },
    changePage(val) {
      clearInterval(this.timer)
      this.current = val
      this.$refs.centerSence1.$el.style.left = '100%'
      this.$refs.centerSence2.$el.style.left = '100%'
      // this.$refs.centerSence3.$el.style.left = '100%'
      if (val === 1) {
        this.$refs.centerSence1.$el.style.left = 0
      }
      if (val === 2) {
        this.$refs.centerSence2.$el.style.left = 0
      }
      // if (val === 3) {
      //   this.$refs.centerSence3.$el.style.left = 0
      // }
    },
    async loadBarChar() {
      const { success, data } = await disAreaInfo({
        pageNum: 1,
        pageSize: 10
      })
      if (success) {
        const arr = [
          {
            name: '投料',
            type: 'TL',
            data: []
          },
          {
            name: '堆料',
            type: 'DL',
            data: []
          },
          {
            name: '间隔',
            type: 'JG',
            data: []
          },
          {
            name: '发酵',
            type: 'FJ',
            data: []
          }
        ]
        data.list.map((el) => {
          arr.forEach((item) => {
            if (item.type === el.areaStatus) {
              item.data.push((el.areaStatus === 'DL' && el.fermentationTime === 0) ? 1 : el.fermentationTime)
            } else {
              item.data.push(0)
            }
          })
        })
        barChar(this.fermenChar, arr)
      }
    },
    dealCharData(data, current, type) {
      const test1 = data?.filter((el) => el.deviceId === current)
      const test2 = test1?.map((el) => {
        return type === 'createTime' ? el[type].slice(11, 19) : el[type]
      })
      // console.log('-------', test1)
      return test2
    },
    handleLoadCurrentChar(data) {
      const xData = this.dealCharData(data, 'crane01', 'createTime')

      let charData = []

      const allData = [
        this.dealCharData(data, this.currentDevice, 'bigCarCurrent'),
        this.dealCharData(data, this.currentDevice, 'smallCarCurrent'),
        this.dealCharData(data, this.currentDevice, 'grabCurrent')
      ]
      charData = [
        {
          name: '大车',
          type: 'line',
          data: allData[0],
          smooth: true
        },
        {
          name: '小车',
          type: 'line',
          data: allData[1],
          smooth: true
        },
        {
          name: '抓斗',
          type: 'line',
          data: allData[2],
          smooth: true
        }
      ]

      // 加载图表
      lineChars(this.currentChar, {
        data: charData,
        xData: xData,
        showLength: this.showValue,
        yMax: null,
        color: this.charSet
      })
    },
    handleLoadSpeedChar(data) {
      const xData = this.dealCharData(data, 'crane01', 'createTime')

      let charData = []
      const allData = [
        this.dealCharData(data, this.currentDevice, 'bigCarSpeedSP'), this.dealCharData(data, this.currentDevice, 'bigCarSpeed'),
        this.dealCharData(data, this.currentDevice, 'smallCarSpeedSP'), this.dealCharData(data, this.currentDevice, 'smallCarSpeed'),
        this.dealCharData(data, this.currentDevice, 'grabSpeedSP'), this.dealCharData(data, this.currentDevice, 'grabSpeed')
      ]
      charData = [
        {
          name: '大车设定速度',
          type: 'line',
          data: allData[0],
          smooth: true,
          itemStyle: {
            color: '#000080'
          },
          lineStyle: {
            type: 'dashed'
          },
          label: {
            color: this.charSet?.color // 设置该系列的文字颜色为红色
          }
        },
        {
          name: '大车反馈速度',
          type: 'line',
          data: allData[1],
          smooth: true,
          itemStyle: {
            color: '#0000FF'
          },
          label: {
            color: this.charSet?.color // 设置该系列的文字颜色为红色

          }
        },
        {
          name: '小车车设定速度',
          type: 'line',
          data: allData[2],
          smooth: true,
          itemStyle: {
            color: '#008000'
          },
          lineStyle: {
            type: 'dashed'
          },
          label: {
            color: this.charSet?.color // 设置该系列的文字颜色为红色

          }
        },
        {
          name: '小车车反馈速度',
          type: 'line',
          data: allData[3],
          smooth: true,
          itemStyle: {
            color: '#00FF00'
          },
          label: {
            color: this.charSet?.color // 设置该系列的文字颜色为红色

          }
        },
        {
          name: '抓斗设定速度',
          type: 'line',
          data: allData[4],
          smooth: true,
          itemStyle: {
            color: '#800000'
          },
          lineStyle: {
            type: 'dashed'
          },
          label: {
            color: this.charSet?.color // 设置该系列的文字颜色为红色

          }
        },
        {
          name: '抓斗反馈速度',
          type: 'line',
          data: allData[5],
          smooth: true,
          itemStyle: {
            color: '#FF0000'
          },
          label: {
            color: this.charSet?.color // 设置该系列的文字颜色为红色

          }
        }
      ]
      // 加载图表
      lineChars(this.speedChar, {
        data: charData,
        xData: xData,
        showLength: this.showValue,
        yMax: 1.5,
        color: this.charSet,
        legendShow: true
      })
    },
    handleLoadWeightChar(data) {
      const xData = this.dealCharData(data, 'crane01', 'createTime')

      let charData = []
      const allData = this.dealCharData(data, this.currentDevice, 'grabWeight')
      charData = [
        {
          type: 'line',
          data: allData,
          smooth: true
        }
      ]
      // 加载图表
      lineChars(this.weightChar, {
        data: charData,
        xData: xData,
        showLength: this.showValue,
        yMax: null,
        color: this.charSet,
        legendShow: true
      })
    },
    handleChange() {
      this.timer = setInterval(() => {
        this.$refs.centerSence1.$el.style.left = '100%'
        this.$refs.centerSence2.$el.style.left = '100%'
        switch (this.current) {
          case 1:
            this.current = 2
            break
          case 2:
            // this.current = 3
            this.current = 1
            break
            // case 3:
            //   this.current = 1
            // break
          default:
            break
        }
        if (this.current === 1) {
          this.$refs.centerSence1.$el.style.left = 0
        } else {
          this.$refs.centerSence2.$el.style.left = 0
        }
      }, 10000)
    },
    handleLanguageChange() {
      this.language = !this.language
      this.$refs.centerSence1.languageChange(this.language)
      this.$refs.centerSence2.languageChange(this.language)
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .data-card .title{
  text-align: center;
  font-size: 36px;
}
.char-select {
  width: 80px;
  float: right;
  ::v-deep .el-input__inner {
    background-color: unset;
    color: #fff;
  }
}
.dashboard {
  &-container {
    position: relative;
    padding: 15px;
    height: 100%;
    background-color: $logo-main;
    box-sizing: border-box;
    color: $word-normal;
    user-select: none;
    background-image: url(~@/assets/bg_gif3.gif);
    background-size: 100% 100%;
    background-position: 50%;
    ::v-deep .el-drawer {
      background-color: unset;
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
      text-align: right;
    }
  }
  &-center {
    /* @include flex(space-between); */
    width: 100%;
    height: 90%;
    box-sizing: border-box;
    .center {
      width: 100%;
      height: 100%;
    }
  }
}
.drawer-box {
  padding: 95px 20px;
  background-color: transparent;
}
.center-left {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 20%;
  height: 80%;
  z-index: 100;
}
.center-right {
  position: absolute;
  right: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 20%;
  height: 80%;
  z-index: 100;
}

</style>
