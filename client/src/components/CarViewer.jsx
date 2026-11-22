import { Suspense, useCallback, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bounds, Center, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import './CarViewer.css'
import ModelErrorBoundary from './ModelErrorBoundary'
import ModelLoadingOverlay from './ModelLoadingOverlay'
import { MODELOS_3D } from '../config/modelos3d'

const CIVIC_MODEL = MODELOS_3D.hondaCivic2003

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

function CarModel({ modelPath, onSelect, onReady }) {
  const { scene } = useGLTF(modelPath)
  useEffect(() => onReady(), [onReady, scene])
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

export default function CarViewer({
  modelPath = CIVIC_MODEL,
  fallbackModelPath,
  vehicleName = 'Honda Civic 2003',
}) {
  const [selected, setSelected] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [usingFallback, setUsingFallback] = useState(false)
  const activeModelPath = usingFallback && fallbackModelPath
    ? fallbackModelPath
    : modelPath
  const [loadState, setLoadState] = useState({
    modelPath,
    loading: true,
    error: '',
  })
  const visibleState = loadState.modelPath === activeModelPath
    ? loadState
    : { loading: true, error: '' }

  const onModelReady = useCallback(() => {
    setLoadState({ modelPath: activeModelPath, loading: false, error: '' })
  }, [activeModelPath])

  const onModelError = useCallback(error => {
    if (!usingFallback && fallbackModelPath) {
      console.warn(
        `No se pudo cargar el modelo remoto (${modelPath}); se intentará el respaldo local (${fallbackModelPath}).`,
        error,
      )
      setUsingFallback(true)
      return
    }

    console.error(`Error cargando modelo 3D (${activeModelPath}):`, error)
    setLoadState({
      modelPath: activeModelPath,
      loading: false,
      error: 'Comprueba la conexión e inténtalo de nuevo.',
    })
  }, [activeModelPath, fallbackModelPath, modelPath, usingFallback])

  const retryModel = useCallback(() => {
    useGLTF.clear(activeModelPath)
    if (usingFallback && fallbackModelPath) {
      useGLTF.clear(modelPath)
      setUsingFallback(false)
    }
    setLoadState({ modelPath, loading: true, error: '' })
    setRetryCount(count => count + 1)
  }, [activeModelPath, fallbackModelPath, modelPath, usingFallback])

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
            key={`${activeModelPath}:${retryCount}`}
            onError={onModelError}
          >
            <Suspense fallback={null}>
              <Bounds fit clip observe margin={1.25}>
                <Center>
                  <CarModel
                    modelPath={activeModelPath}
                    onSelect={setSelected}
                    onReady={onModelReady}
                  />
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
      <ModelLoadingOverlay
        loading={visibleState.loading}
        progress={null}
        vehicleName={vehicleName}
        error={visibleState.error}
        onRetry={retryModel}
        attemptKey={`${activeModelPath}:${retryCount}`}
      />
    </div>
  )
}
