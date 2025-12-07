import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows, Html, Billboard } from '@react-three/drei';
import { Physics, RigidBody, MeshCollider, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';

function Apple(props: any) {
    return (
        <RigidBody
            colliders="ball"
            restitution={0.7}
            friction={0.1}
            position={[0, 0, 0]}
            {...props}
        >
            <mesh>
                <sphereGeometry args={[0.10, 16, 16]} />
                {/* 隐藏物理网格，只显示 Emoji */}
                <meshBasicMaterial transparent opacity={0.0} />

                <Billboard>
                    <Html
                        transform
                        center
                        style={{
                            pointerEvents: 'none',
                            fontSize: '10px',
                            userSelect: 'none'
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#FF5E5E"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 6.528V3a1 1 0 0 1 1-1h0" />
                            <path d="M18.237 21A15 15 0 0 0 22 11a6 6 0 0 0-10-4.472A6 6 0 0 0 2 11a15.1 15.1 0 0 0 3.763 10 3 3 0 0 0 3.648.648 5.5 5.5 0 0 1 5.178 0A3 3 0 0 0 18.237 21" />
                        </svg>
                    </Html>
                </Billboard>
            </mesh>
        </RigidBody>
    );
}

// 📦 笼子组件 (D20)
function Cage({ isDarkMode, ...props }: { isDarkMode: boolean } & any) {
    const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);
    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const [hovered, setHovered] = useState(false);

    // Colors based on theme
    const normalColor = isDarkMode ? '#E6E4D9' : '#434039';
    const hoverColor = isDarkMode ? '#434039' : '#E6E4D9';

    // --- 交互与旋转逻辑 ---
    const isDragging = useRef(false);
    const previousMousePosition = useRef({ x: 0, y: 0 });
    const rotationVelocity = useRef({ x: 0, y: 0 });
    const autoRotationEnabled = useRef(true);

    // 维护当前旋转状态 (Euler)
    const currentRotation = useRef(new THREE.Euler(0, 0, 0));

    useFrame((_state, delta) => {
        // 1. 计算新的旋转逻辑 (同之前)
        if (isDragging.current) {
            autoRotationEnabled.current = false;
        } else {
            // 惯性处理
            if (Math.abs(rotationVelocity.current.x) > 0.001 || Math.abs(rotationVelocity.current.y) > 0.001) {
                currentRotation.current.x += rotationVelocity.current.y;
                currentRotation.current.y += rotationVelocity.current.x;

                rotationVelocity.current.x *= 0.95;
                rotationVelocity.current.y *= 0.95;

                autoRotationEnabled.current = false;
            } else {
                if (!autoRotationEnabled.current &&
                    Math.abs(rotationVelocity.current.x) < 0.001 &&
                    Math.abs(rotationVelocity.current.y) < 0.001) {
                    autoRotationEnabled.current = true;
                }

                if (autoRotationEnabled.current) {
                    currentRotation.current.x += delta * 0.2;
                    currentRotation.current.y += delta * 0.25;
                }
            }
        }

        // 2. 将旋转应用到物理实体 (Kinematic)
        if (rigidBodyRef.current) {
            const q = new THREE.Quaternion().setFromEuler(currentRotation.current);
            rigidBodyRef.current.setNextKinematicRotation(q);
        }
    });

    const handlePointerDown = (event: any) => {
        event.stopPropagation();
        isDragging.current = true;
        previousMousePosition.current = {
            x: event.clientX,
            y: event.clientY
        };
        rotationVelocity.current = { x: 0, y: 0 };
    };

    const handlePointerMove = (event: any) => {
        if (!isDragging.current) return;
        const deltaX = event.clientX - previousMousePosition.current.x;
        const deltaY = event.clientY - previousMousePosition.current.y;

        currentRotation.current.y += deltaX * 0.01;
        currentRotation.current.x += deltaY * 0.01;

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
        <RigidBody
            ref={rigidBodyRef}
            type="kinematicPosition"
            colliders="trimesh" // 使用网格作为碰撞体 (空心)
            {...props}
        >
            <mesh
                geometry={geometry}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => {
                    setHovered(false);
                    isDragging.current = false;
                }}
            >
                <meshStandardMaterial
                    color={hovered ? hoverColor : normalColor}
                    wireframe={true}
                    transparent
                    opacity={0.8}
                    wireframeLinewidth={2}
                    side={THREE.DoubleSide} // 双面渲染，让内部也能看到笼子
                />
            </mesh>
        </RigidBody>
    );
}

export default function InteractiveD20() {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Check initial dark mode state
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };
        
        checkDarkMode();

        // Listen for theme changes from the toggle button
        const handleThemeChange = (e: CustomEvent<{ isDark: boolean }>) => {
            setIsDarkMode(e.detail.isDark);
        };

        // Also observe class changes on html element for system preference changes
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        window.addEventListener('theme-change', handleThemeChange as EventListener);
        
        return () => {
            window.removeEventListener('theme-change', handleThemeChange as EventListener);
            observer.disconnect();
        };
    }, []);

    return (
        <div className="h-64 w-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none">
            <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                <pointLight position={[-10, -10, -10]} />

                <Physics gravity={[0, -9.8, 0]}>
                    <Cage position={[0, 0, 0]} isDarkMode={isDarkMode} />
                    <Apple />
                </Physics>

                <ContactShadows position={[0, -1.4, 0]} opacity={0.3} scale={2} blur={2} />
            </Canvas>
        </div>
    );
}
