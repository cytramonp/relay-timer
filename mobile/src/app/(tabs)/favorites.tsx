import React from "react";
import { Page } from "../../components/ui";
import { SpecialtyLibrary } from "../../components/timer-library";
export default function FavoritesScreen() {
  return (
    <Page>
      <SpecialtyLibrary favoritesOnly />
    </Page>
  );
}
