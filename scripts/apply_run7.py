from pathlib import Path

p = Path('src/App.tsx')
s = p.read_text()

start = s.index('function HeadStyle(')
end = s.index("\nuseGLTF.preload('/models/human.glb');", start)

replacement = r'''function FaceAndHair({ avatar }: { avatar: Avatar }) {
  const hair = avatar.hair;
  const skin = avatar.skin;
  const eye = avatar.eyeColor;
  const soft = avatar.faceShape === 'soft';
  const angular = avatar.faceShape === 'angular';
  const faceX = soft ? 1.04 : angular ? .96 : 1;
  const faceY = avatar.faceShape === 'oval' ? 1.04 : 1;
  const hairStyle = avatar.hairStyle;

  return <group scale={[faceX, faceY, 1]}>
    {/* soft face shell hides most of the raw faceted head while keeping the rig */}
    <mesh position={[0,.015,.015]} scale={[.95,1.02,.94]} castShadow>
      <sphereGeometry args={[.305,40,30]}/>
      <meshPhysicalMaterial color={skin} roughness={.72} clearcoat={.06} clearcoatRoughness={.7}/>
    </mesh>
    <mesh position={[0,-.165,.03]} scale={[.77,.52,.82]} castShadow>
      <sphereGeometry args={[.30,36,26]}/>
      <meshPhysicalMaterial color={skin} roughness={.74}/>
    </mesh>
    {/* ears */}
    {[-1,1].map(sg => <mesh key={`ear-${sg}`} position={[sg*.292,-.02,0]} scale={[.055,.09,.035]} castShadow>
      <sphereGeometry args={[1,22,16]}/><meshPhysicalMaterial color={skin} roughness={.76}/>
    </mesh>)}
    {/* eyes + lids */}
    {[-1,1].map(sg => <group key={`eye-${sg}`} position={[sg*.105,.035,.285]}>
      <mesh scale={[.075,.052,.026]}><sphereGeometry args={[1,28,20]}/><meshPhysicalMaterial color="#fffaf3" roughness={.35}/></mesh>
      <mesh position={[0,0,.027]} scale={[.031,.031,.014]}><sphereGeometry args={[1,24,18]}/><meshStandardMaterial color={eye} roughness={.38}/></mesh>
      <mesh position={[0,0,.039]} scale={[.013,.013,.007]}><sphereGeometry args={[1,20,14]}/><meshStandardMaterial color="#111827" roughness={.3}/></mesh>
      <mesh position={[-.006,.008,.047]} scale={[.005,.005,.003]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={.08}/></mesh>
    </group>)}
    {/* brows */}
    {[-1,1].map(sg => <mesh key={`brow-${sg}`} position={[sg*.105,.115,.306]} rotation={[0,0,sg*.06]} scale={[.082,.014,.014]}>
      <capsuleGeometry args={[1,1,5,12]}/><meshStandardMaterial color={hair} roughness={.82}/>
    </mesh>)}
    {/* nose bridge + tip */}
    <mesh position={[0,-.015,.315]} rotation={[Math.PI/2,0,0]} scale={[.033,.052,.033]}>
      <capsuleGeometry args={[1,1,6,16]}/><meshPhysicalMaterial color={skin} roughness={.7}/>
    </mesh>
    <mesh position={[0,-.07,.337]} scale={[.045,.032,.032]}><sphereGeometry args={[1,20,14]}/><meshPhysicalMaterial color={skin} roughness={.68}/></mesh>
    {/* mouth: subtle lips rather than a painted slit */}
    <mesh position={[0,-.155,.315]} scale={[.085,.017,.014]}><capsuleGeometry args={[1,1,5,18]}/><meshStandardMaterial color="#a85f62" roughness={.65}/></mesh>
    <mesh position={[0,-.171,.312]} scale={[.067,.012,.011]}><capsuleGeometry args={[1,1,5,18]}/><meshStandardMaterial color="#87464c" roughness={.68}/></mesh>

    {/* hair cap with actual volume */}
    {hairStyle !== 'careca' && <>
      <mesh position={[0,.205,-.035]} scale={[1.03,.72,1.03]} castShadow>
        <sphereGeometry args={[.322,36,24,0,Math.PI*2,0,Math.PI*.62]}/>
        <meshPhysicalMaterial color={hair} roughness={.82}/>
      </mesh>
      {hairStyle !== 'raspado' && hairStyle !== 'cacheado' && <>
        <mesh position={[-.14,.32,.09]} rotation={[0,0,-.58]} scale={[.085,.25,.09]} castShadow><capsuleGeometry args={[1,1,6,16]}/><meshPhysicalMaterial color={hair} roughness={.84}/></mesh>
        <mesh position={[-.045,.365,.11]} rotation={[0,0,-.25]} scale={[.095,.28,.10]} castShadow><capsuleGeometry args={[1,1,6,16]}/><meshPhysicalMaterial color={hair} roughness={.84}/></mesh>
        <mesh position={[.07,.37,.105]} rotation={[0,0,.15]} scale={[.10,.27,.10]} castShadow><capsuleGeometry args={[1,1,6,16]}/><meshPhysicalMaterial color={hair} roughness={.84}/></mesh>
        <mesh position={[.17,.325,.08]} rotation={[0,0,.55]} scale={[.075,.22,.085]} castShadow><capsuleGeometry args={[1,1,6,16]}/><meshPhysicalMaterial color={hair} roughness={.84}/></mesh>
      </>}
      {hairStyle === 'cacheado' && [-.20,-.10,0,.10,.20].map((x,i)=><mesh key={i} position={[x,.32-Math.abs(x)*.2,.06]} scale={[.095,.095,.085]} castShadow><sphereGeometry args={[1,20,14]}/><meshPhysicalMaterial color={hair} roughness={.9}/></mesh>)}
      {hairStyle === 'longo' && <mesh position={[0,-.06,-.245]} scale={[.24,.36,.105]} castShadow><capsuleGeometry args={[1,1,8,20]}/><meshPhysicalMaterial color={hair} roughness={.86}/></mesh>}
      {hairStyle === 'coque' && <mesh position={[0,.445,-.06]} castShadow><sphereGeometry args={[.13,22,16]}/><meshPhysicalMaterial color={hair} roughness={.86}/></mesh>}
    </>}

    {avatar.accessory === 'oculos' && <group position={[0,.035,.338]}>
      {[-1,1].map(sg => <mesh key={sg} position={[sg*.106,0,0]} scale={[1,.78,1]}><torusGeometry args={[.077,.011,10,32]}/><meshStandardMaterial color="#101318" roughness={.28} metalness={.28}/></mesh>)}
      <mesh><boxGeometry args={[.075,.012,.012]}/><meshStandardMaterial color="#101318" roughness={.25} metalness={.28}/></mesh>
      {[-1,1].map(sg => <mesh key={`temple-${sg}`} position={[sg*.195,.01,-.045]} rotation={[0,sg*.22,0]}><boxGeometry args={[.16,.011,.011]}/><meshStandardMaterial color="#101318" roughness={.25}/></mesh>)}
    </group>}
    {avatar.accessory === 'headset' && <group position={[0,.06,0]}>
      <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[.335,.027,10,36,Math.PI]}/><meshStandardMaterial color="#15191c" roughness={.42}/></mesh>
      {[-1,1].map(sg => <mesh key={sg} position={[sg*.31,-.03,0]} scale={[.06,.115,.045]}><boxGeometry args={[1,1,1]}/><meshStandardMaterial color="#15191c" roughness={.45}/></mesh>)}
    </group>}
  </group>;
}

function HandPolish({ skin, side }: { skin:string; side:1|-1 }) {
  return <group position={[side*.01,-.005,.005]}>
    <mesh scale={[.07,.11,.045]} castShadow><capsuleGeometry args={[1,1,7,18]}/><meshPhysicalMaterial color={skin} roughness={.72}/></mesh>
    <mesh position={[side*.065,-.015,.018]} rotation={[0,0,side*.55]} scale={[.022,.075,.022]} castShadow><capsuleGeometry args={[1,1,6,14]}/><meshPhysicalMaterial color={skin} roughness={.72}/></mesh>
  </group>;
}

function ClothingDetail({ avatar }: { avatar: Avatar }) {
  const top = avatar.topColor, bottom = avatar.bottomColor, shoes = avatar.shoesColor;
  const premium = ['techwear-neon','cyber-hoodie','night-deploy','golden-ceo'].includes(avatar.top);
  return <group>
    {/* torso shell: creates separation from the body and a readable hem */}
    <mesh position={[0,.03,.005]} scale={[.48,.55,.29]} castShadow>
      <capsuleGeometry args={[1,1,8,26]}/>
      <meshPhysicalMaterial color={top} roughness={.82} clearcoat={.035} emissive={premium?top:'#000'} emissiveIntensity={premium?.10:0}/>
    </mesh>
    <mesh position={[0,-.46,.02]} scale={[.43,.055,.255]} castShadow><torusGeometry args={[1,.20,10,32]}/><meshPhysicalMaterial color={top} roughness={.82}/></mesh>
    {/* waist/belt transition so top and pants do not form a painted zig-zag */}
    <mesh position={[0,-.54,.01]} scale={[.39,.075,.24]} castShadow><cylinderGeometry args={[1,1,1,28]}/><meshPhysicalMaterial color={bottom} roughness={.88}/></mesh>
  </group>;
}

function ShoePolish({ color, side }: { color:string; side:1|-1 }) {
  return <group position={[side*.01,-.045,.075]}>
    <mesh position={[0,0,.08]} scale={[.11,.065,.20]} castShadow><capsuleGeometry args={[1,1,6,18]}/><meshPhysicalMaterial color={color} roughness={.58}/></mesh>
    <mesh position={[0,-.055,.09]} scale={[.12,.025,.205]} castShadow><boxGeometry args={[1,1,1]}/><meshStandardMaterial color="#d9dde2" roughness={.72}/></mesh>
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
    const targetHeight = 1.82;
    return { uniform: targetHeight / Math.max(.001, size.y), offset: new THREE.Vector3(-center.x, -box.min.y, -center.z) };
  }, [model]);

  const bones = useMemo(() => ({
    head: model.getObjectByName('Head') as THREE.Bone|undefined,
    spine2: model.getObjectByName('Spine2') as THREE.Bone|undefined,
    leftHand: model.getObjectByName('LeftHand') as THREE.Bone|undefined,
    rightHand: model.getObjectByName('RightHand') as THREE.Bone|undefined,
    leftFoot: model.getObjectByName('LeftFoot') as THREE.Bone|undefined,
    rightFoot: model.getObjectByName('RightFoot') as THREE.Bone|undefined,
    leftShoulder: model.getObjectByName('LeftShoulder') as THREE.Bone|undefined,
    rightShoulder: model.getObjectByName('RightShoulder') as THREE.Bone|undefined,
  }), [model]);

  useEffect(() => {
    model.traverse((obj) => {
      const mesh = obj as THREE.SkinnedMesh;
      const mats = mesh.userData.avatarMaterials as THREE.MeshStandardMaterial[]|undefined;
      if (!mats) return;
      const skinTint = new THREE.Color(avatar.skin).lerp(new THREE.Color('#ffffff'), .12);
      mats[0].color.copy(skinTint); mats[0].roughness=.74; mats[0].metalness=0;
      mats[1].color.set(avatar.topColor); mats[1].roughness=.87;
      mats[2].color.set(avatar.bottomColor); mats[2].roughness=.9;
      mats[3].color.set(avatar.shoesColor); mats[3].roughness=.64;
      mats.forEach(m => { m.flatShading=false; m.needsUpdate=true; });
      if (mesh.geometry) { mesh.geometry.computeVertexNormals(); mesh.geometry.normalizeNormals(); }
    });

    const broad = avatar.bodyType==='broad', slim=avatar.bodyType==='slim';
    if (bones.head) bones.head.scale.set(avatar.faceShape==='soft'?.95:avatar.faceShape==='angular'?.90:.93, avatar.faceShape==='oval'?.96:.92, .93);
    if (bones.spine2) bones.spine2.scale.set(broad?1.07:slim?.95:1.01,1,broad?1.035:slim?.97:1.0);
    if (bones.leftShoulder) bones.leftShoulder.scale.set(broad?1.08:slim?.95:1.01,1,1);
    if (bones.rightShoulder) bones.rightShoulder.scale.set(broad?1.08:slim?.95:1.01,1,1);
  }, [avatar.skin, avatar.topColor, avatar.bottomColor, avatar.shoesColor, avatar.bodyType, avatar.faceShape, model, bones]);

  useEffect(() => {
    const wanted = state==='RUN'?'run':state==='WALK'?'walk':'idle';
    const clip = animations.find(a=>a.name.toLowerCase().includes(wanted));
    if (!clip) return;
    const action = mixer.clipAction(clip);
    action.reset().setEffectiveWeight(1).setEffectiveTimeScale(state==='RUN'?1.02:state==='IDLE'?.82:.96).fadeIn(.22).play();
    return () => { action.fadeOut(.22); };
  }, [animations,mixer,state]);

  useEffect(() => () => { mixer.stopAllAction(); }, [mixer]);
  useFrame((_,dt)=>mixer.update(Math.min(dt,.045)));

  const bodyX=avatar.bodyType==='broad'?1.055:avatar.bodyType==='slim'?.955:1;
  const bodyZ=avatar.bodyType==='broad'?1.035:avatar.bodyType==='slim'?.975:1;

  return <group scale={scale}>
    <group scale={[metrics.uniform*bodyX,metrics.uniform,metrics.uniform*bodyZ]}>
      <primitive object={model} position={metrics.offset}/>
      {bones.head ? createPortal(<FaceAndHair avatar={avatar}/>, bones.head) : null}
      {bones.spine2 ? createPortal(<ClothingDetail avatar={avatar}/>, bones.spine2) : null}
      {bones.leftHand ? createPortal(<HandPolish skin={avatar.skin} side={-1}/>, bones.leftHand) : null}
      {bones.rightHand ? createPortal(<HandPolish skin={avatar.skin} side={1}/>, bones.rightHand) : null}
      {bones.leftFoot ? createPortal(<ShoePolish color={avatar.shoesColor} side={-1}/>, bones.leftFoot) : null}
      {bones.rightFoot ? createPortal(<ShoePolish color={avatar.shoesColor} side={1}/>, bones.rightFoot) : null}
    </group>
  </group>;
}

function Preview3D({ avatar }: { avatar: Avatar }) {
  return <div className="preview3d">
    <Canvas camera={{position:[0,.28,3.15],fov:32}} shadows dpr={[1,1.8]} gl={{antialias:true,powerPreference:'high-performance'}}>
      <color attach="background" args={['#06100d']}/>
      <fog attach="fog" args={['#06100d',4.3,8]}/>
      <hemisphereLight args={['#dff7ff','#0d2018',1.35]}/>
      <directionalLight position={[2.6,4.8,3.6]} intensity={2.25} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}/>
      <directionalLight position={[-2.8,2.5,2]} intensity={.72} color="#b8d9ff"/>
      <pointLight position={[-2.4,1.8,1.7]} color="#22d3ee" intensity={1.45}/>
      <pointLight position={[2.6,2.2,-1]} color="#a855f7" intensity={.62}/>
      <Suspense fallback={null}><group position={[0,-.90,0]}><Character3D avatar={avatar}/></group></Suspense>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.91,0]} receiveShadow><circleGeometry args={[1.12,72]}/><meshPhysicalMaterial color="#0a1711" roughness={.82} metalness={.04}/></mesh>
      <OrbitControls makeDefault target={[0,.02,0]} enablePan={false} minDistance={2.25} maxDistance={4.4} minPolarAngle={Math.PI*.27} maxPolarAngle={Math.PI*.69} rotateSpeed={.68} dampingFactor={.08} enableDamping/>
    </Canvas>
    <div className="preview-hint">↔ arraste para girar · scroll/pinça para zoom</div>
  </div>;
}
'''

s = s[:start] + replacement + s[end:]
p.write_text(s)
print('Run 7 character art pass applied')
