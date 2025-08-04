"use client";

import { useState } from "react";
import { CheckCircle, Copy } from "lucide-react";

export default function CopyCBU() {
  const CBU = "4530000800012888762220";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(CBU);
      } else {
        // Fallback para navegadores viejos
        const textArea = document.createElement("textarea");
        textArea.value = CBU;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  return (
    <div className="flex items-baseline mt-0">
      <span className="text-2xl mr-1">🎁</span>
      <div
        onClick={handleCopy}
        className="relative mt-4 flex items-center justify-between w-full max-w-sm px-4 py-1 bg-gray-200/70 rounded-lg shadow cursor-pointer group"
        title="Copiar CBU"
      >
        <span className="text-gray-800 font-mono text-sm mr-2">NUMERO DE CBU</span>

        {/* Ícono dinámico */}
        {copied ? (
          <CheckCircle className="text-green-500 transition-transform duration-300 transform scale-110" size={22} />
        ) : (
          <Copy className="text-gray-500 group-hover:text-pink-500 transition-colors" size={22} />
        )}

        {/* Tooltip flotante */}
        {!copied && (
          <div className="absolute -top-8 right-2 bg-black text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Copiar CBU
          </div>
        )}

        {copied && (
          <div className="absolute -top-8 right-2 bg-green-600 text-white text-xs rounded-md px-2 py-1 animate-fade-in">
            ¡Copiado!
          </div>
        )}
      </div>
      <span className="text-2xl ml-1">🎁</span>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
