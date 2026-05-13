<template>
  <div v-loading="loading" element-loading-text="加载中" style="height: 100%">
    <Layout v-if="!loading" />
  </div>
</template>

<script>
// import Dashboard from '@/views/dashboard'
import { getToken } from '@/utils/auth'
import Layout from '@/layout'

export default {
  components: {
    Layout
  },
  data() {
    return {
      loading: false
    }
  },
  created() {
    this.toLogin()
  },
  methods: {
    async toLogin() {
      this.loading = true
      const hasToken = getToken()
      if (hasToken) {
        await this.$store.dispatch('user/logout')
        this.$store.dispatch('user/toLogin', {
          username: 'user',
          password: 'user'
        }).finally(() => {
          this.loading = false
          this.$router.push({ path: '/dashboard' })
        })
      } else {
        this.$store.dispatch('user/toLogin', {
          username: 'user',
          password: 'user'
        }).finally(() => {
          this.loading = false
          this.$router.push({ path: '/dashboard' })
        })
      }
    }
  }
}
</script>
