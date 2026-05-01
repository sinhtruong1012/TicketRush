import './LegalPage.css';

const LAST_UPDATED = '01/05/2026';

export default function PrivacyPage() {
  return (
    <div className="legal-page container">
      <div className="legal-hero">
        <h1 className="legal-title">Chính sách quyền riêng tư</h1>
        <p className="legal-subtitle">
          TicketRush cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn theo đúng quy định pháp luật.
        </p>
        <span className="legal-updated">Cập nhật lần cuối: {LAST_UPDATED}</span>
      </div>

      <div className="legal-body">
        <aside className="legal-toc">
          <p className="legal-toc-title">Mục lục</p>
          <ol className="legal-toc-list">
            <li><a href="#overview">Tổng quan</a></li>
            <li><a href="#collect">Dữ liệu chúng tôi thu thập</a></li>
            <li><a href="#use">Mục đích sử dụng</a></li>
            <li><a href="#share">Chia sẻ dữ liệu</a></li>
            <li><a href="#cookies">Cookie &amp; Công nghệ theo dõi</a></li>
            <li><a href="#security">Bảo mật dữ liệu</a></li>
            <li><a href="#retention">Lưu trữ dữ liệu</a></li>
            <li><a href="#rights">Quyền của bạn</a></li>
            <li><a href="#children">Trẻ em</a></li>
            <li><a href="#contact">Liên hệ</a></li>
          </ol>
        </aside>

        <article className="legal-content">

          <section id="overview" className="legal-section">
            <h2>1. Tổng quan</h2>
            <p>
              Chính sách quyền riêng tư này mô tả cách TicketRush thu thập, sử dụng, lưu trữ và bảo vệ
              thông tin cá nhân của bạn khi sử dụng nền tảng của chúng tôi. Chúng tôi tuân thủ Nghị định
              13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân tại Việt Nam.
            </p>
            <p>
              Bằng việc sử dụng TicketRush, bạn đồng ý với các điều khoản được mô tả trong chính sách này.
            </p>
          </section>

          <section id="collect" className="legal-section">
            <h2>2. Dữ liệu chúng tôi thu thập</h2>
            <p>Chúng tôi thu thập các loại thông tin sau:</p>

            <h3>2.1 Thông tin bạn cung cấp trực tiếp</h3>
            <ul>
              <li>Họ tên, địa chỉ email, số điện thoại khi đăng ký tài khoản.</li>
              <li>Ngày sinh, giới tính (tuỳ chọn) để cá nhân hoá trải nghiệm.</li>
              <li>Thông tin thanh toán (chúng tôi không lưu trữ số thẻ đầy đủ).</li>
              <li>Nội dung bạn gửi khi liên hệ hỗ trợ khách hàng.</li>
            </ul>

            <h3>2.2 Thông tin thu thập tự động</h3>
            <ul>
              <li>Địa chỉ IP, loại trình duyệt, hệ điều hành.</li>
              <li>Lịch sử duyệt trang, sự kiện đã xem và vé đã mua.</li>
              <li>Dữ liệu vị trí (nếu bạn cho phép) để gợi ý sự kiện gần bạn.</li>
              <li>Dữ liệu từ cookie và các công nghệ tương tự.</li>
            </ul>

            <h3>2.3 Thông tin từ bên thứ ba</h3>
            <ul>
              <li>Thông tin hồ sơ từ mạng xã hội nếu bạn đăng nhập qua Google/Facebook.</li>
              <li>Dữ liệu giao dịch từ cổng thanh toán để xác minh và hoàn tiền.</li>
            </ul>
          </section>

          <section id="use" className="legal-section">
            <h2>3. Mục đích sử dụng</h2>
            <p>Chúng tôi sử dụng thông tin của bạn để:</p>
            <ul>
              <li>Cung cấp và cải thiện dịch vụ bán vé trực tuyến.</li>
              <li>Xử lý giao dịch và gửi vé điện tử đến email của bạn.</li>
              <li>Gửi thông báo về sự kiện, khuyến mãi và cập nhật dịch vụ (bạn có thể huỷ đăng ký bất kỳ lúc nào).</li>
              <li>Phân tích hành vi người dùng để tối ưu trải nghiệm và gợi ý sự kiện phù hợp.</li>
              <li>Phát hiện và ngăn chặn gian lận, bảo vệ an ninh hệ thống.</li>
              <li>Tuân thủ các nghĩa vụ pháp lý.</li>
            </ul>
          </section>

          <section id="share" className="legal-section">
            <h2>4. Chia sẻ dữ liệu</h2>
            <p>
              TicketRush <strong>không bán</strong> thông tin cá nhân của bạn cho bên thứ ba. Chúng tôi
              chỉ chia sẻ dữ liệu trong các trường hợp sau:
            </p>
            <ul>
              <li>
                <strong>Nhà tổ chức sự kiện:</strong> Tên và email của bạn được chia sẻ để xác nhận danh
                sách người tham dự.
              </li>
              <li>
                <strong>Đối tác thanh toán:</strong> Dữ liệu giao dịch được chia sẻ với cổng thanh toán
                để xử lý giao dịch an toàn.
              </li>
              <li>
                <strong>Nhà cung cấp dịch vụ:</strong> Các đối tác kỹ thuật (hosting, email, analytics)
                chỉ được truy cập dữ liệu cần thiết và bị ràng buộc bởi thoả thuận bảo mật.
              </li>
              <li>
                <strong>Yêu cầu pháp lý:</strong> Khi có lệnh của cơ quan chức năng theo quy định pháp luật.
              </li>
            </ul>
          </section>

          <section id="cookies" className="legal-section">
            <h2>5. Cookie &amp; Công nghệ theo dõi</h2>
            <p>Chúng tôi sử dụng cookie để:</p>
            <ul>
              <li><strong>Cookie thiết yếu:</strong> Duy trì phiên đăng nhập và giỏ hàng của bạn.</li>
              <li><strong>Cookie phân tích:</strong> Hiểu cách người dùng tương tác với nền tảng (Google Analytics).</li>
              <li><strong>Cookie marketing:</strong> Hiển thị quảng cáo phù hợp (có thể tắt trong cài đặt).</li>
            </ul>
            <p>
              Bạn có thể kiểm soát cookie thông qua cài đặt trình duyệt. Tuy nhiên, tắt cookie thiết yếu
              có thể ảnh hưởng đến chức năng của trang web.
            </p>
          </section>

          <section id="security" className="legal-section">
            <h2>6. Bảo mật dữ liệu</h2>
            <p>
              Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức phù hợp để bảo vệ dữ liệu
              cá nhân của bạn, bao gồm:
            </p>
            <ul>
              <li>Mã hoá SSL/TLS cho toàn bộ kết nối giữa trình duyệt và máy chủ.</li>
              <li>Mã hoá dữ liệu nhạy cảm (mật khẩu được băm bằng bcrypt).</li>
              <li>Kiểm soát truy cập nội bộ theo nguyên tắc đặc quyền tối thiểu.</li>
              <li>Giám sát hệ thống 24/7 để phát hiện bất thường.</li>
            </ul>
            <div className="legal-note">
              <strong>Lưu ý:</strong> Không có phương pháp truyền tải hay lưu trữ nào an toàn tuyệt đối.
              Chúng tôi cam kết thông báo cho bạn trong vòng 72 giờ nếu xảy ra rò rỉ dữ liệu ảnh hưởng đến bạn.
            </div>
          </section>

          <section id="retention" className="legal-section">
            <h2>7. Lưu trữ dữ liệu</h2>
            <p>Chúng tôi lưu trữ dữ liệu của bạn trong thời gian cần thiết để:</p>
            <ul>
              <li>Duy trì tài khoản đang hoạt động của bạn.</li>
              <li>Tuân thủ nghĩa vụ pháp lý (thường tối thiểu 5 năm theo quy định kế toán).</li>
              <li>Giải quyết tranh chấp và thực thi thoả thuận.</li>
            </ul>
            <p>
              Sau khi bạn xoá tài khoản, dữ liệu cá nhân sẽ bị xoá hoặc ẩn danh hoá trong vòng 30 ngày,
              ngoại trừ dữ liệu cần giữ lại theo quy định pháp luật.
            </p>
          </section>

          <section id="rights" className="legal-section">
            <h2>8. Quyền của bạn</h2>
            <p>Theo pháp luật hiện hành, bạn có các quyền sau đối với dữ liệu cá nhân:</p>
            <ul>
              <li><strong>Quyền truy cập:</strong> Yêu cầu bản sao dữ liệu cá nhân chúng tôi đang lưu trữ.</li>
              <li><strong>Quyền chỉnh sửa:</strong> Cập nhật hoặc sửa chữa thông tin không chính xác.</li>
              <li><strong>Quyền xoá:</strong> Yêu cầu xoá dữ liệu ("quyền được lãng quên") trong phạm vi pháp luật cho phép.</li>
              <li><strong>Quyền hạn chế:</strong> Yêu cầu tạm dừng xử lý dữ liệu trong một số trường hợp.</li>
              <li><strong>Quyền phản đối:</strong> Phản đối việc xử lý dữ liệu cho mục đích marketing trực tiếp.</li>
              <li><strong>Quyền chuyển dữ liệu:</strong> Nhận dữ liệu của bạn ở định dạng có thể đọc được bằng máy.</li>
            </ul>
            <p>
              Để thực hiện các quyền trên, vui lòng liên hệ <a href="mailto:support.ticketrush@gmail.com">support.ticketrush@gmail.com</a>.
              Chúng tôi sẽ phản hồi trong vòng 30 ngày làm việc.
            </p>
          </section>

          <section id="children" className="legal-section">
            <h2>9. Trẻ em</h2>
            <p>
              Dịch vụ TicketRush không dành cho trẻ em dưới 13 tuổi. Chúng tôi không cố ý thu thập
              thông tin cá nhân từ trẻ em. Nếu bạn phát hiện tài khoản của trẻ em dưới 13 tuổi trên
              nền tảng, vui lòng liên hệ chúng tôi ngay để xử lý.
            </p>
          </section>

          <section id="contact" className="legal-section">
            <h2>10. Liên hệ</h2>
            <p>
              Nếu bạn có câu hỏi, khiếu nại hoặc muốn thực hiện các quyền của mình liên quan đến dữ liệu
              cá nhân, vui lòng liên hệ Bộ phận Bảo vệ dữ liệu của chúng tôi:
            </p>
            <div className="legal-contact-card">
              <p><strong>TicketRush – Data Protection</strong></p>
              <p className="legal-contact-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <a href="mailto:support.ticketrush@gmail.com">support.ticketrush@gmail.com</a>
              </p>
              <p className="legal-contact-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.57 3.4 2 2 0 0 1 3.54 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 6 6l.88-.88a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16l.42.92z" />
                </svg>
                <a href="tel:0395748296">0395 748 296</a>
              </p>
              <p className="legal-contact-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Thứ 2 – Chủ Nhật, 8:00 – 23:00
              </p>
            </div>
          </section>

        </article>
      </div>
    </div>
  );
}
