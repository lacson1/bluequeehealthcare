import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

// Get __dirname equivalent in ESM (works in both dev and production/bundled)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // Apply Vite middleware to handle all module requests and HMR
  // This must come before the catch-all route
  app.use((req, res, next) => {
    const url = req.originalUrl || req.path;
    
    // Skip API routes - let Express handle them
    if (url.startsWith('/api/')) {
      return next();
    }
    
    // Let Vite handle all other requests (modules, assets, etc.)
    vite.middlewares(req, res, next);
  });
  
  // Catch-all route for HTML pages (SPA routing)
  // This only handles requests that weren't handled by Vite middleware
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl || req.path;

    // Skip API routes - let Express handle them
    if (url.startsWith('/api/')) {
      return next();
    }

    // Only serve HTML for non-file requests (SPA routing)
    // If it looks like a file request (has extension), let it 404
    if (path.extname(url)) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // In production, static files are in dist/public
  // __dirname in bundled code is the dist folder
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    // Log helpful debug info
    console.error(`Static files directory not found: ${distPath}`);
    console.error(`__dirname: ${__dirname}`);
    console.error(`Current working directory: ${process.cwd()}`);
    
    // Try alternative paths
    const altPaths = [
      path.resolve(process.cwd(), "dist/public"),
      path.resolve(process.cwd(), "public"),
      "/app/dist/public",
    ];
    
    for (const altPath of altPaths) {
      if (fs.existsSync(altPath)) {
        console.log(`Found static files at alternative path: ${altPath}`);
        app.use(express.static(altPath));
        app.use("*", (_req, res) => {
          res.sendFile(path.resolve(altPath, "index.html"));
        });
        return;
      }
    }
    
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first. Tried: ${altPaths.join(', ')}`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
