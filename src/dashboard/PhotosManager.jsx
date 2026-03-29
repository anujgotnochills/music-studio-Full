import { useState, useEffect } from 'react'
import { supabase } from '../supabase/config'
import Modal, { modalStyles } from './Modal'
import styles from './Dashboard.module.css'
import { resolveImage } from '../context/ClientContext'

const COLLECTION = 'gallery'
const STORAGE_BUCKET = 'assets'

const emptyForm = { label: '', alt: '', order: 0, imageUrl: '' }

export default function PhotosManager() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [bulkModalOpen, setBulkModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [saving, setSaving] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [bulkFiles, setBulkFiles] = useState([])
    const [currentUploadIndex, setCurrentUploadIndex] = useState(0)
    const [selectedIds, setSelectedIds] = useState([])
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)

    const fetchItems = async () => {
        const { data, error } = await supabase
            .from(COLLECTION)
            .select('*')
            .order('order', { ascending: true })
        if (error) {
            console.error('Error fetching photos:', error)
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
            label: item.label || '',
            alt: item.alt || '',
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

    const handleBulkSelect = (e) => {
        const files = Array.from(e.target.files || [])
        setBulkFiles(files)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            let imageUrl = form.imageUrl

            if (imageFile) {
                setUploading(true)
                const fileExt = imageFile.name.split('.').pop()
                const fileName = `gallery/${Date.now()}.${fileExt}`
                
                const { error: uploadError } = await supabase.storage
                    .from(STORAGE_BUCKET)
                    .upload(fileName, imageFile)
                
                if (uploadError) throw uploadError

                const { data } = supabase.storage
                    .from(STORAGE_BUCKET)
                    .getPublicUrl(fileName)
                    
                imageUrl = data.publicUrl
                setUploading(false)
            }

            if (!imageUrl && !editingId) {
                alert('Please select an image')
                setSaving(false)
                return
            }

            const dataToSave = {
                label: form.label,
                alt: form.alt || form.label,
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
            setUploading(false)
        }
    }

    const handleBulkSave = async () => {
        if (bulkFiles.length === 0) return
        setSaving(true)
        setUploading(true)
        
        const remainingSpace = 20 - items.length
        const filesToUpload = bulkFiles.slice(0, remainingSpace)
        const uploadedData = []

        try {
            for (let i = 0; i < filesToUpload.length; i++) {
                setCurrentUploadIndex(i + 1)
                const file = filesToUpload[i]
                const fileExt = file.name.split('.').pop()
                const fileName = `gallery/${Date.now()}_${i}.${fileExt}`
                
                const { error: uploadError } = await supabase.storage
                    .from(STORAGE_BUCKET)
                    .upload(fileName, file)
                
                if (uploadError) continue // Skip if upload fails

                const { data } = supabase.storage
                    .from(STORAGE_BUCKET)
                    .getPublicUrl(fileName)
                
                uploadedData.push({
                    label: 'Untitled',
                    alt: 'Studio Gallery Image',
                    imageUrl: data.publicUrl,
                    order: items.length + i + 1
                })
            }

            if (uploadedData.length > 0) {
                const { error: insertError } = await supabase
                    .from(COLLECTION)
                    .insert(uploadedData)
                if (insertError) throw insertError
            }

            setBulkModalOpen(false)
            fetchItems()
        } catch (err) {
            alert('Bulk upload error: ' + err.message)
        } finally {
            setSaving(false)
            setUploading(false)
            setCurrentUploadIndex(0)
            setBulkFiles([])
        }
    }

    const handleDelete = async (id) => {
        try {
            const item = items.find(i => i.id === id)
            if (item?.imageUrl && item.imageUrl.includes('supabase.co')) {
                try {
                    const urlParts = item.imageUrl.split(`${STORAGE_BUCKET}/`)
                    if (urlParts.length === 2) {
                        const filePath = urlParts[1].split('?')[0]
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
        return <div className={styles.loadingState}><div className={styles.spinner} /> Loading gallery…</div>
    }

    const allSelected = items.length > 0 && selectedIds.length === items.length

    return (
        <div>
            <div className={styles.sectionHeader}>
                <div>
                    <h2>Photo Gallery</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.2rem' }}>
                        <p>{items.length} / 20 photo{items.length !== 1 ? 's' : ''}</p>
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
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {items.length < 20 && (
                        <>
                            <button className={styles.iconBtn} onClick={() => setBulkModalOpen(true)} title="Bulk Upload" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.6rem' }}>
                                <span className="material-symbols-outlined">upload_file</span>
                            </button>
                            <button className={styles.addBtn} onClick={openAdd}>
                                <span className="material-symbols-outlined">add</span>
                                Add Photo
                            </button>
                        </>
                    )}
                    {items.length >= 20 && (
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Maximum limit (20) reached</div>
                    )}
                </div>
            </div>

            {items.length === 0 ? (
                <div className={styles.emptyState}>
                    <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.2 }}>photo_library</span>
                    <p>No photos yet</p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className={styles.addBtn} onClick={openAdd}>Upload one photo</button>
                        <button className={styles.addBtn} style={{ background: 'rgba(255,255,255,0.1)' }} onClick={() => setBulkModalOpen(true)}>Bulk Upload</button>
                    </div>
                </div>
            ) : (
                <div className={styles.photoGrid}>
                    {items.map((item) => {
                        const isSelected = selectedIds.includes(item.id)
                        return (
                            <div key={item.id} className={`${styles.photoCard} ${isSelected ? styles.selected : ''}`}>
                                <div className={styles.photoThumb}>
                                    {/* Checkbox */}
                                    <div className={styles.checkboxContainer} style={{ top: '8px', left: '8px' }} onClick={() => toggleSelect(item.id)}>
                                        <div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
                                            {isSelected && <span className="material-symbols-outlined">check</span>}
                                        </div>
                                    </div>

                                    <img src={resolveImage(item.imageUrl)} alt={item.alt || item.label} />
                                    <div className={styles.photoOverlay}>
                                        <button className={styles.iconBtnLight} onClick={() => openEdit(item)} title="Edit">
                                            <span className="material-symbols-outlined">edit</span>
                                        </button>
                                        <button className={styles.iconBtnLight} onClick={() => setDeleteConfirm(item.id)} title="Delete">
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.photoLabel}>{item.label || 'Untitled'}</div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className={styles.bulkActionBar}>
                    <div className={styles.bulkInfo}>
                        {selectedIds.length} photo{selectedIds.length !== 1 ? 's' : ''} selected
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
                    title={editingId ? 'Edit Photo' : 'Add Photo'}
                    onClose={() => setModalOpen(false)}
                    footer={
                        <>
                            <button className={modalStyles.btnSecondary} onClick={() => setModalOpen(false)}>Cancel</button>
                            <button className={modalStyles.btnPrimary} onClick={handleSave} disabled={saving}>
                                {uploading ? 'Uploading…' : saving ? 'Saving…' : editingId ? 'Update' : 'Add'}
                            </button>
                        </>
                    }
                >
                    <div className={modalStyles.formGroup}>
                        <label>Photo</label>
                        <input type="file" accept="image/*" onChange={handleImageSelect} style={{ color: 'rgba(255,255,255,0.5)' }} />
                        {imagePreview && (
                            <img src={resolveImage(imagePreview)} alt="Preview" style={{ marginTop: '0.5rem', maxHeight: '160px', borderRadius: '8px', objectFit: 'cover', width: '100%' }} />
                        )}
                    </div>
                    <div className={modalStyles.formGroup}>
                        <label>Label</label>
                        <input value={form.label} onChange={(e) => set('label', e.target.value)} placeholder="e.g. Live Session" />
                    </div>
                    <div className={modalStyles.formGroup}>
                        <label>Alt Text (accessibility)</label>
                        <input value={form.alt} onChange={(e) => set('alt', e.target.value)} placeholder="Describe the image" />
                    </div>
                    <div className={modalStyles.formGroup}>
                        <label>Display Order</label>
                        <input type="number" value={form.order} onChange={(e) => set('order', e.target.value)} min={0} />
                    </div>
                </Modal>
            )}

            {/* Bulk Upload Modal */}
            {bulkModalOpen && (
                <Modal
                    title="Bulk Upload Photos"
                    onClose={() => !saving && setBulkModalOpen(false)}
                    footer={
                        <>
                            <button className={modalStyles.btnSecondary} onClick={() => setBulkModalOpen(false)} disabled={saving}>Cancel</button>
                            <button className={modalStyles.btnPrimary} onClick={handleBulkSave} disabled={saving || bulkFiles.length === 0}>
                                {uploading ? `Uploading ${currentUploadIndex} of ${bulkFiles.length}...` : 'Start Upload'}
                            </button>
                        </>
                    }
                >
                    <div className={modalStyles.formGroup}>
                        <label>Select Multiple Photos (Max {20 - items.length} remaining)</label>
                        <input type="file" accept="image/*" multiple onChange={handleBulkSelect} style={{ color: 'rgba(255,255,255,0.5)' }} disabled={saving} />
                        {bulkFiles.length > 0 && (
                            <div style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                                {bulkFiles.length} files selected.
                                {bulkFiles.length > (20 - items.length) && (
                                    <div style={{ color: '#ff4d4d', marginTop: '0.25rem' }}>
                                        Warning: Only the first {20 - items.length} files will be uploaded.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', lineHeight: '1.4' }}>
                        Note: Bulk uploaded photos will be titled "Untitled". You can edit labels individually after they are uploaded.
                    </p>
                </Modal>
            )}

            {/* Individual Delete Confirmation */}
            {deleteConfirm && (
                <Modal
                    title="Delete Photo"
                    onClose={() => setDeleteConfirm(null)}
                    footer={
                        <>
                            <button className={modalStyles.btnSecondary} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className={modalStyles.btnDanger} onClick={() => handleDelete(deleteConfirm)}>Delete</button>
                        </>
                    }
                >
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>This will permanently delete this photo from storage and database. Continue?</p>
                </Modal>
            )}

            {/* Bulk Delete Confirmation */}
            {bulkDeleteConfirm && (
                <Modal
                    title="Delete Selected Photos"
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
                        You are about to delete <strong>{selectedIds.length}</strong> photos and their associated files from storage. This action cannot be undone. Continue?
                    </p>
                </Modal>
            )}
        </div>
    )
}
