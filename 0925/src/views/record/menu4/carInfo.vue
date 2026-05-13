<template>
  <div style="padding:30px;">
    <div class="table-top">
      <div class="search-top">
        <table-date-picker @datePickerChange="handleDateChange" />
        <tableSearch title="根据车牌号查询" desc="车牌号" @getTableData="getDisAreaInfo" />
      </div>
      <div>
        <el-button class="append-btn" type="primary" @click="handleOpen">手动添加车辆运料记录<i class="el-icon-plus el-icon--right" /></el-button>
        <el-button type="success" style="margin-bottom: 10px; margin-left: 10px;" @click="exportTableToExcel('carInfoTable')">导出</el-button>
      </div>
    </div>

    <history-table ref="carInfoTable" :table-form="tableForm" :table-data="tableData" @getTableData="getDisAreaInfo">
      <el-table-column
        prop="license"
        label="车牌号"
      />
      <el-table-column
        prop="platecolor"
        label="车牌颜色"
      />
      <el-table-column
        label="垃圾类型"
        prop="garbageType"
        sortable
        :filters="[{text: '生活垃圾', value: 'domestic'}, {text: '工业垃圾', value: 'industrial'}, {text: '沼渣', value: 'biogasResidue'}, {text: '粗渣', value: 'coarseSlag'}, {text: '残渣', value: 'residue'}, {text: '医疗垃圾', value: 'medical'}]"
        :filter-method="filterHandler"
      >
        <template slot-scope="scope">
          {{ filterGarbageType(scope.row.garbageType) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="contact"
        label="联系人"
      />
      <el-table-column
        prop="contactPhone"
        label="联系人电话"
      />
      <el-table-column
        prop="recotime"
        label="入场时间"
        sortable
      />
      <el-table-column
        label="大图照片"
      >
        <template slot-scope="scope">
          <!-- <img v-if="scope.row.imageFile" :src="getImgSrc(scope.row.imageFile)"> -->
          <div class="table-img">
            <el-image
              class="img-list"
              :src="BASE_URL + scope.row.imageFile"
              :preview-src-list="[BASE_URL + scope.row.imageFile]"
            />
          </div>
        </template>
      </el-table-column>
      <!-- <el-table-column
        prop="imageFileLen"
        label="大图数据"
      /> -->
      <el-table-column
        label="小图照片"
      >
        <template slot-scope="scope">
          <div class="table-img">
            <el-image
              class="img-list"
              :src="BASE_URL + scope.row.imageFragmentFile"
              :preview-src-list="[BASE_URL + scope.row.imageFragmentFile]"
            />
          </div>
        </template>
      </el-table-column>
      <!-- <el-table-column
        prop="imageFragmentFileLen"
        label="小图数据"
      /> -->
      <el-table-column
        label="车辆状态"
        prop="status"
        sortable
        :filters="[{text: '已入场', value: '1'}, {text: '已匹配到卸料门', value: '2'}, {text: '已开始卸料', value: '3'}, {text: '已结束卸料', value: '4'}, {text: '已出场', value: '5'}]"
        :filter-method="filterTags"
      >
        <template slot-scope="scope">
          {{ filterCarStatus(scope.row.status) }}
        </template>
      </el-table-column>
    </history-table>
    <dialog-box ref="addDialog" title="手动添加车辆运料记录" width="40%" :is-control="false" @toSubmit="handleAppend" @toClear="toClearDia">
      <el-form ref="appendForm" :inline="true" label-position="left" :model="appendForm" :rules="appendRules" label-width="110px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="联系人" prop="contact">
              <el-input v-model.trim="appendForm.contact" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人电话" prop="contactPhone">
              <el-input v-model.trim="appendForm.contactPhone" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="车牌" prop="license">
              <el-input v-model.trim="appendForm.license" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车牌颜色">
              <el-input v-model.trim="appendForm.platecolor" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="垃圾类型" prop="garbageType">
              <el-select v-model="appendForm.garbageType" placeholder="请选择" :style="{width: '186px'}">
                <el-option
                  v-for="item in garbageTypeList"
                  :key="item.value"
                  :label="item.name"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车辆状态">
              <el-radio-group v-model="appendForm.status">
                <el-radio label="1">正常</el-radio>
                <el-radio label="2">黑名单</el-radio>
              </el-radio-group></el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="20">
            <el-form-item label="首次入场时间" prop="recotime">
              <el-date-picker
                v-model="appendForm.recotime"
                type="datetime"
                placeholder="选择首次入场时间"
                value-format="yyyy-MM-dd HH:mm:ss"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item label="任务起止时间">
              <table-date-picker @datePickerChange="handleFormDateChange" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="大图照片">
              <!-- <el-input v-model.trim="appendForm.imageFile" /> -->
              <input ref="imageFile" type="file" name="" style="width: 186px" @change="onChange('imageFile')">
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="小图照片">
              <input ref="imageFragmentFile" type="file" name="" style="width: 186px" @change="onChange('imageFragmentFile')">
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </dialog-box>
  </div>
</template>

<script>
import { findCarInfoList, addCarInfo } from '@/api/car'
import historyTable from '@/components/table'
import tableSearch from '@/components/search'
import tableDatePicker from '@/components/datePicker'
import dialogBox from '@/components/dialog'
import { dataURLtoFile } from '@/utils/tool'
import { exportTableToExcel } from '@/utils/tool'

export default {
  components: { historyTable, tableSearch, tableDatePicker, dialogBox },
  data() {
    return {
      BASE_URL: 'data:image/jpeg;base64,',
      tableData: [],
      tableForm: {
        starTime: '',
        endTime: '',
        findMsg: '',
        pageNum: 1,
        pageSize: 10,
        total: 0
      },
      appendForm: {
        contact: '',
        contactPhone: '',
        license: '',
        platecolor: '',
        recotime: '',
        status: '',
        garbageType: '',
        starTime: '',
        endTime: '',
        imageFile: '',
        imageFileLen: 0,
        imageFragmentFile: '',
        imageFragmentFileLen: 0
      },
      appendRules: {
        contact: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
        contactPhone: [
          { required: true, message: '请输入联系人电话', trigger: 'blur' },
          { min: 11, max: 11, message: '请输入联系人电话', trigger: 'blur' }
        ],
        license: [{ required: true, message: '请输入车牌', trigger: 'blur' }],
        recotime: [{ required: true, message: '请选择首次入场时间', trigger: 'blur' }],
        garbageType: [{ required: true, message: '请选择垃圾类型', trigger: 'blur' }]
      },
      garbageTypeList: [
        {
          value: 'domestic',
          name: '生活垃圾'
        },
        {
          value: 'industrial',
          name: '工业垃圾'
        },
        {
          value: 'biogasResidue',
          name: '沼渣'
        },
        {
          value: 'coarseSlag',
          name: '粗渣'
        },
        {
          value: 'residue',
          name: '残渣'
        },
        {
          value: 'medical',
          name: '医疗垃圾'
        }
      ]
    }
  },
  methods: {
    exportTableToExcel,
    async getDisAreaInfo(val) {
      // 数据改变,重新获取数据
      val && Object.assign(this.tableForm, val)
      const { data, success } = await findCarInfoList(this.tableForm)
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
    filterGarbageType(key) {
      let str = ''
      switch (key) {
        case 'domestic':
          str = '生活垃圾'
          break
        case 'industrial':
          str = '工业垃圾'
          break
        case 'biogasResidue':
          str = '沼渣'
          break
        case 'coarseSlag':
          str = '粗渣'
          break
        case 'residue':
          str = '残渣'
          break
        case 'medical':
          str = '医疗垃圾'
          break
        default:
          str = key
          break
      }
      return str
    },
    filterCarStatus(key) {
      let str = ''
      switch (key) {
        case '1':
          str = '已入场'
          break
        case '2':
          str = '已匹配到卸料门'
          break
        case '3':
          str = '已开始卸料'
          break
        case '4':
          str = '已结束卸料'
          break
        case '5':
          str = '已出场'
          break
        default:
          break
      }
      return str
    },
    handleOpen() {
      this.$refs.addDialog.dialogVisible = true
    },
    handleAppend() {
      this.$refs.appendForm.validate((valid) => {
        if (valid) {
          addCarInfo(this.appendForm).then((res) => {
            const { success } = res
            if (success) {
              this.$message({
                message: '添加成功',
                type: 'success'
              })
              this.$refs.addDialog.dialogVisible = false
              this.getDisAreaInfo()
            }
          })
        } else {
          console.log('验证失败')
          return false
        }
      })
    },
    toClearDia() {
      // 重置表单
      // setTimeout(() => {
      //   this.$refs.appendForm.resetFields()
      //   this.registerForm.avatar = ''
      // }, 0)
    },
    handleFormDateChange(val) {
      if (val) {
        this.appendForm.starTime = val[0]
        this.appendForm.endTime = val[1]
      } else {
        this.appendForm.starTime = ''
        this.appendForm.endTime = ''
      }
    },
    getImgSrc(val) {
      var imgFile = dataURLtoFile(val)
      const fileReader = new FileReader() // 创建一个 fileReader
      fileReader.readAsDataURL(imgFile) // 将生成的图片文件读到 fileReader中
      return fileReader.result
    },
    onChange(type) {
      const file = this.$refs[type]?.files[0]
      var reader = new FileReader()
      reader.readAsDataURL(file)
      const that = this
      reader.onload = function() {
        that.appendForm[type] = this.result
        that.appendForm[`${type}Len`] = file.size
      }
    },
    filterHandler(value, row, column) {
      const property = column['property']
      return row[property] === value
    },
    filterTags(value, row) {
      return row.tag === value
    }
  }
}
</script>

<style lang="scss" scoped>
.table-img ::v-deep .el-image-viewer__close {
  color: #fff;
}
.table-top {
  @include flex(space-between);
}
.search-top {
  @include flex;
  position: relative;
  .append-btn {
    position: absolute;
    top: 0;
    right: 0;
  }
}
.table-img {
  img {
    width: 100px;
    height: 100px;
    display: block;
  }
}
</style>
