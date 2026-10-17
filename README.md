# Disney+ Hotstar subs

A Chrome extension (Manifest V3) that restyles subtitles on Disney+ Hotstar.

## Features

- **Font**: pick any Google Fonts family, or one of the presets (Roboto, Inter, Open Sans, …)
- **Size**: 12–60 px
- **Color** and an optional black **outline**
- **Background opacity** behind the subtitle text
- **Distance from bottom** of the player
- **Hide watermark** on the player

Changes apply live and are saved in `chrome.storage.local`. The popup shows a preview as you edit.

## Install

1. Clone or download this repo.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select this folder.
4. Open a video on hotstar.com and click the extension icon to style the subtitles.

## Files

| File | Purpose |
| --- | --- |
| `manifest.json` | Extension manifest; runs on `hotstar.com` and `apps.disneyplus.com` |
| `content.js` | Injects the subtitle CSS into the player and updates it when settings change |
| `popup.html` / `popup.js` | Settings popup with live preview |
| `icons/` | Extension icons |

## Notes

The subtitle and watermark selectors target Hotstar's Shaka player (`.shaka-text-container`, `.watermark-content`). If Hotstar changes its markup, update the selectors at the top of `content.js`.
