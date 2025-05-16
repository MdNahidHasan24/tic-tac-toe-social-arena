
import { useState, useEffect } from "react";
import { useGame } from "@/context/GameContext";
import UsernameForm from "@/components/auth/UsernameForm";
import RoomList from "@/components/room/RoomList";
import GameRoom from "@/components/room/GameRoom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertCircle, Loader2, Wifi, WifiOff, RefreshCw } from "lucide-react";

const Index = () => {
  const { username, setUsername, connectToServer, disconnectFromServer, currentRoom, isConnected } = useGame();
  const [connecting, setConnecting] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const { toast: radixToast } = useToast();

  // Attempt to connect with stored username on load
  useEffect(() => {
    const storedUsername = localStorage.getItem("tictactoe_username");
    
    if (storedUsername && !isConnected && !connecting) {
      setConnecting(true);
      setConnectionFailed(false);
      
      connectToServer(storedUsername)
        .then((success) => {
          if (success) {
            radixToast({
              title: "Connected!",
              description: `Welcome back, ${storedUsername}!`,
            });
            setConnectionFailed(false);
          } else {
            setConnectionFailed(true);
            toast("Limited connectivity: Using offline mode. Some features may be restricted.");
          }
        })
        .catch(() => {
          setConnectionFailed(true);
          toast("Unable to connect to game server. Using offline mode.");
        })
        .finally(() => {
          setConnecting(false);
        });
    }
  }, []);

  const handleLogin = (username: string) => {
    setConnecting(true);
    setConnectionFailed(false);
    
    console.log("Attempting to connect with username:", username);
    
    connectToServer(username)
      .then((success) => {
        console.log("Connection attempt result:", success);
        if (success) {
          radixToast({
            title: "Connected!",
            description: `Welcome, ${username}!`,
          });
          setConnectionFailed(false);
        } else {
          setConnectionFailed(true);
          toast("Limited connectivity: Using offline mode. Some features may be restricted.");
        }
      })
      .catch((error) => {
        console.error("Connection error:", error);
        setConnectionFailed(true);
        toast("Unable to connect to game server. Using offline mode.");
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

  const handleRetryConnection = () => {
    if (!username) return;
    
    setConnecting(true);
    setConnectionFailed(false);
    
    console.log("Retrying connection with username:", username);
    
    connectToServer(username)
      .then((success) => {
        console.log("Reconnection attempt result:", success);
        if (success) {
          radixToast({
            title: "Connected!",
            description: "Successfully reconnected to the server.",
          });
          setConnectionFailed(false);
        } else {
          setConnectionFailed(true);
          toast("Still unable to connect. Using offline mode.");
        }
      })
      .catch((error) => {
        console.error("Reconnection error:", error);
        setConnectionFailed(true);
        toast("Connection failed. Using offline mode.");
      })
      .finally(() => {
        setConnecting(false);
      });
  };

  // Show the login form if not logged in
  if (!username) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white to-game-secondary/30 p-4">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold text-center mb-2 text-game-primary">Tic-Tac-Toe</h1>
          <p className="text-center mb-8 text-muted-foreground">Multiplayer online game</p>
          
          {connecting ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-game-primary" />
              <p>Connecting to server...</p>
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
            <div className="flex items-center">
              {connectionFailed ? (
                <div className="flex items-center gap-2 text-amber-500">
                  <WifiOff size={16} />
                  <span className="text-xs">Offline Mode</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRetryConnection}
                    disabled={connecting}
                    className="ml-2 text-xs h-7 px-2"
                  >
                    {connecting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <><RefreshCw size={12} className="mr-1" /> Retry</>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Wifi size={16} className="text-green-500" />
                  <span className="text-xs text-green-600">Connected</span>
                </div>
              )}
            </div>
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

      {connectionFailed && (
        <div className="bg-amber-50 border border-amber-200 mx-auto max-w-3xl mt-4 p-3 rounded-md flex items-start gap-3">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm text-amber-800">
              Limited connectivity mode: You can still play locally, but multiplayer features may be limited.
            </p>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        {currentRoom ? <GameRoom /> : <RoomList />}
      </main>
    </div>
  );
};

export default Index;
