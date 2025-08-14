import React from 'react';
import { register } from './service/Authservice';

interface SignupProps {
  username: string;
  setUsername: (username: string) => void;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
  email: string;
  setEmail: (email: string) => void;
  authError: string;
  isConnected: boolean;
  toggleAuthMode: () => void;
  setAuthError: (error: string) => void;
}

interface RegisterResponse {
  success: boolean;
  message?: string;
  userData?: any;
}

const Signup: React.FC<SignupProps> = ({
  username,
  setUsername,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  email,
  setEmail,
  authError,
  isConnected,
  toggleAuthMode,
  setAuthError
}) => {
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError('');
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long');
      return;
    }
    if (username.length < 3) {
      setAuthError('Username must be at least 3 characters long');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAuthError('Please enter a valid email address');
      return;
    }
  
    try {
      const response: RegisterResponse = await register(username, password, email);
      if (response.success) {
        setAuthError('');
        if (response.userData) {
          localStorage.setItem('chessUser', JSON.stringify(response.userData));
        }
      } else {
        setAuthError(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setAuthError('An unexpected error occurred during registration');
    }
  };

  return (
    <div className="bg-gray-700 p-6 rounded-lg shadow-lg w-96">
      <h2 className="text-white text-2xl font-bold mb-6 text-center">Sign up for Chess.io</h2>
      
      {authError && (
        <div className="bg-red-600 text-white p-3 rounded-md mb-4 text-sm">
          {authError}
        </div>
      )}
      
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-gray-300 mb-1">Username</label>
          <input 
            type="text" 
            value={username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
            className="w-full bg-gray-800 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Choose a username"
          />
        </div>
        
        <div>
          <label className="block text-gray-300 mb-1">Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            className="w-full bg-gray-800 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="your@email.com"
          />
        </div>
        
        <div>
          <label className="block text-gray-300 mb-1">Password</label>
          <input 
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            className="w-full bg-gray-800 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="••••••••"
          />
          <p className="text-gray-400 text-xs mt-1">
            At least 8 characters with letters and numbers
          </p>
        </div>
        
        <div>
          <label className="block text-gray-300 mb-1">Confirm Password</label>
          <input 
            type="password"
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            className="w-full bg-gray-800 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="••••••••"
          />
        </div>
        
        <button 
          type="submit"
          className="w-full p-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md transition-colors duration-200"
        >
          Create Account
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-gray-400">
          Already have an account? <button 
            onClick={toggleAuthMode} 
            className="text-green-400 hover:text-green-300"
          >
            Login
          </button>
        </p>
      </div>
      
      <div className="mt-6 text-center">
        <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
          {isConnected ? 'Connected to server' : 'Disconnected from server'}
        </span>
      </div>
    </div>
  );
};

export default Signup;