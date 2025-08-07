// app/event/[slug]/page.js
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import EventClient from "@/components/EventClient";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function EventPage({ params }) {
  const { slug } = await params;

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!event || event.active === false) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        Evento no encontrado
      </div>
    );
  }

  // Obtener la fecha actual y la fecha del evento
  const currentDate = new Date();
  const eventDate = new Date(event.day);
  
  // Comparar fechas (sin horas)
  const isBeforeEventDate = currentDate < eventDate;

  if (isBeforeEventDate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            ¡Pronto comenzará el evento!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Estamos preparando todo para que sea una noche memorable.
          </p>
          <div className="animate-pulse text-blue-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <Navbar event={event} />
      <EventClient event={event} />
    </ProtectedRoute>
  );
}