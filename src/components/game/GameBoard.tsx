
import React from "react";
import { GameState } from "@/services/socketService";
import { useGame } from "@/context/GameContext";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Trophy } from "lucide-react";

interface GameBoardProps {
  gameState: GameState;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState }) => {
  const { makeMove, restartGame, username } = useGame();
  
  const isPlayerTurn = () => {
    const playerMarker = username === gameState.players.X ? "X" : "O";
    return playerMarker === gameState.currentTurn && !gameState.gameOver;
  };

  const isWinningCell = (index: number) => {
    return gameState.winningCombination?.includes(index);
  };
  
  const renderMarker = (value: string | null, index: number) => {
    if (!value) return null;
    
    const isWinning = isWinningCell(index);
    
    return (
      <span 
        className={cn(
          value === "X" ? "x-marker" : "o-marker",
          isWinning && "winning-cell",
        )}
      >
        {value}
      </span>
    );
  };

  return (
    <Card className="p-6 shadow-lg border-2 border-game-secondary">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className={cn(
            "font-semibold",
            gameState.currentTurn === "X" && !gameState.gameOver && "text-game-primary font-bold animate-pulse-light"
          )}>
            X: {gameState.players.X || "Waiting..."}
          </div>
          <div>vs</div>
          <div className={cn(
            "font-semibold",
            gameState.currentTurn === "O" && !gameState.gameOver && "text-game-accent font-bold animate-pulse-light"
          )}>
            O: {gameState.players.O || "Waiting..."}
          </div>
        </div>
        
        {gameState.gameOver && (
          <Button 
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => restartGame()}
          >
            <RefreshCw size={16} />
            Play Again
          </Button>
        )}
      </div>
      
      <div className={cn(
        "board-grid w-full max-w-xs mx-auto",
        !isPlayerTurn() && !gameState.gameOver && "opacity-90"
      )}>
        {gameState.board.map((cell, index) => (
          <div
            key={index}
            className={cn(
              "board-cell bg-game-secondary/30 rounded-md",
              isWinningCell(index) && "winning-cell",
              isPlayerTurn() && !cell && "hover:bg-game-secondary/50"
            )}
            onClick={() => {
              if (!cell && isPlayerTurn() && !gameState.gameOver) {
                makeMove(index);
              }
            }}
          >
            {renderMarker(cell, index)}
          </div>
        ))}
      </div>
      
      {gameState.gameOver ? (
        <div className="mt-6 text-center">
          {gameState.winner ? (
            <div className="font-bold text-lg flex items-center justify-center gap-2">
              <Trophy className="text-game-accent" size={20} />
              {gameState.winner === username ? "You Won!" : `${gameState.winner} Won!`}
            </div>
          ) : (
            <div className="font-bold text-lg">It's a Draw!</div>
          )}
        </div>
      ) : (
        <div className="mt-6 text-center">
          {gameState.players.X && gameState.players.O ? (
            <div className="font-medium">
              {isPlayerTurn() 
                ? "Your turn!" 
                : `Waiting for ${gameState.currentTurn === "X" ? gameState.players.X : gameState.players.O}...`}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Waiting for opponent...
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default GameBoard;
