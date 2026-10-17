"""Build web-sized derivatives while retaining every original artwork file."""
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'public/derived-media'
OUTPUT.mkdir(parents=True, exist_ok=True)

def process(path):
    try:
        with Image.open(path) as source:
            animated = getattr(source, 'n_frames', 1) > 1
            image = ImageOps.exif_transpose(source).convert('RGBA' if 'A' in source.getbands() else 'RGB')
            width, height = image.size
            result = {'width': width, 'height': height, 'animated': animated}
            for kind, maximum, quality in [('thumbnail', 800, 84), ('display', 2000, 88)]:
                if kind == 'display' and animated:
                    result[kind] = f'/media/{path.name}'
                    result[kind + 'Width'] = width
                    continue
                destination = OUTPUT / f'v1-{path.stem}-{kind}.webp'
                resized = image.copy()
                resized.thumbnail((maximum, maximum), Image.Resampling.LANCZOS)
                if not destination.exists():
                    resized.save(destination, 'WEBP', quality=quality, method=5)
                use_original = kind == 'display' and (animated or destination.stat().st_size >= path.stat().st_size)
                result[kind] = f'/media/{path.name}' if use_original else f'/derived-media/{destination.name}'
                result[kind + 'Width'] = width if use_original else resized.width
            return path.name, result
    except (OSError, ValueError):
        return None

files = sorted(path for path in (ROOT / 'public/media').iterdir() if path.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'})
with ThreadPoolExecutor(max_workers=2) as pool:
    manifest = dict(item for item in pool.map(process, files) if item)
used = {Path(value).name for item in manifest.values() for key, value in item.items() if key in {'thumbnail', 'display'} and value.startswith('/derived-media/')}
for path in OUTPUT.glob('v1-*.webp'):
    if path.name not in used: path.unlink()
(ROOT / 'src/data/imageVariants.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(f'Prepared thumbnails and display sizes for {len(manifest)} images; originals retained.')
