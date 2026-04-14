import React from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  focusBorderClass?: string;
}

export function FormInput({
  label,
  focusBorderClass = "focus:border-blue-500",
  className,
  ...props
}: FormInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-zinc-400">{label}</label>
      <input
        className={`bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none ${focusBorderClass} ${className ?? ""}`}
        {...props}
      />
    </div>
  );
}
