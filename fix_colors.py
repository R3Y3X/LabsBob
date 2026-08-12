with open("docs/css/carbon-overrides.css", "r") as f:
    css = f.read()

# I will append a more aggressive reset for all text inside the block
reset_css = """
/* Reset text color for all spans to make sure they are visible on light gray */
.copy-snippet-block,
.copy-snippet-block .highlight,
.copy-snippet-block pre,
.copy-snippet-block code,
.copy-snippet-block span {
  color: #161616;
}

/* Ensure our syntax highlighting overrides the generic reset */
.copy-snippet-block .highlight .k, 
.copy-snippet-block .highlight .kd,
.copy-snippet-block .highlight .kn,
.copy-snippet-block .highlight .kc { color: #0043ce !important; font-weight: bold; }
.copy-snippet-block .highlight .s, 
.copy-snippet-block .highlight .s2, 
.copy-snippet-block .highlight .se { color: #198038 !important; }
.copy-snippet-block .highlight .c, 
.copy-snippet-block .highlight .c1 { color: #6f6f6f !important; font-style: italic; }
.copy-snippet-block .highlight .nf, 
.copy-snippet-block .highlight .nx,
.copy-snippet-block .highlight .nb { color: #8a3ffc !important; }

/* Ensure the copy button icon stays its correct dynamic color */
.copy-snippet-block[data-category="basic"] .cds--snippet-btn.cds--copy-btn { color: var(--cds-blue-60, #0f62fe) !important; }
.copy-snippet-block[data-category="integraciones"] .cds--snippet-btn.cds--copy-btn { color: var(--cds-purple-60, #8a3ffc) !important; }
.copy-snippet-block[data-category="premium"] .cds--snippet-btn.cds--copy-btn { color: var(--cds-green-60, #198038) !important; }

/* Tooltip text should remain white */
.cds--snippet-btn.cds--copy-btn::after {
  color: #ffffff !important;
}
"""

with open("docs/css/carbon-overrides.css", "w") as f:
    f.write(css + reset_css)
