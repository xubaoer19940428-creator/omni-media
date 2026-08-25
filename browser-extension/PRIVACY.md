# OmniMedia Browser Extension Privacy Policy

Last updated: August 25, 2026

The OmniMedia browser extension has one purpose: parsing a public media link that the user explicitly chooses.

## Information the extension accesses

The extension accepts a link or complete share text that the user pastes into its input. It extracts the first HTTP(S) URL locally. It reads the active tab URL only when the user clicks **Use current tab**. It does not read page content, general browsing history, cookies, passwords, personal messages, or clipboard data, and it does not inject scripts into websites.

## Information sent to OmniMedia

- When the user clicks **Parse**, the public URL extracted from their input is sent to `https://useomnimedia.com` to identify the supported platform and retrieve public media metadata. The surrounding share text is not sent.
- When the user continues to a secure download, the full OmniMedia website opens with that public URL prefilled. The extension does not call the download endpoint. If the user starts a download on the website, completed files are stored temporarily in a private Cloudflare R2 bucket and are made available through a short-lived signed URL.
- Like most internet services, the hosting infrastructure receives network information such as an IP address and request timing. OmniMedia uses it for security, rate limiting, reliability, and abuse prevention.

## Information stored locally

Language and light/dark theme preferences are stored in extension storage on the user's device. They are not used for advertising or cross-site tracking.

## Retention and sharing

Temporary processed downloads are normally removed after about one day. Signed download links normally expire after 10 minutes. OmniMedia does not sell personal information or use extension data for advertising. Railway and Cloudflare process limited information only as infrastructure providers needed to operate the service.

## Permissions

- `activeTab`: read the current tab URL only when the user clicks **Use current tab**.
- `storage`: remember language and theme preferences on the user's device.
- `https://useomnimedia.com/*`: call the OmniMedia parse, health, and cover-image proxy APIs. The secure-download action opens the full OmniMedia website; the extension does not call the download endpoint itself.

## User choices

Users should not click **Parse** if they do not want the extracted public URL sent to OmniMedia. Pasted text is not stored by the extension. Locally stored preferences can be removed by uninstalling the extension or using the browser's extension storage reset/remove controls.

Privacy questions can be submitted through the [OmniMedia GitHub issue tracker](https://github.com/xubaoer19940428-creator/omni-media/issues).
