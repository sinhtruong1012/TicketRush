import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">

        {/* Col 1 — Brand */}
        <div className="footer-col">
          <span className="footer-brand">
            <span className="footer-icon"></span> TicketRush
          </span>
          <p className="footer-copy">© 2026 TicketRush. All rights reserved.</p>
        </div>

        {/* Col 2 — Contact */}
        <div className="footer-col footer-contact">
          <div className="footer-contact-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.57 3.4 2 2 0 0 1 3.54 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 6 6l.88-.88a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16l.42.92z" />
            </svg>
            <div>
              <span className="footer-contact-label">Hotline</span>
              <a href="tel:0395748296" className="footer-contact-value">0395 748 296</a>
              <span className="footer-contact-hours">Thứ 2 – CN (8:00 – 23:00)</span>
            </div>
          </div>

          <div className="footer-contact-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <div>
              <span className="footer-contact-label">Email</span>
              <a href="mailto:support.ticketrush@gmail.com" className="footer-contact-value">
                support.ticketrush@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Col 3 — Nav + Social */}
        <div className="footer-col footer-col--right">
          <nav className="footer-nav">
            <Link to="/terms">ĐIỀU KHOẢN</Link>
            <Link to="/privacy">QUYỀN RIÊNG TƯ</Link>
          </nav>
          <div className="footer-social">
            <span className="footer-follow-label">Follow us</span>
            <a
              href="https://www.instagram.com/ticketrush.est2026/"
              target="_blank"
              rel="noopener noreferrer"
              className="ig-link"
              aria-label="Instagram"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="1.6em" height="1.6em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
