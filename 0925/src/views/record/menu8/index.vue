<template>
  <div class="dis-area">
    <div class="table-top">
      <div class="search-top">
        <table-date-picker :origin-value="[tableForm.starTime, tableForm.endTime]" @datePickerChange="handleDateChange" />
        <tableSearch :is-show-search="false" @getTableData="getDisAreaInfo" />
      </div>
      <el-button type="success" style="margin-bottom: 10px; margin-left: 10px;" @click="exportTableToExcel('trashTable')">导出</el-button>
    </div>
    <history-table ref="trashTable" :table-form="tableForm" :table-data="tableData" @getTableData="getDisAreaInfo">
      <el-table-column
        prop="createTime"
        label="时间"
        sortable
      />
      <el-table-column
        prop="trashSum"
        label="总库存量"
      />
    </history-table>
  </div>
</template>

<script>
import { findTrashSum } from '@/api/pitArea'
import historyTable from '@/components/table'
import tableSearch from '@/components/search'
import { exportTableToExcel } from '@/utils/tool'
import tableDatePicker from '@/components/datePicker'

export default {
  components: { historyTable, tableSearch, tableDatePicker },
  data() {
    return {
      tableData: [],
      tableForm: {
        starTime: '',
        endTime: '',
        pageNum: 1,
        pageSize: 10,
        total: 0
      }
    }
  },
  methods: {
    exportTableToExcel,
    async getDisAreaInfo(val) {
      // 数据改变,重新获取数据
      val && Object.assign(this.tableForm, val)
      const { data, success } = await findTrashSum(this.tableForm)
      // success && (this.tableData = data)
      if (success) {
        this.tableData = JSON.parse(JSON.stringify(data.list))
        this.tableForm.total = data.total
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
    }
  }
}
</script>

<style lang="scss" scoped>
.dis-area {
  padding: 30px 30px 60px;
  height: 100%;
  overflow-y: auto;
}
.table-top {
  @include flex(space-between);
}
.search-top {
  @include flex;
}
</style>
