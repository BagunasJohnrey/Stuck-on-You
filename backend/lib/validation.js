// lib/validation.js
// Detects URLs / links embedded in user-submitted text so we can reject
// spam-style payloads (http(s)://, www., bare domains with a TLD, etc.).
const URL_PATTERN =
  /(https?:\/\/|www\.|\b[a-z0-9-]+(\.[a-z]{2,}){1,2}(\/|\b)(?!.*\s))/i;

export const containsUrl = (text) => {
  if (!text || typeof text !== 'string') return false;
  // Strip whitespace/newlines that could be used to obfuscate a link.
  const collapsed = text.replace(/\s+/g, '');
  return URL_PATTERN.test(collapsed);
};
