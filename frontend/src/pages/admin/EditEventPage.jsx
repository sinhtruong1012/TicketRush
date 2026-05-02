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
  const [hiddenSeats, setHiddenSeats] = useState(new Set());
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
    
    const payload = {
      ...newSection,
      hiddenSeats: Array.from(hiddenSeats).map(key => {
        const [row, col] = key.split('-');
        return { row: parseInt(row), col: parseInt(col) };
      })
    };

    try {
      const data = await api.addSection(id, payload);
      setSections(prev => [...prev, {
        id: data.section.id,
        name: newSection.name,
        rowsCount: Number(newSection.rowsCount),
        seatsPerRow: Number(newSection.seatsPerRow),
        price: newSection.price,
        colorCode: newSection.colorCode,
        seatsCreated: data.seatsCreated,
      }]);
      setNewSection({ name: '', rowsCount: 5, seatsPerRow: 10, price: 500000, colorCode: '#00D4FF' });
      setHiddenSeats(new Set());
      showSuccess(data.message || 'Đã thêm khu vực ghế.');
    } catch (err) {
      setError(err.message || 'Lỗi thêm khu vực.');
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Bạn có chắc muốn xóa khu vực này?')) return;
    try {
      await api.deleteSection(sectionId);
      setSections(prev => prev.filter(s => s.id !== sectionId));
      showSuccess('Xóa khu vực thành công');
    } catch (err) {
      setError(err.message || 'Lỗi xóa khu vực');
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

  const toggleSeatVisibility = (r, c) => {
    const key = `${r}-${c}`;
    setHiddenSeats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });
  };

  const renderSeatPreview = () => {
    const rows = parseInt(newSection.rowsCount) || 0;
    const cols = parseInt(newSection.seatsPerRow) || 0;
    if (rows <= 0 || cols <= 0) return null;

    const grid = [];
    for (let r = 0; r < rows; r++) {
      const rowCells = [];
      let seatNumber = 1;
      for (let c = 0; c < cols; c++) {
        const isHidden = hiddenSeats.has(`${r}-${c}`);
        rowCells.push(
          <div
            key={`${r}-${c}`}
            onClick={() => toggleSeatVisibility(r, c)}
            style={{
              width: '24px', height: '24px', margin: '2px',
              backgroundColor: isHidden ? '#f3f4f6' : newSection.colorCode,
              border: isHidden ? '1px dashed #d1d5db' : 'none',
              borderRadius: '4px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', color: isHidden ? 'transparent' : '#fff',
              transition: 'all 0.2s'
            }}
            title={isHidden ? 'Lối đi' : `Ghế ${seatNumber}`}
          >
            {!isHidden ? seatNumber : ''}
          </div>
        );
        if (!isHidden) seatNumber++;
      }
      grid.push(
        <div key={r} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ width: '24px', fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>{String.fromCharCode(65 + r)}</span>
          <div style={{ display: 'flex' }}>{rowCells}</div>
        </div>
      );
    }
    return (
      <div className="form-group mt-4 mb-4">
        <label className="form-label">Sơ đồ ghế (Click vào ghế để xóa tạo lối đi)</label>
        <div style={{ overflowX: 'auto', padding: '15px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'inline-block', maxWidth: '100%' }}>
          {grid}
        </div>
      </div>
    );
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="admin-page container">
      <div className="page-header">
        <h1 className="page-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil" style={{ marginRight: '10px', verticalAlign: 'text-bottom' }}>
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
          Chỉnh sửa sự kiện
        </h1>
        <button
          className="btn btn-gold btn-lg"
          onClick={handlePublish}
          disabled={publishing || sections.length === 0}
          title={sections.length === 0 ? 'Cần có ít nhất 1 khu vực ghế' : ''}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          {publishing ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader" style={{ animation: 'spin 2s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Đang xuất bản...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
              Xuất bản sự kiện
            </>
          )}
        </button>
      </div>

      {error && <div className="toast toast-error">{error}</div>}
      {success && <div className="toast toast-success">{success}</div>}

      {/* ── Thông tin sự kiện ── */}
      <div className="admin-form card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1.25rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-list">
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <path d="M12 11h4"/>
            <path d="M12 16h4"/>
            <path d="M8 11h.01"/>
            <path d="M8 16h.01"/>
          </svg>
          Thông tin sự kiện
        </h2>
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
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {saving ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader" style={{ animation: 'spin 2s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Đang lưu...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save">
                  <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                  <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
                  <path d="M7 3v4a1 1 0 0 0 1 1h7" />
                </svg>
                Lưu thay đổi
              </>
            )}
          </button>
        </form>
      </div>

      {/* ── Khu vực ghế hiện có ── */}
      <div className="admin-form card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-armchair">
            <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/>
            <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z"/>
            <path d="M5 18v2"/>
            <path d="M19 18v2"/>
          </svg>
          Khu vực ghế ({sections.length})
        </h2>
        {sections.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Chưa có khu vực ghế nào.</p>
        ) : (
          <div className="edit-sections-list">
            {sections.map((s, i) => (
              <div key={s.id ?? i} className="edit-section-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                  <span className="edit-section-dot" style={{ color: s.colorCode }}>●</span>
                  <span className="edit-section-name">{s.name}</span>
                  <span className="edit-section-meta">
                    {s.rowsCount} hàng × {s.seatsPerRow} ghế
                    {s.seatsCreated != null ? ` — ${s.seatsCreated} ghế tạo` : ''}
                  </span>
                  <span className="edit-section-price">{formatCurrency(s.price)}</span>
                </div>
                <button className="btn-delete-section" onClick={() => handleDeleteSection(s.id)} title="Xóa khu vực" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', marginLeft: 'auto' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Thêm khu vực ghế ── */}
      <div className="admin-form card">
        <h2 style={{ marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-circle">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 12h8"/>
            <path d="M12 8v8"/>
          </svg>
          Thêm khu vực ghế mới
        </h2>
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
        {renderSeatPreview()}
        <button className="btn btn-primary" onClick={handleAddSection}>
          + Thêm khu vực
        </button>
      </div>
    </div>
  );
}
