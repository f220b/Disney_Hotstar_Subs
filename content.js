// Selectors from Hotstar's Shaka player (taken from "Enhance your Hotstar" 0.6.0.0).
const SPAN = '.shaka-text-container span';
const BOX = '.subtitle-container, .shaka-text-container span';
const WATERMARK = '.watermark-content';
const DEFAULTS = { font: 'Roboto', size: 28, color: '#ffffff', bg: 0, bottom: 10, outline: true, noWatermark: true };

const style = document.createElement('style');
const font = document.createElement('link');
font.rel = 'stylesheet';

function apply(o) {
  o = { ...DEFAULTS, ...o };
  font.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(o.font)}:wght@400;700&display=swap`;
  style.textContent = `
    ${SPAN} { font-family: "${o.font}", system-ui, sans-serif !important; color: ${o.color} !important;
      background-color: rgba(0,0,0,${o.bg}) !important; border-radius: 1rem; padding: 0.5rem 1.5rem;
      ${o.outline ? 'text-shadow: 0 0 3px #000, 0 0 3px #000, 0 0 3px #000 !important;' : ''} }
    ${BOX} { font-size: ${o.size}px !important; bottom: ${o.bottom}% !important; }
    ${o.noWatermark ? `${WATERMARK} { display: none !important; }` : ''}`;
}

document.documentElement.append(font, style);
chrome.storage.local.get('options', ({ options }) => apply(options));
chrome.storage.onChanged.addListener(c => c.options && apply(c.options.newValue));
