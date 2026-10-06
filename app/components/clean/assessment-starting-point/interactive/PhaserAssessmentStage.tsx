"use client";

import React, { useEffect, useRef } from "react";
import type PhaserType from "phaser";
import type { StartingPointPlayerModel } from "@/lib/clean/assessments/interactivePlayer/startingPointPlayerContract";
import type {
  CounterSetStimulus,
  CurrencyTokenStimulus,
  PlaceValueBlocksStimulus,
} from "@/lib/clean/assessments/mylearnaAssessTypes";

type StageProps = {
  model: StartingPointPlayerModel;
  selectedOptionIds: string[];
  onSelectOption: (optionId: string) => void;
  onOrderChange: (optionIds: string[]) => void;
};

const WIDTH = 350;
const BACKGROUND = 0xf8f6ff;
const INK = "#17204B";

function seededUnit(seed: number, index: number) {
  const value = Math.sin(seed * 91.7 + index * 177.3) * 43758.5453;
  return value - Math.floor(value);
}

export default function PhaserAssessmentStage({
  model,
  selectedOptionIds,
  onSelectOption,
  onOrderChange,
}: StageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const callbacksRef = useRef({ onSelectOption, onOrderChange });

  useEffect(() => {
    callbacksRef.current = { onSelectOption, onOrderChange };
  }, [onOrderChange, onSelectOption]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let game: PhaserType.Game | null = null;

    void import("phaser").then(({ default: Phaser }) => {
      if (disposed || !hostRef.current) return;

      // Phaser scenes are runtime classes supplied by the dynamically imported
      // engine; React does not compile or memoise this imperative scene object.
      // eslint-disable-next-line react-hooks/unsupported-syntax
      class StartingPointScene extends Phaser.Scene {
        create() {
          this.cameras.main.setBackgroundColor(BACKGROUND);
          if (model.kind === "counter-counting") this.drawCounters();
          else if (model.kind === "place-value") this.drawPlaceValue();
          else if (model.kind === "australian-currency") this.drawCurrency(Phaser);
          else if (model.kind === "drag-to-order") this.drawOrdering(Phaser);
          else if (model.kind === "multiple-choice") this.drawChoices();
          else this.drawNumericCanvas();
        }

        private heading(text: string) {
          return this.add.text(18, 16, text, {
            color: "#6C4DF6",
            fontFamily: "Arial, sans-serif",
            fontSize: "14px",
            fontStyle: "bold",
          });
        }

        private drawNumericCanvas() {
          this.heading("TYPE YOUR ANSWER BELOW");
          const panel = this.add.graphics();
          panel.fillStyle(0xffffff, 1);
          panel.lineStyle(2, 0xd9d0ff, 1);
          panel.fillRoundedRect(18, 48, 314, 86, 20);
          panel.strokeRoundedRect(18, 48, 314, 86, 20);
          this.add.text(175, 91, "123", {
            color: "#D9D0FF",
            fontFamily: "Arial, sans-serif",
            fontSize: "44px",
            fontStyle: "bold",
          }).setOrigin(0.5);
        }

        private drawChoices() {
          this.heading("CHOOSE ONE");
          model.options.forEach((option, index) => {
            const y = 48 + index * 66;
            const card = this.add.graphics();
            const selected = selectedOptionIds.includes(option.id);
            const paint = (active: boolean, pressed = false) => {
              card.clear();
              card.fillStyle(active ? 0xeee9ff : pressed ? 0xf3f0ff : 0xffffff, 1);
              card.lineStyle(active ? 3 : 1, active ? 0x6c4df6 : 0xdfe3ec, 1);
              card.fillRoundedRect(18, y, 314, 54, 15);
              card.strokeRoundedRect(18, y, 314, 54, 15);
            };
            paint(selected);
            const hit = this.add.zone(175, y + 27, 314, 54).setInteractive({ useHandCursor: true });
            const label = this.add.text(42, y + 27, option.label, {
              color: INK,
              fontFamily: "Arial, sans-serif",
              fontSize: "17px",
              fontStyle: "bold",
              wordWrap: { width: 270 },
            }).setOrigin(0, 0.5);
            hit.on("pointerover", () => paint(selectedOptionIds.includes(option.id), true));
            hit.on("pointerout", () => paint(selectedOptionIds.includes(option.id)));
            hit.on("pointerdown", () => {
              paint(true);
              callbacksRef.current.onSelectOption(option.id);
            });
            label.setDepth(2);
          });
        }

        private drawCounters() {
          this.heading("LOOK CAREFULLY");
          const data = model.stimulus.data as CounterSetStimulus;
          const quantity = Math.max(0, Math.min(20, Math.round(data.quantity)));
          const seed = data.seed || 1;
          const board = this.add.graphics();
          board.fillStyle(0xffffff, 1);
          board.lineStyle(2, 0xe7eaf2, 1);
          board.fillRoundedRect(22, 46, 306, 162, 24);
          board.strokeRoundedRect(22, 46, 306, 162, 24);
          const dicePositions = [
            [175, 126],
            [126, 84],
            [224, 168],
            [126, 168],
            [224, 84],
          ];
          for (let index = 0; index < quantity; index += 1) {
            const column = index % 5;
            const row = Math.floor(index / 5);
            const organised =
              data.arrangement === "five-frame" ||
              data.arrangement === "ten-frame-like" ||
              data.arrangement === "array";
            const dicePoint =
              data.arrangement === "dice" ? dicePositions[index] : null;
            const x = dicePoint
              ? dicePoint[0]
              : 65 +
                column * 55 +
                (organised ? 0 : (seededUnit(seed, index) - 0.5) * 8);
            const y = dicePoint
              ? dicePoint[1]
              : 82 +
                row * 48 +
                (organised ? 0 : (seededUnit(seed + 9, index) - 0.5) * 6);
            const counter = this.add.circle(x, y, quantity > 10 ? 13 : 16, 0x6c4df6);
            this.add.circle(x - 5, y - 6, 5, 0xb9a8ff, 0.85);
            this.tweens.add({
              targets: counter,
              scale: { from: 0.88, to: 1 },
              duration: 220,
              delay: index * 35,
              ease: "Back.easeOut",
            });
          }
        }

        private drawOrdering(Phaser: typeof PhaserType) {
          this.heading("DRAG INTO ORDER");
          const order = [...selectedOptionIds];
          const cards: PhaserType.GameObjects.Container[] = [];
          const layout = () => {
            order.forEach((id, index) => {
              const card = cards.find((candidate) => candidate.name === id);
              if (!card) return;
              this.tweens.add({ targets: card, y: 57 + index * 58, duration: 160, ease: "Sine.easeOut" });
            });
          };
          order.forEach((id, index) => {
            const option = model.options.find((candidate) => candidate.id === id);
            if (!option) return;
            const background = this.add.rectangle(0, 0, 310, 48, 0xffffff).setStrokeStyle(2, 0xd9d0ff);
            const grip = this.add.text(-135, 0, "≡", { color: "#6C4DF6", fontSize: "25px", fontStyle: "bold" }).setOrigin(0.5);
            const label = this.add.text(-105, 0, option.label, { color: INK, fontSize: "19px", fontStyle: "bold" }).setOrigin(0, 0.5);
            const card = this.add.container(175, 57 + index * 58, [background, grip, label]);
            card.name = id;
            card.setSize(310, 48).setInteractive({ draggable: true, useHandCursor: true });
            this.input.setDraggable(card);
            card.on("drag", (_pointer: unknown, _dragX: number, dragY: number) => {
              card.y = Phaser.Math.Clamp(dragY, 57, 57 + (order.length - 1) * 58);
              card.setDepth(10);
            });
            card.on("dragend", () => {
              const from = order.indexOf(id);
              const to = Phaser.Math.Clamp(Math.round((card.y - 57) / 58), 0, order.length - 1);
              order.splice(from, 1);
              order.splice(to, 0, id);
              card.setDepth(1);
              layout();
              callbacksRef.current.onOrderChange([...order]);
            });
            cards.push(card);
          });
        }

        private drawPlaceValue() {
          this.heading("READ THE BLOCKS");
          const data = model.stimulus.data as PlaceValueBlocksStimulus;
          const groups = [
            { label: "Hundreds", count: data.hundreds || 0, colour: 0x6c4df6 },
            { label: "Tens", count: data.tens || 0, colour: 0x2f9d68 },
            { label: "Ones", count: data.ones || 0, colour: 0xf59e0b },
          ];
          groups.forEach((group, groupIndex) => {
            const x = 58 + groupIndex * 110;
            this.add.text(x, 49, group.label, { color: "#64748B", fontSize: "12px", fontStyle: "bold" }).setOrigin(0.5);
            for (let index = 0; index < group.count; index += 1) {
              const column = index % 3;
              const row = Math.floor(index / 3);
              const block = this.add.rectangle(x - 24 + column * 24, 84 + row * 27, 19, groupIndex === 1 ? 24 : 19, group.colour, 0.18);
              block.setStrokeStyle(2, group.colour);
            }
          });
        }

        private drawCurrency(_Phaser: typeof PhaserType) {
          this.heading("AUSTRALIAN MONEY · REVIEW ASSET");
          const data = model.stimulus.data as CurrencyTokenStimulus;
          const sizes: Record<string, number> = { "5c": 19, "10c": 23, "20c": 28, "50c": 31, "$1": 25, "$2": 20 };
          data.tokens.slice(0, 6).forEach((token, index) => {
            const x = 52 + index * 52;
            const radius = (sizes[token.denomination] || 28) * 0.72;
            const gold = token.denomination === "$1" || token.denomination === "$2";
            if (token.denomination === "50c") {
              const points = Array.from({ length: 12 }, (_, pointIndex) => {
                const angle = -Math.PI / 2 + (pointIndex * Math.PI * 2) / 12;
                return new _Phaser.Geom.Point(
                  x + Math.cos(angle) * radius,
                  112 + Math.sin(angle) * radius,
                );
              });
              this.add.polygon(0, 0, points, 0xeef2f7).setStrokeStyle(2, 0x17204b);
            } else {
              this.add.circle(x, 112, radius, gold ? 0xf7e7b2 : 0xeef2f7).setStrokeStyle(2, 0x17204b);
            }
            this.add.text(x, 112, token.denomination, { color: INK, fontSize: "12px", fontStyle: "bold" }).setOrigin(0.5);
          });
          this.add.text(175, 176, "Schematic only · approval remains pending", { color: "#92400E", fontSize: "12px", fontStyle: "bold" }).setOrigin(0.5);
        }
      }

      const height = model.kind === "multiple-choice" ? Math.max(190, 66 + model.options.length * 66) : model.kind === "drag-to-order" ? Math.max(220, 78 + model.options.length * 58) : 228;
      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: WIDTH,
        height,
        parent: hostRef.current,
        transparent: false,
        render: { antialias: true, pixelArt: false },
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
        input: { activePointers: 2 },
        scene: StartingPointScene,
        audio: { noAudio: true },
        banner: false,
      });
    });

    return () => {
      disposed = true;
      game?.destroy(true);
      host.replaceChildren();
    };
  }, [model, selectedOptionIds]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      data-player-renderer="phaser"
      style={{ width: "100%", minHeight: 160, overflow: "hidden" }}
    />
  );
}
