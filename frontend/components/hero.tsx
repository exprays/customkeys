import { Button } from "@/components/ui/button"
import { ArrowRight, Github } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-48 md:pb-32 bg-[#000000]">
      {/* Radial Gradient Background */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(250,255,105,0.04)_0%,rgba(250,255,105,0.02)_30%,transparent_60%)]" />
      
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-[4px] border border-[#414141]/80 bg-[#141414] px-4 py-2 text-[14px] text-[#a0a0a0]">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="font-semibold tracking-tight">Built with Go for speed and reliability</span>
          </div>

          {/* Headline */}
          <h1 className="text-balance text-[48px] md:text-[96px] font-black leading-[1.0] tracking-tight text-[#ffffff] font-sans">
            Secrets management{" "}
            <span className="text-[#faff69]">without the complexity</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-8 max-w-2xl text-pretty text-lg md:text-[18px] text-[#a0a0a0] font-sans leading-[1.56] font-normal">
            A centralized, auditable store for API keys, database credentials, TLS certificates, 
            and environment-specific config.
          </p>

          {/* CTAs */}
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button className="btn-neon px-8 h-12 flex items-center gap-2">
              Start for free
              <ArrowRight className="h-5 w-5" />
            </button>
            <button className="btn-ghost px-8 h-12 flex items-center gap-2">
              <Github className="h-5 w-5" />
              View on GitHub
            </button>
          </div>

          {/* Trust signal */}
          <p className="mt-10 text-[12px] text-[#a0a0a0] uppercase tracking-[1.4px] font-semibold">
            Free tier available • No credit card required • SOC 2 Type II
          </p>
        </div>

        {/* Code Preview - Inset Style */}
        <div className="mx-auto mt-20 max-w-3xl">
          <div className="card-inset overflow-hidden !p-0">
            <div className="flex items-center gap-2 border-b border-[#414141]/80 bg-[#141414] px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
              <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
              <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
              <span className="ml-4 text-[12px] text-[#faff69] font-bold tracking-widest uppercase">terminal</span>
            </div>
            <div className="p-8 font-mono text-[16px] font-semibold leading-relaxed bg-black/40">
              <div className="flex items-center gap-2 text-[#a0a0a0]">
                <span className="text-[#faff69]">$</span>
                <span className="text-[#ffffff]">nan0 secret set DATABASE_URL</span>
              </div>
              <div className="mt-3 text-[#585858]">
                <span className="text-[#faff69]">?</span> Enter secret value: <span className="text-[#ffffff]">••••••••••••••••</span>
              </div>
              <div className="mt-3 text-[#a0a0a0]">
                <span className="text-[#faff69]">✓</span> Secret <span className="text-[#ffffff]">DATABASE_URL</span> saved to <span className="text-[#faff69]">production</span> environment
              </div>
              <div className="mt-6 flex items-center gap-2 text-[#a0a0a0]">
                <span className="text-[#faff69]">$</span>
                <span className="text-[#ffffff]">nan0 secret get DATABASE_URL --env=production</span>
              </div>
              <div className="mt-3 text-[#faff69] font-bold">
                postgres://user:****@db.nan0.io:5432/app
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
