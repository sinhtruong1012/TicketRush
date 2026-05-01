import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import api from '../../api/client';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const searchContainerRef = useRef(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        setIsSuggesting(false);
        return;
      }
      setIsSuggesting(true);
      try {
        const data = await api.getEvents(`search=${encodeURIComponent(searchQuery.trim())}`);
        setSuggestions(data.events.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
        setSuggestions([]);
      } finally {
        setIsSuggesting(false);
      }
    };

    const timerId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timerId);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`/events`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = user?.role === 'admin';
  const isCustomer = !isAdmin;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const { openAuthModal } = useAuth();

  const navCls = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;
  const adminNavCls = ({ isActive }) => `nav-link nav-link--admin${isActive ? ' active' : ''}`;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <NavLink to="/" className="navbar-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-text">TicketRush</span>
        </NavLink>

        {!isAdmin && (
          <div className="nav-search-container" ref={searchContainerRef}>
            <form className="nav-search-form" onSubmit={handleSearch}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" width="18" height="18">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input 
                className="nav-search-input" 
                placeholder="Bạn tìm gì hôm nay?" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim()) setShowSuggestions(true);
                }}
              />
              <div className="nav-search-divider"></div>
              <button type="submit" className="nav-search-btn">Tìm kiếm</button>
            </form>

            {showSuggestions && searchQuery.trim() && (
              <div className="nav-search-suggestions">
                {isSuggesting ? (
                  <div className="nav-suggestion-loading">Đang tìm kiếm...</div>
                ) : suggestions.length > 0 ? (
                  suggestions.map(event => (
                    <NavLink 
                      key={event.id} 
                      to={`/events/${event.id}`}
                      className="nav-suggestion-item"
                      onClick={() => {
                        setShowSuggestions(false);
                        setSearchQuery('');
                      }}
                    >
                      <div 
                        className="nav-suggestion-thumb" 
                        style={{ background: `linear-gradient(135deg, ${event.sections?.[0]?.colorCode || '#e53e3e'}33, #f8f8f6)` }}
                      >
                        <span className="nav-suggestion-category">{event.category}</span>
                      </div>
                      <div className="nav-suggestion-info">
                        <p className="nav-suggestion-title">{event.title}</p>
                        <p className="nav-suggestion-date">
                          {new Date(event.eventDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </NavLink>
                  ))
                ) : (
                  <div className="nav-suggestion-empty">Không tìm thấy sự kiện nào</div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="navbar-links">
          {isCustomer && (
            <>
              <NavLink to="/events" className={navCls}>Sự kiện</NavLink>
              {user && <NavLink to="/my-tickets" className={navCls}>Vé của tôi</NavLink>}
            </>
          )}
          {isAdmin && (
            <>
              <NavLink to="/admin" className={adminNavCls}>Trang quản trị</NavLink>
            </>
          )}

          {/* Dark mode toggle */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            )}
          </button>
          {user ? (
            <div className="nav-user" ref={dropdownRef}>
              <div
                className={`nav-user-profile ${isDropdownOpen ? 'active' : ''}`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`}
                  alt="Avatar"
                  className="nav-avatar"
                />
                <span className="nav-user-name">Tài khoản</span>
                <span className="nav-dropdown-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </div>

              {isDropdownOpen && (
                <div className="nav-dropdown">
                  <NavLink to="/my-tickets" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                    <span className="dropdown-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>
                    </span> Vé của tôi
                  </NavLink>
                  <NavLink to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                    <span className="dropdown-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </span> Tài khoản của tôi
                  </NavLink>


                  <button onClick={handleLogout} className="dropdown-item logout">
                    <span className="dropdown-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                    </span> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="nav-auth">
              <button onClick={() => openAuthModal('login')} className="btn-login" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Đăng nhập</button>
              <button onClick={() => openAuthModal('register')} className="btn-register" style={{ background: 'var(--accent-primary)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 600, color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '8px', marginLeft: '1rem' }}>Đăng ký</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
