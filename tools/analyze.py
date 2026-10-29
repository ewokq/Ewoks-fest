# Offline analysis of real tracks (numpy only): BPM, downbeat offset, 8-bar phrase energy, section map, drop times.
# usage: python analyze.py track.wav [bpm_hint]   (wav: mono 22050 Hz, e.g. ffmpeg -i x.mp3 -ac 1 -ar 22050 x.wav)
import sys,json,wave,numpy as np
def load(fn):
    w=wave.open(fn);sr=w.getframerate();n=w.getnframes();y=np.frombuffer(w.readframes(n),dtype=np.int16).astype(np.float32)/32768
    if w.getnchannels()>1:y=y.reshape(-1,w.getnchannels()).mean(1)
    return y,sr
def analyze(fn,hint=None):
    y,sr=load(fn);dur=len(y)/sr;H=512;N=2048
    nfr=1+(len(y)-N)//H;idx=np.arange(N)[None,:]+H*np.arange(nfr)[:,None]
    win=np.hanning(N).astype(np.float32)
    S=np.empty((nfr,N//2+1),np.float32)
    for i in range(0,nfr,4000):
        S[i:i+4000]=np.abs(np.fft.rfft(y[idx[i:i+4000]]*win,axis=1))
    fr=np.fft.rfftfreq(N,1/sr);hop=H/sr;t=np.arange(nfr)*hop
    L=np.log1p(10*S);flux=np.maximum(0,np.diff(L,axis=0)).sum(1);flux=np.r_[0,flux]
    lowb=S[:,fr<150];low=lowb.sum(1);low/=low.max()+1e-9
    lflux=np.maximum(0,np.diff(np.log1p(10*lowb),axis=0)).sum(1);lflux=np.r_[0,lflux]
    oenv=flux/(flux.max()+1e-9)+lflux/(lflux.max()+1e-9)
    oenv=oenv-np.convolve(oenv,np.ones(16)/16,'same');oenv=np.maximum(oenv,0)
    rms=np.sqrt((S**2).mean(1));
    def score(bpm):
        z=(oenv*np.exp(2j*np.pi*(t/(60/bpm)))).sum();return abs(z),np.angle(z)
    cands=np.arange(hint-4,hint+4,0.01) if hint else np.arange(70,180,0.05)
    res=[(score(b),b) for b in cands];(sc,ang),bpm=max(res,key=lambda r:r[0][0])
    r=round(bpm*2)/2
    if abs(r-bpm)<0.1: bpm=r;sc,ang=score(bpm)
    bp=60/bpm;beat0=((ang/(2*np.pi))%1.0)*bp
    # sanity: alignment quality vs random
    qual=float(sc/(np.abs(oenv).sum()+1e-9))
    nb=int((dur-beat0)/bp)
    def seg(a,b,arr):i0=int(a/hop);i1=max(i0+1,int(b/hop));return float(arr[i0:i1].mean())
    be=np.array([seg(beat0+i*bp,beat0+(i+1)*bp,rms) for i in range(nb)])
    bl=np.array([seg(beat0+i*bp,beat0+(i+1)*bp,low) for i in range(nb)])
    feat=be/(be.max()+1e-9)*0.6+bl/(bl.max()+1e-9)*0.4
    sc32=[]
    for k in range(32):
        s=0
        for p in range(k,nb-4,32):
            if p<4:continue
            s+=abs(feat[p:p+4].mean()-feat[p-4:p].mean())
        sc32.append(s)
    k=int(np.argmax(sc32));kb=k%4;off=beat0+kb*bp;bar=4*bp;nbar=int((dur-off)/bar)
    barE=np.array([feat[kb+4*i:kb+4*i+4].mean() for i in range(nbar)])
    pk=(k//4)%8
    bounds=sorted(set([0]+list(range(pk if pk>0 else 8,nbar,8))+[nbar]))
    ph=[(bounds[i],bounds[i+1],float(barE[bounds[i]:bounds[i+1]].mean())) for i in range(len(bounds)-1)]
    es=np.array([p[2] for p in ph]);hi=np.percentile(es,70);lo=np.percentile(es,30);mx=es.max()
    thr=max(hi*0.97,mx*0.82)
    cls=['drop' if e>=thr else 'low' if e<=lo else 'mid' for (_,_,e) in ph]
    secs=[];seen=False
    for i,(a,b,e) in enumerate(ph):
        c=cls[i];nxt=cls[i+1] if i+1<len(cls) else None;rest=all(x!='drop' for x in cls[i:])
        if c=='drop':tt='drop' if (i==0 or cls[i-1]!='drop') else 'peak';seen=True
        elif nxt=='drop':tt='build'
        elif c=='low':tt=('intro' if all(x!='mid' for x in cls[:i]) else 'break') if not seen else ('outro' if rest else 'break')
        else:tt='groove' if not seen else ('outro' if rest else 'main')
        secs.append([a,b,tt])
    m=[]
    for s in secs:
        if m and m[-1][2]==s[2]:m[-1][1]=s[1]
        else:m.append(s[:])
    drops=[round(off+s[0]*bar,2) for s in m if s[2]=='drop']
    return dict(bpm=round(float(bpm),2),off=round(float(off),3),dur=round(dur,2),bars=nbar,secs=m,drops=drops,phraseE=[round(p[2],2) for p in ph],dropContrast=round(float(mx/(es.min()+1e-9)),2),beatQ=round(qual,3))
if __name__=='__main__':
    print(json.dumps(analyze(sys.argv[1],float(sys.argv[2]) if len(sys.argv)>2 else None)))
