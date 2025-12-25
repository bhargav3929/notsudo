"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: "How does the AI understand my codebase?",
    answer: "Our AI analyzes your repository structure, existing code patterns, dependencies, and coding conventions. It uses this context along with the GitHub issue to generate code that fits seamlessly into your project.",
  },
  {
    question: "Is my code secure?",
    answer: "Absolutely. All code analysis happens in isolated Docker containers. Your code never leaves your infrastructure, and we don't store any repository data. API keys are encrypted and scoped to minimal permissions.",
  },
  {
    question: "What programming languages are supported?",
    answer: "We support all major programming languages including Python, JavaScript/TypeScript, Go, Rust, Java, C++, Ruby, and more. The AI adapts to your project's language and framework automatically.",
  },
  {
    question: "How does Docker sandbox validation work?",
    answer: "Before creating a PR, all generated code is validated in a Docker container that mirrors your project environment. We run your test suite, linting, and type checking to ensure the code is production-ready.",
  },
  {
    question: "Can I customize the AI behavior?",
    answer: "Yes! You can configure coding style preferences, required reviewers, branch naming conventions, and more through a simple configuration file in your repository.",
  },
  {
    question: "What if the AI generates incorrect code?",
    answer: "Our multi-step validation process catches most issues before creating a PR. If something slips through, you can provide feedback on the PR, and the AI will learn and iterate to fix the issues.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative py-32 px-4">
      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-4">
            FAQ
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            All your questions
            <br />
            <span className="gradient-text">Answered</span>
          </h2>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            
            return (
              <div
                key={index}
                className="glass-card rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-medium text-white pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown 
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <div className="px-6 pb-5 text-gray-400 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
