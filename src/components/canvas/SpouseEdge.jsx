import { getSmoothStepPath, BaseEdge, useInternalNode, Position } from '@xyflow/react'

export function SpouseEdge({
  id,
  source,
  target,
  style,
  markerEnd,
}) {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)

  if (!sourceNode || !targetNode) {
    return null
  }

  // Calculate Centers
  const sourceCenterX = sourceNode.internals.positionAbsolute.x + (sourceNode.measured?.width || 220) / 2
  const targetCenterX = targetNode.internals.positionAbsolute.x + (targetNode.measured?.width || 220) / 2
  
  // Decide handles based on relative X position
  // If source is visually to the left of target, connect source's Right to target's Left
  const isSourceLeft = sourceCenterX <= targetCenterX
  
  const sourcePosition = isSourceLeft ? Position.Right : Position.Left
  const targetPosition = isSourceLeft ? Position.Left : Position.Right
  
  // Compute the exact edge points where the handles are located
  const nodeWidth = sourceNode.measured?.width || 220
  const nodeHeight = sourceNode.measured?.height || 80
  const tNodeWidth = targetNode.measured?.width || 220
  const tNodeHeight = targetNode.measured?.height || 80

  const sX = sourceNode.internals.positionAbsolute.x + (isSourceLeft ? nodeWidth : 0)
  const sY = sourceNode.internals.positionAbsolute.y + nodeHeight / 2
  const tX = targetNode.internals.positionAbsolute.x + (isSourceLeft ? 0 : tNodeWidth)
  const tY = targetNode.internals.positionAbsolute.y + tNodeHeight / 2

  const [edgePath] = getSmoothStepPath({
    sourceX: sX,
    sourceY: sY,
    sourcePosition,
    targetX: tX,
    targetY: tY,
    targetPosition,
  })

  return (
    <BaseEdge path={edgePath} style={style} markerEnd={markerEnd} id={id} />
  )
}
