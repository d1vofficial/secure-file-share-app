import { defineConfig, ConfigEnv, UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Conditionally load SSL based on environment and command
const getSSLConfig = (command: string) => {
  // Skip SSL loading during build
  if (command === 'build') {
    return undefined;
  }

  try {
    return {
      key: fs.readFileSync('/cert/key.pem'),
      cert: fs.readFileSync('/cert/cert.pem'),
    };
  } catch (error) {
    // In development, try to read from relative path
    try {
      return {
        key: fs.readFileSync(path.resolve(__dirname, '../cert/key.pem')),
        cert: fs.readFileSync(path.resolve(__dirname, '../cert/cert.pem')),
      };
    } catch (e) {
      console.warn('SSL certificates not found, falling back to HTTP');
      return undefined;
    }
  }
};

export default defineConfig(({ command, mode }: ConfigEnv): UserConfig => {
  const ssl = getSSLConfig(command);
  
  return {
    plugins: [react()],
    server: {
      https: ssl,
      port: 3000,
      host: true,
    },
    preview: {
      https: ssl,
      port: 3000,
      host: true,
    },
    define: {
      'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});