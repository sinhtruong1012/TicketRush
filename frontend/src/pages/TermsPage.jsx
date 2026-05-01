import './LegalPage.css';

const LAST_UPDATED = '01/05/2026';

export default function TermsPage() {
  return (
    <div className="legal-page container">
      <div className="legal-hero">
        <h1 className="legal-title">Điều khoản sử dụng</h1>
        <p className="legal-subtitle">
          Vui lòng đọc kỹ các điều khoản dưới đây trước khi sử dụng dịch vụ của TicketRush.
        </p>
        <span className="legal-updated">Cập nhật lần cuối: {LAST_UPDATED}</span>
      </div>

      <div className="legal-body">
        <aside className="legal-toc">
          <p className="legal-toc-title">Mục lục</p>
          <ol className="legal-toc-list">
            <li><a href="#acceptance">Chấp nhận điều khoản</a></li>
            <li><a href="#account">Tài khoản người dùng</a></li>
            <li><a href="#tickets">Mua vé &amp; Đặt chỗ</a></li>
            <li><a href="#payment">Thanh toán</a></li>
            <li><a href="#cancellation">Hoàn huỷ &amp; Hoàn tiền</a></li>
            <li><a href="#conduct">Quy tắc sử dụng</a></li>
            <li><a href="#ip">Sở hữu trí tuệ</a></li>
            <li><a href="#liability">Giới hạn trách nhiệm</a></li>
            <li><a href="#changes">Thay đổi điều khoản</a></li>
            <li><a href="#contact">Liên hệ</a></li>
          </ol>
        </aside>

        <article className="legal-content">

          <section id="acceptance" className="legal-section">
            <h2>1. Chấp nhận điều khoản</h2>
            <p>
              Bằng việc truy cập và sử dụng nền tảng TicketRush (bao gồm website và ứng dụng di động),
              bạn đồng ý tuân thủ và bị ràng buộc bởi các Điều khoản sử dụng này. Nếu bạn không đồng ý
              với bất kỳ điều khoản nào, vui lòng không sử dụng dịch vụ của chúng tôi.
            </p>
            <p>
              TicketRush là nền tảng bán vé trực tuyến hàng đầu Việt Nam, cung cấp dịch vụ đặt vé cho
              các sự kiện âm nhạc, thể thao, sân khấu và các loại hình giải trí khác.
            </p>
          </section>

          <section id="account" className="legal-section">
            <h2>2. Tài khoản người dùng</h2>
            <p>Để sử dụng đầy đủ tính năng của TicketRush, bạn cần tạo tài khoản. Khi đăng ký, bạn cam kết:</p>
            <ul>
              <li>Cung cấp thông tin chính xác, đầy đủ và cập nhật.</li>
              <li>Bảo mật mật khẩu và không chia sẻ thông tin đăng nhập với bất kỳ ai.</li>
              <li>Chịu trách nhiệm cho mọi hoạt động xảy ra dưới tài khoản của bạn.</li>
              <li>Thông báo ngay cho chúng tôi nếu phát hiện truy cập trái phép vào tài khoản.</li>
            </ul>
            <p>
              Chúng tôi có quyền tạm khóa hoặc xoá tài khoản nếu phát hiện hành vi vi phạm điều khoản
              hoặc gian lận.
            </p>
          </section>

          <section id="tickets" className="legal-section">
            <h2>3. Mua vé &amp; Đặt chỗ</h2>
            <p>
              Mỗi giao dịch mua vé trên TicketRush là một hợp đồng trực tiếp giữa bạn và nhà tổ chức
              sự kiện. TicketRush đóng vai trò là trung gian công nghệ, không phải nhà tổ chức.
            </p>
            <ul>
              <li>Số lượng vé có thể bị giới hạn theo quy định của từng sự kiện.</li>
              <li>Giá vé có thể thay đổi tuỳ theo thời điểm và số lượng còn lại.</li>
              <li>Vé điện tử sẽ được gửi qua email sau khi thanh toán thành công.</li>
              <li>Nghiêm cấm mua vé với mục đích bán lại kiếm lời (scalping).</li>
            </ul>
          </section>

          <section id="payment" className="legal-section">
            <h2>4. Thanh toán</h2>
            <p>
              TicketRush hỗ trợ nhiều phương thức thanh toán bao gồm thẻ ngân hàng nội địa, thẻ quốc tế,
              ví điện tử và chuyển khoản. Toàn bộ giao dịch được bảo mật theo tiêu chuẩn PCI-DSS.
            </p>
            <p>
              Giá vé đã bao gồm phí dịch vụ. Chúng tôi sẽ hiển thị rõ tổng số tiền cần thanh toán
              trước khi bạn xác nhận giao dịch.
            </p>
            <div className="legal-note">
              <strong>Lưu ý:</strong> Vé chỉ được xác nhận sau khi thanh toán hoàn tất thành công.
              TicketRush không chịu trách nhiệm nếu vé hết do chậm thanh toán.
            </div>
          </section>

          <section id="cancellation" className="legal-section">
            <h2>5. Hoàn huỷ &amp; Hoàn tiền</h2>
            <p>Chính sách hoàn tiền tuỳ thuộc vào quy định của từng nhà tổ chức sự kiện:</p>
            <ul>
              <li><strong>Sự kiện bị huỷ bởi ban tổ chức:</strong> Hoàn 100% giá vé trong vòng 7–14 ngày làm việc.</li>
              <li><strong>Thay đổi lịch tổ chức:</strong> Vé vẫn còn hiệu lực cho ngày mới. Nếu không thể tham dự, liên hệ hỗ trợ trong vòng 48 giờ.</li>
              <li><strong>Huỷ bởi người mua:</strong> Chính sách áp dụng theo từng sự kiện; một số sự kiện không hỗ trợ hoàn vé.</li>
            </ul>
            <p>Yêu cầu hoàn tiền vui lòng gửi đến <a href="mailto:support.ticketrush@gmail.com">support.ticketrush@gmail.com</a>.</p>
          </section>

          <section id="conduct" className="legal-section">
            <h2>6. Quy tắc sử dụng</h2>
            <p>Khi sử dụng TicketRush, bạn đồng ý không thực hiện các hành vi sau:</p>
            <ul>
              <li>Sử dụng bot, script hoặc công cụ tự động để mua vé hàng loạt.</li>
              <li>Cung cấp thông tin sai lệch hoặc giả mạo danh tính.</li>
              <li>Can thiệp vào hệ thống, cơ sở hạ tầng hoặc bảo mật của nền tảng.</li>
              <li>Đăng tải nội dung vi phạm pháp luật hoặc xâm phạm quyền của bên thứ ba.</li>
              <li>Thực hiện các hành vi gian lận trong quá trình mua vé hoặc thanh toán.</li>
            </ul>
          </section>

          <section id="ip" className="legal-section">
            <h2>7. Sở hữu trí tuệ</h2>
            <p>
              Toàn bộ nội dung trên nền tảng TicketRush — bao gồm logo, giao diện, mã nguồn, hình ảnh
              và văn bản — là tài sản trí tuệ của TicketRush hoặc các đối tác được cấp phép. Bạn không
              được sao chép, phân phối hoặc sử dụng cho mục đích thương mại mà không có sự đồng ý bằng
              văn bản của chúng tôi.
            </p>
          </section>

          <section id="liability" className="legal-section">
            <h2>8. Giới hạn trách nhiệm</h2>
            <p>
              TicketRush cung cấp dịch vụ theo nguyên tắc "như hiện trạng". Chúng tôi không đảm bảo
              rằng dịch vụ sẽ hoạt động liên tục, không có lỗi hoặc đáp ứng mọi kỳ vọng của bạn.
            </p>
            <p>
              Trong phạm vi tối đa được pháp luật cho phép, TicketRush không chịu trách nhiệm đối với
              các tổn thất gián tiếp, ngẫu nhiên hoặc hậu quả phát sinh từ việc sử dụng dịch vụ.
            </p>
          </section>

          <section id="changes" className="legal-section">
            <h2>9. Thay đổi điều khoản</h2>
            <p>
              TicketRush có thể cập nhật Điều khoản sử dụng này theo thời gian. Chúng tôi sẽ thông báo
              các thay đổi quan trọng qua email hoặc thông báo trên nền tảng ít nhất 7 ngày trước khi
              có hiệu lực. Việc tiếp tục sử dụng dịch vụ sau khi thay đổi có hiệu lực đồng nghĩa với
              việc bạn chấp nhận điều khoản mới.
            </p>
          </section>

          <section id="contact" className="legal-section">
            <h2>10. Liên hệ</h2>
            <p>Nếu bạn có câu hỏi về Điều khoản sử dụng, vui lòng liên hệ:</p>
            <div className="legal-contact-card">
              <p><strong>TicketRush Support</strong></p>
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
