
import React, { useState } from "react";
import { Room } from "@/services/socketService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGame } from "@/context/GameContext";
import { Lock, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

export const RoomList: React.FC = () => {
  const { rooms, joinRoom, createRoom, joinRandomGame } = useGame();
  const [newRoomName, setNewRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRoomName.trim()) {
      createRoom(newRoomName.trim(), isPrivate);
      setNewRoomName("");
      setIsPrivate(false);
    }
  };
  
  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      joinRoom(joinCode.trim());
      setJoinCode("");
    }
  };

  return (
    <Card className="shadow-lg border-2 border-game-secondary">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-game-primary">Game Rooms</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Button 
              onClick={() => joinRandomGame()} 
              className="flex-1 bg-game-primary hover:bg-game-primary/90"
            >
              Find Random Match
            </Button>
          </div>
          
          <form onSubmit={handleJoinWithCode} className="flex gap-2">
            <Input 
              placeholder="Enter room code" 
              value={joinCode} 
              onChange={(e) => setJoinCode(e.target.value)}
              className="flex-1 border-2 border-game-secondary focus:border-game-primary"
            />
            <Button type="submit" variant="outline" disabled={!joinCode.trim()}>
              Join
            </Button>
          </form>

          <Separator />
          
          <form onSubmit={handleCreateRoom} className="space-y-3">
            <div className="flex gap-2">
              <Input 
                placeholder="New room name" 
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="flex-1 border-2 border-game-secondary focus:border-game-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isPrivate}
                  onChange={() => setIsPrivate(!isPrivate)} 
                  className="w-4 h-4 rounded border-2 border-game-secondary text-game-primary focus:ring-game-primary"
                />
                <span>Private Room</span>
              </label>
              <Button 
                type="submit" 
                className="ml-auto bg-game-accent hover:bg-game-accent/90"
                disabled={!newRoomName.trim()}
              >
                Create Room
              </Button>
            </div>
          </form>

          <Separator />

          <div className="font-medium">Public Rooms</div>
          <ScrollArea className="h-[200px] rounded-md border p-2">
            {rooms
              .filter((room) => !room.isPrivate)
              .map((room) => (
                <RoomCard key={room.id} room={room} onJoin={() => joinRoom(room.id)} />
              ))}
            {rooms.filter((room) => !room.isPrivate).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No public rooms available. Create one!
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

interface RoomCardProps {
  room: Room;
  onJoin: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onJoin }) => {
  return (
    <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md mb-1">
      <div className="flex gap-2 items-center">
        <div className="font-medium truncate">{room.name}</div>
        {room.isPrivate && <Lock size={16} className="text-muted-foreground" />}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <Users size={14} /> 
          <span className="ml-1">{room.players.length}/2</span>
        </div>
        <Button 
          size="sm"
          onClick={onJoin}
          disabled={room.players.length >= 2}
          variant="outline"
          className={cn(
            "h-8 px-2",
            room.players.length >= 2 && "opacity-50 cursor-not-allowed"
          )}
        >
          {room.players.length >= 2 ? "Full" : "Join"}
        </Button>
      </div>
    </div>
  );
};

export default RoomList;
