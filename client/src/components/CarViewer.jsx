import { Component, Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bounds, Center, OrbitControls, useGLTF, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import './CarViewer.css'

const CIVIC_MODEL = '/models/civic-2003/car/civic_pbr.glb'
export const HYUNDAI_I10_MODEL = '/models/hyundai_i10/car/base_basic_pbr.glb'

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

function CarModel({ modelPath, onSelect }) {
  const { scene } = useGLTF(modelPath)
  return <SceneNode object={scene} onSelect={onSelect} />
}

function ModelLoadingOverlay() {
  const { active, progress } = useProgress()
  if (!active) return null

  return (
    <div className="vehicle-model-loading-overlay" role="status" aria-live="polite">
      <span className="vehicle-model-loading">
        Cargando modelo 3D… {Math.round(progress)}%
      </span>
    </div>
  )
}

class ModelErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    this.props.onError(error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
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

export default function CarViewer({ modelPath = CIVIC_MODEL }) {
  const [selected, setSelected] = useState(null)
  const [modelErrorPath, setModelErrorPath] = useState('')

  return (
    <div className="car-viewer">
      <div className="car-canvas">
        <Canvas
          camera={{ position: [0, 1.5, 4], fov: 45 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
        >
          <color attach="background" args={['#161A20']} />
          <ambientLight intensity={1.5} />
          <directionalLight position={[4, 6, 5]} intensity={2} castShadow />
          <directionalLight position={[-4, 2, -3]} intensity={0.8} />

          <ModelErrorBoundary
            key={modelPath}
            fallback={null}
            onError={error => {
              console.error(`Error cargando modelo 3D (${modelPath}):`, error)
              setModelErrorPath(modelPath)
            }}
          >
            <Suspense fallback={null}>
              <Bounds fit clip observe margin={1.25}>
                <Center>
                  <CarModel modelPath={modelPath} onSelect={setSelected} />
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
          </ModelErrorBoundary>
        </Canvas>
      </div>
      <ModelLoadingOverlay />
      {modelErrorPath === modelPath && (
        <p className="vehicle-model-error" role="alert">
          No se pudo cargar el modelo 3D de este vehículo.
        </p>
      )}

    </div>
  )
}

useGLTF.preload(CIVIC_MODEL)
