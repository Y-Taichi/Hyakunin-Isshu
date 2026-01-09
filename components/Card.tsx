import React, { useMemo } from 'react';

interface CardProps {
  text: string;
  isSakasama?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  shortcutKey?: string;
  isCorrectHighlight?: boolean; // New prop for highlighting correct answer on mistake
  isMobile?: boolean; // New prop to disable hover effects
}

const Card: React.FC<CardProps> = ({
  text,
  isSakasama = false,
  onClick,
  className = '',
  disabled = false,
  shortcutKey,
  isCorrectHighlight = false,
  isMobile = false
}) => {
  // Map text characters to grid positions
  // Standard Shimo is 14 chars. 5-5-4 distribution.
  // Grid is 3 columns (Vertical lines), 5 rows (Chars).
  // Right column (Col 3) is first line.

  const chars = useMemo(() => {
    const c = text.split('');
    const gridItems = [];

    // We have 15 cells in a 3x5 grid.
    // Line 1: Indices 0-4 (Right Column)
    // Line 2: Indices 5-9 (Middle Column)
    // Line 3: Indices 10-14 (Left Column)

    // Position mapping:
    // Cell at Row r (1-5), Col c (1-3)
    // We render items and place them using grid-column/grid-row CSS.

    // Line 1 (Rightmost, Col 3)
    for (let i = 0; i < 5; i++) {
      gridItems.push({ char: c[i] || '', col: 3, row: i + 1 });
    }
    // Line 2 (Middle, Col 2)
    for (let i = 0; i < 5; i++) {
      gridItems.push({ char: c[i + 5] || '', col: 2, row: i + 1 });
    }
    // Line 3 (Leftmost, Col 1)
    for (let i = 0; i < 5; i++) {
      gridItems.push({ char: c[i + 10] || '', col: 1, row: i + 1 });
    }

    return gridItems;
  }, [text]);

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        relative 
        bg-[#fdfaf5] 
        ${isCorrectHighlight ? 'border-4 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'border-2 border-emerald-900'}
        rounded-md shadow-md 
        /* Aspect ratio 3:5 roughly matches the grid */
        ${isMobile ? 'w-auto h-full aspect-[3/4.5] max-h-[42vh]' : 'w-24 h-40 md:w-32 md:h-[13.3rem] lg:w-40 lg:h-[16.6rem]'}
        select-none
        transition-all duration-200
        ${disabled && !isCorrectHighlight ? 'opacity-40 grayscale' : 'opacity-100'}
        ${!disabled && !isCorrectHighlight && !isMobile ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : ''}
        ${!disabled && !isCorrectHighlight && isMobile ? 'cursor-pointer active:scale-95' : ''}
        ${isSakasama ? 'rotate-180' : 'rotate-0'}
        ${className}
      `}
    >
      {/* Keyboard Shortcut Hint - Should not rotate with sakasama if we want readability, 
          but usually sakasama means the card physically rotates. 
          We'll keep it simple and attach to the card container. 
          If rotated, the number rotates. */
      }
      {shortcutKey && (
        <div className={`
            absolute -top-3 -left-3 md:-top-4 md:-left-4 
            w-6 h-6 md:w-8 md:h-8 
            w-6 h-6 md:w-8 md:h-8 
            bg-emerald-900 text-white 
            rounded-full flex items-center justify-center 
            font-sans font-bold text-sm md:text-base shadow-sm z-10
            ${isSakasama ? 'rotate-180' : ''} /* Counter-rotate if needed, or let it rotate? Let's let it rotate to match card orientation physically */
          `}>
          {shortcutKey}
        </div>
      )}

      {/* Grid Container */}
      <div className="grid grid-cols-3 grid-rows-5 w-full h-full p-1 gap-0.5">
        {chars.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-center font-serif font-bold text-emerald-950 leading-none"
            style={{
              gridColumn: item.col,
              gridRow: item.row,
              fontSize: 'min(5vw, 2.5rem)' // Responsive max font size
            }}
          >
            <span className="w-full h-full flex items-center justify-center">
              {item.char}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Card;