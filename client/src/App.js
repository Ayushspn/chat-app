import Chat from './components/chat/Chat';
import React, { useState, useEffect } from 'react';
import ChatHistory from './components/chat-history/ChatHistory';
import Register from './components/Registration/Registration';
import Login from './components/Login/Login';
import UserList from './components/UserList/UserList';
function App() {
  //  const [chatLog, setChatLog] = useState([]);

  // useEffect(() => {
  //   fetch('http://localhost:5000/messages')
  //     .then((res) => res.json())
  //     .then((data) => setChatLog(data))
  //     .catch((err) => console.error('Error fetching messages:', err));
  // }, []);

  return (
    <div className="App" style={{ display: 'flex'}}>
      {/* <ChatHistory style={{ flex: 1, width: '50vw' }} />
      <Chat style={{ flex: 2 }} /> */}
      <Register></Register>
      <Login></Login>
      <UserList></UserList>
    </div>
  );
}

export default App;