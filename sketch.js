const $ = require('jquery')
const THREE = require('three')
OrbitControls = require('three-orbit-controls')
const dat = require('dat.gui')
const loop = require('raf-loop')
const WindowResize = require('three-window-resize')
const { timers } = require('jquery')


class Sketch {

    constructor() {

        this.gui = new dat.GUI()
        this.params = this.gui.addFolder('parameters');
        this.gui.show()
        this.params.Vdrive = 0.35
        this.params.b = 0.7
        this.params.c = 0.8
        this.params.recoverySpeed = 0.1
        this.params.speed = 20
        this.gui.add(this.params, 'Vdrive', -1, 2, 0.001);
        this.gui.add(this.params, 'b', -10, 10, 0.1);
        this.gui.add(this.params, 'c', -10, 10, 0.1);
        this.gui.add(this.params, 'recoverySpeed', -10, 10, 0.1);
        this.gui.add(this.params, 'speed', 0, 100,1);
        var self = this
        this.gui.add(this, 'resetParticles');
        this.gui.add(this, 'toggleFade');
        
        this.fade = 0.03

        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        this.renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true })
        this.renderer.autoClearColor = false
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        var windowResize = new WindowResize(this.renderer, this.camera)

        var fadeMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: this.fade
        });
        var fadePlane = new THREE.PlaneBufferGeometry(20, 20);
        this.fadeMesh = new THREE.Mesh(fadePlane, fadeMaterial);
        // Create Object3D to hold camera and transparent plane
        var camGroup = new THREE.Object3D();
        var camera = new THREE.PerspectiveCamera();
        camGroup.add(camera);
        camGroup.add(this.fadeMesh);

        // Put plane in front of camera
        this.fadeMesh.position.z = -0.1;

        // Make plane render before particles
        this.fadeMesh.renderOrder = -1;

        // Add camGroup to scene
        this.scene.add(camGroup);
        
        this.clock = new THREE.Clock();
        this.clock.getDelta();

        var geometry = new THREE.BoxGeometry(2,1,1);
        // var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        var material = new THREE.MeshNormalMaterial()
        // this.cube = new THREE.Mesh(geometry, material);
        // this.scene.add(this.cube);
        this.camera.position.z = 5

        // this.numCubes = 0
        // this.cubes = []
        // for(var i = 0; i < this.numCubes; i++){
        //     this.cubes.push(new THREE.Mesh(geometry, material))
        //     this.scene.add(this.cubes[i])
        // }


        const map = new THREE.TextureLoader().load('textures/sprite.png');
        const spritematerial = new THREE.SpriteMaterial({ map: map, color: 0xffffff });

        var graphMaterial = new THREE.LineBasicMaterial({ color: 0xffffff })
        this.graph = new THREE.BufferGeometry()
        var line = new THREE.Line(this.graph, graphMaterial)
        this.scene.add(line)


        this.sprites = []
        this.trails = []
        this.trailPoints = []
        this.numSprites = 40
        this.spacing = this.numSprites/5
        for (var i = 0; i < this.numSprites; i++){
            for (var j = 0; j < this.numSprites; j++){
                const sprite = new THREE.Sprite(spritematerial);
                sprite.scale.set(0.01, 0.01, 1)
                this.scene.add(sprite)
                this.sprites.push(sprite)
                sprite.position.x = i / this.spacing - this.numSprites / (this.spacing * 2)
                sprite.position.y = j / this.spacing - this.numSprites / (this.spacing * 2)
                sprite.position.z = 0
            }
        }
        this.nextSprite = 0
        // this.controls = new OrbitControls(this.camera, this.renderer.domElement);


        var axisMaterial = new THREE.LineDashedMaterial({
            color: 0x0fe0ee,
            linewidth: 1,
            scale: 1,
            dashSize: 3,
            gapSize: 2})

        document.body.appendChild(this.renderer.domElement);

        // Assign event listener to only target this canvas
        this.renderer.domElement.addEventListener('mousedown', onCanvasMouseDown, false);
        function onCanvasMouseDown(event) {
            if (event) { 


                event.preventDefault();

                // console.log(1 - 2 * event.clientY / window.innerHeight)

                var vector = new THREE.Vector3(
                    2 * event.clientX / window.innerWidth - 1,
                    1 - 2 * event.clientY / window.innerHeight,
                    0.5
                ).unproject(self.camera);

                // vector.normalize()
                vector.sub(self.camera.position).normalize()

                vector.multiplyScalar(-5 / vector.z)

                self.sprites[self.nextSprite].position.x = vector.x
                self.sprites[self.nextSprite].position.y = vector.y
                self.nextSprite++
                self.nextSprite = self.nextSprite % (self.numSprites * self.numSprites)
            }
        }

    }

    start() {
        $(window).on('load', () => {
            $('#loading-screen').hide()
            console.log('it begins!')
        })
        loop((dt) => {
            this.render()
        }).start()
    }

    xVelocity(x,y){
        // return -Math.pow(x,3) + x*y
        return -y
    }
    yVelocity(x, y) {
        // return -Math.pow(x,3) + x*y
        return x
    }

    resetParticles () {
        this.spacing = this.numSprites / 5
        for (var i = 0; i < this.numSprites; i++) {
            for (var j = 0; j < this.numSprites; j++) {
                var sprite  = this.sprites[i*this.numSprites + j]
                sprite.scale.set(0.01, 0.01, 1)
                sprite.position.x = i / this.spacing - this.numSprites / (this.spacing * 2)
                sprite.position.y = j / this.spacing - this.numSprites / (this.spacing * 2)
                sprite.position.z = 0
            }
        }
    }

    toggleFade () {
        if(this.fade > 0){
            this.fade = 0
        } else {
            this.fade = 0.03
        }
    }

    render() {
        var dt = this.clock.getDelta()*this.params.speed/1000000;

        this.renderer.render(this.scene, this.camera);

        for(var i = 0; i< this.numSprites; i++){
            for(var j = 0; j < this.numSprites; j++){
                var x = this.sprites[i*this.numSprites + j].position.x
                var y = this.sprites[i * this.numSprites + j].position.y
                this.sprites[i * this.numSprites + j].position.x += this.xVelocity(x,y)
                this.sprites[i * this.numSprites + j].position.y += this.yVelocity(x, y)
            }
        }
        
    }
    

}

module.exports = Sketch
