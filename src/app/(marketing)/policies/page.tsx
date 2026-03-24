import { AnimatedText, FadeIn } from "@/components/ui/animations";
import { CheckCircle2, Shield } from "lucide-react";
import Link from "next/link";

const policies = [
  {
    name: "Standard Care",
    description: "Essential coverage for a dignified farewell.",
    price: "From $15/mo",
    features: [
      "Basic funeral services",
      "Standard casket",
      "Local transportation",
      "Death certificate processing",
    ],
    popular: false,
  },
  {
    name: "Premium Legacy",
    description: "Comprehensive coverage with premium selections.",
    price: "From $35/mo",
    features: [
      "All Standard Care features",
      "Premium casket selection",
      "Upgraded floral arrangements",
      "Catering for 50 guests",
      "Memorial book & video tribute",
    ],
    popular: true,
  },
  {
    name: "Elite Heritage",
    description: "The ultimate peace of mind and luxury service.",
    price: "From $75/mo",
    features: [
      "All Premium Legacy features",
      "Luxury casket or urn",
      "Imported floral arrangements",
      "Catering for 100+ guests",
      "Exclusive grief counseling sessions",
      "Repatriation assistance",
    ],
    popular: false,
  },
];

export default function Policies() {
  return (
    <div className="w-full pt-32 pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <FadeIn>
            <Shield className="w-12 h-12 text-purple-primary mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-serif font-semibold text-foreground mb-6">
              Our <span className="text-purple-primary italic">Policy Options</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Secure your family's future with our flexible and affordable funeral cover policies. Choose the plan that best fits your needs and ensure peace of mind.
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {policies.map((policy, idx) => (
            <FadeIn key={idx} delay={idx * 0.1} className={`relative bg-white rounded-3xl p-8 border ${policy.popular ? 'border-purple-primary shadow-xl shadow-purple-primary/10 scale-105 z-10' : 'border-gray-100 shadow-sm'} transition-transform hover:scale-105 flex flex-col`}>
              {policy.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-primary text-white text-sm font-medium px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-serif font-semibold text-foreground mb-2">{policy.name}</h3>
              <p className="text-muted-foreground text-sm mb-6 h-10">{policy.description}</p>
              <div className="mb-8">
                <span className="text-4xl font-bold text-foreground">{policy.price}</span>
              </div>
              
              <ul className="mb-8 space-y-4 flex-1">
                {policy.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-5 h-5 text-purple-primary shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link href="/contact" className={`w-full py-4 text-center rounded-full font-medium transition-colors ${policy.popular ? 'bg-purple-primary text-white hover:bg-purple-dark' : 'bg-purple-50 text-purple-900 hover:bg-purple-100'}`}>
                Get a Quote
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </div>
  );
}
