
var canvas;
var gl;

var numVertices  = 36;

var points = [];
var gameArea = [];
var oldArea = [];
var colors = [];

var newSets = [];

var movement = false;    
var spinX = 0;
var spinY = 0;
var origX;
var origY;
var zoom = 0.7;


var sizeIncrease = 0.00;
var sizeShrinking = 0.05;




var matrixLoc;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    colorCube();
    area();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    matrixLoc = gl.getUniformLocation( program, "transform" );


    canvas.addEventListener("wheel", function(e) {
        console.log("went into scroll");
        if (e.deltaY > 0) {
            zoom *= 0.9;  
        } else {
            zoom *= 1.1;  
        }
        e.preventDefault();  
    });

    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();         //disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY + (origX - e.offsetX) ) % 360;
            spinX = ( spinX + (origY - e.offsetY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );

    
    
    render();
    gameloop();
}



function area()
{

    for (var i = 0; i < 10; i++){
        gameArea[i] = [];
        oldArea[i] = [];
        for (var j = 0; j < 10; j++){
            gameArea[i][j] = [];
            oldArea[i][j] = []
            for (var p = 0; p < 10; p++){
                gameArea[i][j][p] = Math.random() > 0.7 ? 1 : 0;
                oldArea[i][j][p] = 0;
            }
        }
    }

}

function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}


function quad(a, b, c, d) 
{

    var vertices = [
        vec3( -0.45, -0.45,  0.45 ),
        vec3( -0.45,  0.45,  0.45 ),
        vec3(  0.45,  0.45,  0.45 ),
        vec3(  0.45, -0.45,  0.45 ),
        vec3( -0.45, -0.45, -0.45 ),
        vec3( -0.45,  0.45, -0.45 ),
        vec3(  0.45,  0.45, -0.45 ),
        vec3(  0.45, -0.45, -0.45 )
    ];

    var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
    ];

    //vertex color assigned by the index of the vertex
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push(vertexColors[a]);
        
    }
}

function checkIfDead(){
    for (var i = 0; i < 10; i++){
        for (var j = 0; j < 10; j++){
            for (var p = 0; p < 10; p++){
                if(gameArea[i][j][p] === 1) return false;
            }
        }
    }
    return true;
}


function reactiveBlocks(){

    for (var i = 0; i < 10; i++){

        for (var j = 0; j < 10; j++){

            for (var p = 0; p < 10; p++){
                oldArea[i][j][p] = gameArea[i][j][p];
            }
        }
    }

    for (var i = 0; i < 10; i++){

        for (var j = 0; j < 10; j++){

            for (var p = 0; p < 10; p++){
                // now we have each coordinate

                //now lets see the neighbor count 
                var count = 0;

                for (var u = i - 1; u <= i + 1; u++){
                    for (var g = j - 1; g <= j + 1; g++){
                        for (var h = p-1; h <= p + 1; h++){
                            count += oldArea[(u + 10) % 10][(g + 10) % 10][(h + 10) % 10]; //account for cube itself (gaeti verid ad telja sig sjalfan sem neighbor)
                                            
                        }
                    }
                }
                if (oldArea[i][j][p] === 1){
                    count--;
                }
                

                // if the living point should die
                if ((count !== 5 && count !== 6 && count !== 7) && oldArea[i][j][p] === 1){
                    gameArea[i][j][p] = 0;
                    console.log("point died ", " in x: ", i, " in y: ", j, " in z: ", p);
                }
                
                // if the dead point should revive
                else if(count === 6 && oldArea[i][j][p] === 0){
                    gameArea[i][j][p] = 1;
                    console.log("point revived");
                }
                else {
                    gameArea[i][j][p] = oldArea[i][j][p];
                }
                
            }
        }
    }
    console.log("created a new game area");
}

function gameloop(){
    console.log("went into gameloop");
    if (!checkIfDead()) {
        sizeIncrease = 0;
        reactiveBlocks();
        setTimeout(function(){
            gameloop();
        }, 2000);
    }
}



function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    

    if(sizeIncrease <= 0.99){
        sizeIncrease = sizeIncrease + 0.02;
    }
    
    var mv = mat4();
    mv = mult(mv, scalem(zoom, zoom, zoom));
    mv = mult( mv, rotateX(spinX) );
    mv = mult( mv, rotateY(spinY) ) ;
    mv = mult( mv, scalem( 0.05, 0.05, 0.05 ) );  

    for (var i = 0; i < 10; i++){
        for (var j = 0; j < 10; j++){
            for (var p = 0; p < 10; p++){
                // if we want to create a cube
                if (gameArea[i][j][p] === 1 && oldArea[i][j][p] === 0){
                    mv1 = mult(mv, translate(i-5,j-5,p-5));
                    
                    mv1 = mult(mv1, scalem(sizeIncrease - 0.01, sizeIncrease - 0.01, sizeIncrease - 0.01));
                    
                    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
                    gl.drawArrays( gl.TRIANGLES, 0, numVertices );
                }
                // if we want to shrink a cube
                else if(gameArea[i][j][p] === 0 && oldArea[i][j][p] === 1){
                    mv1 = mult(mv, translate(i-5,j-5,p-5));
                    
                    mv1 = mult(mv1, scalem(1 - sizeIncrease, 1 - sizeIncrease, 1 - sizeIncrease));
                    
                    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
                    gl.drawArrays( gl.TRIANGLES, 0, numVertices );
                }
                // if we want to do nothing with a cube
                else if(gameArea[i][j][p] === 1) {
                    mv1 = mult(mv, translate(i-5,j-5,p-5));
                    
                    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
                    gl.drawArrays( gl.TRIANGLES, 0, numVertices );
                }
            }
        }
    }
    
    requestAnimFrame( render );
}

