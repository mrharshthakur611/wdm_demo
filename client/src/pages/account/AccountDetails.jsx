import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

function Field({ label, value, onChange, name, required = false, type = 'text', autoComplete }) {
  return (
    <label className="block space-y-1">
      <div className="text-[12px] font-semibold text-on-surface-variant">
        {label}{required ? ' *' : ''}
      </div>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl outline-none focus:ring-2 focus:ring-primary text-[14px]"
      />
    </label>
  )
}

export default function AccountDetails() {
  const { user, token, updateUser } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    }))
  }, [user?.name, user?.email, user?.phone])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const trimmedName = form.name.trim()
    const trimmedEmail = form.email.trim()

    if (!trimmedName || !trimmedEmail) {
      setError('Please fill all required fields.')
      return
    }

    const wantsPasswordChange = Boolean(form.currentPassword || form.newPassword || form.confirmPassword)
    if (wantsPasswordChange) {
      if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
        setError('Please fill all password fields.')
        return
      }
      if (form.newPassword.length < 8) {
        setError('New password must be at least 8 characters.')
        return
      }
      if (form.newPassword !== form.confirmPassword) {
        setError('New password and confirmation do not match.')
        return
      }
    }

    try {
      setSaving(true)
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          phone: form.phone.trim(),
          ...(wantsPasswordChange
            ? { currentPassword: form.currentPassword, newPassword: form.newPassword }
            : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to update account details')
      updateUser(data.user)
      setForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
      setSuccess('Account details updated.')
    } catch (err) {
      setError(err.message || 'Failed to update account details')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 space-y-5">
      <div className="font-semibold text-on-surface">Account details</div>

      {error && (
        <div className="p-3 bg-error-container text-on-error-container rounded-xl font-semibold text-[13px]">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-primary-container text-on-primary-container rounded-xl font-semibold text-[13px]">{success}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Name" name="name" value={form.name} onChange={onChange} required autoComplete="name" />
        <Field label="Email" name="email" value={form.email} onChange={onChange} required type="email" autoComplete="email" />
        <Field label="Phone" name="phone" value={form.phone} onChange={onChange} autoComplete="tel" />
      </div>

      <div className="border-t border-outline-variant/20 pt-5 space-y-4">
        <div className="font-semibold text-on-surface">Password change</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Current password" name="currentPassword" value={form.currentPassword} onChange={onChange} type="password" autoComplete="current-password" />
          <div className="hidden md:block" />
          <Field label="New password" name="newPassword" value={form.newPassword} onChange={onChange} type="password" autoComplete="new-password" />
          <Field label="Confirm new password" name="confirmPassword" value={form.confirmPassword} onChange={onChange} type="password" autoComplete="new-password" />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-semibold border-none cursor-pointer disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  )
}

