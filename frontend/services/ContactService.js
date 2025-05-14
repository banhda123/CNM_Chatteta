import AuthService from './AuthService';
import UserService from './UserService';

const ContactService = {
  /**
   * Yêu cầu quyền truy cập danh bạ
   * @returns {Promise<boolean>} - True nếu được cấp quyền, false nếu không
   */
  requestContactPermission: async () => {
    try {
      // Sử dụng Web API cho quyền truy cập
      if (navigator && navigator.permissions) {
        const permissionStatus = await navigator.permissions.query({ name: 'contacts' });
        return permissionStatus.state === 'granted';
      }
      
      // Fallback: giả định quyền đã được cấp
      console.log('Permissions API not available, assuming granted');
      return true;
    } catch (error) {
      console.error('Error requesting contact permission:', error);
      return false;
    }
  },

  /**
   * Lấy tất cả liên hệ từ danh bạ máy
   * @returns {Promise<Array>} - Danh sách liên hệ với thông tin: id, name, phoneNumbers
   */
  getPhoneContacts: async () => {
    try {
      const permission = await ContactService.requestContactPermission();
      
      if (!permission) {
        throw new Error('Bạn cần cấp quyền truy cập danh bạ để sử dụng tính năng này');
      }
      
      // Sử dụng Web Contacts API nếu có hỗ trợ
      if (navigator.contacts && navigator.contacts.select) {
        const props = ['name', 'tel'];
        const opts = {multiple: true};
        
        const contacts = await navigator.contacts.select(props, opts);
        return contacts.map(contact => ({
          id: Math.random().toString(36).substring(2, 9), // Tạo ID ngẫu nhiên
          name: contact.name.join(' '),
          phoneNumbers: contact.tel.map(phone => ({
            number: phone,
            label: 'mobile'
          }))
        }));
      }
      
      // Fallback: yêu cầu người dùng nhập số điện thoại thủ công
      // Hoặc sử dụng dữ liệu mẫu cho demo
      console.log('Contacts API not available, using sample data');
      
      // Dữ liệu mẫu cho demo
      return [
        {
          id: '1',
          name: 'Nguyễn Văn A',
          phoneNumbers: [{ number: '0123456789', label: 'mobile' }]
        },
        {
          id: '2',
          name: 'Trần Thị B',
          phoneNumbers: [{ number: '0987654321', label: 'mobile' }]
        }
      ];
    } catch (error) {
      console.error('Error getting contacts:', error);
      throw error;
    }
  },
  
  /**
   * Tìm kiếm bạn bè tiềm năng từ danh bạ
   * @returns {Promise<Array>} - Danh sách người dùng từ danh bạ đã đăng ký ứng dụng
   */
  findFriendsFromContacts: async () => {
    try {
      // Lấy danh bạ từ thiết bị
      const contacts = await ContactService.getPhoneContacts();
      
      // Chuẩn hóa số điện thoại từ danh bạ
      const phoneNumbers = contacts.flatMap(contact => 
        contact.phoneNumbers.map(phone => {
          // Loại bỏ các ký tự không phải số
          const normalizedNumber = phone.number.replace(/\D/g, '');
          return {
            contactName: contact.name,
            phoneNumber: normalizedNumber
          };
        })
      );
      
      if (!phoneNumbers.length) {
        return [];
      }
      
      // Lấy token
      const token = AuthService.getAccessToken();
      if (!token) {
        throw new Error('Không có token xác thực');
      }
      
      // Gọi API để tìm người dùng từ danh sách số điện thoại
      const response = await fetch('/user/findByContacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ contacts: phoneNumbers })
      });
      
      if (!response.ok) {
        throw new Error('Lỗi khi tìm bạn bè từ danh bạ');
      }
      
      const data = await response.json();
      
      // Lấy danh sách bạn bè hiện tại
      const userData = AuthService.getUserData();
      const currentFriends = await UserService.getAllFriends(userData._id);
      const currentFriendIds = currentFriends.map(friend => friend.idUser._id);
      
      // Lấy danh sách lời mời đã gửi
      const sentRequests = await UserService.getAllSentFriendRequests(userData._id);
      const sentRequestIds = sentRequests.map(request => request.idUser._id);
      
      // Loại bỏ những người đã là bạn bè hoặc đã gửi lời mời
      return data.filter(user => 
        !currentFriendIds.includes(user._id) && 
        !sentRequestIds.includes(user._id) &&
        user._id !== userData._id
      ).map(user => ({
        ...user,
        fromContact: true, // Đánh dấu người dùng từ danh bạ
        contactName: phoneNumbers.find(contact => 
          contact.phoneNumber === user.phone.replace(/\D/g, '')
        )?.contactName || user.name
      }));
    } catch (error) {
      console.error('Error finding friends from contacts:', error);
      throw error;
    }
  },
  
  /**
   * Kiểm tra trạng thái kết bạn với người dùng
   * @param {string} targetUserId - ID người dùng cần kiểm tra
   * @returns {Promise<string>} - Trạng thái: 'friend', 'pending_sent', 'pending_received', 'none'
   */
  checkFriendshipStatus: async (targetUserId) => {
    try {
      const userData = AuthService.getUserData();
      if (!userData || !userData._id) {
        throw new Error('Không có thông tin người dùng');
      }
      
      const token = AuthService.getAccessToken();
      if (!token) {
        throw new Error('Không có token xác thực');
      }
      
      const response = await fetch(`/user/checkFriendshipStatus/${userData._id}/${targetUserId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Lỗi khi kiểm tra trạng thái kết bạn');
      }
      
      const data = await response.json();
      return data.status; // 'friend', 'pending_sent', 'pending_received', 'none'
    } catch (error) {
      console.error('Error checking friendship status:', error);
      throw error;
    }
  }
};

export default ContactService; 