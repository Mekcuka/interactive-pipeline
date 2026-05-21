import { useState, useMemo } from 'react'
import { WELLPAD_SVG_SMALL, TYPE_EMOJI } from './Icons'

function GraphCalcModal({
  isOpen,
  onClose,
  objects,
  connections,
  onRunCalc
}) {
  const [step, setStep] = useState('select') // 'select' | 'result'
  const [selectedSources, setSelectedSources] = useState(new Set())
  const [selectedTargets, setSelectedTargets] = useState(new Set())
  const [result, setResult] = useState(null)

  const sources = useMemo(() => objects.filter(o => o.type === 'wellpad'), [objects])
  const targets = useMemo(() => objects.filter(o => o.type === 'upsv' || o.type === 'cps'), [objects])

  const toggleSource = (id) => {
    setSelectedSources(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleTarget = (id) => {
    setSelectedTargets(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllSources = () => setSelectedSources(new Set(sources.map(o => o.id)))
  const selectAllTargets = () => setSelectedTargets(new Set(targets.map(o => o.id)))
  const clearSources = () => setSelectedSources(new Set())
  const clearTargets = () => setSelectedTargets(new Set())

  const handleRun = () => {
    const srcIds = Array.from(selectedSources)
    const tgtIds = Array.from(selectedTargets)
    if (srcIds.length === 0 || tgtIds.length === 0) {
      alert('Выберите хотя бы один источник и одну цель')
      return
    }
    const calcResult = buildGraphPaths(objects, connections, srcIds, tgtIds)
    setResult(calcResult)
    setStep('result')
    onRunCalc(calcResult)
  }

  const handleReset = () => {
    setStep('select')
    setResult(null)
    setSelectedSources(new Set())
    setSelectedTargets(new Set())
    onRunCalc(null)
  }

  const handleClose = () => {
    onClose()
    if (step === 'result') {
      // не сбрасываем результат при простом закрытии, только при reset
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay show" onClick={handleClose}>
      <div className="modal" style={{ width: '520px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{step === 'select' ? '🔧 Построить граф' : '📊 Результат расчёта'}</h3>
          <button className="close" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
          {step === 'select' ? (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b' }}>
                    <span dangerouslySetInnerHTML={{ __html: WELLPAD_SVG_SMALL }} /> Источники (Куст скважин)
                  </h4>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button className="btn btn-sm btn-ghost" style={{ width: 'auto', fontSize: '0.65rem' }} onClick={selectAllSources}>Все</button>
                    <button className="btn btn-sm btn-ghost" style={{ width: 'auto', fontSize: '0.65rem' }} onClick={clearSources}>Сброс</button>
                  </div>
                </div>
                {sources.length === 0 ? (
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', padding: '0.5rem' }}>Нет кустов скважин</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {sources.map(o => (
                      <label key={o.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.4rem 0.6rem',
                        background: selectedSources.has(o.id) ? '#eff6ff' : '#f8fafc',
                        border: `1px solid ${selectedSources.has(o.id) ? '#3b82f6' : '#e2e8f0'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedSources.has(o.id)}
                          onChange={() => toggleSource(o.id)}
                        />
                        <span dangerouslySetInnerHTML={{ __html: WELLPAD_SVG_SMALL }} style={{ color: '#1e293b' }} />
                        {o.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b' }}>
                    {TYPE_EMOJI.upsv} Цели (УПСВ / ЦПС)
                  </h4>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button className="btn btn-sm btn-ghost" style={{ width: 'auto', fontSize: '0.65rem' }} onClick={selectAllTargets}>Все</button>
                    <button className="btn btn-sm btn-ghost" style={{ width: 'auto', fontSize: '0.65rem' }} onClick={clearTargets}>Сброс</button>
                  </div>
                </div>
                {targets.length === 0 ? (
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', padding: '0.5rem' }}>Нет УПСВ или ЦПС</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {targets.map(o => (
                      <label key={o.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.4rem 0.6rem',
                        background: selectedTargets.has(o.id) ? '#eff6ff' : '#f8fafc',
                        border: `1px solid ${selectedTargets.has(o.id) ? '#3b82f6' : '#e2e8f0'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedTargets.has(o.id)}
                          onChange={() => toggleTarget(o.id)}
                        />
                        <span>{TYPE_EMOJI[o.type]}</span>
                        {o.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="hint" style={{ fontSize: '0.72rem' }}>
                Выберите источники и цели, затем нажмите «Запустить расчёт». 
                Алгоритм найдёт все возможные пути через существующие трубопроводы.
              </div>
            </>
          ) : (
            <GraphResult result={result} objects={objects} />
          )}
        </div>

        <div className="modal-footer">
          {step === 'result' && (
            <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setStep('select')}>
              ← Назад
            </button>
          )}
          <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={handleClose}>
            Закрыть
          </button>
          {step === 'select' ? (
            <button
              className="btn btn-primary"
              style={{ width: 'auto' }}
              onClick={handleRun}
              disabled={selectedSources.size === 0 || selectedTargets.size === 0}
            >
              ▶ Запустить расчёт
            </button>
          ) : (
            <button className="btn btn-danger" style={{ width: 'auto' }} onClick={handleReset}>
              🗑️ Сбросить расчёт
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function GraphResult({ result, objects }) {
  if (!result) return null

  const { paths, stats } = result

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        <StatBox label="Найдено путей" value={stats.totalPaths} />
        <StatBox label="Источников" value={stats.sourceCount} />
        <StatBox label="Целей" value={stats.targetCount} />
      </div>

      {paths.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
          Пути не найдены. Проверьте, что между выбранными объектами есть трубопроводы.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {paths.map((path, idx) => (
            <div key={idx} style={{
              padding: '0.6rem 0.8rem',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '0.78rem'
            }}>
              <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.3rem' }}>
                Путь {idx + 1}: {path.nodeNames.join(' → ')}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.72rem' }}>
                Узлов: {path.nodes.length} · Труб: {path.edges.length} · Длина: {path.lengthKm.toFixed(2)} км
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '0.6rem',
      background: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    }}>
      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{value}</div>
      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.15rem' }}>{label}</div>
    </div>
  )
}

// ── Алгоритм построения графа ──
function buildGraphPaths(objects, connections, sourceIds, targetIds) {
  // Строим adjacency list (неориентированный граф)
  const adj = new Map()
  const edgeMap = new Map() // key: "from-to" или "to-from" → connection

  for (const c of connections) {
    if (!adj.has(c.from)) adj.set(c.from, [])
    if (!adj.has(c.to)) adj.set(c.to, [])
    adj.get(c.from).push(c.to)
    adj.get(c.to).push(c.from)

    const key1 = `${c.from}-${c.to}`
    const key2 = `${c.to}-${c.from}`
    edgeMap.set(key1, c)
    edgeMap.set(key2, c)
  }

  const objMap = new Map(objects.map(o => [o.id, o]))
  const targetSet = new Set(targetIds)
  const paths = []

  // BFS от каждого источника до каждой цели
  for (const srcId of sourceIds) {
    if (!adj.has(srcId)) continue

    const visited = new Set()
    const queue = [[srcId]] // каждый элемент — путь (массив id)
    visited.add(`${srcId}-`)

    while (queue.length > 0) {
      const path = queue.shift()
      const lastId = path[path.length - 1]

      if (targetSet.has(lastId) && lastId !== srcId) {
        // Нашли путь от src до target
        const edges = []
        let totalLen = 0
        for (let i = 0; i < path.length - 1; i++) {
          const a = path[i], b = path[i + 1]
          const c = edgeMap.get(`${a}-${b}`)
          if (c) {
            edges.push(c)
            totalLen += edgeLength(c, objMap)
          }
        }
        paths.push({
          sourceId: srcId,
          targetId: lastId,
          nodes: path,
          nodeNames: path.map(id => objMap.get(id)?.name || '?'),
          edges,
          lengthKm: totalLen / 1000
        })
        // Не прерываем — ищем все пути
      }

      const neighbors = adj.get(lastId) || []
      for (const nxt of neighbors) {
        // Избегаем циклов: не посещаем уже пройденные узлы в текущем пути
        if (!path.includes(nxt)) {
          queue.push([...path, nxt])
        }
      }
    }
  }

  // Сортируем: сначала короткие пути
  paths.sort((a, b) => a.lengthKm - b.lengthKm)

  return {
    paths,
    stats: {
      totalPaths: paths.length,
      sourceCount: sourceIds.length,
      targetCount: targetIds.length
    }
  }
}

function edgeLength(conn, objMap) {
  const from = objMap.get(conn.from)
  const to = objMap.get(conn.to)
  if (!from || !to) return 0
  const pts = conn.pts && conn.pts.length > 1 ? conn.pts : [from.center, to.center]
  let d = 0
  for (let i = 0; i < pts.length - 1; i++) {
    d += haversine(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])
  }
  return d
}

function haversine(lat1, lng1, lat2, lng2) {
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

export default GraphCalcModal
