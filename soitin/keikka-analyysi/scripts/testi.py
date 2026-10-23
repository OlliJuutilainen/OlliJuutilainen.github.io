#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""analyysi.py:n testi ilman oikeaa keikkaa.

Tekee lähes yhdeksän minuutin synteettisen tallenteen, jonka rajat tunnetaan:
viisi "kappaletta" (eri tempo, sävellaji ja sointi, rumpupulssi), niiden välissä
hiljaisuus ja kohinajakso ("aplodit") sekä 70 s:n puhetta jäljittelevä jakso
ilman pulssia. Toisen kappaleen keskellä on tauko (BREAK), kolmas kappale alkaa
suoraan puheen perään ja neljäs suoraan kolmannen perään ilman taukoa (SAUMA).
Viides kappale modulee kesken kaiken kokonaisaskeleen ylöspäin samassa tempossa
ja iskun vaiheessa (MODULAATIO?, ei kappaleen alku), ja sen perään alkaa samassa
tempossa 12 dB hiljaisempi tasapulssinen nauha (SAUMA, jonka rivillä on nauhan
tunnusmerkit; nauhalle ei ole omaa luokkaa).
Ajaa analyysi.py:n ja tarkistaa, että jokaiselle tunnetulle rajalle löytyy
ehdokas ±1,5 s:n päästä ja että sen luokka on oikea. Tarkistaa lisäksi
--tarkista-valinnan muutamalla valmiilla settilistalla, myös --ehdokkaat-vertailun.
Tulostaa OK tai poikkeamat.

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
    (145, 147.5, "hiljaa", None),          # tauko kappaleen B sisällä
    (190, 260, "puhe", None),
    (260, 330, "biisi", dict(bpm=140, juuri=92.5, soinnut=[0, 4, 7, 11], kirkas=False, siemen=3)),
    (330, 400, "biisi", dict(bpm=108, juuri=82.41, soinnut=[0, 3, 7], kirkas=True, siemen=4)),
    (400, 410, "aplodit", None),
    (412, 457, "biisi", dict(bpm=100, juuri=130.81, soinnut=[0, 4, 7], kirkas=False, siemen=5)),
    # Modulaatio: sama tempo, isku jatkuu (45 s = 75 iskua), sävellaji C → D.
    (457, 500, "biisi", dict(bpm=100, juuri=146.83, soinnut=[0, 4, 7], kirkas=False, siemen=6)),
    # Nauha samassa tempossa, 12 dB hiljaisempi, feidataan pois 525–530 s.
    (500, 530, "nauha", dict(bpm=100, juuri=110.0, soinnut=[0, 3, 7], kirkas=True, siemen=7)),
    (530, 535, "hiljaa", None),
]
# Tunnetut rajat ja niiden luokat: kappaleiden alut, puheen alku, saumaton vaihto, aplodien alku
# kappaleen perään sekä tauot kappaleiden välissä (95–97 s) ja kappaleen B sisällä (145–147,5 s).
RAJAT = {5: "RAJA", 105: "RAJA", 147.5: "BREAK", 190: "SPIIKKI", 260: "RAJA", 330: "SAUMA", 400: "HÄNTÄ",
         412: "RAJA", 457: "MODULAATIO?", 500: "SAUMA"}
NAUHA = 500   # tällä rivillä pitää olla huomautus nauhan tunnusmerkeistä, muilla ei
TAUKO = (95, 97)
TEMPOT = {5: 120, 105: 92, 260: 140, 330: 108, 412: 100}
# Settilistan tarkistus: (lista, lisävalinnat, odotettu alku tulosteessa).
LISTAT = [
    ("```\n1. 0:41\n2. 5:12\n9:03\n3. 10:15\n---\n47:20 [VÄLIAIKA]\n---\n4. 1:02:30\n---\n(+)\n"
     "1:29:40 [Vielä!]\n5. 1:31:02\n```\n", ["--setit", "3,1", "--encoret", "1"], "OK"),
    ("1. 0:41\n2. 5:12\n---\n3. 9:00\n", ["--setit", "2,2"], "OK"),            # määrä poikkeaa: silti OK
    ("1. 0:41\n3. 5:12\n", [], "VIRHEET"),                                         # numerointi
    ("1. 0:41\n2. 0:30\n", [], "VIRHEET"),                                         # ajat eivät kasva
    ("1. 0:41.5\n", [], "VIRHEET"),                                                 # ei kokonaisia sekunteja
    ("1. 0:41\n47:20 [VÄLIAIKA]\n---\n2. 50:00\n", [], "VIRHEET"),                # väliaika ei omana settinään
    ("1. 0:41\n---\n(+)\n2. 5:00\n", [], "VIRHEET"),                             # encore ilman [Vielä!]
]
# Vertailu synteettisen tallenteen ehdokkaisiin: (lista, tulosteessa oltava, tulosteessa ei saa olla).
OIKEA = "1. 0:04\n2. 1:44\n3:10\n3. 4:19\n4. 5:29\n5. 6:51\n8:20 [nauha]\n"
VERTAILUT = [
    (OIKEA, ["Jokaisen kappalerivin"], ["TARKISTA"]),
    # Modulaatio kappaleeksi ja nauha kappaleeksi (ajon C virhe 1 ja sen peilikuva).
    (OIKEA.replace("8:20 [nauha]", "6. 7:36\n7. 8:20"), ["Rivi 7 (kappale 7:36)", "Rivi 8 (kappale 8:20)"], []),
    # Kappale ei-biisiksi (ajon C virhe 2: setin 2 avausbiisi DJ:ksi).
    (OIKEA.replace("3. 4:19\n4. 5:29\n5. 6:51", "4:19 [DJ]\n3. 5:29\n4. 6:51"),
     ["Rivi 4 (ei-biisi 4:19 [DJ])"], []),
]


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
        if laji == "hiljaa" and a > 0:
            y[i0:i1] = rng.standard_normal(i1 - i0) * 10 ** (-62 / 20)
        elif laji == "biisi":
            y[i0:i1] += biisi(i1 - i0, **asetus)
        elif laji == "aplodit":
            y[i0:i1] += aplodit(i1 - i0, a)
        elif laji == "puhe":
            y[i0:i1] += puhe(i1 - i0, a)
        elif laji == "nauha":
            n = i1 - i0
            feidi = np.minimum(1, (n - np.arange(n)) / (5.0 * SR))
            y[i0:i1] += biisi(n, **asetus) * 10 ** (-12 / 20) * feidi
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
    tulos = subprocess.run([sys.executable, skripti, wav, "--setit", "5", "--json", js, "--yleiskuva"],
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
    for r, luokka in RAJAT.items():
        c = min(d["ehdokkaat"], key=lambda c: abs(c["t"] - r)) if ajat else None
        if c is None or abs(c["t"] - r) > TOLERANSSI:
            poikk.append("raja %g s: lähin ehdokas %s" % (r, "puuttuu" if c is None else "%.1f s" % c["t"]))
        elif c["luokka"] != luokka:
            poikk.append("raja %g s: luokka %s, odotettiin %s" % (r, c["luokka"], luokka))
    for c in d["ehdokkaat"]:
        merkit = any("nauhan tunnusmerkit" in h for h in c["huom"])
        if merkit != (abs(c["t"] - NAUHA) <= TOLERANSSI):
            poikk.append("%.1f s: nauhan tunnusmerkit %s" % (c["t"], "ylimääräinen" if merkit else "puuttuu"))
    tauot = [tuple(v) for c in d["ehdokkaat"] for v in c["tauot"]]
    if not any(abs(a - TAUKO[0]) <= TOLERANSSI and abs(b - TAUKO[1]) <= TOLERANSSI for a, b in tauot):
        poikk.append("tauko %d–%d s puuttuu (tauot: %s)" % (TAUKO + (", ".join("%.1f–%.1f" % v for v in tauot),)))
    ylim = [c for c in d["ehdokkaat"] if min(abs(c["t"] - r) for r in list(RAJAT) + [TAUKO[1]]) > 3]
    print("Tunnetut rajat: " + ", ".join("%g s %s" % kv for kv in RAJAT.items()))
    print("Ehdokkaat:      " + ", ".join("%.1f s %s" % (c["t"], c["luokka"]) for c in d["ehdokkaat"]))
    for r, bpm in TEMPOT.items():
        c = min(d["ehdokkaat"], key=lambda c: abs(c["t"] - r))
        print("Tempo rajan %d s jälkeen: %s (tehty %d bpm)" % (r, c["jalkeen"].split(", ")[1], bpm))
    if ylim:
        print("Ylimääräisiä ehdokkaita: " + ", ".join("%.1f s %s" % (c["t"], c["luokka"]) for c in ylim))
        for c in ylim:
            if c["luokka"] in ("RAJA", "SAUMA"):
                poikk.append("ylimääräinen kappaleen alku %.1f s (%s)" % (c["t"], c["luokka"]))
    # Settilistan tarkistus.
    for i, (lista, valinnat, odotus) in enumerate(LISTAT, 1):
        lp = os.path.join(kansio, "lista%d.txt" % i)
        with open(lp, "w", encoding="utf-8") as fh:
            fh.write(lista)
        t = subprocess.run([sys.executable, skripti, "--tarkista", lp] + valinnat, capture_output=True, text=True)
        if not t.stdout.startswith(odotus):
            poikk.append("--tarkista lista %d: odotettiin %s, tuli: %s" % (i, odotus, t.stdout.strip()[:200]))
    for i, (lista, pitaa, eisaa) in enumerate(VERTAILUT, 1):
        lp = os.path.join(kansio, "vertailu%d.txt" % i)
        with open(lp, "w", encoding="utf-8") as fh:
            fh.write(lista)
        t = subprocess.run([sys.executable, skripti, "--tarkista", lp, "--ehdokkaat", js], capture_output=True, text=True)
        puuttuu = [m for m in pitaa if m not in t.stdout] + [m for m in eisaa if m in t.stdout]
        if not t.stdout.startswith("OK") or puuttuu:
            poikk.append("--tarkista --ehdokkaat vertailu %d: %s; tuloste: %s" % (
                i, ", ".join(puuttuu) or "ei OK", t.stdout.strip()[:400]))
    print("Settilistan tarkistus: %d listaa ja %d vertailua ehdokkaisiin ajettu." % (len(LISTAT), len(VERTAILUT)))
    if pida:
        print("Tallenne ja tuloste: " + kansio)
    if poikk:
        print("POIKKEAMAT:\n  " + "\n  ".join(poikk))
        sys.exit(1)
    print("OK: kaikki %d tunnettua rajaa ja tauko löytyivät ±%.1f s:n tarkkuudella oikein luokiteltuina, "
          "eikä ylimääräisiä kappaleen alkuja ollut; settilistan tarkistus toimi." % (len(RAJAT), TOLERANSSI))


if __name__ == "__main__":
    main()
