import { Outlet, NavLink } from 'react-router-dom';
import './AdminLayout.css';

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <nav className="admin-sidebar-nav">
          <NavLink to="/admin/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="sidebar-icon">Dashboard</span>
          </NavLink>
          <NavLink to="/admin/reports" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="sidebar-icon">Reports</span>
          </NavLink>
          <NavLink to="/admin/events" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="sidebar-icon">Sự kiện</span>
          </NavLink>
        </nav>

      </aside>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
