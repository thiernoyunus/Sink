import { describe, expect, it } from 'vitest'
import { getYouTubeAppLinkUrl, getYouTubeVideoUrl, isYouTubeAppLinkUrl, isYouTubeVideoUrl } from '../../shared/utils/youtube'

describe('youtube video links', () => {
  it('recognizes supported video URLs and normalizes short links', () => {
    expect(isYouTubeVideoUrl('https://www.youtube.com/watch?v=abcdefghijk')).toBe(true)
    expect(isYouTubeVideoUrl('https://m.youtube.com/shorts/abcdefghijk')).toBe(true)
    expect(getYouTubeVideoUrl('https://youtu.be/abcdefghijk?t=30'))
      .toBe('https://www.youtube.com/watch?t=30&v=abcdefghijk')
  })

  it('leaves non-video and lookalike destinations alone', () => {
    expect(isYouTubeVideoUrl('https://youtube.com/@channel')).toBe(false)
    expect(isYouTubeVideoUrl('https://youtube.com.evil.example/watch?v=abcdefghijk')).toBe(false)
    expect(isYouTubeVideoUrl('https://example.com/watch?v=abcdefghijk')).toBe(false)
  })
})

describe('youtube app links', () => {
  const target = 'https://youtu.be/abcdefghijk?t=30'
  const channel = 'https://youtube.com/@channel'

  it('uses YouTube’s app URL on iPhones', () => {
    expect(getYouTubeAppLinkUrl(target, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) CriOS/140'))
      .toBe('youtube://www.youtube.com/watch?t=30&v=abcdefghijk')
  })

  it('uses an Android intent with a browser fallback', () => {
    const result = getYouTubeAppLinkUrl(target, 'Mozilla/5.0 (Linux; Android 15) Chrome/140')
    expect(result).toContain('intent://www.youtube.com/watch?t=30&v=abcdefghijk#Intent;')
    expect(result).toContain(`S.browser_fallback_url=${encodeURIComponent('https://www.youtube.com/watch?t=30&v=abcdefghijk')}`)
  })

  it('does not change desktop or non-YouTube redirects', () => {
    expect(getYouTubeAppLinkUrl(target, 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/140')).toBeNull()
    expect(getYouTubeAppLinkUrl('https://example.com/video', 'Mozilla/5.0 (iPhone)')).toBeNull()
  })

  it('recognizes channel homepages but not other YouTube pages', () => {
    expect(isYouTubeVideoUrl(channel)).toBe(false)
    expect(isYouTubeAppLinkUrl(channel)).toBe(true)
    expect(isYouTubeAppLinkUrl('https://www.youtube.com/channel/UC123/videos')).toBe(true)
    expect(isYouTubeAppLinkUrl('https://www.youtube.com/playlist?list=PL123')).toBe(false)
    expect(isYouTubeAppLinkUrl('https://youtu.be/@channel')).toBe(false)
  })

  it('opens channel homepages in the YouTube app with a web fallback', () => {
    expect(getYouTubeAppLinkUrl(channel, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)'))
      .toBe('youtube://www.youtube.com/@channel')

    const result = getYouTubeAppLinkUrl(channel, 'Mozilla/5.0 (Linux; Android 15) Chrome/140')
    expect(result).toContain('intent://www.youtube.com/@channel#Intent;')
    expect(result).toContain(`S.browser_fallback_url=${encodeURIComponent('https://www.youtube.com/@channel')}`)
  })
})
