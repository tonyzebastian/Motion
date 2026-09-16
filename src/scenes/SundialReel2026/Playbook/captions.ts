// ============================================
// Playbook section captions
// ============================================
//
// Explanatory "explainer text" captions overlaid on the reel's Playbook
// section, one per beat. All `from` / `durationInFrames` values are
// SECTION-relative frames at 60fps (i.e. relative to the Playbook
// component's local timeline), matching the windows derived in
// `./timing.ts`:
//
//   Deep Playbooks  -> Part A reel filtering/selecting (zoom-in lands ~240,
//                      match holds ~552, zoom-out 618-654)
//   Trust Signals   -> Part B confidence tag + popover (tag ~2181,
//                      popover ~2341, hold to 2469)
//   Data Lens       -> Part C citation markers + footnote (markers/zoom
//                      ~2558-2630, popover ~2678, hold to 2798)
//
// Positions sit in the clear mesh margin beside the 1.2x-scaled browser
// window, chosen per beat to stay clear of the 1.4x zoom expansion:
//   Deep Playbooks  -> LEFT margin, upper  (window expands down-right)
//   Trust Signals   -> LEFT margin, lower  (window expands up-right)
//   Data Lens       -> RIGHT margin, upper (window expands down-left)
// ============================================

import type { CaptionSide } from './PlaybookCaption';

export type PlaybookCaptionEntry = {
  id: string;
  label: string;
  description: string[];
  side: CaptionSide;
  top: number;
  width: number;
  from: number;
  durationInFrames: number;
};

// The 1.4x camera zoom scales the browser window to nearly fill the frame
// during each hero moment, so the Playbook section pans the whole stage
// sideways (see PAN in ./index.tsx) to open up a wide clear strip of mesh:
// ~500px on the LEFT for Deep + Trust (scene pans right) and ~440px on the
// RIGHT for Data Lens (scene pans left). Captions fill that strip with
// large, readable type.
export const PLAYBOOK_CAPTIONS: PlaybookCaptionEntry[] = [
  {
    id: 'deep-playbooks',
    label: 'Deep Playbooks',
    description: [
      'Sundial picks the right',
      'analysis playbook for',
      'your question.',
    ],
    side: 'left',
    top: 210,
    width: 400,
    from: 270,
    durationInFrames: 345,
  },
  {
    id: 'trust-signals',
    label: 'Trust Signals',
    description: [
      'See the confidence and',
      'the playbook behind',
      'every answer.',
    ],
    side: 'left',
    top: 540,
    width: 400,
    // Delayed so the text flies in once the trust-signal camera has
    // settled into its zoom (a beat after the zoom-in begins at ~2257),
    // rather than appearing early while the view is still settled.
    from: 2300,
    durationInFrames: 170,
  },
  {
    id: 'data-lens',
    label: 'Data Lens',
    description: [
      'Track any number',
      'back to its source table.',
    ],
    side: 'right',
    top: 210,
    width: 380,
    from: 2590,
    durationInFrames: 220,
  },
];
