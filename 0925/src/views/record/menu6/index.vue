<template>
  <div style="padding:30px;">
    <div class="table-top">
      <div class="search-top">
        <table-date-picker :origin-value="[tableForm.openTime_begin, tableForm.openTime_end]" @datePickerChange="handleDateChange" />
        <tableSearch :is-show-search="false" page-name="pageNo" @getTableData="getDisAreaInfo" />
      </div>
      <el-button type="success" style="margin-bottom: 10px; margin-left: 10px;" @click="exportTableToExcel('medicalTable')">导出</el-button>
    </div>
    <history-table ref="medicalTable" :table-form="tableForm" :table-data="tableData" :table-params="{pageNum: 'pageNo', pageSize: 'pageSize'}" @getTableData="getDisAreaInfo">
      <el-table-column
        prop="createTime"
        label="创建日期"
        sortable
      />
      <el-table-column
        prop="openTime"
        label="开启日期"
        sortable
      />
      <el-table-column
        prop="updateTime"
        label="更新日期"
        sortable
      />
      <el-table-column
        prop="isOpenMedical_dictText"
        label="是否开启"
        sortable
      />
    </history-table>
  </div>
</template>

<script>
import { disMedicalList } from '@/api/jeecg'
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
        openTime_begin: '',
        openTime_end: '',
        pageNo: 1,
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
      const { result, success } = await disMedicalList(this.tableForm)
      // success && (this.tableData = data)
      if (success) {
        this.tableData = JSON.parse(JSON.stringify(result.records))
        this.tableForm.total = result.total
      }
    },
    handleDateChange(val) {
      if (val) {
        this.tableForm.openTime_begin = val[0]
        this.tableForm.openTime_end = val[1]
      } else {
        this.tableForm.openTime_begin = ''
        this.tableForm.openTime_end = ''
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
