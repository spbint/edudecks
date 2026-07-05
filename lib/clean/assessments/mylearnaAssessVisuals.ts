export type CounterArrangement = "scattered" | "five-frame" | string;

export type CounterPoint = {
  x: number;
  y: number;
};

export function buildCounterPoints(
  quantity: number,
  arrangement: CounterArrangement,
  seed: number,
): CounterPoint[] {
  const count = Math.max(0, Math.min(20, Math.floor(quantity)));

  if (arrangement === "five-frame") {
    return Array.from({ length: count }, (_, index) => ({
      x: 36 + (index % 5) * 32,
      y: index < 5 ? 62 : 104,
    }));
  }

  return Array.from({ length: count }, (_, index) => {
    const rawX = (seed * (index + 3) * 37 + index * 19) % 116;
    const rawY = (seed * (index + 5) * 29 + index * 23) % 58;
    return {
      x: 42 + rawX,
      y: 46 + rawY,
    };
  });
}
