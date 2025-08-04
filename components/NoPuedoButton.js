//EventoButton.js
"use client";
import { useRouter } from "next/navigation";

export default function NoPuedoButton({ eventSlug, label = "No puedo, asistir" }) {
  const router = useRouter();

  const handleClick = () => {
    // Guardar evento en localStorage y redirigir
    localStorage.setItem("pendingEvent", eventSlug);
    // Redirigir a login
    router.push("/login");
  };

  return (
    <button
      onClick={handleClick}
      className="bg-gray-400 text-white text-md font-bold py-3 sm:py-3 px-4 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      {label}
    </button>
  );
}