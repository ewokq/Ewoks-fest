# Drop Control 3D · Ewok Fest

**Play:** https://ewokq.github.io/Ewoks-fest/

A browser rhythm game where you run the lights and pyro for an EDM festival headliner. You watch from the crowd, up on someone's shoulders. Hit effects on the beat to build the crowd's hype, and save the big pyro for the drop. It's one self-contained `index.html` (Three.js + WebAudio, all music made live in the browser) and it plays on desktop and iPhone. On iPhone, use Share → Add to Home Screen to play fullscreen.

## Genres
Pick one on the menu, or hit **Random**. Each genre has its own synth patches, patterns, arrangement, palette and light style. Scoring follows its BPM.

| Genre | BPM | Sound |
|---|---|---|
| House | 124 | Four-on-the-floor, offbeat hats, piano/organ stabs |
| Big Room | 128 | Huge kick, pluck lead, snare-roll builds, simple drop |
| Trance | 138 | Rolling offbeat bass, supersaw arps, long breakdown (blue/purple) |
| Dubstep | 140 | Half-time, wobble bass, snare on 3 (green/red, strobe-heavy) |
| Drum & Bass | 174 | Breakbeats, reese bass |
| Techno | 130 | Rumble kick, hypnotic loop (monochrome white/red) |
| Hardstyle | 150 | Reverse-bass kick, hard-hitting drops |

## Modes
- **Play the Show**: a scored set with intro, builds, drops and a breakdown.
- **Freestyle**: jam with no score pressure.
- **Watch Auto-Show**: the game runs the show. Tap pads to jump in.
- **My Song (YouTube)** *(v1.3: audio only, no video)*: run the show to your own track. See below.

## My Song (YouTube)
1. On the menu, tap **🎵 MY SONG (YOUTUBE)**.
2. Paste any YouTube link: `youtube.com/watch?v=…`, `youtu.be/…`, `shorts/…`, `music.youtube.com`, `m.youtube.com`. Timestamps like `&t=1m30s` work too.
3. Pick the song's BPM (124, 126, 128, 130, 138, 140, 150 or 174). If you're not sure, use **TAP** in the game. Then hit **▶ PLAY MY SONG**.
4. While you play you only hear the song; the video is hidden. The game's own synth music is muted, so your song is the soundtrack. If your phone doesn't start the music on its own within a couple of seconds (iPhones sometimes need a direct tap), a **▶ Tap to start music** prompt pops up with the player's play button. Tap it once and the player hides again as soon as the song starts.

### Screen layout (v1.3)
Top of the screen, left to right: **CROWD HYPE** meter (top left), the **BUILD-UP / DROP** section and its progress bar (top middle), and your **SCORE** with the camera, sound, full-screen and pause buttons (top right). It stays clear of the notch, the Dynamic Island and the home bar in both portrait and landscape.

### Auto BPM (new in v1.3)
**🎤 AUTO BPM** is on by default (toggle it on the My Song screen or tap the green pill above the buttons in-game). When your song starts, the game asks once for the microphone, listens to the song coming out of your speaker for about 8 seconds, then sets the BPM and lines up beat 1 for you. It keeps fine-tuning every few seconds with small, smooth corrections. The pill shows the detected BPM and a 4-bar confidence meter. If the mic is blocked or it can't hear a clear beat, nothing changes and the manual buttons below work as before. Tapping TAP, SYNC 1, BPM or −/+ yourself pauses auto-tuning for 15 seconds. Works best with the volume up and the phone speaker (not headphones, since the mic has to hear the song).

| Button | What it does |
|---|---|
| **BPM** | Cycles through the BPM presets |
| **TAP** | Tap it on the beat 4 or more times to set the tempo and the phase |
| **SYNC 1** | Tap it on the first beat of a bar to line up the bars |
| **− / +** | Nudges the beat 20 ms earlier or later |
| **DROP!** | Tap it when the drop hits. The crowd goes off, you score points, and a pyro hit right after counts as a **DROP SLAM** |

How it syncs:
- The beat clock follows the video's own playback position, so pausing or seeking the video keeps you in sync.
- Song sections assume 16-bar phrasing, re-anchored to every DROP! you tap.
- The show ends when the video ends.
- Your last 10 links are saved on the device with their titles, BPM and sync.

Keyboard: T is TAP, Y is SYNC, B is DROP!, and , / . nudge the beat.

This mode needs an internet connection and uses YouTube's official embedded player. Everything else in the game works offline. If you see *"This upload can't play outside YouTube"*, the uploader has turned off embedding, so try another upload of the same song. If the game is opened as a local file, YouTube may refuse to play, so use the web link instead.

## Coins & Shop (new in v1.4)
Every finished show pays **coins** into a wallet saved on your device: 25 for playing, plus up to 600 from your score (about 0.6 × √score), plus a grade bonus (S +100, A +60, B +40, C +25, D +10). Freestyle and Auto modes don't earn coins, and My Song shows need at least 16 bars. Spend them in the **🛒 SHOP**, which you can open from the menu or the results screen.

**Stages** are bigger venues with a bigger crowd and a score multiplier:
Warehouse Rave (free, ×1.0) · Open-Air Festival 500 (×1.1) · Cathedral Mainstage 1,500 (×1.2) · Mega Mainstage 3,500 (×1.35) · Ewok Forest 8,000 (×1.5).

**Effects** either upgrade an existing pad's look or add a NEW pad (up to 3 extra pads, keys U / I / O):
Gold Confetti 150 · RGB Lasers 200 · Blue Flames 250 · Green Flames 250 · Chase Strobes 300 · Colour Smoke Jets 350 · Streamer Cannons 400 · LED Visual Pack 450 · Laser Fan Array 600 · Audience Blinders 600 · Aerial Shells 800 · NEW PAD Sparkular 700 · NEW PAD Comet Mines 1,000 · NEW PAD Kinetic Rig 1,200.

Every item has a 👁 preview. Buying asks you to confirm first, and you can equip or unequip anything you own. If you played v1.3, you keep the Cathedral stage and get 300 welcome coins.

## Controls
| | Touch | Keyboard |
|---|---|---|
| Lights: Beams, Lasers, Strobe, Wash | left pads | A S D F |
| Pyro: Flames, Confetti, CO₂, Fireworks | right pads | J K L Space |
| Look around / zoom | drag / pinch | drag / wheel |
| Camera (Crowd POV, Cinematic, Front Row, Stage Side, Overhead, DJ) | camera button | C |
| Pause · Mute · Fullscreen | buttons | P · M · Enter |

Tips: hit when the ring closes (PERFECT). Answer "CROWD WANTS…" cues. Fire pyro on the first beat of a drop for a **DROP SLAM**.

No sound on iPhone? Turn off Silent mode and turn the volume up.

Contains flashing lights. Set "Flashing: Reduced" in the menu if you're sensitive.
