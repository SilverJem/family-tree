import { useCallback, useEffect, useRef } from 'react'
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
import { ArrowRotateLeft, ArrowRotateRight, Add, Minus, Maximize4, Scan } from 'iconsax-react'
import { PersonNode } from './PersonNode'
import { UnionNode } from './UnionNode'
import { TreeEdge } from './TreeEdge'
import { SpouseEdge } from './SpouseEdge'
import { useSaveNodePosition, useSaveNodePositionsBatch } from '../../hooks/usePeople'
import { REL_COLORS } from '../../hooks/useRelationships'
import { useUIStore } from '../../store/useUIStore'
import { getLayoutedElements } from '../../lib/layout'
import { determineKinship } from '../../lib/kinship'
import { useHistory } from '../../hooks/useHistory'

const nodeTypes = {
  person: PersonNode,
  union: UnionNode,
}

const edgeTypes = {
  tree: TreeEdge,
  spouseEdge: SpouseEdge,
}

export function TreeCanvas({ treeId, people = [], relationships = [], readOnly = false }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const savePosition = useSaveNodePosition(treeId)
  const savePositionsBatch = useSaveNodePositionsBatch(treeId)
  const openDetailPanel = useUIStore(s => s.openDetailPanel)
  const setSelectedPerson = useUIStore(s => s.setSelectedPerson)
  const selectedPersonId = useUIStore(s => s.selectedPersonId)
  
  const { takeSnapshot, undo, redo, canUndo, canRedo, clearHistory } = useHistory()
  const isInitialLoad = useRef(true)

  // Single-Click a node -> Select person (shows relationships on canvas)
  const onNodeClick = useCallback((event, node) => {
    setSelectedPerson(node.id)
  }, [setSelectedPerson])

  // Double-Click a node -> Open detail panel
  const onNodeDoubleClick = useCallback((event, node) => {
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

    // Keep history clean on fresh loads
    if (isInitialLoad.current) {
      clearHistory()
      isInitialLoad.current = false
    }

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

    const spouseRels = ['spouse', 'partner', 'divorced_spouse', 'ex_partner']
    const unionNodes = []
    const spouseEdgesMap = new Map() // parent1Id_parent2Id -> unionId

    relationships.forEach(rel => {
      if (spouseRels.includes(rel.type)) {
        const unionId = `union-${rel.id}`
        unionNodes.push({
          id: unionId,
          type: 'union',
          position: { x: 0, y: 0 },
          data: { rel },
          style: { zIndex: -1 }
        })
        spouseEdgesMap.set(`${rel.person_a_id}_${rel.person_b_id}`, unionId)
        spouseEdgesMap.set(`${rel.person_b_id}_${rel.person_a_id}`, unionId)
      }
    })

    const initialNodesFinal = [...initialNodes, ...unionNodes]

    const childToParents = {}
    relationships.forEach(rel => {
      if (rel.type.includes('parent_child')) {
        const childId = rel.person_b_id
        if (!childToParents[childId]) childToParents[childId] = []
        childToParents[childId].push(rel)
      }
    })

    const initialEdges = []

    // 1. Add all non parent-child edges (spouses, siblings, etc.)
    relationships.forEach(rel => {
      if (!rel.type.includes('parent_child')) {
        const st = getEdgeStyle(rel.type)
        const isHorizontal = spouseRels.includes(rel.type) || ['sibling', 'half_sibling'].includes(rel.type)
        initialEdges.push({
          id: rel.id,
          source: rel.person_a_id,
          target: rel.person_b_id,
          type: isHorizontal ? 'spouseEdge' : 'smoothstep',
          animated: false,
          style: { stroke: REL_COLORS[rel.type] || '#475569', strokeWidth: st.w, strokeDasharray: st.dash },
          data: { type: rel.type }
        })
      }
    })

    // 2. Add parent-child edges (condense to union if applicable)
    Object.keys(childToParents).forEach(childId => {
      const parentRels = childToParents[childId]
      if (parentRels.length === 2) {
        const p1 = parentRels[0].person_a_id
        const p2 = parentRels[1].person_a_id
        const unionId = spouseEdgesMap.get(`${p1}_${p2}`)
        if (unionId) {
          // They share a marriage union, draw single line from union
          initialEdges.push({
            id: `edge-u-${unionId}-c-${childId}`,
            source: unionId,
            target: childId,
            sourceHandle: 'bottom',
            targetHandle: 'top',
            type: 'tree',
            style: { stroke: REL_COLORS.parent_child, strokeWidth: 2.5 },
            data: { type: 'parent_child' }
          })
          return
        }
      }

      // Fallback: draw direct lines from each parent
      parentRels.forEach(rel => {
        const st = getEdgeStyle(rel.type)
        initialEdges.push({
          id: rel.id,
          source: rel.person_a_id,
          target: rel.person_b_id,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'tree',
          style: { stroke: REL_COLORS[rel.type] || '#475569', strokeWidth: st.w, strokeDasharray: st.dash },
          data: { type: rel.type }
        })
      })
    })

    // If any node is missing position (0,0), auto-layout
    const needsLayout = initialNodes.some(n => n.position.x === 0 && n.position.y === 0)
    
    if (needsLayout && initialNodes.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        initialNodesFinal,
        initialEdges
      )
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
      // Save all auto-layouted positions to Supabase in a batch so we don't recalculate next load
      const nodesToSave = layoutedNodes.filter(n => n.type !== 'union')
      savePositionsBatch.mutate(nodesToSave.map(n => ({ id: n.id, x: n.position.x, y: n.position.y })))
    } else {
      // Dynamically calculate union node positions if loaded from DB
      initialNodesFinal.forEach(node => {
        if (node.type === 'union') {
          const rel = node.data.rel
          const s1 = initialNodesFinal.find(n => n.id === rel.person_a_id)
          const s2 = initialNodesFinal.find(n => n.id === rel.person_b_id)
          if (s1 && s2) {
            node.position = {
              x: (s1.position.x + s2.position.x) / 2 + 110 - 4, // 110 is NODE_WIDTH/2
              y: (s1.position.y + s2.position.y) / 2 + 40 - 4   // 40 is NODE_HEIGHT/2
            }
          }
        }
      })
      setNodes(initialNodesFinal)
      setEdges(initialEdges)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people, relationships, setNodes, setEdges]) // intentionally omitting savePositionsBatch to prevent infinite loops

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

  const openModal = useUIStore(s => s.openModal)
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow()

  const handleAutoFocus = useCallback(() => {
    if (selectedPersonId) {
      fitView({ nodes: [{ id: selectedPersonId }], duration: 500, maxZoom: 1.2 })
    } else {
      fitView({ padding: 0.2, duration: 400 })
    }
  }, [selectedPersonId, fitView])

  // Capture snapshot BEFORE dragging starts
  const onNodeDragStart = useCallback((event, node) => {
    takeSnapshot(nodes)
  }, [nodes, takeSnapshot])

  // Handle dragging a node and saving when released
  const onNodeDragStop = useCallback((event, node) => {
    if (readOnly || node.type === 'union') return
    savePosition.mutate({ id: node.id, x: node.position.x, y: node.position.y })
  }, [readOnly, savePosition])

  const handleUndo = useCallback(() => {
    const previousState = undo(nodes)
    if (previousState) {
      setNodes(previousState)
      // Save reverted positions to DB
      const nodesToSave = previousState.filter(n => n.type !== 'union')
      savePositionsBatch.mutate(nodesToSave.map(n => ({ id: n.id, x: n.position.x, y: n.position.y })))
    }
  }, [nodes, undo, setNodes, savePositionsBatch])

  const handleRedo = useCallback(() => {
    const nextState = redo(nodes)
    if (nextState) {
      setNodes(nextState)
      // Save redone positions to DB
      const nodesToSave = nextState.filter(n => n.type !== 'union')
      savePositionsBatch.mutate(nodesToSave.map(n => ({ id: n.id, x: n.position.x, y: n.position.y })))
    }
  }, [nodes, redo, setNodes, savePositionsBatch])

  const autoArrange = useCallback(() => {
    if (nodes.length === 0) return
    takeSnapshot(nodes)
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges)
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
    const nodesToSave = layoutedNodes.filter(n => n.type !== 'union')
    savePositionsBatch.mutate(nodesToSave.map(n => ({ id: n.id, x: n.position.x, y: n.position.y })))
  }, [nodes, edges, setNodes, setEdges, savePositionsBatch, takeSnapshot])

  const onConnect = useCallback((params) => {
    if (params.source === params.target) return
    openModal('addRelationship', { defaultSourceId: params.source, defaultTargetId: params.target })
  }, [openModal])

  const onConnectEnd = useCallback((event, connectionState) => {
    if (!connectionState.isValid) {
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      let intent = null
      if (connectionState.fromHandle?.id === 'top') intent = 'parent'
      if (connectionState.fromHandle?.id === 'bottom') intent = 'child'
      if (connectionState.fromHandle?.id === 'left' || connectionState.fromHandle?.id === 'right') intent = 'spouse'
      
      openModal('addPerson', { 
        position, 
        pendingConnection: { sourceId: connectionState.fromNode.id, intent }
      })
    }
  }, [screenToFlowPosition, openModal])

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
      >
        <Background color="#ccc" gap={16} />
        <Controls />
        <MiniMap zoomable pannable nodeColor={(n) => '#0891b2'} />
        <Panel position="bottom-center" style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--card)', padding: '6px 12px', borderRadius: '14px',
            border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            backdropFilter: 'blur(10px)'
          }}>
            {/* Zoom & View Controls */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button 
                onClick={() => zoomIn({ duration: 300 })} 
                className="btn btn-secondary btn-sm"
                title="Zoom In (+)"
                style={{ padding: '6px 10px' }}
              >
                <Add size={16} color="currentColor" />
              </button>
              <button 
                onClick={() => zoomOut({ duration: 300 })} 
                className="btn btn-secondary btn-sm"
                title="Zoom Out (-)"
                style={{ padding: '6px 10px' }}
              >
                <Minus size={16} color="currentColor" />
              </button>
              <button 
                onClick={() => fitView({ padding: 0.2, duration: 400 })} 
                className="btn btn-secondary btn-sm"
                title="Fit in Frame"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 13 }}
              >
                <Maximize4 size={16} color="currentColor" /> Fit Frame
              </button>
              <button 
                onClick={handleAutoFocus} 
                className="btn btn-secondary btn-sm"
                title={selectedPersonId ? "Focus on Selected Person" : "Auto Focus Tree"}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 13 }}
              >
                <Scan size={16} color="currentColor" /> Auto Focus
              </button>
            </div>

            {!readOnly && <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />}

            {/* Layout Controls (Edit Mode Only) */}
            {!readOnly && (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button 
                  onClick={handleUndo} 
                  disabled={!canUndo}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Undo Layout Action"
                >
                  <ArrowRotateLeft size={16} color="currentColor" /> Undo
                </button>
                <button 
                  onClick={autoArrange} 
                  className="btn btn-primary btn-sm"
                  style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                >
                  ✨ Auto Arrange
                </button>
                <button 
                  onClick={handleRedo} 
                  disabled={!canRedo}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Redo Layout Action"
                >
                  <ArrowRotateRight size={16} color="currentColor" /> Redo
                </button>
              </div>
            )}
          </div>
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
