"use client";

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  className = "",
}: TextAreaFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-white/90">
        {label}
        <div className="mt-1.5 relative">
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            className="block w-full rounded-lg bg-black/50 border border-white/10 text-white/90 shadow-sm p-3 min-h-[100px] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-shadow"
            placeholder={placeholder}
          />
        </div>
      </label>
    </div>
  );
}
