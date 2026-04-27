import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { formatCurrency } from '../../utils/formatCurrency';
import './AdminPages.css';

export default function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '', description: '', category: 'music',
    venueName: '', venueAddress: '', eventDate: '', saleStartAt: '', posterUrl: '',
  });
  const [sections, setSections] = useState([]);
  const [newSection, setNewSection] = useState({
    name: '', rowsCount: 5, seatsPerRow: 10, price: 500000, colorCode: '#00D4FF',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Convert ISO date string to datetime-local format
  const toLocalInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    api.getEvent(id)
      .then(data => {
        const e = data.event;
        setForm({
          title: e.title ?? '',
          description: e.description ?? '',
          category: e.category ?? 'music',
          venueName: e.venueName ?? '',
          venueAddress: e.venueAddress ?? '',
          eventDate: toLocalInput(e.eventDate),
          saleStartAt: toLocalInput(e.saleStartAt),
          posterUrl: e.posterUrl ?? '',
        });
        setSections(e.sections ?? []);
      })
      .catch(() => setError('Không thể tải dữ liệu sự kiện.'))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  const updateSection = (field) => (e) => setNewSection(prev => ({ ...prev, [field]: e.target.value }));

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.eventDate) { setError('Vui lòng nhập ngày sự kiện.'); return; }
    if (form.saleStartAt && new Date(form.saleStartAt) >= new Date(form.eventDate)) {
      setError('Ngày mở bán phải trước ngày sự kiện.');
      return;
    }
    setSaving(true);
    try {
      await api.updateEvent(id, form);
      showSuccess('Lưu thành công!');
    } catch (err) {
      setError(err.message || 'Lỗi lưu thông tin.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = async () => {
    setError('');
    if (!newSection.name.trim()) { setError('Vui lòng nhập tên khu vực.'); return; }
    try {
      const data = await api.addSection(id, newSection);
      setSections(prev => [...prev, {
        id: Date.now(),
        name: newSection.name,
        rowsCount: Number(newSection.rowsCount),
        seatsPerRow: Number(newSection.seatsPerRow),
        price: newSection.price,
        colorCode: newSection.colorCode,
        seatsCreated: data.seatsCreated,
      }]);
      setNewSection({ name: '', rowsCount: 5, seatsPerRow: 10, price: 500000, colorCode: '#00D4FF' });
      showSuccess(data.message || 'Đã thêm khu vực ghế.');
    } catch (err) {
      setError(err.message || 'Lỗi thêm khu vực.');
    }
  };

  const handlePublish = async () => {
    if (sections.length === 0) {
      setError('Vui lòng thêm ít nhất 1 khu vực ghế trước khi xuất bản.');
      return;
    }
    if (!window.confirm('Xuất bản sự kiện này? Sau khi xuất bản, khán giả có thể xem và đặt vé.')) return;
    setPublishing(true);
    setError('');
    try {
      await api.updateEvent(id, { status: 'published' });
      navigate('/admin/events');
    } catch (err) {
      setError(err.message || 'Lỗi xuất bản.');
      setPublishing(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="admin-page container">
      <div className="page-header">
        <h1 className="page-title">✏️ Chỉnh sửa sự kiện</h1>
        <button
          className="btn btn-gold btn-lg"
          onClick={handlePublish}
          disabled={publishing || sections.length === 0}
          title={sections.length === 0 ? 'Cần có ít nhất 1 khu vực ghế' : ''}
        >
          {publishing ? '⏳ Đang xuất bản...' : '🚀 Xuất bản sự kiện'}
        </button>
      </div>

      {error && <div className="toast toast-error">{error}</div>}
      {success && <div className="toast toast-success">{success}</div>}

      {/* ── Thông tin sự kiện ── */}
      <div className="admin-form card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>📋 Thông tin sự kiện</h2>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Tên sự kiện *</label>
            <input className="form-input" value={form.title} onChange={update('title')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Mô tả</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={update('description')} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Thể loại</label>
              <select className="form-input" value={form.category} onChange={update('category')}>
                <option value="music">Âm nhạc</option>
                <option value="comedy">Hài kịch</option>
                <option value="sports">Thể thao</option>
                <option value="theater">Kịch</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Ngày sự kiện *</label>
              <input type="datetime-local" className="form-input" value={form.eventDate} onChange={update('eventDate')} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Địa điểm *</label>
            <input className="form-input" value={form.venueName} onChange={update('venueName')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Địa chỉ</label>
            <input className="form-input" value={form.venueAddress} onChange={update('venueAddress')} />
          </div>
          <div className="form-group">
            <label className="form-label">Mở bán vé</label>
            <input type="datetime-local" className="form-input" value={form.saleStartAt} onChange={update('saleStartAt')} />
          </div>
          <div className="form-group">
            <label className="form-label">URL Poster (tùy chọn)</label>
            <input className="form-input" value={form.posterUrl} onChange={update('posterUrl')} placeholder="https://example.com/poster.jpg" />
            {form.posterUrl && (
              <img src={form.posterUrl} alt="Preview poster" style={{ marginTop: '0.5rem', width: '120px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }} onError={e => { e.target.style.display = 'none'; }} />
            )}
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '⏳ Đang lưu...' : '💾 Lưu thay đổi'}
          </button>
        </form>
      </div>

      {/* ── Khu vực ghế hiện có ── */}
      <div className="admin-form card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1rem' }}>💺 Khu vực ghế ({sections.length})</h2>
        {sections.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Chưa có khu vực ghế nào.</p>
        ) : (
          <div className="edit-sections-list">
            {sections.map((s, i) => (
              <div key={s.id ?? i} className="edit-section-item">
                <span className="edit-section-dot" style={{ color: s.colorCode }}>●</span>
                <span className="edit-section-name">{s.name}</span>
                <span className="edit-section-meta">
                  {s.rowsCount} hàng × {s.seatsPerRow} ghế
                  {s.seatsCreated != null ? ` — ${s.seatsCreated} ghế tạo` : ''}
                </span>
                <span className="edit-section-price">{formatCurrency(s.price)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Thêm khu vực ghế ── */}
      <div className="admin-form card">
        <h2 style={{ marginBottom: '1rem', fontSize: '1rem' }}>➕ Thêm khu vực ghế mới</h2>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tên khu vực</label>
            <input className="form-input" value={newSection.name} onChange={updateSection('name')} placeholder="VIP-A" />
          </div>
          <div className="form-group">
            <label className="form-label">Màu</label>
            <input type="color" className="form-input" value={newSection.colorCode} onChange={updateSection('colorCode')} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Số hàng</label>
            <input type="number" className="form-input" value={newSection.rowsCount} onChange={updateSection('rowsCount')} min={1} max={50} />
          </div>
          <div className="form-group">
            <label className="form-label">Ghế/hàng</label>
            <input type="number" className="form-input" value={newSection.seatsPerRow} onChange={updateSection('seatsPerRow')} min={1} max={50} />
          </div>
          <div className="form-group">
            <label className="form-label">Giá (VND)</label>
            <input type="number" className="form-input" value={newSection.price} onChange={updateSection('price')} min={0} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleAddSection}>
          + Thêm khu vực
        </button>
      </div>
    </div>
  );
}
