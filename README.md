# Glen Ellyn Weather

A single-page, large-print, ultra-high-contrast weather website designed for
elderly and low-vision users. Shows the current temperature, sky condition,
today's sunset time, the next 8 hours, and the next 10 days for
Glen Ellyn, Illinois.

- **Data source:** [Open-Meteo](https://open-meteo.com/) — free, no API key, no account.
- **Stack:** Plain HTML, CSS, and JavaScript. No build step, no frameworks.
- **Auto-refresh:** The page re-fetches the weather every 30 minutes, so it can
  be left open all day.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure |
| `style.css` | High-contrast, large-type styling |
| `script.js` | Fetches and renders the weather |

## Accessibility design notes

- Pure black background with white and yellow text (contrast ratios of 21:1
  and ~19:1 — well beyond WCAG AAA's 7:1 requirement).
- All sizes in `rem`, so browser zoom and OS font scaling work correctly.
- Single vertical column with thick section dividers and generous row spacing.
- No animations, icons, images, or extraneous data fields.
- Plain-English sky conditions ("Sunny", "Light Rain") instead of codes or jargon.

## How to publish on GitHub Pages

1. **Create the repository.** Sign in at [github.com](https://github.com), click
   the **+** in the top-right corner, and choose **New repository**. Name it
   something like `grandpa-weather`, leave it **Public**, and click
   **Create repository**.

2. **Upload the files.** On the new repository page, click
   **uploading an existing file** (or **Add file → Upload files**). Drag in
   `index.html`, `style.css`, and `script.js`, then click **Commit changes**.

   *Or, from the command line in this folder:*

   ```bash
   git init
   git add index.html style.css script.js README.md
   git commit -m "Accessible weather page for Glen Ellyn, IL"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/grandpa-weather.git
   git push -u origin main
   ```

3. **Turn on GitHub Pages.** In the repository, go to **Settings → Pages**
   (left sidebar). Under **Build and deployment**, set **Source** to
   **Deploy from a branch**, choose branch **main** and folder **/ (root)**,
   and click **Save**.

4. **Get the link.** After a minute or two, the same Pages settings screen
   will show the live address:
   `https://YOUR-USERNAME.github.io/grandpa-weather/`

5. **Set it up on his computer.** Open that link in his browser, then bookmark
   it or set it as the browser homepage so it opens automatically. You can also
   press `Ctrl +` (Windows) or `Cmd +` (Mac) a few times to zoom even larger —
   the layout scales cleanly.

To update the site later, just edit the files and push (or re-upload) — the
page republishes automatically.
