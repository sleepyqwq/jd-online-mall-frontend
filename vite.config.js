import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 关键修复：告诉 Vite，'@' 符号指向 './src' 目录
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    // 代理配置保持不变
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 后端地址
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '') // 根据后端情况决定是否需要这行
      },
      // 【新增】假设你的后端图片映射路径是/images
    '/images': { 
      target: 'http://localhost:8080',
      changeOrigin: true
    }
    }
  }
})