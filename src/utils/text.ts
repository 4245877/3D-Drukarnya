export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;

  const shortened = value.slice(0, maxLength - 3);
  const lastSpaceIndex = shortened.lastIndexOf(' ');
  const boundary = lastSpaceIndex > maxLength * 0.6 ? lastSpaceIndex : shortened.length;

  return `${shortened.slice(0, boundary).trim()}...`;
}

/**
 * JSON.stringify leaves `<` as-is, so a `</script>` anywhere in the data would
 * close the surrounding <script type="application/ld+json"> block early. `<`
 * is an equivalent escape in JSON, so consumers still parse the same value.
 */
export function toJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
