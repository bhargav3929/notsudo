"use client";

import { 
  MessageSquare, 
  Users, 
  Briefcase,
  LucideIcon
} from "lucide-react";

interface UseCase {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  gradient: string;
}

const useCases: UseCase[] = [
  {
    icon: MessageSquare,
    title: "Bug Fixes",
    description: "Automatically fix bugs reported in issues with validated solutions.",
    features: [
      "Stack trace analysis",
      "Root cause detection",
      "Regression test generation",
      "Fix validation",
    ],
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: Users,
    title: "Feature Development",
    description: "Turn feature requests into working implementations.",
    features: [
      "Requirements extraction",
      "API design",
      "Implementation scaffolding",
      "Documentation generation",
    ],
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Briefcase,
    title: "Code Refactoring",
    description: "Modernize and improve code quality automatically.",
    features: [
      "Pattern recognition",
      "Best practices application",
      "Performance optimization",
      "Type safety improvements",
    ],
    gradient: "from-violet-500 to-purple-500",
  },
];

export function UseCasesSection() {
  return (
    <section className="relative py-32 px-4">
      {/* Background Elements */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-4">
            USE CASES
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            What you can build
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            From simple bug fixes to complex feature implementations, 
            automate any development workflow.
          </p>
        </div>

        {/* Use Case Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            
            return (
              <div
                key={index}
                className="group relative glass-card rounded-2xl p-8 hover:bg-white/[0.08] transition-all duration-500"
              >
                {/* Gradient Glow */}
                <div className={`absolute -inset-px rounded-2xl bg-gradient-to-b ${useCase.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${useCase.gradient} mb-6`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  
                  {/* Title & Description */}
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {useCase.title}
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {useCase.description}
                  </p>
                  
                  {/* Feature List */}
                  <ul className="space-y-3">
                    {useCase.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3 text-sm text-gray-300">
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${useCase.gradient}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
