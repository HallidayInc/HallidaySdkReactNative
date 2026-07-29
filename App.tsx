import { useEffect, useRef } from 'react';
import { StyleSheet, Linking, AppState } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import * as WebBrowser from 'expo-web-browser';
import { WEB_APP_HTML } from './src/webAppHtml';

const HALLIDAY_API_KEY = process.env.EXPO_PUBLIC_HALLIDAY_API_KEY!;
const REOWN_PROJECT_ID = process.env.EXPO_PUBLIC_REOWN_PROJECT_ID!;

const CHAIN_IDS = [
  8453,  // base
  1,     // ethereum
  42161, // arbitrum
  10,    // optimism
  137,   // polygon
  56,    // bsc
  43114, // avalanche
];

const APP_CONFIG = {
  reownProjectId: REOWN_PROJECT_ID,
  chainIds: CHAIN_IDS,
  hallidayConfig: {
    apiKey: HALLIDAY_API_KEY,
    deposit: {
      // USDC on Base
      outputs: ['base:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'],
    },
  },
  redirectScheme: 'hallidaysdkdemo://',
};

const CONFIG_INJECTION_SCRIPT = `window.__APP_CONFIG__ = ${JSON.stringify(APP_CONFIG)}; true;`;

const WALLET_SCHEMES = [
  'metamask:', 'trust:', 'safe:', 'rainbow:', 'uniswap:',
  'zerion:', 'imtokenv2:', 'cbwallet:', 'wc:',
];

const WALLET_DOMAINS = [
  'link.metamask.io', 'metamask.app.link', 'link.trustwallet.com',
  'go.cb-w.com', 'rnbwapp.com', 'links.uniswap.org',
];

const REDIRECT_SCHEME = `${APP_CONFIG.redirectScheme}wc`;

function isWalletDeepLink(url: string): boolean {
  if (WALLET_SCHEMES.some((s) => url.startsWith(s))) return true;
  try {
    const { hostname } = new URL(url);
    return WALLET_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

function openWallet(url: string) {
  const separator = url.includes('?') ? '&' : '?';
  const target = `${url}${separator}redirectUrl=${encodeURIComponent(REDIRECT_SCHEME)}`;
  Linking.openURL(target).catch(() => {});
}

function handleNavigation(request: ShouldStartLoadRequest): boolean {
  const { url, isTopFrame } = request;

  if (isWalletDeepLink(url)) {
    openWallet(url);
    return false;
  }

  if (!isTopFrame) return true;
  if (url === 'about:blank' || url.startsWith('https://app.halliday.xyz')) return true;

  if (url.startsWith('http://') || url.startsWith('https://')) {
    WebBrowser.openBrowserAsync(url).catch(() => {});
    return false;
  }

  return true;
}

function handleOpenWindow(e: { nativeEvent: { targetUrl: string } }) {
  const { targetUrl } = e.nativeEvent;
  if (isWalletDeepLink(targetUrl)) {
    openWallet(targetUrl);
  } else {
    WebBrowser.openBrowserAsync(targetUrl).catch(() => {});
  }
}

// Revives the WalletConnect relay socket, dropped while the WebView was suspended.
const RECONNECT_RELAY_SCRIPT = 'window.reconnectRelay?.(); true;';

export default function App() {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') webViewRef.current?.injectJavaScript(RECONNECT_RELAY_SCRIPT);
    });
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ html: WEB_APP_HTML, baseUrl: 'https://app.halliday.xyz' }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          injectedJavaScriptBeforeContentLoaded={CONFIG_INJECTION_SCRIPT}
          originWhitelist={['https://*', 'metamask://*', 'trust://*', 'safe://*', 'rainbow://*', 'uniswap://*', 'zerion://*', 'imtokenv2://*', 'cbwallet://*', 'wc://*']}
          onShouldStartLoadWithRequest={handleNavigation}
          onOpenWindow={handleOpenWindow}
          setSupportMultipleWindows
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  webview: { flex: 1, backgroundColor: '#fff' },
});
