"use client"

import { useRef, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

interface CameraControllerProps {
  target?: THREE.Vector3
  smooth?: boolean
}

export function CameraController({ target, smooth = true }: CameraControllerProps) {
  const { camera } = useThree()
  const targetRef = useRef(target || new THREE.Vector3(0, 0, 0))

  useEffect(() => {
    if (target) {
      targetRef.current = target
    }
  }, [target])

  useFrame(() => {
    if (smooth) {
      camera.position.lerp(
        new THREE.Vector3(targetRef.current.x + 10, targetRef.current.y + 5, targetRef.current.z + 10),
        0.02,
      )
      camera.lookAt(targetRef.current)
    }
  })

  return null
}
