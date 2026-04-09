const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i
const IMAGE_HOSTS = /^https?:\/\/(i\.imgur\.com|imgur\.com|images\.unsplash\.com|upload\.wikimedia\.org)/i

export function isImageUrl(text: string | null | undefined): boolean {
  if (!text) return false
  const trimmed = text.trim()
  if (!trimmed.startsWith('http')) return false
  return IMAGE_EXTENSIONS.test(trimmed) || IMAGE_HOSTS.test(trimmed)
}
