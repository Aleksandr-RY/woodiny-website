import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // __dirname = dist/ when running the bundled server (dist/index.cjs).
  const distPath = path.resolve(__dirname, "public");
  const uploadsPath = path.resolve(__dirname, "..", "client", "uploads");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve built static assets (logo, images, landing.html, React bundle, etc.)
  app.use(express.static(distPath));

  // Serve user-uploaded files from client/uploads/
  if (fs.existsSync(uploadsPath)) {
    app.use("/uploads", express.static(uploadsPath));
  }

  // SPA fallback — serve index.html for unmatched paths (admin/* routes)
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
