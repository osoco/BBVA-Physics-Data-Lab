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
    var renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.autoClear = false

    var isMobile = isMobilePhone()
    var vrEffect = initEffect()
    var vrControls = isMobile ? new THREE.DeviceOrientationControls(camera) : new THREE.VRControls(camera, false, 0);
    
    var onResize = function() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        if(isMobile) {
        	vrEffect.setSize(window.innerWidth, window.innerHeight)
        } else {
        	renderer.setSize(window.innerWidth, window.innerHeight)
        }
        
    }
    window.addEventListener('resize', onResize, false)
 
    var container = document.getElementById("menu")
    container.appendChild( renderer.domElement )

    setTimeout(function() {
    	vrControls.update()
    	datasetMenu = initMenu()
        loop()
    }, 150)
        
    function initEffect() {
    	var effect
    	if(isMobile) {
    		effect = new THREE.StereoEffect(renderer);
    		effect.eyeSeparation = 10;
    		effect.setSize( window.innerWidth , window.innerHeight);
        } else {
        	effect = new THREE.VREffect(renderer);
        }
    	return effect
    }

    function loop() {
		if(menuOpen) {
	    	vrControls.update()
	    	datasetMenu.update()
	    	if(isMobile) {
	    		onResize()	
	    	}
	    	vrEffect.render(scene, camera)
	        requestAnimationFrame( loop )
	    } else {
			setTimeout(loop, 100)
		}
    }
   
    function initMenu() {
        var threeMenu = new THREE.Menu(scene, camera, projector, raycaster, {drawBackground:true})

        var zipCodeMenuSelect = threeMenu.createMenuSelect('')
        var periodMenuSelect = threeMenu.createMenuSelect('')
        
        for(var datasetZipCode in datasets) {
        	var zipCodeMenuAction = threeMenu.createActionMenuItem(buildImageNameByZipCode(datasetZipCode),'', periodMenuSelect, function() {
                    var dataSetZipCodeCopy = datasetZipCode
                    return function() {
                	   selectZipCode(dataSetZipCodeCopy)
                    }
                }()) 
            zipCodeMenuSelect.addMenuItem( zipCodeMenuAction)
        }
        
        for(var periodIndex = monthAsString.length -1 ; periodIndex >= 0 ; periodIndex--) {
        	var periodMenuAction = threeMenu.createActionMenuItem(buildImageNameByPeriodIndex(periodIndex), '', null, (function() {
        		var periodIndexCopy = periodIndex 
        		return function() {
        			selectPeriod(periodIndexCopy)
        		}
            })())
            periodMenuSelect.addMenuItem(periodMenuAction)
        }
        
        var peridodBackMenuAction = threeMenu.createActionMenuItem('img/Back.png', '', zipCodeMenuSelect, function() {}) 
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
