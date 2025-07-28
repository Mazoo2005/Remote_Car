// ====== Bluetooth Connect Button ======
let bluetoothDevice;
let bluetoothCharacteristic;

async function connectBluetooth() {
  const btn = document.getElementById('bluetoothBtn');
  try {
    bluetoothDevice = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'HC' }],
      optionalServices: [0xFFE0]
    });
    const server = await bluetoothDevice.gatt.connect();
    const service = await server.getPrimaryService(0xFFE0);
    bluetoothCharacteristic = await service.getCharacteristic(0xFFE1);
    btn.classList.add('connected');
    // No text change, just color
    alert('Connected via Bluetooth!');
  } catch (e) {
    alert('Connection failed: ' + e);
  }
}

async function sendCommand(cmd) {
  if (bluetoothCharacteristic) {
    const encoder = new TextEncoder();
    await bluetoothCharacteristic.writeValue(encoder.encode(cmd));
  } else {
    alert('Connect to Bluetooth first!');
  }
}

// ==== Movement Buttons: Hold to Move ====
function setupMoveButton(btnId, moveCmd) {
  const btn = document.getElementById(btnId);

  btn.addEventListener('mousedown', () => {
    btn.classList.add('hold');
    sendCommand(moveCmd);
  });
  btn.addEventListener('mouseup', () => {
    btn.classList.remove('hold');
    sendCommand('S');
  });
  btn.addEventListener('mouseleave', () => {
    btn.classList.remove('hold');
    sendCommand('S');
  });
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    btn.classList.add('hold');
    sendCommand(moveCmd);
  });
  btn.addEventListener('touchend', (e) => {
    e.preventDefault();
    btn.classList.remove('hold');
    sendCommand('S');
  });
}
setupMoveButton('forwardBtn', 'F');
setupMoveButton('backwardBtn', 'B');
setupMoveButton('leftBtn', 'L');
setupMoveButton('rightBtn', 'R');

// ==== Video Selector ====
const videoLinks = [
  "", // 0 dummy
  "https://www.youtube.com/embed/dQw4w9WgXcQ",
  "https://www.youtube.com/embed/kXYiU_JCYtU",
  "https://www.youtube.com/embed/9bZkp7q19f0",
  "https://www.youtube.com/embed/3JZ_D3ELwOQ",
  "https://www.youtube.com/embed/L_jWHffIx5E",
  "https://www.youtube.com/embed/CevxZvSJLk8",
  "https://www.youtube.com/embed/2vjPBrBU-TM",
  "https://www.youtube.com/embed/6Dh-RL__uN4",
  "https://www.youtube.com/embed/J---aiyznGQ",
  "https://www.youtube.com/embed/hT_nvWreIhg"
];
function playVideo(n) {
  const frame = document.getElementById('videoFrame');
  if (videoLinks[n]) {
    frame.src = videoLinks[n];
    document.querySelectorAll('.number-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.number-btn')[n-1].classList.add('active');
    // Send serial command to the car as well
    sendCommand(String(n));
  }
}

// ==== AI Ask ====
async function askAI() {
  const question = document.getElementById('question').value.trim();
  if (!question) return;
  document.getElementById('response').innerText = '...جاري البحث';
  const apiKey = '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';
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{role: 'user', content: question}]
      })
    });
    const data = await res.json();
    const answer = data.choices[0].message.content.trim();
    document.getElementById('response').innerText = answer;
    // Text-to-Speech
    const utter = new SpeechSynthesisUtterance(answer);
    utter.lang = 'ar-EG';
    speechSynthesis.speak(utter);
  } catch (e) {
    document.getElementById('response').innerText = 'An error occurred!';
  }
}

// ==== MIC: Speech Recognition Arabic ====
const micBtn = document.getElementById('micBtn');
if (micBtn) {
  micBtn.addEventListener('click', startListening);
}
function startListening() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('Speech recognition not supported!');
    return;
  }
  micBtn.classList.add('active');
  micBtn.disabled = true;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'ar-EG';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = function(event) {
    const result = event.results[0][0].transcript;
    document.getElementById('question').value = result;
    askAI();
  };
  recognition.onerror = function(event) {
    alert('Speech error: ' + event.error);
  };
  recognition.onend = function() {
    micBtn.classList.remove('active');
    micBtn.disabled = false;
  };
  recognition.start();
}