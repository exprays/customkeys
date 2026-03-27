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
    <section className="py-20 md:py-28 bg-card/30">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-accent">
            Integrations
          </p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Works with your existing stack
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Native integrations for every workflow. From local development to production Kubernetes clusters.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {/* Tabs */}
            <div className="flex border-b border-border bg-secondary/30">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "border-b-2 border-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Code */}
            <div className="overflow-x-auto p-6">
              <pre className="font-mono text-sm leading-relaxed">
                <code className="text-muted-foreground">
                  {activeCode?.code.split('\n').map((line, i) => (
                    <div key={i} className="flex">
                      <span className="mr-4 w-6 flex-shrink-0 text-right text-muted-foreground/50">{i + 1}</span>
                      <span className="flex-1">
                        {line.includes('#') ? (
                          <span className="text-muted-foreground">{line}</span>
                        ) : line.includes('nan0') || line.includes('NAN0') ? (
                          <span className="text-accent">{line}</span>
                        ) : (
                          <span className="text-foreground">{line}</span>
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
