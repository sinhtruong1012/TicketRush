# TicketRush — Nền tảng đặt vé online

## Goal
Xây dựng hệ thống phân phối vé điện tử chịu tải cao, xử lý flash sale với sơ đồ ghế real-time, virtual queue, và quản trị admin.

## Project Type
**WEB** (React SPA + Express REST API)

## Success Criteria
- [ ] Customer: tìm kiếm event → chọn ghế (real-time) → checkout → nhận QR
- [ ] Admin: tạo event + sơ đồ ghế → dashboard real-time (doanh thu, demographics)
- [ ] Race condition: 2 user cùng click 1 ghế → chỉ 1 người thành công
- [ ] Seat timeout: ghế locked 10 phút không thanh toán → tự release
- [ ] Virtual Queue: quá tải → waiting room → cấp quyền theo batch
- [ ] Giao diện responsive, đẹp, dark theme, có brand identity

## Tech Stack

| Layer | Tech | Lý do |
|-------|------|-------|
| **Runtime** | Node.js 20+ | Cùng ngôn ngữ FE+BE, nhanh |
| **Backend** | Express.js | REST API thuần, nhẹ, linh hoạt |
| **Database** | PostgreSQL | Row-level locking (FOR UPDATE), transaction mạnh |
| **ORM** | Sequelize v6 | ORM hướng đối tượng (tiêu chí 9), migration |
| **Frontend** | React 19 (Vite) | Component-based, state management tốt cho seat map |
| **Styling** | CSS Modules | Scoped styles, không conflict, dễ maintain |
| **Routing (FE)** | React Router v7 | SPA navigation, protected routes |
| **HTTP Client** | fetch API (native) | Gọi REST API, thể hiện tiêu chí 4 |
| **Real-time** | Socket.IO + socket.io-client | WebSocket 2 chiều, fallback polling |
| **Auth** | JWT + bcrypt | Stateless auth, token lưu localStorage |
| **Job Queue** | node-cron | Quét seat expired mỗi 30s |
| **QR Code** | qrcode (npm) | Generate QR server-side |
| **Charts** | Recharts | React-native charting cho admin dashboard |

## File Structure

```
ticketrush/
├── backend/                         # Express REST API
│   ├── server.js                    # Entry point + Socket.IO setup
│   ├── package.json
│   ├── .env                         # DB credentials, JWT secret, CORS origin
│   ├── config/
│   │   └── database.js              # Sequelize connection + pool
│   ├── models/
│   │   ├── index.js                 # Sequelize init + associations
│   │   ├── User.js
│   │   ├── Event.js
│   │   ├── SeatSection.js
│   │   ├── Seat.js
│   │   ├── Order.js
│   │   ├── OrderItem.js
│   │   └── QueueEntry.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── eventController.js
│   │   ├── seatController.js        # Lock/release/status (race condition)
│   │   ├── orderController.js       # Checkout flow
│   │   ├── queueController.js       # Virtual queue
│   │   └── adminController.js       # Dashboard data
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── seatRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── queueRoutes.js
│   │   └── adminRoutes.js
│   ├── middlewares/
│   │   ├── auth.js                  # JWT verify
│   │   ├── admin.js                 # Role check
│   │   ├── cors.js                  # CORS config cho React dev server
│   │   ├── validator.js             # Input validation (express-validator)
│   │   └── queueGuard.js            # Check queue token
│   ├── services/
│   │   ├── seatLockService.js       # Transaction + FOR UPDATE logic
│   │   ├── ticketLifecycle.js       # Cron: release expired seats
│   │   └── virtualQueue.js          # Queue algorithm
│   ├── socket/
│   │   └── seatSocket.js            # Broadcast seat status changes
│   └── seeders/
│       └── seed.js                  # Admin user + sample events + seats
│
└── frontend/                        # React SPA (Vite)
    ├── package.json
    ├── vite.config.js               # Proxy /api → backend:5000
    ├── index.html
    ├── public/
    │   └── favicon.svg
    └── src/
        ├── main.jsx                 # React entry point
        ├── App.jsx                  # Router setup
        ├── index.css                # Global styles, CSS variables, fonts
        ├── api/
        │   └── client.js            # fetch wrapper (base URL, auth header)
        ├── context/
        │   ├── AuthContext.jsx       # JWT state, login/logout/register
        │   └── SocketContext.jsx     # Socket.IO connection provider
        ├── hooks/
        │   ├── useAuth.js           # Auth context consumer
        │   ├── useSocket.js         # Socket context consumer
        │   └── useCountdown.js      # Countdown timer hook (checkout)
        ├── components/
        │   ├── Layout/
        │   │   ├── Navbar.jsx
        │   │   ├── Footer.jsx
        │   │   └── ProtectedRoute.jsx
        │   ├── EventCard.jsx
        │   ├── SeatMap.jsx          # ⭐ Interactive seat grid component
        │   ├── SeatLegend.jsx
        │   ├── CheckoutSummary.jsx
        │   ├── QRTicket.jsx
        │   ├── WaitingRoom.jsx
        │   ├── CountdownTimer.jsx
        │   ├── SearchBar.jsx
        │   ├── Toast.jsx
        │   └── LoadingSpinner.jsx
        ├── pages/
        │   ├── LandingPage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── EventsPage.jsx
        │   ├── EventDetailPage.jsx
        │   ├── SeatSelectionPage.jsx # Uses SeatMap component
        │   ├── CheckoutPage.jsx
        │   ├── MyTicketsPage.jsx
        │   ├── WaitingRoomPage.jsx
        │   └── admin/
        │       ├── DashboardPage.jsx
        │       ├── CreateEventPage.jsx
        │       └── ManageEventsPage.jsx
        └── utils/
            ├── formatDate.js
            ├── formatCurrency.js
            └── constants.js
```

## Database Schema

```
users: id, email, password_hash, full_name, phone, gender(enum), birth_date, role(enum:customer|admin), created_at
events: id, title, description, category, venue_name, venue_address, event_date, sale_start_at, poster_url, status(enum:draft|published|ended), created_at
seat_sections: id, event_id(FK), name, rows_count, seats_per_row, price, color_code
seats: id, section_id(FK), row_label, seat_number, status(enum:available|locked|sold), locked_by(FK→users), locked_at, version(int)
orders: id, user_id(FK), event_id(FK), total_amount, status(enum:pending|paid|cancelled), qr_code_data, expires_at, paid_at, created_at
order_items: id, order_id(FK), seat_id(FK), price_at_purchase
queue_entries: id, event_id(FK), user_id(FK), position, access_token, status(enum:waiting|admitted|expired), admitted_at, created_at
```

## Tasks

### Phase 1: Foundation (Ngày 1-4)

- [ ] **T1: Backend init + dependencies**
  - `mkdir backend && cd backend && npm init -y`
  - Install: express, sequelize, pg, pg-hstore, socket.io, bcryptjs, jsonwebtoken, qrcode, node-cron, dotenv, express-validator, cors
  - Setup `server.js`: Express + CORS + Socket.IO trên port 5000
  - **Verify:** `npm start` → `http://localhost:5000/api/health` trả `{status: "ok"}`

- [ ] **T2: Frontend init (React + Vite)**
  - `npm create vite@latest frontend -- --template react`
  - Install: react-router-dom, socket.io-client, recharts
  - Setup `vite.config.js` với proxy: `/api` → `http://localhost:5000`
  - Tạo folder structure: `api/`, `context/`, `hooks/`, `components/`, `pages/`
  - Setup React Router trong `App.jsx` với tất cả routes
  - Tạo `api/client.js` — fetch wrapper tự đính JWT token
  - **Verify:** `npm run dev` → `http://localhost:5173` hiện React app

- [ ] **T3: Database + Sequelize models**
  - Config Sequelize → PostgreSQL connection (`.env`)
  - Tạo 7 models với associations (hasMany, belongsTo)
  - `sequelize.sync({force:true})` tạo tables
  - Seed data: 1 admin, 2 events mẫu, seat sections + seats
  - **Verify:** `psql` → thấy 7 tables, seed data đầy đủ

- [ ] **T4: Auth system (API + React pages)**
  - Backend: POST `/api/auth/register`, POST `/api/auth/login`, GET `/api/auth/me`
  - Middleware: `auth.js` (verify JWT), `admin.js` (check role)
  - Frontend: `AuthContext.jsx` — login/logout/register state, token trong localStorage
  - React pages: `LoginPage.jsx`, `RegisterPage.jsx` với form validation
  - `ProtectedRoute.jsx` — redirect nếu chưa login
  - **Verify:** Register → Login → token lưu → access protected route → OK

### Phase 2: Core Features (Ngày 5-9)

- [ ] **T5: Event CRUD + Seat Section Config (Admin)**
  - Backend: CRUD `/api/events`, POST `/api/events/:id/sections`
  - Auto-generate `seats` records khi tạo section (row_label: A,B,C..., seat_number: 1,2,3...)
  - Frontend: `CreateEventPage.jsx` — form tạo event + dynamic section inputs
  - `ManageEventsPage.jsx` — list events, edit, delete
  - **Verify:** Admin tạo event + 3 sections → DB có seats auto-generated

- [ ] **T6: Event listing + Detail page (Customer)**
  - Backend: GET `/api/events` (search, filter, pagination), GET `/api/events/:id`
  - Frontend: `EventsPage.jsx` — grid `EventCard` components, `SearchBar`, filter
  - `EventDetailPage.jsx` — poster, info, section preview, CTA "Đặt vé"
  - Dùng fetch API, React state update (NO page reload khi filter)
  - **Verify:** Trang events hiện cards, search/filter hoạt động, click vào thấy chi tiết

- [ ] **T7: Seat Map Interactive + Race Condition**
  - Backend: GET `/api/events/:id/seats`, POST `/api/seats/lock`, POST `/api/seats/unlock`
  - **seatLockService.js** — PostgreSQL transaction:
    ```sql
    BEGIN;
    SELECT * FROM seats WHERE id=$1 AND status='available' FOR UPDATE SKIP LOCKED;
    UPDATE seats SET status='locked', locked_by=$2, locked_at=NOW() WHERE id=$1;
    COMMIT;
    ```
  - Frontend: `SeatMap.jsx` component — render grid ghế theo sections
    - Click ghế → call API lock → update local state
    - Mỗi ghế = 1 button, màu theo status (available/locked/sold/selected)
    - `SeatLegend.jsx` — chú thích màu
  - Max 4 ghế/lần mua
  - **Verify:** 2 tab cùng click 1 ghế → chỉ 1 thành công, tab kia nhận toast "Ghế đã được chọn"

- [ ] **T8: Checkout + Ticket Lifecycle**
  - Backend: POST `/api/orders/create`, POST `/api/orders/:id/confirm`, GET `/api/orders/my-tickets`
  - `ticketLifecycle.js` — node-cron (mỗi 30s): seats locked > 10 phút → release
  - QR Code: generate bằng `qrcode` npm, trả base64 image
  - Frontend: `CheckoutPage.jsx` — `CheckoutSummary` + `CountdownTimer` (10 phút) + nút "Xác nhận"
  - `MyTicketsPage.jsx` — list orders + `QRTicket` component hiển thị QR
  - `useCountdown.js` hook — đếm ngược, auto-redirect khi hết giờ
  - **Verify:** Lock ghế → chờ 10 phút → ghế tự release. Pay thành công → QR xuất hiện

### Phase 3: Real-time + Advanced (Ngày 10-14)

- [ ] **T9: WebSocket real-time seat updates**
  - Backend: `seatSocket.js` — emit `seat:locked`, `seat:released`, `seat:sold` events
  - Frontend: `SocketContext.jsx` — connect Socket.IO, join room `event:{id}`
  - `SeatMap.jsx` listen socket events → update seat status in real-time
  - Không cần F5 để thấy ghế thay đổi
  - **Verify:** Tab A lock ghế → Tab B thấy ghế đổi màu xám tức thì

- [ ] **T10: Virtual Queue system**
  - Backend: `virtualQueue.js` service
    - Config `MAX_CONCURRENT` per event (default 50)
    - POST `/api/queue/join` → insert queue_entry, return position
    - GET `/api/queue/status` → return position + estimated time
    - `queueGuard.js` middleware: check active users, nếu vượt → return `{queued: true}`
    - Cron: khi user checkout/timeout → admit next batch (10 users), cấp access_token
  - Frontend: `WaitingRoomPage.jsx` — `WaitingRoom` component
    - Polling mỗi 3s: GET `/api/queue/status`
    - Hiển thị: vị trí, estimated time, animation loading
    - Khi admitted → redirect vào `SeatSelectionPage`
  - **Verify:** Set MAX=2, mở 3 tabs → tab 3 vào waiting room → khi tab 1 checkout → tab 3 được vào

- [ ] **T11: Admin Dashboard**
  - Backend: GET `/api/admin/stats` — revenue, ticket count, demographics, seat fill-rate
  - Frontend: `DashboardPage.jsx`
    - Recharts: AreaChart (revenue theo ngày), PieChart (giới tính), BarChart (độ tuổi)
    - Cards: tổng doanh thu, vé bán, events active
    - Seat fill-rate per event (progress bars)
  - Socket.IO: real-time update dashboard khi có đơn mới
  - **Verify:** Mua vé → dashboard tự cập nhật revenue + seat fill-rate

### Phase 4: Polish (Ngày 15-17)

- [ ] **T12: UI/UX Design System + Responsive**
  - `index.css`: CSS variables (design tokens), Google Fonts (Inter + Outfit)
  - Dark theme: bg `#0a0a0f`, accent Electric Blue `#00D4FF`, accent Coral `#FF6B6B`
  - CSS Modules cho mỗi component: cards, buttons, forms, modals
  - Seat map CSS: hover glow, click pulse animation, lock fade
  - Responsive: mobile-first, breakpoints 768px / 1024px
  - `Toast.jsx` component — success/error/info notifications
  - `LoadingSpinner.jsx` — skeleton loading
  - **Verify:** Mở trên mobile (375px) + desktop → layout đẹp, không vỡ

- [ ] **T13: Input Validation + Error Handling**
  - Backend: express-validator trên mọi route
  - Frontend: form validation trong React (controlled components, error state)
  - API error handling: try/catch, error response format chuẩn `{error, message}`
  - 404 page đẹp trong React Router
  - **Verify:** Submit form trống → thấy error messages, API trả validation errors

## Done When
- [ ] Customer flow hoàn chỉnh: register → browse → select seats → pay → QR
- [ ] Admin flow hoàn chỉnh: create event → config seats → view dashboard
- [ ] Race condition proof: concurrent seat lock chỉ 1 thắng
- [ ] Seat auto-release sau 10 phút
- [ ] Real-time seat map (không cần F5)
- [ ] Virtual Queue hoạt động khi quá tải
- [ ] Responsive trên mobile + desktop
- [ ] Giao diện dark theme đẹp, có brand identity

## Phase X: Verification

```bash
# 1. Backend check
cd backend && npm start  # API chạy port 5000

# 2. Frontend check
cd frontend && npm run dev   # React chạy port 5173
cd frontend && npm run build # Build production OK, no errors

# 3. Manual test
# - Register/Login flow
# - Create event (admin)
# - Select seats (2 browsers cùng lúc)
# - Checkout + QR
# - Wait 10min → seat release
# - Virtual Queue (set MAX_CONCURRENT=2)

# 4. Responsive test
# - Chrome DevTools → iPhone SE, iPad, Desktop
```

- [ ] Race condition test passed
- [ ] Seat timeout release works
- [ ] WebSocket real-time works
- [ ] Virtual Queue works
- [ ] Responsive trên 3 breakpoints
- [ ] All forms validated (client + server)
- [ ] `npm run build` thành công (no errors)

## Notes
- **Timeline:** ~17 ngày làm việc (22/4 → 10/5), demo 11-16/5
- **Architecture:** Backend (port 5000) ↔ React (port 5173, proxy `/api`). Production: Vite build → Express serve static
- **Phân công gợi ý:**
  - Dev 1 (Backend): T1, T3, T4, T7 (race condition logic), T8 (backend)
  - Dev 2 (Frontend/React): T2, T6, T12, T13, seat-map UI trong T7, checkout UI trong T8
  - Dev 3 (Real-time + Admin): T5 (admin pages), T9, T10, T11
- **T12 (UI) nên bắt đầu song song từ Phase 1** — design tokens + base styles trước
- **React learning:** Nhóm chưa biết React → dành ngày 1-2 học cơ bản (JSX, hooks, state, fetch) song song với setup
