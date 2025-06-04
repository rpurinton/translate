import { fileURLToPath } from 'url';
import { dirname as pathDirname } from 'path';

/**
 * Returns the current filename in both ESM and Jest environments.
 * @param {ImportMeta} meta - The import.meta object (optional in Jest)
 */
export const getCurrentFilename = (meta) => {
  if (meta && meta.url) return fileURLToPath(meta.url);
  return typeof __filename !== 'undefined' ? __filename : '';
};

/**
 * Returns the current dirname in both ESM and Jest environments.
 * @param {ImportMeta} meta - The import.meta object (optional in Jest)
 * @param {Function} dirnameFn - Optional dirname function (default: path.dirname)
 */
export const getCurrentDirname = (meta, dirnameFn = pathDirname) => {
  const filename = getCurrentFilename(meta);
  return filename ? dirnameFn(filename) : '';
};