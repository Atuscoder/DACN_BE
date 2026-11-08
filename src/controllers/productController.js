const pool = require('../config/db');

// Lấy tất cả sản phẩm (có tìm kiếm + lọc)
exports.getAll = async (req, res) => {
  try {
    const { search, brand } = req.query;
    let sql = 'SELECT * FROM san_pham WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND ten_san_pham LIKE ?';
      params.push(`%${search}%`);
    }
    if (brand) {
      sql += ' AND thuong_hieu = ?';
      params.push(brand);
    }
    sql += ' ORDER BY ma_san_pham DESC';

    const [products] = await pool.query(sql, params);

    // Parse JSON fields
    const result = products.map(p => ({
      id: p.ma_san_pham,
      name: p.ten_san_pham,
      brand: p.thuong_hieu,
      price: p.gia_ban,
      oldPrice: p.gia_cu,
      image: p.hinh_anh,
      description: p.mo_ta,
      colors: typeof p.mau_sac === 'string' ? JSON.parse(p.mau_sac) : p.mau_sac,
      storage: typeof p.dung_luong === 'string' ? JSON.parse(p.dung_luong) : p.dung_luong,
      specs: typeof p.thong_so === 'string' ? JSON.parse(p.thong_so) : p.thong_so,
      rating: p.danh_gia,
      stock: p.so_luong_ton
    }));

    res.json({ products: result, total: result.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách sản phẩm' });
  }
};

// Lấy chi tiết 1 sản phẩm
exports.getById = async (req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM san_pham WHERE ma_san_pham = ?', [req.params.id]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    const p = products[0];
    res.json({
      id: p.ma_san_pham,
      name: p.ten_san_pham,
      brand: p.thuong_hieu,
      price: p.gia_ban,
      oldPrice: p.gia_cu,
      image: p.hinh_anh,
      description: p.mo_ta,
      colors: typeof p.mau_sac === 'string' ? JSON.parse(p.mau_sac) : p.mau_sac,
      storage: typeof p.dung_luong === 'string' ? JSON.parse(p.dung_luong) : p.dung_luong,
      specs: typeof p.thong_so === 'string' ? JSON.parse(p.thong_so) : p.thong_so,
      rating: p.danh_gia,
      stock: p.so_luong_ton
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết sản phẩm' });
  }
};

// Admin: Thêm sản phẩm
exports.create = async (req, res) => {
  try {
    const { name, brand, price, oldPrice, image, description, colors, storage, specs, stock } = req.body;
    if (!name || !brand || !price) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (name, brand, price)' });
    }

    const [result] = await pool.query(
      `INSERT INTO san_pham (ten_san_pham, thuong_hieu, gia_ban, gia_cu, hinh_anh, mo_ta, mau_sac, dung_luong, thong_so, so_luong_ton)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, brand, price, oldPrice || null, image || null, description || null,
        JSON.stringify(colors || []), JSON.stringify(storage || []), JSON.stringify(specs || {}),
        stock || 0
      ]
    );

    res.status(201).json({ message: 'Thêm sản phẩm thành công', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi thêm sản phẩm' });
  }
};

// Admin: Cập nhật sản phẩm
exports.update = async (req, res) => {
  try {
    const { name, brand, price, oldPrice, image, description, colors, storage, specs, stock } = req.body;
    const [result] = await pool.query(
      `UPDATE san_pham SET 
        ten_san_pham = COALESCE(?, ten_san_pham),
        thuong_hieu = COALESCE(?, thuong_hieu),
        gia_ban = COALESCE(?, gia_ban),
        gia_cu = COALESCE(?, gia_cu),
        hinh_anh = COALESCE(?, hinh_anh),
        mo_ta = COALESCE(?, mo_ta),
        mau_sac = COALESCE(?, mau_sac),
        dung_luong = COALESCE(?, dung_luong),
        thong_so = COALESCE(?, thong_so),
        so_luong_ton = COALESCE(?, so_luong_ton)
       WHERE ma_san_pham = ?`,
      [
        name, brand, price, oldPrice, image, description,
        colors ? JSON.stringify(colors) : null,
        storage ? JSON.stringify(storage) : null,
        specs ? JSON.stringify(specs) : null,
        stock, req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    res.json({ message: 'Cập nhật sản phẩm thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi cập nhật sản phẩm' });
  }
};

// Admin: Xóa sản phẩm
exports.remove = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM san_pham WHERE ma_san_pham = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi xóa sản phẩm' });
  }
};
