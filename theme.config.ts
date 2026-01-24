import { defineConfig } from "@sikorsky/site";

export default defineConfig({
  site: {
    name: "Andrei Tarasov",
    domain: "andreitarasov.dev"
  },
  logo: "https://firebasestorage.googleapis.com/v0/b/andreitarasov-dev.firebasestorage.app/o/logo.png?alt=media&token=de4b54ba-88a1-48c6-9381-32d5c6cb5f27",
  logoAlt: "Andrei Tarasov",
  footer: {
    copyright: "© Andrei Tarasov, b. 1991",
    decoration: "|",
    email: "tarasov.a.dev@gmail.com",
    socials: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/andrei-tarasov/" },
      { label: "GitHub", url: "https://github.com/andreitarasov-dev" }
    ]
  },
  head: [
    {
      tag: "script",
      attrs: {
        defer: true,
        src: "https://stats.andreitarasov.dev/script.js",
        "data-website-id": "ec06ab26-41ce-49a8-85ba-0dd668cd87c1"
      }
    }
  ]
});
