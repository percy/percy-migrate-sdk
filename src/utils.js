import fs from 'fs';
import url from 'url';
import path from 'path';
import which from 'which';
import spawn from 'cross-spawn';
import logger from '@percy/logger';

export const ROOT = path.dirname(url.fileURLToPath(import.meta.url));

// Run a command with the specified args
export function run(command, args, pipe) {
  // adjust stdio based on the loglevel
  let stdio = ['inherit', 'inherit', 'inherit'];

  if (pipe) {
    stdio = ['ignore', 'pipe', 'pipe'];
  } else if (logger.loglevel() === 'silent') {
    stdio = ['ignore', 'ignore', 'ignore'];
  } else if (logger.loglevel() === 'warn') {
    stdio = ['ignore', 'ignore', 'inherit'];
  }

  // run the command synchronously
  args = args.filter(Boolean);
  logger('migrate:run').debug(`Running "${command} ${args.join(' ')}"`);
  let result = spawn.sync(which.sync(command), args, { stdio });
  let { status, stdout, stderr, error } = result;

  // handle errors
  if (!error && status) {
    error = Object.assign(new Error(), {
      message: `${command} failed with exit code ${status}` + (
        stderr ? `:\n\n${stderr}` : '.'),
      status
    });
  }

  if (error) {
    throw error;
  }

  // return output
  return stdout;
}

// Common commands to manage node packages
export const npm = {
  // Determine package manager based on lockfile
  get manager() {
    let hasYarnLock = fs.existsSync(`${process.cwd()}/yarn.lock`);
    let hasNpmLock = fs.existsSync(`${process.cwd()}/package-lock.json`);

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
    let value = path.resolve(ROOT, '../.codeshift');
    Object.defineProperty(codeshift, 'path', { value });
    return value;
  },

  install(lang, bin, install) {
    bin = path.resolve(ROOT, '../.codeshift', lang, bin);
    if (!fs.existsSync(bin)) install();
    codeshift[lang].bin = bin;
    return bin;
  },

  run(lang, args) {
    return run(codeshift[lang].install(), args);
  },

  js: {
    install: () => codeshift.install('js', 'node_modules/jscodeshift/bin/jscodeshift.js', () => {
      return run('npm', [`--prefix=${codeshift.path}/js`, 'install', 'jscodeshift']);
    })
  },
  ruby: {
    install: () => codeshift.install('ruby', 'bin/codeshift', () => {
      return run('gem', ['install', 'codeshift', `--install-dir=${codeshift.path}/ruby`, '--no-document']);
    })
  }
};

// gather list of migrations & make it easy to override for testing
export const migrations = {
  async load() {
    return Promise.all([
      'capybara',
      'cypress',
      'ember',
      'nightmare',
      'nightwatch',
      'protractor',
      'puppeteer',
      'selenium-java',
      'selenium-javascript',
      'selenium-python',
      'testcafe',
      'webdriverio'
    ].map(async m => (
      await import(`./migrations/${m}.js`)
    ).default));
  }
};
