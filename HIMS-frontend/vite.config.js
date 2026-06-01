import react from '@vitejs/plugin-react'

/** @type {import('vite').UserConfig} */
export default {
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://lims.poxiatechnologies.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
}
