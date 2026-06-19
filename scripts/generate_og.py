import os
from PIL import Image, ImageDraw, ImageFont

APP = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "app")
F = "C:/Windows/Fonts/arial.ttf"
FB = "C:/Windows/Fonts/arialbd.ttf"
def font(b, s): return ImageFont.truetype(FB if b else F, s)

CANVAS = (244, 246, 250)
INK = (15, 23, 42)
SUB = (71, 85, 105)
BRAND = (37, 99, 235)
WHITE = (255, 255, 255)

def wrap(d, text, fnt, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=fnt) <= maxw: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def og(path, W=1200, H=630):
    img = Image.new("RGB", (W, H), CANVAS)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 16, H], fill=BRAND)
    # wordmark
    d.rounded_rectangle([72, 64, 132, 124], radius=16, fill=(219, 234, 254))
    d.text((86, 74), "T", font=font(True, 40), fill=BRAND)
    d.text((150, 70), "TENSORPATH", font=font(True, 34), fill=BRAND)
    d.text((150, 110), "Learn AI, end to end", font=font(False, 20), fill=SUB)
    # headline
    hf = font(True, 60)
    d.text((72, 230), "Learn AI in 20 days.", font=hf, fill=INK)
    # accent line 2
    parts = [("From first principles to ", INK), ("AI agents.", BRAND)]
    x = 72; y = 308
    for t, c in parts:
        d.text((x, y), t, font=hf, fill=c)
        x += d.textlength(t, font=hf)
    # subline
    sf = font(False, 30)
    sy = 420
    for line in wrap(d, "Live training, your own AI coach, a verifiable certificate, and placement support.", sf, W - 160):
        d.text((72, sy), line, font=sf, fill=SUB)
        sy += 42
    d.text((72, H - 64), "tensorpath.in", font=font(True, 30), fill=BRAND)
    img.save(path)
    print("wrote", path)

def icon(path, S=512):
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, S, S], radius=int(S * 0.22), fill=BRAND)
    f = font(True, int(S * 0.6))
    t = "T"
    w = d.textlength(t, font=f)
    bbox = d.textbbox((0, 0), t, font=f)
    h = bbox[3] - bbox[1]
    d.text(((S - w) / 2, (S - h) / 2 - bbox[1]), t, font=f, fill=WHITE)
    img.save(path)
    print("wrote", path)

og(os.path.join(APP, "opengraph-image.png"))
og(os.path.join(APP, "twitter-image.png"))
icon(os.path.join(APP, "icon.png"))
print("DONE")
