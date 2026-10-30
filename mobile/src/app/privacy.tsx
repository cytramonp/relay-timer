import React from "react";
import { Stack, router } from "expo-router";
import { Action, Body, Heading, Page } from "../components/ui";

export default function PrivacyScreen() {
  return (
    <Page>
      <Stack.Screen options={{ title: "Privacy & data" }} />
      <Heading>Your agenda stays yours.</Heading>
      <Body>
        Meeting agendas, notes, history, specialty boards, favorites, saved
        setups and company logos stay on this device unless you export them or
        explicitly create a live link. This version does not synchronize your
        private library with the website.
      </Body>
      <Heading>Trial, Free and Pro</Heading>
      <Body>
        To check your plan and count starts, Firebase Authentication creates a
        persistent anonymous identifier. Cloudflare Workers and D1 receive that
        identifier, random session IDs, timestamps and usage counts. Meeting
        names, notes and timer contents are not included. Starting a new session
        requires a connection; a running timer can continue offline.
      </Body>
      <Body>
        When Google Play purchases are enabled, Google processes payment. The
        verification server receives the purchase token, product, current
        subscription state and expiry date. It checks with Google before
        granting Pro. Card details are never entered into CorpTimer. Restore
        purchases uses your current Google Play account.
      </Body>
      <Heading>Optional sharing and feedback</Heading>
      <Body>
        Live links publish the meeting title, agenda and countdown through
        Firebase to anyone holding the link. Notes and reports are excluded.
        Stop sharing revokes the projection; access expires after 24 hours.
        Expiry is an access limit and does not promise physical deletion.
      </Body>
      <Body>
        Sending feedback sends your message, optional reply email, category, app
        version and platform to Web3Forms and our support inbox. Unsent drafts
        remain on your device. The configured Web3Forms retention is three
        years; mailbox deletion is managed by support.
      </Body>
      <Heading>Permissions and choices</Heading>
      <Body>
        Notifications are optional local reminders. Floating mode uses a visible
        Android service and display-over-other-apps permission. CorpTimer does
        not record your microphone, screen or other apps, use precise location,
        or include advertising or analytics. Logo selection uses the system file
        picker.
      </Body>
      <Body>
        Remove local programs and history in the app, or export before clearing
        app storage. Android automatic app backup is disabled in this version.
        Contact support for access-data deletion or a privacy request. Deleting
        app data does not cancel a Google Play subscription: manage it in Google
        Play.
      </Body>
      <Action
        label="Privacy request or support"
        onPress={() => router.push("/feedback")}
      />
      <Action label="Your plan" onPress={() => router.push("/pro")} />
    </Page>
  );
}
