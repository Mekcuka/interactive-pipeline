import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function ProjectsPage({
  projects,
  currentProjectId,
  projectName,
  setProjectName,
  createProject,
  saveProject,
  loadProject,
  deleteProject,
  newProjectEmpty
}) {
  const navigate = useNavigate()

  const handleLoadProject = (projectId) => {
    loadProject(projectId)
    navigate('/')
  }

  const handleNewProject = () => {
    newProjectEmpty()
    navigate('/')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem 1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '640px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem 2rem',
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 600, margin: 0 }}>📁 Проекты</h1>
            <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: '0.25rem 0 0 0' }}>
              Управление проектами трубопроводов
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontFamily: 'inherit'
            }}
          >
            🗺️ К карте
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem 2rem' }}>
          {/* Create new project */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '10px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', margin: '0 0 0.75rem 0' }}>
              ➕ Новый проект
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Название проекта..."
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.9rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createProject()
                }}
              />
              <button
                onClick={createProject}
                style={{
                  padding: '0.6rem 1.2rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap'
                }}
              >
                💾 Создать
              </button>
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <button
              onClick={handleNewProject}
              style={{
                flex: 1,
                padding: '0.7rem',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                fontWeight: 500,
                color: '#475569'
              }}
            >
              📄 Пустой проект
            </button>
            <button
              onClick={saveProject}
              disabled={!currentProjectId}
              style={{
                flex: 1,
                padding: '0.7rem',
                background: currentProjectId ? '#3b82f6' : '#e2e8f0',
                color: currentProjectId ? 'white' : '#94a3b8',
                border: 'none',
                borderRadius: '8px',
                cursor: currentProjectId ? 'pointer' : 'not-allowed',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                fontWeight: 500
              }}
            >
              📝 Сохранить текущий
            </button>
          </div>

          {/* Projects list */}
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', margin: '0 0 0.75rem 0' }}>
            📂 Сохранённые проекты
            <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: '0.5rem' }}>
              ({projects.length})
            </span>
          </h3>

          {projects.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2.5rem 1rem',
              color: '#94a3b8',
              fontSize: '0.9rem'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📂</div>
              Пока нет сохранённых проектов
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {projects.map(p => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: currentProjectId === p.id ? '#eff6ff' : '#f8fafc',
                    border: `1px solid ${currentProjectId === p.id ? '#3b82f6' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    transition: 'all 0.15s',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleLoadProject(p.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>📁</span>
                    <div>
                      <div style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: currentProjectId === p.id ? '#1d4ed8' : '#1e293b'
                      }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                        {p.createdAt && new Date(p.createdAt).toLocaleDateString('ru-RU')}
                        {p.updatedAt && ` · обновлён ${new Date(p.updatedAt).toLocaleDateString('ru-RU')}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLoadProject(p.id) }}
                      style={{
                        padding: '0.35rem 0.7rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontFamily: 'inherit'
                      }}
                    >
                      📂 Открыть
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteProject(p.id) }}
                      style={{
                        padding: '0.35rem 0.5rem',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontFamily: 'inherit'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '1.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>
        Карта трубопроводов · v1.0
      </div>
    </div>
  )
}

export default ProjectsPage
