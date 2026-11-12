#!/usr/bin/env python3
"""Laatikkolauseen sanalistojen tarkistus Voikolla (luin/laatikkolause.js).

Jokaisen sanan on oltava paikkansa muoto: laatusana tai tekijä perusmuodossa, teonsana yksikön 3. persoonassa, kohde
yksikön partitiivissa, paikka yksikön inessiivissä, adessiivissa tai essiivissä (kotona). Voikko tuntee vain oikeat
kirjoitusasut, joten se hylkää ääkköset pois pudottaneen muodon (delfiinia, metsassa), jonka silmä hyväksyisi.
Hylkää myös sanan, joka näyttää ääkköset pudottaneelta: jos a:n tai o:n vaihto ä:ksi tai ö:ksi antaa Voikon tunteman
ja yleisen sanan (wordfreq-taajuus vähintään 1,5), esim. etana (etänä), haita (häitä), niittaa (niittää). Käyttäjän rajaus
12.11.2026: ei lauseita, joista pitää poistaa ääkköset. Pelkkä Voikko ei riitä vastineen tunnistamiseen, koska se hyväksyy
keinotekoisia johdoksia ja yhdyssanoja (känä, säläpoliisi).
Tulostaa hylätyt, kaksoiskappaleet ja harvinaiset sekä paikkojen koot.

Asennus (Linux): apt-get install voikko-fi python3-libvoikko; pip install wordfreq.
Aja repon juuressa: python3 luin/kehitys/laatikkolause-sanat.py
"""
import re, sys, os, itertools, libvoikko

POLKU = os.path.join(os.path.dirname(__file__), '..', 'laatikkolause.js')
js = open(POLKU, encoding='utf-8').read()
listat = {}
for k, runko in re.findall(r"\n    (\w): \(\n(.*?)\n    \)\.trim\(\)", js, re.S):
    listat[k] = ' '.join(re.findall(r"'([^']*)'", runko)).split()

def kelpaa(k, x):
    c, s, n = x.get('CLASS'), x.get('SIJAMUOTO'), x.get('NUMBER')
    if k == 'a': return c in ('laatusana', 'nimisana_laatusana') and s == 'nimento' and n == 'singular'
    if k == 's': return c in ('nimisana', 'nimisana_laatusana', 'laatusana') and s == 'nimento' and n == 'singular'
    if k == 'v': return (c == 'teonsana' and x.get('PERSON') == '3' and n == 'singular'
                         and x.get('MOOD') == 'indicative' and x.get('TENSE') == 'present_simple')
    if k == 'o': return c == 'nimisana' and s == 'osanto' and n == 'singular'
    if k == 'p': return c == 'nimisana' and s in ('sisaolento', 'ulkoolento', 'olento') and n == 'singular'

from wordfreq import zipf_frequency
v = libvoikko.Voikko('fi')

def aakkosvastine(w):
    """Yleisin a→ä- tai o→ö-vaihdolla syntyvä oikea sana, tai None."""
    paikat = [i for i, c in enumerate(w) if c in 'ao'][:10]
    paras = None
    for r in range(1, len(paikat) + 1):
        for valinta in itertools.combinations(paikat, r):
            l = list(w)
            for i in valinta: l[i] = 'ä' if l[i] == 'a' else 'ö'
            x = ''.join(l); f = zipf_frequency(x, 'fi')
            if f >= 1.5 and v.analyze(x) and (not paras or f > paras[1]): paras = (x, f)
    return paras
virheita = 0
for k in 'asvop':
    ws = listat.get(k, [])
    hyl = [w for w in ws if not re.fullmatch(r'[a-z]+', w) or not any(kelpaa(k, x) for x in v.analyze(w))]
    kaks = sorted(set(w for w in ws if ws.count(w) > 1))
    aak = [w + ' (' + aakkosvastine(w)[0] + ')' for w in ws if aakkosvastine(w)]
    harv = [w for w in ws if zipf_frequency(w, 'fi') < 1.0]
    virheita += len(hyl) + len(kaks) + len(aak)
    print('%s: %d sanaa%s%s%s%s' % (k, len(ws), '; HYLÄTYT: ' + ' '.join(hyl) if hyl else '',
          '; KAKSOISKAPPALEET: ' + ' '.join(kaks) if kaks else '',
          '; ÄÄKKÖSET PUDOTTANEEN NÄKÖISET: ' + ' '.join(aak) if aak else '', '; harvinaiset: ' + ' '.join(harv) if harv else ''))
sys.exit(1 if virheita or len(listat) != 5 else 0)
