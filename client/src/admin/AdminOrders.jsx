import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import { useAuth } from '../context/AuthContext'

const ORDER_STATUSES = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

function StatusBadge({ status }) {
  const s = status?.toLowerCase().replace(/\s+/g, '')
  const getBadgeStyle = () => {
    switch(s) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'processing':
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'placed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-surface-container-high text-on-surface-variant border-outline-variant/30'
    }
  }

  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getBadgeStyle()}`}>
      {status}
    </span>
  )
}

function PaymentBadge({ status }) {
  const s = status?.toLowerCase().replace(/\s+/g, '')
  const getBadgeStyle = () => {
    switch(s) {
      case 'paid':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-surface-container-high text-on-surface-variant border-outline-variant/30'
    }
  }

  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getBadgeStyle()}`}>
      {status}
    </span>
  )
}

function OrderDetailModal({ order, onClose, onStatusUpdate }) {
  const { token } = useAuth()
  const [status, setStatus] = useState(order.status)
  const [saving, setSaving] = useState(false)

  const handleStatusSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/orders/${order._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      onStatusUpdate(data)
      onClose()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-on-background/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-surface-container-lowest w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low/50">
          <div className="font-headline-sm m-0 text-on-background flex items-center gap-2">
            Order <span className="font-mono text-primary font-bold">#{order._id.slice(-8).toUpperCase()}</span>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high border-none cursor-pointer text-on-surface-variant transition-colors" onClick={onClose}>
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5">
              <div className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">Customer</div>
              <div className="font-bold text-on-background text-[15px]">{order.user?.name}</div>
              <div className="text-on-surface-variant text-[13px] mt-1">{order.user?.email}</div>
              {order.user?.phone && <div className="text-on-surface-variant text-[13px]">{order.user.phone}</div>}
            </div>

            <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5">
              <div className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">Shipping Address</div>
              <div className="text-[14px] text-on-background leading-relaxed">
                {order.shippingAddress?.fullName && (
                  <>
                    <div className="font-bold">{order.shippingAddress.fullName}</div>
                  </>
                )}
                {order.shippingAddress?.phone && (
                  <div className="text-on-surface-variant text-[13px]">{order.shippingAddress.phone}</div>
                )}
                <div className="mt-2">
                  {(order.shippingAddress?.line1 || order.shippingAddress?.street) && (
                    <div>{order.shippingAddress?.line1 || order.shippingAddress?.street}</div>
                  )}
                  {order.shippingAddress?.line2 && <div>{order.shippingAddress.line2}</div>}
                  {order.shippingAddress?.landmark && <div>{order.shippingAddress.landmark}</div>}
                  <div>
                    {order.shippingAddress?.city}{order.shippingAddress?.city ? ', ' : ''}{order.shippingAddress?.state}{order.shippingAddress?.state ? ' — ' : ''}
                    <span className="font-bold">{order.shippingAddress?.pincode}</span>
                  </div>
                  {order.shippingAddress?.country && <div>{order.shippingAddress.country}</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-outline-variant/30 bg-surface/50">
              <div className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Items</div>
            </div>
            <div className="p-4 space-y-4">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-center pb-4 border-b border-outline-variant/20 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    {(item.image || item.imageUrl) && (
                       <img src={item.image || item.imageUrl} alt={item.name} className="w-12 h-12 rounded object-contain bg-white p-1 border border-outline-variant/30" />
                    )}
                    <div>
                      <div className="font-bold text-on-background text-[14px]">{item.name}</div>
                      <div className="text-on-surface-variant text-[13px]">Qty: {item.quantity} × ₹{item.price}</div>
                    </div>
                  </div>
                  <div className="font-bold text-[15px] text-on-background">₹{item.price * item.quantity}</div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-surface-container-high/50 border-t border-outline-variant/30 flex justify-between items-center">
              <span className="font-bold text-[16px] text-on-background">Total</span>
              <span className="font-headline-sm font-bold text-primary m-0">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5">
            <div className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">Update Status</div>
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-4 py-2 rounded-xl font-bold text-[13px] border-none cursor-pointer transition-all ${
                    status === s 
                      ? 'bg-primary text-on-primary shadow-md shadow-primary/20 scale-105' 
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-outline-variant/30 bg-surface flex justify-end gap-3">
          <button className="px-6 py-2.5 rounded-xl font-semibold text-[15px] border-none bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer" onClick={onClose}>Cancel</button>
          <button className="px-6 py-2.5 rounded-xl font-semibold text-[15px] border-none bg-primary text-on-primary hover:brightness-95 shadow-md shadow-primary/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" onClick={handleStatusSave} disabled={saving}>
            {saving && <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>}
            {saving ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminOrders() {
  const { token } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filterStatus, setFilterStatus] = useState('All')

  useEffect(() => {
    let cancelled = false

    const loadOrders = async () => {
      if (!token) {
        setOrders([])
        setError('Not authenticated')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/orders`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json().catch(() => null)

        if (!res.ok) {
          throw new Error(data?.message || `Failed to load orders (${res.status})`)
        }

        if (cancelled) return

        setOrders(Array.isArray(data) ? data : [])
        setLoading(false)
      } catch (err) {
        if (cancelled) return
        setOrders([])
        setError(err?.message || 'Failed to load orders')
        setLoading(false)
      }
    }

    loadOrders()

    return () => {
      cancelled = true
    }
  }, [token])

  const handleStatusUpdate = (updated) => {
    setOrders(prev => prev.map(o => o._id === updated._id ? updated : o))
  }

  const filtered = orders.filter(o => {
    const matchSearch = o._id.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.email?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'All' || o.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <AdminLayout title="Orders">
      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-6 font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface/50">
          <div className="flex items-center gap-3">
            <h2 className="font-headline-sm m-0 text-on-background">All Orders</h2>
            <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-label-md font-bold">{filtered.length}</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[14px] text-on-background appearance-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="relative w-full sm:w-auto">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input 
                placeholder="Search orders..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-full focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[14px]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-[40px] mb-4">refresh</span>
              <p className="font-semibold text-[16px]">Loading orders...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center text-on-surface-variant mt-10">
              <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[40px] opacity-50">list_alt</span>
              </div>
              <h3 className="font-headline-sm m-0 text-on-background mb-2">No orders found</h3>
              <p className="m-0 max-w-md">{search ? 'Try a different search term or clear the filter.' : 'No orders have been placed yet.'}</p>
            </div>
          ) : (
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-[12px] uppercase tracking-wider border-b border-outline-variant/30">
                  <th className="p-4 font-semibold">Order ID</th>
                  <th className="p-4 font-semibold">Customer</th>
                  <th className="p-4 font-semibold">Items</th>
                  <th className="p-4 font-semibold">Total</th>
                  <th className="p-4 font-semibold">Payment</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Date</th>
                  <th className="p-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-[14px]">
                {filtered.map(order => (
                  <tr key={order._id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="p-4 text-on-surface-variant font-mono">
                      #{order._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-on-background">{order.user?.name || 'Guest'}</div>
                      <div className="text-on-surface-variant text-[12px]">{order.user?.email}</div>
                    </td>
                    <td className="p-4 text-on-surface-variant">{order.items?.length} item(s)</td>
                    <td className="p-4 font-bold text-on-background">₹{order.totalAmount?.toLocaleString('en-IN')}</td>
                    <td className="p-4"><PaymentBadge status={order.paymentStatus} /></td>
                    <td className="p-4"><StatusBadge status={order.status} /></td>
                    <td className="p-4 text-on-surface-variant text-right">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        className="px-3 py-1.5 rounded-lg font-semibold text-[13px] bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors border-none cursor-pointer flex items-center justify-center gap-1 mx-auto" 
                        onClick={() => setSelectedOrder(order)}
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </AdminLayout>
  )
}
