if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

// Three.js vars
var camera, scene, light, renderer, container, projector, mouseVector, spheres, groundContents, groundMesh, wall;
var meshs = [];
var bodys=[];
var joints=[];
var grounds = [];
var SELECTION_TIME = 1000;
var selectedMesh, previousSelectedMeshMaterial, selectedMeshOriginalMaterial, previousSelectedMesh;
var filterWallBody, filterWall1, filterWall2, filterWall3, filterWall4;
var isMobile = false;
var antialias = true;

var geos = {};
var mats = {};

// Oimo vars
var world = null;
var bodys = [];
var physicsUpdateInterval;

var fps = [0,0,0,0];
var ToRad = Math.PI / 180;
var type=1;
var debugColor = 0x282929;
var debugColor2 = 0x288829;
var debugAlpha = 0.3;

// Collision groups
var spheres_mask = 1 << 0;  // 00000000 00000000 00000000 00000001
var walls_mask = 1 << 2;    // 00000000 00000000 00000000 00000010
var filtered_mask = 1 << 3; // 00000000 00000000 00000000 00001000
var all_mask = 0xffffffff;  // 11111111 11111111 11111111 11111111

// Is all the physics setting for rigidbody
var config = [
    1, // The density of the shape.
    0.4, // The coefficient of friction of the shape.
    0.2, // The coefficient of restitution of the shape.
    1, // The bits of the collision groups to which the shape belongs.
    0xffffffff // The bits of the collision groups with which the shape collides.
];

//Scenes vars
var labOpen, menuOpen

// Dataset vars
var zipcode = null;
var month = null;
var analysisStarted = false;
var datasets = {
    64700: 'monterrey_tech_dataset',
    44130: 'guadalajara_ccd_dataset',
    11529: 'mexico_soumaya_museum_dataset'
};
var zipcodeAsString = {
    64700: 'Instituto Tecnológico de Monterrey (64700 zipcode)',
    44130: 'Ciudad Creativa Digital de Guadalajara (44130 zipcode)',
    11529: 'Museo Soumaya de Mexico DF (11529 zipcode)'
};
var monthAsString = ['Nov 2013', 'Dic 2013', 'Jan 2014', 'Feb 2014', 'Mar 2014']; //, 'Apr 2014'];
var textureColors = {
    'sph.mx_barsandrestaurants': '#18509A',
    'sph.mx_services': '#1F6CAF',
    'sph.mx_food': '#2F9AD1',
    'sph.mx_office': '#58BAE5',
    'sph.mx_car': '#435B00',
    'sph.mx_auto':'#658E0A',
    'sph.mx_travel': '#89BA35',
    'sph.mx_sport': '#DAE500',
    'sph.mx_beauty': '#FF3600',
    'sph.mx_health':'#FF8500',
    'sph.mx_fashion':'#FFAA00',
    'sph.mx_leisure':'#FFFF00'        
};

var textColor = 0xFFFFFF
var labelTextColor = 0xAAAAAA
var statsCubeColor = 0xA5A5A5

var captionPositionX = 1050
var captionPositionY = 800
var captionPositionZ = -550
var captionTextMargin = 50
var captionDeltaY = 50
var rotationAngle = Math.PI / 3
var captionRotation = [0, 2*Math.PI - rotationAngle ,0]
var captionTextColor = textColor
var captionTextHeight = 20

var filterColors = [ '#633', '#363', '#336' ];
var filters = {};
var defaultFilterEnabled = true;
var defaultFilterPositionX = -1000;
var filterPositionDeltaX = [0, 200, 400,  1550, 1750, 1950];
var menuDefaultX = -950
var menuDefaultZ = -550
var menuDefaultY = 600
var menuDefaultDeltaY = 200
var filterIdMoving = -1;
var filterIdCounter = 0;
var paymentsPerSphere = 250;
var paymentBucket = 500;
var radioPerPaymentBucket = 15;
var maxRadius = 100;
var allLanded = false;
var yGapBetweenDays = 250;
var daysOfMonth = [
    30, // 0 -> 11/2013
    31, // 1 -> 12/2013
    31, // 2 -> 01/2014
    28, // 3 -> 02/2014
    31, // 4 -> 03/2014
    30  // 5 -> 04/2014
];

var currentDate = 0;
var inspectorPositionX = 250
var inspectorPositionY = 775
var inspectorPositionZ = -550
var inspectorPositionDeltaY = 50
var inspectorTextColor = textColor
var inspectorActivated = false, filterActivated = false, showMoreFilterInstructions = false, statsCubeActivated = false;
var inspectorGroup;
var statsCube;
var vertices = {};
var cubeJoints = [];

function init() {
    var n = navigator.userAgent;
    if (n.match(/Android/i) ||
        n.match(/webOS/i) ||
        n.match(/iPhone/i) ||
        n.match(/iPad/i) ||
        n.match(/iPod/i) ||
        n.match(/BlackBerry/i) ||
        n.match(/Windows Phone/i)) {
        isMobile = true;
        antialias = false;
    }

    // camera
    var cameraFOV = 60;
    var cameraAspectRatio = window.innerWidth / window.innerHeight;
    var cameraNearPlane = 0.1;
    var cameraFarPlane = 15000;
    camera = new THREE.PerspectiveCamera(cameraFOV, cameraAspectRatio, cameraNearPlane, cameraFarPlane);
    initCamera(0, 70, 2000);
    camera.lookAt( new THREE.Vector3( 0, 0, 0 ) )        

    scene = new THREE.Scene();

    // container objects
    spheres = new THREE.Object3D();
    groundContents = new THREE.Object3D();
    scene.add(spheres);                
    scene.add(groundContents);
    
    // object picking stuff
    projector = new THREE.Projector();
    raycaster = new THREE.Raycaster();
    
    // renderer
    renderer = new THREE.WebGLRenderer({precision: "mediump", antialias: antialias});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    
    onResize = function() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', onResize, false);
      
    //leap-hands
    initLeap()
    initControls()
   
    // lights
    if (!isMobile){
        var ambientLight = new THREE.AmbientLight(0x555557);
        light = new THREE.DirectionalLight(0xffffff , 1.3);
        light.position.set( 300, 1000, 500 );
        light.target.position.set( 0, 0, 0 );
        light.castShadow = true;
        light.shadowCameraNear = 500;
        light.shadowCameraFar = 1600;
        light.shadowCameraFov = 70;
        light.shadowBias = 0.0001;
        light.shadowDarkness = 0.7;
        //light.shadowCameraVisible = true;
        light.shadowMapWidth = light.shadowMapHeight = 1024;

        scene.add(ambientLight);
        scene.add( light );
        
        renderer.shadowMapEnabled = true;
        renderer.shadowMapType = THREE.PCFShadowMap;
    }

    // background
    var buffgeoBack = new THREE.BufferGeometry();
    buffgeoBack.fromGeometry( new THREE.IcosahedronGeometry(3000,1));
    var back = new THREE.Mesh(buffgeoBack,
                              new THREE.MeshBasicMaterial( {
                                  map: gradTexture([[0.75,0.6,0.4,0.25], ['#1B1D1E','#3D4143','#72797D', '#b0babf']]),
                                  side: THREE.BackSide,
                                  depthWrite: false,
                                  fog: false }  ));
    back.geometry.applyMatrix(new THREE.Matrix4().makeRotationZ(15*ToRad));
    scene.add(back);

    // geometries
    geos['sphere'] = new THREE.BufferGeometry();
    geos['sphere'].fromGeometry( new THREE.SphereGeometry(1,16,10));
    geos['box'] = new THREE.BufferGeometry();
    geos['box'].fromGeometry( new THREE.BoxGeometry(1,1,1));
    geos['cyl'] = new THREE.BufferGeometry();
    geos['cyl'].fromGeometry( new THREE.CylinderGeometry(1, 1, 1, 20));
    
    // materials
    if(!isMobile){
        mats['sph.mx_barsandrestaurants'] = new THREE.MeshPhongMaterial( { map: basicTexture('sph.mx_barsandrestaurants'), name:'sph.mx_barsandrestaurants' } );
        mats['sph.mx_services'] = new THREE.MeshPhongMaterial( { map: basicTexture('sph.mx_services'), name:'sph.mx_services' } );
        mats['sph.mx_food'] = new THREE.MeshPhongMaterial( { map: basicTexture('sph.mx_food'), name:'sph.mx_food' } );            
	mats['sph.mx_office'] = new THREE.MeshPhongMaterial( { map: basicTexture('sph.mx_office'), name:'sph.mx_office' } );            
        mats['sph.mx_car'] = new THREE.MeshPhongMaterial( { map: basicTexture('sph.mx_car'), name:'sph.mx_car' } );            
	mats['sph.mx_auto'] = new THREE.MeshPhongMaterial( { map: basicTexture('sph.mx_auto'), name:'sph.mx_auto' } );            
	mats['sph.mx_travel'] = new THREE.MeshPhongMaterial( { map: basicTexture('sph.mx_travel'), name:'sph.mx_travel' } );            
	mats['sph.mx_sport'] = new THREE.MeshPhongMaterial( { map: basicTexture('sph.mx_sport'), name:'sph.mx_sport' } );            
	mats['sph.mx_beauty'] = new THREE.MeshPhongMaterial( { map: basicTexture('sph.mx_beauty'), name:'sph.mx_beauty' } );            
	mats['sph.mx_health'] = new THREE.MeshPhongMaterial( { map: basicTexture('sph.mx_health'), name:'sph.mx_health' } );            
	mats['sph.mx_fashion'] = new THREE.MeshPhongMaterial( { map: basicTexture('sph.mx_fashion'), name:'sph.mx_fashion' } );            
	mats['sph.mx_leisure'] = new THREE.MeshPhongMaterial( { map: basicTexture('sph.mx_leisure'), name:'sph.mx_leisure' } );            

        mats['box'] = new THREE.MeshPhongMaterial( { map: basicTexture(1), name:'box' } );
        mats['filter'] = new THREE.MeshLambertMaterial( { color: 0x3D4143, transparent: true, opacity: 0.8 } );            
        mats['ground'] = new THREE.MeshBasicMaterial( { color:debugColor, wireframe:true, transparent:true, opacity:0, fog: false, depthTest: false, depthWrite: false});
    } else {
        mats['sph.mx_barsandrestaurants'] = new THREE.MeshBasicMaterial( { map: basicTexture('sph.mx_barsandrestaurants'), name:'sph.mx_barsandrestaurants' } );
        mats['sph.mx_services'] = new THREE.MeshBasicMaterial( { map: basicTexture('sph.mx_services'), name:'sph.mx_services' } );
        mats['sph.mx_food'] = new THREE.MeshBasicMaterial( { map: basicTexture('sph.mx_food'), name:'sph.mx_food' } );            
	mats['sph.mx_office'] = new THREE.MeshBasicMaterial( { map: basicTexture('sph.mx_office'), name:'sph.mx_office' } );    
        mats['sph.mx_car'] = new THREE.MeshBasicMaterial( { map: basicTexture('sph.mx_car'), name:'sph.mx_car' } );            
	mats['sph.mx_auto'] = new THREE.MeshPhongMaterial( { map: basicTexture('sph.mx_auto'), name:'sph.mx_auto' } );            
	mats['sph.mx_travel'] = new THREE.MeshPhongMaterial( { map: basicTexture('sph.mx_travel'), name:'sph.mx_travel' } );            
        mats['sph.mx_sport'] = new THREE.MeshPhongMaterial( { map: basicTexture('sph.mx_sport'), name:'sph.mx_sport' } );            
	mats['sph.mx_beauty'] = new THREE.MeshPhongMaterial( { map: basicTexture('sph.mx_beauty'), name:'sph.mx_beauty' } );            
	mats['sph.mx_health'] = new THREE.MeshPhongMaterial( { map: basicTexture('sph.mx_health'), name:'sph.mx_health' } );
	mats['sph.mx_fashion'] = new THREE.MeshPhongMaterial( { map: basicTexture('sph.mx_fashion'), name:'sph.mx_fashion' } );
	mats['sph.mx_leisure'] = new THREE.MeshPhongMaterial( { map: basicTexture('sph.mx_leisure'), name:'sph.mx_leisure' } );                    

        
        mats['box'] = new THREE.MeshBasicMaterial( { map: basicTexture(1), name:'box' } );
        mats['filter'] = new THR
        EE.MeshLambertMaterial( { color: 0x3D4143, transparent:true, opacity:0.6 } );            
        mats['ground'] = new THREE.MeshBasicMaterial( { color:debugColor, wireframe:true, transparent:true, opacity:0, fog: false, depthTest: false, depthWrite: false});
    }

    container = document.getElementById("lab");
    container.appendChild( renderer.domElement );

    initEvents();
    initOimoPhysics();
}

function initCaption() {
	var geometry = new THREE.SphereGeometry( 20, 32, 32 )
	var position = {x: 1000, y: 1000, z:1000}
	var index = 0
	for(category in textureColors) {
		var categoryAsString = cagetoryAsString(category)
		var categoryMaterial = mats[category]
		var categorySphere = new THREE.Mesh( geometry, categoryMaterial);
		scene.add(categorySphere)
		
		var positionY = captionPositionY - index * captionDeltaY 
		categorySphere.position.x = captionPositionX
		categorySphere.position.y = positionY
		categorySphere.position.z = captionPositionZ
		
		var texPosition = [
            (captionPositionX) + captionTextMargin *Math.cos(rotationAngle), 
            positionY - captionTextHeight/2, 
            captionPositionZ + captionTextMargin *Math.sin(rotationAngle)
        ]
		var text = buildAxisText(categoryAsString, captionTextColor, texPosition, captionRotation)
		scene.add(text)
		index++
	}
}

function addStaticBox(size, position, rotation, spec) {
    var mesh;
    if(spec) mesh = new THREE.Mesh( geos.box, mats.filter );
    else mesh = new THREE.Mesh( geos.box, mats.box );
    mesh.scale.set( size[0], size[1], size[2] );
    mesh.position.set( position[0], position[1], position[2] );
    mesh.rotation.set( rotation[0]*ToRad, rotation[1]*ToRad, rotation[2]*ToRad );
    scene.add(mesh);
    grounds.push(mesh);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

function addGround(size, position, rotation) {
    var mesh = new THREE.Mesh(geos.box, mats.ground);
    mesh.scale.set( size[0], size[1], size[2] );
    mesh.position.set( position[0], position[1], position[2] );
    mesh.rotation.set( rotation[0]*ToRad, rotation[1]*ToRad, rotation[2]*ToRad );

    /*
      var helper = new THREE.BoxHelper(mesh);
      helper.material.color.setHex( debugColor );
      helper.material.opacity = debugAlpha;
      helper.material.transparent = true;
      mesh.add(helper);
    */
    helper2 = new THREE.GridHelper( 0.5, 0.0625 );
    helper2.setColors( debugColor2, debugColor );
    helper2.material.opacity = debugAlpha;
    helper2.material.transparent = true;
    helper2.position.y = 0.5;
    mesh.add(helper2);
    
    scene.add(mesh);
    grounds.push(mesh);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

function clearMeshes(){
    var i=meshs.length;
    while (i--) spheres.remove(meshs[ i ]);
    i = grounds.length;
    while (i--) scene.remove(grounds[ i ]);
    groundContents.remove(groundMesh);
    bodys = [];
    grounds = [];
    meshs = [];
    joints = [];
}

function clearFilters() {
    var filterKeys = Object.keys(filters);
    var filter;
    for (var i = 0; i < filterKeys.length; i++) {
        filter = filters[filterKeys[i]];
        filter.wall = null;
        filter.wallBody = null;
        filter.wallMesh = null;
        filter.enabled = false;
    }
}

//----------------------------------
//  OIMO PHYSICS
//----------------------------------

function initOimoPhysics(){

    // world setting:( TimeStep, BroadPhaseType, Iterations )
    // BroadPhaseType can be 
    // 1 : BruteForce
    // 2 : Sweep and prune , the default 
    // 3 : dynamic bounding volume tree

    world = new OIMO.World(1/60, 2, 8);

    addGroundToWorld();

    //populateWorld();    
}

function populateWorld() {
    
    // Reset world
    resetWorld();

    // add ground
    addGroundToWorld();
    
    // add walls
    var wall1 = new OIMO.Body({size:[1100, 10000, 50], pos:[0,5000,525], world:world, config: config});
    var wall2 = new OIMO.Body({size:[1100, 10000, 50], pos:[0,5000,-525], world:world, config: config});               
    var wall3 = new OIMO.Body({size:[50, 10000, 1000], pos:[525,5000,0], world:world, config: config});
    var wall4 = new OIMO.Body({size:[50, 10000, 1000], pos:[-525,5000,0], world:world, config: config});               
    
    // dataset by month
    var dataset = getCurrentDataset();
    var categories = Object.keys(dataset);
    var fromDay = 0;
    var toDay = 0;
    for (var i = 0; i <= month; i++) {
        toDay += daysOfMonth[i] ;
        if (i > 0) {
            fromDay += daysOfMonth[i - 1];
        }
    }

    // add objects
    var i = 0;
    var x, y, z, w, h, d,p, date;
    for (var day = fromDay; day < toDay; day++)
    {
        date = dataset[categories[0]].stats[day].date;
        y = (day - fromDay + 1) * yGapBetweenDays;

        //Performance only one category
        for (var categoryIdx = 0; categoryIdx < categories.length; categoryIdx++) {
        //for (var categoryIdx = 0; categoryIdx < 1; categoryIdx++) {
            var category = categories[categoryIdx];
            var cubesByCategoryAndDay = dataset[category].stats[day].cube;
            
            for (var cubeIdx = 0; cubeIdx < cubesByCategoryAndDay.length; cubeIdx++) {
                var cube = cubesByCategoryAndDay[cubeIdx];

                var numBodiesPerCube =
                    Math.floor(cube.num_payments / paymentsPerSphere) +
                    ((cube.num_payments % paymentsPerSphere > 0) ? 1 : 0);
                
                for (var j = 0; j < numBodiesPerCube; j++) {
                    x = -100 + Math.random()*200;
                    z = -100 + Math.random()*200;
		    w = Math.min((1 + Math.floor(cube.avg / paymentBucket)) * radioPerPaymentBucket, maxRadius);                    
                    var numPayments = (((j + 1) * paymentsPerSphere) > cube.num_payments) ?
                        cube.num_payments % paymentsPerSphere :
                        paymentsPerSphere;
                    
                    // Create sphere body and mesh
                    var sphereMetadata = {
                        date: date,
                        category: category,
                        payments: numPayments,
                        avg: cube.avg,
                        gender: cube.hash.substring(0,1),
                        age: cube.hash.substring(2),
                        landed: false,
                        isData: true
                    };
                    config[3] = spheres_mask;
                    config[4] = all_mask;
                    bodys[i] = new OIMO.Body({
                        name: 'sphere-' + i,
                        type:'sphere',
                        size:[w*0.5],
                        pos:[x,y,z],
                        move:true,
                        sleeping: false,
                        world:world,
                        metadata: sphereMetadata,
                        config: config});
                    meshs[i] = new THREE.Mesh( geos.sphere, mats['sph.' + category]);
                    meshs[i].name = i;
                    meshs[i].userData = sphereMetadata;
                    meshs[i].scale.set( w*0.5, w*0.5, w*0.5 );           
                    meshs[i].castShadow = true;
                    meshs[i].receiveShadow = true;
                    //scene.add(meshs[i++]);
                    spheres.add(meshs[i++]);
                } // bodies                    
            } // cubes                
        } // categories
    } // days

    physicsUpdateInterval = setInterval(updateOimoPhysics, 1000/60);        
}

function resetWorld() {
    turnOffInspector();
    clearInterval(physicsUpdateInterval);
    removeStatsCube();
    currentDate = 0;
    allLanded = false;
    clearMeshes();
    clearFilters();
    world.clear();    
}

function addGroundToWorld() {
    // add ground    
    config[3] = walls_mask;
    config[4] = all_mask & ~filtered_mask;
    var ground = new OIMO.Body({size:[2000, 100, 1000], pos:[0,-50,0], world:world, config: config});
    groundMesh = addGround([2000, 1, 1000], [0,0,0], [0,0,0]);
    groundContents.add(groundMesh);    
}

function updateOimoPhysics() {
    if (!analysisStarted) return;
    
    world.step();

    if (filterIdMoving > -1) {
        var movingFilter = filters[filterIdMoving];
        movingFilter.wallBody.resetPosition(movingFilter.wall.position.x, 75, 0);
    }

    var x, y, z;
    var i = bodys.length;
    var mesh;
    var body; 

    while (i--) {
        body = bodys[i].body;
        mesh = meshs[i];

        mesh.position.copy(body.getPosition());
        mesh.quaternion.copy(body.getQuaternion());

        // landing objects
        if (!allLanded) {
            if ((mesh.position.y < 100) && (!bodys[i].metadata.landed)) {
                bodys[i].metadata.landed = true;
                if (bodys[i].metadata.date > currentDate) {
                    currentDate = bodys[i].metadata.date;
                }
            }
        }
        
        // reset position
        if (mesh.position.y < -500) {
            fallBodyFromSky(body);
        }

        // contact test
        /*
          if (world.checkContact('wall', 'sphere-' + i)) {
          console.log("Contact with sphere-" + i);
          joints[joints.length] = new OIMO.Link({body1:'wall', body2:'sphere-'+i, min:0, max:0, collision:false, world:world });       
          }
        */
        
    }
}

function fallBodyFromSky(body) {    
    var x = -100 + Math.random()*200;
    var z = -100 + Math.random()*200;
    var y = 100 + Math.random()*1000;
    body.resetPosition(x,y,z);    
}

function gravity(g){
    nG = -9;
    world.gravity = new OIMO.Vec3(0, nG, 0);
}

//----------------------------------
//  TEXTURES
//----------------------------------

function gradTexture(color) {
    var c = document.createElement("canvas");
    var ct = c.getContext("2d");
    c.width = 16; c.height = 128;
    var gradient = ct.createLinearGradient(0,0,0,128);
    var i = color[0].length;
    while(i--){ gradient.addColorStop(color[0][i],color[1][i]); }
    ct.fillStyle = gradient;
    ct.fillRect(0,0,16,128);
    var texture = new THREE.Texture(c);
    texture.needsUpdate = true;
    return texture;
}

function basicTexture(texture){
    var canvas = document.createElement( 'canvas' );
    canvas.width = canvas.height = 64;
    var ctx = canvas.getContext( '2d' );
    var color = textureColors[texture];

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "rgba(0,0,0,0.2);";//colors[1];
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillRect(32, 32, 32, 32);
    var tx = new THREE.Texture(canvas);
    tx.needsUpdate = true;
    return tx;
}

function currentTime() {
	return new Date().getTime()
}
// Raycast Test
var raycastingAttemps = 0
var raycasting = function () {
	raycastingAttemps = (raycastingAttemps + 1) % 4 
	if(inspectorActivated && raycastingAttemps == 0) {

		var vector = new THREE.Vector3( 0, 0, 1 );
        projector.unprojectVector( vector, camera );
        raycaster.set( camera.position, vector.sub(camera.position).normalize());
        var intersects = raycaster.intersectObjects(spheres.children, true);
        if (intersects.length > 0) {
            var currentSelectedMesh = intersects[0].object; 
            if (currentSelectedMesh != selectedMesh) {
                if( currentSelectedMesh != previousSelectedMesh) {
	            	if(selectedMesh && !selectedMesh.isSelected) {
	                	resetSelectedMesh()
	                }
	                startSelectionTime = currentTime()
	                selectedMesh = currentSelectedMesh
	                selectedMeshOriginalMaterial = selectedMesh.material;
	                selectedMesh.material = selectedMesh.material.clone();
	                selectedMesh.material.color.setRGB(.5,0,0);
                }
            } else if(!selectedMesh.isSelected && currentTime() - startSelectionTime > SELECTION_TIME) {
            	resetPreviousSelectedMesh()
            	previousSelectedMesh = selectedMesh
            	previousSelectedMeshMaterial = selectedMeshOriginalMaterial
            	selectedMesh.material.color.setRGB(.1,0,0);
            	updateInspectionInfo(selectedMesh)
            	selectedMesh.isSelected = true
            }
        }
	} 
	
    
	/*
    if (filterIdMoving > -1) {
        var movingFilter = filters[filterIdMoving];
        var vector = new THREE.Vector3(mouse.mx, mouse.my, 1);
        projector.unprojectVector(vector, camera);
        raycaster.set(camera.position, vector.sub( camera.position ).normalize());
        var intersects = raycaster.intersectObjects(groundContents.children);
        if (intersects.length) {
            movingFilter.wall.position.copy(intersects[0].point);
        }
    }
    */
}

function updateInspectionInfo(mesh) {
	var metadata = mesh.userData
	buildInspectorInfo(metadata)
}
// UI Controls

function getCurrentDataset() {
    return eval(datasets[zipcode]);;
}

function toggleInspector() {
    inspectorActivated = !inspectorActivated;
    if (!inspectorActivated) {
    	resetSelectedMesh()
    	resetPreviousSelectedMesh()
    	removeInspectorInfo()
    }
}

function resetSelectedMesh() {
	if(selectedMesh) { 
    	selectedMesh.material = selectedMeshOriginalMaterial;
    	selectedMesh.isSelected = false;
	}
}

function resetPreviousSelectedMesh() {
	if(previousSelectedMesh) {
		previousSelectedMesh.isSelected = false
    	previousSelectedMesh.material = previousSelectedMeshMaterial
	}
}

function turnOffInspector() {
    if (inspectorActivated) {
        toggleInspector();
    }
}

function toggleFilter(filterId) {
    var filter = filters[filterId];
    filter.enabled ? disableFilter(filterId) : enableFilter(filterId)
}

function calculatePositionForFilter(filterId) {
	return  [defaultFilterPositionX + filterPositionDeltaX[filterId],75,0]
	
}
function enableFilter(filterId) {
	function enableFunction() {
		var filter = filters[filterId];
	    filter.enabled = true;
	    var filterPosition = calculatePositionForFilter(filterId)
	    if (!filter.wall) {
	        config[3] = filtered_mask;
	        config[4] = all_mask;
	        filter.wall = new THREE.Object3D();    
	        filter.wallBody = new OIMO.Body({
	            name: 'filter-' + filter.id,
	            size: [20, 150, 1000],
	            pos: filterPosition,
	            rot: [0,0,0],
	            world: world,
	            move: false,
	            config: config
	        });
	        filter.wallMesh = addStaticBox([20, 150, 1000], filterPosition, [0,0,0], true);
	        scene.add(filter.wall);
	        bodys[bodys.length] = filter.wallBody;
	        meshs[meshs.length] = filter.wallMesh;
	        filter.bodyIndex = bodys.length;
	    }
	    
	    var i = bodys.length;
	    var body;
	    while (i--) {
	        body = bodys[i];
	        if (body.metadata.isData &&
	            (body.body.jointLink == null) &&
	            filter.matchData(body.metadata)) {
	            
	            body.body.shapes.belongsTo = filtered_mask;
	            joints[joints.length] = new OIMO.Link({
	                type: 'jointBall',
	                body1: filter.wallBody.name,
	                body2: 'sphere-' + i,
	                pos1: [0, 0, body.getPosition().z],
	                pos2: [0, 0, 0],
	                min:0,
	                max:100,
	                collision:true,
	                world:world });
	        }
	    }
	}
	doUpdatingStatsCube(enableFunction)
}

function disableFilter(filterId) {
    function disableFunction() {
		var filter = filters[filterId];
	    var joint, sphere;
	    var newJoints = [];
	    
	    filter.enabled = false;
	    for (var i = 0; i < joints.length; i++) {
	        joint = joints[i];
	        if (joint.joint.body1.name == filter.wallBody.name) {
	            sphere = joint.joint.body2;
	            sphere.shapes.belongsTo = spheres_mask;
	            world.removeJoint(joint.joint);
	            fallBodyFromSky(sphere);
	        } else {
	            newJoints.push(joint);
	        }
	    }
	    joints = newJoints;
	    removeFilterWall(filterId)
    }
    
    doUpdatingStatsCube(disableFunction)
}

function removeFilterWall(filterId) {
    var filter = filters[filterId];
    scene.remove(filter.wall);
    filter.wallBody.remove();
    scene.remove(filter.wallMesh);
    filter.wall = false
    //bodys.splice(filter.bodyIndex, 1);
    //meshs.splice(filter.bodyIndex, 1);
}

function createNewFilter(name, expression) {
    var filter = {
        id: filterIdCounter++,
        name: name,
        expression: expression,
        color: filterColors[filterIdCounter % filterColors.length],
        enabled: defaultFilterEnabled,
        movingEnabled: false,
        matchData: function(data) {
            var resolvedExpression = expression.replace(/\$date/g, "data.date");
            resolvedExpression = resolvedExpression.replace(/\$gender/g, "data.gender");
            resolvedExpression = resolvedExpression.replace(/\$age_range/g, "data.age");
            resolvedExpression = resolvedExpression.replace(/\$category/g, "data.category");
            resolvedExpression = resolvedExpression.replace(/\$num_payments/g, "data.payments");
            resolvedExpression = resolvedExpression.replace(/\$avg_payment/g, "data.avg");
            return eval(resolvedExpression);
        }
    };
    return filter;
}

function toggleStatsCubeInfo() {
    statsCubeActivated ? removeStatsCube() : addStatsCube() 
}

function doUpdatingStatsCube(delegate) {
	if(statsCubeActivated) {
		removeStatsCube()
		delegate()
		addStatsCube()
	} else {
		delegate()
	}
}

function removeStatsCube() {
	statsCubeActivated = false
	scene.remove(statsCube);
	var joint;
    for (var i = 0; i < cubeJoints.length; i++) {
        joint = cubeJoints[i];
        world.removeJoint(joint.joint);
    }
    for (var key in vertices) {
        vertices[key].remove();
    }
    vertices = {};
    cubeJoints = [];
}

function addStatsCube() {
	statsCubeActivated = true
	statsCube = buildCube([-500, 0, -500], ['gender', 'age', 'avg payment'], 1100);
    scene.add(statsCube);
    enableStatsCube();
}

function cagetoryAsString(category) {
	var categories = {
		"mx_barsandrestaurants" : 'Bar/restaurants', 
		"mx_food": "Food",
		"mx_services": "Services",
		"mx_office": "Office",
		"mx_car": "Car",
		"mx_auto": "Auto",
		"mx_travel": "Travel",
		"mx_sport": "Sport",
		"mx_beauty": "Beauty",
		"mx_health": "Health",
		"mx_fashion": "Fashion",
		"mx_leisure": "Leisure"
	}   
	
	return categories[category.replace('sph.', '')]
}

function buildTextureColorsByCategoryAsString() {
	var textureColorsByCategoryAsString = {}
	for (var category in textureColors) {
		textureColorsByCategoryAsString[cagetoryAsString(category)] = textureColors[category]
	}
	return textureColorsByCategoryAsString
}

function genderAsString(gender) {
    var genders = {
        'M': 'Male',
        'F': 'Female',
        'E': 'Enterprise',
        'U': 'Unknown'
    };
    return genders[gender];
}

function ageAsString(age) {
    var ages = {
        '0': '<= 18',
        '1': '19 - 25',
        '2': '26 - 35',
        '3': '36 - 45',
        '4': '46 - 55',
        '5': '56 - 65',
        '6': '> 66',
        'U': 'unknown'
    };
    return ages[age];    
}

function selectZipCode(datasetZipCode) {
	zipcode = datasetZipCode
}

function selectPeriod(period) {
    month = period;
    initAnalysis()
}

function returnToMenu() {
	stopAnalysis()
    showMenu()
	datasetMenu.open()
}

function showMenu() {
	menuOpen = true
	labOpen = false
	document.getElementById('menu').style.display = 'block';
	document.getElementById('lab').style.display = 'none';
	menuControls.update()
}

function showLab() {
	labOpen = true
	menuOpen = false 
	document.getElementById('lab').style.display = 'block';
	document.getElementById('menu').style.display = 'none';
}

function initAnalysis() {
	resetMenu()
	startAnalysis(true)
	showLab()
}

function toggleAnalysis() {
    analysisStarted ? stopAnalysis() : startAnalysis()
}

function stopAnalysis() {
	analysisStarted = false
}

function startAnalysis(repopulate) {
	if (bodys.length == 0 || repopulate) {
        populateWorld();
    }
    analysisStarted = true
}

function removeInspectorInfo() {
	if(inspectorGroup) {
		scene.remove(inspectorGroup)
	}
	inspectorGroup = null
}

function buildInspectorInfo(metadata) {
	removeInspectorInfo()
	inspectorGroup = new THREE.Group();
	inspectorGroup.add(buildInspectorInfoMetadataLabels(metadata))
	scene.add(inspectorGroup)
}

function dateAsString(date) {
	return date.slice(6,8) + "/" + date.slice(4,6) + "/" + date.slice(0,4) 
}

function avgAsString(avg) {
	return avg + " $"
}

function buildInspectorInfoMetadataLabels(metadata) {
	var texts = new THREE.Object3D();   
    var fields = {
    		'date': {name: 'Date', formatterFunction:dateAsString},
    		'category': {name: 'Category', formatterFunction: cagetoryAsString},
    		'payments': {name: 'Number of payments', formatterFunction:null},
    		'avg': {name: 'Average payment', formatterFunction:avgAsString},
    		'gender': {name: 'Gender', formatterFunction: genderAsString},
    		'age': {name: 'Age', formatterFunction: ageAsString}
    	}
    var fieldIndex = 0
    for(fieldName in fields) {
    	var fieldInfo = fields[fieldName]
    	var fieldValue = metadata[fieldName]
    	fieldValue = fieldInfo.formatterFunction ? fieldInfo.formatterFunction.call(null, fieldValue) : fieldValue
    			
    	var textPosition = [inspectorPositionX, inspectorPositionY - fieldIndex *inspectorPositionDeltaY , inspectorPositionZ]
    	texts.add(buildAxisText(fieldInfo.name + ': ' + fieldValue, inspectorTextColor, textPosition , [0, 0, 0]));
    	fieldIndex++
    }
	return texts
}


function buildCube(position, labels, length) {
    var axes = buildCubeAxes(position, length);
    var texts = buildCubeLabels(position, labels, length);    
    buildCubeVertices();
    
    cubeGroup = new THREE.Group();    
    cubeGroup.add(axes);
    cubeGroup.add(texts);
        
    return cubeGroup;
}

function buildCubeAxes(position, length) {
    var axes = new THREE.Object3D();
    axes.add(buildAxis(new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( length, 0, 0 ), statsCubeColor, false)); // +X
    axes.add(buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, length, 0 ), statsCubeColor, false)); // +Y
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, length ), statsCubeColor, false)); // +Z
    axes.translateX(position[0]);
    axes.translateY(position[1]);    
    axes.translateZ(position[2]);
    return axes;
}

function buildCubeLabels(position, labels, length) {
    var texts = new THREE.Object3D();   
    texts.add(buildAxisText(labels[0], textColor, [length, 0, 0], [0, 0, 0]));
    texts.add(buildAxisText(labels[1], textColor, [0, length, 0], [0, 0, Math.PI/2]));
    var labelZ = buildAxisText(labels[2], textColor, [0, 0, length], [0, Math.PI/2, 0]);
    texts.add(labelZ);

    labelZ.geometry.computeBoundingBox();
    labelZBoundingBox = labelZ.geometry.boundingBox;
    var labelZWidth = (labelZBoundingBox.max.x - labelZBoundingBox.min.x);
    labelZ.position.z += labelZWidth;
    
    
    texts.translateX(position[0]);
    texts.translateY(position[1]);    
    texts.translateZ(position[2]);    
    return texts;
}

function buildAxisText(text, colorHex, position, rotation) {
    var textMaterial = new THREE.MeshBasicMaterial({ color: colorHex, overdraw: 0.5 });
    var text3d = new THREE.TextGeometry(text, {
	size: captionTextHeight,
	height: captionTextHeight * 0.1,
	curveSegments: 2,
	font: "helvetiker"
    });
        
    var textMesh = new THREE.Mesh(text3d, textMaterial);
        
    textMesh.position.x = position[0];
    textMesh.position.y = position[1];
    textMesh.position.z = position[2];
    
    textMesh.rotation.x = rotation[0];
    textMesh.rotation.y = rotation[1];
    textMesh.rotation.z = rotation[2];    
    
    return textMesh;
}
    
   
function buildAxis(src, dst, colorHex, dashed, text) {
    var geom = new THREE.Geometry(), mat;

    if(dashed) {
        mat = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: 3, gapSize: 3 });
    } else {
        mat = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
    }
    
    geom.vertices.push( src.clone() );
    geom.vertices.push( dst.clone() );
    geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines
    
    var axis = new THREE.Line( geom, mat, THREE.LinePieces );
    
    return axis;
}

function buildCubeVertices() {
    vertices = {};
    var stepX = 1000/3;        
    var i = bodys.length;
    var body, verticeX, verticeKey;
    var maxAvg = getMaxAvgPaymentNotFiltered();
    while (i--) {
        body = bodys[i];
        if (body && body.metadata.isData && (body.body.jointLink == null)) {
            if ((body.metadata.gender != 'U') &&
                (body.metadata.gender != 'E') &&
                (body.metadata.age != 'U')) {

                switch (body.metadata.gender) {
                    case 'M': verticeX = stepX - 500; break;
                    case 'F': verticeX = 2 * stepX - 500; break;
                }
                verticeY = (1000 / 8) * (parseInt(body.metadata.age) + 1);
                verticeZ = (1000 * body.metadata.avg / maxAvg) - 500;
                verticeKey = body.metadata.gender + '-' + body.metadata.age + '-' + body.metadata.avg;
                vertice = new OIMO.Body({
                    name: verticeKey,
                    size: [1, 1, 1],
                    pos: [verticeX, verticeY, verticeZ],
                    rot: [0,0,0],
                    world: world,
                    move: false
                });
                vertices[verticeKey] = vertice;
            }
        }
    }    
}

function getMaxAvgPaymentNotFiltered() {
    var body, maxAvgPaymentNotFiltered = 0;    
    var i = bodys.length;
    while (i--) {
        body = bodys[i];
        if (body && body.metadata.isData && (body.body.jointLink == null)) {
            if (body.metadata.avg > maxAvgPaymentNotFiltered) {
                maxAvgPaymentNotFiltered = body.metadata.avg;
            }
        }
    }
    return maxAvgPaymentNotFiltered;
}

function enableStatsCube() {
    var i = bodys.length;
    var body, verticeKey;    
    while (i--) {
        body = bodys[i];
        if (body && body.metadata.isData && (body.body.jointLink == null)) {
            verticeKey = body.metadata.gender + "-" + body.metadata.age + "-" + body.metadata.avg;
            if (vertices[verticeKey] != undefined) {
                cubeJoints[cubeJoints.length] = new OIMO.Link({
                    type: 'jointBall',
                    body1: verticeKey,
                    body2: 'sphere-' + i,
                    pos1: [0, 0, 0],
                    pos2: [0, 0, 0],
                    min:0,
                    max:100,
                    collision:true,
                    world:world });                
            }
        }
    }    
}

function setupSampleFilters() {
    var sampleFilters = [
        {
            name: "Men payments",
            expression: "$gender == 'M'"
        },
        {
            name: "Women payments",
            expression: "$gender == 'F'"
        },
        {
            name: "Age group 1",
            expression: "$age_range == 1"
        },
        {
            name: "Age group 2 (36-45 years)",
            expression: "$age_range == 2"
        },
        {
            name: "Age group 3 (36-45 years)",
            expression: "$age_range == 3"
        },
    ];
    var filter;
    for (var i in sampleFilters) {
        filter = createNewFilter(sampleFilters[i].name, sampleFilters[i].expression);
        filter.enabled = false;
        filters[filter.id] = filter;
    }    
}

init();
setupSampleFilters();
initMenu();
initCaption();
loop();

function radianToDegree(radian) {
	return radian * (180 / Math.PI);
}

function createBodyFromMesh(mesh) {
	if( mesh.geometry instanceof THREE.SphereGeometry ){
		var options	= {
			type	:'sphere',
			size	: [mesh.geometry.parameters.radius * mesh.scale.x],
			pos	: mesh.position.toArray(),
			rot	: mesh.rotation.toArray().slice(0,3).map(radianToDegree),
			world	: world,
			move	: true
		}
		// actually build the OIMO.Body
	} else {
		var options	= {
			type	:'box',
			size	: [
				mesh.geometry.parameters.radiusTop*2, 
				mesh.geometry.parameters.height ,
				mesh.geometry.parameters.radiusTop*2,
			],
			pos	: mesh.position.toArray(),
			world	: world,
			move	: true
		}
		console.log(options.size)
	}
	var body	= new OIMO.Body(options)
	return body
}

function updateBodyFromMeshPosition(mesh, body) {
	body.setPosition(mesh.position);
	body.setQuaternion(mesh.quaternion);
}

function HandMeshOimizer() {
	var self = this
	this.hands = {}
	
	
	this.updateHand = function(handMesh) {
		if(this.hands[getHandMeshId(handMesh)]) {
			//console.log("Updating hand bodies position")
			updateHandBodiesPosition(handMesh, this.hands[getHandMeshId(handMesh)])
		} else {
			//console.log("Creating hand bodies")
			this.hands[getHandMeshId(handMesh)] = []
			createBodiesForHand(handMesh)
		}
	}
	
	this.removeHand = function(handMesh) {
		//console.log("Removing hand bodies")
		var handBody = this.hands[getHandMeshId(handMesh)] 
		for(var fingerIndex = 0; fingerIndex < handBody.length; fingerIndex++) {
			var fingerBodies = handBody[fingerIndex]
			for(var fingerBodyIndex = 0; fingerBodyIndex < fingerBodies.length; fingerBodyIndex++) {
				world.removeRigidBody(fingerBodies[fingerBodyIndex].body);
			}
		}
		console.log("removing from mesh")
		
		this.hands[getHandMeshId(handMesh)] = null
	}
	
	function updateHandBodiesPosition(handMesh, bodies) {
		for(var fingerIndex = 0; fingerIndex < handMesh.fingerMeshes.length; fingerIndex++) {
			var finger = handMesh.fingerMeshes[fingerIndex]
			var fingerBodies = []
			for(var fingerMeshIndex = 0; fingerMeshIndex < finger.length; fingerMeshIndex++) {
				updateBodyFromMeshPosition(finger[fingerMeshIndex], bodies[fingerIndex][fingerMeshIndex])
			}
		}
	}
	
	function createBodiesForHand(handMesh) {
		for(var fingerIndex = 0; fingerIndex < handMesh.fingerMeshes.length; fingerIndex++) {
			var finger = handMesh.fingerMeshes[fingerIndex]
			var fingerBodies = []
			for(var fingerMeshIndex = 0; fingerMeshIndex < finger.length; fingerMeshIndex++) {
				fingerBodies.push(createBodyFromMesh(finger[fingerMeshIndex]))
			}
			self.hands[getHandMeshId(handMesh)].push(fingerBodies)
		}
	}
	
	function getHandMeshId(handMesh) {
		return handMesh.armBones[0].id
	}
	
}

var handOimizer = new HandMeshOimizer()

function initLeap() {
	  var controller = Leap.loop({frameEventName: 'animationFrame'});
	  
	  // Docs: http://leapmotion.github.io/leapjs-plugins/main/transform/
	  Leap.loopController.use('transform', {

	    // This matrix flips the x, y, and z axis, scales to meters, and offsets the hands by -8cm.
	    vr: true,

	    // This causes the camera's matrix transforms (position, rotation, scale) to be applied to the hands themselves
	    // The parent of the bones remain the scene, allowing the data to remain in easy-to-work-with world space.
	    // (As the hands will usually interact with multiple objects in the scene.)
	    effectiveParent: camera

	  });

	   // Docs: http://leapmotion.github.io/leapjs-plugins/main/bone-hand/
	  Leap.loopController.use('boneHand', {

	    // If you already have a scene or want to create it yourself, you can pass it in here
	    // Alternatively, you can pass it in whenever you want by doing
	    // Leap.loopController.plugins.boneHand.scene = myScene.
	    scene: scene,
	    scale: 100000,
	    // Display the arm
	    arm: true,
	    
	    onHandMeshUpdated : function(handMesh ) {
	    	handOimizer.updateHand(handMesh)
	    },
	    onHandMeshLost : function(handMesh ) {
	    	handOimizer.removeHand(handMesh)
	    }
	  });
	  
	  /*
	  Leap.loopController.use('pinchInfo', {pinchTimeToEmitEvent:1000}).on('indexPinched', function() {
		  console.log("index")
	  }).on('middlePinched', function() {
		  if(!open) {
			  toggleAnalysis()
	          threeMenu.open()
	          open = true
	          $("#menu").show()
	          $("#lab").hide()
		  }
	  }).on('ringPinched', function() {
		  if(!open) {
			  toggleAnalysis()
		  }
      }).on('pinkyPinched', function() {
		  console.log("pinky")
	  })
	  */
}

function initControls() {
    //Controls
    //controls = new THREE.LeapPinchRotateControls( camera , controller );

	// Moves (translates and rotates) the camera
	  vrControls = new THREE.VRControls(camera, true, 1000, {x:0, y:400, z: 250});

	  vrEffect = new THREE.VREffect(renderer);

	  onkey = function(event) {
	    if (event.key === 'z') {
	      vrControls.zeroSensor();
	    }
	    if (event.key === 'f') {
	      return vrEffect.setFullScreen(true);
	    }
	  };

	  window.addEventListener("keypress", onkey, true);
}

function resetMenu() {
	labMenu.reset()
}

function initMenu() {
    labMenu = new THREE.Menu(scene, camera, projector, raycaster, {
    	drawAsLinear: true, 
    	drawBackground:false, 
    	menuItemSize : 100
    })
    
    var statusMenuSelect = labMenu.createMenuSelect('', buildPositionForMenuByRowIndex(0))
    var stopStartMenuAction = labMenu.createActionMenuItem('img/menu/pause.png', 'img/menu/pause_checked.png', null, function() {
    	toggleAnalysis() 
    }) 
    
    var goToMenuAction = labMenu.createActionMenuItem('img/menu/return.png', '', null, function() {
    	returnToMenu()
    }) 
    
    var restartAnalysis = labMenu.createActionMenuItem('img/menu/restart.png', '', null, function() {
    	initAnalysis()
    })  
    
    statusMenuSelect.addMenuItem(stopStartMenuAction)
    statusMenuSelect.addMenuItem(goToMenuAction)
    statusMenuSelect.addMenuItem(restartAnalysis)
    
    labMenu.addMenuSelect(statusMenuSelect)
    
    var filtersMenuSelect = labMenu.createMenuSelect('', buildPositionForMenuByRowIndex(1))
    
    for(var filterId in filters) {
    	var filterMenuItem = labMenu.createActionMenuItem(buildImageNameByFilterId(filterId), 
    				buildCheckedImageNameByFilterId(filterId), null, (function() {
    		var filterIdCopy = filterId
    		return function() {
    			toggleFilter(filterIdCopy)
    		}
    	})()) 
        filtersMenuSelect.addMenuItem(filterMenuItem)    
    }
    
    labMenu.addMenuSelect(filtersMenuSelect)
    
    var statsSelect = labMenu.createMenuSelect('', buildPositionForMenuByRowIndex(2))
    var statsMenuItem = labMenu.createActionMenuItem('img/menu/statsCube.png', 'img/menu/statsCube_checked.png', null, function() {
    	toggleStatsCubeInfo()
    })
    var inspectorMenuItem = labMenu.createActionMenuItem('img/menu/inspector.png', 'img/menu/inspector_checked.png', null, function() {
    	toggleInspector()
    }) 
    statsSelect.addMenuItem(statsMenuItem)
    statsSelect.addMenuItem(inspectorMenuItem)
    labMenu.addMenuSelect(statsSelect)
}

function buildPositionForMenuByRowIndex(rowIndex) {
	var yPosition = menuDefaultY - rowIndex* menuDefaultDeltaY
	return {x: menuDefaultX, y: yPosition,  z:menuDefaultZ}
}

function buildImageNameByFilterId(filterId) {
	return 'img/menu/filters/' + filterId + '.png'
}

function buildCheckedImageNameByFilterId(filterId) {
	return 'img/menu/filters/' + filterId + '_checked.png'
}

function loop() {
	if(labOpen) {
		vrControls.update();
		labMenu.updateAll();
		vrEffect.render(scene, camera);
	    requestAnimationFrame( loop );
	    raycasting()
	} else {
		setTimeout(loop, 100)
	}
}
