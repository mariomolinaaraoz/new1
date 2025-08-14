// hooks/useComments.js
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useComments(eventId, photoId, MAX_COMMENT_LENGTH) {
  const [comments, setComments] = useState([]);
  const channelRef = useRef(null);
  const isMountedRef = useRef(true);

  // Limpiar al desmontar
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (channelRef.current) {
        console.log(`Desuscribiendo del canal comments-${photoId}`);
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!photoId) return;

    // Función para cargar comentarios
    const fetchComments = async () => {
      try {
        console.log(`Cargando comentarios para photo_id: ${photoId}`);
        const { data, error } = await supabase
          .from("comments")
          .select("*, profiles(full_name)")
          .eq("photo_id", photoId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        
        if (isMountedRef.current) {
          console.log(`Comentarios cargados: ${data?.length || 0}`);
          setComments(data || []);
        }
      } catch (error) {
        console.error("Error fetching comments:", error.message);
        if (isMountedRef.current) {
          setComments([]);
        }
      }
    };

    fetchComments();

    // Crear un nombre de canal único
    const channelName = `comments-${photoId}-${Date.now()}`;
    console.log(`Creando canal: ${channelName}`);

    // Eliminar cualquier canal existente antes de crear uno nuevo
    if (channelRef.current) {
      console.log(`Desuscribiendo del canal antiguo: ${channelRef.current.name}`);
      supabase.removeChannel(channelRef.current);
    }

    // Suscripción en tiempo real con manejo de reconexión
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `photo_id=eq.${photoId}`
        },
        async (payload) => {
          console.log("Nuevo comentario recibido:", payload.new);
          
          if (!isMountedRef.current) return;

          // Verificar si el comentario ya existe para evitar duplicados
          const exists = comments.some(comment => comment.id === payload.new.id);
          if (exists) {
            console.log("Comentario ya existe, omitiendo:", payload.new.id);
            return;
          }

          try {
            // Cargar el nombre del usuario para el nuevo comentario
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", payload.new.user_id)
              .single();

            if (profileError) {
              console.warn("Error fetching user profile, usando user_id:", profileError.message);
              // Si hay error, usar user_id como fallback
              if (isMountedRef.current) {
                setComments(prev => {
                  const alreadyExists = prev.some(c => c.id === payload.new.id);
                  if (alreadyExists) return prev;
                  return [...prev, { 
                    ...payload.new, 
                    profiles: { full_name: payload.new.user_id } 
                  }];
                });
              }
              return;
            }

            // Agregar el comentario con el nombre del usuario
            if (isMountedRef.current) {
              setComments(prev => {
                const alreadyExists = prev.some(c => c.id === payload.new.id);
                if (alreadyExists) return prev;
                return [...prev, { 
                  ...payload.new, 
                  profiles: profileData ? { full_name: profileData.full_name } : null 
                }];
              });
            }
          } catch (error) {
            console.error("Error processing new comment:", error.message);
            // Fallback: agregar comentario sin perfil
            if (isMountedRef.current) {
              setComments(prev => {
                const alreadyExists = prev.some(c => c.id === payload.new.id);
                if (alreadyExists) return prev;
                return [...prev, { 
                  ...payload.new, 
                  profiles: { full_name: payload.new.user_id } 
                }];
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`Estado del canal ${channelName}:`, status);
        if (status === 'SUBSCRIBED') {
          console.log(`Suscripción exitosa al canal ${channelName}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error en el canal ${channelName}`);
        } else if (status === 'CLOSED') {
          console.log(`Canal ${channelName} cerrado`);
        }
      });

    channelRef.current = channel;

    // Limpiar suscripción anterior si photoId cambia
    return () => {
      if (channelRef.current) {
        console.log(`Desuscribiendo del canal anterior: ${channelName}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [photoId]);

  const addComment = async (text) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Debes iniciar sesión");
      return;
    }

    // Validación de longitud en el cliente
    if (text.length > MAX_COMMENT_LENGTH) {
      alert(`El comentario no puede exceder ${MAX_COMMENT_LENGTH} caracteres.`);
      return;
    }

    try {
      console.log("Agregando comentario:", text);
            
      // Insertar el comentario
      const { data, error } = await supabase
        .from("comments")
        .insert({
          photo_id: photoId,
          event_id: eventId,
          content: text,
          user_id: user.id
        })
        .select("*, profiles(full_name)")
        .single();

      if (error) throw error;
      
      console.log("Comentario agregado:", data);
      
      // Agregar el comentario al estado local (optimistic update)
      if (isMountedRef.current) {
        setComments(prev => {
          const alreadyExists = prev.some(comment => comment.id === data.id);
          if (alreadyExists) return prev;
          return [...prev, data];
        });
      }
    } catch (error) {
      console.error("Error adding comment:", error.message);
      alert("Hubo un error al agregar el comentario. Por favor, inténtalo de nuevo.");
    }
  };

  return { comments, addComment };
}