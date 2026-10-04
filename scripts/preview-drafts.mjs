// Private, loopback-only preview; production builds always exclude drafts.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const astro = fileURLToPath(new URL('../node_modules/astro/bin/astro.mjs', import.meta.url));
const child = spawn(process.execPath, [astro, 'dev', '--host', '127.0.0.1', '--port', '4322'], {
  stdio: 'inherit',
  env: { ...process.env, PUBLIC_CATALOG_PREVIEW_DRAFTS: '1' },
});
child.on('exit', (code) => process.exit(code ?? 0));
