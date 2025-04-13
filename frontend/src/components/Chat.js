import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/chat';
import { getSocket, socketEvents } from '../services/socket';

const Chat = ({ selectedFriend }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingStatus, setTypingStatus] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (selectedFriend) {
      loadMessages();
      setupSocketListeners();
      chatService.joinConversation(selectedFriend.id);
    }

    return () => {
      if (selectedFriend) {
        chatService.leaveConversation(selectedFriend.id);
      }
    };
  }, [selectedFriend]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await chatService.getMessages(selectedFriend.id);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const setupSocketListeners = () => {
    const socket = getSocket();
    if (!socket) return;

    socket.on(socketEvents.NEW_MESSAGE, (message) => {
      if (message.senderId === selectedFriend.id) {
        setMessages(prev => [...prev, message]);
      }
    });

    socket.on(socketEvents.TYPING_START, ({ userId }) => {
      if (userId === selectedFriend.id) {
        setTypingStatus(`${selectedFriend.name} đang soạn tin nhắn...`);
      }
    });

    socket.on(socketEvents.TYPING_END, ({ userId }) => {
      if (userId === selectedFriend.id) {
        setTypingStatus('');
      }
    });

    socket.on(socketEvents.MESSAGE_DELIVERED, ({ messageId }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: 'delivered' } : msg
      ));
    });

    socket.on(socketEvents.MESSAGE_READ, ({ messageId }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: 'read' } : msg
      ));
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const message = await chatService.sendMessage(
        selectedFriend.id,
        newMessage,
        'text'
      );
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const uploadResponse = await chatService.uploadFile(file);
      const message = await chatService.sendMessage(
        selectedFriend.id,
        uploadResponse.url,
        'file'
      );
      setMessages(prev => [...prev, message]);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleTyping = () => {
    const socket = getSocket();
    if (!socket || !selectedFriend) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit(socketEvents.TYPING_START, { userId: selectedFriend.id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit(socketEvents.TYPING_END, { userId: selectedFriend.id });
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!selectedFriend) {
    return <div className="chat-placeholder">Chọn một người bạn để bắt đầu trò chuyện</div>;
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <img src={selectedFriend.avatar} alt={selectedFriend.name} />
        <div className="friend-info">
          <span className="friend-name">{selectedFriend.name}</span>
          <span className={`status ${selectedFriend.status}`}>
            {selectedFriend.status === 'online' ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="messages-container">
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`message ${message.senderId === selectedFriend.id ? 'received' : 'sent'}`}
          >
            {message.type === 'text' ? (
              <div className="message-content">{message.content}</div>
            ) : (
              <div className="file-message">
                <a href={message.content} target="_blank" rel="noopener noreferrer">
                  Tải xuống file
                </a>
              </div>
            )}
            <div className="message-status">
              {message.status === 'read' ? 'Đã đọc' : 
               message.status === 'delivered' ? 'Đã gửi' : ''}
            </div>
          </div>
        ))}
        {typingStatus && (
          <div className="typing-indicator">{typingStatus}</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Nhập tin nhắn..."
        />
        <label className="file-upload">
          <input type="file" onChange={handleFileUpload} />
          <span>📎</span>
        </label>
        <button type="submit">Gửi</button>
      </form>
    </div>
  );
};

export default Chat; 