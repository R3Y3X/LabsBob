with open("docs/css/carbon-overrides.css", "r") as f:
    css = f.read()

# I will append a rule to remove any internal borders from MkDocs .highlight or pre
reset_css = """
/* Remove residual borders from original mkdocs/markdown styling */
.copy-snippet-block .highlight,
.copy-snippet-block pre {
  border: none !important;
  box-shadow: none !important;
  margin: 0 !important;
}
"""

with open("docs/css/carbon-overrides.css", "w") as f:
    f.write(css + reset_css)
