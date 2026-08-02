// =========================================================================
// Family Tree Builder — KINSHIP / PERSPECTIVE ENGINE
// -------------------------------------------------------------------------
// Pure functions over {people, relationships} that answer: "who is Target
// to Root?" — e.g. root = John -> John's dad is "Dad"; root = John's cousin
// -> the same person is "Uncle".
// =========================================================================

const BLOOD = 'parent_child'
const PARENT_LIKE = ['parent_child', 'step_parent_child', 'adoptive_parent_child', 'foster_parent_child']
const SPOUSE_LIKE = ['spouse', 'partner', 'divorced_spouse', 'ex_partner']
const CURRENT_SPOUSE = ['spouse', 'partner']
const GOD = 'godparent_godchild'

class Graph {
  constructor(people, relationships) {
    this.byId = {}
    ;(people || []).forEach(p => { this.byId[p.id] = p })
    this.rels = relationships || []
  }

  person(id) { return this.byId[id] }
  
  edgesOf(id) {
    return this.rels.filter(r => r.person_a_id === id || r.person_b_id === id)
  }
  
  parentsOf(id, types = PARENT_LIKE) {
    return this.rels
      .filter(r => types.includes(r.type) && r.person_b_id === id)
      .map(r => ({ id: r.person_a_id, type: r.type }))
  }
  
  childrenOf(id, types = PARENT_LIKE) {
    return this.rels
      .filter(r => types.includes(r.type) && r.person_a_id === id)
      .map(r => ({ id: r.person_b_id, type: r.type }))
  }
  
  bloodParents(id) { return this.parentsOf(id, [BLOOD]).map(x => x.id) }
  bloodChildren(id) { return this.childrenOf(id, [BLOOD]).map(x => x.id) }
  
  spousesOf(id, currentOnly = false) {
    return this.rels.filter(r => {
      if (!SPOUSE_LIKE.includes(r.type)) return false
      if (r.person_a_id !== id && r.person_b_id !== id) return false
      if (currentOnly) return CURRENT_SPOUSE.includes(r.type)
      return true
    }).map(r => ({ id: r.person_a_id === id ? r.person_b_id : r.person_a_id, type: r.type }))
  }
  
  directEdge(aId, bId) {
    return this.rels.find(r => 
      (r.person_a_id === aId && r.person_b_id === bId) || 
      (r.person_a_id === bId && r.person_b_id === aId)
    ) || null
  }
  
  bloodAncestorDepths(id) {
    const depth = { [id]: 0 }
    const queue = [id]
    while (queue.length) {
      const cur = queue.shift()
      this.bloodParents(cur).forEach(pid => {
        if (depth[pid] === undefined || depth[pid] > depth[cur] + 1) {
          depth[pid] = depth[cur] + 1
          queue.push(pid)
        }
      })
    }
    return depth
  }
}

function greatPrefix(n) {
  if (n <= 0) return ''
  if (n === 1) return 'Great-'
  let s = 'Great-'
  for (let i = 1; i < n; i++) s += 'great-'
  return s
}

const ORDINALS = ['0th', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th']
function ordinal(n) { return ORDINALS[n] || (n + 'th') }

const REMOVED_WORDS = ['', 'once', 'twice', 'three times', 'four times', 'five times']
function removedWord(n) { return REMOVED_WORDS[n] || (n + ' times') }

function pick(p, female, male, neutral) { 
  if (p?.gender === 'female') return female
  if (p?.gender === 'male') return male
  return neutral
}

function directLabel(g, edge, rootId, targetId, target) {
  const t = edge.type
  const rootIsA = edge.person_a_id === rootId
  
  if (t === BLOOD || t === 'step_parent_child' || t === 'adoptive_parent_child' || t === 'foster_parent_child') {
    const rootIsParent = rootIsA
    if (rootIsParent) { // target is root's child
      if (t === BLOOD) return pick(target, 'Daughter', 'Son', 'Child')
      if (t === 'step_parent_child') return pick(target, 'Step-daughter', 'Step-son', 'Step-child')
      if (t === 'adoptive_parent_child') return pick(target, 'Adopted daughter', 'Adopted son', 'Adopted child')
      if (t === 'foster_parent_child') return pick(target, 'Foster daughter', 'Foster son', 'Foster child')
    } else { // target is root's parent
      if (t === BLOOD) return pick(target, 'Mother', 'Father', 'Parent')
      if (t === 'step_parent_child') return pick(target, 'Step-mother', 'Step-father', 'Step-parent')
      if (t === 'adoptive_parent_child') return pick(target, 'Adoptive mother', 'Adoptive father', 'Adoptive parent')
      if (t === 'foster_parent_child') return pick(target, 'Foster mother', 'Foster father', 'Foster parent')
    }
  }
  
  if (SPOUSE_LIKE.includes(t)) {
    const isEx = (t === 'divorced_spouse' || t === 'ex_partner')
    if (t === 'spouse') return isEx ? pick(target, 'Ex-wife', 'Ex-husband', 'Ex-spouse') : pick(target, 'Wife', 'Husband', 'Spouse')
    if (t === 'partner') return 'Partner'
    if (t === 'divorced_spouse') return pick(target, 'Ex-wife', 'Ex-husband', 'Ex-spouse')
    if (t === 'ex_partner') return 'Ex-partner'
  }
  
  if (t === GOD) {
    if (rootIsA) return pick(target, 'Goddaughter', 'Godson', 'Godchild')
    return pick(target, 'Godmother', 'Godfather', 'Godparent')
  }
  
  if (t === 'sibling' || t === 'half_sibling') {
    if (t === 'sibling') return pick(target, 'Sister', 'Brother', 'Sibling')
    return pick(target, 'Half-sister', 'Half-brother', 'Half-sibling')
  }
  
  return null
}

function bloodRelation(g, rootId, targetId) {
  const Ad = g.bloodAncestorDepths(rootId)
  const Bd = g.bloodAncestorDepths(targetId)
  let best = null
  let count = 0
  
  Object.keys(Ad).forEach(id => {
    if (Bd[id] === undefined) return
    const sum = Ad[id] + Bd[id]
    if (best === null || sum < best.sum) { 
      best = { id, sum, dA: Ad[id], dB: Bd[id] }
      count = 1
    } else if (sum === best.sum && Ad[id] === best.dA && Bd[id] === best.dB) { 
      count++ 
    }
  })
  
  if (!best) return null
  best.count = count
  return best
}

function bloodLabel(rel, target) {
  const { dA, dB, count } = rel
  if (dA === 0 && dB === 0) return 'Self'
  
  if (dA === 0) { // target descends from root
    if (dB === 1) return pick(target, 'Daughter', 'Son', 'Child')
    const lbl = pick(target, 'granddaughter', 'grandson', 'grandchild')
    return greatPrefix(dB - 2) + (dB - 2 <= 0 ? lbl.charAt(0).toUpperCase() + lbl.slice(1) : lbl)
  }
  
  if (dB === 0) { // root descends from target
    if (dA === 1) return pick(target, 'Mother', 'Father', 'Parent')
    const lbl = pick(target, 'grandmother', 'grandfather', 'grandparent')
    return greatPrefix(dA - 2) + (dA - 2 <= 0 ? lbl.charAt(0).toUpperCase() + lbl.slice(1) : lbl)
  }
  
  if (dA === 1 && dB === 1) return count >= 2 ? pick(target, 'Sister', 'Brother', 'Sibling') : pick(target, 'Half-sister', 'Half-brother', 'Half-sibling')
  
  if (dA === 1 && dB > 1) { // niece/nephew line
    const extra = dB - 2
    const word = pick(target, 'niece', 'nephew', 'nibling')
    return (greatPrefix(extra) || '') + (extra > 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
  }
  
  if (dB === 1 && dA > 1) { // aunt/uncle line
    const extra2 = dA - 2
    const word2 = pick(target, 'aunt', 'uncle', 'aunt/uncle')
    return (greatPrefix(extra2) || '') + (extra2 > 0 ? word2 : word2.charAt(0).toUpperCase() + word2.slice(1))
  }
  
  // cousins
  const degree = Math.min(dA, dB) - 1
  const removed = Math.abs(dA - dB)
  let label = ordinal(degree) + ' cousin'
  if (removed > 0) label += ' ' + removedWord(removed) + ' removed'
  return label
}

function stepSiblingCheck(g, rootId, targetId) {
  const rootParents = g.bloodParents(rootId)
  for (const pid of rootParents) {
    const sps = g.spousesOf(pid)
    for (const sp of sps) {
      if (g.bloodChildren(sp.id).includes(targetId)) return true
    }
  }
  return false
}

function inLawLabel(g, rootId, targetId, target) {
  // A) target is a blood relative of one of root's current spouses
  const rootSpouses = g.spousesOf(rootId, true)
  for (const sp of rootSpouses) {
    if (sp.id === targetId) continue
    const rel = bloodRelation(g, sp.id, targetId)
    if (rel && !(rel.dA === 0 && rel.dB === 0)) {
      if (rel.dA === 1 && rel.dB === 0) return pick(target, 'Mother-in-law', 'Father-in-law', 'Parent-in-law')
      if (rel.dA === 1 && rel.dB === 1) return pick(target, 'Sister-in-law', 'Brother-in-law', 'Sibling-in-law')
      if (rel.dA === 0 && rel.dB === 1) return pick(target, 'Daughter-in-law', 'Son-in-law', 'Child-in-law')
    }
  }
  
  // B) target's current spouse is root's blood relative (child, sibling, parent)
  const targetSpouses = g.spousesOf(targetId, true)
  for (const sp2 of targetSpouses) {
    if (sp2.id === rootId) continue
    const rel2 = bloodRelation(g, rootId, sp2.id)
    if (rel2 && !(rel2.dA === 0 && rel2.dB === 0)) {
      if (rel2.dA === 0 && rel2.dB === 1) return pick(target, 'Daughter-in-law', 'Son-in-law', 'Child-in-law')
      if (rel2.dA === 1 && rel2.dB === 1) return pick(target, 'Sister-in-law', 'Brother-in-law', 'Sibling-in-law')
      if (rel2.dA === 1 && rel2.dB === 0) return pick(target, 'Mother-in-law', 'Father-in-law', 'Parent-in-law')
    }
  }
  return null
}

export function determineKinship(people, relationships, rootId, targetId) {
  if (!rootId || !targetId) return null
  if (rootId === targetId) return 'Reference'
  
  const g = new Graph(people, relationships)
  const target = g.person(targetId)
  if (!target) return null

  // 1. Direct edge (spouse/parent/godparent/step-parent)
  const edge = g.directEdge(rootId, targetId)
  if (edge) {
    const lbl = directLabel(g, edge, rootId, targetId, target)
    if (lbl) return lbl
  }

  // 2. Blood relation (shared ancestor)
  const rel = bloodRelation(g, rootId, targetId)
  if (rel && rel.sum > 0) return bloodLabel(rel, target)

  // 3. Step-sibling
  if (stepSiblingCheck(g, rootId, targetId)) return pick(target, 'Step-sister', 'Step-brother', 'Step-sibling')

  // 4. In-laws
  const inLaw = inLawLabel(g, rootId, targetId, target)
  if (inLaw) return inLaw

  return null
}
