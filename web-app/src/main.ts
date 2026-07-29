import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;

import HallidayPayments from '@halliday-sdk/payments';
import { connectSigner } from '@halliday-sdk/payments/ethers';
import { createAppKit } from '@reown/appkit';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import {
  abstract, apeChain, arbitrum, avalanche, base, berachain, bsc, dfk, gensyn, hyperEvm,
  injective, ink, kaia, katana, linea, mainnet, mantle, megaeth, metis, monad, optimism,
  plasma, polygon, ronin, sei, stable, story, tempo, unichain, worldchain, zkSync,
} from '@reown/appkit/networks';
import { UniversalProvider } from '@walletconnect/universal-provider';
import { BrowserProvider } from 'ethers';
import './style.css';

const { reownProjectId, hallidayConfig, redirectScheme, chainIds } = (window as any).__APP_CONFIG__;

const HALLIDAY_NETWORKS = [
  base, mainnet, arbitrum, optimism, polygon, bsc, avalanche, abstract, apeChain, berachain,
  dfk, gensyn, hyperEvm, injective, ink, kaia, katana, linea, mantle, megaeth, metis, monad,
  plasma, ronin, sei, stable, story, tempo, unichain, worldchain, zkSync,
];

const networks = HALLIDAY_NETWORKS.filter((n) => chainIds.includes(n.id));
if (!networks.length) throw new Error('APP_CONFIG.chainIds matched no known network');

const metadata = {
  name: 'Halliday SDK React Native Demo',
  description: 'Halliday SDK React Native Demo',
  url: 'https://app.halliday.xyz',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
  redirect: { native: redirectScheme },
};


const universalProvider = await UniversalProvider.init({ projectId: reownProjectId, metadata });

(window as any).reconnectRelay = async () => {
  const { relayer } = universalProvider.client.core;
  if (relayer.connected) return;

  relayer.transportExplicitlyClosed = false;
  try {
    await relayer.restartTransport();
  } catch (e) {
    console.warn('relay reconnect failed', e);
  }
};

const appKit = createAppKit({
  adapters: [new EthersAdapter()],
  universalProvider,
  networks: networks as [(typeof networks)[number], ...typeof networks],
  defaultNetwork: networks[0],
  projectId: reownProjectId,
  metadata,
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

const halliday = new HallidayPayments(hallidayConfig);

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const connectSection = $('connect-section');
const hallidaySection = $('halliday-section');
const statusText = $('status-text');
const actionButtons = ['btn-deposit', 'btn-withdraw', 'btn-activity'].map((id) =>
  $<HTMLButtonElement>(id),
);

function render(connected: boolean, ready: boolean, status = '') {
  connectSection.classList.toggle('hidden', connected);
  hallidaySection.classList.toggle('hidden', !connected);
  actionButtons.forEach((button) => (button.disabled = !ready));
  statusText.textContent = status;
}

async function attachWallet(address: string) {
  const walletProvider = appKit.getWalletProvider();
  if (!walletProvider) throw new Error('Wallet provider unavailable');

  const owner = connectSigner((ownerAddress) =>
    new BrowserProvider(walletProvider as any).getSigner(ownerAddress ?? address),
  );

  halliday.updateConfig({
    owner,
    deposit: { funders: [owner], destinationAddress: address },
    withdrawal: { funder: owner },
  });

  await halliday.ready();
}

let attachedAddress: string | null = null;

appKit.subscribeAccount(({ isConnected, address }) => {
  if (!isConnected || !address) {
    attachedAddress = null;
    render(false, false);
    return;
  }
  if (address.toLowerCase() === attachedAddress) return;

  attachedAddress = address.toLowerCase();
  render(true, false, 'Loading…');
  attachWallet(address)
    .then(() => render(true, true))
    .catch((e: Error) => render(true, false, e.message));
});

halliday.on('status', (s) => console.log('halliday status:', s.type, s.payload));
halliday.on('error', (e) => console.error(`halliday error (${e.source}):`, e.message));
halliday.on('close', () => console.log('halliday widget closed'));

$('btn-connect').addEventListener('click', () => appKit.open());
$('btn-restart').addEventListener('click', () => appKit.disconnect().catch(() => {}));
$('btn-deposit').addEventListener('click', () => halliday.openDeposit());
$('btn-withdraw').addEventListener('click', () => halliday.openWithdrawal());
$('btn-activity').addEventListener('click', () => halliday.openActivity());
