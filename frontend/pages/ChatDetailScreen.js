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
} from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import {
  Send as SendIcon,
  MoreVert as MoreVert,
  AttachFile as AttachFileIcon,
  Mood as MoodIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Photo as PhotoIcon,
  Slideshow as SlideshowIcon,
  Share as ShareIcon,
  Group as GroupIcon,
  Edit as EditIcon,
  PersonAdd as PersonAddIcon,
  GroupAdd as GroupAddIcon,
  People as PeopleIcon,
  ExitToApp as ExitToAppIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from "@mui/icons-material";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import ProfileScreen from "./ProfileScreen";
import ChatService from "../services/ChatService";
import UserService from "../services/UserService";
import AuthService from "../services/AuthService";
import SocketService from "../services/SocketService";
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import UndoIcon from '@mui/icons-material/Undo';
import VideocamIcon from '@mui/icons-material/Videocam';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ForwardIcon from '@mui/icons-material/Forward';
import RenderFileMessage from "../components/RenderFileMessage";
import MessageReactions from "../components/MessageReactions";
import CreateGroupDialog from "../components/CreateGroupDialog";
import GroupMembersDialog from "../components/GroupMembersDialog";
import EditGroupDialog from "../components/EditGroupDialog";
import GifGallery from "../components/GifGallery"; // Import GifGallery component
import GifIcon from '@mui/icons-material/Gif';
import PinnedMessageBanner from "../components/PinnedMessageBanner";
import PinnedMessagesDialog from "../components/PinnedMessagesDialog";
import PinMessageButton from "../components/PinMessageButton";
import { useTheme } from '../contexts/ThemeContext';
import ProfileDialog from '../components/ProfileDialog';

const ChatUI = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId: routeUserId } = route.params || {};
  const [userId, setUserId] = useState(routeUserId);
  const [showProfile, setShowProfile] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [phone, setPhone] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [loading, setLoading] = useState({
    conversations: true,
    messages: true,
  });
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

  // Function to check if the current conversation is with Gemini AI
  const isGeminiConversation = () => {
    if (!activeConversation || activeConversation.type !== 'private') return false;
    
    // Get the other participant in the conversation
    const otherUser = getOtherParticipant(activeConversation)?.idUser;
    
    // Check if the other user is Gemini AI (you might identify it by a specific ID or name)
    return otherUser && otherUser.name === 'Gemini AI';
  };

  const [typingUsers, setTypingUsers] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
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
    console.log(conversation);
    if (!conversation?.members) return { idUser: {} };
    const members = Array.isArray(conversation.members)
      ? conversation.members
      : [];
    return (
      members.find((member) => member?.idUser?._id !== userId) || {
        idUser: {},
      }
    );
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
      try {
        setLoadingRequests(true);
        const requests = await UserService.getAllFriendRequests(userId);
        setFriendRequests(requests || []);
      } catch (error) {
        Alert.alert("Error", "Failed to load friend requests");
        console.error("Error fetching friend requests:", error);
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchFriendRequests();
  }, [userId]); // Add all dependencies here

  const handleNotificationMenuOpen = async (event) => {
    setNotificationAnchorEl(event.currentTarget);
    setLoadingRequests(true);
    try {
      const requests = await UserService.getAllFriendRequests(userId);
      setFriendRequests(requests || []);
    } catch (error) {
      console.error("Error loading friend requests:", error);
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

      const convs = await ChatService.getUserConversations(userId, token);

      if (!Array.isArray(convs)) {
        throw new Error("Invalid conversations data format");
      }

      setConversations(convs);

      if (convs.length > 0) {
        const firstConv = convs[0];
        setActiveConversation(firstConv);
        await loadMessages(firstConv._id);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load conversations");
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading((prev) => ({ ...prev, conversations: false }));
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      setLoading((prev) => ({ ...prev, messages: true }));

      console.log(conversationId);

      const token = AuthService.getAccessToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const msgs = await ChatService.getConversationMessages(conversationId);

      if (!Array.isArray(msgs)) {
        throw new Error("Invalid messages data format");
      }

      // Lọc ra các tin nhắn không nằm trong danh sách đã xóa của người dùng hiện tại
      const filteredMsgs = msgs.filter(msg => 
        !msg.deletedBy || !msg.deletedBy.some(id => id.toString() === userId)
      );
      
      setMessages(filteredMsgs);
      console.log(messages);
      await ChatService.markMessagesAsSeen(conversationId, token);
    } catch (error) {
      Alert.alert("Error", "Failed to load messages");
      console.error("Error loading messages:", error);
    } finally {
      setLoading((prev) => ({ ...prev, messages: false }));
    }
  };

  // Save draft to localStorage
  useEffect(() => {
    const draft = localStorage.getItem(`draft-${activeConversation?._id}`);
    if (draft) setNewMessage(draft);
  }, [activeConversation]);

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
      
      // Log chi tiết cho các loại file
      if (message.type !== 'text') {
        console.log(`📁 Received ${message.type} message:`, {
          id: message._id,
          type: message.type,
          url: message.fileUrl,
          fileName: message.fileName,
          fileType: message.fileType
        });
      }
      
      // Add or update message in the list
      setMessages((prev) => {
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
                fileUrl: message.fileUrl || msg.fileUrl,     // Keep file URL
                fileName: message.fileName || msg.fileName,  // Keep file name
                fileType: message.fileType || msg.fileType,  // Keep file type
                type: message.type || msg.type,              // Keep message type
                content: message.content || msg.content      // Keep content
              };
              
              console.log('📄 Updated message data:', enhancedMessage);
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
        
        // Update the conversation in the list
        setConversations(prev => 
          prev.map(conv => 
            conv._id === conversation._id ? conversation : conv
          )
        );
        
        // Update active conversation if it's the one that was updated
        if (activeConversation && activeConversation._id === conversation._id) {
          setActiveConversation(conversation);
          
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
    
    return () => {
      // Cleanup socket listeners
      SocketService.removeListener('new_message');
      SocketService.removeListener('group_created');
      SocketService.removeListener('group_updated');
      SocketService.removeListener('member_added');
      SocketService.removeListener('member_removed');
      SocketService.removeListener('group_left');
      SocketService.removeListener('group_deleted');
    };
  }, [activeConversation, userId]);

  // Cập nhật hàm handleSendMessage để gửi tin nhắn qua socket
  const handleSendMessage = async () => {
    // Kiểm tra nếu không có tin nhắn hoặc không có cuộc trò chuyện
    if ((!newMessage.trim() && !selectedFile) || !activeConversation?._id) return;

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
            ...activeConversation,
            lastMessage: {
              _id: fileResponse._id,
              content: fileResponse.content || `File: ${fileResponse.fileName}`,
              type: fileResponse.type || messageType,
              fileUrl: fileResponse.fileUrl,
              fileName: fileResponse.fileName,
              sender: userId
            }
          };
          
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
    console.log('🔄 Chọn cuộc trò chuyện:', conversation?._id);
    
    if (!conversation?._id) return;
    
    // Lưu cuộc trò chuyện hiện tại
    setActiveConversation(conversation);
    
    try {
      // Tải tin nhắn của cuộc trò chuyện
      await loadMessages(conversation._id);
      
      // Tham gia phòng socket
      console.log('🔌 Tham gia phòng socket của cuộc trò chuyện:', conversation._id);
      SocketService.joinConversation(conversation._id);
      
      // Đánh dấu tin nhắn đã xem
      console.log('👁️ Đánh dấu tin nhắn đã xem');
      SocketService.markMessageAsSeen(conversation._id);
      
      // Rời khỏi cuộc trò chuyện cũ nếu có
      if (activeConversation?._id && activeConversation._id !== conversation._id) {
        console.log('🚪 Rời khỏi phòng socket của cuộc trò chuyện cũ:', activeConversation._id);
        SocketService.leaveConversation(activeConversation._id);
      }
    } catch (error) {
      console.error('❌ Lỗi khi chọn cuộc trò chuyện:', error);
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
    setActiveTab('emoji'); // Default to emoji tab
  };

  const handleEmojiClose = () => {
    setEmojiAnchorEl(null);
    setShowEmojiPicker(false);
    setShowGifGallery(false);
  };

  const handleTabChange = (tab) => {
    if (typeof tab === 'object') { // If it's an event from IconButton click
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

  const handleSendGif = async (gif) => {
    try {
      if (!activeConversation?._id || !userId) return;
      
      // Lấy token xác thực
      const token = AuthService.getAccessToken();
      if (!token) {
        throw new Error("Không có token xác thực");
      }
      
      // Lấy nội dung chú thích nếu có
      const caption = newMessage.trim();
      
      // Send GIF message
      await ChatService.sendGifMessage(
        activeConversation._id,
        userId,
        gif.url,
        token,
        caption
      );
      
      // Xóa tin nhắn chú thích sau khi gửi
      if (caption) {
        setNewMessage("");
      }
      
      // Close the GIF gallery
      handleEmojiClose();
    } catch (error) {
      console.error('Error sending GIF:', error);
      Alert.alert('Error', 'Failed to send GIF');
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
      // Chuyển về trang đăng nhập
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to logout");
    }
  };

  // Thêm useEffect mới để kết nối socket khi component mount
  useEffect(() => {
    console.log('⚡ Thiết lập kết nối socket realtime...');
    // Kết nối socket khi component mount
    const socket = SocketService.connect();
    
    // Khi socket kết nối thành công
    const handleConnect = () => {
      console.log('✅ Socket đã kết nối thành công:', socket.id);
      
      // Tham gia phòng user
      if (userId) {
        const userData = AuthService.getUserData();
        if (userData) {
          console.log('👤 Tham gia phòng user:', userData._id);
          SocketService.joinUserRoom(userData);
        }
      }
      
      // Tham gia cuộc trò chuyện hiện tại
      if (activeConversation?._id) {
        console.log('💬 Tham gia cuộc trò chuyện:', activeConversation._id);
        SocketService.joinConversation(activeConversation._id);
        
        // Đánh dấu tin nhắn đã xem
        SocketService.markMessageAsSeen(activeConversation._id);
      }
      
      // Tham gia tất cả các cuộc trò chuyện
      if (conversations?.length > 0) {
        const conversationIds = conversations.map(c => c._id);
        console.log('📚 Tham gia tất cả cuộc trò chuyện:', conversationIds.length);
        SocketService.joinAllConversations(conversationIds);
      }
    };
    
    // Khi socket ngắt kết nối
    const handleDisconnect = () => {
      console.log('❌ Socket đã ngắt kết nối');
    };
    
    // Thiết lập các sự kiện socket
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    
    // Nếu đã kết nối thì gọi ngay handler
    if (socket.connected) {
      handleConnect();
    }
    
    // Cleanup khi component unmount
    return () => {
      console.log('🧹 Dọn dẹp các sự kiện socket');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      // Các sự kiện khác sẽ được dọn dẹp ở các useEffect riêng
    };
  }, [userId, activeConversation, conversations]);

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
          setMessages(prevMessages => [...prevMessages, data.systemMessage]);
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
      
      // Cập nhật tin nhắn trong danh sách tin nhắn hiện tại
      if (activeConversation && activeConversation._id === data.conversation.toString()) {
        // Update the messages array
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg._id === data.messageId ? {...msg, isPinned: false, pinnedBy: null, pinnedAt: null} : msg
          )
        );
        
        // Update the active conversation to reflect the unpinned message
        // This is crucial for components like PinnedMessageBanner to update immediately
        setActiveConversation(prevConversation => {
          if (prevConversation.pinnedMessages) {
            return {
              ...prevConversation,
              pinnedMessages: prevConversation.pinnedMessages.filter(
                msg => msg._id !== data.messageId
              )
            };
          }
          return prevConversation;
        });
        
        // Thêm thông báo hệ thống nếu có
        if (data.systemMessage) {
          setMessages(prevMessages => [...prevMessages, data.systemMessage]);
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
  }, [activeConversation]);
  
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
        
        // Cập nhật cuộc trò chuyện với tin nhắn mới nhất
        updatedConversations[index] = data.conversation;
        
        // Đưa cuộc trò chuyện vừa cập nhật lên đầu danh sách
        console.log(`🔝 Đưa cuộc trò chuyện ${data.conversation._id} lên đầu danh sách`);
        const conversationToMove = updatedConversations.splice(index, 1)[0];
        
        return [conversationToMove, ...updatedConversations];
      });
      
      // Nếu đang ở trong cuộc trò chuyện này, cập nhật active conversation
      if (activeConversation && activeConversation._id === data.conversation._id) {
        setActiveConversation(data.conversation);
      }
    };
    
    // Đăng ký event listener
    SocketService.onUpdateConversationList(handleUpdateConversationList);
    
    // Cleanup
    return () => {
      SocketService.removeListener('update_conversation_list');
    };
  }, [activeConversation]);

  // Hàm xử lý khi nhập tin nhắn (để gửi trạng thái typing)
  const handleMessageTyping = (e) => {
    const content = e.target.value;
    setNewMessage(content);
    
    // Nếu không có cuộc trò chuyện hoặc không có user ID thì không gửi
    if (!activeConversation?._id || !userId) return;
    
    // Gửi trạng thái typing nếu có nội dung và chưa đang typing
    if (content.trim().length > 0 && !isTyping) {
      setIsTyping(true);
      SocketService.sendTypingStatus(activeConversation._id, userId);
    }
    
    // Hủy trạng thái typing nếu không có nội dung và đang typing
    if (content.trim().length === 0 && isTyping) {
      setIsTyping(false);
      SocketService.sendStopTypingStatus(activeConversation._id, userId);
    }
    
    // Reset timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Đặt timeout để tự động hủy trạng thái typing sau 3 giây
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        SocketService.sendStopTypingStatus(activeConversation._id, userId);
      }
    }, 3000);
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
    // Add the new group conversation to the list
    setConversations(prev => [newConversation, ...prev]);
    
    // Select the new conversation
    handleConversationSelect(newConversation);
    
    // Close the dialog
    setCreateGroupDialogOpen(false);
  };

  const handleOpenGroupMembers = () => {
    if (activeConversation && activeConversation.type === 'group') {
      setGroupMembersDialogOpen(true);
      handleMenuClose();
    }
  };

  const handleEditGroup = () => {
    if (activeConversation && activeConversation.type === 'group') {
      setEditGroupDialogOpen(true);
      handleMenuClose();
    }
  };

  const handleGroupUpdated = (updatedConversation) => {
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

    // Add system message about member removal
    const systemMessage = {
      type: 'system',
      systemType: 'member_removed',
      content: `${updatedConversation.lastMessage.content}`,
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

  if (showProfile) {
    return <ProfileScreen onBack={() => setShowProfile(false)} />;
  }

  if (loading.conversations) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      {/* Sidebar */}
      <Box
        sx={{
          width: 380,
          borderRight: "1px solid",
          borderColor: "divider",
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          bgcolor: "background.paper",
        }}
      >
        {/* Sidebar Header */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar
              src={user?.avatar || "/static/images/avatar/1.jpg"}
              sx={{ width: 40, height: 40, cursor: "pointer" }}
              onClick={() => handleAvatarClick(user)}
            />
            <Typography variant="h6" sx={{ ml: 2 }}>
              {user?.name || "User"}
            </Typography>
          </Box>
          <Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 1 }}>
              <IconButton 
                onClick={() => navigation.navigate('GeminiChat')}
                aria-label="Gemini AI Assistant"
                color="primary"
              >
                <Avatar
                  src="https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini_1.width-1000.format-webp.webp"
                  sx={{ width: 24, height: 24 }}
                />
              </IconButton>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                Gemini AI
              </Typography>
            </Box>
            <IconButton onClick={handleNotificationMenuOpen} id="notification-button" aria-label="Friend requests">
              <Badge badgeContent={friendRequests.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* Friend Requests Menu */}
            <Menu
              anchorEl={notificationAnchorEl}
              open={Boolean(notificationAnchorEl)}
              onClose={handleNotificationMenuClose}
              PaperProps={{
                style: {
                  width: "350px",
                  padding: "8px 0",
                },
              }}
              keepMounted={false}
              disablePortal
              MenuListProps={{
                'aria-labelledby': 'notification-button',
              }}
            >
              <Typography
                variant="h6"
                sx={{ px: 2, py: 1, fontWeight: "bold" }}
                id="notification-menu-title"
              >
                Friend Requests
              </Typography>

              {loadingRequests ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : friendRequests.length === 0 ? (
                <Typography sx={{ px: 2, py: 1, color: "text.secondary" }}>
                  No pending requests
                </Typography>
              ) : (
                friendRequests.map((request) => (
                  <MenuItem
                    key={request._id}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 1,
                      py: 2,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <Avatar
                        src={request.idUser?.avatar}
                        sx={{ width: 40, height: 40, mr: 2 }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {request.idUser?.name || "Unknown User"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Sent{" "}
                          {new Date(request.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        width: "100%",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Button
                        variant="contained"
                        size="small"
                        color="success"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const token = AuthService.getAccessToken();
                            const response = await UserService.acceptFriend(
                              userId,
                              request.idUser,
                              token
                            );
                            setFriendRequests((prev) =>
                              prev.filter((req) => req._id !== request._id)
                            );
                            setFriends((prev) => [
                              ...prev,
                              ...response.friends,
                            ]);
                            Alert.alert("Accepted", "You are now friends!");
                          } catch (error) {
                            Alert.alert("Error", "Failed to accept request");
                          }
                        }}
                        sx={{ textTransform: "none" }}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await UserService.declineFriendRequest(request._id);
                            setFriendRequests((prev) =>
                              prev.filter((req) => req._id !== request._id)
                            );
                          } catch (error) {
                            Alert.alert("Error", "Failed to decline request");
                          }
                        }}
                        sx={{ textTransform: "none" }}
                      >
                        Decline
                      </Button>
                    </Box>
                  </MenuItem>
                ))
              )}
            </Menu>
            {/* Settings Menu (original menu) */}
            <IconButton onClick={handleMenuOpen} id="settings-button" aria-label="Settings menu">
              <MoreVert />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              keepMounted={false}
              disablePortal
              MenuListProps={{
                'aria-labelledby': 'settings-button',
              }}
            >
              <MenuItem>
                <ListItemIcon>
                  {isDarkMode ? <DarkModeIcon /> : <LightModeIcon />}
                </ListItemIcon>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isDarkMode}
                      onChange={toggleTheme}
                      name="theme-toggle"
                    />
                  }
                  label={isDarkMode ? "Chế độ tối" : "Chế độ sáng"}
                  sx={{ m: 0 }}
                />
              </MenuItem>
              <MenuItem onClick={handleCreateGroup}>
                <ListItemIcon>
                  <GroupAddIcon fontSize="small" />
                </ListItemIcon>
                <Typography>Tạo nhóm mới</Typography>
              </MenuItem>
              {activeConversation && activeConversation.type === 'group' && (
                <MenuItem onClick={handleEditGroup}>
                  <ListItemIcon>
                    <EditIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography>Chỉnh sửa nhóm</Typography>
                </MenuItem>
              )}
              {activeConversation && activeConversation.type === 'group' && (
                <MenuItem onClick={handleOpenGroupMembers}>
                  <ListItemIcon>
                    <PeopleIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography>Quản lý thành viên nhóm</Typography>
                </MenuItem>
              )}
              <MenuItem onClick={() => setShowProfile(true)}>
                <ListItemIcon>
                  <Avatar sx={{ width: 24, height: 24 }} src={user.avatar} />
                </ListItemIcon>
                <Typography>Hồ sơ cá nhân</Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <ExitToAppIcon fontSize="small" />
                </ListItemIcon>
                <Typography>Đăng xuất</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            value={phone}
            onChange={handleChange}
            placeholder="Search by phone number"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              sx: { borderRadius: 3 },
            }}
          />

          {foundUser ? (
            <Paper elevation={2} sx={{ mt: 2, p: 2, borderRadius: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="subtitle1">{foundUser.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Phone: {foundUser.phone}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={async () => {
                    try {
                      const token = AuthService.getAccessToken();
                      await UserService.addFriend(foundUser, token);
                      Alert.alert(
                        "Success",
                        "Friend request sent successfully"
                      );
                      setFoundUser(null);
                      setPhone("");
                    } catch (error) {
                      Alert.alert(
                        "Error",
                        error.response?.data?.message ||
                          "Failed to send friend request"
                      );
                      console.error("Error sending friend request:", error);
                    }
                  }}
                  sx={{
                    minWidth: 120, // Give the button a consistent width
                  }}
                >
                  Add Friend
                </Button>
              </Box>
            </Paper>
          ) : (
            phone && (
              <Typography sx={{ mt: 2, color: "gray" }}>
                No user found
              </Typography>
            )
          )}
        </Box>

        {/* Chat List */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {conversations.map((conversation) => {
            const lastMessage =
              conversation?.lastMessage?.content || "No messages yet";
            const avatarIndex = conversation?._id
              ? (conversation._id.charCodeAt(0) % 5) + 1
              : 1;

            return (
              <ListItem
                key={conversation?._id || `conv-${Math.random()}`}
                onClick={() => handleConversationSelect(conversation)}
                selected={activeConversation?._id === conversation?._id}
                sx={{
                  "&:hover": { 
                    bgcolor: "action.hover",
                    transform: "translateY(-2px)",
                    transition: "transform 0.2s ease"
                  },
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  bgcolor: conversation?.unreadCount > 0 ? "rgba(25, 118, 210, 0.08)" : "transparent",
                  transition: "all 0.3s ease",
                  py: 1.5,
                  cursor: "pointer"
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
                      <Avatar
                        src={conversation.avatar || ""}
                        alt={conversation.name || "Group"}
                      >
                        {!conversation.avatar && (conversation.name?.[0] || 'G')}
                      </Avatar>
                    </Badge>
                  ) : (
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      variant="dot"
                      color="success"
                    >
                      <Avatar
                        src={
                          getOtherParticipant(conversation)?.idUser?.avatar ||
                          `/static/images/avatar/${avatarIndex}.jpg`
                        }
                      />
                    </Badge>
                  )}
                </ListItemAvatar>
                <ListItemText
                  primary={
                    conversation.type === 'group' 
                      ? conversation.name || "Group Chat"
                      : getOtherParticipant(conversation)?.idUser?.name ||
                        `User ${conversation?._id?.slice(-4) || "unknown"}`
                  }
                  secondary={
                    <Box>
                      {conversation.type === 'group' && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {conversation.members?.length || 0} members
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: 'block'
                      }}>
                        {lastMessage}
                      </Typography>
                    </Box>
                  }
                />
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {conversation?.updatedAt
                      ? new Date(conversation.updatedAt).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : ""}
                  </Typography>
                  {conversation?.unreadCount > 0 && (
                    <Box
                      sx={{
                        bgcolor: "primary.main",
                        color: "white",
                        borderRadius: "50%",
                        width: 20,
                        height: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mt: 0.5,
                      }}
                    >
                      <Typography variant="caption">
                        {conversation.unreadCount}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </ListItem>
            );
          })}
        </Box>
      </Box>

      {/* Main Chat Area */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.paper",
        }}
      >
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <AppBar
              position="static"
              color="default"
              elevation={0}
              sx={{
                borderBottom: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Toolbar>
                <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                  {activeConversation.type === 'group' ? (
                    <>
                      <Avatar
                        src={activeConversation.avatar || ''}
                        sx={{ mr: 2 }}
                      >
                        {!activeConversation.avatar && (activeConversation.name?.[0] || 'G')}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {activeConversation.name || 'Group Chat'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activeConversation.members?.length || 0} members
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Avatar
                        src={
                          getOtherParticipant(activeConversation)?.idUser?.avatar ||
                          "/static/images/avatar/2.jpg"
                        }
                        sx={{ mr: 2 }}
                      />
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {getOtherParticipant(activeConversation)?.idUser?.name ||
                            "Unknown User"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Online
                        </Typography>
                        
                        {/* Display Gemini indicator if conversation is with Gemini AI */}
                        {isGeminiConversation() && (
                          <Box sx={{ mt: 1 }}>
                            <GeminiIndicator />
                          </Box>
                        )}
                      </Box>
                    </>
                  )}
                </Box>
                <IconButton>
                  <SearchIcon />
                </IconButton>
                {activeConversation.type === 'group' && (
                  <Tooltip title="Group Members">
                    <IconButton onClick={handleOpenGroupMembers}>
                      <PeopleIcon />
                    </IconButton>
                  </Tooltip>
                )}
                <IconButton onClick={handleMenuOpen}>
                  <MoreVert />
                </IconButton>
              </Toolbar>
            </AppBar>

            {/* Pinned Message Banner - Fixed Position */}
            {activeConversation && activeConversation.type === 'group' && (
              <Box sx={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <PinnedMessageBanner 
                  conversation={activeConversation}
                  onViewAllPinned={() => setPinnedMessagesDialogOpen(true)}
                  onUnpinMessage={(messageId) => {
                    // Update the messages list to reflect the unpinned status
                    setMessages(prevMessages => 
                      prevMessages.map(msg => 
                        msg._id === messageId ? {...msg, isPinned: false} : msg
                      )
                    );
                  }}
                />
              </Box>
            )}
            
            {/* Messages */}
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                p: 2,
                bgcolor: "#f0f2f5",
                backgroundImage:
                  "url('https://web.whatsapp.com/img/bg-chat-tile-light_a4be512e7195b6b733d9110b408f075d.png')",
                backgroundRepeat: "repeat",
                backgroundSize: "410px 410px",
              }}
            >
              {/* Pinned Message Banner moved to fixed position */}

              <Container maxWidth="md" disableGutters>
                {loading.messages ? (
                  <Box display="flex" justifyContent="center" pt={4}>
                    <CircularProgress />
                  </Box>
                ) : messages.length > 0 ? (
                  <Box 
                    sx={{
                      pt: 2,
                      pb: 2,
                      px: { xs: 0.5, sm: 2 },
                      borderRadius: 2,
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                    }}
                  >
                    {messages.map((message, index) => (
                      <Box
                        key={message?._id || index}
                        sx={{
                          mb: 2,
                          display: "flex",
                          justifyContent: message.type === 'system' 
                            ? "center"
                            : (message?.sender?.toString() === userId?.toString() ||
                              message?.idUser?.toString() === userId?.toString())
                              ? "flex-end"
                              : "flex-start",
                          width: "100%",
                        }}
                      >
                        {message.type === 'system' ? (
                          // System message centered
                          <Box
                            sx={{
                              maxWidth: "80%",
                              textAlign: "center",
                            }}
                          >
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1.5,
                                borderRadius: 1,
                                bgcolor: "rgba(0, 0, 0, 0.04)",
                                width: "auto",
                                wordBreak: "break-word",
                                position: "relative",
                                boxShadow: "none",
                              }}
                            >
                              <Typography 
                                variant="body2" 
                                align="center"
                                sx={{ 
                                  color: 'text.secondary',
                                  fontSize: '0.85rem',
                                }}
                              >
                                {message?.content || message?.text}
                              </Typography>
                            </Paper>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "center",
                                mt: 0.5,
                                opacity: 0.7,
                                fontSize: '0.75rem',
                                color: 'text.secondary',
                              }}
                            >
                              {formatChatTime(message?.createdAt)}
                            </Box>
                          </Box>
                        ) : (
                          // Normal message with left/right alignment
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection:
                                (message?.sender?.toString() === userId?.toString() ||
                                message?.idUser?.toString() === userId?.toString())
                                  ? "row-reverse"
                                  : "row",
                              alignItems: "flex-end",
                              maxWidth: {
                                xs: "85%",
                                sm: "70%",
                              },
                            }}
                          >
                            {/* Hiển thị avatar bên tin nhắn của đối phương */}
                            {!(message?.sender?.toString() === userId?.toString() ||
                              message?.idUser?.toString() === userId?.toString()) && (
                              <Avatar
                                src={getOtherParticipant(activeConversation)?.idUser?.avatar ||
                                  "/static/images/avatar/2.jpg"}
                                sx={{ 
                                  width: 28, 
                                  height: 28, 
                                  mr: 1, 
                                  mb: 1,
                                  display: { xs: 'none', sm: 'flex' },
                                  cursor: 'pointer'
                                }}
                                onClick={() => handleAvatarClick(getOtherParticipant(activeConversation)?.idUser)}
                              />
                            )}
                            <Box
                              sx={{
                                maxWidth: {
                                  xs: "100%",
                                  sm: "90%",
                                },
                                minWidth: "120px",
                                position: "relative",
                                "&:hover": {
                                  "& .message-time": {
                                    opacity: 1,
                                  },
                                },
                              }}
                            >
                              <Paper
                                elevation={0}
                                sx={{
                                  p: 1.5,
                                  borderRadius: message.type === 'system' ? 1 : 2,
                                  maxWidth: (message.type === 'gif') 
                                    ? "350px" // Rộng hơn cho GIF
                                    : (message.type === 'image' || message.type === 'video' || message.type === 'file' || message.hasFile) 
                                      ? "250px" 
                                      : "100%",
                                  width: "auto",
                                  wordBreak: "break-word",
                                  bgcolor: message.type === 'system' 
                                    ? "rgba(0, 0, 0, 0.04)" // Light gray background for system messages
                                    : (message?.sender?.toString() === userId?.toString() ||
                                      message?.idUser?.toString() === userId?.toString())
                                        ? "#d9fdd3"
                                        : "white",
                                  position: "relative",
                                  boxShadow: message.type === 'system'
                                    ? "none"
                                    : ((message?.sender?.toString() === userId?.toString() ||
                                      message?.idUser?.toString() === userId?.toString())
                                      ? "0 1px 0.5px rgba(0, 0, 0, 0.13)"
                                      : "0 1px 0.5px rgba(0, 0, 0, 0.13)"),
                                  borderLeft: message.type === 'system'
                                    ? "none"
                                    : ((message?.sender?.toString() === userId?.toString() ||
                                      message?.idUser?.toString() === userId?.toString())
                                      ? "none"
                                      : "3px solid #00a884"),
                                  borderBottom: message.type === 'system'
                                    ? "none"
                                    : ((message?.sender?.toString() === userId?.toString() ||
                                      message?.idUser?.toString() === userId?.toString())
                                      ? "none"
                                      : "1px solid #f0f2f5"),
                                  '&::before': message.type === 'system' 
                                    ? {} // No pseudo-element for system messages
                                    : {
                                      content: '""',
                                      position: 'absolute',
                                      width: '12px',
                                      height: '12px',
                                      transform: 'rotate(45deg)',
                                      zIndex: 0,
                                      ...(!(message?.sender?.toString() === userId?.toString() ||
                                          message?.idUser?.toString() === userId?.toString()) && {
                                        left: '-6px',
                                        top: '10px',
                                        backgroundColor: 'white',
                                        borderLeft: '1px solid rgba(0, 0, 0, 0.1)',
                                        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                                      }),
                                      ...((message?.sender?.toString() === userId?.toString() ||
                                          message?.idUser?.toString() === userId?.toString()) && {
                                        right: '-6px',
                                        top: '10px',
                                        backgroundColor: '#d9fdd3',
                                        borderRight: '1px solid rgba(0, 0, 0, 0.1)',
                                        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                                      }),
                                    }
                                }}
                                onContextMenu={(e) => message.type !== 'system' ? handleMessageContextMenu(e, message) : null}
                                id={`message-${message?._id || index}`}
                                aria-haspopup={message.type !== 'system' ? "true" : undefined}
                              >
                                {/* Display file if message has file */}
                                {!message.isRevoked && (
                                  message.type === 'image' || message.type === 'file' || message.type === 'video' || message.type === 'audio' || 
                                  message.type === 'pdf' || message.type === 'doc' || message.type === 'excel' || message.type === 'presentation' || 
                                  message.type === 'gif' || 
                                  message.hasFile
                                ) && (
                                  <RenderFileMessage message={message} handleOpenFile={handleOpenFile} />
                                )}
                                
                                {/* Hiển thị nội dung tin nhắn */}
                                {message.isRevoked ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <UndoIcon fontSize="small" sx={{ color: 'text.disabled', mr: 1 }} />
                                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>
                                      {(message.type === 'image') 
                                        ? "Hình ảnh đã bị thu hồi" 
                                        : (message.type === 'video')
                                          ? "Video đã bị thu hồi"
                                          : (message.type === 'audio')
                                            ? "Âm thanh đã bị thu hồi"
                                            : (message.type === 'pdf')
                                              ? "Tài liệu PDF đã bị thu hồi"
                                              : (message.type === 'doc')
                                                ? "Tài liệu Word đã bị thu hồi"
                                                : (message.type === 'excel')
                                                  ? "Bảng tính Excel đã bị thu hồi"
                                                  : (message.type === 'presentation')
                                                    ? "Bài thuyết trình đã bị thu hồi"
                                                    : (message.type === 'gif')
                                                      ? "GIF đã bị thu hồi"
                                                      : (message.type === 'file')
                                                        ? "Tệp đính kèm đã bị thu hồi"
                                                        : "Tin nhắn đã bị thu hồi"}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <>
                                    {/* Hiển thị tên người gửi cho tin nhắn đối phương hoặc tin nhắn được chuyển tiếp */}
                                    {!(message?.sender?.toString() === userId?.toString() ||
                                      message?.idUser?.toString() === userId?.toString()) && (
                                      <Typography 
                                        variant="subtitle2" 
                                        sx={{ 
                                          fontSize: '0.75rem',
                                          fontWeight: 'bold', 
                                          color: '#00a884',
                                          mb: 0.5
                                        }}
                                      >
                                        {getOtherParticipant(activeConversation)?.idUser?.name || "Unknown User"}
                                      </Typography>
                                    )}
                                    
                                    {/* Hiển thị thông tin người gửi gốc nếu là tin nhắn được chuyển tiếp */}
                                    {message.isForwarded && (
                                      <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                                        <ForwardIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.85rem' }} />
                                         <Box sx={{ 
                                             display: 'flex',
                                             alignItems: 'center',
                                             fontStyle: 'italic',
                                             color: 'text.secondary',
                                             fontSize: '0.75rem' // Equivalent to caption variant
                                           }}
                                         >
                                           <Typography 
                                             variant="caption" 
                                             component="span"
                                             sx={{ fontStyle: 'italic', color: 'text.secondary' }}
                                           >
                                             Đã chuyển tiếp từ 
                                           </Typography>
                                           <Typography 
                                             variant="caption" 
                                             component="span"
                                             sx={{ fontWeight: 'bold', ml: 0.5, color: 'text.secondary' }}
                                           >
                                             {message.originalSenderName || "Unknown User"}
                                           </Typography>
                                           {message.originalSenderAvatar && (
                                             <Avatar 
                                               src={message.originalSenderAvatar} 
                                               sx={{ width: 16, height: 16, ml: 0.5 }}
                                             />
                                           )}
                                         </Box>
                                      </Box>
                                    )}
                                    
                                    {/* Nội dung tin nhắn */}
                                    {message.type === 'system' ? (
                                      // System message - centered, subtle styling like a notification
                                      <Typography 
                                        variant="body2" 
                                        align="center"
                                        sx={{ 
                                          color: 'text.secondary',
                                          fontSize: '0.85rem',
                                          px: 3,
                                          py: 1,
                                          width: '100%',
                                          maxWidth: '80%',
                                          borderRadius: '8px',
                                          bgcolor: 'rgba(0, 0, 0, 0.04)',
                                          mx: 'auto'
                                        }}
                                      >
                                        {message?.content || message?.text}
                                      </Typography>
                                    ) : (message.type === 'text' || !message.type) && (
                                      <Typography variant="body1">
                                        {message?.content || message?.text}
                                      </Typography>
                                    )}
                                  </>
                                )}
                              </Paper>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column", // Use column for system messages to center them properly
                                  alignItems: message.type === 'system' ? "center" : 
                                    (message?.sender?.toString() === userId?.toString() ||
                                    message?.idUser?.toString() === userId?.toString())
                                      ? "flex-end"
                                      : "flex-start", // Align based on sender
                                  justifyContent: message.type === 'system'
                                    ? "center" // Center system messages
                                    : (message?.sender?.toString() === userId?.toString() ||
                                      message?.idUser?.toString() === userId?.toString())
                                        ? "flex-end"
                                        : "flex-start",
                                  width: message.type === 'system' ? "100%" : "auto", // Full width for system messages
                                  mb: 1.5,
                                }}
                                key={message?._id || index}
                              >
                                {/* Message time display - special styling for system messages */}
                                {message.type === 'system' ? (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "center",
                                      mt: 0.5,
                                      opacity: 0.7,
                                      transition: "opacity 0.2s",
                                      fontSize: '0.75rem',
                                      color: 'text.secondary',
                                      width: '100%',
                                      textAlign: 'center'
                                    }}
                                  >
                                    {formatChatTime(message?.createdAt)}
                                  </Box>
                                ) : (
                                  <Box
                                    className="message-time"
                                    sx={{
                                      display: "flex",
                                      justifyContent: "flex-end",
                                      mt: 0.5,
                                      opacity: { xs: 0.7, sm: 0.5 },
                                      transition: "opacity 0.2s",
                                      fontSize: '0.75rem',
                                      color: 'text.secondary',
                                      ml: 1,
                                      mr: 1
                                    }}
                                  >
                                    {formatChatTime(message?.createdAt)}
                                    {/* Read receipt indicator - only for user's messages */}
                                    {message.type !== 'system' && (message?.sender?.toString() === userId?.toString() || 
                                      message?.idUser?.toString() === userId?.toString()) && (
                                      <Box
                                        sx={{ display: "flex", alignItems: "center", ml: 0.5 }}
                                      >
                                        {message?.seen || message?.read ? (
                                          <DoneAllIcon
                                            fontSize="small"
                                            color="primary"
                                          />
                                        ) : (
                                          <DoneAllIcon
                                            fontSize="small"
                                            color="disabled"
                                          />
                                        )}
                                      </Box>
                                    )}
                                  </Box>
                                )}
                                
                                {/* Add MessageReactions component - only for non-system messages */}
                                {!message.isRevoked && message.type !== 'system' && (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <MessageReactions 
                                      message={message} 
                                      userId={userId} 
                                      onAddReaction={handleAddReaction} 
                                    />
                                    
                                    {/* Add Pin Message Button for group chats */}
                                    {activeConversation && activeConversation.type === 'group' && (
                                      <PinMessageButton
                                        message={message}
                                        conversation={activeConversation}
                                        onPinStatusChange={(messageId, isPinned) => {
                                          // Update the messages list to reflect the pinned/unpinned status
                                          setMessages(prevMessages => 
                                            prevMessages.map(msg => 
                                              msg._id === messageId ? {...msg, isPinned: isPinned} : msg
                                            )
                                          );
                                        }}
                                      />
                                    )}
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    textAlign="center"
                    pt={4}
                  >
                    No messages yet. Start the conversation!
                  </Typography>
                )}
                <div ref={messagesEndRef} />
                
                {/* Typing indicator - Chuyển xuống cuối box chat */}
                {Object.keys(typingUsers).length > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      position: "sticky",
                      bottom: 0,
                      mt: 2,
                      mb: 1,
                      ml: 2,
                      zIndex: 1,
                    }}
                  >
                    {/* Hiển thị avatar của người đang nhập */}
                    {Object.keys(typingUsers).length === 1 && (
                      <Avatar
                        src={
                          activeConversation?.members?.find(
                            m => m.idUser?._id === Object.keys(typingUsers)[0]
                          )?.idUser?.avatar || "/static/images/avatar/2.jpg"
                        }
                        sx={{
                          width: 28,
                          height: 28,
                          mr: 1
                        }}
                      />
                    )}
                    
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1,
                        pl: 2,
                        pr: 2,
                        borderRadius: "18px 18px 18px 4px",
                        bgcolor: "rgba(230, 230, 230, 0.9)",
                        maxWidth: "75%",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.85rem' }}>
                        {Object.keys(typingUsers).length === 1 
                          ? `${typingUsers[Object.keys(typingUsers)[0]]} đang nhập...`
                          : 'Có người đang nhập...'}
                      </Typography>
                      <span className="typing-animation">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </span>
                    </Paper>
                  </Box>
                )}
              </Container>
            </Box>

            {/* Message Input */}
            <Box
              sx={{
                p: 2,
                borderTop: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                position: "sticky", 
                bottom: 0,
                zIndex: 5,
                boxShadow: "0px -1px 4px rgba(0, 0, 0, 0.05)",
              }}
            >
              <Container maxWidth="md" disableGutters>
                {selectedFilePreview && (
                  <Box 
                    sx={{ 
                      mb: 2, 
                      position: 'relative',
                      display: 'inline-block', 
                      borderRadius: 2,
                      overflow: 'hidden',
                      boxShadow: 2
                    }}
                  >
                    <img 
                      src={selectedFilePreview} 
                      alt="Selected file preview" 
                      style={{ 
                        maxHeight: '200px',
                        maxWidth: '100%',
                        display: 'block'
                      }} 
                    />
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.7)'
                        }
                      }}
                      onClick={handleCancelFileSelection}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
                
                {selectedFile && !selectedFilePreview && (
                  <Box 
                    sx={{ 
                      mb: 2, 
                      position: 'relative',
                      display: 'inline-block', 
                      borderRadius: 2,
                      padding: 2,
                      backgroundColor: 'rgba(0,0,0,0.04)',
                      minWidth: 200
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {selectedFile.type.startsWith('video/') ? (
                        <VideocamIcon fontSize="large" sx={{ mr: 2, color: '#f44336' }} />
                      ) : selectedFile.type.startsWith('audio/') ? (
                        <AudiotrackIcon fontSize="large" sx={{ mr: 2, color: '#9c27b0' }} />
                      ) : selectedFile.type.includes('pdf') ? (
                        <PictureAsPdfIcon fontSize="large" sx={{ mr: 2, color: '#f44336' }} />
                      ) : selectedFile.type.includes('word') || selectedFile.type.includes('document') ? (
                        <DescriptionIcon fontSize="large" sx={{ mr: 2, color: '#2196f3' }} />
                      ) : selectedFile.type.includes('excel') || selectedFile.type.includes('sheet') ? (
                        <TableChartIcon fontSize="large" sx={{ mr: 2, color: '#4caf50' }} />
                      ) : (
                        <InsertDriveFileIcon fontSize="large" sx={{ mr: 2, color: '#607d8b' }} />
                      )}
                      <Box sx={{ overflow: 'hidden' }}>
                        <Typography noWrap variant="body2" sx={{ fontWeight: 'medium', maxWidth: '180px' }}>
                          {selectedFile.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </Typography>
                      </Box>
                    </Box>
                    
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(0,0,0,0.1)',
                        color: 'text.secondary',
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.2)'
                        }
                      }}
                      onClick={handleCancelFileSelection}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
                
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <IconButton onClick={handleEmojiOpen} aria-label="Emoji">
                    <MoodIcon />
                  </IconButton>
                  
                  <IconButton 
                    onClick={handleTabChange}
                    aria-label="GIF" 
                    sx={{ color: activeTab === 'gif' ? 'primary.main' : 'inherit' }}
                  >
                    <GifIcon />
                  </IconButton>
                  
                  {/* File input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                  />
                  <IconButton 
                    onClick={(event) => {
                      setAttachMenuAnchorEl(event.currentTarget);
                      setAttachMenuOpen(true);
                    }}
                    aria-controls={attachMenuOpen ? 'attach-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={attachMenuOpen ? 'true' : undefined}
                  >
                    <AttachFileIcon />
                  </IconButton>
                  
                  {/* Menu cho loại file đính kèm */}
                  <Menu
                    id="attach-menu"
                    anchorEl={attachMenuAnchorEl}
                    open={Boolean(attachMenuAnchorEl)}
                    onClose={() => setAttachMenuAnchorEl(null)}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'center',
                    }}
                    transformOrigin={{
                      vertical: 'bottom',
                      horizontal: 'center',
                    }}
                  >
                    <MenuItem onClick={() => {
                      fileInputRef.current.accept = "image/*";
                      fileInputRef.current.click();
                      setAttachMenuAnchorEl(null);
                    }}>
                      <ListItemIcon>
                        <PhotoIcon fontSize="small" sx={{ color: '#4caf50' }} />
                      </ListItemIcon>
                      <Typography>Hình ảnh</Typography>
                    </MenuItem>
                    <MenuItem onClick={() => {
                      fileInputRef.current.accept = "video/*";
                      fileInputRef.current.click();
                      setAttachMenuAnchorEl(null);
                    }}>
                      <ListItemIcon>
                        <VideocamIcon fontSize="small" sx={{ color: '#f44336' }} />
                      </ListItemIcon>
                      <Typography>Video</Typography>
                    </MenuItem>
                    <MenuItem onClick={() => {
                      fileInputRef.current.accept = "application/pdf";
                      fileInputRef.current.click();
                      setAttachMenuAnchorEl(null);
                    }}>
                      <ListItemIcon>
                        <PictureAsPdfIcon fontSize="small" sx={{ color: '#f44336' }} />
                      </ListItemIcon>
                      <Typography>PDF</Typography>
                    </MenuItem>
                    <MenuItem onClick={() => {
                      fileInputRef.current.accept = "application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                      fileInputRef.current.click();
                      setAttachMenuAnchorEl(null);
                    }}>
                      <ListItemIcon>
                        <DescriptionIcon fontSize="small" sx={{ color: '#2196f3' }} />
                      </ListItemIcon>
                      <Typography>Word</Typography>
                    </MenuItem>
                    <MenuItem onClick={() => {
                      fileInputRef.current.accept = "application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                      fileInputRef.current.click();
                      setAttachMenuAnchorEl(null);
                    }}>
                      <ListItemIcon>
                        <TableChartIcon fontSize="small" sx={{ color: '#4caf50' }} />
                      </ListItemIcon>
                      <Typography>Excel</Typography>
                    </MenuItem>
                    <MenuItem onClick={() => {
                      fileInputRef.current.accept = "*";
                      fileInputRef.current.click();
                      setAttachMenuAnchorEl(null);
                    }}>
                      <ListItemIcon>
                        <AttachFileIcon fontSize="small" sx={{ color: '#607d8b' }} />
                      </ListItemIcon>
                      <Typography>Tệp khác</Typography>
                    </MenuItem>
                  </Menu>
                  
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder={selectedFile ? 
                      (selectedFile.type.startsWith('image/') ? "Thêm chú thích cho ảnh (không bắt buộc)..." : "Thêm mô tả cho file...") : 
                      "Nhập tin nhắn..."}
                    multiline
                    maxRows={4}
                    value={newMessage}
                    onChange={handleMessageTyping}
                    onKeyPress={handleKeyPress}
                    inputRef={inputRef}
                    sx={{
                      flex: "1 1 auto",
                      minWidth: 0,
                      mx: 1,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "24px",
                        bgcolor: "background.default",
                        width: "100%"
                      },
                      "& .MuiInputBase-input": {
                        width: "100%"
                      }
                    }}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!selectedFile && !newMessage.trim()}
                    sx={{
                      bgcolor: "primary.main",
                      color: "white",
                      "&:hover": { bgcolor: "primary.dark" },
                      "&:disabled": { bgcolor: "action.disabledBackground" },
                    }}
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
              </Container>
            </Box>

            {/* Emoji Picker */}
            <Popover
              open={showEmojiPicker || showGifGallery}
              anchorEl={emojiAnchorEl}
              onClose={handleEmojiClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted={false}
              disablePortal
              aria-labelledby="emoji-picker-title"
              PaperProps={{
                sx: {
                  overflow: 'hidden',
                  borderRadius: 1,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }
              }}
            >
              {/* Content based on active tab */}
              {activeTab === 'emoji' && (
                <Box sx={{ p: 2, width: 280, height: 200, overflow: 'auto', bgcolor: 'background.paper' }}>
                  <Typography id="emoji-picker-title" variant="subtitle2" sx={{ mb: 1 }}>
                    Chọn emoji
                  </Typography>
                  <Grid container spacing={1}>
                    {emojis.map((emoji, index) => (
                      <Grid item key={index}>
                        <IconButton 
                          onClick={() => {
                            insertEmoji(emoji);
                            handleEmojiClose();
                          }}
                          size="small"
                          sx={{ fontSize: '1.5rem' }}
                          aria-label={`Emoji ${emoji}`}
                        >
                          {emoji}
                        </IconButton>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
              
              {activeTab === 'gif' && (
                <GifGallery
                  onSelectGif={handleSendGif}
                  onClose={handleEmojiClose}
                />
              )}
            </Popover>
          </>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Select a conversation to start chatting
            </Typography>
          </Box>
        )}
      </Box>

      {/* Menu ngữ cảnh cho tin nhắn */}
      <Menu
        anchorEl={messageContextMenu}
        open={Boolean(messageContextMenu)}
        onClose={handleMessageContextMenuClose}
        keepMounted={false}
        disablePortal
        MenuListProps={{
          'aria-labelledby': selectedMessage ? `message-${selectedMessage._id || 'temp'}` : undefined,
        }}
      >
        {/* Chỉ hiển thị tùy chọn thu hồi và xóa cho tin nhắn của chính mình */}
        {(selectedMessage?.sender?.toString() === userId?.toString() || 
         selectedMessage?.idUser?.toString() === userId?.toString()) && (
          <>
            <MenuItem onClick={handleRevokeMessage}>
              <UndoIcon fontSize="small" sx={{ mr: 1 }} />
              Thu hồi tin nhắn
            </MenuItem>
            <MenuItem onClick={handleDeleteMessage}>
              <DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} />
              Xoá tin nhắn (chỉ ở phía bạn)
            </MenuItem>
          </>
        )}
        
        {/* Luôn hiển thị tùy chọn chuyển tiếp cho mọi tin nhắn */}
        <MenuItem onClick={handleForwardMessage}>
          <ShareIcon fontSize="small" sx={{ mr: 1 }} />
          Chuyển tiếp tin nhắn
        </MenuItem>
      </Menu>
      
      {/* Dialog chọn cuộc trò chuyện để chuyển tiếp tin nhắn */}
      <Dialog
        open={forwardDialogOpen}
        onClose={handleCloseForwardDialog}
        aria-labelledby="forward-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="forward-dialog-title">Chuyển tiếp tin nhắn</DialogTitle>
        <DialogContent>
          {/* Hiển thị thông tin tin nhắn được chuyển tiếp */}
          {selectedMessage && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                Tin nhắn được chuyển tiếp:
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar 
                  src={selectedMessage.sender?.toString() === userId?.toString() ? 
                    user.avatar : 
                    getOtherParticipant(activeConversation)?.idUser?.avatar || ''}
                  sx={{ width: 24, height: 24, mr: 1 }}
                />
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {selectedMessage.sender?.toString() === userId?.toString() ? 
                    user.name : 
                    getOtherParticipant(activeConversation)?.idUser?.name || 'Unknown User'}
                </Typography>
              </Box>
              
              <Box sx={{ pl: 4 }}>
                {(selectedMessage.type === 'text' || !selectedMessage.type) && (
                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                    {selectedMessage?.content || selectedMessage?.text}
                  </Typography>
                )}
                
                {(selectedMessage.type === 'image' || selectedMessage.type === 'file' || selectedMessage.type === 'video' || 
                 selectedMessage.type === 'audio' || selectedMessage.type === 'pdf' || selectedMessage.type === 'doc' || 
                 selectedMessage.type === 'excel' || selectedMessage.type === 'presentation' || selectedMessage.type === 'gif' || selectedMessage.hasFile) && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                    <AttachFileIcon fontSize="small" sx={{ mr: 0.5 }} />
                    {selectedMessage.type === 'image' ? 'Hình ảnh' : 
                     selectedMessage.type === 'video' ? 'Video' : 
                     selectedMessage.type === 'audio' ? 'Âm thanh' : 
                     selectedMessage.type === 'pdf' ? 'Tài liệu PDF' : 
                     selectedMessage.type === 'doc' ? 'Tài liệu Word' : 
                     selectedMessage.type === 'excel' ? 'Bảng tính Excel' : 
                     selectedMessage.type === 'presentation' ? 'Bài thuyết trình' : 
                     selectedMessage.type === 'gif' ? 'GIF' : 
                     'Tệp đính kèm'}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        
        <DialogContentText>
          Chọn cuộc trò chuyện để chuyển tiếp tin nhắn này
        </DialogContentText>
        
        <Box sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
          <List>
            {conversations.map((conversation) => {
              const lastMessage =
                conversation?.lastMessage?.content || "No messages yet";
              return (
                <ListItem
                  key={conversation._id}
                  button
                  onClick={() => handleSelectForwardConversation(conversation)}
                  selected={targetConversation && targetConversation._id === conversation._id}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    bgcolor:
                      targetConversation && targetConversation._id === conversation._id
                        ? "action.selected"
                        : "transparent",
                  }}
                >
                  {conversation.type === 'group' ? (
                    <ListItemAvatar>
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
                          src={conversation.avatar || ""}
                          alt={conversation.name || "Group"}
                        >
                          {!conversation.avatar && (conversation.name?.[0] || 'G')}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                  ) : (
                    <ListItemAvatar>
                      <Avatar
                        src={getOtherParticipant(conversation)?.idUser?.avatar || ""}
                        alt={getOtherParticipant(conversation)?.idUser?.name || "User"}
                      />
                    </ListItemAvatar>
                  )}
                  <ListItemText
                    primary={
                      conversation.type === 'group' 
                        ? conversation.name || "Group Chat"
                        : getOtherParticipant(conversation)?.idUser?.name || "Unknown User"
                    }
                    secondary={
                      <>
                        {conversation.type === 'group' && (
                          <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block', mb: 0.5 }}>
                            {conversation.members?.length || 0} members
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" component="span">
                          {lastMessage.length > 30
                            ? `${lastMessage.substring(0, 30)}...`
                            : lastMessage}
                        </Typography>
                      </>
                    }
                  />       
                </ListItem>
              );
            })}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseForwardDialog}>Hủy</Button>
        <Button
          onClick={handleConfirmForward}
          color="primary"
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
    </Box>
  );
};



export default ChatUI;

