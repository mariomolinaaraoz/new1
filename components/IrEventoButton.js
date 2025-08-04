"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EventoButton({
  eventSlug,
  guestId,
  guestUserName,
  label = "¡Sí, confirmo!",
  className = ""
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    if (!eventSlug || !guestId) {
      setError("Faltan parámetros requeridos");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Login con Supabase
      const email = `${guestUserName}@gmail.com`;
      const password = "123456";

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 3. Redirigir a la página del evento
      router.push(`/event/${eventSlug}`);
    } catch (err) {
      console.error("Error:", err.message);
      setError("Error al confirmar asistencia: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!eventSlug || !guestId) {
    return (
      <div className={`bg-gray-300 text-gray-600 font-bold py-3 px-4 rounded-full ${className}`}>
        Configuración incompleta
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className={`
    ${isLoading
            ? 'bg-gray-400 cursor-wait'
            : 'bg-gradient-to-r from-pink-600 to-pink-500 hover:shadow-xl hover:-translate-y-1'
          }
    text-white text-md font-bold py-3 px-8 rounded-full shadow-lg transition-transform
    disabled:opacity-70 disabled:cursor-not-allowed ${className}
  `}
      >
        {isLoading ? 'Ingresando...' : label}
      </button>

      {error && (
        <p className="mt-2 text-red-500 text-sm text-center max-w-xs">
          {error}
        </p>
      )}
    </div>
  );
}