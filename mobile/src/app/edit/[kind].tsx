import React from "react";
import { useLocalSearchParams } from "expo-router";
import { isKind } from "../../core/backup";
import { EditorScreen } from "../../screens/editor";
import { Body, Page } from "../../components/ui";
export default function EditorRoute() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  return isKind(kind) ? (
    <EditorScreen kind={kind} />
  ) : (
    <Page>
      <Body>This timer does not exist.</Body>
    </Page>
  );
}
