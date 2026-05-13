import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'

/**
 * Note: sub-menu only appear when route children.length >= 1
 * Detail see: https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 *
 * hidden: true                   if set true, item will not show in the sidebar(default is false)
 * alwaysShow: true               if set true, will always show the root menu
 *                                if not set alwaysShow, when item has more than one children route,
 *                                it will becomes nested mode, otherwise not show the root menu
 * redirect: noRedirect           if set noRedirect will no redirect in the breadcrumb
 * name:'router-name'             the name is used by <keep-alive> (must set!!!)
 * meta : {
    roles: ['admin','editor']    control the page roles (you can set multiple roles)
    title: 'title'               the name show in sidebar and breadcrumb (recommend set)
    icon: 'svg-name'/'el-icon-x' the icon show in the sidebar
    breadcrumb: false            if set false, the item will hidden in breadcrumb(default is true)
    activeMenu: '/example/list'  if set path, the sidebar will highlight the path you set
  }
 */

/**
 * constantRoutes
 * a base page that does not have permission requirements
 * all roles can be accessed
 */
export const constantRoutes = [
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },

  {
    path: '/staticShow',
    component: () => import('@/views/staticShow/index'),
    hidden: true
  },

  {
    path: '/404',
    component: () => import('@/views/404'),
    hidden: true
  },

  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    meta: {
      title: '首页',
      breadcrumb: false,
      icon: 'dashboard'
    },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index'),
        meta: { title: '大屏' }
      },
      {
        path: 'sala',
        name: 'Sala',
        component: () => import('@/views/dashboard/sala'),
        meta: { title: '垃圾大厅' }
      },
      {
        path: 'feedPort',
        name: 'FeedPort',
        component: () => import('@/views/dashboard/feedPort'),
        meta: { title: '投料口详情' }
      }
      // {
      //   path: 'test',
      //   name: 'Test',
      //   component: () => import('@/views/dashboard/test'),
      //   meta: { title: '测试' }
      // }
    ]
  },

  {
    path: '/record',
    component: Layout,
    redirect: '/record/menu1',
    name: 'Record',
    meta: {
      title: '记录查询',
      icon: 'nested'
    },
    children: [
      {
        path: 'menu9',
        component: () => import('@/views/record/menu9/index'), // Parent router-view
        name: 'Menu9',
        meta: { title: '行车职责配置信息' }
      },
      {
        path: 'menu1',
        component: () => import('@/views/record/menu1/index'), // Parent router-view
        name: 'Menu1',
        meta: { title: '垃圾池发酵数据' }
      },
      {
        path: 'menu8',
        component: () => import('@/views/record/menu8/index'), // Parent router-view
        name: 'Menu8',
        meta: { title: '垃圾池总库存量' }
      },
      {
        path: 'menu6',
        component: () => import('@/views/record/menu6/index'), // Parent router-view
        name: 'Menu6',
        meta: { title: '医废模式开启记录' }
      },
      {
        path: 'menu2',
        component: () => import('@/views/record/menu2/index'),
        name: 'Menu2',
        meta: { title: '调度记录' },
        children: [
          {
            path: 'menu2-1',
            component: () => import('@/views/record/menu2/instruction'),
            name: 'Menu2-1',
            meta: { title: '调度指令列表' }
          },
          {
            path: 'menu2-2',
            component: () => import('@/views/record/menu2/plcStep'),
            name: 'Menu2-2',
            meta: { title: '调度任务列表' }
          }
        ]
      },
      {
        path: 'menu3',
        component: () => import('@/views/record/menu3/index'),
        name: 'Menu3',
        meta: { title: '设备记录' },
        children: [
          {
            path: 'menu3-1',
            component: () => import('@/views/record/menu3/fault'),
            name: 'Menu3-1',
            meta: { title: '设备告警信息列表' }
          },
          {
            path: 'menu3-2',
            component: () => import('@/views/record/menu3/device'),
            name: 'Menu3-2',
            meta: { title: '设备列表' }
          }
        ]
      },
      {
        path: 'menu4',
        component: () => import('@/views/record/menu4/index'),
        name: 'Menu4',
        meta: { title: '车辆记录' },
        children: [
          {
            path: 'menu4-1',
            component: () => import('@/views/record/menu4/carDis'),
            name: 'Menu4-1',
            meta: { title: '车辆卸料列表' }
          },
          {
            path: 'menu4-2',
            component: () => import('@/views/record/menu4/carInOut'),
            name: 'Menu4-2',
            meta: { title: '车辆进出列表' }
          },
          {
            path: 'menu4-3',
            component: () => import('@/views/record/menu4/carInfo'),
            name: 'Menu4-3',
            meta: { title: '车辆运料列表' }
          }
        ]
      },
      {
        path: 'menu5',
        component: () => import('@/views/record/menu5/index'),
        name: 'Menu5',
        meta: { title: '垃圾吊记录' },
        children: [
          {
            path: 'menu5-1',
            name: 'Menu5-1',
            component: () => import('@/views/record/menu5/putMaterialList'),
            meta: { title: '垃圾吊投料记录' }
          },
          {
            path: 'menu5-2',
            name: 'Menu5-2',
            component: () => import('@/views/record/menu5/countTask'),
            meta: { title: '垃圾吊任务统计' }
          },
          {
            path: 'menu5-3',
            name: 'Menu5-3',
            component: () => import('@/views/record/menu5/taskList'),
            meta: { title: '垃圾吊任务列表' }
          },
          {
            path: 'menu5-4',
            name: 'Menu5-4',
            component: () => import('@/views/record/menu5/sequenceList'),
            meta: { title: '垃圾吊任务时间统计' }
          }
        ]
      },
      {
        path: 'menu7',
        component: () => import('@/views/record/menu7/index'),
        name: 'Menu7',
        meta: { title: '告警记录' },
        children: [
          {
            path: 'menu7-1',
            name: 'Menu7-1',
            component: () => import('@/views/record/menu7/largeObjectList'),
            meta: { title: '大物告警记录' }
          },
          {
            path: 'menu7-2',
            name: 'Menu7-2',
            component: () => import('@/views/record/menu7/craneAlarmList'),
            meta: { title: '行车告警记录' }
          },
          {
            path: 'menu7-3',
            name: 'Menu7-3',
            component: () => import('@/views/record/menu7/xlmCloseList'),
            meta: { title: '卸料门开门关门记录' }
          }
        ]
      }
    ]
  },
  {
    path: '/toShow',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'ToShow',
        component: () => import('@/views/toShow/index'),
        meta: { title: '展示页面', icon: 'eye-open', identity: 2 }
      }
    ]
  }
]
// 1:普通账号; 2:管理员；3:超级管理员
const superRoutes = [
  {
    path: '/form',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'Form',
        component: () => import('@/views/form/index'),
        meta: { title: '参数设置', icon: 'form', identity: 2 }
      }
    ]
  },
  {
    path: '/user',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'User',
        component: () => import('@/views/user/index'),
        meta: { title: '用户管理', icon: 'user', identity: 2 }
      }
    ]
  },
  {
    path: '/logs',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'Logs',
        component: () => import('@/views/logs/index'),
        meta: { title: '日志查询', icon: 'logs', identity: 2 }
      }
    ]
  },

  // 404 page must be placed at the end !!!
  { path: '*', redirect: '/404', hidden: true }
]
export const asyncRoutes = {
  1: [
    // 404 page must be placed at the end !!!
    { path: '*', redirect: '/404', hidden: true }
  ],
  2: superRoutes,
  3: superRoutes
}

const createRouter = () => new Router({
  mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router
