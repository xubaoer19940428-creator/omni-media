# Theme

## Compact token summary

- Primary gradient: `linear-gradient(135deg, #6366f1 0%, #a855f7 100%)`
- Background: `radial-gradient(circle at top right, #1e1b4b, #0f172a)`
- Glass panel: `rgba(255, 255, 255, 0.03)`
- Glass border: `rgba(255, 255, 255, 0.1)`
- Primary text: `#f8fafc`
- Secondary text: `#94a3b8`
- Accent: `#818cf8`
- Font: Outfit, weights 300–700
- Main radius: 24px; controls 12–16px; video preview 20px
- Main breakpoint: 992px
- Motion: 0.3s control transitions and 0.6s slide-up result reveal

## Raw source

File: `static/css/style.css`

~~~css
@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;&display=swap");

:root {
  --primary-gradient: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  --bg-gradient: radial-gradient(circle at top right, #1e1b4b, #0f172a);
  --glass-bg: rgba(255, 255, 255, 0.03);
  --glass-border: rgba(255, 255, 255, 0.1);
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --accent-color: #818cf8;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Outfit", sans-serif;
}

body {
  background: var(--bg-gradient);
  color: var(--text-primary);
  min-height: 100vh;
  overflow-x: hidden;
}

.container-fluid {
  padding: 0;
}

/* Glass Card Style */
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
}

/* Sidebar Styling */
.sidebar {
  height: 100vh;
  padding: 2.5rem;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo i {
  font-size: 2.5rem;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.logo h3 {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 16px;
  transition: all 0.3s ease;
  cursor: default;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.feature-item i {
  color: var(--accent-color);
  font-size: 1.2rem;
}

.usage-tips {
  margin-top: auto;
  background: rgba(255, 255, 255, 0.05);
}

.usage-tips h5 {
  color: var(--accent-color);
  margin-bottom: 1rem;
}

.usage-tips ul li {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.8rem;
  list-style: none;
  position: relative;
  padding-left: 1.5rem;
}

.usage-tips ul li::before {
  content: "→";
  position: absolute;
  left: 0;
  color: var(--accent-color);
}

/* Main Content area */
.main-content {
  padding: 3rem;
}

.header {
  margin-bottom: 4rem;
  text-align: left;
}

.header h1 {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  background: linear-gradient(to right, #fff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Input Section */
.input-section {
  padding: 2.5rem;
  margin-bottom: 3rem;
}

.input-group {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  padding: 0.5rem;
  border: 1px solid var(--glass-border);
  transition: all 0.3s ease;
}

.input-group:focus-within {
  border-color: var(--accent-color);
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
}

.input-group-text {
  background: transparent;
  border: none;
  color: var(--accent-color);
}

.form-control {
  background: transparent !important;
  border: none !important;
  color: #fff !important;
  padding: 1rem;
  font-size: 1.1rem;
}

.form-control::placeholder {
  color: #64748b;
}

.btn-primary {
  background: var(--primary-gradient);
  border: none;
  border-radius: 12px;
  padding: 0.8rem 2rem;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}

/* Video Info Card */
.video-info-section {
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.video-card {
  padding: 2rem;
}

.video-preview {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.video-overlay {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

.video-details {
  padding-left: 2rem;
}

.video-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  line-height: 1.3;
}

.stat-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  padding: 0.6rem 1.2rem;
  border-radius: 12px;
  margin-right: 0.8rem;
  margin-bottom: 0.8rem;
}

.action-buttons {
  margin-top: 2.5rem;
  display: flex;
  gap: 1rem;
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  padding: 1rem 2rem;
  border-radius: 14px;
}

.btn-outline-primary {
  border: 1px solid var(--glass-border);
  background: rgba(255, 255, 255, 0.03);
  color: #fff;
}

.btn-outline-primary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #fff;
}

/* Progress Section */
.loading-section,
.download-progress {
  text-align: center;
  padding: 4rem;
}

.spinner-border {
  width: 3.5rem;
  height: 3.5rem;
  border-width: 0.25em;
  color: var(--accent-color) !important;
}

/* Animations */
@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 992px) {
  .sidebar {
    height: auto;
    position: relative;
    padding: 2rem;
  }
  .main-content {
    padding: 2rem;
  }
  .header h1 {
    font-size: 2.5rem;
  }
  .video-details {
    padding-left: 0;
    margin-top: 2rem;
  }
}
~~~

