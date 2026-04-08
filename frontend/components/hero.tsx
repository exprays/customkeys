import { Button } from "@/components/ui/button"
import { ArrowRight, Github } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28 bg-[#000000]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-[4px] border border-[#414141]/80 bg-[#141414] px-4 py-2 text-[14px] text-[#a0a0a0]">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Built with Go for speed and reliability
          </div>

          {/* Headline */}
          <h1 className="text-balance text-[48px] md:text-[96px] font-black leading-none tracking-tight text-[#ffffff] font-[family-name:--font-inter]">
            Secrets management{" "}
            <span className="text-primary block md:inline mt-2 md:mt-0">without the complexity</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-8 max-w-2xl text-pretty text-lg md:text-[24px] text-[#a0a0a0] font-[family-name:--font-inter] leading-[1.38] font-semibold">
            A centralized, auditable store for API keys, database credentials, TLS certificates, 
            and environment-specific config.
          </p>

          {/* CTAs */}
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="gap-2 cursor-pointer bg-primary hover:bg-[#3a3a3a] text-[#151515] hover:text-[#f4f692] rounded-[4px] px-8 h-14 text-[16px] font-bold transition-colors">
              Start for free
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="lg" className="gap-2 cursor-pointer border border-[#4f5100] bg-transparent hover:bg-[#3a3a3a] hover:text-[#f4f692] text-[#ffffff] rounded-[4px] px-8 h-14 text-[16px] font-bold transition-colors">
              <Github className="h-5 w-5" />
              View on GitHub
            </Button>
          </div>

          {/* Trust signal */}
          <p className="mt-8 text-[12px] text-[#a0a0a0] uppercase tracking-[1.4px] font-semibold">
            Free tier available • No credit card required • SOC 2 Type II
          </p>
        </div>

        {/* Code Preview */}
        <div className="mx-auto mt-20 max-w-3xl">
          <div className="overflow-hidden rounded-[8px] border border-[#414141]/80 bg-[#141414] shadow-[rgba(0,0,0,0.1)_0px_10px_15px_-3px,rgba(0,0,0,0.1)_0px_4px_6px_-4px]">
            <div className="flex items-center gap-2 border-b border-[#414141]/80 bg-[#141414] px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
              <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
              <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
              <span className="ml-4 text-[12px] text-primary font-bold tracking-widest uppercase">terminal</span>
            </div>
            <div className="p-6 font-[family-name:--font-inconsolata] text-[16px] font-semibold leading-relaxed">
              <div className="flex items-center gap-2 text-[#a0a0a0]">
                <span className="text-primary">$</span>
                <span className="text-[#ffffff]">nan0 secret set DATABASE_URL</span>
              </div>
              <div className="mt-2 text-[#a0a0a0]">
                <span className="text-primary">?</span> Enter secret value: <span className="text-[#ffffff]">••••••••••••••••</span>
              </div>
              <div className="mt-2 text-[#a0a0a0]">
                <span className="text-primary">✓</span> Secret <span className="text-[#ffffff]">DATABASE_URL</span> saved to <span className="text-primary">production</span> environment
              </div>
              <div className="mt-5 flex items-center gap-2 text-[#a0a0a0]">
                <span className="text-primary">$</span>
                <span className="text-[#ffffff]">nan0 secret get DATABASE_URL --env=production</span>
              </div>
              <div className="mt-2 text-primary font-bold">
                postgres://user:****@db.nan0.io:5432/app
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
