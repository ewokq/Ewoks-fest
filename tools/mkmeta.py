"""Turn analyze2 output into game metadata (music/tracks.json): smoothed section map, validated drops, short window."""
import json,sys
A=json.load(open('/tmp/mus/ana2.json'));M=json.load(open('/tmp/mus/meta.json'))
SET=json.load(open('/workspace/festival/tools/setlist.json'))
NM={'intro':'INTRO','groove':'GROOVE','build':'BUILD-UP','drop':'DROP','peak':'PEAK','main':'MAIN GROOVE','break':'BREAKDOWN','outro':'OUTRO'}
out=[]
for s in SET:
    a=A[s['key']];m=M[s['key']];secs=[list(x) for x in a['secs']]
    a=dict(a);a['off']=round(a['off']+s.get('shift',0)*60/a['bpm'],3)
    nb=a['bars'];lab=['']*nb
    for x in a['secs']:
        for k in range(x[0],min(x[1],nb)):lab[k]=x[2]
    hi=[l in('drop','peak','main','groove') for l in lab]
    def runs(v):
        r=[];st=0
        for k in range(1,nb+1):
            if k==nb or v[k]!=v[st]:r.append([st,k,v[st]]);st=k
        return r
    for it in range(2):
        for r in runs(hi):
            if r[1]-r[0]<=2 and 0<r[0] and r[1]<nb:
                for k in range(r[0],r[1]):hi[k]=not r[2]
    def runEnd(d):
        k=d
        while k<nb and hi[k]:k+=1
        return k
    drops=[]
    sc=dict(zip(a['dropBars'],a['dropScore']))
    for d in sorted(a['dropBars']):
        if sc[d]>=1.3 and d>=4 and hi[d] and runEnd(d)-d>=6 and (not drops or d-drops[-1]>=16):drops.append(d)
    L=['main' if h else 'break' for h in hi]
    for d in drops:
        e=runEnd(d)
        for k in range(d,min(d+8,e)):L[k]='drop'
        for k in range(d+8,min(d+32,e)):L[k]='peak'
        for k in range(max(0,d-8),d):
            if L[k] not in('drop','peak'):L[k]='build'
    first=next((k for k in range(nb) if L[k]!='break'),0)
    for k in range(first):L[k]='intro'
    fb=next((k for k in range(nb) if L[k] in('build','drop')),nb)
    for k in range(first,fb):
        if L[k]=='main':L[k]='groove'
    last=max([k for k in range(nb) if L[k] in('drop','peak','main','groove')]+[0])
    for k in range(last+1,nb):L[k]='outro'
    if L[-1]!='outro':
        for k in range(nb-2,nb):L[k]='outro'
    secs=runs(L)
    ch=True
    while ch:
        ch=False
        for i in range(1,len(secs)):
            x=secs[i]
            if x[1]-x[0]<3 and x[2] not in('drop','build','outro'):
                secs[i-1][1]=x[1];secs.pop(i);ch=True;break
        for i in range(len(secs)-1):
            if secs[i][2]==secs[i+1][2] and secs[i][2]!='drop':secs[i][1]=secs[i+1][1];secs.pop(i+1);ch=True;break
    dn=0;S=[]
    for x in secs:
        n=NM[x[2]]
        if x[2]=='drop':dn+=1;n='DROP' if dn==1 else ('MAIN DROP' if dn==2 else 'DROP %d'%dn)
        S.append([x[0],x[1],x[2],n])
    dropBars=[x[0] for x in S if x[2]=='drop']
    # short window: from 16 bars before first drop to end of the 2nd drop's high section (or +40 bars), on bar grid
    d0=dropBars[0];a0=max(0,d0-16)
    if len(dropBars)>1 and dropBars[1]-a0<=72:
        e=dropBars[1];end=next((x[1] for x in S if x[0]==e),e+8);end=min(end+8,a['bars'])
    else:end=min(d0+40,a['bars'])
    item=dict(id=s['id'],g=s['g'],genre=s['genre'],title=m['title'],artist=m['artist'],file='music/'+s['id']+'.mp3',page=m['page'],lic='CC BY 3.0' if '3.0' in m['lic'] else m['lic'],lic_url=m['lic_url'].replace('http://','https://'),samples=[[x['title'],x['artist'],x['url']] for x in s.get('samples',[])],
              bpm=a['bpm'],off=a['off'],dur=a['dur'],bars=a['bars'],secs=S,drops=[round(a['off']+b*240/a['bpm'],2) for b in dropBars],short=[a0,end],dj=s['dj'],note=s.get('note',''))
    out.append(item)
    print(s['id'],a['bpm'],'drops@bars',dropBars,'short',[a0,end],round((end-a0)*240/a['bpm']),'s')
    print('   ',' | '.join(f"{x[0]}-{x[1]} {x[3]}" for x in S))
json.dump(out,open('/workspace/festival/music/tracks.json','w'),indent=0)
