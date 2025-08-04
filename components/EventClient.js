"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import UploadButton from "./UploadButton";
import Image from "next/image";
import CountdownTimer from "./CountdownTimer";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function EventClient({ event }) {
  const [photos, setPhotos] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);  
  const [unseenPhotos, setUnseenPhotos] = useState([]);

  const photosRef = useRef(photos);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  const showNotification = (title, body) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            new Notification(title, { body });
          }
        });
      }
    }
  };

useEffect(() => {
  if (!event) {
    console.error("Evento no definido");
    return;
  }

  console.log("event.id:", event.id); // Depuración

  async function fetchPhotos() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Usuario actual:", user?.id); // Depuración

      const { data, error } = await supabase
        .from("photos")
        .select(`
          *,
          profiles(full_name, username),
          photo_favorites_count,
          photo_favorites(user_id)
        `)
        .eq("event_id", event.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const photosWithFavorites = data?.map(photo => ({
        ...photo,
        is_favorite: user ? photo.photo_favorites?.some(fav => fav.user_id === user.id) : false,
        favorites_count: photo.photo_favorites_count || 0
      })) || [];

      console.log("Fotos iniciales cargadas:", photosWithFavorites); // Depuración
      setPhotos(photosWithFavorites);
    } catch (error) {
      console.error("Error al cargar fotos:", error);
      const { data } = await supabase
        .from("photos")
        .select(`*, profiles(full_name, username)`)
        .eq("event_id", event.id)
        .order("created_at", { ascending: false });
      setPhotos(data || []);
    }
  }

  async function fetchComments() {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(full_name)")
      .eq("event_id", event.id)
      .order("created_at", { ascending: true });
    setComments(data || []);
  }

  fetchPhotos();
  fetchComments();

  const photoChannel = supabase
    .channel(`realtime:photos:${event.id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "photos",
        filter: `event_id=eq.${event.id}`,
      },
      async (payload) => {
        console.log("Nueva foto detectada (detalle completo):", payload); // Depuración detallada
        const newPhoto = payload.new;

        const exists = photosRef.current.some(photo => photo.id === newPhoto.id);
        console.log("Foto ya existe:", exists, "ID:", newPhoto.id); // Depuración

        if (exists) {
          console.log("Actualizando foto existente:", newPhoto.id);
          setPhotos(prev =>
            prev.map(photo =>
              photo.id === newPhoto.id
                ? { ...photo, ...newPhoto, profiles: photo.profiles }
                : photo
            )
          );
          return;
        }

        try {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("full_name, username")
            .eq("id", newPhoto.user_id)
            .single();

          if (profileError) {
            console.error("Error al obtener perfil:", profileError);
            throw profileError;
          }

          const { data: { user } } = await supabase.auth.getUser();
          const { count: favoritesCount, error: countError } = await supabase
            .from("photo_favorites")
            .select("*", { count: "exact" })
            .eq("photo_id", newPhoto.id);

          if (countError) {
            console.error("Error al obtener conteo de favoritos:", countError);
          }

          const photoWithFullData = {
            ...newPhoto,
            profiles: profileData || { full_name: "Usuario desconocido", username: "usuario" },
            is_favorite: user ? await checkIfFavorite(newPhoto.id, user.id) : false,
            favorites_count: favoritesCount || 0,
          };

          console.log("Añadiendo nueva foto al estado:", photoWithFullData); // Depuración
          setPhotos(prev => [photoWithFullData, ...prev]);

          showNotification(
            "Nueva foto subida",
            `Una nueva foto ha sido añadida por ${photoWithFullData.profiles?.full_name || "un usuario"}`
          );
          setUnseenPhotos(prev => [...prev, newPhoto.id]);
        } catch (error) {
          console.error("Error al manejar nueva foto:", error);
          setPhotos(prev => [
            {
              ...newPhoto,
              profiles: { full_name: "Usuario desconocido", username: "usuario" },
              is_favorite: false,
              favorites_count: 0,
            },
            ...prev,
          ]);
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "photos",
        filter: `event_id=eq.${event.id}`,
      },
      (payload) => {
        console.log("Foto eliminada:", payload.old);
        setPhotos(prev => prev.filter(photo => photo.id !== payload.old.id));
      }
    )
    .subscribe((status, err) => {
      console.log("Estado de la suscripción de fotos:", status, err);
      if (err) console.error("Error en la suscripción:", err);
    });

  const commentChannel = supabase
    .channel(`realtime:comments:${event.id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "comments",
        filter: `event_id=eq.${event.id}`,
      },
      (payload) => {
        console.log("Nuevo comentario detectado:", payload.new);
        setComments(prev => [...prev, payload.new]);
      }
    )
    .subscribe((status, err) => {
      console.log("Estado de la suscripción de comentarios:", status, err);
      if (err) console.error("Error en la suscripción:", err);
    });

  return () => {
    console.log("Limpiando suscripciones para event.id:", event.id);
    supabase.removeChannel(photoChannel);
    supabase.removeChannel(commentChannel);
  };
}, [event]);

  async function checkIfFavorite(photoId, userId) {
    const { data, error } = await supabase
      .from("photo_favorites")
      .select("*")
      .eq("photo_id", photoId)
      .eq("user_id", userId)
      .single();
    return !error && data != null;
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("comments")
      .insert({
        event_id: event.id,
        content: newComment,
        user_id: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (!error) {
      setComments((prev) => [...prev, data]);
      setNewComment("");
    } else {
      console.error("Error al agregar comentario:", error.message);
    }
  }

  const openPhotoModal = async (photo) => {
    setSelectedPhoto(photo);
    setIsDialogOpen(true);
    const { data } = await supabase
      .from("comments")
      .select(`*,profiles(full_name)`)
      .eq("photo_id", photo.id)
      .order("created_at", { ascending: true });
    setPhotoComments(data || []);
  };

  const handleAddCommentToPhoto = async (commentText) => {
    if (!commentText.trim() || !selectedPhoto) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("Usuario no autenticado");
        return;
      }
      const { data, error } = await supabase
        .from("comments")
        .insert({
          photo_id: selectedPhoto.id,
          content: commentText,
          user_id: user.id,
        })
        .select(`*, profiles(full_name)`)
        .single();
      if (error) throw error;
      setPhotoComments(prev => [...prev, data]);
      setNewComment("");
    } catch (error) {
      console.error("Error al agregar comentario:", error);
      alert("Error al agregar comentario: " + error.message);
    }
  };

  const closePhotoModal = () => {
    setIsDialogOpen(false);
    setSelectedPhoto(null);
    setPhotoComments([]);
  };

  const handleFavorite = async (photoId, currentStatus) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Debes iniciar sesión para marcar como favorito");
        return;
      }

      if (currentStatus) {
        const { error } = await supabase
          .from("photo_favorites")
          .delete()
          .match({ photo_id: photoId, user_id: user.id });

        if (error) throw error;

        setPhotos(prevPhotos =>
          prevPhotos.map(photo =>
            photo.id === photoId
              ? {
                  ...photo,
                  is_favorite: false,
                  favorites_count: Math.max(0, photo.favorites_count - 1)
                }
              : photo
          )
        );
      } else {
        const { error } = await supabase
          .from("photo_favorites")
          .insert({ photo_id: photoId, user_id: user.id });

        if (error) throw error;

        setPhotos(prevPhotos =>
          prevPhotos.map(photo =>
            photo.id === photoId
              ? {
                  ...photo,
                  is_favorite: true,
                  favorites_count: photo.favorites_count + 1
                }
              : photo
          )
        );
      }
    } catch (error) {
      console.error("Error al manejar favorito:", error);
      alert("Error al actualizar favorito");
    }
  };

  return (
    <div>      
      <div className="max-w-4xl mx-auto p-6">
        {unseenPhotos.length > 0 && (
          <div className="fixed top-20 right-4 z-50">
            <button
              onClick={() => setUnseenPhotos([])} // Simplificado, ya que no se encontró markPhotosAsSeen
              className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm shadow-lg flex items-center"
            >
              <span className="mr-2">{unseenPhotos.length} nueva{unseenPhotos.length > 1 ? 's' : ''} foto{unseenPhotos.length > 1 ? 's' : ''}</span>
              <span>×</span>
            </button>
          </div>
        )}

        <div className="flex justify-between">
          <h1 className="text-3xl font-bold mb-4">{event.name || event.title}</h1>
        </div>

        <CountdownTimer
          targetDate={event.day}
          title="¡Cuenta Regresiva!"
          description="Para el gran evento!!!"
        >
          <div className="text-center p-6 bg-green-100 rounded-lg">
            <h3 className="text-2xl font-bold text-green-800">¡Feliz Evento!</h3>
            <p className="text-green-600">El momento esperado finalmente ha llegado.</p>
          </div>
        </CountdownTimer>

        <UploadButton
          eventId={event.id}
          onUploadStart={() => console.log("Iniciando subida...")}
          onUploadComplete={() => console.log("Subida completada")}
          onPhotoUploaded={(newPhoto) => {
            if (!newPhoto.id) {
              console.warn("Photo sin id:", newPhoto);
              return;
            }
            if (photosRef.current.some(photo => photo.id === newPhoto.id)) {
              console.log("Foto ya existe en onPhotoUploaded, ignorando:", newPhoto.id);
              return;
            }
            const photoWithFullData = {
              ...newPhoto,
              is_favorite: false,
              favorites_count: 0,
            };
            console.log("Foto añadida por onPhotoUploaded:", photoWithFullData);
            setPhotos(prev => [photoWithFullData, ...prev]);
          }}
        />

        <h2 className="text-xl font-semibold mt-6 mb-3">Fotos del evento</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <Link
              href={{
                pathname: `/event/${event.slug}/photo/${photo.id}`,
                query: { photoIndex: index }
              }}
              key={photo.id}
              className={`cursor-pointer relative group overflow-hidden rounded-lg shadow-md transition-transform duration-700 ease-in-out hover:scale-103 ${unseenPhotos.includes(photo.id) ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="relative w-full h-48">
                <Image
                  src={photo.url}
                  alt={`Foto de ${photo.profiles?.full_name || 'usuario'} en ${event.name || event.title}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 33vw"
                />
                <div
                  className="absolute top-2 right-2 bg-black/5 rounded-full p-1 cursor-pointer z-10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFavorite(photo.id, photo.is_favorite);
                  }}
                >
                  {photo.is_favorite ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-red-600 transition-all duration-200"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-blue-700 transition-all duration-200"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {photo.favorites_count > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {photo.favorites_count}
                    </span>
                  )}
                </div>
                <div className="absolute top-2 left-2 bg-black/5 rounded-full px-1 py-0">
                  <div className="text-white text-xs">
                    {photo.profiles?.full_name || "Usuario"}
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 bg-black/5 text-white text-xs px-1 py-0.5 rounded">
                  {new Date(photo.created_at).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="absolute bottom-2 right-2 bg-white bg-opacity-80 rounded-full p-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-700"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <h2 className="text-xl font-semibold mt-8 mb-3">Comentarios</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe un comentario..."
            className="flex-1 border rounded p-2"
          />
          <button
            onClick={handleAddComment}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Enviar
          </button>
        </div>
        <div className="space-y-3">
          {comments.map((c) => (
            <div
              key={c.id}
              className="bg-gray-100 p-3 rounded-lg shadow-sm text-gray-700"
            >
              <p className="font-medium text-gray-800">
                {c.profiles?.full_name || "Usuario"}
              </p>
              <p className="mt-1">{c.content}</p>
            </div>
          ))}
        </div>
      </div>     
    </div>
  );
}