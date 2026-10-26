/* Self-hosted, progressively loaded WebGL sculpture. Native scrolling stays free. */
(() => {
  'use strict';
  const root = document.querySelector('[data-sculpture]');
  if (!root) return;
  const host = root.querySelector('[data-model-canvas]');
  const fallback = root.querySelector('[data-model-fallback]');
  const status = root.querySelector('[data-model-status]');
  const loadButton = root.querySelector('[data-model-load]');
  const playButton = root.querySelector('[data-model-play]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let loading = false;
  let ready = false;
  let startRender = () => {};
  let stopRender = () => {};
  let syncMotion = () => {};

  async function init() {
    if (loading || ready) return;
    loading = true;
    loadButton.hidden = true;
    status.textContent = 'Dein 3D-Erlebnis wird geladen.';
    let renderer;
    try {
      const [T, { OrbitControls }, { RoomEnvironment }] = await Promise.all([
        import('./vendor/three.module.js'),
        import('./vendor/OrbitControls.js'),
        import('./vendor/RoomEnvironment.js')
      ]);
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 761 ? 1.4 : 1.75));
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFSoftShadowMap;
      const canvas = renderer.domElement;
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', 'Dreidimensionales Kaiser-K. Zum Drehen ziehen oder die Pfeiltasten unter dem Modell verwenden.');
      host.append(canvas);

      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(35, 1, .1, 60);
      camera.position.set(3.5, 1.7, 7.8);
      const controls = new OrbitControls(camera, canvas);
      controls.target.set(0, -.16, 0);
      controls.enableDamping = true;
      controls.dampingFactor = .07;
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.minPolarAngle = Math.PI * .20;
      controls.maxPolarAngle = Math.PI * .72;
      controls.autoRotateSpeed = .65;
      controls.rotateSpeed = .65;
      controls.update();
      controls.saveState();
      const room = new RoomEnvironment();
      const pmrem = new T.PMREMGenerator(renderer);
      const environment = pmrem.fromScene(room, .04);
      scene.environment = environment.texture;
      scene.environmentIntensity = 1.1;
      room.dispose(); pmrem.dispose();
      scene.add(new T.HemisphereLight(0xcbdcff, 0x12101e, 1.1));
      const key = new T.DirectionalLight(0xffffff, 4.2);
      key.position.set(2.5, 5.5, 5); key.castShadow = true;
      key.shadow.mapSize.set(innerWidth < 761 ? 1024 : 2048, innerWidth < 761 ? 1024 : 2048);
      Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: .1, far: 18 });
      key.shadow.normalBias = .035; key.shadow.bias = -.0002;
      scene.add(key);
      const cyan = new T.PointLight(0x16d8f3, 55, 15, 2); cyan.position.set(-3, 1.5, 2.6); scene.add(cyan);
      const violet = new T.PointLight(0x9350ff, 70, 15, 2); violet.position.set(3, 2, -1); scene.add(violet);
      const fill = new T.DirectionalLight(0xb3a7ff, 1.8); fill.position.set(-3, 1, -4); scene.add(fill);

      const shape = new T.Shape();
      [[-1.15,-1.48],[-1.15,1.48],[-.59,1.48],[-.59,.31],[.61,1.48],[1.37,1.48],[.02,.01],[1.45,-1.48],[.65,-1.48],[-.59,-.22],[-.59,-1.48]].forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));
      shape.closePath();
      const geometry = new T.ExtrudeGeometry(shape, { depth: .34, bevelEnabled: true, bevelThickness: .085, bevelSize: .065, bevelSegments: 6, steps: 1, curveSegments: 12 });
      geometry.center();
      const sculpture = new T.Group(); scene.add(sculpture);
      const front = new T.MeshPhysicalMaterial({ color: 0xe3eaf3, metalness: 1, roughness: .19, clearcoat: 1, clearcoatRoughness: .16, envMapIntensity: 1.25 });
      const side = new T.MeshPhysicalMaterial({ color: 0x738398, metalness: 1, roughness: .23, clearcoat: .9, envMapIntensity: 1.25 });
      const letter = new T.Mesh(geometry, [front, side]);
      letter.castShadow = true; letter.receiveShadow = true;
      sculpture.add(letter);
      const rim = new T.Mesh(geometry, new T.MeshPhysicalMaterial({ color: 0x28c7dd, emissive: 0x128da8, emissiveIntensity: .32, metalness: .6, roughness: .22 }));
      rim.scale.set(1.028,1.025,.9); rim.position.z=-.07; sculpture.add(rim);
      sculpture.rotation.set(-.03, -.20, -.015);

      const base = new T.Mesh(new T.CylinderGeometry(1.72,1.80,.14,96), new T.MeshPhysicalMaterial({ color:0x101721,metalness:.72,roughness:.26,clearcoat:1 }));
      base.position.y=-1.88; base.receiveShadow=true; scene.add(base);
      const ring = new T.Mesh(new T.TorusGeometry(1.74,.008,8,160),new T.MeshBasicMaterial({color:0x39d9e8,transparent:true,opacity:.5}));
      ring.rotation.x=Math.PI/2;ring.position.y=-1.82;scene.add(ring);
      const ground = new T.Mesh(new T.PlaneGeometry(30,30),new T.ShadowMaterial({color:0x000000,opacity:.38}));
      ground.rotation.x=-Math.PI/2;ground.position.y=-1.96;ground.receiveShadow=true;scene.add(ground);
      const satellites=[];
      [[-1.88,.82,.25,.15],[1.83,.98,-.3,.13],[-1.58,-.72,.5,.085],[1.75,-.4,.4,.085]].forEach(([x,y,z,size],i)=>{
        const cube=new T.Mesh(new T.BoxGeometry(size,size,size),new T.MeshPhysicalMaterial({color:i%2?0xa985f2:0x78d4e4,metalness:.8,roughness:.22,clearcoat:1}));
        cube.position.set(x,y,z);cube.rotation.set(.4,.6,.3);sculpture.add(cube);satellites.push(cube);
      });

      let frame=0, previous=0, elapsed=0, userPaused=reduced.matches;
      const running=()=>visible&&!document.hidden;
      const syncPlay=()=>{
        controls.autoRotate=!userPaused;
        playButton.setAttribute('aria-pressed',String(controls.autoRotate));
        playButton.setAttribute('aria-label',controls.autoRotate?'Automatische Drehung pausieren':'Automatische Drehung starten');
        playButton.textContent=controls.autoRotate?'Ⅱ':'▶';
      };
      function request(){if(!frame&&running())frame=requestAnimationFrame(draw);}
      function draw(now){
        frame=0;if(!running()){previous=0;return;}
        const dt=previous?Math.min((now-previous)/1000,.05):1/60;previous=now;
        const changed=controls.update(dt);
        if(controls.autoRotate){elapsed+=dt;sculpture.position.y=Math.sin(elapsed*.7)*.045;satellites.forEach((cube,i)=>{cube.rotation.y+=dt*(.12+i*.03);});}
        renderer.render(scene,camera);
        if(controls.autoRotate||changed)request();else previous=0;
      }
      startRender=request;
      stopRender=()=>{cancelAnimationFrame(frame);frame=0;previous=0;};
      syncMotion=()=>{if(reduced.matches)userPaused=true;syncPlay();request();};
      controls.addEventListener('change',request);
      controls.addEventListener('start',()=>{userPaused=true;syncPlay();request();});
      playButton.addEventListener('click',()=>{userPaused=controls.autoRotate;syncPlay();request();});
      root.querySelector('[data-model-reset]').addEventListener('click',()=>{controls.reset();sculpture.position.y=0;request();});
      root.querySelectorAll('[data-model-turn]').forEach(button=>button.addEventListener('click',()=>{
        userPaused=true;syncPlay();
        const offset=camera.position.clone().sub(controls.target);
        offset.applyAxisAngle(new T.Vector3(0,1,0),Number(button.dataset.modelTurn)*Math.PI/8);
        camera.position.copy(controls.target).add(offset);controls.update();request();
      }));
      const materials={chrome:{color:0xe3eaf3,metalness:1,roughness:.19,transmission:0,thickness:0,ior:1.5},obsidian:{color:0x111827,metalness:.75,roughness:.2,transmission:0,thickness:0,ior:1.5},glass:{color:0xc4edff,metalness:0,roughness:.065,transmission:.96,thickness:.6,ior:1.46}};
      root.querySelectorAll('[data-model-material]').forEach(button=>button.addEventListener('click',()=>{
        const name=button.dataset.modelMaterial;
        front.setValues(materials[name]);side.setValues(materials[name]);
        front.needsUpdate=true;side.needsUpdate=true;
        root.querySelectorAll('[data-model-material]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
        root.dataset.modelMaterial=name;request();
      }));
      function resize(){
        const width=host.clientWidth,height=host.clientHeight;if(!width||!height)return;
        camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);request();
      }
      new ResizeObserver(resize).observe(host);
      canvas.addEventListener('webglcontextlost',event=>{
        event.preventDefault();stopRender();canvas.hidden=true;fallback.hidden=false;
        status.textContent='Die 3D-Ansicht wurde angehalten. Lade die Seite neu, um sie erneut zu öffnen.';
        root.querySelectorAll('button:not([data-model-load])').forEach(b=>b.disabled=true);
      });
      ready=true;loading=false;root.dataset.modelReady='true';root.dataset.modelMaterial='chrome';
      root.querySelectorAll('button:not([data-model-load])').forEach(button=>button.disabled=false);
      fallback.hidden=true;syncPlay();resize();request();
    } catch(error) {
      renderer?.dispose();host.querySelector('canvas')?.remove();loading=false;
      status.textContent='Die interaktive 3D-Ansicht ist in diesem Browser gerade nicht verfügbar.';
      loadButton.textContent='3D-Ansicht erneut laden ↗';loadButton.hidden=false;
    }
  }
  loadButton.addEventListener('click',init);
  reduced.addEventListener('change',()=>syncMotion());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopRender();else startRender();});
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      visible=entries[0].isIntersecting;
      if(visible){
        if(navigator.connection?.saveData&&!ready){status.textContent='3D-Ansicht auf Wunsch laden.';loadButton.hidden=false;}
        else init();
        startRender();
      }else stopRender();
    },{rootMargin:'180px'});
    observer.observe(root);
  }else{visible=true;init();}
})();
