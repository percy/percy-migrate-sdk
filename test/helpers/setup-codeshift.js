import { installCodeshift } from '../../src/utils';
import { existsSync } from 'fs';
import { resolve } from 'path';

export default async function setupCodeshift() {
  let codeshiftJsPath = resolve(__dirname, '../../.codeshift/js');

  if (!existsSync(codeshiftJsPath)) {
    await installCodeshift('js');
  }
}
