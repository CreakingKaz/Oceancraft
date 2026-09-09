const AudioSystem = {
    ctx: null,
    isMusicPlaying: false,
    windOsc: null,

    init() {
        // Crear el contexto de audio (sintetizador del navegador)
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        // Los navegadores bloquean el audio hasta que el usuario hace clic.
        // Iniciamos el sonido ambiente cuando hagan clic en cualquier botón.
        document.body.addEventListener('click', () => {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
                this.startOceanWind();
            }
        }, { once: true });
    },

    update(deltaTime) {
        if (!this.ctx || this.ctx.state === 'suspended') return;

        // Probabilidad de gaviota (0.1%)
        if (Math.random() < 0.001) {
            this.playSeagull();
        }

        // Probabilidad de música estilo Minecraft (0.05%)
        if (!this.isMusicPlaying && Math.random() < 0.0005) {
            this.playRandomMusic();
        }
    },

    // 1. Generador de Viento Oceánico (Ruido Blanco Filtrado)
    startOceanWind() {
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generar ruido aleatorio
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        // Filtrar el ruido para que suene como viento suave
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300; 

        const gain = this.ctx.createGain();
        gain.gain.value = 0.5; // Volumen del viento

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    },

    // 2. Generador de Gaviota (Oscilador que baja de frecuencia rápido)
    playSeagull() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        // Empieza agudo y baja
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.3);
        
        // Volumen (Fade out rápido)
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    },

    // 3. Generador de Música Ambiental (Notas aleatorias relajantes)
    playRandomMusic() {
        this.isMusicPlaying = true;
        
        // Escala pentatónica para que suene armónico
        const notes = [261.63, 293.66, 329.63, 392.00, 440.00]; 
        let startTime = this.ctx.currentTime;
        const totalNotes = 8;

        for (let i = 0; i < totalNotes; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'triangle'; // Sonido suave estilo caja de música
            osc.frequency.value = notes[Math.floor(Math.random() * notes.length)];
            
            // Efecto de entrada y salida suave por cada nota
            gain.gain.setValueAtTime(0, startTime + i * 1);
            gain.gain.linearRampToValueAtTime(0.1, startTime + i * 1 + 0.2);
            gain.gain.linearRampToValueAtTime(0, startTime + i * 1 + 0.8);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(startTime + i * 1);
            osc.stop(startTime + i * 1 + 1);
        }

        // Restablecer bandera cuando termine la melodía
        setTimeout(() => {
            this.isMusicPlaying = false;
        }, totalNotes * 1000);
    }
};