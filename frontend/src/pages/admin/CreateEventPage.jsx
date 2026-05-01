import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useFormValidation, RULES } from '../../hooks/useFormValidation';
import { formatCurrencyInput, parseCurrencyInput } from '../../utils/formatInput';
import './AdminPages.css';

// Validation schemas
const eventSchema = {
  title: [RULES.required],
  eventDate: [RULES.required, RULES.futureDate],
  venueName: [RULES.required],
  posterUrl: [RULES.url],
};

const sectionSchema = {
  name: [RULES.required],
  price: [RULES.required],
};

// Popular venues for autocomplete
const SUGGESTED_VENUES = [
  { name: 'Sân vận động Mỹ Đình', address: 'Đường Lê Đức Thọ, Mỹ Đình 1, Nam Từ Liêm, Hà Nội' },
  { name: 'Nhà thi đấu Phú Thọ', address: '01 Lữ Gia, Phường 15, Quận 11, TP. HCM' },
  { name: 'Saigon Exhibition and Convention Center (SECC)', address: '799 Nguyễn Văn Linh, Tân Phú, Quận 7, TP. HCM' },
  { name: 'Trung tâm Hội nghị Quốc gia', address: 'Phạm Hùng, Mễ Trì, Nam Từ Liêm, Hà Nội' },
  { name: 'Nhà hát Lớn Hà Nội', address: '01 Tràng Tiền, Phan Chu Trinh, Hoàn Kiếm, Hà Nội' },
];

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: 'music', venueName: '', venueAddress: '', eventDate: '', saleStartAt: '', posterUrl: '' });
  const [sections, setSections] = useState([]);
  const [newSection, setNewSection] = useState({ name: '', rowsCount: 5, seatsPerRow: 10, price: '500.000', colorCode: '#00D4FF' });
  const [hiddenSeats, setHiddenSeats] = useState(new Set());
  const [eventId, setEventId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { errors: eventErrors, touched: eventTouched, validate: validateEvent, touchField: touchEventField } = useFormValidation(eventSchema);
  const { errors: sectionErrors, touched: sectionTouched, validate: validateSection, touchField: touchSectionField } = useFormValidation(sectionSchema);

  const update = (field) => (e) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));

    // Simple autocomplete logic: if venue name matches suggestion, auto-fill address
    if (field === 'venueName') {
      const found = SUGGESTED_VENUES.find(v => v.name === value);
      if (found) setForm(prev => ({ ...prev, venueAddress: found.address }));
    }
  };

  const updateSection = (field) => (e) => {
    let value = e.target.value;
    if (field === 'price') value = formatCurrencyInput(value);
    setNewSection(prev => ({ ...prev, [field]: value }));
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 3000);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!validateEvent(form)) return;

    if (form.saleStartAt && new Date(form.saleStartAt) >= new Date(form.eventDate)) {
      showError('Ngày mở bán vé phải trước ngày diễn ra sự kiện.');
      return;
    }

    try {
      const data = await api.createEvent(form);
      setEventId(data.event.id);
      setSuccess('Tạo sự kiện thành công! Giờ hãy thêm khu vực ghế.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      showError(err.message || 'Lỗi tạo sự kiện, vui lòng thử lại.');
    }
  };

  const handleAddSection = async () => {
    if (!eventId) return;
    if (!validateSection(newSection)) return;

    const payload = {
      ...newSection,
      price: parseCurrencyInput(newSection.price),
      hiddenSeats: Array.from(hiddenSeats).map(key => {
        const [row, col] = key.split('-');
        return { row: parseInt(row), col: parseInt(col) };
      })
    };

    try {
      const data = await api.addSection(eventId, payload);
      setSections(prev => [...prev, { ...newSection, id: Date.now(), seatsCreated: data.seatsCreated }]);
      setNewSection({ name: '', rowsCount: 5, seatsPerRow: 10, price: '500.000', colorCode: '#00D4FF' });
      setHiddenSeats(new Set());
      setSuccess(data.message);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      showError(err.message || 'Lỗi thêm khu vực, vui lòng thử lại.');
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

  const handlePublish = async () => {
    try {
      await api.updateEvent(eventId, { status: 'published' });
      navigate('/admin/events');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-page container">
      <div className="page-header">
        <h1 className="page-title">+ Tạo sự kiện mới</h1>
      </div>

      {error && <div className="toast toast-error">{error}</div>}
      {success && <div className="toast toast-success">{success}</div>}

      {!eventId ? (
        <div className="admin-form card">
          <form onSubmit={handleCreateEvent} noValidate>
            <div className="form-group">
              <label className="form-label">Tên sự kiện *</label>
              <input 
                className={`form-input ${eventTouched.title && eventErrors.title ? 'form-input--error' : ''}`} 
                value={form.title} 
                onChange={update('title')} 
                onBlur={() => touchEventField('title', form.title)}
              />
              {eventTouched.title && eventErrors.title && <span className="field-error">{eventErrors.title}</span>}
            </div>
            
            <div className="form-group"><label className="form-label">Mô tả</label><textarea className="form-input" rows={3} value={form.description} onChange={update('description')} /></div>
            
            <div className="form-row">
              <div className="form-group"><label className="form-label">Thể loại</label>
                <select className="form-input" value={form.category} onChange={update('category')}>
                  <option value="music">Âm nhạc</option><option value="comedy">Hài kịch</option><option value="sports">Thể thao</option><option value="theater">Kịch</option><option value="other">Khác</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ngày sự kiện *</label>
                <input 
                  type="datetime-local" 
                  className={`form-input ${eventTouched.eventDate && eventErrors.eventDate ? 'form-input--error' : ''}`} 
                  value={form.eventDate} 
                  onChange={update('eventDate')} 
                  onBlur={() => touchEventField('eventDate', form.eventDate)}
                />
                {eventTouched.eventDate && eventErrors.eventDate && <span className="field-error">{eventErrors.eventDate}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Địa điểm *</label>
              <input 
                className={`form-input ${eventTouched.venueName && eventErrors.venueName ? 'form-input--error' : ''}`} 
                value={form.venueName} 
                onChange={update('venueName')} 
                onBlur={() => touchEventField('venueName', form.venueName)}
                list="venue-list"
                placeholder="Nhập hoặc chọn địa điểm..."
              />
              <datalist id="venue-list">
                {SUGGESTED_VENUES.map(v => <option key={v.name} value={v.name} />)}
              </datalist>
              {eventTouched.venueName && eventErrors.venueName && <span className="field-error">{eventErrors.venueName}</span>}
            </div>

            <div className="form-group"><label className="form-label">Địa chỉ</label><input className="form-input" value={form.venueAddress} onChange={update('venueAddress')} placeholder="Địa chỉ tự động điền nếu chọn địa điểm gợi ý" /></div>
            
            <div className="form-group"><label className="form-label">Mở bán vé</label><input type="datetime-local" className="form-input" value={form.saleStartAt} onChange={update('saleStartAt')} /></div>
            
            <div className="form-group">
              <label className="form-label">URL Poster (tùy chọn)</label>
              <input 
                className={`form-input ${eventTouched.posterUrl && eventErrors.posterUrl ? 'form-input--error' : ''}`} 
                value={form.posterUrl} 
                onChange={update('posterUrl')} 
                onBlur={() => touchEventField('posterUrl', form.posterUrl)}
                placeholder="https://example.com/poster.jpg" 
              />
              {eventTouched.posterUrl && eventErrors.posterUrl && <span className="field-error">{eventErrors.posterUrl}</span>}
              {form.posterUrl && !eventErrors.posterUrl && (
                <img src={form.posterUrl} alt="Preview poster" style={{ marginTop: '0.5rem', width: '120px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }} onError={e => { e.target.style.display = 'none'; }} />
              )}
            </div>
            <button type="submit" className="btn btn-primary btn-lg">Tạo sự kiện</button>
          </form>
        </div>
      ) : (
        <div className="admin-form card">
          <h2>Thêm khu vực ghế</h2>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tên khu vực</label>
              <input 
                className={`form-input ${sectionTouched.name && sectionErrors.name ? 'form-input--error' : ''}`} 
                value={newSection.name} 
                onChange={updateSection('name')} 
                onBlur={() => touchSectionField('name', newSection.name)}
                placeholder="VIP-A" 
              />
              {sectionTouched.name && sectionErrors.name && <span className="field-error">{sectionErrors.name}</span>}
            </div>
            <div className="form-group"><label className="form-label">Màu</label><input type="color" className="form-input" value={newSection.colorCode} onChange={updateSection('colorCode')} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Số hàng</label><input type="number" className="form-input" value={newSection.rowsCount} onChange={updateSection('rowsCount')} min={1} max={50} /></div>
            <div className="form-group"><label className="form-label">Ghế/hàng</label><input type="number" className="form-input" value={newSection.seatsPerRow} onChange={updateSection('seatsPerRow')} min={1} max={50} /></div>
            <div className="form-group">
              <label className="form-label">Giá (VND)</label>
              <input 
                className={`form-input ${sectionTouched.price && sectionErrors.price ? 'form-input--error' : ''}`} 
                value={newSection.price} 
                onChange={updateSection('price')} 
                onBlur={() => touchSectionField('price', newSection.price)}
              />
              {sectionTouched.price && sectionErrors.price && <span className="field-error">{sectionErrors.price}</span>}
            </div>
          </div>
          {renderSeatPreview()}
          <button className="btn btn-primary" onClick={handleAddSection}>+ Thêm khu vực</button>

          {sections.length > 0 && (
            <div className="sections-list mt-4">
              <h3>Đã thêm:</h3>
              {sections.map(s => (
                <div key={s.id} className="section-item"><span style={{ color: s.colorCode }}>● {s.name}</span> — {s.rowsCount}x{s.seatsPerRow} ghế — {s.seatsCreated} ghế tạo</div>
              ))}
              <button className="btn btn-gold btn-lg mt-4" onClick={handlePublish}>Xuất bản sự kiện</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
