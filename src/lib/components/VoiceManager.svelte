<script lang="ts">
    import { onDestroy, onMount } from 'svelte';

    let { socket, roomId, playerName } = $props<{ 
        socket: WebSocket | null, 
        roomId: string,
        playerName: string
    }>();

    let peerConnection: RTCPeerConnection | null = null;
    let localStream = $state<MediaStream | null>(null);
    let remoteAudio: HTMLAudioElement;
    
    let isMuted = $state(false);
    let connectionStatus = $state('Disconnected'); // Disconnected, Connecting, Connected
    let errorMsg = $state('');

    const ICE_SERVERS = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    async function startVoice() {
        try {
            connectionStatus = 'Requesting Mic...';
            localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            
            // Just notify we are ready. If someone else is there, they will offer.
            // If no one is there, we wait.
            // BUT: If both join at same time? 
            // Let's rely on 'Impolite' peer (Host) initiates if possible, or just whoever is arguably 'first' or 'host'.
            // Actually, simplest usage:
            // 1. User A joins. Sends JOINED.
            // 2. User B joins. Sends JOINED.
            // 3. User A receives JOINED from B. User A (since they are there) creates OFFER.
            // 4. User B receives JOINED from A. (Maybe ignored if A is already there? or A sends offer).
            
            sendSignal({ type: 'VOICE_JOINED' });
            connectionStatus = 'Waiting for peer...';

        } catch (err) {
            console.error('Voice Error:', err);
            errorMsg = 'Mic Access Denied';
            connectionStatus = 'Error';
        }
    }

    function createPeerConnection() {
        if (peerConnection) return;
        
        console.log('Creating RTCPeerConnection');
        peerConnection = new RTCPeerConnection(ICE_SERVERS);

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignal({ candidate: event.candidate });
            }
        };

        peerConnection.ontrack = (event) => {
            console.log('Remote Track Received');
            const [remoteStream] = event.streams;
            if (remoteAudio) {
                remoteAudio.srcObject = remoteStream;
                remoteAudio.play().catch(e => console.error("Autoplay prevented:", e));
            }
        };

        peerConnection.onconnectionstatechange = () => {
             connectionStatus = peerConnection!.connectionState;
             console.log('Connection State:', connectionStatus);
        };

        // Add local tracks if we have them
        if (localStream) {
            localStream.getTracks().forEach(track => {
                peerConnection!.addTrack(track, localStream!);
            });
        }
    }

    function sendSignal(payload: any) {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'VOICE_SIGNAL',
                roomId,
                signal: payload
            }));
        }
    }

    // Handle incoming signals from Parent
    export async function handleSignal(signal: any) {
        console.log('Received Signal:', signal.type || 'candidate/sdp');

        if (signal.type === 'VOICE_JOINED') {
            // Someone joined. If we are active (have stream), we initiate call.
            if (localStream) {
                console.log('Peer joined, initiating offer...');
                createPeerConnection();
                const offer = await peerConnection!.createOffer();
                await peerConnection!.setLocalDescription(offer);
                sendSignal({ sdp: peerConnection!.localDescription });
            }
            return;
        }

        // If we receive an OFFER, we must respond
        if (signal.sdp) {
            if (!peerConnection) createPeerConnection(); // Creation on demand

            // Avoid glare? browser usually handles it, but let's be safe.
            // If we have an offer collision, usually the "polite" peer rollsback.
            // For now, standard flow:
            
            await peerConnection!.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            
            if (signal.sdp.type === 'offer') {
                const answer = await peerConnection!.createAnswer();
                await peerConnection!.setLocalDescription(answer);
                sendSignal({ sdp: peerConnection!.localDescription });
            }
        } else if (signal.candidate) {
             if (peerConnection && peerConnection.remoteDescription) {
                await peerConnection!.addIceCandidate(new RTCIceCandidate(signal.candidate));
             }
        }
    }

    function toggleMute() {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                isMuted = !audioTrack.enabled; // Muted means enabled=false
            }
        }
    }

    onMount(() => {
        // Cleanup on unmount handled by onDestroy
    });

    onDestroy(() => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnection) {
            peerConnection.close();
        }
    });

</script>

<div class="fixed bottom-20 md:bottom-4 right-4 z-100 flex flex-col items-end gap-2 pointer-events-auto">
    <!-- Status Pill -->
    {#if errorMsg}
        <div class="bg-red-900/90 text-white text-xs px-2 py-1 rounded shadow border border-red-500">
            {errorMsg}
        </div>
    {/if}

    <!-- Setup / Controls -->
    {#if !localStream}
        <button class="bg-stone-800 hover:bg-stone-700 text-white p-3 rounded-full shadow-lg border-2 border-green-900 transition-all active:scale-95"
            onclick={startVoice} title="Dołącz do czatu głosowego">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
        </button>
    {:else}
        <div class="flex items-center gap-2">
             <div class="text-[0.6rem] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded bg-black/50 text-white backdrop-blur-sm">
                {connectionStatus}
             </div>
             
             <button class="p-3 rounded-full shadow-lg border-2 transition-all active:scale-95
                    {isMuted ? 'bg-red-600 border-red-800' : 'bg-stone-800 border-stone-600 hover:bg-stone-700'}"
                onclick={toggleMute} title={isMuted ? "Wyłącz wyciszenie" : "Wycisz"}>
                {#if isMuted}
                    <!-- Muted Icon -->
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
                    </svg>
                {:else}
                    <!-- Mic Icon -->
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                {/if}
            </button>
        </div>
    {/if}

    <!-- Hidden Audio Element -->
    <audio bind:this={remoteAudio} autoplay playsinline></audio>
</div>
