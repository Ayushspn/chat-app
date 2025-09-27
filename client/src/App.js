// Chat.js
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';


const socket = io('http://localhost:5000');

function App() {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);

  useEffect(() => {
    socket.on('receive_message', (data) => {
      console.log(data)
      setChatLog((prev) => [...prev, data]);
    });
  }, []);

  const sendMessage = () => {
    socket.emit('send_message', { text: message });
    setMessage('');
  };

  return (
    <div>
      <h2>Chat</h2>
      <div>
        {chatLog.map((msg, i) => (
          <p key={i}>{msg.text}</p>
        ))}
      </div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;