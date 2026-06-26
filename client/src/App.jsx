import './App.css'
import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Grocery from './pages/Grocery'
import Food from './pages/Food'
import Essentials from './pages/Essentials'
import Bakery from './pages/Bakery'
import LoginRegister from './pages/LoginRegister'
import Cart from './pages/Cart'
import ProductPage from './pages/ProductPage'

function formatInr(value) {
  if (typeof value !== 'number') return ''
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function Header({ toggleSidebar }) {
  return (
    <header className="header">
      <div className="container headerTop">
        <div className="headerLeft"></div>
        <div className="headerTopLinks">
          <a href="#about" className="headerLink">About Us</a>
          <a href="#contact" className="headerLink">Contact Us</a>
        </div>
        <div className="headerTopRight">
          <a className="headerIcon" href="tel:7420097008" aria-label="Phone">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>7420097008</span>
          </a>
          <a className="headerIcon" href="#wishlist" aria-label="Wishlist">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Wishlist</span>
          </a>
          <Link to="/login" className="headerIcon" aria-label="Login">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Login / Register</span>
          </Link>
        </div>
      </div>
      <div className="container headerRow">
        <button className="hamburgerBtn" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <span className="hamburgerLine"></span>
          <span className="hamburgerLine"></span>
          <span className="hamburgerLine"></span>
        </button>
        <Link to="/" style={{ textDecoration: 'none' }} className="brand">
          <img src="/logo.png" alt="We Deliver Mussoorie" className="brandLogo" />
        </Link>

        <div className="search">
          <svg className="searchIcon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <input
            className="searchInput"
            placeholder="Search for products..."
            aria-label="Search"
          />
        </div>

        <Link to="/cart" className="cartBtn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9" cy="21" r="1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="20" cy="21" r="1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </Link>
      </div>
    </header>
  )
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <BrowserRouter>
      <div className="page">
        <Header toggleSidebar={toggleSidebar} />
        <div className="container mainLayout">
          <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
          {sidebarOpen && <div className="sidebarOverlay" onClick={closeSidebar}></div>}
          <main className="mainContent">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/grocery" element={<Grocery />} />
            <Route path="/food" element={<Food />} />
            <Route path="/essentials" element={<Essentials />} />
            <Route path="/bakery" element={<Bakery />} />
            <Route path="/login" element={<LoginRegister />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/product/:productId" element={<ProductPage />} />
          </Routes>
        </main>
        </div>
        <footer className="footer">
          <div className="container footerRow">
            <div>© {new Date().getFullYear()} We Deliver Mussoorie</div>
            <div className="footerLinks">
              <a href="#about">About Us</a>
              <a href="#contact">Contact Us</a>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
