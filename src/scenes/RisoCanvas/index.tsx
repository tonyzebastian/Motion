import { useLayoutEffect, useRef, useState } from "react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  CH,
  CW,
  LOOP,
  PAPER_CSS,
  bakeLayer,
  blitSprites,
  bunchOffset,
  captureSprites,
  drawBase,
  drawBunch,
  drawFalling,
  drawFlyers,
  drawFront,
  grain,
  makePen,
  resetInkCaches,
} from "./engine/bouquet";

type BouquetCache = {
  width: number;
  height: number;
  base: HTMLCanvasElement;
  bunch: ReturnType<typeof captureSprites>;
  front: HTMLCanvasElement;
};

let bouquetCache: BouquetCache | null = null;

const buildCache = (width: number, height: number): BouquetCache => {
  if (bouquetCache?.width === width && bouquetCache.height === height) {
    return bouquetCache;
  }

  const scale = width / CW;
  if (height !== Math.round(CH * scale)) {
    throw new Error(`RisoBouquet expects a ${CW}:${CH} canvas.`);
  }

  bouquetCache = {
    width,
    height,
    base: bakeLayer(drawBase, scale, CW, CH),
    bunch: captureSprites(drawBunch, scale, CW, CH),
    front: bakeLayer(drawFront, scale, CW, CH),
  };
  resetInkCaches();
  return bouquetCache;
};

export const RisoBouquetScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderHandle] = useState(() =>
    delayRender("Building Riso bouquet layers"),
  );
  const didContinue = useRef(false);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Canvas 2D is unavailable.");

    const cache = buildCache(width, height);
    const scale = width / CW;
    const time = (frame / fps) % LOOP;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PAPER_CSS;
    context.fillRect(0, 0, width, height);
    context.drawImage(cache.base, 0, 0);
    blitSprites(context, cache.bunch, 0, 0, bunchOffset(scale, time));
    context.drawImage(cache.front, 0, 0);

    resetInkCaches();
    context.setTransform(scale, 0, 0, scale, 0, 0);
    const pen = makePen(context, { boil: 0 });
    drawFlyers(pen, time);
    drawFalling(pen, time);
    context.globalCompositeOperation = "multiply";
    context.fillStyle = grain(context);
    context.fillRect(-CW, -CH, CW * 3, CH * 3);
    context.globalCompositeOperation = "source-over";

    if (!didContinue.current) {
      continueRender(renderHandle);
      didContinue.current = true;
    }
  }, [fps, frame, height, renderHandle, width]);

  return <canvas ref={canvasRef} width={width} height={height} />;
};

export const RISO_BOUQUET_DURATION = LOOP * 30;

export { RisoRoomScene, RISO_ROOM_DURATION } from "./Room";
