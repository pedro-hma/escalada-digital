from pathlib import Path

p = Path('src/App.tsx')
s = p.read_text()
preload = "useGLTF.preload('/models/human.glb');"
preload_idx = s.index(preload)
old_preview_idx = s.index('function Preview3D(', preload_idx)
world_idx = s.index('\nconst WORLD = {', old_preview_idx)
s = s[:preload_idx] + preload + '\n' + s[world_idx:]
p.write_text(s)
print('Removed duplicated Preview3D from Run 7 patch')
