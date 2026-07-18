import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import { useAuth } from '../context/AuthContext'

export default function AdminUsers() {
  const { token, user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [togglingId, setTogglingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setUsers(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setError('Failed to load users'); setLoading(false) })
  }, [token])

  const handleToggleAdmin = async (userId, name) => {
    if (!window.confirm(`Toggle admin status for "${name}"?`)) return
    setTogglingId(userId)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/users/${userId}/toggle-admin`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isAdmin: data.user.isAdmin } : u))
    } catch (err) {
      alert(err.message)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Permanently delete user "${name}"? This cannot be undone.`)) return
    setDeletingId(userId)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setUsers(prev => prev.filter(u => u._id !== userId))
    } catch (err) {
      alert(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const adminCount = users.filter(u => u.isAdmin).length

  return (
    <AdminLayout title="Users">
      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-6 font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface/50">
          <div className="flex items-center gap-3">
            <h2 className="font-headline-sm m-0 text-on-background">All Users</h2>
            <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-[13px] font-bold">{filtered.length} users · {adminCount} admins</span>
          </div>
          <div className="relative w-full sm:w-auto">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input 
              placeholder="Search by name or email..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-full focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[14px]"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-[40px] mb-4">refresh</span>
              <p className="font-semibold text-[16px]">Loading users...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center text-on-surface-variant mt-10">
              <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[40px] opacity-50">group</span>
              </div>
              <h3 className="font-headline-sm m-0 text-on-background mb-2">No users found</h3>
              <p className="m-0 max-w-md">{search ? 'Try a different search term.' : 'No users registered yet.'}</p>
            </div>
          ) : (
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-[12px] uppercase tracking-wider border-b border-outline-variant/30">
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Phone</th>
                  <th className="p-4 font-semibold">Role</th>
                  <th className="p-4 font-semibold text-right">Joined</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-[14px]">
                {filtered.map(user => {
                  const isSelf = user._id === currentUser?.id
                  return (
                    <tr key={user._id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[16px] shrink-0 ${user.isAdmin ? 'bg-primary text-on-primary' : 'bg-secondary-container text-on-secondary-container'}`}>
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-on-background flex items-center gap-2">
                              {user.name}
                              {isSelf && <span className="bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">YOU</span>}
                            </div>
                            <div className="text-on-surface-variant text-[12px]">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-on-surface-variant">{user.phone || '—'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[12px] font-semibold border ${user.isAdmin ? 'bg-primary-container/50 text-on-primary-container border-primary/20' : 'bg-surface-container-high text-on-surface-variant border-outline-variant/30'}`}>
                          {user.isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="p-4 text-on-surface-variant text-right">
                        {new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="px-3 py-1.5 rounded-lg font-semibold text-[13px] bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors border-none cursor-pointer flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleToggleAdmin(user._id, user.name)}
                            disabled={isSelf || togglingId === user._id}
                            title={isSelf ? "Cannot change your own role" : (user.isAdmin ? "Remove Admin" : "Make Admin")}
                          >
                            {togglingId === user._id ? <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[16px]">{user.isAdmin ? 'person_remove' : 'admin_panel_settings'}</span>}
                            {user.isAdmin ? 'Demote' : 'Promote'}
                          </button>
                          <button
                            className="px-3 py-1.5 rounded-lg font-semibold text-[13px] bg-error-container text-error hover:bg-error-container/80 transition-colors border-none cursor-pointer flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleDelete(user._id, user.name)}
                            disabled={isSelf || deletingId === user._id}
                            title={isSelf ? "Cannot delete yourself" : "Delete User"}
                          >
                            {deletingId === user._id ? <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[16px]">delete</span>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
