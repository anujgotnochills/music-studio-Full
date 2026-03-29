import styles from './Modal.module.css'

export default function Modal({ title, children, onClose, footer }) {
    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>{title}</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>close</span>
                    </button>
                </div>
                <div className={styles.modalBody}>{children}</div>
                {footer && <div className={styles.modalFooter}>{footer}</div>}
            </div>
        </div>
    )
}

// Re-export commonly used styles for forms
export { styles as modalStyles }
