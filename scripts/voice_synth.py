"""Records the kids-game voice lines with Kokoro (af_heart, the same voice as the YouTube videos).

  node scripts/voice-harvest.mjs                                         # collect the lines first
  marketing/shorts/tools/.venv/bin/python scripts/voice_synth.py          # record any line not recorded yet

Each line becomes public/voice/c/<id>.mp3, where <id> is a hash of the line's key (see voiceId in kids.js).
Lines already recorded are skipped, so re-running after adding a game only records the new lines."""
import json, os, subprocess, sys, tempfile, concurrent.futures as cf
import numpy as np, soundfile as sf
import espeakng_loader

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOLS = os.path.join(ROOT, 'marketing', 'shorts', 'tools')
_esd = espeakng_loader.get_data_path()
if len(_esd) > 120:  # espeak-ng cannot open its data from a very long path
    _short = os.path.join(tempfile.gettempdir(), 'kg-espeak-data')
    if os.path.realpath(_short) != os.path.realpath(_esd):
        if os.path.lexists(_short): os.remove(_short)
        os.symlink(_esd, _short)
    _esd = _short
os.environ['ESPEAK_DATA_PATH'] = _esd
from kokoro_onnx import Kokoro, EspeakConfig

VOICE, SPEED = 'af_heart', 0.95   # a touch slower than the Shorts, for young listeners
OUT = os.path.join(ROOT, 'public', 'voice', 'c')
# letters said on their own are read as letter names
LETTERS = dict(zip('abcdefghijklmnopqrstuvwxyz', ['ay', 'bee', 'see', 'dee', 'ee', 'eff', 'jee', 'aitch', 'eye', 'jay', 'kay', 'ell', 'em',
                                                    'en', 'oh', 'pee', 'cue', 'are', 'ess', 'tee', 'you', 'vee', 'double you', 'ex', 'why', 'zee']))
PRONOUNCE = {'Dhakshith': 'Dhuck-shith', 'Manvitha': 'Mun-vee-tha'}

def voice_id(key):  # FNV-1a 32-bit, base 36: must match voiceId() in kids.js
    h = 0x811c9dc5
    for ch in key.encode('utf-8'):
        h ^= ch
        h = (h * 0x01000193) & 0xffffffff
    s, n = '', h
    while True:
        n, r = divmod(n, 36)
        s = '0123456789abcdefghijklmnopqrstuvwxyz'[r] + s
        if n == 0: return s

def trim(a, sr):
    idx = np.where(np.abs(a) > 0.012)[0]
    if not len(idx): return a
    pad = int(sr * 0.04)
    return a[max(0, idx[0] - pad): min(len(a), idx[-1] + pad)]

def encode(wav, mp3):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-ac', '1', '-ar', '24000', '-codec:a', 'libmp3lame', '-b:a', '40k', mp3], check=True)
    os.remove(wav)

def main():
    lines = json.load(open(os.path.join(ROOT, 'scripts', 'voice-lines.json')))
    os.makedirs(OUT, exist_ok=True)
    todo = [l for l in lines if not os.path.exists(os.path.join(OUT, voice_id(l['k']) + '.mp3'))]
    if '--reverse' in sys.argv: todo.reverse()  # a second recorder can work from the other end
    print(len(lines), 'lines,', len(todo), 'to record', flush=True)
    if not todo: return
    k = Kokoro(os.path.join(TOOLS, 'models', 'kokoro-v1.0.onnx'), os.path.join(TOOLS, 'models', 'voices-v1.0.bin'), espeak_config=EspeakConfig(data_path=_esd))
    tmp = tempfile.mkdtemp()
    pool = cf.ThreadPoolExecutor(4)
    for i, l in enumerate(todo):
        text = LETTERS.get(l['k'], l['t'])
        for a, b in PRONOUNCE.items(): text = text.replace(a, b)
        try:
            audio, sr = k.create(text, voice=VOICE, speed=SPEED, lang='en-us')
        except Exception as e:
            print('  skip', repr(l['t']), e, flush=True); continue
        wav = os.path.join(tmp, f'{i}.wav')
        sf.write(wav, trim(audio, sr), sr)
        pool.submit(encode, wav, os.path.join(OUT, voice_id(l['k']) + '.mp3'))
        if i % 200 == 0: print(f'  {i}/{len(todo)}', flush=True)
    pool.shutdown(wait=True)
    print('done', flush=True)

if __name__ == '__main__':
    main()
