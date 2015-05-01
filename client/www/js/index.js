/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        // var parentElement = document.getElementById(id);
        // var listeningElement = parentElement.querySelector('.listening');
        // var receivedElement = parentElement.querySelector('.received');

        // listeningElement.setAttribute('style', 'display:none;');
        // receivedElement.setAttribute('style', 'display:block;');

        PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
        IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
        SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
        navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;

        // Step 1. getUserMedia
        navigator.getUserMedia({
                audio: true,
                video: true
            },
            gotStream,
            function(error) {
                console.log(error)
            }
        );

        socket = io.connect('http://pumpidu.com:1234/');

        socket.on('message', function(message) {
            if (message.type === 'offer') {
                pc.setRemoteDescription(new SessionDescription(message));
                createAnswer();
            } else if (message.type === 'answer') {
                pc.setRemoteDescription(new SessionDescription(message));
            } else if (message.type === 'candidate') {
                var candidate = new IceCandidate({
                    sdpMLineIndex: message.label,
                    candidate: message.candidate
                });
                pc.addIceCandidate(candidate);
            }
        });

        //callButton
        var callButton = document.getElementById('callButton');
        callButton.addEventListener('click', function() {
            console.log('create offer');
            createOffer();
        });

        console.log('Received Event: ' + id);
    }
};

app.initialize();

var socket;

var PeerConnection;
var IceCandidate;
var SessionDescription;

var pc; // PeerConnection


function gotStream(stream) {

    console.log('got stream');

    document.getElementById("callButton").style.display = 'inline-block';
    document.getElementById("localVideo").src = URL.createObjectURL(stream);

    pc = new PeerConnection(null);
    pc.addStream(stream);
    pc.onicecandidate = gotIceCandidate;
    pc.onaddstream = gotRemoteStream;
}


// Step 2. createOffer
function createOffer() {
    pc.createOffer(
        gotLocalDescription,
        function(error) {
            console.log(error)
        }, {
            'mandatory': {
                'OfferToReceiveAudio': true,
                'OfferToReceiveVideo': true
            }
        }
    );
}


// Step 3. createAnswer
function createAnswer() {
    pc.createAnswer(
        gotLocalDescription,
        function(error) {
            console.log(error)
        }, {
            'mandatory': {
                'OfferToReceiveAudio': true,
                'OfferToReceiveVideo': true
            }
        }
    );
}


function gotLocalDescription(description) {
    pc.setLocalDescription(description);
    sendMessage(description);
}

function gotIceCandidate(event) {
    if (event.candidate) {
        sendMessage({
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
        });
    }
}

function gotRemoteStream(event) {
    document.getElementById("remoteVideo").src = URL.createObjectURL(event.stream);
}


////////////////////////////////////////////////
// Socket.io

function sendMessage(message) {
    socket.emit('message', message);
}
