import { supabase } from './supabase'

export async function createSeedFamily(userId) {
  // 1. Create a demo tree
  const { data: tree, error: treeErr } = await supabase
    .from('trees')
    .insert({ owner_id: userId, name: 'The Harper Family (demo)', visibility: 'private' })
    .select()
    .single()
    
  if (treeErr) throw treeErr

  const tId = tree.id

  // Helper to generate people data
  const P = (given, surname, g, by, dy, x, y, isLiving) => ({
    tree_id: tId,
    first_name: given,
    last_name: surname,
    gender: g,
    birth_date: by ? `${by}-06-15` : null,
    death_date: dy ? `${dy}-03-01` : null,
    is_living: isLiving,
    canvas_x: x,
    canvas_y: y,
    location: 'London, UK'
  })

  const peopleData = [
    // Gen 0
    P('Arthur', 'Harper', 'male', 1938, 2011, -160, -420, false),
    P('June', 'Harper', 'female', 1941, null, 160, -420, true),
    // Gen 1
    P('David', 'Harper', 'male', 1963, null, -440, -230, true),
    P('Susan', 'Whitfield', 'female', 1965, null, -160, -230, true),
    P('Claire', 'Harper', 'female', 1968, null, 300, -230, true),
    P('Marcus', 'Bell', 'male', 1966, null, 580, -230, true),
    P('Elena', 'Harper', 'female', 1970, null, -720, -230, true),
    // Gen 2
    P('Tom', 'Harper', 'male', 1990, null, -440, -30, true),
    P('Ann', 'Harper', 'female', 1993, null, -160, -30, true),
    P('Leo', 'Harper', 'male', 2008, null, -720, -30, true),
    P('Maya', 'Bell', 'female', 1996, null, 440, -30, true),
    P('Jamie', 'Bell', 'non_binary', 2010, null, 720, -30, true),
    P('Priya', 'Harper', 'female', 1991, null, -960, -30, true),
    // Gen 3
    P('Sam', 'Harper', 'male', 2020, null, -700, 170, true),
  ]

  const { data: people, error: pErr } = await supabase
    .from('people')
    .insert(peopleData)
    .select()

  if (pErr) throw pErr

  const getP = (name) => people.find(p => p.first_name === name).id

  // 3. Insert relationships
  const relsData = [
    { tree_id: tId, person_a_id: getP('Arthur'), person_b_id: getP('June'), type: 'spouse' },
    
    { tree_id: tId, person_a_id: getP('Arthur'), person_b_id: getP('David'), type: 'parent_child' },
    { tree_id: tId, person_a_id: getP('June'), person_b_id: getP('David'), type: 'parent_child' },
    { tree_id: tId, person_a_id: getP('Arthur'), person_b_id: getP('Claire'), type: 'parent_child' },
    { tree_id: tId, person_a_id: getP('June'), person_b_id: getP('Claire'), type: 'parent_child' },
    
    { tree_id: tId, person_a_id: getP('David'), person_b_id: getP('Susan'), type: 'divorced_spouse' },
    { tree_id: tId, person_a_id: getP('David'), person_b_id: getP('Elena'), type: 'spouse' },
    { tree_id: tId, person_a_id: getP('Claire'), person_b_id: getP('Marcus'), type: 'spouse' },
    
    { tree_id: tId, person_a_id: getP('David'), person_b_id: getP('Tom'), type: 'parent_child' },
    { tree_id: tId, person_a_id: getP('Susan'), person_b_id: getP('Tom'), type: 'parent_child' },
    { tree_id: tId, person_a_id: getP('David'), person_b_id: getP('Ann'), type: 'parent_child' },
    { tree_id: tId, person_a_id: getP('Susan'), person_b_id: getP('Ann'), type: 'parent_child' },
    { tree_id: tId, person_a_id: getP('David'), person_b_id: getP('Leo'), type: 'parent_child' },
    { tree_id: tId, person_a_id: getP('Elena'), person_b_id: getP('Leo'), type: 'parent_child' },
    
    { tree_id: tId, person_a_id: getP('Elena'), person_b_id: getP('Tom'), type: 'step_parent_child' },
    { tree_id: tId, person_a_id: getP('Elena'), person_b_id: getP('Ann'), type: 'step_parent_child' },
    
    { tree_id: tId, person_a_id: getP('Claire'), person_b_id: getP('Maya'), type: 'parent_child' },
    { tree_id: tId, person_a_id: getP('Marcus'), person_b_id: getP('Maya'), type: 'parent_child' },
    { tree_id: tId, person_a_id: getP('Claire'), person_b_id: getP('Jamie'), type: 'foster_parent_child' },
    { tree_id: tId, person_a_id: getP('Marcus'), person_b_id: getP('Jamie'), type: 'foster_parent_child' },
    { tree_id: tId, person_a_id: getP('June'), person_b_id: getP('Maya'), type: 'godparent_godchild' },
    
    { tree_id: tId, person_a_id: getP('Tom'), person_b_id: getP('Priya'), type: 'spouse' },
    { tree_id: tId, person_a_id: getP('Tom'), person_b_id: getP('Sam'), type: 'parent_child' },
    { tree_id: tId, person_a_id: getP('Priya'), person_b_id: getP('Sam'), type: 'parent_child' }
  ]

  const { error: rErr } = await supabase.from('relationships').insert(relsData)
  if (rErr) throw rErr

  return tree
}
