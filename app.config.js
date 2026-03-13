/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');
const config = appJson.expo;
module.exports = {
  expo: {
    ...config,
    extra: {
      ...config.extra,
      // Override with EXPO_PUBLIC_SERVER_URL for Wi‑Fi testing (e.g. http://192.168.1.5:3001)
      serverUrl: process.env.EXPO_PUBLIC_SERVER_URL || config.extra?.serverUrl || 'http://localhost:3001',
    },
  },
};
