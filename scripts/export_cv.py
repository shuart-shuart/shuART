"""Refresh the public CV PDF from its Google Doc when deploying the site."""
import json
from io import BytesIO
from pathlib import Path
import re
import time
import urllib.request
from pypdf import PdfWriter


def export_cv():
    root = Path(__file__).resolve().parents[1]
    archive = json.loads((root / 'src/data/archive.json').read_text())
    sections = archive.get('settings', {}).get('about', {}).get('sections', [])
    section = next((item for item in sections if item.get('id') == 'cv-links'), {})
    links = re.findall(r'\[([^\]]+)\]\((https://[^\s)]+)\)', section.get('text', ''))
    download = next((link for link in links if re.search('download', link[0], re.I) or re.search(r'[?&]format=pdf', link[1])), None)
    source = download or next(iter(links), None)
    doc = re.match(r'https://docs\.google\.com/document/d/([^/?#]+)(?:[/?#]|$)', source[1]) if source else None
    if not doc:
        print('CV uses a direct external file; no Google Doc export needed.')
        return
    url = f'https://docs.google.com/document/d/{doc[1]}/export?format=pdf'
    destination = root / 'dist/cv/HONG Shu-ying_CV.pdf'
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=40) as response:
                data = response.read(10 * 1024 * 1024 + 1)
                if not data.startswith(b'%PDF-') or len(data) > 10 * 1024 * 1024:
                    raise ValueError('CV export was not a valid PDF under 10 MB')
            destination.parent.mkdir(parents=True, exist_ok=True)
            writer = PdfWriter(clone_from=BytesIO(data))
            writer.add_metadata({'/Title': 'HONG Shu-ying_CV'})
            with destination.open('wb') as output:
                writer.write(output)
            print(f'Exported {destination.name} ({len(data)} bytes)')
            return
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2)


if __name__ == '__main__':
    export_cv()
