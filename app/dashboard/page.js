// app/dashboard/page.js
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function DashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [guests, setGuests] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedGuest, setSelectedGuest] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase.from("events").select("*");
      if (!error) setEvents(data);
    };
    fetchEvents();
  }, []);

  const handleEventChange = async (eventId) => {
    // Limpiar selecciones anteriores
    setSelectedGuest(null);

    // Si se selecciona el placeholder, limpiar todo
    if (eventId === "placeholder") {
      setSelectedEvent(null);
      setGuests([]);
      return;
    }

    const event = events.find((e) => e.id === eventId);
    setSelectedEvent(event);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("event_id", eventId);

      if (error) throw error;

      setGuests(data || []);
    } catch (error) {
      console.error("Error fetching guests:", error.message);
      setGuests([]);
    }
  };

  const handleGuestChange = (guestId) => {
    // Si se selecciona el placeholder, limpiar invitado
    if (guestId === "placeholder") {
      setSelectedGuest(null);
      return;
    }

    const guest = guests.find((g) => g.id === guestId);
    setSelectedGuest(guest);
  };

  const handleInvitationClick = () => {
    if (!selectedEvent || !selectedGuest) {
      alert("Debes seleccionar un evento y un invitado.");
      return;
    }

    const url = `/invitation/${selectedEvent.slug}?guestId=${selectedGuest.id}`;
    router.push(url);
  };

  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";

    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalAdults = guests.reduce((sum, g) => sum + (g.adult || 0), 0);
  const totalChildren = guests.reduce((sum, g) => sum + (g.children || 0), 0);
  const totalGuests = totalAdults + totalChildren;

  return (
    <ProtectedRoute>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            Gestión de Eventos
          </h1>
          <div className="flex flex-col md:flex-row  justify-between md:space-x-4 mb-4">
            {/* Selección de evento */}
            <Card className="w-[45%]">
              <CardHeader>
                <CardTitle>Selecciona un evento:</CardTitle>
                <CardDescription>Elige un evento para ver sus invitados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label htmlFor="event-select">Evento</Label>
                  <Select
                    onValueChange={handleEventChange}
                    value={selectedEvent?.id || ""}
                  >
                    <SelectTrigger id="event-select">
                      <SelectValue placeholder="Selecciona un evento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder">Selecciona un evento</SelectItem>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Información del evento seleccionado */}
            {selectedEvent && (
              <Card className="w-[45%]">
                <CardHeader>
                  <CardTitle>{selectedEvent.name}</CardTitle>
                  <CardDescription>Detalles del evento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{selectedEvent.title}</h3>
                      <p className="text-muted-foreground">
                        📅 {formatDate(selectedEvent.day)} hs
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>


          {/* Selección de invitado */}
          {selectedEvent && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Selecciona un invitado:</CardTitle>
                {/* <CardDescription>Elige un invitado para ver sus detalles</CardDescription> */}
              </CardHeader>
              <CardContent>
                <div className="bg-neutral-400/50 rounded-lg p-4 flex flex-row md:flex-row items-start justify-between space-x-4">

                  <div className="space-y-2">
                    {/* <Label htmlFor="guest-select">Invitado</Label> */}
                    <Select
                      onValueChange={handleGuestChange}
                      value={selectedGuest?.id || ""}
                      disabled={!selectedEvent}
                    >
                      <SelectTrigger id="guest-select">
                        <SelectValue placeholder="Selecciona un invitado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="placeholder">Selecciona un invitado</SelectItem>
                        {guests.map((guest) => (
                          <SelectItem key={guest.id} value={guest.id}>
                            {guest.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <p className="font-semibold">Resumen de Invitados:</p>
                    <div className="grid grid-cols-2">
                      <p>Adultos: <span className="font-bold">{totalAdults}</span></p>
                      <p>Niños: <span className="font-bold">{totalChildren}</span></p>
                    </div>
                    <p>Total: <span className="font-bold">{totalGuests}</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detalles del invitado */}
          {selectedGuest && (
            <Card>
              <CardHeader>
                <CardTitle>Detalles del Invitado:</CardTitle>
                {/* <CardDescription>Información completa del invitado seleccionado</CardDescription> */}
              </CardHeader>
              <CardContent>
                <div className="bg-neutral-400/50 rounded-lg p-4 flex flex-row md:flex-row items-start justify-between space-x-4">
                  {/* Información del invitado */}
                  <div className="space-y-2">
                    <h3 className="font-semibold">Información Personal</h3>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Usuario:</span> {selectedGuest.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Nombre:</span> {selectedGuest.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Confirmado:</span>{" "}
                      <span className={selectedGuest.confirm ? "text-green-600" : "text-red-600"}>
                        {selectedGuest.confirm ? "✅ Sí" : "❌ No"}
                      </span>
                    </p>
                    {selectedGuest.confirm_at && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Fecha:</span>{" "}
                        {formatDate(selectedGuest.confirm_at)} hs
                      </p>
                    )}
                  </div>

                  {/* Información de acompañantes */}
                  <div className="space-y-2">
                    <h3 className="font-semibold">Acompañantes</h3>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Adultos:</span> {selectedGuest.adult || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Niños:</span> {selectedGuest.children || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Total:</span>{" "}
                      {(selectedGuest.adult || 0) + (selectedGuest.children || 0)}
                    </p>
                  </div>


                  {/* QR y acción */}
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="bg-white rounded-lg p-2">
                      <QRCodeCanvas
                        value={`${window.location.origin}/login/${selectedEvent.slug}?guestId=${selectedGuest.id}`}
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
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}