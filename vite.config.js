import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // 端口号，默认5173，也可以自定义
    port: 5173,
    // 【关键配置】代理设置
    proxy: {
      // 这里的 '/api' 对应接口文档中的前缀
      '/api': {
        // 后端服务的实际地址 (请根据后端人员给你的实际地址修改)
        // 如果后端在本地跑，通常是 http://localhost:8080
        target: 'http://localhost:8080',

        // 允许跨域
        changeOrigin: true,

        // 路径重写规则：
        // 接口文档规定前缀是 /api
        // 如果后端代码里写的路径也包含了 /api (例如 @RequestMapping("/api/auth"))，则不需要 rewrite。
        // 如果后端代码里只写了 /auth，没写 /api，则需要把 /api 去掉，如下行所示（通常建议保留，视后端实现而定）：
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
})
