// components/UploadButton.js
"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button"; // Asumiendo que usas shadcn/ui

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function UploadButton({ eventId, onUploadStart, onUploadComplete, onPhotoUploaded }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !eventId) return;

    setIsUploading(true);
    if (onUploadStart) onUploadStart(); // Notificar inicio de subida

    try {
      // Obtener el usuario actual para asociar la foto
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      const filePath = `events/${eventId}/${fileName}`;

      // Subir la imagen al bucket
      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obtener la URL pública
      const { data: publicUrlData } = supabase.storage
        .from("photos")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;
      if (!publicUrl) {
        throw new Error("No se pudo obtener la URL pública");
      }

      // Insertar el registro en la tabla photos
      const { data:insertData, error: insertError } = await supabase
        .from("photos")
        .insert({
          event_id: eventId,
          url: publicUrl,
          user_id: user.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

        console.log("Foto insertada:", insertData); // Tu código aquí

      if (insertError) throw insertError;

      console.log("Foto subida exitosamente:", insertData);      
      alert("¡Foto subida exitosamente!");

    } catch (error) {
      console.error("Error al subir la foto:", error);
      alert(`Error al subir la foto: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (onUploadComplete) onUploadComplete(); // Notificar finalización de subida
      // Limpiar el input para permitir subir el mismo archivo de nuevo si es necesario
      e.target.value = '';
    }
  };

  return (
    <div className="mt-4">
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleUpload}
        accept="image/*"
        disabled={isUploading}
      />
      <Button
        variant="default"
        className={`w-full transition-colors ${isUploading ? 'bg-gray-400 hover:bg-gray-400' : ''}`}
        disabled={isUploading}
        onClick={() => document.getElementById('file-upload').click()}
      >
        {isUploading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Subiendo...
          </div>
        ) : (
          "Subir foto"
        )}
      </Button>
    </div>
  );
}