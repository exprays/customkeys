"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyableId({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="inline-flex items-center gap-1.5 mt-1">
      <span className="text-xs text-gray-500">{label}:</span>
      <code className="text-xs font-mono text-gray-400 bg-gray-800/60 px-1.5 py-0.5 rounded select-all">
        {value}
      </code>
      <button
        onClick={copy}
        className="text-gray-600 hover:text-gray-300 transition-colors p-0.5 rounded"
        title={`Copy ${label}`}
      >
        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
      </button>
    </div>
  );
}
