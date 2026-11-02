import React from "react";
import { Stack, router } from "expo-router";
import { Action, Body, Heading, Page, Rule } from "../components/ui";
import { customRecipes } from "../core/custom-recipes";
import { Image } from "expo-image";

const illustrations = [
  {
    source: require("../../docs/custom-timers/screenshots/01-catalog.png"),
    label: "Timers: Create your timer above the complete catalog",
  },
  {
    source: require("../../docs/custom-timers/screenshots/03-stage-editor.png"),
    label: "Editing the name and duration of a stage",
  },
  {
    source: require("../../docs/custom-timers/screenshots/04-fullscreen.png"),
    label: "A custom timer in full screen",
  },
];

const steps = [
  [
    "1. Start with your own timer",
    "Open Timers → Create your timer. Choose Customize timer. You can start with the Focus / Break example or choose one of the ten recipe examples. Each recipe creates a separate saved timer in Library, ready for you to edit.",
  ],
  [
    "2. Name the clock",
    "Pause the clock before editing. Open Edit and give it a short, recognizable name, such as Boxing · evening session. This name identifies your clock when you return to it.",
  ],
  [
    "3. Build the stages",
    "Each stage has a name and duration. Add stages for preparation, work, rest or cleanup. Use the duration dial or type the exact time. Move stages up or down to set their order. Remove stages you do not need. The list runs from top to bottom.",
  ],
  [
    "4. Choose sounds",
    "Set the signal for each stage: bell, gong, beep or silent. For a personal signal, upload an audio file under Colors & company logo / Your sound, then select My sound for a stage. Preview it before starting. Keep sounds short so the next cue does not interrupt a long track.",
  ],
  [
    "5. Add your colors and logo",
    "Customize timer lets you choose a highlight and upload a company logo. Use a PNG, JPEG or WebP. Settings → Colors & company logo applies the overall color theme and logo across timers. Individual custom designs can have their own highlight. These editing features are included in Trial and Pro.",
  ],
  [
    "6. Save and reuse",
    "Save setup keeps the current configuration. Save as new timer creates a separate timer in Library, so making an Egg timer does not overwrite your Boxing timer. Export setup makes a portable JSON file. Import it on another device, or use Settings → Export device backup for all your local data.",
  ],
  [
    "7. Test before the real session",
    "Start a short rehearsal. Check stage order, duration, sound and automatic transitions. Pause and resume, then open Full screen on the dark clock panel. Try with your device volume and notification settings. Custom sounds and spoken cues play while the app is open; background alerts use the system notification sound.",
  ],
  [
    "8. Find it next time",
    "Open Library for saved setups and session history. Timers shows the complete catalog; Group timers organizes it into categories. Use the star on a catalog card to add it to Favorites.",
  ],
];
export default function TimerGuide() {
  return (
    <Page>
      <Stack.Screen options={{ title: "Create your timer · guide" }} />
      <Heading>A timer for your routine.</Heading>
      <Body>
        Build a useful sequence from simple stages. Start with an example, then
        make it yours.
      </Body>
      <Action
        label="Create your timer"
        tone="primary"
        onPress={() => router.push("/specialty/custom-timer")}
      />
      {steps.map(([title, text], i) => (
        <React.Fragment key={title}>
          <Rule />
          <Heading>{title}</Heading>
          <Body>{text}</Body>
          {[0, 2, 6].includes(i) ? (
            <>
              <Image
                source={illustrations[[0, 2, 6].indexOf(i)].source}
                accessibilityLabel={illustrations[[0, 2, 6].indexOf(i)].label}
                contentFit="contain"
                style={{ width: "100%", height: 360 }}
              />
              <Body muted>
                {illustrations[[0, 2, 6].indexOf(i)].label}. Local demo capture;
                device layout may vary.
              </Body>
            </>
          ) : null}
        </React.Fragment>
      ))}
      <Rule />
      <Heading>Ten ideas to build</Heading>
      {customRecipes.map((recipe) => (
        <React.Fragment key={recipe.id}>
          <Heading>{recipe.title}</Heading>
          <Body>
            {recipe.stages
              .map(
                (s) =>
                  `${s.name}: ${Math.floor(s.seconds / 60)}m ${s.seconds % 60}s`,
              )
              .join(" → ")}
          </Body>
        </React.Fragment>
      ))}
      <Body muted>
        Recipes are editable examples, not cooking, exercise or medical
        instructions. Set durations appropriate to your activity.
      </Body>
    </Page>
  );
}
