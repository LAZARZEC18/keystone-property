import json,subprocess,sys
off=json.load(open('clips-raw/offsets.json'))
cols={'afford':('0x0e6b5c','0x0b2f3a'),'calculator':('0x3b3a8a','0x0b1f33'),'estimate':('0xb0802f','0x2a1f14'),'suburb':('0x2a7aa8','0x0b1f33'),'rates':('0x0e6b5c','0x1b2433'),'firsthome':('0xa4486b','0x2a1426')}
out=sys.argv[1] if len(sys.argv)>1 else 'clips'
for name,o in off.items():
    ss=o['ready']+0.2; D=round(o['end']-ss-0.3,2)
    c0,c1=cols[name]
    fc=(f"[1:v]format=rgba[bg0];[bg0][2:v]overlay=0:0[bg];"
        f"[0:v]fps=30,scale=w='1280*(1+0.05*t/{D})':h=-2:eval=frame,crop=1280:720:'(iw-1280)/2':'(ih-720)/2',scale=1152:648,format=rgba[v];"
        f"[3:v]format=gray,loop=-1:1:0[m];[v][m]alphamerge[fg];[bg][fg]overlay=64:36:shortest=1,format=yuv420p[out]")
    cmd=['ffmpeg','-y','-loglevel','error','-ss',str(ss),'-t',str(D),'-i',f'clips-raw/{name}.webm',
         '-f','lavfi','-t',str(D),'-i',f'gradients=s=1280x720:c0={c0}:c1={c1}:x0=0:y0=0:x1=1280:y1=720:speed=0.004:r=30',
         '-loop','1','-t',str(D),'-i','shadow.png','-loop','1','-t',str(D),'-i','mask.png',
         '-filter_complex',fc,'-map','[out]','-c:v','libx264','-preset','slow','-crf','28','-pix_fmt','yuv420p','-movflags','+faststart','-an',f'{out}/{name}.mp4']
    r=subprocess.run(cmd,capture_output=True,text=True); print(name,D,r.returncode,r.stderr[-300:])
    subprocess.run(['ffmpeg','-y','-loglevel','error','-ss','1.5','-i',f'{out}/{name}.mp4','-frames:v','1','-q:v','4',f'{out}/{name}.jpg'])
