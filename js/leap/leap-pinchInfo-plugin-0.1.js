  /*
  Options: {minimunPinchStrength, pinchTimeToEmitEvent}
  Emits: {on + fingerName + Pinched }
  */
;(function() {
    var DEFAULT_MINIMUN_PINCH_STRENGTH = 0.9
    var DEFAULT_PINCH_TIME_TO_EMIT_EVENT = 1000
    
    var nameMap = ["Thumb", "Index", "Middle", "Ring", "Pinky"]
    var pinchData = {}
    
    var minimunPinchStrength = 0
    var pinchTimeToEmitEvent = 1000
    
    function pinchInfo(options) {
       initializeOptions(options)
       
       return {
	       frame : function(frame) {
	           var currentTime = new Date().getTime()
			   for ( var i = 0; i < frame.hands.length; i++ ) {
			       var hand = frame.hands[i] 
			       var handPinchData = pinchData[hand.id] = pinchData[hand.id] || {} 
			       addPinchingDataToHand(hand, handPinchData)
			       emitEventIfNeccesary.call(this, handPinchData, currentTime)
			       //console.log(hand.pincher + ":" + hand.startPinching)
			   }
		   }
		}
	}
	
	function initializeOptions(options) {
	   minimunPinchStrength = options.minimunPinchStrength || DEFAULT_MINIMUN_PINCH_STRENGTH
	   pinchTime = options.pinchTime || DEFAULT_PINCH_TIME_TO_EMIT_EVENT
	}
	
	function addPinchingDataToHand(hand, handData){
	    var currentPincher = findPincher(hand)
	    updateHandData(hand, handData, currentPincher)
	}
   
    function findPincher(hand) {
        var pincher
        var closest = 500
        var fingerName
        if(hand.pinchStrength > minimunPinchStrength) {
            for(var f = 1; f < 5; f++)
            {
                current = hand.fingers[f]
                distance = Leap.vec3.distance(hand.thumb.tipPosition, current.tipPosition)
                if(current != hand.thumb && distance < closest)
                {
                    closest = distance
                    pincher = current 
                }
            } 
            fingerName = nameMap[pincher.type]
        }
        return fingerName
    }
    
    function updateHandData(hand, handData, currentPincher) {
        if( handData.pincher != currentPincher) {
           handData.startPinching = new Date().getTime()
           handData.pincher = currentPincher
           handData.eventIsEmittedYet = false
        }
        
        hand.pincher = handData.pincher
        hand.startPinching = handData.startPinching
    }
    
     
    function emitEventIfNeccesary(handPinchData, currentTime) {
        if( handPinchData.pincher && !handPinchData.eventIsEmittedYet && isTimeToEmitEvent(handPinchData.startPinching, currentTime)) {
            
            handPinchData.eventIsEmittedYet = true
            this.emit('on' + handPinchData.pincher + 'Pinched')
        }
    }
    
    function isTimeToEmitEvent(startTime, currentTime) {
        return (currentTime - startTime) > pinchTimeToEmitEvent
    }
    
    if ((typeof Leap !== 'undefined') && Leap.Controller) {
	    Leap.Controller.plugin('pinchInfo', pinchInfo);
	 } else if (typeof module !== 'undefined') {
	    module.exports.pinchInfo = pinchInfo;
	 } else {
	    throw 'leap.js not included';
	 }
}).call(this)