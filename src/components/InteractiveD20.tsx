import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows } from '@react-three/drei';
import type { Mesh } from 'three';

function D20(props: any) {
    const meshRef = useRef<Mesh>(null!);
    const [hovered, setHovered] = useState(false);
    const [active, setActive] = useState(false);

    useFrame((_state, delta) => {
        // Auto rotation
        if (!active) {
            meshRef.current.rotation.x += delta * 0.2;
            meshRef.current.rotation.y += delta * 0.25;
        }
        // Mouse interaction rotation logic can be added here if needed beyond simple drag
    });

    return (
        <mesh
            {...props}
            ref={meshRef}
            scale={active ? 1.5 : 1}
            onClick={() => setActive(!active)}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            cursor={hovered ? 'grab' : 'auto'}
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

                <ContactShadows position={[0, -1.4, 0]} opacity={0.4} scale={5} blur={2.4} />
            </Canvas>
        </div>
    );
}
