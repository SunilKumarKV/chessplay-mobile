import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateView";
import { TextField } from "@/components/TextField";
import { communityApi } from "@/services/api/client";
import type { CommunityPost } from "@/types/api";

const POST_TYPES: CommunityPost["type"][] = ["discussion", "feedback", "bug", "feature"];

export default function CommunityScreen() {
  const queryClient = useQueryClient();
  const [type, setType] = useState<CommunityPost["type"]>("discussion");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [commentByPost, setCommentByPost] = useState<Record<string, string>>({});
  const posts = useQuery({
    queryKey: ["community", "posts"],
    queryFn: () => communityApi.posts({ limit: 30 })
  });
  const createPost = useMutation({
    mutationFn: () => communityApi.createPost({ type, title: title.trim(), body: body.trim() }),
    onSuccess: () => {
      setTitle("");
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["community", "posts"] });
    },
    onError: (error) => Alert.alert("Post not created", error.message)
  });
  const likePost = useMutation({
    mutationFn: communityApi.likePost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community", "posts"] }),
    onError: (error) => Alert.alert("Unable to like post", error.message)
  });
  const comment = useMutation({
    mutationFn: ({ postId, text }: { postId: string; text: string }) => communityApi.comment(postId, text),
    onSuccess: (_data, variables) => {
      setCommentByPost((current) => ({ ...current, [variables.postId]: "" }));
      queryClient.invalidateQueries({ queryKey: ["community", "posts"] });
    },
    onError: (error) => Alert.alert("Comment not sent", error.message)
  });

  return (
    <Screen>
      <AppText variant="title">Community</AppText>
      <Card>
        <AppText variant="subtitle">Create post</AppText>
        <View style={styles.typeRow}>
          {POST_TYPES.map((item) => (
            <Pressable key={item} onPress={() => setType(item)} style={[styles.typeButton, type === item ? styles.typeButtonActive : null]}>
              <AppText variant="caption">{item}</AppText>
            </Pressable>
          ))}
        </View>
        <TextField placeholder="Title" value={title} onChangeText={setTitle} maxLength={120} />
        <TextField
          placeholder="Message"
          value={body}
          onChangeText={setBody}
          multiline
          maxLength={1500}
          style={{ minHeight: 110, textAlignVertical: "top", paddingTop: 12 }}
        />
        <AppText variant="caption" muted>{body.length}/1500</AppText>
        <Button
          label="Post"
          loading={createPost.isPending}
          disabled={title.trim().length < 4 || body.trim().length < 10}
          onPress={() => createPost.mutate()}
        />
      </Card>

      {posts.isLoading ? <LoadingState label="Loading community" /> : null}
      {posts.isError ? <ErrorState message={posts.error.message} retry={() => posts.refetch()} /> : null}
      {posts.data?.posts.length === 0 ? <EmptyState title="No community posts" /> : null}
      {posts.data?.posts.map((post) => {
        const postId = String(post.id || post._id || "");
        return (
          <Card key={postId}>
            <View style={styles.postHeader}>
              <View style={styles.postCopy}>
                <AppText variant="subtitle">{post.title}</AppText>
                <AppText variant="caption" muted>{post.authorName || "ChessPlay"} · {post.type} · {post.status || "open"}</AppText>
              </View>
              {post.isPinned ? <AppText variant="caption">Pinned</AppText> : null}
            </View>
            <AppText>{post.body || post.content}</AppText>
            <View style={styles.typeRow}>
              <Button label={`${post.liked ? "Unlike" : "Like"} (${post.likesCount || 0})`} variant="secondary" loading={likePost.isPending} onPress={() => likePost.mutate(postId)} />
            </View>
            {(post.comments || []).map((item) => (
              <View key={item.id || item._id || `${postId}-${item.createdAt}-${item.username}`} style={styles.comment}>
                <AppText variant="caption" muted>{item.username || "Player"}</AppText>
                <AppText>{item.text}</AppText>
              </View>
            ))}
            <TextField
              placeholder="Add a comment"
              value={commentByPost[postId] || ""}
              onChangeText={(value) => setCommentByPost((current) => ({ ...current, [postId]: value }))}
              maxLength={500}
            />
            <Button
              label="Comment"
              variant="secondary"
              loading={comment.isPending}
              disabled={(commentByPost[postId] || "").trim().length < 2}
              onPress={() => comment.mutate({ postId, text: (commentByPost[postId] || "").trim() })}
            />
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeButton: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  typeButtonActive: { borderWidth: 2 },
  postHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  postCopy: { flex: 1, gap: 4 },
  comment: { gap: 3, paddingVertical: 4 }
});
