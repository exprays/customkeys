import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "For side projects and small teams getting started.",
    features: [
      "Up to 100 secrets",
      "3 environments",
      "5 team members",
      "Community support",
      "7-day audit log retention"
    ],
    cta: "Get started free",
    highlighted: false
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "For growing teams with production workloads.",
    features: [
      "Unlimited secrets",
      "Unlimited environments",
      "25 team members",
      "Priority email support",
      "90-day audit log retention",
      "Automatic secret rotation",
      "SSO / SAML"
    ],
    cta: "Start 14-day trial",
    highlighted: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For organizations with advanced security needs.",
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "Dedicated support engineer",
      "Unlimited audit log retention",
      "Custom SLA",
      "On-premise deployment option",
      "SOC 2 Type II report"
    ],
    cta: "Contact sales",
    highlighted: false
  }
]

export function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-[#000000] border-t border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[14px] font-semibold uppercase tracking-[1.4px] text-[#faff69]">
            03 / PRICING
          </p>
          <h2 className="mt-4 text-balance text-[36px] font-bold tracking-normal text-[#ffffff] md:text-[36px] font-sans">
            Simple, predictable pricing
          </h2>
          <p className="mt-6 text-pretty text-[18px] text-[#a0a0a0] leading-[1.56] font-normal">
            No per-API-call charges. No surprise bills. Just straightforward pricing 
            that scales with your team.
          </p>
        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={cn(
                "relative transition-all duration-300",
                plan.highlighted 
                  ? "card-neon" 
                  : "card-standard hover:border-[#faff69]"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 rounded-[4px] bg-[#faff69] px-4 py-1.5 text-[12px] font-bold tracking-[1.4px] uppercase text-[#151515]">
                  Most popular
                </div>
              )}
              
              <h3 className="text-[20px] font-semibold text-[#ffffff] font-sans">{plan.name}</h3>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-[48px] leading-none font-black text-[#ffffff] font-sans tracking-tight">{plan.price}</span>
                {plan.period && (
                  <span className="text-[16px] text-[#a0a0a0] font-semibold">{plan.period}</span>
                )}
              </div>
              <p className="mt-4 text-[16px] text-[#a0a0a0] leading-[1.50]">{plan.description}</p>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-4 text-[16px] text-[#a0a0a0]">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#faff69]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                className={cn(
                  "mt-10 w-full font-bold uppercase tracking-[1.4px]",
                  plan.highlighted
                    ? "btn-neon"
                    : "btn-dark"
                )}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-16 text-center text-[16px] text-[#a0a0a0]">
          All plans include encrypted storage, 99.9% uptime SLA, and GDPR compliance.
          {" "}
          <a href="#" className="font-semibold underline underline-offset-4 text-[#a0a0a0] hover:text-primary">
            Compare all features →
          </a>
        </p>
      </div>
    </section>
  )
}
