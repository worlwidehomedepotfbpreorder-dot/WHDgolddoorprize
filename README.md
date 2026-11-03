# Worldwide Door Prize — Number Reel Edition

Open `index.html` locally or upload all files to a GitHub repository and deploy as a static site on Vercel (Framework Preset: Other).

The prize board starts empty on first use. Add prizes in Manage Prizes. The three spinning reels display the winning prize number, padded to three digits: #3 → 003, #39 → 039, #113 → 113. Reels inherit the winning prize category color. Up to 999 numbered entries are supported.

Data is stored in browser localStorage, not synced across devices. Export backups before clearing browser data or switching devices.

## Winner number display

The three slot reels and the main WINNING DOOR PRIZE display show only a three-digit prize number (e.g., 035, 113, 500). The winner display does not include a period, closing parenthesis, or prize name. The prize board and draw history retain their names and numbered labels.


## Branding
The top bar contains the provided Worldwide Steel, Worldwide Home Depot, and Worldwide Central logos in the `assets/` directory. The interface uses a royal-blue and gold theme. Prize numbers appear in gold on the reels and winner panel.

Upload the entire project including `assets/` to GitHub/Vercel; do not omit image files.


## Golden slot reel design
The three-digit reels have been restyled with a metallic gold marquee frame, bulb highlights, navy reel windows and bright metallic gold numerals. Drawing behavior, prize numbering, management tools, and logo files are unchanged.


## Rounded reels and gold lever

The slot machine now features rounded gold reel housing, larger gold numbers, and a clickable gold lever that triggers the same draw as SPIN & DRAW.


### Sequential reel animation
The reels stop hundreds → tens → ones (at approximately 1.55, 2.40, and 3.25 seconds). After the entire number is revealed, the gold numbers and frame flash briefly. Prize selection happens once per spin and is saved to browser storage only after the final reveal.


## Always-on lighting
The gold marquee bulbs subtly animate while idle, including before the first draw. After all three reels settle, the gold digits, winning result, and light frame continue to sparkle until the next spin. Restarting the browser restores the previous winning animation if draw history is present. The CSS respects reduced-motion browser settings.

## Winning confetti celebration
When all three reel digits have stopped, the result triggers a five-to-six-second gold, blue, white, and red confetti shower. The confetti disappears automatically; the existing winning-number and marquee flashes continue until the next draw. The overlay is click-through and is disabled for visitors who have enabled reduced-motion preferences. No external libraries or internet access are required.

### Congratulations celebration
After the final reel locks, a large gold **CONGRATULATIONS!** message displays with the three-digit winning number while the confetti falls. The message fades away after 5.8 seconds. The slot's gold flashing lights and winning digits remain animated until another draw. No external library is required.


## Always-on idle lights (new)
The gold frame and all three digits continuously shimmer from first load, including when the door prize list is empty and the display reads 000. The idle winning label also glows. These animations stop when a valid spin begins; after the completed draw, the existing endless jackpot flashes, confetti, and congratulations continue as before. The Spin button stays disabled when no prizes are available. Users who select reduced motion in their device settings do not see these animations.

## Slot machine audio (new)
- `audio.js` generates **original** ambient melody, spinning sounds, reel-stop chimes, and winning fanfare using the Web Audio API. No copyrighted audio tracks, external files, or network are required.
- Click **ENABLE SOUND** to hear the looping idle/standby music. Moving the volume slider adjusts playback. Sound and volume preference are stored in the same browser.
- Press **SPIN & DRAW** or pull the lever to hear the reel sounds. The winning fanfare plays when all three digits stop, then the quiet idle music resumes. Animations and draw mechanics are unchanged.
- Modern browsers generally block autoplay until a click, keypress, or touch. If no sound is heard after loading, click **ENABLE SOUND** or **SPIN & DRAW**. Sound will be silent by default before the first interaction.
- You can mute audio at any time; the visuals continue uninterrupted.


## Arcade background music update
Standby audio now plays a custom original, upbeat 120 BPM arcade loop featuring a chip-style melody, arpeggio, bass, and light rhythmic pulses. Music starts after the user enables sound (browser autoplay restriction), pauses during the spin and jackpot, and resumes after the celebration. No third-party audio files or copyrighted songs are required.
