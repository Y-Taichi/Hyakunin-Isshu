import React from 'react';
import { GameMode, SakasamaMode } from '../types';
import { Settings, ArrowDownUp, ArrowUpDown, Shuffle } from 'lucide-react';

interface StartScreenProps {
  onStart: (mode: GameMode, sakasama: SakasamaMode) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [sakasama, setSakasama] = React.useState<SakasamaMode>(SakasamaMode.OFF);

  const toggleSakasama = () => {
    setSakasama((prev) => {
      if (prev === SakasamaMode.OFF) return SakasamaMode.ON;
      if (prev === SakasamaMode.ON) return SakasamaMode.RANDOM;
      return SakasamaMode.OFF;
    });
  };

  const getSakasamaIcon = () => {
    switch (sakasama) {
      case SakasamaMode.OFF: return "オフ";
      case SakasamaMode.ON: return "オン";
      case SakasamaMode.RANDOM: return "ランダム";
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-100 p-4 bg-[url('https://www.transparenttextures.com/patterns/japanese-sayagata.png')]">
      <div className="bg-white/90 p-8 rounded-xl shadow-2xl border-4 border-stone-800 max-w-md w-full text-center">
        <h1 className="text-4xl font-bold mb-2 font-serif text-stone-800">百人一首</h1>
        <h2 className="text-xl mb-8 font-serif text-stone-600">マスター</h2>

        <div className="space-y-4 mb-8">
           <button
             onClick={toggleSakasama}
             className="w-full flex items-center justify-between px-6 py-4 bg-stone-200 hover:bg-stone-300 rounded-lg transition text-stone-800 font-bold"
           >
             <div className="flex items-center gap-2">
                <Settings size={20} />
                <span>さかさまモード</span>
             </div>
             <span className="bg-white px-3 py-1 rounded-full text-sm border border-stone-300">
               {getSakasamaIcon()}
             </span>
           </button>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => onStart(GameMode.KAMI_TO_SHIMO, sakasama)}
            className="group w-full relative flex items-center justify-center gap-3 bg-teal-800 text-white py-5 rounded-lg hover:bg-teal-700 transition shadow-lg overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <ArrowDownUp size={24} />
            <span className="text-lg font-bold relative z-10">上の句 → 下の句</span>
          </button>

          <button
            onClick={() => onStart(GameMode.SHIMO_TO_KAMI, sakasama)}
            className="group w-full relative flex items-center justify-center gap-3 bg-indigo-800 text-white py-5 rounded-lg hover:bg-indigo-700 transition shadow-lg overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <ArrowUpDown size={24} />
            <span className="text-lg font-bold relative z-10">下の句 → 上の句</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;