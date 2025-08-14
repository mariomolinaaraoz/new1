// app/event/[slug]/photo/[id]/page.js
"use client";
import { useEffect, useState, useCallback, useRef, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePhotos } from "@/hooks/usePhotos";
import { useComments } from "@/hooks/useComments";
import { ChevronLeft, ChevronRight, Heart, Play, Maximize2, Minimize2 } from "lucide-react"; // Añadido Maximize2 y Minimize2 para pantalla completa

// Función para determinar si una URL es un video
const isVideoUrl = (url) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

export default function PhotoDetailPage({ params }) {
  const { slug, id } = use(params);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const isVideo = photo?.url ? isVideoUrl(photo.url) : false;

  const imageContainerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIosFullscreen, setIsIosFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!imageContainerRef.current) return;

    // Detectar si es iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      // Implementación para iOS (pseudo-fullscreen)
      setIsIosFullscreen(prev => !prev);
      return;
    }

    // Implementación estándar para otros navegadores
    const element = imageContainerRef.current;

    const isFullscreen = document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement;

    if (isFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
      return;
    }

    if (element.requestFullscreen) {
      element.requestFullscreen().then(() => setIsFullscreen(true));
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen().then(() => setIsFullscreen(true));
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen().then(() => setIsFullscreen(true));
    }
  }, []);


  const MAX_COMMENT_LENGTH = 300;

  const [eventId, setEventId] = useState(null);
  const { photos, handleFavorite } = usePhotos(eventId);
  const { comments, addComment } = useComments(eventId, id, MAX_COMMENT_LENGTH);

  const [newComment, setNewComment] = useState("");
  const commentsContainerRef = useRef(null);
  const videoRef = useRef(null);

  // Nuevo: Estado y refs para control de inactividad
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const inactivityTimeoutRef = useRef(null);
  const [showRefreshWarning, setShowRefreshWarning] = useState(false);
  const warningTimeoutRef = useRef(null);

  // Configurar el temporizador de inactividad
  useEffect(() => {
    const INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 5 minutos
    const WARNING_TIMEOUT = INACTIVITY_TIMEOUT - 30000; // Mostrar advertencia 30s antes

    const handleActivity = () => {
      setLastActivityTime(Date.now());
      setShowRefreshWarning(false);

      // Cancelar timeouts existentes
      clearTimeout(inactivityTimeoutRef.current);
      clearTimeout(warningTimeoutRef.current);

      // Configurar nuevo timeout de advertencia
      warningTimeoutRef.current = setTimeout(() => {
        setShowRefreshWarning(true);
      }, WARNING_TIMEOUT);

      // Configurar nuevo timeout de recarga
      inactivityTimeoutRef.current = setTimeout(() => {
        window.location.reload();
      }, INACTIVITY_TIMEOUT);
    };

    const activityEvents = [
      'mousedown', 'mousemove', 'keydown',
      'scroll', 'touchstart', 'click',
      'input', 'focus'
    ];

    // Agregar listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Iniciar el temporizador
    handleActivity();

    // Limpieza al desmontar
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearTimeout(inactivityTimeoutRef.current);
      clearTimeout(warningTimeoutRef.current);
    };
  }, []);

  // Cargar el evento para obtener su ID
  useEffect(() => {
    const loadEvent = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id, slug')
          .eq('slug', slug)
          .single();
        if (error) throw error;
        setEventId(data.id);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (slug) {
      loadEvent();
    }
  }, [slug]);

  // Encontrar la foto actual
  useEffect(() => {
    if (photos.length > 0 && id) {
      const currentPhoto = photos.find(p => p.id === id);
      if (currentPhoto) {
        setPhoto(currentPhoto);
      } else {
        loadSinglePhoto(id);
      }
    }
  }, [photos, id]);

  // Encontrar índices para navegación
  const currentIndex = photos.findIndex(p => p.id === id);
  const hasNext = currentIndex < photos.length - 1;
  const hasPrev = currentIndex > 0;

  // Funciones de navegación
  const goToNext = useCallback(() => {
    if (hasNext && photos.length > 0) {
      const nextPhoto = photos[currentIndex + 1];
      router.push(`/event/${slug}/photo/${nextPhoto.id}`);
    }
  }, [hasNext, photos, currentIndex, router, slug]);

  const goToPrev = useCallback(() => {
    if (hasPrev && photos.length > 0) {
      const prevPhoto = photos[currentIndex - 1];
      router.push(`/event/${slug}/photo/${prevPhoto.id}`);
    }
  }, [hasPrev, photos, currentIndex, router, slug]);

  // Manejar teclas de flecha
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  async function loadSinglePhoto(photoId) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('photos')
        .select('*, profiles(full_name, username)')
        .eq('id', photoId)
        .single();
      if (error) throw error;
      setPhoto(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Mover el scroll al final del contenedor de comentarios
  useEffect(() => {
    const scrollToBottom = () => {
      if (commentsContainerRef.current) {
        commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
      }
    };

    scrollToBottom();
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [comments]);

  // Manejar pantalla completa
  // const toggleFullscreen = useCallback(() => {
  //   if (!isVideo && imageContainerRef.current) {
  //     if (!isFullscreen) {
  //       imageContainerRef.current.requestFullscreen().then(() => {
  //         setIsFullscreen(true);
  //       }).catch(err => {
  //         console.error("Error al entrar en pantalla completa:", err);
  //       });
  //     } else {
  //       document.exitFullscreen().then(() => {
  //         setIsFullscreen(false);
  //       }).catch(err => {
  //         console.error("Error al salir de pantalla completa:", err);
  //       });
  //     }
  //   }
  // }, [isFullscreen, isVideo]);

  // Manejar cambios en el estado de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (newComment.length > MAX_COMMENT_LENGTH) {
      alert(`El comentario no puede exceder ${MAX_COMMENT_LENGTH} caracteres.`);
      return;
    }
    await addComment(newComment);
    setNewComment("");

    const textarea = document.querySelector('textarea[name="comment-input"]');
    if (textarea) {
      textarea.rows = 1;
    }

    if (commentsContainerRef.current) {
      commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
    }
  };

  if (loading && !photo) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-white text-xl">Cargando foto...</div>
    </div>
  );

  if (error && !photo) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-red-500 text-xl">Error: {error}</div>
    </div>
  );

  if (!photo) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-white text-xl">Foto no encontrada</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* Notificación de recarga por inactividad */}
      {showRefreshWarning && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          La página se actualizará por inactividad en 30 segundos...
        </div>
      )}

      {/* Botón volver atrás */}
      <div className="container mx-auto px-4 pt-3 pb-0">
        <Link
          href={`/event/${slug}`}
          className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ChevronLeft className="mr-1" size={20} />
          Volver al evento
        </Link>
      </div>

      {/* Contenedor principal */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-220px)]">
        {/* Botón anterior (mitad izquierda) */}
        {hasPrev && (
          <button
            onClick={goToPrev}
            className="hidden lg:flex lg:w-1/2 h-full items-center justify-start pl-4 focus:outline-none group"
            aria-label="Foto anterior"
          >
            <div className="p-3 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-all opacity-70 group-hover:opacity-100">
              <ChevronLeft size={32} />
            </div>
          </button>
        )}

        {/* Foto/Video principal con información superpuesta */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
          <div
            ref={imageContainerRef}
            className={`relative w-full h-[70vh] max-w-6xl aspect-video ${isIosFullscreen ?
              'fixed inset-0 z-50 bg-black flex items-center justify-center' :
              'relative'
              }`}
          >
            {isVideo ? (
              // Reproductor de video
              <div className="w-full h-full flex items-center justify-center bg-black">
                <video
                  ref={videoRef}
                  src={photo.url}
                  className="max-w-full max-h-full object-contain"
                  controls
                  playsInline
                  autoPlay
                />
                {/* Overlay con información */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-2 left-3 pointer-events-auto">
                    <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5">
                      <p className="text-white font-medium text-sm md:text-base">
                        {photo.profiles?.full_name ? photo.profiles.full_name.split(' ')[0] : "Usuario desconocido"} {new Date(photo.created_at).toLocaleString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="absolute top-2 right-3 pointer-events-auto flex space-x-2">
                    <button
                      onClick={() => handleFavorite(photo.id, photo.is_favorite)}
                      className="bg-black/50 backdrop-blur-sm rounded-full p-2 hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={photo.is_favorite ? "Quitar favorito" : "Marcar como favorito"}
                    >
                      {photo.is_favorite ? (
                        <Heart className="text-red-500 fill-red-500" size={20} />
                      ) : (
                        <Heart className="text-white" size={20} />
                      )}
                      {photo.favorites_count > 0 && (
                        <span className="absolute top-8.5 right-1 bg-black/50 text-white text-xs rounded-full h-5 w-7 flex items-center justify-center">
                          {photo.favorites_count}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Imagen
              <>
                <Image
                  src={photo.url}
                  alt={photo.description || `Foto de ${photo.profiles?.full_name || 'usuario'}`}
                  fill
                  className={`object-contain ${isIosFullscreen ? 'w-full h-full' : ''
                    }`}
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                {/* Información sobre la imagen */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-2 left-3 pointer-events-auto">
                    <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5">
                      <p className="text-white font-medium text-sm md:text-base">
                        {photo.profiles?.full_name ? photo.profiles.full_name.split(' ')[0] : "Usuario desconocido"} {new Date(photo.created_at).toLocaleString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="absolute top-2 right-3 pointer-events-auto flex space-x-2">
                    <button
                      onClick={() => handleFavorite(photo.id, photo.is_favorite)}
                      className="bg-black/50 backdrop-blur-sm rounded-full p-2 hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={photo.is_favorite ? "Quitar favorito" : "Marcar como favorito"}
                    >
                      {photo.is_favorite ? (
                        <Heart className="text-red-500 fill-red-500" size={20} />
                      ) : (
                        <Heart className="text-white" size={20} />
                      )}
                      {photo.favorites_count > 0 && (
                        <span className="absolute top-8.5 right-1 bg-black/50 text-white text-xs rounded-full h-5 w-7 flex items-center justify-center">
                          {photo.favorites_count}
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="absolute top-20 right-3 pointer-events-auto flex space-x-2">
                    <button
                      onClick={toggleFullscreen}
                      className="bg-black/50 backdrop-blur-sm rounded-full p-2 hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={isFullscreen || isIosFullscreen ? "Salir de pantalla completa" : "Ver en pantalla completa"}
                    >
                      {isFullscreen || isIosFullscreen ? (
                        <Minimize2 className="text-white" size={20} />
                      ) : (
                        <Maximize2 className="text-white" size={20} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Botón siguiente (mitad derecha) */}
        {hasNext && (
          <button
            onClick={goToNext}
            className="hidden lg:flex lg:w-1/2 h-full items-center justify-end pr-4 focus:outline-none group"
            aria-label="Foto siguiente"
          >
            <div className="p-3 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-all opacity-70 group-hover:opacity-100">
              <ChevronRight size={32} />
            </div>
          </button>
        )}
      </div>

      {/* Botones de navegación en móviles */}
      <div className="fixed bottom-[50%] left-0 right-0 flex justify-between px-[5%] items-center lg:hidden z-10">
        <button
          onClick={goToPrev}
          disabled={!hasPrev}
          className={`p-2 rounded-full backdrop-blur-sm transition-all ${hasPrev
            ? 'bg-black/20 hover:bg-blue-500 text-white'
            : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
            }`}
          aria-label="Foto anterior"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={goToNext}
          disabled={!hasNext}
          className={`p-2 rounded-full backdrop-blur-sm transition-all ${hasNext
            ? 'bg-black/20 hover:bg-blue-500 text-white'
            : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
            }`}
          aria-label="Foto siguiente"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Sección de Comentarios debajo de la foto */}
      <div className="fixed bottom-3 w-full max-w-4xl">
        <div
          ref={commentsContainerRef}
          className="bg-gray-700/30 rounded-lg p-3 mb-2 max-h-40 overflow-y-auto"
        >
          {comments.length === 0 ? (
            <p className="text-gray-400 text-center py-2">Aún no hay comentarios. ¡Sé el primero en escribir uno!</p>
          ) : (
            <div className="space-y-2">
              {comments.map((comment) => {
                const fullName = comment.profiles?.full_name || comment.user_id || "Usuario Anónimo";
                const firstName = fullName.split(' ')[0];

                return (
                  <div key={comment.id} className="bg-gray-700/50 rounded p-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm">
                          <span className="text-gray-400">{firstName}</span>{" "}
                          <span className="text-white">{comment.content}</span>
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(comment.created_at).toLocaleTimeString("es-ES", {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Formulario para nuevo comentario */}
        <form onSubmit={handleAddComment} className="flex flex-col gap-2">
          <div className="relative">
            <div className='flex justify-between items-end space-x-2'>
              <textarea
                name="comment-input"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onInput={(e) => {
                  const target = e.target;
                  target.rows = 1;
                  const currentRows = Math.ceil(target.scrollHeight / target.clientHeight);
                  target.rows = Math.min(currentRows, 3);
                }}
                placeholder="Escribe un comentario..."
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                maxLength={MAX_COMMENT_LENGTH}
                rows={1}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || newComment.length > MAX_COMMENT_LENGTH}
                className={`bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm transition-colors h-[36px] ${!newComment.trim() || newComment.length > MAX_COMMENT_LENGTH
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
                  }`}
              >
                Enviar
              </button>
            </div>
            <div className="absolute bottom-0 right-22 text-xs text-gray-400">
              {newComment.length}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}