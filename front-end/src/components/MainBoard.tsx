import React from 'react';
import { Chess, Color, PieceSymbol, Square } from 'chess.js';
import { Settings } from 'lucide-react';
const LIGHT_SQUARE = '#EBECD0';
const DARK_SQUARE = '#739552';

interface MainBoardProps {
  username: string;
  chess: Chess;
  playerColor: 'w' | 'b';
  selectedSquare: string | null;
  possibleMoves: string[];
  lastMove: { from: string; to: string } | null;
  gameStatus: 'waiting' | 'playing' | 'gameOver';
  gameResult: string | null;
  waitingForOpponent: boolean;
  handleSquareClick: (square: string) => void;
}

const MainBoard: React.FC<MainBoardProps> = ({
  username,
  chess,
  playerColor,
  selectedSquare,
  possibleMoves,
  lastMove,
  gameStatus,
  gameResult,
  waitingForOpponent,
  handleSquareClick
}) => {
  const fileLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const rankLabels = ['8', '7', '6', '5', '4', '3', '2', '1'];
  
  const pieceImages: { [key: string]: string } = {
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

  const getPiece = (square: string) => {
    const piece = chess.get(square as Square);
    if (!piece) return null;
    return { type: piece.type, color: piece.color };
  };
  const renderPiece = (piece: { type: PieceSymbol; color: Color; } | null) => {
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
                bgColor = '#A5C9F3'; // Blue for selected square
              } else if (isPossibleMove) {
                bgColor = isLight ? '#C5E8B7' : '#9AD183'; // Green for possible moves
              } else if (isLastMoveFrom) {
                bgColor = isLight ? '#F9E4A0' : '#F0D171'; // Light yellow for last move source
              } else if (isLastMoveTo) {
                bgColor = isLight ? '#F9E07F' : '#F0C653'; // Darker yellow for last move destination
              }
              
              return (
                <div 
                  key={`square-${square}`}
                  className="relative w-16 h-16 cursor-pointer transition-colors duration-200"
                  style={{ backgroundColor: bgColor }}
                  onClick={() => handleSquareClick(square)}
                >
                  {renderPiece(piece)}
                  
                  {/* Show dot for empty square possible move */}
                  {isPossibleMove && !piece && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-gray-800 opacity-30"></div>
                    </div>
                  )}
                  
                  {/* Show highlight for possible capture */}
                  {isPossibleMove && piece && (
                    <div className="absolute inset-0 border-2 border-red-500 rounded-md"></div>
                  )}
                  
                  {/* Display rank labels on the left side */}
                  {fileIndex === 0 && (
                    <div className="absolute left-1 top-1 text-xs font-bold opacity-70">
                      {rank}
                    </div>
                  )}
                  
                  {/* Display file labels on the bottom */}
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

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold">O</div>
          <span className="text-white font-semibold">Opponent (400)</span>
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
        </div>
        <Settings className="text-gray-400 hover:text-white cursor-pointer transition-colors duration-200" size={22} />
      </div>
      {renderBoard()}
      {renderGameStatus()}
      
      <div className="flex items-center mt-4">
        <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold">
          {username.charAt(0).toUpperCase()}
        </div>
        <span className="text-white ml-3 font-semibold">{username}</span>
      </div>
    </div>
  );
};

export default MainBoard;