import { useState } from 'react'

function LoginRegister() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="authPage">
      <div className="authCard">
        <div className="authTabs">
          <button 
            className={`authTab ${isLogin ? 'active' : ''}`} 
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            className={`authTab ${!isLogin ? 'active' : ''}`} 
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        {isLogin ? (
          <form className="authForm">
            <div className="formGroup">
              <label className="formLabel">Email</label>
              <input type="email" className="formInput" placeholder="Enter your email" />
            </div>
            <div className="formGroup">
              <label className="formLabel">Password</label>
              <input type="password" className="formInput" placeholder="Enter your password" />
            </div>
            <button type="submit" className="authBtn">Login</button>
          </form>
        ) : (
          <form className="authForm">
            <div className="formGroup">
              <label className="formLabel">Name</label>
              <input type="text" className="formInput" placeholder="Enter your name" />
            </div>
            <div className="formGroup">
              <label className="formLabel">Email</label>
              <input type="email" className="formInput" placeholder="Enter your email" />
            </div>
            <div className="formGroup">
              <label className="formLabel">Phone</label>
              <input type="tel" className="formInput" placeholder="Enter your phone number" />
            </div>
            <div className="formGroup">
              <label className="formLabel">Password</label>
              <input type="password" className="formInput" placeholder="Create a password" />
            </div>
            <button type="submit" className="authBtn">Register</button>
          </form>
        )}
      </div>
    </div>
  )
}

export default LoginRegister
