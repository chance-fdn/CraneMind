<template>
  <div style="padding:30px;">
    <div class="table-top">
      <div class="search-top">
        <el-select v-model="tableForm.status" clearable placeholder="请选择告警状态">
          <el-option
            v-for="item in recordOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <tableSearch title="根据设备ID查询" desc="设备ID" @getTableData="getDisAreaInfo" />
      </div>
      <el-button type="success" style="margin-bottom: 10px; margin-left: 10px;" @click="exportTableToExcel('craneAlarmTable')">导出</el-button>
    </div>

    <history-table ref="craneAlarmTable" :table-form="tableForm" :table-data="tableData" @getTableData="getDisAreaInfo">
      <el-table-column
        prop="craneNo"
        label="行车编号"
        sortable
      />
      <el-table-column
        prop="positionX"
        label="推荐移动位置X"
      />
      <el-table-column
        prop="positionY"
        label="推荐移动位置Y"
      />
      <el-table-column
        prop="createTime"
        label="告警时间"
        sortable
      />
      <el-table-column
        prop="handleTime"
        label="处理时间"
        sortable
      />
      <el-table-column
        label="告警状态"
        prop="status"
        sortable
      >
        <template slot-scope="scope">
          {{ filterAlarmStatus(scope.row.status) }}
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
      >
        <template slot-scope="scope">
          <div v-if="scope.row.status === 0">
            <el-button type="text" @click="handleCheckCrane(scope.row)">确定已移动到指定位置</el-button>
          </div>
        </template>
      </el-table-column>
    </history-table>
    <!-- 行车告警 再次确认 -->
    <el-dialog
      title="行车位置校验"
      :visible.sync="craneReconfirmVisible"
      width="30%"
      top="30vh"
      :modal="false"
    >
      <div class="dia-cont">{{ craneMessage }}</div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="handleForceCheckCrane">{{ craneStatus ? '确定' : '确定已移动到指定位置' }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { findCraneAlarmList, ackCranePlace, handleCraneAlarm } from '@/api/disCrane'
import historyTable from '@/components/table'
import tableSearch from '@/components/search'
import { exportTableToExcel } from '@/utils/tool'

export default {
  components: { historyTable, tableSearch },
  data() {
    return {
      tableData: [],
      tableForm: {
        deviceId: '',
        findMsg: '',
        status: null,
        pageNum: 1,
        pageSize: 10,
        total: 0
      },
      recordOptions: [
        {
          label: '未处理',
          value: 0
        },
        {
          label: '已处理',
          value: 1
        }
      ],
      craneInfo: {},
      craneMessage: '',
      craneStatus: '',
      craneReconfirmVisible: false
    }
  },
  methods: {
    exportTableToExcel,
    filterAlarmStatus(key) {
      let str = ''
      switch (key) {
        case 0:
          str = '未处理'
          break
        case 1:
          str = '已处理'
          break
        default:
          str = key
          break
      }
      return str
    },
    async getDisAreaInfo(val) {
      // 数据改变,重新获取数据
      val && Object.assign(this.tableForm, val)
      const { data, success } = await findCraneAlarmList(this.tableForm)
      // success && (this.tableData = data)
      if (success) {
        this.tableData = JSON.parse(JSON.stringify(data.list))
        this.tableForm.total = data.total
      }
    },
    async handleCheckCrane(data) {
      this.craneInfo = data
      const { code, message } = await ackCranePlace({
        id: data.id
      })
      if (code === 200) {
        this.craneMessage = '行车位置校验成功！'
        this.craneStatus = true
      } else {
        this.craneMessage = message
        this.craneStatus = false
      }
      this.craneReconfirmVisible = true
    },
    // 强制确认行车位置正常
    async handleForceCheckCrane() {
      if (this.craneStatus) {
        this.craneReconfirmVisible = false
      } else {
        const { success } = await handleCraneAlarm({
          id: this.craneInfo.id
        })
        if (success) {
          this.$message({
            message: '行车异常已处理',
            type: 'success'
          })
        }
        this.craneReconfirmVisible = false
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
  ::v-deep .el-select {
    margin-bottom: 10px;
    margin-right: 10px;
  }
}
</style>
