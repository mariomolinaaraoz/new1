// hooks/usePhotos.js
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export function usePhotos(eventId) {
  const [photos, setPhotos] = useState([]);
  const [unseenPhotos, setUnseenPhotos] = useState([]);
  const channelRef = useRef(null);
  const isMountedRef = useRef(true);

  // Limpiar al desmontar
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (channelRef.current) {
        console.log(`Desuscribiendo del canal photos-${eventId}`);
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;

    // Función para cargar fotos con información del usuario
    const fetchPhotos = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Consulta modificada para obtener todos los favoritos
        let query = supabase
          .from("photos")
          .select(`
            *,
            profiles(full_name, username),
            photo_favorites:photo_favorites(
              user_id
            )
          `)
          .eq("event_id", eventId)
          .order("created_at", { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        const photosWithFavorites = (data || []).map(photo => ({
          ...photo,
          is_favorite: user ? photo.photo_favorites.some(fav => fav.user_id === user.id) : false,
          favorites_count: photo.photo_favorites?.length || 0
        }));

        if (isMountedRef.current) {
          setPhotos(photosWithFavorites);
        }
      } catch (error) {
        console.error("Error fetching photos:", error);
        if (isMountedRef.current) {
          setPhotos([]);
        }
      }
    };

    fetchPhotos();

    // Configurar suscripción en tiempo real
    const channelName = `photos-${eventId}-${Date.now()}`;
    console.log(`Creando canal: ${channelName}`);

    // Eliminar canal existente si hay uno
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "photos",
          filter: `event_id=eq.${eventId}`
        },
        async (payload) => {
          console.log("Nueva foto recibida:", payload.new);
          
          if (!isMountedRef.current) return;

          // Verificar si la foto ya existe
          const exists = photos.some(photo => photo.id === payload.new.id);
          if (exists) {
            console.log("Foto ya existe, omitiendo:", payload.new.id);
            return;
          }

          try {
            // Obtener información del perfil del usuario
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("full_name, username")
              .eq("id", payload.new.user_id)
              .single();

            if (profileError) throw profileError;

            // Obtener favoritos para la nueva foto
            const { data: favoritesData, error: favoritesError } = await supabase
              .from("photo_favorites")
              .select("user_id")
              .eq("photo_id", payload.new.id);

            // No lanzamos error si no hay favoritos
            if (favoritesError && favoritesError.code !== 'PGRST116') {
              throw favoritesError;
            }

            const { data: { user } } = await supabase.auth.getUser();

            // Crear objeto de foto con información del usuario
            const newPhoto = {
              ...payload.new,
              profiles: profileData,
              photo_favorites: favoritesData || [],
              is_favorite: user ? favoritesData?.some(fav => fav.user_id === user.id) : false,
              favorites_count: favoritesData?.length || 0
            };

            if (isMountedRef.current) {
              setPhotos(prev => {
                const alreadyExists = prev.some(p => p.id === newPhoto.id);
                if (alreadyExists) return prev;
                return [newPhoto, ...prev];
              });
              setUnseenPhotos(prev => [...prev, newPhoto.id]);
            }
          } catch (error) {
            console.error("Error procesando nueva foto:", error);
            // Fallback: agregar foto sin perfil
            if (isMountedRef.current) {
              setPhotos(prev => {
                const alreadyExists = prev.some(p => p.id === payload.new.id);
                if (alreadyExists) return prev;
                return [
                  {
                    ...payload.new,
                    profiles: null,
                    photo_favorites: [],
                    is_favorite: false,
                    favorites_count: 0
                  },
                  ...prev
                ];
              });
              setUnseenPhotos(prev => [...prev, payload.new.id]);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`Estado del canal ${channelName}:`, status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [eventId]);

  const handleFavorite = async (photoId, currentStatus) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Debes iniciar sesión");

    // Optimistic UI update
    setPhotos(prevPhotos =>
      prevPhotos.map(photo =>
        photo.id === photoId
          ? {
              ...photo,
              is_favorite: !currentStatus,
              favorites_count: currentStatus
                ? Math.max(0, (photo.favorites_count || 0) - 1)
                : (photo.favorites_count || 0) + 1
            }
          : photo
      )
    );

    try {
      if (currentStatus) {
        await supabase
          .from("photo_favorites")
          .delete()
          .match({ photo_id: photoId, user_id: user.id });
      } else {
        await supabase
          .from("photo_favorites")
          .insert({ photo_id: photoId, user_id: user.id });
      }

      // Actualizar la lista completa de fotos después de cambiar el favorito
      const { data } = await supabase
        .from("photos")
        .select(`
          *,
          profiles(full_name, username),
          photo_favorites:photo_favorites(
            user_id
          )
        `)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      const updatedPhotos = data.map(photo => ({
        ...photo,
        is_favorite: photo.photo_favorites.some(fav => fav.user_id === user?.id),
        favorites_count: photo.photo_favorites?.length || 0
      }));

      setPhotos(updatedPhotos);
    } catch (error) {
      console.error('Error updating favorite:', error);
      // Revertir en caso de error
      const { data } = await supabase
        .from("photos")
        .select(`
          *,
          profiles(full_name, username),
          photo_favorites:photo_favorites(
            user_id
          )
        `)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      const photosWithFavorites = data.map(photo => ({
        ...photo,
        is_favorite: photo.photo_favorites.some(fav => fav.user_id === user?.id),
        favorites_count: photo.photo_favorites?.length || 0
      }));

      setPhotos(photosWithFavorites);
    }
  };

  const addPhotoOptimistic = (photo) => {
    if (!photo.id || photos.some(p => p.id === photo.id)) return;
    const photoWithFavorites = {
      ...photo,
      photo_favorites: [],
      is_favorite: false,
      favorites_count: 0
    };
    setPhotos(prev => [photoWithFavorites, ...prev]);
    setUnseenPhotos(prev => [...prev, photoWithFavorites.id]);
  };

  const markPhotosAsSeen = () => setUnseenPhotos([]);

  return { photos, unseenPhotos, handleFavorite, markPhotosAsSeen, addPhotoOptimistic };
}