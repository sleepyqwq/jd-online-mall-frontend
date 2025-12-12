import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

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

  // --- 管理员端路由 (新增) ---
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

  if (to.meta.title) {
    document.title = `${to.meta.title} - 京东商城模拟`
  }

  // 权限校验
  if (to.meta.requiresAuth) {
    if (!userStore.token) {
      // 未登录：根据访问的是后台还是前台，跳转不同登录页
      if (to.path.startsWith('/admin')) {
        next('/admin/login')
      } else {
        next({ path: '/login', query: { redirect: to.fullPath } })
      }
    } else {
      // 已登录：如果是后台页面，额外校验角色
      if (to.meta.role === 'ADMIN' && userStore.userInfo.role !== 'ADMIN') {
        // 简单处理：跳回首页或提示无权限，这里先跳用户首页
        next('/')
      } else {
        next()
      }
    }
  } else {
    next()
  }
})

export default router
