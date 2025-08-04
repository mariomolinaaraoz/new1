// app/invitation/[slug]/page.js
import { createClient } from "@supabase/supabase-js";
import EventoButton from "@/components/EventoButton";
import { Bonheur_Royale } from 'next/font/google';
import { Henny_Penny } from 'next/font/google';
import CountdownTimer from "@/components/CountdownTimer";
import Link from 'next/link'; // Importar Link
import Image from 'next/image'; // Importar Image si se usa una imagen de fondo

import { Card, CardContent, CardFooter } from "@/components/ui/card"

// 1. Cargar fuentes de forma óptima
const bonheurroyale = Bonheur_Royale({
  subsets: ['latin'],
  weight: '400',
  // display: 'swap', // Mejora el rendimiento de carga
});

const hennyPenny = Henny_Penny({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function InvitacionPage({ params }) {
  const { slug } = await params;

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!event) {
    return (
      // 2. Mejorar el diseño de la página de error y hacerla responsiva
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="text-center p-6 bg-white rounded-xl shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Evento no encontrado</h1>
          <Link
            href="/"
            className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
            aria-label="Volver a la página principal"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // 3. Manejo de errores robusto para la fecha
  let formattedDate = 'Fecha no disponible';
  if (event.day) {
    const eventDate = new Date(event.day);
    if (!isNaN(eventDate)) {
      formattedDate = eventDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Argentina/Buenos_Aires' // O especifica la zona horaria correcta
      });
    }
  }

  // 4. Manejo de errores robusto para la ubicación
  let storeName = 'Ubicación no disponible';
  let locationUrl = '#';
  if (event.location) {
    locationUrl = event.location;
    try {
      const url = new URL(event.location);
      const pathParts = url.pathname.split('/').filter(part => part); // Filtra partes vacías
      const placeIndex = pathParts.indexOf('place');
      if (placeIndex !== -1 && placeIndex + 1 < pathParts.length) {
        storeName = decodeURIComponent(pathParts[placeIndex + 1]).replace(/\+/g, ' ');
      } else {
        // Si no se puede parsear, usar el hostname o parte de la URL
        storeName = url.hostname || 'Ver ubicación';
      }
    } catch (e) {
      console.error("Error parsing location URL:", e);
      storeName = 'Ver ubicación';
    }
  }

  return (
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
            {/* 11. Tamaños de fuente responsivos */}
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
                ¡Mónica!
              </h2>
              <h3 className="text-lg sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-1">
                ¡Tienes una invitación especial!
              </h3>

              <p className="mt-1 sm:mt-1 text-gray-500 text-xs sm:text-sm mb-2 sm:mb-2">
                Válido por 3 personas.
              </p>
              <div className="w-16 sm:w-24 h-1 bg-pink-500 mx-auto mb-3 sm:mb-4"></div>
              {/* <p className="text-gray-600 text-base sm:text-lg">
                    Te invitamos a ser parte de este evento único
                  </p> */}
            </div>

            {/* 13. Detalles del evento con diseño de tarjeta */}
            <div className="bg-gray-50/50 backdrop-blur-[2px] rounded-xl p-2 sm:p-4 mb-4 sm:mb-4 shadow-inner">
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-base sm:text-lg">{storeName}</p>
                    {/* 14. Enlace accesible con title */}
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
            <div className="text-center mb-2">
              <div className="inline-block w-full max-w-xs">
                <EventoButton
                  eventSlug={event.slug}
                  label="Aceptar Invitación"
                  className="w-full" // Pasar clase al componente si lo acepta
                />
              </div>
              <p className="mt-2 sm:mt-2 text-gray-500 text-xs sm:text-sm">
                Haz clic para acceder al evento
              </p>
            </div>

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

        </CardContent>

        <CardFooter
          className="bg-gray-50/50 backdrop-blur-[6px] flex items-center justify-center h-10 mx-4 border-t border-gray-200/50 rounded-t-lg md:rounded-lg pt-0 mt-0"
        >
          <p className="text-gray-600 text-xs sm:text-sm text-center leading-none pb-5">
            © {new Date().getFullYear()} Mavale. Todos los derechos reservados.
          </p>
        </CardFooter>

      </Card>
    </div>
  );
}