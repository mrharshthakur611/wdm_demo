import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function formatInr(value) {
  if (typeof value !== 'number') return ''
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' })
}

export default function AccountOrders() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orders, setOrders] = useState([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError('')
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Failed to load orders')
        if (!cancelled) setOrders(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load orders')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [token])

  if (loading) {
    return (
      <div className="p-6 bg-surface-container-lowest border border-outline-variant/20 rounded-xl text-on-surface-variant">
        Loading orders...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-error-container text-on-error-container rounded-xl font-semibold">
        {error}
      </div>
    )
  }

  if (!orders.length) {
    return (
      <div className="p-4 bg-primary-container text-on-primary-container rounded-xl border border-outline-variant/20">
        <div className="text-[13px] font-semibold">
          No order has been made yet.{' '}
          <Link to="/" className="underline text-on-primary-container">Browse Products</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-3 text-[12px] font-semibold text-on-surface-variant bg-surface-container-low">
          <div className="col-span-4">Order</div>
          <div className="col-span-3">Date</div>
          <div className="col-span-3">Total</div>
          <div className="col-span-2">Status</div>
        </div>
        {orders.map((o) => (
          <div key={o._id} className="grid grid-cols-12 gap-3 px-4 py-3 border-t border-outline-variant/20 text-[13px]">
            <div className="col-span-4 font-semibold text-on-surface">#{String(o._id).slice(-8)}</div>
            <div className="col-span-3 text-on-surface-variant">{formatDate(o.createdAt)}</div>
            <div className="col-span-3 text-on-surface-variant">{formatInr(o.totalAmount)}</div>
            <div className="col-span-2 text-on-surface-variant">{o.status || 'Pending'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
