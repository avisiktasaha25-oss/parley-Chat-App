import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const serverPort = process.env.SERVER_PORT || 5181;
const target = `http://localhost:${serverPort}`;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: Number(process.env.CLIENT_PORT || 5180),
    proxy: { '/socket.io': { target, ws: true }, '/api': target },
  },
});
