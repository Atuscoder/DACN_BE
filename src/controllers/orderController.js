const pool = require('../config/db');

// Tạo đơn hàng từ giỏ hàng
exports.create = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { customerName, phone, address, items } = req.body;
    // items: [{ productId, quantity, color, storage, price }]

    if (!customerName || !phone || !address || !items || items.length === 0) {
      return res.status(400).json({ message: 'Thiếu thông tin đặt hàng hoặc giỏ hàng trống' });
    }

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Tạo đơn hàng
    const [orderResult] = await connection.query(
      `INSERT INTO don_hang (ma_nguoi_dung, tong_tien, ten_nguoi_nhan, so_dien_thoai, dia_chi)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, totalAmount, customerName, phone, address]
    );
    const orderId = orderResult.insertId;

    // Thêm chi tiết đơn hàng
    for (const item of items) {
      await connection.query(
        `INSERT INTO chi_tiet_don_hang (ma_don_hang, ma_san_pham, so_luong, gia, mau_sac, dung_luong)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.quantity, item.price, item.color || null, item.storage || null]
      );

      // Giảm tồn kho
      await connection.query(
        'UPDATE san_pham SET so_luong_ton = so_luong_ton - ? WHERE ma_san_pham = ?',
        [item.quantity, item.productId]
      );
    }

    // Xóa giỏ hàng của user (nếu dùng DB cart)
    const [carts] = await connection.query('SELECT ma_gio_hang FROM gio_hang WHERE ma_nguoi_dung = ?', [req.user.id]);
    if (carts.length > 0) {
      await connection.query('DELETE FROM chi_tiet_gio_hang WHERE ma_gio_hang = ?', [carts[0].ma_gio_hang]);
    }

    await connection.commit();

    res.status(201).json({
      message: 'Đặt hàng thành công',
      orderId,
      totalAmount,
      status: 'Chờ xác nhận'
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi tạo đơn hàng' });
  } finally {
    connection.release();
  }
};

// Lấy lịch sử đơn hàng của user
exports.getMyOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT ma_don_hang AS id, tong_tien AS totalAmount, trang_thai AS status,
              ten_nguoi_nhan AS customerName, so_dien_thoai AS phone, dia_chi AS address,
              ngay_dat AS createdAt
       FROM don_hang WHERE ma_nguoi_dung = ? ORDER BY ngay_dat DESC`,
      [req.user.id]
    );

    // Lấy chi tiết từng đơn
    for (let order of orders) {
      const [items] = await pool.query(
        `SELECT ct.ma_san_pham AS productId, sp.ten_san_pham AS name, sp.hinh_anh AS image,
                ct.so_luong AS quantity, ct.gia AS price, ct.mau_sac AS color, ct.dung_luong AS storage
         FROM chi_tiet_don_hang ct
         JOIN san_pham sp ON ct.ma_san_pham = sp.ma_san_pham
         WHERE ct.ma_don_hang = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy lịch sử đơn hàng' });
  }
};

// Admin: Lấy tất cả đơn hàng
exports.getAll = async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT dh.ma_don_hang AS id, dh.tong_tien AS totalAmount, dh.trang_thai AS status,
              dh.ten_nguoi_nhan AS customerName, dh.so_dien_thoai AS phone, dh.dia_chi AS address,
              dh.ngay_dat AS createdAt, nd.ho_ten AS userName, nd.email AS userEmail
       FROM don_hang dh
       JOIN nguoi_dung nd ON dh.ma_nguoi_dung = nd.ma_nguoi_dung
       ORDER BY dh.ngay_dat DESC`
    );
    res.json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đơn hàng' });
  }
};

// Admin: Cập nhật trạng thái đơn hàng
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Chờ xác nhận', 'Đang giao', 'Hoàn thành', 'Đã hủy'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const [result] = await pool.query(
      'UPDATE don_hang SET trang_thai = ? WHERE ma_don_hang = ?',
      [status, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    res.json({ message: 'Cập nhật trạng thái thành công', status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái' });
  }
};
