import expect from 'expect';
import logger from '@percy/logger/test/helpers';
import Migrate from '../src';

describe('@percy/migrate', () => {
  beforeEach(() => {
    logger.mock();
  });

  afterEach(() => {
    process.removeAllListeners();
  });

  it('logs errors to the logger and exits', async () => {
    class TestErrorHandling extends Migrate {
      run() { this.error('test error'); }
    }

    await expect(TestErrorHandling.run([]))
      .rejects.toThrow('EEXIT: 1');

    expect(logger.stdout).toEqual([]);
    expect(logger.stderr).toEqual([
      '[percy] Error: test error'
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
});
