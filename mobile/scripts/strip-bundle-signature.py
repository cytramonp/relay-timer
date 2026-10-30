"""Prepare a CI-built bundle for signing on the owner's machine, without key transfer."""
import sys, zipfile
with zipfile.ZipFile(sys.argv[1]) as source, zipfile.ZipFile(sys.argv[2], 'w') as target:
    for item in source.infolist():
        upper = item.filename.upper()
        if upper.startswith('META-INF/') and (upper.endswith(('.RSA', '.DSA', '.EC', '.SF')) or upper == 'META-INF/MANIFEST.MF'):
            continue
        target.writestr(item, source.read(item.filename))
print('Unsigned bundle created; sign locally before Play upload.')
