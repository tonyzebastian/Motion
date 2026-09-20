# Standalone Riso Canvas pages

`bouquet.html` and `room.html` are self-contained, dependency-free browser
pages. They can be deployed directly to any static host, together with
`NOTICE.txt`.

In this Remotion project they are served unchanged at:

- `/riso-canvas/bouquet.html`
- `/riso-canvas/room.html`

The native Remotion adaptation of the bouquet lives in
`src/scenes/RisoCanvas/`; it shares the illustration code but replaces the
browser animation loop with Remotion frame time.
