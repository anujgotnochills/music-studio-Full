import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import './index.css'
import { ClientProvider } from './context/ClientContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Preloader from './components/Preloader'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Services from './components/Services'
import Stats from './components/Stats'
import Equipment from './components/Equipment'
import Artists from './components/Artists'
import Gallery from './components/Gallery'
import Videos from './components/Videos'
import Testimonials from './components/Testimonials'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Login from './dashboard/Login'
import DashboardPage from './dashboard/DashboardPage'

gsap.registerPlugin(ScrollTrigger)

// ── Portfolio Site (public) ────────────────────────────────────
function PortfolioSite() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

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
        <Videos />
        <Testimonials />
        <Contact />
        <Footer />
      </div>
    </ClientProvider>
  )
}

// ── Dashboard (protected) ──────────────────────────────────────
function DashboardRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0a0a0f', color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{
          width: 24, height: 24, border: '2px solid rgba(201,169,110,0.2)',
          borderTopColor: '#c9a96e', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  if (!user) return <Login />
  return <DashboardPage />
}

// ── App Root ───────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PortfolioSite />} />
          <Route path="/dashboard" element={<DashboardRoute />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
