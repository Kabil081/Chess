import React from 'react';

interface LoginProps {
  username: string;
  setUsername: (username: string) => void;
  password: string;
  setPassword: (password: string) => void;
  authError: string | null;
  isConnected: boolean;
  handleLogin: (e: React.FormEvent<HTMLFormElement>) => void;
  toggleAuthMode: () => void;
}

const LoginPage: React.FC<LoginProps> = ({ 
  username, 
  setUsername, 
  password, 
  setPassword, 
  authError, 
  isConnected, 
  handleLogin, 
  toggleAuthMode 
}) => {
  return (
    <div className="bg-gray-700 p-6 rounded-lg shadow-lg w-96">
      <h2 className="text-white text-2xl font-bold mb-6 text-center">Login to Chess.io</h2>
      
      {authError && (
        <div className="bg-red-600 text-white p-3 rounded-md mb-4 text-sm">
          {authError}
        </div>
      )}
      
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-gray-300 mb-1">Username</label>
          <input 
            type="text" 
            value={username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
            className="w-full bg-gray-800 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter your username"
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
        </div>
        
        <button 
          type="submit"
          className="w-full p-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md transition-colors duration-200"
        >
          Login
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-gray-400">
          Don't have an account? <button 
            onClick={toggleAuthMode} 
            className="text-green-400 hover:text-green-300"
          >
            Sign up
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

export default LoginPage;