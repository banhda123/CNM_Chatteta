# CNM Chatteta

CNM Chatteta là một ứng dụng chat đa nền tảng hiện đại, hỗ trợ nhắn tin cá nhân, nhóm và tích hợp trợ lý AI Gemini để tạo trải nghiệm chat thông minh.

## Tính năng nổi bật

### Chat & Nhắn tin
- Chat cá nhân & nhóm với giao diện hiện đại
- Tin nhắn thời gian thực qua Socket.IO
- Gửi file đa dạng: ảnh, video, tài liệu, PDF
- GIF động tích hợp Giphy
- Emoji picker với bộ emoji phong phú
- Phản ứng tin nhắn với emoji
- Ghim tin nhắn quan trọng
- Thu hồi/xóa tin nhắn
- Chuyển tiếp tin nhắn

### AI Gemini Integration
- Trò chuyện với AI Gemini trong các cuộc hội thoại
- Hỗ trợ trả lời tự động và giải đáp thắc mắc
- Tích hợp seamless vào luồng chat hiện tại

### Quản lý nhóm
- Tạo nhóm chat với nhiều thành viên
- Quản lý thành viên: thêm/xóa thành viên
- Phân quyền quản trị viên
- Chỉnh sửa thông tin nhóm

### Bảo mật & Xác thực
- Đăng ký/Đăng nhập bằng số điện thoại
- Xác thực JWT an toàn
- Bảo mật mật khẩu với mã hóa
- Phân quyền truy cập API

### Giao diện & UX
- Chế độ sáng/tối tự động
- Responsive design cho mọi thiết bị
- Loading animations mượt mà
- Thông báo real-time
- Trạng thái online/offline

## Công nghệ sử dụng

### Frontend
- React Native với Expo
- Material-UI cho UI components
- React Navigation cho routing
- Socket.IO-client cho real-time
- Axios cho HTTP requests
- AsyncStorage cho local storage

### Backend
- Node.js với Express
- MongoDB với Mongoose
- Socket.IO cho real-time communication
- JWT cho authentication
- Multer cho file upload
- Cloudinary cho image storage
- Google Gemini API cho AI features

## Cài đặt

### Yêu cầu hệ thống
- Node.js (v16 trở lên)
- MongoDB
- Expo CLI (cho frontend)
- Git

### 1. Clone repository
```bash
git clone <repository-url>
cd CNM_Chatteta
```

### 2. Cài đặt Backend
```bash
cd backend
npm install
```

### 3. Cài đặt Frontend
```bash
cd frontend
npm install
# hoặc
yarn install
```
## Cảm ơn

Cảm ơn bạn đã quan tâm đến dự án CNM Chatteta! Nếu có bất kỳ câu hỏi hoặc góp ý nào, vui lòng tạo issue trên GitHub. 
