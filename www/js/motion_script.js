// The watch id references the current `watchAcceleration`
var watchID = null;
var frequency = 200;

var points = 0;
var life = 250;

// Wait for device API libraries to load
document.addEventListener("deviceready", onDeviceReady, false);

// device APIs are available
function onDeviceReady() {
    $('#pause_button').hide();   
    $("#pause_button").click(function() {
        stopWatch();
        $('#start_button').show();
        $('#pause_button').hide();
        window.plugins.insomnia.allowSleepAgain();
    });
    
    
    $('#accelerometer').slideUp(3000);
    $('#start_button').fadeIn(3000, function(){
        $('#start_button').click(function() {
            $('#start_button').hide();
            $('#pause_button').show();
            startWatch();
            window.plugins.insomnia.keepAwake();
        });
        $('#start_button').click();
    });
    $('#reload_button').fadeIn(3000, function(){
        $( "#reload_button" ).click(function() {
            location.reload();
        });        
    });
    
    $('.ui-loader').remove();
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
var moveX = 0;
var moveY = 0;
function moveObject(acceleration) {
    var minDistanceFromBorder = [];
    minDistanceFromBorder['top'] = 170;
    minDistanceFromBorder['bottom'] = 80;
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

    moveX = 0;
    moveY = 0;
    var speed = frequency/8;
    var animationSpeed = frequency-10;
    var stability = 0.8;
        
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
    
    $('.points').html("Points: "+points);
    rotateKanuXY(moveX,moveY,animationSpeed);
    
    //limit for move
    var maxMove = 15;
    var mod = 1;
    if(Math.abs(moveX)>maxMove && Math.abs(moveX)>Math.abs(moveY)) mod = maxMove/Math.abs(moveX);
    else if(Math.abs(moveY)>maxMove) mod = maxMove/Math.abs(moveY);
    moveX=Math.floor(moveX*mod);
    moveY=Math.floor(moveY*mod);
    
    direction = 'C';
    if(current_row>0 && prev_deg<270 && prev_deg>90) direction = 'S';
    if(prev_deg>=270 || prev_deg<=90) direction = 'N';
    
    checkPassengers(objOffset.left+moveX, objOffset.top+moveY);
    
    checkPointCollisionWithObstacles(objOffset.left+moveX, objOffset.top+moveY);
    
    if(objOffset.left+moveX > rightBoundary || objOffset.left+moveX < leftBoundary || objOffset.top+moveY < topBoundary || objPosition.top+moveY > bottomBoundary) {
        if(objOffset.left > rightBoundary) {
            if(moveX>0) moveX=-1;
            if(objOffset.left-rightBoundary > 2*maxMove) moveX = rightBoundary-objOffset.left;
        }
        if(objOffset.left < leftBoundary) {
            if(moveX<0) moveX=1;
            if(leftBoundary-objOffset.left > 2*maxMove) moveX = leftBoundary-objOffset.left;
        }
        if(objOffset.top < topBoundary) {
            if(moveY<0) moveY=1;
            if(direction=='S' && topBoundary-objOffset.top > 2*maxMove) moveY = topBoundary-objOffset.top;
        }
        if(objOffset.top > bottomBoundary) {
            if(moveY>0) moveY=-1;
            if(direction=='N' && objOffset.top-bottomBoundary > 2*maxMove) moveY = bottomBoundary-objOffset.top;
        }
    }
    
    //move object according to accelerometer if it will not cause collision
    var moveLeft = getSign(moveX) + '=' + Math.abs(moveX);
    var moveTop = getSign(moveY) + '=' + Math.abs(moveY);

    myObj.stop().animate({
        left: moveLeft,
        top: moveTop
    }, animationSpeed);
    
    nextObestacles(animationSpeed);
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
                $('#param_info').html('Passenger travels to: '+passenger_destination_row).addClass('important_info').hide().fadeIn(2000, function(){ $(this).removeClass('important_info'); });
                navigator.notification.vibrate(200);
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
                $('.points').addClass('important_info').hide().fadeIn(2000, function(){ $(this).removeClass('important_info'); });
                navigator.notification.vibrate(200);
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
            
            //behavior canoe in case of a collision with the edge L
            var obstacleOffset = obstacle.offset();
            var oDistance = obstacleOffset.left+obstacle.width()-oLeft;
            if(moveX<0 || Math.abs(oDistance)>kanuRadius) {
                moveX= oDistance;
                if(direction=='N') moveY=obstacle.height()/2;
                if(direction=='S') moveY=-obstacle.height()/2;
            }
        }
    });
    
    obstaclesR.each(function(){
        var obstacle = $(this);
        if( detectCollisionPointBox(oLeft,oTop,obstacle,kanuRadius) ) {
            collisionRdetected = true;
            
            //behavior canoe in case of a collision with the edge R
            var obstacleOffset = obstacle.offset();
            var oDistance = obstacleOffset.left-oLeft;
            if(moveX>0 || Math.abs(oDistance)>kanuRadius) {
                moveX= oDistance;
                if(direction=='N') moveY=obstacle.height()/2;
                if(direction=='S') moveY=-obstacle.height()/2;
            }
        }
    });
    
    if(collisionLdetected ||  collisionRdetected) {
        life--;
        $('#kanu').addClass('kanuInDanger');
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
    nb_obstacles = Math.ceil(Math.max($('#wrapper').height(),$('#wrapper').width())/30)+1;
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

function nextObestacles(animationSpeed) {
    var boxL = $('#obstacles_box_L');
    var boxR = $('#obstacles_box_R');
    var obstacle = $('#obstacle_tpl');
    if(boxL.children('.obstacle').length<5) setObestacles();

    if(direction=='S') {
        if($('#buffor_LS .obstacle').length == 0) {
            obstacle.children('.obstacle').removeClass('compress').removeClass('decompress');
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
        
        //add compress css animation to the first obstacles
        var firstL = boxL.children('.obstacle').first();
        var firstR = boxR.children('.obstacle').first();
        firstL.removeClass('decompress').addClass('compress');
        firstR.removeClass('decompress').addClass('compress');
        firstL.html(firstL.html());
        firstR.html(firstR.html()); 
        
        //move first obstacles to buffors after 150ms
        setTimeout(function() {
            firstL.appendTo('#buffor_LN').removeClass('compress').addClass('decompress');
            firstR.appendTo('#buffor_RN').removeClass('compress').addClass('decompress');
        }, animationSpeed*3/4);
    }
    else if(direction=='N') {
        if($('#buffor_LN .obstacle').length == 0) {
            obstacle.children('.obstacle').removeClass('compress').addClass('decompress');
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
            $('#buffor_LN').children('.obstacle').last().removeClass('compress').addClass('decompress').prependTo(boxL);
            $('#buffor_RN').children('.obstacle').last().removeClass('compress').addClass('decompress').prependTo(boxR);
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