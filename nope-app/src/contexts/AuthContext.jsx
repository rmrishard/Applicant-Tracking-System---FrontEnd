import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Validate that we have required user properties
        if (parsedUser && parsedUser.id && parsedUser.role) {
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          console.error('Invalid user object in localStorage:', parsedUser);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else if (storedUser === 'undefined' || storedUser === 'null') {
      // Clean up corrupted localStorage
      console.warn('Corrupted user data in localStorage, cleaning up...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      // Step 1: Login and get token
      const loginResponse = await authAPI.login(credentials);
      console.log('=== LOGIN RESPONSE DEBUG ===');
      console.log('Login response:', loginResponse.data);

      const token = loginResponse.data.token || loginResponse.data;

      if (!token) {
        console.error('No token received from login');
        return {
          success: false,
          error: 'Invalid response from server. Please try again.'
        };
      }

      console.log('Token received:', token);

      // Step 2: Store token temporarily and get user info
      localStorage.setItem('token', token);

      // Step 3: Get current user details
      const userResponse = await authAPI.getCurrentUser();
      console.log('User response:', userResponse.data);

      const userData = userResponse.data;

      if (!userData || !userData.role) {
        console.error('Invalid user data received:', userData);
        localStorage.removeItem('token');
        return {
          success: false,
          error: 'Failed to fetch user information. Please try again.'
        };
      }

      console.log('User data received:', userData);
      console.log('User role:', userData.role);
      console.log('========================');

      // Step 4: Store user data
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed. Please try again.'
      };
    }
  };

  const register = async (userData) => {
    try {
      // Step 1: Register and get token
      const registerResponse = await authAPI.register(userData);
      const token = registerResponse.data.token || registerResponse.data;

      if (!token) {
        return {
          success: false,
          error: 'Invalid response from server. Please try again.'
        };
      }

      // Step 2: Store token temporarily and get user info
      localStorage.setItem('token', token);

      // Step 3: Get current user details
      const userResponse = await authAPI.getCurrentUser();
      const newUser = userResponse.data;

      if (!newUser || !newUser.role) {
        localStorage.removeItem('token');
        return {
          success: false,
          error: 'Failed to fetch user information. Please try again.'
        };
      }

      // Step 4: Store user data
      localStorage.setItem('user', JSON.stringify(newUser));

      setUser(newUser);
      setIsAuthenticated(true);

      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUserData) => {
    // Update both state and localStorage
    setUser(updatedUserData);
    localStorage.setItem('user', JSON.stringify(updatedUserData));
  };

  const hasRole = (roles) => {
    if (!user || !user.role) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
