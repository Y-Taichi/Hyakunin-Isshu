import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameMode, SakasamaMode, Poem, GameStats, QueuedPoem } from '../types';
import { POEMS } from '../constants';
import { shuffleArray, formatKamiText } from '../utils';
import Card from './Card';
import { Home, RefreshCcw, Keyboard } from 'lucide-react';

interface GameScreenProps {
  mode: GameMode;
  sakasamaMode: SakasamaMode;
  onExit: () => void;
}

interface GameOption {
  poem: Poem;
  isSakasama: boolean;
}

const TYPEWRITER_SPEED_MS = 150;
const MISTAKE_PENALTY_DELAY_MS = 2500; // Updated to 2.5s
// Correct delay removed (effectively 0 for instant progression)

const GameScreen: React.FC<GameScreenProps> = ({ mode, sakasamaMode, onExit }) => {
  // State
  // State
  const [isMobile, setIsMobile] = useState(false);
  const [queue, setQueue] = useState<QueuedPoem[]>([]);
  const [currentPoem, setCurrentPoem] = useState<Poem | null>(null);
  const [options, setOptions] = useState<GameOption[]>([]);

  // Stats
  const [stats, setStats] = useState<Record<number, GameStats>>({});
  const [startTime, setStartTime] = useState<number>(0);

  // UI State
  const [displayedKami, setDisplayedKami] = useState('');
  const [feedback, setFeedback] = useState<'incorrect' | null>(null); // 'correct' removed as we skip immediately
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isSakasamaThisTurn, setIsSakasamaThisTurn] = useState(false); // Used for ShimoToKami (or removed if not needed, but ShimoToKami shows one card)
  const [highlightCorrectId, setHighlightCorrectId] = useState<number | null>(null);

  // Refs for logic
  const kamiIntervalRef = useRef<number | null>(null);
  const completedPoemsCount = useRef(0);

  // --- Initialization ---

  useEffect(() => {
    // Mobile Check
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Initial Shuffle
    const initialQueue: QueuedPoem[] = shuffleArray(POEMS).map(p => ({
      poemId: p.id,
      isReview: false
    }));
    setQueue(initialQueue);
    nextTurn(initialQueue);

    return () => {
      if (kamiIntervalRef.current) clearInterval(kamiIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Typewriter Effect ---
  useEffect(() => {
    if (kamiIntervalRef.current) {
      clearInterval(kamiIntervalRef.current);
      kamiIntervalRef.current = null;
    }

    if (mode !== GameMode.KAMI_TO_SHIMO || !currentPoem) {
      if (currentPoem) setDisplayedKami(currentPoem.kami);
      return;
    }

    setDisplayedKami('');
    // Format text for mobile if needed
    const rawText = currentPoem.kami;
    const fullText = isMobile ? formatKamiText(rawText) : rawText;
    let charCount = 0;

    kamiIntervalRef.current = window.setInterval(() => {
      charCount++;
      if (charCount <= fullText.length) {
        setDisplayedKami(fullText.substring(0, charCount));
      } else {
        if (kamiIntervalRef.current) clearInterval(kamiIntervalRef.current);
      }
    }, TYPEWRITER_SPEED_MS);

    return () => {
      if (kamiIntervalRef.current) clearInterval(kamiIntervalRef.current);
    };
  }, [currentPoem, mode]);

  // --- Keyboard Listeners ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (feedback !== null || !currentPoem) return;

      // Space key for Skip
      if (e.code === 'Space') {
        e.preventDefault();
        handleSkip();
        return;
      }

      // Number keys
      // In KAMI_TO_SHIMO: 1-9, 0 (10)
      // In SHIMO_TO_KAMI: 1-6
      const key = e.key;
      const num = parseInt(key, 10);

      if (!isNaN(num)) {
        let index = -1;
        if (num === 0) index = 9;
        else index = num - 1;

        if (index >= 0 && index < options.length) {
          handleOptionClick(options[index].poem.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, currentPoem, feedback]);


  // --- Turn Logic ---

  const nextTurn = (currentQueue: QueuedPoem[]) => {
    if (currentQueue.length === 0) {
      startReviewMode();
      return;
    }

    const nextItem = currentQueue[0];
    const poem = POEMS.find(p => p.id === nextItem.poemId);

    if (!poem) {
      const remaining = currentQueue.slice(1);
      setQueue(remaining);
      nextTurn(remaining);
      return;
    }

    let isSakasama = false;
    if (sakasamaMode === SakasamaMode.ON) isSakasama = true;
    else if (sakasamaMode === SakasamaMode.RANDOM) isSakasama = Math.random() > 0.5;

    setIsSakasamaThisTurn(isSakasama);
    setCurrentPoem(poem);
    setFeedback(null);
    setHighlightCorrectId(null);
    setStartTime(Date.now());

    // Generate Options
    // Generate Options
    const otherPoems = POEMS.filter(p => p.id !== poem.id);

    // Distractors count: Mobile KAMI_TO_SHIMO -> 3 (Total 4). Desktop -> 9 (Total 10).
    // ShimoToKami -> 5 (Total 6) - keeping unchanged for now unless requested.
    // Distractors count: Mobile KAMI_TO_SHIMO -> 3 (Total 4). Desktop -> 9 (Total 10).
    // ShimoToKami -> 5 (Total 6) - Desktop. Mobile requirement: "BUTTONS are 4 only".
    // So ShimoToKami Mobile -> 3 (Total 4).
    let distractorsCount = 9; // Default Desktop KAMI_TO_SHIMO

    if (mode === GameMode.SHIMO_TO_KAMI) {
      distractorsCount = 5; // Default Desktop SHIMO_TO_KAMI -> 6 options
    }

    if (isMobile) {
      // Both modes max 4 options (3 distractors)
      distractorsCount = 3;
    }

    const distractors = shuffleArray(otherPoems).slice(0, distractorsCount);
    const allOptionsPoem = shuffleArray([poem, ...distractors]);

    // Determine Sakasama for each option
    const newOptions: GameOption[] = allOptionsPoem.map(p => {
      let isCardSakasama = false;
      if (sakasamaMode === SakasamaMode.ON) isCardSakasama = true;
      else if (sakasamaMode === SakasamaMode.RANDOM) isCardSakasama = Math.random() > 0.5;

      return { poem: p, isSakasama: isCardSakasama };
    });

    setOptions(newOptions);
  };

  const startReviewMode = () => {
    setIsReviewMode(true);
    completedPoemsCount.current = 0;

    const statValues = Object.values(stats) as GameStats[];
    const sortedStats = statValues.sort((a, b) => {
      if (b.mistakes !== a.mistakes) return b.mistakes - a.mistakes;
      return b.timeTaken - a.timeTaken;
    });

    const newQueue: QueuedPoem[] = sortedStats.map(s => ({
      poemId: s.poemId,
      isReview: true
    }));

    if (newQueue.length === 0) {
      const freshStart = shuffleArray(POEMS).map(p => ({ poemId: p.id, isReview: true }));
      setQueue(freshStart);
      nextTurn(freshStart);
    } else {
      setQueue(newQueue);
      nextTurn(newQueue);
    }
  };

  // --- Interaction ---

  const handleSkip = () => {
    if (currentPoem) handleWrongAnswer(currentPoem.id);
  };

  const handleWrongAnswer = (correctId: number) => {
    setFeedback('incorrect');
    setHighlightCorrectId(correctId);

    // Record Stats (Mistake)
    setStats(prev => {
      const existing = prev[correctId] || { poemId: correctId, timeTaken: 0, mistakes: 0, lastResult: null };
      return {
        ...prev,
        [correctId]: {
          ...existing,
          mistakes: existing.mistakes + 1,
          lastResult: 'incorrect'
        }
      };
    });

    // Penalty logic
    const currentItem = queue[0];
    const restOfQueue = queue.slice(1);
    const insertIndex = Math.min(3, restOfQueue.length);
    const newQueue = [...restOfQueue];
    newQueue.splice(insertIndex, 0, currentItem);

    setTimeout(() => {
      setQueue(newQueue);
      nextTurn(newQueue);
    }, MISTAKE_PENALTY_DELAY_MS);
  };

  const handleOptionClick = (selectedId: number) => {
    if (feedback !== null || !currentPoem) return;

    if (kamiIntervalRef.current) clearInterval(kamiIntervalRef.current);
    const timeSpent = Date.now() - startTime;
    const isCorrect = selectedId === currentPoem.id;

    if (isCorrect) {
      // Correct: Immediate progression
      setStats(prev => {
        const existing = prev[currentPoem.id] || { poemId: currentPoem.id, timeTaken: 0, mistakes: 0, lastResult: null };
        return {
          ...prev,
          [currentPoem.id]: {
            ...existing,
            timeTaken: (existing.timeTaken + timeSpent) / (existing.lastResult ? 2 : 1),
            lastResult: 'correct'
          }
        };
      });

      // Show full text briefly? No, user said immediate.
      // But we should probably ensure the full text was visible for a split second?
      // Request says "Proceed immediately".

      const nextQueue = queue.slice(1);
      setQueue(nextQueue);
      if (!isReviewMode) completedPoemsCount.current += 1;
      nextTurn(nextQueue);

    } else {
      handleWrongAnswer(currentPoem.id);
    }
  };

  // --- Renders ---

  if (!currentPoem) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className={`
      h-[100dvh] w-full flex flex-col overflow-hidden
      bg-stone-100 bg-[url('https://www.transparenttextures.com/patterns/japanese-sayagata.png')] font-bold
    `}>

      {/* Header */}
      <div className="bg-stone-800 text-stone-100 px-4 py-2 flex justify-between items-center shadow-md z-20">
        <button onClick={onExit} className="p-2 hover:bg-stone-700 rounded-full" title="ホームへ戻る">
          <Home size={20} />
        </button>
        <div className="flex flex-col items-center">
          <div className="text-sm font-serif">
            {isReviewMode ? (
              <span className="flex items-center gap-1 text-yellow-500 font-bold"><RefreshCcw size={14} /> 復習モード</span>
            ) : (
              <span>{completedPoemsCount.current} / 100 首</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-stone-400 text-xs md:text-sm">
          <Keyboard size={16} />
          <span className="hidden md:inline">Space: スキップ</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start p-1 md:p-4 w-full max-w-6xl mx-auto overflow-hidden">

        {/* Top Section: Question Area */}
        <div className="w-full flex justify-center mb-4 md:mb-8 min-h-[80px] md:min-h-[120px] items-center">
          {mode === GameMode.KAMI_TO_SHIMO ? (
            // KAMI -> SHIMO: Show Kami text
            <div className="relative w-full max-w-3xl bg-white/90 p-4 md:p-8 rounded-xl shadow-lg border-2 border-stone-200 min-h-[80px] flex items-center justify-start">
              <h2 className={`text-xl md:text-4xl font-serif text-stone-800 text-left tracking-widest leading-relaxed font-bold ${isMobile ? 'whitespace-pre-wrap' : 'whitespace-nowrap'}`}>
                {displayedKami}
              </h2>
            </div>
          ) : (
            // SHIMO -> KAMI: Show Shimo Card (Question)
            // This is just a display, no interaction needed
            <div className="py-2">
              <Card
                text={currentPoem.shimo}
                isSakasama={isSakasamaThisTurn}
                className="scale-110 md:scale-125"
                disabled
              />
            </div>
          )}
        </div>

        {/* Feedback Overlay (Only for incorrect) */}
        {feedback === 'incorrect' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 pointer-events-none">
            <div className="text-5xl md:text-7xl font-bold text-red-600 drop-shadow-lg bg-white/80 px-8 py-4 rounded-xl border-4 border-red-500 animate-bounce">
              答え
            </div>
          </div>
        )}

        {/* Bottom Section: Answer Area */}
        <div className="w-full flex-1 flex flex-col justify-center">
          {mode === GameMode.KAMI_TO_SHIMO ? (
            // KAMI -> SHIMO: Select from Cards
            // Desktop: 2 rows of 5 cards (grid-cols-5)
            // Mobile: 2x2 grid (grid-cols-2), Minimal Gap
            <div className={`grid ${isMobile ? 'grid-cols-2 gap-1 w-full h-full content-center' : 'grid-cols-5 gap-2 md:gap-6 w-full max-w-5xl'} justify-items-center mx-auto`}>
              {options.map((opt, idx) => (
                <Card
                  key={opt.poem.id}
                  text={opt.poem.shimo}
                  isSakasama={opt.isSakasama}
                  onClick={() => handleOptionClick(opt.poem.id)}
                  disabled={feedback !== null}
                  // Highlight correct if feedback is incorrect
                  isCorrectHighlight={feedback === 'incorrect' && opt.poem.id === highlightCorrectId}
                  // Fade others if feedback is incorrect
                  className={feedback === 'incorrect' && opt.poem.id !== highlightCorrectId ? "opacity-20 blur-[2px]" : ""}
                  // Hide numbers on mobile
                  shortcutKey={isMobile ? undefined : (idx === 9 ? '0' : (idx + 1).toString())}
                  isMobile={isMobile}
                />
              ))}
            </div>
          ) : (
            // SHIMO -> KAMI: Select from Text Buttons
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-2 w-full px-2 py-1 overflow-y-auto' : 'grid-cols-2 gap-3 md:gap-4 w-full max-w-4xl'} mx-auto`}>
              {options.map((opt, idx) => (
                <button
                  key={opt.poem.id}
                  onClick={() => handleOptionClick(opt.poem.id)}
                  disabled={feedback !== null}
                  className={`
                    relative group
                    p-4 md:p-6 rounded-xl border-2 text-left transition-all duration-200
                    font-serif text-lg md:text-2xl text-stone-800 font-bold
                    flex items-center gap-4
                    ${feedback === 'incorrect' && opt.poem.id === highlightCorrectId ? 'bg-red-50 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)] z-10 scale-105' : ''}
                    ${feedback === 'incorrect' && opt.poem.id !== highlightCorrectId ? 'opacity-30' : ''}
                    ${feedback === null ? 'bg-white border-stone-300 hover:border-teal-600 hover:bg-stone-50 hover:shadow-md' : ''}
                  `}
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center font-sans font-bold text-sm">
                    {idx + 1}
                  </span>
                  <span>{opt.poem.kami}</span>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default GameScreen;
