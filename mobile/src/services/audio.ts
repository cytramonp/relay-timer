import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import type { Config } from "../core/types";

const sounds = {
  bell: require("../../assets/bell.wav"),
  gong: require("../../assets/gong.wav"),
  beep: require("../../assets/beep.wav"),
};
let player: AudioPlayer | null = null;
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
