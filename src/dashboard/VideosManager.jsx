import { useState, useEffect } from 'react'
import { supabase } from '../supabase/config'
import Modal, { modalStyles } from './Modal'
import styles from './Dashboard.module.css'
import { resolveImage } from '../context/ClientContext'

const COLLECTION = 'videos'
const STORAGE_BUCKET = 'assets'

const emptyForm = { title: '', description: '', videoUrl: '', thumbnailUrl: '', order: 0 }

export default function VideosManager() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [thumbFile, setThumbFile] = useState(null)
    const [thumbPreview, setThumbPreview] = useState(null)
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
            console.error('Error fetching videos:', error)
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
                for (const url of [item?.videoUrl, item?.thumbnailUrl]) {
                    if (url && url.includes('supabase.co')) {
                        const urlParts = url.split(`${STORAGE_BUCKET}/`)
                        if (urlParts.length === 2) {
                            filePathsToDelete.push(urlParts[1].split('?')[0])
                        }
                    }
                }
            })

            if (filePathsToDelete.length > 0) {
                // Unique paths only
                const uniquePaths = [...new Set(filePathsToDelete)]
                await supabase.storage.from(STORAGE_BUCKET).remove(uniquePaths)
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
        setThumbFile(null)
        setThumbPreview(null)
        setModalOpen(true)
    }

    const openEdit = (item) => {
        setForm({
            title: item.title || '',
            description: item.description || '',
            videoUrl: item.videoUrl || '',
            thumbnailUrl: item.thumbnailUrl || '',
            order: item.order || 0,
        })
        setEditingId(item.id)
        setThumbFile(null)
        setThumbPreview(item.thumbnailUrl || null)
        setModalOpen(true)
    }

    const handleThumbSelect = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setThumbFile(file)
        setThumbPreview(URL.createObjectURL(file))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            let videoUrl = form.videoUrl
            let thumbnailUrl = form.thumbnailUrl

            // Upload thumbnail if selected
            if (thumbFile) {
                const fileExt = thumbFile.name.split('.').pop()
                const fileName = `videos/${Date.now()}_thumb.${fileExt}`
                
                const { error: uploadError } = await supabase.storage
                    .from(STORAGE_BUCKET)
                    .upload(fileName, thumbFile)
                if (uploadError) throw uploadError

                const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName)
                thumbnailUrl = data.publicUrl
            }

            // Auto-generate YouTube thumbnail if no custom thumbnail
            if (!thumbnailUrl && videoUrl) {
                const ytMatch = videoUrl.match(
                    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
                )
                if (ytMatch) {
                    thumbnailUrl = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`
                }
            }

            const dataToSave = {
                title: form.title,
                description: form.description,
                videoUrl,
                thumbnailUrl,
                order: Number(form.order) || 0,
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
            // Cleanup storage files
            for (const url of [item?.videoUrl, item?.thumbnailUrl]) {
                if (url && url.includes('supabase.co')) {
                    try {
                        const urlParts = url.split(`${STORAGE_BUCKET}/`)
                        if (urlParts.length === 2) {
                            const filePath = urlParts[1].split('?')[0]
                            await supabase.storage.from(STORAGE_BUCKET).remove([filePath])
                        }
                    } catch (e) {
                        console.warn('Could not delete file', e)
                    }
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
        return <div className={styles.loadingState}><div className={styles.spinner} /> Loading videos…</div>
    }

    const allSelected = items.length > 0 && selectedIds.length === items.length

    return (
        <div>
            <div className={styles.sectionHeader}>
                <div>
                    <h2>Videos</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.2rem' }}>
                        <p>{items.length} / 5 video{items.length !== 1 ? 's' : ''}</p>
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
                        Add Video
                    </button>
                )}
            </div>

            {items.length === 0 ? (
                <div className={styles.emptyState}>
                    <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.2 }}>videocam</span>
                    <p>No videos yet</p>
                    <button className={styles.addBtn} onClick={openAdd}>Add your first video</button>
                </div>
            ) : (
                <div className={styles.photoGrid}>
                    {items.map((item) => {
                        const isIg = item.videoUrl?.includes('instagram.com')
                        const isShorts = item.videoUrl?.includes('/shorts/')
                        const isVertical = isIg || isShorts
                        const isSelected = selectedIds.includes(item.id)
                        
                        return (
                        <div key={item.id} className={`${styles.photoCard} ${isSelected ? styles.selected : ''}`}>
                            <div className={styles.photoThumb} style={{ aspectRatio: isVertical ? '1/1' : '16/9' }}>
                                {/* Checkbox */}
                                <div className={styles.checkboxContainer} style={{ top: '8px', left: '8px' }} onClick={() => toggleSelect(item.id)}>
                                    <div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
                                        {isSelected && <span className="material-symbols-outlined">check</span>}
                                    </div>
                                </div>

                                {item.thumbnailUrl ? (
                                    <img src={resolveImage(item.thumbnailUrl)} alt={item.title} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: '#1a1a24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'rgba(255,255,255,0.15)' }}>videocam</span>
                                    </div>
                                )}
                                {/* Play badge */}
                                <div style={{
                                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                    width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(201,169,110,0.9)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                                    zIndex: 5
                                }}>
                                    <span className="material-symbols-outlined" style={{ color: '#0a0a0f', fontSize: '1.3rem', marginLeft: '2px', fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                                </div>
                                <div className={styles.photoOverlay}>
                                    <button className={styles.iconBtnLight} onClick={() => openEdit(item)} title="Edit">
                                        <span className="material-symbols-outlined">edit</span>
                                    </button>
                                    <button className={styles.iconBtnLight} onClick={() => setDeleteConfirm(item.id)} title="Delete">
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            </div>
                            <div className={styles.photoLabel}>{item.title || 'Untitled'}</div>
                        </div>
                        )
                    })}
                </div>
            )}

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className={styles.bulkActionBar}>
                    <div className={styles.bulkInfo}>
                        {selectedIds.length} video{selectedIds.length !== 1 ? 's' : ''} selected
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
                    title={editingId ? 'Edit Video' : 'Add Video'}
                    onClose={() => setModalOpen(false)}
                    footer={
                        <>
                            <button className={modalStyles.btnSecondary} onClick={() => setModalOpen(false)}>Cancel</button>
                            <button className={modalStyles.btnPrimary} onClick={handleSave} disabled={saving || !form.title}>
                                {saving ? 'Saving…' : editingId ? 'Update' : 'Add'}
                            </button>
                        </>
                    }
                >
                    <div className={modalStyles.formGroup}>
                        <label>Video Title</label>
                        <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Studio Tour" />
                    </div>
                    <div className={modalStyles.formGroup}>
                        <label>Description</label>
                        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Brief description" rows={3} />
                    </div>

                    <div className={modalStyles.formGroup}>
                        <label>Video URL (YouTube or Instagram link)</label>
                        <input value={form.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
                    </div>

                    <div className={modalStyles.formGroup}>
                        <label>Custom Thumbnail (optional — auto-generated for YouTube)</label>
                        <input type="file" accept="image/*" onChange={handleThumbSelect} style={{ color: 'rgba(255,255,255,0.5)' }} />
                        {thumbPreview && (
                            <img src={resolveImage(thumbPreview)} alt="Thumbnail preview" style={{ marginTop: '0.5rem', maxHeight: '120px', borderRadius: '8px', objectFit: 'cover' }} />
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
                    title="Delete Video"
                    onClose={() => setDeleteConfirm(null)}
                    footer={
                        <>
                            <button className={modalStyles.btnSecondary} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className={modalStyles.btnDanger} onClick={() => handleDelete(deleteConfirm)}>Delete</button>
                        </>
                    }
                >
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>This will permanently delete this video and its files from storage. Continue?</p>
                </Modal>
            )}

            {/* Bulk Delete Confirmation */}
            {bulkDeleteConfirm && (
                <Modal
                    title="Delete Selected Videos"
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
                        You are about to delete <strong>{selectedIds.length}</strong> videos and their associated files from storage. This action cannot be undone. Continue?
                    </p>
                </Modal>
            )}
        </div>
    )
}
