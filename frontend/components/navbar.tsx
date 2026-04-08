"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[rgba(65,65,65,0.8)] bg-black">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-primary">
            <span className="text-sm font-bold text-primary-foreground">n0</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white hover:text-primary transition-colors">nano</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <Link href="#features" className="text-[14px] font-semibold uppercase tracking-[1.4px] text-[#a0a0a0] transition-colors hover:text-primary">
            Features
          </Link>
          <Link href="#pricing" className="text-[14px] font-semibold uppercase tracking-[1.4px] text-[#a0a0a0] transition-colors hover:text-primary">
            Pricing
          </Link>
          <Link href="#docs" className="text-[14px] font-semibold uppercase tracking-[1.4px] text-[#a0a0a0] transition-colors hover:text-primary">
            Docs
          </Link>
          <Link href="#changelog" className="text-[14px] font-semibold uppercase tracking-[1.4px] text-[#a0a0a0] transition-colors hover:text-primary">
            Changelog
          </Link>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="cursor-pointer rounded-[4px] border border-[#4f5100] px-8 text-white hover:bg-[#3a3a3a] hover:text-[#f4f692] active:text-[#f4f692] uppercase font-bold tracking-[1.4px]">
              Sign In
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm" className="cursor-pointer rounded-[4px] border border-[#141414] bg-[#166534] px-6 text-white hover:bg-[#3a3a3a] active:text-[#f4f692] uppercase font-bold tracking-[1.4px]">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white hover:text-primary"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-[rgba(65,65,65,0.8)] bg-black px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link href="#features" className="text-[14px] font-semibold uppercase tracking-[1.4px] text-[#a0a0a0] transition-colors hover:text-primary">
              Features
            </Link>
            <Link href="#pricing" className="text-[14px] font-semibold uppercase tracking-[1.4px] text-[#a0a0a0] transition-colors hover:text-primary">
              Pricing
            </Link>
            <Link href="#docs" className="text-[14px] font-semibold uppercase tracking-[1.4px] text-[#a0a0a0] transition-colors hover:text-primary">
              Docs
            </Link>
            <Link href="#changelog" className="text-[14px] font-semibold uppercase tracking-[1.4px] text-[#a0a0a0] transition-colors hover:text-primary">
              Changelog
            </Link>
            <div className="flex flex-col gap-3 pt-4 border-t border-[rgba(65,65,65,0.8)]">
              <Link href="/login" className="w-full">
                <Button variant="ghost" size="sm" className="w-full justify-center rounded-[4px] border border-[#4f5100] text-white hover:bg-[#3a3a3a] hover:text-[#f4f692] uppercase font-bold tracking-[1.4px]">
                  Sign In
                </Button>
              </Link>
              <Link href="/login" className="w-full">
                <Button size="sm" className="w-full justify-center rounded-[4px] border border-[#141414] bg-[#166534] text-white hover:bg-[#3a3a3a] uppercase font-bold tracking-[1.4px]">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
