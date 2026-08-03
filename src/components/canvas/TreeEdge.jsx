import { getSmoothStepPath } from '@xyflow/react'

export function TreeEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) {
  // We want the horizontal branch to happen exactly 40px below the source (the Union Node)
  // This guarantees that all siblings branching from the same union share the exact same horizontal trunk,
  // preventing the "combing" effect if siblings are pushed to different Y ranks by Dagre.
  const elbowY = sourceY + 40

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    // Custom routing points to force the elbow
    // We go down to elbowY, then horizontal to targetX, then down to targetY
  })

  // getSmoothStepPath does NOT support forcing the centerY directly in all versions, 
  // so we can mathematically build a straight custom step path with rounded corners if needed,
  // but let's see if getSmoothStepPath with custom parameters works. 
  // Actually, getSmoothStepPath takes `centerY`. Let's pass it!
  const [customEdgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    centerY: elbowY,
    borderRadius: 5,
  })

  return (
    <path
      id={id}
      style={style}
      className="react-flow__edge-path"
      d={customEdgePath}
      markerEnd={markerEnd}
    />
  )
}
