import { Share } from "react-native";

const WEB_ORIGIN = "https://getchessplay.com";

export function roomInviteUrl(roomId: string) {
  return `chessplay://room/${encodeURIComponent(roomId)}`;
}

export function profileUrl(username: string) {
  return `${WEB_ORIGIN}/profile/${encodeURIComponent(username)}`;
}

export async function shareRoomInvite(roomId: string) {
  await Share.share({
    title: "Join my ChessPlay room",
    message: `Join my ChessPlay room ${roomId}: ${roomInviteUrl(roomId)}`
  });
}

export async function shareProfile(username: string) {
  await Share.share({
    title: `${username} on ChessPlay`,
    message: `View ${username}'s ChessPlay profile: ${profileUrl(username)}`
  });
}

export async function shareReferralInvite(input: { code: string; linkPath?: string | null }) {
  const path = input.linkPath || `/register?ref=${encodeURIComponent(input.code)}`;
  await Share.share({
    title: "Join ChessPlay",
    message: `Join me on ChessPlay: ${WEB_ORIGIN}${path}`
  });
}

export async function shareGameResult(input: { title: string; roomId?: string; winner?: string | null }) {
  const winnerText = input.winner ? ` Winner: ${input.winner}.` : "";
  const roomText = input.roomId ? ` Room: ${input.roomId}.` : "";
  await Share.share({
    title: "ChessPlay game result",
    message: `${input.title}.${winnerText}${roomText} Play on ChessPlay.`
  });
}
