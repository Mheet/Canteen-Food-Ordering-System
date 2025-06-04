import { useState } from 'react';
import { loginUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';

export const useLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const data = await loginUser(email, password);

      if (data.success) {
        alert("Login successful!");
        navigate(data.role === 'admin' ? '/admin' : '/user');
      } else {
        setErrorMessage(data.message || "Invalid login credentials.");
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return {
    email,
    password,
    errorMessage,
    setEmail,
    setPassword,
    handleSubmit,
  };
};
