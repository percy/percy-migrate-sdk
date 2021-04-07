import inquirer from 'inquirer';

// Mock prompts by stubbing the inquirer.prompt function
export default function mockPrompts(answers) {
  let props = Object.getOwnPropertyDescriptors(inquirer.prompt);
  let prompts = [];

  inquirer.prompt = async questions => {
    prompts.push(...questions);
    let result = {};

    for (let q of questions) {
      result[q.name] = typeof answers[q.name] === 'function'
        ? await answers[q.name](q)
        : answers[q.name];
    }

    return result;
  };

  Object.defineProperties(inquirer.prompt, props);
  return prompts;
}
