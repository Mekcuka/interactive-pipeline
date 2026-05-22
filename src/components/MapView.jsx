import React, { useState, useRef, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip, useMapEvents, useMap, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import { getTypeIconHtml } from './Icons'

const TYPE_PARAMS = {
  wellpad: { key: 'prodRate', label: 'Уровень добычи', unit: 'т.н/год' },
  upsv: { key: 'capacity', label: 'Производительность', unit: 'т.н/год' },
  kns: { key: 'capacity', label: 'Производительность', unit: 'т.ж/год' },
  cps: { key: 'capacity', label: 'Производительность', unit: 'т.н/год' }
}

function buildPopup(o) {
  const paramDef = TYPE_PARAMS[o.type]
  let html = `<b>${o.name}</b>`
  if (paramDef && o.params && o.params[paramDef.key]) {
    html += `<br>${paramDef.label}: ${o.params[paramDef.key]} ${paramDef.unit}`
  }
  return html
}

function makeIcon(type, selected, deleteMode) {
  const iconHtml = getTypeIconHtml(type)
  const html = deleteMode
    ? `<div class="custom-marker delete-mode">${iconHtml}</div>`
    : `<div class="custom-marker">${iconHtml}</div>`
  return L.divIcon({
    html,
    className: selected ? 'marker-selected' : '',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  })
}

function makePreviewIcon(type) {
  const iconHtml = getTypeIconHtml(type)
  return L.divIcon({
    html: `<div class="preview-marker">${iconHtml}</div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  })
}

function DraggableMarker({ object, selected, mode, addClick, addType, deleteMode, callbacksRef }) {
  const map = useMap()
  const [position, setPosition] = useState(object.center)
  const isDragging = useRef(false)
  const prevIdRef = useRef(object.id)

  if (object.center[0] !== position[0] || object.center[1] !== position[1]) {
    if (!isDragging.current) {
      setPosition(object.center)
    }
  }

  if (object.id !== prevIdRef.current) {
    prevIdRef.current = object.id
    setPosition(object.center)
  }

  const icon = useMemo(() => makeIcon(object.type, selected, deleteMode), [object.type, selected, deleteMode])

  const eventHandlers = useMemo(() => ({
    click: (e) => {
      e.originalEvent.stopPropagation()
      if (addClick && addType === 'pipe') {
        callbacksRef.current.onObjectClick(object)
      } else {
        callbacksRef.current.setSelObjId(object.id)
      }
    },
    dragstart: () => {
      isDragging.current = true
      if (map) map.dragging.disable()
    },
    drag: (e) => {
      const latLng = e.target.getLatLng()
      setPosition([latLng.lat, latLng.lng])
      callbacksRef.current.onMoveObject(object.id, latLng.lat, latLng.lng)
    },
    dragend: (e) => {
      isDragging.current = false
      if (map) map.dragging.enable()
      const latLng = e.target.getLatLng()
      setPosition([latLng.lat, latLng.lng])
      callbacksRef.current.onMoveObject(object.id, latLng.lat, latLng.lng)
      callbacksRef.current.onMoveObjectCommit(object.id, latLng.lat, latLng.lng)
    }
  }), [addClick, addType, object.id, object.type, selected, map])

  return (
    <Marker
      position={position}
      icon={icon}
      draggable={mode === 'edit'}
      eventHandlers={eventHandlers}
    >
      <Popup>
        <div dangerouslySetInnerHTML={{ __html: buildPopup(object) }} />
      </Popup>
    </Marker>
  )
}

const PipeLine = React.memo(function PipeLine({ 
  connection, 
  objects,
  callbacksRef, 
  highlightedPathIds,
  hoveredPipeId,
  setHoveredPipeId,
  enableHoverHighlight,
  enableEndpointDrag,
  mode
}) {
  const from = objects.find(o => o.id === connection.from)
  const to = objects.find(o => o.id === connection.to)
  if (!from || !to) return null

  const pts = connection.pts && connection.pts.length > 1 ? connection.pts : [from.center, to.center]
  const isHighlighted = highlightedPathIds.has(connection.id)
  const isHovered = hoveredPipeId === connection.id

  const eventHandlers = useMemo(() => ({
    click: (e) => {
      e.originalEvent.stopPropagation()
      callbacksRef.current.onPipeLineClick(connection, e.latlng)
    },
    mouseover: () => {
      if (enableHoverHighlight) {
        callbacksRef.current.setHoveredPipeId(connection.id)
      }
    },
    mouseout: () => {
      if (enableHoverHighlight) {
        callbacksRef.current.setHoveredPipeId(null)
      }
    }
  }), [connection.id, enableHoverHighlight])

  const baseWeight = isHighlighted ? 6 : 4
  const hoverWeight = isHovered ? 8 : baseWeight

  return (
    <Polyline
      key={connection.id}
      positions={pts}
      pathOptions={{
        color: isHighlighted ? '#059669' : (isHovered ? '#8b5cf6' : '#3b82f6'),
        weight: hoverWeight,
        opacity: isHighlighted ? 1 : (isHovered ? 1 : 0.85)
      }}
      eventHandlers={eventHandlers}
    >
      <Tooltip
        permanent
        direction="center"
        offset={[0, 0]}
        className="pipe-label"
      >
        {connection.name}
      </Tooltip>
    </Polyline>
  )
})

const WaypointMarker = React.memo(function WaypointMarker({ 
  connection, 
  wpIndex, 
  position, 
  callbacksRef,
  enableMultiplePointEdit,
  enableEndpointDrag,
  mode,
  isEndpoint
}) {
  const map = useMap()

  const eventHandlers = useMemo(() => ({
    dragstart: () => {
      if (map) map.dragging.disable()
    },
    dragend: (e) => {
      if (map) map.dragging.enable()
      const ll = e.target.getLatLng()
      callbacksRef.current.moveWaypoint(connection.id, wpIndex, ll.lat, ll.lng)
      callbacksRef.current.moveWaypointCommit(connection.id, wpIndex, ll.lat, ll.lng)
    },
    contextmenu: (e) => {
      e.originalEvent.stopPropagation()
      if (confirm('Удалить точку изгиба?')) {
        callbacksRef.current.removeWaypoint(connection.id, wpIndex)
      }
    }
  }), [connection.id, wpIndex, map])

  const isDraggable = mode === 'edit' && (enableMultiplePointEdit || isEndpoint)

  return (
    <Marker
      position={position}
      draggable={isDraggable}
      eventHandlers={eventHandlers}
      zIndexOffset={1000}
      icon={L.divIcon({
        html: isEndpoint 
          ? '<div style="width:16px;height:16px;background:#10b981;border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);cursor:move;"></div>'
          : '<div style="width:12px;height:12px;background:#2563eb;border:2px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3);cursor:move;"></div>',
        className: '',
        iconSize: isEndpoint ? [16, 16] : [12, 12],
        iconAnchor: isEndpoint ? [8, 8] : [6, 6]
      })}
    >
      <Tooltip permanent direction="top" offset={[0, -10]} className="pipe-label">
        {isEndpoint ? (wpIndex === 0 ? 'Начало' : 'Конец') : `Точка ${wpIndex + 1}`}
      </Tooltip>
    </Marker>
  )
})

function MapEvents({ callbacksRef }) {
  useMapEvents({
    click: (e) => callbacksRef.current.onMapClick(e.latlng.lat, e.latlng.lng),
    dblclick: (e) => {
      e.originalEvent.stopPropagation()
      callbacksRef.current.onMapDblClick(e.latlng.lat, e.latlng.lng)
    },
    mousemove: (e) => callbacksRef.current.onMouseMove(e)
  })
  return null
}

function MapView({
  objects,
  connections,
  selObjId,
  setSelObjId,
  mode,
  addType,
  addClick,
  pipeFrom,
  pipeWaypoints,
  showLayers,
  deleteMode,
  onMapClick,
  onMapDblClick,
  onObjectClick,
  onPipeLineClick,
  onMoveObject,
  onMoveObjectCommit,
  moveWaypoint,
  moveWaypointCommit,
  removeWaypoint,
  highlightedPathIds = new Set(),
  enablePreview = true,
  enableSnap = true,
  enableEndpointDrag = true,
  enableMultiplePointEdit = true,
  enableHoverHighlight = true
}) {
  const [mousePos, setMousePos] = useState(null)
  const [hoveredPipeId, setHoveredPipeId] = useState(null)
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null)
  const [snappedTarget, setSnappedTarget] = useState(null)
  const rafRef = useRef(null)

  const callbacksRef = useRef({
    onMapClick,
    onMapDblClick,
    onObjectClick,
    onPipeLineClick,
    onMoveObject,
    onMoveObjectCommit,
    setSelObjId,
    moveWaypoint,
    moveWaypointCommit,
    removeWaypoint,
    onMouseMove: null,
    setSnappedTarget: null,
    setHoveredPipeId: null,
    setHoveredPointIndex: null
  })

  callbacksRef.current.onMapClick = onMapClick
  callbacksRef.current.onMapDblClick = onMapDblClick
  callbacksRef.current.onObjectClick = onObjectClick
  callbacksRef.current.onPipeLineClick = onPipeLineClick
  callbacksRef.current.onMoveObject = onMoveObject
  callbacksRef.current.onMoveObjectCommit = onMoveObjectCommit
  callbacksRef.current.setSelObjId = setSelObjId
  callbacksRef.current.moveWaypoint = moveWaypoint
  callbacksRef.current.moveWaypointCommit = moveWaypointCommit
  callbacksRef.current.removeWaypoint = removeWaypoint

  // Магнитная привязка (snap-to-target)
  const findSnapTarget = useCallback((lat, lng, snapRadius = 0.0002) => {
    if (!enableSnap) return null
    
    const snapRadiusDeg = snapRadius
    let bestTarget = null
    let bestDist = snapRadiusDeg * snapRadiusDeg

    // Проверка объектов
    for (const o of objects) {
      const d = (o.center[0] - lat) ** 2 + (o.center[1] - lng) ** 2
      if (d < bestDist) {
        bestDist = d
        bestTarget = { type: 'object', id: o.id, center: o.center }
      }
    }

    // Проверка точек труб (в режиме редактирования)
    if (mode === 'edit') {
      for (const c of connections) {
        if (!c.pts || c.pts.length < 2) continue
        for (let i = 0; i < c.pts.length; i++) {
          const p = c.pts[i]
          const d = (p[0] - lat) ** 2 + (p[1] - lng) ** 2
          if (d < bestDist) {
            bestDist = d
            bestTarget = { type: 'pipePoint', pipeId: c.id, index: i, center: p }
          }
        }
      }
    }

    return bestTarget
  }, [objects, connections, mode, enableSnap])

  const handleMouseMove = useCallback((e) => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      const lat = e.latlng.lat
      const lng = e.latlng.lng
      
      // Магнитная привязка
      if (enableSnap && (addClick || (mode === 'edit' && hoveredPipeId))) {
        const target = findSnapTarget(lat, lng)
        setSnappedTarget(target)
      } else {
        setSnappedTarget(null)
      }
      
      setMousePos(target ? target.center : [lat, lng])
      rafRef.current = null
    })
  }, [addClick, mode, hoveredPipeId, enableSnap, findSnapTarget])

  callbacksRef.current.onMouseMove = handleMouseMove
  callbacksRef.current.setSnappedTarget = setSnappedTarget

  const markers = useMemo(() => {
    return objects.map((o) => (
      <DraggableMarker
        key={o.id}
        object={o}
        selected={selObjId === o.id}
        mode={mode}
        addClick={addClick}
        addType={addType}
        deleteMode={deleteMode}
        callbacksRef={callbacksRef}
      />
    ))
  }, [objects, selObjId, mode, addClick, addType, deleteMode])

  const pipes = useMemo(() => {
    return connections.map((c) => (
      <PipeLine
        key={c.id}
        connection={c}
        objects={objects}
        callbacksRef={callbacksRef}
        highlightedPathIds={highlightedPathIds}
        hoveredPipeId={hoveredPipeId}
        setHoveredPipeId={setHoveredPipeId}
        enableHoverHighlight={enableHoverHighlight}
        enableEndpointDrag={enableEndpointDrag}
        mode={mode}
      />
    ))
  }, [connections, objects, highlightedPathIds, hoveredPipeId, enableHoverHighlight, enableEndpointDrag, mode])

  const waypoints = useMemo(() => {
    if (mode !== 'edit') return null
    return connections.flatMap((c) => {
      if (!c.pts || c.pts.length <= 2) return []
      // Добавляем точки концов трубы (начало и конец)
      const endpoints = enableEndpointDrag ? [
        <WaypointMarker
          key={`ep-start-${c.id}`}
          connection={c}
          wpIndex={0}
          position={c.pts[0]}
          callbacksRef={callbacksRef}
          enableMultiplePointEdit={enableMultiplePointEdit}
          enableEndpointDrag={enableEndpointDrag}
          mode={mode}
          isEndpoint={true}
        />,
        <WaypointMarker
          key={`ep-end-${c.id}`}
          connection={c}
          wpIndex={c.pts.length - 1}
          position={c.pts[c.pts.length - 1]}
          callbacksRef={callbacksRef}
          enableMultiplePointEdit={enableMultiplePointEdit}
          enableEndpointDrag={enableEndpointDrag}
          mode={mode}
          isEndpoint={true}
        />
      ] : []
      
      return [
        ...endpoints,
        ...c.pts.slice(1, -1).map((wp, i) => (
          <WaypointMarker
            key={`wp-${c.id}-${i}`}
            connection={c}
            wpIndex={i + 1}
            position={wp}
            callbacksRef={callbacksRef}
            enableMultiplePointEdit={enableMultiplePointEdit}
            enableEndpointDrag={enableEndpointDrag}
            mode={mode}
            isEndpoint={false}
          />
        ))
      ]
    })
  }, [mode, connections, enableMultiplePointEdit, enableEndpointDrag])

  const previewPts = pipeFrom && mousePos
    ? [pipeFrom.center, ...pipeWaypoints, mousePos]
    : []

  return (
    <div className="map-wrap">
      <MapContainer
        center={[55.7558, 37.6173]}
        zoom={15}
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        {showLayers.map && (
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}
        <MapEvents callbacksRef={callbacksRef} />

        {showLayers.obj && markers}
        {showLayers.pipe && pipes}
        {waypoints}

        {addClick && addType !== 'pipe' && mousePos && !pipeFrom && (
          <Marker
            position={mousePos}
            icon={makePreviewIcon(addType)}
            interactive={false}
            zIndexOffset={9999}
          />
        )}

        {addClick && addType === 'pipe' && pipeFrom && mousePos && (
          <>
            <Polyline
              positions={previewPts}
              pathOptions={{ 
                color: snappedTarget ? '#10b981' : '#3b82f6', 
                weight: 4, 
                opacity: 0.7, 
                dashArray: '8,6' 
              }}
              interactive={false}
            />
            <Marker
              position={mousePos}
              icon={L.divIcon({
                html: snappedTarget 
                  ? '<div style="width:24px;height:24px;background:#10b981;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>'
                  : '<div style="width:20px;height:20px;background:#3b82f6;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>',
                className: '',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })}
              interactive={false}
              zIndexOffset={9998}
            />
            {snappedTarget && enablePreview && (
              <Tooltip 
                permanent 
                direction="bottom" 
                offset={[0, 20]} 
                className="snap-tooltip"
              >
                <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                  {snappedTarget.type === 'object' 
                    ? `Привязка: ${objects.find(o => o.id === snappedTarget.id)?.name || 'Объект'}`
                    : `Привязка: Точка трубы`}
                </span>
              </Tooltip>
            )}
          </>
        )}
      </MapContainer>

      <div className={`fab-mode ${deleteMode ? 'delete' : addClick ? 'place' : mode}`}>
        {deleteMode
          ? '🗑️ Удаление объектов'
          : addClick
          ? `📍 Размещение: ${TYPE_NAMES[addType] || addType}`
          : mode === 'view'
          ? '👁️ Просмотр'
          : '✏️ Редактирование'}
      </div>
      {enablePreview && hoveredPipeId && (
        <div style={{
          position: 'absolute',
          bottom: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.95)',
          padding: '0.4rem 0.8rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontSize: '0.75rem',
          zIndex: 1000,
          border: '1px solid #e2e8f0'
        }}>
          🔧 {connections.find(c => c.id === hoveredPipeId)?.name || 'Трубопровод'}
        </div>
      )}
    </div>
  )
}

const TYPE_NAMES = {
  wellpad: 'Куст скважин',
  upsv: 'УПСВ',
  kns: 'КНС',
  cps: 'ЦПС',
  node: 'Узел',
  pipe: 'Трубопровод'
}

export default MapView
