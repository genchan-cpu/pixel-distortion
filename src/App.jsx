import React, {
  useRef,
  useLayoutEffect,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Canvas, useThree, extend, useFrame } from "@react-three/fiber";
import {
  OrthographicCamera,
  OrbitControls,
  useTexture,
  shaderMaterial,
} from "@react-three/drei";
import * as THREE from "three";
import { vertexShader, fragmentShader } from "./Shader";
import { useControls } from "leva";
import image01 from "/01.jpg";

const EffectMaterial = shaderMaterial(
  {
    uTexture: null,
    uDataTexture: null,
    uTextureResolution: new THREE.Vector2(1, 1),
    uResolution: new THREE.Vector2(1, 1),
    uTime: 0.0,
  },
  vertexShader,
  fragmentShader
);

extend({ EffectMaterial });

const FitPlane = () => {
  const { grid, mouseFactor, strength, relaxation } = useControls({
    grid: { value: 30, min: 2, max: 500, step: 1 },
    mouseFactor: { value: 0.25, min: 0, max: 1, step: 0.01 },
    strength: { value: 0.15, min: 0, max: 1, step: 0.01 },
    relaxation: { value: 0.9, min: 0, max: 1, step: 0.01 },
  });

  const mouse = useRef({
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    vX: 0,
    vY: 0,
  });

  const { viewport, size, pointer } = useThree();
  const materialRef = useRef();
  const texture = useTexture(image01);

  const dataTexture = useMemo(() => {
    const size = grid;
    const data = new Float32Array(4 * size * size);

    for (let i = 0; i < size * size; i++) {
      const r = Math.random() * 255 - 125;
      const r1 = Math.random() * 255 - 125;
      const stride = i * 4;
      data[stride] = r;
      data[stride + 1] = r1;
      data[stride + 2] = r;
      data[stride + 3] = 1;
    }

    const texture = new THREE.DataTexture(
      data,
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    );

    texture.magFilter = texture.minFilter = THREE.NearestFilter;
    texture.needsUpdate = true;

    return texture;
  }, [grid]);

  useEffect(() => {
    if (texture && materialRef.current) {
      materialRef.current.uTexture = texture;
      materialRef.current.uTextureResolution.set(
        texture.image.width,
        texture.image.height
      );
      materialRef.current.uDataTexture = dataTexture;
      materialRef.current.uDataTexture.needsUpdate = true;
    }
  }, [texture, dataTexture]);

  useLayoutEffect(() => {
    if (materialRef.current) {
      materialRef.current.uResolution.set(size.width, size.height);
    }
  }, [size.width, size.height]);

  useFrame(({ state }) => {
    if (materialRef.current) {
      materialRef.current.uTime += 0.01;

      mouse.current.x = (pointer.x + 1) * 0.5;
      mouse.current.y = (-pointer.y + 1) * 0.5; // Y軸は反転

      // 速度の計算
      mouse.current.vX = mouse.current.x - mouse.current.prevX;
      mouse.current.vY = mouse.current.y - mouse.current.prevY;

      // 前フレームの位置を保存
      mouse.current.prevX = mouse.current.x;
      mouse.current.prevY = mouse.current.y;

      updateDataTexture();
    }
  });

  const updateDataTexture = useCallback(() => {
    const data = dataTexture.image.data;
    const size = grid;

    for (let i = 0; i < data.length; i += 4) {
      data[i] *= relaxation;
      data[i + 1] *= relaxation;
    }

    const gridMouseX = size * mouse.current.x;
    const gridMouseY = size * (1 - mouse.current.y);
    const maxDist = size * mouseFactor;
    const aspect = viewport.height / viewport.width;

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const distance = (gridMouseX - i) ** 2 / aspect + (gridMouseY - j) ** 2;
        const maxDistSq = maxDist ** 2;

        if (distance < maxDistSq) {
          const index = 4 * (i + size * j);
          let power = maxDist / Math.sqrt(distance);
          power = Math.min(Math.max(power, 0), 10);

          data[index] += strength * 100 * mouse.current.vX * power;
          data[index + 1] -= strength * 100 * mouse.current.vY * power;
        }
      }
    }

    mouse.current.vX *= 0.9;
    mouse.current.vY *= 0.9;
    dataTexture.needsUpdate = true;
  }, [grid, mouse, strength, relaxation, dataTexture]);

  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <effectMaterial ref={materialRef} />
    </mesh>
  );
};

const App = () => {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas>
        <OrthographicCamera
          makeDefault
          position={[0, 0, 100]}
          zoom={1}
          near={0.1}
          far={1000}
        />
        <FitPlane />
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default App;
