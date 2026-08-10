/**
 * Converts Google Drive view/share links into direct image CDN URLs
 * suitable for standard HTML <img> elements.
 *
 * Example input:
 *   https://drive.google.com/file/d/1A2B3C4D5E/view?usp=sharing
 *   https://drive.google.com/open?id=1A2B3C4D5E
 *
 * Example output:
 *   https://lh3.googleusercontent.com/d/1A2B3C4D5E
 */
export function formatImageUrl(url) {
  if (!url || typeof url !== 'string') return url || '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Handle Google Drive / Docs share URLs
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    let fileId = null;

    // Pattern 1: /file/d/FILE_ID/
    const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileDMatch && fileDMatch[1]) {
      fileId = fileDMatch[1];
    }

    // Pattern 2: ?id=FILE_ID or &id=FILE_ID
    if (!fileId) {
      const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        fileId = idMatch[1];
      }
    }

    if (fileId) {
      // Use lh3.googleusercontent.com CDN direct image format
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }

  return trimmed;
}

export function formatImagesList(images) {
  if (!Array.isArray(images)) return [];
  return images.map(img => formatImageUrl(img)).filter(Boolean);
}
