import { Link } from 'react-router-dom'

const TYPE_NAMES = {
  wellpad: 'Куст скважин',
  upsv: 'УПСВ',
  kns: 'КНС',
  cps: 'ЦПС',
  node: 'Узел',
  pipe: 'Трубопровод'
}

const TYPE_ICONS = {
  wellpad: '🛢️',
  upsv: '⚙️',
  kns: '💧',
  cps: '🏭',
  node: '🔵',
  pipe: '🔧'
}

function SidebarLeft({
  mode,
  setMode,
  addType,
  addClick,
  setAddClick,
  selectAddType,
  cancelPlacement,
  selObjId,
  setSelObjId,
  objects,
  updateObject,
  showLayers,
  toggleLayer,
  clearAll,
  undo,
  redo,
  canUndo,
  canRedo,
  deleteMode,
  setDeleteMode,
  currentProjectId,
  projectName,
  setProjectName,
  saveProject
}) {
  const selectedObject = objects.find(o => o.id === selObjId)

  const handleSaveEdit = () => {
    if (selectedObject) {
      const input = document.getElementById('editParam')
      const nameInput = document.getElementById('editName')
      const updates = {}
      if (nameInput) updates.name = nameInput.value
      if (input && input.value) {
        const paramKey = getTypeParamKey(selectedObject.type)
        if (paramKey) updates.params = { ...selectedObject.params, [paramKey]: input.value }
      }
      updateObject(selectedObject.id, updates)
      alert('Сохранено!')
    }
  }

  const getTypeParamKey = (type) => {
    const params = {
      wellpad: 'prodRate',
      upsv: 'capacity',
      kns: 'capacity',
      cps: 'capacity'
    }
    return params[type]
  }

  const getTypeParamLabel = (type) => {
    const labels = {
      wellpad: { label: 'Уровень добычи', unit: 'т.н/год' },
      upsv: { label: 'Производительность', unit: 'т.н/год' },
      kns: { label: 'Производительность', unit: 'т.ж/год' },
      cps: { label: 'Производительность', unit: 'т.н/год' }
    }
    return labels[type]
  }

  const handleCancelEdit = () => {
    setSelObjId(null)
  }

  return (
    <div className="sidebar-left">
      <div className="sidebar-header">
        <h1>🗺️ Карта трубопроводов</h1>
        <p>Планирование и редактирование сетей</p>
      </div>

      <div className="sidebar-body">
        <div className="mode-switch">
          <button
            className={`btn ${mode === 'view' ? 'active' : ''}`}
            onClick={() => setMode('view')}
          >
            👁️ Просмотр
          </button>
          <button
            className={`btn ${mode === 'edit' ? 'active' : ''}`}
            onClick={() => setMode('edit')}
          >
            ✏️ Редактор
          </button>
        </div>

        <div className="undo-redo-bar">
          <button className="btn btn-ghost" onClick={undo} disabled={!canUndo} title="Отменить (Ctrl+Z)">
            ↩️ Отменить
          </button>
          <button className="btn btn-ghost" onClick={redo} disabled={!canRedo} title="Повторить (Ctrl+Y)">
            ↪️ Повторить
          </button>
        </div>

        <div className="card">
          <div className="card-header">📁 Проекты</div>
          <div className="card-body">
            <Link
              to="/projects"
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '0.5rem',
                background: '#3b82f6',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.78rem',
                fontWeight: 500
              }}
            >
              📂 Управление проектами
            </Link>
            {currentProjectId && (
              <div className="hint" style={{ marginTop: '0.3rem', fontSize: '0.65rem' }}>
                Текущий проект сохранён
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">🛠️ Инструменты</div>
          <div className="card-body">
            <button
              className={`btn ${deleteMode ? 'btn-danger' : 'btn-secondary'}`}
              onClick={() => { setDeleteMode(!deleteMode); if (!deleteMode) { setAddClick(false); setMode('view'); } }}
            >
              {deleteMode ? '🗑️ Режим удаления (ON)' : '🗑️ Режим удаления'}
            </button>
            {deleteMode && (
              <div className="hint" style={{ borderLeftColor: '#ef4444', marginTop: '0.3rem' }}>
                👆 Кликните на объект для удаления
              </div>
            )}
          </div>
        </div>

        <div className="card" id="cardAdd">
          <div className="card-header">➕ Добавить объект</div>
          <div className="card-body">
            <div className="type-grid">
              {Object.entries(TYPE_NAMES).map(([type, name]) => (
                <div
                  key={type}
                  className={`type-item ${addType === type ? 'active' : ''}`}
                  onClick={() => selectAddType(type)}
                >
                  <span className="icon">{TYPE_ICONS[type]}</span>
                  <span>{name}</span>
                </div>
              ))}
            </div>
            {addClick && (
              <button
                className="btn btn-danger"
                style={{ marginTop: '0.5rem' }}
                onClick={cancelPlacement}
              >
                ❌ Отменить размещение
              </button>
            )}
            {addClick && (
              <div className="hint">
                {addType === 'pipe'
                  ? pipeHint
                  : '👆 Кликните на карту, чтобы разместить объект'}
              </div>
            )}
          </div>
        </div>

        {mode === 'edit' && selectedObject && (
          <div className="card" id="cardEdit">
            <div className="card-header">✏️ Редактировать объект</div>
            <div className="card-body">
              <div className="form-group">
                <label>Название</label>
                <input type="text" id="editName" defaultValue={selectedObject.name} />
              </div>
              {(() => {
                const param = getTypeParamLabel(selectedObject.type)
                if (!param) return null
                return (
                  <div className="form-group">
                    <label>{param.label}, {param.unit}</label>
                    <input
                      type="number"
                      id="editParam"
                      defaultValue={selectedObject.params?.[getTypeParamKey(selectedObject.type)] || ''}
                    />
                  </div>
                )
              })()}
              <button className="btn btn-success" onClick={handleSaveEdit}>
                💾 Сохранить
              </button>
              <button
                className="btn btn-ghost"
                style={{ marginTop: '0.25rem' }}
                onClick={handleCancelEdit}
              >
                ❌ Отменить выбор
              </button>
              <div className="hint success">
                Перетащите объект мышью прямо на карте
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">👁️ Слои</div>
          <div className="card-body">
            <div className="toggle-row">
              <label>
                <input
                  type="checkbox"
                  checked={showLayers.map}
                  onChange={() => toggleLayer('map')}
                />
                Карта OpenStreetMap
              </label>
            </div>
            <div className="toggle-row">
              <label>
                <input
                  type="checkbox"
                  checked={showLayers.obj}
                  onChange={() => toggleLayer('obj')}
                />
                Объекты
              </label>
            </div>
            <div className="toggle-row">
              <label>
                <input
                  type="checkbox"
                  checked={showLayers.pipe}
                  onChange={() => toggleLayer('pipe')}
                />
                Трубопроводы
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="sidebar-footer">
        <button className="btn btn-danger" onClick={clearAll}>
          🗑️ Очистить всё
        </button>
      </div>
    </div>
  )
}

const pipeHint = '👆 Кликните на объект для начала, затем на карту для изгибов. Двойной клик — завершить узлом'

export default SidebarLeft
