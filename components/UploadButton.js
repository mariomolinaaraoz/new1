"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import imageCompression from "browser-image-compression";

export default function UploadButton({ eventId, onUploadStart, onUploadComplete }) {
  // Constantes de configuración
  const MAX_IMAGE_SIZE_MB = 1;
  const MAX_VIDEO_SIZE_MB = 50;
  const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
  const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
  
  const ALLOWED_FILE_TYPES = [
    "image/jpeg", 
    "image/png", 
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime"
  ];

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFileName, setCurrentFileName] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // Nuevo estado para errores

  const compressImage = async (file) => {
    const options = {
      maxSizeMB: MAX_IMAGE_SIZE_MB,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: file.type.includes('png') ? 'image/png' : 'image/jpeg',
      initialQuality: 0.6, // Calidad más baja para mejor compresión
      alwaysKeepResolution: false // Permitir reducir resolución si es necesario
    };

    try {
      console.log(`Comprimiendo imagen de ${(file.size / 1024 / 1024).toFixed(2)}MB...`);
      const compressedFile = await imageCompression(file, options);
      console.log(`Imagen comprimida a ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      return compressedFile;
    } catch (error) {
      console.error("Error al comprimir imagen:", error);
      throw new Error("No pudimos optimizar la imagen. Por favor intenta con un archivo más pequeño.");
    }
  };

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !eventId) return;

    setErrorMessage(""); // Resetear mensajes de error anteriores
    setCurrentFileName(files[0].name);

    if (files.length > 1) {
      setErrorMessage("Solo puedes subir 1 archivo a la vez.");
      e.target.value = "";
      return;
    }

    const file = files[0];

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setErrorMessage("Formato no válido. Solo se aceptan: JPEG, PNG, WEBP, MP4, WEBM o MOV.");
      e.target.value = "";
      return;
    }

    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
    const maxSizeMB = isVideo ? MAX_VIDEO_SIZE_MB : MAX_IMAGE_SIZE_MB;

    setIsUploading(true);
    setUploadProgress(0);
    if (onUploadStart) onUploadStart();

    try {
      // Validación temprana de tamaño para videos
      if (isVideo && file.size > maxSize) {
        throw new Error(`Los videos no pueden exceder ${maxSizeMB}MB.`);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Debes iniciar sesión para subir archivos.");

      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      const filePath = `events/${eventId}/${fileName}`;

      // Proceso de compresión para imágenes
      let fileToUpload = file;
      if (!isVideo && file.size > MAX_IMAGE_SIZE_BYTES) {
        try {
          fileToUpload = await compressImage(file);
          if (fileToUpload.size > MAX_IMAGE_SIZE_BYTES) {
            throw new Error("La imagen sigue siendo demasiado grande después de la compresión.");
          }
        } catch (compressionError) {
          throw new Error(compressionError.message);
        }
      }

      // Subida con progreso
      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
          onProgress: (progress) => {
            setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
          }
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("photos")
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) throw new Error("Error al generar el enlace público.");

      await supabase
        .from("photos")
        .insert({
          event_id: eventId,
          url: publicUrlData.publicUrl,
          user_id: user.id,
          created_at: new Date().toISOString(),
        });

      alert(`¡${isVideo ? 'Video' : 'Imagen'} subido exitosamente!`);

    } catch (error) {
      console.error("Error en el proceso:", error);
      setErrorMessage(error.message || "Ocurrió un error al subir el archivo.");
    } finally {
      setIsUploading(false);
      if (!errorMessage && onUploadComplete) onUploadComplete();
      e.target.value = '';
    }
  };

  return (
    <div className="mt-4 space-y-3">
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleUpload}
        accept="image/jpeg, image/png, image/webp, video/mp4, video/webm, video/quicktime"
        disabled={isUploading}
      />
      <Button
        variant="default"
        className={`w-full transition-colors ${
          isUploading
            ? 'bg-gray-600 hover:bg-gray-600 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        } text-md font-medium shadow-md hover:shadow-lg`}
        disabled={isUploading}
        onClick={() => document.getElementById('file-upload').click()}
      >
        {isUploading ? "Subiendo..." : "Subir archivo"}
      </Button>

      {/* Área de información de subida */}
      {(isUploading || errorMessage) && (
        <div className="space-y-2 px-6 py-3 bg-gray-800 rounded-lg">
          {currentFileName && (
            <p className="text-sm text-gray-300 truncate">
              {/* <span className="font-medium">Archivo:</span> */}
              {currentFileName}
            </p>
          )}

          {isUploading && (
            <>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-right text-xs text-gray-400">
                {uploadProgress}% completado
              </p>
            </>
          )}

          {errorMessage && (
            <div className="mt-2 p-2 bg-red-900/50 text-red-200 text-sm rounded">
              <p>❌ {errorMessage}</p>
              {errorMessage.includes("5MB") && (
                <p className="mt-1 text-xs">
                  Consejo: Prueba con una imagen de menor resolución o usa herramientas como 
                  <a href="https://tinypng.com" target="_blank" rel="noopener noreferrer" className="text-blue-300 underline ml-1">
                    TinyPNG
                  </a> para reducir el tamaño.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}