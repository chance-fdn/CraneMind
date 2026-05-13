<template>
  <div style="padding:30px;">
    <div class="table-top">
      <div class="search-top">
        <table-date-picker @datePickerChange="handleDateChange" />
        <tableSearch title="根据调度名查询" desc="调度名" @getTableData="getDisAreaInfo" />
      </div>
      <el-button type="success" style="margin-bottom: 10px; margin-left: 10px;" @click="exportTableToExcel('plcStepTable')">导出</el-button>
    </div>
    <history-table ref="plcStepTable" :table-form="tableForm" :table-data="tableData" @getTableData="getDisAreaInfo">
      <el-table-column
        prop="plcStepId"
        label="步骤ID"
      />
      <el-table-column
        prop="signalName"
        label="调度名"
        sortable
      />
      <el-table-column
        prop="signalAddress"
        label="信号地址"
      />
      <el-table-column
        prop="type"
        label="参数类型"
      />
      <el-table-column
        prop="modes"
        label="读写操作"
      />
      <el-table-column
        prop="parame"
        label="执行参数表达式"
      />
      <el-table-column
        prop="sortNo"
        label="排序"
      />
      <el-table-column
        prop="createTime"
        label="创建时间"
        sortable
      />
    </history-table>
  </div>
</template>

<script>
import { findPlcStepNodeList } from '@/api/instruction'
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
      const { data, success } = await findPlcStepNodeList(this.tableForm)
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
</style>
