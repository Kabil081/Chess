import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import ChessApp from './components/Home';
import Chess from './components/Home';
function App(){
  return(
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Navigate to="/" />}/>
          <Route path='/Chess' element={<Chess/>}/>
          <Route 
            path="/" 
            element={
                <ChessApp />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}
export default App;