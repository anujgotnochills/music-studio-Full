import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import './index.css'
import { ClientProvider } from './context/ClientContext'
import Preloader from './components/Preloader'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Services from './components/Services'
import Stats from './components/Stats'
import Equipment from './components/Equipment'
import Artists from './components/Artists'
import Gallery from './components/Gallery'
import Testimonials from './components/Testimonials'
import Contact from './components/Contact'
import Footer from './components/Footer'

gsap.registerPlugin(ScrollTrigger)

function App() {
  useEffect(() => {
    // Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <ClientProvider>
      <div className="bg-neutral-950 text-white font-body antialiased overflow-x-hidden">
        <Preloader />
        <Navbar />
        <Hero />
        <Marquee />
        <Services />
        <Stats />
        <Equipment />
        <Artists />
        <Gallery />
        <Testimonials />
        <Contact />
        <Footer />
      </div>
    </ClientProvider>
  )
}

export default App
