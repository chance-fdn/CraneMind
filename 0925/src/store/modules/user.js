import { login, logout } from '@/api/user'
import { getToken, setToken, removeToken, getUserInfo, setUserInfo, removeUserInfo } from '@/utils/auth'
import { resetRouter, asyncRoutes } from '@/router'
import router from '@/router'

const getDefaultState = () => {
  return {
    token: getToken(),
    userInfo: getUserInfo(),
    addRoutes: []
  }
}

const state = getDefaultState()

const mutations = {
  RESET_STATE: (state) => {
    Object.assign(state, getDefaultState())
  },
  SET_TOKEN: (state, token) => {
    state.token = token
  },
  SET_USERINFO: (state, info) => {
    state.userInfo = JSON.parse(JSON.stringify(info))
  },
  SET_ADDROUTES: (state, data) => {
    state.addRoutes = JSON.parse(JSON.stringify(data))
  }
}

const actions = {
  // add routes
  toAddroutes({ commit }) {
    const type = getUserInfo()?.userIdentity
    const data = asyncRoutes[type] || []
    commit('SET_ADDROUTES', data)
    router.addRoutes(data) // 不能用state中的addRoutes,上面commit后addRoutes没有立即更新
  },

  // user login
  toLogin({ commit, state }, userInfo) {
    const { username, password } = userInfo
    return new Promise((resolve, reject) => {
      login({ lgName: username.trim(), lgPassword: password }).then(response => {
        const { data } = response
        commit('SET_TOKEN', data.token)
        setToken(data.token)
        // userinfo
        delete data.token
        commit('SET_USERINFO', data)
        setUserInfo(data)
        resolve(response)
      }).catch(error => {
        reject(error)
      })
    })
  },

  // user logout
  logout({ commit, state }) {
    return new Promise((resolve, reject) => {
      logout(`token=${state.token}`).then(() => {
        removeToken() // must remove  token  first
        removeUserInfo()
        resetRouter()
        commit('RESET_STATE')
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },

  // remove token
  resetToken({ commit }) {
    return new Promise(resolve => {
      removeToken() // must remove  token  first
      removeUserInfo()
      commit('RESET_STATE')
      resolve()
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}

