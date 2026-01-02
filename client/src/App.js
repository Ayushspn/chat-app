import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login/Login';
import Registration from './components/Registration/Registration';
import UserList from './components/UserList/UserList';
import Chat from './components/chat/Chat';
import Header from './components/Header/Header';
// auth is handled via `useAuth` hook directly (no context/provider)

const App = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/login" element={<Login />} />
        <Route path="/user-list" element={<UserList />} />
        <Route path="/chat/:userId" element={<Chat />} />
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </Router>
  );
};

export default App;