import React, { useState, useEffect, use } from 'react';
import io from 'socket.io-client';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import parseJwt from '../../utils/parseJwt';
const socket = io('http://localhost:5000');
function Chat() {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [previousData, setPreviousData] = useState(null);

  const { userId: routeParam } = useParams(); // routeParam may contain a roomId
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const currentUserId = token ? parseJwt(token).userId : null;


  useEffect(() => {
    console.log('Chat component mounted');
    console.log('Current User ID:', routeParam);
    socket.on('receive_message', (data) => {
      console.log('Message received:', data);
      setChatLog((prev) => [...prev, data]);
    });
    // If a room id is present in the URL, join that room automatically
    if (routeParam) {
      socket.on('connect', () => console.log('socket connected', socket.id));
    //  socket.emit('join_room', { roomId: routeParam, userId: currentUserId });
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
        const res = await fetch(`http://localhost:5000/chatrooms/${routeParam}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch room');
        const data = await res.json();
        console.log('New message event detected', data);
        setPreviousData(data);
      } catch (err) {
        console.error('Error fetching room data:', err);
      }
    };
    handleNewMessage();
  }, [routeParam, token]);

  const sendMessage = () => {
    const roomId = routeParam; // send to current room (roomId stored in URL)
    socket.emit('send_message', { text: message, roomId });
    setMessage('');
    window.dispatchEvent(new Event('new-message'));
  };

  const startChat = async () => {
    // if (isChatStarted) return;
    // setIsChatStarted(true);

    try {
      // If we already have a room id in the URL, just ensure we joined it
      if (routeParam) {
        socket.emit('join_room', { roomId: routeParam, userId: currentUserId });
        return;
      }

      // Otherwise create a room via backend API. We try to include another participant
      // if it was passed via location.state (for example when navigating from UserList)
      const otherUserId = location.state?.userId;
      const participants = otherUserId ? [currentUserId, otherUserId] : [currentUserId];

      const res = await fetch('http://localhost:5000/chatrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({ otherUserId: currentUserId === otherUserId ? null : otherUserId }),
      });

      if (!res.ok) throw new Error('Failed to create room');
      const { roomId } = await res.json();

      // Navigate to the new room URL so routeParam updates and component joins automatically
      navigate(`/chat/${roomId}`, { replace: true });
      // also emit join in case the server expects it right away
      socket.emit('join_room', { roomId, userId: currentUserId });
    } catch (err) {
      console.error('Failed to start chat', err);
      setIsChatStarted(false);
    }
  };

  return (
    <div>
      <h2>Chat</h2>
      <button onClick={startChat}>Start Chat</button>
      <input
        type="text"
        disabled={!isChatStarted}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type message..."
      />
      <button onClick={sendMessage}>Send</button>
      <div className="chat-log">
        {previousData && previousData?.messages.map((msg, index) => (
          <div key={index}> 
            <strong>{msg.senderId === currentUserId ? 'You' : msg.senderId}:</strong> {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Chat;