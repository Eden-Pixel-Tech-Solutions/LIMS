import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import m1 from '../assets/m1.png';
import m2 from '../assets/m2.png';
import m3 from '../assets/m3.png';
import merilLogo from '../assets/meril.png';
import '../assets/CSS/Login.css';

const API_BASE = 'http://localhost:7005'; // Matches backend port

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    { image: m1, text: 'Innovation for better healthcare' },
    { image: m2, text: 'State-of-the-art diagnostic facilities' },
    { image: m3, text: 'Serving humanity with care' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (e) => {
    setError('');
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store auth data
      if (data.token) localStorage.setItem('hims_token', data.token);
      if (data.branch_id) localStorage.setItem('branch_id', data.branch_id);
      if (data.role) localStorage.setItem('role', data.role);
      if (data.role_level) localStorage.setItem('role_level', data.role_level);
      
      // For LIS Agent specific context
      localStorage.setItem("labId", data.branch_id); 

      navigate('/setup');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── Left Panel: Carousel ── */}
      <aside className="auth-aside" aria-hidden="true">
        <div className="carousel-container">
          {slides.map((slide, index) => (
            <div 
              key={index} 
              className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="carousel-content">
                <div className="carousel-badge">
                  <span className="carousel-badge-dot"></span>
                  Meril LIS — Agent
                </div>
                <p className="carousel-text">{slide.text}</p>
              </div>
            </div>
          ))}
          <div className="carousel-indicators">
            {slides.map((_, index) => (
              <div 
                key={index} 
                className={`indicator ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* ── Right Panel: Form ── */}
      <main className="auth-main">
        <div className="auth-card-container">
          <div className="brand-header">
            <img src={merilLogo} alt="Meril Logo" className="brand-logo-img" />
            <span className="product-name">Meril LIS Agent</span>
            <p className="brand-motto">Machine Connectivity Hub</p>
          </div>

          <div className="auth-card">
            <header className="auth-header">
              <h1 className="auth-title">Agent Login</h1>
              <p className="auth-subtitle">Connect your machines to Meril LIS</p>
            </header>

            {error && (
              <div className="alert alert-error" role="alert">
                {error}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="field-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="field-input"
                  placeholder="admin@test.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ marginTop: '20px' }}>
                <label className="field-label">Password</label>
                <div className="input-with-toggle">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="field-input"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button 
                    type="button" 
                    className="toggle-eye"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-login-new"
                style={{ marginTop: '20px' }}
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Connect Agent'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}