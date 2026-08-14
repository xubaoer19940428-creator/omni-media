# Routes

Framework: Flask with decorator-based routes in `app.py`.

| URL | Method | Handler | UI role |
| --- | --- | --- | --- |
| `/` | GET | `index` | Renders `templates/index.html` |
| `/api/platforms` | GET | `get_platforms` | Returns supported platform metadata |
| `/api/parse` | POST | `parse_url` | Parses a pasted share URL |
| `/api/download` | POST | `download_video` | Downloads the selected video |
| `/download/<filename>` | GET | `serve_file` | Serves a completed download |
| `/api/cleanup` | POST | `cleanup_files` | Removes a downloaded file |
| `/api/proxy-image` | GET | `proxy_image` | Proxies remote cover images |

Key render route:

~~~python
@app.route('/')
def index():
    return render_template('index.html')
~~~

