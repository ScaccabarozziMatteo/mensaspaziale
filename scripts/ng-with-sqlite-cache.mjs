import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const angularCli = resolve('node_modules/@angular/cli/bin/ng.js');
const result = spawnSync(process.execPath, [angularCli, ...process.argv.slice(2)], {
  env: {
    ...process.env,
    NG_BUILD_CACHE_STORE: process.env.NG_BUILD_CACHE_STORE ?? 'sqlite',
  },
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
