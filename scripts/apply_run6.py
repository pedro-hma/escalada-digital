from pathlib import Path

p = Path('src/App.tsx')
s = p.read_text()

s = s.replace("import { Canvas, useFrame, useThree } from '@react-three/fiber';", "import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber';")
s = s.replace("import { Html, OrbitControls } from '@react-three/drei';", "import { Html, OrbitControls, useGLTF } from '@react-three/drei';")
s = s.replace("import { useCallback, useEffect, useMemo, useRef, useState } from 'react';", "import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';")
if "SkeletonUtils" not in s:
    s = s.replace("import * as THREE from 'three';", "import * as THREE from 'three';\nimport { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';")

start = s.index('function Character3D(')
end = s.index('\nconst WORLD = {', start)

replacement = r'''function classifyRigBone(name: string) {
  const n = name.toLowerCase();
  if (n.includes('foot') || n.includes('toe')) return 3; // shoes
  if (n.includes('upleg') || (n.includes('leg') && !n.includes('fore')) || n === 'hips') return 2; // pants
  if (n.includes('spine') || n.includes('shoulder') || n.includes('forearm') || (n.includes('arm') && !n.includes('armature'))) return 1; // top
  return 0; // exposed skin / head / hands
}

function prepareAvatarMesh(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.SkinnedMesh;
    if (!mesh.isSkinnedMesh || !mesh.geometry) return;

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const geometry = mesh.geometry.clone();
    mesh.geometry = geometry;

    const skinIndex = geometry.getAttribute('skinIndex') as THREE.BufferAttribute | undefined;
    const skinWeight = geometry.getAttribute('skinWeight') as THREE.BufferAttribute | undefined;
    if (!skinIndex || !skinWeight || !mesh.skeleton) return;

    const sourceIndex = geometry.index
      ? Array.from(geometry.index.array as ArrayLike<number>)
      : Array.from({ length: geometry.getAttribute('position').count }, (_, i) => i);

    const buckets: number[][] = [[], [], [], []];
    const get4 = (a: THREE.BufferAttribute, i: number) => [a.getX(i), a.getY(i), a.getZ(i), a.getW(i)];

    for (let t = 0; t < sourceIndex.length; t += 3) {
      const score = [0, 0, 0, 0];
      for (let k = 0; k < 3; k++) {
        const vi = sourceIndex[t + k];
        const ids = get4(skinIndex, vi);
        const weights = get4(skinWeight, vi);
        for (let j = 0; j < 4; j++) {
          const bone = mesh.skeleton.bones[Math.round(ids[j])];
          if (!bone) continue;
          score[classifyRigBone(bone.name)] += weights[j];
        }
      }
      let category = 0;
      for (let i = 1; i < 4; i++) if (score[i] > score[category]) category = i;
      buckets[category].push(sourceIndex[t], sourceIndex[t + 1], sourceIndex[t + 2]);
    }

    const reordered = buckets.flat();
    geometry.setIndex(reordered);
    geometry.clearGroups();
    let cursor = 0;
    buckets.forEach((indices, materialIndex) => {
      if (indices.length) geometry.addGroup(cursor, indices.length, materialIndex);
      cursor += indices.length;
    });

    const sourceMaterial = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const sourceMap = sourceMaterial instanceof THREE.MeshStandardMaterial ? sourceMaterial.map : null;
    const materials = [
      new THREE.MeshStandardMaterial({ color: '#ffffff', map: sourceMap, roughness: .72, metalness: 0 }),
      new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: .86, metalness: 0 }),
      new THREE.MeshStandardMaterial({ color: '#142b4e', roughness: .9, metalness: 0 }),
      new THREE.MeshStandardMaterial({ color: '#f3f4f6', roughness: .62, metalness: 0 }),
    ];
    materials.forEach((m) => { m.skinning = true; });
    mesh.material = materials;
    mesh.userData.avatarMaterials = materials;
  });
  return root;
}

function HeadStyle({ avatar }: { avatar: Avatar }) {
  const longHair = avatar.hairStyle === 'longo';
  const curls = avatar.hairStyle === 'cacheado';
  const bun = avatar.hairStyle === 'coque';
  const shaved = avatar.hairStyle === 'raspado';
  return <group>
    <mesh position={[0,.23,-.025]} scale={[1,.86,1]} castShadow>
      <sphereGeometry args={[.31,28,20,0,Math.PI*2,0,Math.PI/2]}/>
      <meshStandardMaterial color={avatar.hair} roughness={.8}/>
    </mesh>
    {!shaved && !curls && <>
      <mesh position={[-.10,.38,.05]} rotation={[0,0,-.35]} scale={[.9,.6,.75]} castShadow>
        <capsuleGeometry args={[.085,.20,6,14]}/><meshStandardMaterial color={avatar.hair} roughness={.78}/>
      </mesh>
      <mesh position={[.04,.40,.08]} rotation={[0,0,.16]} scale={[1,.65,.78]} castShadow>
        <capsuleGeometry args={[.09,.23,6,14]}/><meshStandardMaterial color={avatar.hair} roughness={.78}/>
      </mesh>
      <mesh position={[.16,.34,.04]} rotation={[0,0,.52]} scale={[.82,.58,.7]} castShadow>
        <capsuleGeometry args={[.075,.16,6,14]}/><meshStandardMaterial color={avatar.hair} roughness={.78}/>
      </mesh>
    </>}
    {curls && [-.2,-.1,0,.1,.2].map((x,i)=><mesh key={i} position={[x,.32-Math.abs(x)*.18,.02]} scale={[.085,.085,.075]} castShadow><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={avatar.hair} roughness={.9}/></mesh>)}
    {longHair && <mesh position={[0,-.03,-.24]} scale={[.25,.44,.11]} castShadow><capsuleGeometry args={[1,1,8,18]}/><meshStandardMaterial color={avatar.hair} roughness={.86}/></mesh>}
    {bun && <mesh position={[0,.46,-.06]} castShadow><sphereGeometry args={[.13,18,14]}/><meshStandardMaterial color={avatar.hair} roughness={.86}/></mesh>}

    {avatar.accessory === 'oculos' && <group position={[0,.055,.305]}>
      {[-1,1].map((sg)=><mesh key={sg} position={[sg*.105,0,0]} scale={[1,.78,1]}><torusGeometry args={[.072,.012,8,24]}/><meshStandardMaterial color="#101214" roughness={.4} metalness={.18}/></mesh>)}
      <mesh position={[0,0,0]}><boxGeometry args={[.07,.012,.012]}/><meshStandardMaterial color="#101214"/></mesh>
      {[-1,1].map((sg)=><mesh key={`temple-${sg}`} position={[sg*.19,.005,-.035]} rotation={[0,sg*.22,0]}><boxGeometry args={[.15,.012,.012]}/><meshStandardMaterial color="#101214"/></mesh>)}
    </group>}
    {avatar.accessory === 'headset' && <group position={[0,.08,0]}>
      <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[.33,.027,8,28,Math.PI]}/><meshStandardMaterial color="#15191c" roughness={.45}/></mesh>
      {[-1,1].map(sg=><mesh key={sg} position={[sg*.31,-.02,0]} scale={[.06,.11,.04]}><boxGeometry args={[1,1,1]}/><meshStandardMaterial color="#15191c"/></mesh>)}
    </group>}
  </group>;
}

function Character3D({ avatar, state = 'IDLE', scale = 1 }: { avatar: Avatar; state?: MoveState; scale?: number }) {
  const { scene, animations } = useGLTF('/models/human.glb');
  const model = useMemo(() => prepareAvatarMesh(cloneSkeleton(scene)), [scene]);
  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);

  const metrics = useMemo(() => {
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const targetHeight = 1.86;
    return {
      uniform: targetHeight / Math.max(.001, size.y),
      offset: new THREE.Vector3(-center.x, -box.min.y, -center.z),
    };
  }, [model]);

  const headBone = useMemo(() => model.getObjectByName('Head') as THREE.Bone | undefined, [model]);

  useEffect(() => {
    model.traverse((obj) => {
      const mesh = obj as THREE.SkinnedMesh;
      const mats = mesh.userData.avatarMaterials as THREE.MeshStandardMaterial[] | undefined;
      if (!mats) return;
      const skinTint = new THREE.Color(avatar.skin).lerp(new THREE.Color('#ffffff'), .36);
      mats[0].color.copy(skinTint);
      mats[1].color.set(avatar.topColor);
      mats[2].color.set(avatar.bottomColor);
      mats[3].color.set(avatar.shoesColor);
      const premium = ['techwear-neon','cyber-hoodie','night-deploy','golden-ceo'].includes(avatar.top);
      mats[1].emissive.set(premium ? avatar.topColor : '#000000');
      mats[1].emissiveIntensity = premium ? .12 : 0;
      mats.forEach(m => { m.needsUpdate = true; });
    });
    if (headBone) {
      const sx = avatar.faceShape === 'soft' ? 1.04 : avatar.faceShape === 'angular' ? .96 : 1;
      const sy = avatar.faceShape === 'oval' ? 1.05 : 1;
      headBone.scale.set(sx, sy, 1);
    }
  }, [avatar.skin, avatar.topColor, avatar.bottomColor, avatar.shoesColor, avatar.top, avatar.faceShape, model, headBone]);

  useEffect(() => {
    const wanted = state === 'RUN' ? 'run' : state === 'WALK' ? 'walk' : 'idle';
    const clip = animations.find((a) => a.name.toLowerCase().includes(wanted));
    if (!clip) return;
    const action = mixer.clipAction(clip);
    action.reset().setEffectiveWeight(1).setEffectiveTimeScale(state === 'RUN' ? 1.05 : 1).fadeIn(.18).play();
    return () => { action.fadeOut(.18); };
  }, [animations, mixer, state]);

  useEffect(() => () => mixer.stopAllAction(), [mixer]);
  useFrame((_, dt) => mixer.update(Math.min(dt, .05)));

  const bodyX = avatar.bodyType === 'broad' ? 1.08 : avatar.bodyType === 'slim' ? .93 : 1;
  const bodyZ = avatar.bodyType === 'broad' ? 1.05 : avatar.bodyType === 'slim' ? .96 : 1;

  return <group scale={scale}>
    <group scale={[metrics.uniform * bodyX, metrics.uniform, metrics.uniform * bodyZ]}>
      <primitive object={model} position={metrics.offset}/>
      {headBone ? createPortal(<HeadStyle avatar={avatar}/>, headBone) : null}
    </group>
  </group>;
}

useGLTF.preload('/models/human.glb');

function Preview3D({ avatar }: { avatar: Avatar }) {
  return <div className="preview3d">
    <Canvas camera={{ position:[0,.20,3.25], fov:34 }} shadows dpr={[1,1.6]} gl={{ antialias:true, powerPreference:'high-performance' }}>
      <color attach="background" args={['#07100d']}/>
      <ambientLight intensity={1.65}/>
      <directionalLight position={[3,5,4]} intensity={2.1} castShadow/>
      <directionalLight position={[-3,3,2]} intensity={.75}/>
      <pointLight position={[-3,2,2]} color="#22d3ee" intensity={3}/>
      <Suspense fallback={null}>
        <group position={[0,-.92,0]}><Character3D avatar={avatar}/></group>
      </Suspense>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.93,0]} receiveShadow><circleGeometry args={[1.05,64]}/><meshStandardMaterial color="#0a1711" roughness={.95}/></mesh>
      <OrbitControls makeDefault target={[0,0,0]} enablePan={false} minDistance={2.35} maxDistance={4.6} minPolarAngle={Math.PI*.28} maxPolarAngle={Math.PI*.68} rotateSpeed={.72}/>
    </Canvas>
    <div className="preview-hint">↔ arraste para girar · scroll/pinça para zoom</div>
  </div>;
}
'''

s = s[:start] + replacement + s[end:]
p.write_text(s)
print('Run 6 avatar rework applied')
