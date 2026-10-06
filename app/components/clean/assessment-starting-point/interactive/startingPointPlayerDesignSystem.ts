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
  materialFace: 0x78cfc4,
  materialLight: 0xbcebe4,
  materialSide: 0x3da99e,
  materialEdge: 0x237d78,
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
  const brandLine = scene.add
    .rectangle(x, y - height / 2 + 3, width - 28, 3, PLAYER_COLOURS.purple, 0.34)
    .setOrigin(0.5);
  return { shadow, surface, brandLine };
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
  const shadow = scene.add.ellipse(1, 7, 34, 12, PLAYER_COLOURS.shadow, 0.14);
  const edge = scene.add.ellipse(0, 2, 35, 31, PLAYER_COLOURS.purpleDeep);
  const rim = scene.add.ellipse(0, -1, 35, 31, 0x8067f8).setStrokeStyle(1, 0x4e32cd, 0.9);
  const face = scene.add.ellipse(0, -3, 29, 25, PLAYER_COLOURS.purple);
  const innerRim = scene.add.ellipse(0, -3, 23, 19, PLAYER_COLOURS.purple, 0)
    .setStrokeStyle(1, 0xb9a8ff, 0.58);
  const sheen = scene.add.ellipse(-6, -9, 10, 5, 0xffffff, 0.38).setRotation(-0.22);
  return scene.add.container(x, y, [shadow, edge, rim, face, innerRim, sheen]);
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
  const shadow = scene.add.ellipse(2, 11, 25, 8, PLAYER_COLOURS.shadow, 0.11);
  const front = scene.add.rectangle(0, 0, 19, 19, PLAYER_COLOURS.materialFace).setStrokeStyle(1.5, PLAYER_COLOURS.materialEdge);
  const top = scene.add.polygon(0, 0, [-9.5, -9.5, -4, -15, 15, -15, 9.5, -9.5], PLAYER_COLOURS.materialLight).setStrokeStyle(1, PLAYER_COLOURS.materialEdge);
  const side = scene.add.polygon(0, 0, [9.5, -9.5, 15, -15, 15, 4, 9.5, 9.5], PLAYER_COLOURS.materialSide).setStrokeStyle(1, PLAYER_COLOURS.materialEdge);
  return container.add([shadow, front, top, side]);
}

export function createTenRod(scene: Phaser.Scene, x: number, y: number) {
  const container = scene.add.container(x, y);
  const shadow = scene.add.ellipse(3, 47, 28, 10, PLAYER_COLOURS.shadow, 0.11);
  const body = scene.add.rectangle(0, 0, 19, 91, PLAYER_COLOURS.materialFace).setStrokeStyle(1.5, PLAYER_COLOURS.materialEdge);
  const side = scene.add.polygon(0, 0, [9.5, -45.5, 15, -51, 15, 40, 9.5, 45.5], PLAYER_COLOURS.materialSide).setStrokeStyle(1, PLAYER_COLOURS.materialEdge);
  const top = scene.add.polygon(0, 0, [-9.5, -45.5, -4, -51, 15, -51, 9.5, -45.5], PLAYER_COLOURS.materialLight).setStrokeStyle(1, PLAYER_COLOURS.materialEdge);
  container.add([shadow, body, side, top]);
  addSubdivisionLines(scene, container, 19, 91, 1, 10, PLAYER_COLOURS.materialEdge);
  return container;
}

export function createHundredFlat(scene: Phaser.Scene, x: number, y: number) {
  const container = scene.add.container(x, y);
  const shadow = scene.add.ellipse(3, 37, 75, 13, PLAYER_COLOURS.shadow, 0.11);
  const face = scene.add.rectangle(0, 0, 70, 70, PLAYER_COLOURS.materialFace).setStrokeStyle(2, PLAYER_COLOURS.materialEdge);
  const topEdge = scene.add.polygon(0, 0, [-35, -35, -30, -40, 40, -40, 35, -35], PLAYER_COLOURS.materialLight).setStrokeStyle(1, PLAYER_COLOURS.materialEdge);
  const sideEdge = scene.add.polygon(0, 0, [35, -35, 40, -40, 40, 30, 35, 35], PLAYER_COLOURS.materialSide).setStrokeStyle(1, PLAYER_COLOURS.materialEdge);
  container.add([shadow, face, topEdge, sideEdge]);
  addSubdivisionLines(scene, container, 70, 70, 10, 10, PLAYER_COLOURS.materialEdge);
  return container;
}

export function createThousandCube(scene: Phaser.Scene, x: number, y: number) {
  const container = scene.add.container(x, y);
  const shadow = scene.add.ellipse(5, 40, 80, 16, PLAYER_COLOURS.shadow, 0.13);
  const front = scene.add.rectangle(0, 0, 72, 72, PLAYER_COLOURS.materialFace).setStrokeStyle(2, PLAYER_COLOURS.materialEdge);
  const top = scene.add.polygon(0, 0, [-36, -36, -23, -49, 49, -49, 36, -36], PLAYER_COLOURS.materialLight).setStrokeStyle(2, PLAYER_COLOURS.materialEdge);
  const side = scene.add.polygon(0, 0, [36, -36, 49, -49, 49, 23, 36, 36], PLAYER_COLOURS.materialSide).setStrokeStyle(2, PLAYER_COLOURS.materialEdge);
  container.add([shadow, front, top, side]);
  addSubdivisionLines(scene, container, 72, 72, 6, 6, PLAYER_COLOURS.materialEdge);
  return container;
}

const CURRENCY_RADIUS: Record<string, number> = {
  "5c": 18,
  "10c": 21,
  "20c": 26,
  "50c": 30,
  "$1": 24,
  "$2": 20,
};

function regularPolygonPoints(
  PhaserRuntime: typeof Phaser,
  sides: number,
  radius: number,
) {
  return Array.from({ length: sides }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / sides;
    return new PhaserRuntime.Geom.Point(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
    );
  });
}

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
  const shadow = scene.add.ellipse(1, radius * 0.76, radius * 1.75, radius * 0.5, PLAYER_COLOURS.shadow, 0.13);
  const edge = denomination === "50c"
    ? scene.add.polygon(0, 2, regularPolygonPoints(PhaserRuntime, 12, radius), PLAYER_COLOURS.silverEdge)
    : scene.add.circle(0, 2, radius, gold ? PLAYER_COLOURS.goldEdge : PLAYER_COLOURS.silverEdge);
  const faceRadius = radius - 2.5;
  const face = denomination === "50c"
    ? scene.add.polygon(0, 0, regularPolygonPoints(PhaserRuntime, 12, faceRadius), PLAYER_COLOURS.silver)
    : scene.add.circle(0, 0, faceRadius, gold ? PLAYER_COLOURS.gold : PLAYER_COLOURS.silver);
  const insetRadius = Math.max(8, faceRadius - 5);
  const inner = denomination === "50c"
    ? scene.add.polygon(0, 0, regularPolygonPoints(PhaserRuntime, 12, insetRadius), 0xf7f9fc, 0.28)
        .setStrokeStyle(1, 0x9aa3b1, 0.62)
    : scene.add.circle(0, 0, insetRadius, gold ? 0xf8e5a8 : 0xf7f9fc, 0.3)
        .setStrokeStyle(1, gold ? PLAYER_COLOURS.goldEdge : 0x9aa3b1, 0.62);
  const motif = denomination === "$1"
    ? scene.add.star(0, -1, 8, radius * 0.42, radius * 0.55, gold ? 0xc99c32 : 0x9aa3b1, 0.18)
    : denomination === "$2"
      ? scene.add.ellipse(0, -1, radius * 1.05, radius * 0.72, 0xc08c1e, 0.16)
          .setStrokeStyle(1, PLAYER_COLOURS.goldEdge, 0.45)
      : scene.add.ellipse(-radius * 0.18, -radius * 0.24, radius * 0.48, radius * 0.24, 0xffffff, 0.28)
          .setRotation(-0.35);
  const label = scene.add.text(0, 0, denomination, {
    color: PLAYER_COLOURS.inkCss,
    fontFamily: "Arial, sans-serif",
    fontSize: denomination === "50c" ? "12px" : "12px",
    fontStyle: "bold",
  }).setOrigin(0.5).setShadow(0, 1, "#FFFFFF", 1, false, true);
  return container.add([shadow, edge, face, inner, motif, label]);
}
