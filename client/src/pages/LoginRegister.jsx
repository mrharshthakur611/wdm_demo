import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function LoginRegister() {
  const [isLogin, setIsLogin] = useState(true)
  const { login } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  })
  
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)
  const [warmingUp, setWarmingUp] = useState(false)

  // OTP Verification States
  const [showOtp, setShowOtp] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [otpValue, setOtpValue] = useState('')

  // Ping /api/health repeatedly until the server wakes up
  async function waitForServer() {
    const maxWait = 100000 // 100 seconds
    const interval = 3000  // retry every 3 seconds
    const start = Date.now()

    while (Date.now() - start < maxWait) {
      try {
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), 5000)
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/health`, { signal: ctrl.signal })
        clearTimeout(t)
        if (res.ok) return true
      } catch {
        // not ready yet — keep waiting
      }
      await new Promise(r => setTimeout(r, interval))
    }
    return false
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, otp: otpValue })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed')
      }

      setSuccess('Email verified successfully! You can now log in.')
      setShowOtp(false)
      setIsLogin(true)
      setOtpValue('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP')
      }

      setSuccess('A new verification code has been sent to your email.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setWarmingUp(false)
    setLoading(true)

    // Step 1: Quick health check — if it fails, the server is cold-starting
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 5000)
      const healthRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/health`, { signal: ctrl.signal })
      clearTimeout(t)
      if (!healthRes.ok) throw new Error('unhealthy')
    } catch {
      // Server is starting up — show a friendly waiting message
      setWarmingUp(true)
      const serverUp = await waitForServer()
      setWarmingUp(false)
      if (!serverUp) {
        setError('Server is unavailable right now. Please try again in a minute.')
        setLoading(false)
        return
      }
    }

    // Step 2: Actual API call (90s timeout to survive any Render delays)
    const endpoint = isLogin ? `${import.meta.env.VITE_API_URL || ''}/api/auth/login` : `${import.meta.env.VITE_API_URL || ''}/api/auth/register`
    const body = isLogin
      ? { email: formData.email, password: formData.password }
      : formData

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 90000)

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      })
      clearTimeout(timer)

      let data
      try {
        data = await response.json()
      } catch {
        throw new Error('Server returned an unexpected response. Please try again.')
      }

      if (!response.ok) {
        // If unverified, switch to OTP view
        if (data.unverified) {
          setOtpEmail(formData.email)
          setShowOtp(true)
          throw new Error(data.message)
        }
        throw new Error(data.message || 'Something went wrong')
      }

      if (isLogin) {
        login(data.user, data.token)
        navigate('/')
      } else {
        // On successful registration, prompt for OTP
        setOtpEmail(formData.email)
        setShowOtp(true)
        setSuccess('Registered successfully! Please check your email for the verification code.')
        setFormData({ name: '', email: formData.email, phone: '', password: '' })
      }
    } catch (err) {
      clearTimeout(timer)
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.')
      } else if (
        err.message.includes('string did not match') ||
        err.message.includes('Failed to fetch') ||
        err.message.includes('NetworkError') ||
        err.message.includes('Load failed')
      ) {
        setError('Network error — please check your connection and try again.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="w-full px-4 py-12 md:py-20 flex items-center justify-center min-h-[calc(100vh-400px)]">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/20 overflow-hidden">
        
        {/* Header / Logo Area */}
        <div className="bg-surface-container-low p-6 text-center border-b border-outline-variant/30 flex flex-col items-center">
          <Link to="/" className="inline-block mb-4">
            <span className="material-symbols-outlined text-primary text-[40px]">delivery_dining</span>
          </Link>
          <h2 className="font-headline-md text-on-background m-0">Welcome Back</h2>
          <p className="text-on-surface-variant text-label-md mt-1">Sign in to manage your orders</p>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {!showOtp && (
            <div className="flex bg-surface-container rounded-xl p-1">
              <button 
                className={`flex-1 py-2.5 rounded-lg text-label-md font-semibold transition-all border-none cursor-pointer ${isLogin ? 'bg-surface-container-lowest shadow-sm text-on-background' : 'bg-transparent text-on-surface-variant hover:text-on-background'}`} 
                onClick={() => { setIsLogin(true); setError(null); setSuccess(null); }}
              >
                Login
              </button>
              <button 
                className={`flex-1 py-2.5 rounded-lg text-label-md font-semibold transition-all border-none cursor-pointer ${!isLogin ? 'bg-surface-container-lowest shadow-sm text-on-background' : 'bg-transparent text-on-surface-variant hover:text-on-background'}`} 
                onClick={() => { setIsLogin(false); setError(null); setSuccess(null); }}
              >
                Register
              </button>
            </div>
          )}

          {/* Server warm-up banner */}
          {warmingUp && (
            <div className="bg-[#fff3cd] text-[#856404] px-4 py-3 rounded-xl text-[14px] flex items-center gap-2 border border-[#ffc107]">
              <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
              Server is waking up, please wait… (this takes ~30–60 seconds on first use)
            </div>
          )}

          {/* Success banner */}
          {success && (
            <div className="bg-[#d4edda] text-[#155724] px-4 py-3 rounded-xl text-[14px] flex items-center gap-2 border border-[#c3e6cb]">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {success}
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="bg-error-container text-on-error-container px-4 py-3 rounded-xl text-[14px] flex items-center gap-2">
               <span className="material-symbols-outlined text-[18px]">error</span>
               {error}
            </div>
          )}

          {showOtp ? (
            <form className="space-y-4" onSubmit={handleOtpSubmit}>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-semibold text-on-background pl-1">Verification Code</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">password</span>
                  <input type="text" name="otp" value={otpValue} onChange={(e) => setOtpValue(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[15px]" placeholder="Enter 6-digit OTP" />
                </div>
              </div>
              <div className="pt-2 flex flex-col gap-3">
                <button type="submit" className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-semibold text-[16px] hover:brightness-95 transition-all shadow-md shadow-primary/20 border-none cursor-pointer flex items-center justify-center gap-2" disabled={loading}>
                  {loading ? (
                    <><span className="material-symbols-outlined animate-spin text-[20px]">refresh</span> Processing...</>
                  ) : (
                    'Verify Email'
                  )}
                </button>
                <button type="button" onClick={handleResendOtp} disabled={loading} className="w-full py-3.5 bg-surface-container text-on-surface rounded-xl font-semibold text-[16px] hover:bg-surface-container-high transition-all border-none cursor-pointer flex items-center justify-center gap-2">
                  Resend Code
                </button>
                <button type="button" onClick={() => { setShowOtp(false); setError(null); setSuccess(null); }} className="w-full text-primary font-semibold text-[14px] cursor-pointer bg-transparent border-none hover:underline">
                  Back to Login
                </button>
              </div>
            </form>
          ) : isLogin ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-semibold text-on-background pl-1">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">mail</span>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[15px]" placeholder="Enter your email" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-semibold text-on-background pl-1">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock</span>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[15px]" placeholder="Enter your password" />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-semibold text-[16px] hover:brightness-95 transition-all shadow-md shadow-primary/20 border-none cursor-pointer flex items-center justify-center gap-2" disabled={loading}>
                  {loading ? (
                    <><span className="material-symbols-outlined animate-spin text-[20px]">refresh</span> {warmingUp ? 'Waking up server…' : 'Processing...'}</>
                  ) : (
                    'Login to Account'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-semibold text-on-background pl-1">Full Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">person</span>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[15px]" placeholder="Enter your name" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-semibold text-on-background pl-1">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">mail</span>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[15px]" placeholder="Enter your email" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-semibold text-on-background pl-1">Phone Number</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">call</span>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[15px]" placeholder="Enter your phone number" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-semibold text-on-background pl-1">Create Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock</span>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength="8" className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[15px]" placeholder="Create a password (min 8 chars)" />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-semibold text-[16px] hover:brightness-95 transition-all shadow-md shadow-primary/20 border-none cursor-pointer flex items-center justify-center gap-2" disabled={loading}>
                  {loading ? (
                    <><span className="material-symbols-outlined animate-spin text-[20px]">refresh</span> {warmingUp ? 'Waking up server…' : 'Processing...'}</>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}

export default LoginRegister
