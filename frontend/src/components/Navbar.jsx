import React, { useState } from 'react';
import './Navbar.css';
import LoginPage from './LoginPage'; // Import your existing LoginPage component

function Navbar() {
  const [showLoginPage, setShowLoginPage] = useState(false);

  const handleSignUpClick = () => {
    setShowLoginPage(!showLoginPage); // Toggle login page visibility
  };

  const handleCancel = () => {
    setShowLoginPage(false); // Hide login page on cancel
  };

  return (
    <>
      <nav className="navbar">
        <div className="logo-section">
          <div className="logo">🔗</div> {/* Placeholder for the logo */}
          <span className="logo-text">Mheet</span>
        </div>

        <ul className="nav-links">
          <li className="nav-item">Key Features</li>
          <li className="nav-item">Explore</li>
          <li className="nav-item">Solutions</li>
          <li className="nav-item">Tools</li>
          <li className="nav-item">Contact</li>
        </ul>

        {/* Sign Up Button */}
        <button className="sign-up-btn" onClick={handleSignUpClick}>
          Sign Up
        </button>
      </nav>

      {/* Conditionally render the LoginPage with an animation */}
      {showLoginPage && (
        <div className={`login-page-wrapper ${showLoginPage ? 'visible' : ''}`}>
          <LoginPage handleCancel={handleCancel} /> {/* Pass handleCancel as a prop */}
        </div>
      )}
    </>
  );
}

export default Navbar;
