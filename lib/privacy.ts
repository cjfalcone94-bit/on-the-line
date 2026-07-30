const sensitiveKeys =
  /(email|phone|name|address|card|payment|stake|amount|charity|destination|proof|photo|uri|url|token|secret|password)/i;
const sensitiveText =
  /(?:\b(?:\d[ -]*?){13,19}\b|(?:file|https?):\/\/\S+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/g;

const redacted = '[Filtered]';

export function scrubDeep<T>(value: T, seen = new WeakSet<object>()): T {
  if (typeof value === 'string') {
    return value.replace(sensitiveText, redacted) as T;
  }

  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return redacted as T;
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => scrubDeep(item, seen)) as T;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      sensitiveKeys.test(key) ? redacted : scrubDeep(item, seen),
    ]),
  ) as T;
}
