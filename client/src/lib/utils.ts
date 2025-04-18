
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(1)} ${units[i]}`;
}

export function truncateFilename(filename: string, maxBaseLength = 65) {
  const lastDotIndex = filename.lastIndexOf('.');

  if (lastDotIndex === -1) {
    return filename.length > maxBaseLength
        ? filename.slice(0, maxBaseLength - 2) + '...'
        : filename;
  }

  const name = filename.slice(0, lastDotIndex);
  const ext = filename.slice(lastDotIndex);

  if (name.length <= maxBaseLength) {
    return name + ext;
  }

  return name.slice(0, maxBaseLength - 2) + '...' + ext;
}