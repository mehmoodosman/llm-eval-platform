"use client";

interface CheckboxProps {
  checked: boolean;
  className?: string;
}

export function Checkbox({ checked, className = "" }: CheckboxProps) {
  return (
    <div
      className={`w-4 h-4 rounded border ${
        checked
          ? "bg-blue-500 border-blue-500"
          : "border-white/20 bg-transparent"
      } relative flex items-center justify-center transition-colors ${className}`}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
          <path
            d="M10 3L4.5 8.5L2 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}
