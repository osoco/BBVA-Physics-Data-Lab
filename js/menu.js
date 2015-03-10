        $("#lab").hide()
        
$(function() {
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

    initMenu()
    loop()
    
    function loop() {
		if(open) {
		    	vrControls.update()
		        vrEffect.render(scene, camera)
		        threeMenu.update()
		        requestAnimationFrame( loop )
		} else {
			setTimeout(loop, 100)
		}
    }
    
      
      onkey = function(event) {
          if (event.key === 'm') {
            toggleAnalysis()
            threeMenu.open()
            open = true
        	$("#menu").show()
        	$("#lab").hide()
          }
        };

        window.addEventListener("keypress", onkey, true);
        
    function initMenu() {
        threeMenu = new THREE.Menu(scene, camera, projector, raycaster)
        
        var periods = {
               "Nov 2013":0,
               "Dec 2013":1,
               "Jan 2014":2,
               "Feb 2014":3,
               "Mar 2014":4,
               "Apr 2014":5
        }
        
        var zipCodeMenuSelect = threeMenu.createMenuSelect('img/Config.png')
        var periodMenuSelect = threeMenu.createMenuSelect('img/Config.png')
        
        for(var datasetZipCode in datasets) {
            var zipCodeMenuAction = threeMenu.createActionMenuItem('img/Config.png', periodMenuSelect, function() {
                	zipcode = datasetZipCode
            }) 
            zipCodeMenuSelect.addMenuItem( zipCodeMenuAction)
        }
        
        for(var period in periods) {
        	var periodMenuAction = threeMenu.createActionMenuItem('img/Config.png', null, (function() {
        		var periodCopy = period 
        		return function() {
        			open = false
        			selectPeriod(periods[periodCopy])
        			toggleAnalysis()
        			$("#menu").hide()
                 	$("#lab").show()
                 	
        		 }
            })())
            periodMenuSelect.addMenuItem(periodMenuAction)
        }
        
        threeMenu.addMenuSelect(zipCodeMenuSelect)
        threeMenu.addMenuSelect(periodMenuSelect)
        threeMenu.setRoot(zipCodeMenuSelect)
        threeMenu.open()
        open = true
    }
})
    
