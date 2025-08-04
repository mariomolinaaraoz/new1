// components/InvitationCard.js
"use client";

import Link from "next/link";
import Image from "next/image";

export default function InvitationCard({ event }) {
  // Formatear la fecha del evento
  const eventDate = new Date(event.day);
  const formattedDate = eventDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Imagen del evento */}
      <div className="relative h-48">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={`Imagen del evento ${event.name}`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="bg-gradient-to-r from-blue-400 to-indigo-600 w-full h-full flex items-center justify-center">
            <span className="text-white text-3xl font-bold">{event.name.charAt(0)}</span>
          </div>
        )}
      </div>

      {/* Contenido de la tarjeta */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{event.name}</h3>
        <p className="text-gray-600 mb-4 capitalize">{formattedDate} hs.</p>
        
        {event.description && (
          <p className="text-gray-500 text-sm mb-4 line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="flex justify-between items-center">
          <Link
            href={`/invitation/${event.slug}`}
            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
          >
            Ver invitación
          </Link>
          <Link
            href={`/invitacion/${event.slug}`}
            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
          >
            Ver invitación
          </Link>
          <Link
            href={`/event/${event.slug}`}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Acceder
          </Link>
        </div>
      </div>
    </div>
  );
}