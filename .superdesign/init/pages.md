# Page dependency trees

## / — Video downloader

Entry: `templates/index.html`

Dependencies:

- `templates/index.html`
  - Bootstrap 5.1.3 CSS and JS from jsDelivr
  - Font Awesome 6.4.0 from cdnjs
  - `static/css/style.css`
  - `static/js/app.js`
- Flask APIs in `app.py`
  - `universal_downloader.py`

The page has one render branch. Responsive behavior is implemented with Bootstrap columns and a CSS media query at 992px.

