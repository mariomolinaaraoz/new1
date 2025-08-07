//EventClient.js
"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CountdownTimer from "./CountdownTimer";
import UploadButton from "./UploadButton";
import { usePhotos } from "@/hooks/usePhotos";
import { useComments } from "@/hooks/useComments";

export default function EventClient({ event }) {
  const {
    photos,
    unseenPhotos,
    handleFavorite,
    markPhotosAsSeen,
    addPhotoOptimistic
  } = usePhotos(event.id);

  const {
    comments,
    addComment
  } = useComments(event.id);

  const [newComment, setNewComment] = useState("");

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addComment(newComment);
    setNewComment("");
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {unseenPhotos.length > 0 && (
        <div className="fixed top-20 right-4 z-50">
          <button
            onClick={markPhotosAsSeen}
            className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm shadow-lg flex items-center"
          >
            <span className="mr-2">{unseenPhotos.length} nueva{unseenPhotos.length > 1 ? "s" : ""}</span>
            <span>×</span>
          </button>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-4">{event.name || event.title}</h1>

      <CountdownTimer
        targetDate={event.day}
        title="¡Cuenta Regresiva!"
        description="Para el gran evento!!!"
      />

      <UploadButton
        eventId={event.id}
        onPhotoUploaded={addPhotoOptimistic}
      />

      <h2 className="text-xl font-semibold mt-6 mb-3">Fotos del evento</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {photos.map((photo, index) => (
          <Link
            href={{
              pathname: `/event/${event.slug}/photo/${photo.id}`,
              query: { photoIndex: index }
            }}
            key={photo.id}
            className={`relative group overflow-hidden rounded-lg shadow-md transition-transform duration-500 hover:scale-105 ${
              unseenPhotos.includes(photo.id) ? "ring-2 ring-blue-500" : ""
            }`}
          >
            <div className="relative w-full h-48">
              <Image
                src={photo.url}
                alt={`Foto de ${photo.profiles?.full_name || "usuario"} en ${event.name}`}
                fill
                placeholder="blur"
                blurDataURL="/blur-placeholder.png"
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 33vw"
              />
              <div
                className="absolute top-2 right-2 bg-black/10 rounded-full p-1 cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  handleFavorite(photo.id, photo.is_favorite);
                }}
              >
                {photo.is_favorite ? (
                  <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-red-600 transition-all duration-200"
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
                      className="h-5 w-5 text-blue-700 transition-all duration-200"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                )}
                {photo.favorites_count > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {photo.favorites_count}
                  </span>
                )}
              </div>
              <div className="absolute top-2 left-2 bg-black/10 rounded-full px-1 py-0">
                  <div className="text-white text-xs">
                    {photo.profiles?.full_name || "Usuario"}
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 bg-black/10 text-white text-xs px-1 py-0.5 rounded">
                  {new Date(photo.created_at).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
            </div>
          </Link>
        ))}
      </div>      
    </div>
  );
}