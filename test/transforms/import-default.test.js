import applyTransform, { dedent } from '../helpers/apply-transform.js';
import transform from '../../transforms/import-default.cjs';

describe('Transforms - import-default.js', () => {
  it('transforms named imports into default imports', async () => {
    expect(await applyTransform(transform, {
      'percy-installed': '@percy/sdk-old',
      'percy-sdk': '@percy/sdk-new'
    }, dedent`
      import { percySnapshot } from '@percy/sdk-old';
      import { percySnapshot as psnap } from '@percy/sdk-old';
    `)).toEqual(dedent`
      import percySnapshot from '@percy/sdk-new';
      import psnap from '@percy/sdk-new';
    `);
  });

  it('transforms TypeScript named imports into TS imports', async () => {
    expect(await applyTransform(transform, {
      'percy-installed': '@percy/sdk-old',
      'percy-sdk': '@percy/sdk-new'
    }, dedent`
      import { percySnapshot } from '@percy/sdk-old';
      import { percySnapshot as psnap } from '@percy/sdk-old';
    `, 'test/bar.ts')).toEqual(dedent`
      import * as percySnapshot from '@percy/sdk-new';
      import * as psnap from '@percy/sdk-new';
    `);
  });

  it('transforms required variables', async () => {
    expect(await applyTransform(transform, {
      'percy-sdk': '@percy/sdk',
      'print-options': { quote: 'double' }
    }, dedent`
      const { percySnapshot } = require("@percy/sdk");
      const { percySnapshot: psnap1 } = require("@percy/sdk");
      const psnap2 = require("@percy/sdk").percySnapshot;
      const psnapd = require("@percy/sdk").default;
    `)).toEqual(dedent`
      const percySnapshot = require("@percy/sdk");
      const psnap1 = require("@percy/sdk");
      const psnap2 = require("@percy/sdk");
      const psnapd = require("@percy/sdk");
    `);
  });

  it('throws an error when --percy-sdk is missing', async () => {
    await expectAsync(applyTransform(transform, {}))
      .toBeRejectedWithError('--percy-sdk is required');
  });

  it('does not error when encountering unexpected trees', async () => {
    expect(await applyTransform(transform, {
      'percy-sdk': '@percy/sdk'
    }, dedent`
      let { percySnapshot } = require('@percy/sdk');
      let foo = foobar(); // callee with no args
      let bar; // declaration with no init
    `)).toEqual(dedent`
      let percySnapshot = require('@percy/sdk');
      let foo = foobar(); // callee with no args
      let bar; // declaration with no init
    `);
  });
});
