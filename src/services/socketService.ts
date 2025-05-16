
import { io, Socket } from "socket.io-client";
import { toast } from "@/hooks/use-toast";

// Use a more reliable WebSocket server for the game
const SOCKET_URL = "https://tic-tac-toe-server-production.up.railway.app";
// Fallback for development or if main server is down
const FALLBACK_URL = "https://tictactoe-socket-server.onrender.com";

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
  private maxReconnectAttempts = 5;

  connect(username: string) {
    this.username = username;
    localStorage.setItem("tictactoe_username", username);
    
    if (this.socket && this.socket.connected) {
      return Promise.resolve(true);
    }
    
    return new Promise((resolve, reject) => {
      try {
        // Try main server first
        this.socket = io(SOCKET_URL, {
          query: { username },
          transports: ["websocket", "polling"], // Add polling as fallback
          autoConnect: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          timeout: 8000, // 8 second timeout
          reconnectionDelay: 1000,
        });

        const connectTimeout = setTimeout(() => {
          if (this.socket && !this.socket.connected) {
            // Try fallback server if main fails
            console.log("Main server connection timeout, trying fallback...");
            this.socket.disconnect();
            this.connectToFallback(username, resolve, reject);
          }
        }, 5000);

        this.socket.on("connect", () => {
          console.log("Connected to socket server");
          clearTimeout(connectTimeout);
          this.reconnectAttempts = 0;
          resolve(true);
        });

        this.socket.on("connect_error", (error) => {
          console.error("Connection error:", error);
          clearTimeout(connectTimeout);
          if (this.reconnectAttempts === 0) {
            this.connectToFallback(username, resolve, reject);
          } else {
            // Handle as graceful degradation
            console.log("Using offline mode");
            resolve(false); // Resolve but indicate connection failed
          }
        });

        this.socket.on("disconnect", () => {
          console.log("Disconnected from server");
        });

        this.socket.on("error", (error) => {
          console.error("Socket error:", error);
        });
      } catch (error) {
        console.error("Socket initialization error:", error);
        reject(error);
      }
    });
  }

  private connectToFallback(username: string, resolve: (value: boolean) => void, reject: (reason?: any) => void) {
    this.reconnectAttempts++;
    console.log(`Attempting fallback connection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    try {
      this.socket = io(FALLBACK_URL, {
        query: { username },
        transports: ["websocket", "polling"],
        autoConnect: true,
        timeout: 8000,
      });
      
      this.socket.on("connect", () => {
        console.log("Connected to fallback server");
        this.reconnectAttempts = 0;
        resolve(true);
      });
      
      this.socket.on("connect_error", (error) => {
        console.error("Fallback connection error:", error);
        // All connection attempts failed
        // Resolve anyway to allow offline/demo mode
        resolve(false);
      });
    } catch (error) {
      console.error("Fallback connection failed:", error);
      resolve(false); // Allow app to continue in offline mode
    }
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
