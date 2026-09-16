---
name: sequencing
description: Sequencing patterns for Remotion - delay, trim, limit duration of items
metadata:
  tags: sequence, series, timing, delay, trim
---

Use `<Sequence>` to delay when an element appears in the timeline.

```tsx
import { Sequence } from "remotion";

export const Title = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 2 * fps], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return <div style={{ opacity }}>Title</div>;
};

export const Subtitle = () => {
  return <div>Subtitle</div>;
};

const Main = () => {
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill>
      <Sequence>
        <Background />
      </Sequence>
      <Sequence from={1 * fps} durationInFrames={2 * fps} layout="none">
        <Title />
      </Sequence>
      <Sequence from={2 * fps} durationInFrames={2 * fps} layout="none">
        <Subtitle />
      </Sequence>
    </AbsoluteFill>
  );
}
```

This will by default wrap the component in an absolute fill element.  
If the items should not be wrapped, use the `layout` prop:

```tsx
<Sequence layout="none">
  <Title />
</Sequence>
```

## Naming sequences

ALWAYS pass a `name` prop to every `<Sequence>`. The name is what shows up in the Remotion Studio timeline panel, so good names turn the timeline into a real outline you can scrub against. It's metadata only — it does not affect the rendered output.

Conventions to follow:

- Number every top-level sequence so reading order is unambiguous: `"1 · Intro"`, `"2 · BrandStack"`, `"3 · Outro"`. Use the middle-dot separator (`·`, U+00B7) so the number reads as a label, not a frame count.
- For nested sequences inside a numbered parent, use letter suffixes: `"3a · Slack beat"`, `"3b · Web beat"`. This keeps the parent/child relationship obvious in the timeline tree.
- Prefer descriptive, content-first names (`"4 · Playbook"`) over implementation names (`"PlaybookWithExit wrapper"`).
- If a sequence wraps content with an extra exit motion, keep the name about the content, not the wrapper. e.g. name it `"3 · Everywhere"`, not `"EverywhereWithExit"`.

```tsx
<AbsoluteFill>
  <Sequence name="1 · Headline" durationInFrames={HEADLINE_END} layout="none">
    <Headline />
  </Sequence>
  <Sequence name="2 · BrandStack" from={BRAND_START} durationInFrames={BRAND_DURATION} layout="none">
    <BrandStack />
  </Sequence>
  <Sequence name="3 · Everywhere" from={EVERYWHERE_START} durationInFrames={EVERYWHERE_DURATION} layout="none">
    <Everywhere />
  </Sequence>
  <Sequence name="4 · Playbook" from={PLAYBOOK_START} durationInFrames={PLAYBOOK_DURATION} layout="none">
    <Sequence name="4a · Part A (re-timed)" durationInFrames={PART_A_DURATION} layout="none">
      <PartA />
    </Sequence>
    <Sequence name="4b · Part B (native)" from={PART_B_START} durationInFrames={PART_B_DURATION} layout="none">
      <PartB />
    </Sequence>
  </Sequence>
</AbsoluteFill>
```

## Premounting

This loads the component in the timeline before it is actually played.  
Always premount any `<Sequence>`!

```tsx
<Sequence premountFor={1 * fps}>
  <Title />
</Sequence>
```

## Series

Use `<Series>` when elements should play one after another without overlap.

```tsx
import { Series } from "remotion";

<Series>
  <Series.Sequence durationInFrames={45}>
    <Intro />
  </Series.Sequence>
  <Series.Sequence durationInFrames={60}>
    <MainContent />
  </Series.Sequence>
  <Series.Sequence durationInFrames={30}>
    <Outro />
  </Series.Sequence>
</Series>;
```

Same as with `<Sequence>`, the items will be wrapped in an absolute fill element by default when using `<Series.Sequence>`, unless the `layout` prop is set to `none`.

### Series with overlaps

Use negative offset for overlapping sequences:

```tsx
<Series>
  <Series.Sequence durationInFrames={60}>
    <SceneA />
  </Series.Sequence>
  <Series.Sequence offset={-15} durationInFrames={60}>
    {/* Starts 15 frames before SceneA ends */}
    <SceneB />
  </Series.Sequence>
</Series>
```

## Frame References Inside Sequences

Inside a Sequence, `useCurrentFrame()` returns the local frame (starting from 0):

```tsx
<Sequence from={60} durationInFrames={30}>
  <MyComponent />
  {/* Inside MyComponent, useCurrentFrame() returns 0-29, not 60-89 */}
</Sequence>
```

## Nested Sequences

Sequences can be nested for complex timing:

```tsx
<Sequence from={0} durationInFrames={120}>
  <Background />
  <Sequence from={15} durationInFrames={90} layout="none">
    <Title />
  </Sequence>
  <Sequence from={45} durationInFrames={60} layout="none">
    <Subtitle />
  </Sequence>
</Sequence>
```

## Nesting compositions within another

To add a composition within another composition, you can use the `<Sequence>` component with a `width` and `height` prop to specify the size of the composition.

```tsx
<AbsoluteFill>
  <Sequence width={COMPOSITION_WIDTH} height={COMPOSITION_HEIGHT}>
    <CompositionComponent />
  </Sequence>
</AbsoluteFill>
```
