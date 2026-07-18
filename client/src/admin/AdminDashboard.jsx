import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { useAuth } from '../context/AuthContext'

const statIcons = {
  users: 'group',
  products: 'inventory_2',
  orders: 'list_alt',
  revenue: 'payments'
}

const quickLinks = [
  { to: '/admin/products', label: 'Manage Products', sub: 'Add, edit, remove products', icon: statIcons.products, color: 'text-yellow-600 bg-yellow-100' },
  { to: '/admin/orders', label: 'Manage Orders', sub: 'Update order statuses', icon: statIcons.orders, color: 'text-green-600 bg-green-100' },
  { to: '/admin/users', label: 'Manage Users', sub: 'Control user roles', icon: statIcons.users, color: 'text-blue-600 bg-blue-100' },
]

function StatCard({ icon, label, value, colorClass, prefix = '' }) {
  const colorStyles = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600'
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl shadow-sm flex items-center gap-4">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${colorStyles[colorClass]}`}>
        <span className="material-symbols-outlined text-[28px]">{icon}</span>
      </div>
      <div>
        <div className="text-on-surface-variant font-semibold text-[13px] uppercase tracking-wide">{label}</div>
        <div className="text-on-background font-headline-md font-bold mt-1 leading-none">{prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const s = status?.toLowerCase().replace(' ', '')
  const getBadgeStyle = () => {
    switch(s) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
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

export default function AdminDashboard() {
  const { token } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => { setError('Failed to load stats'); setLoading(false) })
  }, [token])

  return (
    <AdminLayout title="Dashboard">
      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-6 font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-[40px] mb-4">refresh</span>
          <p className="font-semibold text-[16px]">Loading dashboard...</p>
        </div>
      ) : stats && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard icon={statIcons.users} label="Total Users" value={stats.totalUsers} colorClass="blue" />
            <StatCard icon={statIcons.products} label="Total Products" value={stats.totalProducts} colorClass="yellow" />
            <StatCard icon={statIcons.orders} label="Total Orders" value={stats.totalOrders} colorClass="green" />
            <StatCard icon={statIcons.revenue} label="Total Revenue" value={stats.totalRevenue} colorClass="red" prefix="₹" />
          </div>

          {/* Recent Orders */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface/50">
              <h2 className="font-headline-sm m-0 text-on-background">Recent Orders</h2>
              <Link to="/admin/orders" className="text-primary font-semibold hover:underline text-[14px] flex items-center gap-1">
                View All <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              {stats.recentOrders?.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center text-on-surface-variant">
                  <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[32px] opacity-50">{statIcons.orders}</span>
                  </div>
                  <h3 className="font-headline-sm m-0 text-on-background mb-2">No orders yet</h3>
                  <p className="m-0">Orders will appear here once customers start purchasing.</p>
                </div>
              ) : (
                <table className="w-full min-w-[800px] text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant text-[12px] uppercase tracking-wider border-b border-outline-variant/30">
                      <th className="p-4 font-semibold">Order ID</th>
                      <th className="p-4 font-semibold">Customer</th>
                      <th className="p-4 font-semibold">Items</th>
                      <th className="p-4 font-semibold">Amount</th>
                      <th className="p-4 font-semibold">Payment</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 text-[14px]">
                    {stats.recentOrders.map(order => (
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
                        <td className="p-4"><StatusBadge status={order.paymentStatus} /></td>
                        <td className="p-4"><StatusBadge status={order.status} /></td>
                        <td className="p-4 text-on-surface-variant text-right">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {quickLinks.map(card => (
              <Link to={card.to} key={card.to} className="flex items-center gap-4 bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl shadow-sm hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer no-underline group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.color} group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined">{card.icon}</span>
                </div>
                <div>
                  <div className="font-bold text-on-background group-hover:text-primary transition-colors">{card.label}</div>
                  <div className="text-on-surface-variant text-[13px]">{card.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
