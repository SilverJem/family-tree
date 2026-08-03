import Papa from 'papaparse'
import { parse as parseGedcom } from 'parse-gedcom'

export async function parseFamilyTreeFile(file, text) {
  const filename = file.name.toLowerCase()
  
  if (filename.endsWith('.json')) {
    return parseJson(text)
  } else if (filename.endsWith('.csv')) {
    return parseFamilyEchoCsv(text)
  } else if (filename.endsWith('.ged')) {
    return parseGedcomData(text)
  } else if (filename.endsWith('.html') || filename.endsWith('.htm')) {
    // Attempt to extract CSV from Family Echo HTML
    const match = text.match(/<INPUT TYPE="hidden" ID="csv" VALUE="([\s\S]*?)">/i)
    if (match && match[1]) {
      const csvContent = match[1].trim()
      return parseFamilyEchoCsv(csvContent)
    }
    // Alternatively, try GEDCOM
    const gedMatch = text.match(/<INPUT TYPE="hidden" ID="gedcom" VALUE="([\s\S]*?)">/i)
    if (gedMatch && gedMatch[1]) {
      return parseGedcomData(gedMatch[1].trim())
    }
    throw new Error('Could not find Family Echo data in HTML file.')
  } else {
    throw new Error('Unsupported file format. Please upload .csv, .ged, .json, or Family Echo .html')
  }
}

function parseJson(text) {
  const data = JSON.parse(text)
  // Assuming simple schema: { people: [], relationships: [] }
  if (data.people && data.relationships) {
    // Map IDs just in case they are not UUIDs
    const idMap = new Map()
    data.people.forEach(p => {
      idMap.set(p.id, crypto.randomUUID())
    })
    
    const people = data.people.map(p => ({
      ...p,
      id: idMap.get(p.id) || crypto.randomUUID(),
      canvas_x: 0,
      canvas_y: 0
    }))
    
    const relationships = data.relationships.map(r => ({
      ...r,
      id: crypto.randomUUID(),
      person_a_id: idMap.get(r.person_a_id),
      person_b_id: idMap.get(r.person_b_id)
    })).filter(r => r.person_a_id && r.person_b_id)

    return { people, relationships }
  }
  throw new Error('JSON file does not match expected format { people: [], relationships: [] }')
}

function parseFamilyEchoCsv(csvText) {
  const result = Papa.parse(csvText.trim(), { header: true, skipEmptyLines: true })
  const rows = result.data
  
  const idMap = new Map()
  rows.forEach(row => {
    if (row.ID) {
      idMap.set(row.ID, crypto.randomUUID())
    }
  })

  const people = []
  const relationships = []

  rows.forEach(row => {
    const origId = row.ID
    if (!origId) return
    const newId = idMap.get(origId)

    // Parse names
    const firstName = row['Given names now'] || row['Given names at birth'] || row['Full name'] || ''
    const lastName = row['Surname now'] || ''
    const birthName = row['Surname at birth'] || ''
    
    // Parse gender
    let gender = 'unknown'
    if (row.Gender === 'Male') gender = 'male'
    if (row.Gender === 'Female') gender = 'female'

    // Parse dates
    const bYear = row['Birth year']
    const bMonth = row['Birth month']
    const bDay = row['Birth day']
    let birthDate = null
    if (bYear) {
      birthDate = `${bYear}-${(bMonth || '1').padStart(2, '0')}-${(bDay || '1').padStart(2, '0')}`
    }

    const dYear = row['Death year']
    const dMonth = row['Death month']
    const dDay = row['Death day']
    let deathDate = null
    if (dYear) {
      deathDate = `${dYear}-${(dMonth || '1').padStart(2, '0')}-${(dDay || '1').padStart(2, '0')}`
    }

    people.push({
      id: newId,
      first_name: firstName,
      last_name: lastName,
      birth_name: birthName,
      gender: gender,
      is_living: row.Deceased !== 'Y',
      birth_date: birthDate,
      death_date: deathDate,
      notes: row['Bio notes'] || '',
      canvas_x: 0,
      canvas_y: 0
    })

    // Parents
    if (row['Mother ID']) {
      row['Mother ID'].split(' ').forEach(mId => {
        if (idMap.has(mId)) {
          relationships.push({ person_a_id: idMap.get(mId), person_b_id: newId, type: 'parent_child' })
        }
      })
    }
    if (row['Father ID']) {
      row['Father ID'].split(' ').forEach(fId => {
        if (idMap.has(fId)) {
          relationships.push({ person_a_id: idMap.get(fId), person_b_id: newId, type: 'parent_child' })
        }
      })
    }
    
    // Partners
    const addSpouse = (partnerStr, type) => {
      if (!partnerStr) return
      partnerStr.split(' ').forEach(pId => {
        if (idMap.has(pId)) {
          relationships.push({ person_a_id: newId, person_b_id: idMap.get(pId), type })
        }
      })
    }

    addSpouse(row['Partner ID'], 'spouse')
    addSpouse(row['Ex-partner IDs'], 'divorced_spouse')
    addSpouse(row['Extra partner IDs'], 'partner')
  })

  // Deduplicate relationships
  const uniqueRels = []
  const seenRels = new Set()
  relationships.forEach(rel => {
    let a = rel.person_a_id
    let b = rel.person_b_id
    if (rel.type.includes('spouse') || rel.type.includes('partner') || rel.type.includes('sibling')) {
      if (a > b) { a = rel.person_b_id; b = rel.person_a_id }
    }
    const key = `${a}-${b}-${rel.type}`
    if (!seenRels.has(key)) {
      seenRels.add(key)
      uniqueRels.push({
        id: crypto.randomUUID(),
        person_a_id: rel.person_a_id,
        person_b_id: rel.person_b_id,
        type: rel.type
      })
    }
  })

  return { people, relationships: uniqueRels }
}

function parseGedcomData(gedcomText) {
  const parsed = parseGedcom(gedcomText)
  const idMap = new Map()
  const people = []
  const relationships = []
  
  parsed.forEach(node => {
    if (node.tag === 'INDI') {
      const origId = node.pointer
      const newId = crypto.randomUUID()
      idMap.set(origId, newId)
      
      let firstName = ''
      let lastName = ''
      let gender = 'unknown'
      let birthDate = null
      let deathDate = null
      let isLiving = true

      node.tree.forEach(sub => {
        if (sub.tag === 'NAME') {
          const nameMatch = sub.value.match(/(.*?)\/(.*?)\//)
          if (nameMatch) {
            firstName = nameMatch[1].trim()
            lastName = nameMatch[2].trim()
          } else {
            firstName = sub.value
          }
        } else if (sub.tag === 'SEX') {
          if (sub.value === 'M') gender = 'male'
          if (sub.value === 'F') gender = 'female'
        } else if (sub.tag === 'BIRT') {
          sub.tree.forEach(bSub => {
            if (bSub.tag === 'DATE') birthDate = parseGedcomDate(bSub.value)
          })
        } else if (sub.tag === 'DEAT') {
          isLiving = false
          sub.tree.forEach(dSub => {
            if (dSub.tag === 'DATE') deathDate = parseGedcomDate(dSub.value)
          })
        }
      })

      people.push({
        id: newId,
        first_name: firstName,
        last_name: lastName,
        birth_name: lastName,
        gender,
        birth_date: birthDate,
        death_date: deathDate,
        is_living: isLiving,
        canvas_x: 0,
        canvas_y: 0
      })
    }
  })

  parsed.forEach(node => {
    if (node.tag === 'FAM') {
      let husb = null
      let wife = null
      const chil = []
      
      node.tree.forEach(sub => {
        if (sub.tag === 'HUSB') husb = sub.value
        if (sub.tag === 'WIFE') wife = sub.value
        if (sub.tag === 'CHIL') chil.push(sub.value)
      })

      if (husb && wife && idMap.has(husb) && idMap.has(wife)) {
        relationships.push({
          id: crypto.randomUUID(),
          person_a_id: idMap.get(husb),
          person_b_id: idMap.get(wife),
          type: 'spouse'
        })
      }

      chil.forEach(cId => {
        if (idMap.has(cId)) {
          if (husb && idMap.has(husb)) {
            relationships.push({
              id: crypto.randomUUID(),
              person_a_id: idMap.get(husb),
              person_b_id: idMap.get(cId),
              type: 'parent_child'
            })
          }
          if (wife && idMap.has(wife)) {
            relationships.push({
              id: crypto.randomUUID(),
              person_a_id: idMap.get(wife),
              person_b_id: idMap.get(cId),
              type: 'parent_child'
            })
          }
        }
      })
    }
  })

  return { people, relationships }
}

function parseGedcomDate(dateStr) {
  const parts = dateStr.trim().split(' ')
  if (parts.length === 3) {
    const months = { JAN:'01', FEB:'02', MAR:'03', APR:'04', MAY:'05', JUN:'06', JUL:'07', AUG:'08', SEP:'09', OCT:'10', NOV:'11', DEC:'12' }
    const day = parts[0].padStart(2, '0')
    const month = months[parts[1].toUpperCase()] || '01'
    const year = parts[2]
    return `${year}-${month}-${day}`
  } else if (parts.length === 1) {
    return `${parts[0]}-01-01`
  }
  return null
}
