<template>
  <div style="padding:30px; height: 100%; box-sizing: border-box;">
    <div class="table-top">
      <div class="search-top">
        <table-date-picker @datePickerChange="handleDateChange" />
        <tableSearch title="根据用户名查询" desc="用户名" search-value="userName" @getTableData="getDisAreaInfo" />
      </div>
      <el-button type="success" style="margin-bottom: 10px; margin-left: 10px;" @click="exportTableToExcel('logTable')">导出</el-button>
    </div>
    <div class="table-box">
      <history-table ref="logTable" :table-form="tableForm" :table-data="tableData" @getTableData="getDisAreaInfo">
        <el-table-column
          prop="realName"
          label="用户名"
          sortable
        />
        <el-table-column
          prop="userName"
          label="操作账号"
        />
        <el-table-column
          prop="requestUrl"
          label="请求接口"
        />
        <el-table-column
          prop="requestMsg"
          label="请求接口说明"
        />
        <el-table-column
          prop="requestIp"
          label="请求IP"
        />
        <el-table-column
          prop="recordTime"
          label="记录时间"
          sortable
        />
      </history-table>
    </div>
  </div>
</template>

<script>
import { findLogs } from '@/api/user'
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
        userName: '',
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
      const { data, success } = await findLogs(this.tableForm)
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
.table-top {
  @include flex(space-between);
}
.search-top {
  @include flex;
}
.table-box {
  height: 95%;
  overflow-y: auto;
}
</style>
