import expect from 'expect';
import { mockCommands, mockRequire } from '../helpers';
let { codeshift } = require('../../src/utils.js');

describe('Installing codeshift libraries', () => {
  let run;

  beforeEach(() => {
    run = mockCommands({
      npm: () => ({ status: 0 }),
      [codeshift.js.bin]: () => ({ status: 0 })
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
});
