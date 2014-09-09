// The watch id references the current `watchAcceleration`
var watchID = null;
var frequency = 200;

var points = 0;
var life = 250;

// Wait for device API libraries to load
document.addEventListener("deviceready", onDeviceReady, false);

// device APIs are available
function onDeviceReady() {    
    $('.ui-loader').remove();
    
    $('#accelerometer').hide();
    
    $('#start_button').click(function() {
        $('#start_button').hide();
        startWatch();
    });
    
    $( "#pause_button" ).click(function() {
        stopWatch();
        $('#start_button').show();
    });
    
    $( "#reload_button" ).click(function() {
        location.reload();
    });
}

// Start watching the acceleration
function startWatch() {

    // Update acceleration
    var options = {frequency: frequency};

    watchID = navigator.accelerometer.watchAcceleration(onSuccess, onError, options);
}

// Stop watching the acceleration
function stopWatch() {
    if (watchID) {
        navigator.accelerometer.clearWatch(watchID);
        watchID = null;
    }
}

// onSuccess: Get a snapshot of the current acceleration
function onSuccess(acceleration) {
    /*var element = document.getElementById('accelerometer');
    element.innerHTML = 'Acceleration X: ' + acceleration.x + '<br />' +
            'Acceleration Y: ' + acceleration.y + '<br />' +
            'Acceleration Z: ' + acceleration.z + '<br />' +
            'Timestamp: ' + acceleration.timestamp + '<br />' +
            'Window orientation: ' +window.orientation + '<br />';*/
    moveObject(acceleration);
    updateInfoBox();
}

function updateInfoBox() {
    $('#position_info span').html(current_row);
    $('.points span').html(points);
    $('.life span').html(life);
    
    var date = new Date();
    
    if(life<1) {
        alert( "GAME OVER!\nYou have earned "+points+" points.");
        location.reload();
    }
}

// onError: Failed to get the acceleration
function onError() {
    alert('Error!');
}

function getSign(number) {
    if(number<0) return '-';
    else return '+';
}

// moveObject
function moveObject(acceleration) {
    var minDistanceFromBorder = [];
    minDistanceFromBorder['top'] = 90;
    minDistanceFromBorder['bottom'] = 20;
    minDistanceFromBorder['right'] = 20;
    minDistanceFromBorder['left'] = 20;

    var myObj = $('#point');
    var wall = $('#wrapper');
    var objPosition = myObj.position();
    var objOffset = myObj.offset();
    var leftBoundary = minDistanceFromBorder['left'];
    var topBoundary = minDistanceFromBorder['top'];
    var rightBoundary = wall.width() - myObj.width() - minDistanceFromBorder['right'];
    var bottomBoundary = wall.height()- myObj.height() - minDistanceFromBorder['bottom'];

    var moveX = 0;
    var moveY = 0;
    var speed = frequency/8;
    var animationSpeed = frequency-1;
    var stability = 0.5;
        
    if (Math.abs(acceleration.x) > stability) {
        moveX = -acceleration.x * speed;
    }

    if (Math.abs(acceleration.y) > stability) {
        moveY = acceleration.y * speed;
    }
    
    if(window.orientation==90) {
        var moveTemp = moveY;
        moveY = -moveX;
        moveX = moveTemp;
    }

    if(window.orientation==-90) {
        var moveTemp = -moveY;
        moveY = moveX;
        moveX = moveTemp;
    }
    
    if(window.orientation==180) {
        moveY = -moveY;
        moveX = -moveX;
    }
    
    direction = 'C';
    if(current_row>0 && prev_deg<270 && prev_deg>90) direction = 'S';
    if(prev_deg>=270 || prev_deg<=90) direction = 'N';
    
    rotateKanuXY(moveX,moveY,animationSpeed);
    
    var speedMod = (-0.5+(objOffset.top-topBoundary)/(bottomBoundary-topBoundary))*2;
    $('.points').html(speedMod+'+'+objOffset.top+'+'+bottomBoundary);
    moveX = moveX;
    moveY = moveY;
    
    var moveLeft = getSign(moveX)+'='+Math.abs(moveX);
    var moveTop = getSign(moveY)+'='+Math.abs(moveY);

    checkPassengers(objOffset.left+moveX, objOffset.top+moveY);
    
    var collisionDetected = checkPointCollisionWithObstacles(objOffset.left+moveX, objOffset.top+moveY);
    if(objOffset.left+moveX > rightBoundary || objOffset.left+moveX < leftBoundary || objOffset.top+moveY < topBoundary || objPosition.top+moveY > bottomBoundary) {
    //if object is out of screen
        var left = objOffset.left;
        var top = objOffset.top;
        if(objOffset.left > rightBoundary) left = rightBoundary;
        if(objOffset.left < leftBoundary) left = leftBoundary;
        if(objOffset.top < topBoundary) top = topBoundary;
        if(objOffset.top > bottomBoundary) top = bottomBoundary;
        
        myObj.offset({ top: top, left: left });
    } else {
        if(!collisionDetected) {
            //move object according to accelerometer if it will not cause collision
            myObj.stop().animate({
                left: moveLeft,
                top: moveTop
            }, animationSpeed);
        }
    }
        
    nextObestacles();
}

function checkPassengers(oLeft, oTop){
    var kanuRadius = $('#kanu').width()/2;
    
    if(passenger_destination_row==0) {
        var passengers = $('.obstacles_box .passenger_range');
        passengers.each(function(){
            var passenger = $(this);
            if( detectCollisionPointBox(oLeft,oTop,passenger,kanuRadius) ) {
                passenger.css('background-color','yellow');
                passenger.parent().remove();
                $('#kanu .passenger').show();
                passenger_destination_row = Math.abs(current_row + Math.floor((Math.random() * 50) -20));
                $('#param_info').html('Passenger travels to: '+passenger_destination_row);     
            }
        });
    } else {
        var passengers = $('.obstacles_box .passenger_destination');
        passengers.each(function(){
            var passenger = $(this);
            if( detectCollisionPointBox(oLeft,oTop,passenger,kanuRadius) ) {
                passenger.css('background-color','yellow');
                passenger.parent().remove();
                $('#kanu .passenger').hide();
                passenger_destination_row = 0;
                $('#param_info').html(''); 
                points++;                         
            }
        });
    }    
}

function checkPointCollisionWithObstacles(oLeft, oTop) {
    var point = $('#point');
    var obstaclesL = $('#obstacles_box_L div.obstacle');
    var obstaclesR = $('#obstacles_box_R div.obstacle');
    var collisionLdetected = false;
    var collisionRdetected = false;
    var kanuRadius = $('#kanu').width()/2;
    
    obstaclesL.each(function(){
        var obstacle = $(this);
        if( detectCollisionPointBox(oLeft,oTop,obstacle,kanuRadius) ) {
            collisionLdetected = true;
            var obstaclePosition = obstacle.offset();
            point.offset({ left: obstaclePosition.left+obstacle.width()+kanuRadius });
        }
    });
    
    obstaclesR.each(function(){
        var obstacle = $(this);
        if( detectCollisionPointBox(oLeft,oTop,obstacle,kanuRadius) ) {
            collisionRdetected = true;
            var obstaclePosition = obstacle.offset();
            point.offset({ left: obstaclePosition.left-kanuRadius });
        }
    });
    
    if(collisionLdetected ||  collisionRdetected) {
        life--;
        $('#kanu').addClass('kanuInDanger');
        //navigator.notification.vibrate(frequency/2);
        return true;
    } else $('#kanu').removeClass('kanuInDanger');
    
    return false;
}

function detectCollisionPointBox(pointLeft,pointTop,box,minDistance) {
    var boxp = box.offset();
    
    if(pointLeft+minDistance > boxp.left
        && pointLeft-minDistance < boxp.left+box.width()
        && pointTop+minDistance > boxp.top
        && pointTop-minDistance < boxp.top+box.height()
    ) return true;
    
    return false;
}

function detectCollision(obj1,obj2,minDistance) {
    var obj1p = obj1.offset();
    var obj2p = obj2.offset();
    
    if(obj1p.left+obj1.width() > obj2p.left-minDistance
        && obj1p.left < obj2p.left+obj2.width()+minDistance
        && obj1p.top+obj1.height() > obj2p.top-minDistance
        && obj1p.top < obj2p.top+obj2.height()+minDistance
    ) return true;
    
    return false;
}

/*function rotateObject(object,deg) {
    object.css({
        '-moz-transform':'rotate('+deg+'deg)',
        '-webkit-transform':'rotate('+deg+'deg)',
        '-o-transform':'rotate('+deg+'deg)',
        '-ms-transform':'rotate('+deg+'deg)',
        'transform': 'rotate('+deg+'deg)'
    });
}*/

var prev_deg = 0;
function rotateKanuXY(a,b,animationSpeed) {
    var deg = calculateDegXY(a,b); 
    
    //animate rotation
    animateRotate($('#kanu'),prev_deg,deg,animationSpeed);
    
    //set start parameter for next rotation
    prev_deg = deg;
    
    return true;
}

//sets degre for rotation
function calculateDegXY(moveLeft,moveTop) {
    if(moveLeft==0 && moveTop==0 && prev_deg!=0) return prev_deg;
    
    var deg = 0;
    
    if(moveLeft!=0) deg = Math.floor(Math.atan(moveTop/moveLeft)*180/Math.PI+90);
    else {
        if(moveTop>0) deg = 180;
        else deg = 0;
    }
    if(moveLeft<0) deg = deg+180;
    
    return deg;
}

function animateRotate(object,fromDeg,toDeg,duration){
    
    //adjust fromDeg and toDeg notation to achive the lowest arc
    fromDeg=(fromDeg+360)%360;
    toDeg=(toDeg+(360*10))%360;
    if(Math.abs(toDeg-fromDeg)>180) {
        fromDeg=(fromDeg+180)%360-180;
        toDeg=(toDeg+180)%360-180;
    }
        
    var dummy = $('<span style="margin-left:'+fromDeg+'px;">')
    $(dummy).animate({
        "margin-left":toDeg+"px"
    },{
        duration:duration,
        step: function(now){
            $(object).css('transform','rotate(' + now + 'deg)');
        }
    });
};

//obestacles start values
var current_row = 0;
var nb_obstacles = 10;
var direction = 'N';

var riverParams = [];
setDefaultRiverParams('N');
setDefaultRiverParams('S');

function setDefaultRiverParams(direction) {
    riverParams[direction,'sinmod'] = 0;
    riverParams[direction,'idiv'] = nb_obstacles/(2*Math.PI);
    riverParams[direction,'mul'] = 10;
    riverParams[direction,'center'] = 50;
    riverParams[direction,'space'] = 20;
    riverParams[direction,'center_mod'] = 0;
    riverParams[direction,'center_mod_next_change'] = 10;
    riverParams[direction,'space_mod'] = 0;
    riverParams[direction,'space_mod_next_change'] = 10;
}

function updateObestaclesSettings() {   
    if(direction!='C') {
        if(direction == 'N') current_row++;
        else current_row--;
        
        riverParams[direction,'center_mod_next_change']--;
        if(riverParams[direction,'center_mod_next_change']<=0) {
            riverParams[direction,'center_mod_next_change'] = (Math.floor(Math.random()*100))%100+20;
            riverParams[direction,'center_mod'] = (Math.floor(Math.random()*10/2)%10)-2;
        }   
        riverParams[direction,'center'] += riverParams[direction,'center_mod'];
        
        riverParams[direction,'space_mod_next_change']--;
        if(riverParams[direction,'space_mod_next_change']<=0) {
            riverParams[direction,'space_mod_next_change'] = (Math.floor(Math.random()*100))%100+20;
            riverParams[direction,'space_mod'] = (Math.floor(Math.random()*10/2)%10)-2;
        }   
        riverParams[direction,'space'] += riverParams[direction,'space_mod'];
        
        correctObestaclesSettings()
    }
}

function correctObestaclesSettings() {
    if(riverParams[direction,'space']<15) { riverParams[direction,'space_mod']=1; }
    if(riverParams[direction,'space']>40) { riverParams[direction,'space_mod']=-1; }
    if(riverParams[direction,'center']-5<riverParams[direction,'space']/2) { riverParams[direction,'center_mod']=1; }
    if(riverParams[direction,'center']+5>(100-riverParams[direction,'space']/2)) { riverParams[direction,'center_mod']=-1; }
}

function setObestacles() {
    nb_obstacles = Math.ceil(Math.max($('#wrapper').height(),$('#wrapper').width())/30);
    riverParams[direction,'idiv'] = nb_obstacles/(2*Math.PI);
    
    var boxL = $('#obstacles_box_L');
    var boxR = $('#obstacles_box_R');
    var obstacle = $('#obstacle_tpl');
    
    for (var row = 0; row < nb_obstacles; row++) {
        riverParams[direction,'sinmod'] = Math.sin(row/riverParams[direction,'idiv'])*riverParams[direction,'mul'];
        obstacle.children('.obstacle').css('left',(-riverParams[direction,'space']-(100-riverParams[direction,'center'])+riverParams[direction,'sinmod'])+"%");
        boxL.append(obstacle.html());
        obstacle.children('.obstacle').css('left',(riverParams[direction,'space']+riverParams[direction,'center']+riverParams[direction,'sinmod'])+"%");
        boxR.append(obstacle.html());
    }
    direction = 'N';
}

function nextObestacles() {
    var boxL = $('#obstacles_box_L');
    var boxR = $('#obstacles_box_R');
    var obstacle = $('#obstacle_tpl');
    
    if(boxL.children('.obstacle').length<10) setObestacles();

    if(direction=='S') {
        if($('#buffor_LS .obstacle').length == 0) {
            riverParams[direction,'sinmod'] = Math.sin((current_row+nb_obstacles)/riverParams[direction,'idiv'])*riverParams[direction,'mul'];
            obstacle.children('.obstacle').css(
                'left',(-riverParams[direction,'space']-(100-riverParams[direction,'center'])+riverParams[direction,'sinmod'])+"%"
            );
            boxL.append(obstacle.html());
            
            obstacle.children('.obstacle').css(
                'left',(riverParams[direction,'space']+riverParams[direction,'center']+riverParams[direction,'sinmod'])+"%"
            );
            boxR.append(obstacle.html());
            
            addContent(boxL.children('.obstacle').last());
            addContent(boxR.children('.obstacle').last());
            updateObestaclesSettings();
        }
        else {
            current_row--;
            $('#buffor_LS').children('.obstacle').last().appendTo(boxL);
            $('#buffor_RS').children('.obstacle').last().appendTo(boxR);
        }
        
        boxL.children('.obstacle').first().appendTo('#buffor_LN');
        boxR.children('.obstacle').first().appendTo('#buffor_RN');
    }
    else if(direction=='N') {
        if($('#buffor_LN .obstacle').length == 0) {
            riverParams[direction,'sinmod'] = Math.sin((current_row)/riverParams[direction,'idiv'])*riverParams[direction,'mul'];
            obstacle.children('.obstacle').css('left',(-riverParams[direction,'space']-(100-riverParams[direction,'center'])+riverParams[direction,'sinmod'])+"%");
            boxL.prepend(obstacle.html());
            obstacle.children('.obstacle').css('left',(riverParams[direction,'space']+riverParams[direction,'center']+riverParams[direction,'sinmod'])+"%");
            boxR.prepend(obstacle.html());
            addContent(boxL.children('.obstacle').first());
            addContent(boxR.children('.obstacle').first());
            updateObestaclesSettings();
        }
        else {
            current_row++;
            $('#buffor_LN').children('.obstacle').last().prependTo(boxL);
            $('#buffor_RN').children('.obstacle').last().prependTo(boxR);
        }

        boxL.children('.obstacle').last().appendTo('#buffor_LS');
        boxR.children('.obstacle').last().appendTo('#buffor_RS');
    }
    addPassengerDestination();
}

function addContent(box) {
    //add palm
	var palmLeft = Math.floor((Math.random() * 60) + 10);
	var palmTpl = $('#palm_tpl');
	palmTpl.find('.palm').css('left',palmLeft+"%");
	box.append(palmTpl.html());
    
    if(Math.floor(Math.floor(Math.random() * 40)==5)) {
        //add passenger
        var passengerTpl = $('#passenger_tpl');
        box.append(passengerTpl.html());
    }
}

var passenger_destination_row = 0;
var destination_inserted = false;
function addPassengerDestination() {
    if(passenger_destination_row==0) destination_inserted=false;
    if(current_row==passenger_destination_row && current_row!=0 && !destination_inserted) {
        var passengerDestTpl = $('#passenger_destination_tpl');
        if(current_row%2==1) {
            if(direction=='S') var box=$('#obstacles_box_L').children('.obstacle').last();
            else var box=$('#obstacles_box_L').children('.obstacle').first(); 
        } else {
            if(direction=='S') var box=$('#obstacles_box_R').children('.obstacle').last();
            else var box=$('#obstacles_box_R').children('.obstacle').first(); 
        }
        box.append(passengerDestTpl.html());
        box.find('.passenger_destination').html(passenger_destination_row);
        destination_inserted=true;
    }
}