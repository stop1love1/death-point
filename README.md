# 🃏 Death Point

Một mini game client-side quản lý điểm được xây dựng với Next.js, cho phép người chơi theo dõi điểm số và dự đoán người thua cuộc.

## ✨ Tính năng

### 🎮 Gameplay
- **Setup Game**: Tạo ván chơi mới với danh sách người chơi và điểm tối đa
- **Cộng điểm**: Thêm điểm cho từng người chơi trong mỗi turn
- **Turn System**: Quản lý turn thủ công, người chơi tự quyết định khi chuyển turn
- **Undo/Redo**: Hoàn tác điểm đã cộng trong turn hiện tại (có thể undo nhiều lần)
- **Auto Focus**: Tự động focus vào input của người chơi tiếp theo sau khi cộng điểm

### 📊 Phân tích & Thống kê
- **Xác suất thua**: Tính toán xác suất mỗi người chơi sẽ thua dựa trên điểm số hiện tại
- **Dự kiến kết thúc**: Ước tính số turn còn lại để game kết thúc dựa trên lịch sử cộng điểm
- **Ranking**: Hiển thị người chơi có điểm cao nhất với icon cảnh báo 🔥
- **Thống kê game**: Hiển thị tổng số turn, thời gian chơi, người thua và top 3 khi game kết thúc

### 💾 Lưu trữ
- **Local Storage**: Tự động lưu trạng thái game vào Local Storage
- **Persistent State**: Game state được duy trì khi reload trang
- **Advanced Settings**: Modal chỉnh sửa trực tiếp giá trị trong Local Storage

### 🎨 UI/UX
- **Responsive Design**: Tối ưu cho mobile, hiển thị tốt trên mọi thiết bị
- **List Layout**: Hiển thị người chơi dạng list, dễ theo dõi
- **Game-like Aesthetic**: Giao diện với background pattern và card styling
- **Real-time Updates**: Cập nhật thời gian cộng điểm và trạng thái real-time

## 🚀 Demo

🌐 **Live Demo**: [https://death-point.vercel.app](https://death-point.vercel.app)

## 🛠️ Công nghệ sử dụng

- **Framework**: [Next.js](https://nextjs.org/) 16.1.3
- **UI Library**: [React](https://react.dev/) 19.2.3
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 4
- **Language**: [TypeScript](https://www.typescriptlang.org/) 5
- **Storage**: Browser Local Storage

## 📦 Cài đặt

### Yêu cầu
- Node.js 18+ 
- npm, yarn, pnpm hoặc bun

### Các bước

1. **Clone repository**
```bash
git clone https://github.com/stop1love1/death-point.git
cd death-point
```

2. **Cài đặt dependencies**
```bash
npm install
# hoặc
yarn install
# hoặc
pnpm install
```

3. **Chạy development server**
```bash
npm run dev
# hoặc
yarn dev
# hoặc
pnpm dev
```

4. **Mở trình duyệt**
```
http://localhost:3000
```

## 🎯 Cách chơi

1. **Bắt đầu game**
   - Nhập danh sách người chơi (tối thiểu 2 người)
   - Đặt điểm tối đa (mặc định 100)
   - Nhấn "Bắt đầu ván chơi"

2. **Chơi game**
   - Nhập điểm và nhấn nút "+" hoặc Enter để cộng điểm
   - Sử dụng nút nhanh (+1, +5, +10) để cộng điểm nhanh
   - Nhấn "↩" để hoàn tác điểm vừa cộng (chỉ trong turn hiện tại)
   - Nhấn "Turn X+1 →" để chuyển sang turn mới

3. **Kết thúc game**
   - Game tự động kết thúc khi submit turn mới nếu có người chơi đạt/vượt điểm tối đa
   - Xem thống kê: tổng số turn, thời gian chơi, người thua và top 3

## 📝 Tính năng nâng cao

- **Advanced Settings**: Mở modal cài đặt nâng cao bằng nút ⚙️ để chỉnh sửa trực tiếp điểm tối đa, số turn, tên và điểm của người chơi
- **Local Storage**: Game state được lưu tự động, có thể reload trang mà không mất dữ liệu

## 📄 License

MIT License - Tự do sử dụng và chỉnh sửa

## 👤 Tác giả

**stop1love1**

- GitHub: [@stop1love1](https://github.com/stop1love1)
- Profile: [https://github.com/stop1love1](https://github.com/stop1love1)

## 🙏 Cảm ơn

Cảm ơn bạn đã sử dụng Death Point! Nếu có bất kỳ câu hỏi hoặc đề xuất nào, vui lòng tạo issue trên GitHub.

---

⭐ Nếu bạn thích project này, hãy star repository nhé!
