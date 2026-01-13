import { useState, useEffect, useCallback } from "react";

// Simple snowflake icon
const SnowIcon = ({ active }: { active: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-opacity duration-200 ${active ? "opacity-100" : "opacity-40"}`}
  >
    <path d="M2 12h20M12 2v20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

interface SnowToggleProps {
  onChange?: (active: boolean) => void;
}

export default function SnowToggle({ onChange }: SnowToggleProps) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("snow-toggle");
    let initialState = false;
    if (saved !== null) {
      initialState = saved === "true";
    } else {
      const now = new Date();
      const isWinter = now.getMonth() >= 11 || now.getMonth() <= 1;
      initialState = isWinter;
      if (isWinter) {
        localStorage.setItem("snow-toggle", "true");
      }
    }
    setIsActive(initialState);
    // 同步到 Snowfall
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("snow-toggle", { detail: { active: initialState } }));
    }
  }, []);

  const toggle = useCallback(() => {
    const newState = !isActive;
    setIsActive(newState);
    localStorage.setItem("snow-toggle", String(newState));
    onChange?.(newState);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("snow-toggle", { detail: { active: newState } }));
    }
  }, [isActive, onChange]);

  // Listen for snow-toggle event from mobile menu
  useEffect(() => {
    const handleToggle = () => {
      toggle();
    };
    window.addEventListener("snow-toggle", handleToggle);
    return () => window.removeEventListener("snow-toggle", handleToggle);
  }, [toggle]);

  return (
    <button
      onClick={toggle}
      className="p-1.5 rounded-md hover:bg-sand-text-light/10 dark:hover:bg-sand-text-dark/10 transition-colors"
      aria-label="Toggle snow"
      title={isActive ? "Snow ON" : "Snow OFF"}
    >
      <SnowIcon active={isActive} />
    </button>
  );
}
