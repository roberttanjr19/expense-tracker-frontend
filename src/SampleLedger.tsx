interface LedgerRow {
  label: string;
  amount: string;
}

const rows: LedgerRow[] = [
  { label: "Groceries — Loblaws", amount: "84.20" },
  { label: "Presto reload", amount: "40.00" },
  { label: "Rent — July", amount: "420.00" },
  { label: "Coffee — Balzac's", amount: "6.75" },
  { label: "Textbook — COMP228", amount: "129.99" },
  { label: "Cinema", amount: "18.50" },
  { label: "Bus pass", amount: "128.00" },
  { label: "Groceries — No Frills", amount: "61.30" },
];

// Rendered twice back-to-back so the track can translate exactly -50%
// (one copy's height) and land on a frame identical to translateY(0) —
// see the ledger-scroll keyframes in index.css for why that's seamless.
const feedRows = [...rows, ...rows];

/**
 * Ambient, decorative preview of what the real ledger will look like:
 * rows drift upward like continuous-feed paper. Not wired to the API.
 */
function SampleLedger() {
  return (
    <div className="h-[186px] overflow-hidden border-t border-rule" aria-hidden="true">
      <div className="ledger-feed-track animate-[ledger-scroll_40s_linear_infinite]">
        {feedRows.map((row, index) => (
          <div
            key={index}
            className={`flex items-center justify-between border-b border-rule px-4 py-[9px] text-[15px] ${
              index % 2 === 0 ? "bg-band" : ""
            }`}
          >
            <span>{row.label}</span>
            <span className="font-mono tabular-nums">{row.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SampleLedger;
