"use client";

interface PricingTier {
  tier: string;
  name: string;
  features: string[];
  description: string;
  image?: string; // Placeholder for images from the site
}

const pricingTiers: PricingTier[] = [
  {
    tier: "Jules",
    name: "Get started with real coding tasks.",
    features: [
      "15 tasks per day",
      "3 concurrent tasks",
      "Powered by Gemini 2.5 Pro",
    ],
    description: "",
  },
  {
    tier: "Jules in Pro",
    name: "For devs who ship daily and want to stay in the flow.",
    features: [
      "100 tasks per day, enough to run Jules throughout your coding day",
      "15 concurrent tasks, so you can run multiple threads in parallel",
      "Higher access to the latest models, starting with Gemini 3 Pro",
    ],
    description: "",
  },
  {
    tier: "Jules in Ultra",
    name: "For builders who run agents at scale.",
    features: [
      "300 tasks per day to handle the most demanding development cycles",
      "60 concurrent tasks, built for massively parallel workflows",
      "Priority access to the latest models, starting with Gemini 3 Pro",
    ],
    description: "",
  },
];

export function PricingSection() {
  return (
    <section className="relative py-24 px-4 bg-black border-t border-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-mono text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Find the Jules plan that
            <br />
            fits your workflow
          </h2>

          <p className="text-gray-400 max-w-2xl mx-auto font-mono text-sm leading-relaxed">
            Jules scales with how you build, from quick fixes to fully async,
            multi-agent development. Choose the plan that gives you the speed,
            throughput, and model access you need.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingTiers.map((tier, index) => (
            <div
              key={index}
              className="bg-gray-900/30 border border-gray-800 p-8 flex flex-col h-full hover:border-gray-700 transition-colors"
            >
              {/* Tier Name */}
              <h3 className="text-xl font-bold text-white font-mono mb-4">
                {tier.tier}
              </h3>

              {/* Description/Name */}
              <p className="text-gray-400 font-mono text-sm mb-8 min-h-[40px]">
                {tier.name}
              </p>

              {/* Features */}
              <ul className="space-y-4 mb-8 flex-1">
                {tier.features.map((feature, featureIndex) => (
                  <li
                    key={featureIndex}
                    className="flex items-start gap-3 text-sm text-gray-300 font-mono leading-relaxed"
                  >
                    <span className="text-orange-500 mt-1">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Visual Placeholder ( mimicking the images in the original ) */}
              <div className="w-full h-32 bg-gray-900 rounded border border-gray-800 flex items-center justify-center opacity-50">
                <span className="text-gray-700 font-mono text-xs">Plan Visual</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
