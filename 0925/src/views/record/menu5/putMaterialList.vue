<template>
  <div style="padding:30px;">
    <div class="table-top">
      <tableSearch title="根据行车编号查询" desc="行车编号" @getTableData="getDisAreaInfo" />
      <el-button type="success" style="margin-bottom: 10px; margin-left: 10px;" @click="exportTableToExcel('putMaterialTable')">导出</el-button>
    </div>

    <history-table ref="putMaterialTable" :table-form="tableForm" :table-data="tableData" @getTableData="getDisAreaInfo">
      <el-table-column
        prop="craneNo"
        label="行车编号"
        sortable
      />
      <el-table-column
        prop="materialPortNo"
        label="投料口编号"
        sortable
      />
      <el-table-column
        prop="putMaterialTime"
        label="投料完成时间"
        sortable
      />
    </history-table>
  </div>
</template>

<script>
import { findPutMaterialList } from '@/api/disCrane'
import historyTable from '@/components/table'
import tableSearch from '@/components/search'
import { exportTableToExcel } from '@/utils/tool'

export default {
  components: { historyTable, tableSearch },
  data() {
    return {
      tableData: [],
      tableForm: {
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
      const { data, success } = await findPutMaterialList(this.tableForm)
      // success && (this.tableData = data)
      if (success) {
        this.tableData = JSON.parse(JSON.stringify(data.list))
        this.tableForm.total = data.total
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
