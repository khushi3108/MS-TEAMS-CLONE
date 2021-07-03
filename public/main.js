let Peer = require('simple-peer')
let socket = io() // initializing socket element which connects directly to host .
const checkboxTheme = document.querySelector('.theme') //for adding theme fns
const video = document.querySelector('video') //This is the video while video streaming.
var text = 'session active. Please visit when clients less than 2'
let client = {}
video.muted = true //Here we have muted this video so that we get to hear other person's voice in the video call and not just ours.
	/*getting the video stream of client side(or the other user who has the url)
	by accessing and prompting user for permission to access media input which produces 
	MediaStream and tracks containing types of media requested*/
navigator.mediaDevices.getUserMedia({
		video: {
			facingMode: "user"
		},
		audio: true
	}).then(stream => { //if the user gives the permission to access mic and camera then we have the stream
		socket.emit('NewUser') //alert sent to our backend server.js using socket
		video.srcObject = stream
		video.play(); //user can see his/her own video stream
		function newPeer(val) {
			let peer = new Peer({
					initiator: (val == 'init') ? true : false,
					trickle: false,
					stream: stream
				})
				/*Creating a new peer for connection -the initiator parameter is matched with the type(val passed 
				and if initiator is of type init we assign it true o.w false. In case of true the peer itself 
				calls the signal function and we wait for it to make an offer while in case of false 
				the signal function is specified since it won't make offer itself) Trickle is set to false since there is only 1 signaling function*/
			peer.on('stream', function(stream) {
				createVideoStream(stream) //function to create video when stream is live 
			})
			peer.on('close', function() {
				document.getElementById('peerVideo').remove //removes the video of client when connection closed.
				peer.destroy() //Destroy and cleanup this peer connection.
			})
			return peer
		}
		//function to create a new peer which will be called when an offer has to be made of type initiator
		function createPeer() {
			client.getAnswer = false //setting initial ans to false
			let peer = newPeer('init') //getting our peer from the NewPeer() created 
				//Fired when the peer wants to send signaling data to the remote peer.
			peer.on('signal', data => {
				if(!client.getAnswer) //if ans is true
					socket.emit('offer', data) //event is offer here and offer will be made by send data to signaling fn
			})
			client.peer = peer //setting property of client as peer type
		}
		//function of type not-init and here it's used to send final answer to client when offer fn is itself not called
		function finalAnswer(offer) {
			let peer = newPeer('not-init')
			peer.on('signal', data => {
				socket.emit('Answer', data)
			})
			peer.signal(offer) //since the type is not-init hence signal funct would'nt be called itself hence this line of code calls the signal function with offer
			client.peer = peer
		}
		//function to send Signal Ans . It send the ans from backend and if ans is recd at backend it is sent to signal fn and cliets shall be conncted
		function signallingAns(answer) {
			client.getAnswer = true //since this fn is to signal ans recd at backend its assumed that this prop is true
			let peer = client.peer
			peer.signal(answer)
		}

		function createVideoStream(stream) {
			createDiv()
			let vid = document.createElement('video')
			vid.id = 'peerVideo'
			vid.srcObject = stream
			vid.setAttribute('class', 'embed-responsive-item')
			document.querySelector('#peerVid').appendChild(vid)
			vid.play()
			vid.addEventListener('click', () => {
				if(vid.volume != 0) vid.volume = 0
				else vid.volume = 1
			})
		}
		//function when 2 people are chatting and session is live and another person with same url tries to join
		function activeSession() {
			document.send(warning)
		}

		function removePeer() {
			document.getElementById("peerVideo").remove();
			document.getElementById("muteText").remove();
			if(client.peer) {
				client.peer.destroy()
			}
		}
		//event listeners so that all fns inlcuing newPeer create peer and 2 others work hence 4 events
		socket.on('backOffer', finalAnswer)
		socket.on('backAns', signallingAns)
		socket.on('sessionActive', activeSession)
		socket.on('createClient', createPeer)
		socket.on('Disconnect', removePeer)
	})
	//else if the user doesn't give the permission(onrejected) we catch the error and display it
	.catch(error => document.write(error))
	//in case of dark theme and on click beh to mute and unmute
checkboxTheme.addEventListener('click', () => {
		if(checkboxTheme.checked) {
			document.body.style.backgroundColor = '#464775'
			if(document.querySelector('#muteText')) {
				document.querySelector('#muteText').style.color = "#f5f5f5c2"
			}
		} else {
			document.body.style.backgroundColor = '#f5f5f5c2'
			if(document.querySelector('#muteText')) {
				document.querySelector('#muteText').style.color = "#464775"
			}
		}
	})
	//for createvideostream fn in case of mute and unmute
function createDiv() {
	let div = document.createElement('div')
	div.setAttribute('class', "centered")
	div.id = "muteText"
	div.innerHTML = "Tap to Mute/Unmute"
	document.querySelector('#peerVid').appendChild(div)
	if(checkboxTheme.checked) document.querySelector('#muteText').style.color = "#f5f5f5c2"
}
//adding chat box features 
$(function() {
		var arrow = $('.chat-head img')
		var textarea = $('.chat-text textarea')
		arrow.on('click', function() {
			var src = arrow.attr('src')
			$('.chat-body').slideToggle('fast')
			if(src == 'https://maxcdn.icons8.com/windows10/PNG/16/Arrows/angle_down-16.png') {
				arrow.attr('src', 'https://maxcdn.icons8.com/windows10/PNG/16/Arrows/angle_up-16.png')
			} else {
				arrow.attr('src', 'https://maxcdn.icons8.com/windows10/PNG/16/Arrows/angle_down-16.png')
			}
		})
		textarea.keypress(function(event) {
			var $this = $(this)
			if(event.keyCode == 13) {
				var msg = $this.val()
				$this.val('')
				$('.msg-insert').prepend("<div class='msg-send'>" + msg + "</div>")
			}
		})
	})
	// for clock real time
function showTime() {
	'use strict';
	var now = new Date(),
		hours = now.getHours(),
		minutes = now.getMinutes(),
		seconds = now.getSeconds();
	if(hours < 10) {
		hours = "0" + hours;
	}
	if(minutes < 10) {
		minutes = "0" + minutes;
	}
	if(seconds < 10) {
		seconds = "0" + seconds;
	}
	document.getElementById('clock').textContent = hours + ":" + minutes + ":" + seconds;
}
window.onload = function() {
	'use strict';
	setInterval(showTime, 500);
};
//screen share
const stunServerConfig = {
	iceServers: [{
		url: 'turn:13.250.13.83:3478?transport=udp',
		username: "YzYNCouZM1mhqhmseWk6",
		credential: "YzYNCouZM1mhqhmseWk6"
	}]
};
let startbtn = document.getElementById('start'); //start btn to start share screen
let stopbtn = document.getElementById('stop'); //stop button to stop share screen
var initiator = false;
startbtn.onclick = function() {
	initiator = true;
	socket.emit('initiate'); //call back to event initiate
}
stopbtn.onclick = function() {
	socket.emit('initiate'); //call back to event initiate
}
socket.on('initiate', () => {
	startStream();
	starbtn.style.display = 'none';
	stopbtn.style.display = 'block';
})

function startStream() {
	if(initiator) {
		// get screen stream
		window.navigator.mediaDevices.getUserMedia({
			video: {
				mediaSource: "screen",
				width: {
					max: '1920'
				},
				height: {
					max: '1080'
				},
				frameRate: {
					max: '10'
				}
			}
		}).then(gotMedia);
	} else {
		gotMedia(null);
	}
}

function gotMedia(stream) {
	if(initiator) {
		let peer = new Peer({
			initiator,
			stream,
			config: stunServerConfig
		});
	} else {
		let peer = new Peer({
			config: stunServerConfig
		});
	}
	peer.on('signal', function(data) {
		socket.emit('Offer', JSON.stringify(data));
	});
	socket.on('Offer', (data) => {
		peer.signal(JSON.parse(data));
	})
	peer.on('stream', function(stream) {
		let vid = document.createElement('video')
		vid.id = 'screenVideo'
		vid.srcObject = stream
		vid.setAttribute('class', 'screen')
		document.querySelector('#shareSpace').appendChild(vid)
		vid.play()
	})
}