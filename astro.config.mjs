// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://sirconandoyle.com',
  output: 'static',
  adapter: cloudflare(),
  image: {
    service: passthroughImageService(),
  },

  integrations: [
    sitemap(),
    pagefind(),
  ],

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ['@pagefind/default-ui']
    }
  }
});
