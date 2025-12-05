import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import type { NextHandleFunction } from "connect";
import { componentTagger } from "lovable-tagger";
import { sentryVitePlugin } from "@sentry/vite-plugin";

const ADMIN_ROUTE_PREFIX = "/admin";
const PROJECT_ROOT_INDEX = path.resolve(__dirname, "index.html");
const BUILD_INDEX = path.resolve(__dirname, "dist/index.html");

const prependMiddleware = (middlewares: any, middleware: NextHandleFunction) => {
  const stack = middlewares?.stack;
  if (Array.isArray(stack)) {
    stack.unshift({ route: "", handle: middleware });
  } else {
    middlewares.use(middleware);
  }
};

const createAdminHtmlFallback = (
  getHtml: (url: string) => Promise<string>
): NextHandleFunction => {
  return async (req, res, next) => {
    const accept = req.headers.accept || "";
    const url = req.url || "";

    if (url.startsWith(ADMIN_ROUTE_PREFIX) && accept.includes("text/html")) {
      const html = await getHtml(url);
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html");
      res.end(html);
      return;
    }

    next();
  };
};

const adminSpaFallbackPlugin = () => ({
  name: "admin-spa-fallback",
  configureServer(server: any) {
    const middleware = createAdminHtmlFallback(async (url) => {
      const rawHtml = fs.readFileSync(PROJECT_ROOT_INDEX, "utf-8");
      return server.transformIndexHtml(url, rawHtml);
    });
    prependMiddleware(server.middlewares, middleware);
  },
  configurePreviewServer(server: any) {
    const htmlPath = fs.existsSync(BUILD_INDEX) ? BUILD_INDEX : PROJECT_ROOT_INDEX;
    const rawHtml = fs.readFileSync(htmlPath, "utf-8");
    const middleware = createAdminHtmlFallback(async () => rawHtml);
    prependMiddleware(server.middlewares, middleware);
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: mode === 'development'
      ? {
          '/admin': {
            target: 'http://127.0.0.1:54321',
            changeOrigin: true,
            secure: false,
          },
        }
      : undefined,
  },
  plugins: [
    adminSpaFallbackPlugin(),
    react(),
    mode === "development" && componentTagger(),
    sentryVitePlugin({
      org: "noli-assurance",
      project: "noli-frontend",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
          ],
          charts: ['recharts'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          utils: ['clsx', 'tailwind-merge', 'date-fns', 'lucide-react'],
          pdf: ['jspdf', 'html2canvas'],
          supabase: ['@supabase/supabase-js'],
          query: ['@tanstack/react-query'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: mode === 'development',
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'lucide-react',
      'react-hook-form',
      '@hookform/resolvers',
      'zod',
    ],
  },
}));
