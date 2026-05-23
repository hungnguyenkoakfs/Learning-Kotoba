# Kotoba Booster (Trình Tăng Tốc Từ Vựng Tiếng Nhật)

Một ứng dụng web đơn trang (Single Page Application - SPA) siêu đẹp giúp học và ghi nhớ từ vựng tiếng Nhật thông qua phương pháp phản xạ nhanh hiển thị ngẫu nhiên từ vựng mỗi giây, đi kèm âm thanh phát âm giọng chuẩn bản xứ và quản lý dữ liệu linh hoạt bằng file Excel.

---

## 🌟 Tính Năng Nổi Bật

1. **Bảng Phản Xạ 1 Giây**: Hiển thị ngẫu nhiên từ vựng tự động thay đổi sau mỗi giây (hoặc tùy chỉnh thời gian từ 0.5s - 5s).
2. **Thiết Kế Premium Glassmorphism**: Giao diện tối sang trọng kết hợp màu sắc neon rực rỡ, hiệu ứng kính mờ và chuyển động siêu mượt.
3. **Phát Âm Tiếng Nhật Bản Xứ (Text-to-Speech)**: Đọc từ vựng tự động hoặc thủ công bằng giọng đọc chuẩn tiếng Nhật tích hợp sẵn trong trình duyệt.
4. **Nhập Excel Hàng Loạt**: Tải danh sách hàng trăm từ vựng từ Excel chỉ bằng cách kéo thả. Tự động nhận diện tên cột tiếng Việt/tiếng Anh.
5. **Tải File Excel Mẫu**: Xuất file mẫu trực tiếp từ ứng dụng để nhập liệu dễ dàng.
6. **Quản Lý Từ Vựng Trực Quan**: Xem danh sách từ, tìm kiếm thời gian thực, thêm mới, sửa hoặc xóa trực tiếp.
7. **Lưu Trữ Cục Bộ (Local Storage)**: Dữ liệu từ vựng được tự động lưu lại trên máy, không mất đi khi tải lại trang.
8. **Bộ Từ Vựng Có Sẵn**: Khởi động ứng dụng có sẵn hơn 30 từ vựng N5-N4 để bạn trải nghiệm ngay lập tức.

---

## 📊 Hướng Dẫn Định Dạng File Excel Nhập Liệu

Ứng dụng có cơ chế **tự động nhận diện tiêu đề cột thông minh**. Bạn có thể đặt tên cột bằng tiếng Việt hoặc tiếng Anh. 

### Các cột cần có:

| Tiêu đề mong muốn (Ưu tiên) | Tiêu đề thay thế được chấp nhận | Ý nghĩa | Ví dụ |
| :--- | :--- | :--- | :--- |
| **Kanji** | Từ vựng, Chữ Hán, Word | Từ vựng dạng Kanji hoặc Hiragana chính | 先生 / 食べる |
| **Hiragana** | Cách đọc, Furigana, Reading | Cách viết bằng Hiragana hoặc Katakana | せんせい / たべる |
| **Hán Việt** | Âm Hán Việt, Hanviet, Sino | Phiên âm âm Hán Việt (nếu có) | TIÊN SINH / THỰC |
| **Nghĩa** | Nghĩa tiếng Việt, Nghia, Meaning | Ý nghĩa của từ | Thầy cô giáo / Ăn |

*Lưu ý: Ứng dụng có tích hợp nút **"Tải File Excel Mẫu"** để bạn tải về máy, chỉ cần điền tiếp từ vựng của mình vào file đó và kéo thả lại vào ứng dụng.*

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: HTML5, Vanilla CSS3 (Custom Grid/Flex, Keyframe animations, Glassmorphic effects), Vanilla JS (ES6+).
- **Thư viện bên thứ ba (CDN)**:
  - **SheetJS (xlsx.mini.min.js)**: Xử lý tệp Excel client-side 100% bảo mật và nhanh chóng.
  - **Lucide Icons**: Bộ icon giao diện hiện đại và sắc nét.
  - **Google Fonts**: Phông chữ `Outfit` (UI) và `Noto Sans JP` (chữ tiếng Nhật chuẩn, sắc nét không bị lỗi phông).

---

## 🚀 Cách Khởi Chạy

Chỉ cần mở tệp `index.html` trên bất kỳ trình duyệt hiện đại nào (Chrome, Edge, Safari, Firefox) là ứng dụng đã sẵn sàng chạy! Bạn không cần cài đặt máy chủ hay bất kỳ phần mềm lập trình phức tạp nào.
