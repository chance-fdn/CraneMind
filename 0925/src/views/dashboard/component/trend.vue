<template>
  <div class="trend-main">
    <div class="trend-top">
      <div class="trend-date-picker">
        <el-select v-model="dataType" style="width: 150px; margin-bottom: 10px;" placeholder="选择" @change="handleReloadChar">
          <el-option
            label="实时趋势图"
            value="realTime"
          />
          <el-option
            label="历史趋势图"
            value="history"
          />
        </el-select>
        <div v-if="dataType === 'history'" class="history-box">
          <date-picker :origin-value="[starTime, endTime]" @datePickerChange="handleDateChange" />
          <el-button type="primary" size="medium" @click="handleGetDeviceData">查找</el-button>
        </div>
        <div v-if="dataType === 'realTime'" class="real-time-box">
          <div class="show-text">展示数据：</div>
          <el-select v-model="showValue" style="width: 100px; margin-bottom: 10px;" placeholder="实时趋势展示">
            <el-option
              v-for="item in showOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
      </div>
      <div class="trend-device">
        <div class="device-list">
          <!-- 大车 小车 抓斗 -->
          <el-select v-if="currentParams === 'Speed' || currentParams === 'grabWeight' || currentParams === 'scale'" v-model="currentSpeedDevice" placeholder="请选择" @change="handleReloadChar">
            <el-option
              v-for="item in deviceOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-cascader
            v-else
            v-model="currentDevice"
            :options="deviceOptions"
            :props="{ expandTrigger: 'hover' }"
            style="width: 150px; margin-bottom: 10px;"
            @change="handleReloadChar"
          />
        </div>
        <!-- 速度 电流 位置 -->
        <div class="tab-list">
          <div v-for="item in paramsOptions" :key="item.value" :class="['tab-item', {'current' : item.value === currentParams}]" @click="handleTabClick(item.value)">
            {{ item.label }}
          </div>
        </div>
      </div>

    </div>

    <div class="char-list">
      <el-card class="box-card">
        <div slot="header" class="clearfix">
          <span>趋势图</span>
        </div>
        <div v-if="charShow" id="speed" style="width: 100%; height: 100%;" />
      </el-card>
      <!-- <el-card class="box-card">
        <div slot="header" class="clearfix">
          <span>速度趋势图</span>
        </div>
        <div id="speed" style="width: 100%; height: 100%;" />
      </el-card> -->
    </div>
  </div>
</template>

<script>
import { findDeviceDataList } from '@/api/device'
import datePicker from '@/components/datePicker'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { lineChars } from './char'

export default {
  components: { datePicker },
  data() {
    return {
      // starTime: dayjs().format('YYYY-MM-DD 00:00:00'),
      starTime: dayjs().subtract(60, 'minute').format('YYYY-MM-DD HH:mm:ss'), // 获取当前时间的前60分钟
      endTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      currentChar: null,
      speedChar: null,
      currentDevice: '',
      deviceOptions: [
        {
          label: '一号',
          value: 'crane01',
          children: [
            {
              label: '大车',
              value: 'bigCar'
            },
            {
              label: '小车',
              value: 'smallCar'
            },
            {
              label: '抓斗',
              value: 'grab'
            }
          ]
        },
        {
          label: '二号',
          value: 'crane02',
          children: [
            {
              label: '大车',
              value: 'bigCar'
            },
            {
              label: '小车',
              value: 'smallCar'
            },
            {
              label: '抓斗',
              value: 'grab'
            }
          ]
        },
        {
          label: '三号',
          value: 'crane03',
          children: [
            {
              label: '大车',
              value: 'bigCar'
            },
            {
              label: '小车',
              value: 'smallCar'
            },
            {
              label: '抓斗',
              value: 'grab'
            }
          ]
        }
      ],
      // charData: [
      //   {
      //     type: 'crane01',
      //     current: [],
      //     speed: []
      //   },
      //   {
      //     type: 'crane02',
      //     current: [],
      //     speed: []
      //   },
      //   {
      //     type: 'crane03',
      //     current: [],
      //     speed: []
      //   }
      // ],
      currentTime: '',
      showValue: 180,
      showOptions: [
        {
          value: 30,
          label: '30秒'
        },
        {
          value: 60,
          label: '1分钟'
        },
        {
          value: 180,
          label: '3分钟'
        },
        {
          value: 300,
          label: '5分钟'
        }
      ],
      dataType: 'realTime',
      currentParams: '',
      paramsOptions: [
        {
          label: '速度',
          value: 'Speed'
        },
        {
          label: '电流',
          value: 'Current'
        },
        {
          label: '位置',
          value: 'position'
        },
        {
          label: '抓斗重量',
          value: 'grabWeight'
        },
        {
          label: '抓斗倾角',
          value: 'scale'
        }
      ],
      charShow: true,
      currentSpeedDevice: 'crane01'
    }
  },
  inject: ['parent', 'charSet'],
  computed: {
    diffDays() {
      const date1 = new Date(this.starTime)
      const date2 = new Date(this.endTime)
      const diffInMs = date2.getTime() - date1.getTime()
      return Math.ceil(diffInMs / (1000))
    }
  },
  watch: {
    'parent.craneList': {
      handler(newVal, oldVal) {
        (this.dataType === 'realTime') && this.handleLoadChar(newVal)
      },
      // immediate: true,
      deep: true // 可以深度检测到 对象的属性值的变化
    }
  },
  created() {
    this.currentParams = this.paramsOptions[0].value
    this.currentDevice = [this.deviceOptions[0].value, this.deviceOptions[0].children[0].value]
  },
  mounted() {
    // this.handleGetDeviceData()
    // setInterval(() => {
    //   this.currentTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    // }, 1000)
    // this.currentChar = echarts.init(document.getElementById('current'))
    this.speedChar = echarts.init(document.getElementById('speed'))
  },
  methods: {
    async handleGetDeviceData() {
      const { success, data } = await findDeviceDataList({
        pageNum: 1,
        pageSize: this.diffDays * 3,
        starTime: this.starTime,
        endTime: this.endTime
      })
      if (success) {
        const xData = this.dealCharData(data.list, 'crane01', 'createTime').reverse()

        let charData = []
        if (this.currentParams === 'position') {
          // xyz
          const positionData = [this.dealCharData(data.list, this.currentDevice[0], 'x').reverse(), this.dealCharData(data.list, this.currentDevice[0], 'y').reverse(), this.dealCharData(data.list, this.currentDevice[0], 'z').reverse()]
          charData = [
            {
              name: 'X',
              type: 'line',
              data: positionData[0],
              smooth: true,
              label: {
                color: this.charSet?.color
              }
            },
            {
              name: 'Y',
              type: 'line',
              data: positionData[1],
              smooth: true,
              label: {
                color: this.charSet?.color
              }
            },
            {
              name: 'Z',
              type: 'line',
              data: positionData[2],
              smooth: true,
              label: {
                color: this.charSet?.color
              }
            }
          ]
        } else if (this.currentParams === 'Speed') {
          const allData = [
            this.dealCharData(data.list, this.currentSpeedDevice, 'bigCarSpeedSP').reverse(), this.dealCharData(data.list, this.currentSpeedDevice, 'bigCarSpeed').reverse(),
            this.dealCharData(data.list, this.currentSpeedDevice, 'smallCarSpeedSP').reverse(), this.dealCharData(data.list, this.currentSpeedDevice, 'smallCarSpeed').reverse(),
            this.dealCharData(data.list, this.currentSpeedDevice, 'grabSpeedSP').reverse(), this.dealCharData(data.list, this.currentSpeedDevice, 'grabSpeed').reverse()
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
        } else if (this.currentParams === 'Current') {
          const allData = this.dealCharData(data.list, this.currentDevice[0], this.currentDevice[1] + this.currentParams).reverse()
          charData = [
            {
              type: 'line',
              data: allData,
              smooth: true
            }
          ]
        } else if (this.currentParams === 'scale') {
          const positionData = [this.dealCharData(data.list, this.currentSpeedDevice, 'scaleXo').reverse(), this.dealCharData(data.list, this.currentSpeedDevice, 'scaleYo').reverse()]
          charData = [
            {
              name: 'X',
              type: 'line',
              data: positionData[0],
              smooth: true,
              label: {
                color: this.charSet?.color
              }
            },
            {
              name: 'Y',
              type: 'line',
              data: positionData[1],
              smooth: true,
              label: {
                color: this.charSet?.color
              }
            }
          ]
        } else {
          const allData = this.dealCharData(data.list, this.currentSpeedDevice, this.currentParams).reverse()
          charData = [
            {
              type: 'line',
              data: allData,
              smooth: true
            }
          ]
        }
        // 加载图表
        lineChars(this.speedChar, {
          data: charData,
          xData: xData,
          yMax: this.currentParams === 'Speed' ? 1.5 : null,
          color: this.charSet
        })
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
    handleLoadChar(data) {
      // 处理数据 .reverse()
      // this.charData.forEach((el) => {
      //   el.current = this.dealCharData(data, el.type, this.currentDevice[1] + 'Current')
      //   el.speed = this.dealCharData(data, el.type, this.currentDevice[1] + 'Speed')
      // })

      const xData = this.dealCharData(data, 'crane01', 'createTime')

      let charData = []
      if (this.currentParams === 'position') {
        // xyz
        const positionData = [this.dealCharData(data, this.currentDevice[0], 'x'), this.dealCharData(data, this.currentDevice[0], 'y'), this.dealCharData(data, this.currentDevice[0], 'z')]
        charData = [
          {
            name: 'X',
            type: 'line',
            data: positionData[0],
            smooth: true,
            label: {
              color: this.charSet?.color
            }
          },
          {
            name: 'Y',
            type: 'line',
            data: positionData[1],
            smooth: true,
            label: {
              textStyle: {
                color: this.charSet?.color
              }
            }
          },
          {
            name: 'Z',
            type: 'line',
            data: positionData[2],
            smooth: true,
            label: {
              normal: {
                textStyle: {
                  color: this.charSet?.color
                }
              }

            }
          }
        ]
      } else if (this.currentParams === 'Speed') {
        // const allData = [this.dealCharData(data, this.currentDevice[0], this.currentDevice[1] + 'SpeedSP'), this.dealCharData(data, this.currentDevice[0], this.currentDevice[1] + 'Speed')]
        const allData = [
          this.dealCharData(data, this.currentSpeedDevice, 'bigCarSpeedSP'), this.dealCharData(data, this.currentSpeedDevice, 'bigCarSpeed'),
          this.dealCharData(data, this.currentSpeedDevice, 'smallCarSpeedSP'), this.dealCharData(data, this.currentSpeedDevice, 'smallCarSpeed'),
          this.dealCharData(data, this.currentSpeedDevice, 'grabSpeedSP'), this.dealCharData(data, this.currentSpeedDevice, 'grabSpeed')
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
      } else if (this.currentParams === 'Current') {
        const allData = this.dealCharData(data, this.currentDevice[0], this.currentDevice[1] + this.currentParams)
        charData = [
          {
            type: 'line',
            data: allData,
            smooth: true
          }
        ]
      } else if (this.currentParams === 'scale') {
        const positionData = [this.dealCharData(data, this.currentSpeedDevice, 'scaleXo'), this.dealCharData(data, this.currentSpeedDevice, 'scaleYo')]
        charData = [
          {
            name: 'X',
            type: 'line',
            data: positionData[0],
            smooth: true,
            label: {
              color: this.charSet?.color
            }
          },
          {
            name: 'Y',
            type: 'line',
            data: positionData[1],
            smooth: true,
            label: {
              color: this.charSet?.color
            }
          }
        ]
      } else {
        const allData = this.dealCharData(data, this.currentSpeedDevice, this.currentParams)
        charData = [
          {
            type: 'line',
            data: allData,
            smooth: true
          }
        ]
      }
      // 加载图表
      lineChars(this.speedChar, {
        data: charData,
        xData: xData,
        showLength: this.showValue,
        yMax: this.currentParams === 'Speed' ? 1.5 : null,
        color: this.charSet
      })
    },
    handleDateChange(val) {
      // console.log('-----------------', val)
      if (val) {
        this.starTime = val[0]
        this.endTime = val[1]
      } else {
        this.starTime = ''
        this.endTime = ''
      }
    },
    // handleDateFocus() {
    //   this.$emit('resizeActiveChange', true)
    // },
    // handleDateBlur() {
    //   this.$emit('resizeActiveChange', false)
    // },
    handleTabClick(type) {
      this.currentParams = type
      // 重置图表 不这样series不会重置
      this.charShow = false
      setTimeout(() => {
        this.charShow = true
        this.$nextTick(() => {
          this.speedChar = echarts.init(document.getElementById('speed'))
          this.handleReloadChar()
        })
      }, 0)
    },
    handleReloadChar() {
      if (this.dataType === 'history') {
        this.handleGetDeviceData()
      } else {
        this.handleLoadChar()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.trend-main {
  height: 100%;
  padding: 20px;
  overflow-y: auto;
  background-color: #fff;
  color: #606266;
  .trend-top {
    /* @include flex(space-between); */
    .trend-date-picker {
      @include flex;
      button {
        margin-bottom: 10px;
      }
      .history-box {
        @include flex;
        margin-left: 10px;
      }
      .real-time-box {
        @include flex;
        margin-left: 10px;
      }
      .show-text {
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 10px;
      }
    }
    .trend-device {
      @include flex(space-between);
    }
    .tab-list {
      @include flex(flex-end);
      margin-bottom: 10px;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
      .tab-item {
        height: 40px;
        padding: 0 15px;
        line-height: 40px;
        cursor: pointer;
        &.current, &:hover {
          font-weight: 700;
          color: $state-information;
        }
        &:nth-child(2n) {
          border-left: 1px solid #e4e7ed;
          border-right: 1px solid #e4e7ed;
        }
      }
    }
  }
  .char-list {
    @include flex(space-between);
    height: 81%;
    ::v-deep .el-card {
      .el-card__body {
        height: 90%;
      }
    }
  }
  .box-card {
    width: 100%;
    height: 100%;
    .clearfix {
      font-weight: 700;
    }
  }
}
</style>
