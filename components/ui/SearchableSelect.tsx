"use client";

import { useState, useEffect, useRef } from "react";

interface Option {
    value: string | number;
    label: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    label?: string;
    className?: string;
    error?: string;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Seleccionar...",
    label,
    className = "",
    error
} : SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    const filteredOptions = options.filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 50);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen && selectedOption) {
            setSearchTerm("");
        }
    }, [isOpen, selectedOption]);

    const handleSelect = (optionValue: string | number) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm("");
    };

    return (
        <div className={`flex flex-col gap-1 relative ${className}`} ref={wrapperRef}>
          {label && (
            <label className="text-sm font-medium text-foreground-secondary">
              {label}
            </label>
          )}
          
          <div className="relative">
            <input
              type="text"
              className={`w-full p-2 rounded-md border bg-background-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer ${
                 error ? "border-error-500" : "border-border"
              }`}
              placeholder={selectedOption ? selectedOption.label : placeholder}
              value={isOpen ? searchTerm : (selectedOption?.label || "")}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onClick={() => setIsOpen(true)}
              readOnly={!isOpen && !!selectedOption} // Truco para mejor UX
            />
            
            {/* Icono de flecha */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 1L5 5L9 1" />
              </svg>
            </div>
          </div>
    
          {/* Lista Desplegable */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-800 border border-border rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`p-2 cursor-pointer text-sm hover:bg-primary-100 dark:hover:bg-primary-900 hover:text-primary-700 dark:hover:text-primary-300 ${
                      opt.value === value ? "bg-primary-50 text-primary-700 font-medium" : "text-foreground"
                    }`}
                  >
                    {opt.label}
                  </div>
                ))
              ) : (
                <div className="p-2 text-sm text-foreground-muted text-center">
                  No se encontraron resultados
                </div>
              )}
            </div>
          )}
          
          {error && <span className="text-xs text-error-500">{error}</span>}
        </div>
      );
}