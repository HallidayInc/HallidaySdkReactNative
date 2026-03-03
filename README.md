# Halliday SDK React Native Demo

A React Native app that embeds the [Halliday](https://halliday.xyz) payments widget inside a WebView. Users connect a wallet via [Reown AppKit](https://reown.com) (WalletConnect v2), then interact with the Halliday checkout flow — all within the native app.

## How It Works

A single-page web app (in `web-app/`) is built with Vite into a self-contained HTML string, which gets loaded into a React Native WebView. Config values (API keys, outputs, redirect scheme) are injected from the RN side via `injectedJavaScriptBeforeContentLoaded`, so the web bundle doesn't need to be rebuilt when config changes.

Wallet deep links (MetaMask, Trust, Coinbase Wallet, etc.) are intercepted and forwarded to the native OS so the wallet app opens directly.

## Prerequisites

- Node.js (v22+)
- Xcode (iOS) or Android SDK (Android)
- CocoaPods (iOS)

## Environment Variables

Create `.env` in the project root:

```
EXPO_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
EXPO_PUBLIC_HALLIDAY_API_KEY=your_halliday_api_key
```

Get a project ID from [Reown Cloud](https://cloud.reown.com) and an API key from [Halliday](https://halliday.xyz).

## Setup

```
npm install
npm run install:web
npm run build:web
```

`build:web` generates `src/webAppHtml.ts` — a single exported HTML string that the WebView loads. This file is gitignored; regenerate it anytime the web app source changes.

## Run

Runs with Expo Go mobile app. Scan the QR code in the terminal!

```
npm start
```

Simulator:

```
npx expo run:ios
npx expo run:android
```

Runs on your device.

```
npx expo run:ios --device
npx expo run:android --device
```

## Config

All runtime config lives in `APP_CONFIG` in `App.tsx`. Change values there and reload the RN app — no web rebuild needed.

| Field | Purpose |
|-------|---------|
| `reownProjectId` | Reown AppKit / WalletConnect project ID |
| `hallidayConfig.apiKey` | Halliday API key |
| `hallidayConfig.outputs` | Token output targets (e.g. `base:0x833589f...`) |
| `hallidayConfig.windowType` | Halliday widget display mode |
| `redirectScheme` | Custom URL scheme for wallet return redirects |

## Project Structure

```
App.tsx              React Native shell (WebView + deep link handling)
web-app/
  src/main.ts        AppKit + Halliday SDK integration
  index.html         Web app shell
  vite.config.ts     Build config (includes AppKit patches)
  scripts/           Post-build HTML export script
src/
  webAppHtml.ts      Auto-generated (npm run build:web)
```
