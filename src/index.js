import { existsSync } from 'fs';
import Command, { flags } from '@oclif/command';
import PercyConfig from '@percy/config';
import logger from '@percy/logger';
import inquirer from 'inquirer';
import inspectDeps from './inspect';
import migrations from './migrations';
import { run, npm } from './utils';

inquirer.registerPrompt('glob', require('inquirer-glob-prompt'));

class Migrate extends Command {
  static description = 'Upgrade and migrate your Percy SDK to the latest version';

  static args = [{
    name: 'sdk_name',
    description: 'name of the Percy SDK to migrate (detected by default)'
  }];

  static flags = {
    // version && help
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),

    // cli installation
    'only-cli': flags.boolean({
      description: 'only run @percy/cli installation'
    }),
    'skip-cli': flags.boolean({
      description: 'skip @percy/cli installation'
    }),

    // logging
    verbose: flags.boolean({
      char: 'v',
      description: 'log everything',
      exclusive: ['quiet', 'silent']
    }),
    quiet: flags.boolean({
      char: 'q',
      description: 'log errors only',
      exclusive: ['verbose', 'silent']
    }),
    silent: flags.boolean({
      description: 'log nothing',
      exclusive: ['verbose', 'quiet']
    })
  };

  static examples = [
    '$ npx @percy/migrate',
    '$ npx @percy/migrate @percy/puppeteer',
    '$ npx @percy/migrate --only-cli'
  ];

  // The logger is attached to the default log method to retain internal OCLIF usage
  log = Object.assign(this.log, logger('migrate'));

  // Initialize flags, args, the loglevel, and attach process handlers for cleanup
  init() {
    let { args, flags } = this.parse();
    this.flags = flags;
    this.args = args;

    // sets the log level from verbose, quiet, and silent flags
    logger.loglevel('info', flags);
  }

  // Run migration steps
  async run() {
    // inspect dependencies
    let info = inspectDeps();

    // get the desired sdk migration
    let sdk = !this.flags['only-cli'] &&
      await this.confirmSDK(info, this.args.sdk_name);

    // install @percy/cli and migrate config
    if (!this.flags['skip-cli']) {
      await this.confirmCLI(info);
      await this.confirmConfig();
    }

    // perform sdk migration
    if (sdk?.upgrade) {
      await this.confirmUpgrade(sdk);
      await this.confirmTransforms(sdk);
      this.log.info('Migration complete!');
    } else {
      if (sdk) {
        this.log.warn(
          `Make sure your SDK is upgraded to the latest version (${sdk.name} ${sdk.version})!`
        );
      }
      this.log.info('See further migration instructions here: ' + (
        'https://docs.percy.io/docs/migrating-to-percy-cli'));
    }
  }

  // Confirms installing @percy/cli and possibly removing @percy/agent
  async confirmCLI({ agent, cli }) {
    if (cli) return;

    let { installCLI, skipCLI } = await inquirer.prompt([{
      type: 'confirm',
      name: 'installCLI',
      message: `Install @percy/cli ${agent
        ? '(and remove @percy/agent)?'
        : '(required to run percy)?'}`,
      default: true
    }, {
      type: 'confirm',
      name: 'skipCLI',
      when: ({ installCLI }) => !installCLI,
      message: 'Are you sure you want to skip installing @percy/cli?',
      default: false
    }]);

    if (installCLI || !skipCLI) {
      if (agent) await npm.uninstall('@percy/agent');
      await npm.install('@percy/cli');
    }
  }

  // Confirms possibly running config file migration
  async confirmConfig() {
    try {
      let { filepath } = PercyConfig.search();
      if (!filepath) return;
    } catch (error) {
      this.log.error(error);
      return;
    }

    let { doConfig } = await inquirer.prompt([{
      type: 'confirm',
      name: 'doConfig',
      message: 'Migrate Percy config file?',
      default: true
    }]);

    if (doConfig) {
      let percybin = `${process.cwd()}/node_modules/@percy/cli/bin/run`;

      if (!existsSync(percybin)) {
        this.log.warn('Could not run config migration, @percy/cli is not installed');
      } else {
        await run(percybin, ['config:migrate']);
      }
    }
  }

  // Confirms if the first SDK in the list is the current SDK, otherwise will present a list of
  // supported SDKs to choose from, erroring when the chosen SDK is not in the list
  async confirmSDK({ installed, inspected }, name) {
    let sdk;

    let fromInstalled = SDK => {
      let sdk = installed.find(sdk => sdk instanceof SDK) || new SDK();

      if (!sdk.installed && inspected.includes(sdk.language)) {
        this.log.warn('The specified SDK was not found in your dependencies');
      }

      return sdk;
    };

    // don't guess when a name is provided
    if (name) {
      let SDK = migrations.find(SDK => SDK.matches(name));
      if (!SDK) this.log.warn('The specified SDK is not supported');
      else sdk = fromInstalled(SDK);
    } else {
      [sdk] = installed;
    }

    // confirm the specified or guessed sdk
    if (sdk) {
      let { isSDK } = await inquirer.prompt([{
        type: 'confirm',
        name: 'isSDK',
        message: `Are you currently using ${sdk.aliased}?`,
        default: true
      }]);

      if (isSDK) {
        return sdk;
      }
    }

    // ask to choose from list of supported sdks
    let { fromChoice } = await inquirer.prompt([{
      type: 'list',
      name: 'fromChoice',
      message: 'Which SDK are you using?',
      default: sdk ? migrations.indexOf(sdk.constructor) : 0,
      choices: migrations.map(SDK => ({
        name: SDK.aliased,
        value: () => fromInstalled(SDK)
      })).concat({
        name: '...not listed?',
        value: null
      })
    }]);

    return fromChoice?.();
  }

  // Confirms if the SDK needs an upgrade and performs the upgrade
  async confirmUpgrade(sdk) {
    if (!sdk.needsUpgrade) return;

    let { upgradeSDK } = await inquirer.prompt([{
      type: 'confirm',
      name: 'upgradeSDK',
      message: `Upgrade SDK to ${sdk.name}@${sdk.version}?`,
      default: true
    }]);

    if (upgradeSDK) {
      await sdk.upgrade();
    }
  }

  // Confirms running available SDK transforms
  async confirmTransforms(sdk) {
    for (let t of sdk.transforms) {
      if (sdk.installed && t.when?.(sdk.installed) === false) {
        continue;
      }

      let { doTransform } = await inquirer.prompt([{
        type: 'confirm',
        name: 'doTransform',
        message: t.message,
        default: true
      }]);

      if (!doTransform) {
        continue;
      }

      let { filePaths } = await inquirer.prompt([{
        type: 'glob',
        name: 'filePaths',
        message: 'Which files?',
        default: t.default,
        glob: {
          ignore: 'node_modules'
        }
      }]);

      if (!filePaths?.length) {
        this.log.error('Could not find any files matching the pattern');
        continue;
      }

      await t.transform.call(sdk, filePaths);
    }
  }

  // Log errors using the Percy logger
  async catch(err) {
    try {
      // real errors will bubble
      await super.catch(err);
    } catch (err) {
      // oclif exit method actually throws an error, let it continue
      if (err.oclif && err.code === 'EEXIT') throw err;
      // log all other errors and exit
      this.log.error(err);
      this.exit(err.status || 1);
    }
  }
}

module.exports = Migrate;
