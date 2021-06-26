let peer = require('simple-peer')
let socket = io() // initializing socket element which connects directly to host .

const myVideo = document.querySelector('video')//This is for us to see our own video while video streaming.
let client = {}
myVideo.muted = true //Here we have muted this video so that we get to hear other person's voice in the video call and not just ours.

/*getting the video stream of client side(or the other user who has the url)
by accessing and prompting user for permission to access media input which produces 
MediaStream and tracks containing types of media requested*/
navigator.mediaDevices.getUserMedia({
    audio: true,
    video: {facingMode : "user",//since we are building video app we need user to face camera by default
            height : {ideal:1280},//we have described that video should access camera with the ideal resolution 1280x720
            width: {ideal:720} 
}
})

//if the user gives the permission to access mic and camera then we have the stream
.then(clientStream => {
    socket.emit('NewUser')//alert sent to our backend server.js using socket
    myVideo.srcObject = clientStream
    myVideo.play(); //user can see his/her own video stream
    function NewPeer(val){
        let peer = new Peer({ initiator: (val =='init')?true:false , trickle: false , stream:clientStream}) 
        
        /*Creating a new peer for connection -the initiator parameter is matched with the type(val passed 
        and if initiator is of type init we assign it true o.w false. In case of true the peer itself 
        calls the signal function and we wait for it to make an offer while in case of false 
        the signal function is specified since it won't make offer itself) Tricle is set to false since there is only 1 signaling function*/
        peer.on('stream', function(clientStream){
            createVideoStream(clientStream)//function to create video when stream is live 
        })
        peer.on('close',function(){
            document.getElementById('peerVid').remove//removes the video of client when connection closed.
            peer.destroy()//Destroy and cleanup this peer connection.
        })
        
        return peer
     }
     //function to create a new peer which will be called when an offer has to be made of type initiator
     function createPeer(){
         client.getAnswer = false//setting initial ans to false
         let peer = NewPeer('init')//getting our peer from the NewPeer() created 
         //Fired when the peer wants to send signaling data to the remote peer.
         peer.on('signal', data => {
             if(!client.getAnswer)//if ans is true
             socket.emit('offer',data)//event is offer here and offer will be made by send data to signaling fn
         })
             client.peer = peer //setting property of client as peer type
     }
     //function of type not-init and here it's used to send final answer to client when offer fn is itself not called
     function finalAnswer(offer){
         let peer = NewPeer('not-init')
         peer.on('signal',data=>{
             socket.emit('Answer',data)
         })
         peer.signal(offer)//since the type is not-init hence signal funct would'nt be called itself hence this line of code calls the signal function with offer
     }
      
     //function to send Signal Ans . It send the ans from backend and if ans is recd at backend it is sent to signal fn and cliets shall be conncted
    function signallingAns(answer){
        peer.getAnswer = true//since this fn is to signal ans recd at backend its assumed that this prop is true
        let peer = client.peer
        peer.signal(answer)
    }
    
    function createVideoStream(stream){
    let vid = document.createElement('video')
    vid.id = 'peerVid'
    vid.srcObject = stream 
    vid.className = 'embed-responsive-item'
    document.querySelector('#peer').appendChild(vid)//the first element matching the div id=peer's has video element appended.(in the client html where vid element isnt defined since it will be displayed from here.)
    vid.play()
   }
    //function when 2 people are chatting and session is live and another persin with sam url tries to join
    function activeSession(){
        document.write('Session in progress. Please wait or try again later when room has less than 2 people')
    }
    //event listeners so that all fns inlcuing newPeer createpeer and 2 others work hence 4 events
    socket.on('backOffer',finalAnswer)
    socket.on('backAns',signallingAns)
    socket.on('sessionActive',activeSession)
    socket.on('createClient',createPeer)
 })

//else if the user doesn't give the permission(onrejected) we catch the error and display it
.catch( error => document.write(error))
