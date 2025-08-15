import { useState, useEffect, useRef, JSX } from 'react';
import { Chess, Square } from 'chess.js';
import Sidebar from './Sidebar';
import Signup from './Signup';
import MainBoard from './MainBoard';
import Login from './Login';

interface Move {
  from: string;
  to: string;
}

interface WebSocketMessage{
  type: string;
  message?: string;
  success?: boolean;
  payload?: any;
  opponent?: string;
}

export default function ChessApp(): JSX.Element {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [isSigningUp, setIsSigningUp] = useState<boolean>(false);
  const [chess, setChess] = useState<Chess>(new Chess());
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'gameOver'>('waiting');
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    const connectWebSocket = () => {
      socketRef.current = new WebSocket('wss://chess-back-end.vercel.app');
      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };
      socketRef.current.onmessage = (event) => {
        try {
          console.log('Received message:', event.data);
          if (typeof event.data === 'string' && !event.data.startsWith('{')) {
            console.log('Server message:', event.data);
            return;
          }
          
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      socketRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setTimeout(connectWebSocket, 3000);
      };
      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };
    connectWebSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const handleWebSocketMessage = (message: WebSocketMessage): void => {
    console.log('Handling message:', message);
    switch (message.type) {
      case 'welcome':
        console.log('Received welcome message from server');
        break;
      case 'auth_response':
        if (message.success) {
          console.log('Authentication successful!');
          setIsAuthenticated(true);
          setAuthError('');
        } else {
          console.error('Authentication failed:', message.message);
          setAuthError(message.message || 'Authentication failed');
          setIsAuthenticated(false);
        }
        break;
      case 'init_game':
        if (message.payload?.color) {
          const color = message.payload.color === 'white' ? 'w' : 'b';
          setPlayerColor(color as 'w' | 'b');
          setGameStatus('playing');
          setWaitingForOpponent(false);
          setChess(new Chess()); 
          setPossibleMoves([]);
          setSelectedSquare(null);
          setLastMove(null);
          console.log(`Game started! You're playing as ${message.payload.color}`);
        }
        break;
        
      case 'move':
        if (message.payload) {
          const { from, to } = message.payload;
          console.log(`Opponent moved from ${from} to ${to}`);
          applyMove(from, to);
          setLastMove({ from, to });
        }
        break;
        
      case 'game_over':
        setGameStatus('gameOver');
        setGameResult(message.payload?.winner || 'Game Over');
        break;
        
      case 'waiting_for_opponent':
        setWaitingForOpponent(true);
        console.log('Waiting for an opponent to join...');
        break;
        
      case 'game_found':
        console.log(`Found opponent: ${message.opponent}`);
        break;
        
      case 'error':
        console.error('Received error from server:', message.message);
        break;

      default:
        console.log('Received unknown message type:', message);
    }
  };
  
  const handleLogin = (e: React.FormEvent): void => {
    e.preventDefault();
    
    if (!username || !password) {
      setAuthError('Username and password are required');
      return;
    }
    
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setAuthError('Not connected to server. Please try again.');
      return;
    }
    
    const authMessage = {
      type: 'auth',
      username: username,
      password: password
    };
    
    console.log('Sending authentication request...');
    socketRef.current.send(JSON.stringify(authMessage));
  };
  
  const applyMove = (from: string, to: string): void => {
    setChess((currentChess) => {
      const newChess = new Chess(currentChess.fen());
      try {
        const moveResult = newChess.move({
          from: from,
          to: to,
          promotion: 'q' 
        });
        
        console.log('Move applied:', moveResult);
        
        if (newChess.isGameOver()) {
          let result = 'Draw';
          if (newChess.isCheckmate()) {
            result = newChess.turn() === 'w' ? 'Black wins' : 'White wins';
          } else if (newChess.isDraw()) {
            result = 'Draw';
          } else if (newChess.isStalemate()) {
            result = 'Stalemate';
          }
          setGameStatus('gameOver');
          setGameResult(result);
        }
        
        return newChess;
      } catch (e) {
        console.error('Invalid move:', e);
        return currentChess;
      }
    });
    
    setPossibleMoves([]);
    setSelectedSquare(null);
  };

  const sendMove = (from: string, to: string): void => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const moveMessage = {
        type: 'move',
        move: {
          from: from,
          to: to
        }
      };
      
      console.log('Sending move to server:', moveMessage);
      socketRef.current.send(JSON.stringify(moveMessage));
      applyMove(from, to);
      setLastMove({ from, to });
    } else {
      console.error('WebSocket not connected, cannot send move');
    }
  };

  const handleSquareClick = (square: string): void => {
    if (gameStatus !== 'playing' || !playerColor) {
      return;
    }
    
    const currentTurn = chess.turn();
    if (currentTurn !== playerColor) {
      console.log("Not your turn");
      return;
    }
    if (selectedSquare) {
      if (possibleMoves.includes(square)) {
        sendMove(selectedSquare, square);
        return;
      }

      const piece = chess.get(square as Square);
      if (piece && piece.color === playerColor) {
        setSelectedSquare(square);
        
        const moves = chess.moves({ 
          square: square as Square,
          verbose: true
        });
        const legalMoves = moves.map((move: any) => move.to);
        setPossibleMoves(legalMoves);
        return;
      }
      setSelectedSquare(null);
      setPossibleMoves([]);
      return;
    }
    const piece = chess.get(square as Square);
    
    if (piece && piece.color === playerColor) {
      setSelectedSquare(square);
      
      const moves = chess.moves({ 
        square: square as Square,
        verbose: true
      });
      
      const legalMoves = moves.map((move: any) => move.to);
      setPossibleMoves(legalMoves);
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const startGame = (): void => {
    if (!isAuthenticated) {
      console.error('Must be authenticated to start a game');
      return;
    }
    
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }
    
    const message = {
      type: 'init_game'
    };
    socketRef.current.send(JSON.stringify(message));
    setGameStatus('waiting');
    setGameResult(null);
    setChess(new Chess());
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setWaitingForOpponent(true);
    console.log('Sent init_game request, waiting for opponent...');
  };
  
  const toggleAuthMode = (): void => {
    setIsSigningUp(!isSigningUp);
    setAuthError('');
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex">
        <div className="flex-1 p-6 flex justify-center items-center bg-gradient-to-br from-gray-900 to-gray-800">
          {isAuthenticated ? (
            <MainBoard 
              username={username}
              chess={chess}
              playerColor={playerColor}
              selectedSquare={selectedSquare}
              possibleMoves={possibleMoves}
              lastMove={lastMove}
              gameStatus={gameStatus}
              gameResult={gameResult}
              waitingForOpponent={waitingForOpponent}
              handleSquareClick={handleSquareClick}
            />
          ) : (
            isSigningUp ? (
              <Signup 
                username={username}
                setUsername={setUsername}
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                email={email}
                setEmail={setEmail}
                authError={authError}
                isConnected={isConnected}
                toggleAuthMode={toggleAuthMode}
                setAuthError={setAuthError}
              />
            ) : (
              <Login 
                username={username}
                setUsername={setUsername}
                password={password}
                setPassword={setPassword}
                authError={authError}
                isConnected={isConnected}
                handleLogin={handleLogin}
                toggleAuthMode={toggleAuthMode}
              />
            )
          )}
        </div>
        {isAuthenticated && (
          <div className="w-80 bg-gray-800 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="bg-blue-500 p-2 rounded-md text-white">
                  🤖
                </div>
                <span className="text-white font-semibold text-lg">Play Online</span>
              </div>
            </div>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold">O</div>
                <div>
                  <span className="text-white font-semibold block">Opponent</span>
                  <span className="text-gray-400 text-sm">Rating: 400</span>
                </div>
                <div className="w-4 h-4 bg-green-500 rounded-full ml-auto"></div>
              </div>
            </div>
            <div className="bg-gray-700 rounded-md p-4 mb-6 shadow-md">
              <div className="flex justify-between items-center mb-3">
                <span className="text-white font-semibold">Game Options</span>
                <span className="text-gray-300 text-sm">Standard</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Time Control</span>
                  <span className="text-white">10 min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Increment</span>
                  <span className="text-white">5 sec</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Rated</span>
                  <span className="text-white">Yes</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-700 rounded-md p-4 mb-6 shadow-md">
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold">Game Status</span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-600 rounded-md">
                  <span className="text-white">Moves: {Math.floor(chess.history().length / 2)}</span>
                  <span className="text-white">Turn: {chess.turn() === 'w' ? 'White' : 'Black'}</span>
                </div>
                {chess.isCheck() && (
                  <div className="flex justify-center items-center p-2 bg-red-600 rounded-md">
                    <span className="text-white font-bold">CHECK!</span>
                  </div>
                )}
                {lastMove && (
                  <div className="flex justify-between items-center p-2 bg-gray-600 rounded-md">
                    <span className="text-white">Last move:</span>
                    <span className="text-white font-bold">{lastMove.from} → {lastMove.to}</span>
                  </div>
                )}
              </div>
            </div>          
            <div className="flex items-center justify-between mt-8 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-white">Preferred side:</span>
                <div className="flex gap-2">
                  <div 
                    className={`w-8 h-8 ${playerColor === 'w' ? 'border-2 border-green-500' : 'border-2 border-gray-600'} bg-white rounded-md cursor-pointer`}
                    onClick={() => setPlayerColor('w')}
                  ></div>
                  <div 
                    className={`w-8 h-8 ${playerColor === 'b' ? 'border-2 border-green-500' : 'border-2 border-gray-600'} bg-gray-800 rounded-md cursor-pointer`}
                    onClick={() => setPlayerColor('b')}
                  ></div>
                </div>
              </div>
            </div>
            <button 
              className={`w-full p-4 rounded-md font-bold text-white ${waitingForOpponent ? 'bg-yellow-600' : 'bg-green-600 hover:bg-green-700'} transition-colors duration-200 shadow-lg`}
              onClick={startGame}
              disabled={waitingForOpponent}
            >
              {waitingForOpponent ? "Waiting for opponent..." : "Find Match"}
            </button>
            <div className="mt-6 text-center">
              <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? 'Connected to server' : 'Disconnected from server'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}