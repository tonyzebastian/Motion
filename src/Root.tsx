import "./index.css";
import { Composition, Folder } from "remotion";
import { ChatToSQLScene } from "./scenes/ChatToSQL";
import { ChatToDAUScene } from "./scenes/ChatToDAU";
import { MobileNotificationScene } from "./scenes/MobileNotification";

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
      </Folder>
    </>
  );
};
