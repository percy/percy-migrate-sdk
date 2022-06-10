export default async function mockCommands(cmds) {
  let { default: which } = await import('which');
  let { default: crossSpawn } = await import('cross-spawn');

  spyOn(which, 'sync').and.callFake((cmd) => {
    if (!cmds[cmd]) return which.sync.and.originalFn(cmd);
    return cmd;
  });

  spyOn(crossSpawn, 'sync').and.callFake((cmd, args, options) => {
    if (!cmds[cmd]) return crossSpawn.sync.and.originalFn(cmd, args, options);
    (cmds[cmd].calls ||= []).push({ args, options });
    return cmds[cmd](args, options);
  });

  return cmds;
}
