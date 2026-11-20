import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bounds, Center, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import './CarViewer.css'

const MODEL = '/models/civic-2003/car/civic_pbr.glb'

function SceneNode({ object, onSelect }) {
  const props = {
    position: object.position,
    quaternion: object.quaternion,
    scale: object.scale,
    visible: object.visible,
  }

  if (object.isMesh) {
    return (
      <mesh
        {...props}
        geometry={object.geometry}
        material={object.material}
        castShadow
        receiveShadow
        onClick={(event) => {
          event.stopPropagation()
          onSelect({
            point: event.point.toArray(),
            name: object.name || 'Superficie de la carrocería',
          })
        }}
      >
        {object.children.map(child => (
          <SceneNode key={child.uuid} object={child} onSelect={onSelect} />
        ))}
      </mesh>
    )
  }

  return (
    <group {...props}>
      {object.children.map(child => (
        <SceneNode key={child.uuid} object={child} onSelect={onSelect} />
      ))}
    </group>
  )
}

function CarModel({ onSelect }) {
  const { scene } = useGLTF(MODEL)
  return <SceneNode object={scene} onSelect={onSelect} />
}

function SelectionMarker({ point }) {
  if (!point) return null

  return (
    <group position={point}>
      <mesh>
        <sphereGeometry args={[0.025, 20, 20]} />
        <meshBasicMaterial color="#b8ff9c" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.055, 20, 20]} />
        <meshBasicMaterial
          color="#8cff75"
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

export default function CarViewer() {
  const [selected, setSelected] = useState(null)

  return (
    <div className="car-viewer">
      <div className="car-canvas">
        <Canvas
          camera={{ position: [0, 1.5, 4], fov: 45 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
        >
          <color attach="background" args={['#000000']} />
          <ambientLight intensity={1.5} />
          <directionalLight position={[4, 6, 5]} intensity={2} castShadow />
          <directionalLight position={[-4, 2, -3]} intensity={0.8} />

          <Suspense fallback={null}>
            <Bounds fit clip observe margin={1.25}>
              <Center>
                <CarModel onSelect={setSelected} />
              </Center>
            </Bounds>
          </Suspense>

          <SelectionMarker point={selected?.point} />
          <OrbitControls
            makeDefault
            enableDamping
            enableRotate
            enableZoom
            enablePan={false}
            minDistance={1}
            maxDistance={12}
          />
        </Canvas>

        <div className="car-controls-hint">
          Arrastra para girar · Rueda para acercar
        </div>
      </div>

    </div>
  )
}

useGLTF.preload(MODEL)
