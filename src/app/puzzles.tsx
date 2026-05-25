import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Chess, type Square } from "chess.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { ErrorState, LoadingState } from "@/components/StateView";
import { ChessBoard } from "@/features/chess/ChessBoard";
import { isApiError, puzzlesApi } from "@/services/api/client";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { Puzzle, PuzzleHint, PuzzleHistoryItem, PuzzleLimits } from "@/types/api";

const DIFFICULTIES = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
  { id: "master", label: "Master" }
];

const THEMES = ["", "mate", "fork", "pin", "sacrifice", "endgame"];

type Feedback = { type: "success" | "error" | "info"; message: string };
type PuzzleResult = { completed: boolean; learning?: Puzzle["learning"] | null } | null;

function moveToUci(move: { from: string; to: string; promotion?: string }) {
  return `${move.from}${move.to}${move.promotion || ""}`.toLowerCase();
}

function lastMoveFromUci(uci?: string | null) {
  if (!uci || uci.length < 4) return null;
  return { from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square };
}

function progressLabel(puzzle: Puzzle | null, moveIndex: number) {
  if (!puzzle) return "Move 0/0";
  const current = Math.min(Math.floor((moveIndex + 1) / 2), puzzle.playerMoveCount || 1);
  return `Move ${current}/${puzzle.playerMoveCount || 1}`;
}

function formatDate(value?: string) {
  if (!value) return "Recently";
  return new Date(value).toLocaleDateString();
}

export default function PuzzlesScreen() {
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const [difficulty, setDifficulty] = useState("beginner");
  const [theme, setTheme] = useState("");
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [fen, setFen] = useState<string | null>(null);
  const [moveIndex, setMoveIndex] = useState(1);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [hint, setHint] = useState<PuzzleHint | null>(null);
  const [hintState, setHintState] = useState({ used: 0, limit: 1, loading: false });
  const [limits, setLimits] = useState<PuzzleLimits | null>(null);
  const [loadingPuzzle, setLoadingPuzzle] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PuzzleResult>(null);
  const [emptyMessage, setEmptyMessage] = useState("");
  const [limitNotice, setLimitNotice] = useState<{ message: string; upgradeMessage?: string } | null>(null);

  const dashboard = useQuery({
    queryKey: ["puzzle-dashboard"],
    queryFn: async () => {
      const [stats, history, limitData] = await Promise.all([
        puzzlesApi.stats(),
        puzzlesApi.history(),
        puzzlesApi.limits()
      ]);
      return { stats: stats.stats, limits: limitData.limits || stats.limits, history: history.history };
    }
  });

  const stats = dashboard.data?.stats || null;
  const history = dashboard.data?.history || [];
  const effectiveLimits = limits || dashboard.data?.limits || null;
  const currentFen = fen || puzzle?.fen || new Chess().fen();
  const game = useMemo(() => new Chess(currentFen), [currentFen]);
  const completed = Boolean(result?.completed);
  const remainingHints = Math.max((hintState.limit || 0) - (hintState.used || 0), 0);

  const loadPuzzle = useCallback(async (options: { fresh?: boolean; daily?: boolean } = {}) => {
    setLoadingPuzzle(true);
    setFeedback(null);
    setHint(null);
    setResult(null);
    setEmptyMessage("");
    setLimitNotice(null);
    try {
      const data = await puzzlesApi.next({ difficulty, theme, fresh: options.fresh, daily: options.daily });
      setLimits(data.limits || null);
      if (!data.puzzle) {
        setPuzzle(null);
        setFen(null);
        setEmptyMessage(data.message || "No puzzles are available yet.");
        return;
      }
      setPuzzle(data.puzzle);
      setFen(data.puzzle.fen);
      setMoveIndex(data.puzzle.moveIndex || 1);
      setLastMove(lastMoveFromUci(data.puzzle.initialMove));
      setHintState({ used: 0, limit: data.limits?.isPremium ? 3 : 1, loading: false });
      await queryClient.invalidateQueries({ queryKey: ["puzzle-dashboard"] });
    } catch (error) {
      if (isApiError(error)) {
        const data = error.data as { limits?: PuzzleLimits; message?: string; upgradeMessage?: string };
        setLimits(data.limits || null);
        if (error.status === 402 || error.status === 429) {
          setLimitNotice({ message: error.message, upgradeMessage: data.upgradeMessage });
        } else {
          setEmptyMessage(error.message);
        }
      } else {
        setEmptyMessage("Puzzle service is unavailable.");
      }
      setPuzzle(null);
      setFen(null);
    } finally {
      setLoadingPuzzle(false);
    }
  }, [difficulty, queryClient, theme]);

  useEffect(() => {
    loadPuzzle();
  }, [loadPuzzle]);

  function resetCurrentPuzzle() {
    if (!puzzle) return;
    setFen(puzzle.fen);
    setMoveIndex(puzzle.moveIndex || 1);
    setLastMove(lastMoveFromUci(puzzle.initialMove));
    setFeedback(null);
    setHint(null);
    setResult(null);
  }

  async function submitMove(from: Square, to: Square, promotion?: string) {
    if (!puzzle || completed || submitting) return;
    const localGame = new Chess(currentFen);
    const piece = localGame.get(from);
    const promotionPiece = promotion || (piece?.type === "p" && (to.endsWith("8") || to.endsWith("1")) ? "q" : undefined);
    const legalMove = localGame.move({ from, to, promotion: promotionPiece });
    if (!legalMove) {
      setFeedback({ type: "error", message: "Illegal move. Try another candidate move." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const uci = moveToUci({ from, to, promotion: legalMove.promotion });
      const data = await puzzlesApi.submit(puzzle.id, uci, moveIndex);
      setFen(data.fen);
      setMoveIndex(data.moveIndex ?? moveIndex);
      setLastMove(data.opponentMove ? lastMoveFromUci(data.opponentMove) : lastMoveFromUci(uci));
      if (data.correct) {
        setFeedback({ type: "success", message: data.message || "Correct. Continue the tactic line." });
        if (data.completed) {
          setResult({ completed: true, learning: data.learning });
          await queryClient.invalidateQueries({ queryKey: ["puzzle-dashboard"] });
        }
      } else {
        setFeedback({ type: "error", message: data.message || "Try again." });
      }
    } catch (error) {
      setFeedback({ type: "error", message: isApiError(error) ? error.message : "Unable to validate that move." });
    } finally {
      setSubmitting(false);
    }
  }

  async function requestHint() {
    if (!puzzle || hintState.loading) return;
    setHintState((current) => ({ ...current, loading: true }));
    try {
      const data = await puzzlesApi.hint(puzzle.id, moveIndex);
      setHint(data.hint);
      setHintState({ used: data.hintsUsed || 0, limit: data.hintsLimit || 1, loading: false });
      setFeedback({ type: "info", message: "Hint ready." });
    } catch (error) {
      setFeedback({ type: "error", message: isApiError(error) ? error.message : "No hint is available." });
      setHintState((current) => ({ ...current, loading: false }));
    }
  }

  return (
    <Screen>
      <AppText variant="title">Puzzle Trainer</AppText>
      <AppText muted>Backend-backed tactical puzzles with full-line validation, hints, limits, stats, and history.</AppText>

      <Card>
        <AppText variant="subtitle">Puzzle dashboard</AppText>
        {dashboard.isLoading ? <LoadingState label="Loading puzzle stats" /> : null}
        {dashboard.isError ? <ErrorState message={dashboard.error.message} retry={() => dashboard.refetch()} /> : null}
        <View style={styles.statGrid}>
          <Stat label="Solved" value={String(stats?.solved || 0)} />
          <Stat label="Accuracy" value={`${stats?.accuracy || 0}%`} />
          <Stat label="Rating" value={String(stats?.rating || 1200)} />
          <Stat label="Best" value={String(stats?.highestRating || 1200)} />
        </View>
        {effectiveLimits ? (
          <AppText muted>
            Today: {effectiveLimits.remaining}/{effectiveLimits.limit} puzzles remaining · Plan {effectiveLimits.plan}
          </AppText>
        ) : (
          <AppText muted>Daily limits unavailable.</AppText>
        )}
      </Card>

      <Card>
        <AppText variant="subtitle">Choose training</AppText>
        <View style={styles.buttonWrap}>
          {DIFFICULTIES.map((item) => (
            <Button
              key={item.id}
              label={item.label}
              variant={difficulty === item.id ? "primary" : "secondary"}
              onPress={() => setDifficulty(item.id)}
            />
          ))}
        </View>
        <AppText muted>Theme filter</AppText>
        <View style={styles.buttonWrap}>
          {THEMES.map((item) => (
            <Button
              key={item || "all"}
              label={item ? item[0].toUpperCase() + item.slice(1) : "All"}
              variant={theme === item ? "primary" : "secondary"}
              onPress={() => setTheme(item)}
            />
          ))}
        </View>
        <View style={styles.buttonWrap}>
          <Button label="Daily puzzle" onPress={() => loadPuzzle({ daily: true, fresh: true })} />
          <Button label="Next puzzle" variant="secondary" onPress={() => loadPuzzle({ fresh: true })} />
        </View>
        {limitNotice ? (
          <View style={[styles.notice, { borderColor: colors.warning }]}>
            <AppText variant="subtitle">Puzzle limit</AppText>
            <AppText muted>{limitNotice.message}</AppText>
            {limitNotice.upgradeMessage ? <AppText muted>{limitNotice.upgradeMessage}</AppText> : null}
          </View>
        ) : null}
      </Card>

      {loadingPuzzle ? <LoadingState label="Loading puzzle" /> : null}
      {emptyMessage ? <ErrorState message={emptyMessage} retry={() => loadPuzzle({ fresh: true })} /> : null}

      {puzzle ? (
        <Card>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <AppText variant="subtitle">Daily Puzzle</AppText>
              <AppText muted>
                {puzzle.difficulty || "Puzzle"} · Rating {puzzle.rating || "unrated"} · {progressLabel(puzzle, moveIndex)}
              </AppText>
            </View>
            {puzzle.isPremium ? <AppText muted>Premium</AppText> : null}
          </View>
          <View style={styles.tagRow}>
            {(puzzle.themes?.length ? puzzle.themes : [puzzle.theme || "tactic"]).slice(0, 5).map((item) => (
              <View key={item} style={[styles.tag, { backgroundColor: colors.surfaceMuted }]}>
                <AppText muted style={styles.tagText}>{item}</AppText>
              </View>
            ))}
          </View>
          <AppText muted>{game.turn() === "w" ? "White" : "Black"} to move.</AppText>
          <ChessBoard
            fen={currentFen}
            lastMove={lastMove}
            disabled={completed || submitting}
            onInvalidSelection={(message) => setFeedback({ type: "error", message })}
            onMove={(from, to, promotion) => submitMove(from, to, promotion)}
          />
          {feedback ? (
            <View style={[styles.notice, { borderColor: feedback.type === "error" ? colors.danger : feedback.type === "success" ? colors.success : colors.primary }]}>
              <AppText variant="subtitle">{feedback.type === "error" ? "Not quite" : feedback.type === "success" ? "Correct" : "Hint"}</AppText>
              <AppText muted>{feedback.message}</AppText>
            </View>
          ) : null}
          {hint ? (
            <View style={[styles.notice, { borderColor: colors.primary }]}>
              <AppText variant="subtitle">{hint.type === "piece" ? "Piece to move" : hint.type === "target" ? "Target square" : "Full move"}</AppText>
              <AppText muted>{hint.text}</AppText>
              <AppText muted>{remainingHints} hints remaining.</AppText>
            </View>
          ) : null}
          <View style={styles.buttonWrap}>
            <Button label={hintState.loading ? "Hint..." : `Hint (${remainingHints})`} variant="secondary" disabled={completed || submitting || hintState.loading} onPress={requestHint} />
            <Button label="Reset" variant="secondary" onPress={resetCurrentPuzzle} />
            <Button label="Next puzzle" onPress={() => loadPuzzle({ fresh: true })} />
          </View>
        </Card>
      ) : null}

      <Card>
        <AppText variant="subtitle">Puzzle history</AppText>
        {history.length ? history.slice(0, 10).map((item) => <HistoryRow key={`${item.puzzleId}-${item.updatedAt}`} item={item} />) : <AppText muted>Solved and attempted puzzles will appear here.</AppText>}
      </Card>

      <Modal transparent visible={Boolean(result?.completed)} animationType="fade" onRequestClose={() => setResult(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.resultModal}>
            <Card>
              <AppText variant="title">Puzzle solved</AppText>
              <AppText muted>{result?.learning?.whatYouLearned || "You completed the tactic line."}</AppText>
              {result?.learning?.explanation ? <AppText muted>{result.learning.explanation}</AppText> : null}
              {result?.learning?.nextRecommendedDifficulty ? <AppText muted>Next: {result.learning.nextRecommendedDifficulty}</AppText> : null}
              <Button label="Next puzzle" onPress={() => { setResult(null); loadPuzzle({ fresh: true }); }} />
              <Button label="Review board" variant="secondary" onPress={() => setResult(null)} />
            </Card>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="subtitle">{value}</AppText>
      <AppText muted>{label}</AppText>
    </View>
  );
}

function HistoryRow({ item }: { item: PuzzleHistoryItem }) {
  return (
    <View style={styles.historyRow}>
      <View style={{ flex: 1 }}>
        <AppText>{item.difficulty || "Puzzle"}</AppText>
        <AppText muted>{item.puzzleId} · {formatDate(item.completedAt || item.updatedAt)}</AppText>
      </View>
      <AppText muted>{item.status || "started"}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: { width: "47%", borderRadius: 8, padding: 12, backgroundColor: "rgba(148,163,184,0.12)" },
  buttonWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  headerRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 12 },
  notice: { borderWidth: 1, borderRadius: 8, padding: 12, gap: 4 },
  historyRow: { flexDirection: "row", gap: 12, alignItems: "center", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(148,163,184,0.35)" },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.56)" },
  resultModal: { width: "100%", maxWidth: 380 }
});
