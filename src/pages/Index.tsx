
import { useState, useEffect } from "react";
import { useGame } from "@/context/GameContext";
import UsernameForm from "@/components/auth/UsernameForm";
import RoomList from "@/components/room/RoomList";
import GameRoom from "@/components/room/GameRoom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Index = () => {
  const { username, setUsername, connectToServer, disconnectFromServer, currentRoom, isConnected } = useGame();
  const [connecting, setConnecting] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const { toast: radixToast } = useToast();

  // Attempt to connect with stored username on load
  useEffect(() => {
    if (username && !isConnected) {
      setConnecting(true);
      setConnectionFailed(false);
      
      connectToServer(username)
        .then((success) => {
          if (success) {
            radixToast({
              title: "Connected!",
              description: `Welcome back, ${username}!`,
            });
          }
        })
        .catch(() => {
          setConnectionFailed(true);
          toast("Unable to connect to game server. Some features may be limited.");
        })
        .finally(() => {
          setConnecting(false);
        });
    }
  }, [username, isConnected, connectToServer, radixToast]);

  const handleLogin = (username: string) => {
    setConnecting(true);
    setConnectionFailed(false);
    
    connectToServer(username)
      .then((success) => {
        if (success) {
          radixToast({
            title: "Connected!",
            description: `Welcome, ${username}!`,
          });
        }
      })
      .catch(() => {
        setConnectionFailed(true);
        toast("Unable to connect to game server. Some features may be limited.");
      })
      .finally(() => {
        setConnecting(false);
      });
  };

  const handleLogout = () => {
    disconnectFromServer();
    localStorage.removeItem("tictactoe_username");
    radixToast({
      title: "Logged out",
      description: "You have been disconnected from the game server.",
    });
  };

  // Show the login form if not connected
  if (!username || !isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white to-game-secondary/30 p-4">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold text-center mb-2 text-game-primary">Tic-Tac-Toe</h1>
          <p className="text-center mb-8 text-muted-foreground">Multiplayer online game</p>
          
          {connectionFailed && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4 text-yellow-800 text-sm">
              Note: Could not connect to game server. You can still play in local mode.
            </div>
          )}
          
          {connecting ? (
            <div className="flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-game-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <UsernameForm onSubmit={handleLogin} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-game-secondary/30 pb-10">
      <header className="bg-white shadow-sm border-b p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-game-primary">Tic-Tac-Toe</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">Logged in as <span className="font-semibold">{username}</span></div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {currentRoom ? <GameRoom /> : <RoomList />}
      </main>
    </div>
  );
};

export default Index;
