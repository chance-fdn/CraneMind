<template>
  <div class="dis-area">
    <div class="user-top">
      <tableSearch title="根据姓名或账号查询" desc="姓名或账号" @getTableData="getUserInfo" />
      <div>
        <el-button type="primary" style="margin-bottom: 10px;" @click="handleOpenUserInfo('register')">新增用户</el-button>
        <el-button type="success" style="margin-bottom: 10px; margin-left: 10px;" @click="exportTableToExcel('userTable')">导出</el-button>
      </div>
    </div>
    <history-table ref="userTable" :table-form="tableForm" :table-data="tableData" @getTableData="getUserInfo">
      <el-table-column
        prop="realName"
        label="姓名"
      />
      <el-table-column
        prop="userName"
        label="用户名"
      />
      <el-table-column
        prop="phone"
        label="电话"
      />
      <el-table-column
        prop="birthday"
        label="生日"
      />
      <el-table-column
        label="性别"
      >
        <template slot-scope="scope">
          {{ filterSex(scope.row.sex) }}
        </template>
      </el-table-column>
      <el-table-column
        label="头像"
        width="120"
      >
        <template slot-scope="scope">
          <div class="avatar-img">
            <img v-if="scope.row.avatar" :src="BASE_URL + scope.row.avatar">
          </div>
        </template>
      </el-table-column>
      <el-table-column
        prop="post"
        label="职务"
        sortable
      />
      <el-table-column
        prop="workNo"
        label="工号"
        sortable
      />
      <el-table-column
        label="操作"
      >
        <template slot-scope="scope">
          <div class="actions">
            <el-button type="text" class="user-edit" @click="handleOpenUserInfo('amend', scope.row)">编辑</el-button>
            <el-popconfirm
              v-if="operationShow"
              title="确定执行权限操作？"
              @onConfirm="handleChangeIdentity(scope.row)"
            >
              <el-button slot="reference" type="text" :class="filterIdentityClass(scope.row.userIdentity)">{{ filterIdentity(scope.row.userIdentity) }}</el-button>
            </el-popconfirm>
            <el-popconfirm
              v-if="operationShow"
              :title="'确定执行' + filterStatus(scope.row.status) + '操作？'"
              @onConfirm="handleChangeStatus(scope.row)"
            >
              <el-button slot="reference" type="text" style="margin-left: 16px;" :class="filterStatusClass(scope.row.status)">{{ filterStatus(scope.row.status) }}</el-button>
            </el-popconfirm>

          </div>
        </template>
      </el-table-column>
    </history-table>

    <res-box ref="registerBox" :type="resType" :current="false" @getTableData="getUserInfo" />
  </div>
</template>

<script>
import { findUserList, userPromotion, blockUser } from '@/api/user'
import historyTable from '@/components/table'
import tableSearch from '@/components/search'
import resBox from '@/components/register'
import { exportTableToExcel } from '@/utils/tool'

export default {
  components: { historyTable, tableSearch, resBox },
  data() {
    return {
      tableData: [],
      tableForm: {
        findMsg: '',
        pageNum: 1,
        pageSize: 10,
        total: 0
      },
      BASE_URL: process.env.VUE_APP_PHOTO_API + 'other/',
      resType: '',
      operationShow: false
      // isEdit: false
    }
  },
  watch: {
    '$store.state.user.userInfo': {
      handler(newVal, oldVal) {
        if (newVal.userIdentity === 3) {
          this.operationShow = true
        }
      },
      immediate: true,
      deep: true // 可以深度检测到 对象的属性值的变化
    }
  },
  methods: {
    exportTableToExcel,
    async getUserInfo(val) {
      // 数据改变,重新获取数据
      val && Object.assign(this.tableForm, val)
      const { data, success } = await findUserList(this.tableForm)
      // success && (this.tableData = data)
      if (success) {
        this.tableData = JSON.parse(JSON.stringify(data.list))
        this.tableForm.total = data.total
      }
    },
    filterSex(key) {
      let val = ''
      switch (key) {
        case 1:
          val = '男'
          break
        case 2:
          val = '女'
          break
        default:
          val = '未知'
          break
      }
      return val
    },
    // 1:普通账号; 2:管理员
    filterIdentity(key) {
      let val = ''
      switch (key) {
        case 1:
          val = '升权'
          break
        case 2:
          val = '降权'
          break
        default:
          break
      }
      return val
    },
    filterIdentityClass(key) {
      let val = ''
      switch (key) {
        case 1:
          val = 'success'
          break
        case 2:
          val = 'error'
          break
        default:
          break
      }
      return val
    },
    filterStatusClass(key) {
      let val = ''
      switch (key) {
        case 1:
          val = 'error'
          break
        case 2:
          val = 'success'
          break
        default:
          break
      }
      return val
    },
    async handleChangeIdentity(data) {
      switch (data.userIdentity) {
        case 1:
          data.userIdentity = 2
          break
        case 2:
          data.userIdentity = 1
          break
        default:
          break
      }
      const { success } = await userPromotion(data)
      success && this.$message({
        message: '用户权限已修改成功!',
        type: 'success'
      })
      this.getUserInfo()
    },
    handleOpenUserInfo(type, val) {
      this.resType = type
      if (val) {
        Object.assign(this.$refs.registerBox.registerForm, val)
      }
      setTimeout(() => {
        this.$refs.registerBox.$refs.dialog.dialogVisible = true
      }, 0)
    },
    filterStatus(key) {
      let str = ''
      switch (key) {
        case 1:
          str = '冻结'
          break
        case 2:
          str = '解冻'
          break
        default:
          break
      }
      return str
    },
    async handleChangeStatus(data) {
      switch (data.status) {
        case 1:
          data.status = 2
          break
        case 2:
          data.status = 1
          break
        default:
          break
      }
      const { success } = await blockUser(data)
      const text = data.status === 1 ? '解冻!' : '冻结!'
      success && this.$message({
        message: '用户账号已' + text,
        type: 'success'
      })
      this.getUserInfo()
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
.avatar-img {
  img {
    width: 100px;
    height: 100px;
    display: block;
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
    margin-right: 16px;
  }
}

</style>
