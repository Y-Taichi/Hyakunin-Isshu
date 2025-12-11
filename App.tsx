import React, { useState } from 'react';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import { GameMode, SakasamaMode } from './types';

const App: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.KAMI_TO_SHIMO);
  const [sakasamaMode, setSakasamaMode] = useState<SakasamaMode>(SakasamaMode.OFF);

  const handleStart = (mode: GameMode, sakasama: SakasamaMode) => {
    setGameMode(mode);
    setSakasamaMode(sakasama);
    setIsPlaying(true);
  };

  const handleExit = () => {
    setIsPlaying(false);
  };

  return (
    <div className="antialiased text-stone-900">
      {isPlaying ? (
        <GameScreen 
          mode={gameMode} 
          sakasamaMode={sakasamaMode} 
          onExit={handleExit} 
        />
      ) : (
        <StartScreen onStart={handleStart} />
      )}
    </div>
  );
};

export default App;