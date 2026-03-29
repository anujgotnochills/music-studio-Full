import { useState } from 'react'
import Sidebar from './Sidebar'
import TestimonialsManager from './TestimonialsManager'
import PricesManager from './PricesManager'
import PhotosManager from './PhotosManager'
import VideosManager from './VideosManager'
import styles from './Dashboard.module.css'

const sectionComponents = {
    testimonials: TestimonialsManager,
    prices: PricesManager,
    photos: PhotosManager,
    videos: VideosManager,
}

export default function DashboardPage() {
    const [activeSection, setActiveSection] = useState('testimonials')
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const ActiveComponent = sectionComponents[activeSection] || TestimonialsManager

    return (
        <div className={`${styles.dashboardLayout} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
            <Sidebar 
                activeSection={activeSection} 
                onSectionChange={(s) => {
                    setActiveSection(s);
                    setIsSidebarOpen(false);
                }} 
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />
            
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className={styles.mobileOverlay} 
                    onClick={() => setIsSidebarOpen(false)} 
                />
            )}

            <main className={styles.mainContent}>
                <ActiveComponent />
            </main>
        </div>
    )
}
