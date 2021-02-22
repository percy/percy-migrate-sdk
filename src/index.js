import Command, { flags } from '@oclif/command';
import logger from '@percy/logger';
import inquirer from 'inquirer';
import inspectDeps from './inspect';
import migrations from './migrations';

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
    '$ npx @percy/migrate @percy/puppeteer'
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

    // ensure cleanup is always performed
    let cleanup = () => this.finally();
    process.on('SIGHUP', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }

  // Run migration steps
  async run() {
    // inspect dependencies
    let info = inspectDeps();

    // get the desired sdk migration
    let sdk = await this.confirmSDK(this.args.sdk_name, info.installed);

    // install @percy/cli and migrate config
    // if (!this.flags['skip-cli']) {
    //   await this.confirmCLI(!!info.agent);
    //   await this.confirmConfig();
    // }

    // perform sdk migration
    if (sdk) {
      // await this.confirmUpgrade(sdk);
      // await this.confirmTransforms(sdk);
      this.log.info('Migration complete!');
    } else {
      this.log.info('See further migration instructions here: ' + (
        'https://docs.percy.io/docs/migrating-to-percy-cli'));
    }
  }

  // Confirms if the first SDK in the list is the current SDK, otherwise will present a list of
  // supported SDKs to choose from, erroring when the chosen SDK is not in the list
  async confirmSDK(name, installed) {
    let fromInstalled = SDK => {
      let sdk = installed.find(sdk => sdk instanceof SDK) || new SDK();
      if (!sdk.installed) this.log.warn('The specified SDK was not found in your dependencies');
      return sdk;
    };

    // don't guess or prompt when a name is provided
    if (name) {
      let SDK = migrations.find(SDK => SDK.matches(name));
      if (SDK) return fromInstalled(SDK);
      this.log.warn('The specified SDK is not supported');
      return;
    }

    // ask to confirm first guess
    let [guess] = installed;

    if (guess) {
      let { isGuess } = await inquirer.prompt([{
        type: 'confirm',
        name: 'isGuess',
        message: `Are you currently using ${guess.aliased}?`,
        default: true
      }]);

      if (isGuess) {
        return guess;
      }
    }

    // ask to choose from list of supported sdks
    let { fromChoice } = await inquirer.prompt([{
      type: 'list',
      name: 'fromChoice',
      message: 'Which SDK are you using?',
      default: guess ? migrations.indexOf(guess.constructor) : 0,
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
      this.exit(1);
    }
  }
}

module.exports = Migrate;
