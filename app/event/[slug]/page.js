//app/event/[slug]/page.js
import ProtectedRoute from "@/components/ProtectedRoute";
import EventClient from "@/components/EventClient";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function EventPage({ params }) {
  const { slug } = await params; // ✅ Unwrap de la promesa

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!event) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        Evento no encontrado
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <EventClient event={event} />
    </ProtectedRoute>
  );
}