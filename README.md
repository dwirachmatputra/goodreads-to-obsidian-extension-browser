# goodreads-to-obsidian-extension-browser
---

Save book info from Goodreads and import them to Obsidian.  

If you already have [bookshelf plugin](https://obsidian.md/plugins?id=bookshelf) in Obsidian,
And then you want to improve the way you manage your book collection, you might like this extension because it helps you get book info from Goodreads site easily.  

<pre>
Disclaimer!
This is not the way to download books illegaly.  
This is the way you save book's info easily.
</pre>
---
## Installation

**Chrome / Brave /Edge:**
1. Download the latest packaged release (`.zip`) from the [Releases](https://github.com/dwirachmatputra/goodreads-to-obsidian-extension-browser/releases/tag/v.0.1.0) section.
2. Navigate to 
	for Google chrome
	`chrome://extensions/` 
	for Brave
	`brave://extensions/` 
	for Edge
	`edge://extensions/`
3. Enable **Developer Mode**.
4. Click **Load unpacked** and select the extracted extension directory.

**Firefox:**
1. Open 
	`about:debugging#/runtime/this-firefox`.
2. Select **Load Temporary Add-on**.
3. Choose the `manifest.json` file located in the root of the project.
---
## Usage

After installation:
1. Open Goodreads URL and find book that you want to save in obsidian.
2. Click the extension icon extension then it will popped up a book info.
   <p>
     <img width="347" height="391" alt="Capture1" src="https://github.com/user-attachments/assets/86b5c995-79de-4150-8d69-86ed7cbc74fe" />
   </p>
4. You can click Import to Obsidian for directly insert to Books/{{book's title}}, or you can choose Download .md and place the file to the path you want, or simply type in input field in the menu to directly insert into your current vault.
5. fill `pdf: ` field with `[[your-book.pdf]]`

---
## Additional
<p>
  <img width="423" height="242" alt="Capture" src="https://github.com/user-attachments/assets/fe1920b9-e6ee-4a12-9b26-4a30f7594201" />
</p>  
  
So, if you notice when you use Bookshelf Plugin that there is no direct way to open your pdf file in Bookshelf library tab. If you click button link in book details pop up, it will open your-book.md file, not the pdf file. You need to setup ``[[yourPdfName]]`` or ``![[yourPdfName]]``first in order to open your pdf file or searching the file on your directory to find the book manually.

If you want to save your time and open your pdf file directly when you click book's details link icon.  
You might interested custom obsidian plugin for this feature.
This plugin helps you open the PDF file when you click link button. 
  
Check this out -> [Bookshelf-book-details-open-pdf-plugin](https://github.com/dwirachmatputra)

