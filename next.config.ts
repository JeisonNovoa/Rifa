import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      // Los comprobantes aceptan imágenes de hasta 5 MB (COMPROBANTE_MAX_BYTES).
      // El default de Next es 1 MB y rechazaba el envío del formulario completo
      // (multipart suma unos KB extra, por eso 6mb y no 5mb).
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
