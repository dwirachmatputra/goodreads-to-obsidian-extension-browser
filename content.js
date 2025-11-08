chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_BOOK_INFO") {
    try {
      // --- Title ---
      const titleEl = document.querySelector('[data-testid="bookTitle"]');
      const title = titleEl ? titleEl.textContent.trim() : "";

      // --- Author ---
      const authorEl = document.querySelector('span.ContributorLink__name');
      const author = authorEl ? authorEl.textContent.trim() : "";

      // --- Rating ---
      const ratingEl = document.querySelector('[data-testid="rating"] span');
      const rating = ratingEl ? ratingEl.textContent.trim() : "";

      // --- Genres ---
      const genreEls = Array.from(
        document.querySelectorAll(".BookPageMetadataSection__genreButton .Button__labelItem")
      );
      let genres = genreEls.map(el =>
        el.textContent.trim().toLowerCase().replace(/\s+/g, "-")
      );
      const moreIndex = genres.indexOf("...more");
      if (moreIndex !== -1) genres = genres.slice(0, moreIndex);

      // --- Image URL ---
      const imgEl = document.querySelector(".BookCover__image img");
      const imageUrl = imgEl ? imgEl.src : "";

      // --- Pages ---
      const pagesEl = document.querySelector('[data-testid="pagesFormat"]');
      let pages = "";
      if (pagesEl) {
        const match = pagesEl.textContent.match(/(\d+)\s*pages/i);
        pages = match ? match[1] : "";
      }

      // --- Published Date ---
      const pubEl = document.querySelector('[data-testid="publicationInfo"]');
      let published = "";
      if (pubEl) {
        const dateMatch = pubEl.textContent.match(/(\w+)\s+(\d{1,2}),\s*(\d{4})/);
        if (dateMatch) {
          const monthMap = {
            january: "01",
            february: "02",
            march: "03",
            april: "04",
            may: "05",
            june: "06",
            july: "07",
            august: "08",
            september: "09",
            october: "10",
            november: "11",
            december: "12",
          };
          const month = monthMap[dateMatch[1].toLowerCase()];
          const day = dateMatch[2].padStart(2, "0");
          const year = dateMatch[3];
          published = `${year}-${month}-${day}`;
        }
      }

      // --- Build YAML ---
      const yaml = `---
cover: '${imageUrl}'
author:
    - '[[${
      author || ""
    }]]'
published: ${published}
tags:
${genres.map(g => `    - ${g}`).join("\n")}
rating: ${rating}
pages: ${pages}
lists:
comment:
path: [[your pdf here]]
---

# ${title}`;

      sendResponse({
        title,
        author,
        rating,
        genres,
        imageUrl,
        pages,
        published,
        yaml,
      });
    } catch (err) {
      console.error("Error extracting info:", err);
      sendResponse(null);
    }
  }
  return true;
});

