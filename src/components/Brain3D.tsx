import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { apiFetch } from '../lib/api';

export function Brain3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<{ [key: string]: THREE.Mesh }>({});
  const [modules, setModules] = useState<any[]>([]);

  useEffect(() => {
    // Initial fetch of real modules
    apiFetch<{ modules: any[] }>('/modules/status').then(data => {
        setModules(data.modules);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!mountRef.current || modules.length === 0) return;

    const isDark = document.documentElement.classList.contains('dark');
    const bgColor = isDark ? 0x020408 : 0xf8fafc;
    const accentColor = isDark ? 0x00FFFF : 0x0ea5e9;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, 0.05);

    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.2 : 0.8);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(accentColor, 1, 100);
    pointLight.position.set(0, 0, 10);
    scene.add(pointLight);

    const geometry = new THREE.SphereGeometry(0.8, 32, 32);
    
    modules.forEach((mod, index) => {
      const isOnline = mod.status === 'online';
      const nodeColor = isOnline ? (isDark ? 0x333333 : 0xcccccc) : 0xff3838;
      
      const material = new THREE.MeshStandardMaterial({ 
        color: nodeColor,
        emissive: isOnline ? (isDark ? 0x111111 : 0xeeeeee) : 0x440000,
        emissiveIntensity: 0.5,
        wireframe: true 
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      const angle = (index / modules.length) * Math.PI * 2;
      const radius = 6;
      mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      
      nodesRef.current[mod.name] = mesh;
      scene.add(mesh);
    });

    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: isDark ? 0x6e00ff : 0x6366f1, 
      transparent: true, 
      opacity: 0.3 
    });
    const points = modules.map(m => nodesRef.current[m.name].position);
    if(points.length > 0) points.push(points[0]);
    
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      scene.rotation.y += 0.002;
      scene.rotation.x += 0.001;

      Object.values(nodesRef.current).forEach((mesh: THREE.Mesh) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat.emissiveIntensity > 0.5) {
          mat.emissiveIntensity -= 0.05;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleWSEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { type } = customEvent.detail;
      
      const eventMap: Record<string, string> = {
        'THINK_START': 'brain_router',
        'MEMORY_SEARCH': 'brain_memory',
        'ROUTER_DECISION': 'brain_router',
        'THINK_DONE': 'brain_logic',
        'THINK_ERROR': 'brain_logic'
      };

      const targetMod = eventMap[type];
      if (targetMod && nodesRef.current[targetMod]) {
        const mesh = nodesRef.current[targetMod];
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissive.setHex(accentColor);
        mat.emissiveIntensity = 4.0;
      }
    };

    window.addEventListener('neuro_ws_event', handleWSEvent);

    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('neuro_ws_event', handleWSEvent);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (mountRef.current && renderer.domElement.parentElement === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [modules]);

  return <div ref={mountRef} className="w-full h-full min-h-[400px] transition-colors duration-500" />;
}
