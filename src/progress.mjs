// Progress UI logic
// Accepts output stream for testability
export function createProgressBar(total, output = process.stdout) {
  let completed = 0;
  function update(locale) {
    completed++;
    output.write(`\rTranslating: ${completed}/${total} (${locale})`);
    if (completed === total) {
      output.write('\nAll translations complete.\n');
    }
  }
  return { update };
}
