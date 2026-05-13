<template>
  <div class="right-main">
    <div class="area-total">
      垃圾池总库存量:
      {{ numTofixed(areaTotal) }}
    </div>
    <dataCard height="260" title="垃圾吊任务自动运行时间" overflow="unset">
      <div style="width: 270px; margin-top: 20px;" class="sequence-table">
        <nativeTable :table-data="tableData" :table-column="tableColumn">
          <template #crane01="scope">
            {{ scope.row.crane01 ? scope.row.crane01 : ' - ' }}
          </template>
          <template #crane02="scope">
            {{ scope.row.crane02 ? scope.row.crane02 : ' - ' }}
          </template>
          <template #crane03="scope">
            {{ scope.row.crane03 ? scope.row.crane03 : ' - ' }}
          </template>
        </nativeTable>
      </div>
    </dataCard>
    <dataCard height="400" title="垃圾吊任务统计" overflow="unset">
      <div class="crane-list">
        <div v-for="(item, index) in craneList" :key="item.craneNo +index" :class="['crane-item', {'current': currentCrane === index }]" @click="changeCrane(index)">{{ item.name }}</div>
      </div>
      <div id="char" style="width: 280px; height: 350px" />
    </dataCard>
    <!-- <dataCard height="250" title="垃圾池发酵天数统计" overflow="unset">
      <div id="barChar" style="width: 280px; height: 200px; margin-top: 10px" />
    </dataCard> -->
  </div>
</template>

<script>
import dataCard from '@/components/dataCard'
import { countTask, countTaskTime } from '@/api/disCrane'
import { ringChar, barChar } from './char'
import dayjs from 'dayjs'
import { filterDisCraneTaskType } from '@/utils/filter'
import { disAreaInfo, findPartTrash } from '@/api/pitArea'
import * as echarts from 'echarts'
import nativeTable from '@/components/nativeTable'

export default {
  name: 'DashboardRight',
  components: { dataCard, nativeTable },
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
      areaTotal: '0.000000',
      timer1: null,
      timer2: null,
      tableData: [
        {
          sequence: '白班',
          crane01: '',
          crane02: '',
          crane03: ''
        },
        {
          sequence: '中班',
          crane01: '',
          crane02: '',
          crane03: ''
        },
        {
          sequence: '夜班',
          crane01: '',
          crane02: '',
          crane03: ''
        }
      ],
      tableColumn: [
        {
          label: '',
          prop: 'sequence'
        },
        {
          label: '一号车',
          key: 'crane01'
        },
        {
          label: '二号车',
          key: 'crane02'
        },
        {
          label: '三号车',
          key: 'crane03'
        }
      ]
    }
  },
  mounted() {
    this.taskChar = echarts.init(document.getElementById('char'))
    // this.fermenChar = echarts.init(document.getElementById('barChar'))
    this.loadChar()
    // this.loadBarChar()
    this.handleGetAreaStock()
    this.handleGetTableData()
    this.timer1 = setInterval(() => {
      this.loadChar()
      // this.loadBarChar()
    }, 3600000)
    if (this.environment === 'production') {
      this.timer2 = setInterval(() => {
        this.handleGetAreaStock()
        this.handleGetTableData()
      }, 60000)
    }
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
    filterSequence(key) {
      let str = ''
      switch (key) {
        case '1':
          str = '夜班'
          break
        case '2':
          str = '白班'
          break
        case '3':
          str = '中班'
          break
        default:
          break
      }
      return str
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
    },
    async handleGetAreaStock() {
      if (this.environment === 'production') {
        const { success, data } = await findPartTrash({
          url: 'http://172.168.10.102:8925/sum_trash'
        })
        if (success) {
          this.areaTotal = data
        }
      }
    },
    async handleGetTableData() {
      const { data, success } = await countTaskTime({
        time: dayjs().format('YYYY-MM-DD'),
        craneNo: ''
      })
      if (success) {
        data.map((el) => {
          if (el.sequence === '2') {
            this.tableData[0][el.craneNo] = (el.time * 1.1).toFixed(0) + ' 分钟'
          }
          if (el.sequence === '3') {
            this.tableData[1][el.craneNo] = (el.time * 1.1).toFixed(0) + ' 分钟'
          }
          if (el.sequence === '1') {
            this.tableData[2][el.craneNo] = (el.time * 1.1).toFixed(0) + ' 分钟'
          }
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.sequence-table {
  ::v-deep table {
    font-size: 16px;
  }
}
.right-main {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  height: 100%;
}
.crane-list {
  @include flex;
  margin-top: 20px;
  .crane-item {
    padding: 6px;
    margin-right: 10px;
    border: 1px solid #fff;
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
