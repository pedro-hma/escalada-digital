import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';

type MoveState = 'IDLE' | 'WALK' | 'RUN';
type Role = 'ESTAGIÁRIO' | 'JÚNIOR' | 'PLENO' | 'SÊNIOR' | 'CEO';
type SkillKey = 'java' | 'web' | 'mobile' | 'ia' | 'devops';
type BodyType = 'slim' | 'regular' | 'broad';
type FaceShape = 'soft' | 'oval' | 'angular';
type SubscriptionTier = 'free' | 'premium';
type View = 'boot' | 'creator' | 'dashboard' | 'world';
type Vec3 = [number, number, number];

type Avatar = {
  name: string;
  age: number;
  gender: string;
  skin: string;
  hair: string;
  hairStyle: string;
  eyeColor: string;
  bodyType: BodyType;
  faceShape: FaceShape;
  top: string;
  bottom: string;
  shoes: string;
  topColor: string;
  bottomColor: string;
  shoesColor: string;
  accessory: string;
};

type GameState = {
  version: number;
  characterCreated: boolean;
  avatar: Avatar;
  roleIndex: number;
  xp: number;
  energy: number;
  skillPoints: number;
  skills: Record<SkillKey, number>;
  projects: number;
  challengesWon: number;
  day: number;
  nightMode: boolean;
  subscriptionTier: SubscriptionTier;
  ownedCosmetics: string[];
  logs: string[];
};

type Cosmetic = {
  id: string;
  label: string;
  category: 'top' | 'bottom' | 'shoes' | 'accessory';
  premium?: boolean;
};

type PlayerDebug = {
  position: Vec3;
  rotationY: number;
  speed: number;
  state: MoveState;
  zone: string;
  nearby: string;
};

type BoxCollider = { id: string; minX: number; maxX: number; minZ: number; maxZ: number };

const SAVE_KEY = 'escalada-digital-save-v2';
const ROLES: Role[] = ['ESTAGIÁRIO', 'JÚNIOR', 'PLENO', 'SÊNIOR', 'CEO'];
const XP_TO_PROMOTE = [50, 120, 200, 350, Infinity];
const MAX_ENERGY = [60, 80, 100, 120, 150];
const SKILLS: SkillKey[] = ['java', 'web', 'mobile', 'ia', 'devops'];
const SKILL_LABEL: Record<SkillKey, string> = { java: 'Java', web: 'Web', mobile: 'Mobile', ia: 'IA', devops: 'DevOps' };

const COSMETICS: Cosmetic[] = [
  { id: 'camiseta', label: 'Camiseta', category: 'top' },
  { id: 'oversized', label: 'Camiseta Oversized', category: 'top' },
  { id: 'tech-print', label: 'Camiseta Tech', category: 'top' },
  { id: 'moletom', label: 'Moletom', category: 'top' },
  { id: 'sueter', label: 'Suéter', category: 'top' },
  { id: 'bomber', label: 'Bomber', category: 'top' },
  { id: 'cardigan', label: 'Cardigan', category: 'top' },
  { id: 'social', label: 'Camisa Social', category: 'top' },
  { id: 'techwear-neon', label: 'Techwear Neon', category: 'top', premium: true },
  { id: 'cyber-hoodie', label: 'Cyber Hoodie', category: 'top', premium: true },
  { id: 'executive-black', label: 'Executive Black', category: 'top', premium: true },
  { id: 'founder', label: 'Startup Founder', category: 'top', premium: true },
  { id: 'retro-hacker', label: 'Retro Hacker', category: 'top', premium: true },
  { id: 'conference-vip', label: 'Dev Conference VIP', category: 'top', premium: true },
  { id: 'night-deploy', label: 'Night Deploy', category: 'top', premium: true },
  { id: 'golden-ceo', label: 'Golden CEO', category: 'top', premium: true },
  { id: 'jeans', label: 'Jeans', category: 'bottom' },
  { id: 'chino', label: 'Chino', category: 'bottom' },
  { id: 'jogger', label: 'Jogger', category: 'bottom' },
  { id: 'cargo', label: 'Cargo', category: 'bottom' },
  { id: 'rasgado', label: 'Jeans Rasgado', category: 'bottom' },
  { id: 'bermuda', label: 'Bermuda', category: 'bottom' },
  { id: 'saia-midi', label: 'Saia Midi', category: 'bottom' },
  { id: 'tenis', label: 'Tênis', category: 'shoes' },
  { id: 'tech-sneaker', label: 'Tech Sneaker', category: 'shoes' },
  { id: 'loafer', label: 'Loafer', category: 'shoes' },
  { id: 'bota', label: 'Bota Casual', category: 'shoes' },
  { id: 'oculos', label: 'Óculos', category: 'accessory' },
  { id: 'headset', label: 'Headset', category: 'accessory' },
  { id: 'bone', label: 'Boné', category: 'accessory' },
  { id: 'relogio', label: 'Relógio', category: 'accessory' },
  { id: 'mochila', label: 'Mochila', category: 'accessory' },
];

const COLORS = ['#263238', '#1d4ed8', '#0f766e', '#6d28d9', '#991b1b', '#d4a373', '#e5e7eb', '#111827'];
const SKINS = ['#f4c7a1', '#e7b58e', '#c98d67', '#a66a4a', '#73462f', '#4b2d21'];
const HAIRS = ['#171717', '#4a2b1c', '#8b5e34', '#c98332', '#d1d5db', '#16a34a', '#06b6d4'];
const EYES = ['#3b6f57', '#5b3824', '#2f5f8f', '#5b4a86', '#7b6f55', '#232323'];

const DEFAULT_AVATAR: Avatar = {
  name: 'dev_anonimo', age: 22, gender: 'Prefiro não informar', skin: '#c98d67', hair: '#171717', hairStyle: 'curto',
  eyeColor: '#3b6f57', bodyType: 'regular', faceShape: 'oval', top: 'moletom', bottom: 'jeans', shoes: 'tenis',
  topColor: '#263238', bottomColor: '#20314f', shoesColor: '#e5e7eb', accessory: 'oculos',
};

function initialGame(): GameState {
  return {
    version: 2, characterCreated: false, avatar: DEFAULT_AVATAR, roleIndex: 0, xp: 0, energy: 60, skillPoints: 0,
    skills: { java: 0, web: 0, mobile: 0, ia: 0, devops: 0 }, projects: 0, challengesWon: 0, day: 1,
    nightMode: false, subscriptionTier: 'free', ownedCosmetics: [], logs: ['> sistema iniciado', '> aguardando criação do personagem...'],
  };
}

function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem('escalada-digital-github-v1');
    if (!raw) return initialGame();
    const parsed = JSON.parse(raw);
    return {
      ...initialGame(), ...parsed, version: 2,
      avatar: { ...DEFAULT_AVATAR, ...(parsed.avatar || parsed) },
      skills: { ...initialGame().skills, ...(parsed.skills || {}) },
      subscriptionTier: parsed.subscriptionTier === 'premium' ? 'premium' : 'free',
      ownedCosmetics: Array.isArray(parsed.ownedCosmetics) ? parsed.ownedCosmetics : [],
    };
  } catch { return initialGame(); }
}

function canUseCosmetic(item: Cosmetic, game: GameState, debugPremium = false) {
  return !item.premium || debugPremium || game.subscriptionTier === 'premium' || game.ownedCosmetics.includes(item.id);
}

function classifyRigBone(name: string) {
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

  useEffect(() => () => { mixer.stopAllAction(); }, [mixer]);
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

const WORLD = {
  buildings: [
    { id:'empresa', label:'EMPRESA', pos:[-4,1.5,-4] as Vec3, size:[5,3,4] as Vec3, color:'#17252c' },
    { id:'casa', label:'CASA', pos:[4,1.2,-3.5] as Vec3, size:[4,2.4,3.2] as Vec3, color:'#243423' },
    { id:'loja', label:'LOJA', pos:[6.5,1,3.5] as Vec3, size:[3,2,3] as Vec3, color:'#33273d' },
  ],
  npcs: [
    { id:'ana', name:'Ana', role:'Dev Júnior', pos:[-1.4,0,-.4] as Vec3, top:'#0e7490' },
    { id:'carlos', name:'Carlos', role:'RH', pos:[2,0,1.2] as Vec3, top:'#6d28d9' },
  ],
};

function collides(x:number,z:number,r:number,boxes:BoxCollider[]) { return boxes.some(c=>x+r>c.minX&&x-r<c.maxX&&z+r>c.minZ&&z-r<c.maxZ); }

function WorldScene({ avatar, onDebug, debugPremium }: { avatar: Avatar; onDebug:(d:PlayerDebug)=>void; debugPremium:boolean }) {
  const player = useRef<THREE.Group>(null); const keys = useRef<Record<string,boolean>>({}); const velocity = useRef(new THREE.Vector3()); const facing = useRef(0);
  const moveState = useRef<MoveState>('IDLE'); const [renderState,setRenderState] = useState<MoveState>('IDLE'); const nearbyRef = useRef(''); const [nearby,setNearby] = useState('');
  const [doors,setDoors] = useState<Record<string,boolean>>({}); const doorsRef = useRef(doors); const [message,setMessage] = useState(''); const orbitYaw = useRef(0); const orbitPitch = useRef(.25); const dragging = useRef(false); const last = useRef([0,0]); const debugTimer=useRef(0);
  const { camera, gl } = useThree();
  useEffect(()=>{ doorsRef.current=doors; },[doors]);
  const interact = useCallback(()=>{
    const id=nearbyRef.current; if(!id)return;
    if(id==='porta-empresa'||id==='porta-casa'){ setDoors(v=>({...v,[id]:!v[id]})); setMessage(doorsRef.current[id]?'Porta fechada.':'Porta aberta.'); }
    else if(id==='ana') setMessage('Ana: “Esse bug não vai se resolver sozinho 😅”');
    else if(id==='carlos') setMessage('Carlos: “Passa no RH quando tiver um minuto.”');
    else if(id==='banco') setMessage('Você observa o banco. Em uma run futura poderá sentar.');
    window.setTimeout(()=>setMessage(''),2200);
  },[]);
  useEffect(()=>{
    const down=(e:KeyboardEvent)=>{ keys.current[e.code]=true; if(e.code==='KeyE'&&!e.repeat) interact(); };
    const up=(e:KeyboardEvent)=>{ keys.current[e.code]=false; };
    const blur=()=>{ keys.current={}; };
    window.addEventListener('keydown',down); window.addEventListener('keyup',up); window.addEventListener('blur',blur);
    return()=>{ window.removeEventListener('keydown',down); window.removeEventListener('keyup',up); window.removeEventListener('blur',blur); };
  },[interact]);
  useEffect(()=>{
    const el=gl.domElement; const pd=(e:PointerEvent)=>{ if(e.pointerType==='mouse'&&e.button!==0)return; dragging.current=true; last.current=[e.clientX,e.clientY]; el.setPointerCapture?.(e.pointerId); };
    const pm=(e:PointerEvent)=>{ if(!dragging.current)return; const dx=e.clientX-last.current[0],dy=e.clientY-last.current[1]; last.current=[e.clientX,e.clientY]; orbitYaw.current-=dx*.006; orbitPitch.current=THREE.MathUtils.clamp(orbitPitch.current+dy*.004,-.15,.72); };
    const pu=()=>{dragging.current=false;}; el.addEventListener('pointerdown',pd); el.addEventListener('pointermove',pm); el.addEventListener('pointerup',pu); el.addEventListener('pointercancel',pu); return()=>{el.removeEventListener('pointerdown',pd);el.removeEventListener('pointermove',pm);el.removeEventListener('pointerup',pu);el.removeEventListener('pointercancel',pu);};
  },[gl]);
  const boxes=useMemo<BoxCollider[]>(()=>[
    {id:'empresa',minX:-6.5,maxX:-1.5,minZ:-6,maxZ:-2.12},{id:'casa',minX:2,maxX:6,minZ:-5.1,maxZ:-2.08},{id:'loja',minX:5,maxX:8,minZ:2,maxZ:5},{id:'poste',minX:-.32,maxX:.32,minZ:-3.35,maxZ:-2.65},{id:'banco',minX:-3.4,maxX:-1.9,minZ:2.7,maxZ:3.2}
  ],[]);
  useFrame((_,dtRaw)=>{
    const dt=Math.min(dtRaw,.05); if(!player.current)return; const p=player.current.position;
    const f=Number(keys.current.KeyW||keys.current.ArrowUp)-Number(keys.current.KeyS||keys.current.ArrowDown); const s=Number(keys.current.KeyD||keys.current.ArrowRight)-Number(keys.current.KeyA||keys.current.ArrowLeft); const running=!!(keys.current.ShiftLeft||keys.current.ShiftRight);
    const input=new THREE.Vector3(s,0,-f); if(input.lengthSq()>0)input.normalize(); input.applyAxisAngle(new THREE.Vector3(0,1,0),orbitYaw.current); const target=input.multiplyScalar(input.lengthSq()>0?(running?4.6:2.6):0); velocity.current.lerp(target,1-Math.exp(-dt*10));
    const nx=THREE.MathUtils.clamp(p.x+velocity.current.x*dt,-10.5,10.5); const nz=THREE.MathUtils.clamp(p.z+velocity.current.z*dt,-8.5,8.5);
    if(!collides(nx,p.z,.34,boxes))p.x=nx;else velocity.current.x=0; if(!collides(p.x,nz,.34,boxes))p.z=nz;else velocity.current.z=0;
    const speed=velocity.current.length(); const ns:MoveState=speed<.14?'IDLE':running?'RUN':'WALK'; if(ns!==moveState.current){moveState.current=ns;setRenderState(ns);} if(speed>.12){const tr=Math.atan2(velocity.current.x,velocity.current.z);facing.current=THREE.MathUtils.lerp(facing.current,tr,1-Math.exp(-dt*12));player.current.rotation.y=facing.current;}
    const dist=4.5; const pitch=orbitPitch.current; const desired=new THREE.Vector3(p.x+Math.sin(orbitYaw.current)*dist*Math.cos(pitch),p.y+1.65+Math.sin(pitch)*dist,p.z+Math.cos(orbitYaw.current)*dist*Math.cos(pitch)); camera.position.lerp(desired,1-Math.exp(-dt*8)); camera.lookAt(p.x,p.y+1.15,p.z);
    const candidates:[string,number][]=[['porta-empresa',Math.hypot(p.x+4,p.z+1.92)],['porta-casa',Math.hypot(p.x-4,p.z+1.87)],['ana',Math.hypot(p.x+1.4,p.z+.4)],['carlos',Math.hypot(p.x-2,p.z-1.2)],['banco',Math.hypot(p.x+2.7,p.z-2.45)]]; candidates.sort((a,b)=>a[1]-b[1]); const near=candidates[0][1]<1.45?candidates[0][0]:''; if(near!==nearbyRef.current){nearbyRef.current=near;setNearby(near);}
    debugTimer.current+=dt; if(debugTimer.current>.12){debugTimer.current=0;onDebug({position:[p.x,p.y,p.z],rotationY:player.current.rotation.y,speed,state:ns,zone:'centro-dev',nearby:near});}
  });
  const npcAvatar=(top:string):Avatar=>({...DEFAULT_AVATAR,name:'NPC',topColor:top,top:'camiseta',accessory:'none'});
  return <>
    <color attach="background" args={['#08110e']}/><fog attach="fog" args={['#08110e',12,28]}/><ambientLight intensity={1.35}/><directionalLight position={[5,9,5]} intensity={2.2} castShadow shadow-mapSize={[1024,1024]}/><pointLight position={[-7,4,-2]} color="#22d3ee" intensity={10}/><pointLight position={[7,3,3]} color="#6dff9e" intensity={8}/>
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[28,24]}/><meshStandardMaterial color="#15211b"/></mesh><mesh rotation={[-Math.PI/2,0,0]} position={[0,.012,0]}><planeGeometry args={[5.4,24]}/><meshStandardMaterial color="#1f2937"/></mesh><mesh rotation={[-Math.PI/2,0,0]} position={[0,.02,0]}><planeGeometry args={[.12,24]}/><meshStandardMaterial color="#d6c873"/></mesh>
    {WORLD.buildings.map(b=><group key={b.id}><mesh position={b.pos} castShadow receiveShadow><boxGeometry args={b.size}/><meshStandardMaterial color={b.color} roughness={.9}/></mesh><Html position={[b.pos[0],b.pos[1]+b.size[1]/2+.35,b.pos[2]]} center><span className="world-label">{b.label}</span></Html></group>)}
    <Door id="porta-empresa" position={[-4,.9,-1.94]} open={!!doors['porta-empresa']}/><Door id="porta-casa" position={[4,.85,-1.88]} open={!!doors['porta-casa']}/>
    <mesh position={[0,1,-3]}><cylinderGeometry args={[.08,.1,2,10]}/><meshStandardMaterial color="#4b5563"/></mesh><mesh position={[0,2.05,-3]}><sphereGeometry args={[.18,10,8]}/><meshStandardMaterial color="#dbeafe" emissive="#67e8f9" emissiveIntensity={.5}/></mesh>
    <group position={[-2.7,.3,2.9]}><mesh><boxGeometry args={[1.25,.16,.42]}/><meshStandardMaterial color="#6b4f36"/></mesh>{[-.48,.48].map(x=><mesh key={x} position={[x,-.3,0]}><boxGeometry args={[.1,.6,.1]}/><meshStandardMaterial color="#4b3828"/></mesh>)}</group>
    {[-8,-7,8].map((x,i)=><group key={i} position={[x,0,i===1?3:-1]}><mesh position={[0,.65,0]}><cylinderGeometry args={[.12,.18,1.3,10]}/><meshStandardMaterial color="#5c3b24"/></mesh><mesh position={[0,1.65,0]}><sphereGeometry args={[.7,12,8]}/><meshStandardMaterial color="#275c39"/></mesh></group>)}
    {WORLD.npcs.map(n=><group key={n.id} position={n.pos}><Character3D avatar={npcAvatar(n.top)} scale={.82}/><Html position={[0,2.55,0]} center><span className="npc-label">{n.name} · {n.role}</span></Html></group>)}
    <group ref={player} position={[0,0,5]}><Character3D avatar={debugPremium?{...avatar,top:avatar.top}:avatar} state={renderState}/></group>
    {nearby&&<Html fullscreen><div className="interaction">E · {nearby.startsWith('porta-')?'ABRIR / FECHAR':nearby==='ana'||nearby==='carlos'?'CONVERSAR':'INTERAGIR'}</div></Html>}{message&&<Html fullscreen><div className="toast">{message}</div></Html>}
  </>;
}

function Door({position,open}:{id:string;position:Vec3;open:boolean}) { return <group position={position} rotation={[0,open?-Math.PI/2:0,0]}><mesh position={[.52,0,0]} castShadow><boxGeometry args={[1.04,1.75,.1]}/><meshStandardMaterial color="#274338"/></mesh><mesh position={[.95,0,.08]}><sphereGeometry args={[.04,8,8]}/><meshStandardMaterial color="#fbbf24"/></mesh></group>; }

function Boot({onStart}:{onStart:()=>void}) { const [pct,setPct]=useState(0); useEffect(()=>{const id=window.setInterval(()=>setPct(p=>Math.min(100,p+8)),60);return()=>clearInterval(id);},[]); return <main className="boot"><div className="terminal"><div className="logo">ESCALADA DIGITAL</div><p>&gt; carregando carreira.dev</p><p>&gt; world_runtime... OK</p><p>&gt; character_system... OK</p><div className="bootbar"><i style={{width:`${pct}%`}}/></div><button className="primary" disabled={pct<100} onClick={onStart}>&gt; INICIAR TURNO</button></div></main>; }

function Creator({game,onChange,onSave,onPremium}:{game:GameState;onChange:(a:Avatar)=>void;onSave:()=>void;onPremium:()=>void}) {
  const a=game.avatar; const set=<K extends keyof Avatar>(k:K,v:Avatar[K])=>onChange({...a,[k]:v});
  const equip=(item:Cosmetic)=>{ if(!canUseCosmetic(item,game)){onPremium();return;} set(item.category,item.id as never); };
  return <main className="creator page"><section className="creator-grid"><div><div className="eyebrow">RUN 1–3 · PERSONAGEM</div><h1>Crie seu DEV</h1><p className="muted">Avatar 3D procedural, preparado para locomoção e futuras animações.</p><Preview3D avatar={a}/></div><div className="creator-form card"><div className="form-row"><label>Nome<input value={a.name} maxLength={24} onChange={e=>set('name',e.target.value)}/></label><label>Idade<input type="number" min={18} max={60} value={a.age} onChange={e=>set('age',Math.max(18,Math.min(60,Number(e.target.value))))}/></label></div><label>Gênero<select value={a.gender} onChange={e=>set('gender',e.target.value)}><option>Masculino</option><option>Feminino</option><option>Não-binário</option><option>Prefiro não informar</option></select></label><div className="section-title">Pele</div><div className="swatches">{SKINS.map(c=><button key={c} className={a.skin===c?'selected':''} style={{background:c}} onClick={()=>set('skin',c)}/>)}</div><div className="section-title">Cabelo</div><div className="swatches">{HAIRS.map(c=><button key={c} className={a.hair===c?'selected':''} style={{background:c}} onClick={()=>set('hair',c)}/>)}</div><div className="chips">{['curto','cacheado','longo','coque','raspado'].map(x=><button key={x} className={a.hairStyle===x?'active':''} onClick={()=>set('hairStyle',x)}>{x}</button>)}</div><div className="section-title">Olhos</div><div className="swatches">{EYES.map(c=><button key={c} className={a.eyeColor===c?'selected':''} style={{background:c}} onClick={()=>set('eyeColor',c)}/>)}</div><div className="form-row"><label>Corpo<select value={a.bodyType} onChange={e=>set('bodyType',e.target.value as BodyType)}><option value="slim">Slim</option><option value="regular">Regular</option><option value="broad">Broad</option></select></label><label>Rosto<select value={a.faceShape} onChange={e=>set('faceShape',e.target.value as FaceShape)}><option value="soft">Soft</option><option value="oval">Oval</option><option value="angular">Angular</option></select></label></div><div className="section-title">Roupas · FREE / DEV+</div>{(['top','bottom','shoes','accessory'] as const).map(cat=><div key={cat} className="cosmetics"><b>{cat}</b><div className="chips">{COSMETICS.filter(x=>x.category===cat).map(item=><button key={item.id} className={(a[cat]===item.id?'active ':'')+(item.premium?'premium':'')} onClick={()=>equip(item)}>{item.premium?'🔒 DEV+ ':''}{item.label}</button>)}</div></div>)}<div className="color-grid"><label>Cor superior<input type="color" value={a.topColor} onChange={e=>set('topColor',e.target.value)}/></label><label>Cor inferior<input type="color" value={a.bottomColor} onChange={e=>set('bottomColor',e.target.value)}/></label><label>Calçado<input type="color" value={a.shoesColor} onChange={e=>set('shoesColor',e.target.value)}/></label></div><button className="primary wide" onClick={onSave}>{game.characterCreated?'SALVAR PERSONAGEM':'COMEÇAR CARREIRA'}</button></div></section></main>;
}

function Dashboard({game,setGame,onWorld,onEdit,onPremium}:{game:GameState;setGame:React.Dispatch<React.SetStateAction<GameState>>;onWorld:()=>void;onEdit:()=>void;onPremium:()=>void}) {
  const role=ROLES[game.roleIndex]; const max=MAX_ENERGY[game.roleIndex]; const threshold=XP_TO_PROMOTE[game.roleIndex];
  const log=(text:string)=>setGame(g=>({...g,logs:[`> ${text}`,...g.logs].slice(0,12)}));
  const grantXp=(amount:number)=>setGame(g=>{const bonus=g.nightMode?5:0;const total=amount+bonus;const old=Math.floor(g.xp/5),next=Math.floor((g.xp+total)/5);return{...g,xp:g.xp+total,skillPoints:g.skillPoints+(next-old),logs:[`> +${total} XP${bonus?' (modo noturno)':''}`,...g.logs].slice(0,12)}});
  const work=()=>{if(game.energy<15){log('energia insuficiente para trabalhar');return;}setGame(g=>({...g,energy:g.energy-15,projects:g.projects+1}));grantXp(12+Math.floor(Math.random()*17));};
  const study=(skill:SkillKey)=>{if(game.energy<10){log('energia insuficiente para estudar');return;}setGame(g=>({...g,energy:g.energy-10,skills:{...g.skills,[skill]:g.skills[skill]+1}}));grantXp(skill==='ia'?20:skill==='devops'?15:skill==='java'?12:5);};
  const rest=()=>setGame(g=>({...g,day:g.day+1,energy:Math.min(MAX_ENERGY[g.roleIndex],g.energy+20),logs:[`> descanso concluído · dia ${g.day+1}`,...g.logs].slice(0,12)}));
  const challenge=()=>{if(game.energy<10){log('energia insuficiente para desafio');return;}const sum=Object.values(game.skills).reduce((a,b)=>a+b,0);const chance=Math.min(90,42+sum*3+game.roleIndex*5);const ok=Math.random()*100<chance;setGame(g=>({...g,energy:g.energy-10,challengesWon:g.challengesWon+(ok?1:0)}));if(ok)grantXp(15+Math.floor(Math.random()*16));else log('desafio falhou — revise as skills');};
  const promote=()=>{if(game.roleIndex>=4)return;if(game.xp<threshold){log(`faltam ${threshold-game.xp} XP para promoção`);return;}const skill=Object.values(game.skills).reduce((a,b)=>a+b,0);const chance=Math.min(92,45+skill*3+game.energy*.15);if(Math.random()*100<chance)setGame(g=>({...g,roleIndex:g.roleIndex+1,energy:Math.min(MAX_ENERGY[g.roleIndex+1],g.energy+25),logs:[`> PROMOÇÃO! ${ROLES[g.roleIndex+1]}`,...g.logs].slice(0,12)}));else log('promoção negada — fortaleça skills e energia');};
  return <main className="page dashboard"><header className="hero-panel"><div><div className="eyebrow">ESCALADA DIGITAL · SINGLE PLAYER</div><h1>{game.avatar.name}</h1><p>{game.avatar.age} anos · {game.avatar.gender} · Dia {game.day}</p></div><div className="header-actions"><button className="ghost" onClick={onEdit}>Editar personagem</button><button className="devplus" onClick={onPremium}>DEV+</button><span className="badge">{role}</span></div></header><section className="dashboard-grid"><div className="card profile-card"><Preview3D avatar={game.avatar}/><div><div className="stat"><span>XP</span><b>{game.xp}{Number.isFinite(threshold)?` / ${threshold}`:''}</b></div><div className="bar"><i style={{width:`${role==='CEO'?100:Math.min(100,game.xp/threshold*100)}%`}}/></div><div className="stat"><span>Energia</span><b>{game.energy} / {max}</b></div><div className="bar energy"><i style={{width:`${game.energy/max*100}%`}}/></div><div className="mini-stats"><span>Projetos <b>{game.projects}</b></span><span>Desafios <b>{game.challengesWon}</b></span><span>Pontos <b>{game.skillPoints}</b></span></div></div></div><div className="card"><div className="eyebrow">CARREIRA</div><div className="career">{ROLES.map((r,i)=><div key={r} className={i===game.roleIndex?'current':i<game.roleIndex?'done':''}><span>{i+1}</span><b>{r}</b></div>)}</div><div className="actions"><button onClick={work}>💻 Trabalhar<small>-15 energia</small></button><button onClick={challenge}>🐞 Desafio da Empresa<small>-10 energia</small></button><button onClick={rest}>🛋 Descansar<small>+20 energia · +1 dia</small></button><button onClick={()=>setGame(g=>({...g,nightMode:!g.nightMode}))}>🌙 Modo Noturno<small>{game.nightMode?'ATIVO · +5 XP':'desativado'}</small></button><button className="promote" onClick={promote}>⬆ Tentar promoção<small>{role==='CEO'?'você chegou ao topo':`requer ${threshold} XP`}</small></button></div></div><div className="card"><div className="eyebrow">SKILLS</div><div className="skills">{SKILLS.map(s=><button key={s} onClick={()=>study(s)}><span>{SKILL_LABEL[s]}</span><b>Lv {game.skills[s]}</b><small>Estudar · -10 energia</small></button>)}</div></div><div className="card launch-card"><div><div className="eyebrow">RUN 3 + RUN 4</div><h2>WORLD DEV LAB</h2><p>Rua, casa, empresa, loja, NPCs, colisão, portas, interação e câmera em terceira pessoa.</p></div><button className="primary" onClick={onWorld}>ENTRAR NO MUNDO 3D</button></div><div className="card feed"><div className="eyebrow">TERMINAL</div>{game.logs.map((x,i)=><p key={i}>{x}</p>)}</div></section></main>;
}

function World({game,onBack}:{game:GameState;onBack:()=>void}) { const [debug,setDebug]=useState<PlayerDebug>({position:[0,0,5],rotationY:0,speed:0,state:'IDLE',zone:'centro-dev',nearby:''});const [sim,setSim]=useState(false);return <main className="world-screen"><div className="canvas-wrap"><Canvas camera={{position:[0,2.3,9.5],fov:48}} shadows dpr={[1,1.5]} gl={{antialias:true,powerPreference:'high-performance'}}><WorldScene avatar={game.avatar} onDebug={setDebug} debugPremium={sim}/></Canvas></div><div className="world-topbar"><div><strong>WORLD DEV LAB</strong><span>WASD/setas · Shift correr · arraste para girar câmera · E interagir</span></div><div className="world-buttons"><label className="sim-toggle"><input type="checkbox" checked={sim} onChange={e=>setSim(e.target.checked)}/> SIMULAR DEV+ (debug)</label><button onClick={onBack}>VOLTAR AO DASHBOARD</button></div></div><aside className="debug-panel"><b>PLAYER_CONTROLLER</b><span>position <em>{debug.position.map(n=>n.toFixed(2)).join(' · ')}</em></span><span>rotationY <em>{debug.rotationY.toFixed(2)}</em></span><span>velocity <em>{debug.speed.toFixed(2)} m/s</em></span><span>state <em>{debug.state}</em></span><span>zone <em>{debug.zone}</em></span><span>nearby <em>{debug.nearby||'—'}</em></span></aside><div className="mobile-controls"><div><button onPointerDown={()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'}))} onPointerUp={()=>window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'}))}>▲</button><div><button onPointerDown={()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyA'}))} onPointerUp={()=>window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyA'}))}>◀</button><button onPointerDown={()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyS'}))} onPointerUp={()=>window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyS'}))}>▼</button><button onPointerDown={()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyD'}))} onPointerUp={()=>window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyD'}))}>▶</button></div></div><button onClick={()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE'}))}>E</button></div></main>; }

function PremiumModal({onClose}:{onClose:()=>void}) { return <div className="modal-backdrop" onClick={onClose}><section className="premium-modal" onClick={e=>e.stopPropagation()}><div className="eyebrow">DEV+ PREMIUM</div><h2>Cosméticos premium</h2><p>Itens DEV+ são somente cosméticos e não dão vantagem de XP, energia ou promoção.</p><div className="premium-list">{COSMETICS.filter(x=>x.premium).map(x=><span key={x.id}>🔒 {x.label}</span>)}</div><div className="price">Preço definido no lançamento</div><button className="primary wide" disabled>Checkout será conectado em uma run futura</button><button className="ghost wide" onClick={onClose}>Fechar</button></section></div>; }

export default function App(){ const [game,setGame]=useState<GameState>(()=>loadGame()); const [view,setView]=useState<View>('boot'); const [premium,setPremium]=useState(false); useEffect(()=>{localStorage.setItem(SAVE_KEY,JSON.stringify(game));},[game]); const afterBoot=()=>setView(game.characterCreated?'dashboard':'creator'); const saveCharacter=()=>{setGame(g=>({...g,characterCreated:true,logs:[`> personagem ${g.avatar.name} salvo`,...g.logs].slice(0,12)}));setView('dashboard');}; return <>{view==='boot'&&<Boot onStart={afterBoot}/>} {view==='creator'&&<Creator game={game} onChange={avatar=>setGame(g=>({...g,avatar}))} onSave={saveCharacter} onPremium={()=>setPremium(true)}/>} {view==='dashboard'&&<Dashboard game={game} setGame={setGame} onWorld={()=>setView('world')} onEdit={()=>setView('creator')} onPremium={()=>setPremium(true)}/>} {view==='world'&&<World game={game} onBack={()=>setView('dashboard')}/>} {premium&&<PremiumModal onClose={()=>setPremium(false)}/>}</>; }
