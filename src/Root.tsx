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
import { PlaybooksAngle2Scene } from "./scenes/PlaybooksAngle2";
import { PlaybooksAngle2_1Scene } from "./scenes/PlaybooksAngle2_1";
import {
  Release2026Scene2,
  release2026Scene2Schema,
} from "./scenes/Release-2026/Scene-2";
import {
  Release2026Scene4,
  release2026Scene4Schema,
} from "./scenes/Release-2026/Scene-4";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Release-2026">
        <Composition
          id="Scene-2"
          component={Release2026Scene2}
          schema={release2026Scene2Schema}
          durationInFrames={360}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{
            centerLineOne: "Spreadsheets. Dashboards.",
            centerLineTwo: "Counts on top of counts.",
            backgroundColor: "#F8F6F3",
            patternColor: "#875E8C",
            patternOpacity: 0.16,
            cardColors: [
              "#D9A7A0",
              "#E7C78F",
              "#B8C99D",
              "#94B8C7",
              "#AAA2CC",
              "#D9A7C2",
              "#E0B18A",
              "#A8C9BE",
              "#9FB0D0",
              "#C7A6D2",
              "#D6C59C",
              "#A7C2A4",
            ],
            imageSources: [
              "release-2026/scene-01/image_01.png",
              "release-2026/scene-01/image_02.png",
              "release-2026/scene-01/image_03.png",
              "release-2026/scene-01/image_04.png",
              "release-2026/scene-01/image_05.png",
              "release-2026/scene-01/image_06.png",
              "release-2026/scene-01/image_07.png",
              "release-2026/scene-01/image_08.png",
              "release-2026/scene-01/image_09.png",
            ],
            direction: "clockwise" as const,
            orbitSpeed: 0.125,
          }}
        />
        <Composition
          id="Scene-4"
          component={Release2026Scene4}
          schema={release2026Scene4Schema}
          durationInFrames={480}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{
            backgroundColor: "#F8F6F3",
            patternColor: "#875E8C",
            patternOpacity: 0.16,
            iconSource: "release-2026/scene-04/ai-icon.png",
            initialQuestionIndex: 5,
            questions: [
              "What matters most is…",
              "That sounds right, but it actually isn’t…",
              "This approach won’t scale because…",
              "The data points to…",
              "What you're looking for is…",
              "Why are we losing customers?",
              "What separates the people who stay from the ones who...",
              "Did that campaign actually work?",
              "That's a common assumption, but actually…",
              "The underlying cause is…",
              "The data clearly shows…",
            ],
          }}
        />
      </Folder>

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
      </Folder>
    </>
  );
};
