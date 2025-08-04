/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Especifica los dominios de origen de las imágenes
    remotePatterns: [{
      protocol: 'https',
      hostname: 'fvvtqpkgirpnlmiemgcn.supabase.co',
      port: '',
      pathname: '/**',
    }],
    // Opcional: Configura el loader de imágenes para usar el optimizador de Next.js
    loader: 'default',
  },
  // Aquí puedes agregar más configuraciones específicas de Next.js

  allowedDevOrigins: ['192.168.100.12','192.168.100.1'], // varias IPs

};

export default nextConfig;