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
      </Folder>
    </>
  );
};
