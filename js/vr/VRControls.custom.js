/**
 * @author dmarcos / https://github.com/dmarcos
 * @author mrdoob / http://mrdoob.com
 */

THREE.VRControls = function ( object, includePosition, scale, callback ) {

	var vrInput;

	var onVRDevices = function ( devices ) {

		for ( var i = 0; i < devices.length; i ++ ) {

			var device = devices[ i ];

			if ( device instanceof PositionSensorVRDevice ) {

				vrInput = devices[ i ];
				return; // We keep the first we encounter

			}

		}

		if ( callback !== undefined ) {

			callback( 'HMD not available' );

		}

	};

	if ( navigator.getVRDevices !== undefined ) {

		navigator.getVRDevices().then( onVRDevices );

	} else if ( callback !== undefined ) {

		callback( 'Your browser is not VR Ready' );

	}

	this.update = function () {

		if ( vrInput === undefined ) return;

		var state = vrInput.getState();

		if ( state.orientation !== null ) {

			object.quaternion.copy( state.orientation );

		}

		if ( includePosition && state.position !== null ) {
			object.position.copy({
				x : state.position.x*scale ,
				y : state.position.y*scale ,
				z : state.position.z*scale 
			});

		}

	};

	this.zeroSensor = function () {

		if ( vrInput === undefined ) return;

		vrInput.zeroSensor();

	};

};
