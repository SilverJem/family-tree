import dagre from 'dagre'
import calcTree from 'relatives-tree'

const NODE_WIDTH = 220
const NODE_HEIGHT = 80
const SPOUSE_SPACING = 20

export function getLayoutedElements(nodes, edges, direction = 'TB') {
  // Primary Strategy: relatives-tree
  try {
    const personNodes = nodes.filter(n => n.type === 'person')
    if (personNodes.length > 0) {
      const relNodes = personNodes.map(n => {
        const p = n.data.person
        const id = n.id
        const gender = (p.gender === 'female' || p.gender === 'F') ? 'female' : 'male'

        const parents = []
        const children = []
        const spouses = []

        edges.forEach(e => {
          const type = e.data?.type || ''
          if (type.includes('parent_child')) {
            if (e.target === id) parents.push({ id: e.source, type: 'blood' })
            if (e.source === id) children.push({ id: e.target, type: 'blood' })
          } else if (['spouse', 'partner', 'divorced_spouse', 'ex_partner'].includes(type)) {
            if (e.source === id) spouses.push({ id: e.target, type: 'married' })
            if (e.target === id) spouses.push({ id: e.source, type: 'married' })
          }
        })

        return {
          id,
          gender,
          parents,
          children,
          siblings: [],
          spouses
        }
      })

      const rootId = relNodes[0].id
      const tree = calcTree(relNodes, { rootId })

      if (tree && tree.nodes && tree.nodes.length > 0) {
        const CELL_W = NODE_WIDTH + SPOUSE_SPACING + 40
        const CELL_H = NODE_HEIGHT + 120

        const posMap = new Map()
        tree.nodes.forEach(node => {
          posMap.set(node.id, {
            x: node.left * (CELL_W / 2),
            y: node.top * (CELL_H / 2)
          })
        })

        const layoutedNodes = nodes.map(node => {
          if (node.type === 'union') return node
          const pos = posMap.get(node.id)
          if (pos) {
            return {
              ...node,
              position: { x: pos.x, y: pos.y },
              data: { ...node.data, autoLayouted: true }
            }
          }
          return node
        })

        // Position Union nodes between spouses
        layoutedNodes.forEach(node => {
          if (node.type === 'union') {
            const rel = node.data.rel
            const s1 = layoutedNodes.find(n => n.id === rel.person_a_id)
            const s2 = layoutedNodes.find(n => n.id === rel.person_b_id)
            if (s1 && s2) {
              node.position = {
                x: (s1.position.x + s2.position.x) / 2 + (NODE_WIDTH / 2) - 4,
                y: s1.position.y + (NODE_HEIGHT / 2) - 4
              }
            }
          }
        })

        return { nodes: layoutedNodes, edges }
      }
    }
  } catch (err) {
    console.warn('relatives-tree layout fallback to Dagre:', err)
  }

  // Fallback Strategy: Dagre graph algorithm
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 120 })

  const spouseTypes = ['spouse', 'partner', 'divorced_spouse', 'ex_partner']
  const spouseEdges = edges.filter(e => spouseTypes.includes(e.data?.type))
  const clusterMap = new Map() // nodeId -> clusterId
  const clusters = {} // clusterId -> [nodeIds]

  let clusterCounter = 0
  spouseEdges.forEach(edge => {
    const s1 = edge.source
    const s2 = edge.target
    if (clusterMap.has(s1) && clusterMap.has(s2)) {
      const c1 = clusterMap.get(s1)
      const c2 = clusterMap.get(s2)
      if (c1 !== c2) {
        clusters[c1].push(...clusters[c2])
        clusters[c2].forEach(id => clusterMap.set(id, c1))
        delete clusters[c2]
      }
    } else if (clusterMap.has(s1)) {
      const c = clusterMap.get(s1)
      clusterMap.set(s2, c)
      clusters[c].push(s2)
    } else if (clusterMap.has(s2)) {
      const c = clusterMap.get(s2)
      clusterMap.set(s1, c)
      clusters[c].push(s1)
    } else {
      clusterCounter++
      const c = 'cluster_' + clusterCounter
      clusterMap.set(s1, c)
      clusterMap.set(s2, c)
      clusters[c] = [s1, s2]
    }
  })

  // Sort cluster members to ensure connected spouses are adjacent
  Object.keys(clusters).forEach(cId => {
    const members = clusters[cId]
    if (members.length <= 2) return
    
    const adj = {}
    members.forEach(m => adj[m] = [])
    
    spouseEdges.forEach(edge => {
      if (members.includes(edge.source) && members.includes(edge.target)) {
        adj[edge.source].push(edge.target)
        adj[edge.target].push(edge.source)
      }
    })
    
    let startNode = members.find(m => adj[m].length === 1) || members[0]
    
    const ordered = []
    const visited = new Set()
    
    let current = startNode
    while (current) {
      ordered.push(current)
      visited.add(current)
      current = adj[current].find(neighbor => !visited.has(neighbor))
    }
    
    members.forEach(m => {
      if (!visited.has(m)) ordered.push(m)
    })
    
    clusters[cId] = ordered
  })

  const addedNodesToDagre = new Set()

  nodes.forEach((node) => {
    if (node.type === 'union') return

    if (clusterMap.has(node.id)) {
      const c = clusterMap.get(node.id)
      if (!addedNodesToDagre.has(c)) {
        const numSpouses = clusters[c].length
        const totalWidth = numSpouses * NODE_WIDTH + (numSpouses - 1) * SPOUSE_SPACING
        dagreGraph.setNode(c, { width: totalWidth, height: NODE_HEIGHT })
        addedNodesToDagre.add(c)
      }
    } else {
      dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
    }
  })

  edges.forEach((edge) => {
    if (spouseTypes.includes(edge.data?.type)) return

    let sourceId = edge.source
    if (sourceId.startsWith('union-')) {
      const unionNode = nodes.find(n => n.id === sourceId)
      if (unionNode) {
        const rel = unionNode.data.rel
        sourceId = rel.person_a_id
      }
    }

    const source = clusterMap.has(sourceId) ? clusterMap.get(sourceId) : sourceId
    const target = clusterMap.has(edge.target) ? clusterMap.get(edge.target) : edge.target

    if (source !== target) {
      dagreGraph.setEdge(source, target)
    }
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    if (node.type === 'union') return node

    if (clusterMap.has(node.id)) {
      const c = clusterMap.get(node.id)
      const cNode = dagreGraph.node(c)
      const members = clusters[c]
      const index = members.indexOf(node.id)
      const numSpouses = members.length
      const totalWidth = numSpouses * NODE_WIDTH + (numSpouses - 1) * SPOUSE_SPACING
      
      const startX = cNode.x - totalWidth / 2
      const x = startX + index * (NODE_WIDTH + SPOUSE_SPACING)
      const y = cNode.y - NODE_HEIGHT / 2

      return {
        ...node,
        position: { x, y },
        data: { ...node.data, autoLayouted: true }
      }
    } else {
      const nodeWithPosition = dagreGraph.node(node.id)
      const x = nodeWithPosition.x - NODE_WIDTH / 2
      const y = nodeWithPosition.y - NODE_HEIGHT / 2

      return {
        ...node,
        position: { x, y },
        data: { ...node.data, autoLayouted: true }
      }
    }
  })

  layoutedNodes.forEach(node => {
    if (node.type === 'union') {
      const rel = node.data.rel
      const s1 = layoutedNodes.find(n => n.id === rel.person_a_id)
      const s2 = layoutedNodes.find(n => n.id === rel.person_b_id)
      if (s1 && s2) {
        node.position = {
          x: (s1.position.x + s2.position.x) / 2 + (NODE_WIDTH / 2) - 4,
          y: s1.position.y + (NODE_HEIGHT / 2) - 4
        }
      }
    }
  })

  return { nodes: layoutedNodes, edges }
}
