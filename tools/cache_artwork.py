"""Cache and optimize the existing official Google Play artwork (requires Pillow).

Uses normal HTTPS proxy and TLS verification. No repository references change unless
all artwork has downloaded and decoded successfully. Original source URLs remain in
assets/products.json for attribution. Run from any directory after network access
for play-lh.googleusercontent.com is enabled.
"""
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
import json
from pathlib import Path
import tempfile
import urllib.request
from urllib.parse import urlsplit
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

def optimize(data, max_width):
    with Image.open(BytesIO(data)) as source:
        source.load()  # Reject truncated/corrupt artwork before changing references.
        image = source.convert('RGB') if source.mode not in ('RGB', 'RGBA') else source.copy()
        if image.width > max_width:
            image.thumbnail((max_width, 1600), Image.Resampling.LANCZOS)
        output = BytesIO()
        image.save(output, 'WEBP', quality=84, method=6)
        return output.getvalue()

def main():
    products = json.loads((ROOT / 'assets/products.json').read_text())
    jobs = []
    for product in products:
        jobs.append((product['icon'], f"{product['key']}-icon.webp", 104))
        jobs.extend((url, f"{product['key']}-{index+1}.webp", 600) for index,url in enumerate(product['images'][:2]))
    destination = ROOT / 'assets/apps'
    with tempfile.TemporaryDirectory(prefix='portfolio-artwork-') as scratch:
        temp = Path(scratch)
        def prepare(job):
            url,name,width = job
            existing = destination / name
            if existing.exists():
                data = existing.read_bytes()
                with Image.open(BytesIO(data)) as cached:
                    cached.load()
                    if cached.width <= width and cached.height <= 1600 and cached.format == 'WEBP':
                        (temp / name).write_bytes(data)
                        return url,name
            else:
                parsed = urlsplit(url)
                if parsed.scheme != 'https' or parsed.hostname != 'play-lh.googleusercontent.com':
                    raise ValueError('Expected official Google Play artwork URL')
                with urllib.request.urlopen(url, timeout=30) as response:
                    data = response.read(15 * 1024 * 1024 + 1)
                if len(data) > 15 * 1024 * 1024:
                    raise ValueError('Artwork exceeds 15 MiB limit')
            (temp / name).write_bytes(optimize(data, width))
            return url,name
        try:
            with ThreadPoolExecutor(max_workers=4) as pool:
                completed = list(pool.map(prepare, jobs))
        except Exception as error:
            print(f'Artwork unavailable ({type(error).__name__}). No files or references changed.')
            print('Check HTTPS access to play-lh.googleusercontent.com in environment settings.')
            return 1
        html = (ROOT / 'index.html').read_text()
        for url,name in completed:
            html = html.replace(url, 'assets/apps/' + name)
        destination.mkdir(parents=True, exist_ok=True)
        for _,name in completed:
            (destination / name).write_bytes((temp / name).read_bytes())
        (ROOT / 'index.html').write_text(html)
        print(f'Cached and optimized {len(completed)} official artwork assets. Original URLs remain in assets/products.json.')
        return 0

if __name__ == '__main__':
    raise SystemExit(main())
