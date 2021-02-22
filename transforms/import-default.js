export default function({ source }, { j }, options) {
  let installed = options['percy-installed'];
  let sdk = options['percy-sdk'];
  let root = j(source);

  // - import { percySnapshot [as <local>] } from <installed>
  // + import <local> from <sdk>
  root
    .find(j.ImportDeclaration, node => (
      node.source.value === installed
    ))
    .forEach(({ value: node }) => {
      let local = node.specifiers[0].local.name;
      node.specifiers = [j.importDefaultSpecifier(j.identifier(local))];
      node.source.value = sdk;
    });

  // - const { percySnapshot[: <local>] } = require(<installed>)
  // - const <local> = require(<installed>).percySnapshot
  // + const <local> = require(<sdk>)
  root
    .find(j.VariableDeclarator, node => (
      (node.init.type === 'CallExpression' &&
       node.init.callee.name === 'require' &&
       node.init.arguments[0].value === installed) ||
      (node.init.type === 'MemberExpression' &&
       node.init.object.type === 'CallExpression' &&
       node.init.object.callee.name === 'require' &&
       node.init.object.arguments[0].value === installed)
    ))
    .forEach(({ value: node }) => {
      let local = node.id.properties?.[0].value.name ?? node.id.name;
      node.init = j.callExpression(j.identifier('require'), [j.literal(sdk)]);
      node.id = j.identifier(local);
    });

  return root.toSource();
}
