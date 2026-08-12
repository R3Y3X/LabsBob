with open("docs/css/carbon-overrides.css", "r") as f:
    css = f.read()

# I will replace the previous reset block with a more robust one.
reset_start = "/* Reset text color for all spans to make sure they are visible on light gray */"
reset_end = "/* Ensure our syntax highlighting overrides the generic reset */"

if reset_start in css and reset_end in css:
    before = css.split(reset_start)[0]
    after = css.split(reset_end)[1]
else:
    before = css
    after = ""

robust_reset = """
/* Reset text color for all blocks to make sure they are visible on light gray */
.copy-snippet-block,
.copy-snippet-block .highlight,
.copy-snippet-block pre,
.copy-snippet-block code {
  color: #161616 !important;
}

/* MkDocs uses spans without classes for regular text which inherit white from somewhere, so we force them to dark */
.copy-snippet-block span:not([class]) {
  color: #161616 !important;
}

/* Generic token fallback in case Prism is used */
.copy-snippet-block .token {
  color: #161616;
}

/* Ensure our syntax highlighting overrides the generic reset */
"""

with open("docs/css/carbon-overrides.css", "w") as f:
    f.write(before + robust_reset + after)
