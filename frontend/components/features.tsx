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
    <section id="features" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-accent">
            Features
          </p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Everything you need for secrets at scale
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Built by engineers who got tired of the operational overhead of self-hosted 
            solutions and the unpredictable costs of cloud provider offerings.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-accent/50 hover:bg-card/80"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
