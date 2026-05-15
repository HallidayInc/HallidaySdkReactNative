import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;

import { createAppKit } from '@reown/appkit';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import * as networks from '@reown/appkit/networks';
import { openHallidayPayments } from '@halliday-sdk/payments';
import { connectSigner } from '@halliday-sdk/payments/ethers';
import { BrowserProvider } from 'ethers';
import './style.css';

const _cfg = (window as any).__APP_CONFIG__;
const REOWN_PROJECT_ID = _cfg.reownProjectId;
const HALLIDAY_CONFIG = _cfg.hallidayConfig;
const REDIRECT_SCHEME: string = _cfg.redirectScheme;

const evmChains = Object.values(networks).filter(
  (n) => typeof n === 'object' && n !== null && 'id' in n && n.chainNamespace !== 'solana'
);

const appKit = createAppKit({
  adapters: [new EthersAdapter()],
  networks: evmChains,
  projectId: REOWN_PROJECT_ID,
  metadata: {
    name: 'Halliday SDK React Native Demo',
    description: 'Halliday SDK React Native Demo',
    url: 'https://app.halliday.xyz',
    icons: ['https://avatars.githubusercontent.com/u/37784886'],
    redirect: {
      native: REDIRECT_SCHEME,
    },
  },
  excludeWalletIds: [
    'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393', // Phantom (no WC v2 deep links for EVM)
  ],
  features: { swaps: false, onramp: false, analytics: false, email: false, socials: false, reownAuthentication: false },
  themeMode: 'light',
  themeVariables: {
    '--w3m-font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    '--w3m-accent': '#3df57b',
  },
});

let hallidayOpened = false;

const connectSection = document.getElementById('connect-section')!;
const hallidaySection = document.getElementById('halliday-section')!;
const hallidayEl = document.getElementById('halliday')!;
const statusText = document.getElementById('status-text')!;

function reset() {
  hallidayOpened = false;
  connectSection.classList.remove('hidden');
  hallidaySection.classList.add('hidden');
  hallidayEl.innerHTML = '';
  statusText.textContent = '';
}

async function launchHalliday(address: string) {
  statusText.textContent = 'Loading...';

  const provider = await appKit.getUniversalProvider();
  if (!provider) throw new Error('No provider');

  const connectedSigner = connectSigner(() => new BrowserProvider(provider as any).getSigner());

  openHallidayPayments({
    ...HALLIDAY_CONFIG,
    userWallet: connectedSigner,
    destinationAddress: address
  });

  statusText.textContent = '';
}

appKit.subscribeAccount((state: { address?: string; isConnected?: boolean }) => {
  if (state.isConnected && state.address && !hallidayOpened) {
    hallidayOpened = true;
    connectSection.classList.add('hidden');
    hallidaySection.classList.remove('hidden');
    launchHalliday(state.address).catch((e) => {
      statusText.textContent = e instanceof Error ? e.message : 'Failed to load';
    });
  } else if (!state.isConnected && hallidayOpened) {
    reset();
  }
});

document.getElementById('btn-connect')!.addEventListener('click', () => {
  appKit.open();
});

document.getElementById('btn-restart')!.addEventListener('click', async () => {
  try { await appKit.disconnect(); } catch {}
  reset();
});
