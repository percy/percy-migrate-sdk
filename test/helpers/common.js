import fs from 'fs';
import path from 'path';

// Mock package.json
export function mockPackageJSON(pkg) {
  fs.writeFileSync('./package.json', JSON.stringify(pkg));
}

// "Mock" a Gemfile by actually writing one to the current directory
export function mockGemfile(contents) {
  let file = mockGemfile.filepath = path.join(process.cwd(), 'Gemfile');
  fs.writeFileSync(file, [].concat(contents).join('\n'));
}
