import { resolve } from 'path';
import { existsSync } from 'fs';
import logger from '@percy/logger';
import spawn from 'cross-spawn';
import which from 'which';

// Run a command with the specified args
export async function run(command, args) {
  // adjust stdio based on the loglevel
  let stdio = ['inherit', 'inherit', 'inherit'];

  if (logger.loglevel() === 'silent') {
    stdio = ['ignore', 'ignore', 'ignore'];
  } else if (logger.loglevel() === 'warn') {
    stdio = ['ignore', 'ignore', 'inherit'];
  }

  // run the command synchronously
  args = args.filter(Boolean);
  logger('migrate:run').debug(`Running "${command} ${args.join(' ')}"`);
  let { status, error } = spawn.sync(which.sync(command), args, { stdio });

  // handle errors
  if (!error && status) {
    error = Object.assign(new Error(), {
      message: `${command} failed with exit code ${status}`,
      status
    });
  }

  if (error) {
    throw error;
  }
}

// Common commands to manage node packages
export const npm = {
  // Determine package manager based on lockfile
  get manager() {
    let hasYarnLock = existsSync(`${process.cwd()}/yarn.lock`);
    let hasNpmLock = existsSync(`${process.cwd()}/package-lock.json`);

    if (hasYarnLock && hasNpmLock) {
      logger('migrate:npm').warn('Found both a yarn.lock and package-lock.json, defaulting to npm');
    }

    // cache the result so the above check and warning only happen once
    let result = (hasYarnLock && !hasNpmLock && 'yarn') || 'npm';
    Object.defineProperty(npm, 'manager', { get: () => result });
    return result;
  },

  // Install packages with npm or yarn to dev dependencies by default
  install(specs, { dev = true } = {}) {
    return run(npm.manager, {
      npm: ['install', dev && '--save-dev'].concat(specs),
      yarn: ['add', dev && '--dev'].concat(specs)
    }[npm.manager]);
  },

  // Uninstall packages with npm or yarn
  uninstall(specs) {
    return run(npm.manager, {
      npm: ['uninstall'].concat(specs),
      yarn: ['remove'].concat(specs)
    }[npm.manager]);
  }
};

export const codeshift = {
  get path() {
    let value = resolve(__dirname, '../.codeshift');
    Object.defineProperty(codeshift, 'path', { value });
    return value;
  },

  async install(lang, bin, install) {
    bin = resolve(__dirname, '../.codeshift', lang, bin);

    if (!existsSync(bin)) {
      await install();
    }

    codeshift[lang].bin = bin;
    return bin;
  },

  async run(lang, args) {
    return run(await codeshift[lang].install(), args);
  },

  js: {
    install: () => codeshift.install('js', 'node_modules/jscodeshift/bin/jscodeshift.js', () => {
      return run('npm', [`--prefix=${codeshift.path}/js`, 'install', 'jscodeshift']);
    })
  }
};
