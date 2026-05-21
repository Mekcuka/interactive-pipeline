import { useState, useRef, useCallback, useEffect } from 'react'
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

  // ── Проекты (localStorage) ──
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('pipeline-projects')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [currentProjectId, setCurrentProjectId] = useState(null)
  const [projectName, setProjectName] = useState('')

  // Сохраняем проекты при изменении
  useEffect(() => {
    try {
      localStorage.setItem('pipeline-projects', JSON.stringify(projects))
  } catch {}
  }, [projects])

  const createProject = useCallback(() => {
    const name = projectName.trim() || `Проект ${new Date().toLocaleDateString()}`
    const newProject = {
      id: Date.now(),
      name,
      createdAt: new Date().toISOString(),
      objects: JSON.parse(JSON.stringify(objects)),
      connections: JSON.parse(JSON.stringify(connections)),
      objIdSeq,
      pipeIdSeq
    }
    setProjects(prev => [...prev, newProject])
    setCurrentProjectId(newProject.id)
    setProjectName('')
  }, [projectName, objects, connections, objIdSeq, pipeIdSeq])

  const saveProject = useCallback(() => {
    if (!currentProjectId) return
    setProjects(prev => prev.map(p => {
      if (p.id !== currentProjectId) return p
      return {
        ...p,
        updatedAt: new Date().toISOString(),
        objects: JSON.parse(JSON.stringify(objects)),
        connections: JSON.parse(JSON.stringify(connections)),
        objIdSeq,
        pipeIdSeq
      }
    }))
  }, [currentProjectId, objects, connections, objIdSeq, pipeIdSeq])

  const deleteProject = useCallback((projectId) => {
    if (!confirm('Удалить проект?')) return
    setProjects(prev => prev.filter(p => p.id !== projectId))
    if (currentProjectId === projectId) {
      setCurrentProjectId(null)
    }
  }, [currentProjectId])

  // ── Режим удаления ──
  const [deleteMode, setDeleteMode] = useState(false)

  // Refs для актуальных значений внутри callbacks
  const stateRef = useRef({})
  stateRef.current = {
    objects, connections, objIdSeq, pipeIdSeq,
    mode, addType, addClick, pipeFrom, pipeTo, pipeWaypoints, deleteMode
  }

  // ── Undo / Redo ──
  const undoStack = useRef([])
  const redoStack = useRef([])
  const isUndoing = useRef(false)
  const MAX_HISTORY = 50

  const pushHistory = useCallback(() => {
    if (isUndoing.current) return
    const snapshot = {
      objects: JSON.parse(JSON.stringify(objects)),
      connections: JSON.parse(JSON.stringify(connections)),
      objIdSeq,
      pipeIdSeq
    }
    undoStack.current.push(snapshot)
    if (undoStack.current.length > MAX_HISTORY) {
      undoStack.current.shift()
    }
    redoStack.current = []
  }, [objects, connections, objIdSeq, pipeIdSeq])

  const canUndo = undoStack.current.length > 0
  const canRedo = redoStack.current.length > 0

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return
    isUndoing.current = true
    const current = {
      objects: JSON.parse(JSON.stringify(objects)),
      connections: JSON.parse(JSON.stringify(connections)),
      objIdSeq,
      pipeIdSeq
    }
    redoStack.current.push(current)
    const snapshot = undoStack.current.pop()
    setObjects(snapshot.objects)
    setConnections(snapshot.connections)
    setObjIdSeq(snapshot.objIdSeq)
    setPipeIdSeq(snapshot.pipeIdSeq)
    setSelObjId(null)
    setSelPipeId(null)
    setTimeout(() => { isUndoing.current = false }, 0)
  }, [objects, connections, objIdSeq, pipeIdSeq])

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return
    isUndoing.current = true
    const current = {
      objects: JSON.parse(JSON.stringify(objects)),
      connections: JSON.parse(JSON.stringify(connections)),
      objIdSeq,
      pipeIdSeq
    }
    undoStack.current.push(current)
    const snapshot = redoStack.current.pop()
    setObjects(snapshot.objects)
    setConnections(snapshot.connections)
    setObjIdSeq(snapshot.objIdSeq)
    setPipeIdSeq(snapshot.pipeIdSeq)
    setSelObjId(null)
    setSelPipeId(null)
    setTimeout(() => { isUndoing.current = false }, 0)
  }, [objects, connections, objIdSeq, pipeIdSeq])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          undo()
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault()
          redo()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])

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

  // ── Проекты: load/new после pushHistory ──
  const loadProject = useCallback((projectId) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return
    pushHistory()
    setObjects(project.objects || [])
    setConnections(project.connections || [])
    setObjIdSeq(project.objIdSeq || 0)
    setPipeIdSeq(project.pipeIdSeq || 0)
    setCurrentProjectId(projectId)
    setSelObjId(null)
    setSelPipeId(null)
    setMode('view')
    cancelPlacement()
  }, [projects, pushHistory, cancelPlacement])

  const newProjectEmpty = useCallback(() => {
    pushHistory()
    setObjects([])
    setConnections([])
    setObjIdSeq(0)
    setPipeIdSeq(0)
    setCurrentProjectId(null)
    setSelObjId(null)
    setSelPipeId(null)
    setMode('view')
    cancelPlacement()
  }, [pushHistory, cancelPlacement])

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
    pushHistory()
    setObjects(prev => [...prev, obj])
    return obj
  }, [pushHistory])

  const handleObjectDeleteClick = useCallback((o) => {
    pushHistory()
    setObjects(prev => prev.filter(obj => obj.id !== o.id))
    setConnections(prev => prev.filter(c => c.from !== o.id && c.to !== o.id))
    setSelObjId(prev => prev === o.id ? null : prev)
  }, [pushHistory])

  const handlePipeClick = useCallback((o) => {
    const { pipeFrom, connections, deleteMode } = stateRef.current
    if (deleteMode) {
      handleObjectDeleteClick(o)
      return
    }
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
  }, [handleObjectDeleteClick])

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
    pushHistory()
    setConnections(prev => [...prev, newPipe])
    setModalPipeOpen(false)
    cancelPlacement()
    setMode('edit')
  }, [cancelPlacement, pushHistory])

  const handleMapClick = useCallback((lat, lng) => {
    const { addClick, addType, pipeFrom, deleteMode } = stateRef.current
    if (deleteMode) return
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
    pushHistory()
    setObjects(prev => [...prev, node])
    setPipeTo(node)
    setModalPipeOpen(true)
  }, [pushHistory])

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
      pushHistory()
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
    pushHistory()
    setConnections(prev => prev.map(c => {
      if (c.id !== pipeId) return c
      const newPts = c.pts ? [...c.pts] : []
      if (wpIndex >= 0 && wpIndex < newPts.length) {
        newPts.splice(wpIndex, 1)
      }
      return { ...c, pts: newPts }
    }))
  }, [pushHistory])

  const commitMoveObject = useCallback((id, lat, lng) => {
    pushHistory()
  }, [pushHistory])

  const commitMoveWaypoint = useCallback((pipeId, wpIndex, lat, lng) => {
    pushHistory()
  }, [pushHistory])

  const updateObject = useCallback((id, updates) => {
    pushHistory()
    setObjects(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o))
  }, [pushHistory])

  const updatePipe = useCallback((id, updates) => {
    pushHistory()
    setConnections(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [pushHistory])

  const resetPipeGeom = useCallback((id) => {
    pushHistory()
    setConnections(prev => prev.map(c => {
      if (c.id !== id) return c
      const f = stateRef.current.objects.find(o => o.id === c.from)
      const t = stateRef.current.objects.find(o => o.id === c.to)
      return { ...c, pts: f && t ? [f.center, t.center] : c.pts }
    }))
  }, [pushHistory])

  const deleteObject = useCallback((id) => {
    pushHistory()
    setObjects(prev => prev.filter(o => o.id !== id))
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id))
    setSelObjId(prev => prev === id ? null : prev)
  }, [pushHistory])

  const deletePipe = useCallback((id) => {
    pushHistory()
    setConnections(prev => prev.filter(c => c.id !== id))
    setSelPipeId(prev => prev === id ? null : prev)
  }, [pushHistory])

  const clearAll = useCallback(() => {
    pushHistory()
    setObjects([])
    setConnections([])
    setObjIdSeq(0)
    setPipeIdSeq(0)
    setSelObjId(null)
    setSelPipeId(null)
    setMode('view')
    cancelPlacement()
  }, [cancelPlacement, pushHistory])

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
        setAddClick={setAddClick}
        selectAddType={selectAddType}
        cancelPlacement={cancelPlacement}
        selObjId={selObjId}
        setSelObjId={setSelObjId}
        objects={objects}
        updateObject={updateObject}
        showLayers={showLayers}
        toggleLayer={toggleLayer}
        clearAll={clearAll}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        deleteMode={deleteMode}
        setDeleteMode={setDeleteMode}
        projects={projects}
        currentProjectId={currentProjectId}
        projectName={projectName}
        setProjectName={setProjectName}
        createProject={createProject}
        saveProject={saveProject}
        loadProject={loadProject}
        deleteProject={deleteProject}
        newProjectEmpty={newProjectEmpty}
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
        deleteMode={deleteMode}
        onMapClick={handleMapClick}
        onMapDblClick={handleMapDblClick}
        onObjectClick={handlePipeClick}
        onPipeLineClick={handlePipeLineClick}
        onMoveObject={moveObject}
        onMoveObjectCommit={commitMoveObject}
        moveWaypoint={moveWaypoint}
        moveWaypointCommit={commitMoveWaypoint}
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
