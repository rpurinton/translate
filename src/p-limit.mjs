// Simple p-limit implementation for concurrency control
// Export as default for easy mocking in tests
export default function pLimit(concurrency) {
  const queue = [];
  let activeCount = 0;

  const next = () => {
    if (queue.length === 0 || activeCount >= concurrency) return;
    activeCount++;
    const { fn, resolve, reject } = queue.shift();
    fn().then(resolve, reject).finally(() => {
      activeCount--;
      next();
    });
  };

  return fn => new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    next();
  });
}
// For Jest: allow named export for mocking
export { pLimit };
