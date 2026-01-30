import "./index.css";
import { Composition, Folder } from "remotion";
import { ChatToSQLScene } from "./scenes/ChatToSQL";

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
      </Folder>
    </>
  );
};
