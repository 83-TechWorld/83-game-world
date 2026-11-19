"""Soundtrack for one promo video: voiceover (Kokoro, Apache-2.0), original music composed in code, and
game sound effects timed to the real taps. Usage: .venv/bin/python audio.py <game>  ->  out/<game>/<game>-short-audio.mp4

The music is generated here from scratch (synthesised marimba, plucks, bass, drums), so there is no third-party
music licence to worry about."""
import json, os, subprocess, sys
import numpy as np, soundfile as sf
import tempfile
import espeakng_loader
# espeak-ng cannot open its data from a path longer than ~160 characters, so give it a short link when needed
_esd = espeakng_loader.get_data_path()
if len(_esd) > 120:
    _short = os.path.join(tempfile.gettempdir(), 'kg-espeak-data')
    if os.path.realpath(_short) != os.path.realpath(_esd):
        if os.path.lexists(_short): os.remove(_short)
        os.symlink(_esd, _short)
    _esd = _short
os.environ['ESPEAK_DATA_PATH'] = _esd  # must be set before espeak-ng loads
from kokoro_onnx import Kokoro, EspeakConfig
ESPEAK = EspeakConfig(data_path=_esd)

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
GAME = sys.argv[1]
OUT = os.path.join(HERE, 'out', GAME)
TL = json.load(open(os.path.join(OUT, 'timeline.json')))
EV = json.load(open(os.path.join(OUT, 'events.json')))['events']
DUR, END = TL['dur'], TL['endAt']
RNG = np.random.default_rng(abs(hash(GAME)) % 2**32)

# ---------------- voiceover ----------------
SAY = {  # spoken lines follow the on-screen captions; the last line plays over the end card
 'memory-matrix': ['Can your child remember all sixteen pictures?', 'Then find where each one was hiding.', 'Brain training that feels like play.', 'Spot the missing picture!', 'Twenty levels, from four to sixteen pictures.'],
 'safety-scout': ['Safe, or unsafe? Would your child know?', 'Spot the danger on a busy street.', 'A friendly safety rule after every answer.', 'Earn five badges,', 'and a real certificate!'],
 'habit-hero': ['Make good habits the fun part of the day.', 'Pick the good habit.', 'Fill a healthy plate.', 'All the way to bedtime.', 'Eleven levels, from sunrise to night.'],
 'rough-note-showdown': ['Remember this notebook game from school?', 'Roll the dice, and draw your stickman.', 'Every roll adds a body part.', 'Get armed. Last one standing wins!'],
 'tick-tock-clock': ['Can your child read a real clock?', 'Drag the hands to set the time.', "From three o'clock, to half past three.", 'Twenty-one levels, all the way to minutes and seconds.'],
 'planet-parade': ['Can your child name all eight planets?', 'Line them up from the Sun.', 'Fun facts after every answer.', 'Hot or cold? Sixteen levels of space.'],
 'spell-gaps': ['Which letter is missing?', 'Every word is read aloud.', 'Two gaps? No problem.', 'Then spell the whole word.'],
 'where-is-kitty': ['Is Kitty in the box, or on the box?', 'Drag Kitty to the right spot.', 'Watch Kitty move, and pick the word.', 'Little words like in, on, up, and at.'],
}[GAME]
NAME = {'memory-matrix': 'Memory Matrix', 'safety-scout': 'Safety Scout', 'habit-hero': 'Habit Hero', 'rough-note-showdown': 'Rough Note Showdown',
        'tick-tock-clock': 'Tick Tock Clock', 'planet-parade': 'Planet Parade', 'spell-gaps': 'Spell Gaps', 'where-is-kitty': 'Where Is Kitty'}[GAME]
END_LINE = 'Play free. Tap the link in bio!'  # the exact address is on screen; spoken, it sounds like a different domain

def up48(x, sr):  # Kokoro speaks at 24 kHz
    t = np.arange(int(len(x) * SR / sr)) / SR
    return np.interp(t, np.arange(len(x)) / sr, x).astype(np.float32)

def voiceover():
    k = Kokoro(os.path.join(HERE, 'models', 'kokoro-v1.0.onnx'), os.path.join(HERE, 'models', 'voices-v1.0.bin'), espeak_config=ESPEAK)
    track = np.zeros(int(DUR * SR), np.float32); spans = []; prev_end = 0.0
    starts = [c[0] for c in TL['caps']] + [END + 0.55]
    lines = SAY + [END_LINE]
    for i, text in enumerate(lines):
        start = max(starts[i] + 0.05, prev_end + 0.12)
        limit = (starts[i + 1] + 0.5) if i + 1 < len(starts) else DUR - 0.25
        for speed in (1.0, 1.08, 1.16, 1.25, 1.33):
            a, sr = k.create(text, voice='af_heart', speed=speed, lang='en-us')
            a = up48(np.trim_zeros(np.where(np.abs(a) < 0.004, 0, a)) if np.any(np.abs(a) > .004) else a, sr)
            if start + len(a) / SR <= limit: break
        a = a / (np.abs(a).max() + 1e-9) * 0.9
        s0 = int(start * SR); n = min(len(a), len(track) - s0); track[s0:s0 + n] += a[:n]
        prev_end = start + n / SR; spans.append((round(start, 2), round(prev_end, 2), round(speed, 2), text))
    return track, spans

# ---------------- instruments (all synthesised) ----------------
def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR
def att(t, a=.004): return np.minimum(1, t / a)
def marimba(f, d=.6):
    t = tt(d); return (np.sin(2*np.pi*f*t)*np.exp(-t*7) + .35*np.sin(2*np.pi*f*3.93*t)*np.exp(-t*22) + .1*np.sin(2*np.pi*f*9.2*t)*np.exp(-t*45)) * att(t)
def bell(f, d=1.4):
    t = tt(d); return (np.sin(2*np.pi*f*t)*np.exp(-t*3) + .5*np.sin(2*np.pi*f*2.76*t)*np.exp(-t*6) + .25*np.sin(2*np.pi*f*5.4*t)*np.exp(-t*11)) * att(t, .002)
def pluck(f, d=.45):
    t = tt(d); return sum(np.sin(2*np.pi*f*k*t) * np.exp(-t*(4 + k*3.2)) / k for k in range(1, 9)) * att(t, .002) * .8
def whistle(f, d=.4):
    t = tt(d); vib = 1 + .006*np.sin(2*np.pi*5.5*t); env = np.minimum(1, t/.04) * np.minimum(1, (d - t)/.08)
    return (np.sin(2*np.pi*f*np.cumsum(vib)/SR) + .08*np.sin(4*np.pi*f*t)) * env * .7
def bass(f, d=.4):
    t = tt(d); env = att(t, .006) * np.exp(-t*3.5) * np.minimum(1, (d - t)/.03)
    return (np.sin(2*np.pi*f*t) + .3*np.sin(4*np.pi*f*t) + .1*np.sin(6*np.pi*f*t)) * env
def pad(fs, d):
    t = tt(d); env = np.minimum(1, t/.35) * np.minimum(1, (d - t)/.4)
    return sum(np.sin(2*np.pi*f*.997*t) + np.sin(2*np.pi*f*1.003*t) for f in fs) * env / (2*len(fs))
def kick():
    t = tt(.35); f = 48 + 110*np.exp(-t*32); return np.sin(2*np.pi*np.cumsum(f)/SR) * np.exp(-t*8)
def noise(d): return RNG.standard_normal(int(d*SR))
def hp(x): return np.diff(x, prepend=0)
def lp(x, k=4): return np.convolve(x, np.ones(k)/k, 'same')
def clap():
    t = tt(.22); x = lp(hp(noise(.22)), 3); env = np.exp(-t*22)
    for o in (.0, .011, .022): env = env + np.where((t >= o) & (t < o + .008), 1.4, 0)
    return x * env * .5
def hat(d=.05): t = tt(d); return hp(hp(noise(d))) * np.exp(-t*70) * .5
def wood(f):
    t = tt(.12); return (np.sin(2*np.pi*f*t) + .5*np.sin(2*np.pi*f*2.7*t)) * np.exp(-t*48) * att(t, .001)

# ---------------- music ----------------
STYLE = {  # bpm, key (midi root), scale, chord roots, lead, extras
 'memory-matrix': dict(bpm=120, key=57, minor=False, lead=marimba, sparkle=True),
 'safety-scout': dict(bpm=126, key=60, minor=False, lead=pluck, claps=1.2),
 'habit-hero': dict(bpm=112, key=55, minor=False, lead=whistle),
 'rough-note-showdown': dict(bpm=104, key=62, minor=False, lead=pluck, wood=True),
 'tick-tock-clock': dict(bpm=120, key=53, minor=False, lead=marimba, ticktock=True),
 'planet-parade': dict(bpm=92, key=52, minor=True, lead=bell, pads=True, claps=0, sparkle=True),
 'spell-gaps': dict(bpm=116, key=58, minor=False, lead=marimba, high=True),
 'where-is-kitty': dict(bpm=108, key=60, minor=False, lead=pluck, sparkle=True),
}[GAME]

def music():
    st = STYLE; beat = 60 / st['bpm']; bar = 4 * beat
    L = np.zeros(int(DUR * SR) + SR, np.float32); R = L.copy()
    def put(x, at, g=1.0, pan=0.0):
        s = int(at * SR); n = min(len(x), len(L) - s)
        if n <= 0 or s < 0: return
        L[s:s+n] += x[:n] * g * (1 - max(0, pan)); R[s:s+n] += x[:n] * g * (1 + min(0, pan))
    scale = [0, 2, 3, 5, 7, 8, 10] if st['minor'] else [0, 2, 4, 5, 7, 9, 11]
    prog = [(0, 'm'), (8, 'M'), (3, 'M'), (10, 'M')] if st['minor'] else [(0, 'M'), (7, 'M'), (9, 'm'), (5, 'M')]
    key = st['key']; up = 12 if st.get('high') else 0
    pool = sorted({key + 12 + up + o + d for o in (0, 12) for d in scale})
    masks = [[1,0,1,1,0,1,0,0], [1,0,0,1,1,0,1,0], [1,1,0,1,0,0,1,0], [1,0,1,0,1,1,1,0]]
    motif_mask = [masks[RNG.integers(4)], masks[RNG.integers(4)]]
    last = key + 12 + up + 4; nbars = int(np.ceil(END / bar)) + 1
    phrase = []  # build one 4-bar phrase of melody, then repeat it (repetition is what makes it catchy)
    for b in range(4):
        root, q = prog[b % 4]; tones = [key + root + i for i in ((0, 3, 7) if q == 'm' else (0, 4, 7))]
        for s, on in enumerate(motif_mask[b % 2]):
            if not on: continue
            if s in (0, 4): cand = [p for p in pool if (p - key) % 12 in [(x - key) % 12 for x in tones]]
            else: cand = [p for p in pool if abs(p - last) <= 3] or pool
            last = min(cand, key=lambda p: abs(p - last) + RNG.random() * 2.5); phrase.append((b, s, last))
    for b in range(nbars):
        t0 = b * bar
        if t0 >= END + .2: break
        root, q = prog[b % 4]; third = 3 if q == 'm' else 4
        chord = [key + root, key + root + third, key + root + 7]
        fade_in = 0.55 if b == 0 else 1.0
        put(bass(mtof(key + root - 12), beat * .9), t0, .55); put(bass(mtof(key + root - 12), beat * .45), t0 + 2.5 * beat, .4); put(bass(mtof(key + root - 5), beat * .45), t0 + 3.5 * beat, .35)
        if st.get('pads'): put(pad([mtof(n) for n in chord], bar), t0, .5)
        for k in range(4):  # off-beat chord stabs keep it bouncy
            for i, n in enumerate(chord): put(pluck(mtof(n + 12), .22), t0 + (k + .5) * beat, .12 * fade_in, (i - 1) * .35)
        for k in range(8): put(hat(), t0 + k * beat / 2, (.16 if k % 2 else .1) * fade_in, .3)
        if b > 0 or st.get('pads'):
            for k in (0, 2): put(kick(), t0 + k * beat, .8)
        if st.get('claps', 1):
            for k in (1, 3): put(clap(), t0 + k * beat, .32 * st.get('claps', 1) * fade_in, -.1)
        if st.get('ticktock'):
            for k in range(4): put(wood(1800 if k % 2 == 0 else 1250), t0 + k * beat, .22, .45 if k % 2 == 0 else -.45)
        if st.get('wood'):
            for k in (1.5, 3.5): put(wood(900), t0 + k * beat, .18, .3)
        if st.get('sparkle') and b % 2 == 0: put(bell(mtof(key + root + 24 + 7)), t0, .1, .5)
        for (pb, s, n) in phrase:
            if pb == b % 4: put(st['lead'](mtof(n)), t0 + s * beat / 2, .34 * fade_in, -.15)
    # ending: a ringing final chord and a little arpeggio over the end card
    e0 = round((END + .1) / beat) * beat
    for i, n in enumerate([0, 4 if not st['minor'] else 3, 7, 12]): put(bell(mtof(key + 24 + n), 2.2), e0 + i * .09, .22, (i - 1.5) * .3)
    for n in (0, 4 if not st['minor'] else 3, 7): put(pluck(mtof(key + n), 1.8), e0, .25)
    put(bass(mtof(key - 12), 1.6), e0, .6); put(kick(), e0, .8)
    if not st.get('pads'): put(pad([mtof(key + n) for n in (0, 4 if not st['minor'] else 3, 7)], DUR - e0), e0, .35)
    else: put(pad([mtof(key + n) for n in (0, 3, 7)], DUR - e0), e0, .5)
    m = np.stack([L, R], 1)[:int(DUR * SR)]
    fade = np.ones(len(m)); n = int(1.2 * SR); fade[-n:] = np.linspace(1, 0, n) ** 1.5
    m = m * fade[:, None]; return (m / (np.abs(m).max() + 1e-9) * .8).astype(np.float32)

# ---------------- sound effects at the real taps ----------------
def pop(): t = tt(.09); f = 520 + 480 * (t / .09); return np.sin(2*np.pi*np.cumsum(f)/SR) * np.exp(-t*30) * att(t, .002)
def chime(): return np.concatenate([bell(mtof(84), .5)[:int(.09*SR)] * 0, np.zeros(0)]) if False else (np.pad(bell(mtof(84), .6), (0, int(.09*SR))) + np.pad(bell(mtof(88), .6), (int(.09*SR), 0))) * .5
def whoosh():
    t = tt(.35); x = lp(noise(.35), 6); env = np.sin(np.pi * t / .35) ** 2; return hp(x) * env * .6
def sparkle(): return sum(np.pad(bell(mtof(n), .6), (int(i*.07*SR), int((3-i)*.07*SR))) for i, n in enumerate((84, 88, 91, 96))) * .35

def sfx():
    track = np.zeros(int(DUR * SR) + SR, np.float32); last = -1
    def put(x, at, g):
        nonlocal last
        if at < 0 or at > DUR - .2: return
        s = int(at * SR); n = min(len(x), len(track) - s); track[s:s+n] += x[:n] * g
    has_right = any(e['name'].startswith(('right', 'word', 'done', 'win')) for e in EV)
    for c in TL['clips']:
        rate = c.get('rate', 1)
        for e in EV:
            if not (c['from'] <= e['t'] < c['from'] + c['len'] * rate): continue
            at = c['at'] + (e['t'] - c['from']) / rate
            kind = e['name'].split('-')[0]
            if kind in ('tap', 'drag'): put(pop(), at, .35); (not has_right) and put(chime(), at + .05, .3)
            elif kind in ('right', 'word', 'done'): put(chime(), at, .3)
            elif kind == 'win': put(sparkle(), at, .35)
    for c in TL['clips'][1:]: put(whoosh(), c['at'] - .18, .45)
    put(whoosh(), END - .1, .5); put(sparkle(), END + .35, .4)
    return track[:int(DUR * SR)]

if __name__ == '__main__':
    vo, spans = voiceover(); mu = music(); fx = sfx()
    sf.write(os.path.join(OUT, 'vo.wav'), vo, SR); sf.write(os.path.join(OUT, 'music.wav'), mu, SR); sf.write(os.path.join(OUT, 'sfx.wav'), fx, SR)
    for s in spans: print(f'  VO {s[0]:5.2f}-{s[1]:5.2f}s x{s[2]}  {s[3]}')
    video = os.path.join(OUT, f'{GAME}-short.mp4'); final = os.path.join(OUT, f'{GAME}-short-audio.mp4')
    # music ducks under the voice; everything is levelled to -14 LUFS, the loudness Instagram and YouTube play at
    fc = ('[1:a]aformat=channel_layouts=stereo,volume=0.55[mu];[2:a]aformat=channel_layouts=stereo,asplit=2[vo][key];'
          '[mu][key]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=350[duck];'
          '[3:a]aformat=channel_layouts=stereo,volume=0.8[fx];'
          '[duck][vo][fx]amix=inputs=3:weights=1 1.25 0.9:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', video, '-i', os.path.join(OUT, 'music.wav'), '-i', os.path.join(OUT, 'vo.wav'), '-i', os.path.join(OUT, 'sfx.wav'),
                    '-filter_complex', fc, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', final], check=True)
    print('->', final)
