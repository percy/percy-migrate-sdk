import path from 'path';
import mockRequire from 'mock-require';

// Run migrate after re-requiring specific modules
export function Migrate(...args) {
  mockRequire.reRequire('../../src/utils');
  mockRequire.reRequire('../../src/inspect');
  return mockRequire.reRequire('../../src').run(args);
}

// Mock package.json
export function mockPackageJSON(pkg) {
  mockRequire(`${process.cwd()}/package.json`, pkg);
  return pkg;
}

// Mock percy config search results
export function mockConfigSearch(search) {
  mockRequire('@percy/config', { search });
  mockRequire.reRequire('@percy/config');
}

// Mock the inspect_gemfile.rb script
export function mockInspectGemfile(output) {
  let inspectCmd = `ruby ${path.resolve(__dirname, '../../src/inspect_gemfile.rb')}`;
  let { execSync } = require('child_process');
  let ret = { output };

  mockRequire('child_process', {
    execSync: (cmda, options) => {
      if (cmda === inspectCmd) {
        return JSON.stringify(ret.output);
      } else {
        return execSync(cmda, options);
      }
    }
  });

  mockRequire.reRequire('../../src/inspect');
  return ret;
}
