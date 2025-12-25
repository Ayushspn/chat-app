
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
const socket = io('http://localhost:5000');
function Chat() {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);

  useEffect(() => {
    console.log('Chat component mounted');
    socket.on('receive_message', (data) => {
      setChatLog((prev) => [...prev, data]);
    });
  }, []);

  const sendMessage = () => {
    socket.emit('send_message', { text: message });
    setMessage('');
    window.dispatchEvent(new Event('new-message'));
  };

  return (
    <div>
      <h2>Chat</h2>
      {/* <div>
        {chatLog.map((msg, i) => (
          <p key={i}>{msg.text}</p>
        ))}
      </div> */}
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default Chat;