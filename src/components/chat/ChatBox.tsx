
import React, { useState, useRef, useEffect } from "react";
import { useGame } from "@/context/GameContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SendHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const ChatBox: React.FC = () => {
  const { messages, sendMessage, username } = useGame();
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && username) {
      sendMessage(newMessage.trim());
      setNewMessage("");
    }
  };

  return (
    <Card className="h-full flex flex-col shadow-lg border-2 border-game-secondary">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-game-primary">Game Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-3 pt-0">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === username ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.sender === username
                      ? 'bg-game-primary text-white rounded-tr-none'
                      : 'bg-game-secondary rounded-tl-none'
                  }`}
                >
                  {msg.sender !== username && (
                    <div className="font-semibold text-xs">{msg.sender}</div>
                  )}
                  <div>{msg.text}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 border-2 border-game-secondary focus:border-game-primary"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newMessage.trim()}
            className="bg-game-primary hover:bg-game-primary/90"
          >
            <SendHorizontal size={18} />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChatBox;
