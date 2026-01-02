import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import useAuth from '../../hooks/useAuth';

const Header = () => {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="brand">
        <Link to="/" className="logo">ChatApp</Link>
      </div>
      <nav className="nav">
        <Link to="/user-list">Users</Link>
        {!isLoggedIn && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
        {isLoggedIn && (
          <a href="#logout" onClick={handleLogout}>Logout</a>
        )}
      </nav>
    </header>
  );
};

export default Header;
