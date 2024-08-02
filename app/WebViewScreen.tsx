// WebViewScreen.tsx
import { useGlobalSearchParams } from 'expo-router';
import React from 'react';
import { WebView } from 'react-native-webview';

const WebViewScreen = () => {
  const { url }: any = useGlobalSearchParams();
  return <WebView source={{ uri: url }} />;
};

export default WebViewScreen;
