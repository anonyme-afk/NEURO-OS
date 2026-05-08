import React from 'react';
import { cn } from '../../lib/utils';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
}

export function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <button 
      onClick={onChange}
      className={cn(
        "w-14 h-8 rounded-full transition-colors relative", 
        checked ? "bg-[#00FF88]" : "bg-white/20"
      )}
    >
      <div className={cn(
        "w-6 h-6 rounded-full bg-white absolute top-1 transition-transform", 
        checked ? "translate-x-7" : "translate-x-1"
      )} />
    </button>
  );
}
