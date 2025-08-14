// app/event/[slug]/page.js
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import EventClient from "@/components/EventClient";
import { supabase } from "@/lib/supabaseClient";

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

  return (
    <ProtectedRoute>
      <Navbar event={event} />
      <EventClient event={event} />
    </ProtectedRoute>
  );
}