import React, { useState, useRef, useEffect } from "react";
import { Alert } from "react-native";
import { useRoute } from "@react-navigation/native";
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
} from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import {
  Send as SendIcon,
  MoreVert as MoreVert,
  AttachFile as AttachFileIcon,
  Mood as MoodIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import ProfileScreen from "./ProfileScreen";
import ChatService from "../services/ChatService";
import UserService from "../services/UserService";
import AuthService from "../services/AuthService";

const ChatUI = () => {
  const route = useRoute();
  const { userId } = route.params || {};
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

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!userId) {
          throw new Error("User ID not found");
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

      setMessages(msgs);
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

  // Clear on send
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation?._id) return;

    // Create a temporary message with all required fields
    const tempMessage = {
      id: `temp-${Date.now()}`, // Temporary ID
      text: newMessage,
      sender: "me",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAt: new Date().toISOString(),
      read: false,
      status: "sending",
    };

    // Immediately add to UI
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    try {
      const token = AuthService.getAccessToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const messageData = {
        idConversation: activeConversation._id,
        content: newMessage,
        type: "text",
        sender: userId,
      };

      const sentMessage = await ChatService.sendMessage(messageData, token);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id
            ? {
                ...msg,
                id: sentMessage._id,
                status: "delivered",
              }
            : msg
        )
      );
    } catch (error) {
      // Update status if failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id ? { ...msg, status: "failed" } : msg
        )
      );
      console.error("Error sending message:", error);
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
    console.log(conversation?.id);
    if (!conversation?._id) return;
    setActiveConversation(conversation);
    await loadMessages(conversation._id);
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
              onClick={() => setShowProfile(true)}
            />
            <Typography variant="h6" sx={{ ml: 2 }}>
              Chats
            </Typography>
          </Box>
          <Box>
            <IconButton onClick={handleNotificationMenuOpen}>
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
            >
              <Typography
                variant="h6"
                sx={{ px: 2, py: 1, fontWeight: "bold" }}
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
            <IconButton onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleMenuClose}>New group</MenuItem>
              <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
              <MenuItem onClick={handleMenuClose}>Logout</MenuItem>
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
            const otherParticipant = getOtherParticipant(conversation);
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
                  "&:hover": { bgcolor: "action.hover" },
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <ListItemAvatar>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    variant="dot"
                    color="success"
                  >
                    <Avatar
                      src={
                        otherParticipant?.idUser?.avatar ||
                        `/static/images/avatar/${avatarIndex}.jpg`
                      }
                    />
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    otherParticipant?.idUser?.name ||
                    `User ${conversation?._id?.slice(-4) || "unknown"}`
                  }
                  secondary={lastMessage}
                  secondaryTypographyProps={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
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
                  </Box>
                </Box>
                <IconButton>
                  <SearchIcon />
                </IconButton>
                <IconButton>
                  <MoreVert />
                </IconButton>
              </Toolbar>
            </AppBar>

            {/* Messages */}
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                p: 2,
                bgcolor: "background.default",
                backgroundImage:
                  "url('https://web.whatsapp.com/img/bg-chat-tile-light_a4be512e7195b6b733d9110b408f075d.png')",
                backgroundRepeat: "repeat",
                backgroundSize: "410px 410px",
              }}
            >
              <Container maxWidth="md" disableGutters>
                {loading.messages ? (
                  <Box display="flex" justifyContent="center" pt={4}>
                    <CircularProgress />
                  </Box>
                ) : messages.length > 0 ? (
                  messages.map((message) => (
                    <Box
                      key={message._id}
                      sx={{
                        display: "flex",
                        justifyContent:
                          message.sender.toString() === userId.toString()
                            ? "flex-end"
                            : "flex-start",
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          maxWidth: "75%",
                        }}
                      >
                        {message.sender.toString() !== userId.toString() && (
                          <Avatar
                            src={
                              getOtherParticipant(activeConversation)?.idUser
                                ?.avatar || "/static/images/avatar/2.jpg"
                            }
                            sx={{ mr: 1, alignSelf: "flex-end" }}
                          />
                        )}
                        <Box>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1.5,
                              borderRadius:
                                message?.sender.toString() === userId.toString()
                                  ? "18px 4px 18px 18px"
                                  : "4px 18px 18px 18px",
                              bgcolor:
                                message?.sender.toString() === userId.toString()
                                  ? "#d9fdd3"
                                  : "white",
                              position: "relative",
                            }}
                          >
                            <Typography variant="body1">
                              {message?.content}
                            </Typography>
                          </Paper>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent:
                                message?.sender.toString() === userId.toString()
                                  ? "flex-end"
                                  : "flex-start",
                              mt: 0.5,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mr: 1 }}
                            >
                              {formatChatTime(message?.createdAt)}
                            </Typography>
                            {message?.sender.toString() ===
                              userId.toString() && (
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                {message?.seen ? (
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
                        </Box>
                      </Box>
                    </Box>
                  ))
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
              </Container>
            </Box>

            {/* Message Input */}
            <Box
              sx={{
                p: 2,
                borderTop: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Container maxWidth="md" disableGutters>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <IconButton>
                    <MoodIcon />
                  </IconButton>
                  <IconButton>
                    <AttachFileIcon />
                  </IconButton>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Type a message..."
                    multiline
                    maxRows={4}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    inputRef={inputRef}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "24px",
                        bgcolor: "background.default",
                      },
                    }}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
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
    </Box>
  );
};

export default ChatUI;
