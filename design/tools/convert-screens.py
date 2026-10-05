"""Chuyển bản vẽ Claude Design (design/claude-design-source/*.dc.html) sang HTML thường trong design/screens/.

Chạy từ thư mục campushub:  python design/tools/convert-screens.py
- Mỗi màn thành một file .html mở thẳng bằng trình duyệt, không cần claude.ai.
- Link giữa các màn vẫn bấm được.
- design/screens/index.html liệt kê cả 16 màn theo nhóm người dùng.
Các file trong design/screens/ bị ghi đè mỗi lần chạy: đừng sửa tay, sửa bản vẽ rồi chạy lại.
"""
import json
import re
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
NGUON = GOC / "claude-design-source"
RA = GOC / "screens"

# Claude Design bắt màn đầu tiên phải tên Main; trong repo đặt lại cho rõ nghĩa.
DOI_TEN = {"Main": "BDH-TrangChu"}
NHOM = [
    ("BDH", "Ban điều hành CLB", "laptop"),
    ("TV", "Thành viên", "điện thoại"),
    ("SV", "Sinh viên chưa vào CLB", "điện thoại"),
    ("NT", "Ban quản lý CLB của trường, mentor", "laptop"),
]


def ten_moi(stem):
    return DOI_TEN.get(stem, stem)


def chuyen(path):
    s = path.read_text(encoding="utf-8")
    title = re.search(r"<title>(.*?)</title>", s, re.S).group(1).strip()
    i, j = s.index("<x-dc>") + len("<x-dc>"), s.index("</x-dc>")
    inner = s[i:j]
    m = re.search(r"<helmet>(.*?)</helmet>", inner, re.S)
    head = m.group(1).strip() if m else ""
    body = (inner[m.end():] if m else inner).strip()
    if "{{" in body or "<sc-" in body or "<dc-import" in body:
        sys.exit(f"{path.name}: có cú pháp động của Claude Design ({{{{ }}}}, sc-, dc-import). Cần sửa tool này trước khi chuyển.")
    body = re.sub(r'href="([A-Za-z0-9_-]+)\.dc\.html"', lambda x: f'href="{ten_moi(x.group(1))}.html"', body)
    html = ("<!doctype html>\n<html lang=\"vi\">\n<head>\n<meta charset=\"utf-8\">\n"
            "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n"
            f"<title>{title} · CampusHub</title>\n{head}\n</head>\n<body>\n{body}\n</body>\n</html>\n")
    return title, html


def main():
    # Console Windows mặc định cp1252, không in được tiếng Việt
    for luong in (sys.stdout, sys.stderr):
        luong.reconfigure(encoding="utf-8")
    canvas = json.loads((NGUON / "canvas.json").read_text(encoding="utf-8"))
    RA.mkdir(exist_ok=True)
    man = []
    for name in canvas["order"]:
        stem = name[: -len(".dc.html")]
        title, html = chuyen(NGUON / name)
        out = ten_moi(stem) + ".html"
        (RA / out).write_text(html, encoding="utf-8")
        b = canvas["boards"][name]
        man.append(dict(file=out, title=b.get("title", title), w=b["w"], h=b["h"]))

    # Kiểm tra mọi link giữa các màn đều trỏ tới file có thật
    files = {m["file"] for m in man}
    for m in man:
        for href in re.findall(r'href="([^"#:]+\.html)"', (RA / m["file"]).read_text(encoding="utf-8")):
            if href not in files:
                sys.exit(f"{m['file']}: link tới {href} nhưng không có màn này")

    nhom_html = []
    for ma, ten, thiet_bi in NHOM:
        ds = [m for m in man if m["file"].startswith(ma + "-")]
        li = "\n".join(
            f'<li><a href="{m["file"]}">{m["title"].split(" · ", 1)[-1]}</a>'
            f'<span>{m["file"]} · {m["w"]}×{m["h"]}</span></li>' for m in ds)
        nhom_html.append(f"<section>\n<h2>{ten} <small>{thiet_bi} · {len(ds)} màn</small></h2>\n<ul>\n{li}\n</ul>\n</section>")
    index = f"""<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Wireframe CampusHub MVP</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&amp;family=Montserrat:wght@700&amp;display=swap">
<style>
body{{margin:0;background:#F4F3F7;color:#14121A;font-family:'Be Vietnam Pro','Segoe UI',system-ui,sans-serif;font-size:15px;line-height:1.55;padding:0 16px}}
main{{max-width:880px;margin:0 auto;padding:40px 0 64px;display:flex;flex-direction:column;gap:28px}}
h1{{margin:0;font-family:Montserrat,'Segoe UI',sans-serif;font-size:28px}}
h2{{margin:0 0 10px;font-family:Montserrat,'Segoe UI',sans-serif;font-size:18px}}
h2 small{{font-family:'Be Vietnam Pro','Segoe UI',sans-serif;font-size:13.5px;font-weight:500;color:#5E5A6B}}
p{{margin:6px 0 0;color:#3B3846;max-width:70ch}}
section{{background:#FFFFFF;border:1px solid #E4E2EA;border-radius:12px;padding:18px 20px}}
ul{{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}}
li{{display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-top:1px solid #EEEDF2;flex-wrap:wrap}}
li:first-child{{border-top:0}}
li span{{color:#5E5A6B;font-size:13px}}
a{{color:#4A3699;font-weight:600}}a:hover{{color:#2F2266}}
</style>
</head>
<body>
<main>
<header>
<h1>Wireframe CampusHub MVP</h1>
<p>{len(man)} màn, chuyển từ bản vẽ Claude Design. Mọi tên người, tên CLB và số tiền trong màn là dữ liệu mẫu. Đặc tả từng màn: <code>design/README.md</code>.</p>
</header>
{chr(10).join(nhom_html)}
</main>
</body>
</html>
"""
    (RA / "index.html").write_text(index, encoding="utf-8")
    print(f"Đã chuyển {len(man)} màn vào {RA} và tạo index.html")


if __name__ == "__main__":
    main()
