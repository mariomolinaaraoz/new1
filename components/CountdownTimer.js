// components/CountdownTimer.jsx
"use client";

import { useState, useEffect } from 'react';

/**
 * Componente de cuenta regresiva reutilizable.
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

  // Convertir targetDate a objeto Date si es string
  const target = new Date(targetDate);

  useEffect(() => {
    setIsMounted(true);

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = target.getTime() - now.getTime();

      if (difference <= 0) {
        // Si la fecha objetivo ya pasó
        if (onComplete) onComplete();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

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

  // Verificar si el tiempo ha terminado
  const isTimeUp = timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0 &&
    isMounted; // Solo considerar "terminado" si el componente está montado

  // Si se proporciona children y el tiempo terminó, mostrar children
  if (isTimeUp && children) {
    return <div>{children}</div>;
  }

  return (
    <div className="relative p-1 rounded-lg text-center shadow-sm overflow-hidden">
      {/* <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-indigo-100 animate-pulse"></div> */}

      <div className="relative z-10">
        {title && <h2 className="text-sm font-bold mb-2 text-gray-800">{title}</h2>}
        {/* {description && <p className="text-md mb-4 text-gray-600">{description}</p>} */}

        <div className="flex justify-center space-x-2 md:space-x-4">
          <TimeUnit value={timeLeft.days} label="Días" />
          <div className="flex items-center text-2xl font-bold text-gray-400">:</div>
          <TimeUnit value={timeLeft.hours} label="Horas" />
          <div className="flex items-center text-2xl font-bold text-gray-400">:</div>
          <TimeUnit value={timeLeft.minutes} label="Min" />
          <div className="flex items-center text-2xl font-bold text-gray-400">:</div>
          <TimeUnit value={timeLeft.seconds} label="Seg" />
        </div>

        {isTimeUp && !children && (
          <div className="mt-4 text-xl font-semibold text-green-600">
            ¡El momento ha llegado!
          </div>
        )}
      </div>
    </div>

  );
};

// Componente auxiliar para mostrar cada unidad de tiempo
const TimeUnit = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <div className="bg-white p-1 rounded-lg shadow w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">
      <span className="text-lg md:text-2xl font-bold text-gray-800">
        {String(value).padStart(2, '0')}
      </span>
    </div>
    <span className="text-xs md:text-sm mt-1 text-gray-600 uppercase tracking-wide">
      {label}
    </span>
  </div>
);

export default CountdownTimer;