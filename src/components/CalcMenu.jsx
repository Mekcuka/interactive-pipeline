function CalcMenu({ onOpenGraphCalc, hasGraphResult }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'center'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        padding: '0.5rem',
        display: 'flex',
        gap: '0.4rem',
        border: '1px solid #e2e8f0',
        whiteSpace: 'nowrap'
      }}>
        <span style={{
          padding: '0.4rem 0.7rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem'
        }}>
          📊 Расчёты
        </span>
        <button
          onClick={onOpenGraphCalc}
          style={{
            padding: '0.45rem 1rem',
            background: hasGraphResult ? '#059669' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.78rem',
            fontWeight: 500,
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            transition: 'all 0.15s',
            minWidth: '120px',
            justifyContent: 'center'
          }}
          onMouseEnter={e => e.target.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
        >
          {hasGraphResult ? '✅ Граф построен' : '▶ Построить граф'}
        </button>
      </div>
    </div>
  )
}

export default CalcMenu
