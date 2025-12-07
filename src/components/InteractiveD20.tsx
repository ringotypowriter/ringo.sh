import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, ContactShadows } from '@react-three/drei';
import type { Mesh } from 'three';

function D20(props: any) {
    const meshRef = useRef<Mesh>(null!);
    const [hovered, setHovered] = useState(false);

    // 拖动状态追踪
    const isDragging = useRef(false);
    const previousMousePosition = useRef({ x: 0, y: 0 });
    const rotationVelocity = useRef({ x: 0, y: 0 });
    const autoRotationEnabled = useRef(true);

    useFrame((_state, delta) => {
        if (!meshRef.current) return;

        if (isDragging.current) {
            // 拖动时:不做任何自动旋转,旋转由鼠标事件直接控制
            autoRotationEnabled.current = false;
        } else {
            // 没有拖动时:应用惯性旋转
            if (Math.abs(rotationVelocity.current.x) > 0.001 || Math.abs(rotationVelocity.current.y) > 0.001) {
                meshRef.current.rotation.x += rotationVelocity.current.y;
                meshRef.current.rotation.y += rotationVelocity.current.x;

                // 惯性衰减
                rotationVelocity.current.x *= 0.95;
                rotationVelocity.current.y *= 0.95;

                autoRotationEnabled.current = false;
            } else {
                // 惯性完全停止后,启用自动旋转
                if (!autoRotationEnabled.current) {
                    autoRotationEnabled.current = true;
                }

                // 自动旋转
                if (autoRotationEnabled.current) {
                    meshRef.current.rotation.x += delta * 0.2;
                    meshRef.current.rotation.y += delta * 0.25;
                }
            }
        }
    });

    const handlePointerDown = (event: any) => {
        event.stopPropagation();
        isDragging.current = true;
        previousMousePosition.current = {
            x: event.clientX,
            y: event.clientY
        };
        // 停止惯性
        rotationVelocity.current = { x: 0, y: 0 };
    };

    const handlePointerMove = (event: any) => {
        if (!isDragging.current) return;

        const deltaX = event.clientX - previousMousePosition.current.x;
        const deltaY = event.clientY - previousMousePosition.current.y;

        // 更新旋转
        meshRef.current.rotation.y += deltaX * 0.01;
        meshRef.current.rotation.x += deltaY * 0.01;

        // 记录速度用于惯性
        rotationVelocity.current = {
            x: deltaX * 0.01,
            y: deltaY * 0.01
        };

        previousMousePosition.current = {
            x: event.clientX,
            y: event.clientY
        };
    };

    const handlePointerUp = () => {
        isDragging.current = false;
    };

    return (
        <mesh
            {...props}
            ref={meshRef}
            scale={hovered ? 1.05 : 1}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => {
                setHovered(false);
                isDragging.current = false;
            }}
        >
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
                color={hovered ? '#E6E4D9' : '#434039'}
                wireframe={true}
                transparent
                opacity={0.8}
                wireframeLinewidth={2}
            />
        </mesh>
    );
}

export default function InteractiveD20() {
    return (
        <div className="h-64 w-full flex items-center justify-center cursor-grab active:cursor-grabbing">
            <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                <pointLight position={[-10, -10, -10]} />

                <Float
                    speed={2}
                    rotationIntensity={1}
                    floatIntensity={1}
                >
                    <D20 />
                </Float>

                <ContactShadows position={[0, -1.4, 0]} opacity={0.3} scale={3} blur={2} />
            </Canvas>
        </div>
    );
}
