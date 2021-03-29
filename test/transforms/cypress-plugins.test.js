import expect from 'expect';
import applyTransform, { dedent } from '../helpers/apply-transform';
import transform from '../../transforms/cypress-plugins';

describe('Transforms - cypress-plugins.js', () => {
  it('removes common task usage', () => {
    expect(applyTransform(transform, {}, dedent`
      const someOtherTask = require('some-other-package');
      const percyHealthCheck = require('@percy/cypress/task');

      module.exports = (on, config) => {
        on('task', someOtherTask);
        on('task', percyHealthCheck);
        on('task', require('some-other-task'));
        on('task', require('@percy/cypress/task'));
        return config;
      };
    `)).toEqual(dedent`
      const someOtherTask = require('some-other-package');

      module.exports = (on, config) => {
        on('task', someOtherTask);
        on('task', require('some-other-task'));
        return config;
      };
    `);
  });

  it('removes module task usage', () => {
    expect(applyTransform(transform, {}, dedent`
      import someOtherTask from 'some-other-package';
      import percyHealthCheck from '@percy/cypress/task';

      export default (on, config) => {
        on('task', someOtherTask);
        on('task', percyHealthCheck);
        return config;
      };
    `)).toEqual(dedent`
      import someOtherTask from 'some-other-package';

      export default (on, config) => {
        on('task', someOtherTask);
        return config;
      };
    `);
  });
});
