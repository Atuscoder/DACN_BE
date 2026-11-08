# PhoneStore Backend

Backend API cho hệ thống **Bán điện thoại trực tuyến + Chatbot AI + Admin**.

## Công nghệ
- Node.js + Express
- MySQL
- JWT Authentication
- OpenAI API (tuỳ chọn) + Rule-based fallback

## Cài đặt

### 1. Cài dependencies
```bash
cd PhoneStore-BE
npm install
```

### 2. Cấu hình Database
```bash
mysql -u root -p < sql/schema.sql
```

### 3. Cấu hình .env
Copy `.env.example` thành `.env` và sửa mật khẩu MySQL.

### 4. Tạo tài khoản Admin
1. Đăng ký tài khoản trên Frontend
2. Chạy SQL trong phpMyAdmin:

```sql
UPDATE nguoi_dung SET vai_tro = 'admin' WHERE email = 'email_cua_ban@gmail.com';
```

3. Đăng xuất rồi đăng nhập lại → vào được `/admin`

### 5. Chạy server
```bash
npm run dev
```

Server: **http://localhost:5000**

## API chính

### Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`

### Products
- GET `/api/products`
- GET `/api/products/:id`
- POST/PUT/DELETE `/api/products` (Admin)

### Orders
- POST `/api/orders` (User)
- GET `/api/orders/my` (User)
- GET `/api/orders` (Admin)
- PATCH `/api/orders/:id/status` (Admin)

### Chat
- POST `/api/chat`
