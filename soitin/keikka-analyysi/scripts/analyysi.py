#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Keikkatallenteen rajaehdokkaat KEICK•WALK-settilistaa varten.

Käyttö:
  python3 analyysi.py --tarkista
  python3 analyysi.py keikka.mp3 [--setit 11,10] [--encoret 3] [--json ehdokkaat.json] [--kaikki]

Tulostaa tiiviin ehdokaslistan eikä raakadataa: yksi rivi jokaista mahdollista
kappaleen tai jakson rajaa kohti todisteineen (tauko, sointivärin ja sävellajin
muutos, puhe) sekä tempo ja sävelluokat rajan molemmin puolin. Päätökset tekee
lukija; kappalemäärä on tarkistus, ei rajan peruste.

Pakolliset: ffmpeg (tai pip-paketti imageio-ffmpeg), numpy ja scipy.
Valinnainen: inaSpeechSegmenter (puheen ja musiikin erottelu). Ilman sitä
puhe ja musiikki erotetaan karkealla arviolla, ja tuloste kertoo sen.

Tiedosto puretaan ffmpegillä 16 kHz monoksi väliaikaistiedostoon ja luetaan
numpy.memmapilla kymmenen minuutin paloissa, joten muistia kuluu vähän
tallenteen pituudesta riippumatta.
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time

SR = 16000            # näytetaajuus
KEHYS = 0.5           # tason, kaistojen ja kroman kehys (s)
KN = int(SR * KEHYS)  # 8000 näytettä
NFFT = 8192
PALA = 600            # käsittelypala (s)
OHOP = 256            # iskukäyrän hyppy: 16 ms
OWIN = 1024
ORATE = SR / OHOP     # 62,5 Hz
NIMET = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
NOTKAHDUS_DB = 9.0    # taso näin paljon alle minuutin liukuvan mediaanin
UUTUUS_IKKUNA = 40    # kehystä eli 20 s kummallakin puolella
UUTUUS_RAJA = 2.5     # uutuushuipun vähimmäiskorkeus (robusti z)
YHDISTA_S = 3.0       # tätä lähempänä toisiaan olevat ehdokkaat ovat sama raja
SOITTAMATON_S = 60.0  # näin pitkä soittamaton jakso on oma rivinsä
MAX_RIVIT = 140


# ---- Riippuvuudet ---------------------------------------------------------

def ffmpeg_polku():
    p = shutil.which("ffmpeg")
    if p:
        return p
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None


def ina_saatavilla():
    try:
        import inaSpeechSegmenter  # noqa: F401
        return True
    except Exception:
        return False


def tarkista():
    rivit, puuttuu = [], []
    ff = ffmpeg_polku()
    rivit.append("ffmpeg: " + (ff or "PUUTTUU (asenna ffmpeg tai: pip install imageio-ffmpeg)"))
    if not ff:
        puuttuu.append("ffmpeg")
    for mod in ("numpy", "scipy"):
        try:
            m = __import__(mod)
            rivit.append(mod + ": " + getattr(m, "__version__", "ok"))
        except Exception:
            rivit.append(mod + ": PUUTTUU (pip install " + mod + ")")
            puuttuu.append(mod)
    rivit.append("inaSpeechSegmenter (valinnainen): " + ("ok" if ina_saatavilla() else
                 "ei käytössä; puhe ja musiikki erotetaan karkealla arviolla"))
    print("\n".join(rivit))
    print("Kaikki pakolliset ovat käytettävissä." if not puuttuu else
          "Puuttuu pakollisia: " + ", ".join(puuttuu) + ".")
    return 0 if not puuttuu else 1


# ---- Ajat -----------------------------------------------------------------

def aika(t):
    """Sekunnit → m:ss.s tai h:mm:ss.s (puolen sekunnin tarkkuus)."""
    t = max(0.0, round(t * 2) / 2)
    h, m, s = int(t // 3600), int(t % 3600 // 60), t % 60
    ss = "%04.1f" % s
    return "%d:%02d:%s" % (h, m, ss) if h else "%d:%s" % (m, ss)


def kesto(t):
    t = int(round(max(0.0, t)))
    h, m, s = t // 3600, t % 3600 // 60, t % 60
    return "%d:%02d:%02d" % (h, m, s) if h else "%d:%02d" % (m, s)


def jasenna_aika(s):
    s = str(s).strip().replace(",", ".")
    osat = s.split(":")
    t = 0.0
    for o in osat:
        t = t * 60 + float(o)
    return t


# ---- Purku ----------------------------------------------------------------

def pura(polku, kansio, ff):
    raw = os.path.join(kansio, "aani.s16")
    cmd = [ff, "-nostdin", "-v", "error", "-y", "-i", polku, "-vn", "-ac", "1",
           "-ar", str(SR), "-f", "s16le", raw]
    subprocess.run(cmd, check=True)
    import numpy as np
    if os.path.getsize(raw) < 2 * SR:
        raise SystemExit("Tiedostosta saatiin alle sekunti ääntä. Onko se äänitiedosto?")
    return np.memmap(raw, dtype="<i2", mode="r"), raw


def lue(x, a, b):
    import numpy as np
    out = np.zeros(b - a, dtype=np.float32)
    n = len(x)
    if a < n:
        e = min(b, n)
        out[:e - a] = np.asarray(x[a:e], dtype=np.float32) / 32768.0
    return out


# ---- Piirteet -------------------------------------------------------------

def piirteet(x, ilmoita):
    """Puolen sekunnin kehyksin: taso (dB), kolme kaistaa (dB), spektrin litteys
    ja kroma; 16 ms:n välein iskukäyrä (spektrin positiivinen muutos) ja
    300–3000 Hz:n kaistan energia."""
    import numpy as np
    from numpy.lib.stride_tricks import sliding_window_view
    import scipy.fft as sfft

    n = len(x)
    nk = -(-n // KN)
    no = -(-n // OHOP)
    taso = np.empty(nk, np.float32)
    kaistat = np.empty((nk, 3), np.float32)
    litt = np.empty(nk, np.float32)
    kroma = np.empty((nk, 12), np.float32)
    isku = np.empty(no, np.float32)
    keski = np.empty(no, np.float32)

    f = np.fft.rfftfreq(NFFT, 1.0 / SR)
    b_ala = f < 120
    b_kes = (f >= 300) & (f < 3000)
    b_yla = f >= 3000
    b_lit = (f >= 100) & (f < 6000)
    ksel = (f >= 65) & (f <= 2100)
    pc = ((np.round(12 * np.log2(f[ksel] / 440.0)) + 9) % 12).astype(int)
    kmat = np.zeros((int(ksel.sum()), 12), np.float32)
    kmat[np.arange(len(pc)), pc] = 1
    ikk = np.hanning(KN).astype(np.float32)

    of = np.fft.rfftfreq(OWIN, 1.0 / SR)
    rajat = np.geomspace(30, 8000, 37)
    bm = np.zeros((len(of), 36), np.float32)
    for i in range(36):
        bm[(of >= rajat[i]) & (of < rajat[i + 1]), i] = 1
    o_kes = (of >= 300) & (of < 3000)
    oikk = np.hanning(OWIN).astype(np.float32)
    edel = None

    ps = PALA * SR
    for a in range(0, n, ps):
        b = min(a + ps, n)
        ilmoita(a / SR)
        # Puolen sekunnin kehykset, osapaloissa muistin säästämiseksi.
        k0, k1 = a // KN, -(-b // KN)
        for c0 in range(k0, k1, 300):
            c1 = min(c0 + 300, k1)
            y = lue(x, c0 * KN, c1 * KN).reshape(-1, KN)
            taso[c0:c1] = 10 * np.log10(np.mean(y * y, axis=1) + 1e-12)
            Y = sfft.rfft(y * ikk, NFFT, axis=1)
            P = (Y.real ** 2 + Y.imag ** 2).astype(np.float32)
            kaistat[c0:c1, 0] = 10 * np.log10(P[:, b_ala].sum(1) + 1e-9)
            kaistat[c0:c1, 1] = 10 * np.log10(P[:, b_kes].sum(1) + 1e-9)
            kaistat[c0:c1, 2] = 10 * np.log10(P[:, b_yla].sum(1) + 1e-9)
            pf = P[:, b_lit].astype(np.float64) + 1e-12
            litt[c0:c1] = np.exp(np.mean(np.log(pf), axis=1)) / np.mean(pf, axis=1)
            kroma[c0:c1] = np.sqrt(P[:, ksel]) @ kmat
        # Iskukäyrä 16 ms:n välein.
        j0, j1 = a // OHOP, -(-b // OHOP)
        for c0 in range(j0, j1, 8192):
            c1 = min(c0 + 8192, j1)
            z = lue(x, c0 * OHOP, (c1 - 1) * OHOP + OWIN)
            fr = sliding_window_view(z, OWIN)[::OHOP][: c1 - c0]
            S = np.abs(sfft.rfft(fr * oikk, axis=1)).astype(np.float32)
            L = np.log1p(100.0 * (S @ bm))
            ed = np.vstack([edel if edel is not None else L[:1], L[:-1]])
            isku[c0:c1] = np.maximum(L - ed, 0).sum(1)
            edel = L[-1:]
            keski[c0:c1] = (S[:, o_kes] ** 2).sum(1)
    return dict(taso=taso, kaistat=kaistat, litt=litt, kroma=kroma, isku=isku, keski=keski)


def robusti_z(v):
    import numpy as np
    m = np.median(v)
    mad = np.median(np.abs(v - m)) * 1.4826 + 1e-9
    return (v - m) / mad


def tempo(isku, a, b):
    """Tempo (bpm) ja pulssin selkeys (0–1) välillä a–b sekuntia; None, jos väli on lyhyt."""
    import numpy as np
    from scipy.ndimage import uniform_filter1d
    i0, i1 = max(0, int(a * ORATE)), min(len(isku), int(b * ORATE))
    if i1 - i0 < 4 * ORATE:
        return None
    e = isku[i0:i1].astype(np.float64)
    e = e - uniform_filter1d(e, int(ORATE))
    e -= e.mean()
    if not np.any(e):
        return (0.0, 0.0)
    m = len(e)
    ac = np.fft.irfft(np.abs(np.fft.rfft(e, 2 * m)) ** 2)[:m]
    ac /= ac[0] + 1e-12
    lmin, lmax = int(ORATE * 60 / 200), int(np.ceil(ORATE * 60 / 60))
    lmax = min(lmax, m - 2)
    if lmax <= lmin + 2:
        return None
    lag = np.arange(lmin, lmax + 1)
    # Lievä painotus 120 bpm:n ympärille vähentää oktaavivirheitä.
    paino = np.exp(-0.5 * (np.log2(60 * ORATE / lag / 120.0) / 1.2) ** 2)
    v = ac[lmin:lmax + 1]
    k = int(np.argmax(v * paino))
    selk = float(v[k])
    kk = k + lmin
    if 0 < k < len(v) - 1:
        y0, y1, y2 = v[k - 1], v[k], v[k + 1]
        d = y0 - 2 * y1 + y2
        if d < 0:
            kk += 0.5 * (y0 - y2) / d
    return (60 * ORATE / kk, max(0.0, selk))


# ---- Puhe ja musiikki -----------------------------------------------------

def lajit_arvio(p):
    """Karkea arvio 5 s:n lohkoittain: musiikki, puhe, kohina (esim. aplodit) tai hiljaa.
    Käytetään vain, jos inaSpeechSegmenter ei ole saatavilla."""
    import numpy as np
    taso, litt, kroma, isku, keski = p["taso"], p["litt"], p["kroma"], p["isku"], p["keski"]
    n = len(taso)
    L = 10
    kn = kroma / (np.linalg.norm(kroma, axis=1, keepdims=True) + 1e-9)
    huippu = kn.max(1)
    yleis = float(np.median(taso))
    lajit = []
    for a in range(0, n, L):
        b = min(a + L, n)
        t0, t1 = a * KEHYS, b * KEHYS
        lvl = float(np.mean(taso[a:b]))
        if lvl < yleis - 30:
            lajit.append("hiljaa")
            continue
        tp = tempo(isku, max(0.0, t0 - 0.5), t1 + 0.5)
        pulssi = tp[1] if tp else 0.0
        # Keskikaistan verhokäyrän 2–8 Hz:n vaihtelu (tavut) suhteessa koko vaihteluun.
        i0, i1 = int(t0 * ORATE), int(t1 * ORATE)
        env = np.log(keski[i0:i1] + 1e-9)
        mod = 0.0
        if len(env) > 32:
            env = env - env.mean()
            sp = np.abs(np.fft.rfft(env)) ** 2
            fr = np.fft.rfftfreq(len(env), 1 / ORATE)
            kok = sp[fr > 0.5].sum() + 1e-12
            mod = float(sp[(fr >= 2) & (fr <= 8)].sum() / kok)
        tonal = float(np.mean(huippu[a:b]))
        fl = float(np.mean(litt[a:b]))
        # Ilman pulssia: tasainen laajakaistainen ääni on kohinaa (aplodit), tavurytminen tai
        # sävyltään epävakaa puhetta. Pulssiton mutta sävyltään vakaa (esim. balladi) on musiikkia.
        if pulssi < 0.2 and tonal < 0.5 and fl > 0.35:
            lajit.append("kohina")
        elif pulssi < 0.2 and (mod > 0.3 or tonal < 0.6):
            lajit.append("puhe")
        else:
            lajit.append("musiikki")
    # Yksittäinen poikkeava lohko naapuriensa mukaiseksi, ettei jakso pilkkoudu.
    for i in range(1, len(lajit) - 1):
        if lajit[i - 1] == lajit[i + 1] != lajit[i] and lajit[i] != "hiljaa":
            lajit[i] = lajit[i - 1]
    return [(i * L * KEHYS, min((i + 1) * L, n) * KEHYS, l) for i, l in enumerate(lajit)]


def lajit_ina(polku, kesto_s, ff, ilmoita):
    """inaSpeechSegmenter kymmenen minuutin paloissa; ajat ovat absoluuttisia."""
    from inaSpeechSegmenter import Segmenter
    seg = Segmenter(vad_engine="smn", detect_gender=False, ffmpeg=ff)
    nimi = {"speech": "puhe", "music": "musiikki", "noise": "kohina", "noEnergy": "hiljaa"}
    out = []
    a = 0.0
    while a < kesto_s:
        b = min(a + PALA, kesto_s)
        ilmoita(a)
        for lab, s, e in seg(polku, start_sec=a, stop_sec=b):
            out.append((float(s), float(e), nimi.get(lab, lab)))
        a = b
    return out


def yhdista_lajit(lajit):
    """Peräkkäiset saman lajin lohkot yhdeksi jaksoksi."""
    out = []
    for s, e, l in sorted(lajit):
        if out and out[-1][2] == l and s - out[-1][1] < 1.0:
            out[-1] = (out[-1][0], max(out[-1][1], e), l)
        else:
            out.append((s, e, l))
    return out


# ---- Ehdokkaat ------------------------------------------------------------

def notkahdukset(taso, med):
    import numpy as np
    ala = taso < med - NOTKAHDUS_DB
    ajot = []
    i, n = 0, len(ala)
    while i < n:
        if ala[i]:
            j = i
            while j < n and ala[j]:
                j += 1
            if ajot and i - ajot[-1][1] <= 1:
                ajot[-1] = (ajot[-1][0], j)
            else:
                ajot.append((i, j))
            i = j
        else:
            i += 1
    out = []
    for a, b in ajot:
        if b - a < 2:   # vähintään sekunti
            continue
        syv = float(np.max(med[a:b] - taso[a:b]))
        digi = bool(np.min(taso[a:b]) < -90)
        out.append(dict(alku=a * KEHYS, loppu=b * KEHYS, syvyys=syv, digi=digi))
    return out


def uutuuskayra(p, w):
    """Sointivärin, kroman ja tason muutos w kehyksen ikkunoin rajan molemmin puolin."""
    import numpy as np
    taso, kaistat, kroma = p["taso"], p["kaistat"], p["kroma"]
    n = len(taso)
    if n < 16:
        return np.zeros(n)
    kn = kroma / (np.linalg.norm(kroma, axis=1, keepdims=True) + 1e-9)
    hiljaa = taso < np.median(taso) - 25
    kn[hiljaa] = 0
    prof = kaistat - taso[:, None]

    # Reunoilla ikkuna kutistuu (vähintään 6 kehystä eli 3 s), jotta tallenteen alun ja lopun
    # muutoksetkin näkyvät.
    t = np.arange(6, n - 6 + 1)
    ww = np.minimum(w, np.minimum(t, n - t))[:, None]

    def ikkunat(v):
        c = np.vstack([np.zeros((1, v.shape[1])), np.cumsum(v, axis=0)])
        return (c[t] - c[t - ww[:, 0]]) / ww, (c[t + ww[:, 0]] - c[t]) / ww

    kv, ko = ikkunat(kn)
    dk = 1 - np.sum(kv * ko, 1) / (np.linalg.norm(kv, axis=1) * np.linalg.norm(ko, axis=1) + 1e-9)
    pv, po = ikkunat(prof)
    dp = np.linalg.norm(pv - po, axis=1)
    lv, lo = ikkunat(taso[:, None])
    dl = np.abs(lv - lo)[:, 0]
    s = robusti_z(dk) + robusti_z(dp) + robusti_z(dl)
    out = np.zeros(n)
    out[t] = robusti_z(s)
    return out


def ehdokkaat(p, lajit):
    import numpy as np
    from scipy.ndimage import median_filter
    from scipy.signal import find_peaks

    taso = p["taso"]
    # Peilaus reunoilla: "nearest" toistaisi alun hiljaisuutta, ja alun tauko jäisi löytymättä.
    med = median_filter(taso, size=121, mode="reflect")
    raaka = []
    for d in notkahdukset(taso, med):
        raaka.append(dict(t=d["loppu"], tyyppi="tauko", tauko=(d["alku"], d["loppu"]),
                          syvyys=d["syvyys"], digi=d["digi"]))
    nov = uutuuskayra(p, UUTUUS_IKKUNA)
    hie = uutuuskayra(p, 6)
    huiput, _ = find_peaks(nov, height=UUTUUS_RAJA, distance=20)
    for k in huiput:
        a, b = max(0, k - 8), min(len(hie), k + 9)
        kk = a + int(np.argmax(hie[a:b]))
        raaka.append(dict(t=kk * KEHYS, tyyppi="uutuus", z=float(nov[k])))
    # Puheen alut ja loput sekä pitkät soittamattomat jaksot.
    pitkat = []
    for s, e, l in lajit:
        if l == "musiikki":
            continue
        if e - s >= SOITTAMATON_S:
            pitkat.append((s, e))
            raaka.append(dict(t=s, tyyppi="soittamaton alkaa", laji=l, pituus=e - s))
            raaka.append(dict(t=e, tyyppi="soittamaton päättyy", laji=l, pituus=e - s))
        elif l == "puhe" and e - s >= 8:
            raaka.append(dict(t=s, tyyppi="puhe alkaa", laji=l, pituus=e - s))
            raaka.append(dict(t=e, tyyppi="puhe päättyy", laji=l, pituus=e - s))
    # Pitkän soittamattoman jakson sisäiset ehdokkaat (puheen tauot) eivät ole kappaleiden rajoja;
    # niiden määrä kerrotaan jakson alun rivillä.
    sisalla = {}
    for s, e in pitkat:
        for r in raaka:
            if s + 5 < r["t"] < e - 5 and not r["tyyppi"].startswith("soittamaton"):
                r["pois"] = True
                sisalla[s] = sisalla.get(s, 0) + 1
    raaka = [r for r in raaka if not r.get("pois")]
    for r in raaka:
        if r["tyyppi"] == "soittamaton alkaa" and sisalla.get(r["t"]):
            r["sisalla"] = sisalla[r["t"]]
    raaka.sort(key=lambda r: r["t"])

    # Lähekkäiset yhdeksi rajaksi; ajaksi tauon loppu, sitten uutuus, sitten muu.
    ryhmat = []
    for r in raaka:
        if ryhmat and r["t"] - ryhmat[-1][-1]["t"] <= YHDISTA_S:
            ryhmat[-1].append(r)
        else:
            ryhmat.append([r])
    out = []
    for g in ryhmat:
        tauot = [r for r in g if r["tyyppi"] == "tauko"]
        uud = [r for r in g if r["tyyppi"] == "uutuus"]
        if tauot:
            t = max(tauot, key=lambda r: r["syvyys"])["t"]
        elif uud:
            t = max(uud, key=lambda r: r["z"])["t"]
        else:
            t = g[0]["t"]
        c = dict(t=t, osat=g)
        c["syvyys"] = max([r["syvyys"] for r in tauot], default=0.0)
        c["z"] = max([r["z"] for r in uud], default=0.0)
        c["voima"] = c["syvyys"] / NOTKAHDUS_DB + max(0.0, c["z"]) / UUTUUS_RAJA + \
            (1.0 if any(r["tyyppi"].startswith("soittamaton") for r in g) else 0.0)
        out.append(c)
    return out, med


def osion_kuvaus(p, lajit, a, b, kesto_s, puoli):
    """Rajan viereinen osio: kesto, tempo, neljä vahvinta sävelluokkaa ja laji.
    Mitataan enintään minuutin pätkästä rajan vierestä, reunoilta sekunti pois."""
    import numpy as np
    pituus = b - a
    if puoli == "ennen":
        a2, b2 = max(a, b - 60), b - 1
    else:
        a2, b2 = a + 1, min(b, a + 60)
    osa = ["%s" % kesto(pituus)]
    tp = tempo(p["isku"], a2, b2) if b2 - a2 >= 4 else None
    if tp is None:
        osa.append("tempo –")
    elif tp[1] < 0.2:
        osa.append("ei pulssia")
    else:
        osa.append("%d bpm (%.2f)" % (round(tp[0]), tp[1]))
    k0, k1 = int(a2 / KEHYS), max(int(a2 / KEHYS) + 1, int(b2 / KEHYS))
    taso = p["taso"][k0:k1]
    kr = p["kroma"][k0:k1]
    if len(kr):
        paino = (taso > np.median(p["taso"]) - 20).astype(float)
        v = (kr / (np.linalg.norm(kr, axis=1, keepdims=True) + 1e-9) * paino[:, None]).sum(0)
        if v.sum() > 0:
            j = np.argsort(-v)[:4]
            osa.append(" ".join(NIMET[i] for i in j))
        else:
            osa.append("hiljaa")
        osa.append("%.0f dB" % float(np.median(taso)))
    # Lajien osuudet mitatussa pätkässä.
    os_ = {}
    for s, e, l in lajit:
        d = min(e, b2) - max(s, a2)
        if d > 0:
            os_[l] = os_.get(l, 0) + d
    if os_:
        tot = sum(os_.values())
        l, d = max(os_.items(), key=lambda kv: kv[1])
        osa.append(l if d / tot > 0.9 else "%s %d %%" % (l, round(100 * d / tot)))
    return ", ".join(osa)


def kuvaa(c):
    osat = []
    for r in c["osat"]:
        if r["tyyppi"] == "tauko":
            osat.append("tauko %s–%s −%.0f dB%s" % (aika(r["tauko"][0]), aika(r["tauko"][1]), r["syvyys"],
                                                   " (digitaalinen hiljaisuus: katko?)" if r["digi"] else ""))
        elif r["tyyppi"] == "uutuus":
            osat.append("uutuus %.1f" % r["z"])
        elif r["tyyppi"].startswith("soittamaton"):
            osat.append("%s (%s %s%s)" % (r["tyyppi"], r["laji"], kesto(r["pituus"]),
                                          ", sisällä %d heikompaa ehdokasta" % r["sisalla"] if r.get("sisalla") else ""))
        else:
            osat.append("%s (%s)" % (r["tyyppi"], kesto(r["pituus"])))
    # Saman tyypin toistot pois (esim. kaksi uutuushuippua samassa kohdassa).
    nahty, out = set(), []
    for o in osat:
        k = o.split(" ")[0]
        if k in nahty and k in ("uutuus",):
            continue
        nahty.add(k)
        out.append(o)
    return "; ".join(out)


# ---- Pääohjelma -----------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="Keikkatallenteen rajaehdokkaat KEICK•WALK-settilistaa varten.")
    ap.add_argument("tiedosto", nargs="?")
    ap.add_argument("--tarkista", action="store_true", help="tarkista riippuvuudet ja lopeta")
    ap.add_argument("--setit", help="kappalemäärät seteittäin ilman encoreja, esim. 11,10")
    ap.add_argument("--encoret", type=int, help="encorebiisien määrä yhteensä")
    ap.add_argument("--json", help="kirjoita ehdokkaat myös tähän JSON-tiedostoon")
    ap.add_argument("--kaikki", action="store_true", help="älä karsi heikoimpia ehdokkaita")
    ap.add_argument("--ilman-ina", action="store_true", help="älä käytä inaSpeechSegmenteriä")
    args = ap.parse_args()
    if args.tarkista:
        sys.exit(tarkista())
    if not args.tiedosto:
        ap.error("anna äänitiedosto tai --tarkista")
    ff = ffmpeg_polku()
    if not ff:
        sys.exit("ffmpeg puuttuu. Asenna se tai: pip install imageio-ffmpeg")
    try:
        import numpy as np  # noqa: F401
        import scipy  # noqa: F401
    except ImportError as e:
        sys.exit("Puuttuu pakollinen kirjasto: %s (pip install numpy scipy)" % e.name)

    alku = time.time()

    def ilmoita(t):
        sys.stderr.write("  käsitelty %s (%.0f s)\n" % (kesto(t), time.time() - alku))
        sys.stderr.flush()

    with tempfile.TemporaryDirectory(prefix="keikka-") as kansio:
        sys.stderr.write("Puretaan %s…\n" % os.path.basename(args.tiedosto))
        x, _ = pura(args.tiedosto, kansio, ff)
        kesto_s = len(x) / SR
        sys.stderr.write("Mitataan…\n")
        p = piirteet(x, ilmoita)
        del x
    keinot = ["äänitaso ja tauot", "kaistat (<120 Hz, 300–3000 Hz, >3 kHz) ja spektrin litteys",
              "sointivärin, kroman ja tason muutos 20 s:n ikkunoin", "tempo iskukäyrän autokorrelaatiosta",
              "sävelluokat kromasta"]
    if ina_saatavilla() and not args.ilman_ina:
        sys.stderr.write("Erotellaan puhe ja musiikki (inaSpeechSegmenter)…\n")
        try:
            lajit = lajit_ina(args.tiedosto, kesto_s, ff, ilmoita)
            keinot.append("puhe ja musiikki: inaSpeechSegmenter")
        except Exception as e:
            sys.stderr.write("inaSpeechSegmenter epäonnistui (%s); käytetään arviota.\n" % e)
            lajit = lajit_arvio(p)
            keinot.append("puhe ja musiikki: karkea arvio (inaSpeechSegmenter epäonnistui)")
    else:
        lajit = lajit_arvio(p)
        keinot.append("puhe ja musiikki: karkea arvio (inaSpeechSegmenter ei käytössä)")
    lajit = yhdista_lajit(lajit)

    ehd, med = ehdokkaat(p, lajit)
    karsittu = 0
    if not args.kaikki and len(ehd) > MAX_RIVIT:
        pidetaan = sorted(sorted(ehd, key=lambda c: -c["voima"])[:MAX_RIVIT], key=lambda c: c["t"])
        karsittu = len(ehd) - len(pidetaan)
        ehd = pidetaan

    rajat = [0.0] + [c["t"] for c in ehd] + [kesto_s]
    rivit = []
    for i, c in enumerate(ehd):
        ennen = osion_kuvaus(p, lajit, rajat[i], c["t"], kesto_s, "ennen")
        jalk = osion_kuvaus(p, lajit, c["t"], rajat[i + 2], kesto_s, "jälkeen")
        c["ennen"], c["jalkeen"] = ennen, jalk
        rivit.append("%s  %s | ennen: %s | jälkeen: %s" % (aika(c["t"]), kuvaa(c), ennen, jalk))

    print("# keikka-analyysi: %s, kesto %s" % (os.path.basename(args.tiedosto), kesto(kesto_s)))
    print("# Rivi = mahdollinen raja (tauon loppu tai muutoksen kohta). Kappale alkaa noin sekunti ennen")
    print("# ensimmäistä ääntä. Tempo: bpm (pulssin selkeys 0–1). Sävelluokat vahvimmasta alkaen.")
    print("# Ennen/jälkeen mitataan enintään minuutin pätkästä rajan vierestä; kesto on koko väli.")
    print()
    print("\n".join(rivit) if rivit else "(ei ehdokkaita)")
    print()
    print("# Yhteenveto")
    print("Kesto %s, mediaanitaso %.0f dB. Käsittely %.0f s." % (kesto(kesto_s), float(np.median(p["taso"])),
                                                             time.time() - alku))
    print("Keinot: " + "; ".join(keinot) + ".")
    tauot = sum(1 for c in ehd if c["syvyys"] > 0)
    uud = sum(1 for c in ehd if c["z"] > 0)
    vahvat = sum(1 for c in ehd if c["syvyys"] >= 12 or c["z"] >= 4)
    print("Ehdokkaita %d (taukoja %d, uutuushuippuja %d); vahvoja (tauko ≥ 12 dB tai uutuus ≥ 4) %d.%s" % (
        len(ehd), tauot, uud, vahvat, " Heikoimmat %d karsittu (--kaikki näyttää ne)." % karsittu if karsittu else ""))
    soit = [(s, e, l) for s, e, l in lajit if l != "musiikki" and e - s >= SOITTAMATON_S]
    if soit:
        print("Yli minuutin soittamattomat jaksot: " + ", ".join(
            "%s–%s %s" % (aika(s), aika(e), l) for s, e, l in soit) + ".")
    if args.setit or args.encoret is not None:
        setit = [int(v) for v in (args.setit or "").replace(" ", "").split(",") if v]
        yht = sum(setit) + (args.encoret or 0)
        print("Kerrottu: %s%s → %d kappaleen alkua. Kappalemäärä on tarkistus, ei rajan peruste: jokaiselle "
              "rajalle pitää löytyä oma todiste." % (
                  " + ".join(str(v) for v in setit) + " kappaletta seteittäin" if setit else "",
                  (", encorebiisejä %d" % args.encoret) if args.encoret is not None else "", yht))

    if args.json:
        with open(args.json, "w", encoding="utf-8") as fh:
            json.dump(dict(kesto=kesto_s, lajit=lajit, ehdokkaat=[
                dict(t=c["t"], syvyys=c["syvyys"], z=c["z"], tyypit=[r["tyyppi"] for r in c["osat"]],
                     tauot=[r["tauko"] for r in c["osat"] if r["tyyppi"] == "tauko"],
                     ennen=c["ennen"], jalkeen=c["jalkeen"]) for c in ehd]), fh, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
