import { useState, useEffect } from 'react'
import { supabase } from '../supabase/config'
import Modal, { modalStyles } from './Modal'
import styles from './Dashboard.module.css'

const COLLECTION = 'testimonials'

const emptyForm = { name: '', initial: '', service: '', quote: '', order: 0 }

export default function TestimonialsManager() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [selectedIds, setSelectedIds] = useState([])
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)

    const fetchItems = async () => {
        const { data, error } = await supabase
            .from(COLLECTION)
            .select('*')
            .order('order', { ascending: true })
        
        if (error) {
            console.error('Error fetching testimonials:', error)
        } else {
            setItems(data || [])
        }
        setLoading(false)
        setSelectedIds([])
    }

    useEffect(() => {
        fetchItems()
    }, [])

    const toggleSelect = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === items.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(items.map(i => i.id))
        }
    }

    const handleBulkDelete = async () => {
        setSaving(true)
        try {
            const { error } = await supabase
                .from(COLLECTION)
                .delete()
                .in('id', selectedIds)
            if (error) throw error
            
            setBulkDeleteConfirm(false)
            fetchItems()
        } catch (err) {
            alert('Error deleting: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const openAdd = () => {
        setForm({ ...emptyForm, order: items.length + 1 })
        setEditingId(null)
        setModalOpen(true)
    }

    const openEdit = (item) => {
        setForm({
            name: item.name || '',
            initial: item.initial || '',
            service: item.service || '',
            quote: item.quote || '',
            order: item.order || 0,
        })
        setEditingId(item.id)
        setModalOpen(true)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const data = {
                ...form,
                initial: form.initial || form.name?.[0]?.toUpperCase() || '?',
                order: Number(form.order) || 0,
            }
            if (editingId) {
                const { error } = await supabase
                    .from(COLLECTION)
                    .update(data)
                    .match({ id: editingId })
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from(COLLECTION)
                    .insert([data])
                if (error) throw error
            }
            setModalOpen(false)
            fetchItems()
        } catch (err) {
            alert('Error saving: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        try {
            const { error } = await supabase
                .from(COLLECTION)
                .delete()
                .match({ id })
            if (error) throw error
            
            setDeleteConfirm(null)
            fetchItems()
        } catch (err) {
            alert('Error deleting: ' + err.message)
        }
    }

    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

    if (loading) {
        return <div className={styles.loadingState}><div className={styles.spinner} /> Loading testimonials…</div>
    }

    const allSelected = items.length > 0 && selectedIds.length === items.length

    return (
        <div>
            {/* Header */}
            <div className={styles.sectionHeader}>
                <div>
                    <h2>Testimonials</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.2rem' }}>
                        <p>{items.length} / 5 testimonial{items.length !== 1 ? 's' : ''}</p>
                        {items.length > 0 && (
                            <button 
                                className={`${styles.selectAllBtn} ${allSelected ? styles.active : ''}`}
                                onClick={toggleSelectAll}
                            >
                                <div className={`${styles.checkbox} ${allSelected ? styles.checked : selectedIds.length > 0 ? styles.indeterminate : ''}`} style={{ width: '16px', height: '16px' }}>
                                    {allSelected ? (
                                        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>check</span>
                                    ) : selectedIds.length > 0 ? (
                                        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>remove</span>
                                    ) : null}
                                </div>
                                {allSelected ? 'Deselect All' : 'Select All'}
                            </button>
                        )}
                    </div>
                </div>
                {items.length >= 5 ? (
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Maximum limit (5) reached</div>
                ) : (
                    <button className={styles.addBtn} onClick={openAdd}>
                        <span className="material-symbols-outlined">add</span>
                        Add Testimonial
                    </button>
                )}
            </div>

            {/* List */}
            {items.length === 0 ? (
                <div className={styles.emptyState}>
                    <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.2 }}>format_quote</span>
                    <p>No testimonials yet</p>
                    <button className={styles.addBtn} onClick={openAdd}>Add your first testimonial</button>
                </div>
            ) : (
                <div className={styles.cardGrid}>
                    {items.map((item) => {
                        const isSelected = selectedIds.includes(item.id)
                        return (
                            <div key={item.id} className={`${styles.card} ${isSelected ? styles.selected : ''}`}>
                                {/* Checkbox */}
                                <div className={styles.checkboxContainer} onClick={() => toggleSelect(item.id)}>
                                    <div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
                                        {isSelected && <span className="material-symbols-outlined">check</span>}
                                    </div>
                                </div>

                                <div className={styles.cardBody}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                        <div className={styles.avatar}>{item.initial || item.name?.[0]}</div>
                                        <div>
                                            <div className={styles.cardTitle}>{item.name}</div>
                                            <div className={styles.cardSub}>{item.service}</div>
                                        </div>
                                    </div>
                                    <p className={styles.cardQuote}>"{item.quote}"</p>
                                </div>
                                <div className={styles.cardActions}>
                                    <button className={styles.iconBtn} onClick={() => openEdit(item)} title="Edit">
                                        <span className="material-symbols-outlined">edit</span>
                                    </button>
                                    <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => setDeleteConfirm(item.id)} title="Delete">
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className={styles.bulkActionBar}>
                    <div className={styles.bulkInfo}>
                        {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
                    </div>
                    <div className={styles.bulkActions}>
                        <button className={`${styles.bulkBtn} ${styles.cancelSelection}`} onClick={() => setSelectedIds([])}>
                            Cancel
                        </button>
                        <button className={`${styles.bulkBtn} ${styles.deleteSelected}`} onClick={() => setBulkDeleteConfirm(true)}>
                            Delete Selected
                        </button>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {modalOpen && (
                <Modal
                    title={editingId ? 'Edit Testimonial' : 'Add Testimonial'}
                    onClose={() => setModalOpen(false)}
                    footer={
                        <>
                            <button className={modalStyles.btnSecondary} onClick={() => setModalOpen(false)}>Cancel</button>
                            <button className={modalStyles.btnPrimary} onClick={handleSave} disabled={saving || !form.name || !form.quote}>
                                {saving ? 'Saving…' : editingId ? 'Update' : 'Add'}
                            </button>
                        </>
                    }
                >
                    <div className={modalStyles.formGroup}>
                        <label>Name</label>
                        <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Client name" />
                    </div>
                    <div className={modalStyles.formGroup}>
                        <label>Initial (auto-filled from name)</label>
                        <input value={form.initial} onChange={(e) => set('initial', e.target.value)} placeholder="A" maxLength={2} />
                    </div>
                    <div className={modalStyles.formGroup}>
                        <label>Service Used</label>
                        <input value={form.service} onChange={(e) => set('service', e.target.value)} placeholder="e.g. Full Album Recording" />
                    </div>
                    <div className={modalStyles.formGroup}>
                        <label>Quote</label>
                        <textarea value={form.quote} onChange={(e) => set('quote', e.target.value)} placeholder="What did they say?" rows={4} />
                    </div>
                    <div className={modalStyles.formGroup}>
                        <label>Display Order</label>
                        <input type="number" value={form.order} onChange={(e) => set('order', e.target.value)} min={0} />
                    </div>
                </Modal>
            )}

            {/* Individual Delete Confirmation */}
            {deleteConfirm && (
                <Modal
                    title="Delete Testimonial"
                    onClose={() => setDeleteConfirm(null)}
                    footer={
                        <>
                            <button className={modalStyles.btnSecondary} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className={modalStyles.btnDanger} onClick={() => handleDelete(deleteConfirm)}>Delete</button>
                        </>
                    }
                >
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>Are you sure you want to delete this testimonial? This action cannot be undone.</p>
                </Modal>
            )}

            {/* Bulk Delete Confirmation */}
            {bulkDeleteConfirm && (
                <Modal
                    title="Delete Selected Testimonials"
                    onClose={() => setBulkDeleteConfirm(false)}
                    footer={
                        <>
                            <button className={modalStyles.btnSecondary} onClick={() => setBulkDeleteConfirm(false)}>Cancel</button>
                            <button className={modalStyles.btnDanger} onClick={handleBulkDelete} disabled={saving}>
                                {saving ? 'Deleting...' : 'Delete All Selected'}
                            </button>
                        </>
                    }
                >
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>
                        You are about to delete <strong>{selectedIds.length}</strong> testimonials. This action cannot be undone. Continue?
                    </p>
                </Modal>
            )}
        </div>
    )
}
