import { useMutation, useQuery } from "@tanstack/react-query";
import { Chess } from "chess.js";
import { useMemo, useState } from "react";
import { Alert } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { ErrorState, LoadingState } from "@/components/StateView";
import { ChessBoard } from "@/features/chess/ChessBoard";
import { apiClient } from "@/services/api/client";
import type { Puzzle } from "@/types/api";

export default function PuzzlesScreen() {
  const [fen, setFen] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["puzzles", "next"],
    queryFn: () => apiClient<{ puzzle: Puzzle }>("/puzzles/next?difficulty=beginner")
  });
  const puzzle = query.data?.puzzle;
  const currentFen = fen || puzzle?.fen || new Chess().fen();
  const mutation = useMutation({
    mutationFn: (move: string) =>
      apiClient<{ correct: boolean; message?: string }>(`/puzzles/${puzzle?.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ move, moveIndex: puzzle?.moveIndex || 0 })
      }),
    onSuccess: (data) => Alert.alert(data.correct ? "Correct" : "Try again", data.message || "")
  });
  const status = useMemo(() => (puzzle ? `${puzzle.difficulty || "Puzzle"} · ${puzzle.rating || "unrated"}` : ""), [puzzle]);

  return (
    <Screen>
      <AppText variant="title">Puzzles</AppText>
      {query.isLoading ? <LoadingState label="Loading puzzle" /> : null}
      {query.isError ? <ErrorState message={query.error.message} retry={() => query.refetch()} /> : null}
      {puzzle ? (
        <Card>
          <AppText variant="subtitle">{status}</AppText>
          <ChessBoard
            fen={currentFen}
            onMove={(from, to, promotion) => {
              const next = new Chess(currentFen);
              const move = next.move({ from, to, promotion });
              if (!move) return;
              setFen(next.fen());
              mutation.mutate(`${from}${to}${promotion && promotion !== "q" ? promotion : ""}`);
            }}
          />
          <Button label="Next puzzle" variant="secondary" onPress={() => { setFen(null); query.refetch(); }} />
        </Card>
      ) : null}
    </Screen>
  );
}

