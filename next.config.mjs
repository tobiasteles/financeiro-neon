/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
    serverActions: { bodySizeLimit: '8mb' },
    // pdf-parse (via pdfjs-dist) quebra se o webpack tentar empacotar —
    // isso faz o Next carregar a biblioteca direto pelo Node em vez disso.
    serverComponentsExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  },
};

export default nextConfig;
