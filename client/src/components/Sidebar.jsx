import { Link, useLocation } from 'react-router-dom'

function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const menuItems = [
    { label: 'GROCERY', path: '/grocery' },
    { label: 'FOOD', path: '/food' },
    { label: 'ESSENTIALS', path: '/essentials' },
    { label: 'BAKERY', path: '/bakery' },
  ]

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <nav className="sidebarNav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={`sidebarLink ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
