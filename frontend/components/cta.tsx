"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTA() {
  const [copied, setCopied] = useState(false)
  const installCommand = "npm install -g @superxepic/nano-cli"

  const handleCopyInstallCommand = async () => {
    await navigator.clipboard.writeText(installCommand)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="py-20 md:py-28 bg-[#000000] border-t border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="card-inset relative overflow-hidden !p-10 md:!p-24 text-center">
          
          <div className="mx-auto max-w-3xl">
            <p className="text-[14px] font-semibold uppercase tracking-[1.4px] text-[#faff69] mb-6">
              READY TO SECURE YOUR STACK?
            </p>
            <h2 className="text-balance text-[36px] font-black tracking-tight text-white md:text-[64px] font-sans leading-[1.0]">
              Stop wrestling with secrets management
            </h2>
            <p className="mt-8 text-pretty text-[#a0a0a0] md:text-[18px] leading-relaxed font-normal max-w-2xl mx-auto">
              Join thousands of engineering teams who switched from Vault and AWS Secrets Manager 
              to nan0. Get started in minutes, not days.
            </p>
            
            <div className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row">
              <button className="btn-neon px-10 h-14 flex items-center gap-2 font-bold uppercase tracking-[1.4px]">
                Start for free
                <ArrowRight className="h-5 w-5" />
              </button>

              <div className="relative w-full max-w-md sm:w-auto">
                <div className="flex h-14 items-center gap-4 rounded-[4px] border border-border bg-black/50 px-4">
                  <span className="text-[18px] text-[#faff69] font-bold">$</span>
                  <span className="truncate text-[14px] text-white font-mono font-semibold">{installCommand}</span>
                  <button
                    className="ml-2 h-9 px-4 rounded-[4px] border border-[#4f5100] bg-transparent hover:bg-[#1d1d1d] text-white text-[12px] font-bold uppercase tracking-[1.4px] transition-colors whitespace-nowrap"
                    onClick={handleCopyInstallCommand}
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
            
            <p className="mt-8 text-[12px] text-[#585858] uppercase tracking-[1.4px] font-semibold">
              Trusted by developers at 500+ companies
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
