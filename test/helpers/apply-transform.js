import jscodeshift from 'jscodeshift';

// Dedent large blocks of template strings to make reading tests easier
export function dedent(raw, ...values) {
  let result = raw.reduce((acc, str, i) => {
    acc += str.replace(/\\\n[ \t]*/g, '').replace(/\\`/g, '`');
    if (i < values.length) acc += values[i];
    return acc;
  }, '');

  let lines = result.split('\n');
  let mindent;

  for (let l of lines) {
    let m = l.match(/^(\s+)\S+/);

    if (m) {
      let indent = m[1].length;
      mindent = !mindent ? indent : Math.min(mindent, indent);
    }
  }

  if (mindent != null) {
    result = lines.map(l => l[0] === ' ' ? l.slice(mindent) : l).join('\n');
  }

  return result.trim().replace(/\\n/g, '\n');
}

// Call the transform function with the appropriate arguments
export default function applyTransform(module, options = {}, source, path = 'test.js') {
  let transform = module.default ?? module;
  let api = { j: jscodeshift, jscodeshift };
  return transform({ path, source }, api, options);
}
