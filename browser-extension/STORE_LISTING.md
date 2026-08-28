# Chrome Web Store listing

## Product details

**Name**

OmniMedia — Media Link Parser

**Summary** (132 characters maximum)

Parse public media links from 30 supported platforms and prepare secure, short-lived downloads with OmniMedia.

**Category**

Productivity

**Language**

English (default), Simplified Chinese

## Detailed description

OmniMedia lets you paste and parse a public media link or complete copied share text through the OmniMedia service.

Paste a link or copied share text from TikTok, Douyin, Instagram, YouTube, X, Bilibili, Xiaohongshu, or another registered platform, then choose Parse. You can also click **Use current tab** to fill the active page URL. The extension displays normalized public metadata and can continue to the OmniMedia website for a private, time-limited download.

Key features:

- Explicit support for 30 public-media platforms
- Link and complete share-text input
- Optional current-tab URL fill
- Normalized title, author, platform, cover, and duration metadata
- Secure server-side download preparation using short-lived signed links
- English and Simplified Chinese interface
- Light and dark themes
- No content scripts, ads, analytics, or cross-site tracking

Only download media you own or are authorized to use. Platform availability can vary, and private or login-only content is not supported.

## Single-purpose statement

The extension's single purpose is to extract and send a user-selected public media URL to OmniMedia for parsing, with optional handoff to the website for download preparation.

## Permission justifications

**activeTab**

Used only when the user clicks **Use current tab** to fill the input with that tab's URL. The extension does not monitor tabs in the background or read page content.

**storage**

Stores only the user's language and light/dark theme preferences on the local device.

**Host access: `https://useomnimedia.com/*`**

Required to call the OmniMedia health, parse, and cover-image proxy endpoints. The secure-download action opens the full OmniMedia website; the extension does not call the download endpoint itself. No other host access is requested, and no content scripts are injected.

## Privacy-practice answers

- Data handled: the public URL locally extracted from a link or complete share text pasted by the user, or the active public page URL selected through **Use current tab**; network information inherently received by the service, such as IP address and request timing. Surrounding pasted share text is not sent to OmniMedia.
- Purpose: core functionality, security, rate limiting, reliability, and abuse prevention.
- Sold to third parties: No.
- Used for advertising or credit decisions: No.
- Used for unrelated purposes: No.
- Human access outside approved operational/security needs: No.
- Privacy policy URL: `https://useomnimedia.com/privacy/extension/`

Because a page URL may describe a visited page, disclose **Web history** in the Chrome Web Store privacy form even though the extension reads the active tab only after the user clicks **Use current tab** and does not maintain a browsing-history database.

## Reviewer test instructions

1. Install the extension and pin it to the toolbar.
2. Open the popup and paste any public supported media URL or complete share text.
3. Confirm that the platform is detected. Optionally open a supported page and click **Use current tab**.
4. Click **Parse media** and wait for normalized metadata.
5. Optionally click **Continue secure download**. The full OmniMedia workbench opens with the URL prefilled and handles the long-running server-side download flow.
6. Open an unsupported site and confirm that parsing is disabled.
7. Toggle English/Chinese and light/dark mode; close and reopen the popup to confirm persistence.

## Required assets

- Extension icon: `assets/icon-128.png`
- Store screenshot: `store-assets/omnimedia-extension-1280x800.png`
- Optional small promo tile: `store-assets/omnimedia-extension-promo-440x280.png`
