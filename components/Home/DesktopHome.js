// app/page.js
import Link from "next/link";

export default function DesktopHome() {  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <main className="max-w-4xl mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-6">Bienvenido a EventShare</h1>
        <p className="text-xl text-gray-700 mb-8">
          La mejor plataforma para compartir tus eventos especiales con amigos y familiares.
        </p>
        <p className="text-lg text-gray-600 mb-8">
          Para una mejor experiencia, por favor visita nuestra versión móvil.
        </p>        
      </main>
    </div>
  );
}