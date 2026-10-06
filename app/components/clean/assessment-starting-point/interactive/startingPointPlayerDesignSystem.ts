import type Phaser from "phaser";

export const PLAYER_CANVAS_WIDTH = 350;

export const PLAYER_COLOURS = Object.freeze({
  ink: 0x17204b,
  inkCss: "#17204B",
  slate: 0x667085,
  slateCss: "#667085",
  purple: 0x6c4df6,
  purpleDeep: 0x5535df,
  lavender: 0xeee9ff,
  lavenderSoft: 0xf8f6ff,
  lavenderLine: 0xd9d0ff,
  white: 0xffffff,
  line: 0xdfe3ec,
  shadow: 0x17204b,
  green: 0x2f9d68,
  amber: 0xd97706,
  silver: 0xe9edf3,
  silverEdge: 0x667085,
  gold: 0xf3d273,
  goldEdge: 0x98701b,
});

export const PLAYER_LAYOUT = Object.freeze({
  inset: 18,
  contentWidth: 314,
  choiceHeight: 58,
  choiceGap: 12,
  controlRadius: 17,
  stageRadius: 24,
  minimumTarget: 52,
});

export const PLAYER_MOTION = Object.freeze({
  pressMs: 95,
  selectMs: 150,
  liftMs: 170,
  snapMs: 210,
  reorderMs: 220,
  sceneMs: 280,
  revealMs: 260,
  easeOut: "Sine.easeOut",
  physicalOut: "Back.easeOut",
});

export type PlayerMotionPreferences = {
  reduced: boolean;
};

export function motionDuration(
  preferences: PlayerMotionPreferences,
  duration: number,
) {
  return preferences.reduced ? 0 : duration;
}

export function addStageSurface(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const shadow = scene.add
    .rectangle(x, y + 5, width, height, PLAYER_COLOURS.shadow, 0.075)
    .setOrigin(0.5);
  const surface = scene.add
    .rectangle(x, y, width, height, PLAYER_COLOURS.white)
    .setStrokeStyle(1, PLAYER_COLOURS.line)
    .setOrigin(0.5);
  return { shadow, surface };
}

export function createChoiceCard(
  scene: Phaser.Scene,
  labelText: string,
  y: number,
) {
  const shadow = scene.add
    .rectangle(0, 4, PLAYER_LAYOUT.contentWidth, PLAYER_LAYOUT.choiceHeight, PLAYER_COLOURS.shadow, 0.08)
    .setOrigin(0.5);
  const background = scene.add
    .rectangle(0, 0, PLAYER_LAYOUT.contentWidth, PLAYER_LAYOUT.choiceHeight, PLAYER_COLOURS.white)
    .setStrokeStyle(2, PLAYER_COLOURS.line)
    .setOrigin(0.5);
  const accent = scene.add
    .rectangle(-PLAYER_LAYOUT.contentWidth / 2 + 5, 0, 5, 30, PLAYER_COLOURS.purple, 0)
    .setOrigin(0.5);
  const label = scene.add
    .text(-132, 0, labelText, {
      color: PLAYER_COLOURS.inkCss,
      fontFamily: "Arial, sans-serif",
      fontSize: "17px",
      fontStyle: "bold",
      lineSpacing: 3,
      wordWrap: { width: 258 },
    })
    .setOrigin(0, 0.5);
  const card = scene.add
    .container(PLAYER_CANVAS_WIDTH / 2, y, [shadow, background, accent, label])
    .setSize(PLAYER_LAYOUT.contentWidth, PLAYER_LAYOUT.choiceHeight);

  const paint = (state: "rest" | "hover" | "selected" | "pressed") => {
    const selected = state === "selected" || state === "pressed";
    background
      .setFillStyle(selected ? PLAYER_COLOURS.lavender : PLAYER_COLOURS.white)
      .setStrokeStyle(selected ? 2 : state === "hover" ? 2 : 1, selected || state === "hover" ? PLAYER_COLOURS.purple : PLAYER_COLOURS.line);
    accent.setAlpha(selected ? 1 : 0);
    shadow.setAlpha(state === "pressed" ? 0.03 : selected ? 0.1 : 0.08);
  };

  return { card, background, label, paint };
}

export function createPrimaryAction(scene: Phaser.Scene, y: number, labelText = "Continue") {
  const shadow = scene.add
    .rectangle(0, 5, PLAYER_LAYOUT.contentWidth, 56, PLAYER_COLOURS.shadow, 0.16)
    .setOrigin(0.5);
  const background = scene.add
    .rectangle(0, 0, PLAYER_LAYOUT.contentWidth, 56, PLAYER_COLOURS.ink)
    .setOrigin(0.5);
  const highlight = scene.add
    .rectangle(0, -25, PLAYER_LAYOUT.contentWidth - 16, 2, PLAYER_COLOURS.white, 0.14)
    .setOrigin(0.5);
  const label = scene.add
    .text(0, 0, labelText, {
      color: "#FFFFFF",
      fontFamily: "Arial, sans-serif",
      fontSize: "17px",
      fontStyle: "bold",
    })
    .setOrigin(0.5);
  const button = scene.add
    .container(PLAYER_CANVAS_WIDTH / 2, y, [shadow, background, highlight, label])
    .setSize(PLAYER_LAYOUT.contentWidth, 56);
  return { button, background, shadow };
}

export function createDropSlot(scene: Phaser.Scene, y: number) {
  const slot = scene.add
    .rectangle(PLAYER_CANVAS_WIDTH / 2, y, PLAYER_LAYOUT.contentWidth, 56, PLAYER_COLOURS.lavender, 0.48)
    .setStrokeStyle(2, PLAYER_COLOURS.lavenderLine, 0.9);
  return {
    slot,
    setActive(active: boolean) {
      slot
        .setFillStyle(active ? 0xe2dbff : PLAYER_COLOURS.lavender, active ? 0.9 : 0.48)
        .setStrokeStyle(active ? 3 : 2, active ? PLAYER_COLOURS.purple : PLAYER_COLOURS.lavenderLine, 1);
    },
  };
}

export function createCounter(scene: Phaser.Scene, x: number, y: number) {
  const shadow = scene.add.ellipse(1, 5, 31, 13, PLAYER_COLOURS.shadow, 0.13);
  const rim = scene.add.circle(0, 0, 16, PLAYER_COLOURS.purpleDeep);
  const face = scene.add.circle(0, -2, 14, PLAYER_COLOURS.purple);
  const sheen = scene.add.ellipse(-5, -7, 9, 5, 0xffffff, 0.42).setRotation(-0.28);
  const inner = scene.add.circle(0, -2, 10, PLAYER_COLOURS.purple, 0).setStrokeStyle(1, 0xc9bdff, 0.5);
  return scene.add.container(x, y, [shadow, rim, face, inner, sheen]);
}

function addSubdivisionLines(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  width: number,
  height: number,
  columns: number,
  rows: number,
  colour: number,
) {
  for (let column = 1; column < columns; column += 1) {
    const x = -width / 2 + (column * width) / columns;
    container.add(scene.add.line(0, 0, x, -height / 2, x, height / 2, colour, 0.55).setLineWidth(1));
  }
  for (let row = 1; row < rows; row += 1) {
    const y = -height / 2 + (row * height) / rows;
    container.add(scene.add.line(0, 0, -width / 2, y, width / 2, y, colour, 0.55).setLineWidth(1));
  }
}

export function createUnitCube(scene: Phaser.Scene, x: number, y: number) {
  const container = scene.add.container(x, y);
  const shadow = scene.add.ellipse(2, 10, 24, 8, PLAYER_COLOURS.shadow, 0.1);
  const front = scene.add.rectangle(0, 0, 18, 18, 0xf6b84c).setStrokeStyle(2, PLAYER_COLOURS.amber);
  const top = scene.add.polygon(0, 0, [-9, -9, -4, -14, 14, -14, 9, -9], 0xffd987).setStrokeStyle(1, PLAYER_COLOURS.amber);
  const side = scene.add.polygon(0, 0, [9, -9, 14, -14, 14, 4, 9, 9], 0xeaa130).setStrokeStyle(1, PLAYER_COLOURS.amber);
  return container.add([shadow, front, top, side]);
}

export function createTenRod(scene: Phaser.Scene, x: number, y: number) {
  const container = scene.add.container(x, y);
  const shadow = scene.add.ellipse(3, 39, 25, 10, PLAYER_COLOURS.shadow, 0.1);
  const body = scene.add.rectangle(0, 0, 18, 76, 0x7ed5aa).setStrokeStyle(2, PLAYER_COLOURS.green);
  const side = scene.add.polygon(0, 0, [9, -38, 14, -43, 14, 33, 9, 38], 0x55b986).setStrokeStyle(1, PLAYER_COLOURS.green);
  const top = scene.add.polygon(0, 0, [-9, -38, -4, -43, 14, -43, 9, -38], 0xb6ecd0).setStrokeStyle(1, PLAYER_COLOURS.green);
  container.add([shadow, body, side, top]);
  addSubdivisionLines(scene, container, 18, 76, 1, 10, PLAYER_COLOURS.green);
  return container;
}

export function createHundredFlat(scene: Phaser.Scene, x: number, y: number) {
  const container = scene.add.container(x, y);
  const shadow = scene.add.ellipse(3, 31, 64, 12, PLAYER_COLOURS.shadow, 0.1);
  const face = scene.add.rectangle(0, 0, 60, 60, 0xcfc5ff).setStrokeStyle(2, PLAYER_COLOURS.purpleDeep);
  container.add([shadow, face]);
  addSubdivisionLines(scene, container, 60, 60, 10, 10, PLAYER_COLOURS.purple);
  return container;
}

export function createThousandCube(scene: Phaser.Scene, x: number, y: number) {
  const container = scene.add.container(x, y);
  const shadow = scene.add.ellipse(4, 34, 69, 15, PLAYER_COLOURS.shadow, 0.12);
  const front = scene.add.rectangle(0, 0, 62, 62, 0xb9a8ff).setStrokeStyle(2, PLAYER_COLOURS.purpleDeep);
  const top = scene.add.polygon(0, 0, [-31, -31, -19, -43, 43, -43, 31, -31], 0xe7e1ff).setStrokeStyle(2, PLAYER_COLOURS.purpleDeep);
  const side = scene.add.polygon(0, 0, [31, -31, 43, -43, 43, 19, 31, 31], 0x947cf8).setStrokeStyle(2, PLAYER_COLOURS.purpleDeep);
  container.add([shadow, front, top, side]);
  addSubdivisionLines(scene, container, 62, 62, 5, 5, PLAYER_COLOURS.purpleDeep);
  return container;
}

const CURRENCY_RADIUS: Record<string, number> = {
  "5c": 17,
  "10c": 20,
  "20c": 24,
  "50c": 29,
  "$1": 23,
  "$2": 19,
};

export function createCurrencyToken(
  scene: Phaser.Scene,
  PhaserRuntime: typeof Phaser,
  denomination: string,
  x: number,
  y: number,
) {
  const radius = CURRENCY_RADIUS[denomination] ?? 22;
  const gold = denomination === "$1" || denomination === "$2";
  const container = scene.add.container(x, y);
  const shadow = scene.add.ellipse(1, radius * 0.7, radius * 1.7, radius * 0.55, PLAYER_COLOURS.shadow, 0.12);
  const edge = denomination === "50c"
    ? scene.add.polygon(0, 2, Array.from({ length: 12 }, (_, index) => {
        const angle = -Math.PI / 2 + (index * Math.PI * 2) / 12;
        return new PhaserRuntime.Geom.Point(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }), PLAYER_COLOURS.silverEdge)
    : scene.add.circle(0, 2, radius, gold ? PLAYER_COLOURS.goldEdge : PLAYER_COLOURS.silverEdge);
  const faceRadius = radius - 2;
  const face = denomination === "50c"
    ? scene.add.polygon(0, 0, Array.from({ length: 12 }, (_, index) => {
        const angle = -Math.PI / 2 + (index * Math.PI * 2) / 12;
        return new PhaserRuntime.Geom.Point(Math.cos(angle) * faceRadius, Math.sin(angle) * faceRadius);
      }), PLAYER_COLOURS.silver)
    : scene.add.circle(0, 0, faceRadius, gold ? PLAYER_COLOURS.gold : PLAYER_COLOURS.silver);
  const inner = scene.add.circle(0, 0, Math.max(8, faceRadius - 5), gold ? 0xf8e5a8 : 0xf7f9fc, 0.54)
    .setStrokeStyle(1, gold ? PLAYER_COLOURS.goldEdge : 0x9aa3b1, 0.7);
  const label = scene.add.text(0, 0, denomination, {
    color: PLAYER_COLOURS.inkCss,
    fontFamily: "Arial, sans-serif",
    fontSize: denomination === "50c" ? "11px" : "12px",
    fontStyle: "bold",
  }).setOrigin(0.5);
  return container.add([shadow, edge, face, inner, label]);
}
