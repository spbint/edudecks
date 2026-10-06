"use client";

import React, { useEffect, useRef, useState } from "react";
import type PhaserType from "phaser";
import type {
  StartingPointPlayerAnswer,
  StartingPointPlayerModel,
} from "@/lib/clean/assessments/interactivePlayer/startingPointPlayerContract";
import type {
  CounterSetStimulus,
  CurrencyTokenStimulus,
  PlaceValueBlocksStimulus,
} from "@/lib/clean/assessments/mylearnaAssessTypes";
import styles from "./StartingPointPlayer.module.css";

type StageProps = {
  model: StartingPointPlayerModel;
  onSubmit: (answer: StartingPointPlayerAnswer) => void;
};

const WIDTH = 350;
const INK = "#17204B";
const PURPLE = 0x6c4df6;

function seededUnit(seed: number, index: number) {
  const value = Math.sin(seed * 91.7 + index * 177.3) * 43758.5453;
  return value - Math.floor(value);
}

export default function PhaserAssessmentStage({ model, onSubmit }: StageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const submitRef = useRef(onSubmit);
  const [numericValue, setNumericValue] = useState("");
  submitRef.current = onSubmit;

  useEffect(() => {
    const host = hostRef.current;
    if (!host || model.kind === "numeric-entry") return;
    let disposed = false;
    let game: PhaserType.Game | null = null;

    void import("phaser").then(({ default: Phaser }) => {
      if (disposed || !hostRef.current) return;

      // The scene captures interaction only. Canonical scoring and routing stay
      // in the React/controller boundary after a versioned answer is emitted.
      // eslint-disable-next-line react-hooks/unsupported-syntax
      class StartingPointScene extends Phaser.Scene {
        private selected = new Set<string>();
        private orderedIds = model.options.map((option) => option.id);
        private continueButton?: PhaserType.GameObjects.Container;

        create() {
          this.cameras.main.setBackgroundColor(0xf8f6ff);
          this.cameras.main.fadeIn(220, 248, 246, 255);
          if (model.kind === "drag-to-order") this.drawOrdering(Phaser);
          else {
            const answerTop = model.kind === "multiple-choice" ? 24 : this.drawStimulus(Phaser);
            this.drawChoices(answerTop);
          }
        }

        private drawStimulus(PhaserRuntime: typeof PhaserType) {
          if (model.kind === "counter-counting") this.drawCounters();
          if (model.kind === "place-value") this.drawPlaceValue();
          if (model.kind === "australian-currency") this.drawCurrency(PhaserRuntime);
          return 242;
        }

        private makeContinue(y: number, getReady: () => boolean, getIds: () => string[]) {
          const background = this.add.rectangle(0, 0, 306, 52, 0x17204b).setOrigin(0.5);
          const label = this.add.text(0, 0, "Continue", { color: "#FFFFFF", fontFamily: "Arial, sans-serif", fontSize: "17px", fontStyle: "bold" }).setOrigin(0.5);
          const button = this.add.container(175, y, [background, label]).setSize(306, 52).setAlpha(0.38);
          button.setInteractive({ useHandCursor: true });
          button.on("pointerover", () => { if (getReady()) this.tweens.add({ targets: button, scale: 1.015, duration: 100 }); });
          button.on("pointerout", () => this.tweens.add({ targets: button, scale: 1, duration: 100 }));
          button.on("pointerdown", () => {
            if (!getReady()) return;
            this.tweens.add({ targets: button, scale: 0.975, duration: 70, yoyo: true });
            submitRef.current({ itemId: model.itemId, itemVersion: model.itemVersion, selectedOptionIds: getIds() });
          });
          this.continueButton = button;
        }

        private refreshContinue() {
          this.continueButton?.setAlpha(this.selected.size > 0 ? 1 : 0.38);
        }

        private drawChoices(top: number) {
          const cards: Array<{ id: string; card: PhaserType.GameObjects.Container; background: PhaserType.GameObjects.Rectangle }> = [];
          model.options.forEach((option, index) => {
            const y = top + 29 + index * 62;
            const background = this.add.rectangle(0, 0, 306, 50, 0xffffff).setStrokeStyle(2, 0xdfe3ec);
            const label = this.add.text(-132, 0, option.label, { color: INK, fontFamily: "Arial, sans-serif", fontSize: "17px", fontStyle: "bold", wordWrap: { width: 255 } }).setOrigin(0, 0.5);
            const card = this.add.container(175, y + 10, [background, label]).setSize(306, 50).setAlpha(0);
            card.setInteractive({ useHandCursor: true });
            this.tweens.add({ targets: card, y, alpha: 1, duration: 210, delay: 45 * index, ease: "Sine.easeOut" });
            const paint = () => {
              const active = this.selected.has(option.id);
              background.setFillStyle(active ? 0xeee9ff : 0xffffff).setStrokeStyle(active ? 3 : 2, active ? PURPLE : 0xdfe3ec);
              card.setScale(active ? 1.01 : 1);
            };
            card.on("pointerover", () => { if (!this.selected.has(option.id)) background.setStrokeStyle(2, 0x9d89f8); });
            card.on("pointerout", paint);
            card.on("pointerdown", () => {
              if (model.allowsMultiple) {
                if (this.selected.has(option.id)) this.selected.delete(option.id); else this.selected.add(option.id);
              } else {
                this.selected.clear();
                this.selected.add(option.id);
              }
              cards.forEach((candidate) => {
                const active = this.selected.has(candidate.id);
                candidate.background.setFillStyle(active ? 0xeee9ff : 0xffffff).setStrokeStyle(active ? 3 : 2, active ? PURPLE : 0xdfe3ec);
                this.tweens.add({ targets: candidate.card, scale: active ? 1.01 : 1, duration: 110 });
              });
              this.refreshContinue();
            });
            cards.push({ id: option.id, card, background });
          });
          this.makeContinue(top + model.options.length * 62 + 36, () => this.selected.size > 0, () => [...this.selected]);
        }

        private drawCounters() {
          const data = model.stimulus.data as CounterSetStimulus;
          const quantity = Math.max(0, Math.min(20, Math.round(data.quantity)));
          const board = this.add.graphics();
          board.fillStyle(0xffffff, 1).lineStyle(2, 0xe4e7ef, 1);
          board.fillRoundedRect(20, 18, 310, 202, 24).strokeRoundedRect(20, 18, 310, 202, 24);
          const columns = quantity > 10 ? 5 : Math.min(5, Math.max(1, quantity));
          const rows = Math.ceil(quantity / columns);
          const gapX = 48;
          const gapY = 46;
          const startX = 175 - ((columns - 1) * gapX) / 2;
          const startY = 119 - ((rows - 1) * gapY) / 2;
          for (let index = 0; index < quantity; index += 1) {
            const organised = ["five-frame", "ten-frame-like", "array", "dice"].includes(data.arrangement ?? "");
            const x = startX + (index % columns) * gapX + (organised ? 0 : (seededUnit(data.seed || 1, index) - 0.5) * 8);
            const y = startY + Math.floor(index / columns) * gapY + (organised ? 0 : (seededUnit((data.seed || 1) + 9, index) - 0.5) * 6);
            const counter = this.add.container(x, y, [this.add.circle(0, 0, 15, PURPLE), this.add.circle(-5, -6, 4, 0xc8bbff, 0.9)]).setScale(0);
            this.tweens.add({ targets: counter, scale: 1, duration: 260, delay: index * 34, ease: "Back.easeOut" });
          }
        }

        private drawOrdering(PhaserRuntime: typeof PhaserType) {
          const slotY = (index: number) => 40 + index * 62;
          const slots = model.options.map((_, index) => this.add.rectangle(175, slotY(index), 314, 52, 0xeeeafd, 0.58).setStrokeStyle(2, 0xd9d0ff));
          const cards = new Map<string, PhaserType.GameObjects.Container>();
          const layout = (duration = 180) => this.orderedIds.forEach((id, index) => {
            const card = cards.get(id);
            if (card) this.tweens.add({ targets: card, y: slotY(index), x: 175, duration, ease: "Sine.easeOut" });
          });
          model.options.forEach((option, index) => {
            const background = this.add.rectangle(0, 0, 306, 50, 0xffffff).setStrokeStyle(2, 0xd9d0ff);
            const grip = this.add.text(-132, 0, "☰", { color: "#6C4DF6", fontSize: "20px" }).setOrigin(0, 0.5);
            const label = this.add.text(-98, 0, option.label, { color: INK, fontSize: "18px", fontStyle: "bold" }).setOrigin(0, 0.5);
            const card = this.add.container(175, slotY(index) + 12, [background, grip, label]).setSize(306, 50).setAlpha(0);
            card.name = option.id;
            card.setInteractive({ draggable: true, useHandCursor: true });
            this.input.setDraggable(card);
            this.tweens.add({ targets: card, y: slotY(index), alpha: 1, duration: 220, delay: index * 45 });
            card.on("dragstart", () => { card.setDepth(20); background.setFillStyle(0xeee9ff).setStrokeStyle(3, PURPLE); this.tweens.add({ targets: card, scale: 1.035, duration: 100 }); });
            card.on("drag", (_pointer: unknown, _dragX: number, dragY: number) => {
              card.y = PhaserRuntime.Math.Clamp(dragY, slotY(0), slotY(this.orderedIds.length - 1));
              const target = PhaserRuntime.Math.Clamp(Math.round((card.y - slotY(0)) / 62), 0, this.orderedIds.length - 1);
              slots.forEach((slot, slotIndex) => slot.setFillStyle(slotIndex === target ? 0xded6ff : 0xeeeafd, slotIndex === target ? 0.9 : 0.58));
            });
            card.on("dragend", () => {
              const from = this.orderedIds.indexOf(option.id);
              const to = PhaserRuntime.Math.Clamp(Math.round((card.y - slotY(0)) / 62), 0, this.orderedIds.length - 1);
              this.orderedIds.splice(from, 1); this.orderedIds.splice(to, 0, option.id);
              card.setDepth(1); background.setFillStyle(0xffffff).setStrokeStyle(2, 0xd9d0ff); card.setScale(1);
              slots.forEach((slot) => slot.setFillStyle(0xeeeafd, 0.58));
              layout();
            });
            cards.set(option.id, card);
          });
          this.makeContinue(slotY(model.options.length - 1) + 68, () => true, () => [...this.orderedIds]);
          this.continueButton?.setAlpha(1);
        }

        private drawPlaceValue() {
          const data = model.stimulus.data as PlaceValueBlocksStimulus;
          const drawCube = (x: number, y: number, size: number, colour: number) => {
            this.add.rectangle(x, y, size, size, colour, 0.18).setStrokeStyle(2, colour);
            this.add.line(x, y, -size / 2, -size / 2, -size / 2 + 5, -size / 2 - 5, colour).setLineWidth(2);
            this.add.line(x, y, size / 2, -size / 2, size / 2 + 5, -size / 2 - 5, colour).setLineWidth(2);
          };
          const groups = [
            { key: "thousands", label: "Thousands", count: data.thousands || 0 },
            { key: "hundreds", label: "Hundreds", count: data.hundreds || 0 },
            { key: "tens", label: "Tens", count: data.tens || 0 },
            { key: "ones", label: "Ones", count: data.ones || 0 },
          ].filter((group) => group.count > 0 || group.key !== "thousands");
          const columns = groups.map((_, index) => 42 + index * (266 / Math.max(1, groups.length - 1)));
          groups.forEach((group, index) => this.add.text(columns[index], 22, group.label, { color: "#64748B", fontSize: groups.length === 4 ? "10px" : "12px", fontStyle: "bold" }).setOrigin(0.5));
          const columnFor = (key: string) => columns[groups.findIndex((group) => group.key === key)];
          const thousandsX = columnFor("thousands");
          if (thousandsX !== undefined) {
            for (let i = 0; i < (data.thousands || 0); i += 1) {
              const cube = this.add.container(thousandsX, 85 + i * 20);
              const front = this.add.rectangle(0, 0, 52, 52, 0xede9fe, 0.92).setStrokeStyle(2, PURPLE);
              const top = this.add.polygon(0, 0, [-26, -26, -15, -37, 37, -37, 26, -26], 0xf5f3ff).setStrokeStyle(2, PURPLE);
              const side = this.add.polygon(0, 0, [26, -26, 37, -37, 37, 15, 26, 26], 0xddd6fe).setStrokeStyle(2, PURPLE);
              cube.add([front, top, side]).setScale(0.82);
            }
          }
          const hundredsX = columnFor("hundreds");
          for (let i = 0; i < (data.hundreds || 0); i += 1) {
            const x = (hundredsX ?? 58) - 24 + (i % 2) * 48; const y = 73 + Math.floor(i / 2) * 66;
            const flat = this.add.grid(x, y, 56, 56, 5.6, 5.6, 0xede9fe, 1, PURPLE, 0.44).setOutlineStyle(PURPLE, 2).setScale(0.86);
            this.tweens.add({ targets: flat, scale: 1, duration: 220, delay: i * 35, ease: "Back.easeOut" });
          }
          const tensX = columnFor("tens") ?? 174;
          for (let i = 0; i < (data.tens || 0); i += 1) {
            const rod = this.add.grid(tensX - 22 + (i % 3) * 22, 92 + Math.floor(i / 3) * 82, 16, 74, 16, 7.4, 0xe5f5ed, 1, 0x2f9d68, 0.55).setOutlineStyle(0x2f9d68, 2).setScale(0.86);
            this.tweens.add({ targets: rod, scale: 1, duration: 220, delay: i * 35, ease: "Back.easeOut" });
          }
          const onesX = columnFor("ones") ?? 290;
          for (let i = 0; i < (data.ones || 0); i += 1) drawCube(onesX - 24 + (i % 3) * 24, 63 + Math.floor(i / 3) * 28, 17, 0xd97706);
        }

        private drawCurrency(PhaserRuntime: typeof PhaserType) {
          const data = model.stimulus.data as CurrencyTokenStimulus;
          const sizes: Record<string, number> = { "5c": 17, "10c": 20, "20c": 25, "50c": 29, "$1": 23, "$2": 19 };
          const tokens = data.tokens.slice(0, 8);
          tokens.forEach((token, index) => {
            const x = 52 + (index % 6) * 50; const y = 80 + Math.floor(index / 6) * 74;
            const radius = sizes[token.denomination] || 24;
            const gold = token.denomination === "$1" || token.denomination === "$2";
            const shape = token.denomination === "50c"
              ? this.add.polygon(x, y, Array.from({ length: 12 }, (_, pointIndex) => { const angle = -Math.PI / 2 + pointIndex * Math.PI * 2 / 12; return new PhaserRuntime.Geom.Point(Math.cos(angle) * radius, Math.sin(angle) * radius); }), 0xe8edf4).setStrokeStyle(2, 0x667085)
              : this.add.circle(x, y, radius, gold ? 0xf4d477 : 0xe8edf4).setStrokeStyle(2, gold ? 0x9a7116 : 0x667085);
            shape.setScale(0);
            this.add.text(x, y, token.denomination, { color: INK, fontSize: "12px", fontStyle: "bold" }).setOrigin(0.5).setAlpha(0).setData("delay", index * 45);
            this.tweens.add({ targets: shape, scale: 1, duration: 260, delay: index * 45, ease: "Back.easeOut" });
          });
          this.children.list.filter((child) => child instanceof PhaserRuntime.GameObjects.Text).forEach((label) => this.tweens.add({ targets: label, alpha: 1, duration: 150, delay: Number(label.getData("delay") || 0) + 130 }));
        }
      }

      const stimulusHeight = model.kind === "multiple-choice" ? 0 : 218;
      const contentHeight = model.kind === "drag-to-order"
        ? 108 + model.options.length * 62
        : stimulusHeight + 104 + model.options.length * 62;
      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: WIDTH,
        height: contentHeight,
        parent: hostRef.current,
        backgroundColor: "#f8f6ff",
        render: { antialias: true, pixelArt: false },
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
        input: { activePointers: 2 },
        scene: StartingPointScene,
        audio: { noAudio: true },
        banner: false,
      });
    });

    return () => { disposed = true; game?.destroy(true); host.replaceChildren(); };
  }, [model]);

  if (model.kind === "numeric-entry") {
    const append = (value: string) => setNumericValue((current) => value === "−" ? (current.startsWith("-") ? current.slice(1) : `-${current}`) : `${current}${value}`);
    return <div className={styles.numericStage} data-player-renderer="phaser-dom-overlay">
      <div className={styles.numericDisplay} aria-live="polite">{numericValue || <span>Enter your answer</span>}</div>
      <div className={styles.keypad} aria-label="Number keypad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "−", "0", "."].map((key) => <button key={key} type="button" onClick={() => append(key)}>{key}</button>)}
        <button className={styles.backspace} type="button" onClick={() => setNumericValue((current) => current.slice(0, -1))}>Delete</button>
      </div>
      <button className={styles.playerContinue} type="button" disabled={!numericValue || numericValue === "-" || numericValue === "."} onClick={() => submitRef.current({ itemId: model.itemId, itemVersion: model.itemVersion, selectedOptionIds: [], responseValue: numericValue })}>Continue</button>
    </div>;
  }

  return <div ref={hostRef} aria-label="Interactive answer area" data-player-renderer="phaser" className={styles.phaserHost} />;
}
