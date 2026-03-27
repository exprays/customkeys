"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Loader2, Terminal, CheckCircle2 } from "lucide-react";

function AuthHandler() {
  const searchParams = useSearchParams();
  const port = searchParams.get("port");
  
  const [status, setStatus] = useState<"authorizing" | "success" | "error">("authorizing");
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (!port) {
      setStatus("error");
      setErrorText("Missing port parameter. Please start the login flow from the CLI.");
      return;
    }

    async function authorize() {
      try {
        const res = await api.createToken("CLI Login Token", ["all"]) as any;
        const token = res?.token || res?.raw_token || res?.id || JSON.stringify(res);
        
        window.location.href = `http://localhost:${port}/callback?token=${encodeURIComponent(token)}`;
        setStatus("success");
      } catch (err: any) {
        setStatus("error");
        setErrorText(err.message || "Failed to generate CLI token. Please ensure you are logged in.");
      }
    }

    authorize();
  }, [port]);

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
        <div className="p-4 rounded-full bg-red-950 text-red-500 mb-6">
          <Terminal size={32} />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Authorization Failed</h1>
        <p className="text-muted-foreground">{errorText}</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
        <div className="p-4 rounded-full bg-green-950 text-green-500 mb-6 relative">
          <Terminal size={32} />
          <CheckCircle2 size={16} className="absolute bottom-2 right-2 text-green-400 bg-background rounded-full" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">CLI Authorized</h1>
        <p className="text-muted-foreground">You can safely close this window and return to your terminal.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
      <div className="p-4 rounded-full bg-accent text-accent-foreground mb-6">
        <Loader2 size={32} className="animate-spin" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Authorizing Nano CLI...</h1>
      <p className="text-muted-foreground">Generating secure token and waiting for confirmation.</p>
    </div>
  );
}

import { Suspense } from "react";
export default function CLIAuthPage() {
  return (
    <Suspense fallback={<div>Loading authorization...</div>}>
      <AuthHandler />
    </Suspense>
  );
}
