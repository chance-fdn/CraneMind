<template>
  <div style="padding:30px;">
    <div class="table-top">
      <div class="search-top">
        <table-date-picker :origin-value="[tableForm.starTime, tableForm.endTime]" @datePickerChange="handleDateChange" />
        <tableSearch title="根据任务名称查询" desc="任务名称" @getTableData="getDisAreaInfo" />
      </div>
      <el-button type="success" style="margin-bottom: 10px; margin-left: 10px;" @click="exportTableToExcel('taskListTable')">导出</el-button>
    </div>

    <history-table ref="taskListTable" :table-form="tableForm" :table-data="tableData" @getTableData="getDisAreaInfo">
      <el-table-column
        prop="craneNo"
        label="行车编号"
        sortable
      />
      <el-table-column
        prop="parentTaskNo"
        label="父级任务编号"
      />
      <el-table-column
        prop="taskNo"
        label="任务编号"
      />
      <el-table-column
        prop="taskName"
        label="任务名称"
      />
      <el-table-column
        label="任务类型"
        prop="taskType"
        sortable
      >
        <template slot-scope="scope">
          {{ filterDisCraneTaskType(scope.row.taskType) }}
        </template>
      </el-table-column>
      <el-table-column
        label="执行类型"
        prop="executionType"
        sortable
      >
        <template slot-scope="scope">
          {{ filterDisCraneExecutionType(scope.row.executionType) }}
        </template>
      </el-table-column>
      <el-table-column
        label="任务状态"
        prop="taskStatus"
        sortable
      >
        <template slot-scope="scope">
          {{ filterDisCraneTaskStatus(scope.row.taskStatus) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="createTime"
        label="创建时间"
        sortable
      />
      <el-table-column
        label="起点"
      >
        <template slot-scope="scope">
          {{ filterNum(scope.row.startPointX + 8.8) + ' ,' + filterNum(scope.row.startPointY - 1.5) + ' ,' + filterNum(37 - scope.row.startPointZ) }}
        </template>
      </el-table-column>
      <el-table-column
        label="任务点1"
      >
        <template slot-scope="scope">
          {{ filterNum(scope.row.x1 + 8.8) + ' ,' + filterNum(scope.row.y1 - 1.5) + ' ,' + filterNum(37 - scope.row.z1) }}
        </template>
      </el-table-column>
      <el-table-column
        label="任务点2"
      >
        <template slot-scope="scope">
          {{ filterNum(scope.row.x2 + 8.8) + ' ,' + filterNum(scope.row.y2 - 1.5) + ' ,' + filterNum(37 - scope.row.z2) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="openingClosingDegrees"
        label="爪子开合度"
      />
    </history-table>
  </div>
</template>

<script>
import { findTaskList } from '@/api/disCrane'
import historyTable from '@/components/table'
import tableSearch from '@/components/search'
import { filterDisCraneTaskType, filterDisCraneExecutionType, filterDisCraneTaskStatus } from '@/utils/filter'
import { exportTableToExcel } from '@/utils/tool'
import tableDatePicker from '@/components/datePicker'

export default {
  components: { historyTable, tableSearch, tableDatePicker },
  data() {
    return {
      tableData: [],
      tableForm: {
        findMsg: '',
        pageNum: 1,
        pageSize: 10,
        total: 0,
        starTime: '',
        endTime: ''
      }
    }
  },
  methods: {
    filterDisCraneTaskType,
    filterDisCraneExecutionType,
    filterDisCraneTaskStatus,
    exportTableToExcel,
    filterNum(val) {
      if (typeof val !== 'number') {
        val = parseFloat(val)
      }
      return val.toFixed(2)
    },
    async getDisAreaInfo(val) {
      // 数据改变,重新获取数据
      val && Object.assign(this.tableForm, val)
      if (this.tableForm.starTime && this.tableForm.endTime) {
        const { data, success } = await findTaskList(this.tableForm)
        if (success) {
          this.tableForm.pageSize = data.total
        }
      }
      const { data, success } = await findTaskList(this.tableForm)
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
