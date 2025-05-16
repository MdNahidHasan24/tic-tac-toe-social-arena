
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import socketService, { GameState, Message, Room } from "@/services/socketService";
import { useToast } from "@/hooks/use-toast";

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

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsernameState] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
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
      .then(() => {
        setUsername(username);
        // Get initial room list
        socketService.getRoomList().then((rooms) => {
          setRooms(rooms as Room[]);
        });
        return true;
      })
      .catch((error) => {
        console.error("Failed to connect:", error);
        return false;
      });
  };

  // Disconnect from socket server
  const disconnectFromServer = () => {
    socketService.disconnect();
    setGameState(null);
    setCurrentRoom(null);
  };

  // Create a new room
  const createRoom = (name: string, isPrivate: boolean) => {
    return socketService.createRoom(name, isPrivate).then((response: any) => {
      if (response.roomId) {
        setCurrentRoom(response.roomId);
      }
      return response;
    });
  };

  // Join an existing room
  const joinRoom = (id: string) => {
    return socketService.joinRoom(id).then((response) => {
      setCurrentRoom(id);
      return response;
    });
  };

  // Leave the current room
  const leaveRoom = () => {
    socketService.leaveRoom();
    setCurrentRoom(null);
    setGameState(null);
    setMessages([]);
  };

  // Join a random game
  const joinRandomGame = () => {
    return socketService.joinRandomGame().then((response: any) => {
      if (response.roomId) {
        setCurrentRoom(response.roomId);
      }
      return response;
    });
  };

  // Make a move in the game
  const makeMove = (index: number) => {
    socketService.makeMove(index);
  };

  // Send a chat message
  const sendMessage = (message: string) => {
    socketService.sendMessage(message);
  };

  // Restart the game
  const restartGame = () => {
    socketService.restartGame();
  };

  // Set up socket event listeners
  useEffect(() => {
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
  }, [toast]);

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
        isConnected: socketService.isConnected,
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
