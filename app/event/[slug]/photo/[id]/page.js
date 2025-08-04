'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, use } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PhotoPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { slug, id } = params;

  // Estados (mantenemos los mismos)
  const [photo, setPhoto] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const [error, setError] = useState('');
  const [eventId, setEventId] = useState(null);
  const commentsEndRef = useRef(null);

  const searchParams = useSearchParams();
  const photoIndex = parseInt(searchParams.get('photoIndex')) || 0;
  const router = useRouter();

  // Scroll al final de los comentarios
  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Efecto para scroll automático
  useEffect(() => {
    if (comments.length > 0) {
      setTimeout(scrollToBottom, 300);
    }
  }, [comments]);

  // Carga de datos (mantenemos la misma lógica)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('id')
          .eq('slug', slug)
          .single();

        if (eventError) throw eventError;
        setEventId(eventData.id);

        const { data: allPhotos, error: photosError } = await supabase
          .from('photos')
          .select('*, profiles(full_name)')
          .eq('event_id', eventData.id)
          .order('created_at', { ascending: false });

        if (photosError) throw photosError;
        setPhotos(allPhotos || []);

        const current = allPhotos?.find(p => p.id === id) || allPhotos?.[photoIndex];
        setPhoto(current);

        const { data: photoComments, error: commentsError } = await supabase
          .from('comments')
          .select('*, profiles(full_name)')
          .eq('photo_id', id)
          .order('created_at', { ascending: true });

        if (commentsError) throw commentsError;
        setComments(photoComments || []);
      } catch (error) {
        console.error('Error:', error);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, slug, photoIndex]);

  // Funciones de comentarios y navegación (mantenemos las mismas)
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Usuario no autenticado');

      const { data: newComment, error: commentError } = await supabase
        .from('comments')
        .insert({
          photo_id: id,
          content: commentInput,
          user_id: user.id,
          event_id: eventId,
        })
        .select('*, profiles(full_name)')
        .single();

      if (commentError) throw commentError;

      setComments(prevComments => [...prevComments, newComment]);
      setCommentInput('');
      setError('');
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      setError('Error al enviar el comentario');
      console.error('Error al enviar comentario:', error);
    }
  };

  const navigateToPhoto = (direction) => {
    if (!photos.length) return;

    const newIndex = direction === 'next'
      ? (photoIndex + 1) % photos.length
      : (photoIndex - 1 + photos.length) % photos.length;

    const nextPhoto = photos[newIndex];
    router.push(`/event/${slug}/photo/${nextPhoto.id}?photoIndex=${newIndex}`);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      Cargando...
    </div>
  );

  if (!photo) return (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      Foto no encontrada
    </div>
  );

  return (
    <div className="relative h-screen w-full bg-black flex flex-col overflow-hidden">
      {/* Contenedor principal para la imagen */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Botón cerrar */}
        <button 
          onClick={() => router.push(`/event/${slug}`)}
          className="absolute top-4 left-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-all"
          aria-label="Cerrar"
        >
          &times;
        </button>

        {/* Indicador de posición */}
        <div className="absolute top-4 right-4 z-20 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {photoIndex + 1} / {photos.length}
        </div>

        {/* Botones de navegación */}
        <button
          onClick={() => navigateToPhoto('prev')}
          className="absolute left-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-all"
          aria-label="Foto anterior"
        >
          &larr;
        </button>

        <button
          onClick={() => navigateToPhoto('next')}
          className="absolute right-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-all"
          aria-label="Foto siguiente"
        >
          &rarr;
        </button>

        {/* Imagen centrada */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="relative w-full h-full max-w-screen-lg">
            <Image
              src={photo.url}
              alt={`Foto de ${photo.profiles?.full_name || 'usuario'}`}
              fill
              className="object-contain"
              priority
              quality={90}
            />
          </div>
        </div>
      </div>

      {/* Sección de comentarios (pegada al fondo) */}
      <div className="w-full bg-black/70 text-white p-4">
        <div className="max-w-4xl mx-auto">
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

          {/* Lista de comentarios */}
          <div className="max-h-32 overflow-y-auto mb-2">
            {comments.length === 0 ? (
              <p>No hay comentarios aún</p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="mb-2">
                  <div className="flex items-baseline">
                    <p className="text-sm text-gray-300 mr-2 font-semibold">
                      {comment.profiles?.full_name || "Usuario"}
                    </p>
                    <p className="text-sm flex-1">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Formulario de comentarios */}
          <form onSubmit={handleSubmitComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Añade un comentario..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className="flex-1 bg-white/20 text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="submit" variant="secondary">Enviar</Button>
          </form>
        </div>
      </div>
    </div>
  );
}