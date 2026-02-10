// Vertex Shader: Handles the position of the pixels (standard pass-through)
const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Fragment Shader: Handles the color and distortion logic
const fragmentShader = `
    uniform sampler2D uTexture1;
    uniform sampler2D uTexture2;
    uniform sampler2D uDisp; // The smoke displacement texture
    uniform float uProgress; // 0.0 to 1.0 transition state
    varying vec2 vUv;

    void main() {
        // Create a distinct distortion effect for each image direction
        // We offset the UVs based on the displacement texture color
        
        vec4 disp = texture2D(uDisp, vUv);
        
        // Calculate distorted UVs
        // Force 1 moves UVs for image 1
        // Force 2 moves UVs for image 2
        vec2 distortedPosition1 = vec2(vUv.x + uProgress * (disp.r * 0.5), vUv.y); 
        vec2 distortedPosition2 = vec2(vUv.x - (1.0 - uProgress) * (disp.r * 0.5), vUv.y);

        // Get the pixels from both images using distorted positions
        vec4 _texture1 = texture2D(uTexture1, distortedPosition1);
        vec4 _texture2 = texture2D(uTexture2, distortedPosition2);

        // Mix the two images based on progress
        // We use a smoothstep to make the fade cleaner
        float mixRatio = smoothstep(0.1, 0.9, uProgress); 
        
        gl_FragColor = mix(_texture1, _texture2, mixRatio);
    }
`;

class SmokeScene {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.1, 100);
        this.camera.position.z = 1;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.loader = new THREE.TextureLoader();
        this.mouse = new THREE.Vector2();
        
        // Initial setup
        this.addObjects();
        this.addEvents();
        this.animate();
    }

    addObjects() {
        // Load Textures (Replace these URLs with your local files)
        const texture1 = this.loader.load('https://images.unsplash.com/photo-1517849845537-4d257902454a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80');
        const texture2 = this.loader.load('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80');
        const dispTexture = this.loader.load('https://raw.githubusercontent.com/robin-dela/hover-effect/master/images/disp.jpg'); // Standard displacement map

        // Correct aspect ratio for textures
        texture1.magFilter = texture2.magFilter = dispTexture.magFilter = THREE.LinearFilter;
        texture1.minFilter = texture2.minFilter = dispTexture.minFilter = THREE.LinearFilter;

        this.material = new THREE.ShaderMaterial({
            extensions: {
                derivatives: "#extension GL_OES_standard_derivatives : enable"
            },
            side: THREE.DoubleSide,
            uniforms: {
                uProgress: { type: "f", value: 0 },
                uTexture1: { type: "t", value: texture1 },
                uTexture2: { type: "t", value: texture2 },
                uDisp: { type: "t", value: dispTexture },
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });

        // Create a plane that fills the view
        // Adjust geometry size (1.5, 1) based on your preferred aspect ratio
        this.geometry = new THREE.PlaneGeometry(1.5, 1, 1, 1);
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
    }

    addEvents() {
        // Hover listeners
        this.container.addEventListener('mouseenter', () => {
            gsap.to(this.material.uniforms.uProgress, {
                value: 1,
                duration: 1.2,
                ease: "power2.inOut"
            });
        });

        this.container.addEventListener('mouseleave', () => {
            gsap.to(this.material.uniforms.uProgress, {
                value: 0,
                duration: 1.2,
                ease: "power2.inOut"
            });
        });

        // Resize listener
        window.addEventListener('resize', () => {
            this.width = this.container.offsetWidth;
            this.height = this.container.offsetHeight;
            this.renderer.setSize(this.width, this.height);
            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();
        });
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.renderer.render(this.scene, this.camera);
    }
}

new SmokeScene();