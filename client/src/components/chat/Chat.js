import React, { useState, useEffect, useRef } from 'react';
import useSocket from '../../hooks/useSocket';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import parseJwt from '../../utils/parseJwt';
import './Chat.css';
import { API_BASE } from '../../config';



function Chat() {
  const { socket, on, off, emit, emitWithAck, joinRoom, leaveRoom, connected } = useSocket();
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [previousData, setPreviousData] = useState(null);
  const [recipientName, setRecipientName] = useState('');
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const localTypingRef = useRef(false);

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
    // incoming messages
    on('receive_message', (data) => {
      setChatLog((prev) => [...prev, data]);
    });

    // typing events from other user
    const handleTyping = (data) => {
      if (data.userId === currentUserId) return;
      setIsRecipientTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsRecipientTyping(false), 2500);
    };
    on('typing', handleTyping);

    // message status updates (delivered/read)
    const handleStatus = (statusUpdate) => {
      setChatLog((prev) => prev.map((m) => {
        if (!m) return m;
        if (statusUpdate.tempId && m.tempId === statusUpdate.tempId) {
          return { ...m, status: statusUpdate.status, serverId: statusUpdate.messageId || m.serverId };
        }
        if (statusUpdate.serverId && m.serverId === statusUpdate.serverId) {
          return { ...m, status: statusUpdate.status };
        }
        return m;
      }));
    };
    on('message_status', handleStatus);

    if (routeParam) {
      on('connect', () => console.log('socket connected', socket.id));
      setIsChatStarted(true);
    }

    return () => {
      off('receive_message');
      off('typing', handleTyping);
      off('message_status', handleStatus);
      if (routeParam) {
        emit('leave_room', { roomId: routeParam, userId: currentUserId });
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

    // optimistic message object with temporary id and status
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const localMsg = { tempId, text: message, sender: currentUserId, status: 'sending', createdAt: Date.now() };
    setChatLog((prev) => [...prev, localMsg]);
    setMessage('');
    window.dispatchEvent(new Event('new-message'));

    // emit with ack — server should return { ok: true, messageId }
    emitWithAck('send_message', { text: localMsg.text, selectedUserId, token, tempId })
      .then((res) => {
        if (res && res.ok) {
          setChatLog((prev) => prev.map((m) => (m.tempId === tempId ? { ...m, status: 'sent', serverId: res.messageId } : m)));
        } else {
          setChatLog((prev) => prev.map((m) => (m.tempId === tempId ? { ...m, status: 'failed' } : m)));
        }
      })
      .catch(() => {
        setChatLog((prev) => prev.map((m) => (m.tempId === tempId ? { ...m, status: 'failed' } : m)));
      });
  };

  const startChat = async () => {
    try {
      if (routeParam) {
        joinRoom(routeParam, currentUserId);
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
      joinRoom(roomId, currentUserId);
    } catch (err) {
      console.error('Failed to start chat', err);
      setIsChatStarted(false);
    }
  };

  const handleInputChange = (e) => {
    const v = e.target.value;
    setMessage(v);
    if (!routeParam) return;
    // send typing event (debounced)
    if (!localTypingRef.current) {
      emit('typing', { roomId: routeParam, userId: currentUserId });
      localTypingRef.current = true;
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      localTypingRef.current = false;
      emit('stop_typing', { roomId: routeParam, userId: currentUserId });
    }, 1500);
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
            <div className="chat-status">{isChatStarted ? (isRecipientTyping ? 'typing...' : (connected ? 'Active' : 'Connecting...')) : 'Offline'}</div>
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
                      <div className="message-bubble">{msg.text}
                        {isSent && msg.status && (
                          <div className="message-status">{msg.status}</div>
                        )}
                      </div>
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
                onChange={handleInputChange}
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