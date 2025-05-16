
import { io, Socket } from "socket.io-client";
import { toast } from "@/hooks/use-toast";

// For local development, connect to localhost
// For production, this would be your server URL
const SOCKET_URL = "https://tic-tac-toe-server.glitch.me"; // Example server URL - in production, you'd use your own server

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

  connect(username: string) {
    this.username = username;
    
    if (this.socket && this.socket.connected) {
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      // In a real implementation, you'd use your actual server URL
      this.socket = io(SOCKET_URL, {
        query: { username },
        transports: ["websocket"],
        autoConnect: true,
      });

      this.socket.on("connect", () => {
        console.log("Connected to socket server");
        resolve(true);
      });

      this.socket.on("connect_error", (error) => {
        console.error("Connection error:", error);
        toast({
          title: "Connection failed",
          description: "Could not connect to game server. Please try again.",
          variant: "destructive",
        });
        reject(error);
      });

      this.socket.on("error", (error) => {
        console.error("Socket error:", error);
        toast({
          title: "Server error",
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
      });
    });
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
