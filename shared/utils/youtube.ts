const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'])
const YOUTUBE_VIDEO_PATHS = new Set(['shorts', 'live', 'embed'])
const YOUTUBE_CHANNEL_PATHS = new Set(['channel', 'c', 'user'])
const APPLE_DEVICE_UA_MARKERS = ['iphone', 'ipad', 'ipod', 'crios']

export function getYouTubeVideoUrl(input: string): string | null {
  let source: URL
  try {
    source = new URL(input.trim())
  }
  catch {
    return null
  }

  if (!['http:', 'https:'].includes(source.protocol) || !YOUTUBE_HOSTS.has(source.hostname.toLowerCase()))
    return null

  const pathParts = source.pathname.split('/').filter(Boolean)
  const query = new URLSearchParams(source.searchParams)
  let path = source.pathname

  if (source.hostname.toLowerCase() === 'youtu.be') {
    if (pathParts.length !== 1)
      return null
    path = '/watch'
    query.set('v', pathParts[0]!)
  }
  else if (path === '/watch') {
    if (!query.get('v'))
      return null
  }
  else if (pathParts.length !== 2 || !YOUTUBE_VIDEO_PATHS.has(pathParts[0]!) || !pathParts[1]) {
    return null
  }

  const videoUrl = new URL('https://www.youtube.com')
  videoUrl.pathname = path
  videoUrl.search = query.toString()
  videoUrl.hash = source.hash
  return videoUrl.href
}

export function isYouTubeVideoUrl(input: string): boolean {
  return getYouTubeVideoUrl(input) !== null
}

function getYouTubeAppTargetUrl(input: string): string | null {
  const videoUrl = getYouTubeVideoUrl(input)
  if (videoUrl)
    return videoUrl

  let source: URL
  try {
    source = new URL(input.trim())
  }
  catch {
    return null
  }

  const hostname = source.hostname.toLowerCase()
  if (!['http:', 'https:'].includes(source.protocol) || !YOUTUBE_HOSTS.has(hostname) || hostname === 'youtu.be')
    return null

  const pathParts = source.pathname.split('/').filter(Boolean)
  const [path, channelId] = pathParts
  if (!(path?.startsWith('@') && path.length > 1) && !(YOUTUBE_CHANNEL_PATHS.has(path ?? '') && channelId))
    return null

  const channelUrl = new URL('https://www.youtube.com')
  channelUrl.pathname = source.pathname
  channelUrl.search = source.search
  channelUrl.hash = source.hash
  return channelUrl.href
}

export function isYouTubeAppLinkUrl(input: string): boolean {
  return getYouTubeAppTargetUrl(input) !== null
}

export function getYouTubeAppLinkUrl(targetUrl: string, userAgent: string): string | null {
  const webUrl = getYouTubeAppTargetUrl(targetUrl)
  if (!webUrl)
    return null

  const url = new URL(webUrl)
  const pathAndQuery = `${url.pathname}${url.search}`
  const ua = userAgent.toLowerCase()

  if (ua.includes('android')) {
    return `intent://${url.host}${pathAndQuery}#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url=${encodeURIComponent(webUrl)};end`
  }

  if (APPLE_DEVICE_UA_MARKERS.some(marker => ua.includes(marker)))
    return `youtube://${url.host}${pathAndQuery}${url.hash}`

  return null
}
