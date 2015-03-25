window.osoco = window.osoco || {}
window.osoco.three = window.osoco.three || {} 

Object.defineProperty(Object.prototype, "extend", {
    value: function(otherObject) {
	for(var prop in otherObject) {
		this[prop] = otherObject[prop]
	}
    },
    writable: false,
    enumerable: false,
    configurable: false
})

;(function() {
	function getCurrentTime() {
		return new Date().getTime()
	}
    /**
     * Options:
     * drawAsLinear -> draw linear menuSelect
     * drawBackgraund -> draw background
     */
	function Menu(scene, camera, projector, raycaster, options) {
		options = options || {}
		var SELECT_MENU_ITEM_TIME = 1500
		var ROTATE_MENU_DELAY = 1400
		
		this.menuItemsCounter = 0
		this.menuSelectsCounter = 0 
		this.scene = scene
		this.camera = camera
		this.projector = projector
		this.raycaster = raycaster
		this.menuElements = []
		this.menuSelects = []
		
		var root

		this.currentMenu  
		var drawer = new MenuDrawer(scene, camera, options)

		this.setRoot = function(menuSelect) {
			root = menuSelect
		}
		
		this.addMenuSelect = function(menuSelect) {
			drawer.drawMenuSelect(menuSelect)
		}
		
		this.open = function() {
			this.currentMenu = root
			translateToCurrentMenu.call(this, true)
		}
		
		this.update = function() {
			updateViewCenterPosition()
			if(this.currentMenu) {
				rayTest.call(this, this.currentMenu)
			}
		}
		
		this.updateAll = function() {
			updateViewCenterPosition()
			for(var i = 0; i < this.menuSelects.length; i++) {
				rayTest.call(this, this.menuSelects[i])
			}
		}

		this.createMenuSelect = function(imageUrl, menuCenterVector) {
			var menuSelect = new MenuSelect(imageUrl, this.menuItemsCounter++)
			menuSelect.center = menuCenterVector || createCenterForMenuSelect(this.menuSelectsCounter ++)
			this.menuElements.push(menuSelect)
			this.menuSelects.push(menuSelect)
			return menuSelect
		}
		
		this.createActionMenuItem = function(imageUrl, menuSelectToRedirect, action) {
			var actionMenuItem = new ActionMenuItem(imageUrl, this.menuItemsCounter++, menuSelectToRedirect, action)
			return actionMenuItem
		}
		
		function createCenterForMenuSelect(currentMenuSelect) {
			//return new THREE.Vector3(0, currentMenuSelect * 10, 0)
			//return new THREE.Vector3( Math.random() * 1000, currentMenuSelect * 10, Math.random() * 1000 )
			return new THREE.Vector3(0 , currentMenuSelect * 50, 0 )
		}
		
		function isMenuItemSelected(menuItem, currentTime) {
			currentTime = currentTime || getCurrentTime()
			return menuItem.firstSelectionTime && currentTime - menuItem.firstSelectionTime > SELECT_MENU_ITEM_TIME
		}

		function rayTest(menuSelect) {
			var vector = new THREE.Vector3( 0, 0, 1 );
			projector.unprojectVector( vector, camera );
			raycaster.set( camera.position, vector.sub(camera.position).normalize());
			var intersects = raycaster.intersectObjects( menuSelect.threeMenuItems.children);

			var preSelectedMenuItemMesh = intersects.length > 0 ? intersects[0].object : null 
			var preSelectedMenuItem = preSelectedMenuItemMesh && preSelectedMenuItemMesh.menuItem
			if(preSelectedMenuItem) {
				var currentTime = getCurrentTime()
				preSelectedMenuItem.firstSelectionTime = preSelectedMenuItem.firstSelectionTime || currentTime
				if(isMenuItemSelected(preSelectedMenuItem, currentTime) && !preSelectedMenuItem.isSelected) {
					preSelectedMenuItem.isSelected = true
					this.onMenuItemSelected(preSelectedMenuItem)
				}
			}
			resetFirstSelectionTime(menuSelect, preSelectedMenuItem)
			drawer.updateMenu(menuSelect, preSelectedMenuItem, preSelectedMenuItemMesh)
		}
		
		this.onMenuItemSelected = function(menuItem) {
			menuItem.onSelect(this)
		}
		
		this.onActionMenuItemSelected = function(actionMenuItem) {
			actionMenuItem.action()
			if(actionMenuItem.menuSelectToRedirect) {
				this.changeMenuSelect(actionMenuItem.menuSelectToRedirect)
			}
		}
		
		this.onMenuSelectSelected = function(menuSelect) {
			this.changeMenuSelect(menuSelect)
		}
		
		this.changeMenuSelect = function(newMenuSelect) {
			this.currentMenu = newMenuSelect
			resetFirstSelectionTime(this.currentMenu, null)
			translateToCurrentMenu.call(this)
		}
		
		function resetFirstSelectionTime(menu, avoidedMenuItem) {
			menu.doWithMenuItemsMeshes(avoidedMenuItem, function(menuItem, menuItemMesh) {
				menuItem.firstSelectionTime = 0
				menuItem.isSelected = false
			})
		}

		function updateViewCenterPosition() {
			var vector = new THREE.Vector3( 0.0, 0.0, 1 );
			projector.unprojectVector( vector, camera );
			var direction = vector.sub(camera.position).normalize()
			drawer.updateViewCenterPosition(direction)
		}
		
		function translateToCurrentMenu(withoutTransition) {
			drawer.translateCamera(this.currentMenu.center, withoutTransition)
			var that = this
			setTimeout(function() {
				drawer.rotateMenu(that.currentMenu)
			}, withoutTransition ? 0 : ROTATE_MENU_DELAY)
		}
	} 


	/*****************************************************************************************************************/
	/************************************                DRAWER                     **********************************/
	/*****************************************************************************************************************/

	function MenuDrawer(scene, camera, options) {
		var DEFAULT_MENU_ITEM_SIZE = 10
		var UNSELECTED_COLOR = 0x00ff00 
		var PRESELECTED_COLOR = 0x00ffff
		var SELECTED_COLOR = 0xff0000

		var VIEW_CENTER_RADIOUS = 0.25
		var VIEW_CENTER_TUBE_RADIOUS = 0.1
		var VIEW_RADIAL_SEGMENTS = 8*10
		var VIEW_TUBULAR_SEGMENTS = 6*15
		var VIEW_ARC = Math.PI * 2;
		var VIEW_CENTER_COLOR = 0xffff00
		var VIEW_CENTER_DISTANCE_FACTOR = 5

		var MENU_RADIOUS = 30
		var MENU_ITEM_ROTATION_DELTA = Math.PI / 8

		var TRANSLATE_CAMERA_STEPS = 100
		var CAMERA_TRANSLATION_ANIMATION_TIME = 1500

		var ROTATE_MENU_STEPS = 40
		var MENU_ROTATION_ANIMATION_TIME = 600

		var STARS_NUMBER = 10000
		var viewCenter = createViewCenter()
		
		var drawAsLinear = options.drawAsLinear
	    var drawBackgraund = options.drawBackground
	    var menuItemSize = options.menuItemSize || DEFAULT_MENU_ITEM_SIZE  
	    
	    var MENU_LINEAR_DISTANCE = menuItemSize * 1.2
	    
	    init()
		function init() {
			camera.quaternion.y = 0.99
			if(drawBackgraund) {
				drawStars()
			}
		}
		
		function createViewCenter() {
			var geometry = new THREE.TorusGeometry(VIEW_CENTER_RADIOUS, VIEW_CENTER_TUBE_RADIOUS, 
					VIEW_RADIAL_SEGMENTS, VIEW_TUBULAR_SEGMENTS, VIEW_ARC);
			var material = new THREE.MeshBasicMaterial( { color: VIEW_CENTER_COLOR} );
			var torus = new THREE.Mesh( geometry, material );

			scene.add(torus)
			return torus
		}

		function drawStars() {
			var geometry = new THREE.Geometry();

            for ( var i = 0; i < STARS_NUMBER; i ++ ) {
            	var vertex = new THREE.Vector3();
                vertex.x = THREE.Math.randFloatSpread( 2000 );
                vertex.y = THREE.Math.randFloatSpread( 2000 );
                vertex.z = THREE.Math.randFloatSpread( 2000 );
                geometry.vertices.push( vertex );
            }

            var particles = new THREE.PointCloud( geometry, new THREE.PointCloudMaterial( { color: 0x888888 } ) );
            scene.add( particles );
		}
		
		this.updateMenu = function(menu, preSelectedMenuItem, preSelectedMenuItemMesh) {
			if(preSelectedMenuItem) {
				if(preSelectedMenuItem.isSelected) {
					setMenuItemAsSelected(preSelectedMenuItem, preSelectedMenuItemMesh)
				} else {
					setMenuItemAsPreSelected(preSelectedMenuItem, preSelectedMenuItemMesh)
				}
			}
			setMenuItemsAsUnSelected(menu, preSelectedMenuItem)
		}

		function setMenuItemAsSelected(selectedMenuItem, selectedMenuItemMesh) {
			selectedMenuItemMesh.material = selectedMenuItem.selectedMaterial
		}

		function setMenuItemAsPreSelected(preSelectedMenuItem, preselectedMenuItemMesh) {
			preselectedMenuItemMesh.material = preSelectedMenuItem.preSelectedMaterial
		}

		function setMenuItemsAsUnSelected(menu, selectedMenuItem) {
			menu.doWithMenuItemsMeshes(selectedMenuItem, function(menuItem, menuItemMesh) {
				menuItemMesh.material = menuItem.unselectedMaterial
			})
			var menuItems = menu.menuItems
		}

		this.drawMenuSelect = function(menu) {
			var threeMenu = new THREE.Object3D()
			menu.threeMenuItems = threeMenu
			
			scene.add(threeMenu)
			menu.doWithMenuItems(function(menuItem, menuItemIndex) {
				var menuItemMesh = createMeshForMenuItem(menuItem)
				threeMenu.add(menuItemMesh)
			})
			
			menu.centerRotation = (MENU_ITEM_ROTATION_DELTA * (menu.menuItems.length - 1)/2)
			this.colocateMenuMeshes(menu, 0, true)
		}
		
		this.doWithMenuItemsMeshes = function(avoidedMenuItem, delegate) {
			var menuItemsMeshes = trheeMenuItems.children
			for (var i = 0; i < this.menuItemsMeshes.length; i++) {
				var menuItemMesh = this.menuItemsMeshes[i]
				var menuItem = menuItemMesh.menuItem
				if(menuItem !== avoidedMenuItem) {
					delegate(menuItem, menuItemMesh)
				}
			}
		}

		function createMeshForMenuItem(menuItem) {
			var texture = new THREE.ImageUtils.loadTexture( menuItem.imageUrl )
			var imgGeometry = new THREE.PlaneGeometry(menuItemSize,menuItemSize)

			menuItem.unselectedMaterial = buildMenuMaterial(texture, UNSELECTED_COLOR)
			menuItem.preSelectedMaterial = buildMenuMaterial(texture,PRESELECTED_COLOR)
			menuItem.selectedMaterial = buildMenuMaterial(texture,SELECTED_COLOR)
			var mesh = new THREE.Mesh(imgGeometry, menuItem.unselectedMaterial)
			mesh.menuItem = menuItem
			return mesh 
		}

		this.colocateMenuMeshes = function(menu, rotationDelta, reset) {
			menu.currentRotation =  reset ? 0 : (menu.currentRotation + rotationDelta) % (Math.PI * 2) 
			menu.doWithMenuItemsMeshes(null, function(menuItem, menuItemMesh, menuItemIndex) {
				colocateMenuMesh(menuItemMesh, menu, menuItemIndex)
			})
		}
		
		function colocateMenuMesh(mesh, menu, menuItemIndex) {
			var rotation = MENU_ITEM_ROTATION_DELTA*menuItemIndex + menu.currentRotation
			var menuCenter = menu.center
			mesh.position.y = menuCenter.y
			if(drawAsLinear) {
				mesh.position.x = menuCenter.x + MENU_LINEAR_DISTANCE * menuItemIndex
				mesh.position.z = menuCenter.z
			} else {
				mesh.position.x = menuCenter.x + MENU_RADIOUS*Math.sin(rotation)
				mesh.position.z = menuCenter.z + MENU_RADIOUS*Math.cos(rotation)
				mesh.lookAt(menuCenter);
			}
		}

		function buildMenuMaterial(texture, color) {
			return new THREE.MeshBasicMaterial({map: texture, side: THREE.DoubleSide, transparent: false, color: color});
		}

		this.translateCamera = function(newPosition, withoutTransition) {
			var cameraSteps = withoutTransition ? 1 : TRANSLATE_CAMERA_STEPS
			var deltax = (newPosition.x - camera.position.x) / cameraSteps
			var deltay = (newPosition.y - camera.position.y) / cameraSteps
			var deltaz = (newPosition.z - camera.position.z) / cameraSteps

			
			viewCenter.visible = false
			updateCamera(0)

			function updateCamera(currentSteps) {
				camera.position.x += deltax
				camera.position.y += deltay
				camera.position.z += deltaz
				if(++currentSteps < cameraSteps) {
					setTimeout(
							function () {updateCamera(currentSteps)}, 
							CAMERA_TRANSLATION_ANIMATION_TIME/ cameraSteps
					)
				} else {
					viewCenter.visible = true
				}
			}
		}

		function calculateRealCameraRotation(quaternion, rotation) {
			function isFirstOrSecondCuadrant(rotation) {
				return rotation > 0
			}
			
			var rotationRads = Math.acos(Math.abs(camera.quaternion.y)) * 2
			if(!isFirstOrSecondCuadrant(camera.rotation.y)) {
				rotationRads = Math.PI*2 - rotationRads
			}
			
			return rotationRads
		}
			
		
		this.rotateMenu = function(menu,withoutTransition) {
			var rotateMenuSteps = withoutTransition ?  1 : ROTATE_MENU_STEPS
			var targetRotation = menu.centerRotation + menu.currentRotation
			var cameraRotationY = calculateRealCameraRotation(camera.quaternion, camera.rotation)
			var deltaY = ((Math.PI * 2) - targetRotation - cameraRotationY) / rotateMenuSteps
			var that = this
			updateMenu(0)
			function updateMenu(currentSteps) {
				that.colocateMenuMeshes(menu, deltaY) 

				if(++currentSteps < rotateMenuSteps) {
					setTimeout(
						function() {updateMenu(currentSteps)}, 
						MENU_ROTATION_ANIMATION_TIME / rotateMenuSteps
					)
				}
			}
		}
		
		this.updateViewCenterPosition = function(direction) {
			viewCenter.position.x = camera.position.x + direction.x * VIEW_CENTER_DISTANCE_FACTOR  
			viewCenter.position.y = camera.position.y + direction.y * VIEW_CENTER_DISTANCE_FACTOR
			viewCenter.position.z = camera.position.z + direction.z * VIEW_CENTER_DISTANCE_FACTOR
			viewCenter.rotation.x = camera.rotation.x
			viewCenter.rotation.y = camera.rotation.y
			viewCenter.rotation.z = camera.rotation.z
		}
	}

	/*****************************************************************************************************************/
	/************************************              	   MENU ITEMS               **********************************/
	/*****************************************************************************************************************/

	function MenuItem(imageUrl, id) {
		this.id = id
		this.imageUrl = imageUrl
	}
	
	MenuItem.prototype.extend({
		onSelect : function() {
			console.log("Error: this method must be override")
		}
	}) 
	
	function CheckMenuItem(imageUrl, id, checkedUrl) {
		MenuItem.call(this, imageUrl, id)
		this.isChecked = false
		this.checkedUrlImage = checkedUrlImage
	}
	
	CheckMenuItem.prototype = {
		constructor : CheckMenuItem
		
	}
	
	function ActionMenuItem(imageUrl, id, menuSelectToRedirect, action) {
		MenuItem.call(this, imageUrl, id)
		this.menuSelectToRedirect = menuSelectToRedirect
		this.action = action
	}
	
	ActionMenuItem.prototype = new MenuItem()
	ActionMenuItem.prototype.extend({
		constructor : ActionMenuItem,	
		onSelect : function(threeMenu) {
			threeMenu.onActionMenuItemSelected(this)
		}
	})
	
	function MenuSelect(imageUrl, id) {
		MenuItem.call(this, imageUrl, id)
		this.isSelected = false

		this.menuItems = []
		this.threeMenuItems
		this.currentRotation = 0
		
		this.material
		this.preSelectedMaterial 
		this.selectedMaterial
	} 
	
	MenuSelect.prototype = new MenuItem()
	
	MenuSelect.prototype.extend({
		constructor : MenuSelect,
		addMenuItem : function(menuItem) {
			this.menuItems.push(menuItem)
		},
		
		doWithMenuItems : function(delegate) {
			for (var i = 0; i < this.menuItems.length; i++) {
				var menuItem = this.menuItems[i]
				delegate(menuItem, i)
			}
		},
		
		doWithMenuItemsMeshes : function(avoidedMenuItem, delegate) {
			var menuItemsMeshes = this.threeMenuItems.children
			for (var i = 0; i < menuItemsMeshes.length; i++) {
				var menuItemMesh = menuItemsMeshes[i]
				var menuItem = menuItemMesh.menuItem
				if(menuItem !== avoidedMenuItem) {
					delegate(menuItem, menuItemMesh, i)
				}
			}
		},
		
		onSelect : function(threeMenu) {
			threeMenu.onMenuSelectSelected(this)
		}
	})

	window.osoco.three.Menu = Menu
}())

THREE.Menu = window.osoco.three.Menu