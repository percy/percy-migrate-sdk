import expect from 'expect';
import { mockCommands, mockRequire } from '../helpers';
let { codeshift } = require('../../src/utils.js');

describe('Installing codeshift libraries', () => {
  let run;

  beforeEach(async () => {
    // set the `bin` path in the `codeshift` util
    await codeshift.js?.install();
    await codeshift.ruby?.install();

    run = mockCommands({
      npm: () => ({ status: 0 }),
      gem: () => ({ status: 0 }),
      [codeshift.js.bin]: () => ({ status: 0 }),
      [codeshift.ruby.bin]: () => ({ status: 0 })
    });

    mockRequire('fs', {
      existsSync: (path) => false
    });

    codeshift = mockRequire.reRequire('../../src/utils').codeshift;
  });

  it('installs jscodeshift for JS SDKs', async () => {
    await codeshift.run('js', ['foo/bar']);

    expect(run.npm.calls[0].args[0].endsWith('.codeshift/js')).toBe(true);
    expect(run.npm.calls[0].args[1]).toEqual('install');
    expect(run.npm.calls[0].args[2]).toEqual('jscodeshift');
  });

  it('installs codeshift for Ruby SDKs', async () => {
    await codeshift.run('ruby', ['foo/bar']);

    expect(run.gem.calls[0].args[0]).toEqual('install');
    expect(run.gem.calls[0].args[1]).toEqual('codeshift');
    expect(run.gem.calls[0].args[2].endsWith('.codeshift/ruby')).toBe(true);
    expect(run.gem.calls[0].args[3]).toEqual('--no-document');
  });

  describe('with .codeshift present', () => {
    beforeEach(() => {
      mockRequire('fs', {
        existsSync: (path) => true
      });

      codeshift = mockRequire.reRequire('../../src/utils').codeshift;
    });

    it('does not install jscodeshift for JS SDKs', async () => {
      await codeshift.run('js', ['foo/bar']);

      expect(run.gem.calls).toEqual(undefined);
    });

    it('does not install codeshift for Ruby SDKs', async () => {
      await codeshift.run('ruby', ['foo/bar']);

      expect(run.gem.calls).toEqual(undefined);
    });
  });
});
