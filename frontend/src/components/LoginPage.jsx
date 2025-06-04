import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import './LoginPage.css';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/authService';

const LoginPage = ({ handleCancel }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (e) => e.preventDefault();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const data = await loginUser(formData.email, formData.password);

      if (data.success) {
        // Store complete user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        alert("Login successful!");
        
        // Navigate based on role
        navigate(data.user.role === 'admin' ? '/admin' : '/user');
      } else {
        setErrorMessage(data.message || "Invalid login credentials.");
      }
    } catch (error) {
      setErrorMessage("Error: Could not connect to server.");
    }
  };

  return (
    <div className="container">
      <div className="common-left-right">
        <div className="left-div">
          <form className="login-form" onSubmit={handleSubmit}>
            <h2>Login</h2>
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

            <TextField
              name="email"
              label="Email"
              variant="outlined"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              name="password"
              label="Password"
              variant="outlined"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'hide the password' : 'display the password'}
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <button type="submit" className="login-button">Login</button>
            <p className="register-link">
              Don't have an account? <Link to="/register">Register here</Link>
            </p>
          </form>
        </div>
        <div className="right-div">
          <div className="scroll-box">
            <div className="scroll-animation">
              <div className="box box1">Box 1</div>
              <div className="box box2">Box 2</div>
              <div className="box box3">Box 3</div>
            </div>
          </div>
        </div>
        <button className="cancel-button" onClick={handleCancel}>Cancel</button>
      </div>
    </div>
  );
};

export default LoginPage;
