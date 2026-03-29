import { useState, useEffect } from 'react'
import { supabase } from '../supabase/config'
import Modal, { modalStyles } from './Modal'
import styles from './Dashboard.module.css'
import { resolveImage } from '../context/ClientContext'

const COLLECTION = 'services'
const STORAGE_BUCKET = 'assets'

const emptyForm = {
    title: '', price: '', unit: '', icon: 'music_note',
    description: '', features: '', order: 0, imageUrl: '',
}

const ICON_OPTIONS = [
    { value: 'mic', label: 'Microphone' },
    { value: 'equalizer', label: 'Equalizer' },
    { value: 'podcasts', label: 'Podcast' },
    { value: 'music_note', label: 'Music Note' },
    { value: 'headphones', label: 'Headphones' },
    { value: 'piano', label: 'Piano' },
    { value: 'graphic_eq', label: 'Graphic EQ' },
    { value: 'speaker', label: 'Speaker' },
    { value: 'queue_music', label: 'Queue Music' },
    { value: 'album', label: 'Album' },
]

export default function PricesManager() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
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
            console.error('Error fetching services:', error)
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
            // Cleanup storage for all selected items
            const filePathsToDelete = []
            selectedIds.forEach(id => {
                const item = items.find(i => i.id === id)
                if (item?.imageUrl && item.imageUrl.includes('supabase.co')) {
                    const urlParts = item.imageUrl.split(`${STORAGE_BUCKET}/`)
                    if (urlParts.length === 2) {
                        filePathsToDelete.push(urlParts[1].split('?')[0])
                    }
                }
            })

            if (filePathsToDelete.length > 0) {
                await supabase.storage.from(STORAGE_BUCKET).remove(filePathsToDelete)
            }

            // Bulk delete from DB
            const { error } = await supabase
                .from(COLLECTION)
                .delete()
                .in('id', selectedIds)
            if (error) throw error
            
            setBulkDeleteConfirm(false)
            fetchItems()
        } catch (err) {
            alert('Bulk delete error: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const openAdd = () => {
        setForm({ ...emptyForm, order: items.length + 1 })
        setEditingId(null)
        setImageFile(null)
        setImagePreview(null)
        setModalOpen(true)
    }

    const openEdit = (item) => {
        setForm({
            title: item.title || '',
            price: item.price || '',
            unit: item.unit || '',
            icon: item.icon || 'music_note',
            description: item.description || '',
            features: (item.features || []).join(', '),
            order: item.order || 0,
            imageUrl: item.imageUrl || '',
        })
        setEditingId(item.id)
        setImageFile(null)
        setImagePreview(item.imageUrl || null)
        setModalOpen(true)
    }

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setImageFile(file)
        setImagePreview(URL.createObjectURL(file))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            let imageUrl = form.imageUrl

            // Upload new image if selected
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop()
                const fileName = `services/${Date.now()}.${fileExt}`
                
                const { error: uploadError } = await supabase.storage
                    .from(STORAGE_BUCKET)
                    .upload(fileName, imageFile)
                
                if (uploadError) throw uploadError

                const { data } = supabase.storage
                    .from(STORAGE_BUCKET)
                    .getPublicUrl(fileName)
                    
                imageUrl = data.publicUrl
            }

            const dataToSave = {
                title: form.title,
                price: form.price,
                unit: form.unit,
                icon: form.icon,
                description: form.description,
                features: form.features.split(',').map(f => f.trim()).filter(Boolean),
                order: Number(form.order) || 0,
                imageUrl,
            }

            if (editingId) {
                const { error } = await supabase
                    .from(COLLECTION)
                    .update(dataToSave)
                    .match({ id: editingId })
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from(COLLECTION)
                    .insert([dataToSave])
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
            const item = items.find(i => i.id === id)
            // Try to delete the image from storage
            if (item?.imageUrl && item.imageUrl.includes('supabase.co')) {
                try {
                    // Extract the path from the URL
                    const urlParts = item.imageUrl.split(`${STORAGE_BUCKET}/`)
                    if (urlParts.length === 2) {
                        const filePath = urlParts[1].split('?')[0] // remove query params if any
                        await supabase.storage.from(STORAGE_BUCKET).remove([filePath])
                    }
                } catch (e) {
                    console.warn('Could not delete image', e)
                }
            }
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
        return <div className={styles.loadingState}><div className={styles.spinner} /> Loading services…</div>
    }

    const allSelected = items.length > 0 && selectedIds.length === items.length

    return (
        <div>
            <div className={styles.sectionHeader}>
                <div>
                    <h2>Prices / Services</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.2rem' }}>
                        <p>{items.length} / 5 service{items.length !== 1 ? 's' : ''}</p>
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
                        Add Service
                    </button>
                )}
            </div>

            {items.length === 0 ? (
                <div className={styles.emptyState}>
                    <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.2 }}>sell</span>
                    <p>No services yet</p>
                    <button className={styles.addBtn} onClick={openAdd}>Add your first service</button>
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

                                {item.imageUrl && (
                                    <div className={styles.cardImage}>
                                        <img src={resolveImage(item.imageUrl)} alt={item.title} />
                                    </div>
                                )}
                                <div className={styles.cardBody}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                                        <span className="material-symbols-outlined" style={{ color: '#c9a96e', fontSize: '1.2rem' }}>{item.icon}</span>
                                        <div className={styles.cardTitle}>{item.title}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.5rem' }}>
                                        <span style={{ color: '#c9a96e', fontWeight: 700, fontSize: '1.2rem' }}>{item.price}</span>
                                        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>{item.unit}</span>
                                    </div>
                                    <p className={styles.cardSub}>{item.description}</p>
                                    {item.features?.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                                            {item.features.map(f => (
                                                <span key={f} className={styles.tag}>{f}</span>
                                            ))}
                                        </div>
                                    )}
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
                    title={editingId ? 'Edit Service' : 'Add Service'}
                    onClose={() => setModalOpen(false)}
                    footer={
                        <>
                            <button className={modalStyles.btnSecondary} onClick={() => setModalOpen(false)}>Cancel</button>
                            <button className={modalStyles.btnPrimary} onClick={handleSave} disabled={saving || !form.title || !form.price}>
                                {saving ? 'Saving…' : editingId ? 'Update' : 'Add'}
                            </button>
                        </>
                    }
                >
                    <div className={modalStyles.formGroup}>
                        <label>Service Title</label>
                        <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Recording" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className={modalStyles.formGroup}>
                            <label>Price</label>
                            <input value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="₹5,000" />
                        </div>
                        <div className={modalStyles.formGroup}>
                            <label>Unit</label>
                            <input value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="Per Hour" />
                        </div>
                    </div>
                    <div className={modalStyles.formGroup}>
                        <label>Icon</label>
                        <select value={form.icon} onChange={(e) => set('icon', e.target.value)}>
                            {ICON_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className={modalStyles.formGroup}>
                        <label>Description</label>
                        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Brief description" rows={3} />
                    </div>
                    <div className={modalStyles.formGroup}>
                        <label>Features (comma-separated)</label>
                        <input value={form.features} onChange={(e) => set('features', e.target.value)} placeholder="Full-Band Recording, Vocal Booth, Isolation" />
                    </div>
                    <div className={modalStyles.formGroup}>
                        <label>Service Image</label>
                        <input type="file" accept="image/*" onChange={handleImageSelect} style={{ color: 'rgba(255,255,255,0.5)' }} />
                        {imagePreview && (
                            <img src={resolveImage(imagePreview)} alt="Preview" style={{ marginTop: '0.5rem', maxHeight: '120px', borderRadius: '8px', objectFit: 'cover' }} />
                        )}
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
                    title="Delete Service"
                    onClose={() => setDeleteConfirm(null)}
                    footer={
                        <>
                            <button className={modalStyles.btnSecondary} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className={modalStyles.btnDanger} onClick={() => handleDelete(deleteConfirm)}>Delete</button>
                        </>
                    }
                >
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>This will permanently delete this service and its image. Continue?</p>
                </Modal>
            )}

            {/* Bulk Delete Confirmation */}
            {bulkDeleteConfirm && (
                <Modal
                    title="Delete Selected Services"
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
                        You are about to delete <strong>{selectedIds.length}</strong> services and their associated images. This action cannot be undone. Continue?
                    </p>
                </Modal>
            )}
        </div>
    )
}
