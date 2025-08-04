import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import IrEventoButton from "@/components/IrEventoButton";
import EventoButton from "@/components/EventoButton";
import NoPuedoButton from "@/components/NoPuedoButton";
import CountdownTimer from "@/components/CountdownTimer";
import CopyCbuButton from "@/components/CopyCbuButton";
import { Bonheur_Royale } from "next/font/google";
import { Henny_Penny } from "next/font/google";

// 1. Cargar fuentes de forma óptima
const bonheurroyale = Bonheur_Royale({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const hennyPenny = Henny_Penny({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

// 2. Función para generar metadatos dinámicos
export async function generateMetadata({ params, searchParams }) {
  const awaitedParams = await params;
  const awaitedSearchParams = await searchParams;

  const slug = awaitedParams?.slug || "";
  const guestId = awaitedSearchParams?.guestId || "";

  if (!slug || !guestId) {
    return {
      title: "Error - Invitación no válida",
      description: "Faltan parámetros en la URL.",
    };
  }

  // Traer datos del evento
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!event) {
    return {
      title: "Error - Evento no encontrado",
      description: "No se encontró el evento solicitado.",
    };
  }

  // Generar URL completa
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://192.168.100.12:3000";
  const fullUrl = `${baseUrl}/login/${slug}?guestId=${guestId}`;

  // Formatear la fecha para la descripción
  let formattedDate = "Fecha no disponible";
  if (event.day) {
    const eventDay = new Date(event.day);
    if (!isNaN(eventDay)) {
      formattedDate = eventDay.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        // month: "long",
        // year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Argentina/Buenos_Aires",
      }).replace(/^(\w)(\w+)/, (_, firstLetter, restOfWord) => {
        return `${firstLetter.toUpperCase()}${restOfWord}`;
      });
    }
  }

  return {
    title: `${event.name} - Invitación Especial`,
    description: `${event.title} - ¡Te invitamos el ${formattedDate}! Haz clic para confirmar tu asistencia.`,
    openGraph: {
      title: `${event.name} - Invitación Especial`,
      description: `${event.title} - ¡Te invitamos el ${formattedDate}! Haz clic para confirmar tu asistencia.`,
      url: fullUrl,
      siteName: "Mavale Eventos",
      images: [
        {
          url: `${baseUrl}/invitation/background-meta.jpg`,
          width: 1200,
          height: 630,
          alt: "Fondo de invitación para el evento",
        },
      ],
      locale: "es_ES",
      type: "website",
    },
    whatsapp: {
      title: `${event.name} - Invitación Especial`,
      description: `${event.title} - ¡Te invitamos el ${formattedDate}! Haz clic para confirmar tu asistencia.`,
    },
  };
}

export default async function LoginPage({ params, searchParams }) {
  // --- CORRECCIÓN 1: Await params y searchParams ---
  const awaitedParams = await params;
  const awaitedSearchParams = await searchParams;

  const slug = awaitedParams?.slug || "";
  const guestId = awaitedSearchParams?.guestId || "";
  // --- FIN CORRECCIÓN 1 ---

  if (!slug || !guestId) {
    return (
      <div className="flex bg-gradient-to-br from-blue-100 to-indigo-100 justify-center min-h-screen items-center p-4">
        <Card className="w-[95%] max-w-md p-6 text-center">
          <h1 className="text-xl font-bold text-red-600">Error</h1>
          <p className="text-gray-700 mt-2">Faltan parámetros en la URL.</p>
        </Card>
      </div>
    );
  }

  // Traer datos del evento
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();

  // Traer datos del invitado
  const { data: guest } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", guestId)
    .single();

  if (!event || !guest) {
    return (
      <div className="flex bg-gradient-to-br from-blue-100 to-indigo-100 justify-center min-h-screen items-center p-4">
        <Card className="w-[95%] max-w-md p-6 text-center">
          <h1 className="text-xl font-bold text-red-600">Error</h1>
          <p className="text-gray-700 mt-2">Evento o invitado no encontrado.</p>
        </Card>
      </div>
    );
  }

  // Manejo de errores robusto para la fecha
  let formattedDate = "Fecha no disponible";
  if (event.day) {
    const eventDay = new Date(event.day);
    if (!isNaN(eventDay)) {
      formattedDate = eventDay.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Argentina/Buenos_Aires",
      }).replace(/^(\w)(\w+)/, (_, firstLetter, restOfWord) => {
        return `${firstLetter.toUpperCase()}${restOfWord}`;
      });
    }
  }
  let formattedConfirmDate = "Fecha no disponible";
  if (guest.confirm_at) {
    const confirmDate = new Date(guest.confirm_at);
    if (!isNaN(confirmDate)) {
      formattedConfirmDate = confirmDate.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Argentina/Buenos_Aires",
      });
    }
  }

  // Manejo de errores robusto para la ubicación
  let storeName = "Ubicación no disponible";
  let locationUrl = "#";
  if (event.location) {
    locationUrl = event.location;
    try {
      const url = new URL(locationUrl);
      const pathParts = url.pathname.split("/").filter((part) => part); // Filtra partes vacías
      const placeIndex = pathParts.indexOf("place");
      if (placeIndex !== -1 && placeIndex + 1 < pathParts.length) {
        storeName = decodeURIComponent(pathParts[placeIndex + 1]).replace(/\+/g, " ");
      } else {
        storeName = url.hostname || "Ver ubicación";
      }
    } catch (e) {
      console.error("Error parsing location URL:", e);
      storeName = "Ver ubicación";
    }
  }

  return (
    <>
      <div className="flex bg-gradient-to-br from-blue-100 to-indigo-100 justify-center min-h-screen">
        <Card className="relative w-[95%] my-auto max-w-md md:max-w-lg h-[720px] sm:h-[870px] overflow-hidden rounded-2xl shadow-xl">
          {/* Imagen de fondo dentro de la Card */}
          <Image
            src="/invitation/background.jpg"
            alt="Fondo de la Card"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />

          {/* Capa semitransparente opcional */}
          <div className="absolute inset-0 bg-black/10"></div>

          {/* Contenido encima de la imagen */}
          <CardContent className="relative z-10 flex flex-col items-center justify-center h-full text-white pt-0 pb-2">
            {/* 10. Encabezado del evento con fuentes responsivas */}
            <div className="flex-grow flex flex-col items-center justify-center text-center pt-22 pb-0 sm:pt-32 sm:pb-0">
              <h1 className={`text-pink-600 text-6xl sm:text-6xl md:text-8xl text-shadow-lg ${bonheurroyale.className}`}>
                {event.name}
              </h1>
              <h2 className={`text-black text-2xl sm:text-3xl md:text-4xl font-bold mt-0 sm:mt-0 ${hennyPenny.className}`}>
                {event.title}
              </h2>
            </div>

            {/* 12. Contenido de la invitación con scroll si es necesario */}
            <div className="flex-grow overflow-y-auto pt-1 pb-0 sm:py-4 px-2 sm:px-4">
              <div className="text-center mb-1 sm:mb-1">
                <h2 className="text-lg sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-1">
                  ¡{guest.full_name}!
                </h2>
                <h3 className="text-lg sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-1">
                  ¡Tienes una invitación especial!
                </h3>

                <p className="mt-1 sm:mt-1 text-gray-500 text-xs sm:text-sm mb-2 sm:mb-2">
                  Válido por {guest.adult} adulto/s
                  {guest.children === null && ` y ${guest.children} niño/s.`}
                </p>

                <div className="w-16 sm:w-24 h-1 bg-pink-500 mx-auto mb-3 sm:mb-4"></div>
              </div>

              {/* 13. Detalles del evento con diseño de tarjeta */}
              <div className="bg-gray-50/50 backdrop-blur-[2px] rounded-xl p-2 sm:p-4 mb-3 sm:mb-4 shadow-inner">
                <div className="grid grid-cols-1 gap-2 sm:gap-4">
                  <div className="flex items-start">
                    <div className="bg-indigo-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4 flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-base sm:text-lg">{formattedDate} hs.</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-indigo-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4 flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-base sm:text-lg">{storeName}</p>
                      <a
                        href={locationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm sm:text-base text-blue-600 hover:text-blue-800 hover:underline mt-0 inline-block"
                        title={`Ver ubicación en el mapa: ${storeName}`}
                      >
                        Ver ubicación
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* 16. Botón de acción centrado */}
              {guest.confirm ? (
                <div className="flex flex-col gap-2 justify-between mb-1">
                  <IrEventoButton
                    eventSlug={event.slug}
                    guestId={guest.id}
                    guestUserName={guest.username}
                    label="¡Ir al evento!"
                    className="w-full"
                  />
                  <p className="text-center text-gray-500 text-xs sm:text-sm">
                    Confirmado el: {formattedConfirmDate}.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 justify-between mb-0">
                  <div className="flex w-full justify-around">
                    <EventoButton
                      eventSlug={event.slug}
                      guestId={guest.id}
                      guestUserName={guest.username}
                      label="¡Sí, confirmo!"
                      className="w-full"
                    />
                    <NoPuedoButton
                      eventSlug={event.slug}
                      label="No, asistiré"
                      className="w-full"
                    />
                  </div>
                  <p className="text-center text-gray-500 text-xs sm:text-sm">
                    Haz clic para confirmar asistencia.
                  </p>
                </div>
              )}

              <CountdownTimer
                targetDate={event.day}
                title="¡Cuenta Regresiva!"
                description="Para el gran evento!!!"
              >
                <div className="text-center p-4 bg-green-100 rounded-lg">
                  <h3 className="text-2xl font-bold text-green-800">¡Feliz Evento!</h3>
                  <p className="text-green-600">El momento esperado finalmente ha llegado.</p>
                </div>
              </CountdownTimer>
            </div>

            <CopyCbuButton />
          </CardContent>

          <CardFooter
            className="bg-gray-50/20 backdrop-blur-[6px] flex items-center justify-center h-6 mx-4 border-t border-gray-200/50 rounded-t-lg md:rounded-lg pt-0 -mt-2"
          >
            <p className="text-gray-500 text-xs sm:text-sm text-center leading-none pb-6">
              © {new Date().getFullYear()} Mavale. Todos los derechos reservados.
            </p>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}