"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

// Grid configuration
const GRID_COLS = 20;
const GRID_ROWS = 12;

interface CellState {
  opacity: number;
}

const MODELS = [
  { id: "gemini", name: "Gemini 2.5 Pro" },
  { id: "gpt4", name: "GPT-4o" },
  { id: "claude", name: "Claude 3.5 Sonnet" },
];

export function HeroSection() {
  const [cellStates, setCellStates] = useState<Record<number, CellState>>({});
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [isModelOpen, setIsModelOpen] = useState(false);
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

        {/* Model Selector - The Extra Feature */}
        <div className="fade-in-up-delay-0 mb-8 pointer-events-auto inline-block relative">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2 justify-center font-mono">
            POWERED BY
          </div>
          <button
            onClick={() => setIsModelOpen(!isModelOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white hover:border-orange-500 transition-colors font-mono min-w-[200px] justify-between"
          >
            <span>{selectedModel.name}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isModelOpen ? 'rotate-180' : ''}`} />
          </button>

          {isModelOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-xl z-50">
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model);
                    setIsModelOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center justify-between font-mono"
                >
                  {model.name}
                  {selectedModel.id === model.id && <Check className="w-3 h-3 text-orange-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Headline */}
        <h1 className="fade-in-up-delay-1 font-mono text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight tracking-tighter uppercase">
          Jules does coding tasks
          <br />
          <span className="text-gray-500">you don&apos;t want to do.</span>
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
            TRY JULES
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
