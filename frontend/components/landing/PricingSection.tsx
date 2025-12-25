"use client";

import { Check, ArrowRight } from "lucide-react";

interface PricingTier {
  name: string;
  description: string;
  price: string;
  priceSubtext?: string;
  cta: string;
  ctaVariant: "primary" | "secondary";
  featured?: boolean;
  featuresTitle: string;
  features: string[];
  extras?: {
    title: string;
    features: string[];
  };
}

const pricingTiers: PricingTier[] = [
  {
    name: "Starter",
    description: "For individual developers",
    price: "Free",
    priceSubtext: "Up to 10 issues/month",
    cta: "Get started",
    ctaVariant: "secondary",
    featuresTitle: "WHAT'S INCLUDED:",
    features: [
      "10 AI-generated PRs per month",
      "1 repository",
      "Basic issue analysis",
      "Community support",
    ],
    extras: {
      title: "CORE FEATURES:",
      features: [
        "Automatic code generation",
        "Docker sandbox validation",
        "GitHub integration",
      ],
    },
  },
  {
    name: "Pro",
    description: "For growing teams",
    price: "$49",
    priceSubtext: "/month per seat",
    cta: "Start free trial",
    ctaVariant: "primary",
    featured: true,
    featuresTitle: "EVERYTHING IN STARTER, PLUS:",
    features: [
      "Unlimited AI-generated PRs",
      "Unlimited repositories",
      "Priority processing queue",
      "Advanced code analysis",
    ],
    extras: {
      title: "TEAM FEATURES:",
      features: [
        "Team collaboration tools",
        "Custom coding standards",
        "Slack notifications",
      ],
    },
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    price: "Custom",
    priceSubtext: "Contact for pricing",
    cta: "Contact sales",
    ctaVariant: "secondary",
    featuresTitle: "EVERYTHING IN PRO, PLUS:",
    features: [
      "Unlimited team members",
      "Self-hosted deployment",
      "Custom AI model tuning",
      "Dedicated support",
    ],
    extras: {
      title: "SECURITY & COMPLIANCE:",
      features: [
        "SOC 2 compliance",
        "SSO/SAML integration",
        "Audit logs",
      ],
    },
  },
];

export function PricingSection() {
  return (
    <section className="relative py-32 px-4 bg-gradient-to-b from-black via-slate-950 to-black overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-500/10 rounded-full blur-[150px]" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
            <span className="text-purple-400">💰</span>
            <span className="text-sm font-medium text-white">Pricing</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Pick your plan
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Scale your development workflow with confidence.
            <br />
            Transparent pricing — no setup fees or hidden costs.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingTiers.map((tier, index) => (
            <div
              key={index}
              className={`relative rounded-3xl border p-8 transition-all ${
                tier.featured
                  ? "bg-gradient-to-b from-purple-900/20 to-transparent border-purple-500/30"
                  : "bg-gradient-to-b from-white/[0.03] to-transparent border-white/10 hover:border-white/20"
              }`}
            >
              {/* Featured Badge */}
              {tier.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-purple-500 text-white text-xs font-medium">
                  Most Popular
                </div>
              )}
              
              {/* Plan Name */}
              <h3 className="text-2xl font-bold text-white mb-2">
                {tier.name}
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                {tier.description}
              </p>
              
              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{tier.price}</span>
                {tier.priceSubtext && (
                  <span className="text-gray-400 text-sm ml-2">{tier.priceSubtext}</span>
                )}
              </div>
              
              {/* CTA Button */}
              <a
                href="#"
                className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-colors mb-8 ${
                  tier.ctaVariant === "primary"
                    ? "bg-white text-black hover:bg-gray-100"
                    : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                }`}
              >
                {tier.cta}
                <ArrowRight className="w-4 h-4" />
              </a>
              
              {/* Features */}
              <div className="space-y-6">
                <div>
                  <p className="text-purple-400 text-xs font-medium mb-3 tracking-wider">
                    {tier.featuresTitle}
                  </p>
                  <ul className="space-y-3">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-white mt-0.5 shrink-0" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {tier.extras && (
                  <div>
                    <p className="text-gray-500 text-xs font-medium mb-3 tracking-wider">
                      {tier.extras.title}
                    </p>
                    <ul className="space-y-3">
                      {tier.extras.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <Check className="w-4 h-4 text-white/60 mt-0.5 shrink-0" />
                          <span className="text-gray-400 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
