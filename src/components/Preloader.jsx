import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useClient, resolveImage } from '../context/ClientContext'

export default function Preloader() {
    const { about, hero } = useClient()
    const loaderRef = useRef(null)
    const [isLoading, setIsLoading] = useState(true)

    const bgImage = resolveImage(about?.image || 'studio-mixing')

    useEffect(() => {
        // Wait a minimum time to show the cool animation
        const minTime = new Promise(resolve => setTimeout(resolve, 2000))
        const loadEvent = new Promise(resolve => {
            if (document.readyState === 'complete') resolve()
            else window.addEventListener('load', resolve)
        })

        Promise.all([minTime, loadEvent]).then(() => {
            if (!loaderRef.current) return
            
            // Animate out the content
            gsap.to('.preloader-content', {
                scale: 0.9,
                opacity: 0,
                duration: 0.8,
                ease: "power3.inOut",
            })

            // GSAP zoom and fade out the whole loader overlay
            gsap.to(loaderRef.current, {
                opacity: 0,
                duration: 1.2,
                ease: "power4.inOut",
                delay: 0.2, // let content fade first
                onComplete: () => {
                    setIsLoading(false)
                    // Trigger an event if we want other components to start animating NOW
                    window.dispatchEvent(new Event('app-loaded'))
                }
            })
        })
    }, [])

    if (!isLoading) return null

    return (
        <div ref={loaderRef} className="fixed inset-0 z-[9999] bg-neutral-950 flex flex-col items-center justify-center overflow-hidden">
            {/* Background Static Image */}
            <div className="absolute inset-0 z-0 scale-105 pointer-events-none">
                <img 
                    src={bgImage} 
                    alt="Loading studio..." 
                    className="w-full h-full object-cover opacity-60 mix-blend-overlay grayscale" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-neutral-950" />
            </div>

            {/* Audio Waveform Loader */}
            <div className="preloader-content relative z-10 flex flex-col items-center gap-10">
                <div className="flex items-end justify-center gap-[4px] h-20 pointer-events-none">
                    {[...Array(11)].map((_, i) => (
                        <div
                            key={i}
                            className="bg-brand w-3 rounded-full origin-bottom animate-waveform shadow-[0_0_15px_var(--color-brand)]"
                            style={{
                                height: '100%',
                                animationDelay: `${i * 0.1}s`,
                                animationDuration: '0.8s',
                            }}
                        />
                    ))}
                </div>
                
                <h2 className="font-display tracking-[0.4em] text-white/80 uppercase text-xs md:text-sm font-bold flex flex-col items-center gap-2">
                    <span>{hero?.studioName || "Recording Studio"}</span>
                    <span className="text-brand animate-pulse text-[0.6rem] tracking-[0.5em]">Tuning the Room...</span>
                </h2>
            </div>
            
            <style>{`
                @keyframes waveform {
                    0%, 100% { transform: scaleY(0.15); opacity: 0.4; }
                    50% { transform: scaleY(1); opacity: 1; }
                }
                .animate-waveform {
                    animation: waveform ease-in-out infinite backwards;
                }
            `}</style>
        </div>
    )
}
