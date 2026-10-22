"""Package the verified release with original art, source and native proofs."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json, hashlib, shutil
root=Path(__file__).resolve().parents[1]
shared=Path('/workspace/shared')
standalone=root/'Little-Eyes-Portrait.html'
backup=shared/'Little-Eyes-Before-Furniture.html'
if not backup.exists():
 source=root/'snapshots/before-furniture-customization/Little-Eyes-Portrait.html'
 if source.exists():shutil.copyfile(source,backup)
shutil.copyfile(standalone,shared/standalone.name)
archive=shared/'Little-Eyes-Furniture.zip'
files=[]
for directory in ['dist','scripts','tests','docs','legacy-v1']:
 files.extend((p,f'Little-Eyes/{p.relative_to(root)}') for p in (root/directory).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
files.extend((root/p,f'Little-Eyes/{p}') for p in ['README.md','Little-Eyes-Portrait.html'])
for folder in ['specs','plans']:
 p=Path('/workspace/docs/superpowers')/folder/('2026-10-22-little-eyes-furniture-customization'+('-design.md' if folder=='specs' else '.md'))
 files.append((p,f'Little-Eyes/approved/{p.name}'))
proofs=shared/'little-eyes-furniture-proof'
files.extend((p,f'Little-Eyes/proofs/{p.name}') for p in proofs.glob('*.png') if p.name!='all-64.png')
with ZipFile(archive,'w',ZIP_DEFLATED,compresslevel=6) as z:
 for path,name in sorted(files,key=lambda p:p[1]):z.write(path,name)
with ZipFile(archive) as z:
 assert z.testzip() is None
 assert z.read('Little-Eyes/Little-Eyes-Portrait.html')==standalone.read_bytes()
 for p in (root/'dist/assets').rglob('*.png'):
  assert z.read(f'Little-Eyes/{p.relative_to(root)}')==p.read_bytes()
assert (shared/standalone.name).read_bytes()==standalone.read_bytes()
m=json.loads((root/'dist/assets/manifest.json').read_text())
html=standalone.read_text()
for f in m['files'].values():
 assert (root/'dist'/f['file']).is_file()
 assert f['file'] not in html, f['file']
assert '<script type="module" src=' not in html
assert '<link rel="stylesheet"' not in html
print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'entries':len(files),'standaloneBytes':standalone.stat().st_size,'sha256':hashlib.sha256(standalone.read_bytes()).hexdigest(),'crc':'passed','originalPNGIdentity':'passed','standaloneIdentity':'passed','embeddedAssetPaths':'passed'},indent=2))
