import React from "react";

export function InvalidStimulus({ message }: { message: string }) {
  return (
    <div
      role="note"
      data-testid="invalid-stimulus"
      style={{
        border: "1px solid #fed7aa",
        borderRadius: 18,
        background: "#fff7ed",
        color: "#9a3412",
        padding: 16,
        fontSize: 14,
        fontWeight: 800,
      }}
    >
      Unsupported or invalid assessment visual: {message}
    </div>
  );
}
