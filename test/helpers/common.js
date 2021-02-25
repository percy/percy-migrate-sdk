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
