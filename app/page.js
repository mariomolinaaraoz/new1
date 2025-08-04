import { headers } from "next/headers";
import MobileHome from "@/components/Home/MobileHome";
import DesktopHome from "@/components/Home/DesktopHome";
import Link from "next/link";

export default async function Home() {
  // ✅ Esperar a headers()
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(userAgent);

  return (
    <div>
      {isMobile ? <MobileHome /> : <DesktopHome />}
      
      {/* Botón para administrador en ambas versiones */}
      <div className="absolute top-4 right-4">
        <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700">
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}