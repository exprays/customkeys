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
    <section className="py-20 md:py-28 bg-black border-t border-[rgba(65,65,65,0.8)]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-[8px] border border-[rgba(65,65,65,0.8)] bg-[#141414] p-10 md:p-20 shadow-[rgba(0,0,0,0.1)_0px_10px_15px_-3px]">
          
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-[36px] font-black tracking-tight text-white md:text-[56px] font-[family-name:--font-inter] leading-[1.05]">
              Stop wrestling with secrets management
            </h2>
            <p className="mt-6 text-pretty text-[#a0a0a0] md:text-[20px] leading-relaxed font-semibold">
              Join thousands of engineering teams who switched from Vault and AWS Secrets Manager 
              to nan0. Get started in minutes, not days.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row">
              <Button size="lg" className="gap-2 bg-primary text-[#151515] hover:bg-[#1d1d1d] hover:text-[#f4f692] px-8 h-14 rounded-[4px] font-bold text-[16px] tracking-wide cursor-pointer">
                Start building for free
                <ArrowRight className="h-5 w-5" />
              </Button>
              <div className="relative w-full max-w-xl sm:w-auto">
                <div className="flex h-14 items-center gap-4 rounded-[4px] border border-[rgba(65,65,65,0.8)] bg-black px-4">
                  <span className="text-[20px] text-primary">$</span>
                  <span className="truncate text-[16px] text-white font-[family-name:--font-inconsolata] font-semibold">{installCommand}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer border border-[#4f5100] bg-transparent hover:bg-[#3a3a3a] hover:text-[#f4f692] text-white rounded-[4px] font-bold uppercase tracking-[1.4px]"
                    onClick={handleCopyInstallCommand}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
