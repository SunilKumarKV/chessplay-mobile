import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateView";
import { TextField } from "@/components/TextField";
import { openingsApi } from "@/services/api/client";

export default function OpeningsScreen() {
  const [queryText, setQueryText] = useState("");
  const openings = useQuery({
    queryKey: ["openings", queryText],
    queryFn: () => openingsApi.search(queryText, 20)
  });

  return (
    <Screen>
      <AppText variant="title">Openings</AppText>
      <TextField placeholder="Search ECO, name, move, or tag" value={queryText} onChangeText={setQueryText} autoCapitalize="none" />
      {openings.isLoading ? <LoadingState label="Loading openings" /> : null}
      {openings.isError ? <ErrorState message={openings.error.message} retry={() => openings.refetch()} /> : null}
      {openings.data ? <AppText muted>Source: {openings.data.source === "database" ? "database" : "static ECO sample"}</AppText> : null}
      {openings.data?.openings.length === 0 ? <EmptyState title="No openings found" /> : null}
      {openings.data?.openings.map((opening) => (
        <Card key={opening.id || opening._id || `${opening.eco}-${opening.name}`}>
          <View style={styles.header}>
            <AppText variant="subtitle">{opening.eco}</AppText>
            <View style={styles.copy}>
              <AppText>{opening.name}</AppText>
              <AppText muted>{opening.moves}</AppText>
            </View>
          </View>
          <View style={styles.tags}>
            {(opening.tags || []).map((tag) => (
              <View key={tag} style={styles.tag}>
                <AppText variant="caption">{tag}</AppText>
              </View>
            ))}
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  copy: { flex: 1, gap: 4 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 }
});
