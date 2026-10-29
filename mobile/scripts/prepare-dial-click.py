"""Deterministic, original 18 ms mechanical detent; no recorded/sample audio."""
from pathlib import Path
import math
import random
import struct
import wave

rng = random.Random(47)
rate = 44100
samples = []
for i in range(int(rate * .018)):
    t = i / rate
    value = min(1, t / .0004) * math.exp(-t * 310) * (
        .4 * math.sin(2 * math.pi * 2150 * t)
        + .25 * math.sin(2 * math.pi * 3300 * t)
        + .35 * rng.uniform(-1, 1))
    samples.append(struct.pack('<h', int(value * 23000)))
with wave.open(str(Path(__file__).resolve().parents[1] / 'assets/dial-click.wav'), 'wb') as target:
    target.setnchannels(1)
    target.setsampwidth(2)
    target.setframerate(rate)
    target.writeframes(b''.join(samples))
