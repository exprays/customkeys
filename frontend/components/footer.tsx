import Link from "next/link"
import { Github, Twitter } from "lucide-react"

const footerLinks = {
  Product: [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Changelog", href: "#" },
    { name: "Documentation", href: "#" },
    { name: "API Reference", href: "#" }
  ],
  Company: [
    { name: "About", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Contact", href: "#" }
  ],
  Resources: [
    { name: "Community", href: "#" },
    { name: "Status", href: "#" },
    { name: "Support", href: "#" },
    { name: "Security", href: "#" }
  ],
  Legal: [
    { name: "Privacy", href: "#" },
    { name: "Terms", href: "#" },
    { name: "DPA", href: "#" }
  ]
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-[#000000] pt-16 pb-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-[28px] w-[28px] items-center justify-center rounded-[4px] bg-[#faff69] text-[14px] font-black text-black">
                n0
              </div>
              <span className="text-[20px] font-bold tracking-tight text-white font-sans">nano</span>
            </Link>
            <p className="mt-6 max-w-xs text-[16px] leading-relaxed text-[#a0a0a0]">
              Cloud-native secrets management built for modern engineering teams. 
              Secure, fast, and developer-friendly.
            </p>
            <div className="mt-8 flex items-center gap-5">
              <a 
                href="#" 
                className="text-[#a0a0a0] transition-colors hover:text-[#faff69]"
                aria-label="GitHub"
              >
                <Github className="h-6 w-6" />
              </a>
              <a 
                href="#" 
                className="text-[#a0a0a0] transition-colors hover:text-[#faff69]"
                aria-label="Twitter"
              >
                <Twitter className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-[14px] font-semibold uppercase tracking-[1.4px] text-[#faff69]">{category}</h3>
              <ul className="mt-6 space-y-4">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-[14px] font-semibold text-[#a0a0a0] transition-colors hover:text-[#ffffff] uppercase tracking-[1.4px]"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20 flex flex-col items-center justify-between gap-6 border-t border-border pt-8 md:flex-row">
          <p className="text-[14px] text-[#a0a0a0] font-semibold uppercase tracking-[1.4px]">
            © {new Date().getFullYear()} nan0, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-[14px] text-[#a0a0a0] font-bold uppercase tracking-[1.4px]">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#faff69] animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  )
}
