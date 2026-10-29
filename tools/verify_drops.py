"""Independent drop check: full-band loudness + spectral-flux jump (not the bass feature used for detection).
For each metadata drop, search +-4 beats at 1/4-beat resolution; report offset in beats. Pass if |offset|<=1."""
import sys,json,wave,numpy as np
def run(meta,wavdir):
    T=json.load(open(meta));res={}
    for t in T:
        w=wave.open(f"{wavdir}/{t['id']}.wav");sr=w.getframerate();y=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
        H=256;N=1024;nfr=1+(len(y)-N)//H;win=np.hanning(N).astype(np.float32);E=np.empty(nfr,np.float32);F=np.empty(nfr,np.float32);prev=None
        for i in range(0,nfr,4000):
            idx=np.arange(N)[None,:]+H*np.arange(i,min(nfr,i+4000))[:,None];S=np.abs(np.fft.rfft(y[idx]*win,axis=1));E[i:i+len(S)]=np.log1p((S**2).sum(1))
            L=np.log1p(S);d=np.diff(L,axis=0,prepend=L[:1] if prev is None else prev[None]);F[i:i+len(S)]=np.maximum(d,0).sum(1);prev=L[-1]
        hop=H/sr;bp=60/t['bpm'];w2=int(2*bp/hop);out=[]
        Fz=(F-F.mean())/(F.std()+1e-9)
        for d in t['drops']:
            best=None
            for q in np.arange(-4,4.001,0.25):
                i=int((d+q*bp)/hop)
                if i-w2<0 or i+w2>=nfr:continue
                sc=E[i:i+w2].mean()-E[i-w2:i].mean()+0.15*Fz[max(0,i-2):i+3].max()
                if best is None or sc>best[0]:best=(sc,q)
            out.append(best[1])
        res[t['id']]=out
        print(t['id'],t['bpm'],'drops',t['drops'],'offset(beats)',out,'PASS' if all(abs(o)<=1 for o in out) else 'CHECK')
    return res
if __name__=='__main__':json.dump(run(sys.argv[1],sys.argv[2]),open('/tmp/mus/verify.json','w'))
