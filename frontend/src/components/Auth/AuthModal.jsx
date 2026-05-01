import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useFormValidation, RULES } from '../../hooks/useFormValidation';
import { formatPhoneInput } from '../../utils/formatInput';
import './AuthModal.css';

// Validation schemas
const registerSchema = {
  fullName: [RULES.required],
  email: [RULES.required, RULES.email],
  password: [RULES.required, RULES.minLength(8), RULES.hasUpper, RULES.hasLower, RULES.hasNumber, RULES.hasSpecial],
  phone: [RULES.phone],
  gender: [RULES.required],
  birthDate: [RULES.required],
};

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
  const { errors, touched, validate, touchField } = useFormValidation(registerSchema);

  // Password strength indicator
  const getPasswordStrength = (pw) => {
    if (!pw) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[!@#$%^&*(),.?":{}|<>_-]/.test(pw)) score++;

    if (score <= 2) return { level: score, label: 'Yếu', color: '#ef4444' };
    if (score === 3) return { level: score, label: 'Trung bình', color: '#f59e0b' };
    if (score === 4) return { level: score, label: 'Khá', color: '#3b82f6' };
    return { level: score, label: 'Mạnh', color: '#22c55e' };
  };

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

    if (!validate(regForm)) return;

    setLoading(true);
    try {
      // Send clean phone digits to backend
      const payload = { ...regForm, phone: regForm.phone.replace(/\D/g, '') };
      await register(payload);
      closeAuthModal();
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const updateReg = (field) => (e) => {
    let value = e.target.value;

    // Phone mask
    if (field === 'phone') {
      value = formatPhoneInput(value);
    }

    setRegForm(prev => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field) => () => {
    touchField(field, regForm[field]);
  };

  const pwStrength = getPasswordStrength(regForm.password);

  // Helper: show field error only when touched
  const fieldError = (field) => touched[field] && errors[field] ? errors[field] : '';

  return (
    <div className="auth-modal-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal-content card">
        <button className="auth-modal-close" onClick={closeAuthModal}>×</button>

        {authModalMode === 'login' ? (
          <div className="auth-modal-body">
            <h2 className="auth-modal-title">Đăng nhập</h2>
            <p className="auth-modal-subtitle">Chào mừng trở lại TicketRush</p>

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

            <form onSubmit={handleRegisterSubmit} noValidate>
              <div className="form-group">
                <label className="form-label">Họ và tên *</label>
                <input
                  type="text"
                  className={`form-input ${fieldError('fullName') ? 'form-input--error' : ''}`}
                  value={regForm.fullName}
                  onChange={updateReg('fullName')}
                  onBlur={handleBlur('fullName')}
                  placeholder="Nguyễn Văn A"
                />
                {fieldError('fullName') && <span className="field-error">{fieldError('fullName')}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className={`form-input ${fieldError('email') ? 'form-input--error' : ''}`}
                  value={regForm.email}
                  onChange={updateReg('email')}
                  onBlur={handleBlur('email')}
                  placeholder="email@example.com"
                />
                {fieldError('email') && <span className="field-error">{fieldError('email')}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Mật khẩu *</label>
                <input
                  type="password"
                  className={`form-input ${fieldError('password') ? 'form-input--error' : ''}`}
                  value={regForm.password}
                  onChange={updateReg('password')}
                  onBlur={handleBlur('password')}
                  placeholder="••••••••"
                />
                
                {/* Password Requirements Checklist */}
                <div className="pw-requirements">
                  <div className={`pw-req-item ${regForm.password.length >= 8 ? 'pw-req-met' : ''}`}>
                    <span className="pw-req-icon">{regForm.password.length >= 8 ? '✓' : '○'}</span> Tối thiểu 8 ký tự
                  </div>
                  <div className={`pw-req-item ${/[A-Z]/.test(regForm.password) ? 'pw-req-met' : ''}`}>
                    <span className="pw-req-icon">{/[A-Z]/.test(regForm.password) ? '✓' : '○'}</span> Ít nhất 1 chữ hoa
                  </div>
                  <div className={`pw-req-item ${/[a-z]/.test(regForm.password) ? 'pw-req-met' : ''}`}>
                    <span className="pw-req-icon">{/[a-z]/.test(regForm.password) ? '✓' : '○'}</span> Ít nhất 1 chữ thường
                  </div>
                  <div className={`pw-req-item ${/[0-9]/.test(regForm.password) ? 'pw-req-met' : ''}`}>
                    <span className="pw-req-icon">{/[0-9]/.test(regForm.password) ? '✓' : '○'}</span> Ít nhất 1 chữ số
                  </div>
                  <div className={`pw-req-item ${/[!@#$%^&*(),.?":{}|<>_-]/.test(regForm.password) ? 'pw-req-met' : ''}`}>
                    <span className="pw-req-icon">{/[!@#$%^&*(),.?":{}|<>_-]/.test(regForm.password) ? '✓' : '○'}</span> Ít nhất 1 ký tự đặc biệt
                  </div>
                </div>

                {fieldError('password') && <span className="field-error">{fieldError('password')}</span>}
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Số điện thoại</label>
                  <input
                    type="tel"
                    className={`form-input ${fieldError('phone') ? 'form-input--error' : ''}`}
                    value={regForm.phone}
                    onChange={updateReg('phone')}
                    onBlur={handleBlur('phone')}
                    placeholder="0901 234 567"
                  />
                  {fieldError('phone') && <span className="field-error">{fieldError('phone')}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Giới tính *</label>
                  <select
                    className={`form-input ${fieldError('gender') ? 'form-input--error' : ''}`}
                    value={regForm.gender}
                    onChange={updateReg('gender')}
                    onBlur={handleBlur('gender')}
                  >
                    <option value="">Chọn</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                  {fieldError('gender') && <span className="field-error">{fieldError('gender')}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ngày sinh *</label>
                <input
                  type="date"
                  className={`form-input ${fieldError('birthDate') ? 'form-input--error' : ''}`}
                  value={regForm.birthDate}
                  onChange={updateReg('birthDate')}
                  onBlur={handleBlur('birthDate')}
                />
                {fieldError('birthDate') && <span className="field-error">{fieldError('birthDate')}</span>}
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
