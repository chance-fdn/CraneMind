<template>
  <div style="padding:30px;">
    <div class="table-top">
      <div class="search-top">
        <el-select v-model="tableForm.category" clearable placeholder="请选择通知类型">
          <el-option
            v-for="item in recordOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select v-model="tableForm.status" clearable placeholder="请选择操作状态">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <tableSearch title="根据卸料门编号查询" desc="卸料门编号" @getTableData="getDisAreaInfo" />
      </div>
      <el-button type="success" style="margin-bottom: 10px; margin-left: 10px;" @click="exportTableToExcel('xlmCloseTable')">导出</el-button>
    </div>

    <history-table ref="xlmCloseTable" :table-form="tableForm" :table-data="tableData" @getTableData="getDisAreaInfo">
      <el-table-column
        prop="doorNo"
        label="卸料门编号"
        sortable
      />
      <el-table-column
        prop="createTime"
        label="创建时间"
        sortable
      />
      <el-table-column
        prop="handleTime"
        label="处理时间"
        sortable
      />
      <el-table-column
        label="操作类型"
      >
        <template slot-scope="scope">
          <span>{{ scope.row.category === 0 ? '关门' : '开门' }}</span>
        </template>
      </el-table-column>
      <el-table-column
        prop="reqMsg"
        label="请求结果信息"
      />
      <el-table-column
        label="状态"
      >
        <template slot-scope="scope">
          <span :class="filterStatus(scope.row.status)">{{ filterAlarmStatus(scope.row.status) }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
      >
        <template slot-scope="scope">
          <div v-if="scope.row.status === 0">
            <el-button type="text" style="color: red;" @click="handleCheck(scope.row.id)">{{ scope.row.category === 0 ? '关闭' : '开启' }}</el-button>
          </div>
        </template>
      </el-table-column>
    </history-table>

  </div>
</template>

<script>
import { findCloseMsg, ackClose } from '@/api/xlm'
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
        category: null,
        status: null,
        pageNum: 1,
        pageSize: 10,
        total: 0
      },
      recordOptions: [
        {
          label: '关门',
          value: 0
        },
        {
          label: '开门',
          value: 1
        }
      ],
      statusOptions: [
        {
          label: '待处理',
          value: 0
        },
        {
          label: '已处理',
          value: 1
        }
      ]
    }
  },
  methods: {
    exportTableToExcel,
    filterAlarmStatus(key) {
      let str = ''
      switch (key) {
        case 0:
          str = '待处理'
          break
        case 1:
          str = '已处理'
          break
        case 2:
          str = '忽略'
          break
        default:
          break
      }
      return str
    },
    filterStatus(key) {
      let str = ''
      switch (key) {
        case 0:
          str = 'wait'
          break
        case 1:
          str = 'closed'
          break
        case 2:
          str = 'ignore'
          break
        default:
          break
      }
      return str
    },
    async getDisAreaInfo(val) {
      // 数据改变,重新获取数据
      val && Object.assign(this.tableForm, val)
      const { data, success } = await findCloseMsg(this.tableForm)
      // success && (this.tableData = data)
      if (success) {
        this.tableData = JSON.parse(JSON.stringify(data.list))
        this.tableForm.total = data.total
      }
    },
    async handleCheck(id) {
      const { success } = await ackClose({
        id: id,
        status: 1
      })
      success && this.$message({
        message: '操作成功!',
        type: 'success'
      })
      this.getDisAreaInfo()
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
  ::v-deep .el-select {
    margin-bottom: 10px;
    margin-right: 10px;
  }
}
.wait {
  color: $state-error;
}
.closed {
  color: $state-success;
}
.ignore {
  color: $state-warning;
}
</style>
