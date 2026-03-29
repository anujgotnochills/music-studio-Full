import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase/config'
import configData from '../client-config.json'

// ── Resolve the active client from config ──────────────────────────
let activeKey = configData.default
if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    if (params.has('client') && configData.clients[params.get('client')]) {
        activeKey = params.get('client')
    }
}
const activeClient = configData.clients[activeKey] || Object.values(configData.clients)[0]

// ── Dynamic image imports (Vite asset resolution) ──────────────────
const imageModules = import.meta.glob('../assets/*.{png,jpg,jpeg,svg,webp}', { eager: true })

export function resolveImage(filename) {
    if (!filename) return ''
    if (filename.startsWith('http://') || filename.startsWith('https://')) return filename
    const key = Object.keys(imageModules).find(k => k.endsWith(`/${filename}`))
    return key ? imageModules[key].default : filename
}

// ── Helper: split studio name for stylized display ─────────────────
function splitName(name) {
    const words = name.trim().split(/\s+/)
    if (words.length === 1) return { textBefore: name, textAccent: '' }
    const accent = words.pop()
    return { textBefore: words.join(' '), textAccent: accent }
}

// ── Build static (fallback) context from config files ──────────────
const { textBefore, textAccent } = splitName(activeClient.studioName)

const staticContext = {
    client: activeClient,
    clientKey: activeKey,

    brand: {
        name: activeClient.studioName,
        shortName: activeClient.studioName,
        logo: { icon: 'graphic_eq', textBefore, textAccent },
    },

    theme: {
        accentColor: activeClient.accentColor || '#c9a96e',
        bgColor: activeClient.bgColor || '#0a0a0f',
    },

    nav: {
        links: [
            { label: 'Services', href: '#services' },
            { label: 'Studio', href: '#studio' },
            { label: 'Gallery', href: '#gallery' },
        ],
        cta: {
            label: 'Book a Session',
            href: activeClient.whatsappNumber
                ? `https://wa.me/${activeClient.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi, I would like to book a session.')}`
                : '#contact',
        },
    },

    hero: {
        subtitle: 'Professional Recording Studio',
        headline: 'Where Sound Comes',
        headlineAccent: 'Alive',
        tagline: 'World-class recording. Mixing. Mastering.',
        ctaPrimary: {
            label: 'Book a Session',
            href: activeClient.whatsappNumber
                ? `https://wa.me/${activeClient.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi, I would like to book a session.')}`
                : '#contact',
        },
        ctaSecondary: { label: 'Explore Services', href: '#services' },
    },

    marquee: ['Recording', 'Mixing', 'Mastering', 'Podcast', 'Voice Over', 'Live Sessions', 'Sound Design', 'Production', 'Dolby Atmos', 'Post-Production'],

    services: {
        sectionLabel: 'Our Expertise',
        sectionTitle: 'Studio',
        sectionTitleAccent: 'Services',
        sectionDescription: 'Professional audio services crafted by experienced engineers for an experience beyond ordinary.',
        items: [
            { id: 1, title: 'Recording', price: '₹5,000', unit: 'Per Hour', icon: 'mic', image: 'studio-recording.png', features: ['Full-Band Recording', 'Vocal Booth', 'Instrument Isolation'], description: 'Capture your sound in our acoustically treated rooms with world-class microphones and preamps.' },
            { id: 2, title: 'Mixing & Mastering', price: '₹15,000', unit: 'Per Track', icon: 'equalizer', image: 'studio-mixing.png', features: ['Stem Mixing', 'Analog Summing', 'Loudness Optimization'], description: 'Professional mixing and mastering that brings clarity, punch, and polish to your tracks.' },
            { id: 3, title: 'Podcast Production', price: '₹3,000', unit: 'Per Episode', icon: 'podcasts', image: 'studio-podcast.png', features: ['Multi-Mic Setup', 'Editing & Post', 'Distribution Support'], description: 'End-to-end podcast production — from recording to editing to publishing on all major platforms.' },
            { id: 4, title: 'Sound Design', price: '₹20,000', unit: 'Per Project', icon: 'music_note', image: 'studio-sounddesign.png', features: ['Film Score', 'SFX & Foley', 'Spatial Audio'], description: 'Custom sound design for film, games, and media. From ambient textures to full orchestral scores.' },
        ],
    },

    about: {
        sectionLabel: 'Our Philosophy',
        title: 'Where Silence Meets',
        titleAccent: 'Sound.',
        paragraphs: [
            `At ${activeClient.studioName}, we believe great music starts with the perfect environment. Our acoustically engineered rooms and premium analog-digital hybrid setup create the ideal space for artists to bring their vision to life.`,
            "Whether you're recording your debut single or mastering an album, our team of experienced engineers ensures every frequency, every nuance, every beat is captured with crystalline precision.",
        ],
        stats: [
            { value: '15+', label: 'Years of Excellence' },
            { value: '10k+', label: 'Tracks Produced' },
        ],
        image: 'studio-about.png',
    },

    stats: [
        { end: 15, suffix: '+', label: 'Years Experience' },
        { end: 10000, suffix: '+', label: 'Tracks Produced' },
        { end: 200, suffix: '+', label: 'Artists Recorded' },
        { end: 99, suffix: '%', label: 'Client Satisfaction' },
    ],

    equipment: {
        sectionLabel: 'The Studio',
        sectionTitle: 'Our Rooms & Gear',
        sectionDescription: 'Explore our professionally designed spaces, each optimized for different recording scenarios.',
        rooms: [
            { id: 1, title: 'Main Studio — Room A', subtitle: '800 sq ft Live Room', image: 'studio-recording.png', description: 'Our flagship recording space features 18-foot ceilings, a Steinway grand piano, and room for a full orchestra.', specs: ['Neve 8078 Console', '18ft Ceiling Height', 'Full Drum Kit'] },
            { id: 2, title: 'Control Room', subtitle: 'Mixing & Mastering Suite', image: 'studio-mixing.png', description: 'Equipped with a 48-channel SSL console, Pro Tools HDX, and a curated collection of outboard gear.', specs: ['SSL 4000 G+', 'Genelec 8351B Monitors', 'Pro Tools HDX'] },
            { id: 3, title: 'Vocal Booth — Room B', subtitle: 'Isolated Recording Space', image: 'studio-about.png', description: 'A perfectly isolated space for clean vocals, voiceovers, and podcasts.', specs: ['Neumann U87 AI', 'Avalon VT-737sp', 'Full Isolation'] },
        ],
        highlights: [
            { value: '3', label: 'Recording Rooms' },
            { value: '48ch', label: 'Console Channels' },
        ],
    },

    artists: {
        heading: 'Artists Who Trust Us',
        backgroundText: `${activeClient.studioName.toUpperCase()} ${activeClient.studioName.toUpperCase()}`,
        subtitle: '...and 200+ more artists who\'ve recorded with us',
        items: [
            { name: 'Arjun Mehta', genre: 'Hip-Hop / R&B', initial: 'A' },
            { name: 'Priya Sharma', genre: 'Indie Pop', initial: 'P' },
            { name: 'Vikram Singh', genre: 'Classical Fusion', initial: 'V' },
            { name: 'Naya Collective', genre: 'Electronic / Ambient', initial: 'N' },
        ],
    },

    gallery: {
        sectionLabel: 'Portfolio',
        sectionTitle: 'Studio Snapshots',
        viewAllText: 'View Full Gallery',
        items: [
            { image: 'gallery-livesession.png', alt: 'Live band recording session', label: 'Live Session' },
            { image: 'gallery-controlroom.png', alt: 'Professional control room', label: 'Control Room' },
            { image: 'gallery-vocalbooth.png', alt: 'Vocal booth', label: 'Vocal Booth' },
            { image: 'gallery-console.png', alt: 'Analog mixing console', label: 'Mixing Console' },
            { image: 'gallery-artistrecording.png', alt: 'Musician recording', label: 'Artist Recording' },
            { image: 'studio-sounddesign.png', alt: 'Studio atmosphere', label: 'Studio Night' },
        ],
    },

    testimonials: {
        heading: 'What Artists Say',
        items: [
            { initial: 'A', name: 'Arjun Mehta', service: 'Full Album Recording', quote: `${activeClient.studioName} is where my album came alive. The engineers understood my vision from day one.` },
            { initial: 'S', name: 'Sneha Kapoor', service: 'Podcast Production', quote: "We've been recording our podcast here for over a year. The sound quality is broadcast-grade and the team is seamless." },
            { initial: 'R', name: 'Rahul Deshmukh', service: 'Mixing & Mastering', quote: 'I sent rough mixes and got back absolute gold. The final tracks had clarity and punch that elevated our entire project.' },
        ],
    },

    videos: {
        sectionLabel: 'Watch & Listen',
        sectionTitle: 'Studio Sessions',
        items: [],
    },

    contact: {
        formHeading: 'Book a Session',
        formTitle: 'Reserve Your Studio Time',
        submitLabel: 'Request Session',
        serviceOptions: ['Recording Session', 'Mixing & Mastering', 'Podcast Production', 'Sound Design', 'Other Service'],
        timeSlots: ['Morning (9am - 12pm)', 'Afternoon (12pm - 5pm)', 'Evening (5pm - 10pm)', 'Late Night (10pm - 2am)'],
        info: {
            heading: 'Visit The Studio',
            address: activeClient.address,
            phone: activeClient.phone,
            email: activeClient.email,
            whatsapp: activeClient.whatsappNumber,
            hours: activeClient.openHours
                ? [activeClient.openHours]
                : ['Mon - Sat: 9:00 AM - 2:00 AM', 'Sun: 10:00 AM - 10:00 PM'],
        },
        socialLabel: 'Follow Our Sound',
        socials: [
            activeClient.youtube && { platform: 'youtube', url: activeClient.youtube },
            activeClient.instagram && { platform: 'instagram', url: activeClient.instagram },
            activeClient.facebook && { platform: 'facebook', url: activeClient.facebook },
        ].filter(Boolean),
    },

    footer: {
        copyright: `© 2026 ${activeClient.studioName}. All rights reserved.`,
        links: [
            { label: 'Privacy Policy', href: '#' },
            { label: 'Terms of Service', href: '#' },
        ],
    },
}

// ── Context ────────────────────────────────────────────────────────
const ClientContext = createContext(staticContext)

export function ClientProvider({ children }) {
    const [contextData, setContextData] = useState(staticContext)
    const [databaseReady, setDatabaseReady] = useState(false)

    // Inject accent color + bg color as CSS custom properties on mount
    useEffect(() => {
        const root = document.documentElement
        const accent = contextData.theme.accentColor
        const bg = contextData.theme.bgColor

        root.style.setProperty('--color-brand', accent)
        root.style.setProperty('--color-brand-dark', accent + 'cc')
        root.style.setProperty('--color-bg', bg)

        const meta = document.querySelector('meta[name="theme-color"]')
        if (meta) meta.setAttribute('content', bg)

        document.title = `${contextData.brand.name} | Professional Recording, Mixing & Mastering`
    }, [contextData])

    // ── Supabase data fetching ──────────────────────────────
    useEffect(() => {
        if (!supabase) {
            console.warn('[ClientContext] No Supabase config found — using static fallback data')
            return
        }

        async function fetchSupabaseData() {
            try {
                // Fetch Testimonials
                const { data: testimonials } = await supabase.from('testimonials').select('*').order('order', { ascending: true })
                if (testimonials?.length > 0) {
                    setContextData(prev => ({
                        ...prev,
                        testimonials: {
                            ...prev.testimonials,
                            items: testimonials.map(d => ({
                                id: d.id,
                                initial: d.initial || d.name?.[0] || '?',
                                name: d.name,
                                service: d.service,
                                quote: d.quote,
                            })),
                        },
                    }))
                }

                // Fetch Services
                const { data: services } = await supabase.from('services').select('*').order('order', { ascending: true })
                if (services?.length > 0) {
                    setContextData(prev => ({
                        ...prev,
                        services: {
                            ...prev.services,
                            items: services.map((d, i) => ({
                                id: d.id,
                                title: d.title,
                                price: d.price,
                                unit: d.unit,
                                icon: d.icon || 'music_note',
                                image: d.imageUrl || '',
                                features: d.features || [],
                                description: d.description || '',
                            })),
                        },
                    }))
                }

                // Fetch Gallery
                const { data: gallery } = await supabase.from('gallery').select('*').order('order', { ascending: true })
                if (gallery?.length > 0) {
                    setContextData(prev => ({
                        ...prev,
                        gallery: {
                            ...prev.gallery,
                            items: gallery.map(d => ({
                                id: d.id,
                                image: d.imageUrl || '',
                                alt: d.alt || d.label || '',
                                label: d.label || '',
                            })),
                        },
                    }))
                }

                // Fetch Videos
                const { data: videos } = await supabase.from('videos').select('*').order('order', { ascending: true })
                if (videos) {
                    setContextData(prev => ({
                        ...prev,
                        videos: {
                            ...prev.videos,
                            items: videos.map(d => ({
                                id: d.id,
                                title: d.title || '',
                                description: d.description || '',
                                videoUrl: d.videoUrl || '',
                                thumbnailUrl: d.thumbnailUrl || '',
                            })),
                        },
                    }))
                }
                
                setDatabaseReady(true)
            } catch (err) {
                console.error('[Supabase] Failed to fetch data:', err)
            }
        }

        fetchSupabaseData()
    }, [])

    return (
        <ClientContext.Provider value={{ ...contextData, databaseReady }}>
            {children}
        </ClientContext.Provider>
    )
}

export function useClient() {
    return useContext(ClientContext)
}
