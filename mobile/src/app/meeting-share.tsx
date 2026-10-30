import React from "react";
import { Linking, Share, View } from "react-native";
import { Stack } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import { Action, Body, Field, Heading, Page, Row } from "../components/ui";
import { useLive } from "../state/live-store";
import { useApp } from "../state/app-store";
import { useTheme } from "../theme";
export default function ShareSheet() {
  const live = useLive(),
    { notify } = useApp(),
    t = useTheme();
  async function task(fn: () => Promise<unknown>) {
    try {
      await fn();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not share this link.");
    }
  }
  return (
    <Page>
      <Stack.Screen
        options={{ title: "Share live", presentation: "formSheet" }}
      />
      <Heading>One timer. Every screen.</Heading>
      <Body>
        Anyone with the viewer link can see the meeting title, agenda and
        countdown. Notes, owners and reports stay private.
      </Body>
      <Body muted>
        Keep CorpTimer open while hosting. Links expire after 24 hours.
        Suspended apps cannot maintain a live connection.
      </Body>
      {!live.host ? (
        <Action
          label={live.busy ? "Creating link…" : "Create live link"}
          tone="primary"
          disabled={live.busy}
          onPress={() => void live.create()}
        />
      ) : (
        <>
          <View
            style={{
              padding: 20,
              backgroundColor: t.cream,
              alignSelf: "center",
              borderRadius: 12,
            }}
          >
            <QRCode
              value={live.viewer}
              size={180}
              backgroundColor={t.cream}
              color={t.clock}
            />
          </View>
          <Field
            label="Viewer link"
            value={live.viewer}
            editable={false}
            selectTextOnFocus
          />
          <Row>
            <Action
              label="Copy viewer link"
              onPress={() =>
                void task(async () => {
                  await Clipboard.setStringAsync(live.viewer);
                  notify("Viewer link copied.");
                })
              }
            />
            <Action
              label="Share link"
              onPress={() =>
                void task(() => Share.share({ message: live.viewer }))
              }
            />
            <Action
              label="Open live screen"
              onPress={() => void task(() => Linking.openURL(live.viewer))}
            />
          </Row>
          <Heading>A co-host on another device?</Heading>
          <Body>
            The control link allows Next, Pause, Undo and Extend. Only send it
            to someone you trust.
          </Body>
          <Row>
            <Action
              label="Copy control link"
              onPress={() =>
                void task(async () => {
                  await Clipboard.setStringAsync(live.controller);
                  notify(
                    "Control link copied. Share it only with a trusted co-host.",
                  );
                })
              }
            />
            <Action
              label="Open control screen"
              onPress={() => void task(() => Linking.openURL(live.controller))}
            />
          </Row>
          <Action
            label={live.busy ? "Stopping…" : "Stop sharing & revoke links"}
            tone="danger"
            disabled={live.busy}
            onPress={() => void task(live.stop)}
          />
        </>
      )}
      {live.error ? (
        <Body style={{ color: t.dangerText }}>{live.error}</Body>
      ) : null}
    </Page>
  );
}
