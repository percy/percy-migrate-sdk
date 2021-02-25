import mockRequire from 'mock-require';
import spawn from 'cross-spawn';
import which from 'which';

// Mock commands by mocking run util imports
export default function mockCommands(cmds) {
  mockRequire('which', {
    sync: cmd => {
      if (!cmds[cmd]) return which.sync(cmd);
      return cmd;
    }
  });

  mockRequire('cross-spawn', {
    sync: (cmd, args, options) => {
      if (!cmds[cmd]) return spawn.sync(cmd, args, options);
      (cmds[cmd].calls ||= []).push({ args, options });
      return cmds[cmd](args, options);
    }
  });

  return cmds;
}
