import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import parseJwt from '../../utils/parseJwt';
import './Chat.css';
import { API_BASE, SOCKET_URL } from '../../config';

const socket = io(SOCKET_URL);

function Chat() {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [previousData, setPreviousData] = useState(null);
  const [recipientName, setRecipientName] = useState('');
  const messagesEndRef = useRef(null);

  const { userId: routeParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const currentUserId = token ? parseJwt(token).userId : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatLog, previousData]);

  useEffect(() => {
    socket.on('receive_message', (data) => {
      console.log('Message received:', data);
      setChatLog((prev) => [...prev, data]);
    });

    if (routeParam) {
      socket.on('connect', () => console.log('socket connected', socket.id));
      setIsChatStarted(true);
    }

    return () => {
      socket.off('receive_message');
      if (routeParam) {
        socket.emit('leave_room', { roomId: routeParam, userId: currentUserId });
      }
    };
  }, [routeParam, currentUserId]);

  useEffect(() => {
    const handleNewMessage = async () => {
      if (!routeParam) return;
      try {
        const res = await fetch(`${API_BASE}/chatrooms/${routeParam}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch room');
        const data = await res.json();
        console.log('New message event detected', data);
        setPreviousData(data);
        
        // Set recipient name from the room data
        if (data.participants && Array.isArray(data.participants)) {
          const recipient = data.participants.find(participant => {
            const participantId = typeof participant === 'object' ? participant._id : participant;
            return participantId !== currentUserId;
          });
          
          if (recipient) {
            const recipientUsername = typeof recipient === 'object' ? recipient.username : recipient;
            setRecipientName(recipientUsername);
          } else {
            setRecipientName('User');
          }
        }
      } catch (err) {
        console.error('Error fetching room data:', err);
      }
    };
    handleNewMessage();
  }, [routeParam, token, currentUserId]);

  const sendMessage = () => {
    if (!message.trim()) return;
    
    const selectedUserId = routeParam;
    socket.emit('send_message', { text: message, selectedUserId, token });
    
    // Add message to local chat log immediately
    setChatLog((prev) => [...prev, { text: message, sender: currentUserId }]);
    setMessage('');
    window.dispatchEvent(new Event('new-message'));
  };

  const startChat = async () => {
    try {
      if (routeParam) {
        socket.emit('join_room', { roomId: routeParam, userId: currentUserId });
        return;
      }

      const otherUserId = location.state?.userId;
      const res = await fetch(`${API_BASE}/chatrooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({ otherUserId: currentUserId === otherUserId ? null : otherUserId }),
      });

      if (!res.ok) throw new Error('Failed to create room');
      const { roomId } = await res.json();

      navigate(`/chat/${roomId}`, { replace: true });
      socket.emit('join_room', { roomId, userId: currentUserId });
    } catch (err) {
      console.error('Failed to start chat', err);
      setIsChatStarted(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-wrapper">
        <div className="chat-header">
          <div className="chat-info">
            <div className="chat-recipient">{recipientName || 'Chat'}</div>
            <div className="chat-status">{isChatStarted ? 'Active' : 'Offline'}</div>
          </div>
          {!isChatStarted && (
            <button className="start-chat-button" onClick={startChat}>
              Start Chat
            </button>
          )}
        </div>

        <div className="chat-messages">
          {!isChatStarted ? (
            <div className="empty-chat">
              <div className="empty-chat-icon">💬</div>
              <p>Start a conversation</p>
              <p style={{ fontSize: '12px', opacity: '0.7' }}>Click the button above to begin</p>
            </div>
          ) : previousData && previousData?.messages?.length > 0 ? (
            <>
              {previousData.messages.map((msg, index) => {
                const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
                const isSent = senderId === currentUserId;
                return (
                  <div key={index} className={`message ${isSent ? 'sent' : 'received'}`}>
                    <div>
                      <div className="message-sender">
                        {isSent ? 'You' : 'Recipient'}
                      </div>
                      <div className="message-bubble">{msg.text}</div>
                    </div>
                  </div>
                );
              })}
              {chatLog.map((msg, index) => {
                const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
                const isSent = senderId === currentUserId;
                return (
                  <div key={`new-${index}`} className={`message ${isSent ? 'sent' : 'received'}`}>
                    <div>
                      <div className="message-sender">
                        {isSent ? 'You' : 'Recipient'}
                      </div>
                      <div className="message-bubble">{msg.text}</div>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="empty-chat">
              <div className="empty-chat-icon">👋</div>
              <p>No messages yet</p>
              <p style={{ fontSize: '12px', opacity: '0.7' }}>Start typing to begin the conversation</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {isChatStarted && (
          <div className="chat-footer">
            <div className="chat-input-wrapper">
              <input
                type="text"
                className="chat-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
              />
              <button className="chat-button" onClick={sendMessage}>
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;