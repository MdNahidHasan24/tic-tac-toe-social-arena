import { io, Socket } from "socket.io-client";
import { toast } from "@/hooks/use-toast";

// Use multiple server options for better reliability
const SERVER_OPTIONS = [
  "https://tic-tac-toe-server-production.up.railway.app",
  "https://tictactoe-socket-server.onrender.com",
  "https://tictactoe-server.adaptable.app"
];

export interface GameState {
  board: Array<string | null>;
  currentTurn: "X" | "O";
  gameOver: boolean;
  winner: string | null;
  winningCombination: number[] | null;
  players: {
    X: string | null;
    O: string | null;
  };
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export interface Room {
  id: string;
  name: string;
  players: string[];
  spectators: number;
  isPrivate: boolean;
}

class SocketService {
  private socket: Socket | null = null;
  private username: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private currentServerIndex = 0;

  connect(username: string) {
    this.username = username;
    localStorage.setItem("tictactoe_username", username);
    
    if (this.socket && this.socket.connected) {
      console.log("Already connected to socket server");
      return Promise.resolve(true);
    }

    return this.tryConnect();
  }

  private tryConnect(serverIndex = 0): Promise<boolean> {
    this.currentServerIndex = serverIndex;
    const serverUrl = SERVER_OPTIONS[serverIndex];
    
    console.log(`Attempting to connect to server: ${serverUrl}`);
    
    return new Promise((resolve) => {
      try {
        // Clean up any existing socket
        if (this.socket) {
          this.socket.disconnect();
          this.socket.removeAllListeners();
        }
        
        // Connect to the server
        this.socket = io(serverUrl, {
          query: { username: this.username },
          transports: ["websocket", "polling"],
          autoConnect: true,
          reconnectionAttempts: 2,
          timeout: 5000, // 5 second timeout
          reconnectionDelay: 1000,
        });

        // Handle connection timeout
        const connectTimeout = setTimeout(() => {
          if (this.socket && !this.socket.connected) {
            console.log(`Connection timeout for server ${serverUrl}`);
            this.tryNextServer(resolve);
          }
        }, 6000);

        // Handle successful connection
        this.socket.on("connect", () => {
          console.log(`Connected to server: ${serverUrl}`);
          clearTimeout(connectTimeout);
          this.reconnectAttempts = 0;
          resolve(true);
        });

        // Handle connection errors
        this.socket.on("connect_error", (error) => {
          console.error(`Connection error for server ${serverUrl}:`, error);
          clearTimeout(connectTimeout);
          this.tryNextServer(resolve);
        });

        this.socket.on("disconnect", (reason) => {
          console.log(`Disconnected from server: ${reason}`);
          
          // Only attempt reconnection if it wasn't an intentional disconnect
          if (reason !== "io client disconnect") {
            setTimeout(() => {
              if (this.username) {
                console.log("Attempting to reconnect...");
                this.tryConnect(this.currentServerIndex);
              }
            }, 2000);
          }
        });

        this.socket.on("error", (error) => {
          console.error("Socket error:", error);
        });
      } catch (error) {
        console.error("Socket initialization error:", error);
        this.tryNextServer(resolve);
      }
    });
  }

  private tryNextServer(resolve: (value: boolean) => void) {
    this.reconnectAttempts++;
    const nextServerIndex = (this.currentServerIndex + 1) % SERVER_OPTIONS.length;
    
    console.log(`Trying next server (${this.reconnectAttempts}/${this.maxReconnectAttempts * SERVER_OPTIONS.length})`);
    
    // If we've tried all servers up to the maximum attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts * SERVER_OPTIONS.length) {
      console.log("All connection attempts failed. Using offline mode.");
      resolve(false);
      return;
    }
    
    // Try the next server
    this.tryConnect(nextServerIndex).then(resolve);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.username = null;
    }
  }

  // Room actions
  createRoom(roomName: string, isPrivate: boolean) {
    if (!this.socket) return Promise.reject("Not connected");
    
    return new Promise((resolve) => {
      this.socket?.emit("create_room", { roomName, isPrivate }, resolve);
    });
  }

  joinRoom(roomId: string) {
    if (!this.socket) return Promise.reject("Not connected");
    
    return new Promise((resolve, reject) => {
      this.socket?.emit("join_room", roomId, (response: { success: boolean, error?: string }) => {
        if (response.success) {
          resolve(response);
        } else {
          toast({
            title: "Failed to join room",
            description: response.error || "Room not found or full",
            variant: "destructive",
          });
          reject(response.error);
        }
      });
    });
  }

  leaveRoom() {
    if (!this.socket) return;
    this.socket.emit("leave_room");
  }

  joinRandomGame() {
    if (!this.socket) return Promise.reject("Not connected");
    
    return new Promise((resolve) => {
      this.socket?.emit("join_random", resolve);
    });
  }

  // Game actions
  makeMove(index: number) {
    if (!this.socket) return;
    this.socket.emit("move", index);
  }

  restartGame() {
    if (!this.socket) return;
    this.socket.emit("restart_game");
  }

  // Chat actions
  sendMessage(message: string) {
    if (!this.socket || !this.username) return;
    this.socket.emit("send_message", { text: message, sender: this.username });
  }

  // Event listeners
  onGameState(callback: (gameState: GameState) => void) {
    if (!this.socket) return;
    this.socket.on("game_state", callback);
    return () => this.socket?.off("game_state", callback);
  }

  onRoomList(callback: (rooms: Room[]) => void) {
    if (!this.socket) return;
    this.socket.on("room_list", callback);
    return () => this.socket?.off("room_list", callback);
  }

  onMessage(callback: (message: Message) => void) {
    if (!this.socket) return;
    this.socket.on("new_message", callback);
    return () => this.socket?.off("new_message", callback);
  }

  onPlayerJoined(callback: (username: string) => void) {
    if (!this.socket) return;
    this.socket.on("player_joined", callback);
    return () => this.socket?.off("player_joined", callback);
  }

  onPlayerLeft(callback: (username: string) => void) {
    if (!this.socket) return;
    this.socket.on("player_left", callback);
    return () => this.socket?.off("player_left", callback);
  }

  getRoomList() {
    if (!this.socket) return Promise.reject("Not connected");
    
    return new Promise((resolve) => {
      this.socket?.emit("get_rooms", resolve);
    });
  }

  get isConnected() {
    return this.socket?.connected || false;
  }

  get currentUsername() {
    return this.username;
  }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService;
