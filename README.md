# BrewLite

Ứng dụng đặt cà phê không dùng tiền mặt. Bài tập lớn môn Công nghệ Phần mềm, Đại học Sài Gòn, theo quy trình Agile Scrum.

## Công nghệ
- Frontend: Next.js (React, TypeScript), TailwindCSS, React Query, Zustand
- Backend: NestJS (TypeScript), REST, class-validator, JWT (Passport)
- CSDL: PostgreSQL + Prisma
- Thanh toán: mock payment gateway
- Triển khai: Docker Compose

## Yêu cầu cài đặt
Node.js LTS, Git, Docker Desktop.

## Cách 1: Chạy bằng Docker
```bash
docker compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Lần đầu build mất vài phút. Backend tự chạy migration và seed dữ liệu mẫu.
- Dừng: `Ctrl+C` hoặc `docker compose down`.

## Cách 2: Chạy môi trường dev
1. Bật CSDL: `docker compose up -d db`
2. Backend:
```bash
   cd backend
   cp .env.example .env
   npm install
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   npm run start:dev
```
3. Frontend (terminal khác):
```bash
   cd frontend
   cp .env.example .env.local
   npm install
   npm run dev
```

## Biến môi trường
| Biến | Nơi dùng | Ý nghĩa |
|---|---|---|
| DATABASE_URL | backend | Chuỗi kết nối PostgreSQL |
| JWT_SECRET | backend | Khóa ký JWT |
| CORS_ORIGIN | backend | Địa chỉ frontend được phép gọi API |
| PORT | backend | Cổng backend (3001) |
| NEXT_PUBLIC_API_URL | frontend | Địa chỉ backend |

## Dữ liệu demo
- Menu mẫu: 4 đồ uống (tạo tự động bằng seed).
- Mã khuyến mãi: `BREW10` (giảm 10%).
- Tài khoản: tự đăng ký tại `/register`.

## Danh sách endpoint
| Endpoint | Chức năng |
|---|---|
| GET /products | Danh sách sản phẩm |
| GET /products/:id | Chi tiết sản phẩm |
| POST /auth/register | Đăng ký |
| POST /auth/login | Đăng nhập, trả JWT |
| POST /orders | Tạo đơn (PENDING) |
| POST /payments | Thanh toán (header Idempotency-Key) |
| GET /orders/me | Lịch sử đơn của user |

## Giá size và topping
Size S +0đ, M +5.000đ, L +10.000đ. Topping Trân châu +5.000đ, Kem +5.000đ.

## Chạy test
```bash
cd backend
npm test
npm run test:e2e
```
(Cần `docker compose up -d db` cho test tích hợp.)

## Ghi chú Git
Code Task 4 (trang chi tiết, `pricing.ts`) được commit chung với Task 5.

## Thành viên nhóm
| Họ tên | MSSV | Vai trò |
|---|---|---|
| (điền) | (điền) | Product Owner |
| (điền) | (điền) | Scrum Master |
| (điền) | (điền) | Developer |