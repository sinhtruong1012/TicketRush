# TicketRush — Nền tảng đặt vé online

> Hệ thống phân phối vé điện tử chịu tải cao với sơ đồ ghế real-time, virtual queue, và quản trị admin toàn diện.

---

## Tính năng nổi bật

### Khách hàng
- Tìm kiếm & lọc sự kiện theo tên, thể loại, địa điểm, giá, ngày
- Chọn ghế tương tác với sơ đồ ghế real-time (WebSocket)
- Thanh toán & nhận vé QR Code
- Xem lịch sử vé đã mua
- Virtual Waiting Room khi quá tải

### Admin
- Tạo & quản lý sự kiện, cấu hình khu vực ghế
- Dashboard real-time: doanh thu, vé bán, tỉ lệ lấp đầy
- Báo cáo khán giả: phân khúc độ tuổi, giới tính, thành viên mới
- Xuất báo cáo PDF
- Tìm kiếm & lọc sự kiện nhanh (tên, trạng thái, ngày, địa điểm)

### Kỹ thuật
- **Race condition proof**: Xử lý đồng thời bằng PostgreSQL `FOR UPDATE SKIP LOCKED`
- **Seat auto-release**: Ghế locked 10 phút không thanh toán → tự động giải phóng (cron job)
- **Real-time**: Cập nhật trạng thái ghế tức thì qua WebSocket (Socket.IO)
- **Virtual Queue**: Hàng chờ ảo khi sự kiện quá tải, cấp quyền theo batch

---

## Tech Stack

| Layer | Công nghệ |
|---|---|
| **Frontend** | React 19, Vite, React Router v7 |
| **Backend** | Node.js, Express.js 5 |
| **Database** | PostgreSQL |
| **ORM** | Sequelize v6 |
| **Real-time** | Socket.IO |
| **Auth** | JWT + bcrypt |
| **Charts** | Recharts |
| **Scheduler** | node-cron |
| **QR Code** | qrcode (npm) |

---

## Cấu trúc dự án

```
ticketrush/
├── backend/                    # Express REST API
│   ├── server.js               # Entry point + Socket.IO
│   ├── config/database.js      # Sequelize connection
│   ├── models/                 # 7 Sequelize models
│   ├── controllers/            # Business logic
│   ├── routes/                 # API routes
│   ├── middlewares/            # Auth, role, validation
│   ├── services/               # Seat lock, queue, lifecycle
│   ├── socket/seatSocket.js    # WebSocket events
│   └── seeders/seed.js         # Dữ liệu mẫu
│
└── frontend/                   # React SPA (Vite)
    └── src/
        ├── App.jsx             # Router setup
        ├── api/client.js       # Fetch wrapper + JWT
        ├── context/            # AuthContext, SocketContext
        ├── hooks/              # useAuth, useSocket, useCountdown
        ├── components/         # SeatMap, Navbar, QRTicket...
        └── pages/              # LandingPage, EventsPage, Admin...
```

---

## Cài đặt & Chạy

### Yêu cầu hệ thống
- Node.js 20+
- PostgreSQL 14+

### 1. Clone repo

```bash
git clone https://github.com/your-username/ticketrush.git
cd ticketrush
```

### 2. Cấu hình Backend

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục `backend/`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ticketrush
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Virtual Queue
MAX_CONCURRENT_USERS=50
QUEUE_BATCH_SIZE=10

# Seat Lock
SEAT_LOCK_TIMEOUT_MINUTES=10
```

### 3. Tạo Database

Tạo database PostgreSQL rỗng tên `ticketrush`:

```sql
CREATE DATABASE ticketrush;
```

### 4. Chạy Backend

```bash
# Development (auto-restart)
npm run dev

# Tạo dữ liệu mẫu (tùy chọn)
npm run seed
```

> Backend tự động tạo tất cả bảng khi khởi động lần đầu (`sequelize.sync`).

### 5. Cấu hình & Chạy Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Truy cập: **http://localhost:5173**

---

## Tài khoản mặc định (sau khi seed)

| Role | Email | Mật khẩu |
|---|---|---|
| **Admin** | admin@ticketrush.vn | admin123 |
| **Customer** | user1@gmail.com | user123 |

---

## Sơ đồ Database

```
users ──────────────────────────────────┐
  │                                     │
  ├── orders ──── order_items ──── seats ┤
  │                                     │
  └── queue_entries                     │
                                        │
events ─── seat_sections ──────────────┘
  │              │
  └── orders     └── seats
  └── queue_entries
```

**7 bảng chính:**
- `users` — Tài khoản khách hàng & admin
- `events` — Sự kiện (draft/published/ended)
- `seat_sections` — Khu vực ghế (VIP, Standard...)
- `seats` — Từng ghế riêng lẻ (available/locked/sold)
- `orders` — Đơn đặt vé (pending/paid/cancelled)
- `order_items` — Chi tiết từng ghế trong đơn
- `queue_entries` — Hàng chờ ảo

---

## API Endpoints chính

### Auth
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/auth/register` | Đăng ký |
| POST | `/api/auth/login` | Đăng nhập |
| GET | `/api/auth/me` | Thông tin cá nhân |

### Events
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/events` | Danh sách sự kiện (filter, search, pagination) |
| GET | `/api/events/:id` | Chi tiết sự kiện |
| POST | `/api/events` | Tạo sự kiện (admin) |
| PUT | `/api/events/:id` | Cập nhật sự kiện (admin) |
| DELETE | `/api/events/:id` | Xóa sự kiện (admin) |

### Seats
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/seats/event/:id` | Lấy sơ đồ ghế |
| POST | `/api/seats/:id/lock` | Khoá ghế |
| POST | `/api/seats/:id/unlock` | Huỷ khoá ghế |

### Orders
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/orders/create` | Tạo đơn hàng |
| POST | `/api/orders/:id/confirm` | Xác nhận thanh toán |
| GET | `/api/orders/my-tickets` | Vé của tôi |

---

## WebSocket Events

| Event | Hướng | Mô tả |
|---|---|---|
| `seat:locked` | Server → Client | Ghế vừa bị khoá |
| `seat:released` | Server → Client | Ghế vừa được giải phóng |
| `seat:sold` | Server → Client | Ghế đã bán thành công |

---

## Xử lý Race Condition

Khi 2 user cùng chọn 1 ghế, hệ thống dùng **PostgreSQL transaction với `FOR UPDATE SKIP LOCKED`**:

```sql
BEGIN;
SELECT * FROM seats
WHERE id = $1 AND status = 'available'
FOR UPDATE SKIP LOCKED;
-- Nếu không lock được → báo lỗi ngay lập tức
UPDATE seats SET status = 'locked', locked_by = $2, locked_at = NOW()
WHERE id = $1;
COMMIT;
```

Chỉ **1 user** thành công. User còn lại nhận thông báo "Ghế đã được chọn bởi người khác".

---

## Screenshots

> *(Thêm ảnh chụp màn hình tại đây)*

---

## License

MIT License — Dự án học tập, không dùng cho mục đích thương mại.
