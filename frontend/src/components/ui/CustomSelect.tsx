import React, { useState, useRef, useEffect } from 'react';

export const CustomSelect = ({ options, name, placeholder }: { options: string[], name: string, placeholder: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string>(options[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative w-full text-sm" ref={dropdownRef}>
      <input type="hidden" name={name} value={selected} />
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 outline-none focus:border-amber-500 transition-colors flex justify-between items-center"
      >
        <span>{selected || placeholder}</span>
        <span className="text-zinc-500 text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 max-h-48 overflow-y-auto outline-none">
          {options.map((opt) => (
            <div 
              key={opt}
              className={`p-3 hover:bg-zinc-800 cursor-pointer transition-colors ${selected === opt ? 'text-amber-500 bg-zinc-950' : 'text-zinc-300'}`}
              onClick={() => { setSelected(opt); setIsOpen(false); }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
