import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || '',
        phone: user.phone || '',
        gender: user.gender || 'other',
        birthDate: user.birthDate || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    setIsSaving(true);
    setMessage('');
    setErrorMsg('');

    const formData = new FormData();
    formData.append('fullName', data.fullName);
    if (data.phone) formData.append('phone', data.phone);
    if (data.gender) formData.append('gender', data.gender);
    if (data.birthDate) formData.append('birthDate', data.birthDate);
    if (avatarFile) formData.append('avatarFile', avatarFile);

    try {
      const res = await api.updateProfile(formData);
      updateUser(res.user);
      setMessage('Cập nhật tài khoản thành công! Đang chuyển hướng...');
      
      // Delay 1.5s để người dùng nhìn thấy thông báo thành công rồi mới chuyển hướng
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
    } catch (err) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi cập nhật.');
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setAvatarPreview(imageUrl);
      setAvatarFile(file);
    }
  };

  if (!user) return <div className="profile-loading">Đang tải...</div>;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h2 className="profile-title">Thông tin tài khoản</h2>

        <div className="profile-avatar-section">
          <div className="profile-avatar">
            <img 
              src={avatarPreview || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`} 
              alt="Avatar" 
            />
            <div className="avatar-upload-btn" onClick={handleAvatarClick}>
              <span>📷</span>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <p className="profile-desc">
            Cung cấp thông tin chính xác sẽ hỗ trợ bạn trong quá trình mua vé, hoặc khi cần xác thực vé
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="profile-form">
          {message && <div className="alert success">{message}</div>}
          {errorMsg && <div className="alert error">{errorMsg}</div>}

          <div className="form-group">
            <label>Họ và tên</label>
            <input 
              type="text" 
              {...register('fullName', { required: 'Họ và tên không được để trống' })} 
              className={errors.fullName ? 'input-error' : ''}
              placeholder="Nhập họ và tên"
            />
            {errors.fullName && <span className="error-text">{errors.fullName.message}</span>}
          </div>

          <div className="form-group">
            <label>Số điện thoại</label>
            <div className="phone-input-group">
              <select className="phone-code" disabled>
                <option>+84</option>
              </select>
              <input 
                type="tel" 
                {...register('phone', { 
                  pattern: {
                    value: /^[0-9]{10,11}$/,
                    message: 'Số điện thoại không hợp lệ'
                  }
                })} 
                placeholder="Nhập ở đây"
              />
            </div>
            {errors.phone && <span className="error-text">{errors.phone.message}</span>}
          </div>

          <div className="form-group">
            <label>Email</label>
            <div className="email-input-wrapper">
              <input 
                type="email" 
                value={user.email} 
                disabled 
                className="disabled-input"
              />
              <span className="email-verified-icon">✅</span>
            </div>
          </div>

          <div className="form-group">
            <label>Ngày tháng năm sinh</label>
            <input 
              type="date" 
              {...register('birthDate')} 
            />
          </div>

          <div className="form-group">
            <label>Giới tính</label>
            <div className="gender-options">
              <label className="radio-label">
                <input type="radio" value="male" {...register('gender')} />
                Nam
              </label>
              <label className="radio-label">
                <input type="radio" value="female" {...register('gender')} />
                Nữ
              </label>
              <label className="radio-label">
                <input type="radio" value="other" {...register('gender')} />
                Khác
              </label>
            </div>
          </div>

          <button type="submit" disabled={isSaving} className="btn-submit">
            {isSaving ? 'Đang lưu...' : 'Hoàn thành'}
          </button>
        </form>
      </div>
    </div>
  );
}
