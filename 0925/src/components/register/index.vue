<template>
  <div>
    <dialog-box ref="dialog" :title="type === 'register' ? '注册' : '修改'" width="40%" :is-control="false" @toSubmit="handleRegister" @toClear="toClearDia">
      <el-form ref="resForm" :inline="true" label-position="left" :model="registerForm" :rules="resRules" label-width="80px" class="register-form">
        <el-row>
          <el-col :span="12">
            <el-form-item label="用户名" prop="phone">
              <el-input v-model.trim="registerForm.phone" :disabled="type === 'amend'" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model.trim="registerForm.realName" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="密码" :prop="(type === 'register' || registerForm.password) ? 'password' : ''">
              <el-input v-model.trim="registerForm.password" type="password" autocomplete="off" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="确认密码" :prop="(type === 'register' || registerForm.password) ? 'checkPass' : ''">
              <el-input v-model.trim="registerForm.checkPass" type="password" autocomplete="off" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="生日" prop="birthday" class="element-other">
              <!-- style="width: 186px;"  -->
              <el-date-picker v-model="registerForm.birthday" value-format="yyyy-MM-dd" type="date" placeholder="选择日期" style="width: 186px;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别" prop="sex">
              <el-radio-group v-model="registerForm.sex">
                <el-radio :label="0">未知</el-radio>
                <el-radio :label="1">男</el-radio>
                <el-radio :label="2">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="职务">
              <el-input v-model.trim="registerForm.post" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工号">
              <el-input v-model.trim="registerForm.workNo" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="头像">
          <!-- :headers="{
              'content-type': 'multipart/form-data'
            }" -->
          <el-upload
            class="avatar-uploader"
            action=""
            :show-file-list="false"
            :http-request="handleUpload"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="registerForm.avatar" :src="BASE_URL + registerForm.avatar" class="avatar">
            <i v-else class="el-icon-plus avatar-uploader-icon" />
          </el-upload>
        </el-form-item>
      </el-form>
    </dialog-box>
  </div>
</template>

<script>
import { register, uploadPhoto, update } from '@/api/user'
import dialogBox from '@/components/dialog'
import { setUserInfo } from '@/utils/auth'

export default {
  components: { dialogBox },
  props: {
    type: {
      type: String,
      default: 'register' // amend
    },
    current: {
      type: Boolean,
      default: true
    }
  },
  data() {
    var validatePass = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请输入密码'))
      } else {
        if (this.registerForm.checkPass !== '') {
          this.$refs.resForm.validateField('checkPass')
        }
        callback()
      }
    }
    var validatePass2 = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码'))
      } else if (value !== this.registerForm.password) {
        callback(new Error('两次输入密码不一致!'))
      } else {
        callback()
      }
    }
    return {
      BASE_URL: process.env.VUE_APP_PHOTO_API + 'other/',
      registerForm: {
        phone: '',
        password: '',
        realName: '',
        sex: 0,
        birthday: '',
        post: '',
        workNo: '',
        avatar: '',
        checkPass: ''
      },
      resRules: {
        phone: [
          { required: true, message: '请输入手机号', trigger: 'blur' },
          { min: 11, max: 11, message: '请输入手机号', trigger: 'blur' }
        ],
        password: [{ required: true, validator: validatePass, trigger: 'blur' }],
        checkPass: [{ required: true, validator: validatePass2, trigger: 'blur' }],
        realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
        sex: [{ required: true, message: '请选择性别', trigger: 'blur' }],
        birthday: [{ required: true, message: '请选择生日', trigger: 'blur' }]
      }
    }
  },
  methods: {
    handleRegister() {
      this.$refs.resForm.validate((valid) => {
        if (valid) {
          if (this.$props.type === 'register') {
            register(this.registerForm).then((res) => {
              const { success } = res
              if (success) {
                this.$message({
                  message: '注册成功',
                  type: 'success'
                })
                this.$refs.dialog.dialogVisible = false
                this.$emit('getTableData')
              }
            })
          } else {
            update(this.registerForm).then((res) => {
              const { success, data } = res
              if (success) {
                this.$message({
                  message: '修改成功',
                  type: 'success'
                })
                if (this.$props.current) {
                  this.$store.commit('user/SET_USERINFO', data)
                  setUserInfo(data)
                }
                this.$refs.dialog.dialogVisible = false
                this.$emit('getTableData')
              }
            })
          }
        } else {
          console.log('验证失败')
          return false
        }
      })
    },
    toClearDia() {
      // 重置表单
      this.$refs.resForm.resetFields() // 无效...
      this.registerForm.phone = ''
      this.registerForm.password = ''
      this.registerForm.realName = ''
      this.registerForm.sex = ''
      this.registerForm.birthday = ''
      this.registerForm.post = ''
      this.registerForm.workNo = ''
      this.registerForm.avatar = ''
      this.registerForm.checkPass = ''
    },
    beforeAvatarUpload(file) {
      const isJPG = /^image\/(jpeg|png|jpg)$/.test(file.type)
      const isLt10M = file.size / 1024 / 1024 < 10

      if (!isJPG) {
        this.$message.error('上传头像图片只能是 JPG/PNG 格式!')
      }
      if (!isLt10M) {
        this.$message.error('上传头像图片大小不能超过 10MB!')
      }

      return isJPG && isLt10M
    },
    async handleUpload(val) {
      const formData = new FormData()
      formData.append('file', val.file, val.file.name)
      // console.log('++++++++++++++++++++++++', formData.getAll('file'))
      const { success, data } = await uploadPhoto(formData)
      if (success) {
        this.$message({
          message: '头像上传成功',
          type: 'success'
        })
        this.registerForm.avatar = data
      }
    }
  }
}
</script>

<style scoped lang="scss">
.avatar-uploader {
  height: 80px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  &.el-upload:hover {
    border-color: #409EFF;
  }
  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 80px;
    height: 80px;
    line-height: 80px;
    text-align: center;
  }
  .avatar {
    width: 80px;
    height: 80px;
    display: block;
  }
}
</style>
