export default function PhotoCard({ photo }) {
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm">
      <img src={photo.image_url} alt="Evento" className="w-full h-48 object-cover" />
    </div>
  );
}