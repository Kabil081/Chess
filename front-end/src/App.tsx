import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import ChessApp from './components/Home';
import Chess from './components/Home';
import Pattern from "./components/Pattern";
interface ProtectedRouteProps{
  children: React.ReactNode;
}
function App(){
  const isAuthenticated = (): boolean =>{
    return localStorage.getItem('chessUser') !== null;
  };
  const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/" />;
    }
    return <>{children}</>;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Navigate to="/" />}/>
          <Route path='/Chess' element={<Chess/>}/>
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <ChessApp />
              </ProtectedRoute>
            } 
          />
          <Route path="/p" element={<Pattern/>}/>
        </Routes>
      </div>
    </Router>
  );
}
export default App;