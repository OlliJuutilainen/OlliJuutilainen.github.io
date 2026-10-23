#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""analyysi.py:n testi ilman oikeaa keikkaa.

Tekee kuuden minuutin synteettisen tallenteen, jonka rajat tunnetaan: kolme
"kappaletta" (eri tempo, sävellaji ja sointi, rumpupulssi), niiden välissä
hiljaisuus ja kohinajakso ("aplodit") sekä 70 s:n puhetta jäljittelevä jakso
ilman pulssia. Kolmas kappale alkaa suoraan puheen perään ilman taukoa.
Ajaa analyysi.py:n ja tarkistaa, että jokaiselle tunnetulle rajalle löytyy
ehdokas ±1,5 s:n päästä. Tulostaa OK tai poikkeamat.

Käyttö: python3 testi.py [--pida kansio]   (--pida jättää tallenteen ja tulosteen talteen)
"""

import json
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np
from scipy.signal import butter, lfilter, sosfilt

SR = 16000
TOLERANSSI = 1.5

# (alku, loppu, laji, asetukset)
OHJELMA = [
    (0, 5, "hiljaa", None),
    (5, 95, "biisi", dict(bpm=120, juuri=110.0, soinnut=[0, 4, 7], kirkas=False, siemen=1)),
    (95, 97, "hiljaa", None),
    (97, 105, "aplodit", None),
    (105, 190, "biisi", dict(bpm=92, juuri=146.83, soinnut=[0, 3, 7], kirkas=True, siemen=2)),
    (190, 260, "puhe", None),
    (260, 350, "biisi", dict(bpm=140, juuri=92.5, soinnut=[0, 4, 7, 11], kirkas=False, siemen=3)),
    (350, 360, "aplodit", None),
]
# Tunnetut rajat: kappaleiden alut, puheen alku ja aplodien alku suoraan kappaleen perään (kuten
# outronauha, joka alkaa heti viimeisen kappaleen jälkeen). Lisäksi tauko 95–97 s kappaleen A jälkeen.
RAJAT = [5, 105, 190, 260, 350]
TAUKO = (95, 97)
TEMPOT = {5: 120, 105: 92, 260: 140}


def rms_db(y):
    return 10 * np.log10(np.mean(y * y) + 1e-12)


def taso(y, db):
    return y * 10 ** ((db - rms_db(y)) / 20)


def biisi(n, bpm, juuri, soinnut, kirkas, siemen):
    rng = np.random.default_rng(siemen)
    t = np.arange(n) / SR
    y = np.zeros(n)
    # Sointumatto: jokaisesta sointusävelestä harmonisia, kirkkaassa enemmän ylä-ääniä.
    for s in soinnut:
        f = juuri * 2 ** (s / 12)
        for h in range(1, 9 if kirkas else 5):
            y += 0.25 / h ** (0.8 if kirkas else 1.6) * np.sin(2 * np.pi * f * h * t + rng.uniform(0, 6.28))
    y *= 0.6 + 0.4 * np.sin(2 * np.pi * t / 7.0) ** 2
    isku = 60.0 / bpm
    # Melodia: sointusävel oktaavi ylempänä joka iskulla.
    for k in range(int(n / SR / isku)):
        a = int(k * isku * SR)
        b = min(n, a + int(isku * SR))
        f = 2 * juuri * 2 ** (soinnut[rng.integers(len(soinnut))] / 12)
        tt = np.arange(b - a) / SR
        y[a:b] += 0.5 * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.35)
    # Rummut: potku joka iskulla, hi-hat kahdeksasosin.
    for k in range(int(n / SR / isku)):
        a = int(k * isku * SR)
        tt = np.arange(min(n - a, int(0.25 * SR))) / SR
        y[a:a + len(tt)] += 2.0 * np.sin(2 * np.pi * (50 + 60 * np.exp(-tt / 0.03)) * tt) * np.exp(-tt / 0.09)
    hh = butter(4, 6000, "highpass", fs=SR, output="sos")
    for k in range(int(n / SR / (isku / 2))):
        a = int(k * isku / 2 * SR)
        m = min(n - a, int(0.04 * SR))
        if m > 0:
            y[a:a + m] += 0.6 * sosfilt(hh, rng.standard_normal(m)) * np.exp(-np.arange(m) / SR / 0.012)
    return taso(y, -18)


def aplodit(n, siemen):
    rng = np.random.default_rng(siemen)
    y = np.zeros(n)
    bp = butter(2, [600, 5000], "bandpass", fs=SR, output="sos")
    for a in rng.integers(0, max(1, n - 400), size=int(n / SR * 250)):
        m = 300
        y[a:a + m] += rng.standard_normal(m) * np.exp(-np.arange(m) / 60.0)
    y = sosfilt(bp, y)
    env = np.minimum(1, np.arange(n) / (0.5 * SR)) * np.minimum(1, (n - np.arange(n)) / (1.0 * SR))
    return taso(y * env, -24)


def resonaattori(f, bw):
    r = np.exp(-np.pi * bw / SR)
    return [1 - r], [1, -2 * r * np.cos(2 * np.pi * f / SR), r * r]


def puhe(n, siemen):
    """Soinnillisia vokaaleja (glottispulssit formanttisuotimien läpi), kohinakonsonantteja ja taukoja
    epäsäännöllisessä rytmissä: tavuja noin neljä sekunnissa, ei pulssia."""
    rng = np.random.default_rng(siemen)
    vokaalit = [(730, 1090), (270, 2290), (300, 870), (530, 1840), (570, 840)]
    y = np.zeros(n)
    i = 0
    while i < n:
        if rng.random() < 0.12:            # tauko
            i += int(rng.uniform(0.15, 0.6) * SR)
            continue
        if rng.random() < 0.5:             # konsonantti
            m = int(rng.uniform(0.03, 0.08) * SR)
            seg = sosfilt(butter(2, 3000, "highpass", fs=SR, output="sos"), rng.standard_normal(m)) * 0.3
            y[i:i + m] += seg[: max(0, min(m, n - i))]
            i += m
        m = int(rng.uniform(0.08, 0.25) * SR)
        f0 = rng.uniform(100, 150)
        jakso = np.zeros(m)
        p = 0.0
        while p < m:
            jakso[int(p)] = 1.0
            p += SR / (f0 * rng.uniform(0.97, 1.03))
        f1, f2 = vokaalit[rng.integers(len(vokaalit))]
        s = lfilter(*resonaattori(f1, 90), jakso) + 0.5 * lfilter(*resonaattori(f2, 120), jakso)
        s *= np.hanning(m)
        y[i:i + m] += s[: max(0, min(m, n - i))]
        i += m
    return taso(y, -22)


def tee_tallenne(polku):
    rng = np.random.default_rng(0)
    kok = int(OHJELMA[-1][1] * SR)
    y = rng.standard_normal(kok) * 10 ** (-62 / 20)   # huoneen kohina
    for a, b, laji, asetus in OHJELMA:
        i0, i1 = int(a * SR), int(b * SR)
        if laji == "biisi":
            y[i0:i1] += biisi(i1 - i0, **asetus)
        elif laji == "aplodit":
            y[i0:i1] += aplodit(i1 - i0, a)
        elif laji == "puhe":
            y[i0:i1] += puhe(i1 - i0, a)
    y = np.clip(y, -1, 1)
    with wave.open(polku, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((y * 32767).astype("<i2").tobytes())


def main():
    pida = None
    if "--pida" in sys.argv:
        pida = sys.argv[sys.argv.index("--pida") + 1]
        os.makedirs(pida, exist_ok=True)
    kansio = pida or tempfile.mkdtemp(prefix="keikka-testi-")
    wav = os.path.join(kansio, "synteettinen.wav")
    js = os.path.join(kansio, "ehdokkaat.json")
    tee_tallenne(wav)
    skripti = os.path.join(os.path.dirname(os.path.abspath(__file__)), "analyysi.py")
    tulos = subprocess.run([sys.executable, skripti, wav, "--setit", "3", "--json", js],
                           capture_output=True, text=True)
    if tulos.returncode != 0:
        print(tulos.stdout + tulos.stderr)
        print("VIRHE: analyysi.py epäonnistui.")
        sys.exit(1)
    with open(os.path.join(kansio, "tuloste.txt"), "w", encoding="utf-8") as fh:
        fh.write(tulos.stdout)
    d = json.load(open(js, encoding="utf-8"))
    ajat = [c["t"] for c in d["ehdokkaat"]]
    poikk = []
    for r in RAJAT:
        lahin = min(ajat, key=lambda t: abs(t - r)) if ajat else None
        if lahin is None or abs(lahin - r) > TOLERANSSI:
            poikk.append("raja %d s: lähin ehdokas %s" % (r, "puuttuu" if lahin is None else "%.1f s" % lahin))
    tauot = [tuple(v) for c in d["ehdokkaat"] for v in c["tauot"]]
    if not any(abs(a - TAUKO[0]) <= TOLERANSSI and abs(b - TAUKO[1]) <= TOLERANSSI for a, b in tauot):
        poikk.append("tauko %d–%d s puuttuu (tauot: %s)" % (TAUKO + (", ".join("%.1f–%.1f" % v for v in tauot),)))
    ylim = [t for t in ajat if min(abs(t - r) for r in RAJAT + [TAUKO[1]]) > 3]
    print("Tunnetut rajat: " + ", ".join("%d s" % r for r in RAJAT))
    print("Ehdokkaat:      " + ", ".join("%.1f s" % t for t in ajat))
    for r, bpm in TEMPOT.items():
        c = min(d["ehdokkaat"], key=lambda c: abs(c["t"] - r))
        print("Tempo rajan %d s jälkeen: %s (tehty %d bpm)" % (r, c["jalkeen"].split(", ")[1], bpm))
    if ylim:
        print("Ylimääräisiä ehdokkaita (ei virhe, lukija karsii): " + ", ".join("%.1f s" % t for t in ylim))
    if pida:
        print("Tallenne ja tuloste: " + kansio)
    if poikk:
        print("POIKKEAMAT:\n  " + "\n  ".join(poikk))
        sys.exit(1)
    print("OK: kaikki %d tunnettua rajaa ja tauko löytyivät ±%.1f s:n tarkkuudella." % (len(RAJAT), TOLERANSSI))


if __name__ == "__main__":
    main()
