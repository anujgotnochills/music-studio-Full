import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useClient, resolveImage } from '../context/ClientContext'

gsap.registerPlugin(ScrollTrigger)

export default function Services() {
    const { services: config } = useClient()
    const services = config.items.map(s => ({ ...s, image: resolveImage(s.image) }))

    const sectionRef = useRef(null)
    const trackRef = useRef(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const [hoverIndex, setHoverIndex] = useState(null)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        if (isMobile) return
        const ctx = gsap.context(() => {
            const track = trackRef.current
            if (!track) return
            gsap.from('[data-srv-heading]', {
                y: 60, opacity: 0, duration: 1, stagger: 0.15, ease: 'power3.out',
                scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
            })
            const totalWidth = track.scrollWidth - window.innerWidth
            if (totalWidth > 0) {
                gsap.to(track, {
                    x: -totalWidth, ease: 'none',
                    scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: () => `+=${totalWidth}`, scrub: 1, pin: true, anticipatePin: 1 },
                })
            }
        }, sectionRef)
        return () => ctx.revert()
    }, [isMobile, services])

    useEffect(() => {
        if (!isMobile) return
        const ctx = gsap.context(() => {
            gsap.from('[data-srv-heading]', {
                y: 40, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out',
                scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
            })
            gsap.utils.toArray('[data-srv-card]').forEach((card, i) => {
                gsap.from(card, {
                    y: 60, opacity: 0, duration: 0.8, delay: i * 0.1, ease: 'power3.out',
                    scrollTrigger: { trigger: card, start: 'top 90%' },
                })
            })
        }, sectionRef)
        return () => ctx.revert()
    }, [isMobile, services])

    const displayIndex = hoverIndex !== null ? hoverIndex : activeIndex

    return (
        <section ref={sectionRef} className="relative bg-neutral-950" id="services">
            <div className="absolute inset-0 z-0 overflow-hidden">
                <img src={services[displayIndex].image} alt="" className="w-full h-full object-cover opacity-[0.06] scale-110 blur-sm transition-all duration-700" key={displayIndex} />
            </div>

            {isMobile ? (
                <div className="relative z-10 px-4 py-20">
                    <div className="mb-8">
                        <h3 data-srv-heading className="text-brand text-xs uppercase tracking-[0.2em] mb-3">{config.sectionLabel}</h3>
                        <h2 data-srv-heading className="font-display text-3xl text-white font-medium leading-tight">
                            {config.sectionTitle} <span className="italic text-brand">{config.sectionTitleAccent}</span>
                        </h2>
                        <p data-srv-heading className="text-white/40 text-xs leading-relaxed mt-3">{config.sectionDescription}</p>
                        <div data-srv-heading className="h-px w-full bg-white/10 mt-4" />
                    </div>
                    <div className="flex flex-col gap-5">
                        {services.map((service, i) => (
                            <div key={service.id} data-srv-card onClick={() => setActiveIndex(i)}>
                                <div className={`group relative h-[350px] overflow-hidden cursor-pointer transition-all duration-700 ${displayIndex === i ? 'border border-brand/40' : 'border border-white/10'}`}>
                                    <img src={service.image} alt={service.title} className="absolute inset-0 w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-80" />
                                    <div className="absolute top-4 left-4 z-10"><span className="font-display text-5xl font-bold text-brand/20">0{i + 1}</span></div>
                                    <div className="absolute top-4 right-4 z-10 w-10 h-10 border border-white/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-brand text-xl">{service.icon}</span>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <span className="font-display text-2xl text-brand">{service.price}</span>
                                            <span className="text-xs text-brand/60">+</span>
                                            <span className="text-[10px] text-white/60 uppercase tracking-wider ml-1">{service.unit}</span>
                                        </div>
                                        <h3 className="font-display text-2xl text-white mb-2">{service.title}</h3>
                                        <p className="text-white/70 text-xs leading-relaxed mb-3">{service.description}</p>
                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {service.features.map((f) => (<span key={f} className="text-[10px] text-white/80 bg-white/10 backdrop-blur-sm px-2 py-1 border border-white/10">{f}</span>))}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-px w-8 bg-brand" />
                                            <span className="text-[10px] uppercase tracking-widest text-white/80">Book Now</span>
                                            <span className="material-symbols-outlined text-brand text-sm">arrow_forward</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div ref={trackRef} className="relative z-10 flex items-stretch h-screen">
                    <div className="w-screen min-w-[100vw] flex-shrink-0 flex flex-col justify-center px-12 lg:px-24">
                        <h3 data-srv-heading className="text-brand text-sm uppercase tracking-[0.2em] mb-4">{config.sectionLabel}</h3>
                        <h2 data-srv-heading className="font-display text-5xl lg:text-7xl text-white font-medium leading-tight max-w-2xl">
                            {config.sectionTitle} <span className="italic text-brand">{config.sectionTitleAccent}</span>
                        </h2>
                        <p data-srv-heading className="text-white/40 max-w-md text-sm leading-relaxed mt-6">{config.sectionDescription}</p>
                        <div data-srv-heading className="h-px w-48 bg-brand/50 mt-8" />
                        <div data-srv-heading className="mt-8 flex items-center gap-3 text-white/30 text-xs uppercase tracking-widest">
                            <span className="material-symbols-outlined text-brand text-lg">swipe_left</span>Scroll to explore
                        </div>
                    </div>
                    {services.map((service, i) => (
                        <div key={service.id} className="w-[38vw] min-w-[38vw] flex-shrink-0 flex items-center py-10 px-3"
                            onMouseEnter={() => { setHoverIndex(i); setActiveIndex(i) }} onMouseLeave={() => setHoverIndex(null)}>
                            <div className={`group relative w-full h-[80vh] overflow-hidden cursor-pointer transition-all duration-700 ${displayIndex === i ? 'border border-brand/40' : 'border border-white/10'}`}>
                                <img src={service.image} alt={service.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                                <div className="absolute top-6 left-6 z-10"><span className="font-display text-7xl font-bold text-brand/20 group-hover:text-brand/40 transition-colors duration-500">0{i + 1}</span></div>
                                <div className="absolute top-6 right-6 z-10 w-12 h-12 border border-white/20 group-hover:border-brand/50 flex items-center justify-center transition-all duration-500 group-hover:rotate-12">
                                    <span className="material-symbols-outlined text-brand text-2xl">{service.icon}</span>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                                    <div className="flex items-baseline gap-2 mb-3">
                                        <span className="font-display text-3xl text-brand">{service.price}</span>
                                        <span className="text-xs text-brand/60">+</span>
                                        <span className="text-xs text-white/60 uppercase tracking-wider ml-2">{service.unit}</span>
                                    </div>
                                    <h3 className="font-display text-3xl md:text-4xl text-white mb-3">{service.title}</h3>
                                    <p className="text-white/70 text-sm leading-relaxed mb-4 max-h-0 group-hover:max-h-20 overflow-hidden transition-all duration-700">{service.description}</p>
                                    <div className="flex flex-wrap gap-2 mb-6 max-h-0 group-hover:max-h-24 overflow-hidden transition-all duration-700 delay-100">
                                        {service.features.map((f) => (<span key={f} className="text-xs text-white/80 bg-white/10 backdrop-blur-sm px-3 py-1 border border-white/10">{f}</span>))}
                                    </div>
                                    <div className="flex items-center gap-3 cursor-pointer">
                                        <div className="h-px w-8 bg-brand group-hover:w-12 transition-all duration-500" />
                                        <span className="text-xs uppercase tracking-widest text-white/80 group-hover:text-brand transition-colors duration-300">Book Now</span>
                                        <span className="material-symbols-outlined text-brand text-sm group-hover:translate-x-1 transition-transform duration-300">arrow_forward</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}
