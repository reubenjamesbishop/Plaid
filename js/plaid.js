////////////////////////////////////////////
/*                  TODO                  */
////////////////////////////////////////////
// 
// expand MAP by 1 unit in each direction to make sure no issues with falling off map
// 
// fix collisions, maybe just compare positions and make sure we dont cross over the threshold, currently is a bit shakey
//
// change UI to use CSS
//
// Implement levels
//
// refactor probably everything

//lots of variables here
var baseScene, camera, renderer;

var currentScene, homeScene, levelScene;

var directionalLight;
var backgroundMusic;
var chopSound;

var menuOpen = true;

var zoom = 0.1;

//change map size here, camera will update automatically
const HOME_SIZE = 4;
const MAX_SPEED = 5;


//Preloaded objects
var treePrefab;

var jackPrefab;

var beanstalkPrefab;

var rockPrefab;


var trees = [];

var lumberjack; //to store our character object

var money = 0;
var wood = 0;
var environment = 0;

var prevtime = 0;

var keymap = {};

var mute = true;

var loadingCounter = 0;

const LOAD_MAX = 6; //change for how many objects we have to load

var debugLines;


init();


//might want to split init into scene setup and model loading etc 
//Scene setup
function init()
{

	document.addEventListener("keydown", onKeyDown, false);
	document.addEventListener("keyup", onKeyUp, false);

	//Renderer
	var width = window.innerWidth;
	var height = window.innerHeight;
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( width, height );

	//set background
	renderer.setClearColor ( 0x87CEEB, 1);
	document.body.appendChild( renderer.domElement );


	////////////////////////////////////////////
	/*              AUDIO LOADING             */
	////////////////////////////////////////////

	// instantiate a listener
	var audioListener = new THREE.AudioListener();

	// instantiate audio object
	backgroundMusic = new THREE.Audio( audioListener );
	chopSound = new THREE.Audio( audioListener );

	// instantiate a loader
	var audioLoader = new THREE.AudioLoader();

	//load background music
	audioLoader.load(
		// resource URL
		'resources/backgroundMusic.mp3',

		// onLoad callback
		function ( audioBuffer ) {
			// set the audio object buffer to the loaded object
			backgroundMusic.setBuffer( audioBuffer );
			loadingCounter++;
		},

		// onProgress callback
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		},

		// onError callback
		function ( err ) {
			console.log( 'An error happened' );
			loadingCounter = -100;
		}
	);

	//load chopping sound 
	audioLoader.load(
		// resource URL
		'resources/chop.mp3',

		// onLoad callback
		function ( audioBuffer ) {
			// set the audio object buffer to the loaded object
			chopSound.setBuffer( audioBuffer );
			loadingCounter++;
		},

		// onProgress callback
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		},

		// onError callback
		function ( err ) {
			console.log( 'An error happened' );
			loadingCounter = -100;
		}
	);



	////////////////////////////////////////////
	/*            OBJECT LOADING              */
	////////////////////////////////////////////

	//load our objects
	var gltfLoader = new THREE.GLTFLoader();

	gltfLoader.load(
	// resource URL
		'resources/tree.gltf',

		// onLoad callback
		function ( gltf ) {

			console.log(gltf.scene.children);
			treePrefab = gltf.scene.children[0];
			loadingCounter++;
		},

		// onProgress callback
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		},

		// onError callback
		function( err ) {
			console.log( 'An error occurred' );
			loadingCounter = -100;
		}
	);

	gltfLoader.load(
	// resource URL
		'resources/rock.gltf',

		// onLoad callback
		function ( gltf ) {

			console.log(gltf.scene.children);
			rockPrefab = gltf.scene.children[0];
			loadingCounter++;
		},

		// onProgress callback
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		},

		// onError callback
		function( err ) {
			console.log( 'An error occurred' );
			loadingCounter = -100;
		}
	);

	gltfLoader.load(
	// resource URL
		'resources/beanstalk.gltf',

		// onLoad callback
		function ( gltf ) {

			console.log(gltf.scene.children);
			beanstalkPrefab = gltf.scene.children[0];
			loadingCounter++;
		},

		// onProgress callback
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		},

		// onError callback
		function( err ) {
			console.log( 'An error occurred' );
			loadingCounter = -100;
		}
	);

	gltfLoader.load(
	// resource URL
		'resources/jack.gltf',

		// onLoad callback
		function ( gltf ) {

			console.log(gltf.scene.children);
			jackPrefab = gltf.scene.children[0];
			loadingCounter++;
		},

		// onProgress callback
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		},

		// onError callback
		function( err ) {
			console.log( 'An error occurred' );
			loadingCounter = -100;
		}
	);

	//wait until loaded
	var loadingHandle = setInterval( function() 
	{

		console.log("Loading...")

		if (loadingCounter >= LOAD_MAX) {

			console.log("LOADING COMPLETE!")
			clearInterval( loadingHandle );

			sceneInit( audioListener );
		}

		if ( loadingCounter < 0 ) {
			console.log("Error Loading");
		}

	}, 50);
}


function sceneInit(audioListener) {

	//Create scenes
	baseScene = new THREE.Scene(); 

	baseScene.fog = new THREE.Fog( 0xffffff, 0.5, 1000 );

	////////////////////////////////////////////
	/*                CAMERAS                 */
	////////////////////////////////////////////

	var width = renderer.getSize().width;
	var height = renderer.getSize().height;

	//Camera
	cameraP = new THREE.PerspectiveCamera( 45, width/height, 0.1, 1000 );
	cameraO = new THREE.OrthographicCamera( zoom * width / - 1.5, zoom * width / 1.5, zoom * height / 1.5, zoom * height / - 1.5, 1, 1000 );
	
	// add the listener to the camera
	cameraP.add( audioListener );
	cameraO.add( audioListener );

	//Adjust Ocamera, set up isometric view
	var camDist = HOME_SIZE * 10;

	cameraP.position.set( camDist, camDist, camDist ); //Camera equal distance away
	cameraP.lookAt( baseScene.position ); //Camera always looks at origin

	//Adjust Pcamera, set up isometric view

	cameraO.position.set( camDist, camDist, camDist ); //Camera equal distance away
	cameraO.lookAt( baseScene.position ); //Camera always looks at origin

	camera = cameraP;

	////////////////////////////////////////////
	/*                 LIGHTS                 */
	////////////////////////////////////////////

	//Add some ambient light
	var ambient = new THREE.AmbientLight( 0x404040, 5 );
	baseScene.add( ambient );

	//add directional light
	directionalLight = new THREE.DirectionalLight( 0xffff00, 0.5 );
	directionalLight.position.set( 0, 10, 10 );
	baseScene.add( directionalLight );


	////////////////////////////////////////////
	/*                 AUDIO                  */
	////////////////////////////////////////////

	// add the audio object to the scene

	homeScene = baseScene.clone();

	currentScene = homeScene;

	createMap(HOME_SIZE);
	render();


	////////////////////////////////////////////
	/*                  STATS                 */
	////////////////////////////////////////////

	document.getElementById("moneyDISP").innerHTML = money;
	document.getElementById("woodDISP").innerHTML = wood;

}


function createMap(n) {

	//Lay tiles for an n*n game board 

	currentScene.MAP_SIZE = n;
	currentScene.map = [];

	trees = [];

	//adding our character to the left most tile

	lumberjack = jackPrefab.clone();

	lumberjack.vel = [0, 0, 0];

	lumberjack.isGrounded = true;
	lumberjack.isFalling = false;
	lumberjack.radius = 2;
	currentScene.add( lumberjack );

	for (var i = 0; i < (n + 2) * (n + 2); i++) {
		currentScene.map[i] = 0;
	}

	for (var j = 0; j < n; j++)
	{
		for (var i = 0; i < n; i++ )
		{

			var val = Math.floor( Math.random() * 4 );

			currentScene.map[(j + 1) * (n + 2) + i] = val;


		}
	}


	var beanX = Math.floor( Math.random() * n);

	currentScene.map[n + 2 + beanX] = 4;

	var jackX = Math.floor( Math.random() * n);

	currentScene.map[n * (n + 2) + jackX] = -1;


	for (var j = 0; j < n; j++)
	{
		for (var i = 0; i < n; i++ )
		{

			var val = currentScene.map[(j + 1) * (n + 2) + i];

			if (val == -1) {
				val = 0;
				lumberjack.position.set((i - n/2 ) * 10, 4.5, (j - n/2 ) * 10);

			}

			layTile(i, j, val, n);

		}
	}

	//circle for debugging collisions

	var curve = new THREE.EllipseCurve(
	0,  0,            // ax, aY
	2, 2,             // xRadius, yRadius
	0,  2 * Math.PI,  // aStartAngle, aEndAngle
	false,            // aClockwise
	0                 // aRotation
	);

	var points = curve.getPoints( 50 );
	var geometry = new THREE.BufferGeometry().setFromPoints( points );

	var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );

	// Create the final object to add to the scene
	debugLines = new THREE.Line( geometry, material );

	debugLines.position = lumberjack.position;

	debugLines.rotation.x = Math.PI/2;

	currentScene.add(debugLines);

}

//Lay down base tiles 
function layTile(x, z, val, n)
{

	var nx = (x - n/2 ) * 10;
	var nz = (z - n/2 ) * 10;

	//Randomly pick a colour 

	//need to change these
	var col = [ 0x228b22, 0x016c02, 0x02bc02, 0x1b3e06 ];

	//add a tree
	if (val == 1) {

		newTree = treePrefab.clone();
		newTree.scale.y = 2;

		newTree.position.set( nx, 2, nz );

		newTree.mapX = x;
		newTree.mapZ = z;

		currentScene.add(newTree);

		trees.push(newTree);

	} else if (val == 2) {
	//rock

		rock = rockPrefab.clone();
		rock.scale.y = 1;

		rock.position.set( nx, 2, nz );

		rock.mapX = x;
		rock.mapZ = z;

		currentScene.add(rock);



	} else if (val == 3) {
		//$$$



	} else if (val == 4) {
	//bean stalk

		beanstalk = beanstalkPrefab.clone();
		beanstalk.scale.y = 1;

		beanstalk.position.set( nx, 2, nz );

		beanstalk.mapX = x;
		beanstalk.mapZ = z;

		currentScene.add(beanstalk);


	}

	//Create a tile 
	var geometry = new THREE.BoxGeometry( 10, 2, 10 );

	//Make the tile 
	var material = new THREE.MeshToonMaterial( { color: col[val] } );
	var baseTile = new THREE.Mesh( geometry, material );
	
	//Place it in the scene 
	currentScene.add( baseTile );
	baseTile.position.set( nx, 0, nz );
}


//Draw/render the scene on the canvas 
function render()
{

	requestAnimationFrame(render);

	//User input 
	renderer.render(currentScene, camera);

	//should just have to use char.position.set to change the characters position, this can be done down below i think, might want to use callbacks later idk.

	//simple dt calculation
	var dt = 0;
	var time = performance.now();

    if (prevtime) {
        dt = ( time - prevtime ) / 1000;
    }

    prevtime = time;


    //have temporarily changed this to debug
	update( 0.1 );

};

function update(dt) {

	//light movement ( daytime / nighttime )
	var timeStamp = Date.now() / 10000;

	var lightx = 0;
	var lighty = Math.cos( timeStamp );
	var lightz = Math.sin( timeStamp );

	directionalLight.position.set( currentScene.MAP_SIZE*lightx, currentScene.MAP_SIZE*lighty, currentScene.MAP_SIZE*lightz );


	moveLumberJack(dt);

	debugLines.position.set(lumberjack.position.x, lumberjack.position.y, lumberjack.position.z  );

	//Update stats
	document.getElementById("moneyDISP").innerHTML = money;
	document.getElementById("woodDISP").innerHTML = wood;


}

function moveLumberJack(dt) {

	//get map coordinates

	JackControls();

		//check if on the map
	if (lumberjack.position.x + lumberjack.radius > currentScene.MAP_SIZE * 5 || lumberjack.position.x + 2 * lumberjack.radius < - currentScene.MAP_SIZE * 5 || lumberjack.position.z + lumberjack.radius > currentScene.MAP_SIZE * 5 || lumberjack.position.z + 2 * lumberjack.radius < - currentScene.MAP_SIZE * 5)
	{
		lumberjack.isGrounded = false;
		lumberjack.isFalling = true;
	}

	//dampen movement

	if (lumberjack.vel[0] > 0) {
		lumberjack.vel[0] -= 0.5;
	}
	
	if (lumberjack.vel[0] < 0) {
		lumberjack.vel[0] += 0.5;
	}


	if (lumberjack.vel[2] > 0) {
		lumberjack.vel[2] -= 0.5;
	}
	
	if (lumberjack.vel[2] < 0) {
		lumberjack.vel[2] += 0.5; 
	}

	//assume + is movement upwards
	if (!lumberjack.isGrounded) {
		lumberjack.vel[1] -= 10 * dt; 
	}

	//place constraints

	if (lumberjack.vel[0] > MAX_SPEED)
		lumberjack.vel[0] = MAX_SPEED;

	if (lumberjack.vel[0] < - MAX_SPEED)
		lumberjack.vel[0] = -MAX_SPEED;

	if (lumberjack.vel[2] > MAX_SPEED)
		lumberjack.vel[2] = MAX_SPEED;

	if (lumberjack.vel[2] < - MAX_SPEED)
		lumberjack.vel[2] = -MAX_SPEED;



	//check collisions with neighboring boxes

	var newx = currentScene.MAP_SIZE/2 + Math.floor((lumberjack.position.x + lumberjack.radius + lumberjack.vel[0])/10);
	var newz = currentScene.MAP_SIZE/2 + Math.floor((lumberjack.position.z + lumberjack.radius + lumberjack.vel[2])/10);

	//console.log (map[newz * currentScene.MAP_SIZE + newx]);
	
	//apply velocities
	lumberjack.position.y += lumberjack.vel[1] * dt;

	//check if can walk
	if (currentScene.map[(newz + 1) * (currentScene.MAP_SIZE + 2) + newx] == 0) {
		
		lumberjack.position.x += lumberjack.vel[0] * dt;
		lumberjack.position.z += lumberjack.vel[2] * dt;
	}



	//handle falling
	if (lumberjack.position.y < 4.5 && !lumberjack.isFalling) {

		lumberjack.vel[1] = 0;

		lumberjack.isGrounded = true;

		lumberjack.position.y = 4.5;

	}

	if (lumberjack.isFalling && lumberjack.position.y < -1000) {

		lumberjack.isFalling = false;
		currentScene = homeScene;

		//this is not the right lumber jack, search scene to find it...

		lumberjack = currentScene.getObjectByName("jack");

		lumberjack.position.set(0, 4.5, ( currentScene.MAP_SIZE/2 - 1 )* 10);

	}


}

function onKeyUp(event) 
{

	var keyCode = event.which;

	keymap[keyCode] = false;

	//console.log(keyCode);


}
	
function onKeyDown(event) 
{
	//console.log(keymap);
	var keyCode = event.which;

	//Toggle view 

    //Push O for orthographic 
    if (keyCode == 79) 
    {
        camera = cameraO;
    } 

    //Push P for perspective 
    if (keyCode == 80) 
    {
        camera = cameraP;
    } 

    //lumberjack Controls 

    //Push W
	if (keyCode == 87) 
    {
    	keymap[87] = true;
    } 
    
    //Push A
	if (keyCode == 65) 
    {
    	keymap[65] = true;
    } 

    //Push S
	if (keyCode == 83) 
    {
    	keymap[83] = true;
    } 

    //Push D
	if (keyCode == 68) 
    {
    	keymap[68] = true;
    } 

	//Push SPACE
	if (keyCode == 32) 
    {
    	keymap[32] = true;
    }

    //Push E
    if (keyCode == 69)
    {
    	keymap[69] = true;
    }


    //Toggle sound 
	//Push 0
	if (keyCode == 48 && mute == false) 
    {
    	backgroundMusic.pause();
    	mute = true;
    } 
    else if(keyCode == 48 && mute == true) 
    {
    	backgroundMusic.play();
    	mute = false;
    }


    //Toggle Menu
    var ui = document.getElementById("menuIMG");

    //Push M
	if (keyCode == 77 && menuOpen) 
    {
    	ui.style.display = 'none';
    	menuOpen = false;
    } 
    else if(keyCode == 77 && !menuOpen) 
    {
    	ui.style.display = 'inline';
    	menuOpen = true;
    }


}

function JackControls () {

	//Lumberjack Controls 

	//Lumberjack movement speed 
	var speed = 5;

    //Push W
	if (keymap[87]) 
    {
    	lumberjack.rotation.y = Math.PI;
        lumberjack.vel[2] -= speed;
    } 
    
    //Push A
	if (keymap[65]) 
    {
        lumberjack.rotation.y = - Math.PI / 2;
        lumberjack.vel[0] -= speed;
    } 

    //Push S
	if (keymap[83]) 
    {
    	lumberjack.rotation.y = 0;
        lumberjack.vel[2] += speed;
    } 

    //Push D
	if (keymap[68]) 
    {
    	lumberjack.rotation.y = + Math.PI / 2;
        lumberjack.vel[0] += speed;
    } 

	//Push SPACE
	if (keymap[32]) 
    {    	
    	//check if double jump
    	if (lumberjack.isGrounded) {
    		lumberjack.vel[1] = 10;
    		lumberjack.isGrounded = false;
    	}
    }

    //Push E
    if (keymap[69])
    {
    	interact();
    	keymap[69] = false;
    }

}

function interact() {

	//get a tree

	//play animation

	//wait until finished

	//change trees model/remove tree

	//add wood

	//update map

	var reach = 5; //in worldspace coordinates

	var dirX = 2 * lumberjack.rotation.y/Math.PI;

	if (dirX > 1)
		dirX = 0;

	var dirZ = - lumberjack.rotation.y/Math.PI;

	if (dirZ == 0)
		dirZ = 1;

	if (Math.abs(dirZ) < 1)
		dirZ = 0;

	console.log(dirX + ':' + dirZ);

	var posX = currentScene.MAP_SIZE/2 + Math.floor((lumberjack.position.x + lumberjack.radius + dirX * reach)/10) ;
	var posZ = currentScene.MAP_SIZE/2 + Math.floor((lumberjack.position.z + lumberjack.radius + dirZ * reach)/10) ;

	var tile = currentScene.map[(posZ + 1) * (currentScene.MAP_SIZE + 2) + posX];

	console.log(tile);

	//remove collision
	if (tile == 1) {
		//interacting with a tree
		currentScene.map[(posZ + 1) * (currentScene.MAP_SIZE + 2) + posX] = 0;

		//remove tree
		for (var i = trees.length - 1; i >= 0; i--) {
			if (trees[i].mapX == posX && trees[i].mapZ == posZ)
				currentScene.remove(trees[i]);
		}

		//add wood
		wood++;

		//play sound
		chopSound.play();

	}

	if (tile == 2) {
		//tile is rock do nothing
	}

	if (tile == 3) {
		//tile is $$$
		//inc $$$

		currentScene.map[(posZ + 1) * (currentScene.MAP_SIZE + 2) + posX] = 0;
	}

	if (tile == 4) {
		//interacting with beanstalk

		//move to a new function
		levelScene = new THREE.Scene();
		levelScene = baseScene.clone();
		currentScene = levelScene;
		createMap(Math.floor(3 + Math.random() * 5));

	}

}