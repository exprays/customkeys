import { 
  Key, 
  Shield, 
  GitBranch, 
  Clock, 
  Layers,
  Terminal
} from "lucide-react"

const features = [
  {
    icon: Key,
    title: "Unified Secret Store",
    description: "Store API keys, database credentials, TLS certificates, and environment variables in one secure, centralized location."
  },
  {
    icon: Shield,
    title: "Zero-Knowledge Encryption",
    description: "Your secrets are encrypted client-side before transmission. We never see your plaintext data — ever."
  },
  {
    icon: GitBranch,
    title: "Environment Branching",
    description: "Seamlessly manage secrets across development, staging, and production with inheritance and overrides."
  },
  {
    icon: Clock,
    title: "Automatic Rotation",
    description: "Schedule automatic secret rotation with zero downtime. Integrates with AWS, GCP, and Azure credential providers."
  },
  {
    icon: Layers,
    title: "Full Audit Trail",
    description: "Every access, modification, and rotation is logged with user context. Export to your SIEM for compliance."
  },
  {
    icon: Terminal,
    title: "Developer-First CLI",
    description: "A blazing-fast Go CLI that integrates with your shell, CI/CD pipelines, and local development workflow."
  }
]

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28 bg-[#000000]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[14px] font-semibold uppercase tracking-[1.4px] text-[#faff69]">
            01 / FEATURES
          </p>
          <h2 className="mt-4 text-balance text-[36px] leading-[1.30] font-bold tracking-normal text-[#ffffff] md:text-[36px] font-sans">
            Everything you need for secrets at scale
          </h2>
          <p className="mt-6 text-pretty text-[18px] text-[#a0a0a0] leading-[1.56] font-normal">
            Built by engineers who got tired of the operational overhead of self-hosted 
            solutions and the unpredictable costs of cloud provider offerings.
          </p>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="card-standard group hover:border-[#faff69] hover:shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition-all duration-300"
            >
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-[4px] bg-[#000000] border border-border text-[#faff69] group-hover:bg-[#faff69] group-hover:text-black transition-colors">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-[20px] font-semibold text-[#ffffff] leading-[1.40] font-sans">
                {feature.title}
              </h3>
              <p className="mt-3 text-[16px] text-[#a0a0a0] leading-[1.50]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
