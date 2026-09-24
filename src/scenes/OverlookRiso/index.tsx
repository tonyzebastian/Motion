import React from "react";

// A drawn interpretation of the supplied photograph. No photograph is loaded,
// sampled, traced by software, or used as a rendered layer.
const c = {
  paper: "#f5eedc", cloud: "#d8e5df", sea: "#a3c8c9", slate: "#77939a",
  blue: "#4e7182", navy: "#263f50", ink: "#273d3d", sage: "#9aaa8a",
  olive: "#71836a", forest: "#3e6559", deep: "#2c4c43", bark: "#858a7c",
  barkLight: "#acafa0", straw: "#c5ab77", rust: "#bd714d", skin: "#c99776",
  stone: "#aaa08b", path: "#958d7c",
};

const random = (n: number, seed: number): number => {
  let x = Math.imul(n + seed * 557, 2246822519);
  x = Math.imul(x ^ (x >>> 13), 3266489917);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};

const skyline = Array.from({length: 105}, (_, i) => {
  const x = i * 6.4 - 7;
  const h = 8 + random(i, 1) * 46;
  return <rect key={i} x={x} y={432 - h} width={4 + random(i, 2) * 6} height={h} fill={[c.slate, c.blue, c.cloud, "#849e9c"][i % 4]} />;
});

const treeCrowns: Array<[number, number, number, number, number]> = [
  [16, 10, 94, 58, 185], [125, 22, 104, 70, 165], [279, 12, 109, 63, 150],
  [406, 27, 126, 73, 170], [553, 39, 113, 91, 185], [65, 121, 84, 84, 145],
  [165, 171, 91, 75, 130], [302, 133, 92, 81, 135], [420, 175, 75, 73, 115],
  [560, 151, 95, 72, 135], [31, 213, 72, 43, 80], [364, 234, 63, 46, 62],
];

const canopy = treeCrowns.flatMap(([cx, cy, rx, ry, count], k) =>
  Array.from({length: count}, (_, i) => {
    const angle = random(i, 200 + k) * Math.PI * 2;
    const radius = Math.sqrt(random(i, 220 + k));
    const x = cx + Math.cos(angle) * rx * radius;
    const y = cy + Math.sin(angle) * ry * radius;
    const rotate = (random(i, 240 + k) - 0.5) * 115;
    return <ellipse key={`${k}-${i}`} cx={x} cy={y} rx={1.4 + random(i, 260 + k) * 3.2} ry={3 + random(i, 280 + k) * 5.7} transform={`rotate(${rotate} ${x} ${y})`} fill={[c.deep, c.forest, c.olive, c.sage, c.navy][(i + k) % 5]} />;
  }),
);

const bushClumps: Array<[number, number, number, number]> = [
  [427, 426, 38, 58], [461, 370, 34, 45], [506, 374, 40, 51],
  [547, 408, 37, 51], [489, 454, 65, 45], [418, 465, 34, 31],
];

const bushLeaves = bushClumps.flatMap(([cx, cy, rx, ry], k) =>
  Array.from({length: 135}, (_, i) => {
    const angle = random(i, 301 + k) * Math.PI * 2;
    const radius = Math.sqrt(random(i, 321 + k));
    return <ellipse key={`${k}-${i}`} cx={cx + Math.cos(angle) * rx * radius} cy={cy + Math.sin(angle) * ry * radius} rx={1.8 + random(i, 341 + k) * 4.9} ry={1.7 + random(i, 361 + k) * 3.7} fill={[c.deep, c.forest, c.olive, c.sage][(i + k) % 4]} />;
  }),
);

const grass = Array.from({length: 560}, (_, i) => {
  const x = random(i, 401) * 640;
  const y = 528 + random(i, 402) * 272;
  if (y < 724 - x * 0.29 - random(i, 403) * 75) return null;
  const h = 3 + random(i, 404) * (y > 690 ? 18 : 11);
  const dx = (random(i, 405) - 0.5) * 9;
  return <path key={i} d={`M${x} ${y} q${dx} ${-h / 2} ${dx * 0.6} ${-h}`} fill="none" stroke={[c.straw, c.sage, c.olive, c.paper][i % 4]} strokeWidth={0.7 + random(i, 406) * 0.9} strokeLinecap="round" />;
});

const fibres = Array.from({length: 520}, (_, i) => (
  <circle key={i} cx={random(i, 501) * 640} cy={random(i, 502) * 800} r={random(i, 503) * 0.8} fill={i % 3 ? c.paper : c.navy} opacity={i % 3 ? 0.29 : 0.1} />
));

export const OverlookRisoScene: React.FC = () => (
  <svg width="640" height="800" viewBox="0 0 640 800" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="ink-screen" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(14)">
        <circle cx="1" cy="1" r="0.58" fill={c.navy} opacity="0.31" />
      </pattern>
    </defs>

    {/* Open overcast sky, distant water and low city. */}
    <rect width="640" height="800" fill={c.paper} />
    <path d="M0 215 C130 205 233 225 357 218 C483 210 561 231 640 221 L640 391 L0 391Z" fill={c.cloud} />
    <path d="M0 295 C117 283 228 307 324 294 C454 280 545 300 640 294 L640 360 C536 357 429 352 309 364 C201 371 86 350 0 358Z" fill="#ebe9dc" />
    <path d="M0 373 C150 370 286 380 414 372 C513 367 580 372 640 372 L640 411 L0 411Z" fill={c.sea} />
    {Array.from({length: 30}, (_, i) => <path key={i} d={`M${random(i, 11) * 600} ${379 + i * 0.86} h${20 + random(i, 12) * 100}`} stroke={i % 3 ? c.cloud : c.blue} strokeWidth="0.65" opacity="0.6" />)}
    <path d="M0 416 C80 413 130 403 217 411 C309 417 367 405 431 407 C515 407 578 414 640 405 L640 491 L0 493Z" fill={c.slate} />
    {skyline}
    <path d="M0 450 C83 432 156 452 214 446 C309 431 352 459 430 441 C503 429 567 440 640 434 L640 518 L0 518Z" fill="#607e7e" />
    {Array.from({length: 170}, (_, i) => <rect key={i} x={random(i, 21) * 640} y={444 + random(i, 22) * 68} width={1 + random(i, 23) * 3} height={1 + random(i, 24) * 2} fill={i % 7 === 0 ? c.paper : i % 3 === 0 ? c.navy : c.slate} />)}

    {/* Curved path and hillside keep the camera position from the reference. */}
    <path d="M0 581 C84 541 134 539 204 557 C275 561 353 556 432 535 C528 499 578 489 640 493 L640 800 L0 800Z" fill={c.olive} />
    <path d="M0 699 C90 655 152 642 214 629 C295 602 354 569 409 558 C499 532 548 504 640 482 L640 525 C542 551 480 575 418 605 C322 655 220 705 146 751 L0 785Z" fill={c.path} />
    <path d="M0 729 C99 679 180 669 248 646 C332 615 410 562 468 546 C548 525 589 506 640 497 L640 516 C555 539 491 560 431 590 C338 639 260 688 167 733 C95 768 42 795 0 800Z" fill={c.stone} />
    <path d="M0 792 C127 733 207 711 294 681 C391 647 494 601 640 538 L640 800Z" fill={c.deep} />
    <path d="M386 644 C447 586 546 545 640 535 L640 800 L478 800 C477 736 441 686 386 644Z" fill={c.forest} />
    {grass}

    {/* Rounded but individually drawn foliage on the right. */}
    <path d="M378 450 C384 421 404 398 419 382 C416 356 435 336 453 340 C468 313 493 322 507 337 C533 315 553 340 552 363 C580 376 589 404 581 433 C597 461 576 489 542 501 C495 524 433 524 394 497Z" fill={c.deep} />
    {bushLeaves}

    {/* Tree trunk, fork and wandering branches. */}
    <path d="M123 800 C144 734 156 654 169 568 C181 488 183 410 184 338 C191 267 199 212 190 166 C187 129 167 87 140 51 L149 0 L198 0 C207 60 230 99 238 154 C239 214 219 273 218 343 C216 467 208 557 198 650 C190 718 185 769 174 800Z" fill={c.bark} stroke={c.navy} strokeWidth="2" />
    <path d="M148 799 C171 703 183 563 190 451 C202 311 211 219 204 160 L218 159 C222 223 205 334 203 459 C195 628 182 737 172 800Z" fill={c.barkLight} />
    <path d="M189 157 C145 132 91 98 27 77 C7 72 -8 66 -20 60 L-20 38 C58 50 131 89 199 127Z" fill={c.bark} stroke={c.navy} strokeWidth="1.2" />
    <path d="M195 103 C225 62 246 25 266 -10 L291 -10 C280 41 249 88 218 133Z" fill={c.bark} stroke={c.navy} strokeWidth="1.2" />
    {[
      ["M204 176 C146 157 108 137 70 127 C31 120 10 116 -15 111", 12],
      ["M218 143 C278 122 320 103 365 90 C417 77 483 67 651 20", 11],
      ["M210 189 C265 193 287 218 325 242 C357 258 402 253 447 265", 8],
      ["M194 237 C150 208 104 217 58 210 C30 206 7 193 -10 177", 8],
      ["M281 218 C303 195 326 171 344 136", 3],
      ["M365 90 C365 118 379 151 399 178", 4],
      ["M449 71 C447 111 470 136 501 165", 4],
      ["M83 129 C102 94 107 69 93 24", 4],
      ["M63 205 C82 242 104 263 135 277", 3],
      ["M326 242 C333 275 349 287 369 296", 3],
    ].map(([d, w], i) => <g key={i}><path d={String(d)} fill="none" stroke={c.navy} strokeWidth={Number(w) + 1} strokeLinecap="round" /><path d={String(d)} fill="none" stroke={c.bark} strokeWidth={Number(w) * 0.61} strokeLinecap="round" /></g>)}
    {Array.from({length: 72}, (_, i) => {
      const y = 81 + random(i, 601) * 716;
      const x = 146 + 65 * (1 - y / 900) + (random(i, 602) - 0.5) * 30;
      return <path key={i} d={`M${x} ${y} q${random(i, 603) - 0.5} 8 ${random(i, 604) - 0.5} ${9 + random(i, 605) * 11}`} fill="none" stroke={i % 3 ? c.barkLight : c.navy} strokeWidth={0.5 + random(i, 606) * 0.8} />;
    })}
    {canopy}

    {/* Figure is drafted as interlocking shapes: feet, legs, body, pockets and profile. */}
    <path d="M351 734 L390 728 L398 768 C395 777 381 781 367 781 L349 772Z" fill={c.navy} stroke={c.ink} strokeWidth="1.5" />
    <path d="M313 746 L353 743 L362 777 C351 786 326 788 306 785 L290 789 C285 785 288 776 296 773Z" fill={c.navy} stroke={c.ink} strokeWidth="1.5" />
    <path d="M343 529 C360 532 381 529 391 532 C390 590 383 644 392 706 L396 752 C385 765 367 764 356 753 L342 675 L331 601Z" fill={c.navy} stroke={c.ink} strokeWidth="1.5" />
    <path d="M304 529 C321 535 344 536 363 530 L359 604 L364 675 L368 757 C356 768 337 768 325 760 L311 699 C300 657 303 620 300 580Z" fill="#344e5d" stroke={c.ink} strokeWidth="1.5" />
    <path d="M315 541 C325 553 339 555 352 549 L348 571 C334 575 321 571 311 563Z" fill={c.blue} />
    <path d="M352 579 C347 631 350 674 359 740 M310 608 C316 647 314 681 329 721 M326 758 C338 761 353 760 364 756" fill="none" stroke={c.slate} strokeWidth="1.4" />
    <path d="M322 387 C337 377 354 376 371 375 C384 380 393 394 396 414 L395 486 C396 506 390 528 382 538 C361 544 323 544 304 536 C293 531 286 518 289 500 C288 472 298 434 303 415 C309 404 315 392 322 387Z" fill={c.forest} stroke={c.navy} strokeWidth="2" />
    <path d="M338 376 C352 367 368 363 379 368 C391 377 394 393 394 408 C381 405 372 398 364 389 C353 391 345 394 337 397Z" fill={c.ink} stroke={c.navy} strokeWidth="1.3" />
    <path d="M340 381 C354 372 368 368 381 372 C379 384 372 393 360 397 C353 391 347 386 340 381Z" fill={c.forest} />
    <path d="M310 416 C315 407 324 401 333 398 L337 482 L314 487Z" fill={c.rust} />
    <path d="M351 413 C369 413 384 416 395 426 L396 475 C379 478 365 477 353 472Z" fill={c.rust} />
    <path d="M314 486 C339 483 369 484 394 481 L390 518 C366 522 327 520 300 522Z" fill={c.stone} />
    <path d="M302 522 C330 521 358 524 390 519 L384 539 C358 544 327 545 303 536Z" fill={c.forest} />
    <path d="M294 425 C300 412 307 404 317 404 C323 411 326 426 324 438 L308 487 C304 499 307 509 314 518 L302 531 C288 525 285 514 288 499Z" fill={c.forest} stroke={c.navy} strokeWidth="1.7" />
    <path d="M298 440 C301 429 306 422 311 420 L316 461 L304 494 L293 490Z" fill={c.rust} />
    <path d="M291 499 C295 512 301 521 309 526 L315 519 C308 510 305 504 306 493Z" fill={c.navy} />
    <path d="M311 515 C317 511 323 507 327 504 L328 515 C323 521 317 524 311 523Z" fill={c.skin} stroke={c.ink} strokeWidth="0.8" />
    <path d="M354 473 C367 476 383 475 395 474 M309 527 C334 532 362 533 387 526 M354 419 C351 439 352 457 355 478" fill="none" stroke={c.navy} strokeWidth="1.3" />
    <path d="M327 327 C342 319 358 323 365 337 C368 349 359 367 350 377 C342 386 329 389 321 382 C316 377 317 369 313 365 L309 361 L313 352 C311 343 318 333 327 327Z" fill={c.skin} stroke={c.navy} strokeWidth="1.3" />
    <path d="M317 348 C313 350 310 352 309 354 L308 359 L315 359Z" fill={c.skin} stroke={c.navy} strokeWidth="0.9" />
    <path d="M333 355 C342 358 351 356 358 349 C359 364 353 377 346 385 C339 391 327 391 322 381 C319 375 321 365 320 359Z" fill={c.ink} />
    <path d="M322 364 C318 362 315 363 314 367 C318 372 319 373 323 374Z" fill={c.ink} />
    <path d="M336 352 C340 348 344 351 344 357 C343 365 338 367 334 362Z" fill={c.skin} stroke={c.ink} strokeWidth="0.8" />
    <path d="M314 349 C317 347 320 347 323 348" fill="none" stroke={c.ink} strokeWidth="1.5" />
    <ellipse cx="316.5" cy="352" rx="1.35" ry="1.05" fill={c.ink} />
    <path d="M315 335 C314 326 319 320 327 319 C322 313 330 309 338 314 C354 308 367 319 370 333 C372 345 364 352 355 354 C348 350 341 344 335 343 C327 344 320 341 315 335Z" fill={c.navy} stroke={c.ink} strokeWidth="1.1" />
    <path d="M319 320 C330 312 345 315 353 320 C338 319 329 323 322 327Z" fill={c.ink} />

    {/* Plate grain belongs to the drawing; it is not sampled from the photo. */}
    <rect width="640" height="800" fill="url(#ink-screen)" opacity="0.34" />
    {fibres}
  </svg>
);
