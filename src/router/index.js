import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useAdminStore } from '@/stores/adminStore'

const routes = [
  // --- 用户端路由 ---
  {
    path: '/',
    component: () => import('@/views/Home/Home.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Auth/Login.vue'),
    meta: { title: '用户登录' },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Auth/Register.vue'),
    meta: { title: '用户注册' },
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('@/views/Cart/Cart.vue'),
    meta: { title: '我的购物车', requiresAuth: true },
  },
  {
    path: '/address',
    name: 'Address',
    component: () => import('@/views/Profile/AddressList.vue'),
    meta: { title: '收货地址', requiresAuth: true },
  },
  {
    path: '/order/create',
    name: 'OrderCreate',
    component: () => import('@/views/Order/OrderCreate.vue'),
    meta: { title: '确认订单', requiresAuth: true },
  },
  {
    path: '/orders',
    name: 'OrderList',
    component: () => import('@/views/Order/OrderList.vue'),
    meta: { title: '我的订单', requiresAuth: true },
  },
  {
    path: '/orders/:orderId',
    name: 'OrderDetail',
    component: () => import('@/views/Order/OrderDetail.vue'),
    meta: { title: '订单详情', requiresAuth: true },
  },
  {
    path: '/products',
    name: 'ProductList',
    component: () => import('@/views/Product/ProductList.vue'),
    meta: { title: '商品列表' },
  },
  {
    path: '/products/:id',
    name: 'ProductDetail',
    component: () => import('@/views/Product/ProductDetail.vue'),
    meta: { title: '商品详情' },
  },

  // --- 管理员端路由 ---
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/views/Admin/AdminLogin.vue'),
    meta: { title: '管理员登录' },
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('@/views/Admin/Dashboard.vue'),
    meta: { title: '管理后台', requiresAuth: true, role: 'ADMIN' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return { top: 0 }
  },
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const adminStore = useAdminStore() // 获取 adminStore

  if (to.meta.title) {
    document.title = `${to.meta.title} - 京东商城模拟`
  }

  // 判断是否是后台路由
  const isAdminRoute = to.path.startsWith('/admin')

  // 权限校验
  if (to.meta.requiresAuth) {
    if (isAdminRoute) {
      // --- 后台权限逻辑 ---
      if (!adminStore.token) {
        next('/admin/login')
      } else {
        // 这里简单校验一下角色，严谨的话后端接口会拦截
        if (to.meta.role === 'ADMIN' && adminStore.userInfo.role !== 'ADMIN') {
          // 有 Token 但角色不对（虽然理论上 adminLogin 只允许 ADMIN）
          next('/admin/login')
        } else {
          next()
        }
      }
    } else {
      // --- 前台权限逻辑 ---
      if (!userStore.token) {
        next({ path: '/login', query: { redirect: to.fullPath } })
      } else {
        next()
      }
    }
  } else {
    // 不需要登录的页面
    next()
  }
})

export default router
