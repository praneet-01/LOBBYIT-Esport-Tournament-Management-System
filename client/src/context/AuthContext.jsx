import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
      } catch (err) {
        console.error('[AUTH CHECK FAILED]', err.response?.data?.message || err.message);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: jwtToken, ...userData } = response.data;
      
      localStorage.setItem('token', jwtToken);
      try {
        localStorage.setItem('lobbyit_last_account', JSON.stringify({
          name: userData.name,
          username: userData.username,
          email: userData.email,
          role: userData.role,
          avatar: userData.avatar
        }));
        localStorage.setItem('lobbyit_remember_identity', userData.email || userData.username);
      } catch (e) {}

      setToken(jwtToken);
      setUser(userData);
      return userData;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (formData) => {
    setError(null);
    try {
      const response = await api.post('/auth/register', formData);
      const { token: jwtToken, ...userData } = response.data;
      
      localStorage.setItem('token', jwtToken);
      try {
        localStorage.setItem('lobbyit_last_account', JSON.stringify({
          name: userData.name,
          username: userData.username,
          email: userData.email,
          role: userData.role,
          avatar: userData.avatar
        }));
        localStorage.setItem('lobbyit_remember_identity', userData.email || userData.username);
      } catch (e) {}

      setToken(jwtToken);
      setUser(userData);
      return userData;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const sendOtp = async (payload) => {
    setError(null);
    try {
      const response = await api.post('/auth/send-otp', payload);
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send verification code';
      setError(msg);
      throw new Error(msg);
    }
  };

  const verifyOtpRegister = async ({ email, otp }) => {
    setError(null);
    try {
      const response = await api.post('/auth/verify-otp-register', { email, otp });
      const { token: jwtToken, ...userData } = response.data;
      
      localStorage.setItem('token', jwtToken);
      try {
        localStorage.setItem('lobbyit_last_account', JSON.stringify({
          name: userData.name,
          username: userData.username,
          email: userData.email,
          role: userData.role,
          avatar: userData.avatar
        }));
        localStorage.setItem('lobbyit_remember_identity', userData.email || userData.username);
      } catch (e) {}

      setToken(jwtToken);
      setUser(userData);
      return userData;
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const verifyOtpLogin = async ({ email, otp }) => {
    setError(null);
    try {
      const response = await api.post('/auth/verify-otp-login', { email, otp });
      const { token: jwtToken, ...userData } = response.data;
      
      localStorage.setItem('token', jwtToken);
      try {
        localStorage.setItem('lobbyit_last_account', JSON.stringify({
          name: userData.name,
          username: userData.username,
          email: userData.email,
          role: userData.role,
          avatar: userData.avatar
        }));
        localStorage.setItem('lobbyit_remember_identity', userData.email || userData.username);
      } catch (e) {}

      setToken(jwtToken);
      setUser(userData);
      return userData;
    } catch (err) {
      const msg = err.response?.data?.message || 'OTP Login failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        sendOtp,
        verifyOtpRegister,
        verifyOtpLogin,
        logout,
        isOrganizer: user?.role === 'Organizer',
        isTeam: user?.role === 'Team' || user?.role === 'Player',
        isPlayer: user?.role === 'Player' || user?.role === 'Team',
        isAdmin: user?.role === 'Admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
