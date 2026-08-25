import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

type MoveState = 'IDLE' | 'WALK' | 'RUN';
type Vec3 = [number, number, number];
type Avatar = {
  name: string;
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  shoes: string;
};
type PlayerDebug = {
  position: Vec3;
  rotationY: number;
  speed: number;
  state: MoveState;
  zone: string;
  nearby: string;
};

type BoxCollider = {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

type DoorState = Record<string, boolean>;

const SAVE_KEY = 'escalada-digital-github-v1';
const DEFAULT_AVATAR: Avatar = {
  name: 'dev_anonimo',
  skin: '#b98262',
  hair: '#171717',
  shirt: '#263238',
  pants: '#20314f',
  shoes: '#e5e7eb',
};

const WORLD = {
  zone: 'centro-dev',
  playerSpawn: [0, 0, 5] as Vec3,
  buildings: [
    { id: 'empresa', label: 'EMPRESA', position: [-4, 1.5, -4] as Vec3, size: [5, 3, 4] as Vec3, color: '#17252c' },
    { id: 'casa', label: 'CASA', position: [4, 1.2, -3.5] as Vec3, size: [4, 2.4, 3.2] as Vec3, color: '#243423' },
    { id: 'loja', label: 'LOJA', position: [6.5, 1, 3.5] as Vec3, size: [3, 2, 3] as Vec3, color: '#33273d' },
  ],
  npcs: [
    { id: 'ana', name: 'Ana', role: 'Dev Júnior', position: [-1.5, 0, -0.5] as Vec3, shirt: '#0e7490' },
    { id: 'carlos', name: 'Carlos', role: 'RH', position: [2, 0, 1.2] as Vec3, shirt: '#6d28d9' },
  ],
  doors: [
    { id: 'porta-empresa', label: 'Porta da Empresa', position: [-4, 0.9, -1.95] as Vec3, rotationY: 0 },
    { id: 'porta-casa', label: 'Porta da Casa', position: [4, 0.85, -1.88] as Vec3, rotationY: 0 },
  ],
};

function Character({ avatar, state = 'IDLE', scale = 1 }: { avatar: Avatar; state?: MoveState; scale?: number }) {
  const root = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const moving = state !== 'IDLE';
    const run = state === 'RUN';
    const freq = run ? 10 : 7;
    const amp = run ? 0.75 : 0.48;
    const swing = moving ? Math.sin(t * freq) * amp : Math.sin(t * 1.5) * 0.035;
    if (armL.current) armL.current.rotation.x = swing;
    if (armR.current) armR.current.rotation.x = -swing;
    if (legL.current) legL.current.rotation.x = -swing * 0.9;
    if (legR.current) legR.current.rotation.x = swing * 0.9;
    if (torso.current) {
      torso.current.position.y = 1.42 + Math.sin(t * (moving ? freq * 2 : 1.6)) * (moving ? 0.018 : 0.012);
      torso.current.rotation.z = moving ? Math.sin(t * freq) * 0.018 : Math.sin(t * 0.65) * 0.012;
    }
    if (head.current) head.current.rotation.y = moving ? 0 : Math.sin(t * 0.45) * 0.08;
    if (root.current) root.current.position.y = moving ? Math.abs(Math.sin(t * freq)) * 0.015 : 0;
  });

  return (
    <group ref={root} scale={scale}>
      <group ref={torso} position={[0, 1.42, 0]}>
        <mesh castShadow scale={[0.92, 1, 0.72]}>
          <capsuleGeometry args={[0.3, 0.55, 6, 14]} />
          <meshStandardMaterial color={avatar.shirt} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.44, 0]}>
          <cylinderGeometry args={[0.1, 0.11, 0.16, 12]} />
          <meshStandardMaterial color={avatar.skin} roughness={0.9} />
        </mesh>
        <group ref={head} position={[0, 0.72, 0]}>
          <mesh castShadow scale={[0.92, 1.02, 0.9]}>
            <sphereGeometry args={[0.28, 18, 14]} />
            <meshStandardMaterial color={avatar.skin} roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.01, 0.275]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.035, 0.09, 8]} />
            <meshStandardMaterial color={avatar.skin} roughness={0.9} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.09, 0.055, 0.247]}>
              <mesh scale={[1.15, 0.75, 0.5]}>
                <sphereGeometry args={[0.048, 12, 10]} />
                <meshStandardMaterial color="#f7f4ef" />
              </mesh>
              <mesh position={[0, 0, 0.035]}>
                <sphereGeometry args={[0.022, 10, 8]} />
                <meshStandardMaterial color="#3b6f57" />
              </mesh>
              <mesh position={[0, 0, 0.05]}>
                <sphereGeometry args={[0.009, 8, 8]} />
                <meshStandardMaterial color="#0b0f0d" />
              </mesh>
              <mesh position={[0, 0.065, 0]} rotation={[0, 0, s * 0.07]}>
                <boxGeometry args={[0.075, 0.015, 0.02]} />
                <meshStandardMaterial color={avatar.hair} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.095, 0.255]} scale={[1.2, 0.45, 0.5]}>
            <torusGeometry args={[0.045, 0.01, 6, 14, Math.PI]} />
            <meshStandardMaterial color="#6f3b35" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.285, 0.01, 0]} scale={[0.5, 0.8, 0.3]}>
              <sphereGeometry args={[0.09, 10, 8]} />
              <meshStandardMaterial color={avatar.skin} />
            </mesh>
          ))}
          <mesh position={[0, 0.13, -0.02]} scale={[1.03, 0.82, 1.02]}>
            <sphereGeometry args={[0.285, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={avatar.hair} roughness={0.95} />
          </mesh>
        </group>
        {[-1, 1].map((s) => (
          <group key={s} ref={s < 0 ? armR : armL} position={[s * 0.38, 0.16, 0]}>
            <mesh position={[0, -0.26, 0]} rotation={[0, 0, s * 0.045]} castShadow>
              <capsuleGeometry args={[0.085, 0.36, 5, 10]} />
              <meshStandardMaterial color={avatar.shirt} roughness={0.8} />
            </mesh>
            <mesh position={[0, -0.56, 0]} castShadow>
              <capsuleGeometry args={[0.072, 0.23, 5, 10]} />
              <meshStandardMaterial color={avatar.skin} roughness={0.9} />
            </mesh>
            <mesh position={[0, -0.75, 0.015]} scale={[0.7, 1, 0.55]}>
              <sphereGeometry args={[0.09, 12, 10]} />
              <meshStandardMaterial color={avatar.skin} />
            </mesh>
          </group>
        ))}
      </group>
      <group position={[0, 0.95, 0]}>
        {[-1, 1].map((s) => (
          <group key={s} ref={s < 0 ? legR : legL} position={[s * 0.15, 0, 0]}>
            <mesh position={[0, -0.37, 0]} castShadow>
              <capsuleGeometry args={[0.105, 0.48, 5, 10]} />
              <meshStandardMaterial color={avatar.pants} roughness={0.85} />
            </mesh>
            <mesh position={[0, -0.76, 0]} castShadow>
              <capsuleGeometry args={[0.09, 0.3, 5, 10]} />
              <meshStandardMaterial color={avatar.pants} roughness={0.85} />
            </mesh>
            <mesh position={[0, -0.97, 0.08]} scale={[1, 0.55, 1.55]} castShadow>
              <boxGeometry args={[0.22, 0.16, 0.28]} />
              <meshStandardMaterial color={avatar.shoes} roughness={0.7} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function collides(x: number, z: number, radius: number, colliders: BoxCollider[]) {
  return colliders.some((c) => x + radius > c.minX && x - radius < c.maxX && z + radius > c.minZ && z - radius < c.maxZ);
}

function WorldScene({ avatar, onDebug }: { avatar: Avatar; onDebug: (d: PlayerDebug) => void }) {
  const player = useRef<THREE.Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const velocity = useRef(new THREE.Vector3());
  const facing = useRef(0);
  const [moveState, setMoveState] = useState<MoveState>('IDLE');
  const [doors, setDoors] = useState<DoorState>({});
  const [message, setMessage] = useState('');
  const [nearby, setNearby] = useState('');
  const { camera } = useThree();

  const colliders = useMemo<BoxCollider[]>(() => [
    { id: 'empresa', minX: -6.5, maxX: -1.5, minZ: -6, maxZ: -2.15 },
    { id: 'casa', minX: 2, maxX: 6, minZ: -5.1, maxZ: -2.1 },
    { id: 'loja', minX: 5, maxX: 8, minZ: 2, maxZ: 5 },
    { id: 'poste-a', minX: -0.3, maxX: 0.3, minZ: -3.3, maxZ: -2.7 },
  ], []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === 'KeyE') interact();
    };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  });

  const interact = () => {
    if (!nearby) return;
    if (nearby.startsWith('porta-')) {
      setDoors((v) => ({ ...v, [nearby]: !v[nearby] }));
      setMessage(doors[nearby] ? 'Porta fechada.' : 'Porta aberta.');
    } else if (nearby === 'ana') setMessage('Ana: “Esse bug não vai se resolver sozinho 😅”');
    else if (nearby === 'carlos') setMessage('Carlos: “Passa no RH quando tiver um minuto.”');
    else setMessage('Objeto inspecionado.');
    window.setTimeout(() => setMessage(''), 2200);
  };

  useFrame((_, dt) => {
    if (!player.current) return;
    const forward = Number(keys.current.KeyW || keys.current.ArrowUp) - Number(keys.current.KeyS || keys.current.ArrowDown);
    const side = Number(keys.current.KeyD || keys.current.ArrowRight) - Number(keys.current.KeyA || keys.current.ArrowLeft);
    const running = !!(keys.current.ShiftLeft || keys.current.ShiftRight);
    const input = new THREE.Vector3(side, 0, -forward);
    const moving = input.lengthSq() > 0;
    if (moving) input.normalize();

    const yaw = Math.atan2(camera.position.x - player.current.position.x, camera.position.z - player.current.position.z);
    input.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const targetSpeed = moving ? (running ? 4.8 : 2.7) : 0;
    const desired = input.multiplyScalar(targetSpeed);
    velocity.current.lerp(desired, 1 - Math.exp(-dt * (moving ? 9 : 12)));

    const oldX = player.current.position.x;
    const oldZ = player.current.position.z;
    const nextX = THREE.MathUtils.clamp(oldX + velocity.current.x * dt, -10.5, 10.5);
    const nextZ = THREE.MathUtils.clamp(oldZ + velocity.current.z * dt, -8.5, 8.5);
    if (!collides(nextX, oldZ, 0.35, colliders)) player.current.position.x = nextX;
    else velocity.current.x = 0;
    if (!collides(player.current.position.x, nextZ, 0.35, colliders)) player.current.position.z = nextZ;
    else velocity.current.z = 0;

    const speed = velocity.current.length();
    const nextState: MoveState = speed < 0.18 ? 'IDLE' : running ? 'RUN' : 'WALK';
    setMoveState((s) => s === nextState ? s : nextState);
    if (speed > 0.12) {
      const targetRot = Math.atan2(velocity.current.x, velocity.current.z);
      facing.current = THREE.MathUtils.lerp(facing.current, targetRot, 1 - Math.exp(-dt * 10));
      player.current.rotation.y = facing.current;
    }

    const p = player.current.position;
    const behind = new THREE.Vector3(0, 2.25, 4.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), facing.current);
    const desiredCam = p.clone().add(behind);
    camera.position.lerp(desiredCam, 1 - Math.exp(-dt * 6));
    camera.lookAt(p.x, 1.35, p.z);

    let n = '';
    for (const door of WORLD.doors) {
      const d = Math.hypot(p.x - door.position[0], p.z - door.position[2]);
      if (d < 1.35) n = door.id;
    }
    for (const npc of WORLD.npcs) {
      const d = Math.hypot(p.x - npc.position[0], p.z - npc.position[2]);
      if (d < 1.4) n = npc.id;
    }
    setNearby((v) => v === n ? v : n);
    onDebug({ position: [p.x, p.y, p.z], rotationY: facing.current, speed, state: nextState, zone: WORLD.zone, nearby: n });
  });

  return (
    <>
      <color attach="background" args={['#07100d']} />
      <fog attach="fog" args={['#07100d', 12, 35]} />
      <ambientLight intensity={0.85} />
      <directionalLight castShadow position={[7, 10, 5]} intensity={2.1} shadow-mapSize={[1024, 1024]} />
      <hemisphereLight args={['#b8f5dd', '#14211a', 0.8]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 24]} />
        <meshStandardMaterial color="#122019" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[22, 4]} />
        <meshStandardMaterial color="#24292c" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, -2.5]}>
        <planeGeometry args={[22, 1.1]} />
        <meshStandardMaterial color="#9aa09e" roughness={1} />
      </mesh>
      {WORLD.buildings.map((b) => (
        <group key={b.id} position={b.position}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={b.size} />
            <meshStandardMaterial color={b.color} roughness={0.9} />
          </mesh>
          <Html center position={[0, b.size[1] / 2 + 0.35, 0]}><span className="world-label">{b.label}</span></Html>
        </group>
      ))}
      {WORLD.doors.map((d) => (
        <group key={d.id} position={d.position} rotation={[0, doors[d.id] ? -Math.PI / 2 : d.rotationY, 0]}>
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[0.9, 1.8, 0.12]} />
            <meshStandardMaterial color={doors[d.id] ? '#3f9b71' : '#76543b'} roughness={0.8} />
          </mesh>
        </group>
      ))}
      {[[-0.1, 1.5, -3], [8, 1.5, -0.5]].map((p, i) => (
        <group key={i} position={p as Vec3}>
          <mesh castShadow><cylinderGeometry args={[0.08, 0.11, 3, 8]} /><meshStandardMaterial color="#30383d" /></mesh>
          <mesh position={[0, 1.45, 0]}><sphereGeometry args={[0.18, 10, 8]} /><meshStandardMaterial emissive="#d7ffe8" emissiveIntensity={2} color="#c9f7df" /></mesh>
        </group>
      ))}
      {WORLD.npcs.map((npc) => (
        <group key={npc.id} position={npc.position}>
          <Character avatar={{ ...DEFAULT_AVATAR, name: npc.name, shirt: npc.shirt }} scale={0.92} />
          <Html center position={[0, 2.65, 0]}><span className="npc-label">{npc.name} · {npc.role}</span></Html>
        </group>
      ))}
      <group ref={player} position={WORLD.playerSpawn}>
        <Character avatar={avatar} state={moveState} />
      </group>
      {nearby && <Html fullscreen><div className="interaction">E · {nearby.startsWith('porta-') ? 'ABRIR / FECHAR' : 'CONVERSAR'}</div></Html>}
      {message && <Html fullscreen><div className="toast">{message}</div></Html>}
    </>
  );
}

function WorldLab({ avatar, onExit }: { avatar: Avatar; onExit: () => void }) {
  const [debug, setDebug] = useState<PlayerDebug>({ position: WORLD.playerSpawn, rotationY: 0, speed: 0, state: 'IDLE', zone: WORLD.zone, nearby: '' });
  return (
    <div className="world-screen">
      <div className="world-topbar">
        <div>
          <strong>WORLD DEV LAB · RUN 4</strong>
          <span>WASD/setas · Shift corre · E interage</span>
        </div>
        <button onClick={onExit}>Voltar ao dashboard</button>
      </div>
      <div className="canvas-wrap">
        <Canvas shadows camera={{ position: [0, 2.5, 8], fov: 48 }}>
          <WorldScene avatar={avatar} onDebug={setDebug} />
        </Canvas>
      </div>
      <aside className="debug-panel">
        <b>PLAYER CONTROLLER</b>
        <span>state: <em>{debug.state}</em></span>
        <span>speed: {debug.speed.toFixed(2)} m/s</span>
        <span>position: {debug.position.map((n) => n.toFixed(2)).join(' · ')}</span>
        <span>rotationY: {debug.rotationY.toFixed(2)}</span>
        <span>zone: {debug.zone}</span>
        <span>nearby: {debug.nearby || '—'}</span>
      </aside>
    </div>
  );
}

export default function App() {
  const [avatar, setAvatar] = useState<Avatar>(() => {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '') || DEFAULT_AVATAR; } catch { return DEFAULT_AVATAR; }
  });
  const [world, setWorld] = useState(false);
  useEffect(() => { localStorage.setItem(SAVE_KEY, JSON.stringify(avatar)); }, [avatar]);

  if (world) return <WorldLab avatar={avatar} onExit={() => setWorld(false)} />;

  return (
    <main className="dashboard">
      <header className="hero-panel">
        <div>
          <p className="eyebrow">ESCALADA DIGITAL · GITHUB EDITION</p>
          <h1>A luta diária de um DEV</h1>
          <p>Base independente do Lovable. React + TypeScript + Three.js/R3F.</p>
        </div>
        <span className="badge">RUN 4</span>
      </header>
      <section className="grid">
        <article className="card profile-card">
          <div className="avatar-preview">
            <Canvas camera={{ position: [0, 1.5, 4.4], fov: 40 }}>
              <ambientLight intensity={1.4} />
              <directionalLight position={[3, 5, 4]} intensity={2} />
              <Character avatar={avatar} scale={0.9} />
            </Canvas>
          </div>
          <div>
            <span className="eyebrow">PERSONAGEM</span>
            <h2>{avatar.name}</h2>
            <p>Estagiário · Lv. 1</p>
            <label>Nome<input value={avatar.name} onChange={(e) => setAvatar({ ...avatar, name: e.target.value.slice(0, 24) })} /></label>
            <div className="swatches">
              {['#263238','#0e7490','#6d28d9','#9f1239','#166534','#7c2d12'].map((c) => <button key={c} aria-label="cor da camiseta" style={{ background: c }} onClick={() => setAvatar({ ...avatar, shirt: c })} />)}
            </div>
          </div>
        </article>
        <article className="card stats-card">
          <span className="eyebrow">CARREIRA</span>
          <h2>ESTAGIÁRIO</h2>
          <div className="stat"><span>XP</span><b>0 / 50</b></div>
          <div className="bar"><i style={{ width: '8%' }} /></div>
          <div className="stat"><span>Energia</span><b>60 / 60</b></div>
          <div className="bar energy"><i style={{ width: '100%' }} /></div>
          <p className="muted">O dashboard completo da carreira será migrado por etapas sem bloquear a evolução do mundo 3D.</p>
        </article>
      </section>
      <section className="card launch-card">
        <div>
          <span className="eyebrow">RUN 4 · CHARACTER CONTROLLER</span>
          <h2>Entrar no WORLD DEV LAB</h2>
          <p>Andar, correr, câmera em terceira pessoa, colisão com construções e interação com portas/NPCs.</p>
        </div>
        <button className="primary" onClick={() => setWorld(true)}>JOGAR RUN 4 →</button>
      </section>
      <footer>Escalada Digital · fonte agora versionada no GitHub</footer>
    </main>
  );
}
