"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cookie } from "next/font/google";
import CopyCbuButton from "@/components/CopyCbuButton"; // Asegúrate de que este componente exista

const cookie = Cookie({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default function RegalosModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className={`cursor-pointer bg-gray-50/50 rounded-xl p-2 mt-2 text-pink-500 text-3xl sm:text-4xl font-bold text-center hover:bg-pink-100 transition-all duration-200 ${cookie.className}`}
      >
        🎁 Regalos 🎁
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[75vw] sm:max-w-[300px] bg-white rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className=" flex flex-col text-pink-600 text-xl font-bold">
                <span className="text-8xl mb-4">🎁</span>
                <span>¡Gracias por tu regalo!</span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 text-gray-700 text-center">
            <p className="mb-0 ">Si, deseas regalarme algo más que tu hermosa presencia...</p>            
            <p className="mb-2">te dejo mi CBU.</p>            
            <CopyCbuButton className="mt-4 w-full" /> {/* Tu botón existente para copiar */}
          </div>
          <div className="mt-6 flex justify-center">
            <Button variant="outline" onClick={() => setOpen(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}