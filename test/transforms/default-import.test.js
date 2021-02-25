import expect from 'expect';
import applyTransform, { dedent } from '../helpers/apply-transform';
import transform from '../../transforms/import-default';

describe('Transforms - import-default.js', () => {
  it('transforms named imports into default imports', () => {
    expect(applyTransform(transform, {
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

  it('transforms required variables', () => {
    expect(applyTransform(transform, {
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

  it('throws an error when --percy-sdk is missing', () => {
    expect(() => applyTransform(transform, {}))
      .toThrow('--percy-sdk is required');
  });
});
