"use client";

import { useCallback, useRef, useState } from "react";

export function useToast() {
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback((msg: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(msg);
    timer.current = setTimeout(() => setMessage(""), 2600);
  }, []);

  return { message, flash };
}

export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="fixed inset-x-4 bottom-[84px] z-30 mx-auto max-w-[430px] rounded-[11px] bg-ink px-4 py-3 text-center text-[13px] text-[#F5F1E6] shadow-lg">
      {message}
    </div>
  );
}
