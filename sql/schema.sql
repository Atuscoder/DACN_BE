-- =============================================
-- DATABASE: PhoneStore - Hệ thống bán điện thoại + Chatbot AI
-- =============================================

CREATE DATABASE IF NOT EXISTS phonestore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE phonestore;

-- 1. Bảng người dùng
CREATE TABLE IF NOT EXISTS nguoi_dung (
  ma_nguoi_dung INT AUTO_INCREMENT PRIMARY KEY,
  ho_ten VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  mat_khau VARCHAR(255) NOT NULL,
  vai_tro ENUM('user', 'admin') DEFAULT 'user',
  trang_thai ENUM('active', 'locked') DEFAULT 'active',
  ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Bảng sản phẩm
CREATE TABLE IF NOT EXISTS san_pham (
  ma_san_pham INT AUTO_INCREMENT PRIMARY KEY,
  ten_san_pham VARCHAR(200) NOT NULL,
  thuong_hieu VARCHAR(50) NOT NULL,
  gia_ban INT NOT NULL,
  gia_cu INT NULL,
  hinh_anh VARCHAR(500) NULL,
  mo_ta TEXT NULL,
  mau_sac JSON NULL,          -- ["Đen", "Trắng", "Xanh"]
  dung_luong JSON NULL,       -- ["128GB", "256GB", "512GB"]
  thong_so JSON NULL,         -- { "man_hinh": "...", "chip": "...", ... }
  danh_gia DECIMAL(2,1) DEFAULT 0,
  so_luong_ton INT DEFAULT 0,
  ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Bảng giỏ hàng
CREATE TABLE IF NOT EXISTS gio_hang (
  ma_gio_hang INT AUTO_INCREMENT PRIMARY KEY,
  ma_nguoi_dung INT NOT NULL UNIQUE,
  ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ma_nguoi_dung) REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Chi tiết giỏ hàng
CREATE TABLE IF NOT EXISTS chi_tiet_gio_hang (
  ma_chi_tiet INT AUTO_INCREMENT PRIMARY KEY,
  ma_gio_hang INT NOT NULL,
  ma_san_pham INT NOT NULL,
  so_luong INT NOT NULL DEFAULT 1,
  mau_sac VARCHAR(50) NULL,
  dung_luong VARCHAR(20) NULL,
  FOREIGN KEY (ma_gio_hang) REFERENCES gio_hang(ma_gio_hang) ON DELETE CASCADE,
  FOREIGN KEY (ma_san_pham) REFERENCES san_pham(ma_san_pham) ON DELETE CASCADE,
  UNIQUE KEY unique_cart_item (ma_gio_hang, ma_san_pham, mau_sac, dung_luong)
) ENGINE=InnoDB;

-- 5. Bảng đơn hàng
CREATE TABLE IF NOT EXISTS don_hang (
  ma_don_hang INT AUTO_INCREMENT PRIMARY KEY,
  ma_nguoi_dung INT NOT NULL,
  tong_tien INT NOT NULL,
  trang_thai VARCHAR(30) DEFAULT 'Chờ xác nhận',
  ten_nguoi_nhan VARCHAR(100) NOT NULL,
  so_dien_thoai VARCHAR(15) NOT NULL,
  dia_chi TEXT NOT NULL,
  ngay_dat DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ma_nguoi_dung) REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Chi tiết đơn hàng
CREATE TABLE IF NOT EXISTS chi_tiet_don_hang (
  ma_chi_tiet INT AUTO_INCREMENT PRIMARY KEY,
  ma_don_hang INT NOT NULL,
  ma_san_pham INT NOT NULL,
  so_luong INT NOT NULL,
  gia INT NOT NULL,
  mau_sac VARCHAR(50) NULL,
  dung_luong VARCHAR(20) NULL,
  FOREIGN KEY (ma_don_hang) REFERENCES don_hang(ma_don_hang) ON DELETE CASCADE,
  FOREIGN KEY (ma_san_pham) REFERENCES san_pham(ma_san_pham) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Bảng tin nhắn chatbot
CREATE TABLE IF NOT EXISTS tin_nhan_chat (
  ma_tin_nhan INT AUTO_INCREMENT PRIMARY KEY,
  ma_nguoi_dung INT NULL,
  loai_nguoi_gui ENUM('user', 'bot') NOT NULL,
  noi_dung TEXT NOT NULL,
  thoi_gian_gui DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ma_nguoi_dung) REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =============================================
-- DỮ LIỆU MẪU
-- =============================================

-- Admin mặc định (password: admin123)
INSERT INTO nguoi_dung (ho_ten, email, mat_khau, vai_tro) VALUES
('Quản trị viên', 'admin@phonestore.com', '$2a$10$rQZ5K5Y5Y5Y5Y5Y5Y5Y5YuG5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y', 'admin');

-- Sản phẩm mẫu
INSERT INTO san_pham (ten_san_pham, thuong_hieu, gia_ban, gia_cu, hinh_anh, mo_ta, mau_sac, dung_luong, thong_so, danh_gia, so_luong_ton) VALUES
('iPhone 16 Pro Max', 'Apple', 34990000, 37990000, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', 'Flagship mạnh nhất của Apple năm 2024', '["Titan Tự Nhiên", "Titan Đen", "Titan Trắng"]', '["256GB", "512GB", "1TB"]', '{"man_hinh": "6.9 inch Super Retina XDR", "chip": "A18 Pro", "camera": "48MP + 48MP + 12MP", "pin": "4685 mAh", "os": "iOS 18"}', 4.9, 50),
('Samsung Galaxy S25 Ultra', 'Samsung', 31990000, 34990000, 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400', 'Siêu phẩm Android với S Pen và camera 200MP', '["Titanium Gray", "Titanium Black", "Titanium Violet"]', '["256GB", "512GB", "1TB"]', '{"man_hinh": "6.8 inch Dynamic AMOLED 2X", "chip": "Snapdragon 8 Elite", "camera": "200MP + 50MP + 50MP + 10MP", "pin": "5000 mAh", "os": "Android 15"}', 4.8, 40),
('Xiaomi 15 Ultra', 'Xiaomi', 24990000, 27990000, 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400', 'Camera Leica đỉnh cao, hiệu năng mạnh mẽ', '["Đen", "Trắng", "Xanh"]', '["256GB", "512GB"]', '{"man_hinh": "6.73 inch AMOLED", "chip": "Snapdragon 8 Elite", "camera": "50MP Leica + 50MP + 50MP", "pin": "5400 mAh", "os": "HyperOS"}', 4.7, 60),
('iPhone 15', 'Apple', 18990000, 21990000, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', 'iPhone tầm trung rất đáng mua', '["Đen", "Xanh", "Hồng", "Vàng"]', '["128GB", "256GB"]', '{"man_hinh": "6.1 inch Super Retina XDR", "chip": "A16 Bionic", "camera": "48MP + 12MP", "pin": "3349 mAh", "os": "iOS 17"}', 4.8, 80),
('Samsung Galaxy A56', 'Samsung', 9990000, 10990000, 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400', 'Tầm trung cực tốt, pin trâu', '["Đen", "Xanh dương", "Tím"]', '["128GB", "256GB"]', '{"man_hinh": "6.6 inch Super AMOLED", "chip": "Exynos 1580", "camera": "50MP + 12MP + 5MP", "pin": "5000 mAh", "os": "Android 15"}', 4.5, 100),
('OPPO Find X8', 'OPPO', 19990000, 22990000, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', 'Thiết kế đẹp, sạc siêu nhanh', '["Đen", "Xanh"]', '["256GB", "512GB"]', '{"man_hinh": "6.59 inch AMOLED", "chip": "Dimensity 9400", "camera": "50MP + 50MP + 50MP", "pin": "5630 mAh", "os": "ColorOS 15"}', 4.6, 45),
('Redmi Note 14 Pro', 'Xiaomi', 7990000, 8990000, 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400', 'Giá tốt, camera 200MP', '["Đen", "Xanh", "Tím"]', '["128GB", "256GB"]', '{"man_hinh": "6.67 inch AMOLED", "chip": "Dimensity 7300", "camera": "200MP + 8MP + 2MP", "pin": "5500 mAh", "os": "HyperOS"}', 4.4, 120),
('iPhone 16', 'Apple', 22990000, 24990000, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', 'iPhone mới nhất phân khúc tiêu chuẩn', '["Đen", "Trắng", "Hồng", "Xanh dương"]', '["128GB", "256GB", "512GB"]', '{"man_hinh": "6.1 inch Super Retina XDR", "chip": "A18", "camera": "48MP + 12MP", "pin": "3561 mAh", "os": "iOS 18"}', 4.8, 70);

SELECT 'Database và dữ liệu mẫu đã tạo thành công!' AS message;
