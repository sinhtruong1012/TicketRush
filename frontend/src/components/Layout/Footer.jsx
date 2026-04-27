import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span className="footer-brand">
          <span className="footer-icon"></span> TicketRush
        </span>
        <p className="footer-copy">© 2026 TicketRush. All rights reserved.</p>
        <nav className="footer-nav">
          <Link to="/events">SỰ KIỆN</Link>
          <a href="#">ĐỊA ĐIỂM</a>
          <a href="#">ĐIỀU KHOẢN</a>
          <a href="#">QUYỀN RIÊNG TƯ</a>
          <a href="#">HỖ TRỢ</a>
          <a
            href="https://www.instagram.com/ticketrush.est2026/"
            target="_blank"
            className="ig-link"
            aria-label="Instagram"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
            </svg>
          </a>
        </nav>
      </div>
    </footer>
  );
}
