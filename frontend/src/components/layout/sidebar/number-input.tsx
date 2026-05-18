import React from "react";
import { Input } from "@/components/ui/input";
import type { NumberInputProps } from "@/types";

function CustomNumberInput({
  label,
  value,
  step = 0.1,
  min = 0,
  max = 999,
  onChange,
  badgeColor,
}: NumberInputProps) {
  const [inputValue, setInputValue] = React.useState(value.toString());

  React.useEffect(() => {
    const parsed = parseFloat(inputValue);

    if (isNaN(parsed) || parsed !== value) {
      setInputValue(value.toString());
    }
  }, [value]);

  const handleDecrease = () => {
    const nextVal = Math.max(min, value - step);
    const fixedVal = parseFloat(nextVal.toFixed(2));
    onChange(fixedVal);
    setInputValue(fixedVal.toString());
  };

  const handleIncrease = () => {
    const nextVal = Math.min(max, value + step);
    const fixedVal = parseFloat(nextVal.toFixed(2));
    onChange(fixedVal);
    setInputValue(fixedVal.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawVal = e.target.value;
    rawVal = rawVal.replace(/[^0-9.]/g, "");

    const dotIndex = rawVal.indexOf(".");
    if (dotIndex !== -1) {
      rawVal = rawVal.slice(0, dotIndex + 1) + rawVal.slice(dotIndex + 1).replace(/\./g, "");
    }

    setInputValue(rawVal);

    const parsed = parseFloat(rawVal);
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(inputValue);

    if (isNaN(parsed)) {
      setInputValue(value.toString());
    } else {
      const clamped = Math.min(max, Math.max(min, parsed));
      onChange(clamped);
      setInputValue(clamped.toString());
    }
  };

  return (
    <div className="flex w-full items-center overflow-hidden rounded-lg border border-zinc-200/80 bg-white shadow-2xs transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-zinc-800/80 dark:bg-zinc-950 dark:focus-within:ring-indigo-500/30">
      <span
        className={`flex h-7 w-5 shrink-0 items-center justify-center text-[10px] font-bold ${badgeColor}`}
      >
        {label}
      </span>
      <button
        type="button"
        onClick={handleDecrease}
        className="flex h-7 w-4.5 shrink-0 items-center justify-center text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 active:bg-zinc-200 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 dark:active:bg-zinc-700"
      >
        <span className="text-xs font-bold">-</span>
      </button>
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className="h-7 w-full rounded-none border-0 bg-transparent px-0.5 text-center text-[11px] font-semibold text-zinc-800 shadow-none focus-visible:ring-0 dark:text-zinc-200"
      />
      <button
        type="button"
        onClick={handleIncrease}
        className="flex h-7 w-4.5 shrink-0 items-center justify-center text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 active:bg-zinc-200 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 dark:active:bg-zinc-700"
      >
        <span className="text-xs font-bold">+</span>
      </button>
    </div>
  );
}

export { CustomNumberInput };
