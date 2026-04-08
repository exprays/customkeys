"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const tabs = [
  {
    id: "cli",
    label: "CLI",
    code: `# Install the nan0 CLI
brew install nan0-io/tap/nan0

# Authenticate with your account
nan0 auth login

# Set a secret for production
nan0 secret set STRIPE_SECRET_KEY \\
  --env=production \\
  --value="sk_live_..."

# Inject secrets into your process
nan0 run --env=production -- node server.js`,
    language: "bash"
  },
  {
    id: "sdk",
    label: "Go SDK",
    code: `package main

import (
    "context"
    "log"
    
    "github.com/nan0-io/nan0-go"
)

func main() {
    client := nan0.NewClient(
        nan0.WithProject("my-app"),
        nan0.WithEnvironment("production"),
    )
    
    secret, err := client.Get(context.Background(), "DATABASE_URL")
    if err != nil {
        log.Fatal(err)
    }
    
    // Use secret.Value in your application
    db := connectDB(secret.Value)
}`,
    language: "go"
  },
  {
    id: "kubernetes",
    label: "Kubernetes",
    code: `apiVersion: nan0.io/v1
kind: SecretSync
metadata:
  name: app-secrets
spec:
  project: my-app
  environment: production
  destination:
    kind: Secret
    name: app-secrets
  secrets:
    - name: DATABASE_URL
    - name: REDIS_URL
    - name: API_KEY
  refreshInterval: 60s
  
---
# Secrets are automatically synced
# and rotated in your cluster`,
    language: "yaml"
  },
  {
    id: "github",
    label: "GitHub Actions",
    code: `name: Deploy
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Inject Secrets
        uses: nan0-io/action@v1
        with:
          project: my-app
          environment: production
          token: \${{ secrets.NAN0_TOKEN }}
          
      - name: Deploy
        run: |
          # Secrets are now available as
          # environment variables
          echo "Deploying with injected secrets..."
          ./deploy.sh`,
    language: "yaml"
  }
]

export function CodeExample() {
  const [activeTab, setActiveTab] = useState("cli")
  const activeCode = tabs.find(t => t.id === activeTab)

  return (
    <section className="py-20 md:py-28 bg-[#000000]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[14px] font-semibold uppercase tracking-[1.4px] text-[#faff69]">
            02 / INTEGRATIONS
          </p>
          <h2 className="mt-4 text-balance text-[36px] font-bold tracking-normal text-[#ffffff] md:text-[36px] font-sans">
            Works with your existing stack
          </h2>
          <p className="mt-6 text-pretty text-[18px] leading-[1.56] text-[#a0a0a0] font-normal">
            Native integrations for every workflow. From local development to production Kubernetes clusters.
          </p>
        </div>

        <div className="mx-auto mt-20 max-w-4xl">
          <div className="card-inset overflow-hidden !p-0">
            {/* Tabs */}
            <div className="flex border-b border-border bg-[#000000]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-6 py-4 text-[13px] font-bold uppercase tracking-[1.4px] transition-all",
                    activeTab === tab.id
                      ? "bg-[#141414] text-[#faff69] border-b-2 border-[#faff69]"
                      : "text-[#a0a0a0] hover:text-[#ffffff] hover:bg-[#141414]"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Code */}
            <div className="overflow-x-auto p-8 bg-black/40">
              <pre className="font-mono text-[16px] font-semibold leading-relaxed">
                <code className="text-[#a0a0a0]">
                  {activeCode?.code.split('\n').map((line, i) => (
                    <div key={i} className="flex">
                      <span className="mr-6 w-6 flex-shrink-0 text-right text-[#585858] font-normal">{i + 1}</span>
                      <span className="flex-1">
                        {line.includes('#') || line.startsWith('//') ? (
                          <span className="text-[#585858] font-normal">{line}</span>
                        ) : line.includes('nan0') || line.includes('NAN0') ? (
                          <span className="text-[#faff69]">{line}</span>
                        ) : (
                          <span className="text-[#ffffff]">{line}</span>
                        )}
                      </span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
