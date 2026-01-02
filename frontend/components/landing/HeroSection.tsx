"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// Grid configuration
const GRID_COLS = 20;
const GRID_ROWS = 12;

interface CellState {
  opacity: number;
}

const MODELS = [
  { id: "opus", name: "Opus 4.5", badge: "NEW" },
  { id: "gemini", name: "Gemini 3" },
  { id: "codex", name: "Codex 5" },
  { id: "gpt4", name: "GPT-4o" },
  { id: "claude", name: "Claude 3.5 Sonnet" },
];

export function HeroSection() {
  const [cellStates, setCellStates] = useState<Record<number, CellState>>({});
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const fadeTimeouts = useRef<Record<number, NodeJS.Timeout>>({});

  const handleMouseEnter = useCallback((index: number) => {
    // Clear any existing timeout for this cell
    if (fadeTimeouts.current[index]) {
      clearTimeout(fadeTimeouts.current[index]);
    }
    
    // Set cell to full opacity
    setCellStates(prev => ({
      ...prev,
      [index]: { opacity: 1 }
    }));
  }, []);

  const handleMouseLeave = useCallback((index: number) => {
    // Start fade out animation
    const fadeSteps = [0.8, 0.6, 0.4, 0.2, 0];
    let stepIndex = 0;
    
    const fadeStep = () => {
      setCellStates(prev => ({
        ...prev,
        [index]: { opacity: fadeSteps[stepIndex] }
      }));
      
      stepIndex++;
      if (stepIndex < fadeSteps.length) {
        fadeTimeouts.current[index] = setTimeout(fadeStep, 150);
      } else {
        // Remove from state when fully faded
        setCellStates(prev => {
          const newState = { ...prev };
          delete newState[index];
          return newState;
        });
      }
    };
    
    fadeTimeouts.current[index] = setTimeout(fadeStep, 100);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(fadeTimeouts.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const getCellStyle = (index: number) => {
    const state = cellStates[index];
    if (!state) return {};
    
    return {
      backgroundColor: `rgba(249, 115, 22, ${state.opacity * 0.5})`,
    };
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 bg-black overflow-hidden pt-20">
      {/* Grid Background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="w-full h-full grid"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
          }}
        >
          {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, index) => (
            <div
              key={index}
              className="border border-white/10 transition-colors duration-300"
              style={getCellStyle(index)}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={() => handleMouseLeave(index)}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto pointer-events-none">

        {/* Model Selector - Nice Good UI Way */}
        <div className="fade-in-up-delay-0 mb-12 pointer-events-auto">
          <div className="flex flex-wrap justify-center items-center gap-3">
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`relative group px-6 py-3 rounded-xl border transition-all duration-300 font-mono text-sm ${
                  selectedModel === model.id
                    ? "bg-white/10 border-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                    : "bg-black/50 border-white/10 text-gray-400 hover:border-white/30 hover:text-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${selectedModel === model.id ? 'bg-orange-500 animate-pulse' : 'bg-gray-600'}`} />
                  {model.name}
                  {model.badge && (
                    <span className="absolute -top-2 -right-2 bg-orange-500 text-black text-[10px] px-1.5 py-0.5 rounded font-bold">
                      {model.badge}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Headline */}
        <h1 className="fade-in-up-delay-1 font-mono text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight tracking-tighter uppercase">
          It&apos;s Fast. It&apos;s Simple.
          <br />
          It&apos;s bug free. It&apos;s NotSudo.
        </h1>

        {/* Subheadline */}
        <div className="fade-in-up-delay-2 flex flex-wrap justify-center gap-3 max-w-3xl mx-auto mb-12 font-mono text-sm md:text-base">
          {["Bug Fixing", "Version Bump", "Tests", "Fixing Jed's Code", "Feature Building"].map((tag, i) => (
            <span key={i} className="px-3 py-1 border border-gray-700 rounded-full text-gray-300 bg-gray-900/50">
              {tag}
            </span>
          ))}
        </div>

        {/* CTA Button */}
        <div className="fade-in-up-delay-3 flex flex-col items-center gap-8 pointer-events-auto">
          <a
            href="/login"
            className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-mono text-base font-medium hover:bg-gray-100 transition-all duration-300 border border-white rounded-sm"
          >
            TRY NOTSUDO
          </a>

          <div className="max-w-md mx-auto text-center mt-8">
            <p className="text-xl text-white font-mono leading-relaxed">
              More time for the code you want to write, and everything else.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
