// components/CountdownTimer.jsx
"use client";

import { useState, useEffect } from 'react';

/**
 * Componente de cuenta regresiva reutilizable con efectos festivos.
 * 
 * @param {Object} props
 * @param {string|Date} props.targetDate - La fecha objetivo en formato string (ISO) o un objeto Date.
 * @param {string} [props.title] - Título opcional para mostrar sobre el contador.
 * @param {string} [props.description] - Descripción opcional.
 * @param {React.ReactNode} [props.children] - Contenido personalizado para mostrar cuando termina la cuenta regresiva.
 * @param {Function} [props.onComplete] - Callback que se ejecuta cuando termina la cuenta regresiva.
 */
const CountdownTimer = ({
  targetDate,
  title,
  description,
  children,
  onComplete
}) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [isFinalCountdown, setIsFinalCountdown] = useState(false); // Nuevo estado para la cuenta regresiva final
  const [showFinalMessage, setShowFinalMessage] = useState(false); // Nuevo estado para mostrar el mensaje final

  // Convertir targetDate a objeto Date si es string
  const target = new Date(targetDate);

  useEffect(() => {
    setIsMounted(true);

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = target.getTime() - now.getTime();

      // Si la fecha objetivo ya pasó
      if (difference <= 0) {
        if (onComplete) onComplete();
        setShowFinalMessage(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      // Activar la cuenta regresiva final cuando queden 10 segundos o menos
      if (days === 0 && hours === 0 && minutes === 0 && seconds <= 10 && seconds > 0) {
        setIsFinalCountdown(true);
      } else {
        setIsFinalCountdown(false); // Resetear si el tiempo cambia
      }

      // Mostrar el mensaje final cuando el tiempo llegue a cero
      if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
        setShowFinalMessage(true);
      }

      return { days, hours, minutes, seconds };
    };

    // Calcular inmediatamente
    setTimeLeft(calculateTimeLeft());

    // Configurar intervalo
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Limpiar intervalo
    return () => {
      clearInterval(timer);
      setIsMounted(false);
    };
  }, [targetDate, onComplete]);

  // Si se proporciona children y el tiempo terminó, mostrar children
  if (showFinalMessage && children) {
    return <div>{children}</div>;
  }

  // Mostrar el mensaje final festivo si no hay children
  if (showFinalMessage && !children) {
    return (
      <div className="relative p-6 rounded-xl text-center shadow-lg overflow-hidden bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 animate-pulse">
        <div className="relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-2 text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] animate-bounce">
            Mis 75 años
          </h2>
          <p className="text-2xl md:text-4xl font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] animate-pulse">
            ¡Bienvenidos!
          </p>
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-4 h-4 bg-yellow-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-4 h-4 bg-yellow-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-4 h-4 bg-yellow-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative p-4 rounded-xl text-center shadow-lg overflow-hidden ${isFinalCountdown ? 'bg-gradient-to-r from-red-600 to-orange-500 animate-pulse' : 'bg-gradient-to-r from-blue-400 to-indigo-300'}`}>
      <div className="relative z-10">
        {title && <h2 className="text-lg md:text-xl font-bold mb-2 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">{title}</h2>}
        
        <div className="flex justify-center space-x-1 md:space-x-3">
          <TimeUnit 
            value={timeLeft.days} 
            label="Días" 
            isFinalCountdown={isFinalCountdown}
          />
          <div className="flex items-center text-2xl md:text-4xl font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">:</div>
          <TimeUnit 
            value={timeLeft.hours} 
            label="Horas" 
            isFinalCountdown={isFinalCountdown}
          />
          <div className="flex items-center text-2xl md:text-4xl font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">:</div>
          <TimeUnit 
            value={timeLeft.minutes} 
            label="Min" 
            isFinalCountdown={isFinalCountdown}
          />
          <div className="flex items-center text-2xl md:text-4xl font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">:</div>
          <TimeUnit 
            value={timeLeft.seconds} 
            label="Seg" 
            isFinalCountdown={isFinalCountdown}
          />
        </div>

        {description && <p className="text-sm md:text-base mt-3 text-white/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">{description}</p>}
      </div>
    </div>
  );
};

// Componente auxiliar para mostrar cada unidad de tiempo
const TimeUnit = ({ value, label, isFinalCountdown }) => (
  <div className="flex flex-col items-center">
    <div className={`p-2 rounded-xl shadow-lg w-14 h-14 md:w-16 md:h-16 flex items-center justify-center ${isFinalCountdown ? 'bg-white/90' : 'bg-white/80'}`}>
      <span className={`text-xl md:text-3xl font-extrabold ${isFinalCountdown ? 'text-red-600' : 'text-gray-800'}`}>
        {String(value).padStart(2, '0')}
      </span>
    </div>
    <span className="text-xs md:text-sm mt-1 text-white font-semibold drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] uppercase tracking-wide">
      {label}
    </span>
  </div>
);

export default CountdownTimer;