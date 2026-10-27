"""Derive mobile assets from the approved CorpTimer web artwork; synthesize short cues.

Run from mobile/: python scripts/prepare-assets.py
Icon conversion uses @expo/image-utils through prepare-icon.cjs.
"""
from pathlib import Path
from PIL import Image
import math
import struct
import wave
import shutil

root = Path(__file__).resolve().parents[1]
web = root.parent / 'docs'
assets = root / 'assets'
assets.mkdir(exist_ok=True)
atlas = Image.open(web / 'assets/timer-illustrations.jpg')
names = ['boxing','fitness','pomodoro','classroom','chess','stopwatch','simple','newyear']
for i, name in enumerate(names):
    x, y = i % 2 * atlas.width // 2, i // 2 * atlas.height // 4
    tile = atlas.crop((x,y,x+atlas.width//2,y+atlas.height//4))
    tile.thumbnail((480,480))
    tile.save(assets / f'{name}.jpg', quality=85, comment=b'Origin: approved CorpTimer atlas, docs/assets/timer-illustrations.jpg; original prompt in outputs/timer-library/illustration-prompt.txt')
for name in ['Manrope.ttf','CantataOne-Regular.ttf']:
    shutil.copyfile(web / 'fonts' / name, assets / name)
for name in ['OFL.txt','CantataOne-OFL.txt']:
    shutil.copyfile(web / 'fonts' / name, assets / name)
for name, duration, frequency, decay in [('bell',1.3,880,5),('gong',1.8,220,2.5),('beep',0.25,1000,8)]:
    rate=22050
    with wave.open(str(assets/f'{name}.wav'),'w') as output:
        output.setparams((1,2,rate,0,'NONE','not compressed'))
        for n in range(int(rate*duration)):
            t=n/rate
            value=(math.sin(2*math.pi*frequency*t)+0.3*math.sin(2*math.pi*frequency*2.71*t))*math.exp(-decay*t)*min(1,t*150)
            output.writeframesraw(struct.pack('<h',int(max(-1,min(1,value*0.55))*32767)))
print('Prepared 8 illustrations, fonts, licenses and 3 synthesized cues.')
