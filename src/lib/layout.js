import dagre from 'dagre'

const NODE_WIDTH = 220
const NODE_HEIGHT = 80

export function getLayoutedElements(nodes, edges, direction = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  
  // Configure dagre
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 100 })

  // Add nodes to dagre
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  })

  // Add edges to dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  // Calculate layout
  dagre.layout(dagreGraph)

  // Map the new positions back to the React Flow nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    
    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    const x = nodeWithPosition.x - NODE_WIDTH / 2
    const y = nodeWithPosition.y - NODE_HEIGHT / 2

    return {
      ...node,
      position: { x, y },
      data: {
        ...node.data,
        // Mark that it was auto-layouted so we might want to save it later
        autoLayouted: true
      }
    }
  })

  return { nodes: layoutedNodes, edges }
}
