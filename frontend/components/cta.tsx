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
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 md:p-16">
          {/* Background pattern */}
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-size-[2rem_2rem] opacity-50" />
          
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Stop wrestling with secrets management
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground md:text-lg">
              Join thousands of engineering teams who switched from Vault and AWS Secrets Manager 
              to nan0. Get started in minutes, not days.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="gap-2">
                Start building for free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <div className="relative w-full max-w-xl rounded-md p-px bg-linear-to-r from-cyan-400/80 via-emerald-400/70 to-amber-400/80 sm:w-auto">
                <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card/95 p-2 backdrop-blur">
                  <span className="truncate px-2 text-sm text-foreground">{installCommand}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-cyan-400/40 bg-linear-to-r from-cyan-500/15 to-emerald-500/15 hover:from-cyan-500/25 hover:to-emerald-500/25 cursor-pointer"
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
