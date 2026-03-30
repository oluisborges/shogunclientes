import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { metaFetch } from "@/lib/meta/client"
import { getClientMetaCredentials } from "@/lib/meta/getClientToken"

function extractIframeSrc(html: string): string | null {
  const match = html.match(/src="([^"]+)"/)
  return match?.[1] ? match[1].replace(/&amp;/g, "&") : null
}

function extractVideoUrl(html: string): string | null {
  // Try to find video source URL in various formats
  
  // 1. Look for video tag with src
  const videoSrcMatch = html.match(/<video[^>]+src="([^"]+)"/i)
  if (videoSrcMatch?.[1]) {
    return videoSrcMatch[1].replace(/&amp;/g, "&")
  }
  
  // 2. Look for source tag inside video
  const sourceMatch = html.match(/<source[^>]+src="([^"]+)"/i)
  if (sourceMatch?.[1]) {
    return sourceMatch[1].replace(/&amp;/g, "&")
  }
  
  // 3. Look for Facebook video embed URL patterns
  const fbVideoMatch = html.match(/https:\/\/[^"'\s]+facebook\.com\/[^"'\s]*\/videos\/[^"'\s]+/i)
  if (fbVideoMatch?.[0]) {
    return fbVideoMatch[0].replace(/&amp;/g, "&")
  }
  
  // 4. Look for any video URL in the HTML
  const videoUrlMatch = html.match(/https:\/\/[^"'\s]+\.(mp4|webm|ogg)[^"'\s]*/i)
  if (videoUrlMatch?.[0]) {
    return videoUrlMatch[0].replace(/&amp;/g, "&")
  }
  
  return null
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const adId     = request.nextUrl.searchParams.get("ad_id")
  const clientId = request.nextUrl.searchParams.get("client_id")

  if (!adId || !clientId) {
    return NextResponse.json({ error: "ad_id e client_id são obrigatórios" }, { status: 400 })
  }

  const creds = await getClientMetaCredentials(clientId)
  if ("error" in creds) {
    return NextResponse.json({ error: creds.error }, { status: creds.status })
  }

  interface AdCreative {
    video_id?: string
    effective_object_story_id?: string
  }

  interface VideoPost {
    permalink_url?: string
    source?: string
    embed_html?: string
  }

  try {
    // Step 1: Get the ad creative to find effective_object_story_id
    console.log('[video-url] Fetching ad creative for ad:', adId)
    const adData = await metaFetch<{ creative?: AdCreative }>({
      endpoint: `/${adId}`,
      accessToken: creds.accessToken,
      params: { fields: "creative{effective_object_story_id,video_id}" },
    })

    console.log('[video-url] Ad creative data:', adData)

    const effectiveStoryId = adData.creative?.effective_object_story_id
    
    if (effectiveStoryId) {
      // Step 2: Use effective_object_story_id to get the video post
      console.log('[video-url] Fetching video post with story ID:', effectiveStoryId)
      
      try {
        const videoPost = await metaFetch<VideoPost>({
          endpoint: `/${effectiveStoryId}`,
          accessToken: creds.accessToken,
          params: { fields: "permalink_url,source,embed_html" },
        })

        console.log('[video-url] Video post data:', videoPost)

        // Return permalink_url which gives us the clean Facebook video player
        if (videoPost.permalink_url) {
          console.log('[video-url] Using permalink URL:', videoPost.permalink_url)
          // Adicionar parâmetros para melhor funcionamento no mobile
          const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoPost.permalink_url)}&show_text=false&allowfullscreen=true&autoplay=false&mute=false`
          return NextResponse.json({ 
            type: "facebook_video", 
            url: embedUrl,
            permalink: videoPost.permalink_url // URL direta do vídeo no Facebook
          })
        }

        if (videoPost.source) {
          console.log('[video-url] Using source URL:', videoPost.source)
          return NextResponse.json({ type: "source", url: videoPost.source })
        }
      } catch (storyErr) {
        console.error('[video-url] Error fetching story:', storyErr)
      }
    }

    // Fallback: Try using video_id if available
    const videoId = adData.creative?.video_id
    if (videoId) {
      console.log('[video-url] Trying with video_id:', videoId)
      const videoUrl = `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/facebook/videos/${videoId}/&show_text=false&allowfullscreen=true&autoplay=false&mute=false`
      // Construir permalink para o vídeo usando video_id
      const permalink = `https://www.facebook.com/watch/?v=${videoId}`
      return NextResponse.json({ type: "facebook_video", url: videoUrl, permalink })
    }

    return NextResponse.json({ 
      error: "Nenhuma URL de vídeo disponível",
      debug: { adId, effectiveStoryId, videoId }
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[video-url] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
