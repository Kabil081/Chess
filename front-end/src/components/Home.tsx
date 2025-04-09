import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Settings, ChevronDown, Search, Moon, HelpCircle, Trophy, BookOpen } from 'lucide-react';

const LIGHT_SQUARE = '#EBECD0';
const DARK_SQUARE = '#739552';

export default function ChessApp() {
  const [chess, setChess] = useState(new Chess());
  const [playerColor, setPlayerColor] = useState('w');
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [gameResult, setGameResult] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  
  const socketRef = useRef(null);
  const fileLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const rankLabels = ['8', '7', '6', '5', '4', '3', '2', '1'];
  const pieceImages = {
    'wp': 'https://assets-themes.chess.com/image/ejgfv/150/wp.png',
    'wn': 'https://assets-themes.chess.com/image/ejgfv/150/wn.png',
    'wb': 'https://assets-themes.chess.com/image/ejgfv/150/wb.png',
    'wr': 'https://assets-themes.chess.com/image/ejgfv/150/wr.png',
    'wq': 'https://assets-themes.chess.com/image/ejgfv/150/wq.png',
    'wk': 'https://assets-themes.chess.com/image/ejgfv/150/wk.png',
    'bp': 'https://assets-themes.chess.com/image/ejgfv/150/bp.png',
    'bn': 'https://assets-themes.chess.com/image/ejgfv/150/bn.png',
    'bb': 'https://assets-themes.chess.com/image/ejgfv/150/bb.png',
    'br': 'https://assets-themes.chess.com/image/ejgfv/150/br.png',
    'bq': 'https://assets-themes.chess.com/image/ejgfv/150/bq.png',
    'bk': 'https://assets-themes.chess.com/image/ejgfv/150/bk.png',
  };

  // Connect to WebSocket when component mounts
  useEffect(() => {
    const connectWebSocket = () => {
      socketRef.current = new WebSocket('ws://localhost:8080');
      
      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };
      
      socketRef.current.onmessage = (event) => {
        try {
          console.log('Received message:', event.data);
          
          // Handle simple string messages from server
          if (typeof event.data === 'string' && !event.data.startsWith('{')) {
            console.log('Server message:', event.data);
            return;
          }
          
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      socketRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        // Try to reconnect after a delay
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

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (message) => {
    console.log('Handling message:', message);
    
    switch (message.type) {
      case 'init_game':
        if (message.payload?.color) {
          const color = message.payload.color === 'white' ? 'w' : 'b';
          setPlayerColor(color);
          setGameStatus('playing');
          setWaitingForOpponent(false);
          setChess(new Chess()); // Reset the chess game
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
          
          // Apply the opponent's move to our board
          applyMove(from, to);
          setLastMove({ from, to });
        }
        break;
        
      case 'game_over':
        setGameStatus('gameOver');
        setGameResult(message.payload?.winner || 'Game Over');
        break;
        
      default:
        console.log('Received unknown message type:', message);
    }
  };

  // Start a new game
  const startGame = () => {
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

  // Apply a move to the board
  const applyMove = (from, to) => {
    setChess((currentChess) => {
      const newChess = new Chess(currentChess.fen());
      try {
        const moveResult = newChess.move({
          from: from,
          to: to,
          promotion: 'q' // Auto-promote to queen for simplicity
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

  // Send move to server
  const sendMove = (from, to) => {
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
      
      // Apply move locally
      applyMove(from, to);
      setLastMove({ from, to });
    } else {
      console.error('WebSocket not connected, cannot send move');
    }
  };

  // Handle square click
  const handleSquareClick = (square) => {
    if (gameStatus !== 'playing' || !playerColor) {
      return;
    }
    
    const currentTurn = chess.turn();
    
    // Only allow moves when it's the player's turn
    if (currentTurn !== playerColor) {
      console.log("Not your turn");
      return;
    }
    
    // If a square is already selected
    if (selectedSquare) {
      // Check if the clicked square is a valid move
      if (possibleMoves.includes(square)) {
        // Send move to server
        sendMove(selectedSquare, square);
        return;
      }
      
      // If clicked on another piece of the same color, select it instead
      const piece = chess.get(square);
      if (piece && piece.color === playerColor) {
        setSelectedSquare(square);
        
        // Get legal moves for this piece using chess.js
        const moves = chess.moves({ 
          square: square,
          verbose: true
        });
        
        // Extract destination squares
        const legalMoves = moves.map(move => move.to);
        setPossibleMoves(legalMoves);
        return;
      }
      
      // Otherwise, clear selection
      setSelectedSquare(null);
      setPossibleMoves([]);
      return;
    }
    
    // Get the piece at the square
    const piece = chess.get(square);
    
    // If piece belongs to the player, select it and show possible moves
    if (piece && piece.color === playerColor) {
      setSelectedSquare(square);
      
      // Get legal moves for this piece using chess.js
      const moves = chess.moves({ 
        square: square,
        verbose: true
      });
      
      // Extract destination squares
      const legalMoves = moves.map(move => move.to);
      setPossibleMoves(legalMoves);
    } else {
      // Clear selection
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const getPiece = (square) => {
    const piece = chess.get(square);
    if (!piece) return null;
    return { type: piece.type, color: piece.color };
  };

  const renderPiece = (piece) => {
    if (!piece) return null;
    
    const pieceKey = piece.color + piece.type;
    const pieceImageUrl = pieceImages[pieceKey]; 
    return (
      <div className="w-full h-full flex items-center justify-center">
        <img 
          src={pieceImageUrl} 
          alt={pieceKey} 
          className="w-10/12 h-10/12 object-contain transition-transform duration-200 hover:scale-110"
        />
      </div>
    );
  };

  const renderBoard = () => {
    const boardOrientation = playerColor === 'b' ? 'black' : 'white';
    const ranks = boardOrientation === 'black' ? [...rankLabels].reverse() : rankLabels;
    const files = boardOrientation === 'black' ? [...fileLabels].reverse() : fileLabels;
    return (
      <div className="border-4 border-gray-800 rounded-md shadow-2xl">
        {ranks.map((rank, rankIndex) => (
          <div key={`rank-${rank}`} className="flex">
            {files.map((file, fileIndex) => {
              const square = file + rank;
              const piece = getPiece(square);
              
              const isSelected = selectedSquare === square;
              const isPossibleMove = possibleMoves.includes(square);
              
              const isLastMoveFrom = lastMove && lastMove.from === square;
              const isLastMoveTo = lastMove && lastMove.to === square;
              
              const isLight = (rankIndex + fileIndex) % 2 === 1;
              const squareColor = isLight ? LIGHT_SQUARE : DARK_SQUARE;
              
              let bgColor = squareColor;
              if (isSelected) {
                bgColor = '#A5C9F3';
              } else if (isPossibleMove) {
                bgColor = isLight ? '#C5E8B7' : '#9AD183';
              } else if (isLastMoveFrom) {
                bgColor = isLight ? '#F9E4A0' : '#F0D171';
              } else if (isLastMoveTo) {
                bgColor = isLight ? '#F9E07F' : '#F0C653';
              }
              
              return (
                <div 
                  key={`square-${square}`}
                  className="relative w-16 h-16 cursor-pointer transition-colors duration-200"
                  style={{ backgroundColor: bgColor }}
                  onClick={() => handleSquareClick(square)}
                >
                  {renderPiece(piece)}
                  
                  {isPossibleMove && !piece && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-gray-800 opacity-30"></div>
                    </div>
                  )}
                  
                  {isPossibleMove && piece && (
                    <div className="absolute inset-0 border-2 border-red-500 rounded-md"></div>
                  )}
                  
                  {fileIndex === 0 && (
                    <div className="absolute left-1 top-1 text-xs font-bold opacity-70">
                      {rank}
                    </div>
                  )}
                  
                  {rankIndex === 7 && (
                    <div className="absolute right-1 bottom-1 text-xs font-bold opacity-70">
                      {file}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // Render game status
  const renderGameStatus = () => {
    if (gameStatus === 'waiting' || waitingForOpponent) {
      return (
        <div className="bg-gray-700 text-white text-center mt-4 p-3 rounded-md animate-pulse">
          Waiting for opponent...
        </div>
      );
    } else if (gameStatus === 'gameOver') {
      return (
        <div className="bg-red-600 text-white text-center mt-4 p-3 rounded-md font-bold">
          Game Over: {gameResult}
        </div>
      );
    } else if (gameStatus === 'playing') {
      const isPlayerTurn = chess.turn() === playerColor;
      return (
        <div className={`${playerColor === 'w' ? 'bg-white text-gray-800' : 'bg-gray-800 text-white'} text-center mt-4 p-3 rounded-md font-bold border-2 ${isPlayerTurn ? 'border-green-500' : 'border-gray-500'}`}>
          Playing as: {playerColor === 'w' ? 'White' : 'Black'} | 
          {isPlayerTurn ? " Your turn" : " Opponent's turn"}
        </div>
      );
    }
    return null;
  };

  // Navigation item component
  const NavItem = ({ icon, color, label }) => (
    <div className={`flex items-center gap-3 p-3 hover:bg-gray-700 rounded-md transition-colors duration-200 cursor-pointer ${label === 'Play' ? 'bg-gray-700' : ''}`}>
      <div className={`text-${color}-500`}>{icon}</div>
      <span className="text-white font-medium">{label}</span>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Left sidebar */}
      <div className="w-56 bg-gray-800 flex flex-col p-4 shadow-xl">
        <div className="p-2">
          <div className="flex items-center gap-2 mb-8">
            <div className="text-xl font-bold text-white flex items-center">
              <span className="text-green-500 mr-1 text-2xl">♟</span>
              <span className="text-xl">Chess.io</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <NavItem icon={<span className="text-xl">♟</span>} color="amber" label="Play" />
            <NavItem icon={<Trophy size={18} />} color="orange" label="Puzzles" />
            <NavItem icon={<BookOpen size={18} />} color="blue" label="Learn" />
            <NavItem icon={<span className="text-xl">👁</span>} color="gray" label="Watch" />
            <NavItem icon={<span className="text-xl">📰</span>} color="red" label="News" />
            <NavItem icon={<span className="text-xl">👥</span>} color="purple" label="Social" />
            <div className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-md transition-colors duration-200 cursor-pointer">
              <ChevronDown className="text-gray-400" size={16} />
              <span className="text-white font-medium">More</span>
            </div>
          </div>
          
          <div className="mt-6 relative">
            <input 
              type="text" 
              placeholder="Search" 
              className="w-full bg-gray-700 text-white p-2 rounded-md pl-8 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
          </div>
          
          <div className="mt-8 text-gray-400 space-y-2">
            <div className="flex items-center gap-2 p-2 hover:text-white hover:bg-gray-700 rounded-md transition-colors duration-200 cursor-pointer">
              <span>🌐</span> English
            </div>
            <div className="flex items-center gap-2 p-2 hover:text-white hover:bg-gray-700 rounded-md transition-colors duration-200 cursor-pointer">
              <Moon size={16} /> Dark UI
            </div>
            <div className="flex items-center gap-2 p-2 hover:text-white hover:bg-gray-700 rounded-md transition-colors duration-200 cursor-pointer">
              <HelpCircle size={16} /> Support
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex">
        <div className="flex-1 p-6 flex justify-center items-center bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold">D</div>
                <span className="text-white font-semibold">Opponent (400)</span>
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              </div>
              <Settings className="text-gray-400 hover:text-white cursor-pointer transition-colors duration-200" size={22} />
            </div>
            
            {renderBoard()}
            {renderGameStatus()}
            
            <div className="flex items-center mt-4">
              <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold">Y</div>
              <span className="text-white ml-3 font-semibold">You</span>
            </div>
          </div>
        </div>
        
        {/* Right sidebar */}
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
      </div>
    </div>
  );
}