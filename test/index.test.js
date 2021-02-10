import expect from 'expect';
import logger from '@percy/logger/test/helper';
import Migrate from '../src';

describe('@percy/migrate', () => {
  beforeEach(() => {
    logger.mock();
  });

  afterEach(() => {
    process.removeAllListeners();
  });

  it('works', async () => {
    await Migrate.run([]);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Coming soon\n'
    ]);
  });

  it('logs errors to the logger and exits', async () => {
    class TestErrorHandling extends Migrate {
      run() { this.error('test error'); }
    }

    await expect(TestErrorHandling.run([]))
      .rejects.toThrow('EEXIT: 1');

    expect(logger.stdout).toEqual([]);
    expect(logger.stderr).toEqual([
      '[percy] Error: test error\n'
    ]);
  });

  it('does not log exit "errors"', async () => {
    class TestExitHandling extends Migrate {
      run() { this.exit(1); }
    }

    await expect(TestExitHandling.run([]))
      .rejects.toThrow('EEXIT: 1');

    expect(logger.stdout).toEqual([]);
    expect(logger.stderr).toEqual([]);
  });

  it('handles process termination', async () => {
    let wait = ms => new Promise(r => setTimeout(r, ms));
    let test = 0;

    class TestProcessTerm extends Migrate {
      run = () => wait(100).then(() => test--)
      finally() { test++; }
    }

    // not awaited on so we can terminate it afterwards
    TestProcessTerm.run([]);
    // wait a little for the process handler to be attached
    await wait(50);

    process.emit('SIGTERM');
    expect(test).toBe(1);
  });
});
