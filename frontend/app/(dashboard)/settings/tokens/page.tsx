import { Button } from "@/components/ui/button"
import { ScrollText, Key, Plus } from "lucide-react"

export default function TokensPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">API Tokens (CLI Access)</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate tokens for the nan0 CLI tool and external integrations.
        </p>
      </div>

      <div className="surface p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Active Tokens</h2>
          <Button size="sm" className="gap-2">
            <Plus size={16} />
            Generate Token
          </Button>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-card">
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Name</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Token Prefix</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Last Used</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background/50">
              <tr className="hover:bg-accent/10 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Key size={14} className="text-primary" />
                    <span className="text-sm font-medium text-foreground">Laptop CLI</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono text-muted-foreground px-2 py-0.5 bg-card border border-border rounded">nan0_abc123...</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-muted-foreground">2 mins ago</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-muted-foreground">Today</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                    Revoke
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
