import * as THREE from 'three'
import { ReactThreeFiber } from '@react-three/fiber'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: ReactThreeFiber.Object3DNode<THREE.Mesh, typeof THREE.Mesh>
      octahedronGeometry: ReactThreeFiber.BufferGeometryNode<THREE.OctahedronGeometry, typeof THREE.OctahedronGeometry>
      meshStandardMaterial: ReactThreeFiber.MaterialNode<THREE.MeshStandardMaterial, typeof THREE.MeshStandardMaterial>
      ambientLight: ReactThreeFiber.LightNode<THREE.AmbientLight, typeof THREE.AmbientLight>
      pointLight: ReactThreeFiber.LightNode<THREE.PointLight, typeof THREE.PointLight>
    }
  }
} 