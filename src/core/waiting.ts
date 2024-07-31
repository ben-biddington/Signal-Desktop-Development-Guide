export const waitFor = (
  fn: () => boolean,
  opts: { timeoutMs?: number } = {}
): Promise<void> => {
  const { timeoutMs = 5000 } = opts;
  return new Promise((accept, reject) => {
    const startedAt = new Date();
    let durationInMs = 0;
    let running = false;

    const interval = setInterval(() => {
      durationInMs = new Date().getTime() - startedAt.getTime();

      if (running) return;

      running = true;

      if (fn() === true) {
        clearInterval(interval);
        accept();
      }

      if (durationInMs > timeoutMs) {
        clearInterval(interval);
        reject(new Error(`Timed out after <${durationInMs}ms> ${fn}`));
      }

      running = false;
    }, 500);
  });
};
