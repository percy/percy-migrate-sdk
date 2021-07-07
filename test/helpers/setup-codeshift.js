import { codeshift } from '../../src/utils';

(async function() {
  await codeshift.js?.install();
  await codeshift.ruby?.install();
})();
