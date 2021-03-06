import fs from 'fs';
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

// "Mock" a Gemfile by actually writing one to the current directory
export function mockGemfile(contents) {
  let file = mockGemfile.filepath = path.join(process.cwd(), 'Gemfile');
  fs.writeFileSync(file, [].concat(contents).join('\n'));
}
