from pathlib import Path

p = Path('src/App.tsx')
s = p.read_text()
old = """      <primitive object={model} position={metrics.offset}/>
      {bones.head ? createPortal(<group scale={1/metrics.uniform}><FaceAndHair avatar={avatar}/></group>, bones.head) : null}
      {bones.spine2 ? createPortal(<group scale={1/metrics.uniform}><ClothingDetail avatar={avatar}/></group>, bones.spine2) : null}
      {bones.leftHand ? createPortal(<group scale={1/metrics.uniform}><HandPolish skin={avatar.skin} side={-1}/></group>, bones.leftHand) : null}
      {bones.rightHand ? createPortal(<group scale={1/metrics.uniform}><HandPolish skin={avatar.skin} side={1}/></group>, bones.rightHand) : null}
      {bones.leftFoot ? createPortal(<group scale={1/metrics.uniform}><ShoePolish color={avatar.shoesColor} side={-1}/></group>, bones.leftFoot) : null}
      {bones.rightFoot ? createPortal(<group scale={1/metrics.uniform}><ShoePolish color={avatar.shoesColor} side={1}/></group>, bones.rightFoot) : null}
"""
new = """      <primitive object={model} position={metrics.offset}/>
      {/* Run 7 stabilization: keep the rigged mesh clean while the art overlays are recalibrated. */}
"""
if old not in s:
    raise SystemExit('expected Run 7 overlay block not found')
s = s.replace(old, new, 1)
p.write_text(s)
print('Run 7 avatar stabilized')
