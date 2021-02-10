import Command, { flags } from '@oclif/command';
import logger from '@percy/logger';

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
  run() {
    this.log.info('Coming soon');
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
