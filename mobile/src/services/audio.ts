import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import type { Config } from "../core/types";
import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";

const sounds = {
  bell: require("../../assets/bell.wav"),
  gong: require("../../assets/gong.wav"),
  beep: require("../../assets/beep.wav"),
};
let player: AudioPlayer | null = null;
let dialPlayer: AudioPlayer | null = null;
let lastDetent = 0;
let customSource: { data: string; uri: string } | null = null;
export async function playCustomCue(uri: string, volume = 100) {
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: "mixWithOthers",
  });
  player?.remove();
  // AVPlayer expects a file URL, not a data URI. Keep the portable asset in
  // setup data, but materialize just the current cue in disposable cache.
  if (Platform.OS !== "web" && uri.startsWith("data:audio/")) {
    if (customSource?.data !== uri) {
      const encoded = uri.slice(uri.indexOf(",") + 1);
      const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
      const subtype = uri.slice(11, uri.indexOf(";"));
      const extension =
        subtype === "mpeg" || subtype === "mp3"
          ? "mp3"
          : subtype === "mp4"
            ? "m4a"
            : subtype === "x-wav"
              ? "wav"
              : subtype;
      const file = new File(Paths.cache, `corptimer-custom-cue.${extension}`);
      await file.write(bytes);
      customSource = { data: uri, uri: file.uri };
    }
    uri = customSource.uri;
  }
  player = createAudioPlayer({ uri });
  player.volume = Math.max(0, Math.min(100, volume)) / 100;
  player.play();
}
export function dialFeedback(haptics: boolean, sound: boolean) {
  if (Date.now() - lastDetent < 55) return;
  lastDetent = Date.now();
  if (haptics) void Haptics.selectionAsync().catch(() => {});
  if (sound) playDialClick();
}
/** One reusable player; no allocation or audio-mode changes on every detent. */
export function playDialClick() {
  try {
    dialPlayer ??= createAudioPlayer(require("../../assets/dial-click.wav"));
    dialPlayer.volume = 0.32;
    const click = dialPlayer;
    void click
      .seekTo(0)
      .then(() => click.play())
      .catch(() => {});
  } catch {
    /* Unsupported/silent audio must never block setting a duration. */
  }
}
export async function playCue(config: Config, name = "", haptics = true) {
  if (haptics)
    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success,
    ).catch(() => {});
  if (config.sound !== "off" && config.volume > 0) {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: "mixWithOthers",
    });
    player?.remove();
    player = createAudioPlayer(sounds[config.sound]);
    player.volume = config.volume / 100;
    player.play();
  }
  if (config.voice && name) {
    Speech.stop();
    Speech.speak(name, { language: "en-US" });
  }
}
