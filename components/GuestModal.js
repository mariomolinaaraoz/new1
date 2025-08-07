// GuestModal.js
"use client";

import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function GuestModal({ guest, event, children }) {
    const router = useRouter();

    // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return null;

    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    // Devuelve un array en lugar de un objeto
    return [
      `${day}/${month}/${year}`,
      `${hours}:${minutes} hs.`
    ];
  };

const handleInvitationClick = () => {
    if (!event || !guest) {
      alert("Debes seleccionar un evento y un invitado.");
      return;
    }

    const url = `/invitation/${event.slug}?guestId=${guest.id}`;
    router.push(url);
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Detalles del Invitado</DialogTitle>
        </DialogHeader>
        <div className="bg-neutral-400/50 rounded-lg p-4 flex flex-row md:flex-row items-start justify-between space-x-4">
                  {/* Información del invitado */}
                  <div className="space-y-2">
                    <h3 className="font-semibold">Información Personal</h3>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Usuario:</span> {guest.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Nombre:</span> {guest.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Confirmado:</span>{" "}
                      <span className={guest.confirm ? "text-green-600" : "text-red-600"}>
                        {guest.confirm ? "✅ Sí" : "❌ No"}
                      </span>
                    </p>
                    {guest.confirm_at && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Fecha:</span>{" "}
                        {formatDate(guest.confirm_at)} hs
                      </p>
                    )}
                  </div>

                  {/* Información de acompañantes */}
                  <div className="space-y-2">
                    <h3 className="font-semibold">Acompañantes</h3>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Adultos:</span> {guest.adult || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Niños:</span> {guest.children || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Total:</span>{" "}
                      {(guest.adult || 0) + (guest.children || 0)}
                    </p>
                  </div>


                  {/* QR y acción */}
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="bg-white rounded-lg p-2">
                      <QRCodeCanvas
                        value={`${window.location.origin}/invitation/${event.slug}?guestId=${guest.id}`}
                        size={150}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="H"
                        marginSize={0}
                      />
                    </div>
                    <Button onClick={handleInvitationClick} >
                      Ir a la Invitación
                    </Button>
                  </div>
                </div>
      </DialogContent>
    </Dialog>
  );
}