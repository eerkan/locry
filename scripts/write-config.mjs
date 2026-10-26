// Writes public/config.json for the dev server (`yarn start`), from .env / the environment.
// The production server and the Docker image generate /config.json at runtime instead.
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runtimeConfig } from './runtime-config.mjs';

const file = resolve(import.meta.dirname, '../public/config.json');
const config = runtimeConfig();
writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
console.log(
  `config.json: ${config.googleClientId ? 'built-in Google Client ID set' : 'no built-in Google Client ID'}, ` +
    `${config.donate ? `donations: ${Object.keys(config.donate).join(', ')}` : 'no donation links'}`,
);
