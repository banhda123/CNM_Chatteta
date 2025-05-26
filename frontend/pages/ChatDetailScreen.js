import React, { useState, useRef, useEffect } from "react";
import { Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import GeminiIndicator from "../components/GeminiIndicator";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  TextField,
  Avatar,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Container,
  Badge,
  InputAdornment,
  Menu,
  MenuItem,
  CircularProgress,
  Grid,
  Popover,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List,
  Tooltip,
  AvatarGroup,
  Switch,
  FormControlLabel,
  Drawer,
  Tab,
  Tabs,
  Divider,
  Slide,
  useTheme as useMuiTheme,
  ButtonGroup,
  Snackbar
} from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import {
  Send as SendIcon,
  Info as InfoIcon,
  Phone as PhoneIcon,
  Videocam as VideocamIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Menu as MenuIcon,
  Settings as SettingsIcon,
  ArrowBack as ArrowBackIcon,
  MoreVert,
  InsertEmoticon as InsertEmoticonIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  Contacts as ContactsIcon,
  SmartToy as SmartToyIcon,
  GroupAdd as GroupAddIcon,
  Check as CheckIcon,
  People as PeopleIcon,
  Group as GroupIcon,
  Edit as EditIcon,
  Forward as ForwardIcon,
  Undo as UndoIcon,
  PushPin as PushPinIcon,
  Delete as DeleteIcon,
  ExitToApp as ExitToAppIcon,
  Close as CloseIcon,
  PersonAdd as PersonAddIcon
} from "@mui/icons-material";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import ProfileScreen from "./ProfileScreen";
import ChatService from "../services/ChatService";
import UserService from "../services/UserService";
import AuthService from "../services/AuthService";
import SocketService from "../services/SocketService";
import CancelIcon from '@mui/icons-material/Cancel';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import RenderFileMessage from "../components/RenderFileMessage";
import MessageReactions from "../components/MessageReactions";
import CreateGroupDialog from "../components/CreateGroupDialog";
import GroupMembersDialog from "../components/GroupMembersDialog";
import EditGroupDialog from "../components/EditGroupDialog";
import GiphyGallery from "../components/GiphyGallery";
import GifIcon from '@mui/icons-material/Gif';
import PinnedMessageBanner from "../components/PinnedMessageBanner";
import PinnedMessagesDialog from "../components/PinnedMessagesDialog";
import PinMessageButton from "../components/PinMessageButton";
import { useTheme } from '../contexts/ThemeContext';
import ProfileDialog from '../components/ProfileDialog';
import FileUploadGroup from '../components/FileUploadGroup';
import LoadingAnimation from '../components/LoadingAnimation';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import KeyIcon from '@mui/icons-material/Key';
import GroupControlDrawer from '../components/GroupControlDrawer';


// Thêm một lớp ghi log đơn giản vào đầu file
const Logger = {
  // Các cấp độ log
  levels: {
    DEBUG: 0,  // Chi tiết nhất, hữu ích khi phát triển
    INFO: 1,   // Thông tin chung
    WARN: 2,   // Cảnh báo
    ERROR: 3,  // Lỗi
  },
  
  // Cấu hình cấp độ hiện tại
  currentLevel: 1, // Mặc định chỉ hiện INFO trở lên
  
  // Bật/tắt group logs cho dễ đọc
  useGroups: true,
  
  // Thiết lập cấp độ log
  setLevel(level) {
    this.currentLevel = level;
  },
  
  // Các phương thức log theo cấp độ
  debug(message, data) {
    if (this.currentLevel <= this.levels.DEBUG) {
      if (data && this.useGroups) {
        console.groupCollapsed(`🔎 ${message}`);
        console.log(data);
        console.groupEnd();
      } else {
        console.log(`🔎 ${message}`, data || '');
      }
    }
  },
  
  info(message, data) {
    if (this.currentLevel <= this.levels.INFO) {
      if (data && this.useGroups) {
        console.groupCollapsed(`ℹ️ ${message}`);
        console.log(data);
        console.groupEnd();
      } else {
        console.log(`ℹ️ ${message}`, data || '');
      }
    }
  },
  
  warn(message, data) {
    if (this.currentLevel <= this.levels.WARN) {
      if (data && this.useGroups) {
        console.groupCollapsed(`⚠️ ${message}`);
        console.log(data);
        console.groupEnd();
      } else {
        console.warn(`⚠️ ${message}`, data || '');
      }
    }
  },
  
  error(message, error) {
    if (this.currentLevel <= this.levels.ERROR) {
      if (error && this.useGroups) {
        console.groupCollapsed(`❌ ${message}`);
        console.error(error);
        console.groupEnd();
      } else {
        console.error(`❌ ${message}`, error || '');
      }
    }
  }
};

// Trong môi trường production, chỉ hiển thị lỗi
if (process.env.NODE_ENV === 'production') {
  Logger.setLevel(Logger.levels.ERROR);
}

const ChatUI = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId: routeUserId } = route.params || {};
  
  // Các state quản lý UI
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showSingleChat, setShowSingleChat] = useState(false);
  const [userId, setUserId] = useState(routeUserId);
  const [newMessage, setNewMessage] = useState("");
  const [messageType, setMessageType] = useState('text'); // Thêm state cho message type
  const [anchorEl, setAnchorEl] = useState(null);
  const [sidebarMenuAnchorEl, setSidebarMenuAnchorEl] = useState(null); // New state for sidebar menu
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [loading, setLoading] = useState({
    conversations: true,
    messages: true,
  });
  const [showAIMention, setShowAIMention] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [user, setUser] = useState({
    name: "",
    avatar: "",
    status: "",
    birthday: "",
    phone: "",
    email: "",
    about: "",
  });
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifGallery, setShowGifGallery] = useState(false);
  const [activeTab, setActiveTab] = useState('emoji'); // Track active tab: 'emoji' or 'gif'
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState(null);
  const fileInputRef = useRef(null);
  
  // State for pinned messages functionality
  const [pinnedMessagesDialogOpen, setPinnedMessagesDialogOpen] = useState(false);
  const [selectedPinnedMessage, setSelectedPinnedMessage] = useState(null);

  const { isDarkMode, toggleTheme } = useTheme();

  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Thêm state mới cho lazy loading
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [nextMessageCursor, setNextMessageCursor] = useState(null);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const messagesContainerRef = useRef(null);
  const topMessageRef = useRef(null);
  const scrollPositionRef = useRef(null);  // Theo dõi vị trí cuộn
  const socketConnectionInitialized = useRef(false); // Theo dõi trạng thái kết nối socket
  const reportedUsers = useRef(new Set()); // Theo dõi người dùng đã nhận thông báo online

  // Function to check if the current conversation is with Gemini AI
  const isGeminiConversation = () => {
    if (!activeConversation || activeConversation.type !== 'private') return false;
    
    // Get the other participant in the conversation
    const otherUser = getOtherParticipant(activeConversation)?.idUser;
    
    // Check if the other user is Gemini AI (you might identify it by a specific ID or name)
    return otherUser && otherUser.name === 'Gemini AI';
  };

  // Thêm state cho danh sách người dùng online
  const [onlineUsers, setOnlineUsers] = useState([]);
  // Thêm state để kiểm soát hiển thị danh sách cuộc trò chuyện trên mobile
  const [showConversationList, setShowConversationList] = useState(true);
  // Thêm useRef cho debounce timeout
  const typingTimeoutRef = useRef(null);
  const typingLastSentRef = useRef(0);
  const typingMinInterval = 2000; // Độ trễ tối thiểu giữa các sự kiện typing (2 giây)
  const [messageContextMenu, setMessageContextMenu] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [attachMenuAnchorEl, setAttachMenuAnchorEl] = useState(null);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [targetConversation, setTargetConversation] = useState(null);
  
  // Group chat state variables
  const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false);
  const [groupMembersDialogOpen, setGroupMembersDialogOpen] = useState(false);
  const [editGroupDialogOpen, setEditGroupDialogOpen] = useState(false);
  
  // List of emojis
  const emojis = [
    "😊", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", 
    "😉", "😋", "😎", "😍", "😘", "🥰", "😗", "😙",
    "😚", "🙂", "🤗", "🤩", "🤔", "🤨", "😐", "😑",
    "😶", "🙄", "😏", "😣", "😥", "😮", "🤐", "😯"
  ];

  const formatChatTime = (mongodbDate) => {
    if (!mongodbDate) return "";

    const date = new Date(mongodbDate);
    const now = new Date();

    // Check if same day
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    // Check if same year
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }

    // Older than current year
    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to safely get other participant
  const getOtherParticipant = (conversation) => {
    if (!conversation?.members) {
      console.log('No members in conversation:', conversation?._id);
      return { idUser: {} };
    }
    
    // Ensure members is always an array
    const members = Array.isArray(conversation.members) ? conversation.members : [];
    
    if (members.length === 0) {
      console.log('Empty members array in conversation:', conversation?._id);
      return { idUser: {} };
    }
    
    // Ensure we compare IDs as strings to avoid object comparison issues
    const currentUserId = userId ? userId.toString() : '';
    
    // Find the other user in the conversation
    const otherMember = members.find(member => {
      // Get member ID as string for comparison
      const memberId = member?.idUser?._id ? member.idUser._id.toString() : 
                      (member?.idUser ? member.idUser.toString() : '');
      
      // Compare with current user ID
      return memberId && memberId !== currentUserId;
    });
    
    // Check if otherMember exists and has idUser data
    if (otherMember && otherMember.idUser) {
      // For populated idUser objects
      if (typeof otherMember.idUser === 'object' && otherMember.idUser._id) {
        // If we have name property, the object is properly populated
        if (otherMember.idUser.name) {
          return otherMember;
        } else {
          // We have an object with ID but no name, try to get full user data
          console.log('Member has incomplete user data, need to fetch:', otherMember.idUser._id);
        }
      }
      
      // For cases where idUser is just an ID string, try to find the full user object
      // in other places (like conversation.lastMessageSender)
      if (typeof otherMember.idUser === 'string' && conversation.lastMessageSender) {
        const lastSenderId = conversation.lastMessageSender._id?.toString() || '';
        
        if (lastSenderId === otherMember.idUser) {
          return {
            ...otherMember,
            idUser: conversation.lastMessageSender
          };
        }
      }
    }
    
    // If we couldn't find/reconstruct a proper user object, return a fallback
    return otherMember || { idUser: {} };
  };

  // Hàm lấy tên người gửi trong tin nhắn nhóm
  const getSenderName = (message, conversation) => {
    // Nếu là tin nhắn của chính mình, trả về "Bạn"
    if (isSentByCurrentUser(message)) {
      return "Bạn";
    }
    
    // Nếu là chat đơn (không phải nhóm), lấy tên từ người tham gia khác
    if (conversation?.type === "private") {
      const otherParticipant = getOtherParticipant(conversation);
      return otherParticipant?.idUser?.name || "Người dùng";
    }
    
    // Nếu có thông tin từ originalSender (đã được lưu khi nhận tin nhắn)
    if (message.originalSender?.name) {
      return message.originalSender.name;
    }
    
    // Ensure we always use string IDs for comparison
    const messageSenderId = message.sender?.toString() || '';
    
    // Tìm người gửi trong danh sách thành viên nhóm
    if (conversation?.members && Array.isArray(conversation.members) && messageSenderId) {
      const senderMember = conversation.members.find(member => 
        member.idUser && (
          (member.idUser._id && member.idUser._id.toString() === messageSenderId) ||
          (typeof member.idUser === 'string' && member.idUser.toString() === messageSenderId)
        )
      );
      
      if (senderMember?.idUser?.name) {
        return senderMember.idUser.name;
      } else if (senderMember?.name) {
        return senderMember.name;
      }
      
      // Tìm kiếm trong mảng admin nếu đây là nhóm
      if (conversation.admin && conversation.admin._id && 
          conversation.admin._id.toString() === messageSenderId) {
        return conversation.admin.name || "Quản trị viên";
      }
      
      // Tìm kiếm trong admin2 nếu có
      if (conversation.admin2 && conversation.admin2._id && 
          conversation.admin2._id.toString() === messageSenderId) {
        return conversation.admin2.name || "Phó nhóm";
      }
    }
    
    // Thử tìm trong conversation.lastMessageSender
    if (conversation?.lastMessageSender && 
        conversation.lastMessageSender._id && 
        conversation.lastMessageSender._id.toString() === messageSenderId) {
      return conversation.lastMessageSender.name;
    }
    
    // Nếu không tìm thấy, trả về giá trị mặc định với sender ID
    return "Người dùng";
  };

  //  Log để debug việc tìm kiếm thông tin người dùng
  const logSenderInfo = (message, source) => {
    if (!message || !message.sender) return;
    
    const senderId = typeof message.sender === 'object' ? message.sender._id : message.sender.toString();
    console.log(`🔍 [${source}] Xử lý message từ sender: ${senderId}`);
    
    if (message.originalSender?.name) {
      console.log(`✅ [${source}] Đã có thông tin sender: ${message.originalSender.name}`);
    } else {
      console.log(`⚠️ [${source}] Không có thông tin originalSender cho ID: ${senderId}`);
    }
  };

  // Nếu không có userId từ route params, thử lấy từ localStorage
  useEffect(() => {
    if (!userId) {
      const userData = AuthService.getUserData();
      if (userData && userData._id) {
        setUserId(userData._id);
      }
    }
  }, [userId]);

  // Fetch user data when component mounts or userId changes
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!userId) {
          return; // Không fetch nếu chưa có userId
        }

        const userData = await UserService.getUserById(userId);
        setUser({
          name: userData?.name || "No name provided",
          avatar: userData?.avatar || "https://via.placeholder.com/150",
          status: userData?.status || "Hey there! I'm using this app",
          birthday: userData?.birthday || "Not specified",
          phone: userData?.phone || "Not provided",
          email: userData?.email || "Not provided",
          about: userData?.about || "No bio yet",
        });
      } catch (error) {
        Alert.alert("Error", "Failed to load profile data");
        console.error(error);
      }
    };

    fetchUserData();
  }, [userId]);

  // Fetch conversations when component mounts or user changes
  useEffect(() => {
    if (userId) {
      fetchConversations();
    }
  }, [userId]);

  useEffect(() => {
    const fetchFriendRequests = async () => {
      if (!userId) {
        console.warn("Cannot fetch friend requests: Missing userId");
        return;
      }
      
      try {
        setLoadingRequests(true);
        console.log(`Fetching friend requests for user: ${userId}`);
        
        // The UserService now handles errors internally and returns empty array instead of throwing
        const requests = await UserService.getAllFriendRequests(userId);
        
        // Filter out any requests that have been rejected in this session
        const filteredRequests = requests.filter(request => {
          return !localStorage.getItem(`rejected_request_${request._id}`);
        });
        
        setFriendRequests(filteredRequests);
        
        console.log(`Loaded ${filteredRequests.length} friend requests successfully`);
      } catch (error) {
        console.error("Error fetching friend requests:", error);
        // Don't show alerts for this as it's not critical - just set empty array
        setFriendRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchFriendRequests();
  }, [userId]); // Add all dependencies here

  const handleNotificationMenuOpen = async (event) => {
    if (!userId) {
      console.warn("Cannot load notifications: Missing userId");
      return;
    }
    
    setNotificationAnchorEl(event.currentTarget);
    setLoadingRequests(true);
    
    try {
      console.log(`Loading friend requests for user: ${userId}`);
      const requests = await UserService.getAllFriendRequests(userId);
      
      // Filter out any requests that have been rejected in this session
      const filteredRequests = requests.filter(request => {
        return !localStorage.getItem(`rejected_request_${request._id}`);
      });
      
      setFriendRequests(filteredRequests);
      console.log(`Loaded ${filteredRequests.length} friend requests successfully`);
    } catch (error) {
      console.error("Error loading friend requests:", error);
      // Set to empty array to avoid UI issues
      setFriendRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const fetchConversations = async () => {
    try {
      setLoading((prev) => ({ ...prev, conversations: true }));
      const token = await AuthService.getAccessToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      Logger.info('Fetching user conversations');
      const convs = await ChatService.getUserConversations(userId, token);

      if (!Array.isArray(convs)) {
        throw new Error("Invalid conversations data format");
      }
      
      // Log conversation structure for debugging
      if (convs.length > 0) {
        console.log(`Fetched ${convs.length} conversations`);
        const sampleConv = convs[0];
        console.log('Sample conversation structure:', {
          type: sampleConv.type,
          hasMembers: !!sampleConv.members,
          memberCount: sampleConv.members?.length || 0,
          hasMemberUserData: sampleConv.members?.some(m => m.idUser && typeof m.idUser === 'object' && m.idUser.name)
        });
      }

      setConversations(convs);

      if (convs.length > 0) {
        // Lưu thông tin admin vào localStorage cho mỗi cuộc trò chuyện
        convs.forEach(conv => {
          if (conv.type === 'group') {
            if (conv.admin) {
              const adminId = conv.admin._id || conv.admin;
              localStorage.setItem(`adminId_${conv._id}`, adminId);
              localStorage.setItem('adminId', adminId);
            }
            
            if (conv.admin2) {
              const admin2Id = conv.admin2._id || conv.admin2;
              localStorage.setItem(`admin2Id_${conv._id}`, admin2Id);
              localStorage.setItem('admin2Id', admin2Id);
            }
          }
        });
        
        // Không tự động thiết lập cuộc trò chuyện hoạt động
        // setActiveConversation(firstConv);
        
        // Không tải tin nhắn ngay lập tức để cải thiện tốc độ tải ban đầu
        // await loadMessages(firstConv._id);
      }
      
      // Đánh dấu rằng đã hoàn thành tải danh sách cuộc trò chuyện
      setLoading((prev) => ({ ...prev, conversations: false }));
    } catch (error) {
      Alert.alert("Error", "Failed to load conversations");
      Logger.error("Error fetching conversations", error);
      setLoading((prev) => ({ ...prev, conversations: false }));
    }
  };

  // Cập nhật phương thức loadMessages
  const loadMessages = async (conversationId) => {
    try {
      setLoading((prev) => ({ ...prev, messages: true }));

      Logger.info("Loading messages for conversation", { conversationId });

      const token = AuthService.getAccessToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Sử dụng phương thức có hỗ trợ lazy loading với limit đã giảm xuống 15
      const result = await ChatService.getConversationMessages(conversationId);
      
      
      // Kiểm tra dữ liệu response
      if (!result || (!result.messages && !Array.isArray(result))) {
        throw new Error("Invalid messages data format");
      }
      
      // Lấy danh sách tin nhắn từ response
      const msgs = result.messages || result;
      
      if (!Array.isArray(msgs)) {
        throw new Error("Messages data is not an array");
      }

      // Chuẩn hóa ID người dùng và tin nhắn
      const normalizedMsgs = msgs.map(msg => {
        // Đảm bảo ID người gửi luôn ở dạng string để so sánh nhất quán
        if (msg.sender && typeof msg.sender === 'object' && msg.sender._id) {
          // Lưu thông tin người gửi gốc để hiển thị trong UI
          msg.originalSender = { 
            _id: msg.sender._id,
            name: msg.sender.name || "Người dùng",
            avatar: msg.sender.avatar
          };
          // Chỉ dùng ID cho các phép so sánh
          msg.sender = msg.sender._id;
        } else if (msg.sender && typeof msg.sender === 'string') {
          const senderId = msg.sender.toString();
          
          // Tìm trong danh sách thành viên nhóm
          if (activeConversation?.members && Array.isArray(activeConversation.members)) {
            const senderMember = activeConversation.members.find(member => 
              member.idUser && (
                (member.idUser._id && member.idUser._id.toString() === senderId) ||
                (typeof member.idUser === 'string' && member.idUser.toString() === senderId)
              )
            );
            
            if (senderMember?.idUser && typeof senderMember.idUser === 'object') {
              msg.originalSender = {
                _id: senderMember.idUser._id,
                name: senderMember.idUser.name || "Người dùng",
                avatar: senderMember.idUser.avatar
              };
            }
            // Kiểm tra admin
            else if (activeConversation.admin && 
                   activeConversation.admin._id && 
                   activeConversation.admin._id.toString() === senderId) {
              msg.originalSender = {
                _id: activeConversation.admin._id,
                name: activeConversation.admin.name || "Quản trị viên",
                avatar: activeConversation.admin.avatar
              };
            }
            // Kiểm tra admin2
            else if (activeConversation.admin2 && 
                   activeConversation.admin2._id && 
                   activeConversation.admin2._id.toString() === senderId) {
              msg.originalSender = {
                _id: activeConversation.admin2._id,
                name: activeConversation.admin2.name || "Phó nhóm",
                avatar: activeConversation.admin2.avatar
              };
            }
            else {
              // Mặc định sử dụng ID người gửi nếu không tìm thấy thông tin
              msg.originalSender = {
                _id: senderId,
                name: "Người dùng",
                avatar: null
              };
            }
          }
        }
        
        // Đảm bảo ID tin nhắn nhất quán
        if (msg._id) {
          msg.id = msg._id;
        }
        
        // Debug: Kiểm tra thông tin người gửi sau khi xử lý
        logSenderInfo(msg, 'loadMessages');
        
        return msg;
      });

      // Lọc tin nhắn không nằm trong danh sách đã xóa
      const filteredMsgs = normalizedMsgs.filter(msg => 
        !msg.deletedBy || !msg.deletedBy.some(id => id.toString() === userId.toString())
      );
      
      Logger.info(`Loaded ${filteredMsgs.length} messages for display`);
      
      // Cập nhật state
      setMessages(filteredMsgs);
      
      // Cập nhật trạng thái lazy loading
      setHasMoreMessages(result.hasMore || false);
      setNextMessageCursor(result.nextCursor || null);
      
      // Đánh dấu tin nhắn đã xem (không đợi hoàn thành để tránh chặn UI)
      ChatService.markMessagesAsSeen(conversationId, token)
        .catch(err => Logger.error("Error marking messages as seen", err));
      
      // Tải tin nhắn đã ghim nếu là nhóm (không đồng bộ để không chặn UI)
      if (activeConversation && activeConversation.type === 'group') {
        ChatService.getPinnedMessages(conversationId, token)
          .then(response => {
            if (response.success && response.pinnedMessages) {
              setActiveConversation(prev => ({
                ...prev,
                pinnedMessages: response.pinnedMessages
              }));
            }
          })
          .catch(err => Logger.error("Error loading pinned messages", err));
      }
      
      // Cuộn xuống tin nhắn mới nhất (giảm thời gian chờ)
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      
    } catch (error) {
      Alert.alert("Error", "Failed to load messages");
      Logger.error("Error loading messages", error);
    } finally {
      setLoading((prev) => ({ ...prev, messages: false }));
    }
  };

  // Cải thiện phương thức loadMoreMessages
  const loadMoreMessages = async () => {
    // Chỉ tải thêm nếu còn tin nhắn cũ và không đang tải
    if (!hasMoreMessages || loadingMoreMessages || !nextMessageCursor || !activeConversation) {
      return;
    }
    
    try {
      setLoadingMoreMessages(true);
      Logger.info("Loading more messages", { before: nextMessageCursor });
      
      // Lưu vị trí scroll hiện tại
      if (messagesContainerRef.current) {
        scrollPositionRef.current = {
          scrollHeight: messagesContainerRef.current.scrollHeight,
          scrollTop: messagesContainerRef.current.scrollTop,
        };
      }
      
      // Tải thêm tin nhắn cũ hơn - giới hạn 20 tin nhắn mỗi lần
      const result = await ChatService.loadMoreMessages(
        activeConversation._id,
        nextMessageCursor,
        20 // Giới hạn số tin nhắn tải thêm
      );
      
      if (!result || !result.messages || !Array.isArray(result.messages)) {
        throw new Error("Invalid messages data format");
      }
      
      // Không tải thêm nếu không có tin nhắn mới
      if (result.messages.length === 0) {
        Logger.info("No more messages to load");
        setHasMoreMessages(false);
        return;
      }
      
      // Chuẩn hóa ID người dùng và tin nhắn
      const normalizedMsgs = result.messages.map(msg => {
        // Đảm bảo ID người gửi luôn ở dạng string để so sánh nhất quán
        if (msg.sender && typeof msg.sender === 'object' && msg.sender._id) {
          // Lưu thông tin người gửi gốc để hiển thị trong UI
          msg.originalSender = { 
            _id: msg.sender._id,
            name: msg.sender.name || "Người dùng",
            avatar: msg.sender.avatar
          };
          // Chỉ dùng ID cho các phép so sánh
          msg.sender = msg.sender._id;
        } else if (msg.sender && typeof msg.sender === 'string') {
          // Tìm trong danh sách thành viên nhóm
          if (activeConversation?.members && Array.isArray(activeConversation.members)) {
            const senderMember = activeConversation.members.find(member => 
              member.idUser && 
              ((member.idUser._id && member.idUser._id.toString() === msg.sender.toString()) ||
              (typeof member.idUser === 'string' && member.idUser.toString() === msg.sender.toString()))
            );
            
            if (senderMember?.idUser) {
              msg.originalSender = {
                _id: typeof senderMember.idUser === 'object' ? senderMember.idUser._id : senderMember.idUser,
                name: typeof senderMember.idUser === 'object' ? senderMember.idUser.name : "Người dùng",
                avatar: typeof senderMember.idUser === 'object' ? senderMember.idUser.avatar : null
              };
            }
            // Kiểm tra admin
            else if (activeConversation.admin && 
                   activeConversation.admin._id && 
                   activeConversation.admin._id.toString() === msg.sender.toString()) {
              msg.originalSender = {
                _id: activeConversation.admin._id,
                name: activeConversation.admin.name || "Quản trị viên",
                avatar: activeConversation.admin.avatar
              };
            }
            // Kiểm tra admin2
            else if (activeConversation.admin2 && 
                   activeConversation.admin2._id && 
                   activeConversation.admin2._id.toString() === msg.sender.toString()) {
              msg.originalSender = {
                _id: activeConversation.admin2._id,
                name: activeConversation.admin2.name || "Phó nhóm",
                avatar: activeConversation.admin2.avatar
              };
            }
          }
        }
        
        // Đảm bảo ID tin nhắn nhất quán
        if (msg._id) {
          msg.id = msg._id;
        }
        
        return msg;
      });
      
      // Lọc tin nhắn đã xóa
      const filteredNewMsgs = normalizedMsgs.filter(msg => 
        !msg.deletedBy || !msg.deletedBy.some(id => id.toString() === userId.toString())
      );
      
      Logger.info(`Loaded ${filteredNewMsgs.length} additional messages`);
      
      // Cập nhật state với tin nhắn mới + tin nhắn hiện tại
      setMessages(prevMessages => [...filteredNewMsgs, ...prevMessages]);
      
      // Cập nhật trạng thái lazy loading
      setHasMoreMessages(result.hasMore);
      setNextMessageCursor(result.nextCursor);
      
      // Khôi phục vị trí scroll sau khi DOM cập nhật
      setTimeout(() => {
        if (messagesContainerRef.current && scrollPositionRef.current) {
          // Tính toán offset mới - đảm bảo vị trí tương đối được giữ nguyên
          const newScrollTop = 
            messagesContainerRef.current.scrollHeight - 
            scrollPositionRef.current.scrollHeight + 
            scrollPositionRef.current.scrollTop;
            
          messagesContainerRef.current.scrollTop = newScrollTop;
        }
      }, 50);
      
    } catch (error) {
      Logger.error("Error loading more messages", error);
    } finally {
      setLoadingMoreMessages(false);
    }
  };

  // Cải thiện Intersection Observer
  useEffect(() => {
    // Chỉ thiết lập observer nếu có các điều kiện cần thiết
    if (!hasMoreMessages || !messagesContainerRef.current || messages.length === 0) return;
    
    // Tạo phần tử top message ref nếu chưa có
    let topMessageElement = topMessageRef.current;
    
    if (!topMessageElement) {
      // Sử dụng tin nhắn đầu tiên làm điểm mốc
      topMessageElement = document.getElementById(`message-${messages[0]._id || messages[0].id}`);
      topMessageRef.current = topMessageElement;
    }
    
    if (!topMessageElement) return;
    
    Logger.debug("Setting up Intersection Observer for lazy loading");
    
    const options = {
      root: messagesContainerRef.current,
      rootMargin: "100px 0px 0px 0px", // Tải trước khi đến đỉnh 100px
      threshold: 0.1 // Kích hoạt khi phần tử hiển thị ít nhất 10%
    };
    
    const handleIntersect = (entries) => {
      const [entry] = entries;
      
      if (entry.isIntersecting && hasMoreMessages && !loadingMoreMessages) {
        Logger.info("Top message visible, loading more messages");
        loadMoreMessages();
      }
    };
    
    const observer = new IntersectionObserver(handleIntersect, options);
    observer.observe(topMessageElement);
    
    return () => {
      if (topMessageElement) {
        observer.unobserve(topMessageElement);
      }
      observer.disconnect();
    };
  }, [hasMoreMessages, loadingMoreMessages, messages, activeConversation]);

  // Save draft to localStorage
  useEffect(() => {
    // Chỉ tải bản nháp nếu không có tin nhắn nào đang được soạn
    if (activeConversation && !newMessage.trim()) {
      const draft = localStorage.getItem(`draft-${activeConversation._id}`);
      if (draft) setNewMessage(draft);
    }
  }, [activeConversation]);

  // Cải thiện hàm kiểm tra sender ID để đồng nhất việc so sánh
  const isSentByCurrentUser = (message) => {
    if (!message || !userId) return false;
    
    // Đảm bảo tất cả ID được chuyển thành string để so sánh
    const senderId = message.sender?.toString() || message.idUser?.toString() || '';
    const currentUserId = userId.toString();
    
    return senderId === currentUserId;
  };

  // Đoạn xử lý nhận tin nhắn từ socket
  useEffect(() => {
    // Setup socket event listener for new messages
    SocketService.onNewMessage((message) => {
      if (!message) return;
      
      console.log(`📩 Received message from socket: ${message._id || 'unknown'}`);
      
      // Kiểm tra xem tin nhắn có thuộc cuộc trò chuyện hiện tại không
      if (activeConversation && message.idConversation.toString() !== activeConversation._id.toString()) {
        console.log(`📤 Tin nhắn không thuộc cuộc trò chuyện hiện tại. idConversation: ${message.idConversation}, activeConversation: ${activeConversation._id}`);
        return; // Bỏ qua tin nhắn không thuộc cuộc trò chuyện hiện tại
      }
      
      // Chuẩn hóa ID người gửi từ server để đảm bảo so sánh đúng
      if (message.sender && typeof message.sender === 'object' && message.sender._id) {
        // Lưu thông tin người gửi gốc để hiển thị trong UI
        message.originalSender = { 
          _id: message.sender._id,
          name: message.sender.name || "Người dùng",
          avatar: message.sender.avatar 
        };
        // Chỉ dùng ID cho các phép so sánh
        message.sender = message.sender._id;
      } 
      // Nếu có sender_info riêng biệt thì sử dụng
      else if (message.sender_info && typeof message.sender_info === 'object' && message.sender_info._id) {
        message.originalSender = {
          _id: message.sender_info._id,
          name: message.sender_info.name || "Người dùng",
          avatar: message.sender_info.avatar
        };
      }
      // Nếu là một ID đơn giản mà chúng ta cần tìm kiếm thông tin
      else if (message.sender && typeof message.sender === 'string' && activeConversation) {
        const senderId = message.sender.toString();
        
        // Log để debug
        console.log(`🔍 Tìm thông tin cho sender ID: ${senderId}`);
        
        // Tìm trong danh sách thành viên nhóm
        if (activeConversation?.members && Array.isArray(activeConversation.members)) {
          const senderMember = activeConversation.members.find(member => 
            member.idUser && (
              (member.idUser._id && member.idUser._id.toString() === senderId) ||
              (typeof member.idUser === 'string' && member.idUser.toString() === senderId)
            )
          );
          
          if (senderMember?.idUser && typeof senderMember.idUser === 'object') {
            console.log(`✅ Tìm thấy thông tin sender từ members: ${senderMember.idUser.name || 'Không có tên'}`);
            message.originalSender = {
              _id: senderMember.idUser._id,
              name: senderMember.idUser.name || "Người dùng",
              avatar: senderMember.idUser.avatar
            };
          }
          // Kiểm tra admin
          else if (activeConversation.admin && 
                 activeConversation.admin._id && 
                 activeConversation.admin._id.toString() === senderId) {
            console.log(`✅ Tìm thấy thông tin sender từ admin: ${activeConversation.admin.name || 'Quản trị viên'}`);
            message.originalSender = {
              _id: activeConversation.admin._id,
              name: activeConversation.admin.name || "Quản trị viên",
              avatar: activeConversation.admin.avatar
            };
          }
          // Kiểm tra admin2
          else if (activeConversation.admin2 && 
                 activeConversation.admin2._id && 
                 activeConversation.admin2._id.toString() === senderId) {
            console.log(`✅ Tìm thấy thông tin sender từ admin2: ${activeConversation.admin2.name || 'Phó nhóm'}`);
            message.originalSender = {
              _id: activeConversation.admin2._id,
              name: activeConversation.admin2.name || "Phó nhóm",
              avatar: activeConversation.admin2.avatar
            };
          }
          else {
            console.log(`⚠️ Không tìm thấy thông tin sender đầy đủ`);
            // Mặc định sử dụng ID người gửi nếu không tìm thấy thông tin
            message.originalSender = {
              _id: senderId,
              name: "Người dùng",
              avatar: null
            };
          }
        }
      }
      
      // Debug: Kiểm tra thông tin người gửi sau khi xử lý
      logSenderInfo(message, 'socket');
      
      // Add or update message in the list
      setMessages((prev) => {
        // Kiểm tra nếu tin nhắn này là GIF và đã được gửi trước đó
        if (message.type === 'gif' && sentGifIds.current.has(message._id)) {
          console.log('💯 GIF message already processed, skipping:', message._id);
          return prev; // Không thêm tin nhắn vào danh sách
        }
        
        // Check if this message already exists in our list
        const existingIndex = prev.findIndex(
          (msg) =>
            (msg._id && msg._id === message._id) ||
            (msg.id && msg.id === message._id) ||
            (msg.id &&
              msg.id.startsWith('temp-') &&
              msg.sender.toString() === message.sender.toString() &&
              ((msg.content === message.content) || 
              (msg.fileName === message.fileName && msg.type === message.type)))
        );
        
        const isDuplicate = existingIndex !== -1;
        
        if (isDuplicate) {
          console.log('⚠️ This message already exists, updating instead of adding new');
          // Update existing message instead of adding new one
          return prev.map((msg, index) => {
            if (index === existingIndex) {
              console.log('🔄 Updating message:', msg.id, ' -> ', message._id);
              
              // Create enhanced message with all required properties
              const enhancedMessage = { 
                ...message,                           // Take everything from server message
                _id: message._id,                     // Ensure ID is set
                id: message._id,                      // Ensure id is also set for consistent checking
                status: "delivered",                  // Update status
                originalSender: message.originalSender || msg.originalSender, // Giữ thông tin người gửi
                fileUrl: message.fileUrl || msg.fileUrl,     // Keep file URL
                fileName: message.fileName || msg.fileName,  // Keep file name
                fileType: message.fileType || msg.fileType,  // Keep file type
                type: message.type || msg.type,              // Keep message type
                content: message.content || msg.content      // Keep content
              };
              
              console.log('📜 Updated message data:', enhancedMessage);
              return enhancedMessage;
            }
            return msg;
          });
        } else {
          console.log('✨ Adding new message to list');
          
          // Ensure the message has consistent ID format  
          const enhancedMessage = {
            ...message,
            id: message._id,              // Add id property for consistent checking
            status: "delivered"           // Set status
          };

          // Handle specific file types
          if (['image', 'video', 'audio', 'pdf', 'doc', 'excel', 'presentation', 'file'].includes(message.type)) {
            // Log file data
            console.log(`📁 Processing ${message.type} message:`, {
              id: message._id,
              url: message.fileUrl,
              fileName: message.fileName,
              fileType: message.fileType,
              content: message.content
            });

            // If there's no fileUrl but there's a message with this ID that has it, use that
            if (!message.fileUrl && existingIndex !== -1) {
              enhancedMessage.fileUrl = prev[existingIndex].fileUrl;
            }
            
            if (!message.fileName && existingIndex !== -1) {
              enhancedMessage.fileName = prev[existingIndex].fileName;
            }
          }
          
          // Nếu là tin nhắn GIF, thêm vào danh sách đã xử lý
          if (message.type === 'gif' && message._id) {
            sentGifIds.current.add(message._id);
          }
          
          // If no duplicates, add to list
          return [...prev, enhancedMessage];
        }
      });
      
      // Scroll to bottom when new message arrives
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      
      // If message is from another user and we're in the conversation, mark as seen
      if (
        message.sender.toString() !== userId.toString() && 
        message.idConversation.toString() === activeConversation?._id.toString()
      ) {
        // Đánh dấu tin nhắn đã xem
        SocketService.markMessageAsSeen(activeConversation._id);
      }

      // Cập nhật activeConversation với tin nhắn mới nhưng giữ nguyên thông tin members
      if (activeConversation && activeConversation._id === message.idConversation) {
        setActiveConversation(prev => {
          // Tạo bản sao sâu của activeConversation
          return {
            ...prev,
            lastMessage: {
              _id: message._id,
              content: message.content,
              type: message.type,
              fileUrl: message.fileUrl,
              fileName: message.fileName,
              sender: message.sender
            }
            // Giữ nguyên các thuộc tính khác, đặc biệt là members
          };
        });
      }
    });
    
    // Group chat socket event listeners
    // Group created event
    SocketService.onGroupCreated((newGroup) => {
      console.log('🔔 Group created:', newGroup);
      setConversations(prev => [newGroup, ...prev]);
    });
    
    // Group updated event
    SocketService.onGroupUpdated((data) => {
      console.log('🔔 Group updated:', data);
      
      const { conversationId, name, avatar, updatedBy, systemMessage } = data;
      
      // Update conversations list with new group info
      setConversations(prev => 
        prev.map(conv => {
          if (conv._id === conversationId) {
            // Create a new object with updated properties
            return {
              ...conv,
              name: name || conv.name,
              avatar: avatar || conv.avatar
            };
          }
          return conv;
        })
      );
      
      // Update active conversation if it's the one that was updated
      if (activeConversation && activeConversation._id === conversationId) {
        setActiveConversation(prev => ({
          ...prev,
          name: name || prev.name,
          avatar: avatar || prev.avatar
        }));
        
        // Add a system message to the UI about the update
        if (systemMessage) {
          const tempSystemMessage = {
            _id: systemMessage._id || Date.now().toString(),
            type: 'system',
            content: systemMessage.content,
            createdAt: systemMessage.createdAt || new Date(),
            temporary: true // Mark as temporary so it doesn't duplicate with actual messages
          };
          
          // Add the system message to the messages list
          setMessages(prev => [...prev, tempSystemMessage]);
        }
      }
    });
    
    // Admin2 assigned event - when the current user is assigned as admin2
    SocketService.onAdmin2Assigned(({ conversation, memberId, assignedBy }) => {
      console.log('🔔 User assigned as admin2:', { conversation, memberId, assignedBy });
      
      // Get current user data
      const userData = AuthService.getUserData();
      const currentUserId = userData?._id;
      
      // Check if the current user is the one being assigned as admin2
      const isCurrentUserAssigned = memberId === currentUserId;
      
      if (isCurrentUserAssigned) {
        console.log('Current user was assigned as admin2');
        
        // Update the conversation in the list
        setConversations(prev => 
          prev.map(conv => 
            conv._id === conversation._id ? conversation : conv
          )
        );
        
        // Update active conversation if it's the one that was updated
        if (activeConversation && activeConversation._id === conversation._id) {
          setActiveConversation(conversation);
          
          // Add a system message to the UI about the admin2 assignment
          const systemMessage = {
            _id: Date.now().toString(),
            type: 'system',
            content: `${assignedBy}  đã giao quyền phó nhóm cho bạn`,
            createdAt: new Date(),
            temporary: true // Mark as temporary so it doesn't duplicate with actual messages
          };
          
          // Add the system message to the messages list
          setMessages(prev => [...prev, systemMessage]);
        }
      }
    });
    
    // Admin2 removed event - when the current user's admin2 role is removed
    SocketService.onAdmin2Removed(({ conversation, memberId, removedBy }) => {
      console.log('🔔 Người dùng đã bị xoá phó nhóm:', { conversation, memberId, removedBy });
      
      // Get current user data
      const userData = AuthService.getUserData();
      const currentUserId = userData?._id;
      
      // Check if the current user is the one being removed from admin2
      const isCurrentUserRemoved = memberId === currentUserId;
      
      if (isCurrentUserRemoved) {
        console.log('Current user was removed from admin2 role');
        
        // Xóa admin2Id từ localStorage
        localStorage.removeItem(`admin2Id_${conversation._id}`);
        localStorage.removeItem('admin2Id');
        
        // Update the conversation in the list
        setConversations(prev => 
          prev.map(conv => 
            conv._id === conversation._id ? {
              ...conv,
              admin2: null // Đảm bảo admin2 là null để cập nhật đúng quyền
            } : conv
          )
        );
        
        // Update active conversation if it's the one that was updated
        if (activeConversation && activeConversation._id === conversation._id) {
          setActiveConversation(prev => ({
            ...prev,
            admin2: null // Đảm bảo admin2 là null để cập nhật đúng quyền
          }));
          
          // Add a system message to the UI about the admin2 removal
          const systemMessage = {
            _id: Date.now().toString(),
            type: 'system',
            content: `${removedBy} đã xóa bạn khỏi phó nhóm`,
            createdAt: new Date(),
            temporary: true // Mark as temporary so it doesn't duplicate with actual messages
          };
          
          // Add the system message to the messages list
          setMessages(prev => [...prev, systemMessage]);
        }
      } else {
        // Nếu người bị xóa không phải là người dùng hiện tại, vẫn cập nhật state để UI nhất quán
        // Update the conversation in the list
        setConversations(prev => 
          prev.map(conv => 
            conv._id === conversation._id ? {
              ...conv,
              admin2: null
            } : conv
          )
        );
        
        // Update active conversation if it's the one that was updated
        if (activeConversation && activeConversation._id === conversation._id) {
          setActiveConversation(prev => ({
            ...prev,
            admin2: null
          }));
        }
      }
    });
    
    // Member added to group event
    SocketService.onMemberAdded(({ conversation, member }) => {
      console.log('🔔 Người dùng được thêm vào nhóm:', { conversation, member });
      
      // Get current user data
      const userData = AuthService.getUserData();
      const currentUserId = userData?._id;
      
      // Check if the current user is the one being added to the group
      const isCurrentUserAdded = member && (
        (member._id === currentUserId) || 
        (member.idUser && member.idUser._id === currentUserId) ||
        (member.idUser === currentUserId)
      );
      
      console.log('Is current user added to group:', isCurrentUserAdded);
      
      setConversations(prev => {
        // Check if the conversation already exists in the list
        const conversationExists = prev.some(conv => conv._id === conversation._id);
        
        if (conversationExists) {
          // Update existing conversation
          return prev.map(conv => 
            conv._id === conversation._id ? conversation : conv
          );
        } else if (isCurrentUserAdded) {
          // Add new conversation to the list if current user was added
          console.log('Adding new group conversation to list:', conversation);
          return [conversation, ...prev];
        } else {
          // No changes needed
          return prev;
        }
      });
      
      // Update active conversation if it's the one that was updated
      if (activeConversation && activeConversation._id === conversation._id) {
        setActiveConversation(conversation);
      }
    });
    
    // Member removed from group event
    SocketService.onMemberRemoved(({ conversation, memberId, memberName }) => {
      console.log('🔔 Người dùng được xóa khỏi nhóm:', { conversation, memberId, memberName });
      
      // Get current user data
      const userData = AuthService.getUserData();
      const currentUserId = userData?._id;
      
      // Check if the current user is the one being removed
      const isCurrentUserRemoved = memberId === currentUserId;
      
      if (isCurrentUserRemoved) {
        console.log('Current user was removed from the group');
        // Remove the conversation from the list if current user was removed
        setConversations(prev => prev.filter(conv => conv._id !== conversation._id));
        
        // If the active conversation is the one the user was removed from, clear it
        if (activeConversation && activeConversation._id === conversation._id) {
          setActiveConversation(null);
          setMessages([]);
          // Navigate back to conversation list if needed
          if (window.innerWidth <= 768) {
            setShowConversationList(true);
          }
        }
      } else {
        // Update the conversation in the list with the new member list
        setConversations(prev => 
          prev.map(conv => 
            conv._id === conversation._id ? conversation : conv
          )
        );
        
        // Update active conversation if it's the one that was updated
        if (activeConversation && activeConversation._id === conversation._id) {
          setActiveConversation(conversation);
          
          // Add a system message to the UI about the member leaving
          if (memberName) {
            const systemMessage = {
              _id: Date.now().toString(),
              type: 'system',
              content: `${memberName} left the group`,
              createdAt: new Date(),
              temporary: true // Mark as temporary so it doesn't duplicate with actual messages
            };
            
            // Add the system message to the messages list
            setMessages(prev => [...prev, systemMessage]);
          }
        }
      }
    });
    
    // User left group event
    SocketService.onGroupLeft(({ conversationId, userId: leftUserId }) => {
      console.log('🔔 Người dùng rời khỏi nhóm:', { conversationId, userId: leftUserId });    
      
      // If current user left the group, remove it from the list
      if (leftUserId === userId) {
        setConversations(prev => prev.filter(conv => conv._id !== conversationId));
        
        // If active conversation is the one user left, clear it
        if (activeConversation && activeConversation._id === conversationId) {
          setActiveConversation(null);
        }
      } else {
        // Otherwise, update the conversation
        ChatService.getConversationById(conversationId)
          .then(updatedConversation => {
            setConversations(prev => 
              prev.map(conv => 
                conv._id === conversationId ? updatedConversation : conv
              )
            );
            
            // Update active conversation if it's the one that was updated
            if (activeConversation && activeConversation._id === conversationId) {
              setActiveConversation(updatedConversation);
            }
          })
          .catch(error => console.error('Error updating conversation after user left:', error));
      }
    });
    
    // Group deleted event
    SocketService.onGroupDeleted(({ conversationId }) => {
      console.log('🔔 Nhóm đã bị xóa:', conversationId);
      setConversations(prev => prev.filter(conv => conv._id !== conversationId));
      
      // If active conversation is the one that was deleted, clear it
      if (activeConversation && activeConversation._id === conversationId) {
        setActiveConversation(null);
      }
    });
    
    // Member removed from group event (real-time update)
    SocketService.onMemberRemovedFromGroup((data) => {
      console.log('🔔 Thành viên bị xóa khỏi nhóm (socket event):', data);
      const { conversationId, memberId, removedBy } = data;
      
      // Get current user data
      const userData = AuthService.getUserData();
      const currentUserId = userData?._id;
      
      // If the current user is the one being removed, handle it differently
      if (memberId === currentUserId) {
        // Remove the conversation from the list
        setConversations(prev => prev.filter(conv => conv._id !== conversationId));
        
        // If the active conversation is the one the user was removed from, clear it
        if (activeConversation && activeConversation._id === conversationId) {
          setActiveConversation(null);
          setMessages([]);
          // Navigate back to conversation list if needed
          if (window.innerWidth <= 768) {
            setShowConversationList(true);
          }
        }
      } else {
        // Cập nhật ngay lập tức danh sách thành viên trong cuộc trò chuyện hiện tại
        if (activeConversation && activeConversation._id === conversationId) {
          // Tạo bản sao của activeConversation và xóa thành viên bị loại bỏ
          const updatedConversation = {
            ...activeConversation,
            members: activeConversation.members.filter(
              member => member.idUser && 
              ((member.idUser._id && member.idUser._id.toString() !== memberId.toString()) ||
               (typeof member.idUser === 'string' && member.idUser.toString() !== memberId.toString()))
            )
          };
          
          // Cập nhật state với danh sách thành viên mới
          setActiveConversation(updatedConversation);
          
          // Cập nhật danh sách cuộc trò chuyện
          setConversations(prev => 
            prev.map(conv => 
              conv._id === conversationId ? updatedConversation : conv
            )
          );
          
          // Thêm thông báo hệ thống về việc thành viên bị xóa
          const systemMessage = {
            _id: Date.now().toString(),
            type: 'system',
            content: data.memberName 
              ? `${data.memberName} đã bị xóa khỏi nhóm bởi ${data.removedByName || 'quản trị viên'}`
              : `Một thành viên đã bị xóa khỏi nhóm`,
            createdAt: new Date(),
            temporary: true
          };
          
          setMessages(prev => [...prev, systemMessage]);
        } else {
          // Nếu không phải cuộc trò chuyện hiện tại, vẫn cập nhật trong danh sách
          setConversations(prev => 
            prev.map(conv => {
              if (conv._id === conversationId) {
                return {
                  ...conv,
                  members: conv.members ? conv.members.filter(
                    member => member.idUser && 
                    ((member.idUser._id && member.idUser._id.toString() !== memberId.toString()) ||
                     (typeof member.idUser === 'string' && member.idUser.toString() !== memberId.toString()))
                  ) : []
                };
              }
              return conv;
            })
          );
        }
      }
    });
    
    return () => {
      // Cleanup socket listeners
      SocketService.removeListener('new_message');
      SocketService.removeListener('group_created');
      SocketService.removeListener('group_updated');
      SocketService.removeListener('member_added');
      SocketService.removeListener('member_removed');
      SocketService.removeListener('member_removed_from_group');
      SocketService.removeListener('group_left');
      SocketService.removeListener('group_deleted');
    };
  }, [activeConversation, userId]);

  // Cập nhật hàm handleSendMessage để gửi tin nhắn qua socket
  const handleSendMessage = async () => {
    // Kiểm tra nếu không có tin nhắn hoặc không có cuộc trò chuyện
    if ((!newMessage.trim() && !selectedFile) || !activeConversation?._id) return;
    
    // Kiểm tra nếu tin nhắn bắt đầu bằng @AIGemini hoặc @AiGemini
    if (newMessage.trim().startsWith('@AIGemini') || newMessage.trim().startsWith('@AiGemini')) {
      try {
        // Hiển thị trạng thái đang xử lý
        setIsProcessingAI(true);
        
        // Gọi API để xử lý tin nhắn AI
        const result = await ChatService.processAIGeminiMessage(
          newMessage.trim(),
          activeConversation._id,
          userId
        );
        
        // Xử lý kết quả
        if (result?.error) {
          // Hiển thị thông báo lỗi
          setSnackbarMessage(result.message);
          setSnackbarOpen(true);
        } else if (result?.success) {
          // Hiển thị tin nhắn tạm thời
          if (result.tempMessages && Array.isArray(result.tempMessages)) {
            // Thêm tin nhắn tạm thời vào danh sách tin nhắn
            setMessages(prevMessages => [...prevMessages, ...result.tempMessages]);
            
            // Cuộn xuống dưới khi có tin nhắn mới
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
            
            // Sau khi có kết quả từ AI, cập nhật tin nhắn AI với nội dung thực tế
            setTimeout(() => {
              setMessages(prevMessages => {
                // Tìm và thay thế tin nhắn AI tạm thời bằng tin nhắn thực tế
                return prevMessages.map(msg => {
                  // Nếu là tin nhắn AI tạm thời, thay thế bằng tin nhắn thực tế
                  if (msg.isAI && msg.status === 'sending') {
                    return result.aiMessage;
                  }
                  return msg;
                });
              });
              
              // Cuộn xuống dưới khi có tin nhắn mới
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 500);
          }
        }
        
        // Xóa tin nhắn và ẩn trạng thái xử lý
        setNewMessage("");
        setIsProcessingAI(false);
        
        // Xóa bản nháp tin nhắn khỏi localStorage
        if (activeConversation?._id) {
          localStorage.removeItem(`draft-${activeConversation._id}`);
        }
        
        return; // Kết thúc hàm vì tin nhắn đã được xử lý bởi AI
      } catch (error) {
        console.error('Lỗi khi xử lý tin nhắn AI:', error);
        setSnackbarMessage('Không thể xử lý yêu cầu AI. Vui lòng thử lại sau.');
        setSnackbarOpen(true);
        setIsProcessingAI(false);
      }
    }

    // Log thông tin thành viên trước khi gửi tin nhắn
    console.log(`📊 Trước khi gửi tin nhắn - Số thành viên: ${activeConversation.members?.length || 0}`);
    
    // Lưu bản sao của activeConversation để tránh mất thông tin thành viên
    // Sử dụng deep copy cho các thuộc tính quan trọng
    const conversationCopy = {
      ...activeConversation,
      members: activeConversation.members ? [...activeConversation.members] : [],
      admin: activeConversation.admin ? {...activeConversation.admin} : null,
      admin2: activeConversation.admin2 ? {...activeConversation.admin2} : null,
    };
    
    // Log thông tin bản sao
    console.log(`📋 Bản sao cuộc trò chuyện - Số thành viên: ${conversationCopy.members?.length || 0}`);

    // Dừng trạng thái typing nếu đang nhập
    if (isTyping) {
      setIsTyping(false);
      SocketService.sendStopTypingStatus(activeConversation._id, userId);
    }

    // Determine message type based on selected file
    let messageType = 'text';
    if (selectedFile) {
      if (selectedFile.type.startsWith('image/')) {
        messageType = 'image';
      } else if (selectedFile.type.startsWith('video/')) {
        messageType = 'video';
      } else if (selectedFile.type.startsWith('audio/')) {
        messageType = 'audio';
      } else if (selectedFile.detectedType) {
        // Use the detected type from handleFileSelect
        messageType = selectedFile.detectedType;
      } else {
        messageType = 'file';
      }
    }

    // Tạo tin nhắn tạm thời
    const tempMessage = {
      id: `temp-${Date.now()}`,
      text: newMessage,
      content: newMessage,
      sender: userId,
      originalSender: { 
        _id: userId,
        name: user.name,
        avatar: user.avatar
      },
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAt: new Date().toISOString(),
      seen: false,
      status: "sending",
      hasFile: !!selectedFile,
      fileName: selectedFile?.name || "",
      fileType: selectedFile?.type || "",
      type: messageType,
      fileUrl: selectedFile && selectedFile.type.startsWith('image/') 
        ? selectedFilePreview 
        : (selectedFile?.tempFileUrl || null), // Sử dụng tempFileUrl nếu không phải hình ảnh
    };
    
    // Xử lý bổ sung cho tin nhắn ảnh
    if (selectedFile && selectedFile.type && selectedFile.type.startsWith('image/')) {
      // Đánh dấu đây là xem trước
      tempMessage.isPreview = !!selectedFilePreview;
      
      // Nếu là ảnh và không có nội dung, đặt content rỗng
      if (!newMessage.trim()) {
        tempMessage.content = '';
      }
    }

    // Thêm tin nhắn vào UI ngay lập tức
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");
    
    // Xóa bản nháp tin nhắn khỏi localStorage
    if (activeConversation?._id) {
      localStorage.removeItem(`draft-${activeConversation._id}`);
    }
    
    // Cuộn xuống dưới khi có tin nhắn mới
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      const token = AuthService.getAccessToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Xử lý tải lên file
      if (selectedFile) {
        console.log('📎 Đang tải lên file:', selectedFile.name, 'loại:', messageType);
        
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('idConversation', activeConversation._id);
        formData.append('sender', userId);
        formData.append('content', newMessage || `File: ${selectedFile.name}`);
        formData.append('type', messageType);
        
        // Thêm socketId để server có thể gửi thông báo tin nhắn mới đến đúng client
        const socketId = SocketService.getSocketId();
        if (socketId) {
          console.log('🔌 Gửi kèm socketId để xử lý real-time:', socketId);
          formData.append('socketId', socketId);
        }

        try {
          // Tải lên file qua HTTP
          console.log('📤 Tải lên file qua HTTP');
          const fileResponse = await ChatService.uploadFile(formData, token);
          console.log('✅ Tải lên file thành công:', fileResponse);
          
          // Cập nhật trạng thái tin nhắn tạm để người dùng biết tin nhắn đã gửi thành công
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempMessage.id
                ? {
                    ...msg,
                    _id: fileResponse._id, // Thêm _id để phòng trường hợp socket không trả về kịp thời
                    status: "sent", // Đánh dấu là đã gửi
                    fileUrl: fileResponse.fileUrl || msg.fileUrl, // Cập nhật URL từ response
                    fileName: fileResponse.fileName || msg.fileName,
                    fileType: fileResponse.fileType || msg.fileType,
                    // Xóa trạng thái preview
                    isPreview: false
                  }
                : msg
            )
          );
          
          // Cập nhật danh sách cuộc trò chuyện (thay vì đợi socket)
          const updatedConversation = {
            ...conversationCopy, // Sử dụng bản sao đã lưu để giữ nguyên thông tin thành viên
            lastMessage: {
              _id: fileResponse._id,
              content: fileResponse.content || `File: ${fileResponse.fileName}`,
              type: fileResponse.type || messageType,
              fileUrl: fileResponse.fileUrl,
              fileName: fileResponse.fileName,
              sender: userId
            }
          };
          
          // Log thông tin cuộc trò chuyện sau khi cập nhật
          console.log(`📈 Sau khi cập nhật (file) - Số thành viên: ${updatedConversation.members?.length || 0}`);
          
          setActiveConversation(updatedConversation);
          
          // Xóa file đã chọn
          setSelectedFile(null);
          setSelectedFilePreview(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (error) {
          console.error("❌ Lỗi khi tải lên file:", error);
          
          // Hiển thị thông tin lỗi chi tiết hơn
          let errorMessage = "Không thể tải lên file";
          if (error.response) {
            // Server đã trả về phản hồi với mã lỗi
            console.error("Chi tiết lỗi từ server:", error.response.data);
            errorMessage = `Lỗi: ${error.response.status} - ${error.response.data.error || error.response.data.message || "Lỗi không xác định"}`;
          } else if (error.request) {
            // Request được tạo nhưng không nhận được phản hồi
            console.error("Không nhận được phản hồi từ server:", error.request);
            errorMessage = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
          } else {
            // Có lỗi khi thiết lập request
            console.error("Lỗi thiết lập request:", error.message);
            errorMessage = `Lỗi: ${error.message}`;
          }
          
          Alert.alert("Lỗi tải lên", errorMessage);
          
          // Cập nhật trạng thái tin nhắn thành thất bại
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempMessage.id ? { ...msg, status: "failed" } : msg
            )
          );
        }
      } else {
        // Gửi tin nhắn văn bản qua socket
        console.log('💬 Gửi tin nhắn văn bản qua socket');
        
        const messageData = {
          idConversation: activeConversation._id,
          content: newMessage,
          type: "text",
          sender: userId,
        };
        
        // Đảm bảo socket được kết nối
        if (!SocketService.isConnected) {
          console.log('🔄 Socket chưa kết nối, đang kết nối lại...');
          SocketService.connect();
        }
        
        // Gửi tin nhắn qua socket
        console.log('📨 Gửi tin nhắn:', messageData);
        SocketService.sendMessage(messageData);
        
        // Socket sẽ phát sự kiện new_message khi tin nhắn được lưu vào database
        // Nhưng để cập nhật UI ngay lập tức, ta sẽ cập nhật trạng thái tin nhắn
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessage.id
              ? {
                  ...msg,
                  status: "sent"
                }
              : msg
          )
        );
        
        // Cập nhật danh sách cuộc trò chuyện với tin nhắn mới
        const updatedConversation = {
          ...conversationCopy, // Sử dụng bản sao để giữ nguyên thông tin thành viên
          lastMessage: {
            content: newMessage,
            type: "text",
            sender: userId
          }
        };
        
        // Log thông tin cuộc trò chuyện sau khi cập nhật
        console.log(`📈 Sau khi cập nhật - Số thành viên: ${updatedConversation.members?.length || 0}`);
        
        setActiveConversation(updatedConversation);
      }
    } catch (error) {
      console.error("❌ Lỗi khi gửi tin nhắn:", error);
      Alert.alert("Error", "Failed to send message");
      
      // Cập nhật trạng thái tin nhắn thành thất bại
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id ? { ...msg, status: "failed" } : msg
        )
      );
    }
  };

  const handleFindFriendByPhoneNumber = async (phone) => {
    if (!phone) return;
    try {
      const user = await UserService.searchUser(phone);
      setFoundUser(user); // store found user
    } catch (error) {
      console.error("User not found or error:", error);
      setFoundUser(null); // clear result if error
    }
  };

  const handleConversationSelect = async (conversation) => {
    try {
      // Log thông tin về members của cuộc trò chuyện
      console.log(`🔍 Chọn cuộc trò chuyện: ${conversation._id}`);
      console.log(`👥 Số thành viên: ${conversation.members?.length || 0}`);
      if (conversation.members && conversation.members.length > 0) {
        console.log('👤 Danh sách thành viên:', conversation.members.map(m => m.name || m._id).join(', '));
      }
      
      // Đặt cuộc trò chuyện đang hoạt động trước
      setActiveConversation(conversation);
      
      // Hiển thị trạng thái đang tải tin nhắn
      setLoading((prev) => ({ ...prev, messages: true }));
      
      // Tải tin nhắn cho cuộc trò chuyện được chọn
      await loadMessages(conversation._id);
      
      // Tham gia phòng socket cho cuộc trò chuyện này
      SocketService.joinConversation(conversation._id);
      
      // Đánh dấu tin nhắn đã xem
      await ChatService.markMessagesAsSeen(conversation._id);
      
      // Cập nhật trạng thái UI
      setShowSingleChat(true);
      
      // Cuộn xuống tin nhắn mới nhất
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      Logger.error("Error selecting conversation", error);
      Alert.alert("Error", "Failed to load conversation");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSidebarMenuAnchorEl(null);
    localStorage.removeItem('currentMenu');
  };

  const handleSidebarMenuOpen = (event) => {
    setSidebarMenuAnchorEl(event.currentTarget);
  };

  const handleChange = (event) => {
    const input = event.target.value;
    setPhone(input);
    handleFindFriendByPhoneNumber(input);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleEmojiOpen = (event) => {
    setEmojiAnchorEl(event.currentTarget);
    setShowEmojiPicker(true);
    setActiveTab('emoji');
  };

  const handleEmojiClose = () => {
    setEmojiAnchorEl(null);
    setShowEmojiPicker(false);
    setShowGifGallery(false);
  };

  const handleTabChange = (tab) => {
    if (typeof tab === 'object') {
      setEmojiAnchorEl(tab.currentTarget);
      setActiveTab('gif');
      setShowEmojiPicker(false);
      setShowGifGallery(true);
    } else {
      setActiveTab(tab);
      setShowEmojiPicker(tab === 'emoji');
      setShowGifGallery(tab === 'gif');
    }
  };

  const insertEmoji = (emoji) => {
    setNewMessage(prevMessage => prevMessage + emoji);
    inputRef.current?.focus();
  };

  // Lưu trữ ID của tin nhắn GIF đã gửi để tránh hiển thị trùng lặp
  const sentGifIds = useRef(new Set());
  
  const handleSendGif = async (gif) => {
    try {
      if (!activeConversation?._id || !userId) return;
      
      const token = AuthService.getAccessToken();
      if (!token) {
        throw new Error("Không có token xác thực");
      }
      
      const caption = newMessage.trim();
      
      Logger.info('Sending GIF message', { gifData: gif });
      
      // Tạo ID duy nhất cho tin nhắn tạm thời
      const tempId = `temp_gif_${Date.now()}`;
      
      // Lưu ID vào danh sách đã gửi
      sentGifIds.current.add(tempId);
      
      // Gửi tin nhắn GIF qua API
      const response = await ChatService.sendGifMessage(
        activeConversation._id,
        userId,
        gif, // Truyền toàn bộ đối tượng gif từ Giphy API
        token,
        caption
      );
      
      // Lưu ID thực tế vào danh sách đã gửi
      if (response && response._id) {
        sentGifIds.current.add(response._id);
      }
      
      if (caption) {
        setNewMessage("");
        if (activeConversation?._id) {
          localStorage.removeItem(`draft-${activeConversation._id}`);
        }
      }
      
      handleEmojiClose();
    } catch (error) {
      console.error('Error sending GIF:', error);
      // Sử dụng Dialog thay vì Alert.alert vì đây là ứng dụng web
      setErrorMessage('Không thể gửi GIF. Vui lòng thử lại.');
      setErrorDialogOpen(true);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setSelectedFile(file);
    
    // Determine file type and create preview when possible
    if (file.type.startsWith('image/')) {
      // For images, create a preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      // For videos, we'll just use a placeholder in the UI
      setSelectedFilePreview(null);
    } else {
      // For documents and other file types
      setSelectedFilePreview(null);
      
      // Determine file type for UI display
      let fileType = 'file';
      if (file.type.includes('pdf')) {
        fileType = 'pdf';
      } else if (file.type.includes('word') || 
                file.type.includes('document') ||
                file.name.endsWith('.doc') || 
                file.name.endsWith('.docx')) {
        fileType = 'doc';
      } else if (file.type.includes('excel') || 
                file.type.includes('sheet') ||
                file.name.endsWith('.xls') || 
                file.name.endsWith('.xlsx')) {
        fileType = 'excel';
      } else if (file.type.includes('presentation') ||
                file.name.endsWith('.ppt') || 
                file.name.endsWith('.pptx')) {
        fileType = 'presentation';
      }
      
      // Store the detected file type for later use
      file.detectedType = fileType;
      
      // Tạo một identifier tạm cho file để hiển thị trước khi upload
      // Đảm bảo mỗi file đều có một identifier duy nhất
      file.tempFileUrl = `temp_file_${Date.now()}_${file.name}`;
    }
    
    // Focus input text for caption
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleCancelFileSelection = () => {
    setSelectedFile(null);
    setSelectedFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      // Đóng menu
      handleMenuClose();
      // Đặt cờ để App.js biết người dùng đã đăng xuất
      localStorage.setItem("isLoggedOut", "true");
      // Reload trang để App.js có thể kiểm tra lại trạng thái xác thực
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to logout");
    }
  };

  // Thêm useEffect mới để kết nối socket khi component mount
  useEffect(() => {
    // Tránh tạo nhiều connection 
    if (socketConnectionInitialized.current) return;
    
    Logger.info('Thiết lập kết nối socket realtime...');
    
    try {
      // Kết nối socket khi component mount - nhưng trì hoãn một chút để cho phép UI hiển thị trước
      setTimeout(() => {
        const socket = SocketService.connect();
        socketConnectionInitialized.current = true;
        
        // Khi socket kết nối thành công
        const handleConnect = () => {
          Logger.info('Socket đã kết nối thành công:', socket.id);
          
          // Tham gia phòng user
          if (userId) {
            const userData = AuthService.getUserData();
            if (userData) {
              Logger.info('Tham gia phòng user:', userData._id);
              SocketService.joinUserRoom(userData);
            }
          }
          
          // Tham gia cuộc trò chuyện hiện tại
          if (activeConversation?._id) {
            Logger.info('Tham gia cuộc trò chuyện:', activeConversation._id);
            SocketService.joinConversation(activeConversation._id);
          }
          
          // Tham gia tất cả các cuộc trò chuyện - nhưng trì hoãn để không làm chậm UI
          if (conversations?.length > 0) {
            setTimeout(() => {
              const conversationIds = conversations.map(c => c._id);
              Logger.info('Tham gia tất cả cuộc trò chuyện:', conversationIds.length);
              SocketService.joinAllConversations(conversationIds);
            }, 1000); // Trì hoãn 1 giây để UI có thể hiển thị trước
          }
        };
        
        // Khi socket ngắt kết nối
        const handleDisconnect = (reason) => {
          Logger.info('Socket đã ngắt kết nối, lý do:', reason);
          
          // Đặt lại trạng thái kết nối nếu bị ngắt bởi server hoặc lỗi mạng
          if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'transport error') {
            // Đánh dấu là cần khởi tạo lại kết nối khi component rerender
            socketConnectionInitialized.current = false;
          }
        };
        
        // Thiết lập các sự kiện socket
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        
        // Nếu đã kết nối thì gọi ngay handler
        if (socket.connected) {
          handleConnect();
        }
      }, 500); // Trì hoãn 500ms để UI có thể hiển thị trước
      
      // Cleanup khi component unmount
      return () => {
        Logger.info('Dọn dẹp các sự kiện socket');
        if (SocketService.socket) {
          SocketService.socket.off('connect');
          SocketService.socket.off('disconnect');
        }
        
        // Chỉ đặt lại flag nếu component thực sự unmount
        // KHÔNG gọi SocketService.disconnect() ở đây để tránh kết nối lại không cần thiết
        // khi component rerender
        socketConnectionInitialized.current = false;
      };
    } catch (error) {
      Logger.error('Lỗi khi thiết lập kết nối socket:', error);
      // Đặt lại flag nếu có lỗi
      socketConnectionInitialized.current = false;
    }
  }, [userId]); // Chỉ phụ thuộc vào userId để khởi tạo một lần
  
  // useEffect riêng để cập nhật khi activeConversation thay đổi
  useEffect(() => {
    if (!SocketService.socket || !SocketService.isConnected) return;
    
    // Tham gia cuộc trò chuyện hiện tại
    if (activeConversation?._id) {
      console.log('💬 Tham gia cuộc trò chuyện mới:', activeConversation._id);
      SocketService.joinConversation(activeConversation._id);
      
      // Đánh dấu tin nhắn đã xem
      SocketService.markMessageAsSeen(activeConversation._id);
    }
    
    // Thông báo rằng người dùng đang xem tin nhắn
    if (activeConversation?._id) {
      SocketService.viewingMessages(activeConversation._id);
    }
    
    return () => {
      if (activeConversation?._id) {
        SocketService.stopViewingMessages(activeConversation._id);
      }
    };
  }, [activeConversation]);

  // Xử lý trạng thái typing
  useEffect(() => {
    if (!SocketService.socket) return;
    
    console.log('⌨️ Thiết lập listener cho trạng thái typing');
    
    const handleUserTyping = (typingUserId) => {
      console.log('⌨️ Người dùng đang nhập:', typingUserId);
      
      // Tìm tên người dùng từ cuộc trò chuyện
      let typingUserName = "Ai đó";
      
      if (activeConversation?.members) {
        const typingMember = activeConversation.members.find(
          member => member.idUser && member.idUser._id === typingUserId
        );
        
        if (typingMember?.idUser?.name) {
          typingUserName = typingMember.idUser.name;
        }
      }
      
      // Cập nhật state
      setTypingUsers(prev => ({
        ...prev,
        [typingUserId]: typingUserName
      }));
    };
    
    const handleUserStopTyping = (typingUserId) => {
      console.log('🛑 Người dùng ngừng nhập:', typingUserId);
      
      // Cập nhật state
      setTypingUsers(prev => {
        const newState = { ...prev };
        delete newState[typingUserId];
        return newState;
      });
    };
    
    // Đăng ký event listener
    SocketService.onUserTyping(handleUserTyping);
    SocketService.onUserStopTyping(handleUserStopTyping);
    
    // Cleanup
    return () => {
      SocketService.removeListener('user_typing');
      SocketService.removeListener('user_stop_typing');
    };
  }, [activeConversation]);

  // Xử lý tin nhắn đã xem
  useEffect(() => {
    if (!SocketService.socket) return;
    
    console.log('👁️ Thiết lập listener cho tin nhắn đã xem');
    
    const handleMessageSeen = () => {
      console.log('👁️ Tin nhắn đã được xem');
      
      // Cập nhật tất cả tin nhắn thành đã xem
      setMessages(prev => 
        prev.map(msg => ({
          ...msg,
          seen: true
        }))
      );
    };
    
    // Đăng ký event listener
    SocketService.onMessageSeen(handleMessageSeen);
    
    // Cleanup
    return () => {
      SocketService.removeListener('seen_message');
    };
  }, []);

  // Xử lý cuộc trò chuyện mới
  useEffect(() => {
    if (!SocketService.socket) return;
    
    console.log('🆕 Thiết lập listener cho cuộc trò chuyện mới');
    
    const handleNewConversation = (conversation) => {
      console.log('🆕 Có cuộc trò chuyện mới:', conversation);
      
      // Thêm cuộc trò chuyện mới vào danh sách
      setConversations(prev => {
        // Kiểm tra xem đã tồn tại chưa
        const exists = prev.some(conv => conv._id === conversation._id);
        if (!exists) {
          return [conversation, ...prev];
        }
        return prev;
      });
      
      // Tham gia vào cuộc trò chuyện mới
      SocketService.joinConversation(conversation._id);
    };
    
    // Đăng ký event listener
    SocketService.onNewConversation(handleNewConversation);
    
    // Cleanup
    return () => {
      SocketService.removeListener('new_conversation');
    };
  }, []);

  // Xử lý sự kiện nhóm mới được tạo
  useEffect(() => {
    if (!SocketService.socket) return;
    
    console.log('👥 Thiết lập listener cho nhóm mới được tạo');
    
    const handleGroupCreatedSocket = (newGroup) => {
      console.log('👥 Nhóm mới đã được tạo:', newGroup);
      
      // Kiểm tra xem nhóm này đã được thêm thủ công chưa
      const isAlreadyAdded = window.addedGroupIds && window.addedGroupIds.has(newGroup._id);
      
      if (isAlreadyAdded) {
        console.log('👥 Nhóm này đã được thêm thủ công, bỏ qua');
        return;
      }
      
      // Thêm nhóm mới vào danh sách cuộc trò chuyện
      setConversations(prev => {
        // Kiểm tra xem đã tồn tại chưa
        const exists = prev.some(conv => conv._id === newGroup._id);
        if (!exists) {
          // Đưa nhóm mới lên đầu danh sách
          console.log('👥 Thêm nhóm mới vào danh sách cuộc trò chuyện');
          
          // Đánh dấu nhóm đã được thêm để tránh thêm lại từ socket event khác
          window.addedGroupIds = window.addedGroupIds || new Set();
          window.addedGroupIds.add(newGroup._id);
          
          // Thiết lập timeout để xóa ID sau 5 giây
          setTimeout(() => {
            if (window.addedGroupIds && window.addedGroupIds.has(newGroup._id)) {
              window.addedGroupIds.delete(newGroup._id);
            }
          }, 5000);
          
          return [newGroup, ...prev];
        }
        console.log('👥 Nhóm đã tồn tại trong danh sách, bỏ qua');
        return prev;
      });
      
      // Tham gia vào nhóm mới
      SocketService.joinConversation(newGroup._id);
    };
    
    // Đăng ký event listener
    SocketService.onGroupCreated(handleGroupCreatedSocket);
    
    // Cleanup
    return () => {
      SocketService.removeListener('group_created');
    };
  }, [conversations]);

  // Xử lý sự kiện ghim và bỏ ghim tin nhắn
  useEffect(() => {
    if (!SocketService.socket) return;
    
    console.log('📌 Thiết lập listener cho ghim/bỏ ghim tin nhắn');
    
    const handleMessagePinned = (data) => {
      if (!data || !data.message || !data.conversation) {
        console.warn('⚠️ Nhận được dữ liệu không hợp lệ từ sự kiện message_pinned');
        return;
      }
      
      console.log(`📌 Tin nhắn đã được ghim: ${data.message._id}`);
      
      // Cập nhật tin nhắn trong danh sách tin nhắn hiện tại
      if (activeConversation && activeConversation._id === data.conversation.toString()) {
        // Update the messages array
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg._id === data.message._id ? {...msg, isPinned: true, pinnedBy: data.message.pinnedBy, pinnedAt: data.message.pinnedAt} : msg
          )
        );
        
        // Update the active conversation to reflect the pinned message
        // This is crucial for components like PinnedMessageBanner to update immediately
        setActiveConversation(prevConversation => ({
          ...prevConversation,
          pinnedMessages: prevConversation.pinnedMessages 
            ? [data.message, ...prevConversation.pinnedMessages]
            : [data.message]
        }));
        
        // Thêm thông báo hệ thống nếu có
        if (data.systemMessage) {
          // Kiểm tra xem thông báo này đã tồn tại chưa
          setMessages(prevMessages => {
            // Kiểm tra xem đã có thông báo tương tự chưa (trong khoảng 2 giây gần đây)
            const recentSystemMessage = prevMessages.find(msg => 
              msg.type === 'system' && 
              msg.systemType === 'pin_message' &&
              msg.createdAt && 
              (new Date().getTime() - new Date(msg.createdAt).getTime() < 2000)
            );
            
            // Nếu đã có thông báo tương tự, không thêm nữa
            if (recentSystemMessage) {
              return prevMessages;
            }
            
            // Nếu chưa có, thêm thông báo mới
            return [...prevMessages, data.systemMessage];
          });
          
          // Cuộn xuống tin nhắn mới
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    };
    
    const handleMessageUnpinned = (data) => {
      if (!data || !data.messageId || !data.conversation) {
        console.warn('⚠️ Nhận được dữ liệu không hợp lệ từ sự kiện message_unpinned');
        return;
      }
      
      console.log(`📌 Tin nhắn đã bỏ ghim: ${data.messageId}`);
      console.log('📌 Chi tiết data bỏ ghim:', JSON.stringify(data));
      
      // Cập nhật tin nhắn trong danh sách tin nhắn hiện tại
      if (activeConversation && activeConversation._id === data.conversation.toString()) {
        console.log('📌 Cập nhật trạng thái tin nhắn trong danh sách tin nhắn');
        // Update the messages array
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg._id === data.messageId ? {...msg, isPinned: false, pinnedBy: null, pinnedAt: null} : msg
          )
        );
        
        // Update the active conversation to reflect the unpinned message
        // This is crucial for components like PinnedMessageBanner to update immediately
        setActiveConversation(prevConversation => {
          console.log('📌 Cập nhật activeConversation.pinnedMessages');
          console.log('📌 Trước khi cập nhật:', prevConversation.pinnedMessages?.length || 0, 'tin nhắn đã ghim');
          
          if (prevConversation.pinnedMessages) {
            const updatedConversation = {
              ...prevConversation,
              pinnedMessages: prevConversation.pinnedMessages.filter(
                msg => msg._id !== data.messageId
              )
            };
            
            console.log('📌 Sau khi cập nhật:', updatedConversation.pinnedMessages?.length || 0, 'tin nhắn đã ghim');
            return updatedConversation;
          }
          return prevConversation;
        });
        
        // Thêm thông báo hệ thống nếu có
        if (data.systemMessage) {
          // Kiểm tra xem thông báo này đã tồn tại chưa
          setMessages(prevMessages => {
            // Kiểm tra xem đã có thông báo tương tự chưa (trong khoảng 2 giây gần đây)
            const recentSystemMessage = prevMessages.find(msg => 
              msg.type === 'system' && 
              msg.systemType === 'unpin_message' &&
              msg.createdAt && 
              (new Date().getTime() - new Date(msg.createdAt).getTime() < 2000)
            );
            
            // Nếu đã có thông báo tương tự, không thêm nữa
            if (recentSystemMessage) {
              return prevMessages;
            }
            
            // Cập nhật nội dung thông báo nếu hiển thị "ai đó"
            const updatedSystemMessage = {...data.systemMessage};
            if (updatedSystemMessage.content && updatedSystemMessage.content.includes('Ai đó')) {
              const currentUserName = user?.name || AuthService.getUserData()?.name || "Bạn";
              updatedSystemMessage.content = updatedSystemMessage.content.replace('Ai đó', currentUserName);
            }
            
            // Nếu chưa có, thêm thông báo mới
            return [...prevMessages, updatedSystemMessage];
          });
          
          // Cuộn xuống tin nhắn mới
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    };
    
    // Đăng ký event listener
    SocketService.onMessagePinned(handleMessagePinned);
    SocketService.onMessageUnpinned(handleMessageUnpinned);
    
    // Cleanup
    return () => {
      SocketService.removeListener('message_pinned');
      SocketService.removeListener('message_unpinned');
    };
  }, [activeConversation, user]);
  
  // Xử lý cập nhật danh sách cuộc trò chuyện khi có tin nhắn mới
  useEffect(() => {
    if (!SocketService.socket) return;
    
    console.log('🔄 Thiết lập listener cho cập nhật danh sách cuộc trò chuyện');
    
    const handleUpdateConversationList = (data) => {
      if (!data || !data.conversation) {
        console.warn('⚠️ Nhận được dữ liệu không hợp lệ từ sự kiện update_conversation_list');
        return;
      }
      
      console.log(`🔄 Cập nhật danh sách cuộc trò chuyện: ${data.conversation._id}, tin nhắn mới loại: ${data.newMessage?.type || 'không xác định'}`);
      
      // Cập nhật danh sách cuộc trò chuyện
      setConversations(prev => {
        // Tìm vị trí của cuộc trò chuyện trong danh sách hiện tại
        const index = prev.findIndex(conv => conv._id === data.conversation._id);
        
        // Nếu không tìm thấy, thêm cuộc trò chuyện mới vào đầu danh sách
        if (index === -1) {
          console.log('✨ Thêm cuộc trò chuyện mới vào đầu danh sách');
          return [data.conversation, ...prev];
        }
        
        // Tạo bản sao của mảng hiện tại
        const updatedConversations = [...prev];
        const existingConv = updatedConversations[index];
        
        // Luôn giữ nguyên thông tin members từ phiên bản cũ
        const updatedConversation = {
          ...data.conversation,
          members: existingConv.members || data.conversation.members,
          // Giữ nguyên các thông tin quan trọng khác
          admin: existingConv.admin || data.conversation.admin,
          admin2: existingConv.admin2 || data.conversation.admin2
        };
        
        // Nếu là chat đơn, giữ nguyên tên cuộc trò chuyện
        if (data.conversation.type === 'private') {
          updatedConversation.name = existingConv.name;
        }
        
        updatedConversations[index] = updatedConversation;
        
        // Đưa cuộc trò chuyện vừa cập nhật lên đầu danh sách
        console.log(`🔝 Đưa cuộc trò chuyện ${data.conversation._id} lên đầu danh sách`);
        const conversationToMove = updatedConversations.splice(index, 1)[0];
        
        return [conversationToMove, ...updatedConversations];
      });
      
      // Nếu đang ở trong cuộc trò chuyện này, cập nhật active conversation
      if (activeConversation && activeConversation._id === data.conversation._id) {
        // Luôn giữ nguyên thông tin members từ phiên bản cũ
        setActiveConversation(prev => ({
          ...prev,
          lastMessage: data.conversation.lastMessage,
          // Giữ nguyên các thông tin quan trọng
          members: prev.members || data.conversation.members,
          admin: prev.admin || data.conversation.admin,
          admin2: prev.admin2 || data.conversation.admin2,
          // Đối với chat đơn, giữ nguyên tên
          name: data.conversation.type === 'private' ? prev.name : data.conversation.name,
        }));
        
        console.log('🔄 Cập nhật activeConversation với tin nhắn mới nhưng giữ nguyên thông tin members');
      }
    };
    
    // Đăng ký event listener
    SocketService.onUpdateConversationList(handleUpdateConversationList);
    
    // Listen for avatar updates
    const handleAvatarUpdated = (event) => {
      setUser(prevUser => ({
        ...prevUser,
        avatar: event.detail.avatar
      }));
    };
    
    // Listen for socket avatar updates from other users
    const handleSocketAvatarUpdated = (data) => {
      console.log('👤 Nhận được cập nhật avatar từ user khác:', data.userId);
      
      // Skip if it's our own update (already handled by custom event)
      if (data.userId === userId) return;
      
      // Update avatar in conversations list for this user
      setConversations(prev => 
        prev.map(conv => {
          // Process both private conversations and group conversations
          // For private chats: Update if the other participant is the user who changed their avatar
          if (conv.type === 'private') {
            const updatedMembers = conv.members?.map(member => {
              if (member.idUser && 
                  ((typeof member.idUser === 'object' && member.idUser._id === data.userId) || 
                   member.idUser === data.userId)) {
                // Update this member's avatar
                return {
                  ...member,
                  idUser: typeof member.idUser === 'object' 
                    ? { ...member.idUser, avatar: data.avatarUrl }
                    : member.idUser
                };
              }
              return member;
            });
            
            if (updatedMembers) {
              return { ...conv, members: updatedMembers };
            }
          }
          // For group chats: Update the avatar of any member who matches the updated user
          else if (conv.type === 'group' && conv.members) {
            const updatedMembers = conv.members.map(member => {
              if (member.idUser && 
                  ((typeof member.idUser === 'object' && member.idUser._id === data.userId) || 
                   member.idUser === data.userId)) {
                // Update this member's avatar
                return {
                  ...member,
                  idUser: typeof member.idUser === 'object' 
                    ? { ...member.idUser, avatar: data.avatarUrl }
                    : member.idUser
                };
              }
              return member;
            });
            
            // Also update admin/admin2 avatar if they match the updated user
            let updatedConv = { ...conv, members: updatedMembers };
            
            // Update admin avatar if needed
            if (updatedConv.admin && 
                ((typeof updatedConv.admin === 'object' && updatedConv.admin._id === data.userId) ||
                 updatedConv.admin === data.userId)) {
              updatedConv.admin = typeof updatedConv.admin === 'object'
                ? { ...updatedConv.admin, avatar: data.avatarUrl }
                : updatedConv.admin;
            }
            
            // Update admin2 avatar if needed
            if (updatedConv.admin2 && 
                ((typeof updatedConv.admin2 === 'object' && updatedConv.admin2._id === data.userId) ||
                 updatedConv.admin2 === data.userId)) {
              updatedConv.admin2 = typeof updatedConv.admin2 === 'object'
                ? { ...updatedConv.admin2, avatar: data.avatarUrl }
                : updatedConv.admin2;
            }
            
            return updatedConv;
          }
          
          return conv;
        })
      );
      
      // Also update the active conversation if it contains the updated user
      if (activeConversation) {
        setActiveConversation(prev => {
          // Skip if not valid conversation
          if (!prev || !prev.members) return prev;
          
          // Create a copy of the conversation
          let updatedConversation = { ...prev };
          
          // Update members avatars
          if (updatedConversation.members) {
            updatedConversation.members = updatedConversation.members.map(member => {
              if (member.idUser && 
                  ((typeof member.idUser === 'object' && member.idUser._id === data.userId) || 
                   member.idUser === data.userId)) {
                // Update this member's avatar
                return {
                  ...member,
                  idUser: typeof member.idUser === 'object' 
                    ? { ...member.idUser, avatar: data.avatarUrl }
                    : member.idUser
                };
              }
              return member;
            });
          }
          
          // For group conversations, also update admin/admin2 if needed
          if (updatedConversation.type === 'group') {
            // Update admin avatar if needed
            if (updatedConversation.admin && 
                ((typeof updatedConversation.admin === 'object' && updatedConversation.admin._id === data.userId) ||
                 updatedConversation.admin === data.userId)) {
              updatedConversation.admin = typeof updatedConversation.admin === 'object'
                ? { ...updatedConversation.admin, avatar: data.avatarUrl }
                : updatedConversation.admin;
            }
            
            // Update admin2 avatar if needed
            if (updatedConversation.admin2 && 
                ((typeof updatedConversation.admin2 === 'object' && updatedConversation.admin2._id === data.userId) ||
                 updatedConversation.admin2 === data.userId)) {
              updatedConversation.admin2 = typeof updatedConversation.admin2 === 'object'
                ? { ...updatedConversation.admin2, avatar: data.avatarUrl }
                : updatedConversation.admin2;
            }
          }
          
          return updatedConversation;
        });
      }
      
      // Also update other UI elements displaying user avatars if needed
      // For example, avatars in message bubbles
      setMessages(prev => {
        return prev.map(message => {
          // Check if this message is from the user who updated their avatar
          if (message.originalSender && 
              ((typeof message.sender === 'object' && message.sender._id === data.userId) ||
               message.sender === data.userId)) {
            
            return {
              ...message,
              originalSender: {
                ...message.originalSender,
                avatar: data.avatarUrl
              }
            };
          }
          return message;
        });
      });
    };
    
    // Add event listener for avatar updates
    window.addEventListener('user-avatar-updated', handleAvatarUpdated);
    
    // Register socket listener for avatar updates from other users
    SocketService.onAvatarUpdated(handleSocketAvatarUpdated);
    
    // Cleanup
    return () => {
      SocketService.removeListener('update_conversation_list');
      window.removeEventListener('user-avatar-updated', handleAvatarUpdated);
      SocketService.removeListener('avatar_updated');
    };
  }, [activeConversation]);

  // Hàm xử lý khi nhập tin nhắn (để gửi trạng thái typing)
  const handleMessageTyping = (e) => {
    const input = e.target.value;
    setNewMessage(input);
    
    // Chỉ gửi sự kiện typing nếu đang trong một cuộc trò chuyện
    if (!activeConversation?._id) return;
    
    // Kiểm tra nếu người dùng đang gõ @
    if (input.endsWith('@') || (input.includes('@') && input.lastIndexOf('@') === input.length - 1)) {
      // Hiển thị gợi ý @AIGemini
      setShowAIMention(true);
      
      // Tính toán vị trí hiển thị gợi ý
      if (inputRef.current) {
        const inputRect = inputRef.current.getBoundingClientRect();
        setMentionPosition({
          top: inputRect.top - 40, // Hiển thị phía trên input
          left: inputRect.left
        });
      }
    } else {
      // Ẩn gợi ý nếu không gõ @
      setShowAIMention(false);
    }
    
    // Thiết lập is typing
    const isNowTyping = input.length > 0;
    
    // Sử dụng debounce để giảm số lượng sự kiện gửi đi
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Kiểm tra nếu đã gửi sự kiện gần đây, không gửi nữa
    const now = Date.now();
    const canSendTypingEvent = now - typingLastSentRef.current > typingMinInterval;
    
    if (isNowTyping) {
      // Nếu đang typing và chưa gửi event hoặc đã quá thời gian debounce
      if (canSendTypingEvent && !isTyping) {
        // Gửi trạng thái typing và cập nhật timestamp
        console.log('⌨️ Gửi trạng thái typing');
        SocketService.sendTypingStatus(activeConversation._id, userId);
        typingLastSentRef.current = now;
        setIsTyping(true);
      }
      
      // Đặt timeout để gửi stop_typing sau một khoảng thời gian không đánh
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          console.log('⌨️ Gửi trạng thái stop_typing sau thời gian không đánh');
          SocketService.sendStopTypingStatus(activeConversation._id, userId);
          setIsTyping(false);
        }
      }, 3000);
    } else if (isTyping) {
      // Nếu không còn đang nhập mà trước đó đang typing
      console.log('⌨️ Gửi trạng thái stop_typing vì không còn nhập');
      SocketService.sendStopTypingStatus(activeConversation._id, userId);
      setIsTyping(false);
    }
    
    // Lưu nháp tin nhắn vào localStorage
    if (activeConversation?._id) {
      const key = `draft-${activeConversation._id}`;
      if (input.trim()) {
        localStorage.setItem(key, input);
      } else {
        localStorage.removeItem(key);
      }
    }
  };

  // Thêm CSS cho hiệu ứng typing
  const typingAnimationStyle = `
    .typing-animation {
      display: inline-flex;
      align-items: center;
      margin-left: 8px;
    }
    
    .typing-animation .dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      margin-right: 3px;
      background: #aaa;
      animation: typing-dot 1.4s infinite ease-in-out both;
    }
    
    .typing-animation .dot:nth-child(1) {
      animation-delay: -0.32s;
    }
    
    .typing-animation .dot:nth-child(2) {
      animation-delay: -0.16s;
    }
    
    @keyframes typing-dot {
      0%, 80%, 100% { 
        transform: scale(0);
      }
      40% { 
        transform: scale(1);
      }
    }
  `;

  // Thêm style vào head
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = typingAnimationStyle;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Thêm event listeners cho thu hồi và xoá tin nhắn
  useEffect(() => {
    // ... existing socket event bindings ...
    
    const handleMessageRevoked = (data) => {
      console.log('📝 Tin nhắn đã bị thu hồi:', data);
      const { messageId, conversationId, type } = data;
      
      // Chỉ xử lý nếu messageId và conversationId đúng với cuộc trò chuyện hiện tại
      if (conversationId === activeConversation?._id) {
        setMessages(prevMessages => 
          prevMessages.map(msg => {
            if (msg._id === messageId) {
              console.log('🔄 Đánh dấu tin nhắn đã thu hồi:', 
                { id: messageId, type: type || msg.type || 'text' });
              
                  return {
                ...msg, 
                isRevoked: true,
                // Giữ lại loại tin nhắn để hiển thị thông báo thu hồi phù hợp
                type: type || msg.type || 'text',
                // Giữ lại các thuộc tính quan trọng khác
                fileUrl: msg.fileUrl, // Giữ lại để nhận biết đây là tin nhắn ảnh/file
                fileName: msg.fileName
              };
            }
            return msg;
          })
        );
      }
    };
    
    const handleMessageDeleted = (data) => {
      console.log('🗑️ Tin nhắn đã bị xoá:', data);
      const { messageId, conversationId, forUser } = data;
      
      // Chỉ xử lý nếu tin nhắn thuộc cuộc trò chuyện hiện tại và dành cho người dùng hiện tại
      if (conversationId === activeConversation?._id && forUser === userId) {
        // Xóa tin nhắn khỏi danh sách hiển thị
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg._id !== messageId)
        );
      }
    };
    
    // Đăng ký lắng nghe sự kiện thu hồi và xoá tin nhắn
    SocketService.onMessageRevoked(handleMessageRevoked);
    SocketService.onMessageDeleted(handleMessageDeleted);
    
    return () => {
      // ... existing cleanup ...
      SocketService.removeListener('message_revoked');
      SocketService.removeListener('message_deleted');
    };
  }, [activeConversation]);
  
  // Xử lý hiển thị menu ngữ cảnh cho tin nhắn
  const handleMessageContextMenu = (event, message) => {
    // Cho phép hiển thị menu cho tất cả tin nhắn (cả của mình và người khác)
    event.preventDefault();
    event.stopPropagation();
    setMessageContextMenu(event.currentTarget);
    setSelectedMessage(message);
  };
  
  // Đóng menu ngữ cảnh tin nhắn
  const handleMessageContextMenuClose = () => {
    setMessageContextMenu(null);
    setSelectedMessage(null);
  };
  
  // Xử lý chuyển tiếp tin nhắn
  const handleForwardMessage = () => {
    setForwardDialogOpen(true);
    setMessageContextMenu(null);
  };
  
  // Xử lý đóng dialog chuyển tiếp tin nhắn
  const handleCloseForwardDialog = () => {
    setForwardDialogOpen(false);
    setTargetConversation(null);
    setSelectedMessage(null);
  };

  // Group chat handlers
  const handleCreateGroup = () => {
    setCreateGroupDialogOpen(true);
    handleMenuClose();
  };

  const handleGroupCreated = (newConversation) => {
    console.log('🔄 Xử lý nhóm mới được tạo:', newConversation._id);
    
    // Đánh dấu nhóm đã được thêm để tránh thêm lại từ socket event
    window.addedGroupIds = window.addedGroupIds || new Set();
    window.addedGroupIds.add(newConversation._id);
    
    // Thiết lập timeout để xóa ID sau 10 giây
    setTimeout(() => {
      if (window.addedGroupIds && window.addedGroupIds.has(newConversation._id)) {
        window.addedGroupIds.delete(newConversation._id);
        console.log('🔄 Đã xóa ID nhóm khỏi danh sách theo dõi:', newConversation._id);
      }
    }, 10000);
    
    // Thêm nhóm mới vào danh sách cuộc trò chuyện
    setConversations(prev => {
      // Kiểm tra xem đã tồn tại chưa
      const exists = prev.some(conv => conv._id === newConversation._id);
      if (exists) {
        console.log('🔄 Nhóm đã tồn tại trong danh sách, không thêm lại');
        return prev;
      }
      console.log('🔄 Thêm nhóm mới vào đầu danh sách cuộc trò chuyện');
      return [newConversation, ...prev];
    });
    
    // Select the new conversation
    handleConversationSelect(newConversation);
    
    // Close the dialog
    setCreateGroupDialogOpen(false);
  };

  const handleOpenGroupMembers = () => {
    if (activeConversation && activeConversation.type === 'group') {
      // Log các thông tin quan trọng để debug
      console.log('Current active conversation:', activeConversation);
      
      const adminId = activeConversation.admin?._id || activeConversation.admin || 
                     localStorage.getItem(`adminId_${activeConversation._id}`) || 
                     localStorage.getItem('adminId');
      const admin2Id = activeConversation.admin2?._id || activeConversation.admin2 || 
                     localStorage.getItem(`admin2Id_${activeConversation._id}`) || 
                     localStorage.getItem('admin2Id');
                     
      console.log('Admin check - Current user:', userId);
      console.log('Admin check - Admin ID:', adminId);
      console.log('Admin check - Admin2 ID:', admin2Id);
      
      setGroupMembersDialogOpen(true);
      handleMenuClose();
    }
  };

  const handleEditGroup = () => {
    if (activeConversation && activeConversation.type === 'group') {
      // Kiểm tra quyền admin trước khi mở dialog chỉnh sửa nhóm
      if (isGroupAdmin(activeConversation) || isGroupAdmin2(activeConversation)) {
        setEditGroupDialogOpen(true);
        handleMenuClose();
      } else {
        Alert.alert("Thông báo", "Bạn không có quyền chỉnh sửa nhóm này");
      }
    }
  };

  const handleGroupUpdated = (updatedConversation) => {
    console.log('🔄 Group updated:', updatedConversation);
    console.log('Admin:', updatedConversation.admin);
    console.log('Admin2:', updatedConversation.admin2);

    // Lưu thông tin admin vào localStorage khi nhóm được cập nhật
    if (updatedConversation.type === 'group') {
      if (updatedConversation.admin) {
        const adminId = updatedConversation.admin._id || updatedConversation.admin;
        localStorage.setItem(`adminId_${updatedConversation._id}`, adminId);
        localStorage.setItem('adminId', adminId);
        console.log('📝 Stored admin ID in localStorage:', adminId);
      }
      
      if (updatedConversation.admin2) {
        const admin2Id = updatedConversation.admin2._id || updatedConversation.admin2;
        localStorage.setItem(`admin2Id_${updatedConversation._id}`, admin2Id);
        localStorage.setItem('admin2Id', admin2Id);
        console.log('📝 Stored admin2 ID in localStorage:', admin2Id);
      }
    }
    
    // Update the conversation in the list
    setConversations(prev => 
      prev.map(conv => 
        conv._id === updatedConversation._id ? updatedConversation : conv
      )
    );
    
    // Update active conversation if it's the one that was updated
    if (activeConversation && activeConversation._id === updatedConversation._id) {
      setActiveConversation(updatedConversation);
    }
    
    // Close any open dialogs
    setEditGroupDialogOpen(false);
  };

  const handleMemberAdded = (updatedConversation) => {
    console.log('👤 Member added to group:', updatedConversation);
    console.log('Admin:', updatedConversation.admin);
    console.log('Admin2:', updatedConversation.admin2);
    
    // Lưu thông tin admin vào localStorage
    if (updatedConversation.type === 'group') {
      if (updatedConversation.admin) {
        const adminId = updatedConversation.admin._id || updatedConversation.admin;
        localStorage.setItem(`adminId_${updatedConversation._id}`, adminId);
        localStorage.setItem('adminId', adminId);
      }
      
      if (updatedConversation.admin2) {
        const admin2Id = updatedConversation.admin2._id || updatedConversation.admin2;
        localStorage.setItem(`admin2Id_${updatedConversation._id}`, admin2Id);
        localStorage.setItem('admin2Id', admin2Id);
      }
    }
    
    // Update conversation in list
    setConversations(prev =>
      prev.map(conv =>
        conv._id === updatedConversation._id ? updatedConversation : conv
      )
    );

    // Update active conversation if it's the one that was updated
    if (activeConversation && activeConversation._id === updatedConversation._id) {
      setActiveConversation(updatedConversation);
    }

    // Add system message about new member
    const systemMessage = {
      type: 'system',
      systemType: 'member_added',
      content: `${updatedConversation.lastMessage.content}`,
      conversationId: updatedConversation._id,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, systemMessage]);
  };

  const handleMemberRemoved = (updatedConversation) => {
    console.log('👤 Member removed from group:', updatedConversation);
    console.log('Admin:', updatedConversation.admin);
    console.log('Admin2:', updatedConversation.admin2);
    
    // Lưu thông tin admin vào localStorage
    if (updatedConversation.type === 'group') {
      if (updatedConversation.admin) {
        const adminId = updatedConversation.admin._id || updatedConversation.admin;
        localStorage.setItem(`adminId_${updatedConversation._id}`, adminId);
        localStorage.setItem('adminId', adminId);
      }
      
      if (updatedConversation.admin2) {
        const admin2Id = updatedConversation.admin2._id || updatedConversation.admin2;
        localStorage.setItem(`admin2Id_${updatedConversation._id}`, admin2Id);
        localStorage.setItem('admin2Id', admin2Id);
      } else {
        // Nếu không có admin2, xóa khỏi localStorage
        localStorage.removeItem(`admin2Id_${updatedConversation._id}`);
        localStorage.removeItem('admin2Id');
      }
    }
    
    // Update conversation in list
    setConversations(prev =>
      prev.map(conv =>
        conv._id === updatedConversation._id ? updatedConversation : conv
      )
    );

    // Update active conversation if it's the one that was updated
    if (activeConversation && activeConversation._id === updatedConversation._id) {
      setActiveConversation(updatedConversation);
    }

    // Determine appropriate content for system message
    let messageContent = 'Một thành viên đã bị xóa khỏi nhóm';
    
    // Only try to access lastMessage.content if it exists
    if (updatedConversation.lastMessage && updatedConversation.lastMessage.content) {
      messageContent = updatedConversation.lastMessage.content;
    }

    // Add system message about member removal
    const systemMessage = {
      type: 'system',
      systemType: 'member_removed',
      content: messageContent,
      conversationId: updatedConversation._id,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, systemMessage]);
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      await ChatService.leaveGroup(groupId);
      
      // Remove the group from conversations list
      setConversations(prev => prev.filter(conv => conv._id !== groupId));
      
      // If active conversation is the one we're leaving, clear it
      if (activeConversation && activeConversation._id === groupId) {
        setActiveConversation(null);
      }
      
      // Close the dialog
      setGroupMembersDialogOpen(false);
    } catch (error) {
      console.error('Error leaving group:', error);
      Alert.alert('Lỗi', 'Không thể rời nhóm chat');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await ChatService.deleteGroup(groupId);
      
      // Remove the group from conversations list
      setConversations(prev => prev.filter(conv => conv._id !== groupId));
      
      // If active conversation is the one we're deleting, clear it
      if (activeConversation && activeConversation._id === groupId) {
        setActiveConversation(null);
      }
      
      // Close the dialog
      setGroupMembersDialogOpen(false);
    } catch (error) {
      console.error('Error deleting group:', error);
      Alert.alert('Error', 'Failed to delete group chat');
    }
  };



  const handleGroupLeft = (conversationId) => {
    // Remove conversation from list
    setConversations(prev =>
      prev.filter(conv => conv._id !== conversationId)
    );

    // Clear active conversation if it's the one that was left
    if (activeConversation && activeConversation._id === conversationId) {
      setActiveConversation(null);
      setMessages([]);
    }

    // Add system message about leaving group
    const systemMessage = {
      type: 'system',
      systemType: 'group_left',
      content: 'Bạn đã rời khỏi nhóm',
      conversationId: conversationId,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, systemMessage]);
    
    // Close the dialog
    setGroupMembersDialogOpen(false);
  };

  const handleGroupDeleted = (conversationId) => {
    // Remove conversation from list
    setConversations(prev =>
      prev.filter(conv => conv._id !== conversationId)
    );

    // Clear active conversation if it's the one that was deleted
    if (activeConversation && activeConversation._id === conversationId) {
      setActiveConversation(null);
      setMessages([]);
    }

    // Add system message about group deletion
    const systemMessage = {
      type: 'system',
      systemType: 'group_deleted',
      content: 'Nhóm đã bị xóa',
      conversationId: conversationId,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, systemMessage]);
    
    // Close the dialog
    setGroupMembersDialogOpen(false);
  };

  // Xử lý chọn cuộc trò chuyện để chuyển tiếp tin nhắn
  const handleSelectForwardConversation = (conversation) => {
    setTargetConversation(conversation);
  };
  
  // Xử lý xác nhận chuyển tiếp tin nhắn
  const handleConfirmForward = async () => {
    if (!selectedMessage || !targetConversation) return;
    
    try {
      // Lấy token từ AuthService thay vì sử dụng hàm getToken không tồn tại
      const userData = AuthService.getUserData();
      const token = userData?.token;
      
      // Sử dụng Socket để chuyển tiếp tin nhắn
      SocketService.forwardMessage(
        selectedMessage._id,
        targetConversation._id,
        userId
      );
      
      // Đóng dialog
      setForwardDialogOpen(false);
      setTargetConversation(null);
    } catch (error) {
      console.error("Error forwarding message:", error);
      Alert.alert("Lỗi", "Không thể chuyển tiếp tin nhắn");
    }
  };
  
  // Xử lý khi chuyển tiếp tin nhắn thành công
  const handleForwardMessageSuccess = (message) => {
    console.log("✅ Tin nhắn chuyển tiếp thành công:", message);
    Alert.alert("Thành công", "Tin nhắn đã được chuyển tiếp");
    
    // Chỉ cập nhật giao diện nếu đang ở trong cuộc trò chuyện đích
    if (activeConversation && activeConversation._id.toString() === message.idConversation.toString()) {
      console.log("📝 Đang hiển thị tin nhắn chuyển tiếp trong cuộc trò chuyện hiện tại");
      setMessages(prevMessages => [...prevMessages, message]);
      
      // Cuộn xuống tin nhắn mới nhất
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      console.log("ℹ️ Không hiển thị tin nhắn chuyển tiếp vì không ở trong cuộc trò chuyện đích");
    }
  };
  
  // Xử lý khi chuyển tiếp tin nhắn gặp lỗi
  const handleForwardMessageError = (error) => {
    console.error("Forward message error:", error);
    Alert.alert("Lỗi", error.error || "Không thể chuyển tiếp tin nhắn");
  };
  
  // Đăng ký các sự kiện socket cho chức năng chuyển tiếp tin nhắn
  useEffect(() => {
    // Đăng ký sự kiện khi chuyển tiếp tin nhắn thành công
    SocketService.onForwardMessageSuccess(handleForwardMessageSuccess);
    
    // Đăng ký sự kiện khi chuyển tiếp tin nhắn gặp lỗi
    SocketService.onForwardMessageError(handleForwardMessageError);
    
    // Dọn dẹp khi component bị huỷ
    return () => {
      SocketService.removeListener('forward_message_success');
      SocketService.removeListener('forward_message_error');
    };
  }, []);
  
  // Thu hồi tin nhắn
  const handleRevokeMessage = async () => {
    if (!selectedMessage || !activeConversation) {
      handleMessageContextMenuClose();
      return;
    }
    
    // Đóng menu trước tiên để tránh vấn đề focus
    handleMessageContextMenuClose();
    
    try {
      // Lấy token
      const token = AuthService.getAccessToken();
      if (!token) {
        console.error('No access token found');
        Alert.alert("Error", "You are not authenticated");
        return;
      }
      
      // Ghi nhận loại tin nhắn trước khi thu hồi
      const messageType = selectedMessage.type || 'text';
      console.log('📝 Đang thu hồi tin nhắn loại:', messageType);
      
      // Gọi API thu hồi tin nhắn
      const response = await fetch(`http://localhost:4000/chat/message/revoke/${selectedMessage._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Cập nhật tin nhắn trong state
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg._id === selectedMessage._id ? { 
              ...msg, 
              isRevoked: true,
              // Giữ nguyên type để hiển thị thông báo thu hồi đúng
              type: messageType,
              // Giữ lại thông tin file nếu có
              fileUrl: msg.fileUrl,
              fileName: msg.fileName
            } : msg
          )
        );
        
        // Thông báo cho người dùng khác qua socket
        SocketService.revokeMessage(
          selectedMessage._id, 
          activeConversation._id, 
          userId
        );
      } else {
        console.error('Failed to revoke message');
        Alert.alert("Error", "Failed to revoke message");
      }
    } catch (error) {
      console.error('Error revoking message:', error);
      Alert.alert("Error", "An error occurred while revoking the message");
    }
  };
  
  // Xoá tin nhắn
  const handleDeleteMessage = async () => {
    if (!selectedMessage || !activeConversation) {
      handleMessageContextMenuClose();
      return;
    }
    
    // Đóng menu trước tiên để tránh vấn đề focus
    handleMessageContextMenuClose();
    
    try {
      // Lấy token
      const token = AuthService.getAccessToken();
      if (!token) {
        console.error('No access token found');
        Alert.alert("Error", "You are not authenticated");
        return;
      }
      
      // Gọi API xoá tin nhắn - Chỉ ở phía người dùng hiện tại
      const response = await fetch(`http://localhost:4000/chat/message/delete/${selectedMessage._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Xóa tin nhắn khỏi giao diện của người dùng hiện tại
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg._id !== selectedMessage._id)
        );
        
        // Thông báo cho người dùng khác qua socket
        SocketService.deleteMessage(
          selectedMessage._id, 
          activeConversation._id, 
          userId
        );
      } else {
        console.error('Failed to delete message');
        Alert.alert("Error", "Failed to delete message");
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert("Error", "An error occurred while deleting the message");
    }
  };

  // Cập nhật hàm mở file
  const handleOpenFile = async (fileUrl, fileName, fileType) => {
    if (!fileUrl) {
      Alert.alert("Lỗi", "Không tìm thấy đường dẫn file.");
      return;
    }

    // Kiểm tra nếu là file tạm thời, thì hiển thị thông báo
    if (fileUrl.startsWith('temp_file_')) {
      Alert.alert("Thông báo", "File đang được tải lên máy chủ. Vui lòng đợi trong giây lát.");
      return;
    }

    console.log("🔗 Mở file:", fileUrl);
    console.log("📄 Tên file:", fileName);
    console.log("📦 Loại file:", fileType);
    
    // Xác định loại file từ tham số hoặc phân tích từ fileName
    const getFileType = () => {
      // Nếu đã có type được truyền vào
      if (fileType && (fileType.includes('pdf') || fileType.includes('image') || 
          fileType.includes('video') || fileType.includes('audio'))) {
        if (fileType.includes('pdf')) return 'pdf';
        if (fileType.includes('image')) return 'image';
        if (fileType.includes('video')) return 'video';
        if (fileType.includes('audio')) return 'audio';
      }
      
      // Phân tích từ fileName
      if (fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        if (['pdf'].includes(extension)) return 'pdf';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image';
        if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(extension)) return 'video';
        if (['mp3', 'wav', 'm4a'].includes(extension)) return 'audio';
        if (['doc', 'docx'].includes(extension)) return 'doc';
        if (['xls', 'xlsx'].includes(extension)) return 'excel';
        if (['ppt', 'pptx'].includes(extension)) return 'presentation';
      }
      
      return 'file';
    };
    
    const type = getFileType();
    
    try {
      // Đảm bảo fileUrl là URL đầy đủ
      const url = fileUrl.startsWith('http') 
        ? fileUrl 
        : `http://localhost:4000${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
  
      console.log('🌐 URL hoàn chỉnh:', url);
      
      // Mở file trực tiếp mà không cần kiểm tra
      if (['image', 'pdf', 'video', 'audio'].includes(type)) {
        // Với hình ảnh, PDF và video, trực tiếp mở URL
        window.open(url, '_blank');
      } else {
        // Với các file khác, chỉ cần tải xuống
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || 'download'; // Đặt tên file khi tải xuống
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("❌ Lỗi khi mở file:", error);
      Alert.alert(
        "Không thể mở file", 
        "Có lỗi xảy ra khi mở file. Thử tải xuống thay thế.",
        [
          {
            text: "Tải xuống",
            onPress: () => {
              try {
                const downloadUrl = fileUrl.startsWith('http') 
                  ? fileUrl 
                  : `http://localhost:4000${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
                
                const downloadLink = document.createElement('a');
                downloadLink.href = downloadUrl;
                downloadLink.setAttribute('download', fileName || 'download');
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
              } catch (err) {
                console.error('Lỗi khi tải xuống:', err);
                Alert.alert('Lỗi', 'Không thể tải xuống file');
              }
            }
          },
          {
            text: "Hủy",
            style: "cancel"
          }
        ]
      );
    }
  };

  // Xử lý thêm cảm xúc vào tin nhắn
  const handleAddReaction = async (messageId, emoji) => {
    if (!messageId || !userId || !activeConversation) return;
    
    try {
      const token = AuthService.getAccessToken();
      if (!token) {
        console.error('No access token found');
        Alert.alert("Error", "You are not authenticated");
        return;
      }
      
      // Kiểm tra tin nhắn có reaction từ user này chưa
      const message = messages.find(msg => msg._id === messageId);
      if (!message) return;
      
      // Kiểm tra nếu user đã thả cảm xúc này, thì xóa đi
      if (message.reactions && 
          message.reactions[emoji] && 
          message.reactions[emoji].includes(userId)) {
        // Xóa cảm xúc
        await handleRemoveReaction(messageId, emoji);
        return;
      }
      
      // Cập nhật UI tạm thời trước
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg._id === messageId) {
            // Tạo bản sao của reactions hoặc object mới nếu chưa có
            const updatedReactions = { ...(msg.reactions || {}) };
            
            // Cập nhật hoặc tạo mới danh sách người dùng cho emoji này
            if (updatedReactions[emoji]) {
              // Nếu đã có danh sách cho emoji này, thêm userId vào
              if (!updatedReactions[emoji].includes(userId)) {
                updatedReactions[emoji] = [...updatedReactions[emoji], userId];
              }
            } else {
              // Tạo mới danh sách cho emoji này
              updatedReactions[emoji] = [userId];
            }
            
            return {
              ...msg,
              reactions: updatedReactions
            };
          }
          return msg;
        })
      );
      
      // Gửi yêu cầu qua socket để thông báo cho các người dùng khác
      SocketService.addReaction(messageId, activeConversation._id, userId, emoji);
      
      // Đồng bộ với server qua API
      await ChatService.addReaction(messageId, userId, emoji, token);
      
    } catch (error) {
      console.error('Error adding reaction:', error);
      Alert.alert("Error", "Failed to add reaction");
    }
  };
  
  // Xử lý xóa cảm xúc khỏi tin nhắn
  const handleRemoveReaction = async (messageId, emoji) => {
    if (!messageId || !userId || !activeConversation) return;
    
    try {
      const token = AuthService.getAccessToken();
      if (!token) {
        console.error('No access token found');
        Alert.alert("Error", "You are not authenticated");
        return;
      }
      
      // Cập nhật UI tạm thời trước
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg._id === messageId && msg.reactions && msg.reactions[emoji]) {
            // Tạo bản sao của reactions
            const updatedReactions = { ...msg.reactions };
            
            // Xóa userId khỏi danh sách người dùng cho emoji này
            updatedReactions[emoji] = updatedReactions[emoji].filter(id => id !== userId);
            
            // Nếu không còn ai thả emoji này, xóa khỏi danh sách
            if (updatedReactions[emoji].length === 0) {
              delete updatedReactions[emoji];
            }
            
                  return {
              ...msg,
              reactions: updatedReactions
            };
          }
          return msg;
        })
      );
      
      // Gửi yêu cầu qua socket để thông báo cho các người dùng khác
      SocketService.removeReaction(messageId, activeConversation._id, userId, emoji);
      
      // Đồng bộ với server qua API
      await ChatService.removeReaction(messageId, userId, emoji, token);
      
    } catch (error) {
      console.error('Error removing reaction:', error);
      Alert.alert("Error", "Failed to remove reaction");
    }
  };

  // Thêm event listener cho việc cập nhật cảm xúc
  useEffect(() => {
    if (!SocketService.socket) return;
    
    console.log('👍 Thiết lập listener cho cảm xúc tin nhắn');
    
    const handleMessageReaction = (data) => {
      const { messageId, emoji, userId: reactUserId, action } = data;
      
      console.log(`👍 Nhận phản hồi cảm xúc: ${emoji} từ ${reactUserId} cho tin nhắn ${messageId}`);
      
      if (!messageId || !emoji || !reactUserId) return;
      
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg._id === messageId) {
            // Tạo bản sao của reactions hoặc object mới nếu chưa có
            const updatedReactions = { ...(msg.reactions || {}) };
            
            if (action === 'add') {
              // Thêm cảm xúc
              if (updatedReactions[emoji]) {
                if (!updatedReactions[emoji].includes(reactUserId)) {
                  updatedReactions[emoji] = [...updatedReactions[emoji], reactUserId];
                }
              } else {
                updatedReactions[emoji] = [reactUserId];
              }
            } else if (action === 'remove') {
              // Xóa cảm xúc
              if (updatedReactions[emoji]) {
                updatedReactions[emoji] = updatedReactions[emoji].filter(id => id !== reactUserId);
                
                if (updatedReactions[emoji].length === 0) {
                  delete updatedReactions[emoji];
                }
              }
            }
            
            return {
              ...msg,
              reactions: updatedReactions
            };
          }
          return msg;
        })
      );
    };
    
    // Đăng ký event listener
    SocketService.onMessageReaction(handleMessageReaction);
    
    // Cleanup
    return () => {
      SocketService.removeListener('message_reaction');
    };
  }, []);

  const handleAvatarClick = (user) => {
    setSelectedUser(user);
    setProfileDialogOpen(true);
  };

  const handleCloseProfileDialog = () => {
    setProfileDialogOpen(false);
    setSelectedUser(null);
  };

  // Xử lý trạng thái online/offline của người dùng
  useEffect(() => {
    if (!SocketService.socket) return;
    
    console.log('🟢 Thiết lập listener cho trạng thái online/offline');
    
    // Map để lưu trạng thái online của các user
    const onlineStatusMap = new Map();
    
    // Tạo Set để theo dõi người dùng đã báo cáo nếu chưa tồn tại
    if (!reportedUsers.current) {
      reportedUsers.current = new Set();
    }
    
    const handleUserOnline = (userId) => {
      // Tránh xử lý cùng một userId nhiều lần - ngăn vòng lặp vô hạn
      if (reportedUsers.current.has(userId)) {
        console.log('⚠️ Bỏ qua sự kiện user_online trùng lặp cho:', userId);
        return;
      }
      
      console.log('🟢 Người dùng online:', userId);
      reportedUsers.current.add(userId);
      
      // Cập nhật trạng thái online trong state
      onlineStatusMap.set(userId, true);
      
      // Cập nhật danh sách cuộc trò chuyện để hiển thị trạng thái online
      setConversations(prev => prev.map(conv => {
        // Với cuộc trò chuyện nhóm, không cập nhật trạng thái online
        if (conv.type === 'group') return conv;
        
        // Với cuộc trò chuyện 1-1, kiểm tra người dùng
        const otherUser = conv.members?.find(
          m => m.idUser && (
            (m.idUser._id && m.idUser._id.toString() === userId.toString()) ||
            (typeof m.idUser === 'string' && m.idUser.toString() === userId.toString())
          )
        )?.idUser;
        
        if (otherUser) {
          return {
            ...conv,
            isOnline: true,
            lastSeen: new Date()
          };
        }
        
        return conv;
      }));
      
      // Sau 10 phút, xóa khỏi danh sách reported để cho phép nhận lại thông báo online
      setTimeout(() => {
        if (reportedUsers.current) {
          reportedUsers.current.delete(userId);
          console.log('🕒 Đã xóa user khỏi danh sách reported sau 10 phút:', userId);
        }
      }, 10 * 60 * 1000); // 10 phút
    };
    
    const handleUserOffline = (userId) => {
      console.log('🔴 Người dùng offline:', userId);
      
      // Xóa khỏi danh sách đã report để cho phép báo online lần sau
      reportedUsers.current.delete(userId);
      
      // Cập nhật trạng thái offline trong state
      onlineStatusMap.set(userId, false);
      
      // Cập nhật danh sách cuộc trò chuyện để hiển thị trạng thái offline
      setConversations(prev => prev.map(conv => {
        // Với cuộc trò chuyện nhóm, không cập nhật trạng thái online
        if (conv.type === 'group') return conv;
        
        // Với cuộc trò chuyện 1-1, kiểm tra người dùng
        const otherUser = conv.members?.find(
          m => m.idUser && (
            (m.idUser._id && m.idUser._id.toString() === userId.toString()) ||
            (typeof m.idUser === 'string' && m.idUser.toString() === userId.toString())
          )
        )?.idUser;
        
        if (otherUser) {
          return {
            ...conv,
            isOnline: false,
            lastSeen: new Date()
          };
        }
        
        return conv;
      }));
    };
    
    // Đăng ký event listener một cách an toàn sử dụng registerEventListener
    SocketService.onUserOnline(handleUserOnline);
    SocketService.onUserOffline(handleUserOffline);
    
    // Khi người dùng thay đổi cuộc trò chuyện hoặc vào trang chat
    // Thông báo rằng họ đang xem tin nhắn
    if (activeConversation?._id) {
      SocketService.viewingMessages(activeConversation._id);
    }
    
    // Cleanup
    return () => {
      console.log('🧹 Dọn dẹp listener trạng thái online/offline');
      if (activeConversation?._id) {
        SocketService.stopViewingMessages(activeConversation._id);
      }
      
      // Xóa listener sử dụng phương thức của SocketService
      SocketService.removeListener('user_online');
      SocketService.removeListener('user_offline');
    };
  }, [activeConversation]);

  // Xử lý tin nhắn đã chuyển giao
  useEffect(() => {
    if (!SocketService.socket) return;
    
    console.log('📬 Thiết lập listener cho tin nhắn đã chuyển giao');
    
    const handleMessageDelivered = (data) => {
      console.log('📬 Tin nhắn đã được chuyển giao:', data.messageId);
      
      // Cập nhật trạng thái tin nhắn
      setMessages(prev => prev.map(msg => {
        if (msg._id === data.messageId) {
          return {
            ...msg,
            delivered: true,
            deliveredAt: data.deliveredAt
          };
        }
        return msg;
      }));
    };
    
    // Đăng ký event listener
    SocketService.onMessageDelivered(handleMessageDelivered);
    
    // Cleanup
    return () => {
      SocketService.removeListener('message_delivered');
    };
  }, []);

  // Xử lý ai đang xem tin nhắn
  useEffect(() => {
    if (!SocketService.socket || !activeConversation) return;
    
    console.log('👀 Thiết lập listener cho ai đang xem tin nhắn');
    
    const viewingUsers = new Map();
    
    const handleUserViewingMessages = (data) => {
      const { userId, conversationId } = data;
      
      // Chỉ quan tâm đến cuộc trò chuyện hiện tại
      if (conversationId !== activeConversation._id) return;
      
      console.log('👀 Người dùng đang xem tin nhắn:', userId);
      
      // Tìm tên người dùng từ members
      let userName = "Ai đó";
      if (activeConversation?.members) {
        const member = activeConversation.members.find(
          m => m.idUser && m.idUser._id === userId
        );
        if (member?.idUser?.name) {
          userName = member.idUser.name;
        }
      }
      
      // Cập nhật danh sách người đang xem
      viewingUsers.set(userId, userName);
      
      // TODO: Có thể hiển thị UI "X đang xem tin nhắn" nếu cần
    };
    
    const handleUserStopViewingMessages = (data) => {
      const { userId, conversationId } = data;
      
      // Chỉ quan tâm đến cuộc trò chuyện hiện tại
      if (conversationId !== activeConversation._id) return;
      
      console.log('👀 Người dùng ngừng xem tin nhắn:', userId);
      
      // Xóa khỏi danh sách người đang xem
      viewingUsers.delete(userId);
      
      // TODO: Cập nhật UI nếu cần
    };
    
    // Đăng ký event listener
    SocketService.onUserViewingMessages(handleUserViewingMessages);
    SocketService.socket.on('user_stop_viewing_messages', handleUserStopViewingMessages);
    
    // Cleanup
    return () => {
      SocketService.removeListener('user_viewing_messages');
      SocketService.socket.off('user_stop_viewing_messages');
    };
  }, [activeConversation]);

  // Xử lý đồng bộ tin nhắn sau khi mất kết nối
  useEffect(() => {
    if (!SocketService.socket) return;
    
    console.log('🔄 Thiết lập listener cho đồng bộ tin nhắn');
    
    // Khi socket đã ngắt kết nối và kết nối lại
    const handleReconnect = () => {
      console.log('🔄 Socket kết nối lại, đồng bộ tin nhắn...');
      
      // Đồng bộ tin nhắn cho cuộc trò chuyện hiện tại
      if (activeConversation?._id && messages.length > 0) {
        // Lấy thời gian của tin nhắn mới nhất
        const latestMessage = messages.reduce((latest, msg) => {
          const msgTime = new Date(msg.createdAt).getTime();
          const latestTime = new Date(latest.createdAt).getTime();
          return msgTime > latestTime ? msg : latest;
        }, messages[0]);
        
        // Gửi yêu cầu đồng bộ từ tin nhắn cuối cùng
        SocketService.syncMessages(latestMessage.createdAt, activeConversation._id);
      }
    };
    
    const handleSyncMessages = (data) => {
      console.log('🔄 Nhận tin nhắn đồng bộ:', data.messages?.length || 0);
      
      if (!data.messages || data.messages.length === 0) return;
      
      // Chỉ cập nhật nếu đang ở đúng cuộc trò chuyện
      if (activeConversation?._id === data.conversationId) {
        // Lọc những tin nhắn mới chưa có trong state
        const messageIds = new Set(messages.map(m => m._id));
        const newMessages = data.messages.filter(m => !messageIds.has(m._id));
        
        if (newMessages.length > 0) {
          // Thêm tin nhắn mới vào state và sắp xếp theo thời gian
          setMessages(prev => [...prev, ...newMessages].sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          ));
        }
      }
    };
    
    // Đăng ký event listener
    SocketService.socket.on('reconnect', handleReconnect);
    SocketService.onSyncMessages(handleSyncMessages);
    
    // Cleanup
    return () => {
      SocketService.socket.off('reconnect');
      SocketService.removeListener('sync_messages_result');
    };
  }, [activeConversation, messages]);

  // Xử lý sự kiện group_created
  useEffect(() => {
    if (!SocketService.socket) return;
    
    console.log('👥 Thiết lập listener cho nhóm mới được tạo');
    
    const handleGroupCreated = (data) => {
      console.log('👥 Nhóm mới được tạo:', data.groupId);
      
      // Nếu đã có thông tin đầy đủ về nhóm, cập nhật danh sách cuộc trò chuyện
      if (data._id) {
        const newGroup = data;
        
        // Kiểm tra xem nhóm đã tồn tại trong danh sách chưa
        const exists = conversations.some(conv => conv._id === newGroup._id);
        
        if (!exists) {
          console.log('👥 Thêm nhóm mới vào danh sách cuộc trò chuyện');
          setConversations(prev => [newGroup, ...prev]);
        }
      } else {
        // Nếu chỉ có ID, cần tải thông tin nhóm
        console.log('👥 Tải thông tin nhóm mới');
        
        // Tải lại danh sách cuộc trò chuyện để có thông tin nhóm mới
        fetchConversations();
      }
    };
    
    // Đăng ký event listener
    SocketService.onGroupCreated(handleGroupCreated);
    
    // Cleanup
    return () => {
      SocketService.removeListener('group_created');
    };
  }, [conversations]);

  // Xử lý chi tiết hoạt động nhóm
  useEffect(() => {
    if (!SocketService.socket) return;
    
    console.log('👥 Thiết lập listener cho hoạt động chi tiết nhóm');
    
    const handleGroupActivity = (data) => {
      console.log('👥 Hoạt động nhóm:', data.activityType);
      
      // Chỉ xử lý nếu liên quan đến cuộc trò chuyện hiện tại
      if (activeConversation?._id !== data.conversationId) return;
      
      // Hiển thị thông báo hoạt động trong tin nhắn nếu cần
      const activityMessage = {
        _id: `activity_${Date.now()}`,
        type: 'activity',
        content: '',
        activityType: data.activityType,
        sender: data.actorId,
        target: data.targetId,
        details: data.details,
        createdAt: data.timestamp || new Date(),
        idConversation: data.conversationId
      };
      
      // Thêm thông báo hoạt động vào danh sách tin nhắn
      setMessages(prev => [...prev, activityMessage]);
    };
    
    // Đăng ký event listener
    SocketService.onGroupActivity(handleGroupActivity);
    
    // Cleanup
    return () => {
      SocketService.removeListener('group_activity');
    };
  }, [activeConversation]);

  // Xử lý khi người dùng bị xóa khỏi nhóm
  useEffect(() => {
    if (!SocketService.socket) return;
    
    console.log('🚫 Thiết lập listener cho khi người dùng bị xóa khỏi nhóm');
    
    const handleRemovedFromGroup = (data) => {
      console.log('🚫 Người dùng hiện tại bị xóa khỏi nhóm:', data);
      
      // Xóa conversation khỏi danh sách
      setConversations(prev => 
        prev.filter(conv => conv._id !== data.conversationId)
      );
      
      // Nếu đang xem conversation bị xóa thì chuyển về danh sách
      if (activeConversation && activeConversation._id === data.conversationId) {
        setActiveConversation(null);
        setMessages([]);
        
        // Hiển thị dialog thông báo
        toast.info(data.message || `Bạn đã bị xóa khỏi nhóm "${data.groupName}"`);
        
        // Nếu đang ở mobile view, chuyển về danh sách cuộc trò chuyện
        if (window.innerWidth <= 768) {
          setShowConversationList(true);
        }
      }
    };
    
    // Thêm listener cho sự kiện khi nhóm bị xóa bởi admin
    const handleGroupDeletedEvent = (data) => {
      console.log('🚫 Nhóm đã bị admin xóa:', data);
      
      // Xóa conversation khỏi danh sách
      setConversations(prev => 
        prev.filter(conv => conv._id !== data.conversationId)
      );
      
      // Nếu đang xem conversation bị xóa thì chuyển về danh sách
      if (activeConversation && activeConversation._id === data.conversationId) {
        setActiveConversation(null);
        setMessages([]);
        
        // Hiển thị thông báo
        Alert.alert("Thông báo", `Nhóm "${data.groupName || 'chat'}" đã bị xóa bởi admin`);
        
        // Nếu đang ở mobile view, chuyển về danh sách cuộc trò chuyện
        if (window.innerWidth <= 768) {
          setShowConversationList(true);
        }
      }
    };
    
    // Đăng ký event listener
    SocketService.onRemovedFromGroup(handleRemovedFromGroup);
    SocketService.onGroupDeleted(handleGroupDeletedEvent);
    
    // Cleanup
    return () => {
      SocketService.removeListener('removed_from_group');
      SocketService.removeListener('group_deleted');
    };
  }, [activeConversation]);

  // Xử lý lỗi tin nhắn
  useEffect(() => {
    if (!SocketService.socket) return;
    
    console.log('⚠️ Thiết lập listener cho lỗi tin nhắn');
    
    const handleMessageError = (data) => {
      console.error('⚠️ Lỗi tin nhắn:', data);
      
      // Hiển thị thông báo lỗi
      if (data.messageId) {
        // Cập nhật trạng thái lỗi cho tin nhắn cụ thể
        setMessages(prev => prev.map(msg => {
          if (msg._id === data.messageId) {
            return {
              ...msg,
              error: true,
              errorMessage: data.message || 'Không thể gửi tin nhắn'
            };
          }
          return msg;
        }));
      } else {
        // Hiển thị thông báo lỗi chung
        toast.error(data.message || 'Đã xảy ra lỗi với tin nhắn');
      }
    };
    
    // Đăng ký event listener
    SocketService.onMessageError(handleMessageError);
    
    // Cleanup
    return () => {
      SocketService.removeListener('message_error');
    };
  }, []);

  // Xử lý người dùng cụ thể đang nhập trong nhóm
  useEffect(() => {
    if (!SocketService.socket || !activeConversation || activeConversation.type !== 'group') return;
    
    console.log('⌨️ Thiết lập listener cho người dùng cụ thể đang nhập trong nhóm');
    
    const handleSpecificUserTyping = (data) => {
      // Chỉ xử lý nếu là cuộc trò chuyện hiện tại và là nhóm
      if (activeConversation._id !== data.conversationId) return;
      
      console.log('⌨️ Người dùng cụ thể đang nhập:', data.userName);
      
      // Cập nhật state người đang nhập
      setTypingUsers(prev => ({
        ...prev,
        [data.userId]: data.userName
      }));
      
      // Tự động xóa sau 3 giây nếu không có cập nhật mới
      setTimeout(() => {
        setTypingUsers(current => {
          const updated = { ...current };
          if (updated[data.userId]) {
            delete updated[data.userId];
          }
          return updated;
        });
      }, 3000);
    };
    
    // Đăng ký event listener
    SocketService.onSpecificUserTyping(handleSpecificUserTyping);
    
    // Cleanup
    return () => {
      SocketService.removeListener('specific_user_typing');
    };
  }, [activeConversation]);

  // Thêm hàm tiện ích kiểm tra quyền admin
  const isGroupAdmin = (conversation) => {
    if (!conversation || !userId || conversation.type !== 'group') return false;
    
    // Lấy thông tin admin từ nhiều nguồn (conversation object và localStorage)
    const adminId = conversation.admin?._id || conversation.admin || 
                    localStorage.getItem(`adminId_${conversation._id}`) || 
                    localStorage.getItem('adminId');
    
    console.log('Admin check - AdminId:', adminId, 'UserId:', userId);
    
    return adminId && userId.toString() === adminId.toString();
  };
  
  // Thêm hàm tiện ích kiểm tra quyền admin2
  const isGroupAdmin2 = (conversation) => {
    if (!conversation || !userId || conversation.type !== 'group') return false;
    
    // Lấy thông tin admin2 từ nhiều nguồn (conversation object và localStorage)
    const admin2Id = conversation.admin2?._id || conversation.admin2 || 
                     localStorage.getItem(`admin2Id_${conversation._id}`) || 
                     localStorage.getItem('admin2Id');
    
    console.log('Admin2 check - Admin2Id:', admin2Id, 'UserId:', userId);
    
    return admin2Id && userId.toString() === admin2Id.toString();
  };

  // Xử lý sự kiện nhóm bị xóa
  useEffect(() => {
    if (!SocketService.socket) return;
    
    console.log('🗑️ Thiết lập listener cho sự kiện nhóm bị xóa');
    
    const handleGroupDeleted = (data) => {
      console.log('🗑️ Nhận thông báo nhóm bị xóa:', data);
      
      // Xóa cuộc trò chuyện khỏi danh sách
      setConversations(prev => 
        prev.filter(conv => conv._id !== data.conversationId)
      );
      
      // Nếu đang xem cuộc trò chuyện đã bị xóa, chuyển về mặc định
      if (activeConversation && activeConversation._id === data.conversationId) {
        setActiveConversation(null);
        setMessages([]);
        
        // Hiển thị thông báo
        Alert.alert(
          "Thông báo", 
          data.message || `Nhóm "${data.groupName || 'chat'}" đã bị xóa bởi admin`
        );
      }
    };
    
    // Đăng ký lắng nghe sự kiện
    SocketService.onGroupDeleted(handleGroupDeleted);
    
    return () => {
      // Dọn dẹp khi unmount
      SocketService.removeListener('group_deleted');
    };
  }, [activeConversation]);

  const handleFileSelectFromGroup = (file, type) => {
    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFilePreview(null);
    }
    
    // Set message type based on the group selection
    setMessageType(type || 'file');
    
    // Create temp file URL
    file.tempFileUrl = `temp_file_${Date.now()}_${file.name}`;
    
    // Focus input for caption
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Tải tin nhắn đã ghim khi component được tải hoặc khi conversation thay đổi
  useEffect(() => {
    const loadPinnedMessagesForConversation = async () => {
      if (!activeConversation || !activeConversation._id || activeConversation.type !== 'group') return;
      
      try {
        console.log('Tải tin nhắn đã ghim cho cuộc trò chuyện nhóm:', activeConversation._id);
        const token = AuthService.getAccessToken();
        const response = await ChatService.getPinnedMessages(activeConversation._id, token);
        
        if (response.success && response.pinnedMessages) {
          console.log(`Đã tải ${response.pinnedMessages.length} tin nhắn đã ghim`);
          // Cập nhật conversation với danh sách tin nhắn đã ghim
          setActiveConversation(prev => ({
            ...prev,
            pinnedMessages: response.pinnedMessages
          }));
        } else {
          console.log('Không có tin nhắn đã ghim hoặc lỗi:', response.message);
        }
      } catch (error) {
        console.error('Lỗi khi tải tin nhắn đã ghim:', error);
      }
    };
    
    // Chỉ tải tin nhắn đã ghim nếu là chat nhóm
    if (activeConversation?.type === 'group') {
      loadPinnedMessagesForConversation();
    }
  }, [activeConversation?._id, activeConversation?.type]);

  // Xử lý sự kiện thêm thành viên vào nhóm
  useEffect(() => {
    if (!SocketService.socket) return;
    
    console.log('👥 Thiết lập listener cho sự kiện thêm thành viên vào nhóm');
    
    const handleMemberAddedToGroup = (data) => {
      console.log('👤 Thành viên mới được thêm vào nhóm:', data);
      
      // Cập nhật danh sách cuộc trò chuyện
      if (data.conversation) {
        setConversations(prev => 
          prev.map(conv => 
            conv._id === data.conversation._id ? data.conversation : conv
          )
        );
        
        // Cập nhật cuộc trò chuyện hiện tại nếu đang xem
        if (activeConversation && activeConversation._id === data.conversation._id) {
          console.log('🔄 Cập nhật thông tin nhóm hiện tại với thành viên mới');
          setActiveConversation(data.conversation);
          
          // Thêm thông báo hệ thống về việc thêm thành viên mới
          if (data.conversation.lastMessage && 
              data.conversation.lastMessage.type === 'system' && 
              data.conversation.lastMessage.systemType === 'add_member') {
            
            const systemMessage = {
              _id: `system_${Date.now()}`,
              type: 'system',
              content: data.conversation.lastMessage.content,
              createdAt: new Date().toISOString()
            };
            
            setMessages(prev => [...prev, systemMessage]);
            
            // Cuộn xuống tin nhắn mới
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        }
      }
    };
    
    // Đăng ký lắng nghe sự kiện
    SocketService.onMemberAdded(handleMemberAddedToGroup);
    
    // Cleanup
    return () => {
      SocketService.removeListener('member_added');
    };
  }, [activeConversation]);

  useEffect(() => {
    // Ensure the static/images directory exists
    const createStaticImagesDirIfNeeded = async () => {
      try {
        // Create directories if needed - this is a client-side check
        const staticDir = 'public/static';
        const imagesDir = `${staticDir}/images`;
        console.log('Ensuring static image directories exist');
      } catch (error) {
        console.error('Error handling static directories:', error);
      }
    };
    
    createStaticImagesDirIfNeeded();
  }, []);

  // Tải dữ liệu người dùng và khởi tạo socket
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Tải dữ liệu người dùng
        await fetchUserData();
        
        // Tải danh sách cuộc trò chuyện
        await fetchConversations();
        
        // Khởi tạo kết nối socket sau khi tải dữ liệu cơ bản
        if (!SocketService.isConnected) {
          Logger.info('Initializing socket connection after basic data load');
          SocketService.connect();
          
          // Join user room sau khi kết nối
          const userData = AuthService.getUserData();
          if (userData && userData._id) {
            SocketService.joinUserRoom(userData);
          }
        }
      } catch (error) {
        Logger.error("Error initializing chat", error);
      }
    };

    initializeChat();
    
    // Cleanup khi component unmount
    return () => {
      // Disconnect socket nếu cần
    };
  }, [userId]);

  // Hàm xử lý tìm kiếm cuộc trò chuyện
  const handleSearchConversation = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (!query) {
      setFilteredConversations(conversations);
      return;
    }
    
    const filtered = conversations.filter(conversation => {
      // Tìm kiếm theo tên nhóm nếu là nhóm
      if (conversation.type === 'group') {
        return conversation.name.toLowerCase().includes(query);
      }
      
      // Tìm kiếm theo tên người dùng nếu là chat 1-1
      const otherUser = getOtherParticipant(conversation)?.idUser;
      if (otherUser) {
        return otherUser.name.toLowerCase().includes(query);
      }
      
      return false;
    });
    
    setFilteredConversations(filtered);
  };

  // Cập nhật filteredConversations khi conversations thay đổi
  useEffect(() => {
    setFilteredConversations(conversations);
  }, [conversations]);

  // Thêm state cho drawer
  const [groupControlDrawerOpen, setGroupControlDrawerOpen] = useState(false);

  // Hàm để mở drawer điều khiển nhóm
  const handleGroupControlOpen = () => {
    setGroupControlDrawerOpen(true);
  };

  // Hàm để đóng drawer điều khiển nhóm
  const handleGroupControlClose = () => {
    setGroupControlDrawerOpen(false);
  };

  if (showProfile) {
    return <ProfileScreen onBack={() => setShowProfile(false)} />;
  }

  // Hiển thị trạng thái tải
  if (loading.conversations) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: 'background.default'
      }}>
        <LoadingAnimation />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Đang tải dữ liệu cuộc trò chuyện...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "background.default",
      }}
    >
      {/* Main Content Area with Conversation List and Chat Area */}
      <Box
        sx={{
          display: "flex",
          height: "100%",
          width: "100%",
        }}
      >
        {/* Conversation List */}
      <Box
        sx={{
            width: { xs: '100%', md: '320px' },
            height: '100%',
            display: { xs: showConversationList && !activeConversation ? 'flex' : 'none', md: 'flex' },
            flexDirection: 'column',
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            overflow: 'hidden', // Ngăn không cho toàn bộ container cuộn
        }}
      >
          {/* Header cố định */}
          <Box sx={{ 
            p: 2,
            borderBottom: '1px solid', 
            borderColor: 'divider',
            flexShrink: 0 // Ngăn phần header co lại
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Cuộc trò chuyện</Typography>
              <Box sx={{ display: 'flex' }}>
                <Tooltip title="Tạo nhóm mới">
                  <IconButton 
                    size="small"
                    onClick={handleCreateGroup}
                    sx={{ mr: 1 }}
                  >
                    <GroupAddIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Thêm bạn mới">
                  <IconButton 
                    size="small"
                    onClick={() => navigation.navigate('Contacts')}
                  >
                    <PersonAddIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

          <TextField
              variant="outlined"
              placeholder="Tìm kiếm..."
              fullWidth
              size="small"
              value={searchQuery}
              onChange={handleSearchConversation}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        setSearchQuery("");
                        setFilteredConversations(conversations);
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
          />
          </Box>
          
          {/* Danh sách cuộc trò chuyện có thể cuộn */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto' // Chỉ phần này có thể cuộn
          }}>
            <List sx={{ width: '100%' }}>
              {loading.conversations ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : conversations.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">Chưa có cuộc trò chuyện nào</Typography>
                <Button
                  variant="contained"
                    startIcon={<PersonAddIcon />}
                    sx={{ mt: 2 }}
                    onClick={() => navigation.navigate('Contacts')}
                  >
                    Tìm bạn bè
                </Button>
              </Box>
              ) : filteredConversations.length === 0 && searchQuery ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">Không tìm thấy kết quả phù hợp</Typography>
                </Box>
              ) : (
                filteredConversations.map((conversation) => {
                  const otherUser = conversation.type === 'group' 
                    ? null 
                    : getOtherParticipant(conversation)?.idUser;
                  
                  const isOnline = otherUser && onlineUsers.includes(otherUser._id);
                  const lastMessage = conversation.lastMessage;
                  const isSelected = activeConversation?._id === conversation._id;

            return (
              <ListItem
                      key={conversation._id}
                      button
                      selected={isSelected}
                onClick={() => handleConversationSelect(conversation)}
                sx={{
                        mb: 0.5,
                        borderRadius: 1,
                        mx: 0.5,
                        '&.Mui-selected': {
                          bgcolor: 'action.selected',
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        },
                }}
              >
                <ListItemAvatar>
                  {conversation.type === 'group' ? (
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <Avatar sx={{ width: 16, height: 16, bgcolor: 'primary.main' }}>
                          <GroupIcon sx={{ fontSize: 12 }} />
                        </Avatar>
                      }
                    >
                      <Avatar src={conversation.avatar || ""}>
                        {!conversation.avatar && (conversation.name?.[0] || 'G')}
                      </Avatar>
                    </Badge>
                  ) : (
                    <Badge
                      overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                            color={isOnline ? 'success' : 'error'}
                    >
                            <Avatar src={otherUser?.avatar || ""}>
                              {!otherUser?.avatar && otherUser?.name?.[0]}
                            </Avatar>
                    </Badge>
                  )}
                </ListItemAvatar>
                <ListItemText
                  primary={
                          <Typography 
                            variant="body1" 
                            noWrap 
                  sx={{
                              fontWeight: conversation.unreadCount > 0 ? 'bold' : 'normal',
                              maxWidth: '180px'
                  }}
                >
                            {conversation.type === 'group' ? conversation.name : otherUser?.name || (otherUser?._id ? 'Người dùng' : 'Chọn cuộc trò chuyện...')}
                  </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {lastMessage && (
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                noWrap
                      sx={{
                                  maxWidth: '120px',
                                  fontWeight: conversation.unreadCount > 0 ? 'medium' : 'normal'
                                }}
                              >
                                {lastMessage.type === 'text' 
                                  ? lastMessage.content 
                                  : lastMessage.type === 'image'
                                    ? '🖼️ Hình ảnh'
                                    : lastMessage.type === 'video'
                                      ? '🎬 Video'
                                      : lastMessage.type === 'system'
                                        ? lastMessage.content
                                        : '📎 Tệp đính kèm'
                                }
                      </Typography>
                            )}
                            {lastMessage && (
                              <Typography variant="caption" color="text.secondary">
                                · {formatChatTime(lastMessage.createdAt)}
          </Typography>
                            )}
            </Box>
                        }
                      />
                      {conversation.unreadCount > 0 && (
                        <Badge 
                          badgeContent={conversation.unreadCount} 
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </ListItem>
                        );
                })
              )}
            </List>
                </Box>
      </Box>

        {/* Chat Area */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
            height: "100%",
            width: { xs: '100%', md: 'calc(100% - 320px)' },
            display: { xs: !showConversationList || activeConversation ? 'flex' : 'none', md: 'flex' },
        }}
      >
        {activeConversation ? (
          <>
            {/* Chat Header */}
              <Box
              sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                borderBottom: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {/* Back button for mobile */}
                  <IconButton 
                    sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }}
                    onClick={() => setShowConversationList(true)}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                  
                  {activeConversation.type === 'group' ? (
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <Avatar sx={{ width: 16, height: 16, bgcolor: 'primary.main' }}>
                          <GroupIcon sx={{ fontSize: 12 }} />
                        </Avatar>
                      }
                    >
                      <Avatar
                        src={activeConversation.avatar || ""}
                        alt={activeConversation.name || "Group"}
                        sx={{ mr: 2 }}
                      >
                        {!activeConversation.avatar && (activeConversation.name?.[0] || 'G')}
                      </Avatar>
                    </Badge>
                  ) : (
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      variant="dot"
                      color={
                        onlineUsers.includes(
                          getOtherParticipant(activeConversation)?.idUser?._id
                        )
                          ? "success"
                          : "error"
                      }
                    >
                      <Avatar
                        src={
                          getOtherParticipant(activeConversation)?.idUser?.avatar ||
                          ""
                        }
                        sx={{ mr: 2 }}
                      >
                        {!getOtherParticipant(activeConversation)?.idUser?.avatar && 
                         getOtherParticipant(activeConversation)?.idUser?.name?.[0]}
                      </Avatar>
                    </Badge>
                  )}
                      <Box>
                    <Typography variant="h6">
                      {activeConversation.type === 'group' 
                        ? activeConversation.name || "Group Chat"
                        : getOtherParticipant(activeConversation)?.idUser?.name ||
                          (getOtherParticipant(activeConversation)?.idUser?._id ? "Người dùng" : "User")
                      }
                        </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {activeConversation.type === 'group' 
                        ? `${activeConversation.members?.length || 0} members`
                        : onlineUsers.includes(
                            getOtherParticipant(activeConversation)?.idUser?._id
                          )
                          ? "Online"
                          : "Offline"
                      }
                      {Object.keys(typingUsers).includes(
                        getOtherParticipant(activeConversation)?.idUser?._id
                      ) && " • typing..."}
                        </Typography>
                          </Box>
                      </Box>
                <Box>
                {activeConversation.type === 'group' && (
                    <>
                    <Tooltip title="Thành viên nhóm">
                      <IconButton onClick={handleOpenGroupMembers}>
                        <PeopleIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Điều khiển nhóm">
                      <IconButton
                        onClick={handleGroupControlOpen}
                        aria-label="Điều khiển nhóm"
                        color="primary"
                        sx={{ ml: 1 }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Tooltip>
                    </>
                  )}
                  {!activeConversation.type === 'group' && (
                    <IconButton
                      onClick={handleMenuOpen}
                      aria-label="more"
                      aria-controls="long-menu"
                      aria-haspopup="true"
                    >
                      <MoreVert />
                    </IconButton>
                  )}

                {/* Sử dụng component GroupControlDrawer */}
                <GroupControlDrawer
                  open={groupControlDrawerOpen}
                  onClose={handleGroupControlClose}
                  conversation={activeConversation}
                  isAdmin={isGroupAdmin(activeConversation)}
                  isAdmin2={isGroupAdmin2(activeConversation)}
                  onViewPinnedMessages={() => setPinnedMessagesDialogOpen(true)}
                  onOpenGroupMembers={handleOpenGroupMembers}
                  onEditGroup={handleEditGroup}
                  onLeaveGroup={() => handleLeaveGroup(activeConversation._id)}
                  onDeleteGroup={() => handleDeleteGroup(activeConversation._id)}
                />

                <Menu
                    id="long-menu"
                    anchorEl={anchorEl}
                    keepMounted={false}
                    disablePortal
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    MenuListProps={{
                      'aria-labelledby': 'more-button',
                    }}
                    transformOrigin={{ 
                      vertical: 'top', 
                      horizontal: 'right' 
                    }}
                    anchorOrigin={{ 
                      vertical: 'top', 
                      horizontal: 'right' 
                    }}
                    PaperProps={{
                      sx: {
                        width: 220,
                        maxHeight: 300,
                        boxShadow: '0px 5px 15px rgba(0,0,0,0.2)'
                      }
                    }}
            >
                    {/* Chỉ hiển thị menu xem tin nhắn đã ghim khi đang ở trong nhóm */}
                    {activeConversation.type === 'group' && (
                      <MenuItem onClick={() => setPinnedMessagesDialogOpen(true)}>
                        Xem tin nhắn đã ghim
                      </MenuItem>
                    )}
                    
                    {activeConversation.type === 'group' && (
                      <>
                        <MenuItem onClick={handleOpenGroupMembers}>
                          Thành viên nhóm
                        </MenuItem>
                        {isGroupAdmin(activeConversation) && (
                          <MenuItem onClick={handleEditGroup}>
                            Chỉnh sửa nhóm
                          </MenuItem>
                        )}
                        <MenuItem onClick={() => handleLeaveGroup(activeConversation._id)}>
                          Rời nhóm
                        </MenuItem>
                        {isGroupAdmin(activeConversation) && (
                          <MenuItem onClick={() => handleDeleteGroup(activeConversation._id)}>
                            Xóa nhóm
                          </MenuItem>
                        )}
                      </>
                    )}
            </Menu>
                </Box>
              </Box>

              {/* Pinned Message Banner - Chỉ hiển thị trong chat nhóm */}
              {activeConversation.type === 'group' && activeConversation.pinnedMessages?.length > 0 && (
                <PinnedMessageBanner 
                  conversation={activeConversation}
                  onViewAllPinned={() => setPinnedMessagesDialogOpen(true)}
                  onUnpinMessage={(messageId) => {
                    // Cập nhật tin nhắn trong danh sách tin nhắn hiện tại
                    setMessages(prevMessages => 
                      prevMessages.map(msg => 
                        msg._id === messageId ? {...msg, isPinned: false, pinnedBy: null, pinnedAt: null} : msg
                      )
                    );
                    
                    // Cập nhật activeConversation để loại bỏ tin nhắn đã bỏ ghim
                    setActiveConversation(prevConversation => ({
                      ...prevConversation,
                      pinnedMessages: prevConversation.pinnedMessages.filter(
                        msg => msg._id !== messageId
                      )
                    }));
                  }}
                />
            )}
            
              {/* Chat Messages */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
                p: 2,
                bgcolor: "background.default",
                backgroundImage: theme => theme.palette.mode === 'dark' 
                  ? 'linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url("/static/images/chat-bg-pattern.png")' 
                  : 'linear-gradient(rgba(255,255,255,0.95), rgba(255,255,255,0.95)), url("/static/images/chat-bg-pattern.png")',
                backgroundSize: '200px',
                backgroundRepeat: 'repeat',
                backgroundAttachment: 'fixed'
              }}
              ref={messagesContainerRef}
              onScroll={e => {
                const { scrollTop } = e.currentTarget;
                if (scrollTop === 0 && hasMoreMessages && !loadingMoreMessages) {
                  loadMoreMessages();
                }
              }}
            >
                    {loadingMoreMessages && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    )}
                  
                {messages.length === 0 && !loading.messages ? (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '100%'
                  }}>
                    <Typography color="text.secondary" gutterBottom>
                      Chưa có tin nhắn nào
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Hãy gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện
                    </Typography>
                  </Box>
                ) : (
                  loading.messages ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    messages.map((message, index) => {
                      const isCurrentUser = isSentByCurrentUser(message);
                      const showSender = activeConversation.type === 'group' && 
                                       !isCurrentUser && 
                                       (index === 0 || 
                                        !messages[index - 1].sender || 
                                        !message.sender ||
                                        messages[index - 1].sender.toString() !== message.sender.toString());
                                          
                      const messageDate = new Date(message.createdAt);
                      const showDateSeparator = index === 0 || 
                        new Date(messages[index - 1].createdAt).toDateString() !== messageDate.toDateString();
                      
                      return (
                        <React.Fragment key={message._id || message.id || index}>
                          {showDateSeparator && (
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'center', 
                              my: 2 
                            }}>
                                <Typography 
                                variant="caption" 
                                  sx={{ 
                                  bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(50,50,50,0.9)' : 'background.paper',
                                    color: 'text.secondary',
                                  px: 2,
                                  py: 0.5,
                                  borderRadius: 4,
                                  boxShadow: theme => theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
                                  }}
                                >
                                {messageDate.toLocaleDateString()}
                                </Typography>
                            </Box>
                          )}
                          
                          {message.type === 'system' ? (
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'center', 
                              my: 1 
                            }}>
                              <Typography 
                                variant="caption" 
                                sx={{
                                  bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(50,50,50,0.9)' : 'background.paper',
                                  color: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                                  px: 2,
                                  py: 0.5,
                                  borderRadius: 4,
                                  boxShadow: theme => theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
                                }}
                              >
                                {message.content}
                              </Typography>
                            </Box>
                          ) : (
                            <Box
                              id={`message-${message._id || message.id || 'temp-' + index}`}
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                                mb: 1,
                                maxWidth: '80%',
                                alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
                              }}
                              onContextMenu={(e) => handleMessageContextMenu(e, message)}
                            >
                              {/* Hiển thị tên người gửi trong chat nhóm */}
                              {showSender && !isCurrentUser && activeConversation.type === 'group' && (
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    ml: 2, 
                                    mb: 0.5,
                                    color: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                                    fontWeight: 500
                                  }}
                                >
                                  {getSenderName(message, activeConversation)}
                                </Typography>
                              )}
                              
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'flex-start',
                                flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                                gap: 1
                              }}>
                                {/* Hiển thị avatar trong cả chat đơn và nhóm */}
                                {!isCurrentUser && (
                                  <Avatar 
                                    src={message.originalSender?.avatar || ''} 
                                    sx={{ width: 32, height: 32 }}
                                    onClick={() => message.originalSender && handleAvatarClick(message.originalSender)}
                                  >
                                    {!message.originalSender?.avatar && message.originalSender?.name?.[0]}
                                  </Avatar>
                                )}
                                
                                {message.isRevoked ? (
                                  <Box sx={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(60,60,60,0.8)' : 'action.hover',
                                    color: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                                    maxWidth: '100%',
                                    border: theme => theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : 'none'
                                  }}>
                                    <Typography variant="body2" color="inherit" fontStyle="italic">
                                      Tin nhắn đã bị thu hồi
                                    </Typography>
                                  </Box>
                                ) : message.type === 'text' ? (
                                  <Paper
                                    elevation={0}
                                    sx={{ 
                                      p: 1.5,
                                      borderRadius: isCurrentUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                      bgcolor: isCurrentUser ? 'primary.main' : 'background.paper',
                                      color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
                                      maxWidth: '100%',
                                      wordBreak: 'break-word',
                                      boxShadow: !isCurrentUser ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                      border: !isCurrentUser ? '1px solid rgba(0,0,0,0.05)' : 'none',
                                      position: 'relative',
                                      '&::before': !isCurrentUser ? {
                                        content: '""',
                                        position: 'absolute',
                                        bottom: 0,
                                        left: -8,
                                        width: 15,
                                        height: 15,
                                        backgroundColor: 'background.paper',
                                        borderBottom: '1px solid rgba(0,0,0,0.05)',
                                        borderLeft: '1px solid rgba(0,0,0,0.05)',
                                        borderBottomLeftRadius: '50%',
                                        clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
                                        transformOrigin: 'bottom left',
                                        zIndex: 0,
                                      } : {},
                                      // Improve dark mode contrast by adding these styles
                                      '.MuiTypography-root': {
                                        color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
                                      },
                                      // Dark mode specific styling
                                      '.MuiPaper-root.MuiPaper-elevation': {
                                        borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                      }
                                    }}
                                  >
                                    <Typography 
                                      variant="body1" 
                                      sx={{ 
                                        color: isCurrentUser ? 'inherit' : 'text.primary'
                                      }}
                                    >{message.content}</Typography>
                                  </Paper>
                                ) : (
                                  <RenderFileMessage 
                                    message={message}
                                    handleOpenFile={handleOpenFile}
                                  />
                                )}
                              </Box>
                              
                              {/* Message reactions if any */}
                              {message.reactions && Object.keys(message.reactions).length > 0 && (
                                <Box sx={{ 
                                  display: 'flex', 
                                  justifyContent: isCurrentUser ? 'flex-end' : 'flex-start', 
                                  mt: 0.5, 
                                  alignItems: 'center',
                                  ml: !isCurrentUser ? 5 : 0, // Thêm margin left khi không phải người dùng hiện tại
                                  mr: isCurrentUser ? 5 : 0   // Thêm margin right khi là người dùng hiện tại
                                }}>
                                  <MessageReactions 
                                    reactions={message.reactions}
                                    messageId={message._id || message.id}
                                    currentUserId={userId}
                                    onAddReaction={handleAddReaction} 
                                    onRemoveReaction={handleRemoveReaction}
                                  />
                                  
                                  {/* Add Pin button for group chats */}
                                  {activeConversation?.type === 'group' && !message.isRevoked && (
                                    <PinMessageButton 
                                      message={message} 
                                      conversation={activeConversation}
                                      onPinStatusChange={(messageId, isPinned) => {
                                        setMessages(prevMessages => 
                                          prevMessages.map(msg => 
                                            msg._id === messageId ? { ...msg, isPinned } : msg
                                          )
                                        );
                                      }}
                                    />
                                  )}
                                </Box>
                              )}
                              
                              {/* Add reaction button if not showing reactions */}
                              {(!message.reactions || Object.keys(message.reactions).length === 0) && !message.isRevoked && (
                                <Box sx={{ 
                                  display: 'flex', 
                                  justifyContent: isCurrentUser ? 'flex-end' : 'flex-start', 
                                  mt: 0.5,
                                  ml: !isCurrentUser ? 5 : 0, // Thêm margin left khi không phải người dùng hiện tại
                                  mr: isCurrentUser ? 5 : 0   // Thêm margin right khi là người dùng hiện tại
                                }}>
                                  <MessageReactions 
                                    reactions={{}}
                                    messageId={message._id || message.id}
                                    currentUserId={userId}
                                    onAddReaction={handleAddReaction} 
                                    onRemoveReaction={handleRemoveReaction}
                                  />
                                  
                                  {/* Add Pin button for group chats */}
                                  {activeConversation?.type === 'group' && !message.isRevoked && (
                                    <PinMessageButton 
                                      message={message} 
                                      conversation={activeConversation}
                                      onPinStatusChange={(messageId, isPinned) => {
                                        setMessages(prevMessages => 
                                          prevMessages.map(msg => 
                                            msg._id === messageId ? { ...msg, isPinned } : msg
                                          )
                                        );
                                      }}
                                    />
                                  )}
                                </Box>
                              )}
                              
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                mt: 0.5,
                                mx: 1,
                                ml: !isCurrentUser ? 5 : 1, // Thêm margin left khi không phải người dùng hiện tại
                                mr: isCurrentUser ? 5 : 1   // Thêm margin right khi là người dùng hiện tại
                              }}>
                                <Typography 
                                  variant="caption" 
                                  color={theme => 
                                    theme.palette.mode === 'dark' 
                                      ? isCurrentUser ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.5)' 
                                      : 'text.secondary'
                                  }
                                  sx={{ fontSize: '0.7rem' }}
                                >
                                  {formatChatTime(message.createdAt)}
                                </Typography>
                                
                                {isCurrentUser && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
                                    {message.status === "sending" ? (
                                      <CircularProgress size={8} sx={{ ml: 0.5 }} />
                                    ) : message.status === "failed" ? (
                                      <Typography variant="caption" color="error" sx={{ ml: 0.5 }}>
                                        !
                                      </Typography>
                                    ) : message.seen ? (
                                      <DoneAllIcon sx={{ fontSize: 12, ml: 0.5, color: 'primary.main' }} />
                                    ) : message.delivered ? (
                                      <DoneAllIcon sx={{ 
                                        fontSize: 12, 
                                        ml: 0.5, 
                                        color: theme => 
                                          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'text.secondary' 
                                      }} />
                                    ) : (
                                      <DoneAllIcon sx={{ 
                                        fontSize: 12, 
                                        ml: 0.5, 
                                        color: theme => 
                                          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'text.secondary' 
                                      }} />
                                    )}
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          )}
                        </React.Fragment>
                      );
                    })
                  )
                )}
                <div ref={messagesEndRef} />
              </Box>
                
              {/* Chat Input */}
                  <Box
                    sx={{
                  p: 2,
                  bgcolor: "background.paper",
                  borderTop: "1px solid",
                  borderColor: "divider",
                    }}
                  >
                {/* Display typing indicator */}
                {Object.keys(typingUsers).length > 0 && (
                  <Box sx={{ mb: 1, height: 20 }}>
                    <Typography variant="caption" color="text.secondary">
                      {Object.values(typingUsers).join(', ')} đang nhập...
                      <span className="typing-animation">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </span>
                    </Typography>
                  </Box>
                )}

                {/* File preview */}
                {selectedFile && (
                  <Box sx={{ 
                      mb: 2, 
                    p: 1, 
                    bgcolor: 'action.hover', 
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {selectedFile.type.startsWith('image/') && selectedFilePreview ? (
                        <Avatar 
                          variant="rounded" 
                      src={selectedFilePreview} 
                          sx={{ width: 40, height: 40, mr: 1 }} 
                    />
                      ) : selectedFile.type.startsWith('video/') ? (
                        <Avatar variant="rounded" sx={{ width: 40, height: 40, mr: 1, bgcolor: 'primary.dark' }}>
                          <VideocamIcon />
                        </Avatar>
                      ) : selectedFile.type.startsWith('audio/') ? (
                        <Avatar variant="rounded" sx={{ width: 40, height: 40, mr: 1, bgcolor: 'secondary.dark' }}>
                          <AudiotrackIcon />
                        </Avatar>
                      ) : selectedFile.type.includes('pdf') ? (
                        <Avatar variant="rounded" sx={{ width: 40, height: 40, mr: 1, bgcolor: 'error.dark' }}>
                          <PictureAsPdfIcon />
                        </Avatar>
                      ) : selectedFile.type.includes('word') || selectedFile.name.endsWith('.doc') || selectedFile.name.endsWith('.docx') ? (
                        <Avatar variant="rounded" sx={{ width: 40, height: 40, mr: 1, bgcolor: 'info.dark' }}>
                          <DescriptionIcon />
                        </Avatar>
                      ) : selectedFile.type.includes('excel') || selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.xlsx') ? (
                        <Avatar variant="rounded" sx={{ width: 40, height: 40, mr: 1, bgcolor: 'success.dark' }}>
                          <TableChartIcon />
                        </Avatar>
                      ) : (
                        <Avatar variant="rounded" sx={{ width: 40, height: 40, mr: 1, bgcolor: 'grey.700' }}>
                          <InsertDriveFileIcon />
                        </Avatar>
                      )}
                      <Typography variant="body2" noWrap sx={{ maxWidth: '200px' }}>
                          {selectedFile.name}
                        </Typography>
                      </Box>
                    <IconButton onClick={handleCancelFileSelection} size="small">
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FileUploadGroup onFileSelect={handleFileSelectFromGroup} />
                  
                  <IconButton onClick={handleEmojiOpen}>
                    <InsertEmoticonIcon />
                  </IconButton>
                  
                  <IconButton onClick={(e) => handleTabChange(e)}>
                    <GifIcon />
                  </IconButton>
                  
                  {/* Popover cho GiphyGallery */}
                  <Popover
                    open={showGifGallery}
                    anchorEl={emojiAnchorEl}
                    onClose={handleEmojiClose}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'center',
                    }}
                    transformOrigin={{
                      vertical: 'bottom',
                      horizontal: 'center',
                    }}
                  >
                    <GiphyGallery onSelectGif={handleSendGif} onClose={handleEmojiClose} />
                  </Popover>
                  
                  <TextField
                    fullWidth
                    placeholder="Nhập tin nhắn hoặc @ để gọi AI..."
                    value={newMessage}
                    onChange={handleMessageTyping}
                    onKeyPress={handleKeyPress}
                    inputRef={inputRef}
                    variant="outlined"
                    size="small"
                    disabled={isProcessingAI}
                    sx={{ mx: 1 }}
                    helperText={isProcessingAI ? "Đang xử lý yêu cầu AI..." : "Gõ @ để hiển thị gợi ý AI"}
                  />
                  
                  <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={(!newMessage.trim() && !selectedFile) || isProcessingAI}
                  >
                    {isProcessingAI ? <CircularProgress size={24} /> : <SendIcon />}
                  </IconButton>
                </Box>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              p: 4,
              bgcolor: "background.default",
            }}
          >
              <img 
                src="http://localhost:4000/uploads/logo.webp" 
                alt="Select a conversation" 
                style={{ 
                  width: '200px', 
                  height: '200px', 
                  marginBottom: '32px',
                  opacity: 0.8,
                  objectFit: 'contain'
                }}
              />
              <Typography variant="h5" color="text.primary" gutterBottom>
                Chào mừng đến với Chattera
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3, maxWidth: '500px' }}>
                Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin, 
                hoặc tạo cuộc trò chuyện mới với bạn bè.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={() => navigation.navigate('Contacts')}
                >
                  Tìm bạn bè
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<GroupAddIcon />}
                  onClick={handleCreateGroup}
                >
                  Tạo nhóm chat
                </Button>
              </Box>
          </Box>
        )}
        </Box>
      </Box>

      {/* Menu ngữ cảnh cho tin nhắn */}
      <Menu
        anchorEl={messageContextMenu}
        open={Boolean(messageContextMenu)}
        onClose={handleMessageContextMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {/* Chuyển tiếp tin nhắn */}
        <MenuItem onClick={handleForwardMessage}>
          <ListItemIcon>
            <ForwardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Chuyển tiếp</ListItemText>
        </MenuItem>

        {/* Thu hồi tin nhắn - chỉ hiển thị với tin nhắn của mình */}
        {selectedMessage && isSentByCurrentUser(selectedMessage) && (
          <MenuItem onClick={handleRevokeMessage}>
            <ListItemIcon>
              <UndoIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Thu hồi</ListItemText>
          </MenuItem>
        )}

        {/* Xóa tin nhắn */}
        <MenuItem onClick={handleDeleteMessage}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Xóa</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Dialog chọn cuộc trò chuyện để chuyển tiếp tin nhắn */}
      <Dialog
        open={forwardDialogOpen}
        onClose={handleCloseForwardDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Chọn cuộc trò chuyện</DialogTitle>
        <DialogContent>
          <List>
            {conversations.map((conversation) => {
              const otherUser = conversation.type === 'group' 
                ? null 
                : getOtherParticipant(conversation)?.idUser;

              return (
                <ListItem
                  key={conversation._id}
                  button
                  selected={targetConversation?._id === conversation._id}
                  onClick={() => handleSelectForwardConversation(conversation)}
                >
                  <ListItemAvatar>
                    {conversation.type === 'group' ? (
                      <Avatar>
                        <GroupIcon />
                      </Avatar>
                    ) : (
                      <Avatar src={otherUser?.avatar || ""}>
                        {!otherUser?.avatar && otherUser?.name?.[0]}
                      </Avatar>
                    )}
                  </ListItemAvatar>
                  <ListItemText 
                    primary={conversation.type === 'group' 
                      ? conversation.name 
                      : otherUser?.name || 'Người dùng'
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForwardDialog}>Hủy</Button>
          <Button 
            onClick={handleConfirmForward}
            disabled={!targetConversation}
            variant="contained"
          >
            Chuyển tiếp
          </Button>
        </DialogActions>
      </Dialog>

      {/* Group Chat Dialogs */}
      <CreateGroupDialog
        open={createGroupDialogOpen}
        onClose={() => setCreateGroupDialogOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
      
      {activeConversation && (
        <GroupMembersDialog
          open={groupMembersDialogOpen}
          onClose={() => setGroupMembersDialogOpen(false)}
          conversation={activeConversation}
          onMemberRemoved={handleMemberRemoved}
          onGroupLeft={handleGroupLeft}
          onGroupDeleted={handleGroupDeleted}
          onGroupUpdated={handleGroupUpdated}
        />
      )}
      
      {activeConversation && (
        <EditGroupDialog
          open={editGroupDialogOpen}
          onClose={() => setEditGroupDialogOpen(false)}
          conversation={activeConversation}
          onGroupUpdated={handleGroupUpdated}
        />
      )}
      
      {/* Pinned Messages Dialog */}
      {activeConversation && (
        <PinnedMessagesDialog
          open={pinnedMessagesDialogOpen}
          onClose={() => setPinnedMessagesDialogOpen(false)}
          conversation={activeConversation}
        />
      )}
      
      {/* Profile Dialog */}
      <ProfileDialog
        open={profileDialogOpen}
        onClose={handleCloseProfileDialog}
        user={selectedUser}
        currentUser={user}
      />
      {/* Component gợi ý @AIGemini */}
      {showAIMention && (
        <Paper
          sx={{
            position: 'fixed',
            top: mentionPosition.top,
            left: mentionPosition.left,
            zIndex: 1300,
            width: 'auto',
            p: 1,
            boxShadow: 3,
            borderRadius: 1
          }}
        >
          <MenuItem 
            onClick={() => {
              // Lấy vị trí của ký tự @ trong chuỗi
              const atIndex = newMessage.lastIndexOf('@');
              if (atIndex !== -1) {
                // Thay thế @ bằng @AIGemini
                const updatedMessage = 
                  newMessage.substring(0, atIndex) + 
                  '@AIGemini ' + 
                  newMessage.substring(atIndex + 1);
                setNewMessage(updatedMessage);
                // Ẩn gợi ý
                setShowAIMention(false);
                // Focus vào input
                inputRef.current?.focus();
              }
            }}
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1,
              p: 1
            }}
          >
            <SmartToyIcon color="primary" fontSize="small" />
            <Typography>AIGemini</Typography>
          </MenuItem>
        </Paper>
      )}
      
      {/* Snackbar để hiển thị thông báo */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={() => setSnackbarOpen(false)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
};



export default ChatUI;

