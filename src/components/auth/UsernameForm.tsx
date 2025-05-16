
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface UsernameFormProps {
  onSubmit: (username: string) => void;
}

export const UsernameForm: React.FC<UsernameFormProps> = ({ onSubmit }) => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    
    if (username.trim().length > 15) {
      setError("Username must be less than 15 characters");
      return;
    }
    
    onSubmit(username.trim());
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-2 border-game-secondary">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-game-primary">Welcome to Tic-Tac-Toe!</CardTitle>
        <CardDescription>Please enter your username to continue</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-2">
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                className="border-2 border-game-secondary focus:border-game-primary"
                autoComplete="off"
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-game-primary hover:bg-game-primary/90 transition-all"
          >
            Start Playing
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default UsernameForm;
