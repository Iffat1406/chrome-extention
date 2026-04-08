import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    crx({
      manifest: {
        manifest_version: 3,
        name: "AI Writing Assistant",
        version: "2.0.0",
        permissions: ["storage", "scripting"],
        host_permissions: ["<all_urls>"],
        action: {
          default_popup: "src/popup/popup.html",
        },
        background: {
          service_worker: "src/background/background-entry.ts",
          type: "module",
        },
        content_scripts: [
          {
            matches: ["<all_urls>"],
            js: ["src/content/content-entry.ts"],
            all_frames: true,
            match_about_blank: true,
            run_at: "document_idle",
          },
        ],
      },
    }),
  ],
});
