import dagre from 'dagre'

const NODE_WIDTH = 220
const NODE_HEIGHT = 80
const SPOUSE_SPACING = 50

export function getLayoutedElements(nodes, edges, direction = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  
  // Configure dagre
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 100 })

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
        // Merge clusters
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

  const addedNodesToDagre = new Set()

  nodes.forEach((node) => {
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

  // Add edges to dagre, ignoring spouse edges
  edges.forEach((edge) => {
    if (spouseTypes.includes(edge.data?.type)) return // Skip drawing spouse edges in Dagre

    const source = clusterMap.has(edge.source) ? clusterMap.get(edge.source) : edge.source
    const target = clusterMap.has(edge.target) ? clusterMap.get(edge.target) : edge.target

    if (source !== target) {
      dagreGraph.setEdge(source, target)
    }
  })

  // Calculate layout
  dagre.layout(dagreGraph)

  // Map the new positions back to the React Flow nodes
  const layoutedNodes = nodes.map((node) => {
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

  return { nodes: layoutedNodes, edges }
}
