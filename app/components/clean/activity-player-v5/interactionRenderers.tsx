"use client";

import { useState, type ReactNode } from "react";
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
  const correct = activity.correctState;
  const rows = response.rows ?? correct.targetRows ?? correct.rows ?? 1;
  const columns = response.columns ?? correct.targetColumns ?? correct.columns ?? 1;
  const setArray = (nextRows: number, nextColumns: number) => {
    const safeRows = Math.max(1, Math.min(12, nextRows));
    const safeColumns = Math.max(1, Math.min(12, nextColumns));
    onChange(mergeResponse(response, {
      rows: safeRows,
      columns: safeColumns,
      total: safeRows * safeColumns,
      multiplicationSentence: `${safeRows} x ${safeColumns} = ${safeRows * safeColumns}`,
      repeatedAdditionSentence: Array.from({ length: safeRows }, () => String(safeColumns)).join(" + "),
    }));
  };

  return (
    <ModelBoard label={activity.prompt}>
      <div style={{ display: "grid", gap: 18 }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ display: "grid", gap: 8, color: v5Tokens.navy, fontWeight: 900 }}>
            Rows: {rows}
            <div style={{ display: "flex", gap: 8 }}>
              <ToggleChip label="-" onClick={() => setArray(rows - 1, columns)} />
              <ToggleChip label="+" onClick={() => setArray(rows + 1, columns)} />
            </div>
          </div>
          <div style={{ display: "grid", gap: 8, color: v5Tokens.navy, fontWeight: 900 }}>
            Columns: {columns}
            <div style={{ display: "flex", gap: 8 }}>
              <ToggleChip label="-" onClick={() => setArray(rows, columns - 1)} />
              <ToggleChip label="+" onClick={() => setArray(rows, columns + 1)} />
            </div>
          </div>
        </div>
        <div style={{ overflowX: "auto", padding: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 46px)`, gap: 9, justifyContent: "center" }}>
            {Array.from({ length: rows * columns }, (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setArray(rows, columns)}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: correct.objectVisual === "star" ? 8 : 999,
                  background: v5Tokens.blue,
                  border: `2px solid ${v5Tokens.navy}`,
                  color: v5Tokens.navy,
                  fontWeight: 900,
                }}
              >
                {correct.objectVisual === "star" ? "*" : ""}
              </button>
            ))}
          </div>
        </div>
        <strong style={{ color: v5Tokens.navy, fontSize: 24, textAlign: "center" }}>
          {rows} x {columns} = {rows * columns}
        </strong>
      </div>
    </ModelBoard>
  );
}

function EqualGroups({ activity, response, onChange }: RendererProps) {
  const correct = activity.correctState;
  const groupCount = response.groupCount ?? correct.targetGroupCount ?? correct.groupCount ?? 3;
  const itemsPerGroup = response.itemsPerGroup ?? correct.targetItemsPerGroup ?? correct.itemsPerGroup ?? 4;
  const setGroups = (nextGroups: number, nextItems: number) => {
    const safeGroups = Math.max(1, Math.min(12, nextGroups));
    const safeItems = Math.max(0, Math.min(24, nextItems));
    onChange(mergeResponse(response, {
      groupCount: safeGroups,
      itemsPerGroup: safeItems,
      total: safeGroups * safeItems,
      repeatedAdditionSentence: Array.from({ length: safeGroups }, () => String(safeItems)).join(" + "),
      multiplicationSentence: `${safeGroups} x ${safeItems} = ${safeGroups * safeItems}`,
      divisionSentence: `${safeGroups * safeItems} / ${safeGroups} = ${safeItems}`,
    }));
  };

  return (
    <ModelBoard label={activity.prompt}>
      <div style={{ display: "grid", gap: 18 }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ display: "grid", gap: 8, color: v5Tokens.navy, fontWeight: 900 }}>
            Groups: {groupCount}
            <div style={{ display: "flex", gap: 8 }}>
              <ToggleChip label="-" onClick={() => setGroups(groupCount - 1, itemsPerGroup)} />
              <ToggleChip label="+" onClick={() => setGroups(groupCount + 1, itemsPerGroup)} />
            </div>
          </div>
          <div style={{ display: "grid", gap: 8, color: v5Tokens.navy, fontWeight: 900 }}>
            In each group: {itemsPerGroup}
            <div style={{ display: "flex", gap: 8 }}>
              <ToggleChip label="-" onClick={() => setGroups(groupCount, itemsPerGroup - 1)} />
              <ToggleChip label="+" onClick={() => setGroups(groupCount, itemsPerGroup + 1)} />
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 14 }}>
          {Array.from({ length: groupCount }, (_, groupIndex) => (
            <div key={groupIndex} style={{ border: `2px solid ${v5Tokens.border}`, borderRadius: 18, background: "#FFFFFF", padding: 12, display: "grid", gap: 10, justifyItems: "center" }}>
              <strong style={{ color: v5Tokens.navy }}>Group {groupIndex + 1}</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                {Array.from({ length: itemsPerGroup }, (_, itemIndex) => (
                  <span key={itemIndex} style={{ width: 28, height: 28, borderRadius: 999, background: v5Tokens.purple, border: `2px solid ${v5Tokens.navy}` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <strong style={{ color: v5Tokens.navy, fontSize: 24, textAlign: "center" }}>
          {groupCount} groups of {itemsPerGroup} = {groupCount * itemsPerGroup}
        </strong>
      </div>
    </ModelBoard>
  );
}

function totalFromBalanceItems(items = [] as NonNullable<ActivityV5ResponseState["leftItems"]>) {
  return items.reduce((sum, item) => sum + (typeof item.value === "number" ? item.value : 0), 0);
}

function BalancePan({
  label,
  items,
  total,
}: {
  label: string;
  items: NonNullable<ActivityV5ResponseState["leftItems"]>;
  total?: number;
}) {
  return (
    <div style={{ display: "grid", gap: 10, justifyItems: "center", minWidth: 0 }}>
      <strong style={{ color: v5Tokens.navy, fontSize: 18 }}>{label}</strong>
      <div
        style={{
          width: "min(280px, 100%)",
          minHeight: 112,
          borderRadius: "22px 22px 34px 34px",
          border: `4px solid ${v5Tokens.navy}`,
          borderTop: `8px solid ${v5Tokens.navy}`,
          background: "#FFFFFF",
          padding: 12,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignContent: "center",
          justifyContent: "center",
          boxShadow: "0 14px 26px rgba(23,32,75,0.10)",
        }}
      >
        {items.length ? items.map((item) => (
          <span
            key={item.id}
            style={{
              minWidth: 42,
              minHeight: 42,
              borderRadius: item.unknown ? 14 : 999,
              border: `2px solid ${v5Tokens.navy}`,
              background: item.unknown ? v5Tokens.amber : v5Tokens.blue,
              color: v5Tokens.navy,
              display: "grid",
              placeItems: "center",
              fontWeight: 950,
              padding: "4px 8px",
            }}
          >
            {item.label}
          </span>
        )) : (
          <span style={{ color: v5Tokens.slate, fontWeight: 850 }}>empty</span>
        )}
      </div>
      {typeof total === "number" ? <span style={{ color: v5Tokens.slate, fontWeight: 900 }}>Total: {total}</span> : null}
    </div>
  );
}

function TwoPanBalance({ activity, response, onChange }: RendererProps) {
  const correct = activity.correctState;
  const leftItems = correct.leftItems ?? [];
  const rightItems = correct.rightItems ?? [];
  const leftTotal = response.leftTotal ?? correct.leftTotal ?? totalFromBalanceItems(leftItems);
  const rightTotal = response.rightTotal ?? correct.rightTotal ?? totalFromBalanceItems(rightItems);
  const selectedBalance = response.selectedBalance;
  const targetBalance = correct.targetBalance ?? (leftTotal === rightTotal ? "balanced" : leftTotal > rightTotal ? "left_heavier" : "right_heavier");
  const tilt = selectedBalance === "left_heavier" || (!selectedBalance && targetBalance === "left_heavier")
    ? -4
    : selectedBalance === "right_heavier" || (!selectedBalance && targetBalance === "right_heavier")
      ? 4
      : 0;
  const setBalance = (nextBalance: "balanced" | "left_heavier" | "right_heavier") =>
    onChange(mergeResponse(response, {
      selectedBalance: nextBalance,
      leftTotal,
      rightTotal,
      unknownValue: correct.unknownValue,
    }));

  return (
    <ModelBoard label={activity.prompt}>
      <div style={{ display: "grid", gap: 18 }}>
        {correct.equationText ? (
          <strong style={{ textAlign: "center", color: v5Tokens.navy, fontSize: 28 }}>{correct.equationText}</strong>
        ) : null}
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "end", padding: "20px 0 6px" }}>
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "9%",
              right: "9%",
              bottom: 74,
              height: 10,
              borderRadius: 999,
              background: v5Tokens.navy,
              transform: `rotate(${tilt}deg)`,
              transformOrigin: "center",
            }}
          />
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "50%",
              bottom: 0,
              width: 14,
              height: 102,
              borderRadius: 999,
              background: v5Tokens.navy,
              transform: "translateX(-50%)",
            }}
          />
          <BalancePan label="Left pan" items={leftItems} total={leftTotal} />
          <BalancePan label="Right pan" items={rightItems} total={rightTotal} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          {[
            ["left_heavier", "Left heavier"],
            ["balanced", "Balanced"],
            ["right_heavier", "Right heavier"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setBalance(value as "balanced" | "left_heavier" | "right_heavier")}
              style={{
                border: `2px solid ${response.selectedBalance === value ? v5Tokens.purple : v5Tokens.border}`,
                background: response.selectedBalance === value ? v5Tokens.lavender : "#FFFFFF",
                color: v5Tokens.navy,
                borderRadius: 18,
                padding: "16px 18px",
                font: "inherit",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
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
  const correct = activity.correctState;
  const unit = correct.unit ?? response.unit ?? "cm";
  const targetLength = correct.targetLength ?? correct.measuredLength ?? 8;
  const min = Number(correct.min ?? 0);
  const max = Number(correct.max ?? Math.max(10, Math.ceil(targetLength + 2)));
  const step = Number(correct.step ?? (unit === "mm" ? 1 : 0.5));
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) && max > safeMin ? max : safeMin + 10;
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
  const value = Math.min(safeMax, Math.max(safeMin, response.measuredLength ?? safeMin));
  const labelMode = correct.labelMode ?? "both";
  const objectPercent = Math.min(100, Math.max(8, ((targetLength - safeMin) / (safeMax - safeMin)) * 100));
  const markerPercent = ((value - safeMin) / (safeMax - safeMin)) * 100;
  const tickCount = Math.floor((safeMax - safeMin) / safeStep) + 1;
  const displayStep = tickCount > 101 ? (safeMax - safeMin) / 100 : safeStep;
  const displayTickCount = Math.floor((safeMax - safeMin) / displayStep) + 1;
  const ticks = Array.from({ length: displayTickCount }, (_, index) => Number((safeMin + index * displayStep).toFixed(4)));
  const labelEvery = ticks.length <= 16 ? 1 : Math.ceil((ticks.length - 1) / 10);
  const setValue = (nextValue: number) => {
    const snapped = Math.round(nextValue / safeStep) * safeStep;
    const rounded = Number(Math.min(safeMax, Math.max(safeMin, snapped)).toFixed(4));
    onChange(mergeResponse(response, {
      measuredLength: rounded,
      targetLength: rounded,
      unit,
    }));
  };

  return (
    <ModelBoard label={activity.prompt}>
      <div style={{ display: "grid", gap: 18 }}>
        {correct.showEstimate && correct.estimate !== undefined ? (
          <strong style={{ color: v5Tokens.slate }}>Estimate: {correct.estimate} {unit}</strong>
        ) : null}
        <div style={{ display: "grid", gap: 8 }}>
          <span style={{ color: v5Tokens.navy, fontWeight: 900 }}>{correct.objectLabel ?? "Object"}</span>
          <div style={{ minHeight: 62, position: "relative", borderBottom: `2px dashed ${v5Tokens.border}` }}>
            <span
              aria-label={correct.objectLabel ?? "object being measured"}
              style={{
                position: "absolute",
                left: 0,
                bottom: 8,
                width: `${objectPercent}%`,
                height: 34,
                borderRadius: correct.objectVisual === "pencil" || correct.objectVisual === "crayon" ? 999 : 12,
                border: `2px solid ${v5Tokens.navy}`,
                background: correct.objectVisual === "crayon" ? v5Tokens.amber : correct.objectVisual === "book" ? v5Tokens.blue : v5Tokens.purple,
              }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const percent = (event.clientX - rect.left) / rect.width;
            setValue(safeMin + percent * (safeMax - safeMin));
          }}
          style={{
            position: "relative",
            height: 112,
            border: `2px solid ${v5Tokens.navy}`,
            borderRadius: 14,
            background: "#FDE68A",
            cursor: "crosshair",
            padding: 0,
          }}
          aria-label="Tap the ruler to set the measured length"
        >
          {ticks.map((tick, index) => {
            const major = index === 0 || index === ticks.length - 1 || index % labelEvery === 0;
            const percent = ((tick - safeMin) / (safeMax - safeMin)) * 100;
            return (
              <span
                key={`${tick}-${index}`}
                style={{
                  position: "absolute",
                  left: `${percent}%`,
                  bottom: 0,
                  width: 2,
                  height: major ? 52 : 28,
                  background: v5Tokens.navy,
                  transform: "translateX(-1px)",
                }}
              >
                {major && labelMode !== "ticks" ? (
                  <span style={{ position: "absolute", bottom: 56, left: "50%", transform: "translateX(-50%)", color: v5Tokens.navy, fontSize: 12, fontWeight: 900 }}>
                    {tick}
                  </span>
                ) : null}
              </span>
            );
          })}
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: `${markerPercent}%`,
              top: 8,
              width: 4,
              height: 94,
              borderRadius: 999,
              background: v5Tokens.red,
              boxShadow: "0 8px 18px rgba(232,93,117,0.28)",
            }}
          />
        </button>
        <label style={{ display: "grid", gap: 8, color: v5Tokens.navy, fontWeight: 850 }}>
          Measurement: {value} {unit}
          <input
            type="range"
            min={safeMin}
            max={safeMax}
            step={safeStep}
            value={value}
            onChange={(event) => setValue(Number(event.target.value))}
          />
        </label>
        <input
          type="number"
          min={safeMin}
          max={safeMax}
          step={safeStep}
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
          aria-label={`Measurement in ${unit}`}
          style={{
            minHeight: 46,
            borderRadius: 12,
            border: `1px solid ${v5Tokens.border}`,
            padding: "8px 12px",
            color: v5Tokens.navy,
            font: "inherit",
            fontWeight: 800,
          }}
        />
        <div style={{ color: v5Tokens.slate, fontWeight: 800 }}>
          Ruler range: {safeMin}–{safeMax} {unit}
        </div>
      </div>
    </ModelBoard>
  );
}

function CapacityJug({ activity, response, onChange }: RendererProps) {
  const correct = activity.correctState;
  const unit = correct.unit ?? "mL";
  const target = correct.targetCapacity ?? correct.measuredCapacity ?? 500;
  const min = Number(correct.min ?? 0);
  const max = Number(correct.max ?? Math.max(unit === "L" ? 2 : 1000, target));
  const step = Number(correct.step ?? (unit === "L" ? 0.25 : 50));
  const value = Math.min(max, Math.max(min, response.measuredCapacity ?? min));
  const fillPercent = ((value - min) / (max - min)) * 100;
  const tickCount = Math.floor((max - min) / step) + 1;
  const labelEvery = tickCount <= 8 ? 1 : Math.ceil((tickCount - 1) / 6);
  const setValue = (nextValue: number) => {
    const snapped = Math.round(nextValue / step) * step;
    const rounded = Number(Math.min(max, Math.max(min, snapped)).toFixed(4));
    onChange(mergeResponse(response, {
      measuredCapacity: rounded,
      targetCapacity: rounded,
      fillLevel: ((rounded - min) / (max - min)) * 100,
      unit,
    }));
  };

  return (
    <ModelBoard label={activity.prompt}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 280px) minmax(0, 1fr)", gap: 22, alignItems: "center" }}>
        <button
          type="button"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const percentFromBottom = 1 - (event.clientY - rect.top) / rect.height;
            setValue(min + percentFromBottom * (max - min));
          }}
          aria-label="Tap the jug to set the fill level"
          style={{
            position: "relative",
            height: 330,
            border: `4px solid ${v5Tokens.navy}`,
            borderRadius: "26px 26px 34px 34px",
            background: "#FFFFFF",
            overflow: "hidden",
            cursor: "crosshair",
          }}
        >
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: `${fillPercent}%`,
              background: "linear-gradient(180deg, #BAE6FD 0%, #38BDF8 100%)",
            }}
          />
          {Array.from({ length: tickCount }, (_, index) => {
            const tickValue = Number((min + index * step).toFixed(4));
            const bottom = ((tickValue - min) / (max - min)) * 100;
            const major = index === 0 || index === tickCount - 1 || index % labelEvery === 0;
            return (
              <span key={`${tickValue}-${index}`} style={{ position: "absolute", left: 0, right: major ? 42 : 82, bottom: `${bottom}%`, borderTop: `2px solid ${v5Tokens.navy}` }}>
                {major && correct.labelMode !== "ticks" ? <span style={{ position: "absolute", right: -38, top: -10, color: v5Tokens.navy, fontSize: 12, fontWeight: 900 }}>{tickValue}</span> : null}
              </span>
            );
          })}
        </button>
        <div style={{ display: "grid", gap: 14 }}>
          <strong style={{ color: v5Tokens.navy, fontSize: 22 }}>{correct.containerLabel ?? "Container"}</strong>
          {correct.showEstimate && correct.estimate !== undefined ? <span style={{ color: v5Tokens.slate, fontWeight: 850 }}>Estimate: {correct.estimate} {unit}</span> : null}
          <strong style={{ color: v5Tokens.navy, fontSize: 28 }}>{value} {unit}</strong>
          <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => setValue(Number(event.target.value))} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <ToggleChip label="- step" onClick={() => setValue(value - step)} />
            <ToggleChip label="+ step" onClick={() => setValue(value + step)} />
            <ToggleChip label="Reset" onClick={() => setValue(min)} />
          </div>
        </div>
      </div>
    </ModelBoard>
  );
}

function MassScale({ activity, response, onChange }: RendererProps) {
  const correct = activity.correctState;
  const unit = correct.unit ?? "g";
  const target = correct.targetMass ?? correct.measuredMass ?? 500;
  const min = Number(correct.min ?? 0);
  const max = Number(correct.max ?? Math.max(unit === "kg" ? 5 : 1000, target));
  const step = Number(correct.step ?? (unit === "kg" ? 0.5 : 50));
  const value = Math.min(max, Math.max(min, response.measuredMass ?? min));
  const dialDegrees = -120 + ((value - min) / (max - min)) * 240;
  const setValue = (nextValue: number) => {
    const snapped = Math.round(nextValue / step) * step;
    const rounded = Number(Math.min(max, Math.max(min, snapped)).toFixed(4));
    onChange(mergeResponse(response, {
      measuredMass: rounded,
      targetMass: rounded,
      unit,
    }));
  };

  return (
    <ModelBoard label={activity.prompt}>
      <div style={{ display: "grid", gap: 18, justifyItems: "center" }}>
        <div style={{ width: "min(420px, 100%)", display: "grid", gap: 0, justifyItems: "center" }}>
          <div style={{ minWidth: 120, minHeight: 68, borderRadius: 16, border: `3px solid ${v5Tokens.navy}`, background: correct.objectVisual === "watermelon" ? v5Tokens.green : v5Tokens.blue, display: "grid", placeItems: "center", color: v5Tokens.navy, fontWeight: 900 }}>
            {correct.objectLabel ?? "Object"}
          </div>
          <div style={{ width: "100%", height: 170, borderRadius: "28px 28px 18px 18px", border: `4px solid ${v5Tokens.navy}`, background: "#FFFFFF", display: "grid", placeItems: "center", position: "relative" }}>
            {correct.scaleType === "digital" ? (
              <strong style={{ color: v5Tokens.navy, fontSize: 34 }}>{value} {unit}</strong>
            ) : (
              <span style={{ width: 118, height: 118, borderRadius: 999, border: `4px solid ${v5Tokens.navy}`, position: "relative", display: "inline-block" }}>
                <span style={{ position: "absolute", left: 55, top: 18, width: 6, height: 46, borderRadius: 999, background: v5Tokens.red, transformOrigin: "bottom center", transform: `rotate(${dialDegrees}deg)` }} />
                <span style={{ position: "absolute", left: 48, top: 48, width: 20, height: 20, borderRadius: 999, background: v5Tokens.navy }} />
                <span style={{ position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", color: v5Tokens.navy, fontWeight: 900 }}>{value} {unit}</span>
              </span>
            )}
          </div>
        </div>
        {correct.showEstimate && correct.estimate !== undefined ? <span style={{ color: v5Tokens.slate, fontWeight: 850 }}>Estimate: {correct.estimate} {unit}</span> : null}
        <input style={{ width: "min(560px, 100%)" }} type="range" min={min} max={max} step={step} value={value} onChange={(event) => setValue(Number(event.target.value))} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          <ToggleChip label="- step" onClick={() => setValue(value - step)} />
          <ToggleChip label="+ step" onClick={() => setValue(value + step)} />
          <ToggleChip label="Reset" onClick={() => setValue(min)} />
        </div>
      </div>
    </ModelBoard>
  );
}

function InteractiveClock({ activity, response, onChange }: RendererProps) {
  const correct = activity.correctState;
  const hour = response.hour ?? correct.targetHour ?? correct.hour ?? 3;
  const minute = response.minute ?? correct.targetMinute ?? correct.minute ?? 0;
  const allowedMinutes = correct.allowedMinutes ?? [0, 15, 30, 45];
  const labelMode = correct.labelMode ?? "both";
  const wrapHour = (value: number) => {
    const wrapped = value % 12;
    return wrapped === 0 ? 12 : wrapped;
  };
  const setTime = (nextHour: number, nextMinute = minute) => {
    onChange(mergeResponse(response, {
      hour: wrapHour(nextHour),
      minute: ((Math.round(nextMinute) % 60) + 60) % 60,
      targetHour: wrapHour(nextHour),
      targetMinute: ((Math.round(nextMinute) % 60) + 60) % 60,
    }));
  };
  const digital = `${wrapHour(hour)}:${String(minute).padStart(2, "0")}`;
  return (
    <ModelBoard label={activity.prompt}>
      <div style={{ display: "grid", gap: 18, justifyItems: "center" }}>
        {correct.eventContext ? <strong style={{ color: v5Tokens.navy }}>{correct.eventContext}</strong> : null}
        {labelMode !== "digital" ? <ClockFace hour={hour} minute={minute} /> : null}
        {labelMode !== "analogue" ? (
          <div style={{ color: v5Tokens.navy, fontSize: 34, fontWeight: 950, letterSpacing: 0 }}>
            {digital}
          </div>
        ) : null}
        <div style={{ display: "grid", gap: 10, width: "min(620px, 100%)" }}>
          <label style={{ display: "grid", gap: 6, color: v5Tokens.navy, fontWeight: 850 }}>
            Hour hand: {wrapHour(hour)}
            <input
              type="range"
              min={1}
              max={12}
              step={1}
              value={wrapHour(hour)}
              onChange={(event) => setTime(Number(event.target.value), minute)}
            />
          </label>
          <label style={{ display: "grid", gap: 6, color: v5Tokens.navy, fontWeight: 850 }}>
            Minute hand: {String(minute).padStart(2, "0")}
            <input
              type="range"
              min={0}
              max={55}
              step={5}
              value={Math.round(minute / 5) * 5}
              onChange={(event) => setTime(hour, Number(event.target.value))}
            />
          </label>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((value) => (
            <ToggleChip key={value} label={`${value}`} selected={wrapHour(hour) === value} onClick={() => setTime(value, minute)} />
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {allowedMinutes.map((value) => (
            <ToggleChip
              key={value}
              label={`:${String(value).padStart(2, "0")}`}
              selected={minute === value}
              onClick={() => setTime(hour, value)}
            />
          ))}
        </div>
      </div>
    </ModelBoard>
  );
}

function FractionBar({ activity, response, onChange }: RendererProps) {
  const [dragging, setDragging] = useState(false);
  const correct = activity.correctState;
  const denominator = Math.max(1, response.denominator ?? correct.targetDenominator ?? correct.denominator ?? 4);
  const targetNumerator = correct.targetNumerator ?? correct.shadedParts ?? 1;
  const targetWhole = correct.wholeCount ?? 0;
  const displayBars = Math.max(1, targetWhole + (targetNumerator > 0 ? 1 : 0));
  const selectedParts = new Set(response.selectedParts ?? []);
  const shaded = response.shadedParts ?? selectedParts.size;
  const labelMode = correct.labelMode ?? "fraction";
  const formatValue = () => {
    const whole = Math.floor(shaded / denominator);
    const numerator = shaded % denominator;
    const decimal = shaded / denominator;
    if (labelMode === "decimal") return decimal.toFixed(denominator === 10 ? 1 : 2);
    if (labelMode === "percent") return `${Math.round(decimal * 100)}%`;
    if (labelMode === "mixed" || whole > 0) return numerator ? `${whole} ${numerator}/${denominator}` : String(whole);
    return `${shaded}/${denominator}`;
  };
  const applySelection = (nextSelected: Set<number>) => {
    const count = nextSelected.size;
    onChange(mergeResponse(response, {
      denominator,
      targetDenominator: denominator,
      selectedParts: [...nextSelected].sort((a, b) => a - b),
      shadedParts: count % denominator,
      targetNumerator: count % denominator,
      wholeCount: Math.floor(count / denominator),
      decimalEquivalent: count / denominator,
    }));
  };
  const togglePart = (partIndex: number, forceSelected = false) => {
    const next = new Set(selectedParts);
    if (forceSelected || !next.has(partIndex)) next.add(partIndex);
    else next.delete(partIndex);
    applySelection(next);
  };

  return (
    <ModelBoard label={activity.prompt}>
      <div style={{ display: "grid", gap: 14 }}>
        {Array.from({ length: displayBars }, (_, barIndex) => (
          <div
            key={barIndex}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${denominator}, minmax(48px, 1fr))`,
              gap: 6,
              maxWidth: 760,
              width: "100%",
              margin: "0 auto",
            }}
            onPointerLeave={() => setDragging(false)}
            onPointerUp={() => setDragging(false)}
          >
            {Array.from({ length: denominator }, (_, index) => {
              const partIndex = barIndex * denominator + index;
              const selected = selectedParts.has(partIndex);
              return (
                <button
                  key={partIndex}
                  type="button"
                  aria-pressed={selected}
                  onPointerDown={() => {
                    setDragging(true);
                    togglePart(partIndex);
                  }}
                  onPointerEnter={() => {
                    if (dragging) togglePart(partIndex, true);
                  }}
                  onFocus={() => undefined}
                  style={{
                    minHeight: 104,
                    borderRadius: index === 0 ? "18px 10px 10px 18px" : index === denominator - 1 ? "10px 18px 18px 10px" : 10,
                    border: `2px solid ${v5Tokens.navy}`,
                    background: selected ? v5Tokens.purple : "#FFFFFF",
                    color: selected ? "#FFFFFF" : v5Tokens.navy,
                    cursor: "pointer",
                    font: "inherit",
                    fontWeight: 900,
                    boxShadow: selected ? "inset 0 0 0 2px rgba(255,255,255,0.35)" : "none",
                  }}
                >
                  {correct.labelMode === "fraction" ? `${index + 1}/${denominator}` : ""}
                </button>
              );
            })}
          </div>
        ))}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {[2, 3, 4, 5, 10].map((value) => (
            <ToggleChip
              key={value}
              label={`${value} parts`}
              selected={denominator === value}
              onClick={() => onChange(mergeResponse(response, {
                denominator: value,
                targetDenominator: value,
                selectedParts: [],
                shadedParts: 0,
                targetNumerator: 0,
                wholeCount: 0,
              }))}
            />
          ))}
        </div>
        <strong style={{ color: v5Tokens.navy, fontSize: 22, textAlign: "center" }}>{formatValue()}</strong>
      </div>
    </ModelBoard>
  );
}

function StaticFractionModel({
  label,
  numerator,
  denominator,
}: {
  label: string;
  numerator: number;
  denominator: number;
}) {
  const safeDenominator = Math.max(1, Math.min(20, denominator));
  const safeNumerator = Math.max(0, Math.min(safeDenominator, numerator));

  return (
    <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
      <strong style={{ color: v5Tokens.navy, fontSize: 22, textAlign: "center" }}>{label}</strong>
      <div
        aria-label={`${label} fraction model`}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${safeDenominator}, minmax(26px, 1fr))`,
          gap: 5,
          width: "100%",
        }}
      >
        {Array.from({ length: safeDenominator }, (_, index) => {
          const shaded = index < safeNumerator;
          return (
            <span
              key={index}
              style={{
                minHeight: 100,
                borderRadius: index === 0 ? "18px 8px 8px 18px" : index === safeDenominator - 1 ? "8px 18px 18px 8px" : 8,
                border: `2px solid ${v5Tokens.navy}`,
                background: shaded ? v5Tokens.purple : "#FFFFFF",
                boxShadow: shaded ? "inset 0 0 0 2px rgba(255,255,255,0.32)" : "none",
              }}
            />
          );
        })}
      </div>
      <span style={{ color: v5Tokens.slate, fontWeight: 850, textAlign: "center" }}>
        {safeNumerator} of {safeDenominator} equal parts shaded
      </span>
    </div>
  );
}

function FractionComparison({ activity, response, onChange }: RendererProps) {
  const correct = activity.correctState;
  const left = correct.leftFraction ?? {
    numerator: correct.targetNumerator ?? correct.shadedParts ?? 1,
    denominator: correct.targetDenominator ?? correct.denominator ?? 2,
  };
  const right = correct.rightFraction ?? { numerator: 1, denominator: 4 };
  const setAnswer = (selectedOption: "left" | "right" | "equal") =>
    onChange(mergeResponse(response, { selectedOption }));

  return (
    <ModelBoard label={activity.prompt}>
      <div style={{ display: "grid", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, alignItems: "end" }}>
          <div style={{ border: `2px solid ${v5Tokens.border}`, borderRadius: 22, background: "#FFFFFF", padding: 18 }}>
            <StaticFractionModel
              label={correct.leftLabel ?? `${left.numerator}/${left.denominator}`}
              numerator={left.numerator}
              denominator={left.denominator}
            />
          </div>
          <div style={{ border: `2px solid ${v5Tokens.border}`, borderRadius: 22, background: "#FFFFFF", padding: 18 }}>
            <StaticFractionModel
              label={correct.rightLabel ?? `${right.numerator}/${right.denominator}`}
              numerator={right.numerator}
              denominator={right.denominator}
            />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          {[
            ["left", "Left is larger"],
            ["right", "Right is larger"],
            ["equal", "Equal"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setAnswer(value as "left" | "right" | "equal")}
              style={{
                border: `2px solid ${response.selectedOption === value ? v5Tokens.purple : v5Tokens.border}`,
                background: response.selectedOption === value ? v5Tokens.lavender : "#FFFFFF",
                color: v5Tokens.navy,
                borderRadius: 18,
                padding: "16px 18px",
                font: "inherit",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
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
  const correct = activity.correctState;
  const currencySymbol = correct.currencySymbol ?? "";
  const tokenValues = correct.tokenValues ?? activity.objects.map((object) => Number(object.value)).filter((value) => Number.isFinite(value));
  const showCoins = correct.showCoins ?? true;
  const showNotes = correct.showNotes ?? true;
  const allowMultiple = correct.allowMultipleTokens ?? true;
  const selected = new Set(response.selectedTokenIds ?? []);
  const selectedPrices = response.selectedPriceTagId;
  const tokenObjects = tokenValues.map((value, index) => ({
    id: `generic-token-${index}-${value}`,
    label: `${currencySymbol}${value}`,
    value,
    type: value >= 20 ? "note" : "coin",
  }));
  const visibleTokens = tokenObjects.filter((token) => (token.type === "coin" ? showCoins : showNotes));
  const formatMoney = (value: number) => `${currencySymbol}${Number.isInteger(value) ? value : value.toFixed(2)}`;
  const setTokens = (ids: Set<string>) => {
    const selectedTokens = visibleTokens.filter((token) => ids.has(token.id)).map((token) => token.value);
    const total = selectedTokens.reduce((sum, value) => sum + value, 0);
    onChange(mergeResponse(response, {
      selectedTokenIds: [...ids],
      selectedTokens,
      moneyTotal: Number(total.toFixed(2)),
      targetTotal: Number(total.toFixed(2)),
    }));
  };
  const toggle = (object: { id: string; value: number }) => {
    const next = allowMultiple ? new Set(selected) : new Set<string>();
    if (next.has(object.id)) next.delete(object.id);
    else next.add(object.id);
    setTokens(next);
  };

  return (
    <ModelBoard label={activity.prompt}>
      <div style={{ display: "grid", gap: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", color: v5Tokens.navy, fontWeight: 900 }}>
          <span>{correct.itemContext ?? "Generic money model"}</span>
          <span>{correct.localisationMode ?? "generic"} {correct.currencyCode ?? ""}</span>
        </div>
        {correct.priceTags?.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
            {correct.priceTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => onChange(mergeResponse(response, { selectedPriceTagId: tag.id, moneyTotal: tag.value }))}
                style={{
                  minHeight: 92,
                  borderRadius: 16,
                  border: `2px solid ${selectedPrices === tag.id ? v5Tokens.purple : v5Tokens.border}`,
                  background: selectedPrices === tag.id ? v5Tokens.lavender : "#FFFFFF",
                  color: v5Tokens.navy,
                  font: "inherit",
                  fontWeight: 900,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <span>{tag.label}</span>
                <span>{formatMoney(tag.value)}</span>
              </button>
            ))}
          </div>
        ) : null}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(180px, 0.65fr)", gap: 16 }}>
          <div style={{ display: "grid", gap: 10 }}>
            <strong style={{ color: v5Tokens.navy }}>Wallet</strong>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {visibleTokens.map((object) => (
                <button
                  key={object.id}
                  type="button"
                  onClick={() => toggle(object)}
                  style={{
                    minWidth: object.type === "note" ? 104 : 72,
                    minHeight: object.type === "note" ? 58 : 72,
                    borderRadius: object.type === "note" ? 12 : 999,
                    border: `2px solid ${selected.has(object.id) ? v5Tokens.purple : v5Tokens.navy}`,
                    background: selected.has(object.id) ? v5Tokens.lavender : object.type === "note" ? v5Tokens.mint : "#FFFFFF",
                    color: v5Tokens.navy,
                    font: "inherit",
                    fontWeight: 950,
                    boxShadow: selected.has(object.id) ? "0 8px 18px rgba(108,77,246,0.18)" : "none",
                  }}
                >
                  {object.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ border: `2px dashed ${v5Tokens.border}`, borderRadius: 18, padding: 14, display: "grid", gap: 8, alignContent: "start", background: "#FFFFFF" }}>
            <strong style={{ color: v5Tokens.navy }}>Basket</strong>
            <span style={{ color: v5Tokens.slate, fontWeight: 800 }}>
              {(response.selectedTokens ?? []).length
                ? (response.selectedTokens ?? []).map(formatMoney).join(" + ")
                : "Tap tokens to add them"}
            </span>
            <strong style={{ color: v5Tokens.navy, fontSize: 24 }}>Total: {formatMoney(response.moneyTotal ?? 0)}</strong>
            {typeof correct.targetTotal === "number" ? <span style={{ color: v5Tokens.slate, fontWeight: 800 }}>Target: {formatMoney(correct.targetTotal)}</span> : null}
          </div>
        </div>
      </div>
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
    case "equal_groups":
      return <EqualGroups {...props} />;
    case "two_pan_balance":
      return <TwoPanBalance {...props} />;
    case "move_along_route":
      return <MoveAlongRoute {...props} />;
    case "interactive_ruler":
      return <InteractiveRuler {...props} />;
    case "interactive_capacity_jug":
      return <CapacityJug {...props} />;
    case "interactive_mass_scale":
      return <MassScale {...props} />;
    case "interactive_clock":
      return <InteractiveClock {...props} />;
    case "interactive_fraction_bar":
      return <FractionBar {...props} />;
    case "fraction_comparison":
      return <FractionComparison {...props} />;
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
