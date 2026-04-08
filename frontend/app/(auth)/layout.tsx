import { DitherShader } from "@/components/ui/dither-shader";
import { Instagram, Youtube, Music2, Disc, Github } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-black overflow-hidden font-sans">
      {/* Left side: Visual/Background */}
      <div className="relative hidden lg:flex lg:w-1/2 min-h-full items-center justify-center overflow-hidden">
        <DitherShader
          src="https://plus.unsplash.com/premium_photo-1676618539962-a492182bdae4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8c2VjdXJlfGVufDB8fDB8fHww"
          gridSize={2}
          ditherMode="bayer"
          colorMode="grayscale"
          invert={false}
          animated={false}
          animationSpeed={0.02}
          primaryColor="#000000"
          secondaryColor="#f5f5f5"
          threshold={0.5}
          className="absolute inset-0 z-0 h-full w-full"
        />

        {/* Overlay Content */}
        <div className="relative z-10 w-full px-12 py-24 flex flex-col justify-center h-full">
          <div className="bg-black/80 backdrop-blur-md p-10 border border-[rgba(65,65,65,0.8)] rounded-xl max-w-xl flex flex-col gap-12">
            <div>
              <p className="text-white/60 text-sm uppercase tracking-[0.2em] mb-4">You can easily</p>
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                Secure your credentials <br />
                with <span className="text-[#faff69]">Nano</span>
              </h1>
            </div>

            <div>
              <p className="text-white/40 text-sm font-semibold uppercase tracking-[0.1em] mb-6">Our partners</p>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-6 opacity-90 transition-opacity">
                <div className="flex items-center gap-2 group">
                  <Disc className="w-6 h-6 text-[#faff69]" />
                  <span className="text-[#faff69] font-bold text-lg">Discord</span>
                </div>
                <div className="flex items-center gap-2 group">
                  <Instagram className="w-6 h-6 text-[#faff69]" />
                  <span className="text-[#faff69] font-bold text-lg">Instagram</span>
                </div>
                <div className="flex items-center gap-2 group">
                  <Github className="w-6 h-6 text-[#faff69]" />
                  <span className="text-[#faff69] font-bold text-lg">Github</span>
                </div>
                <div className="flex items-center gap-2 group">
                  <Youtube className="w-6 h-6 text-[#faff69]" />
                  <span className="text-[#faff69] font-bold text-lg">YouTube</span>
                </div>
                <div className="flex items-center gap-2 group">
                  <Music2 className="w-6 h-6 text-[#faff69]" />
                  <span className="text-[#faff69] font-bold text-lg">TikTok</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-black px-6 py-12 lg:px-24">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
