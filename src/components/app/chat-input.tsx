'use client';

import { useState, memo } from 'react';

// ===================== OPTIMIZED CHAT INPUT =====================
// Uses local state for typing (prevents parent re-renders on each keystroke).
// valueRef lets the parent read the current input value without causing re-renders.
// clearSignal triggers a reset of the input when the parent sends a message via button.
export const ChatInput = memo(({ onSend, placeholder, disabled, valueRef, clearSignal }: {
  onSend: (message: string) => void; placeholder: string; disabled: boolean;
  valueRef: React.MutableRefObject<string>;
  clearSignal: number;
}) => {
  const [localValue, setLocalValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    valueRef.current = val;
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const val = localValue.trim();
      if (val && !disabled) {
        onSend(val);
        setLocalValue('');
        valueRef.current = '';
        e.target.style.height = 'auto';
      }
    }
  };

  return (
    <textarea
      key={clearSignal}
      value={localValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px] max-h-[120px]"
      rows={1}
    />
  );
});
