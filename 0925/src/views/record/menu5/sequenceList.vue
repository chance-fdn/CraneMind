<template>
  <div style="padding:30px;">
    <div class="table-top">
      <div class="search-top">
        <el-date-picker
          v-model="tableForm.time"
          type="date"
          value-format="yyyy-MM-dd"
          placeholder="选择日期"
          style="margin: 0 20px 10px 0;"
        />
        <tableSearch title="根据行车编号查询" desc="行车" search-value="craneNo" @getTableData="getDisAreaInfo" />
      </div>
      <el-button type="success" style="margin-bottom: 10px; margin-left: 10px;" @click="exportTableToExcel('countTaskTable')">导出</el-button>
    </div>

    <history-table ref="countTaskTable" :table-form="tableForm" :table-data="tableData" @getTableData="getDisAreaInfo">
      <el-table-column
        label="行车"
      >
        <template slot-scope="scope">
          {{ scope.row.craneNo.slice(-2) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="sequence"
        label="班次"
        sortable
      >
        <template slot-scope="scope">
          {{ filterSequence(scope.row.sequence) }}
        </template>
      </el-table-column>
      <el-table-column
        label="时间 (分钟)"
      >
        <template slot-scope="scope">
          {{ (scope.row.time*1.1).toFixed(0) }}
        </template>
      </el-table-column>
    </history-table>
  </div>
</template>

<script>
import { countTaskTime } from '@/api/disCrane'
import historyTable from '@/components/table'
import tableSearch from '@/components/search'
import dayjs from 'dayjs'
import { exportTableToExcel } from '@/utils/tool'

export default {
  components: { historyTable, tableSearch },
  data() {
    return {
      tableData: [],
      tableForm: {
        time: dayjs().format('YYYY-MM-DD'),
        pageNum: 1,
        pageSize: 10,
        total: 0,
        craneNo: ''
      }
    }
  },
  methods: {
    exportTableToExcel,
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
    async getDisAreaInfo(val) {
      // 数据改变,重新获取数据
      val && Object.assign(this.tableForm, val)
      const { data, success } = await countTaskTime(this.tableForm)
      // success && (this.tableData = data)
      if (success) {
        this.tableData = JSON.parse(JSON.stringify(data))
        this.tableForm.total = data.length
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.table-top {
  @include flex(space-between);
}
.search-top {
  @include flex;
}
</style>
