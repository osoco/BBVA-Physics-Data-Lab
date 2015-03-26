;(function() {
    window.datasetMenu = null
    
	var cameraFOV = 60
    var cameraAspectRatio = window.innerWidth / window.innerHeight
    var cameraNearPlane = 0.1
    var cameraFarPlane = 15000
    var camera = new THREE.PerspectiveCamera(cameraFOV, cameraAspectRatio, cameraNearPlane, cameraFarPlane)
    camera.lookAt( new THREE.Vector3( 0, 0, 0 ) )        
    
    var scene = new THREE.Scene()
    var projector = new THREE.Projector()
    var raycaster = new THREE.Raycaster()

    // renderer
    var renderer = new THREE.WebGLRenderer({precision: "mediump", antialias: true})
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.autoClear = false

    var vrControls = new THREE.VRControls(camera, false, 0);
    var vrEffect = new THREE.VREffect(renderer);
   
    var onResize = function() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize, false)
 
    var container = document.getElementById("menu")
    container.appendChild( renderer.domElement )

    setTimeout(function() {
    	vrControls.update()
    	datasetMenu = initMenu()
        loop()
    }, 150)
        
    function loop() {
		if(menuOpen) {
	    	vrControls.update()
	    	vrEffect.render(scene, camera)
	        datasetMenu.update()
	        requestAnimationFrame( loop )
		} else {
			setTimeout(loop, 100)
		}
    }
   
    function initMenu() {
        var threeMenu = new THREE.Menu(scene, camera, projector, raycaster)

        var zipCodeMenuSelect = threeMenu.createMenuSelect('img/Config.png')
        var periodMenuSelect = threeMenu.createMenuSelect('img/Config.png')
        
        for(var datasetZipCode in datasets) {
        	var zipCodeMenuAction = threeMenu.createActionMenuItem(buildImageNameByZipCode(datasetZipCode), periodMenuSelect, function() {
                	selectZipCode(datasetZipCode)
            }) 
            zipCodeMenuSelect.addMenuItem( zipCodeMenuAction)
        }
        
        for(var periodIndex in monthAsString) {
        	var periodMenuAction = threeMenu.createActionMenuItem(buildImageNameByPeriodIndex(periodIndex), null, (function() {
        		var periodIndexCopy = periodIndex 
        		return function() {
        			selectPeriod(periodIndexCopy)
        		}
            })())
            periodMenuSelect.addMenuItem(periodMenuAction)
        }
        
        var peridodBackMenuAction = threeMenu.createActionMenuItem('img/Back.png', zipCodeMenuSelect, function() {}) 
        periodMenuSelect.addMenuItem(peridodBackMenuAction)
        
        threeMenu.addMenuSelect(zipCodeMenuSelect)
        threeMenu.addMenuSelect(periodMenuSelect)
        threeMenu.setRoot(zipCodeMenuSelect)
        threeMenu.open()
        
        return threeMenu
    }
    
    function buildImageNameByZipCode(zipCode) {
    	return 'img/menu/' + zipCode + '.png'
    }
    
    function buildImageNameByPeriodIndex(periodIndex) {
    	return 'img/menu/' + periodIndex + '.png'
    }
    
    menuControls = vrControls
    menuCamera = camera
})()
    
showMenu()
