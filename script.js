// Matrix Rain Effect
const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const chars = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ01∞';
const fontSize = 14;
const columns = canvas.width / fontSize;
const drops = Array(Math.floor(columns)).fill(1);

function drawMatrix() {
    ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#39ff14';
    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

setInterval(drawMatrix, 50);

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Audio Player State
const audio = document.getElementById('audio-player');
let playlist = [];
let currentTrackIndex = 0;

// UI Elements
const playBtn = document.getElementById('play-btn');
const playIcon = document.getElementById('play-icon');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const volumeSlider = document.getElementById('volume-slider');
const trackTitle = document.querySelector('.track-title');
const trackArtist = document.querySelector('.track-artist');
const playlistContainer = document.getElementById('playlist-items');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const prevBtn = document.querySelector('.control-btn[aria-label="Previous track"]');
const nextBtn = document.querySelector('.control-btn[aria-label="Next track"]');
const albumArtContainer = document.getElementById('album-art');

// Format time helper
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// File Upload Handler
uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Clear playlist
    playlist = [];
    playlistContainer.innerHTML = '';

    // Load files
    files.forEach((file, index) => {
        if (file.type.startsWith('audio/')) {
            const url = URL.createObjectURL(file);
            const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension

            // Read metadata using jsmediatags
            jsmediatags.read(file, {
                onSuccess: (tag) => {
                    const tags = tag.tags;
                    const title = tags.title || fileName;
                    const artist = tags.artist || 'Unknown Artist';
                    let albumArt = null;

                    // Extract album art if available
                    if (tags.picture) {
                        const picture = tags.picture;
                        const base64String = picture.data.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
                        albumArt = `data:${picture.format};base64,${btoa(base64String)}`;
                    }

                    // Update playlist entry
                    const playlistIndex = playlist.findIndex(p => p.url === url);
                    if (playlistIndex !== -1) {
                        playlist[playlistIndex].title = title;
                        playlist[playlistIndex].artist = artist;
                        playlist[playlistIndex].albumArt = albumArt;

                        // Update playlist item display
                        const item = playlistContainer.querySelector(`[data-index="${playlistIndex}"]`);
                        if (item) {
                            item.querySelector('.item-title').textContent = title;
                            item.querySelector('.item-artist').textContent = artist;
                        }

                        // Update current track if it's playing
                        if (playlistIndex === currentTrackIndex) {
                            updateTrackDisplay();
                        }
                    }
                },
                onError: (error) => {
                    console.log('Error reading tags:', error);
                }
            });

            playlist.push({
                url: url,
                title: fileName,
                artist: 'Unknown Artist',
                albumArt: null,
                file: file
            });

            // Create playlist item
            const item = document.createElement('div');
            item.className = 'playlist-item';
            if (index === 0) item.classList.add('active');
            item.dataset.index = index;

            item.innerHTML = `
                <div class="item-info">
                    <div class="item-title">${fileName}</div>
                    <div class="item-artist">Unknown Artist</div>
                </div>
                <div class="item-duration">--:--</div>
            `;

            playlistContainer.appendChild(item);

            // Load duration
            const tempAudio = new Audio(url);
            tempAudio.addEventListener('loadedmetadata', () => {
                item.querySelector('.item-duration').textContent = formatTime(tempAudio.duration);
            });

            // Click handler
            item.addEventListener('click', () => {
                loadTrack(index);
                playTrack();
            });
        }
    });

    // Load first track
    if (playlist.length > 0) {
        loadTrack(0);
    }
});

// Update track display (album art, title, artist)
function updateTrackDisplay() {
    const track = playlist[currentTrackIndex];
    if (!track) return;

    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;

    // Update album art
    const existingImg = albumArtContainer.querySelector('img');
    if (existingImg) {
        existingImg.remove();
    }

    if (track.albumArt) {
        const img = document.createElement('img');
        img.src = track.albumArt;
        img.alt = 'Album Art';
        albumArtContainer.appendChild(img);
    }
}

// Load track function
function loadTrack(index) {
    if (index < 0 || index >= playlist.length) return;

    currentTrackIndex = index;
    const track = playlist[index];

    audio.src = track.url;
    updateTrackDisplay();

    // Update active state
    document.querySelectorAll('.playlist-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
}

// Play track
function playTrack() {
    audio.play();
    playIcon.textContent = '⏸';
    playBtn.style.animation = 'glitch 0.3s infinite';
}

// Pause track
function pauseTrack() {
    audio.pause();
    playIcon.textContent = '▶';
    playBtn.style.animation = '';
}

// Play/Pause Button
playBtn.addEventListener('click', () => {
    if (playlist.length === 0) return;

    if (audio.paused) {
        playTrack();
    } else {
        pauseTrack();
    }
});

// Previous Track
prevBtn.addEventListener('click', () => {
    if (playlist.length === 0) return;
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrackIndex);
    if (!audio.paused) playTrack();
});

// Next Track
nextBtn.addEventListener('click', () => {
    if (playlist.length === 0) return;
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(currentTrackIndex);
    if (!audio.paused) playTrack();
});

// Auto-play next track when current ends
audio.addEventListener('ended', () => {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(currentTrackIndex);
    playTrack();
});

// Update progress bar
audio.addEventListener('timeupdate', () => {
    const progress = (audio.currentTime / audio.duration) * 100 || 0;
    progressBar.style.setProperty('--progress', progress + '%');
    currentTimeEl.textContent = formatTime(audio.currentTime);
});

// Update total time when metadata loads
audio.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(audio.duration);
});

// Progress bar click to seek
progressBar.addEventListener('click', (e) => {
    if (playlist.length === 0 || !audio.duration) return;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audio.currentTime = percentage * audio.duration;
});

// Volume control
audio.volume = 0.8;
volumeSlider.addEventListener('click', (e) => {
    const rect = volumeSlider.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audio.volume = percentage;
    volumeSlider.style.setProperty('--volume', (percentage * 100) + '%');
});

// Random visualizer animation
const bars = document.querySelectorAll('.bar');
setInterval(() => {
    if (!audio.paused && playlist.length > 0) {
        bars.forEach(bar => {
            const height = Math.random() * 80 + 20;
            bar.style.setProperty('--height', height + '%');
        });
    }
}, 100);

// Glitch effect on hover
const logo = document.querySelector('.logo');
logo.addEventListener('mouseenter', () => {
    logo.style.animation = 'glitch 0.2s infinite';
});
logo.addEventListener('mouseleave', () => {
    logo.style.animation = 'glitch 3s infinite';
});
