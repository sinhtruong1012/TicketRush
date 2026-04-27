import { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './AdminPages.css';

const COLORS = ['#FF6B6B', '#00D4FF', '#e5e7eb'];
const GENDER_LABELS = { male: 'Nam', female: 'Nữ', other: 'Khác' };
const renderGenderLabel = ({ name, percent }) =>
  `${GENDER_LABELS[name] ?? name} ${(percent * 100).toFixed(0)}%`;

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days'); // 30days, thisMonth, all
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = () => {
    setLoading(true);
    let start = '';
    let end = '';
    
    if (dateRange === 'thisMonth') {
      const date = new Date();
      start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
      end = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (dateRange === '30days') {
      const date = new Date();
      end = date.toISOString().split('T')[0];
      date.setDate(date.getDate() - 30);
      start = date.toISOString().split('T')[0];
    }

    api.getReportStats(start, end).then(setStats).catch(console.error).finally(() => setLoading(false));
  };

  const getDateRangeLabel = () => {
    switch(dateRange) {
      case 'thisMonth': return 'trong tháng này';
      case '30days': return 'trong 30 ngày qua';
      case 'all': return 'toàn thời gian';
      default: return '';
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(async () => {
      try {
        const element = reportRef.current;
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#f8fafc' // Admin background color
        });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        const today = new Date();
        const dateString = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
        
        pdf.save(`TicketRush_BaoCaoKhanGia_${dateString}.pdf`);
      } catch (error) {
        console.error("Lỗi xuất PDF:", error);
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  if (loading && !stats) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="admin-page" ref={reportRef} style={{ padding: isExporting ? '20px' : undefined, backgroundColor: isExporting ? '#f8fafc' : undefined }}>
      {isExporting && (
        <div style={{ marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 9V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4" />
            <path d="M2 13v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6" />
            <line x1="12" y1="2" x2="12" y2="22" />
            <path d="M8 9h8" /><path d="M8 15h8" />
          </svg>
          <h1 style={{ fontSize: '24px', color: '#1a1a2e', fontWeight: 'bold' }}>TicketRush</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '5px', marginLeft: '8px' }}>
            Ngày giờ xuất báo cáo: {new Date().toLocaleString('vi-VN')}
          </p>
        </div>
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Báo cáo Khán giả</h1>
          <p className="text-gray-500 mt-1">Phân tích chuyên sâu về hành vi và nhân khẩu học của khách hàng.</p>
        </div>
        {!isExporting && (
          <div className="header-actions">
            <select 
              className="filter-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="30days">30 ngày qua</option>
              <option value="thisMonth">Tháng này</option>
              <option value="all">Toàn thời gian</option>
            </select>
            <button className="btn btn-primary" style={{ marginLeft: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={handleExportPDF}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Xuất báo cáo
            </button>
          </div>
        )}
      </div>

      {!stats ? (
        <div className="empty-state">Không thể tải dữ liệu</div>
      ) : (
        <>
          <div className="stats-cards">
            <div className="stat-card card">
              <span className="stat-card-label">TỔNG CỘNG KHÁN GIẢ</span>
              <span className="stat-card-value">{stats.summary.totalAudience.toLocaleString()}</span>
            </div>
            <div className="stat-card card">
              <span className="stat-card-label">THÀNH VIÊN MỚI</span>
              <span className="stat-card-value text-green-500">+{stats.summary.newMembers}</span>
              <p className="text-xs text-gray-500 mt-1">{getDateRangeLabel()}</p>
            </div>
            <div className="stat-card card">
              <span className="stat-card-label">HOẠT ĐỘNG TRUNG BÌNH</span>
              <span className="stat-card-value">{stats.summary.interactionRate}%</span>
              <p className="text-xs text-gray-500 mt-1">Dựa trên số người đặt vé</p>
            </div>
          </div>

          <div className="charts-grid mt-4">
            <div className="chart-card card span-2">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                Phân khúc Độ tuổi
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.demographics.ageStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="age_group" stroke="#6b7280" fontSize={12} />
                  <YAxis type="number" stroke="#6b7280" />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#00D4FF" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Giới tính
              </h3>
              {stats.demographics.genderStats.length === 0 ? (
                <div className="chart-empty">Chưa có dữ liệu</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.demographics.genderStats}
                      dataKey="count"
                      nameKey="gender"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      label={renderGenderLabel}
                      labelLine={true}
                    >
                      {stats.demographics.genderStats.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#000' }}
                      formatter={(value, name) => [value + ' người', GENDER_LABELS[name] ?? name]}
                    />
                    <Legend
                      formatter={(name) => GENDER_LABELS[name] ?? name}
                      wrapperStyle={{ fontSize: '13px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card mt-4">
            <h3 className="mb-4">Khán giả mới gia nhập</h3>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Email</th>
                    <th>Ngày đăng ký</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.newAudiences.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar-sm">
                            {user.avatar ? (
                              <img src={user.avatar} alt="avatar" />
                            ) : (
                              <div className="avatar-placeholder">{user.fullName.charAt(0)}</div>
                            )}
                          </div>
                          <div className="font-medium">{user.fullName}</div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{new Date(user.createdAt).toLocaleString()}</td>
                      <td><span className="badge badge-success">• Đang hoạt động</span></td>
                    </tr>
                  ))}
                  {stats.newAudiences.length === 0 && (
                    <tr><td colSpan="4" className="text-center py-4">Chưa có dữ liệu</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
