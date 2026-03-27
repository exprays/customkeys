import { Button } from "@/components/ui/button"
import { ArrowRight, Github } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Subtle grid background */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            Built with Go for speed and reliability
          </div>

          {/* Headline */}
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Secrets management{" "}
            <span className="text-accent">without the complexity</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            A centralized, auditable store for API keys, database credentials, TLS certificates, 
            and environment-specific config — without self-hosting Vault or AWS pricing headaches.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="gap-2 cursor-pointer">
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="gap-2 cursor-pointer">
              <Github className="h-4 w-4" />
              View on GitHub
            </Button>
          </div>

          {/* Trust signal */}
          <p className="mt-8 text-sm text-muted-foreground">
            Free tier available • No credit card required • SOC 2 Type II compliant
          </p>
        </div>

        {/* Code Preview */}
        <div className="mx-auto mt-16 max-w-3xl">
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
              <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
              <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
              <span className="ml-4 text-xs text-muted-foreground font-mono">terminal</span>
            </div>
            <div className="p-6 font-mono text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-accent">$</span>
                <span className="text-foreground">nan0 secret set DATABASE_URL</span>
              </div>
              <div className="mt-2 text-muted-foreground">
                <span className="text-accent">?</span> Enter secret value: <span className="text-foreground">••••••••••••••••</span>
              </div>
              <div className="mt-2 text-muted-foreground">
                <span className="text-accent">✓</span> Secret <span className="text-foreground">DATABASE_URL</span> saved to <span className="text-accent">production</span> environment
              </div>
              <div className="mt-4 flex items-center gap-2 text-muted-foreground">
                <span className="text-accent">$</span>
                <span className="text-foreground">nan0 secret get DATABASE_URL --env=production</span>
              </div>
              <div className="mt-2 text-foreground">
                postgres://user:****@db.nan0.io:5432/app
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
