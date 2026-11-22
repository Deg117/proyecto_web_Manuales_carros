
import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bounds, Center, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import './MotorViewer.css'

const MODEL = '/models/civic-2003/engine/complete/motor_pbr.glb'

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
            name: event.object.name || 'Superficie del motor',
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

function EngineModel({ onSelect }) {
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

export default function MotorViewer() {
  const [selected, setSelected] = useState(null)

  return (
    <section className="motor-viewer">
      <div className="motor-viewer-heading">
        <div>
          <span>MOTOR INTERACTIVO</span>
          <h2>Motor Honda D17A2</h2>
          <p>Explora el motor. Gira el modelo y selecciona una zona.</p>
        </div>
        <span className="motor-format">MODELO 3D</span>
      </div>

      <div className="motor-canvas">
        <Canvas
          camera={{ position: [0, 1.5, 4], fov: 45 }}
          shadows
          dpr={[1, 2]}
        >
          <color attach="background" args={['#283818']} />
          <ambientLight intensity={1.5} />
          <directionalLight
            position={[4, 6, 5]}
            intensity={2}
            castShadow
          />
          <directionalLight position={[-4, 2, -3]} intensity={0.8} />

          <Suspense fallback={null}>
            <Bounds fit clip observe margin={1.25}>
              <Center>
                <EngineModel onSelect={setSelected} />
              </Center>
            </Bounds>
          </Suspense>

          <SelectionMarker point={selected?.point} />
          <OrbitControls
            makeDefault
            enableDamping
            minDistance={1}
            maxDistance={10}
          />
        </Canvas>

        <div className="motor-controls-hint">
          Arrastra para girar · Rueda para acercar
        </div>
      </div>

      <div className="motor-selection">
        {selected ? (
          <>
            <span className="selection-dot" />
            <div>
              <strong>Zona seleccionada</strong>
              <p>{selected.name}</p>
              <small>
                Posición: {selected.point.map(n => n.toFixed(2)).join(', ')}
              </small>
            </div>
            <button onClick={() => setSelected(null)}>Limpiar</button>
          </>
        ) : (
          <p>Haz clic sobre cualquier superficie del motor para marcarla.</p>
        )}
      </div>
    </section>
  )
}

useGLTF.preload(MODEL)
