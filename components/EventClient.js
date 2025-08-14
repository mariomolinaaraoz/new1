"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import CountdownTimer from "./CountdownTimer";
import UploadButton from "./UploadButton";
import { usePhotos } from "@/hooks/usePhotos";
import { Heart } from "lucide-react";

const isVideoUrl = (url) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

export default function EventClient({ event }) {
  const { photos, unseenPhotos, handleFavorite, markPhotosAsSeen, addPhotoOptimistic } = usePhotos(event.id);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const videoRefs = useRef([]);
  const observerRef = useRef(null);
  const hasRestoredScrollRef = useRef(false);
  const photosHeaderRef = useRef(null); // Nueva referencia para el título de fotos
  
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

  // Resto de tus efectos existentes...
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleVideoVisibility = (entries) => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) {
          video.play().catch(error => {
            console.log("Autoplay prevented for video:", error);
          });
        } else {
          video.pause();
        }
      });
    };

    if (window.IntersectionObserver) {
      observerRef.current = new IntersectionObserver(handleVideoVisibility, {
        threshold: 0.5,
        rootMargin: '0px'
      });

      videoRefs.current.forEach(video => {
        if (video) observerRef.current.observe(video);
      });
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      videoRefs.current = [];
    };
  }, [photos]);

  const setVideoRef = useCallback((element, index) => {
    if (element) {
      videoRefs.current[index] = element;
    }
  }, []);

  useEffect(() => {
    if (!hasRestoredScrollRef.current && photos.length > 0) {
      const savedScrollPosition = sessionStorage.getItem(`scrollPosition-${event.slug}`);
      if (savedScrollPosition) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedScrollPosition, 10));
          hasRestoredScrollRef.current = true;
        }, 100);
      } else {
        hasRestoredScrollRef.current = true;
      }
    }
  }, [photos, event.slug]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePhotoClick = (photoId) => {
    sessionStorage.setItem(`scrollPosition-${event.slug}`, window.scrollY.toString());
  };

  // Nueva función para manejar el click en la notificación
  const handleNewPhotosNotification = () => {
    markPhotosAsSeen(); // Marcar fotos como vistas
    
    // Hacer scroll al header de fotos
    if (photosHeaderRef.current) {
      photosHeaderRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    } else {
      // Fallback: scroll al inicio de la página
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-gray-900 text-white min-h-screen">
      {/* Notificación de recarga por inactividad */}
      {showRefreshWarning && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          La página se actualizará por inactividad en 30 segundos...
        </div>
      )}
      {/* Botón volver arriba */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-blue-700 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 md:bottom-8 md:right-8"
          aria-label="Volver arriba"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      )}

      {/* Notificación de fotos nuevas */}
      {unseenPhotos.length > 0 && (
        <div className="fixed top-20 right-4 z-50 md:top-24 md:right-6">
          <button
            onClick={handleNewPhotosNotification} // Cambiado a la nueva función
            className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm shadow-lg flex items-center hover:bg-blue-700 transition-colors"
          >
            <span className="mr-2">{unseenPhotos.length} nueva{unseenPhotos.length > 1 ? "s" : ""}</span>
            <span>×</span>
          </button>
        </div>
      )}

      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center">
        {event.name || event.title}
      </h1>

      <div className="mb-6">
        <CountdownTimer
          targetDate={event.day}
          title="¡Cuenta Regresiva!"
          description="Para el gran evento!!!"
        />
      </div>

      <div className="mb-8 flex justify-center">
        <UploadButton
          eventId={event.id}
          onPhotoUploaded={addPhotoOptimistic}
        />
      </div>

      <h2 className="text-xl font-semibold mt-6 mb-4 text-center">Fotos del evento</h2>

      {/* Grid responsivo: 1 columna en móvil, 2 en tablet, 3 en desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((photo, index) => {
          const isVideo = isVideoUrl(photo.url);

          return (
            <Link
              href={{
                pathname: `/event/${event.slug}/photo/${photo.id}`,
                query: { photoIndex: index }
              }}
              key={photo.id}
              className={`relative group overflow-hidden rounded-xl shadow-lg transition-transform duration-300 hover:scale-[1.02] ${unseenPhotos.includes(photo.id)
                ? "ring-2 ring-blue-500 shadow-blue-500/30"
                : "ring-1 ring-gray-700"
                }`}
                // --- MODIFICADO: Añadir onClick para guardar scroll ---
              onClick={() => handlePhotoClick(photo.id)}
              // --- FIN MODIFICADO ---
            >
              <div className="relative w-full aspect-square">
                {isVideo ? (
                  // Reproductor de video para archivos de video
                  <video
                  ref={(el) => setVideoRef(el, index)} // Asignar ref usando useCallback
                    src={photo.url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    autoPlay                    
                  />
                ) : (
                  // Imagen para archivos de imagen
                  <Image
                    src={photo.url}
                    alt={`Foto de ${photo.profiles?.full_name || "usuario"} en ${event.name}`}
                    fill
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,..."
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="eager"
                  />
                )}

                {/* Overlay con información */}

                {/* Nombre del usuario en la esquina superior izquierda */}
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

                {/* Botón de favorito en la esquina superior derecha */}
                <div className="absolute top-2 right-3 pointer-events-auto">
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

                <div className="absolute bottom-3 right-5 pointer-events-auto bg-black/70 rounded-full p-1">
                  {/* Icono para indicar que es un video */}
                  {isVideo && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className=" h-5 w-5 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  )}
                </div>                
              </div>
            </Link>
          );
        })}
      </div>

      {/* Mensaje cuando no hay fotos */}
      {photos.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto mb-4 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-lg">Aún no hay fotos en este evento</p>
          <p className="mt-2">¡Sé el primero en compartir una!</p>
        </div>
      )}
    </div>
  );
}