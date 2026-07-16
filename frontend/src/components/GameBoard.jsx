import React, { useState, useEffect } from 'react';
import { User, Users } from 'lucide-react';

const GameBoard = ({ socket, roomId, matchPlayers = [], onLeave }) => {
  const [guesses, setGuesses] = useState([]); 
  const [currentGuess, setCurrentGuess] = useState("");
  
  // Opponents State: map of socketId -> { firstName, feedbackRows: [] }
  const [opponents, setOpponents] = useState({});

  const [gameStatus, setGameStatus] = useState("playing"); 
  const [winnerMessage, setWinnerMessage] = useState("");

  // Initialize opponents from matchPlayers (exclude self)
  useEffect(() => {
    const opps = {};
    matchPlayers.forEach(p => {
      if (p.socketId !== socket.id) {
        opps[p.socketId] = {
          firstName: p.firstName || "Rival",
          feedbackRows: []
        };
      }
    });
    setOpponents(opps);
  }, [matchPlayers, socket.id]);

  useEffect(() => {
    socket.on('guessEvaluated', (data) => {
      if (data.playerId === socket.id) {
        // Update MY board with word and colors
        setGuesses((prev) => [...prev, { word: data.guess, feedback: data.feedback }]);
        setCurrentGuess("");
      } else {
        // Update specific OPPONENT'S board
        setOpponents(prev => {
          const oppId = data.playerId;
          const oppData = prev[oppId] || { firstName: "Unknown", feedbackRows: [] };
          return {
            ...prev,
            [oppId]: {
              ...oppData,
              feedbackRows: [...oppData.feedbackRows, data.feedback]
            }
          };
        });
      }
    });

    socket.on('gameOver', (data) => {
      setGameStatus(data.winner === socket.id ? "won" : "lost");
      if (data.winner === socket.id) {
        setWinnerMessage("🏆 You Won!");
      } else {
        const winnerObj = matchPlayers.find(p => p.socketId === data.winner);
        const winnerName = winnerObj ? winnerObj.firstName : "An opponent";
        setWinnerMessage(`💀 ${winnerName} won. Word was ${data.word}`);
      }
    });

    return () => {
      socket.off('guessEvaluated');
      socket.off('gameOver');
    };
  }, [socket, matchPlayers]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameStatus !== "playing") return;

      if (e.key === "Enter") {
        if (currentGuess.length === 5) {
          socket.emit('submitGuess', { roomId, guess: currentGuess });
        }
      } else if (e.key === "Backspace") {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (/^[A-Za-z]$/.test(e.key) && currentGuess.length < 5) {
        setCurrentGuess((prev) => (prev + e.key).toUpperCase());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentGuess, gameStatus, roomId, socket]);

  const getFeedbackColor = (status) => {
    if (status === 'correct') return 'bg-[#6aaa64] border-[#6aaa64] text-white'; 
    if (status === 'present') return 'bg-[#c9b458] border-[#c9b458] text-white'; 
    if (status === 'absent') return 'bg-[#787c7e] border-[#787c7e] text-white';  
    return 'bg-zinc-900 border-zinc-700 text-white'; 
  };

  const opponentEntries = Object.entries(opponents);

  return (
    <div className="flex flex-col items-center justify-start pt-10 min-h-screen bg-zinc-950 text-white w-full">
      
      {/* Header */}
      <div className="flex justify-between w-full max-w-5xl mb-8 items-center px-4">
        <h2 className="text-2xl font-black tracking-wider">WORDLE<span className="text-[#c9b458]">.BATTLE</span></h2>
        <button onClick={onLeave} className="px-4 py-2 bg-red-950/40 text-red-400 hover:text-red-300 rounded-lg transition-all text-xs font-bold border border-red-900/40 hover:border-red-500/50">
          Forfeit Match
        </button>
      </div>

      {gameStatus !== "playing" && (
        <div className="mb-6 px-8 py-4 bg-zinc-900 border border-zinc-700 rounded-xl font-black text-2xl text-center shadow-2xl animate-pulse z-50">
          {winnerMessage}
        </div>
      )}

      {/* Arena Layout */}
      <div className="flex flex-col gap-10 w-full items-center px-4">
        
        {/* --- OPPONENTS RACK --- */}
        {opponentEntries.length > 0 && (
          <div className="w-full max-w-5xl">
            <div className="flex items-center justify-center gap-2 text-zinc-400 font-bold text-xs uppercase tracking-widest mb-4">
              <Users size={14} /> Rivals ({opponentEntries.length})
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {opponentEntries.map(([socketId, data]) => (
                <div key={socketId} className="flex flex-col items-center gap-2 p-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl w-40">
                  <div className="text-xs font-bold text-zinc-300 truncate w-full text-center">
                    {data.firstName}'s Board
                  </div>
                  <div className="grid grid-rows-6 gap-0.5">
                    {[...Array(6)].map((_, rowIndex) => {
                      const feedbackRow = data.feedbackRows[rowIndex]; 
                      return (
                        <div key={`opp-${socketId}-${rowIndex}`} className="grid grid-cols-5 gap-0.5">
                          {[...Array(5)].map((_, colIndex) => {
                            const status = feedbackRow ? feedbackRow[colIndex] : null;
                            const colorClass = status ? getFeedbackColor(status) : 'bg-zinc-800/50 border-zinc-800';
                            return (
                              <div 
                                key={`opp-${socketId}-${rowIndex}-${colIndex}`} 
                                className={`w-5 h-5 rounded-[2px] border transition-all duration-500 ${colorClass}`}
                              />
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- MAIN PLAYER BOARD --- */}
        <div className="mt-4">
            <div className="grid grid-rows-6 gap-1.5 pb-10">
            {[...Array(6)].map((_, rowIndex) => {
                const isCurrentRow = rowIndex === guesses.length;
                const guessData = guesses[rowIndex]; 
                
                return (
                <div key={`my-${rowIndex}`} className="grid grid-cols-5 gap-1.5">
                    {[...Array(5)].map((_, colIndex) => {
                    let letter = "";
                    let colorClass = "border-zinc-700 bg-zinc-900/80 text-white"; 
    
                    if (guessData) {
                        letter = guessData.word[colIndex];
                        colorClass = getFeedbackColor(guessData.feedback[colIndex]);
                    } else if (isCurrentRow && currentGuess[colIndex]) {
                        letter = currentGuess[colIndex];
                        colorClass = "border-zinc-400 text-white shadow-[0_0_12px_rgba(255,255,255,0.15)] scale-[1.02]";
                    }
    
                    return (
                        <div 
                        key={`my-${rowIndex}-${colIndex}`} 
                        className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-3xl font-black uppercase border-2 rounded-xl transition-all duration-300 ${colorClass}`}
                        >
                        {letter}
                        </div>
                    );
                    })}
                </div>
                );
            })}
            </div>
        </div>

      </div>
    </div>
  );
};

export default GameBoard;