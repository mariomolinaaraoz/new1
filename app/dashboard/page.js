// app/dashboard/page.js
"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProtectedRoute from "@/components/ProtectedRoute";
import { GuestModal } from "@/components/GuestModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, Search, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Filter } from "lucide-react";

export default function DashboardPage() {
  // Estados principales
  const [events, setEvents] = useState([]);
  const [guests, setGuests] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  // Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [searchColumn, setSearchColumn] = useState("full_name");
  // Estados para ordenación
  const [sortConfig, setSortConfig] = useState({
    key: 'full_name',
    direction: 'ascending',
  });
  // Estado para vista móvil
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cargar eventos y seleccionar el primero automáticamente
  useEffect(() => {
    const fetchEventsAndGuests = async () => {
      const { data: eventsData, error: eventsError } = await supabase.from("events").select("*");
      if (eventsError) {
        console.error("Error fetching events:", eventsError.message);
        return;
      }
      setEvents(eventsData);
      if (eventsData?.length > 0) {
        const firstEvent = eventsData[0];
        setSelectedEvent(firstEvent);
        await fetchGuests(firstEvent.id);
      }
    };
    fetchEventsAndGuests();
  }, []);

  // Función para cargar invitados de un evento
  const fetchGuests = async (eventId) => {
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

  // Manejar cambio de evento
  const handleEventChange = async (eventId) => {
    if (eventId === "placeholder") {
      setSelectedEvent(null);
      setGuests([]);
      return;
    }
    const event = events.find((e) => e.id === eventId);
    setSelectedEvent(event);
    await fetchGuests(eventId);
  };

  // Formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString + "Z");
    return [
      date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        timeZone: "America/Argentina/Buenos_Aires",
      }),
      date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Argentina/Buenos_Aires",
      }) + " hs.",
    ];
  };

  const formatDate1 = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return [
      date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        timeZone: "America/Argentina/Buenos_Aires",
      }),
      date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Argentina/Buenos_Aires",
      }) + " hs.",
    ];
  };

  // Ordenar invitados
  const sortedGuests = useMemo(() => {
    const sortableGuests = [...guests];
    if (sortConfig.key) {
      sortableGuests.sort((a, b) => {
        if (sortConfig.key === 'confirm_at') {
          const dateA = a[sortConfig.key] ? new Date(a[sortConfig.key]) : null;
          const dateB = b[sortConfig.key] ? new Date(b[sortConfig.key]) : null;
          if (!dateA && !dateB) return 0;
          if (!dateA) return sortConfig.direction === 'ascending' ? 1 : -1;
          if (!dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
          return sortConfig.direction === 'ascending' ? dateA - dateB : dateB - dateA;
        }
        if (sortConfig.key === 'confirm') {
          return sortConfig.direction === 'ascending'
            ? (a.confirm === b.confirm ? 0 : a.confirm ? -1 : 1)
            : (a.confirm === b.confirm ? 0 : a.confirm ? 1 : -1);
        }
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableGuests;
  }, [guests, sortConfig]);

  // Filtrar invitados según búsqueda
  const filteredGuests = useMemo(() => {
    if (!searchTerm) return sortedGuests;
    return sortedGuests.filter(guest => {
      const value = guest[searchColumn];
      if (!value) return false;
      if (searchColumn === 'confirm') {
        return searchTerm.toLowerCase() === 'si' ? guest.confirm :
          searchTerm.toLowerCase() === 'no' ? !guest.confirm : false;
      }
      if (searchColumn === 'confirm_at') {
        const dateStr = formatDate(value).join(' ').toLowerCase();
        return dateStr.includes(searchTerm.toLowerCase());
      }
      return value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [sortedGuests, searchTerm, searchColumn]);

  // Solicitar ordenación
  const requestSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  };

  // Calcular totales
  const totalAdults = guests.reduce((sum, g) => sum + (g.adult || 0), 0);
  const totalChildren = guests.reduce((sum, g) => sum + (g.children || 0), 0);
  const totalGuests = totalAdults + totalChildren;
  const totalConfirm = guests.reduce((sum, g) => sum + (g.confirm || 0), 0);
  const totalNoConfirm = guests.length - totalConfirm;

  // Etiquetas para columnas de búsqueda
  const getColumnLabel = (column) => {
    const labels = {
      'full_name': 'nombre',
      'username': 'usuario',
      'adult': 'adultos',
      'children': 'niños',
      'confirm': 'confirmación',
      'confirm_at': 'fecha'
    };
    return labels[column] || column;
  };

  // Componente para resumen en móvil
  const MobileSummary = () => (
    <div className="bg-neutral-400/50 rounded-lg p-4 mb-4">
      <h3 className="font-semibold mb-2">Resumen de Invitados</h3>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-sm">Adultos: <span className="font-bold">{totalAdults}</span></p>
          <p className="text-sm">Niños: <span className="font-bold">{totalChildren}</span></p>
          <p className="text-sm">Total: <span className="font-bold">{totalGuests}</span></p>
        </div>
        <div>
          <p className="text-sm">Confirmados: <span className="font-bold">{totalConfirm}</span></p>
          <p className="text-sm">Sin confirmar: <span className="font-bold">{totalNoConfirm}</span></p>
        </div>
      </div>
    </div>
  );

  // Componente para búsqueda en móvil
  const MobileSearch = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="mb-4 w-full">
          <Filter className="mr-2 h-4 w-4" />
          Filtros y Búsqueda
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh]">
        <SheetHeader>
          <SheetTitle>Filtros de Búsqueda</SheetTitle>
          <SheetDescription>
            Filtra y busca entre los invitados
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Buscar por ${getColumnLabel(searchColumn)}...`}
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <X
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer"
                onClick={() => setSearchTerm('')}
              />
            )}
          </div>
          <Select value={searchColumn} onValueChange={setSearchColumn}>
            <SelectTrigger>
              <SelectValue placeholder="Buscar en..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_name">Nombre</SelectItem>
              <SelectItem value="username">Usuario</SelectItem>
              <SelectItem value="adult">Adultos</SelectItem>
              <SelectItem value="children">Niños</SelectItem>
              <SelectItem value="confirm">Confirmación</SelectItem>
              <SelectItem value="confirm_at">Fecha</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <ProtectedRoute>
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
            Gestión de Eventos
          </h1>
          
          {/* Selección de evento - Responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selecciona un evento</CardTitle>
                <CardDescription>Elige un evento para ver sus invitados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="event-select">Evento</Label>
                  <Select onValueChange={handleEventChange} value={selectedEvent?.id || ""}>
                    <SelectTrigger id="event-select">
                      <SelectValue placeholder="Selecciona un evento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder">Selecciona un evento</SelectItem>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            {/* Información del evento seleccionado */}
            {selectedEvent && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{selectedEvent.name}</CardTitle>
                  <CardDescription>Detalles del evento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <h3 className="font-semibold mb-2">{selectedEvent.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      📅 {formatDate1(selectedEvent.day)[0]} a las {formatDate1(selectedEvent.day)[1]}                        
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Tabla de invitados */}
          {selectedEvent && (
            <Card>
              <CardHeader>
                <CardTitle>Invitados del evento</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Resumen de invitados - Responsive */}
                <div className="hidden md:block bg-neutral-400/50 rounded-lg p-4 mb-4">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <p className="font-semibold">Resumen de Invitados:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        <div>
                          <p className="text-sm">Adultos: <span className="font-bold">{totalAdults}</span></p>
                          <p className="text-sm">Niños: <span className="font-bold">{totalChildren}</span></p>
                        </div>
                        <div>
                          <p className="text-sm">Total: <span className="font-bold">{totalGuests}</span></p>
                        </div>
                        <div>
                          <p className="text-sm">Confirmados: <span className="font-bold">{totalConfirm}</span></p>
                        </div>
                        <div>
                          <p className="text-sm">Sin confirmar: <span className="font-bold">{totalNoConfirm}</span></p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Buscador - Desktop */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={`Buscar por ${getColumnLabel(searchColumn)}...`}
                          className="pl-9 w-[200px]"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                          <X
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer"
                            onClick={() => setSearchTerm('')}
                          />
                        )}
                      </div>
                      <Select value={searchColumn} onValueChange={setSearchColumn}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Buscar en..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full_name">Nombre</SelectItem>
                          <SelectItem value="username">Usuario</SelectItem>
                          <SelectItem value="adult">Adultos</SelectItem>
                          <SelectItem value="children">Niños</SelectItem>
                          <SelectItem value="confirm">Confirmación</SelectItem>
                          <SelectItem value="confirm_at">Fecha</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Versión móvil del resumen y búsqueda */}
                {isMobile && (
                  <>
                    <MobileSummary />
                    <MobileSearch />
                  </>
                )}

                {/* Tabla - Responsive */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {['username', 'full_name', 'adult', 'children', 'confirm', 'confirm_at'].map((column) => (
                          <TableHead key={column} className="text-xs md:text-sm">
                            <Button
                              variant="ghost"
                              onClick={() => requestSort(column)}
                              className="p-0 h-auto font-semibold"
                            >
                              <span className="hidden md:inline">
                                {getColumnLabel(column).charAt(0).toUpperCase() + getColumnLabel(column).slice(1)}
                              </span>
                              <span className="md:hidden">
                                {column === 'full_name' ? 'Nombre' : 
                                 column === 'username' ? 'Usuario' :
                                 column === 'adult' ? 'Ad.' :
                                 column === 'children' ? 'Ni.' :
                                 column === 'confirm' ? 'Conf.' :
                                 'Fecha'}
                              </span>
                              <ArrowUpDown className="ml-1 h-3 w-3" />
                            </Button>
                          </TableHead>
                        ))}
                        <TableHead className="text-xs md:text-sm">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGuests.map((guest) => (
                        <TableRow key={guest.id}>
                          <TableCell className="text-xs text-gray-500 py-2">                            
                            {guest.username}
                          </TableCell>
                          <TableCell className="font-medium py-2">                            
                            {guest.full_name}
                          </TableCell>
                          <TableCell className="py-2">                            
                            {guest.adult || 0}
                          </TableCell>
                          <TableCell className="py-2">                            
                            {guest.children || 0}
                          </TableCell>
                          <TableCell className="py-2">                            
                            {guest.confirm === null ? "" : guest.confirm ? "✅" : "❌"}
                          </TableCell>
                          <TableCell className="py-2">
                            {guest.confirm_at ? (
                              <div className="flex flex-col">
                                <span className="text-xs">{formatDate(guest.confirm_at)[0]}</span>
                                <span className="text-xs text-muted-foreground hidden md:inline">
                                  {formatDate(guest.confirm_at)[1]}
                                </span>
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell className="py-2">
                            <GuestModal guest={guest} event={selectedEvent}>
                              <Button variant="link" size="sm" className="p-0 h-auto">
                                Ver
                              </Button>
                            </GuestModal>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredGuests.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron invitados que coincidan con los criterios
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}