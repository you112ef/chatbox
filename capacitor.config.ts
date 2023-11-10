import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'xyz.chatboxapp.chatbox',
  appName: 'Chatbox',
  webDir: 'release/app/dist/renderer',
  server: {
    androidScheme: 'https'
  },
  ios: {
    scheme: 'Chatbox AI'
  }
};

export default config;
