
import React from "react";
import { useGame } from "@/context/GameContext";
import GameBoard from "@/components/game/GameBoard";
import ChatBox from "@/components/chat/ChatBox";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";

export const GameRoom: React.FC = () => {
  const { gameState, currentRoom, leaveRoom } = useGame();

  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-game-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => leaveRoom()}
            className="flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            Leave Room
          </Button>
          {currentRoom && (
            <div className="ml-4 flex flex-col">
              <span className="text-sm text-muted-foreground">Room Code:</span>
              <span className="font-mono font-medium">{currentRoom}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <GameBoard gameState={gameState} />
        </div>
        <div className="h-[500px]">
          <ChatBox />
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
