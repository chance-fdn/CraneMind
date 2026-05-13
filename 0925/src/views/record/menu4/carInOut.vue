<template>
  <div style="padding:30px;">
    <div class="table-top">
      <div class="search-top">
        <table-date-picker @datePickerChange="handleDateChange" />
        <tableSearch title="根据车牌号查询" desc="车牌号" @getTableData="getDisAreaInfo" />
      </div>
      <el-button type="success" style="margin-bottom: 10px; margin-left: 10px;" @click="exportTableToExcel('carInOutTable')">导出</el-button>
    </div>
    <history-table ref="carInOutTable" :table-form="tableForm" :table-data="tableData" @getTableData="getDisAreaInfo">
      <el-table-column
        prop="license"
        label="车牌号"
      />
      <el-table-column
        prop="inOutTime"
        label="进出时间"
        sortable
      />
      <el-table-column
        prop="type"
        label="进出类型"
        sortable
        :filters="[{text: '进厂', value: 'in'}, {text: '出厂', value: 'out'}]"
        :filter-method="filterHandler"
      />
      <el-table-column
        prop="remarks"
        label="备注"
      />
    </history-table>
  </div>
</template>

<script>
import { findCarInOutList } from '@/api/car'
import historyTable from '@/components/table'
import tableSearch from '@/components/search'
import tableDatePicker from '@/components/datePicker'
import { exportTableToExcel } from '@/utils/tool'

export default {
  components: { historyTable, tableSearch, tableDatePicker },
  data() {
    return {
      tableData: [],
      tableForm: {
        starTime: '',
        endTime: '',
        findMsg: '',
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
      const { data, success } = await findCarInOutList(this.tableForm)
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
    },
    filterHandler(value, row, column) {
      const property = column['property']
      return row[property] === value
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
