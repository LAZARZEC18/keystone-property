"""Frame each recorded clip on a soft gradient with a slow push-in, at 1920x1080, plus a 720p copy for phones. Also writes a poster JPG.
   python3 compose.py <out_dir>   (reads clips-raw/*.mp4 and clips-raw/offsets.json)"""
import json, subprocess, sys, os

off = json.load(open('clips-raw/offsets.json'))
# light, calm backdrops (cream to sand, each clip with a faint tint) so the page reads as part of the site, not a screen in a screen
cols = {
    'budgetmap': ('0xf6f4ef', '0xdfe9e5'), 'afford': ('0xf6f4ef', '0xdcebe5'), 'calculator': ('0xf6f4ef', '0xe2e1ef'),
    'estimate': ('0xf6f4ef', '0xefe4d0'), 'suburb': ('0xf6f4ef', '0xdde7ef'), 'rates': ('0xf6f4ef', '0xdcebe5'), 'firsthome': ('0xf6f4ef', '0xf0dfe6'),
}
out = sys.argv[1] if len(sys.argv) > 1 else 'clips'
only = set(filter(None, os.environ.get('ONLY', '').split(',')))
here = os.path.dirname(os.path.abspath(__file__))
for name, o in off.items():
    if only and name not in only:
        continue
    ss = o['ready']
    D = round(o['end'] - ss - 0.2, 2)
    c0, c1 = cols.get(name, ('0xf6f4ef', '0xe3ddcf'))
    # foreground: the page, pushed in 4% over the clip, placed at 90% size with rounded corners and a shadow
    fc = (f"[1:v]format=rgba[bg0];[2:v]scale=1920:1080,format=rgba[sh];[bg0][sh]overlay=0:0[bg];"
          f"[0:v]fps=30,scale=w='1920*(1+0.04*t/{D})':h=-2:eval=frame:flags=lanczos,crop=1920:1080:'(iw-1920)/2':'(ih-1080)/2',scale=1728:972:flags=lanczos,format=rgba[v];"
          f"[3:v]scale=1728:972,format=gray,loop=-1:1:0[m];[v][m]alphamerge[fg];[bg][fg]overlay=96:54:shortest=1,format=yuv420p[out]")
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(ss), '-t', str(D), '-i', f'clips-raw/{name}.mp4',
           '-f', 'lavfi', '-t', str(D), '-i', f'gradients=s=1920x1080:c0={c0}:c1={c1}:x0=0:y0=0:x1=1920:y1=1080:speed=0.004:r=30',
           '-loop', '1', '-t', str(D), '-i', f'{here}/shadow.png', '-loop', '1', '-t', str(D), '-i', f'{here}/mask.png',
           '-filter_complex', fc, '-map', '[out]', '-c:v', 'libx264', '-preset', 'slow', '-crf', os.environ.get('CRF', '25'), '-tune', 'stillimage',
           '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', f'{out}/{name}.mp4']
    r = subprocess.run(cmd, capture_output=True, text=True)
    print(name, D, r.returncode, r.stderr[-300:])
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', '2', '-i', f'{out}/{name}.mp4', '-frames:v', '1', '-vf', 'scale=1280:-2', '-q:v', '3', f'{out}/{name}.jpg'])
    # a 720p copy for phones (demo.js serves it below 900px wide)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{out}/{name}.mp4', '-vf', 'scale=1280:720:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow',
                    '-crf', '26', '-tune', 'stillimage', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', f'{out}/{name}-720.mp4'])
