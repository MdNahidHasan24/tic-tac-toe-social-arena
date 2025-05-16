
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import socketService, { GameState, Message, Room } from "@/services/socketService";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

interface GameContextProps {
  username: string | null;
  setUsername: (username: string) => void;
  connectToServer: (username: string) => Promise<boolean>;
  disconnectFromServer: () => void;
  gameState: GameState | null;
  rooms: Room[];
  messages: Message[];
  currentRoom: string | null;
  createRoom: (name: string, isPrivate: boolean) => Promise<unknown>;
  joinRoom: (id: string) => Promise<unknown>;
  leaveRoom: () => void;
  joinRandomGame: () => Promise<unknown>;
  makeMove: (index: number) => void;
  sendMessage: (message: string) => void;
  restartGame: () => void;
  isConnected: boolean;
}

const initialGameState: GameState = {
  board: Array(9).fill(null),
  currentTurn: "X",
  gameOver: false,
  winner: null,
  winningCombination: null,
  players: {
    X: null,
    O: null,
  },
};

// For offline mode - demo rooms
const demoRooms: Room[] = [
  { 
    id: "demo-room-1", 
    name: "Public Game Room", 
    players: ["Player1"], 
    spectators: 0, 
    isPrivate: false 
  },
  { 
    id: "demo-room-2", 
    name: "Quick Match", 
    players: ["Player2", "Player3"], 
    spectators: 1, 
    isPrivate: false 
  }
];

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsernameState] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const { toast } = useToast();

  // Set username and store in localStorage
  const setUsername = (name: string) => {
    setUsernameState(name);
    localStorage.setItem("tictactoe_username", name);
  };

  // Connect to socket server
  const connectToServer = (username: string): Promise<boolean> => {
    return socketService
      .connect(username)
      .then((success) => {
        setUsername(username);
        
        if (success) {
          setIsOfflineMode(false);
          // Get initial room list
          socketService.getRoomList().then((rooms) => {
            setRooms(rooms as Room[]);
          });
          return true;
        } else {
          // Set up offline mode with demo data
          setIsOfflineMode(true);
          setRooms(demoRooms);
          return false;
        }
      })
      .catch((error) => {
        console.error("Failed to connect:", error);
        setIsOfflineMode(true);
        setRooms(demoRooms);
        return false;
      });
  };

  // Disconnect from socket server
  const disconnectFromServer = () => {
    socketService.disconnect();
    setGameState(null);
    setCurrentRoom(null);
    setRooms([]);
    setMessages([]);
    setUsernameState(null);
    setIsOfflineMode(false);
  };

  // Create a new room
  const createRoom = (name: string, isPrivate: boolean) => {
    if (isOfflineMode) {
      // Simulate room creation in offline mode
      const newRoomId = `room-${Date.now()}`;
      const newRoom: Room = {
        id: newRoomId,
        name,
        players: [username || "You"],
        spectators: 0,
        isPrivate
      };
      
      setRooms(prev => [...prev, newRoom]);
      setCurrentRoom(newRoomId);
      
      // Create initial game state
      setGameState({
        ...initialGameState,
        players: {
          X: username,
          O: null
        }
      });
      
      return Promise.resolve({ roomId: newRoomId, success: true });
    }
    
    return socketService.createRoom(name, isPrivate).then((response: any) => {
      if (response.roomId) {
        setCurrentRoom(response.roomId);
      }
      return response;
    });
  };

  // Join an existing room
  const joinRoom = (id: string) => {
    if (isOfflineMode) {
      // Simulate joining room in offline mode
      const roomToJoin = rooms.find(r => r.id === id);
      
      if (!roomToJoin) {
        return Promise.reject("Room not found");
      }
      
      if (roomToJoin.players.length >= 2) {
        return Promise.reject("Room is full");
      }
      
      // Update rooms list with joined room
      const updatedRooms = rooms.map(r => {
        if (r.id === id) {
          return {
            ...r,
            players: [...r.players, username || "You"]
          };
        }
        return r;
      });
      
      setRooms(updatedRooms);
      setCurrentRoom(id);
      
      // Create initial game state
      setGameState({
        ...initialGameState,
        players: {
          X: roomToJoin.players[0],
          O: username
        }
      });
      
      // Add welcome message
      const welcomeMessage: Message = {
        id: uuidv4(),
        sender: "System",
        text: `Welcome to the game room!`,
        timestamp: Date.now()
      };
      
      setMessages([welcomeMessage]);
      
      return Promise.resolve({ success: true });
    }
    
    return socketService.joinRoom(id).then((response) => {
      setCurrentRoom(id);
      return response;
    });
  };

  // Leave the current room
  const leaveRoom = () => {
    if (isOfflineMode) {
      // Simulate leaving room in offline mode
      setCurrentRoom(null);
      setGameState(null);
      setMessages([]);
      return;
    }
    
    socketService.leaveRoom();
    setCurrentRoom(null);
    setGameState(null);
    setMessages([]);
  };

  // Join a random game
  const joinRandomGame = () => {
    if (isOfflineMode) {
      // Find an available room or create one
      const availableRoom = rooms.find(r => !r.isPrivate && r.players.length < 2);
      
      if (availableRoom) {
        return joinRoom(availableRoom.id);
      } else {
        return createRoom("Quick Game", false);
      }
    }
    
    return socketService.joinRandomGame().then((response: any) => {
      if (response.roomId) {
        setCurrentRoom(response.roomId);
      }
      return response;
    });
  };

  // Make a move in the game
  const makeMove = (index: number) => {
    if (isOfflineMode) {
      // Simulate making a move in offline mode
      if (!gameState) return;
      
      // Check if the cell is already occupied or game is over
      if (gameState.board[index] || gameState.gameOver) {
        return;
      }
      
      const newBoard = [...gameState.board];
      newBoard[index] = gameState.currentTurn;
      
      // Check for win or draw
      const winner = checkWinner(newBoard);
      const isDraw = !winner && newBoard.every(cell => cell !== null);
      
      // Update game state
      setGameState({
        ...gameState,
        board: newBoard,
        currentTurn: gameState.currentTurn === "X" ? "O" : "X",
        gameOver: winner !== null || isDraw,
        winner: winner ? gameState.players[gameState.currentTurn] : null,
        winningCombination: winner,
      });
      
      // Simulate bot response in 1 second if playing as X
      if (!winner && !isDraw && gameState.currentTurn === "X" && !gameState.players.O) {
        setTimeout(() => {
          const emptyCells = newBoard
            .map((cell, idx) => cell === null ? idx : -1)
            .filter(idx => idx !== -1);
            
          if (emptyCells.length > 0) {
            const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            makeMove(randomIndex);
          }
        }, 1000);
      }
      
      return;
    }
    
    socketService.makeMove(index);
  };

  // Check for a winner
  const checkWinner = (board: (string | null)[]): number[] | null => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    
    for (const line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return line;
      }
    }
    
    return null;
  };

  // Send a chat message
  const sendMessage = (message: string) => {
    if (isOfflineMode) {
      // Simulate sending a message in offline mode
      const newMessage: Message = {
        id: uuidv4(),
        sender: username || "You",
        text: message,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Simulate bot response after 1-2 seconds
      setTimeout(() => {
        const botResponses = [
          "I see what you mean.",
          "Interesting move!",
          "Let me think about that.",
          "Good game so far!",
          "I'm enjoying this match.",
          "Your strategy is interesting.",
          "Let's have a good game!",
        ];
        
        const botMessage: Message = {
          id: uuidv4(),
          sender: gameState?.players.X === username ? 
            (gameState?.players.O || "Opponent") : 
            (gameState?.players.X || "Opponent"),
          text: botResponses[Math.floor(Math.random() * botResponses.length)],
          timestamp: Date.now()
        };
        
        setMessages(prev => [...prev, botMessage]);
      }, Math.random() * 1000 + 1000);
      
      return;
    }
    
    socketService.sendMessage(message);
  };

  // Restart the game
  const restartGame = () => {
    if (isOfflineMode) {
      // Simulate restarting the game in offline mode
      setGameState({
        ...initialGameState,
        players: gameState?.players || { X: username, O: null }
      });
      
      // Add system message about restart
      const restartMessage: Message = {
        id: uuidv4(),
        sender: "System",
        text: "Game has been restarted.",
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, restartMessage]);
      
      return;
    }
    
    socketService.restartGame();
  };

  // Set up socket event listeners
  useEffect(() => {
    if (isOfflineMode) return;
    
    // Check for stored username
    const storedUsername = localStorage.getItem("tictactoe_username");
    if (storedUsername) {
      setUsernameState(storedUsername);
    }

    const gameStateUnsubscribe = socketService.onGameState((state) => {
      setGameState(state);
    });

    const roomListUnsubscribe = socketService.onRoomList((list) => {
      setRooms(list);
    });

    const messageUnsubscribe = socketService.onMessage((message) => {
      setMessages((prev) => [...prev, message]);
    });

    const playerJoinedUnsubscribe = socketService.onPlayerJoined((username) => {
      toast({
        title: "Player joined",
        description: `${username} has joined the game`,
      });
    });

    const playerLeftUnsubscribe = socketService.onPlayerLeft((username) => {
      toast({
        title: "Player left",
        description: `${username} has left the game`,
      });
    });

    return () => {
      gameStateUnsubscribe?.();
      roomListUnsubscribe?.();
      messageUnsubscribe?.();
      playerJoinedUnsubscribe?.();
      playerLeftUnsubscribe?.();
    };
  }, [toast, isOfflineMode]);

  return (
    <GameContext.Provider
      value={{
        username,
        setUsername,
        connectToServer,
        disconnectFromServer,
        gameState,
        rooms,
        messages,
        currentRoom,
        createRoom,
        joinRoom,
        leaveRoom,
        joinRandomGame,
        makeMove,
        sendMessage,
        restartGame,
        isConnected: socketService.isConnected || isOfflineMode,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextProps => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
