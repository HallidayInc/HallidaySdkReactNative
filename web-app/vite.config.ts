import { defineConfig, Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

function patchAppKit(): Plugin {
  return {
    name: 'patch-appkit',
    transform(code, id) {
      // Include redirect in WC metadata
      if (id.includes('appkit-base-client')) {
        code = code.replace(
          "icons: this.options?.metadata ? this.options?.metadata.icons : ['']",
          "icons: this.options?.metadata ? this.options?.metadata.icons : [''], redirect: this.options?.metadata?.redirect",
        );
        return code;
      }

      // Skip SIWE one-click auth — connect without requesting a signature
      if (id.includes('WalletConnectConnector')) {
        code = code.replace(
          'async authenticate() {',
          'async authenticate() { return false;',
        );
        return code;
      }

      // Skip post-connection SIWE sign message prompt
      if (id.includes('SIWXUtil')) {
        code = code.replace(
          'async initializeIfEnabled(caipAddress',
          'async initializeIfEnabled(_caipAddress) { return; }, async _initializeIfEnabled(caipAddress',
        );
        return code;
      }
    },
  };
}

export default defineConfig({
  plugins: [patchAppKit(), viteSingleFile()],
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
});
