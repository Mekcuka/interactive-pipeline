const TYPE_ICONS = {
  wellpad: '🛢️',
  upsv: '⚙️',
  kns: '💧',
  cps: '🏭',
  node: '🔵'
}

const TYPE_PARAMS = {
  wellpad: { key: 'prodRate', unit: 'т.н/год' },
  upsv: { key: 'capacity', unit: 'т.н/год' },
  kns: { key: 'capacity', unit: 'т.ж/год' },
  cps: { key: 'capacity', unit: 'т.н/год' }
}

function SidebarRight({
  objects,
  connections,
  selObjId,
  selPipeId,
  setSelObjId,
  setSelPipeId,
  mode,
  deleteObject,
  deletePipe,
  openEditPipe,
  openEditObject
}) {
  const dist = (lat1, lng1, lat2, lng2) => {
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const fmt = (m) => {
    return m >= 1000 ? (m / 1000).toFixed(2) + ' км' : Math.round(m) + ' м'
  }

  const getPipeLength = (c) => {
    const from = objects.find((o) => o.id === c.from)
    const to = objects.find((o) => o.id === c.to)
    if (!from || !to) return 0
    const pts = c.pts && c.pts.length > 1 ? c.pts : [from.center, to.center]
    let d = 0
    for (let i = 0; i < pts.length - 1; i++) {
      d += dist(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])
    }
    return d
  }

  const getObjectExtra = (o) => {
    const param = TYPE_PARAMS[o.type]
    if (param && o.params && o.params[param.key]) {
      return ` — ${o.params[param.key]} ${param.unit}`
    }
    return ''
  }

  return (
    <div className="sidebar-right">
      <div className="sidebar-header">
        <h1>📋 Объекты и трубы</h1>
      </div>
      <div className="sidebar-body" style={{ padding: '0.6rem' }}>
        <div className="card" style={{ marginBottom: '0.6rem' }}>
          <div className="card-header">
            📦 Объекты{' '}
            <span style={{ float: 'right', color: '#94a3b8', fontWeight: 400 }}>
              {objects.length}
            </span>
          </div>
          <div
            className="card-body"
            style={{ padding: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}
          >
            <div className="list" id="listObj">
              {objects.length === 0 ? (
                <div className="list-empty">Нет объектов</div>
              ) : (
                objects.map((o) => (
                    <div
                      key={o.id}
                      className={`list-item ${selObjId === o.id ? 'active' : ''}`}
                      onClick={() => setSelObjId(o.id)}
                    >
                      <span>
                        {TYPE_ICONS[o.type] || '📍'} {o.name}
                        {getObjectExtra(o)}
                      </span>
                      <div className="actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditObject(o)
                          }}
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteObject(o.id)
                          }}
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            🔧 Трубопроводы{' '}
            <span style={{ float: 'right', color: '#94a3b8', fontWeight: 400 }}>
              {connections.length}
            </span>
          </div>
          <div
            className="card-body"
            style={{ padding: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}
          >
            <div className="list" id="listPipe">
              {connections.length === 0 ? (
                <div className="list-empty">Нет трубопроводов</div>
              ) : (
                connections.map((c) => {
                  const d = getPipeLength(c)
                  return (
                    <div
                      key={c.id}
                      className={`list-item ${selPipeId === c.id ? 'active' : ''}`}
                      onClick={() => setSelPipeId(c.id)}
                    >
                      <span>
                        {c.name} — {fmt(d)}
                      </span>
                      <div className="actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditPipe(c)
                          }}
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deletePipe(c.id)
                          }}
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SidebarRight
