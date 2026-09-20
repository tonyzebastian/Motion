import "./index.css";
import { Composition, Folder } from "remotion";
import { ChatToSQLScene } from "./scenes/ChatToSQL";
import { ChatToSQLVoiceModeScene } from "./scenes/ChatToSQLVoiceMode";
import { ChatToDAUScene } from "./scenes/ChatToDAU";
import { MobileNotificationScene } from "./scenes/MobileNotification";
import { MobileNotificationCompactScene } from "./scenes/MobileNotificationCompact";
import { ForwardDeploymentScene } from "./scenes/ForwardDeployment";
import { RichContextScene } from "./scenes/RichContext";
import { GoldenTableScene } from "./scenes/GoldenTable";
import { PlaybooksScene } from "./scenes/Playbooks";
import { PlaybooksCleanScene } from "./scenes/PlaybooksClean";
import { PlaybooksAngle2Scene } from "./scenes/PlaybooksAngle2";
import { PlaybooksAngle2_1Scene } from "./scenes/PlaybooksAngle2_1";
import { PlaybooksTrustSignalScene } from "./scenes/PlaybooksTrustSignal";
import { PlaybooksCitationsScene } from "./scenes/PlaybooksCitations";
import {
  SundialReel2026Scene,
  SUNDIAL_REEL_2026_DURATION,
} from "./scenes/SundialReel2026";
import {
  SundialLaunch30Scene,
  SUNDIAL_LAUNCH_30_DURATION,
} from "./scenes/SundialLaunch30";
import {
  WorldClassAnalystScene,
  WORLD_CLASS_ANALYST_DURATION,
} from "./scenes/WorldClassAnalyst";
import { SundialLogoScene, SUNDIAL_LOGO_DURATION } from "./scenes/SundialLogo";
import { RisoBouquetScene, RISO_BOUQUET_DURATION } from "./scenes/RisoCanvas";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Sundial Demo Scenes */}
      <Folder name="Sundial-Scenes">
        <Composition
          id="ChatToSQL"
          component={ChatToSQLScene}
          durationInFrames={370}
          fps={30}
          width={1200}
          height={900}
        />
        <Composition
          id="ChatToSQLVoiceMode"
          component={ChatToSQLVoiceModeScene}
          durationInFrames={450}
          fps={30}
          width={1200}
          height={900}
        />
        <Composition
          id="ChatToDAU"
          component={ChatToDAUScene}
          durationInFrames={320}
          fps={30}
          width={1200}
          height={900}
        />
        <Composition
          id="MobileNotification"
          component={MobileNotificationScene}
          durationInFrames={160}
          fps={30}
          width={360}
          height={780}
        />
        <Composition
          id="MobileNotificationCompact"
          component={MobileNotificationCompactScene}
          durationInFrames={120}
          fps={30}
          width={360}
          height={550}
        />
        <Composition
          id="ForwardDeployment"
          component={ForwardDeploymentScene}
          durationInFrames={180}
          fps={30}
          width={600}
          height={600}
        />
        <Composition
          id="RichContextAnimation"
          component={RichContextScene}
          durationInFrames={510}
          fps={30}
          width={600}
          height={600}
        />
        <Composition
          id="GoldenTable"
          component={GoldenTableScene}
          durationInFrames={288}
          fps={30}
          width={600}
          height={600}
        />
      </Folder>

      {/* Product Video Scenes */}
      <Folder name="ProductVideos">
        <Composition
          id="Playbooks"
          component={PlaybooksScene}
          durationInFrames={1310}
          fps={30}
          width={1280}
          height={900}
        />
        <Composition
          id="PlaybooksClean"
          component={PlaybooksCleanScene}
          durationInFrames={1310}
          fps={30}
          width={1168}
          height={668}
        />
        <Composition
          id="PlaybooksAngle2"
          component={PlaybooksAngle2Scene}
          durationInFrames={380}
          fps={30}
          width={1280}
          height={900}
        />
        <Composition
          id="PlaybooksAngle2-1"
          component={PlaybooksAngle2_1Scene}
          durationInFrames={380}
          fps={30}
          width={1280}
          height={900}
        />
        <Composition
          id="PlaybooksTrustSignal"
          component={PlaybooksTrustSignalScene}
          durationInFrames={640}
          fps={60}
          width={1280}
          height={900}
        />
        <Composition
          id="PlaybooksCitations"
          component={PlaybooksCitationsScene}
          durationInFrames={340}
          fps={60}
          width={1280}
          height={900}
        />
      </Folder>

      {/* Reels */}
      <Folder name="Reels">
        <Composition
          id="SundialLaunch30"
          component={SundialLaunch30Scene}
          durationInFrames={SUNDIAL_LAUNCH_30_DURATION}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="SundialReel2026"
          component={SundialReel2026Scene}
          durationInFrames={SUNDIAL_REEL_2026_DURATION}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="WorldClassAnalyst"
          component={WorldClassAnalystScene}
          durationInFrames={WORLD_CLASS_ANALYST_DURATION}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="SundialLogo"
          component={SundialLogoScene}
          durationInFrames={SUNDIAL_LOGO_DURATION}
          fps={60}
          width={1920}
          height={1080}
        />
      </Folder>

      <Folder name="Riso-Canvas">
        <Composition
          id="RisoBouquet"
          component={RisoBouquetScene}
          durationInFrames={RISO_BOUQUET_DURATION}
          fps={30}
          width={1200}
          height={1500}
          defaultProps={{}}
        />
      </Folder>
    </>
  );
};
