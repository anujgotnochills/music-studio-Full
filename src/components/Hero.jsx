import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useClient, resolveImage } from '../context/ClientContext'

gsap.registerPlugin(ScrollTrigger)

const animationModules = import.meta.glob('../assets/animation/*.jpg', { eager: true })
const imagePaths = Object.keys(animationModules).sort().map(key => animationModules[key].default)
const frameCount = imagePaths.length
const currentFrame = (index) => imagePaths[index - 1]

export default function Hero() {
    const { hero, about } = useClient()
    const heroImage = resolveImage(about?.image || 'studio-mixing')
    const canvasRef = useRef(null)
    const containerRef = useRef(null)
    const [imagesLoaded, setImagesLoaded] = useState(0)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        let ctx;
        
        if (isMobile) {
            // Mobile: Just animate the text in normally
            ctx = gsap.context(() => {
                gsap.from('[data-hero-reveal]', {
                    y: 50,
                    opacity: 0,
                    duration: 1.2,
                    stagger: 0.15,
                    ease: 'power4.out',
                    delay: 0.2,
                })
            }, containerRef)
            return () => ctx.revert()
        }

        // Desktop: Canvas Sequence logic
        const canvas = canvasRef.current
        if (!canvas) return
        const context = canvas.getContext('2d', { alpha: false }) // Performance opt
        const images = []
        let loaded = 0
        const animationObj = { frame: 0 }

        const render = (img) => {
            if (!img || !canvas) return
            const hRatio = canvas.width / img.width
            const vRatio = canvas.height / img.height
            const ratio = Math.max(hRatio, vRatio)
            const centerShift_x = (canvas.width - img.width * ratio) / 2
            const centerShift_y = (canvas.height - img.height * ratio) / 2
            
            context.fillStyle = '#0a0a0f'
            context.fillRect(0, 0, canvas.width, canvas.height)
            context.drawImage(img, 0, 0, img.width, img.height,
                centerShift_x, centerShift_y, img.width * ratio, img.height * ratio)
        }

        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            if (images.length > 0 && images[Math.round(animationObj.frame)]) {
                render(images[Math.round(animationObj.frame)])
            }
        }

        // Preload images
        for (let i = 1; i <= frameCount; i++) {
            const img = new Image()
            img.src = currentFrame(i)
            img.onload = () => {
                loaded++
                setImagesLoaded(loaded)
                if (i === 1) render(img) // initial draw
            }
            images.push(img)
        }

        ctx = gsap.context(() => {
            // Text Entry Animation
            gsap.from('[data-hero-reveal]', {
                y: 50,
                opacity: 0,
                duration: 1.2,
                stagger: 0.15,
                ease: 'power4.out',
                delay: 0.5,
            })

            // Canvas Scrub Animation
            gsap.to(animationObj, {
                frame: frameCount - 1,
                snap: 'frame',
                ease: 'none', // linear scrub
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: '+=400%', // 4 times height for scroll depth
                    scrub: 0.5,    // smooth scrubbing
                    pin: true,     // pin section
                },
                onUpdate: () => render(images[Math.round(animationObj.frame)])
            })

            // Fade out the text as the user scrolls
            gsap.to('.hero-content-layer', {
                opacity: 0,
                y: -100,
                ease: 'none',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: '+=100%',
                    scrub: true,
                }
            })

        }, containerRef)

        window.addEventListener('resize', resizeCanvas)
        resizeCanvas()

        return () => {
            if (ctx) ctx.revert()
            window.removeEventListener('resize', resizeCanvas)
        }
    }, [isMobile])

    return (
        <section ref={containerRef} className="relative h-screen bg-black w-full overflow-hidden z-10" id="hero">
            {isMobile ? (
                <img src={heroImage} alt="Studio static background" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
                <>
                    {imagesLoaded < frameCount && (
                        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-neutral-950 text-brand font-display text-sm tracking-widest uppercase">
                            <span>Loading Experience... {Math.round((imagesLoaded / frameCount) * 100)}%</span>
                        </div>
                    )}
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
                </>
            )}
            
            {/* Overlay gradient so text is readable */}
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/60 via-neutral-950/20 to-neutral-950/80 pointer-events-none" />
            
            {/* Content layer */}
            <div className="hero-content-layer absolute inset-0 flex flex-col items-center justify-center pointer-events-auto px-4 text-center z-10">
                <div data-hero-reveal className="h-px w-24 bg-brand mb-6 opacity-50" />
                <h2 data-hero-reveal className="text-white/70 font-body text-sm md:text-base uppercase tracking-[0.3em] font-bold">
                    {hero.subtitle}
                </h2>
                <h1 data-hero-reveal className="font-display text-5xl md:text-7xl lg:text-8xl font-medium text-white leading-tight tracking-tight mt-6 mb-6">
                    {hero.headline} <span className="italic text-brand">{hero.headlineAccent}</span>
                </h1>
                <p data-hero-reveal className="font-display text-xl md:text-2xl text-white/60 italic max-w-2xl font-medium mb-10">
                    {hero.tagline}
                </p>
                <div data-hero-reveal className="mt-4 flex flex-col sm:flex-row gap-4">
                    <a
                        className="group px-8 py-4 bg-brand text-black font-bold text-sm uppercase tracking-widest hover:bg-brand-dark transition-all duration-300 min-w-[200px] text-center border border-brand relative overflow-hidden"
                        href={hero.ctaPrimary.href}
                        target={hero.ctaPrimary.href.includes('wa.me') ? "_blank" : undefined}
                        rel={hero.ctaPrimary.href.includes('wa.me') ? "noopener noreferrer" : undefined}
                    >
                        <span className="relative z-10">{hero.ctaPrimary.label}</span>
                        <div className="absolute inset-0 bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                    </a>
                    <a
                        className="group px-8 py-4 bg-transparent text-white font-bold text-sm uppercase tracking-widest hover:bg-brand hover:text-black transition-all duration-300 min-w-[200px] text-center border border-white/30 hover:border-brand relative overflow-hidden"
                        href={hero.ctaSecondary.href}
                    >
                        <span className="relative z-10">{hero.ctaSecondary.label}</span>
                    </a>
                </div>
            </div>

            {/* Scroll indicator */}
            {!isMobile && (
                <div className="hero-content-layer absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce hidden md:block text-white/40 z-10">
                    <span className="material-symbols-outlined text-4xl">keyboard_arrow_down</span>
                </div>
            )}
        </section>
    )
}
