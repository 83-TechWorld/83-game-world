"""Transcribes a finished video with Whisper so you can confirm the voiceover is clear and on time.
Usage: .venv/bin/python check_audio.py <game>"""
import os, sys
from faster_whisper import WhisperModel

HERE = os.path.dirname(os.path.abspath(__file__))
os.environ.setdefault('HF_HOME', os.path.join(HERE, 'models', 'hf'))
game = sys.argv[1]
video = os.path.join(HERE, 'out', game, f'{game}-short-audio.mp4')
model = WhisperModel('base.en', device='cpu', compute_type='int8')
segments, _ = model.transcribe(video, vad_filter=False)
for s in segments:
    print(f'{s.start:5.1f}-{s.end:5.1f}s  {s.text.strip()}')
