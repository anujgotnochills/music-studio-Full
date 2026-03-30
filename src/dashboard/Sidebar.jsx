import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import styles from './Sidebar.module.css'

const navSections = [
    {
        label: 'Content',
        items: [
            { key: 'testimonials', label: 'Testimonials', icon: 'format_quote' },
            { key: 'prices', label: 'Prices / Services', icon: 'sell' },
            { key: 'photos', label: 'Photo Gallery', icon: 'photo_library' },
            { key: 'videos', label: 'Videos', icon: 'videocam' },
        ],
    },
]

export default function Sidebar({ activeSection, onSectionChange, isOpen, onToggle }) {
    const { logout } = useAuth()

    return (
        <>
            {/* Mobile hamburger */}
            <button
                className={styles.mobileToggle}
                onClick={onToggle}
                aria-label={isOpen ? "Close menu" : "Open menu"}
            >
                <span className="material-symbols-outlined">
                    {isOpen ? 'close' : 'menu'}
                </span>
            </button>

            {/* Mobile overlay */}
            <div
                className={`${styles.overlay} ${isOpen ? styles.show : ''}`}
                onClick={onToggle}
            />

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.logoIcon}>
                        <span className="material-symbols-outlined">dashboard</span>
                    </div>
                    <div>
                        <h2>Dashboard</h2>
                        <p>Content Manager</p>
                    </div>
                </div>

                <nav className={styles.sidebarNav}>
                    {navSections.map((section) => (
                        <div key={section.label}>
                            <h4>{section.label}</h4>
                            {section.items.map((item) => (
                                <button
                                    key={item.key}
                                    className={`${styles.navItem} ${activeSection === item.key ? styles.active : ''}`}
                                    onClick={() => onSectionChange(item.key)}
                                >
                                    <span className="material-symbols-outlined">{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <a href="/" className={styles.backBtn}>
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back to Site
                    </a>
                    <button className={styles.logoutBtn} onClick={logout}>
                        <span className="material-symbols-outlined">logout</span>
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    )
}
