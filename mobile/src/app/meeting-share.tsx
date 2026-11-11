import { useTranslate } from "../state/language";
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
  const tr = useTranslate();
  const live = useLive(),
    { notify } = useApp(),
    t = useTheme();
  async function task(fn: () => Promise<unknown>) {
    try {
      await fn();
    } catch (e) {
      notify(e instanceof Error ? e.message : tr("Could not share this link."));
    }
  }
  return (
    <Page>
      <Stack.Screen
        options={{ title: tr("Share live"), presentation: "formSheet" }}
      />
      <Heading>{tr("One timer. Every screen.")}</Heading>
      <Body>
        {tr(
          "Anyone with the viewer link can see the meeting title, agenda and countdown. Notes, owners and reports stay private.",
        )}
      </Body>
      <Body muted>
        {tr(
          "Keep CorpTimer open while hosting. Links expire after 24 hours. Suspended apps cannot maintain a live connection.",
        )}
      </Body>
      {!live.host ? (
        <Action
          label={live.busy ? tr("Creating link…") : tr("Create live link")}
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
            label={tr("Viewer link")}
            value={live.viewer}
            editable={false}
            selectTextOnFocus
          />
          <Row>
            <Action
              label={tr("Copy viewer link")}
              onPress={() =>
                void task(async () => {
                  await Clipboard.setStringAsync(live.viewer);
                  notify(tr("Viewer link copied."));
                })
              }
            />
            <Action
              label={tr("Share link")}
              onPress={() =>
                void task(() => Share.share({ message: live.viewer }))
              }
            />
            <Action
              label={tr("Open live screen")}
              onPress={() => void task(() => Linking.openURL(live.viewer))}
            />
          </Row>
          <Heading>{tr("A co-host on another device?")}</Heading>
          <Body>
            {tr(
              "The control link allows Next, Pause, Undo and Extend. Only send it to someone you trust.",
            )}
          </Body>
          <Row>
            <Action
              label={tr("Copy control link")}
              onPress={() =>
                void task(async () => {
                  await Clipboard.setStringAsync(live.controller);
                  notify(
                    tr(
                      "Control link copied. Share it only with a trusted co-host.",
                    ),
                  );
                })
              }
            />
            <Action
              label={tr("Open control screen")}
              onPress={() => void task(() => Linking.openURL(live.controller))}
            />
          </Row>
          <Action
            label={
              live.busy ? tr("Stopping…") : tr("Stop sharing & revoke links")
            }
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
