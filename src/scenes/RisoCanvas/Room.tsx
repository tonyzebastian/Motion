import { useLayoutEffect, useRef, useState } from "react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  drawScene,
  grain,
  iso,
  makePen,
  PAPER_CSS,
  resetInkCaches,
  ROOM,
} from "./engine/room";

const LOOP_SECONDS = 22;

const roomBounds = () => {
  const points: [number, number][] = [];
  for (const i of [-0.4, ROOM.w + 0.3]) {
    for (const j of [-0.4, ROOM.d + 0.3]) {
      for (const z of [-0.55, ROOM.h + 0.35]) points.push(iso(i, j, z));
    }
  }

  return {
    left: Math.min(...points.map(([x]) => x)),
    top: Math.min(...points.map(([, y]) => y)),
    right: Math.max(...points.map(([x]) => x)),
    bottom: Math.max(...points.map(([, y]) => y)),
  };
};

const BOUNDS = roomBounds();

export const RisoRoomScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderHandle] = useState(() => delayRender("Drawing Riso room"));
  const didContinue = useRef(false);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Canvas 2D is unavailable.");

    const time = (frame / fps) % LOOP_SECONDS;
    const scale =
      Math.min(
        width / (BOUNDS.right - BOUNDS.left),
        height / (BOUNDS.bottom - BOUNDS.top),
      ) * 0.985;
    const centerX = (BOUNDS.left + BOUNDS.right) / 2;
    const centerY = (BOUNDS.top + BOUNDS.bottom) / 2;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PAPER_CSS;
    context.fillRect(0, 0, width, height);
    resetInkCaches();
    context.setTransform(
      scale,
      0,
      0,
      scale,
      width / 2 - centerX * scale,
      height / 2 - centerY * scale,
    );

    const pen = makePen(context, { boil: 0 });
    pen.shell(ROOM);
    drawScene(pen, time);

    const left = -width / 2 / scale + centerX;
    const top = -height / 2 / scale + centerY;
    context.globalCompositeOperation = "multiply";
    context.fillStyle = grain(context);
    context.fillRect(left, top, width / scale, height / scale);
    context.globalCompositeOperation = "source-over";

    if (!didContinue.current) {
      continueRender(renderHandle);
      didContinue.current = true;
    }
  }, [fps, frame, height, renderHandle, width]);

  return <canvas ref={canvasRef} width={width} height={height} />;
};

export const RISO_ROOM_DURATION = LOOP_SECONDS * 30;
