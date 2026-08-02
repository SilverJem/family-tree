import { useCallback, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { PersonNode } from './PersonNode'
import { useSaveNodePosition } from '../../hooks/usePeople'
import { REL_COLORS } from '../../hooks/useRelationships'
import { useUIStore } from '../../store/useUIStore'
import { getLayoutedElements } from '../../lib/layout'
import { determineKinship } from '../../lib/kinship'

const nodeTypes = {
  person: PersonNode,
}

export function TreeCanvas({ treeId, people = [], relationships = [] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const savePosition = useSaveNodePosition(treeId)
  const openDetailPanel = useUIStore(s => s.openDetailPanel)
  const setSelectedPerson = useUIStore(s => s.setSelectedPerson)
  const selectedPersonId = useUIStore(s => s.selectedPersonId)

  // Click a node -> Open detail panel
  const onNodeClick = useCallback((event, node) => {
    setSelectedPerson(node.id)
    openDetailPanel()
  }, [setSelectedPerson, openDetailPanel])

  // Sync Supabase data -> React Flow nodes/edges
  useEffect(() => {
    if (!people.length) {
      setNodes([])
      setEdges([])
      return
    }

    const initialNodes = people.map(p => ({
      id: p.id,
      type: 'person',
      position: { x: p.canvas_x || 0, y: p.canvas_y || 0 },
      data: { person: p },
    }))

    const getEdgeStyle = (type) => {
      switch (type) {
        case 'parent_child': return { dash: 'none', w: 2.5 }
        case 'step_parent_child': return { dash: '7 5', w: 2.5 }
        case 'adoptive_parent_child': return { dash: '2 4', w: 2.5 }
        case 'foster_parent_child': return { dash: '7 5', w: 2.5 }
        case 'spouse':
        case 'partner': return { dash: 'none', w: 3 }
        case 'divorced_spouse':
        case 'ex_partner': return { dash: '5 5', w: 2.5 }
        case 'godparent_godchild': return { dash: '1 5', w: 2.5 }
        case 'sibling':
        case 'half_sibling': return { dash: 'none', w: 2.5 }
        default: return { dash: 'none', w: 2.5 }
      }
    }

    const initialEdges = relationships.map(rel => {
      const st = getEdgeStyle(rel.type)
      const isHorizontal = ['spouse', 'partner', 'divorced_spouse', 'ex_partner', 'sibling', 'half_sibling'].includes(rel.type)
      return {
        id: rel.id,
        source: rel.person_a_id,
        target: rel.person_b_id,
        sourceHandle: isHorizontal ? 'right' : 'bottom',
        targetHandle: isHorizontal ? 'left' : 'top',
        type: 'smoothstep',
        animated: false,
        style: {
          stroke: REL_COLORS[rel.type] || '#475569',
          strokeWidth: st.w,
          strokeDasharray: st.dash
        },
      }
    })

    // If any node is missing position (0,0), auto-layout
    const needsLayout = initialNodes.some(n => n.position.x === 0 && n.position.y === 0)
    
    if (needsLayout && initialNodes.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        initialNodes,
        initialEdges
      )
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
      // Save all auto-layouted positions to Supabase so we don't recalculate next load
      layoutedNodes.forEach(node => {
        savePosition.mutate({ id: node.id, x: node.position.x, y: node.position.y })
      })
    } else {
      setNodes(initialNodes)
      setEdges(initialEdges)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people, relationships, setNodes, setEdges])

  // Dynamically update kinship badges when selection changes
  useEffect(() => {
    setNodes(nds => nds.map(node => {
      const kin = selectedPersonId ? determineKinship(people, relationships, selectedPersonId, node.id) : null
      if (node.data.kinship !== kin) {
        return { ...node, data: { ...node.data, kinship: kin } }
      }
      return node
    }))
  }, [selectedPersonId, people, relationships, setNodes])

  // Handle dragging a node and saving when released
  const onNodeDragStop = useCallback((event, node) => {
    savePosition.mutate({ id: node.id, x: node.position.x, y: node.position.y })
  }, [savePosition])

  const autoArrange = useCallback(() => {
    if (nodes.length === 0) return
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges)
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
    layoutedNodes.forEach(node => {
      savePosition.mutate({ id: node.id, x: node.position.x, y: node.position.y })
    })
  }, [nodes, edges, setNodes, setEdges, savePosition])

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
      >
        <Background color="#ccc" gap={16} />
        <Controls />
        <MiniMap zoomable pannable nodeColor={(n) => '#0891b2'} />
        <Panel position="bottom-center" style={{ marginBottom: 20 }}>
          <button className="btn btn-primary btn-sm" onClick={autoArrange} style={{ boxShadow: 'var(--shadow-clay-card)', borderRadius: 20, padding: '12px 24px', fontSize: 16 }}>
            ✨ Auto Arrange
          </button>
        </Panel>
        <Panel position="bottom-left" style={{ margin: 20, background: 'var(--card)', padding: 16, borderRadius: 12, backdropFilter: 'blur(10px)', border: '1px solid var(--border)', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ fontWeight: 800, marginBottom: 4, color: 'var(--foreground)' }}>Relationship Legend</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 2, background: 'var(--edge-blood)' }}></div> <span>Blood (Parent/Child)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 2, background: 'var(--edge-spouse)' }}></div> <span>Spouse / Partner</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 2, borderBottom: '2px dashed var(--edge-ex)' }}></div> <span>Ex / Divorced</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 2, borderBottom: '2px dashed var(--edge-step)' }}></div> <span>Step / Half-sibling</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 2, borderBottom: '2px dotted var(--edge-adopt)' }}></div> <span>Adopted</span>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
