import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChessApp from './components/Home';
import LandingPage from "./screens/LandingPage"
import Game from './screens/Game';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ChessApp />} />
        <Route path="/game" element={<Game/>}/>
        <Route path="landingPage" element={<LandingPage/>}/>
      </Routes>
    </Router>
  );
}

export default App;
