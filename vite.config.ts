import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: './',
      
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      
      plugins: [react()],
      
      // 👇👇👇 核心修改：添加这段 build 配置 👇👇👇
      build: {
        sourcemap: false,   // 关掉源映射，极大地节省内存！
        chunkSizeWarningLimit: 1500, // 调高警告阈值，减少控制台废话
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        return 'vendor'; // 把依赖分包，防止单个文件过大
                    }
                }
            }
        }
      },
      // 👆👆👆 修改结束 👆👆👆

      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});