import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export function usePhotos(eventId) {
  const [photos, setPhotos] = useState([]);
  const [unseenPhotos, setUnseenPhotos] = useState([]);
  const photosRef = useRef(photos);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    if (!eventId) return;

    async function fetchPhotos() {
      const { data } = await supabase
        .from("photos")
        .select("*, profiles(full_name, username), photo_favorites_count")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      setPhotos(data || []);
    }

    fetchPhotos();

    const channel = supabase
      .channel(`photos-${eventId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "photos", filter: `event_id=eq.${eventId}` }, payload => {
        const newPhoto = payload.new;
        if (!photosRef.current.find(p => p.id === newPhoto.id)) {
          setPhotos(prev => [newPhoto, ...prev]);
          setUnseenPhotos(prev => [...prev, newPhoto.id]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const handleFavorite = async (photoId, currentStatus) => {
    // Optimistic UI
    setPhotos(prevPhotos =>
      prevPhotos.map(photo =>
        photo.id === photoId
          ? {
              ...photo,
              is_favorite: !currentStatus,
              favorites_count: currentStatus
                ? Math.max(0, photo.favorites_count - 1)
                : photo.favorites_count + 1
            }
          : photo
      )
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Debes iniciar sesión");

    if (currentStatus) {
      await supabase.from("photo_favorites").delete().match({ photo_id: photoId, user_id: user.id });
    } else {
      await supabase.from("photo_favorites").insert({ photo_id: photoId, user_id: user.id });
    }
  };

  const addPhotoOptimistic = (photo) => {
    if (!photo.id || photosRef.current.find(p => p.id === photo.id)) return;
    setPhotos(prev => [photo, ...prev]);
  };

  const markPhotosAsSeen = () => setUnseenPhotos([]);

  return { photos, unseenPhotos, handleFavorite, markPhotosAsSeen, addPhotoOptimistic };
}