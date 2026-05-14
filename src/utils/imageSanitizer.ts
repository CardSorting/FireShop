/**
 * [LAYER: UTILS]
 * Utility to sanitize image URLs and prevent common path corruption artifacts.
 */
export function sanitizeImageUrl(url: string | undefined | null, fallback = 'https://placehold.co/800x1000?text=No+Image'): string {
  if (!url || typeof url !== 'string' || url.trim().length < 3) {
    return fallback;
  }

  const trimmed = url.trim();

  // known corrupted artifact
  if (trimmed === 'f') {
    return fallback;
  }

  // Ensure it's a valid relative path starting with / or an absolute URL
  if (!trimmed.startsWith('/') && !trimmed.startsWith('http')) {
    // If it doesn't start with / but looks like a valid filename, maybe it's missing the leading slash?
    // But for safety, we fallback if it's suspicious.
    return fallback;
  }

  return trimmed;
}
