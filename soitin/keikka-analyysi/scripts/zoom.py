#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Lähikuva epäselvästä kohdasta: mel-spektrogrammi ja kolmen kaistan tasokäyrä.

Käyttö:
  python3 zoom.py keikka.mp3 12:00 13:30 kuva.png [--merkit 12:41,13:05]

Alku ja loppu muodossa m:ss, h:mm:ss tai sekunteina. Kuvan leveys on 1300 px;
aika-akselilla on merkki 1–2 s:n välein (pitkällä välillä harvemmin) ja aika
tekstinä muutaman merkin välein. --merkit piirtää pystyviivan annettuihin
kohtiin (esim. analyysi.py:n ehdokkaat). Riippuvuudet: ffmpeg ja numpy; PNG
kirjoitetaan ilman kuvakirjastoja.
"""

import os
import struct
import subprocess
import sys
import zlib

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from analyysi import SR, ffmpeg_polku, jasenna_aika  # noqa: E402

LEVEYS = 1300
SPEK_K = 320
TASO_K = 150
VALI = 8
YLA = 24
ALA = 34
NFFT = 1024
HOP = 160

FONTTI = {
    "0": "01110 10001 10011 10101 11001 10001 01110", "1": "00100 01100 00100 00100 00100 00100 01110",
    "2": "01110 10001 00001 00010 00100 01000 11111", "3": "11111 00010 00100 00010 00001 10001 01110",
    "4": "00010 00110 01010 10010 11111 00010 00010", "5": "11111 10000 11110 00001 00001 10001 01110",
    "6": "00110 01000 10000 11110 10001 10001 01110", "7": "11111 00001 00010 00100 01000 01000 01000",
    "8": "01110 10001 10001 01110 10001 10001 01110", "9": "01110 10001 10001 01111 00001 00010 01100",
    ":": "00000 01100 01100 00000 01100 01100 00000", ".": "00000 00000 00000 00000 00000 01100 01100",
    "-": "00000 00000 00000 11111 00000 00000 00000", " ": "00000 00000 00000 00000 00000 00000 00000",
    "<": "00010 00100 01000 10000 01000 00100 00010", ">": "01000 00100 00010 00001 00010 00100 01000",
    "k": "10000 10000 10010 10100 11000 10100 10010", "H": "10001 10001 10001 11111 10001 10001 10001",
    "z": "00000 00000 11111 00010 00100 01000 11111", "d": "00001 00001 01101 10011 10001 10001 01111",
    "B": "11110 10001 10001 11110 10001 10001 11110",
}
# Magma-tyyppinen väriasteikko: tumma = hiljaa, vaalea = voimakas.
ASTEIKKO = np.array([(0, 0, 4), (40, 11, 84), (101, 21, 110), (159, 42, 99), (212, 72, 66),
                     (245, 125, 21), (250, 193, 39), (252, 253, 191)], float)
KAISTAT = [("<120 Hz", (0, 120), (214, 96, 24)), ("300-3k", (300, 3000), (10, 127, 118)),
           (">3k", (3000, 8000), (90, 70, 200))]


def aika_teksti(t):
    t = int(round(t))
    h, m, s = t // 3600, t % 3600 // 60, t % 60
    return "%d:%02d:%02d" % (h, m, s) if h else "%d:%02d" % (m, s)


def teksti(kuva, x, y, s, vari, koko=2):
    for ch in s:
        g = FONTTI.get(ch, FONTTI[" "]).split()
        for r, rivi in enumerate(g):
            for c, b in enumerate(rivi):
                if b == "1":
                    y0, x0 = y + r * koko, x + c * koko
                    if 0 <= y0 < kuva.shape[0] - koko and 0 <= x0 < kuva.shape[1] - koko:
                        kuva[y0:y0 + koko, x0:x0 + koko] = vari
        x += 6 * koko
    return x


def tekstin_leveys(s, koko=2):
    return len(s) * 6 * koko - koko


def kirjoita_png(polku, rgb):
    h, w, _ = rgb.shape
    raaka = b"".join(b"\x00" + rgb[y].tobytes() for y in range(h))

    def pala(tyyppi, data):
        return struct.pack(">I", len(data)) + tyyppi + data + struct.pack(">I", zlib.crc32(tyyppi + data) & 0xFFFFFFFF)

    with open(polku, "wb") as fh:
        fh.write(b"\x89PNG\r\n\x1a\n" + pala(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) +
                 pala(b"IDAT", zlib.compress(raaka, 6)) + pala(b"IEND", b""))


def mel_suotimet(n_mel, f_min, f_max):
    mel = lambda f: 2595 * np.log10(1 + f / 700.0)  # noqa: E731
    imel = lambda m: 700 * (10 ** (m / 2595.0) - 1)  # noqa: E731
    pts = imel(np.linspace(mel(f_min), mel(f_max), n_mel + 2))
    f = np.fft.rfftfreq(NFFT, 1.0 / SR)
    w = np.zeros((len(f), n_mel), np.float32)
    for i in range(n_mel):
        a, c, b = pts[i], pts[i + 1], pts[i + 2]
        w[:, i] = np.clip(np.minimum((f - a) / (c - a + 1e-9), (b - f) / (b - c + 1e-9)), 0, None)
    return w, f


def main():
    args = sys.argv[1:]
    merkit = []
    if "--merkit" in args:
        i = args.index("--merkit")
        merkit = [jasenna_aika(v) for v in args[i + 1].split(",") if v.strip()]
        del args[i:i + 2]
    if len(args) != 4:
        sys.exit(__doc__)
    polku, alku, loppu, ulos = args[0], jasenna_aika(args[1]), jasenna_aika(args[2]), args[3]
    if loppu <= alku:
        sys.exit("Lopun pitää olla alun jälkeen.")
    ff = ffmpeg_polku()
    if not ff:
        sys.exit("ffmpeg puuttuu. Asenna se tai: pip install imageio-ffmpeg")
    raw = subprocess.run([ff, "-nostdin", "-v", "error", "-ss", "%.3f" % alku, "-t", "%.3f" % (loppu - alku),
                          "-i", polku, "-vn", "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, "<i2").astype(np.float32) / 32768.0
    if len(x) < NFFT:
        sys.exit("Välillä ei ole ääntä (tiedoston loppu?).")
    span = loppu - alku

    from numpy.lib.stride_tricks import sliding_window_view
    fr = sliding_window_view(x, NFFT)[::HOP]
    P = np.abs(np.fft.rfft(fr * np.hanning(NFFT).astype(np.float32), axis=1)) ** 2
    mw, f = mel_suotimet(96, 30, 8000)
    M = 10 * np.log10(P @ mw + 1e-10)
    tasot = [10 * np.log10(P[:, (f >= a) & (f < b)].sum(1) + 1e-10) for _, (a, b), _ in KAISTAT]

    # Sarakkeet: jokainen kuvan sarake on kehysten keskiarvo (spektri) tai huippu (tasot).
    n = len(M)
    reunat = np.linspace(0, n, LEVEYS + 1).astype(int)
    reunat[1:] = np.maximum(reunat[1:], reunat[:-1] + 1)
    reunat = np.minimum(reunat, n)

    def sarakkeet(v, fn):
        return np.array([fn(v[a:max(b, a + 1)], axis=0) if a < n else v[-1] for a, b in zip(reunat[:-1], reunat[1:])])

    Ms = sarakkeet(M, np.mean)
    Ls = [sarakkeet(t, np.max) for t in tasot]

    K = YLA + SPEK_K + VALI + TASO_K + ALA
    kuva = np.full((K, LEVEYS, 3), 255, np.uint8)
    # Spektrogrammi: matalat taajuudet alhaalla, 70 dB:n dynamiikka.
    huippu = np.percentile(Ms, 99.5)
    v = np.clip((Ms - (huippu - 70)) / 70, 0, 1)
    idx = v * (len(ASTEIKKO) - 1)
    i0 = np.floor(idx).astype(int)
    i1 = np.minimum(i0 + 1, len(ASTEIKKO) - 1)
    w = (idx - i0)[..., None]
    rgb = (ASTEIKKO[i0] * (1 - w) + ASTEIKKO[i1] * w).astype(np.uint8)   # (LEVEYS, mel, 3)
    rivit = np.linspace(rgb.shape[1] - 1, 0, SPEK_K).round().astype(int)
    kuva[YLA:YLA + SPEK_K] = rgb[:, rivit].transpose(1, 0, 2)

    # Tasokäyrät: 10 dB:n apuviivat, huipusta 60 dB alas.
    y0 = YLA + SPEK_K + VALI
    kuva[y0:y0 + TASO_K] = 248
    ylin = max(np.max(l) for l in Ls)
    for db in range(0, 61, 10):
        yy = y0 + int(db / 60 * (TASO_K - 1))
        kuva[yy, :] = 225
    for (_, _, vari), l in zip(KAISTAT, Ls):
        yy = y0 + np.clip((ylin - l) / 60 * (TASO_K - 1), 0, TASO_K - 1).astype(int)
        for xx in range(LEVEYS):
            a = yy[xx - 1] if xx else yy[0]
            lo, hi = min(a, yy[xx]), max(a, yy[xx])
            kuva[lo:hi + 2, xx] = vari
    # Selitteet vaalealle pohjalle, etteivät käyrät peitä niitä.
    lev = 8 + sum(22 + tekstin_leveys(nimi) + 18 for nimi, _, _ in KAISTAT)
    kuva[y0 + 2:y0 + 22, 2:lev] = 248
    kuva[y0 + 2:y0 + 22, LEVEYS - tekstin_leveys("10 dB") - 14:LEVEYS - 2] = 248
    xx = 8
    for nimi, _, vari in KAISTAT:
        kuva[y0 + 10:y0 + 13, xx:xx + 16] = vari
        xx = teksti(kuva, xx + 22, y0 + 5, nimi, (60, 60, 60)) + 18
    teksti(kuva, LEVEYS - tekstin_leveys("10 dB") - 8, y0 + 5, "10 dB", (120, 120, 120))

    # Aika-akseli: merkkiväli 1–2 s; tekstit harvemmin.
    if span <= 45:
        askel, teksti_askel = 1, 5
    elif span <= 150:
        askel, teksti_askel = 2, 10
    elif span <= 400:
        askel, teksti_askel = 5, 30
    else:
        askel, teksti_askel = 10, 60
    ya = y0 + TASO_K
    t = np.ceil(alku / askel) * askel
    while t <= loppu + 1e-6:
        px = int(round((t - alku) / span * (LEVEYS - 1)))
        iso = abs(t / teksti_askel - round(t / teksti_askel)) < 1e-6
        kuva[ya:ya + (10 if iso else 5), px] = 40
        if iso:
            kuva[YLA:YLA + SPEK_K, px] = (kuva[YLA:YLA + SPEK_K, px] * 0.5 + 127).astype(np.uint8)
            kuva[y0:y0 + TASO_K, px] = 200
            s = aika_teksti(t)
            teksti(kuva, max(0, min(LEVEYS - tekstin_leveys(s), px - tekstin_leveys(s) // 2)), ya + 14, s, (40, 40, 40))
        t += askel
    for m in merkit:
        if alku <= m <= loppu:
            px = int(round((m - alku) / span * (LEVEYS - 1)))
            for yy in range(YLA, ya, 6):
                kuva[yy:yy + 3, max(0, px - 1):px + 1] = (0, 200, 255)
    teksti(kuva, 6, 5, "%s-%s" % (aika_teksti(alku), aika_teksti(loppu)), (40, 40, 40))
    kirjoita_png(ulos, kuva)
    print("Kirjoitettu %s (%d × %d px, %s–%s)." % (ulos, LEVEYS, K, aika_teksti(alku), aika_teksti(loppu)))


if __name__ == "__main__":
    main()
