"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: DropdownOption[];
  className?: string;
}

export default function CustomDropdown({ value, onChange, options, className = "" }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full input-field flex items-center justify-between gap-3 text-left py-2.5 px-4 cursor-pointer hover:border-[var(--primary)] transition-all bg-[var(--card)] border border-[var(--border)] text-sm font-medium"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selectedOption?.icon && (
            <span className="shrink-0 flex items-center justify-center">
              {selectedOption.icon}
            </span>
          )}
          <div className="truncate">
            <span className="text-[var(--foreground)] block leading-tight">{selectedOption?.label}</span>
            {selectedOption?.sublabel && (
              <span className="text-[10px] text-[var(--muted-foreground)] block mt-0.5 leading-tight truncate">
                {selectedOption.sublabel}
              </span>
            )}
          </div>
        </div>
        <ChevronDown size={15} className={`text-[var(--muted-foreground)] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto animate-scale-in py-1">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 py-2 px-4 text-left text-xs transition-colors ${
                  isSelected 
                    ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-semibold' 
                    : 'text-[var(--foreground)] hover:bg-[var(--muted)]/40'
                }`}
              >
                {option.icon && (
                  <span className={`shrink-0 flex items-center justify-center ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}>
                    {option.icon}
                  </span>
                )}
                <div className="min-w-0">
                  <span className="block leading-tight">{option.label}</span>
                  {option.sublabel && (
                    <span className="text-[9px] text-[var(--muted-foreground)] block mt-0.5 leading-tight truncate">
                      {option.sublabel}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
