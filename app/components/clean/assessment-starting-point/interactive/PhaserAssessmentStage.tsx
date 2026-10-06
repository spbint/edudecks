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
import {
  PLAYER_CANVAS_WIDTH,
  PLAYER_COLOURS,
  PLAYER_LAYOUT,
  PLAYER_MOTION,
  addStageSurface,
  createChoiceCard,
  createCounter,
  createCurrencyToken,
  createDropSlot,
  createHundredFlat,
  createPrimaryAction,
  createTenRod,
  createThousandCube,
  createUnitCube,
  motionDuration,
  type PlayerMotionPreferences,
} from "./startingPointPlayerDesignSystem";

type StageProps = {
  model: StartingPointPlayerModel;
  onSubmit: (answer: StartingPointPlayerAnswer) => void;
};

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
        private motion: PlayerMotionPreferences = {
          reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        };

        create() {
          this.cameras.main.setBackgroundColor(PLAYER_COLOURS.lavenderSoft);
          this.cameras.main.fadeIn(motionDuration(this.motion, PLAYER_MOTION.sceneMs), 248, 246, 255);
          if (model.kind === "drag-to-order") this.drawOrdering(Phaser);
          else if (model.options.length === 0) this.drawStimulus(Phaser);
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
          const { button, background, shadow } = createPrimaryAction(this, y);
          button.setAlpha(0.38);
          button.setInteractive({ useHandCursor: true });
          button.on("pointerover", () => {
            if (!getReady()) return;
            background.setFillStyle(PLAYER_COLOURS.purpleDeep);
            this.tweens.add({ targets: button, scale: 1.012, duration: motionDuration(this.motion, PLAYER_MOTION.pressMs) });
          });
          button.on("pointerout", () => {
            background.setFillStyle(PLAYER_COLOURS.ink);
            this.tweens.add({ targets: button, scale: 1, duration: motionDuration(this.motion, PLAYER_MOTION.pressMs) });
          });
          button.on("pointerdown", () => {
            if (!getReady()) return;
            shadow.setAlpha(0.06);
            this.tweens.add({ targets: button, y: y + 3, scale: 0.985, duration: motionDuration(this.motion, PLAYER_MOTION.pressMs), yoyo: true });
            submitRef.current({ itemId: model.itemId, itemVersion: model.itemVersion, selectedOptionIds: getIds() });
          });
          this.continueButton = button;
        }

        private refreshContinue() {
          this.continueButton?.setAlpha(this.selected.size > 0 ? 1 : 0.38);
        }

        private drawChoices(top: number) {
          const cards: Array<ReturnType<typeof createChoiceCard> & { id: string }> = [];
          model.options.forEach((option, index) => {
            const y = top + 33 + index * (PLAYER_LAYOUT.choiceHeight + PLAYER_LAYOUT.choiceGap);
            const choice = createChoiceCard(this, option.label, y + 12);
            const { card, paint } = choice;
            card.setAlpha(0);
            card.setInteractive({ useHandCursor: true });
            this.tweens.add({ targets: card, y, alpha: 1, duration: motionDuration(this.motion, PLAYER_MOTION.revealMs), delay: this.motion.reduced ? 0 : 42 * index, ease: PLAYER_MOTION.easeOut });
            card.on("pointerover", () => paint(this.selected.has(option.id) ? "selected" : "hover"));
            card.on("pointerout", () => paint(this.selected.has(option.id) ? "selected" : "rest"));
            card.on("pointerdown", () => {
              paint("pressed");
              if (model.allowsMultiple) {
                if (this.selected.has(option.id)) this.selected.delete(option.id); else this.selected.add(option.id);
              } else {
                this.selected.clear();
                this.selected.add(option.id);
              }
              cards.forEach((candidate) => {
                const active = this.selected.has(candidate.id);
                candidate.paint(active ? "selected" : "rest");
                this.tweens.add({ targets: candidate.card, scale: active ? 1.012 : 1, duration: motionDuration(this.motion, PLAYER_MOTION.selectMs), ease: PLAYER_MOTION.easeOut });
              });
              this.refreshContinue();
            });
            cards.push({ id: option.id, ...choice });
          });
          this.makeContinue(top + model.options.length * (PLAYER_LAYOUT.choiceHeight + PLAYER_LAYOUT.choiceGap) + 42, () => this.selected.size > 0, () => [...this.selected]);
        }

        private drawCounters() {
          const data = model.stimulus.data as CounterSetStimulus;
          const quantity = Math.max(0, Math.min(20, Math.round(data.quantity)));
          addStageSurface(this, PLAYER_CANVAS_WIDTH / 2, 115, PLAYER_LAYOUT.contentWidth, 196);
          const columns = quantity > 10 ? 5 : Math.min(5, Math.max(1, quantity));
          const rows = Math.ceil(quantity / columns);
          const gapX = 50;
          const gapY = 45;
          const startX = 175 - ((columns - 1) * gapX) / 2;
          const startY = 112 - ((rows - 1) * gapY) / 2;
          for (let index = 0; index < quantity; index += 1) {
            const organised = ["five-frame", "ten-frame-like", "array", "dice"].includes(data.arrangement ?? "");
            const x = startX + (index % columns) * gapX + (organised ? 0 : (seededUnit(data.seed || 1, index) - 0.5) * 8);
            const y = startY + Math.floor(index / columns) * gapY + (organised ? 0 : (seededUnit((data.seed || 1) + 9, index) - 0.5) * 6);
            const counter = createCounter(this, x, y).setScale(this.motion.reduced ? 1 : 0.72).setAlpha(this.motion.reduced ? 1 : 0);
            this.tweens.add({
              targets: counter,
              scale: 1,
              alpha: 1,
              duration: motionDuration(this.motion, PLAYER_MOTION.revealMs),
              delay: this.motion.reduced ? 0 : index * 28,
              ease: PLAYER_MOTION.physicalOut,
            });
          }
        }

        private drawOrdering(PhaserRuntime: typeof PhaserType) {
          const slotY = (index: number) => 42 + index * 68;
          const slots = model.options.map((_, index) => createDropSlot(this, slotY(index)));
          const cards = new Map<string, PhaserType.GameObjects.Container>();
          const layout = (duration: number = PLAYER_MOTION.reorderMs) => this.orderedIds.forEach((id, index) => {
            const card = cards.get(id);
            if (card) this.tweens.add({ targets: card, y: slotY(index), x: PLAYER_CANVAS_WIDTH / 2, duration: motionDuration(this.motion, duration), ease: PLAYER_MOTION.easeOut });
          });
          model.options.forEach((option, index) => {
            const choice = createChoiceCard(this, option.label, slotY(index) + 12);
            const { card, background, paint } = choice;
            const grip = this.add.text(-132, 0, "⋮⋮", { color: "#6C4DF6", fontSize: "17px", fontStyle: "bold" }).setOrigin(0, 0.5);
            choice.label.setX(-99);
            card.add(grip).setAlpha(0);
            card.name = option.id;
            card.setInteractive({ draggable: true, useHandCursor: true });
            this.input.setDraggable(card);
            this.tweens.add({ targets: card, y: slotY(index), alpha: 1, duration: motionDuration(this.motion, PLAYER_MOTION.revealMs), delay: this.motion.reduced ? 0 : index * 42 });
            card.on("pointerover", () => paint("hover"));
            card.on("pointerout", () => { if (card.depth < 20) paint("rest"); });
            card.on("dragstart", () => {
              card.setDepth(20);
              paint("selected");
              this.tweens.add({ targets: card, scale: 1.035, duration: motionDuration(this.motion, PLAYER_MOTION.liftMs), ease: PLAYER_MOTION.easeOut });
            });
            card.on("drag", (_pointer: unknown, _dragX: number, dragY: number) => {
              card.y = PhaserRuntime.Math.Clamp(dragY, slotY(0), slotY(this.orderedIds.length - 1));
              const target = PhaserRuntime.Math.Clamp(Math.round((card.y - slotY(0)) / 68), 0, this.orderedIds.length - 1);
              slots.forEach((slot, slotIndex) => slot.setActive(slotIndex === target));
            });
            card.on("dragend", () => {
              const from = this.orderedIds.indexOf(option.id);
              const to = PhaserRuntime.Math.Clamp(Math.round((card.y - slotY(0)) / 68), 0, this.orderedIds.length - 1);
              this.orderedIds.splice(from, 1); this.orderedIds.splice(to, 0, option.id);
              card.setDepth(1);
              paint("rest");
              background.setStrokeStyle(2, PLAYER_COLOURS.lavenderLine);
              slots.forEach((slot) => slot.setActive(false));
              this.tweens.add({ targets: card, scale: 1, duration: motionDuration(this.motion, PLAYER_MOTION.snapMs), ease: PLAYER_MOTION.physicalOut });
              layout(PLAYER_MOTION.snapMs);
            });
            cards.set(option.id, card);
          });
          this.makeContinue(slotY(model.options.length - 1) + 72, () => true, () => [...this.orderedIds]);
          this.continueButton?.setAlpha(1);
        }

        private drawPlaceValue() {
          const data = model.stimulus.data as PlaceValueBlocksStimulus;
          const groups = [
            { key: "thousands", label: "Thousands", count: data.thousands || 0 },
            { key: "hundreds", label: "Hundreds", count: data.hundreds || 0 },
            { key: "tens", label: "Tens", count: data.tens || 0 },
            { key: "ones", label: "Ones", count: data.ones || 0 },
          ].filter((group) => group.count > 0 || group.key !== "thousands");
          addStageSurface(this, PLAYER_CANVAS_WIDTH / 2, 115, PLAYER_LAYOUT.contentWidth, 196);
          const columns = groups.map((_, index) => 43 + index * (264 / Math.max(1, groups.length - 1)));
          groups.forEach((group, index) => this.add.text(columns[index], 32, group.label, {
            color: PLAYER_COLOURS.slateCss,
            fontFamily: "Arial, sans-serif",
            fontSize: groups.length === 4 ? "10px" : "11px",
            fontStyle: "bold",
          }).setOrigin(0.5));
          const columnFor = (key: string) => columns[groups.findIndex((group) => group.key === key)];
          const reveal = (object: PhaserType.GameObjects.Container, index: number, targetScale = 1) => {
            object.setAlpha(this.motion.reduced ? 1 : 0).setScale(this.motion.reduced ? targetScale : targetScale * 0.86);
            this.tweens.add({ targets: object, alpha: 1, scale: targetScale, duration: motionDuration(this.motion, PLAYER_MOTION.revealMs), delay: this.motion.reduced ? 0 : index * 34, ease: PLAYER_MOTION.physicalOut });
          };
          const thousandsX = columnFor("thousands");
          if (thousandsX !== undefined) {
            for (let i = 0; i < (data.thousands || 0); i += 1) {
              reveal(createThousandCube(this, thousandsX, 94 + i * 16), i, 0.72);
            }
          }
          const hundredsX = columnFor("hundreds");
          for (let i = 0; i < (data.hundreds || 0); i += 1) {
            const x = (hundredsX ?? 58) - 22 + (i % 2) * 44;
            reveal(createHundredFlat(this, x, 86 + Math.floor(i / 2) * 68), i, 0.78);
          }
          const tensX = columnFor("tens") ?? 174;
          for (let i = 0; i < (data.tens || 0); i += 1) {
            reveal(createTenRod(this, tensX - 22 + (i % 3) * 22, 102 + Math.floor(i / 3) * 82), i, 0.83);
          }
          const onesX = columnFor("ones") ?? 290;
          for (let i = 0; i < (data.ones || 0); i += 1) {
            reveal(createUnitCube(this, onesX - 24 + (i % 3) * 24, 72 + Math.floor(i / 3) * 27), i);
          }
        }

        private drawCurrency(PhaserRuntime: typeof PhaserType) {
          const data = model.stimulus.data as CurrencyTokenStimulus;
          const tokens = data.tokens.slice(0, 8);
          addStageSurface(this, PLAYER_CANVAS_WIDTH / 2, 115, PLAYER_LAYOUT.contentWidth, 196);
          tokens.forEach((token, index) => {
            const columns = Math.min(5, tokens.length);
            const x = PLAYER_CANVAS_WIDTH / 2 - ((columns - 1) * 56) / 2 + (index % columns) * 56;
            const y = tokens.length > 5 ? 79 + Math.floor(index / columns) * 79 : 113;
            const coin = createCurrencyToken(this, PhaserRuntime, token.denomination, x, y)
              .setScale(this.motion.reduced ? 1 : 0.72)
              .setAlpha(this.motion.reduced ? 1 : 0);
            this.tweens.add({ targets: coin, scale: 1, alpha: 1, duration: motionDuration(this.motion, PLAYER_MOTION.revealMs), delay: this.motion.reduced ? 0 : index * 42, ease: PLAYER_MOTION.physicalOut });
          });
        }
      }

      const stimulusHeight = model.kind === "multiple-choice" ? 0 : 218;
      const contentHeight = model.kind === "drag-to-order"
        ? 112 + model.options.length * 68
        : model.options.length === 0
          ? 230
          : stimulusHeight + 116 + model.options.length * (PLAYER_LAYOUT.choiceHeight + PLAYER_LAYOUT.choiceGap);
      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: PLAYER_CANVAS_WIDTH,
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

  const append = (value: string) => setNumericValue((current) => value === "−" ? (current.startsWith("-") ? current.slice(1) : `-${current}`) : `${current}${value}`);
  const numericControls = <>
      <div className={styles.numericDisplay} aria-live="polite">{numericValue || <span>Enter your answer</span>}</div>
      <div className={styles.keypad} aria-label="Number keypad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "−", "0", "."].map((key) => <button key={key} type="button" onClick={() => append(key)}>{key}</button>)}
        <button className={styles.backspace} type="button" onClick={() => setNumericValue((current) => current.slice(0, -1))}>Delete</button>
      </div>
      <button className={styles.playerContinue} type="button" disabled={!numericValue || numericValue === "-" || numericValue === "."} onClick={() => submitRef.current({ itemId: model.itemId, itemVersion: model.itemVersion, selectedOptionIds: [], responseValue: numericValue })}>Continue</button>
    </>;

  if (model.kind === "numeric-entry") {
    return <div className={styles.numericStage} data-player-renderer="phaser-dom-overlay">{numericControls}</div>;
  }

  if (model.options.length === 0) {
    return <div className={`${styles.numericStage} ${styles.stimulusNumericStage}`} data-player-renderer="phaser-dom-overlay">
      <div ref={hostRef} aria-label="Interactive stimulus area" className={styles.phaserHost} />
      {numericControls}
    </div>;
  }

  return <div ref={hostRef} aria-label="Interactive answer area" data-player-renderer="phaser" className={styles.phaserHost} />;
}
