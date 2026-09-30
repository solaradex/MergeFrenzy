from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
required=["index.html","styles.css","game.js","manifest.webmanifest","robots.txt","sitemap.xml","privacy.html","terms.html"]
missing=[x for x in required if not (ROOT/x).is_file()]
if missing: raise SystemExit(f"Missing: {missing}")
html=(ROOT/"index.html").read_text(encoding="utf-8"); js=(ROOT/"game.js").read_text(encoding="utf-8")
manifest=json.loads((ROOT/"manifest.webmanifest").read_text(encoding="utf-8"))
checks={
"deferred script":'<script src="game.js" defer></script>' in html,
"canonical":'rel="canonical"' in html,
"description":'name="description"' in html,
"manifest link":'rel="manifest"' in html,
"move":"function move(" in js,
"undo":"function undo(" in js,
"shuffle":"function shuffle(" in js,
"state validation":"function isValidState(" in js,
"localStorage":"localStorage" in js,
"manifest name":manifest.get("name")=="MergeFrenzy",
}
failed=[k for k,v in checks.items() if not v]
if failed: raise SystemExit(f"Failed: {failed}")
if re.search(r'href=["\']#["\']',html): raise SystemExit("Placeholder # link found")
print("MergeFrenzy validation passed.")
