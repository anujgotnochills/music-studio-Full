import { useState, useEffect } from 'react'
import { useGsapReveal } from '../hooks/useGsap'
import { useClient, resolveImage } from '../context/ClientContext'

// Custom component to load official Instagram embed without "refused to connect" errors
const InstagramEmbed = ({ url }) => {
    const [loading, setLoading] = useState(true)
    const cleanUrl = url.split('?')[0].replace(/\/$/, '')

    useEffect(() => {
        let isMounted = true

        const triggerProcess = () => {
            if (window.instgrm) {
                setTimeout(() => {
                    if (window.instgrm.Embeds) {
                        window.instgrm.Embeds.process()
                        setTimeout(() => { if (isMounted) setLoading(false) }, 1200)
                    }
                }, 50)
            }
        }

        if (!window.instgrm) {
            const script = document.createElement('script')
            script.src = 'https://www.instagram.com/embed.js'
            script.async = true
            script.defer = true
            script.onload = triggerProcess
            document.body.appendChild(script)
        } else {
            triggerProcess()
        }

        return () => { isMounted = false }
    }, [url])

    const embedHtml = `
        <blockquote
            class="instagram-media"
            data-instgrm-permalink="${cleanUrl}/"
            data-instgrm-version="14"
            style="background: #FFF; border: 0; margin: 1px; min-width: 326px; width: calc(100% - 2px); border-radius: 12px; box-shadow: none;"
        ></blockquote>
    `;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden relative">
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black">
                    <div className="w-10 h-10 border-2 border-brand/20 border-t-brand rounded-full animate-spin mb-4" />
                    <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">Verifying Connection...</p>
                </div>
            )}
            
            <div 
                key={url}
                className="w-full h-full flex justify-center p-2 overflow-y-auto z-10"
                dangerouslySetInnerHTML={{ __html: embedHtml }}
            />
        </div>
    )
}

export default function Videos() {
    const { videos } = useClient()
    const ref = useGsapReveal({ stagger: 0.12 })
    const [activeVideo, setActiveVideo] = useState(null)

    // Don't render section if no videos
    if (!videos?.items || videos.items.length === 0) return null

    // Check if URL is a YouTube link and extract embed URL
    const getEmbedUrl = (url) => {
        if (!url) return null
        const youtubeMatch = url.match(
            /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
        )
        if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`
        return null
    }
    // Check if URL is an Instagram link and extract embed URL
    const getIgEmbedUrl = (url) => {
        if (!url) return null
        const igMatch = url.match(
            /(?:instagram\.com\/(?:p|reel|reels|tv)\/)([a-zA-Z0-9_\-]+)/
        )
        if (igMatch) return `https://www.instagram.com/p/${igMatch[1]}/embed/`
        return null
    }

    const isYouTube = (url) => !!getEmbedUrl(url)
    const isInstagram = (url) => !!getIgEmbedUrl(url)
    const isShorts = (url) => url?.includes('/shorts/')
    const isVertical = (url) => isInstagram(url) || isShorts(url)

    return (
        <>
            <section ref={ref} className="py-24 px-4 bg-neutral-950 relative overflow-hidden" id="videos">
                {/* Ambient glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/5 blur-[150px] rounded-full pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Header */}
                    <div className="mb-16 text-center">
                        <h3 data-reveal className="text-brand text-sm uppercase tracking-[0.2em] mb-3">
                            {videos.sectionLabel}
                        </h3>
                        <h2 data-reveal className="font-display text-4xl md:text-5xl text-white">
                            {videos.sectionTitle}
                        </h2>
                    </div>

                    {/* Video Masonry Grid */}
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
                        {videos.items.map((video) => {
                            const igLink = isInstagram(video.videoUrl)
                            return (
                                <div
                                    key={video.id}
                                    data-reveal
                                    className="group relative overflow-hidden rounded-lg cursor-pointer bg-neutral-900/50 border border-white/5 hover:border-brand/30 transition-all duration-500 hover:-translate-y-1 mb-6 break-inside-avoid"
                                    onClick={() => setActiveVideo(video)}
                                >
                                    {/* Thumbnail */}
                                    <div className={`relative overflow-hidden ${isVertical(video.videoUrl) ? 'aspect-square' : 'aspect-video'}`}>
                                        {video.thumbnailUrl ? (
                                            <img
                                                src={resolveImage(video.thumbnailUrl)}
                                                alt={video.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-5xl text-white/20">videocam</span>
                                            </div>
                                        )}
                                        {/* Play / Open overlay */}
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-500 flex items-center justify-center">
                                            <div className="w-16 h-16 rounded-full bg-brand/90 flex items-center justify-center shadow-lg shadow-brand/20 group-hover:scale-110 transition-transform duration-300">
                                                <span className="material-symbols-outlined text-white text-3xl ml-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                    play_arrow
                                                </span>
                                            </div>
                                        </div>
                                        {/* YouTube / Instagram badges */}
                                        {isYouTube(video.videoUrl) && (
                                            <div className="absolute top-3 right-3 bg-red-600/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white font-medium uppercase tracking-wider">
                                                YouTube
                                            </div>
                                        )}
                                        {igLink && (
                                            <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white font-medium uppercase tracking-wider">
                                                Instagram
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-5">
                                        <h3 className="font-display text-lg text-white mb-1 group-hover:text-brand transition-colors duration-300">
                                            {video.title}
                                        </h3>
                                        {video.description && (
                                            <p className="text-white/40 text-sm leading-relaxed line-clamp-2">
                                                {video.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Lightbox Modal */}
            {activeVideo && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
                    onClick={() => setActiveVideo(null)}
                >
                    <button
                        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                        onClick={() => setActiveVideo(null)}
                    >
                        <span className="material-symbols-outlined text-white text-xl">close</span>
                    </button>

                    {/* Conditional sizing based on video type (Portrait for Reels/Shorts, Widescreen for others) */}
                    <div
                        className={`w-full ${isVertical(activeVideo.videoUrl) ? 'max-w-[420px] max-h-[90vh]' : 'max-w-5xl aspect-video'} rounded-lg overflow-hidden shadow-2xl relative bg-black`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {isYouTube(activeVideo.videoUrl) ? (
                            <iframe
                                src={`${getEmbedUrl(activeVideo.videoUrl)}?autoplay=1`}
                                className="w-full h-full"
                                allow="autoplay; encrypted-media; fullscreen"
                                allowFullScreen
                                title={activeVideo.title}
                            />
                        ) : isInstagram(activeVideo.videoUrl) ? (
                            <InstagramEmbed url={activeVideo.videoUrl} />
                        ) : (
                            <video
                                src={activeVideo.videoUrl}
                                controls
                                autoPlay
                                className="w-full h-full object-contain"
                            >
                                Your browser does not support the video tag.
                            </video>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
