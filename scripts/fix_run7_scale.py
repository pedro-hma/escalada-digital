from pathlib import Path
p=Path('src/App.tsx')
s=p.read_text()
old="""      {bones.head ? createPortal(<FaceAndHair avatar={avatar}/>, bones.head) : null}
      {bones.spine2 ? createPortal(<ClothingDetail avatar={avatar}/>, bones.spine2) : null}
      {bones.leftHand ? createPortal(<HandPolish skin={avatar.skin} side={-1}/>, bones.leftHand) : null}
      {bones.rightHand ? createPortal(<HandPolish skin={avatar.skin} side={1}/>, bones.rightHand) : null}
      {bones.leftFoot ? createPortal(<ShoePolish color={avatar.shoesColor} side={-1}/>, bones.leftFoot) : null}
      {bones.rightFoot ? createPortal(<ShoePolish color={avatar.shoesColor} side={1}/>, bones.rightFoot) : null}"""
new="""      {bones.head ? createPortal(<group scale={1/metrics.uniform}><FaceAndHair avatar={avatar}/></group>, bones.head) : null}
      {bones.spine2 ? createPortal(<group scale={1/metrics.uniform}><ClothingDetail avatar={avatar}/></group>, bones.spine2) : null}
      {bones.leftHand ? createPortal(<group scale={1/metrics.uniform}><HandPolish skin={avatar.skin} side={-1}/></group>, bones.leftHand) : null}
      {bones.rightHand ? createPortal(<group scale={1/metrics.uniform}><HandPolish skin={avatar.skin} side={1}/></group>, bones.rightHand) : null}
      {bones.leftFoot ? createPortal(<group scale={1/metrics.uniform}><ShoePolish color={avatar.shoesColor} side={-1}/></group>, bones.leftFoot) : null}
      {bones.rightFoot ? createPortal(<group scale={1/metrics.uniform}><ShoePolish color={avatar.shoesColor} side={1}/></group>, bones.rightFoot) : null}"""
if old not in s:
    raise SystemExit('portal block not found')
s=s.replace(old,new)
p.write_text(s)
print('Run 7 overlay scaling fixed')
