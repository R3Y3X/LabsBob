import re

with open("docs/css/carbon-overrides.css", "r") as f:
    css = f.read()

# Replace the previous snippet block with the new one
start_marker = "/* -------------------------------------------------------- */\n/* Custom Code Snippet Styles with Dynamic Category Colors  */"
end_marker = "/* End of Custom Code Snippet Styles */" # Doesn't exist, we just replace everything from start_marker to the end

if start_marker in css:
    css = css[:css.find(start_marker)]

new_css = """/* -------------------------------------------------------- */
/* Custom Code Snippet Styles with Dynamic Category Colors  */
/* -------------------------------------------------------- */
.copy-snippet-block {
  position: relative;
  background-color: var(--cds-layer, #f4f4f4);
  border-left: 4px solid var(--cds-border-strong, #8d8d8d);
  margin-bottom: 1.5rem;
  display: block; /* Changed from flex to block to allow absolute positioning of button */
  transition: border-color 0.3s ease;
}

.copy-snippet-block pre {
  background-color: transparent !important;
  margin: 0 !important;
  padding: 1rem 3rem 1rem 1rem !important; /* Leave space for button on the right */
  color: var(--cds-text-primary, #161616) !important;
  overflow-x: auto;
}

/* Fix syntax highlighting colors for light background */
.copy-snippet-block .highlight .k, 
.copy-snippet-block .highlight .kd,
.copy-snippet-block .highlight .kn { color: #0043ce !important; font-weight: bold; }
.copy-snippet-block .highlight .s, 
.copy-snippet-block .highlight .s2, 
.copy-snippet-block .highlight .se { color: #198038 !important; }
.copy-snippet-block .highlight .c, 
.copy-snippet-block .highlight .c1 { color: #6f6f6f !important; font-style: italic; }
.copy-snippet-block .highlight .nf, 
.copy-snippet-block .highlight .nx { color: #8a3ffc !important; }

.copy-snippet-block[data-category="basic"] {
  border-left-color: var(--cds-blue-60, #0f62fe);
}
.copy-snippet-block[data-category="integraciones"] {
  border-left-color: var(--cds-purple-60, #8a3ffc);
}
.copy-snippet-block[data-category="premium"] {
  border-left-color: var(--cds-green-60, #198038);
}

.cds--snippet-container {
  width: 100%;
}

.cds--snippet-btn.cds--copy-btn {
  position: absolute;
  top: 0;
  right: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cds-link-primary, #0f62fe);
  transition: color 0.3s ease, background-color 0.15s ease;
}

/* Tooltip for copy success */
.cds--snippet-btn.cds--copy-btn::after {
  content: "¡Copiado!";
  position: absolute;
  right: 100%;
  margin-right: 0.5rem;
  background: var(--cds-inverse-02, #393939);
  color: #fff;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 2px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  white-space: nowrap;
}
.cds--snippet-btn.cds--copy-btn.copied::after {
  opacity: 1;
}

.copy-snippet-block[data-category="basic"] .cds--snippet-btn.cds--copy-btn {
  color: var(--cds-blue-60, #0f62fe);
}
.copy-snippet-block[data-category="integraciones"] .cds--snippet-btn.cds--copy-btn {
  color: var(--cds-purple-60, #8a3ffc);
}
.copy-snippet-block[data-category="premium"] .cds--snippet-btn.cds--copy-btn {
  color: var(--cds-green-60, #198038);
}

.cds--snippet-btn.cds--copy-btn:hover {
  background-color: var(--cds-layer-hover, #e8e8e8);
}

.cds--snippet__icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
"""

with open("docs/css/carbon-overrides.css", "w") as f:
    f.write(css + new_css)
