# Promo video tools

These tools make 20-second, 1080×1920 promo videos of the games for Instagram Reels and YouTube Shorts.

Chrome plays each game for real, at phone size. The recording is placed inside an animated phone frame, with captions, an opening hook and a closing card. A soundtrack is then added: voiceover, original music and sound effects timed to the taps.

## One-time setup (macOS)

You need Google Chrome, Node, ffmpeg (`brew install ffmpeg`) and [uv](https://docs.astral.sh/uv/).

```bash
cd marketing/shorts/tools
npm install
uv venv .venv --python 3.11
VIRTUAL_ENV=.venv uv pip install -r requirements.txt
mkdir -p models
curl -L -o models/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -L -o models/voices-v1.0.bin  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
chmod +x make.sh
```

The voice model is about 350 MB. The Whisper model used by `check_audio.py` downloads itself on first use.

## Making a video

```bash
./make.sh spell-gaps
.venv/bin/python check_audio.py spell-gaps   # optional: prints what the voiceover says, with timings
```

The finished file lands in `marketing/shorts/<game>-short.mp4`. One video takes about 5 minutes, mostly rendering.

Render one game at a time. Running several in parallel slows the recording, and the footage comes out choppy.

Videos already set up: `memory-matrix`, `safety-scout`, `habit-hero`, `rough-note-showdown`, `tick-tock-clock`, `planet-parade`, `spell-gaps`, `where-is-kitty`, `build-crew`, `color-grid-slide`, `sky-blaster` and `mindspark`.

Sideways games: give the bot `size: [780, 390]` in `bots.cjs` and `landscape: true` in its `compose.html` entry. It is then recorded at a sideways phone size and shown in a phone turned on its side (see `sky-blaster`).

## Adding a new game

Each video needs four pieces. Copy an existing game's entry in each file and adapt it.

1. **`bots.cjs`: a scripted player.** It opens levels from the level map, answers correctly with human-like pauses, and calls `mark('right-…')`, `mark('tap-…')` and so on at key moments.
2. **`compose.html`, the `C` table: the edit.**
   - `clips` chooses which seconds of the recording to show, using the times printed by `record.cjs`.
   - `caps` holds the on-screen captions, with `*word*` marking the highlighted word.
   - `zoom`, `transition` and the colours and font set the look.
3. **`compose.html`, the `BG` table: the animated background.** Give each game its own look, rather than reusing another game's.
4. **`audio.py`: the spoken lines and music.** Add `SAY` lines that match the captions, a `NAME`, and a `STYLE` with tempo, key and lead instrument.

Check the edit before the full render. This command saves a contact sheet to `out/<game>/snap.png`:

```bash
node render.cjs <game> snap 1.5,4.5,9,13,17.5
```

## How the pieces fit

| File | What it does |
| --- | --- |
| `record.cjs` | Runs the built site, plays the game with the bot, and saves `out/<game>/footage.mp4` (780×1560, 30 fps) and `events.json` |
| `compose.html` | Draws every frame as a function of time: background, phone with footage, captions, end card |
| `render.cjs` | Renders `compose.html` frame by frame to H.264 (`meta` exports the timeline, `snap` makes stills) |
| `audio.py` | Kokoro voiceover, original synthesised music, sound effects at the bot's taps, ducking, and loudness levelled to −14 LUFS |
| `check_audio.py` | Whisper transcript of the finished video |

## Licences

- **Voiceover:** Kokoro (Apache-2.0), which allows commercial use.
- **Music:** composed by `audio.py` itself, with no samples or third-party tracks.
- **Avoid MusicGen:** do not swap in MusicGen for the music, because its weights are licensed for non-commercial use only.
