// @ts-check
import { defineConfig } from 'astro/config';

import lit from '@astrojs/lit';

import tailwind from '@astrojs/tailwind';

import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
  site: 'https://kion-dgl.github.io',
  base: 'MegaManLegends2-VRM',
  integrations: [lit(), tailwind(), preact()]
});