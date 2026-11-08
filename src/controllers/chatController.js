const pool = require('../config/db');
require('dotenv').config();

// Rule-based fallback (khi không có OpenAI key)
function getRuleBasedReply(message) {
  const msg = message.toLowerCase();

  if (msg.includes('iphone') || msg.includes('apple')) {
    return '🍎 Hiện mình đang có:\n• iPhone 16 Pro Max (~35 triệu) - Flagship mạnh nhất\n• iPhone 16 (~23 triệu)\n• iPhone 15 (~19 triệu) - Rất đáng mua\nBạn muốn xem chi tiết máy nào không?';
  }
  if (msg.includes('samsung') || msg.includes('galaxy')) {
    return '📱 Samsung đang hot:\n• Galaxy S25 Ultra (~32 triệu) - Có S Pen + camera 200MP\n• Galaxy A56 (~10 triệu) - Tầm trung cực tốt\nBạn thích phân khúc nào?';
  }
  if (msg.includes('xiaomi') || msg.includes('redmi')) {
    return '⚡ Xiaomi giá tốt:\n• Xiaomi 15 Ultra (~25 triệu) - Camera Leica\n• Redmi Note 14 Pro (~8 triệu) - Camera 200MP\nBạn đang quan tâm máy nào?';
  }
  if (msg.includes('pin') || msg.includes('trâu')) {
    return '🔋 Máy pin trâu mình recommend:\n• OPPO Find X8 (5630 mAh)\n• Redmi Note 14 Pro (5500 mAh)\n• Xiaomi 15 Ultra (5400 mAh)\n• Samsung Galaxy S25 Ultra (5000 mAh)';
  }
  if (msg.includes('camera') || msg.includes('chụp ảnh') || msg.includes('ảnh đẹp')) {
    return '📸 Máy chụp ảnh đẹp:\n• Samsung Galaxy S25 Ultra - Camera 200MP\n• Xiaomi 15 Ultra - Camera Leica\n• iPhone 16 Pro Max - Camera siêu nét\nBạn ưu tiên thương hiệu nào?';
  }
  if (msg.includes('giá') || msg.includes('rẻ') || msg.includes('dưới')) {
    return '💰 Một số máy giá tốt:\n• Redmi Note 14 Pro (~8 triệu)\n• Samsung Galaxy A56 (~10 triệu)\n• iPhone 15 (~19 triệu)\nBạn muốn tầm giá bao nhiêu?';
  }
  if (msg.includes('xin chào') || msg.includes('hello') || msg.includes('hi') || msg.includes('chào')) {
    return 'Xin chào! 👋 Mình là trợ lý AI của PhoneStore. Bạn đang tìm điện thoại như thế nào? (ví dụ: iPhone dưới 20 triệu, Samsung pin trâu, máy chụp ảnh đẹp...)';
  }
  if (msg.includes('cảm ơn') || msg.includes('thank')) {
    return 'Không có gì ạ! Nếu cần tư vấn thêm cứ hỏi mình nhé 😊';
  }

  return 'Mình chưa hiểu rõ câu hỏi của bạn. Bạn có thể hỏi về:\n• Thương hiệu (iPhone, Samsung, Xiaomi...)\n• Tầm giá\n• Pin, camera, hiệu năng\nHoặc mô tả nhu cầu cụ thể để mình gợi ý nhé!';
}

// Gọi OpenAI (nếu có key)
async function callOpenAI(message) {
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Bạn là trợ lý tư vấn bán điện thoại thông minh của PhoneStore.
Hãy trả lời ngắn gọn, thân thiện, bằng tiếng Việt.
Các sản phẩm hiện có: iPhone 16 Pro Max, iPhone 16, iPhone 15, Samsung Galaxy S25 Ultra, Galaxy A56, Xiaomi 15 Ultra, Redmi Note 14 Pro, OPPO Find X8.
Khi gợi ý sản phẩm, hãy nêu tên + giá khoảng + điểm nổi bật.`
        },
        { role: 'user', content: message }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    return completion.choices[0].message.content;
  } catch (err) {
    console.error('OpenAI error:', err.message);
    return null; // fallback
  }
}

// API Chat
exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập nội dung tin nhắn' });
    }

    let reply;

    // Ưu tiên OpenAI nếu có key
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '') {
      reply = await callOpenAI(message.trim());
    }

    // Fallback rule-based
    if (!reply) {
      reply = getRuleBasedReply(message.trim());
    }

    // Lưu lịch sử chat (nếu user đã đăng nhập)
    const userId = req.user ? req.user.id : null;
    await pool.query(
      'INSERT INTO tin_nhan_chat (ma_nguoi_dung, loai_nguoi_gui, noi_dung) VALUES (?, ?, ?)',
      [userId, 'user', message.trim()]
    );
    await pool.query(
      'INSERT INTO tin_nhan_chat (ma_nguoi_dung, loai_nguoi_gui, noi_dung) VALUES (?, ?, ?)',
      [userId, 'bot', reply]
    );

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi xử lý tin nhắn', reply: 'Xin lỗi, hệ thống đang bận. Bạn thử lại sau nhé!' });
  }
};

// Lấy lịch sử chat của user
exports.getHistory = async (req, res) => {
  try {
    const [messages] = await pool.query(
      `SELECT ma_tin_nhan AS id, loai_nguoi_gui AS fromType, noi_dung AS text, thoi_gian_gui AS createdAt
       FROM tin_nhan_chat
       WHERE ma_nguoi_dung = ?
       ORDER BY thoi_gian_gui ASC
       LIMIT 50`,
      [req.user.id]
    );
    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy lịch sử chat' });
  }
};
