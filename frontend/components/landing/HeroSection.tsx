"use client";

import { Github, ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 animated-gradient" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[150px]" />

      {/* Planet Horizon Arc - Gladia Style */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200vw] pointer-events-none">
        {/* Outer Glow Layer */}
        <div 
          className="absolute bottom-[-800px] left-1/2 -translate-x-1/2 w-[2000px] h-[1000px] rounded-[50%]"
          style={{
            background: `radial-gradient(ellipse at center, 
              transparent 0%,
              transparent 60%,
              rgba(59, 130, 246, 0.3) 70%,
              rgba(139, 92, 246, 0.4) 80%,
              rgba(20, 184, 166, 0.2) 90%,
              transparent 100%
            )`,
            filter: 'blur(40px)',
          }}
        />
        
        {/* Middle Glow Layer */}
        <div 
          className="absolute bottom-[-800px] left-1/2 -translate-x-1/2 w-[2000px] h-[1000px] rounded-[50%]"
          style={{
            background: `radial-gradient(ellipse at center, 
              transparent 0%,
              transparent 65%,
              rgba(139, 92, 246, 0.5) 75%,
              rgba(59, 130, 246, 0.3) 85%,
              transparent 95%
            )`,
            filter: 'blur(20px)',
          }}
        />
        
        {/* Sharp Edge Glow */}
        <div 
          className="absolute bottom-[-800px] left-1/2 -translate-x-1/2 w-[2000px] h-[1000px] rounded-[50%]"
          style={{
            boxShadow: `
              inset 0 150px 100px -50px rgba(139, 92, 246, 0.4),
              inset 0 100px 60px -30px rgba(59, 130, 246, 0.3),
              0 -50px 100px rgba(139, 92, 246, 0.3),
              0 -30px 60px rgba(59, 130, 246, 0.4)
            `,
          }}
        />
        
        {/* Black Planet/Arc Body */}
        <div 
          className="absolute bottom-[-800px] left-1/2 -translate-x-1/2 w-[2000px] h-[1000px] rounded-[50%]"
          style={{
            background: 'radial-gradient(ellipse at center top, #0a0a12 0%, #000000 50%)',
            boxShadow: `
              0 -2px 20px rgba(139, 92, 246, 0.6),
              0 -4px 40px rgba(59, 130, 246, 0.4),
              0 -8px 80px rgba(139, 92, 246, 0.3)
            `,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto">
        {/* Badge */}
        <div className="fade-in-up mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-gray-300 border border-white/10">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Now with Docker Sandbox Validation
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="fade-in-up-delay-1 text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight tracking-tight">
          AI-Powered Code
          <br />
          <span className="gradient-text">Automation</span> for GitHub
        </h1>

        {/* Subheadline */}
        <p className="fade-in-up-delay-2 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Transform GitHub issues into production-ready pull requests. 
          Let AI analyze, generate, validate, and deploy code changes automatically.
        </p>

        {/* CTA Buttons */}
        <div className="fade-in-up-delay-3 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="/app"
            className="group relative inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 hover:scale-105"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-8 py-4 glass-card text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300 gradient-border"
          >
            <Github className="w-5 h-5" />
            View on GitHub
          </a>
        </div>

        {/* Stats */}
        <div className="fade-in-up-delay-3 mt-16 grid grid-cols-3 gap-8 max-w-xl mx-auto">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-1">99%</div>
            <div className="text-sm text-gray-500">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-1">&lt;5m</div>
            <div className="text-sm text-gray-500">Avg Resolution</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-1">100+</div>
            <div className="text-sm text-gray-500">Languages</div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-white/50 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
