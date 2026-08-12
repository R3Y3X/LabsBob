import re
import os

input_file = "/Users/luisreyes/.gemini/antigravity-ide/brain/aa16a638-5344-45f0-88d3-6c68668e2c59/.system_generated/steps/1307/content.md"
output_file = "/Users/luisreyes/Desktop/IBM/bob/labsBob/docs/content/integraciones/agentic-retail-voltia/deploy.html"

# Read the content
with open(input_file, "r") as f:
    lines = f.readlines()

# Extract from Lab 3 title to the end of the lab content
start_idx = 0
end_idx = 0
for i, line in enumerate(lines):
    if "Lab 3 — Voltia: una tienda web con un asistente de IA embebido" in line:
        start_idx = i
    if "El rol de IBM Bob" in line:
        end_idx = i + 10 # capture the last few lines

content = "".join(lines[start_idx:end_idx])

# Apply Carbon Design System classes
# Headings
content = re.sub(r'<h2(.*?)>', r'<section class="lab-section" style="margin-top: 3rem;"><h2 class="cds--productive-heading-04"\1>', content)
content = re.sub(r'<h3(.*?)>', r'<h3 class="cds--productive-heading-03" style="margin-top: 2rem;"\1>', content)
content = re.sub(r'<p>', r'<p class="cds--body-01">', content)
content = re.sub(r'<ul>', r'<ul class="cds--list--unordered">', content)
content = re.sub(r'<ul class="task-list">', r'<ul class="cds--list--unordered" style="list-style-type: none;">', content)
content = re.sub(r'<ol>', r'<ol class="cds--list--ordered">', content)
content = re.sub(r'<li>', r'<li class="cds--list__item">', content)
content = re.sub(r'<li class="task-list-item">', r'<li class="cds--list__item" style="display: flex; align-items: center; gap: 0.5rem;">', content)

# Admonitions to Callouts
def repl_admonition(match):
    tone = match.group(1)
    if tone == 'note': tone = 'info'
    inner = match.group(2)
    inner = re.sub(r'<p class="admonition-title">(.*?)</p>', r'<p class="callout__title">\1</p>', inner)
    return f'<div class="callout" data-tone="{tone}">{inner}</div>'

content = re.sub(r'<div class="admonition (.*?)">(.*?)</div>', repl_admonition, content, flags=re.DOTALL)

# Tables (Carbon styling if any, or just standard)
content = re.sub(r'<table>', r'<table class="cds--data-table cds--data-table--sort">', content)
content = re.sub(r'<thead>', r'<thead>', content)
content = re.sub(r'<tbody>', r'<tbody class="cds--data-table-content">', content)

# Close sections (simple heuristic: every h2 starts a section, so we just wrap everything in the main div and let sections be unclosed or close them correctly)
# Actually, it's easier to just strip the section wrapping from H2 and wrap the whole thing in <div class="content-panel lab-template prose--full"> <section class="lab-section"> ... </section> </div>
content = content.replace('<section class="lab-section" style="margin-top: 3rem;">', '')

# Images: fix src paths
content = re.sub(r'src="assets/(.*?)"', r'src="./assets/\1"', content)
content = re.sub(r'src="../../../images/solutions/(.*?)"', r'src="../../assets/images/solutions/\1"', content)
content = re.sub(r'href="assets/(.*?)"', r'href="./assets/\1"', content)

# Wrap in the main template
final_html = f"""<div class="content-panel lab-template prose--full">
  <section class="lab-section">
    {content}
  </section>
</div>
"""

with open(output_file, "w") as f:
    f.write(final_html)

print("HTML generated successfully!")
