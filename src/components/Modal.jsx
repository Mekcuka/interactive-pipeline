function Modal({
  isOpen,
  onClose,
  onSubmit,
  pipeFrom,
  pipeTo,
  pipeIdSeq,
  editData,
  setEditData,
  onResetGeom,
  isEdit
}) {
  const handleSubmit = () => {
    if (isEdit) {
      onSubmit()
    } else {
      const name = document.getElementById('pipeName')?.value || `Труба ${pipeIdSeq + 1}`
      const od = document.getElementById('pipeOuter')?.value || '500'
      const idm = document.getElementById('pipeInner')?.value || '480'
      onSubmit({ name, od, idm })
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? '✏️ Редактировать трубопровод' : '🔧 Параметры трубопровода'}</h3>
          <button className="close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Название</label>
            <input
              type="text"
              id="pipeName"
              defaultValue={isEdit ? editData?.name : `Труба ${pipeIdSeq + 1}`}
            />
          </div>
          {!isEdit && (
            <>
              <div className="form-group">
                <label>От объекта</label>
                <input
                  type="text"
                  id="pipeFrom"
                  readOnly
                  style={{ background: '#f8fafc' }}
                  defaultValue={pipeFrom?.name || ''}
                />
              </div>
              <div className="form-group">
                <label>До объекта</label>
                <input
                  type="text"
                  id="pipeTo"
                  readOnly
                  style={{ background: '#f8fafc' }}
                  defaultValue={pipeTo?.name || ''}
                />
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Внешний ⌀, мм</label>
              <input
                type="number"
                id="pipeOuter"
                placeholder="500"
                defaultValue={isEdit ? editData?.od : '500'}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Внутренний ⌀, мм</label>
              <input
                type="number"
                id="pipeInner"
                placeholder="480"
                defaultValue={isEdit ? editData?.idm : '480'}
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          {isEdit && (
            <button className="btn btn-secondary btn-sm" onClick={onResetGeom}>
              ↺ Сбросить геометрию
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            Отмена
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {isEdit ? 'Сохранить' : 'Создать трубопровод'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ObjectModal({ isOpen, onClose, onSubmit, object }) {
  const TYPE_PARAMS = {
    wellpad: { key: 'prodRate', label: 'Уровень добычи', unit: 'т.н/год' },
    upsv: { key: 'capacity', label: 'Производительность', unit: 'т.н/год' },
    kns: { key: 'capacity', label: 'Производительность', unit: 'т.ж/год' },
    cps: { key: 'capacity', label: 'Производительность', unit: 'т.н/год' }
  }

  const handleSubmit = () => {
    const name = document.getElementById('objName')?.value || object?.name
    const paramInput = document.getElementById('objParam')
    const updates = { name }
    if (paramInput) {
      const paramDef = TYPE_PARAMS[object?.type]
      if (paramDef && paramInput.value) {
        updates.params = { ...object.params, [paramDef.key]: paramInput.value }
      }
    }
    onSubmit(updates)
  }

  if (!isOpen || !object) return null

  const paramDef = TYPE_PARAMS[object.type]

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>✏️ Редактировать объект</h3>
          <button className="close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Название</label>
            <input
              type="text"
              id="objName"
              defaultValue={object.name}
            />
          </div>
          {paramDef && (
            <div className="form-group">
              <label>{paramDef.label}, {paramDef.unit}</label>
              <input
                type="number"
                id="objParam"
                defaultValue={object.params?.[paramDef.key] || ''}
              />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Отмена
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}

export default Modal
export { ObjectModal }
