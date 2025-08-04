// app/page.js
import Link from "next/link";

export default function MobileHome() {
  
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">EventShare</h1>
          <p className="text-gray-600">Comparte tus momentos especiales</p>
        </header>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Nuestro Servicio</h2>
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="font-bold text-blue-500 mb-2">Lista de Invitados</h3>
              <p className="text-gray-700">Organiza y gestiona fácilmente tu lista de invitados.</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="font-bold text-blue-500 mb-2">Galería Compartida</h3>
              <p className="text-gray-700">Tus invitados pueden subir fotos y videos del evento.</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="font-bold text-blue-500 mb-2">Interacción</h3>
              <p className="text-gray-700">Comentarios, votos y selección de fotos favoritas.</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="font-bold text-blue-500 mb-2">Acceso Limitado</h3>
              <p className="text-gray-700">Las fotos estarán disponibles por 7 días para descarga.</p>
            </div>
          </div>
        </section>
      </div>
    );
}