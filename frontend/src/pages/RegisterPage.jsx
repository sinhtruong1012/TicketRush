import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './AuthPages.css';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '', gender: '', birthDate: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Mật khẩu tối thiểu 6 ký tự'); return; }
    if (!form.gender) { setError('Vui lòng chọn giới tính của bạn'); return; }
    if (!form.birthDate) { setError('Vui lòng chọn ngày sinh của bạn'); return; }
    setLoading(true);
    try {
      await register(form);
      navigate('/events');
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1 className="auth-title">Đăng ký</h1>
        <p className="auth-subtitle">Tạo tài khoản để đặt vé</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Họ và tên *</label>
            <input type="text" className="form-input" value={form.fullName} onChange={update('fullName')} placeholder="Nguyễn Văn A" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input type="email" className="form-input" value={form.email} onChange={update('email')} placeholder="email@example.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu *</label>
            <input type="password" className="form-input" value={form.password} onChange={update('password')} placeholder="Tối thiểu 6 ký tự" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <input type="tel" className="form-input" value={form.phone} onChange={update('phone')} placeholder="0901234567" />
            </div>
            <div className="form-group">
              <label className="form-label">Giới tính *</label>
              <select className="form-input" value={form.gender} onChange={update('gender')} required>
                <option value="">Chọn</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Ngày sinh *</label>
            <input type="date" className="form-input" value={form.birthDate} onChange={update('birthDate')} required />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <p className="auth-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
