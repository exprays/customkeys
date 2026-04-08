export function Stats() {
  const stats = [
    {
      value: "10x",
      label: "faster secret rotation",
      description: "than manual processes"
    },
    {
      value: "99.9%",
      label: "uptime SLA",
      description: "guaranteed availability"
    },
    {
      value: "$0.01",
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
    <section className="border-y border-[rgba(65,65,65,0.8)] bg-black">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center md:text-left flex flex-col justify-end">
              <div className="text-[48px] md:text-[72px] font-bold leading-none text-white font-sans tracking-tight">
                {stat.value.replace(/[^\d.]/g, '')}
                <span className="text-[#faff69]">{stat.value.replace(/[\d.]/g, '')}</span>
              </div>
              <div className="mt-4 text-[14px] font-semibold uppercase tracking-[1.4px] text-white">
                {stat.label}
              </div>
              <div className="mt-2 text-[14px] text-[#a0a0a0]">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
