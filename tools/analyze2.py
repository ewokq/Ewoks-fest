"""Refinement pass (numpy only): fine BPM from beat-phase drift, bass-return drop detection,
bar phase from drops, section map. Usage: analyze2.py track.wav coarse_bpm"""
import sys,json,wave,numpy as np
def feats(fn):
    w=wave.open(fn);sr=w.getframerate();y=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
    H=256;N=2048;nfr=1+(len(y)-N)//H;win=np.hanning(N).astype(np.float32);fr=np.fft.rfftfreq(N,1/sr);lo=fr<150
    e=np.empty(nfr,np.float32);a=np.empty(nfr,np.float32);fl=np.empty(nfr,np.float32);prev=None
    for i in range(0,nfr,3000):
        idx=np.arange(N)[None,:]+H*np.arange(i,min(nfr,i+3000))[:,None];S=np.abs(np.fft.rfft(y[idx]*win,axis=1))
        e[i:i+len(S)]=(S[:,lo]**2).sum(1);a[i:i+len(S)]=(S**2).sum(1)
        L=np.log1p(S*10);d=np.diff(L,axis=0,prepend=L[:1] if prev is None else prev[None]);fl[i:i+len(S)]=np.maximum(d,0).sum(1);prev=L[-1]
    return e,a,fl,H/sr,len(y)/sr
def phase_fit(fl,hop,p,dur,nseg=10):
    ts=np.arange(len(fl))*hop;out=[]
    for i in range(nseg):
        m=(ts>=dur*i/nseg)&(ts<dur*(i+1)/nseg);z=(fl[m]*np.exp(2j*np.pi*ts[m]/p)).sum()
        out.append((dur*(i+.5)/nseg,np.angle(z),abs(z)/max(1e-9,fl[m].sum())))
    t=np.array([o[0] for o in out]);ph=np.unwrap(np.array([o[1] for o in out]));wt=np.array([o[2] for o in out])
    A=np.vstack([t,np.ones_like(t)]).T*wt[:,None];c=np.linalg.lstsq(A,ph*wt,rcond=None)[0]
    return c,wt.mean()
def run(fn,bpm):
    e,a,fl,hop,dur=feats(fn);p=60/bpm
    ts=np.arange(len(fl))*hop;best=None
    for b in np.arange(bpm-0.3,bpm+0.3001,0.005):
        z=(fl*np.exp(2j*np.pi*ts/(60/b))).sum()/fl.sum()
        if best is None or abs(z)>best[0]:best=(abs(z),b,z)
    q,bb,z=best;p=60/bb
    off=((np.angle(z)/(2*np.pi))*p)%p
    nb=int((dur-off)/p)
    def per(x):return np.array([np.log1p(x[int((off+b*p)/hop):max(int((off+b*p)/hop)+1,int((off+(b+1)*p)/hop))].mean()) for b in range(nb)])
    L=per(e);R=per(a)
    s=np.full(nb,-9.0)
    for b in range(8,nb-8):s[b]=L[b:b+8].mean()-L[b-8:b].mean()
    hi=np.percentile(L,75)
    cand=[b for b in range(8,nb-8) if s[b]>1.0 and L[b:b+8].mean()>hi-1.2]
    cand.sort(key=lambda b:-s[b]);drops=[]
    thr=max(1.0,0.3*(s[cand[0]] if cand else 1))
    for b in cand:
        if s[b]<thr:continue
        if all(abs(b-d)>=48 for d in drops):drops.append(b)
    drops.sort()
    # bar phase: weighted vote of drop beat mod 4
    v=np.zeros(4)
    for d in drops:v[d%4]+=s[d]
    ph4=int(np.argmax(v)) if drops else 0
    off2=off+ph4*p;bar=4*p
    drops=[ (d-ph4)//4 if (d-ph4)%4<2 else (d-ph4)//4+1 for d in drops]  # in bars
    def s4(k):
        b=ph4+4*k
        return L[b:b+4].mean()-L[b-4:b].mean() if 4<=b<=nb-4 else -9
    drops=sorted(set(max([d-1,d,d+1],key=s4) for d in drops))
    nbars=int((dur-off2)/bar)
    Lb=np.array([L[ph4+4*k:ph4+4*k+4].mean() for k in range(nbars)])
    Rb=np.array([R[ph4+4*k:ph4+4*k+4].mean() for k in range(nbars)])
    hiL=np.percentile(Lb,70);loR=np.percentile(Rb,20)
    lab=['']*nbars
    for k in range(nbars):lab[k]='main' if Lb[k]>hiL-1.0 else ('low')
    for d in drops:
        k=d
        while k<nbars and Lb[k]>hiL-1.2 and k-d<32:lab[k]='peak' if k-d>=8 else 'drop';k+=1
        for j in range(max(0,d-8),d):
            if lab[j] not in('drop','peak'):lab[j]='build'
    first=next((k for k in range(nbars) if lab[k]!='low'),0)
    last=max([k for k in range(nbars) if lab[k] in('drop','peak','main')]+[0])
    for k in range(nbars):
        if lab[k]=='low':lab[k]='intro' if k<first or (drops and k<drops[0]-8 and all(l in('low','intro') for l in lab[:k])) else ('outro' if k>last else 'break')
        if lab[k]=='main' and drops and k<drops[0]-8:lab[k]='groove'
        if k>last and lab[k] not in('outro',):lab[k]='outro'
    secs=[];st=0
    for k in range(1,nbars+1):
        if k==nbars or lab[k]!=lab[st]:secs.append([st,k,lab[st]]);st=k
    return dict(bpm=round(60/p,3),off=round(off2,3),dur=round(dur,2),bars=nbars,secs=secs,drops=[round(off2+d*bar,2) for d in drops],dropBars=drops,dropScore=[round(float(s4(d)),2) for d in drops],beatQ=round(float(q),3))
if __name__=='__main__':print(json.dumps(run(sys.argv[1],float(sys.argv[2]))))
