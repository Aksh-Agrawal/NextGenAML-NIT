import React, { useRef, useMemo, Component } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Error Boundary for Three.js Canvas
class ThreeErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Three.js/Canvas Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

const ParticleField = ({ count = 1000 }) => {
    const points = useRef();

    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const gold = new THREE.Color('#D4AF37');
        const blue = new THREE.Color('#4FA3FF');

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 15;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 15;

            const mixedColor = Math.random() > 0.6 ? gold : blue;
            colors[i * 3] = mixedColor.r;
            colors[i * 3 + 1] = mixedColor.g;
            colors[i * 3 + 2] = mixedColor.b;
        }
        return { positions, colors };
    }, [count]);

    useFrame((state) => {
        if (!points.current) return;
        const time = state.clock.getElapsedTime();
        points.current.rotation.y = time * 0.03;
        points.current.rotation.x = time * 0.01;
    });

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particles.positions.length / 3}
                    array={particles.positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={particles.colors.length / 3}
                    array={particles.colors}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.015}
                vertexColors
                transparent
                opacity={0.4}
                sizeAttenuation
            />
        </points>
    );
};

const DataFlowLines = ({ count = 15 }) => {
    const lines = useMemo(() => {
        return Array.from({ length: count }).map(() => {
            const start = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );
            const end = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );
            const curve = new THREE.QuadraticBezierCurve3(
                start,
                new THREE.Vector3((start.x + end.x) / 2, (start.y + end.y) / 2 + 2, (start.z + end.z) / 2),
                end
            );
            return curve.getPoints(50);
        });
    }, [count]);

    return (
        <group>
            {lines.map((points, i) => (
                <line key={i}>
                    <bufferGeometry>
                        <setFromPoints args={[points]} />
                    </bufferGeometry>
                    <lineBasicMaterial color="#D4AF37" transparent opacity={0.05} />
                </line>
            ))}
        </group>
    );
};

const BackgroundEffect = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 bg-[#0A0F1F]">
            <ThreeErrorBoundary
                fallback={
                    <div className="absolute inset-0 bg-[#0A0F1F]">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-royal-gold/5 blur-[120px] rounded-full opacity-30"></div>
                        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-soft-blue/5 blur-[120px] rounded-full opacity-30"></div>
                    </div>
                }
            >
                <Canvas
                    camera={{ position: [0, 0, 5], fov: 75 }}
                    gl={{ antialias: false, powerPreference: "high-performance" }}
                    dpr={[1, 2]}
                >
                    <ParticleField />
                    <DataFlowLines />
                </Canvas>
            </ThreeErrorBoundary>
            <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1F]/40 via-transparent to-[#0A0F1F]"></div>
        </div>
    );
};

export default BackgroundEffect;
