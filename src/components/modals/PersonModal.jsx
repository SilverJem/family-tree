import { useState, useEffect, useRef } from 'react'
import { useUIStore } from '../../store/useUIStore'
import { useAddPerson, useUpdatePerson, useUploadPhoto } from '../../hooks/usePeople'
import { Avatar } from '../ui/Avatar'

export function PersonModal({ treeId, personIdToEdit = null, people = [] }) {
  const closeModal = useUIStore(s => s.closeModal)
  const addToast = useUIStore(s => s.addToast)

  const addPerson = useAddPerson(treeId)
  const updatePerson = useUpdatePerson(treeId)
  const uploadPhoto = useUploadPhoto(treeId)

  const personToEdit = people.find(p => p.id === personIdToEdit)

  const [firstName, setFirstName] = useState(personToEdit?.first_name || '')
  const [lastName, setLastName] = useState(personToEdit?.last_name || '')
  const [birthName, setBirthName] = useState(personToEdit?.birth_name || '')
  const [gender, setGender] = useState(personToEdit?.gender || 'unknown')
  const [isLiving, setIsLiving] = useState(personToEdit ? personToEdit.is_living : true)
  const [birthDate, setBirthDate] = useState(personToEdit?.birth_date || '')
  const [deathDate, setDeathDate] = useState(personToEdit?.death_date || '')
  const [location, setLocation] = useState(personToEdit?.location || '')
  const [notes, setNotes] = useState(personToEdit?.notes || '')
  
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(personToEdit?.photo_url || null)
  
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  const isEdit = !!personToEdit

  // If edit mode and data changes, reset state (shouldn't happen often if modal is unmounted)
  useEffect(() => {
    if (personToEdit) {
      setFirstName(personToEdit.first_name)
      setLastName(personToEdit.last_name || '')
      setBirthName(personToEdit.birth_name || '')
      setGender(personToEdit.gender || 'unknown')
      setIsLiving(personToEdit.is_living)
      setBirthDate(personToEdit.birth_date || '')
      setDeathDate(personToEdit.death_date || '')
      setLocation(personToEdit.location || '')
      setNotes(personToEdit.notes || '')
      setPhotoPreview(personToEdit.photo_url || null)
    }
  }, [personToEdit])

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      addToast('Image must be less than 10MB', 'error')
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!firstName.trim()) return

    setLoading(true)
    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        birth_name: birthName.trim() || null,
        gender,
        is_living: isLiving,
        birth_date: birthDate || null,
        death_date: (!isLiving && deathDate) ? deathDate : null,
        location: location.trim() || null,
        notes: notes.trim() || null
      }

      let savedPersonId = null

      if (isEdit) {
        await updatePerson.mutateAsync({ id: personToEdit.id, ...payload })
        savedPersonId = personToEdit.id
        addToast('Person updated')
      } else {
        const newPerson = await addPerson.mutateAsync(payload)
        savedPersonId = newPerson.id
        addToast('Person added')
      }

      if (photoFile && savedPersonId) {
        await uploadPhoto.mutateAsync({ personId: savedPersonId, file: photoFile })
      }

      closeModal()
    } catch (err) {
      console.error(err)
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <h2>{isEdit ? 'Edit Person' : 'Add Person'}</h2>
        
        <form onSubmit={handleSubmit}>
          {/* Photo Uploader */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div 
              style={{
                width: 96, height: 96, borderRadius: '50%', background: 'var(--accent)',
                margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, cursor: 'pointer', overflow: 'hidden', border: '2px solid var(--border)'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {photoPreview ? (
                photoPreview.startsWith('blob:') ? (
                  <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Avatar person={{ photo_url: photoPreview }} size={96} showInitials={false} />
                )
              ) : (
                <span>📷</span>
              )}
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()}>
              {photoPreview ? 'Change Photo' : 'Upload Photo'}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
            />
          </div>

          <div className="field-group" style={{ display: 'flex', gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>First Name *</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required autoFocus />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Last Name</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="field-group" style={{ display: 'flex', gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Birth Name (Maiden Name)</label>
              <input type="text" value={birthName} onChange={e => setBirthName(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Gender</label>
              <div className="pills-group">
                <button type="button" className={`pill ${gender === 'female' ? 'active' : ''}`} onClick={() => setGender('female')}>Female</button>
                <button type="button" className={`pill ${gender === 'male' ? 'active' : ''}`} onClick={() => setGender('male')}>Male</button>
                <button type="button" className={`pill ${gender === 'non_binary' ? 'active' : ''}`} onClick={() => setGender('non_binary')}>Non-binary</button>
                <button type="button" className={`pill ${gender === 'unknown' ? 'active' : ''}`} onClick={() => setGender('unknown')}>Unknown</button>
              </div>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer', fontWeight: 600 }}>
            <input type="checkbox" checked={isLiving} onChange={e => setIsLiving(e.target.checked)} />
            This person is living
          </label>

          <div className="field-group" style={{ display: 'flex', gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Birth Date</label>
              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            </div>
            {!isLiving && (
              <div className="field" style={{ flex: 1 }}>
                <label>Death Date</label>
                <input type="date" value={deathDate} onChange={e => setDeathDate(e.target.value)} />
              </div>
            )}
          </div>

          <div className="field-group" style={{ display: 'flex', gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Location (City, Country)</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. London, UK" />
            </div>
          </div>

          <div className="field">
            <label>Notes & Biography</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}></textarea>
          </div>

          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Person'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
