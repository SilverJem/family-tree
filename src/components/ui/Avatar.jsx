import { useState, useEffect } from 'react'
import { getPhotoUrl } from '../../hooks/usePeople'

export function Avatar({ person, size = 48, showInitials = true }) {
  const [signedUrl, setSignedUrl] = useState(null)
  
  useEffect(() => {
    let isMounted = true
    if (person?.photo_url) {
      getPhotoUrl(person.photo_url).then(url => {
        if (isMounted && url) setSignedUrl(url)
      })
    } else {
      setSignedUrl(null)
    }
    return () => { isMounted = false }
  }, [person?.photo_url])

  const initials = showInitials ? ((person?.first_name?.[0] || '') + (person?.last_name?.[0] || '')).toUpperCase() : ''

  return (
    <div style={{
      width: size, 
      height: size, 
      borderRadius: '50%', 
      background: 'var(--accent)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontSize: size * 0.4, 
      overflow: 'hidden',
      color: 'var(--text)'
    }}>
      {signedUrl ? (
        <img src={signedUrl} alt={person?.first_name || 'Avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}
