import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './AuthModal.css';

export default function AuthModal() {
  const { authModalMode, closeAuthModal, login, register, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regForm, setRegForm] = useState({ email: '', password: '', fullName: '', phone: '', gender: '', birthDate: '' });

  // Reset errors when mode changes
  useEffect(() => {
    setError('');
  }, [authModalMode]);

  if (!authModalMode) return null;

  const handleOverlayClick = (e) => {
    if (e.target.className === 'auth-modal-overlay') {
      closeAuthModal();
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(loginEmail, loginPassword);
      closeAuthModal();
      if (data?.user?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const pw = regForm.password;
    if (pw.length < 8) { setError('Mật khẩu tối thiểu 8 ký tự'); return; }
    if (!/[A-Z]/.test(pw)) { setError('Mật khẩu phải có ít nhất 1 chữ hoa'); return; }
    if (!/[a-z]/.test(pw)) { setError('Mật khẩu phải có ít nhất 1 chữ thường'); return; }
    if (!/[0-9]/.test(pw)) { setError('Mật khẩu phải có ít nhất 1 chữ số'); return; }
    if (!/[^A-Za-z0-9]/.test(pw)) { setError('Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%...)'); return; }
    if (!regForm.gender) { setError('Vui lòng chọn giới tính của bạn'); return; }
    if (!regForm.birthDate) { setError('Vui lòng chọn ngày sinh của bạn'); return; }
    setLoading(true);
    try {
      await register(regForm);
      closeAuthModal();
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const updateReg = (field) => (e) => setRegForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="auth-modal-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal-content card">
        <button className="auth-modal-close" onClick={closeAuthModal}>×</button>
        
        {authModalMode === 'login' ? (
          <div className="auth-modal-body">
            <h2 className="auth-modal-title">Đăng nhập</h2>
            <p className="auth-modal-subtitle">Chào mừng trở lại TicketRush ⚡</p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="email@example.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Mật khẩu</label>
                <input type="password" className="form-input" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••" required />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>

            <p className="auth-modal-footer">
              Chưa có tài khoản? <span className="auth-modal-link" onClick={() => openAuthModal('register')}>Đăng ký ngay</span>
            </p>
          </div>
        ) : (
          <div className="auth-modal-body">
            <h2 className="auth-modal-title">Đăng ký</h2>
            <p className="auth-modal-subtitle">Tạo tài khoản để đặt vé</p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label className="form-label">Họ và tên *</label>
                <input type="text" className="form-input" value={regForm.fullName} onChange={updateReg('fullName')} placeholder="Nguyễn Văn A" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" className="form-input" value={regForm.email} onChange={updateReg('email')} placeholder="email@example.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Mật khẩu *</label>
                <input type="password" className="form-input" value={regForm.password} onChange={updateReg('password')} placeholder="≥ 8 ký tự, chữ hoa, số, ký tự đặc biệt" required />
              </div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Số điện thoại</label>
                  <input type="tel" className="form-input" value={regForm.phone} onChange={updateReg('phone')} placeholder="0901234567" />
                </div>
                <div className="form-group">
                  <label className="form-label">Giới tính *</label>
                  <select className="form-input" value={regForm.gender} onChange={updateReg('gender')} required>
                    <option value="">Chọn</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Ngày sinh *</label>
                <input type="date" className="form-input" value={regForm.birthDate} onChange={updateReg('birthDate')} required />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
              </button>
            </form>

            <p className="auth-modal-footer">
              Đã có tài khoản? <span className="auth-modal-link" onClick={() => openAuthModal('login')}>Đăng nhập</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
