import React, { useState, useRef, useEffect } from 'react';

export const CustomCalendar = ({ name }: { name: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
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

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const formatOutput = (d: Date) => {
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === currentMonth.getMonth() && selectedDate.getFullYear() === currentMonth.getFullYear();
    days.push(
      <div 
        key={d} 
        onClick={() => {
          setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
          setIsOpen(false);
        }}
        className={`p-1 text-center text-xs rounded-full cursor-pointer transition-colors ${isSelected ? 'bg-amber-500 text-black font-bold' : 'text-zinc-300 hover:bg-zinc-800'}`}
      >
        {d}
      </div>
    );
  }

  return (
    <div className="relative w-full text-sm" ref={dropdownRef}>
      <input type="hidden" name={name} value={formatOutput(selectedDate)} />
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 outline-none focus:border-amber-500 transition-colors flex justify-between items-center font-mono"
      >
        <span>{formatOutput(selectedDate)}</span>
        <span className="text-zinc-500">📅</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 p-4 w-[280px]">
          <div className="flex justify-between items-center mb-4">
            <button type="button" onClick={prevMonth} className="text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-zinc-800">&larr;</button>
            <span className="text-zinc-200 font-medium text-sm">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button type="button" onClick={nextMonth} className="text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-zinc-800">&rarr;</button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] text-zinc-500 font-medium">
            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days}
          </div>
        </div>
      )}
    </div>
  );
};
