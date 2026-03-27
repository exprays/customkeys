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
    <section id="pricing" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-accent">
            Pricing
          </p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Simple, predictable pricing
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            No per-API-call charges. No surprise bills. Just straightforward pricing 
            that scales with your team.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={cn(
                "relative rounded-lg border p-8 transition-colors",
                plan.highlighted 
                  ? "border-accent bg-accent/5" 
                  : "border-border bg-card hover:border-border/80"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                  Most popular
                </div>
              )}
              
              <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                {plan.period && (
                  <span className="text-muted-foreground">{plan.period}</span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="mt-8 w-full" 
                variant={plan.highlighted ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          All plans include encrypted storage, 99.99% uptime SLA, and GDPR compliance.
          {" "}
          <a href="#" className="text-accent hover:underline">
            Compare all features →
          </a>
        </p>
      </div>
    </section>
  )
}
