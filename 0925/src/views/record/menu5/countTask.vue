<template>
  <div style="padding:30px;">
    <div class="table-top">
      <div class="search-top">
        <table-date-picker :origin-value="[tableForm.starTime, tableForm.endTime]" @datePickerChange="handleDateChange" />
        <tableSearch title="根据行车编号查询" desc="行车" search-value="craneNo" @getTableData="getDisAreaInfo" />
      </div>
      <el-button type="success" style="margin-bottom: 10px; margin-left: 10px;" @click="exportTableToExcel('countTaskTable')">导出</el-button>
    </div>

    <history-table ref="countTaskTable" :table-form="tableForm" :table-data="tableData" @getTableData="getDisAreaInfo">
      <el-table-column
        label="任务类型"
      >
        <template slot-scope="scope">
          {{ filterDisCraneTaskType(scope.row.type) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="count"
        label="总数"
      />
    </history-table>
  </div>
</template>

<script>
import { countTask } from '@/api/disCrane'
import historyTable from '@/components/table'
import tableSearch from '@/components/search'
import tableDatePicker from '@/components/datePicker'
import { filterDisCraneTaskType } from '@/utils/filter'
import dayjs from 'dayjs'
import { exportTableToExcel } from '@/utils/tool'

export default {
  components: { historyTable, tableSearch, tableDatePicker },
  data() {
    return {
      tableData: [],
      tableForm: {
        starTime: dayjs().subtract(7, 'day').format('YYYY-MM-DD 00:00:00'),
        endTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        pageNum: 1,
        pageSize: 10,
        total: 0,
        craneNo: ''
      }
    }
  },
  methods: {
    exportTableToExcel,
    async getDisAreaInfo(val) {
      // 数据改变,重新获取数据
      val && Object.assign(this.tableForm, val)
      const { data, success } = await countTask(this.tableForm)
      // success && (this.tableData = data)
      if (success) {
        this.tableData = JSON.parse(JSON.stringify(data))
        this.tableForm.total = data.length
      }
    },
    handleDateChange(val) {
      if (val) {
        this.tableForm.starTime = val[0]
        this.tableForm.endTime = val[1]
      } else {
        this.tableForm.starTime = ''
        this.tableForm.endTime = ''
      }
    },
    filterDisCraneTaskType
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
