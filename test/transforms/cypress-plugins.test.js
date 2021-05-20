import expect from 'expect';
import applyTransform, { dedent } from '../helpers/apply-transform';
import transform from '../../transforms/cypress-plugins';

describe('Transforms - cypress-plugins.js', function() {
  this.timeout(6000);
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

  it('does not error when encountering unexpected trees', () => {
    expect(applyTransform(transform, {}, dedent`
      let percyHealthCheck = require('@percy/cypress/task');
      let foo = on('task'); // callee one args
      let bar = on(); // callee with no args
      let baz; // declaration with no init
    `)).toEqual(dedent`
      let foo = on('task'); // callee one args
      let bar = on(); // callee with no args
      let baz; // declaration with no init
    `);
  });
});
