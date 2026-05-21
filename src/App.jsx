import { useState, useRef, useCallback } from 'react'
import './App.css'
import SidebarLeft from './components/SidebarLeft'
import SidebarRight from './components/SidebarRight'
import MapView from './components/MapView'
import Modal, { ObjectModal } from './components/Modal'

const TYPE_NAMES = {
  wellpad: 'Куст скважин',
  upsv: 'УПСВ',
  kns: 'КНС',
  cps: 'ЦПС',
  node: 'Узел'
}

function App() {
  const [objects, setObjects] = useState([])
  const [connections, setConnections] = useState([])
  const [objIdSeq, setObjIdSeq] = useState(0)
  const [pipeIdSeq, setPipeIdSeq] = useState(0)
  const [selObjId, setSelObjId] = useState(null)
  const [selPipeId, setSelPipeId] = useState(null)
  const [mode, setMode] = useState('view')
  const [addType, setAddType] = useState('wellpad')
  const [addClick, setAddClick] = useState(false)
  const [pipeFrom, setPipeFrom] = useState(null)
  const [pipeTo, setPipeTo] = useState(null)
  const [pipeWaypoints, setPipeWaypoints] = useState([])
  const [showLayers, setShowLayers] = useState({ map: true, obj: true, pipe: true })
  const [modalPipeOpen, setModalPipeOpen] = useState(false)
  const [modalEditPipeOpen, setModalEditPipeOpen] = useState(false)
  const [modalEditObjectOpen, setModalEditObjectOpen] = useState(false)
  const [editPipeData, setEditPipeData] = useState(null)
  const [editObjectData, setEditObjectData] = useState(null)

  // Refs для актуальных значений внутри callbacks
  const stateRef = useRef({})
  stateRef.current = {
    objects, connections, objIdSeq, pipeIdSeq,
    mode, addType, addClick, pipeFrom, pipeTo, pipeWaypoints
  }

  const selectAddType = useCallback((type) => {
    setAddType(type)
    setAddClick(true)
    setPipeFrom(null)
    setPipeTo(null)
    setPipeWaypoints([])
  }, [])

  const cancelPlacement = useCallback(() => {
    setAddClick(false)
    setPipeFrom(null)
    setPipeTo(null)
    setPipeWaypoints([])
  }, [])

  const addObject = useCallback((lat, lng, type) => {
    const newId = stateRef.current.objIdSeq + 1
    setObjIdSeq(newId)
    const obj = {
      id: newId,
      type,
      name: TYPE_NAMES[type] + ' ' + newId,
      center: [lat, lng],
      params: {}
    }
    setObjects(prev => [...prev, obj])
    return obj
  }, [])

  const handlePipeClick = useCallback((o) => {
    const { pipeFrom, connections } = stateRef.current
    if (!pipeFrom) {
      setPipeFrom(o)
      return
    }
    if (pipeFrom.id === o.id) {
      setPipeFrom(null)
      return
    }
    const exists = connections.some(c =>
      (c.from === pipeFrom.id && c.to === o.id) ||
      (c.from === o.id && c.to === pipeFrom.id)
    )
    if (exists) {
      setPipeFrom(null)
      setPipeTo(null)
      setPipeWaypoints([])
      return
    }
    setPipeTo(o)
    setModalPipeOpen(true)
  }, [])

  const confirmPipe = useCallback((pipeData) => {
    const { pipeFrom, pipeTo, pipeWaypoints, pipeIdSeq } = stateRef.current
    if (!pipeFrom || !pipeTo) {
      setModalPipeOpen(false)
      return
    }
    const newId = pipeIdSeq + 1
    setPipeIdSeq(newId)
    const newPipe = {
      id: newId,
      name: pipeData.name || 'Труба ' + newId,
      from: pipeFrom.id,
      to: pipeTo.id,
      pts: [pipeFrom.center, ...pipeWaypoints, pipeTo.center],
      od: pipeData.od,
      idm: pipeData.idm
    }
    setConnections(prev => [...prev, newPipe])
    setModalPipeOpen(false)
    cancelPlacement()
    setMode('edit') // Переключаем в режим редактирования
  }, [cancelPlacement])

  const handleMapClick = useCallback((lat, lng) => {
    const { addClick, addType, pipeFrom } = stateRef.current
    if (!addClick) return
    if (addType !== 'pipe') {
      addObject(lat, lng, addType)
    } else if (pipeFrom) {
      setPipeWaypoints(prev => [...prev, [lat, lng]])
    }
  }, [addObject])

  const handleMapDblClick = useCallback((lat, lng) => {
    const { addClick, addType, pipeFrom, objIdSeq } = stateRef.current
    if (!addClick || addType !== 'pipe' || !pipeFrom) return
    const newId = objIdSeq + 1
    setObjIdSeq(newId)
    const node = {
      id: newId,
      type: 'node',
      name: 'Узел ' + newId,
      center: [lat, lng],
      params: {}
    }
    setObjects(prev => [...prev, node])
    setPipeTo(node)
    setModalPipeOpen(true)
  }, [])

  const handlePipeLineClick = useCallback((c, latlng) => {
    const { addClick, addType, pipeFrom, objIdSeq, mode } = stateRef.current
    if (addClick && addType === 'pipe') {
      const newId = objIdSeq + 1
      setObjIdSeq(newId)
      const node = {
        id: newId,
        type: 'node',
        name: 'Узел ' + newId,
        center: [latlng.lat, latlng.lng],
        params: {}
      }
      setObjects(prev => [...prev, node])
      if (!pipeFrom) {
        setPipeFrom(node)
      } else {
        setPipeTo(node)
        setModalPipeOpen(true)
      }
    } else if (mode === 'edit') {
      setConnections(prev => prev.map(conn => {
        if (conn.id !== c.id) return conn
        let pts = conn.pts && conn.pts.length >= 2 ? [...conn.pts] : []
        if (pts.length < 2) {
          const f = stateRef.current.objects.find(o => o.id === conn.from)
          const t = stateRef.current.objects.find(o => o.id === conn.to)
          pts = [f?.center || [0, 0], t?.center || [0, 0]]
        }
        let best = 1, bestD = Infinity
        for (let i = 0; i < pts.length - 1; i++) {
          const midLat = (pts[i][0] + pts[i + 1][0]) / 2
          const midLng = (pts[i][1] + pts[i + 1][1]) / 2
          const d = Math.pow(latlng.lat - midLat, 2) + Math.pow(latlng.lng - midLng, 2)
          if (d < bestD) { bestD = d; best = i + 1 }
        }
        pts.splice(best, 0, [latlng.lat, latlng.lng])
        return { ...conn, pts }
      }))
    }
  }, [])

  const moveObject = useCallback((id, lat, lng) => {
    setObjects(prev => prev.map(o => {
      if (o.id !== id) return o
      return { ...o, center: [lat, lng] }
    }))
    setConnections(prev => prev.map(c => {
      if (c.from !== id && c.to !== id) return c
      const pts = c.pts && c.pts.length >= 2 ? [...c.pts] : []
      if (c.from === id) pts[0] = [lat, lng]
      if (c.to === id) pts[pts.length - 1] = [lat, lng]
      return { ...c, pts }
    }))
  }, [])

  const moveWaypoint = useCallback((pipeId, wpIndex, lat, lng) => {
    setConnections(prev => prev.map(c => {
      if (c.id !== pipeId) return c
      const newPts = c.pts ? [...c.pts] : []
      if (wpIndex >= 0 && wpIndex < newPts.length) {
        newPts[wpIndex] = [lat, lng]
      }
      return { ...c, pts: newPts }
    }))
  }, [])

  const removeWaypoint = useCallback((pipeId, wpIndex) => {
    setConnections(prev => prev.map(c => {
      if (c.id !== pipeId) return c
      const newPts = c.pts ? [...c.pts] : []
      if (wpIndex >= 0 && wpIndex < newPts.length) {
        newPts.splice(wpIndex, 1)
      }
      return { ...c, pts: newPts }
    }))
  }, [])

  const updateObject = useCallback((id, updates) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o))
  }, [])

  const updatePipe = useCallback((id, updates) => {
    setConnections(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [])

  const resetPipeGeom = useCallback((id) => {
    setConnections(prev => prev.map(c => {
      if (c.id !== id) return c
      const f = stateRef.current.objects.find(o => o.id === c.from)
      const t = stateRef.current.objects.find(o => o.id === c.to)
      return { ...c, pts: f && t ? [f.center, t.center] : c.pts }
    }))
  }, [])

  const deleteObject = useCallback((id) => {
    setObjects(prev => prev.filter(o => o.id !== id))
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id))
    setSelObjId(prev => prev === id ? null : prev)
  }, [])

  const deletePipe = useCallback((id) => {
    setConnections(prev => prev.filter(c => c.id !== id))
    setSelPipeId(prev => prev === id ? null : prev)
  }, [])

  const clearAll = useCallback(() => {
    setObjects([])
    setConnections([])
    setObjIdSeq(0)
    setPipeIdSeq(0)
    setSelObjId(null)
    setSelPipeId(null)
    setMode('view')
    cancelPlacement()
  }, [cancelPlacement])

  const toggleLayer = useCallback((layer) => {
    setShowLayers(prev => ({ ...prev, [layer]: !prev[layer] }))
  }, [])

  const openEditPipe = useCallback((c) => {
    setEditPipeData({ ...c })
    setModalEditPipeOpen(true)
  }, [])

  const savePipeEdit = useCallback(() => {
    if (editPipeData) {
      updatePipe(editPipeData.id, { name: editPipeData.name, od: editPipeData.od, idm: editPipeData.idm })
      setModalEditPipeOpen(false)
      setEditPipeData(null)
    }
  }, [editPipeData, updatePipe])

  const openEditObject = useCallback((o) => {
    setEditObjectData({ ...o })
    setModalEditObjectOpen(true)
  }, [])

  const saveObjectEdit = useCallback((updates) => {
    if (editObjectData) {
      updateObject(editObjectData.id, updates)
      setModalEditObjectOpen(false)
      setEditObjectData(null)
    }
  }, [editObjectData, updateObject])

  return (
    <div className="app">
      <SidebarLeft
        mode={mode}
        setMode={setMode}
        addType={addType}
        addClick={addClick}
        selectAddType={selectAddType}
        cancelPlacement={cancelPlacement}
        selObjId={selObjId}
        setSelObjId={setSelObjId}
        objects={objects}
        updateObject={updateObject}
        showLayers={showLayers}
        toggleLayer={toggleLayer}
        clearAll={clearAll}
      />
      <MapView
        objects={objects}
        connections={connections}
        selObjId={selObjId}
        setSelObjId={setSelObjId}
        mode={mode}
        addType={addType}
        addClick={addClick}
        pipeFrom={pipeFrom}
        pipeWaypoints={pipeWaypoints}
        showLayers={showLayers}
        onMapClick={handleMapClick}
        onMapDblClick={handleMapDblClick}
        onObjectClick={handlePipeClick}
        onPipeLineClick={handlePipeLineClick}
        onMoveObject={moveObject}
        moveWaypoint={moveWaypoint}
        removeWaypoint={removeWaypoint}
      />
      <SidebarRight
        objects={objects}
        connections={connections}
        selObjId={selObjId}
        selPipeId={selPipeId}
        setSelObjId={setSelObjId}
        setSelPipeId={setSelPipeId}
        mode={mode}
        deleteObject={deleteObject}
        deletePipe={deletePipe}
        openEditPipe={openEditPipe}
        openEditObject={openEditObject}
      />
      <Modal
        isOpen={modalPipeOpen}
        onClose={() => setModalPipeOpen(false)}
        onSubmit={confirmPipe}
        pipeFrom={pipeFrom}
        pipeTo={pipeTo}
        pipeIdSeq={pipeIdSeq}
      />
      <Modal
        isOpen={modalEditPipeOpen}
        onClose={() => { setModalEditPipeOpen(false); setEditPipeData(null) }}
        onSubmit={savePipeEdit}
        editData={editPipeData}
        setEditData={setEditPipeData}
        onResetGeom={() => editPipeData && resetPipeGeom(editPipeData.id)}
        isEdit
      />
      <ObjectModal
        isOpen={modalEditObjectOpen}
        onClose={() => { setModalEditObjectOpen(false); setEditObjectData(null) }}
        onSubmit={saveObjectEdit}
        object={editObjectData}
      />
    </div>
  )
}

export default App
