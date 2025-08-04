'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ConfettiAnimation } from '@/components/confetti-animation';

export default function ThanksPage() {
  const router = useRouter();

  // Efecto para redirigir después de 8 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 8000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 overflow-hidden">
      {/* Animación de confeti */}
      <ConfettiAnimation />
      
      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4 py-16">
        {/* Icono de verificación */}
        <div className="mb-8 p-6 bg-green-500 rounded-full shadow-lg animate-bounce">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Mensaje principal */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 animate-fade-in">
          ¡Gracias por asistir!
        </h1>

        {/* Mensaje secundario */}
        <p className="text-xl text-indigo-100 max-w-2xl mb-10 animate-fade-in delay-100">
          Tu participación hizo que este evento fuera especial. Esperamos que hayas disfrutado de la experiencia tanto como nosotros disfrutamos preparándola para ti.
        </p>

        {/* Detalles del evento */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-md w-full border border-white/20 animate-fade-in delay-200">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Próximos eventos
          </h2>
          <p className="text-indigo-100 mb-4">
            No te pierdas nuestras próximas actividades. ¡Te mantendremos informado!
          </p>
          <Button 
            variant="secondary" 
            className="w-full mt-4"
            onClick={() => router.push('/events')}
          >
            Ver eventos futuros
          </Button>
        </div>

        {/* Botón para salir inmediatamente */}
        <Button
          variant="ghost"
          className="mt-10 text-white hover:text-white/80 animate-fade-in delay-300"
          onClick={() => router.push('/')}
        >
          Volver al inicio ahora
        </Button>

        {/* Mensaje de redirección automática */}
        <p className="text-white/70 mt-6 text-sm animate-fade-in delay-500">
          Serás redirigido automáticamente en 8 segundos...
        </p>
      </div>
    </div>
  );
}