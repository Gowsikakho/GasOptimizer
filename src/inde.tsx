import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { results, totals, savedPct, feeEth, techniques, v1Code, v2Code, type Size } from "@/lib/gas-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gas Lab — Solidity V1 vs V2 Gas Comparison" },
      { name: "description", content: "Compare gas usage of a standard and an optimised Solidity marks registry contract." },
      { property: "og:title", content: "Gas Lab — Solidity V1 vs V2" },
      { property: "og:description", content: "Interactive gas comparison of two Solidity implementations of the same contract." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const fmt = (n: number) => n.toLocaleString("en-US");

function Index() {
  const [size, setSize] = useState<Size>(50);
  const [gwei, setGwei] = useState(20);
  const [tab, setTab] = useState<"v1" | "v2">("v2");
  const rows = results[size];
  const t = totals(rows);
  const max = Math.max(...rows.map((r) => r.v1));

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 font-sans">
      <header className="mb-12">
        <p className="font-mono text-sm text-primary">// gas-lab · solidity 0.8.24 · optimizer off</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
          Same contract. <span className="text-primary">{savedPct(t.v1, t.v2).toFixed(1)}%</span> less gas.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Two versions of a Student Marks Registry with identical behaviour. Version 2 applies gas-saving
          techniques — see how much cheaper it is.
        </p>
      </header>

      <section className="mb-10 flex flex-wrap items-center gap-3">
        <span className="font-mono text-sm text-muted-foreground">marks stored:</span>
        {([10, 50, 100] as Size[]).map((s) => (
          <button key={s} onClick={() => setSize(s)} className={`chip ${size === s ? "chip-active" : ""}`}>
            {s}
          </button>
        ))}
      </section>

      <section className="panel mb-10">
        <div className="mb-6 flex gap-6 font-mono text-xs">
          <span className="flex items-center gap-2"><i className="legend bg-v1" /> V1 standard</span>
          <span className="flex items-center gap-2"><i className="legend bg-primary" /> V2 optimised</span>
        </div>
        <div className="space-y-5">
          {rows.map((r) => (
            <div key={r.op}>
              <div className="mb-1 flex justify-between font-mono text-sm">
                <span>{r.op}</span>
                <span className="text-primary">−{savedPct(r.v1, r.v2).toFixed(1)}%</span>
              </div>
              <div className="bar bg-v1" style={{ width: `${Math.max((r.v1 / max) * 100, 12)}%` }}>{fmt(r.v1)}</div>
              <div className="bar mt-1 bg-primary text-primary-foreground" style={{ width: `${Math.max((r.v2 / max) * 100, 12)}%` }}>{fmt(r.v2)}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-4 border-t pt-6 sm:grid-cols-3">
          <Stat label="V1 total gas" value={fmt(t.v1)} />
          <Stat label="V2 total gas" value={fmt(t.v2)} accent />
          <Stat label="Gas saved" value={fmt(t.v1 - t.v2)} />
        </div>
      </section>

      <section className="panel mb-10">
        <h2 className="mb-4 text-xl font-semibold">Fee calculator</h2>
        <label className="flex items-center gap-4 font-mono text-sm">
          gas price
          <input type="range" min={1} max={200} value={gwei} onChange={(e) => setGwei(+e.target.value)} className="flex-1 accent-[var(--primary)]" />
          <span className="w-20 text-right text-primary">{gwei} Gwei</span>
        </label>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="V1 cost" value={`${feeEth(t.v1, gwei).toFixed(5)} ETH`} />
          <Stat label="V2 cost" value={`${feeEth(t.v2, gwei).toFixed(5)} ETH`} accent />
          <Stat label="You save" value={`${feeEth(t.v1 - t.v2, gwei).toFixed(5)} ETH`} />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">What makes V2 cheaper</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {techniques.map((x, i) => (
            <div key={x.name} className="panel !p-5">
              <p className="font-mono text-xs text-primary">0{i + 1}</p>
              <h3 className="mt-1 font-semibold">{x.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{x.idea}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="mb-4 flex gap-2">
          <button onClick={() => setTab("v1")} className={`chip ${tab === "v1" ? "chip-active" : ""}`}>MarksRegistryV1.sol</button>
          <button onClick={() => setTab("v2")} className={`chip ${tab === "v2" ? "chip-active" : ""}`}>MarksRegistryV2.sol</button>
          <button onClick={() => navigator.clipboard.writeText(tab === "v1" ? v1Code : v2Code)} className="chip ml-auto">copy</button>
        </div>
        <pre className="max-h-[480px] overflow-auto rounded-md bg-background p-4 font-mono text-xs leading-relaxed text-muted-foreground">
          {tab === "v1" ? v1Code : v2Code}
        </pre>
      </section>

      <footer className="mt-12 font-mono text-xs text-muted-foreground">
        Data from the Gas Optimisation in Solidity assignment report · measured on a local EVM node.
      </footer>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}
