//NoPuedoButton.js
"use client";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NoPuedoButton({
  eventSlug,
  guestId,
  guestUserName,
  label = "No, asistiré",
  className = ""
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

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
        .update({ confirm: false, confirm_at: new Date() })
        .eq("id", guestId);

      if (updateError) throw updateError;

      setShowModal(true);

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

  const closeModal = () => {
    setShowModal(false);
    router.push(`/event/${eventSlug}`);
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
        className="bg-gray-400 text-white text-md font-bold py-3 sm:py-3 px-4 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      >
        {isLoading ? 'Confirmando...' : label}
      </button>

      {error && (
        <p className="mt-2 text-red-500 text-sm text-center max-w-xs">
          {error}
        </p>
      )}

      {/* Modal que aparece SOLO después de grabar en Supabase */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirmación</h3>
            <p className="mb-6">Lamentamos que no puedas asistir, muchas gracias por confirmar.</p>
            <div className="flex justify-end">
              <button
                onClick={closeModal}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}