// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Three.js Scene Setup - Software Architecture Visualization
let scene, camera, renderer, nodes = [], connections = [], lines = [];
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

function initThreeJS() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas) return;

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
    );
    camera.position.set(0, 0, 800);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Create software architecture nodes (components) - White/Gold for contrast
    const nodeCount = 12;
    const nodeGeometry = new THREE.BoxGeometry(40, 40, 40);
    const nodeMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF, // White for visibility against red background
        transparent: true,
        opacity: 0.9,
        wireframe: false
    });
    
    // Alternate some nodes with gold for variety
    const goldMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFCC00, // USC Gold
        transparent: true,
        opacity: 0.8,
        wireframe: false
    });

    // Create nodes in a layered architecture pattern
    const layers = 3;
    const nodesPerLayer = Math.ceil(nodeCount / layers);
    
    for (let layer = 0; layer < layers; layer++) {
        const layerZ = (layer - 1) * 200;
        const nodesInThisLayer = layer === layers - 1 ? nodeCount - (layer * nodesPerLayer) : nodesPerLayer;
        
        for (let i = 0; i < nodesInThisLayer; i++) {
            const angle = (i / nodesInThisLayer) * Math.PI * 2;
            const radius = 150 + layer * 50;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            // Alternate between white and gold materials for visual variety
            const material = (i % 2 === 0) ? nodeMaterial.clone() : goldMaterial.clone();
            const node = new THREE.Mesh(nodeGeometry, material);
            node.position.set(x, y, layerZ);
            node.userData = {
                originalPosition: { x, y, z: layerZ },
                layer: layer,
                angle: angle
            };
            
            scene.add(node);
            nodes.push(node);
        }
    }

    // Create connections between nodes (architectural relationships) - Light colors for visibility
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xFFFFFF, // White lines for visibility
        transparent: true,
        opacity: 0.5
    });
    
    // Gold lines for cross-layer connections
    const goldLineMaterial = new THREE.LineBasicMaterial({
        color: 0xFFCC00, // USC Gold for important connections
        transparent: true,
        opacity: 0.4
    });

    // Connect nodes within same layer - White lines
    for (let layer = 0; layer < layers; layer++) {
        const layerNodes = nodes.filter(n => n.userData.layer === layer);
        for (let i = 0; i < layerNodes.length; i++) {
            const from = layerNodes[i];
            const to = layerNodes[(i + 1) % layerNodes.length];
            
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(from.position.x, from.position.y, from.position.z),
                new THREE.Vector3(to.position.x, to.position.y, to.position.z)
            ]);
            const line = new THREE.Line(geometry, lineMaterial.clone());
            line.userData = { from: from, to: to };
            scene.add(line);
            connections.push(line);
        }
    }

    // Connect nodes between layers (cross-layer dependencies) - Gold lines
    for (let layer = 0; layer < layers - 1; layer++) {
        const currentLayerNodes = nodes.filter(n => n.userData.layer === layer);
        const nextLayerNodes = nodes.filter(n => n.userData.layer === layer + 1);
        
        // Connect each node to nearest nodes in next layer
        currentLayerNodes.forEach(fromNode => {
            const connectionsToNext = Math.min(2, nextLayerNodes.length);
            for (let i = 0; i < connectionsToNext; i++) {
                const toNode = nextLayerNodes[i % nextLayerNodes.length];
                const geometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(fromNode.position.x, fromNode.position.y, fromNode.position.z),
                    new THREE.Vector3(toNode.position.x, toNode.position.y, toNode.position.z)
                ]);
                const line = new THREE.Line(geometry, goldLineMaterial.clone());
                line.userData = { from: fromNode, to: toNode };
                scene.add(line);
                connections.push(line);
            }
        });
    }

    // Mouse movement
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);

    animate();
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) * 0.001;
    mouseY = (event.clientY - windowHalfY) * 0.001;
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // Rotate the entire architecture slowly
    const time = Date.now() * 0.0005;
    
    nodes.forEach((node, index) => {
        const origPos = node.userData.originalPosition;
        const layer = node.userData.layer;
        
        // Slow rotation around center
        const angle = node.userData.angle + time * 0.1;
        const radius = 150 + layer * 50;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        // Subtle vertical float
        const floatOffset = Math.sin(time * 2 + index) * 10;
        
        node.position.x = x;
        node.position.y = y + floatOffset;
        
        // Rotate nodes slightly
        node.rotation.x += 0.01;
        node.rotation.y += 0.01;
    });

    // Update connection lines to follow nodes
    connections.forEach((line) => {
        if (line.userData && line.userData.from && line.userData.to) {
            const from = line.userData.from;
            const to = line.userData.to;
            
            const positions = line.geometry.attributes.position;
            positions.setXYZ(0, from.position.x, from.position.y, from.position.z);
            positions.setXYZ(1, to.position.x, to.position.y, to.position.z);
            positions.needsUpdate = true;
        }
    });

    // Subtle camera movement
    camera.position.x += (mouseX * 50 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 50 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}

// GSAP Animations
function initAnimations() {
    // Hero section animations (home page only) - More subtle and academic
    gsap.from('.title-line', {
        duration: 1.2,
        y: 30,
        opacity: 0,
        stagger: 0.15,
        ease: 'power2.out'
    });

    gsap.from('.hero-subtitle', {
        duration: 1,
        y: 20,
        opacity: 0,
        delay: 0.4,
        ease: 'power2.out'
    });

    gsap.from('.hero-buttons', {
        duration: 0.8,
        y: 15,
        opacity: 0,
        delay: 0.6,
        ease: 'power2.out'
    });

    // Page header animations - Subtle and professional
    gsap.from('.page-title', {
        duration: 1,
        y: 30,
        opacity: 0,
        ease: 'power2.out'
    });

    gsap.from('.page-subtitle', {
        duration: 0.8,
        y: 20,
        opacity: 0,
        delay: 0.2,
        ease: 'power2.out'
    });

    // Section title animations - More subtle
    gsap.utils.toArray('.section-title').forEach(title => {
        gsap.from(title, {
            scrollTrigger: {
                trigger: title,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            duration: 0.8,
            y: 25,
            opacity: 0,
            ease: 'power2.out'
        });
    });

    // Research cards animations - Subtle fade and slide
    gsap.utils.toArray('.research-card').forEach((card, index) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 90%',
                toggleActions: 'play none none none'
            },
            duration: 0.6,
            y: 20,
            opacity: 0,
            delay: index * 0.05,
            ease: 'power2.out'
        });
    });

    // Domain sections animations - Subtle
    gsap.utils.toArray('.domain-section').forEach((section, index) => {
        gsap.from(section, {
            scrollTrigger: {
                trigger: section,
                start: 'top 90%',
                toggleActions: 'play none none none'
            },
            duration: 0.8,
            y: 25,
            opacity: 0,
            delay: index * 0.08,
            ease: 'power2.out'
        });
    });

    // Team member animations - Subtle fade
    gsap.utils.toArray('.team-member').forEach((member, index) => {
        gsap.from(member, {
            scrollTrigger: {
                trigger: member,
                start: 'top 90%',
                toggleActions: 'play none none none'
            },
            duration: 0.6,
            y: 20,
            opacity: 0,
            delay: index * 0.08,
            ease: 'power2.out'
        });
    });

    // Team member detailed animations (team page)
    gsap.utils.toArray('.team-member-detailed').forEach((member, index) => {
        gsap.from(member, {
            scrollTrigger: {
                trigger: member,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            duration: 0.8,
            y: 50,
            opacity: 0,
            delay: index * 0.1,
            ease: 'power3.out'
        });
    });

    // Former members animations
    gsap.utils.toArray('.former-member').forEach((member, index) => {
        gsap.from(member, {
            scrollTrigger: {
                trigger: member,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            duration: 0.8,
            x: -30,
            opacity: 0,
            delay: index * 0.1,
            ease: 'power3.out'
        });
    });

    // Publication animations - Subtle slide
    gsap.utils.toArray('.publication-item').forEach((item, index) => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 90%',
                toggleActions: 'play none none none'
            },
            duration: 0.6,
            x: -20,
            opacity: 0,
            delay: index * 0.05,
            ease: 'power2.out'
        });
    });

    // Publication detailed animations - Subtle
    gsap.utils.toArray('.publication-item-detailed').forEach((item, index) => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 90%',
                toggleActions: 'play none none none'
            },
            duration: 0.6,
            x: -20,
            opacity: 0,
            delay: index * 0.05,
            ease: 'power2.out'
        });
    });

    // Year title animations
    gsap.utils.toArray('.year-title').forEach((title, index) => {
        gsap.from(title, {
            scrollTrigger: {
                trigger: title,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            duration: 1,
            y: 30,
            opacity: 0,
            delay: index * 0.2,
            ease: 'power3.out'
        });
    });

    // About section text animation
    gsap.from('.about-text p', {
        scrollTrigger: {
            trigger: '.about-text',
            start: 'top 80%',
            toggleActions: 'play none none none'
        },
        duration: 1,
        y: 30,
        opacity: 0,
        stagger: 0.2,
        ease: 'power3.out'
    });

    // About page sections animations
    gsap.utils.toArray('.about-section').forEach((section, index) => {
        gsap.from(section, {
            scrollTrigger: {
                trigger: section,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            duration: 1,
            y: 50,
            opacity: 0,
            delay: index * 0.15,
            ease: 'power3.out'
        });
    });

    // Mission list items
    gsap.utils.toArray('.mission-list li').forEach((item, index) => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            duration: 0.8,
            x: -30,
            opacity: 0,
            delay: index * 0.1,
            ease: 'power3.out'
        });
    });

    // Vision items
    gsap.utils.toArray('.vision-item').forEach((item, index) => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            duration: 0.8,
            scale: 0.9,
            opacity: 0,
            delay: index * 0.1,
            ease: 'power3.out'
        });
    });

    // Philosophy items
    gsap.utils.toArray('.philosophy-item').forEach((item, index) => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            duration: 0.8,
            x: -30,
            opacity: 0,
            delay: index * 0.1,
            ease: 'power3.out'
        });
    });

    // Achievement items
    gsap.utils.toArray('.achievement-item').forEach((item, index) => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            duration: 0.8,
            scale: 0.8,
            opacity: 0,
            delay: index * 0.1,
            ease: 'back.out(1.7)'
        });
    });

    // Stats counter animation
    gsap.utils.toArray('.stat-number').forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        const counter = { value: 0 };
        
        gsap.to(counter, {
            value: target,
            duration: 2,
            scrollTrigger: {
                trigger: stat,
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            onUpdate: () => {
                stat.textContent = Math.ceil(counter.value);
            },
            ease: 'power2.out'
        });
    });

    // Contact form animation
    gsap.from('.contact-form', {
        scrollTrigger: {
            trigger: '.contact-form',
            start: 'top 80%',
            toggleActions: 'play none none none'
        },
        duration: 1,
        x: 50,
        opacity: 0,
        ease: 'power3.out'
    });

    gsap.from('.contact-item', {
        scrollTrigger: {
            trigger: '.contact-info',
            start: 'top 80%',
            toggleActions: 'play none none none'
        },
        duration: 0.8,
        x: -30,
        opacity: 0,
        stagger: 0.2,
        ease: 'power3.out'
    });

    // Contact page animations
    gsap.from('.lab-head-card', {
        scrollTrigger: {
            trigger: '.lab-head-card',
            start: 'top 85%',
            toggleActions: 'play none none none'
        },
        duration: 1,
        y: 50,
        opacity: 0,
        ease: 'power3.out'
    });

    gsap.utils.toArray('.contact-card').forEach((card, index) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            duration: 0.8,
            scale: 0.9,
            opacity: 0,
            delay: index * 0.1,
            ease: 'power3.out'
        });
    });

    gsap.from('.contact-form-large', {
        scrollTrigger: {
            trigger: '.contact-form-large',
            start: 'top 85%',
            toggleActions: 'play none none none'
        },
        duration: 1,
        y: 50,
        opacity: 0,
        ease: 'power3.out'
    });

    // Overview cards animations (home page)
    gsap.utils.toArray('.overview-card').forEach((card, index) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            duration: 0.8,
            y: 50,
            opacity: 0,
            delay: index * 0.1,
            ease: 'power3.out'
        });
    });
}

// Navigation
function initNavigation() {
    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });

        // Close menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });
    }

    // Navbar scroll effect
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
        }

        lastScroll = currentScroll;
    });

    // Active nav link based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage || (currentPage === '' && linkHref === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Contact form
function initContactForm() {
    const forms = document.querySelectorAll('.contact-form, .contact-form-large');
    forms.forEach(form => {
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Simple success animation
                gsap.to(form, {
                    duration: 0.3,
                    scale: 0.95,
                    yoyo: true,
                    repeat: 1,
                    ease: 'power2.inOut'
                });

                // Show success message (you can customize this)
                alert('Thank you for your message! We will get back to you soon.');
                form.reset();
            });
        }
    });
}

// Parallax effect for hero section
function initParallax() {
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * 0.5;
            if (scrolled < window.innerHeight) {
                heroContent.style.transform = `translateY(${rate}px)`;
                heroContent.style.opacity = 1 - (scrolled / window.innerHeight);
            }
        });
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize Three.js on home page
    if (document.getElementById('three-canvas')) {
        initThreeJS();
        initParallax();
    }
    initAnimations();
    initNavigation();
    initContactForm();
});

// Handle page load animation
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
    gsap.from('body', {
        duration: 0.5,
        opacity: 0,
        ease: 'power2.out'
    });
});

