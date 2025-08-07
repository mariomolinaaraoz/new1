// app/event/[slug]/photo/[id]/page.js
"use client";
import { use } from 'react';
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { usePhotos } from "@/hooks/usePhotos";
import Image from "next/image";
import Link from "next/link";

export default function PhotoDetailPage({ params }) {
  const { slug, id } = use(params);
  const { photos, handleFavorite } = usePhotos(slug); // Usamos slug como eventId
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Buscar la foto en la lista o cargarla individualmente
  useEffect(() => {
    const foundPhoto = photos.find(p => p.id === id);
    if (foundPhoto) {
      setPhoto(foundPhoto);
      setLoading(false);
    } else {
      loadSinglePhoto();
    }
  }, [id, photos]);

  async function loadSinglePhoto() {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*, profiles(full_name, username)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setPhoto(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="text-center p-8">Cargando foto...</div>;
  if (error) return <div className="text-center p-8 text-red-600">Error: {error}</div>;
  if (!photo) return <div className="text-center p-8">Foto no encontrada</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <Link href={`/event/${slug}`} className="text-blue-600 hover:underline">
          &larr; Volver al evento
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative w-full h-96">
          <Image
            src={photo.url}
            alt={photo.description || `Foto de ${photo.profiles?.full_name || 'usuario'}`}
            fill
            className="object-contain"
            priority
          />
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">
              {photo.description || "Sin descripción"}
            </h2>
            <button
              onClick={() => handleFavorite(photo.id, photo.is_favorite)}
              className="text-red-500 hover:text-red-700"
            >
              {photo.is_favorite ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              )}
            </button>
          </div>
          
          <p className="text-gray-700">
            Subido por: {photo.profiles?.full_name || "Usuario desconocido"}
          </p>
          
          <p className="text-sm text-gray-500 mt-2">
            {new Date(photo.created_at).toLocaleString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </div>
  );
}