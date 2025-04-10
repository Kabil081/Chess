import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register, isLoggedIn } from './service/Authservice';

const Login: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (isLoggedIn()) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    setLoading(true);
    
    try {
      const response = activeTab === 'login' 
        ? await login(username, password)
        : await register(username, password);
      
      if (response.success) {
        if (response.userData) {
          localStorage.setItem('chessUser', JSON.stringify(response.userData));
        }
        navigate('/');
      } else {
        setError(response.message || 'Authentication failed');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === 'login' 
                ? 'bg-gray-100 border-b-2 border-gray-800' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === 'signup' 
                ? 'bg-gray-100 border-b-2 border-gray-800' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>

        <div className="px-8 py-6">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-center">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-700 font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
                required
                autoComplete="username"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
                required
                autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
            
            <button
              type="submit"
              className={`w-full py-3 px-4 bg-gray-800 text-white font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={loading}
            >
              {loading ? 'Processing...' : activeTab === 'login' ? 'Login' : 'Sign Up'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;