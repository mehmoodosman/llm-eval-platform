"use client";

interface CheckboxProps {
  checked: boolean;
  label?: string;
  className?: string;
  onCheckedChange: () => void;
}

export function Checkbox({
  checked,
  label,
  className = "",
  onCheckedChange,
}: CheckboxProps) {
  const CheckboxElement = (
    <div
      className={`w-6 h-6 flex items-center justify-center cursor-pointer ${className}`}
    >
      <div
        className={`w-4 h-4 rounded border ${
          checked
            ? "bg-blue-500 border-blue-500"
            : "border-white/20 bg-transparent"
        } relative flex items-center justify-center transition-colors`}
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
    </div>
  );

  if (label) {
    return (
      <label
        onClick={onCheckedChange}
        className="flex items-center gap-2 cursor-pointer w-full"
      >
        {CheckboxElement}
        <span className="text-sm flex-1">{label}</span>
      </label>
    );
  }

  return <div onClick={onCheckedChange}>{CheckboxElement}</div>;
}
