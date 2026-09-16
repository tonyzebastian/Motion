import React from 'react';
import {ArrowRight, Check, FileText, Search, ShieldCheck, Sparkles} from 'lucide-react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {
  BrowserWindow,
  CitationRow,
  ConfidenceBadge,
  CustomerLogos,
  Eyebrow,
  Headline,
  Reveal,
  SoftBlurText,
  Wordmark,
} from './components';
import {COLORS, SANS, SERIF, easeInOut, easeOut, glass, progress} from './theme';

const frameExit = (frame: number, start: number, duration: number) =>
  interpolate(frame, [start, start + duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const firstExit = frameExit(frame, 112, 32);
  const payoff = progress(frame, 62, 34, Easing.bezier(0.16, 1, 0.3, 1));
  const halo = interpolate(frame, [0, 180], [0.92, 1.1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{display: 'grid', placeItems: 'center', overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          width: 760,
          height: 760,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.95), rgba(247,215,211,0.34) 40%, rgba(255,255,255,0) 72%)',
          transform: `scale(${halo})`,
          filter: 'blur(10px)',
        }}
      />
      <div style={{position: 'relative', textAlign: 'center', width: 1500, transform: 'translateY(-10px)'}}>
        <div style={{opacity: firstExit}}>
          <SoftBlurText
            text="More data won’t make you smarter."
            start={2}
            fontSize={66}
            fontWeight={400}
            color="rgba(83,29,89,0.7)"
            style={{marginBottom: 26}}
          />
        </div>
        <div
          style={{
            opacity: payoff,
            transform: `translateY(${(1 - payoff) * 88}px) scale(${0.93 + payoff * 0.07})`,
            filter: `blur(${(1 - payoff) * 10}px)`,
            fontFamily: SERIF,
            fontSize: 128,
            lineHeight: 0.95,
            fontWeight: 700,
            letterSpacing: '-0.06em',
            color: COLORS.plum,
          }}
        >
          Judgment will.
        </div>
        <Reveal start={104} duration={28} y={12}>
          <div style={{fontFamily: SANS, fontSize: 22, color: 'rgba(83,29,89,0.58)', marginTop: 34, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600}}>
            Meet opinionated intelligence
          </div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};

export const BrandScene: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 180], [0.985, 1.025], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeInOut,
  });
  return (
    <AbsoluteFill style={{display: 'grid', placeItems: 'center'}}>
      <div style={{textAlign: 'center', transform: `scale(${scale})`}}>
        <Reveal start={6} duration={34} y={24}>
          <Wordmark width={610} shineStart={30} />
        </Reveal>
        <Reveal start={46} duration={30} y={16}>
          <div style={{fontFamily: SERIF, fontSize: 46, fontWeight: 700, color: COLORS.plum, marginTop: 20, letterSpacing: '-0.03em'}}>
            Opinionated intelligence.
          </div>
        </Reveal>
        <Reveal start={78} duration={30} y={12}>
          <div style={{fontFamily: SANS, fontSize: 25, fontWeight: 400, color: 'rgba(83,29,89,0.6)', marginTop: 20}}>
            A world-class agentic analyst for every decision-maker.
          </div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};

const AnalysisStep: React.FC<{
  label: string;
  start: number;
  index: number;
}> = ({label, start, index}) => {
  const frame = useCurrentFrame();
  const p = progress(frame, start, 22);
  const complete = progress(frame, start + 28, 18);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity: p,
        transform: `translateX(${(1 - p) * 20}px)`,
        color: COLORS.ink,
        fontFamily: SANS,
        fontSize: 17,
        padding: '8px 0',
      }}
    >
      <div
        style={{
          width: 27,
          height: 27,
          borderRadius: 9,
          display: 'grid',
          placeItems: 'center',
          color: complete > 0.5 ? COLORS.green : COLORS.plum,
          background: complete > 0.5 ? COLORS.greenSoft : 'rgba(83,29,89,0.08)',
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {complete > 0.5 ? <Check size={15} strokeWidth={3} /> : index + 1}
      </div>
      {label}
    </div>
  );
};

const ActivationChart: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = progress(frame, 164, 95, easeOut);
  const marker = progress(frame, 244, 22, Easing.bezier(0.34, 1.45, 0.64, 1));
  const bars = [65, 82, 76, 91, 88, 96, 92, 84, 62, 57, 54, 59, 67, 73];
  return (
    <div style={{position: 'relative', height: 280, borderRadius: 20, background: 'linear-gradient(180deg, rgba(83,29,89,0.035), rgba(83,29,89,0.012))', border: `1px solid ${COLORS.line}`, padding: '26px 28px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <div style={{fontFamily: SANS, fontSize: 15, color: COLORS.muted}}>D7 activation</div>
          <div style={{fontFamily: SANS, fontSize: 34, fontWeight: 600, color: COLORS.ink, marginTop: 4}}>42.8%</div>
        </div>
        <div style={{fontFamily: SANS, fontSize: 15, fontWeight: 600, color: '#B2553C', background: '#FFF0EA', borderRadius: 999, padding: '7px 12px'}}>−9.4%</div>
      </div>
      <svg width="100%" height="170" viewBox="0 0 720 170" style={{position: 'absolute', left: 0, bottom: 12, overflow: 'visible'}}>
        {[32, 72, 112, 152].map((y) => (
          <line key={y} x1="28" x2="692" y1={y} y2={y} stroke="rgba(83,29,89,0.08)" strokeWidth="1" />
        ))}
        <path
          d="M32 98 C78 86 108 72 150 78 S225 52 270 62 S350 42 398 54 S465 118 512 120 S595 108 688 92"
          fill="none"
          stroke="#7D4E86"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="900"
          strokeDashoffset={900 * (1 - draw)}
        />
        <path
          d="M32 98 C78 86 108 72 150 78 S225 52 270 62 S350 42 398 54 S465 118 512 120 S595 108 688 92 L688 160 L32 160 Z"
          fill="url(#chartFill)"
          opacity={draw * 0.7}
        />
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#C7A7D3" stopOpacity="0.52" />
            <stop offset="1" stopColor="#C7A7D3" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="500" cy="119" r={14 * marker} fill="rgba(214,108,51,0.16)" />
        <circle cx="500" cy="119" r={5 * marker} fill={COLORS.orange} />
      </svg>
      <div style={{position: 'absolute', right: 38, top: 118, display: 'flex', alignItems: 'flex-end', gap: 5, opacity: draw * 0.45}}>
        {bars.map((height, index) => (
          <div key={`${height}-${index}`} style={{width: 4, height: height * 0.32 * draw, borderRadius: 4, background: 'rgba(83,29,89,0.28)'}} />
        ))}
      </div>
    </div>
  );
};

export const ProductDemoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const windowIn = progress(frame, 0, 40);
  const query = 'Why did activation drop last week?';
  const typedChars = Math.floor(interpolate(frame, [34, 116], [0, query.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const result = progress(frame, 276, 34);
  const camera = interpolate(frame, [300, 470], [1, 1.045], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});
  const cameraX = interpolate(frame, [300, 470], [0, -24], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});

  return (
    <AbsoluteFill style={{padding: '90px 140px', overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 76, left: 152}}>
        <Reveal start={6} duration={28} y={10}>
          <Eyebrow>Expert playbooks, running autonomously</Eyebrow>
        </Reveal>
      </div>
      <div
        style={{
          width: 1640,
          height: 820,
          marginTop: 28,
          opacity: windowIn,
          transform: `translate(${(1 - windowIn) * 30 + cameraX}px, ${(1 - windowIn) * 52}px) scale(${(0.955 + windowIn * 0.045) * camera})`,
          transformOrigin: 'center center',
          filter: `blur(${(1 - windowIn) * 10}px)`,
        }}
      >
        <BrowserWindow style={{width: '100%', height: '100%'}}>
          <div style={{display: 'grid', gridTemplateColumns: '470px 1fr', height: 756}}>
            <div style={{padding: '36px 34px', borderRight: `1px solid ${COLORS.line}`, background: 'rgba(255,255,255,0.48)'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28}}>
                <div style={{width: 40, height: 40, borderRadius: 13, background: 'linear-gradient(135deg, #FBE0D2, #DDC7EE)', display: 'grid', placeItems: 'center'}}>
                  <Sparkles size={21} color={COLORS.plum} />
                </div>
                <div>
                  <div style={{fontFamily: SANS, fontSize: 17, fontWeight: 650, color: COLORS.ink}}>Sundial Analyst</div>
                  <div style={{fontFamily: SANS, fontSize: 13, color: COLORS.muted, marginTop: 2}}>Growth analysis playbook</div>
                </div>
              </div>
              <div style={{background: COLORS.white, border: `1px solid ${COLORS.line}`, borderRadius: 18, padding: '18px 18px', minHeight: 78, boxShadow: '0 10px 28px rgba(54,28,62,0.06)', fontFamily: SANS, fontSize: 18, lineHeight: 1.45, color: COLORS.ink}}>
                {query.slice(0, typedChars)}
                {frame < 132 ? <span style={{display: 'inline-block', width: 2, height: 20, marginLeft: 3, background: COLORS.plum, verticalAlign: '-3px', opacity: Math.floor(frame / 16) % 2 ? 0.25 : 1}} /> : null}
              </div>
              <div style={{marginTop: 28}}>
                <div style={{fontFamily: SANS, fontSize: 13, fontWeight: 700, color: 'rgba(83,29,89,0.48)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8}}>Analysis plan</div>
                <AnalysisStep index={0} label="Compare cohorts and segments" start={126} />
                <AnalysisStep index={1} label="Trace release and funnel changes" start={160} />
                <AnalysisStep index={2} label="Quantify the primary drivers" start={194} />
              </div>
              <Reveal start={230} duration={25} y={12}>
                <div style={{marginTop: 24, borderTop: `1px solid ${COLORS.line}`, paddingTop: 20, display: 'flex', alignItems: 'center', gap: 10, color: COLORS.green, fontFamily: SANS, fontSize: 15, fontWeight: 600}}>
                  <Check size={18} strokeWidth={3} /> 14 paths explored · 3 drivers found
                </div>
              </Reveal>
            </div>
            <div style={{padding: '34px 38px', position: 'relative'}}>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22}}>
                <div>
                  <div style={{fontFamily: SANS, fontSize: 25, fontWeight: 650, color: COLORS.ink}}>Activation change analysis</div>
                  <div style={{fontFamily: SANS, fontSize: 15, color: COLORS.muted, marginTop: 4}}>Week of July 7 · All workspaces</div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderRadius: 999, border: `1px solid ${COLORS.line}`, color: COLORS.muted, fontFamily: SANS, fontSize: 14}}>
                  <FileText size={16} /> Refreshable artifact
                </div>
              </div>
              <ActivationChart />
              <div style={{display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18, marginTop: 18}}>
                <div style={{background: COLORS.white, border: `1px solid ${COLORS.line}`, borderRadius: 20, padding: '23px 25px', opacity: result, transform: `translateY(${(1 - result) * 24}px)`, boxShadow: '0 18px 50px rgba(69,38,78,0.08)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 9, fontFamily: SANS, fontSize: 14, fontWeight: 700, color: COLORS.orange, textTransform: 'uppercase', letterSpacing: '0.08em'}}>
                    <Sparkles size={17} /> Primary driver
                  </div>
                  <div style={{fontFamily: SERIF, fontSize: 30, lineHeight: 1.15, fontWeight: 700, color: COLORS.plum, marginTop: 14}}>
                    Android onboarding explains 68% of the drop.
                  </div>
                  <div style={{fontFamily: SANS, fontSize: 16, lineHeight: 1.5, color: COLORS.muted, marginTop: 12}}>
                    The decline begins after the July 6 permissions flow release, concentrated in new users.
                  </div>
                </div>
                <div style={{background: 'linear-gradient(145deg, rgba(83,29,89,0.96), rgba(39,17,43,0.98))', borderRadius: 20, padding: '23px 25px', opacity: result, transform: `translateY(${(1 - result) * 34}px)`, color: COLORS.white}}>
                  <div style={{fontFamily: SANS, fontSize: 14, opacity: 0.62}}>Opportunity recovered</div>
                  <div style={{fontFamily: SANS, fontSize: 42, fontWeight: 600, letterSpacing: '-0.04em', marginTop: 8}}>+12.6k</div>
                  <div style={{fontFamily: SANS, fontSize: 15, opacity: 0.72, lineHeight: 1.4, marginTop: 8}}>activated users / month</div>
                </div>
              </div>
              <div style={{position: 'absolute', right: 24, bottom: 14, fontFamily: SANS, fontSize: 11, color: 'rgba(83,29,89,0.35)'}}>Illustrative analysis</div>
            </div>
          </div>
        </BrowserWindow>
      </div>
    </AbsoluteFill>
  );
};

export const TrustScene: React.FC = () => {
  const frame = useCurrentFrame();
  const card = progress(frame, 24, 36);
  const scan = interpolate(frame, [80, 250], [-40, 560], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  return (
    <AbsoluteFill style={{padding: '150px 170px'}}>
      <div style={{display: 'grid', gridTemplateColumns: '0.95fr 1.05fr', gap: 120, alignItems: 'center', height: '100%'}}>
        <div>
          <Reveal start={8} duration={28} y={12}><Eyebrow>Enterprise trust, built in</Eyebrow></Reveal>
          <Reveal start={24} duration={34} y={28}>
            <Headline size={86}>Fast answers.<br /><span style={{fontFamily: SERIF, fontWeight: 700}}>Visible reasoning.</span></Headline>
          </Reveal>
          <Reveal start={70} duration={30} y={16}>
            <div style={{fontFamily: SANS, fontSize: 25, lineHeight: 1.5, color: 'rgba(83,29,89,0.63)', maxWidth: 650, marginTop: 30}}>
              Confidence, source citations, and an observable analysis trail—so every answer can earn trust.
            </div>
          </Reveal>
        </div>
        <div
          style={{
            ...glass,
            position: 'relative',
            borderRadius: 30,
            padding: 34,
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.94)',
            backdropFilter: 'none',
            boxShadow: '0 36px 90px rgba(83,29,89,0.18)',
            opacity: card,
            transform: `translateY(${(1 - card) * 54}px) rotateY(${(1 - card) * -8}deg) scale(${0.95 + card * 0.05})`,
          }}
        >
          <div style={{position: 'absolute', top: 0, left: scan, width: 150, height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.66), transparent)', transform: 'skewX(-14deg)', opacity: 0.7}} />
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative'}}>
            <div>
              <div style={{fontFamily: SANS, fontSize: 15, color: COLORS.muted}}>Answer quality</div>
              <div style={{fontFamily: SANS, fontSize: 28, fontWeight: 650, color: COLORS.ink, marginTop: 4}}>Evidence check complete</div>
            </div>
            <ConfidenceBadge start={66} />
          </div>
          <div style={{height: 1, background: COLORS.line, margin: '28px 0 24px'}} />
          <div style={{display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20}}>
            <div style={{width: 42, height: 42, borderRadius: 13, background: COLORS.greenSoft, display: 'grid', placeItems: 'center'}}><ShieldCheck size={23} color={COLORS.green} /></div>
            <div>
              <div style={{fontFamily: SANS, fontSize: 18, fontWeight: 650, color: COLORS.ink}}>3 claims verified</div>
              <div style={{fontFamily: SANS, fontSize: 14, color: COLORS.muted, marginTop: 2}}>Warehouse lineage and business context agree</div>
            </div>
          </div>
          <div style={{display: 'grid', gap: 12}}>
            <CitationRow index={1} label="workspace_activation_daily" detail="Snowflake · refreshed 4 min ago" start={98} />
            <CitationRow index={2} label="Onboarding release #4821" detail="GitHub · merged July 6" start={120} />
            <CitationRow index={3} label="Activation metric definition" detail="Sundial context layer · governed" start={142} />
          </div>
          <Reveal start={176} duration={28} y={12}>
            <div style={{marginTop: 22, padding: '16px 18px', borderRadius: 16, background: 'rgba(83,29,89,0.055)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{fontFamily: SANS, fontSize: 16, color: COLORS.plum, fontWeight: 600}}>Open the full analysis trail</div>
              <ArrowRight size={20} color={COLORS.plum} />
            </div>
          </Reveal>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const integrations = [
  {label: 'Slack', src: 'slack.svg', x: -480, y: -82, width: 42},
  {label: 'ChatGPT', src: 'logos/chatgpt.png', x: -290, y: 198, width: 46},
  {label: 'Claude', src: 'logos/claude.png', x: 288, y: 198, width: 128},
  {label: 'Notion', src: 'notion.svg', x: 488, y: -82, width: 42},
] as const;

export const EverywhereScene: React.FC = () => {
  const frame = useCurrentFrame();
  const center = progress(frame, 20, 34, Easing.bezier(0.34, 1.4, 0.64, 1));
  const ring = progress(frame, 54, 70);
  return (
    <AbsoluteFill style={{display: 'grid', placeItems: 'center', overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 106, textAlign: 'center'}}>
        <Reveal start={0} duration={28} y={12}><Eyebrow>One analyst. Every interface.</Eyebrow></Reveal>
        <Reveal start={16} duration={34} y={20}>
          <Headline size={78} align="center">Ask Sundial <span style={{fontFamily: SERIF, fontWeight: 700}}>wherever you work.</span></Headline>
        </Reveal>
      </div>
      <div style={{position: 'relative', width: 1260, height: 580, marginTop: 150}}>
        <svg width="1260" height="580" style={{position: 'absolute', inset: 0}}>
          {integrations.map((item, index) => {
            const x = 630 + item.x;
            const y = 280 + item.y;
            const p = progress(frame, 70 + index * 15, 35);
            return <path key={item.label} d={`M630 280 C${630 + item.x * 0.35} ${280 + item.y * 0.12}, ${630 + item.x * 0.68} ${280 + item.y * 0.9}, ${x} ${y}`} fill="none" stroke="rgba(83,29,89,0.18)" strokeWidth="2" strokeDasharray="8 9" strokeDashoffset={40 * (1 - p)} opacity={p} />;
          })}
          <circle cx="630" cy="280" r={180 * ring} fill="none" stroke="rgba(83,29,89,0.08)" strokeWidth="1" />
          <circle cx="630" cy="280" r={255 * ring} fill="none" stroke="rgba(83,29,89,0.055)" strokeWidth="1" />
        </svg>
        <div style={{position: 'absolute', left: 630, top: 280, transform: `translate(-50%, -50%) scale(${0.74 + center * 0.26})`, opacity: center}}>
          <div style={{width: 180, height: 180, borderRadius: 50, padding: 28, background: 'linear-gradient(145deg, #FFF4EC, #E4D6F3)', border: '1px solid rgba(83,29,89,0.12)', boxShadow: '0 35px 100px rgba(83,29,89,0.25), inset 0 1px 0 #fff', display: 'grid', placeItems: 'center'}}>
            <Img src={staticFile('sundial.svg')} style={{width: 108, height: 98}} />
          </div>
          <div style={{fontFamily: SANS, fontSize: 18, fontWeight: 650, color: COLORS.plum, textAlign: 'center', marginTop: 16}}>Sundial context</div>
        </div>
        {integrations.map((item, index) => {
          const p = progress(frame, 78 + index * 15, 30, Easing.bezier(0.34, 1.32, 0.64, 1));
          return (
            <div key={item.label} style={{position: 'absolute', left: 630 + item.x, top: 280 + item.y, transform: `translate(-50%, -50%) scale(${0.78 + p * 0.22})`, opacity: p}}>
              <div style={{...glass, minWidth: item.label === 'Claude' ? 230 : 190, height: 100, borderRadius: 24, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16}}>
                <Img
                  src={staticFile(item.src)}
                  style={{
                    width: item.width,
                    height: 42,
                    objectFit: 'contain',
                    filter: item.label === 'ChatGPT' ? 'brightness(0)' : undefined,
                  }}
                />
                {item.label === 'Claude' ? null : (
                  <div style={{fontFamily: SANS, fontSize: 20, fontWeight: 600, color: COLORS.ink}}>{item.label}</div>
                )}
              </div>
            </div>
          );
        })}
        <Reveal start={150} duration={32} y={18} style={{position: 'absolute', left: '50%', bottom: 14, transform: 'translateX(-50%)'}}>
          <div style={{width: 790, background: 'rgba(255,255,255,0.92)', border: `1px solid ${COLORS.line}`, borderRadius: 22, boxShadow: '0 24px 60px rgba(65,32,75,0.14)', padding: '19px 22px', display: 'flex', alignItems: 'center', gap: 14}}>
            <Search size={22} color="rgba(83,29,89,0.48)" />
            <div style={{fontFamily: SANS, fontSize: 19, color: COLORS.ink, flex: 1}}>What changed in activation, and what should we do next?</div>
            <div style={{width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center', background: COLORS.plum, color: '#fff'}}><ArrowRight size={20} /></div>
          </div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};

export const ProofScene: React.FC = () => {
  const frame = useCurrentFrame();
  const arrow = progress(frame, 80, 58, easeOut);
  const minutes = progress(frame, 118, 34, Easing.bezier(0.34, 1.45, 0.64, 1));
  return (
    <AbsoluteFill style={{display: 'grid', placeItems: 'center'}}>
      <div style={{width: 1550, textAlign: 'center'}}>
        <Reveal start={2} duration={28} y={12}><Eyebrow>From reactive to responsive</Eyebrow></Reveal>
        <Reveal start={18} duration={34} y={22}>
          <Headline size={84} align="center">Root-cause analysis, <span style={{fontFamily: SERIF, fontWeight: 700}}>at AI speed.</span></Headline>
        </Reveal>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 66, marginTop: 78}}>
          <Reveal start={50} duration={28} y={20}>
            <div style={{...glass, width: 430, padding: '34px 38px', borderRadius: 28, textAlign: 'left'}}>
              <div style={{fontFamily: SANS, fontSize: 18, color: COLORS.muted}}>Before Sundial</div>
              <div style={{fontFamily: SANS, fontSize: 72, lineHeight: 1, letterSpacing: '-0.055em', fontWeight: 500, color: COLORS.ink, marginTop: 12}}>2–3 days</div>
              <div style={{fontFamily: SANS, fontSize: 18, lineHeight: 1.45, color: COLORS.muted, marginTop: 18}}>Manual pulls, SQL, notebooks, and hypothesis-by-hypothesis work.</div>
            </div>
          </Reveal>
          <div style={{width: 150, height: 80, position: 'relative'}}>
            <div style={{position: 'absolute', top: 39, left: 0, width: 120 * arrow, height: 3, borderRadius: 3, background: COLORS.plum}} />
            <ArrowRight size={42} color={COLORS.plum} style={{position: 'absolute', right: 0, top: 20, opacity: arrow, transform: `translateX(${(1 - arrow) * -20}px)`}} />
          </div>
          <div style={{opacity: minutes, transform: `translateY(${(1 - minutes) * 30}px) scale(${0.88 + minutes * 0.12})`}}>
            <div style={{width: 430, padding: '34px 38px', borderRadius: 28, textAlign: 'left', background: 'linear-gradient(145deg, #5C2562, #28112C)', color: '#fff', boxShadow: '0 36px 90px rgba(83,29,89,0.3)'}}>
              <div style={{fontFamily: SANS, fontSize: 18, color: 'rgba(255,255,255,0.62)'}}>With Sundial</div>
              <div style={{fontFamily: SERIF, fontSize: 76, lineHeight: 1, letterSpacing: '-0.055em', fontWeight: 700, marginTop: 12}}>Minutes</div>
              <div style={{fontFamily: SANS, fontSize: 18, lineHeight: 1.45, color: 'rgba(255,255,255,0.66)', marginTop: 18}}>One expert playbook explores the paths, verifies the evidence, and synthesizes the why.</div>
            </div>
          </div>
        </div>
        <Reveal start={164} duration={28} y={10}>
          <div style={{fontFamily: SANS, fontSize: 18, color: 'rgba(83,29,89,0.5)', marginTop: 40}}>Based on Sundial’s OpenAI customer story</div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const dark = progress(frame, 0, 50, easeOut);
  const cta = progress(frame, 138, 28, Easing.bezier(0.34, 1.35, 0.64, 1));
  return (
    <AbsoluteFill style={{background: `rgba(36,16,40,${dark})`, display: 'grid', placeItems: 'center', overflow: 'hidden'}}>
      <div style={{position: 'absolute', width: 1050, height: 1050, borderRadius: '50%', background: 'radial-gradient(circle, rgba(159,104,166,0.34), rgba(36,16,40,0) 68%)', transform: 'translateY(-260px)'}} />
      <div style={{position: 'relative', textAlign: 'center', width: 1580, marginTop: -24}}>
        <Reveal start={24} duration={32} y={22}>
          <div style={{display: 'flex', justifyContent: 'center'}}><Wordmark light /></div>
        </Reveal>
        <Reveal start={56} duration={34} y={24}>
          <div style={{fontFamily: SERIF, fontSize: 76, lineHeight: 1.03, letterSpacing: '-0.05em', fontWeight: 700, color: '#fff', marginTop: 30}}>
            Give every decision-maker<br />a world-class analyst.
          </div>
        </Reveal>
        <Reveal start={104} duration={28} y={12}>
          <div style={{fontFamily: SANS, fontSize: 23, color: 'rgba(255,255,255,0.62)', marginTop: 26}}>Trust the answer. Understand the why. Move faster.</div>
        </Reveal>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, marginTop: 38, background: '#fff', color: COLORS.plum, fontFamily: SANS, fontSize: 22, fontWeight: 700, padding: '17px 27px 17px 31px', borderRadius: 999, boxShadow: '0 20px 60px rgba(0,0,0,0.28)', opacity: cta, transform: `translateY(${(1 - cta) * 18}px) scale(${0.9 + cta * 0.1})`}}>
          Try Sundial <ArrowRight size={22} />
        </div>
        <Reveal start={174} duration={26} y={12}>
          <div style={{fontFamily: SANS, fontSize: 14, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.42)', marginTop: 52, marginBottom: 22}}>Trusted by teams moving at AI speed</div>
          <CustomerLogos start={160} dark />
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};
