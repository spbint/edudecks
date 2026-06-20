"use client";

import type { ReactNode } from "react";
import type {
  ActivityV5,
  ActivityV5Object,
  ActivityV5ResponseState,
} from "@/app/components/clean/activity-player-v5/types";
import {
  ClockFace,
  GridBoard,
  GridCell,
  ModelBoard,
  ShapeIcon,
  v5Tokens,
} from "@/app/components/clean/activity-player-v5/visualModels";

type RendererProps = {
  activity: ActivityV5;
  response: ActivityV5ResponseState;
  onChange: (response: ActivityV5ResponseState) => void;
  checked: boolean;
};

function mergeResponse(
  response: ActivityV5ResponseState,
  patch: ActivityV5ResponseState,
) {
  return { ...response, ...patch };
}

function ToggleChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 44,
        borderRadius: 999,
        border: `1px solid ${selected ? v5Tokens.purple : v5Tokens.border}`,
        background: selected ? v5Tokens.lavender : "#FFFFFF",
        color: selected ? v5Tokens.purple : v5Tokens.navy,
        padding: "8px 13px",
        font: "inherit",
        fontWeight: 750,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function objectShape(object: ActivityV5Object) {
  return object.type || object.label.toLowerCase();
}

const coordinateColumns = ["A", "B", "C", "D"];
const coordinateRows = [1, 2, 3, 4];

function objectAtCoordinate(activity: ActivityV5, coordinate: string) {
  return activity.objects.find((object) => String(object.value ?? "") === coordinate);
}

function cellContent(activity: ActivityV5, coordinate: string, fallback: ReactNode) {
  const object = objectAtCoordinate(activity, coordinate);
  if (!object) return fallback;
  return (
    <span style={{ display: "grid", justifyItems: "center", gap: 4 }}>
      <ShapeIcon shape={objectShape(object)} size={30} />
      <span>{object.label}</span>
    </span>
  );
}

function DragToPlace({ activity, response, onChange }: RendererProps) {
  const placements = response.placements ?? {};
  const setPlacement = (objectId: string, targetId: string) => {
    onChange(mergeResponse(response, { placements: { ...placements, [objectId]: targetId } }));
  };

  return (
    <ModelBoard label={activity.prompt}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <strong style={{ color: v5Tokens.navy }}>Objects</strong>
          {activity.objects.map((object) => (
            <button
              key={object.id}
              type="button"
              draggable
              onDragStart={(event) => event.dataTransfer.setData("text/plain", object.id)}
              onClick={() => {
                const firstTarget = activity.targets.find((target) => target.accepts?.includes(object.type ?? object.id)) ?? activity.targets[0];
                if (firstTarget) setPlacement(object.id, firstTarget.id);
              }}
              style={{
                border: `1px solid ${v5Tokens.border}`,
                borderRadius: 16,
                background: "#FFFFFF",
                padding: 12,
                display: "grid",
                gap: 8,
                justifyItems: "center",
                cursor: "grab",
              }}
            >
              <ShapeIcon shape={objectShape(object)} size={52} />
              <span style={{ color: v5Tokens.navy, fontWeight: 800 }}>{object.label}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <strong style={{ color: v5Tokens.navy }}>Targets</strong>
          {activity.targets.map((target) => {
            const placed = Object.entries(placements).find(([, targetId]) => targetId === target.id)?.[0];
            const object = activity.objects.find((candidate) => candidate.id === placed);
            return (
              <button
                key={target.id}
                type="button"
                onDrop={(event) => {
                  event.preventDefault();
                  const objectId = event.dataTransfer.getData("text/plain");
                  if (objectId) setPlacement(objectId, target.id);
                }}
                onDragOver={(event) => event.preventDefault()}
                style={{
                  minHeight: 106,
                  border: `2px dashed ${placed ? v5Tokens.green : v5Tokens.border}`,
                  borderRadius: 18,
                  background: placed ? v5Tokens.mint : "#FFFFFF",
                  display: "grid",
                  placeItems: "center",
                  color: v5Tokens.navy,
                  font: "inherit",
                  fontWeight: 800,
                }}
              >
                {object ? object.label : target.label}
              </button>
            );
          })}
        </div>
      </div>
    </ModelBoard>
  );
}

function ClickObjects({ activity, response, onChange }: RendererProps) {
  const selected = new Set(response.selectedObjectIds ?? []);
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(mergeResponse(response, { selectedObjectIds: [...next] }));
  };

  return (
    <ModelBoard label={activity.prompt}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 14 }}>
        {activity.objects.map((object) => (
          <button
            key={object.id}
            type="button"
            onClick={() => toggle(object.id)}
            style={{
              minHeight: 132,
              border: `2px solid ${selected.has(object.id) ? v5Tokens.purple : v5Tokens.border}`,
              borderRadius: 18,
              background: selected.has(object.id) ? v5Tokens.lavender : "#FFFFFF",
              display: "grid",
              gap: 10,
              placeItems: "center",
              font: "inherit",
              color: v5Tokens.navy,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            <ShapeIcon shape={objectShape(object)} />
            {object.label}
          </button>
        ))}
      </div>
    </ModelBoard>
  );
}

function PlotCoordinates({ activity, response, onChange }: RendererProps) {
  const plotted = new Set(response.plottedCoordinates ?? []);
  const toggle = (coordinate: string) => {
    const next = new Set(plotted);
    if (next.has(coordinate)) next.delete(coordinate);
    else next.add(coordinate);
    onChange(mergeResponse(response, { plottedCoordinates: [...next] }));
  };

  return (
    <ModelBoard label={activity.prompt}>
      <GridBoard size={5}>
        <span />
        {coordinateColumns.map((label) => <strong key={label} style={{ textAlign: "center", color: v5Tokens.slate }}>{label}</strong>)}
        {coordinateRows.map((row) => (
          <span key={`plot-row-wrap-${row}`} style={{ display: "contents" }}>
            <strong key={`row-${row}`} style={{ display: "grid", placeItems: "center", color: v5Tokens.slate }}>{row}</strong>
            {coordinateColumns.map((col) => {
              const coordinate = `${col}${row}`;
              return (
                <GridCell
                  key={coordinate}
                  selected={plotted.has(coordinate)}
                  onClick={() => toggle(coordinate)}
                >
                  {plotted.has(coordinate)
                    ? cellContent(activity, coordinate, "point")
                    : cellContent(activity, coordinate, coordinate)}
                </GridCell>
              );
            })}
          </span>
        ))}
      </GridBoard>
    </ModelBoard>
  );
}

function RotateShape({ activity, response, onChange }: RendererProps) {
  const orientation = response.orientation ?? 0;
  const setOrientation = (value: number) => onChange(mergeResponse(response, { orientation: value }));
  const shape = activity.objects[0]?.type ?? "arrow-up";

  return (
    <ModelBoard label={activity.prompt} style={{ placeItems: "center" }}>
      <div style={{ transform: `rotate(${orientation}deg)`, transition: "transform 180ms ease" }}>
        <ShapeIcon shape={shape} size={120} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
        {[0, 90, 180, 270].map((value) => (
          <ToggleChip key={value} label={`${value} deg`} selected={orientation === value} onClick={() => setOrientation(value)} />
        ))}
      </div>
    </ModelBoard>
  );
}

function FlipReflection({ activity, response, onChange }: RendererProps) {
  const selected = new Set(response.reflectedCells ?? []);
  const originalCells = new Set(activity.objects.map((object) => String(object.value ?? "")));
  const toggle = (cell: string) => {
    const next = new Set(selected);
    if (next.has(cell)) next.delete(cell);
    else next.add(cell);
    onChange(mergeResponse(response, { reflectedCells: [...next] }));
  };

  return (
    <ModelBoard label={activity.prompt}>
      <GridBoard size={5}>
        {Array.from({ length: 25 }, (_, index) => {
          const row = Math.floor(index / 5);
          const col = index % 5;
          const cell = `${col}-${row}`;
          const mirror = col === 2;
          const original = originalCells.size
            ? originalCells.has(cell)
            : col === 1 && row >= 1 && row <= 3;
          return (
            <GridCell
              key={cell}
              active={mirror || original}
              selected={selected.has(cell)}
              onClick={() => !mirror && !original && toggle(cell)}
            >
              {mirror ? "|" : original || selected.has(cell) ? "shape" : ""}
            </GridCell>
          );
        })}
      </GridBoard>
    </ModelBoard>
  );
}

function BuildArray({ activity, response, onChange }: RendererProps) {
  const rows = response.rows ?? 1;
  const columns = response.columns ?? 1;

  return (
    <ModelBoard label={activity.prompt}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <label style={{ display: "grid", gap: 6, color: v5Tokens.navy, fontWeight: 800 }}>
          Rows
          <input type="number" min={1} max={8} value={rows} onChange={(event) => onChange(mergeResponse(response, { rows: Number(event.target.value) }))} />
        </label>
        <label style={{ display: "grid", gap: 6, color: v5Tokens.navy, fontWeight: 800 }}>
          Columns
          <input type="number" min={1} max={8} value={columns} onChange={(event) => onChange(mergeResponse(response, { columns: Number(event.target.value) }))} />
        </label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 34px)`, gap: 7, justifyContent: "center" }}>
        {Array.from({ length: rows * columns }, (_, index) => (
          <span key={index} style={{ width: 34, height: 34, borderRadius: 10, background: v5Tokens.blue, border: `1px solid ${v5Tokens.navy}` }} />
        ))}
      </div>
    </ModelBoard>
  );
}

function MoveAlongRoute({ activity, response, onChange }: RendererProps) {
  const current = response.finalPosition ?? "A1";
  const setPosition = (coordinate: string) => onChange(mergeResponse(response, { finalPosition: coordinate, routePath: [...(response.routePath ?? []), coordinate] }));

  return (
    <ModelBoard label={activity.prompt}>
      <GridBoard size={5}>
        <span />
        {coordinateColumns.map((label) => <strong key={label} style={{ textAlign: "center", color: v5Tokens.slate }}>{label}</strong>)}
        {coordinateRows.map((row) => (
          <span key={`route-row-wrap-${row}`} style={{ display: "contents" }}>
            <strong key={`route-row-${row}`} style={{ display: "grid", placeItems: "center", color: v5Tokens.slate }}>{row}</strong>
            {coordinateColumns.map((col) => {
              const coordinate = `${col}${row}`;
              const routeStep = activity.correctState.routePath?.includes(coordinate);
              return (
                <GridCell key={coordinate} active={routeStep} selected={current === coordinate} onClick={() => setPosition(coordinate)}>
                  {current === coordinate
                    ? cellContent(activity, coordinate, "finish")
                    : cellContent(activity, coordinate, coordinate)}
                </GridCell>
              );
            })}
          </span>
        ))}
      </GridBoard>
    </ModelBoard>
  );
}

function InteractiveRuler({ activity, response, onChange }: RendererProps) {
  const value = response.measuredLength ?? 5;
  return (
    <ModelBoard label={activity.prompt}>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ height: 42, width: `${value * 32}px`, maxWidth: "100%", borderRadius: 999, background: v5Tokens.purple }} />
        <div style={{ height: 50, borderRadius: 10, background: "#FDE68A", border: `2px solid ${v5Tokens.navy}`, display: "grid", gridTemplateColumns: "repeat(10, 1fr)" }}>
          {Array.from({ length: 10 }, (_, index) => <span key={index} style={{ borderLeft: index ? `1px solid ${v5Tokens.navy}` : 0, padding: 4, color: v5Tokens.navy, fontWeight: 800 }}>{index}</span>)}
        </div>
        <input type="range" min={1} max={10} value={value} onChange={(event) => onChange(mergeResponse(response, { measuredLength: Number(event.target.value) }))} />
        <strong style={{ color: v5Tokens.navy }}>{value} units</strong>
      </div>
    </ModelBoard>
  );
}

function InteractiveClock({ activity, response, onChange }: RendererProps) {
  const hour = response.hour ?? 3;
  const minute = response.minute ?? 0;
  return (
    <ModelBoard label={activity.prompt}>
      <ClockFace hour={hour} minute={minute} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
        {[3, 6, 9, 12].map((value) => <ToggleChip key={value} label={`${value} o'clock`} selected={hour === value && minute === 0} onClick={() => onChange(mergeResponse(response, { hour: value, minute: 0 }))} />)}
      </div>
    </ModelBoard>
  );
}

function FractionBar({ activity, response, onChange }: RendererProps) {
  const denominator = response.denominator ?? activity.correctState.denominator ?? 4;
  const shaded = response.shadedParts ?? 0;
  return (
    <ModelBoard label={activity.prompt}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${denominator}, 1fr)`, gap: 5 }}>
        {Array.from({ length: denominator }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onChange(mergeResponse(response, { denominator, shadedParts: index + 1 }))}
            style={{
              minHeight: 92,
              borderRadius: 12,
              border: `2px solid ${v5Tokens.navy}`,
              background: index < shaded ? v5Tokens.purple : "#FFFFFF",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
      <strong style={{ color: v5Tokens.navy }}>{shaded}/{denominator}</strong>
    </ModelBoard>
  );
}

function NumberLine({ activity, response, onChange }: RendererProps) {
  const correct = activity.correctState;
  const min = Number(correct.min ?? 0);
  const max = Number(correct.max ?? 10);
  const step = Number(correct.step ?? 1);
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) && max > safeMin ? max : safeMin + 10;
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
  const rawValue = response.placedValue ?? response.numberLineValue ?? correct.targetValue ?? correct.numberLineValue ?? safeMin;
  const numericValue = Number(rawValue);
  const value = Number.isFinite(numericValue) ? Math.min(safeMax, Math.max(safeMin, numericValue)) : safeMin;
  const tickCount = Math.floor((safeMax - safeMin) / safeStep) + 1;
  const displayStep = tickCount > 101 ? (safeMax - safeMin) / 100 : safeStep;
  const displayTickCount = Math.floor((safeMax - safeMin) / displayStep) + 1;
  const ticks = Array.from({ length: displayTickCount }, (_, index) => {
    const tickValue = Number((safeMin + index * displayStep).toFixed(6));
    return tickValue > safeMax ? safeMax : tickValue;
  });
  const labelEvery = ticks.length <= 12 ? 1 : Math.ceil((ticks.length - 1) / 8);
  const percentFor = (candidate: number) =>
    ((candidate - safeMin) / (safeMax - safeMin)) * 100;
  const setValue = (nextValue: number) => {
    const rounded = Number(nextValue.toFixed(6));
    onChange(mergeResponse(response, { placedValue: rounded, numberLineValue: rounded }));
  };

  return (
    <ModelBoard label={activity.prompt}>
      <div style={{ display: "grid", gap: 18 }}>
        <div style={{ position: "relative", height: 110, padding: "0 12px" }}>
          <span style={{ position: "absolute", left: 12, right: 12, top: 48, height: 4, background: v5Tokens.navy, borderRadius: 999 }} />
          {ticks.map((tick, index) => {
            const major = index === 0 || index === ticks.length - 1 || index % labelEvery === 0;
            const label = correct.tickLabels?.[String(tick)] ?? String(tick);
            return (
            <button
              key={`${tick}-${index}`}
              type="button"
              onClick={() => setValue(tick)}
              style={{
                position: "absolute",
                left: `calc(${percentFor(tick)}% + ${12 - percentFor(tick) * 0.24}px)`,
                top: major ? 25 : 34,
                transform: "translateX(-50%)",
                border: 0,
                background: "transparent",
                color: v5Tokens.navy,
                fontWeight: 800,
                cursor: "pointer",
                padding: 0,
                minWidth: 28,
              }}
            >
              <span style={{ display: "block", width: major ? 4 : 2, height: major ? 26 : 16, background: v5Tokens.navy, margin: "0 auto 6px", borderRadius: 999 }} />
              {major ? <span style={{ fontSize: 12 }}>{label}</span> : null}
            </button>
            );
          })}
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: `calc(${percentFor(value)}% + ${12 - percentFor(value) * 0.24}px)`,
              top: 6,
              transform: "translateX(-50%)",
              width: 24,
              height: 24,
              borderRadius: 999,
              background: v5Tokens.purple,
              border: "3px solid #FFFFFF",
              boxShadow: "0 8px 18px rgba(108,77,246,0.24)",
            }}
          />
        </div>
        <label style={{ display: "grid", gap: 8, color: v5Tokens.navy, fontWeight: 800 }}>
          Marker value: {value}
          <input
            type="range"
            min={safeMin}
            max={safeMax}
            step={safeStep}
            value={value}
            onChange={(event) => setValue(Number(event.target.value))}
            style={{ width: "100%" }}
          />
        </label>
      </div>
    </ModelBoard>
  );
}

function PlaceValueBuilder({ activity, response, onChange }: RendererProps) {
  const hundreds = response.hundreds ?? 0;
  const tens = response.tens ?? 0;
  const ones = response.ones ?? 0;
  const set = (patch: ActivityV5ResponseState) => onChange(mergeResponse(response, patch));

  return (
    <ModelBoard label={activity.prompt}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {[
          ["hundreds", hundreds, () => set({ hundreds: hundreds + 1 })],
          ["tens", tens, () => set({ tens: tens + 1 })],
          ["ones", ones, () => set({ ones: ones + 1 })],
        ].map(([label, count, onClick]) => (
          <button key={String(label)} type="button" onClick={onClick as () => void} style={{ border: `1px solid ${v5Tokens.border}`, borderRadius: 16, background: "#FFFFFF", padding: 12, color: v5Tokens.navy, font: "inherit", fontWeight: 800 }}>
            {String(label)}: {String(count)}
          </button>
        ))}
      </div>
    </ModelBoard>
  );
}

function MoneyModel({ activity, response, onChange }: RendererProps) {
  const selected = new Set(response.selectedTokenIds ?? []);
  const toggle = (object: ActivityV5Object) => {
    const next = new Set(selected);
    if (next.has(object.id)) next.delete(object.id);
    else next.add(object.id);
    const total = activity.objects.filter((candidate) => next.has(candidate.id)).reduce((sum, candidate) => sum + Number(candidate.value ?? 0), 0);
    onChange(mergeResponse(response, { selectedTokenIds: [...next], moneyTotal: total }));
  };

  return (
    <ModelBoard label={activity.prompt}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
        {activity.objects.map((object) => (
          <button key={object.id} type="button" onClick={() => toggle(object)} style={{ minWidth: 74, minHeight: 58, borderRadius: Number(object.value) >= 5 ? 12 : 999, border: `2px solid ${selected.has(object.id) ? v5Tokens.purple : v5Tokens.navy}`, background: selected.has(object.id) ? v5Tokens.lavender : "#FFFFFF", color: v5Tokens.navy, font: "inherit", fontWeight: 900 }}>
            {object.label}
          </button>
        ))}
      </div>
      <strong style={{ color: v5Tokens.navy }}>Total: {response.moneyTotal ?? 0}</strong>
    </ModelBoard>
  );
}

export function ActivityV5InteractionRenderer(props: RendererProps) {
  switch (props.activity.interactionType) {
    case "drag_to_place":
      return <DragToPlace {...props} />;
    case "click_objects":
      return <ClickObjects {...props} />;
    case "plot_coordinates":
      return <PlotCoordinates {...props} />;
    case "rotate_shape":
      return <RotateShape {...props} />;
    case "flip_reflection":
      return <FlipReflection {...props} />;
    case "build_array":
      return <BuildArray {...props} />;
    case "move_along_route":
      return <MoveAlongRoute {...props} />;
    case "interactive_ruler":
      return <InteractiveRuler {...props} />;
    case "interactive_clock":
      return <InteractiveClock {...props} />;
    case "interactive_fraction_bar":
      return <FractionBar {...props} />;
    case "interactive_number_line":
      return <NumberLine {...props} />;
    case "build_place_value":
      return <PlaceValueBuilder {...props} />;
    case "generic_money_model":
      return <MoneyModel {...props} />;
    default:
      return null;
  }
}
