import { codeshift } from '../../src/utils.js';

export default (async function() {
  await codeshift.js?.install();
  await codeshift.ruby?.install();
})();
