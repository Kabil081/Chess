import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import ChessApp from './components/Home';
import Login from './components/Login';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
function App() {
  const isAuthenticated = (): boolean => {
    return localStorage.getItem('chessUser') !== null;
  };
  const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" />;
    }
    return <>{children}</>;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <ChessApp />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}
export default App;