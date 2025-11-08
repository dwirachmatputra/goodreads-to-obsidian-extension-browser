document.addEventListener("DOMContentLoaded", main);

async function main() {
  const output = document.getElementById("output");
  const folderInput = document.getElementById("folderInput");
  const importBtn = document.getElementById("importBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const retryBtn = document.getElementById("retryBtn");
  const loader = document.getElementById("loader");

  let lastYaml = "";

  disableButtons(true);
  showLoader(true);
  output.textContent = "Loading...";

  async function runScrape() {
    showLoader(true);
    disableButtons(true);
    retryBtn.style.display = "none";
    output.textContent = "Loading...";

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) throw new Error("No active tab");

      // Execute scraper inside the page
      const results = await Promise.race([
        chrome.scripting.executeScript({ target: { tabId: tab.id }, func: scrapeGoodreadsData }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout scraping page (try Refresh)")), 8000))
      ]);

      const data = results?.[0]?.result;
      if (!data || !data.title) throw new Error("No book info found on this page");

      // normalize fields
      const title = data.title || "";
      const author = data.author || "";
      const rating = data.rating || "";
      const pages = data.pages || "";
      const published = data.published || "";
      const cover = data.imageUrl || "";

      const tagsArr = (data.genres || []).map(g => g.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-_]/g,'')).filter(Boolean);
      const tags = [...new Set(tagsArr)].slice(0, 10);
      const tagsYaml = tags.length ? tags.map(t => `    - ${t}`).join("\n") : "    -";

      // pages only number (if pages contains "374 pages, Hardcover" -> "374")
      const pagesNumber = (pages.match(/\d+/) || [""])[0];

      const yaml = `---
cover: '${cover}'
author:
    - '[[${author}]]'
published: ${published}
tags:
${tagsYaml}
rating: ${rating}
pages: ${pagesNumber}
lists:
comment:
pdf: input your pdf here
---

# ${title}
`;

      lastYaml = yaml;
      output.textContent = yaml;
      disableButtons(false);
      showLoader(false);
      retryBtn.style.display = "none";
    } catch (err) {
      console.error(err);
      showLoader(false);
      disableButtons(true);
      retryBtn.style.display = "block";
      output.textContent = "⚠️ Failed to scrape data: " + (err.message || err);
    }
  }

  retryBtn.onclick = () => runScrape();

  importBtn.onclick = () => {
    if (!lastYaml) return;
    const { yaml, title, folder } = prepareObsidianData(lastYaml, folderInput.value);
    const pathForURI = `${folder}/${title}.md`;
    const obsidianURI = `obsidian://new?file=${encodeURIComponent(pathForURI)}&content=${encodeURIComponent(yaml)}`;
    window.open(obsidianURI);
    output.textContent = `Tried opening Obsidian to create note:\n${pathForURI}\nIf nothing happens, use "Download .md".`;
  };

  downloadBtn.onclick = () => {
    if (!lastYaml) return;
    const { yaml, title } = prepareObsidianData(lastYaml, folderInput.value);
    const safe = title + ".md";
    downloadMarkdown(yaml, safe);
    output.textContent = `Downloaded ${safe} to Downloads (move to your vault's Books folder).`;
  };

  function disableButtons(state) {
    importBtn.disabled = state;
    downloadBtn.disabled = state;
  }
  function showLoader(show) {
    loader.style.display = show ? "block" : "none";
  }

  // initial run
  runScrape();
}

// helper to sanitize file name & compute folder
function prepareObsidianData(yaml, folderInput) {
  const titleMatch = yaml.match(/^# (.*)$/m);
  const rawTitle = titleMatch ? titleMatch[1] : "Untitled";
  const title = sanitizeFileName(rawTitle);
  const folder = (folderInput && folderInput.trim()) ? folderInput.trim().replace(/^\/+|\/+$/g, "") : "Books";
  return { yaml, title, folder };
}

function sanitizeFileName(name) {
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "").trim();
}
function downloadMarkdown(text, filename) {
  const blob = new Blob([text], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function scrapeGoodreadsData() {
  // helper: wait for selector (used briefly; but executeScript already times out)
  function waitForSel(sel, t = 1500) {
    return new Promise((resolve) => {
      const el = document.querySelector(sel);
      if (el) return resolve(el);
      const mo = new MutationObserver(() => {
        const e = document.querySelector(sel);
        if (e) { mo.disconnect(); resolve(e); }
      });
      mo.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => { mo.disconnect(); resolve(null); }, t);
    });
  }

  function text(sel) { return document.querySelector(sel)?.textContent?.trim() || ""; }
  function metaContent(sel) { return document.querySelector(sel)?.content || ""; }

  function parsePublished(text) {
    if (!text) return "";
    text = text.replace(/First published[:\s]*/i, "").trim();
    const m = text.match(/([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/);
    if (m) {
      const months = { January:"01",February:"02",March:"03",April:"04",May:"05",June:"06",July:"07",August:"08",September:"09",October:"10",November:"11",December:"12" };
      return `${m[3]}-${months[m[1]] || "01"}-${m[2].padStart(2,'0')}`;
    }
    const y = text.match(/(\d{4})/);
    if (y) return `${y[1]}-01-01`;
    return "";
  }

  // run
  return (async () => {
    // give small time for dynamic content
    await waitForSel('h1[data-testid="bookTitle"]', 1200);

    // TITLE
    const title =
      (document.querySelector('h1[data-testid="bookTitle"]')?.textContent?.trim()) ||
      (document.querySelector('h1.Text__title1')?.textContent?.trim()) ||
      (document.querySelector('h1#bookTitle')?.textContent?.trim()) ||
      (document.title ? document.title.split("|")[0].trim() : "");

    // AUTHOR - many fallbacks
    let author =
      (document.querySelector('a[data-testid="name"]')?.textContent?.trim()) ||
      (document.querySelector('.ContributorLink__name')?.textContent?.trim()) ||
      (document.querySelector('.authorName')?.textContent?.trim()) ||
      (document.querySelector('a.authorName')?.textContent?.trim()) ||
      (document.querySelector('a[rel="author"]')?.textContent?.trim()) ||
      metaContent('meta[name="author"]') ||
      metaContent('meta[property="book:author"]') ||
      "";

    // if author contains newline or extra text, take first line
    if (author && author.includes("\n")) author = author.split("\n")[0].trim();

    // RATING - flexible fallbacks and numeric extraction
    let ratingRaw =
      (document.querySelector('[data-testid="ratingsValue"]')?.textContent?.trim()) ||
      (document.querySelector('[data-testid="ratingValue"]')?.textContent?.trim()) ||
      (document.querySelector('span[itemprop="ratingValue"]')?.textContent?.trim()) ||
      (document.querySelector('meta[itemprop="ratingValue"]')?.content) ||
      (document.querySelector('.RatingStatistics__rating')?.textContent?.trim()) ||
      (document.querySelector('.average')?.textContent?.trim()) ||
      "";

    // extract first float-looking number
    let rating = "";
    if (ratingRaw) {
      const m = ratingRaw.match(/(\d+(?:[.,]\d+)?)/);
      if (m) rating = m[1].replace(",", ".");
    }

    // GENRES: prefer container 'CollapsableList' or BookPageMetadataSection, stop at show-all link
    let genres = [];
    // try to find the ul container that holds top genres (structure from example)
    const genreContainer = document.querySelector('ul.CollapsableList') || document.querySelector('.BookPageMetadataSection__topGenres') || null;
    if (genreContainer) {
      // iterate child anchors in order until reaching a "show all" link or ellipsis
      const anchors = Array.from(genreContainer.querySelectorAll('a'));
      for (const a of anchors) {
        const txt = (a.textContent || "").trim();
        if (!txt) continue;
        const lowered = txt.toLowerCase();
        if (lowered.includes('show all') || lowered.startsWith('...') || lowered === 'more') {
          break; // stop before the "show all" element
        }
        // sometimes there are nested spans; get actual label
        genres.push(txt);
      }
    } else {
      // fallback: collect known selectors but filter out show-all and duplicates
      const candidates = [
        ...Array.from(document.querySelectorAll('.BookPageMetadataSection__genreButton .Button__labelItem')),
        ...Array.from(document.querySelectorAll('a.bookPageGenreLink')),
        ...Array.from(document.querySelectorAll('[data-testid="genresList"] a')),
        ...Array.from(document.querySelectorAll('.Button--tag .Button__labelItem'))
      ];
      for (const n of candidates) {
        const txt = (n.textContent || "").trim();
        if (!txt) continue;
        const lower = txt.toLowerCase();
        if (lower.includes('show all') || lower.startsWith('...') || lower === 'more') break;
        if (!genres.includes(txt)) genres.push(txt);
      }
    }
    // dedupe already maintained; limit tags to first 10
    genres = genres.slice(0, 10);

    // PAGES: entire string (popup will extract number)
    const pagesRaw =
      (document.querySelector('[data-testid="pagesFormat"]')?.textContent?.trim()) ||
      (document.querySelector('.FeaturedDetails p')?.textContent?.trim()) ||
      (document.querySelector('#details .row')?.textContent?.trim()) ||
      "";

    // PUBLISHED
    const pubRaw = (document.querySelector('[data-testid="publicationInfo"]')?.textContent?.trim()) ||
      (document.querySelector('#details')?.textContent?.trim()) ||
      "";
    const published = parsePublished(pubRaw);

    // IMAGE
    const imageUrl =
      document.querySelector('.BookCover__image img')?.src ||
      document.querySelector('img.ResponsiveImage')?.src ||
      document.querySelector('img#coverImage')?.src ||
      "";

    return { title, author, rating, genres, pages: pagesRaw, published, imageUrl };
  })();
}

