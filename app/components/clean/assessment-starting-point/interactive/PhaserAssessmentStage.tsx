"use client";

import React, { useEffect, useRef, useState } from "react";
import type PhaserType from "phaser";
import type {
  StartingPointPlayerAnswer,
  StartingPointPlayerModel,
} from "@/lib/clean/assessments/interactivePlayer/startingPointPlayerContract";
import type { StartingPointPresentationStimulus } from "@/lib/clean/assessments/interactivePlayer/startingPointDevelopmentalAccessibility";
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

const NEUTRAL_COUNTER_POSITIONS = [
  [0.14, 0.24], [0.46, 0.18], [0.78, 0.28], [0.29, 0.48], [0.64, 0.47],
  [0.88, 0.55], [0.12, 0.69], [0.45, 0.75], [0.74, 0.78], [0.28, 0.9],
  [0.61, 0.92], [0.93, 0.84], [0.3, 0.12], [0.62, 0.08], [0.92, 0.2],
  [0.07, 0.45], [0.5, 0.55], [0.8, 0.08], [0.16, 0.94], [0.95, 0.39],
] as const;

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
            const answerTop = model.kind === "multiple-choice" && !model.presentationStimulus
              ? 24
              : this.drawStimulus(Phaser);
            this.drawChoices(answerTop);
          }
        }

        private drawStimulus(PhaserRuntime: typeof PhaserType) {
          if (model.presentationStimulus) {
            this.drawPresentationStimulus(PhaserRuntime, model.presentationStimulus);
            return 242;
          }
          if (model.kind === "counter-counting") this.drawCounters();
          if (model.kind === "place-value") this.drawPlaceValue();
          if (model.kind === "australian-currency") this.drawCurrency(PhaserRuntime);
          return 242;
        }

        private drawPresentationStimulus(
          PhaserRuntime: typeof PhaserType,
          stimulus: StartingPointPresentationStimulus,
        ) {
          addStageSurface(this, PLAYER_CANVAS_WIDTH / 2, 115, PLAYER_LAYOUT.contentWidth, 196);
          if (stimulus.type === "currency-repeat") {
            const spacing = stimulus.count > 4 ? 58 : 68;
            Array.from({ length: stimulus.count }).forEach((_, index) => {
              const columns = Math.min(5, stimulus.count);
              const x = PLAYER_CANVAS_WIDTH / 2 - ((columns - 1) * spacing) / 2 + (index % columns) * spacing;
              const y = stimulus.count > 5 ? 78 + Math.floor(index / columns) * 76 : 112;
              createCurrencyToken(this, PhaserRuntime, stimulus.denomination, x, y);
            });
            return;
          }

          const groupCount = stimulus.groups.length;
          const groupWidth = Math.min(112, 270 / Math.max(1, groupCount));
          const gap = Math.min(12, (292 - groupCount * groupWidth) / Math.max(1, groupCount - 1));
          const totalWidth = groupCount * groupWidth + Math.max(0, groupCount - 1) * gap;
          const startX = (PLAYER_CANVAS_WIDTH - totalWidth) / 2 + groupWidth / 2;
          stimulus.groups.forEach((quantity, groupIndex) => {
            const x = startX + groupIndex * (groupWidth + gap);
            if (stimulus.type === "closed-groups") {
              const box = this.add.rectangle(x, 111, groupWidth - 5, 112, 0xeee9ff, 1)
                .setStrokeStyle(2, PLAYER_COLOURS.purple);
              this.add.rectangle(x, 57, groupWidth - 17, 13, PLAYER_COLOURS.ink, 0.12);
              this.add.text(x, 103, String(quantity), { color: PLAYER_COLOURS.inkCss, fontFamily: "Arial, sans-serif", fontSize: "28px", fontStyle: "bold" }).setOrigin(0.5);
              this.add.text(x, 130, stimulus.objectLabel, { color: PLAYER_COLOURS.slateCss, fontFamily: "Arial, sans-serif", fontSize: "10px", fontStyle: "bold" }).setOrigin(0.5);
              box.setAlpha(0.98);
              return;
            }
            this.add.rectangle(x, 111, groupWidth - 5, 116, 0xf8f6ff, 1)
              .setStrokeStyle(2, PLAYER_COLOURS.lavenderLine);
            const columns = quantity > 6 ? 3 : Math.min(3, quantity);
            const rows = Math.ceil(quantity / Math.max(1, columns));
            for (let index = 0; index < quantity; index += 1) {
              const counterX = x - ((columns - 1) * 25) / 2 + (index % columns) * 25;
              const counterY = 111 - ((rows - 1) * 25) / 2 + Math.floor(index / columns) * 25;
              const counter = createCounter(this, counterX, counterY).setScale(0.68);
              if (stimulus.action === "remove" && index >= quantity - (stimulus.removeCount ?? 0)) {
                counter.setAlpha(0.28);
                this.add.text(counterX, counterY, "×", { color: "#92400E", fontSize: "19px", fontStyle: "bold" }).setOrigin(0.5);
              }
            }
          });
          if (stimulus.type === "counter-groups" && stimulus.action === "share") {
            const recipientCount = stimulus.recipientCount ?? 2;
            const recipientGap = 30;
            const recipientStartX = PLAYER_CANVAS_WIDTH / 2 - ((recipientCount - 1) * recipientGap) / 2;
            for (let index = 0; index < recipientCount; index += 1) {
              const recipientX = recipientStartX + index * recipientGap;
              this.add.circle(recipientX, 166, 6, PLAYER_COLOURS.purple, 0.2)
                .setStrokeStyle(1.5, PLAYER_COLOURS.purple);
              this.add.arc(recipientX, 181, 10, 200, 340, false, PLAYER_COLOURS.purple, 0.12)
                .setStrokeStyle(1.5, PLAYER_COLOURS.purple);
            }
          }
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
          const organised = ["five-frame", "ten-frame-like", "array", "dice"].includes(data.arrangement ?? "");
          const columns = quantity > 10 ? 5 : Math.min(5, Math.max(1, quantity));
          const rows = Math.ceil(quantity / columns);
          const gapX = 52;
          const gapY = 48;
          const startX = 175 - ((columns - 1) * gapX) / 2;
          const startY = 112 - ((rows - 1) * gapY) / 2;
          const offset = Math.abs(Math.round(data.seed || 1)) % NEUTRAL_COUNTER_POSITIONS.length;
          for (let index = 0; index < quantity; index += 1) {
            const neutral = NEUTRAL_COUNTER_POSITIONS[(index + offset) % NEUTRAL_COUNTER_POSITIONS.length];
            const x = organised
              ? startX + (index % columns) * gapX
              : 32 + neutral[0] * 286;
            const y = organised
              ? startY + Math.floor(index / columns) * gapY
              : 33 + neutral[1] * 158;
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
          let activeDragId: string | null = null;
          let activeTarget = -1;
          const layout = (duration: number = PLAYER_MOTION.reorderMs) => this.orderedIds.forEach((id, index) => {
            const card = cards.get(id);
            if (card && id !== activeDragId) this.tweens.add({ targets: card, y: slotY(index), x: PLAYER_CANVAS_WIDTH / 2, duration: motionDuration(this.motion, duration), ease: PLAYER_MOTION.easeOut });
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
              activeDragId = option.id;
              activeTarget = this.orderedIds.indexOf(option.id);
              card.setDepth(20);
              paint("selected");
              this.tweens.add({ targets: card, scale: 1.045, x: PLAYER_CANVAS_WIDTH / 2 + 5, duration: motionDuration(this.motion, PLAYER_MOTION.liftMs), ease: PLAYER_MOTION.easeOut });
            });
            card.on("drag", (_pointer: unknown, _dragX: number, dragY: number) => {
              card.y = PhaserRuntime.Math.Clamp(dragY, slotY(0), slotY(this.orderedIds.length - 1));
              const target = PhaserRuntime.Math.Clamp(Math.round((card.y - slotY(0)) / 68), 0, this.orderedIds.length - 1);
              slots.forEach((slot, slotIndex) => slot.setActive(slotIndex === target));
              if (target !== activeTarget) {
                const from = this.orderedIds.indexOf(option.id);
                this.orderedIds.splice(from, 1);
                this.orderedIds.splice(target, 0, option.id);
                activeTarget = target;
                layout();
              }
            });
            card.on("dragend", () => {
              card.setDepth(1);
              paint("rest");
              background.setStrokeStyle(2, PLAYER_COLOURS.lavenderLine);
              slots.forEach((slot) => slot.setActive(false));
              activeDragId = null;
              activeTarget = -1;
              this.tweens.add({ targets: card, scale: 1, x: PLAYER_CANVAS_WIDTH / 2, duration: motionDuration(this.motion, PLAYER_MOTION.snapMs), ease: PLAYER_MOTION.physicalOut });
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
          ].filter((group) => group.count > 0);
          addStageSurface(this, PLAYER_CANVAS_WIDTH / 2, 115, PLAYER_LAYOUT.contentWidth, 196);
          const columns = groups.map((_, index) => groups.length === 1 ? 175 : 55 + index * (240 / Math.max(1, groups.length - 1)));
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
              reveal(createThousandCube(this, thousandsX, 103 + i * 14), i, 0.8);
            }
          }
          const hundredsX = columnFor("hundreds");
          for (let i = 0; i < (data.hundreds || 0); i += 1) {
            const x = (hundredsX ?? 58) - 24 + (i % 2) * 48;
            reveal(createHundredFlat(this, x, 103 + Math.floor(i / 2) * 72), i, 0.82);
          }
          const tensX = columnFor("tens") ?? 174;
          for (let i = 0; i < (data.tens || 0); i += 1) {
            reveal(createTenRod(this, tensX - 23 + (i % 3) * 23, 108 + Math.floor(i / 3) * 84), i, 0.82);
          }
          const onesX = columnFor("ones") ?? 290;
          for (let i = 0; i < (data.ones || 0); i += 1) {
            reveal(createUnitCube(this, onesX - 25 + (i % 3) * 25, 72 + Math.floor(i / 3) * 29), i, 1.05);
          }
        }

        private drawCurrency(PhaserRuntime: typeof PhaserType) {
          const data = model.stimulus.data as CurrencyTokenStimulus;
          const tokens = data.tokens.slice(0, 8);
          addStageSurface(this, PLAYER_CANVAS_WIDTH / 2, 115, PLAYER_LAYOUT.contentWidth, 196);
          tokens.forEach((token, index) => {
            const columns = Math.min(5, tokens.length);
            const spacing = tokens.length <= 4 ? 68 : 62;
            const x = PLAYER_CANVAS_WIDTH / 2 - ((columns - 1) * spacing) / 2 + (index % columns) * spacing;
            const y = tokens.length > 5 ? 79 + Math.floor(index / columns) * 79 : 113;
            const coin = createCurrencyToken(this, PhaserRuntime, token.denomination, x, y)
              .setScale(this.motion.reduced ? 1 : 0.72)
              .setAlpha(this.motion.reduced ? 1 : 0);
            this.tweens.add({ targets: coin, scale: 1, alpha: 1, duration: motionDuration(this.motion, PLAYER_MOTION.revealMs), delay: this.motion.reduced ? 0 : index * 42, ease: PLAYER_MOTION.physicalOut });
          });
        }
      }

      const stimulusHeight = model.kind === "multiple-choice" && !model.presentationStimulus ? 0 : 218;
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

  if (model.kind === "numeric-entry" && !model.presentationStimulus) {
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
