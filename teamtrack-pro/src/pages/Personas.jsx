import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { personaService } from '../services/personaService'
import { isSuperAdmin, isViewAdmin } from '../utils/roleGuard'
import PersonaForm from '../components/personas/PersonaForm'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { ConfirmModal } from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonCard } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, User, CheckCircle, XCircle, Link } from 'lucide-react'

function PersonaCard({ persona, onEdit, onDelete, canEdit }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-purple-700 font-bold">{persona.full_name[0]}</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{persona.full_name}</p>
            <p className="text-xs text-gray-500">{persona.headline || 'No headline'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {persona.is_active
            ? <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle size={11}/> Active</span>
            : <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full"><XCircle size={11}/> Inactive</span>
          }
        </div>
      </div>

      <div className="mt-3 space-y-1 text-xs text-gray-500">
        {persona.email && <p>✉ {persona.email}</p>}
        {persona.phone && <p>📱 {persona.phone}</p>}
        {persona.location && <p>📍 {persona.location}</p>}
        {persona.linkedin_url && (
          <a href={persona.linkedin_url} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:underline">
            <Link size={10}/> LinkedIn
          </a>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Assigned to: <span className="font-medium text-gray-600">{persona.assignee?.name || 'Unassigned'}</span>
        </p>
        {canEdit && (
          <div className="flex gap-1">
            <button onClick={() => onEdit(persona)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
              <Pencil size={13} />
            </button>
            <button onClick={() => onDelete(persona)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {persona.notes && (
        <p className="mt-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 italic">{persona.notes}</p>
      )}
    </div>
  )
}

export default function Personas() {
  const { user } = useAuth()
  const [personas, setPersonas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const canEdit = isSuperAdmin(user)

  useEffect(() => { loadPersonas() }, [user])

  const loadPersonas = async () => {
    setLoading(true)
    try {
      const data = isSuperAdmin(user) || isViewAdmin(user)
        ? await personaService.getAllPersonas()
        : await personaService.getPersonasByUser(user.id)
      setPersonas(data || [])
    } catch (e) { console.error('loadPersonas error:', e); setPersonas([]) }
    finally { setLoading(false) }
  }

  const handleCreate = async (data, file) => {
    setSaving(true)
    try {
      const persona = await personaService.createPersona(data, user.id)
      if (file) {
        const url = await personaService.uploadResume(file, persona.id)
        await personaService.updatePersona(persona.id, { resume_url: url })
      }
      toast.success('Persona created!')
      setShowForm(false)
      loadPersonas()
    } catch (e) { console.error('createPersona error:', e); toast.error(e?.message || 'Failed to create persona') }
    finally { setSaving(false) }
  }

  const handleUpdate = async (data, file) => {
    setSaving(true)
    try {
      let updates = { ...data }
      if (file) {
        updates.resume_url = await personaService.uploadResume(file, editTarget.id)
      }
      await personaService.updatePersona(editTarget.id, updates)
      toast.success('Persona updated!')
      setEditTarget(null)
      loadPersonas()
    } catch (e) { console.error('updatePersona error:', e); toast.error(e?.message || 'Failed to update persona') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await personaService.deletePersona(deleteTarget.id)
      setPersonas(prev => prev.filter(p => p.id !== deleteTarget.id))
      toast.success('Persona deleted')
    } catch (e) { console.error('deletePersona error:', e); toast.error(e?.message || 'Failed to delete') }
    finally { setDeleteTarget(null) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage professional identity accounts</p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} /> New Persona
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : personas.length === 0 ? (
        <EmptyState icon={User} title="No personas yet"
          description="Create and assign professional identity accounts to team members."
          action={canEdit && <Button onClick={() => setShowForm(true)}><Plus size={16}/>Create Persona</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.map(p => (
            <PersonaCard key={p.id} persona={p}
              onEdit={setEditTarget} onDelete={setDeleteTarget} canEdit={canEdit} />
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Create Persona" size="lg">
        <PersonaForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} loading={saving} />
      </Modal>

      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Persona" size="lg">
        {editTarget && (
          <PersonaForm initial={editTarget} onSubmit={handleUpdate}
            onCancel={() => setEditTarget(null)} loading={saving} />
        )}
      </Modal>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} title="Delete Persona"
        message={`Delete persona "${deleteTarget?.full_name}"? This cannot be undone.`}
      />
    </div>
  )
}
