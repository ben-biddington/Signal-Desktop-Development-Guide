export const timeAction = async (fn: () => Promise<void>) => {
  const startedAt = new Date();

  await fn();

  const finishedAt = new Date();

  return finishedAt.getTime() - startedAt.getTime();
};
