import React from 'react';
import './Footer.css';

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <div className="container">
        <div className="brand">
          <span className="dot" />
          <span>ChatApp</span>
        </div>

        <div className="links">
          <a href="#">About</a>
          <a href="#">Contact</a>
          <a href="#">Privacy</a>
        </div>

        <div className="copyright">© {year} ChatApp. All rights reserved.</div>
      </div>
    </footer>
  );
};

export default Footer;
