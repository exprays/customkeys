export function Stats() {
  const stats = [
    {
      value: "10x",
      label: "faster secret rotation",
      description: "than manual processes"
    },
    {
      value: "99.99%",
      label: "uptime SLA",
      description: "guaranteed availability"
    },
    {
      value: "$0.001",
      label: "per API call",
      description: "vs $0.05 on AWS"
    },
    {
      value: "<5ms",
      label: "p99 latency",
      description: "global edge network"
    }
  ]

  return (
    <section className="border-y border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center md:text-left">
              <div className="text-3xl font-bold text-foreground md:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">
                {stat.label}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
