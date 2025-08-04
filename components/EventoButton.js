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

      // 2. Actualizar confirm en profiles
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ confirm: true, confirm_at: new Date() })
        .eq("id", guestId);

      if (updateError) throw updateError;

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
        className={`bg-gradient-to-r from-pink-600 to-pink-500 text-white text-md font-bold py-3 px-4 rounded-full shadow-lg hover:shadow-xl transition-transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
      >
        {isLoading ? 'Confirmando...' : label}
      </button>
      
      {error && (
        <p className="mt-2 text-red-500 text-sm text-center max-w-xs">
          {error}
        </p>
      )}
    </div>
  );
}