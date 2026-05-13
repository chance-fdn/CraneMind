<template>
  <div class="char-main">
    <div class="right-main">
      <dataCard height="450" class="data-card" title="垃圾吊任务统计" overflow="unset">
        <div class="crane-list">
          <div v-for="(item, index) in craneList" :key="item.craneNo +index" :class="['crane-item', {'current': currentCrane === index }]" @click="changeCrane(index)">{{ item.name }}</div>
        </div>
        <div id="char" style="width: 400px; height: 500px" />
      </dataCard>
      <dataCard height="450" class="data-card" title="垃圾池发酵天数统计" overflow="unset">
        <div id="barChar" style="width: 400px; height: 570px; margin-top: 10px" />
      </dataCard>
    </div>
    <dataCard height="450" class="data-card" style="width: 50%; height: 90%;" title="行车运行趋势图" overflow="unset">
      <trend style="height: 580px;" />
    </dataCard>
  </div>
</template>

<script>
import dataCard from '@/components/dataCard'
import { countTask } from '@/api/disCrane'
import { ringChar, barChar } from './char'
import dayjs from 'dayjs'
import { filterDisCraneTaskType } from '@/utils/filter'
import { disAreaInfo } from '@/api/pitArea'
import * as echarts from 'echarts'
import trend from '@/views/dashboard/component/trend.vue'

export default {
  name: '',
  provide() {
    return {
      charSet: {
        fontSize: 18,
        color: '#fff'
      }
    }
  },
  components: { dataCard, trend },
  data() {
    return {
      craneList: [
        {
          name: '全部',
          craneNo: ''
        },
        {
          name: '1号',
          craneNo: 'crane01'
        },
        {
          name: '2号',
          craneNo: 'crane02'
        },
        {
          name: '3号',
          craneNo: 'crane03'
        }
      ],
      currentCrane: 0,
      taskChar: null,
      fermenChar: null,
      environment: process.env.NODE_ENV,
      timer1: null,
      timer2: null
    }
  },
  mounted() {
    this.taskChar = echarts.init(document.getElementById('char'))
    this.fermenChar = echarts.init(document.getElementById('barChar'))
    this.loadChar()
    this.loadBarChar()
    // this.handleGetAreaStock()
    this.timer1 = setInterval(() => {
      this.loadChar()
      this.loadBarChar()
    }, 3600000)
    // if (this.environment === 'production') {
    //   this.timer2 = setInterval(() => {
    //     this.handleGetAreaStock()
    //   }, 60000)
    // }
  },
  beforeDestroy() {
    clearInterval(this.timer1)
    clearInterval(this.timer2)
  },
  methods: {
    numTofixed(val) {
      if (typeof val !== 'number') {
        val = parseFloat(val)
      }
      return val.toFixed(2)
    },
    async loadChar(craneNo) {
      const newDate = dayjs().format('YYYY-MM-DD HH:mm:ss')
      const zoomDate = dayjs().format('YYYY-MM-DD 00:00:00')
      console.log('----------', zoomDate, newDate)
      // this.taskChar.showLoading()
      const { success, data } = await countTask({
        starTime: zoomDate,
        endTime: newDate,
        craneNo
      })
      const charData = []
      if (success) {
        data.map((el) => {
          charData.push({
            name: filterDisCraneTaskType(el.type),
            value: el.count
          })
        })
        ringChar(this.taskChar, charData)
      }
      // this.taskChar.hideLoading()
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
    changeCrane(index) {
      this.currentCrane = index
      this.loadChar(this.craneList[index].craneNo)
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .data-card .title{
  font-size: 36px;
}
::v-deep .el-select {
  .el-input__inner {
    color: #fff;
    background-color: unset;
  }
}
::v-deep .el-cascader {
  .el-input__inner {
    color: #fff;
    background-color: unset;
  }
}
::v-deep .el-date-editor.el-input__inner {
  color: #fff;
  background-color: unset;
  input {
    color: #fff;
    background-color: unset;
  }
  .el-range-separator {
    color: #fff;
  }
}
::v-deep .el-card {
  color: #fff;
  background-color: unset;
}
::v-deep .trend-main {
  height: 90%;
  padding: 8px 20px;
  background-color: unset;
  color: #fff;
}

.char-main {
  position: absolute;
  display: flex;
  width: 100%;
  height: 100%;
  padding-top: 100px;
  box-sizing: border-box;
  .right-main {
    width: 50%;
  }
}
.right-main {
  display: flex;
  /* flex-direction: column; */
  justify-content: space-around;
  height: 90%;
}
.crane-list {
  @include flex;
  margin-top: 20px;
  .crane-item {
    padding: 6px;
    margin-right: 10px;
    border: 1px solid #fff;
    font-size: 18px;
    cursor: pointer;
    &.current {
      color: $state-success;
      border-color: $state-success;
    }
    &:hover {
      border-color: $state-success;
    }
  }
}
.area-total {
  width: 100%;
  text-align: center;
}
</style>
