import { useGsapReveal } from '../hooks/useGsap'
import { useClient } from '../context/ClientContext'

function Stars() {
    return (
        <div className="flex gap-1 text-brand mb-4">
            {[...Array(5)].map((_, i) => (
                <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            ))}
        </div>
    )
}

export default function Testimonials() {
    const { testimonials } = useClient()
    const ref = useGsapReveal({ stagger: 0.15 })

    return (
        <section ref={ref} className="py-24 px-6 bg-neutral-950 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="max-w-7xl mx-auto text-center">
                <span data-reveal className="material-symbols-outlined text-4xl text-brand/80 mb-6 block">format_quote</span>
                <h2 data-reveal className="font-display text-3xl md:text-4xl text-white mb-16">{testimonials.heading}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                    {testimonials.items.map((t) => (
                        <div key={t.name} data-reveal className="bg-neutral-900/50 p-8 rounded-lg border border-white/5 hover:border-brand/30 transition-all duration-500 hover:-translate-y-1 shadow-sm backdrop-blur-sm">
                            <Stars />
                            <p className="text-white/50 font-light italic mb-6 leading-relaxed break-words">"{t.quote}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-neutral-800 border border-brand/20 flex items-center justify-center text-brand font-display font-bold">{t.initial}</div>
                                <div>
                                    <p className="text-white text-sm font-medium">{t.name}</p>
                                    <p className="text-white/30 text-xs">{t.service}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
