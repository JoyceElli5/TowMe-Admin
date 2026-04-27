export function formatStatusLabel(
  value: string,
  options: { titleCase?: boolean } = { titleCase: true }
): string {
  const normalized = value.replace(/_/g, ' ');

  if (options.titleCase === false) {
    return normalized;
  }

  return normalized
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}