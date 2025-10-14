export const ENV_CONFIG = {
  development: {
    apiUrl: 'http://localhost:3001/api',
    debug: true,
    mockData: false,
  },
  production: {
    apiUrl: import.meta.env.VITE_API_URL || 'https://api.noliassurance.com/api',
    debug: false,
    mockData: false,
  },
} as const;

export const getCurrentEnv = () => {
  return import.meta.env.MODE as keyof typeof ENV_CONFIG;
};

export const getEnvConfig = () => {
  const env = getCurrentEnv();
  return ENV_CONFIG[env] || ENV_CONFIG.development;
};
