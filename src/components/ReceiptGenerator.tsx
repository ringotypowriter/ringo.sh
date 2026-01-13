import { useRef, useState, useEffect, useCallback } from "react";
import { toPng } from "html-to-image";

const MONO_STACK =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

function Divider() {
  return (
    <div className="whitespace-nowrap overflow-hidden text-[11px] leading-none text-sand-text-light/70 select-none">
      {"-".repeat(200)}
    </div>
  );
}

// Code 128-B pattern generator: algorithmic computation from character value
// Each character has a value 0-94 (ASCII 32-126), and the 11-bit pattern is derived from the value
function getCode128Pattern(value: number): string {
  const upper = (value >> 7) & 0xF;
  const lower = value & 0x7F;
  const bits = lower ^ upper;
  let pattern = 0;
  let bitPos = 0;
  for (let i = 0; i < 11; i += 1) {
    const b = (bits >> (i % 8)) & 1;
    if (i === 0) {
      pattern |= b << bitPos;
      bitPos += b ? 1 : 2;
    } else {
      pattern |= b << bitPos;
      bitPos += b ? 2 : 1;
    }
  }
  return pattern.toString(2).padStart(11, "0");
}

function getCharPattern(char: string): string {
  return getCode128Pattern(char.charCodeAt(0) - 32);
}

// Start code B (104) and Stop code (106) patterns
const START_CODE_B = "11010010000"; // 11 bits
const STOP_CODE = "1100011101011"; // 13 bits

function getChecksum(input: string): string {
  let sum = 104; // Code B start value
  for (let i = 0; i < input.length; i += 1) {
    const charCode = input.charCodeAt(i);
    const value = charCode - 32; // Index in pattern table
    sum += value * (i + 1);
  }
  const checksumValue = sum % 103;
  return getCode128Pattern(checksumValue);
}

function buildCode128Bits(value: string): string {
  let bits = START_CODE_B;

  for (const char of value) {
    const charCode = char.charCodeAt(0) - 32;
    if (charCode >= 0 && charCode < 95) {
      bits += getCharPattern(char);
    }
  }

  bits += getChecksum(value);
  bits += STOP_CODE;

  return bits;
}

function Barcode({ value, label }: { value: string; label: string }) {
  const bits = buildCode128Bits(value);
  const bitsLength = bits.length;

  const rects: Array<{ x: number; w: number }> = [];
  let x = 0;
  let i = 0;
  while (i < bits.length) {
    const bit = bits[i];
    let j = i + 1;
    while (j < bits.length && bits[j] === bit) j += 1;
    const w = j - i;
    if (bit === "1") rects.push({ x, w });
    x += w;
    i = j;
  }

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        viewBox={`0 0 ${bitsLength} 60`}
        width="100%"
        height="44"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <rect x="0" y="0" width={bitsLength} height="60" fill="transparent" />
        {rects.map((r, idx) => (
          <rect
            key={`${r.x}-${idx}`}
            x={r.x}
            y="0"
            width={r.w}
            height="60"
            fill="currentColor"
          />
        ))}
      </svg>
      <div className="mt-1 text-[10px] text-sand-text-light/75 tabular-nums tracking-[0.18em] uppercase select-none">
        {label}
      </div>
    </div>
  );
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function generateReceiptNo() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "R-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface EditableTextProps {
  className?: string;
  placeholder?: string;
  value: string;
  onChange?: (value: string) => void;
}

function EditableText({
  className = "",
  placeholder = "",
  value,
  onChange,
}: EditableTextProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(value);
  const isFocusedRef = useRef(false);
  const initializedRef = useRef(false);

  // Initialize content on mount
  useEffect(() => {
    if (!elementRef.current || initializedRef.current) return;
    elementRef.current.textContent = value;
    lastValueRef.current = value;
    initializedRef.current = true;
  }, []); // Run once on mount

  // Sync content only when element is NOT focused
  useEffect(() => {
    if (!elementRef.current || !initializedRef.current) return;

    // Only sync if value changed from an external source (not user typing)
    if (!isFocusedRef.current && lastValueRef.current !== value) {
      if (elementRef.current.textContent !== value) {
        elementRef.current.textContent = value;
      }
      lastValueRef.current = value;
    }
  }, [value]);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const newValue = e.currentTarget.textContent || "";
    lastValueRef.current = newValue;
    onChange?.(newValue);
  }, [onChange]);

  return (
    <div
      ref={elementRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onFocus={() => { isFocusedRef.current = true; }}
      onBlur={() => {
        isFocusedRef.current = false;
        // Sync on blur to catch any external changes
        if (elementRef.current && elementRef.current.textContent !== value) {
          elementRef.current.textContent = value;
        }
      }}
      className={`outline-none focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-sand-text-light/40 ${className}`}
      data-placeholder={placeholder}
    />
  );
}

interface LineItem {
  id: string;
  name: string;
  qty: string;
  price: string;
}

interface ReceiptSettings {
  headerTitle: string;
  receiptLabel: string;
  dateLabel: string;
  cashierLabel: string;
  itemLabel: string;
  amountLabel: string;
  subtotalLabel: string;
  taxLabel: string;
  totalLabel: string;
  tenderedLabel: string;
  changeLabel: string;
  footerThanks: string;
  footerContact: string;
}

export default function ReceiptGenerator() {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Settings state (all editable labels)
  const [settings, setSettings] = useState<ReceiptSettings>({
    headerTitle: "RINGO STORE",
    receiptLabel: "RECEIPT #:",
    dateLabel: "DATE:",
    cashierLabel: "CASHIER:",
    itemLabel: "ITEM",
    amountLabel: "AMOUNT",
    subtotalLabel: "SUBTOTAL:",
    taxLabel: "TAX:",
    totalLabel: "TOTAL:",
    tenderedLabel: "TENDERED:",
    changeLabel: "CHANGE:",
    footerThanks: "THANK YOU FOR YOUR PATRONAGE",
    footerContact: "Returns accepted within 30 days",
  });

  // Basic info
  const [receiptNo, setReceiptNo] = useState(() => generateReceiptNo());
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [cashierName, setCashierName] = useState("STAFF");

  // Transaction info
  const [tendered, setTendered] = useState("$20.00");
  const [change, setChange] = useState("$4.50");

  // Line items
  const [items, setItems] = useState<LineItem[]>([
    { id: generateId(), name: "COFFEE BEAN (250G)", qty: "1", price: "$12.50" },
    { id: generateId(), name: "CROISSANT", qty: "2", price: "$6.00" },
    { id: generateId(), name: "GREEN TEA", qty: "1", price: "$4.00" },
  ]);

  // Totals
  const [subtotal, setSubtotal] = useState("$22.50");
  const [tax, setTax] = useState("$1.80");
  const [total, setTotal] = useState("$24.30");

  const updateSetting = (key: keyof ReceiptSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: generateId(), name: "New Item", qty: "1", price: "$0.00" },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleDownload = async () => {
    if (!receiptRef.current || isDownloading) return;

    setIsDownloading(true);

    // Temporarily remove filter for capture
    const originalFilter = receiptRef.current.style.filter;
    receiptRef.current.style.filter = 'none';

    try {
      const dataUrl = await toPng(receiptRef.current, {
        backgroundColor: "#FDFCF5",
        pixelRatio: 2,
        fontEmbedCSS: "",
      });
      const link = document.createElement("a");
      link.download = `receipt-${receiptNo}-${date}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to generate image:", error);
    } finally {
      receiptRef.current.style.filter = originalFilter;
      // Add delay before re-enabling to prevent rapid double clicks
      setTimeout(() => setIsDownloading(false), 500);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 px-4 min-h-screen w-full">
      {/* Receipt */}
      <div
        ref={receiptRef}
        className="receipt-content w-full max-w-[420px] bg-sand-light text-sand-text-light px-4 py-3 border border-sand-text-light/20 relative"
        style={{
          fontFamily: MONO_STACK,
          filter: "contrast(1.06) saturate(0.95)",
          backgroundImage:
            "linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.00)), radial-gradient(circle at 12% 18%, rgba(0,0,0,0.02), transparent 55%)",
        }}
      >
        <header className="text-center">
          <EditableText
            className="text-[15px] font-semibold wrap-break-word leading-6 text-sand-text-light/90"
            value={settings.headerTitle}
            onChange={(v) => updateSetting("headerTitle", v)}
          />
        </header>

        <div className="mt-3">
          <Divider />
        </div>

        <section className="mt-3 space-y-1">
          <div className="grid grid-cols-[10ch_1fr] gap-x-2 text-[11px] text-sand-text-light/90">
            <EditableText
              className="text-sand-text-light/75"
              value={settings.receiptLabel}
              onChange={(v) => updateSetting("receiptLabel", v)}
            />
            <EditableText
              className="tabular-nums"
              value={receiptNo}
              onChange={setReceiptNo}
            />
          </div>
          <div className="grid grid-cols-[10ch_1fr] gap-x-2 text-[11px] text-sand-text-light/90">
            <EditableText
              className="text-sand-text-light/75"
              value={settings.dateLabel}
              onChange={(v) => updateSetting("dateLabel", v)}
            />
            <EditableText
              className="tabular-nums"
              value={date}
              onChange={setDate}
            />
          </div>
          <div className="grid grid-cols-[10ch_1fr] gap-x-2 text-[11px] text-sand-text-light/90">
            <EditableText
              className="text-sand-text-light/75"
              value={settings.cashierLabel}
              onChange={(v) => updateSetting("cashierLabel", v)}
            />
            <EditableText
              className="wrap-break-word"
              value={cashierName}
              onChange={setCashierName}
            />
          </div>
        </section>

        <div className="mt-3">
          <Divider />
        </div>

        <section className="mt-3 space-y-2">
          <div className="flex items-baseline justify-between text-[11px] text-sand-text-light/75 select-none">
            <EditableText
              value={settings.itemLabel}
              onChange={(v) => updateSetting("itemLabel", v)}
            />
            <EditableText
              value={settings.amountLabel}
              onChange={(v) => updateSetting("amountLabel", v)}
            />
          </div>

          <div className="space-y-1 text-[11px] text-sand-text-light/90">
            {items.map((item, index) => (
              <div key={item.id} className="group/item relative flex items-center gap-1">
                <div className="grid grid-cols-[2.5rem_1fr] gap-2 items-start flex-1">
                  <div className="tabular-nums text-sand-text-light/70 select-none">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="min-w-0 wrap-break-word">
                    <EditableText
                      value={item.name}
                      onChange={(v) => updateItem(item.id, "name", v)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <EditableText
                    className="tabular-nums select-none"
                    value={item.price}
                    onChange={(v) => updateItem(item.id, "price", v)}
                  />
                  <button
                    onClick={() => removeItem(item.id)}
                    className="opacity-0 group-hover/item:opacity-100 text-red-400 hover:text-red-600 transition-all cursor-pointer select-none -translate-x-2 group-hover/item:translate-x-0"
                    title="Remove item"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-3">
          <Divider />
        </div>

        <section className="mt-3 space-y-1">
          <div className="grid grid-cols-[1fr_auto] gap-3 text-[11px] text-sand-text-light/90">
            <EditableText
              className="text-sand-text-light/75"
              value={settings.subtotalLabel}
              onChange={(v) => updateSetting("subtotalLabel", v)}
            />
            <EditableText
              className="tabular-nums"
              value={subtotal}
              onChange={setSubtotal}
            />
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3 text-[11px] text-sand-text-light/90">
            <EditableText
              className="text-sand-text-light/75"
              value={settings.taxLabel}
              onChange={(v) => updateSetting("taxLabel", v)}
            />
            <EditableText
              className="tabular-nums"
              value={tax}
              onChange={setTax}
            />
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3 text-[11px] text-sand-text-light/90 font-semibold mt-1">
            <EditableText
              value={settings.totalLabel}
              onChange={(v) => updateSetting("totalLabel", v)}
            />
            <EditableText
              className="tabular-nums"
              value={total}
              onChange={setTotal}
            />
          </div>
        </section>

        <div className="mt-3">
          <Divider />
        </div>

        <section className="mt-3 space-y-1">
          <div className="grid grid-cols-[1fr_auto] gap-3 text-[11px] text-sand-text-light/90">
            <EditableText
              className="text-sand-text-light/75"
              value={settings.tenderedLabel}
              onChange={(v) => updateSetting("tenderedLabel", v)}
            />
            <EditableText
              className="tabular-nums"
              value={tendered}
              onChange={setTendered}
            />
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3 text-[11px] text-sand-text-light/90">
            <EditableText
              className="text-sand-text-light/75"
              value={settings.changeLabel}
              onChange={(v) => updateSetting("changeLabel", v)}
            />
            <EditableText
              className="tabular-nums"
              value={change}
              onChange={setChange}
            />
          </div>
        </section>

        <div className="mt-3">
          <Divider />
        </div>

        <footer className="mt-3 space-y-2">
          <div className="text-center space-y-1">
            <Barcode value={receiptNo} label={receiptNo} />
          </div>
          <div className="pt-1 text-center">
            <EditableText
              className="text-[10px] tracking-[0.22em] uppercase text-sand-text-light/60"
              value={settings.footerThanks}
              onChange={(v) => updateSetting("footerThanks", v)}
            />
          </div>
          <div className="text-center">
            <EditableText
              className="text-[10px] text-sand-text-light/50"
              value={settings.footerContact}
              onChange={(v) => updateSetting("footerContact", v)}
            />
          </div>
        </footer>
      </div>

      {/* Add Item button - outside receipt to avoid rendering */}
      <button
        onClick={addItem}
        className="w-full max-w-[420px] mt-2 px-4 py-3 text-sm font-medium text-sand-text-light bg-sand-light hover:bg-white dark:bg-sand-dark dark:hover:bg-[#2a2a26] border border-sand-text-light/30 hover:border-sand-text-light/60 rounded shadow-sm hover:shadow transition-all cursor-pointer active:scale-[0.98]"
      >
        + Add Item
      </button>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="w-full max-w-[420px] px-6 py-3 bg-sand-text-light text-sand-light font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer active:scale-[0.98]"
      >
        {isDownloading ? "Generating..." : "Download Receipt"}
      </button>

      <p className="text-xs opacity-60 text-center max-w-[320px]">
        Click on any text to edit it directly
      </p>
    </div>
  );
}
