# OmniMedia Browser Extension

The official Chrome/Edge Manifest V3 extension for parsing pasted public media links and complete share text through OmniMedia.

## Single purpose

The user pastes a public media link or complete share text into the extension. OmniMedia extracts the first HTTP(S) URL locally and sends only that URL to `https://useomnimedia.com` after the user clicks **Parse**. **Use current tab** is an optional convenience that reads the active URL only when clicked. The extension shows normalized public metadata and hands secure download work to the full OmniMedia website.

The extension does not inject content scripts or read page content, browsing history, cookies, credentials, personal messages, or clipboard data.

The secure-download action opens the full OmniMedia workbench with the public URL prefilled and automatically parsed. Long-running server-side download preparation remains in the full product UI instead of the short-lived toolbar popup, without adding background or download permissions.

## Local verification

```bash
cd browser-extension
npm test
npm run package
```

To load an unpacked build:

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked** and select this `browser-extension/` directory.
4. Open a public page on one of the 22 supported platforms and click the OmniMedia toolbar button.

## Release process

1. Update `version` in both `manifest.json` and `package.json`.
2. Run `npm run package`.
3. Upload `dist/omnimedia-browser-extension-<version>.zip` to Chrome Web Store or Microsoft Edge Add-ons.
4. Confirm that `https://useomnimedia.com/privacy/extension/` is deployed and publicly reachable before submitting for review.
5. Use the listing copy and permission disclosures in `STORE_LISTING.md`.

The packaged ZIP contains runtime files only. Source tests, release scripts, documentation, screenshots, and local build output are excluded.
