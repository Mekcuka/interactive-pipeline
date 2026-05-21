import React, { useState, useRef, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip, useMapEvents, useMap, CircleMarker } from 'react-leaflet'
import L from 'leaflet'

const TYPE_ICONS = {
  wellpad: '🛢️',
  upsv: '⚙️',
  kns: '💧',
  cps: '🏭',
  node: '🔵'
}

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

function makeIcon(iconChar, selected) {
  return L.divIcon({
    html: `<div class="custom-marker">${iconChar}</div>`,
    className: selected ? 'marker-selected' : '',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  })
}

function makePreviewIcon(iconChar) {
  return L.divIcon({
    html: `<div class="preview-marker">${iconChar}</div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  })
}

function DraggableMarker({ object, selected, mode, addClick, addType, callbacksRef }) {
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

  const icon = useMemo(() => makeIcon(TYPE_ICONS[object.type] || '📍', selected), [object.type, selected])

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

const PipeLine = React.memo(function PipeLine({ connection, objects, callbacksRef }) {
  const from = objects.find(o => o.id === connection.from)
  const to = objects.find(o => o.id === connection.to)
  if (!from || !to) return null

  const pts = connection.pts && connection.pts.length > 1 ? connection.pts : [from.center, to.center]

  const eventHandlers = useMemo(() => ({
    click: (e) => {
      e.originalEvent.stopPropagation()
      callbacksRef.current.onPipeLineClick(connection, e.latlng)
    }
  }), [connection.id])

  return (
    <Polyline
      key={connection.id}
      positions={pts}
      pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.85 }}
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

const WaypointMarker = React.memo(function WaypointMarker({ connection, wpIndex, position, callbacksRef }) {
  const map = useMap()

  const eventHandlers = useMemo(() => ({
    dragstart: () => {
      if (map) map.dragging.disable()
    },
    dragend: (e) => {
      if (map) map.dragging.enable()
      const ll = e.target.getLatLng()
      callbacksRef.current.moveWaypoint(connection.id, wpIndex, ll.lat, ll.lng)
    },
    contextmenu: (e) => {
      e.originalEvent.stopPropagation()
      if (confirm('Удалить точку изгиба?')) {
        callbacksRef.current.removeWaypoint(connection.id, wpIndex)
      }
    }
  }), [connection.id, wpIndex, map])

  return (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={eventHandlers}
      zIndexOffset={1000}
      icon={L.divIcon({
        html: '<div style="width:12px;height:12px;background:#2563eb;border:2px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3);cursor:move;"></div>',
        className: '',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      })}
    >
      <Tooltip permanent direction="top" offset={[0, -10]} className="pipe-label">
        Точка {wpIndex + 1}
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
  onMapClick,
  onMapDblClick,
  onObjectClick,
  onPipeLineClick,
  onMoveObject,
  moveWaypoint,
  removeWaypoint
}) {
  const [mousePos, setMousePos] = useState(null)
  const rafRef = useRef(null)

  const callbacksRef = useRef({
    onMapClick,
    onMapDblClick,
    onObjectClick,
    onPipeLineClick,
    onMoveObject,
    setSelObjId,
    moveWaypoint,
    removeWaypoint,
    onMouseMove: null
  })

  callbacksRef.current.onMapClick = onMapClick
  callbacksRef.current.onMapDblClick = onMapDblClick
  callbacksRef.current.onObjectClick = onObjectClick
  callbacksRef.current.onPipeLineClick = onPipeLineClick
  callbacksRef.current.onMoveObject = onMoveObject
  callbacksRef.current.setSelObjId = setSelObjId
  callbacksRef.current.moveWaypoint = moveWaypoint
  callbacksRef.current.removeWaypoint = removeWaypoint

  const handleMouseMove = useCallback((e) => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      setMousePos([e.latlng.lat, e.latlng.lng])
      rafRef.current = null
    })
  }, [])

  callbacksRef.current.onMouseMove = handleMouseMove

  const markers = useMemo(() => {
    return objects.map((o) => (
      <DraggableMarker
        key={o.id}
        object={o}
        selected={selObjId === o.id}
        mode={mode}
        addClick={addClick}
        addType={addType}
        callbacksRef={callbacksRef}
      />
    ))
  }, [objects, selObjId, mode, addClick, addType])

  const pipes = useMemo(() => {
    return connections.map((c) => (
      <PipeLine
        key={c.id}
        connection={c}
        objects={objects}
        callbacksRef={callbacksRef}
      />
    ))
  }, [connections, objects])

  const waypoints = useMemo(() => {
    if (mode !== 'edit') return null
    return connections.flatMap((c) => {
      if (!c.pts || c.pts.length <= 2) return []
      return c.pts.slice(1, -1).map((wp, i) => (
        <WaypointMarker
          key={`wp-${c.id}-${i}`}
          connection={c}
          wpIndex={i + 1}
          position={wp}
          callbacksRef={callbacksRef}
        />
      ))
    })
  }, [mode, connections])

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
            icon={makePreviewIcon(TYPE_ICONS[addType] || '📍')}
            interactive={false}
            zIndexOffset={9999}
          />
        )}

        {addClick && addType === 'pipe' && pipeFrom && mousePos && (
          <>
            <Polyline
              positions={previewPts}
              pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.6, dashArray: '8,6' }}
              interactive={false}
            />
            <Marker
              position={mousePos}
              icon={L.divIcon({
                html: '<div class="preview-pipe-end">🔧</div>',
                className: '',
                iconSize: [28, 28],
                iconAnchor: [14, 14]
              })}
              interactive={false}
              zIndexOffset={9998}
            />
          </>
        )}
      </MapContainer>

      <div className={`fab-mode ${addClick ? 'place' : mode}`}>
        {addClick
          ? `📍 Размещение: ${TYPE_NAMES[addType] || addType}`
          : mode === 'view'
          ? '👁️ Просмотр'
          : '✏️ Редактирование'}
      </div>
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
