import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useComments(eventId) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!eventId) return;

    async function fetchComments() {
      const { data } = await supabase
        .from("comments")
        .select("*, profiles(full_name)")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });
      setComments(data || []);
    }

    fetchComments();

    const channel = supabase
      .channel(`comments-${eventId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments", filter: `event_id=eq.${eventId}` }, payload => {
        setComments(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const addComment = async (text) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Debes iniciar sesión");
    const { data, error } = await supabase
      .from("comments")
      .insert({
        event_id: eventId,
        content: text,
        user_id: user.id
      })
      .select("*, profiles(full_name)")
      .single();
    if (!error) setComments(prev => [...prev, data]);
  };

  return { comments, addComment };
}