<template>
  <div class="dis-area">
    <div class="user-top">
      <div class="search-top">
        <!-- <table-date-picker :origin-value="[tableForm.starTime, tableForm.endTime]" @datePickerChange="handleDateChange" /> -->
        <!-- <el-select v-model="tableForm.dutyType" clearable class="table-select" placeholder="职责类型">
          <el-option
            v-for="item in dutyTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select> -->
        <!-- <el-select v-model="currentTlArea" multiple class="table-select multiple" placeholder="投料区域">
          <el-option
            v-for="item in areaOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select> -->
        <!-- <el-select v-model="currentDlArea" multiple class="table-select multiple" placeholder="堆料区域">
          <el-option
            v-for="item in areaOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select> -->
        <!-- <tableSearch search-value="craneNo" title="行车编号查询" desc="行车编号" @getTableData="getUserInfo" /> -->
        <el-button v-if="!isIndex" type="danger" style="margin-bottom: 10px;" @click="handleDeleteItems">删除所选</el-button>
      </div>
      <div>
        <el-button type="primary" style="margin-bottom: 10px;" @click="handleOpenBox('add')">新增配置</el-button>
        <el-button v-if="!isIndex" type="success" style="margin-bottom: 10px; margin-left: 10px;" @click="exportTableToExcel('userTable')">导出</el-button>
      </div>
    </div>

    <history-table ref="userTable" :table-form="tableForm" :table-data="tableData" :selection="true" @getTableData="getUserInfo" @getSelectionData="handleSelectionChange">
      <el-table-column
        prop="craneNo"
        label="行车编号"
        sortable
      />
      <el-table-column
        label="职责类型"
        sortable
      >
        <template slot-scope="scope">
          {{ filterDutyType(scope.row.dutyType) }}
          <span v-if="scope.row.dutyType === 'AREA' && scope.row.dutyNo !== scope.row.currentDlArea">{{ ' - ' }}</span>
          <span v-if="scope.row.dutyType === 'AREA'" style="color: red;">{{ scope.row.dutyNo !== scope.row.currentDlArea ? '无效配置' : '' }}</span>
        </template>
      </el-table-column>
      <el-table-column
        prop="dutyNo"
        label="职责编号"
      />
      <el-table-column
        prop="currentDlArea"
        label="当前堆料区域"
      />
      <el-table-column
        prop="currentTlArea"
        label="当前投料区域"
      />
      <el-table-column
        prop="priorityDischargingDoor"
        label="优先卸料门"
      />
      <el-table-column
        prop="priorityMaterialArea"
        label="优先投料区域"
      />
      <el-table-column
        prop="priority"
        label="优先级"
      />
      <el-table-column
        v-if="!isIndex"
        prop="exceptionCraneNo"
        label="异常行车"
      />
      <el-table-column
        v-if="!isIndex"
        prop="createDate"
        label="建立时间"
        sortable
      />
      <el-table-column
        v-if="!isIndex"
        prop="updateDate"
        label="更新时间"
        sortable
      />
      <el-table-column
        v-if="!isIndex"
        prop="remarks"
        label="备注"
      />
      <!-- <el-table-column
        prop="delFlag"
        label="是否已删除"
      /> -->
      <el-table-column
        label="操作"
      >
        <template slot-scope="scope">
          <div class="actions">
            <el-button type="text" class="user-edit" @click="handleOpenBox('update', scope.row)">编辑</el-button>
            <el-popconfirm
              title="是否删除？"
              @onConfirm="handleDeleteItem(scope.row.id)"
            >
              <el-button slot="reference" type="text" class="user-edit" style="color: red;">删除</el-button>
            </el-popconfirm>
          </div>
        </template>
      </el-table-column>
    </history-table>

    <addBox ref="registerBox" :type="isEdit" @getTableData="getUserInfo" />
  </div>
</template>

<script>
import { findCraneDutyConfig, delCraneDutyConfig } from '@/api/disCrane'
import historyTable from '@/components/table'
import tableSearch from '@/components/search'
import { exportTableToExcel } from '@/utils/tool'
import tableDatePicker from '@/components/datePicker'
import addBox from './editPage.vue'

export default {
  components: { historyTable, tableSearch, tableDatePicker, addBox },
  props: {
    isIndex: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      tableData: [],
      tableForm: {
        // craneNo: '', // 行车编号
        // currentDlArea: '', // 堆料区
        // currentTlArea: '', // 投料区
        // dutyType: '', // 职责类型 PMP:投料职责,AREA:堆料职责
        // starTime: '',
        // endTime: '',
        pageNum: 1,
        pageSize: 10,
        total: 0
      },
      isEdit: '',
      dutyTypeOptions: [
        {
          value: 'PMP',
          label: '投料职责'
        },
        {
          value: 'AREA',
          label: '堆料职责'
        }
      ],
      areaOptions: [
        {
          value: 'area01',
          label: '区域1'
        },
        {
          value: 'area02',
          label: '区域2'
        },
        {
          value: 'area03',
          label: '区域3'
        },
        {
          value: 'area04',
          label: '区域4'
        },
        {
          value: 'area05',
          label: '区域5'
        },
        {
          value: 'area06',
          label: '区域6'
        },
        {
          value: 'area07',
          label: '区域7'
        },
        {
          value: 'area08',
          label: '区域8'
        },
        {
          value: 'area09',
          label: '区域9'
        },
        {
          value: 'area10',
          label: '区域10'
        }
      ],
      currentTlArea: [],
      currentDlArea: [],
      multipleSelection: []
    }
  },
  methods: {
    exportTableToExcel,
    async getUserInfo(val) {
      // 数据改变,重新获取数据
      // this.tableForm.currentTlArea = this.currentTlArea.join()
      // this.tableForm.currentDlArea = this.currentDlArea.join()
      val && Object.assign(this.tableForm, val)
      const { data, success } = await findCraneDutyConfig(this.tableForm)
      // success && (this.tableData = data)
      if (success) {
        this.tableData = JSON.parse(JSON.stringify(data.list))
        this.tableForm.total = data.total
      }
    },
    filterDutyType(key) {
      let str = ''
      switch (key) {
        case 'PMP':
          str = '投料'
          break
        case 'AREA':
          str = '堆料'
          break

        default:
          str = key
          break
      }
      return str
    },
    handleOpenBox(type, val) {
      this.isEdit = type
      if (val) {
        const data = JSON.parse(JSON.stringify(val))
        data.currentTlArea = val.currentTlArea?.split(',')
        data.currentDlArea = val.currentDlArea?.split(',')
        data.dutyNo = val.dutyNo?.split(',')

        Object.assign(this.$refs.registerBox.registerForm, data)
      } else {
        this.$refs.registerBox.registerForm = {}
        this.$refs.registerBox.toClearDia()
      }
      setTimeout(() => {
        this.$refs.registerBox.$refs.dialog.dialogVisible = true
      }, 0)
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
    async handleDeleteItem(id) {
      const { success } = await delCraneDutyConfig(id)
      if (success) {
        this.$message({
          message: '删除成功!',
          type: 'success'
        })
        this.getUserInfo()
      }
    },
    handleSelectionChange(val) {
      this.multipleSelection = val
    },
    handleDeleteItems() {
      let str = ''
      this.multipleSelection.map((el, index, arr) => {
        if (index === arr.length - 1) {
          str += el.id
        } else {
          str += el.id + ','
        }
      })
      str.length && this.handleDeleteItem(str)
    }
  }
}
</script>

<style lang="scss" scoped>
.dis-area {
  height: 100%;
  overflow-y: auto;
  padding: 30px 30px 60px;
  .user-top {
    @include flex(space-between);
  }
}
.search-top {
  @include flex;
}
.table-select {
  width: 110px;
  margin-bottom: 10px;
  margin-right: 20px;
  &.multiple {
    width: 250px;
  }
}
.actions {
  .el-button--text {
    &.success {
      color: $state-success;
    }
    &.error {
      color: $state-error;
    }
  }
  .user-edit {
    margin-left: 16px;
  }
}

</style>
