// -- MÁQUINA DE ESTADOS E NÍVEIS
let estado = 0; // 0: Início, 1: Calibração, 2: Jogo, 3: Vitória, 4: Game Over, 5: Transição
let nivelAtual = 1; 

// -- GESTÃO DE TEMPO E CRONÓMETRO
let tempoInicioJogo = 0;
let tempoDecorridoSegundos = 0;
let tempoPausaIniciado = 0; // Guarda o momento em que o jogo pausa

// -- MICROFONE E HISTERESE (CONTROLO DE ÁUDIO)
let mic;
let inicioCalibracao;
let somaVolume = 0;
let amostras = 0;
let limiteChuva = 0; 
let limiteVentoOn = 0.40;  // Liga o vento
let limiteVentoOff = 0.34; // Desliga o vento (Histerese)
let estadoChuva = false;
let estadoVento = false;

// -- ENTIDADES (POO - Programação Orientada a Objetos)
let jogador;
let buracos = [];
let obstaculos = [];
let gotasAgua = []; 
let tempoUltimoObstaculo = 0;
let tempoUltimaGota = 0;

// -- ÁUDIO E IMAGENS
let somGota, somArvore, somDano, somNivel, somFim, somVitoria, somFundo;
let imgNuvem, imgPassaro, imgMeteoro, imgGota;

function preload() {
    somGota = loadSound('sons/gota.mp3');
    somArvore = loadSound('sons/arvore.mp3');
    somDano = loadSound('sons/dano.mp3');
    somNivel = loadSound('sons/nivel.mp3');
    somFim = loadSound('sons/fim.mp3');         
    somVitoria = loadSound('sons/vitoria.mp3'); 
    somFundo = loadSound('sons/fundo.mp3');     

    imgNuvem = loadImage('imagens/nuvem.png', () => {}, () => {});
    imgPassaro = loadImage('imagens/passaro.png', () => {}, () => {});
    imgMeteoro = loadImage('imagens/meteoro.png', () => {}, () => {});
    imgGota = loadImage('imagens/gota_agua.png', () => {}, () => {});
}

function setup() {
    createCanvas(800, 500);
    mic = new p5.AudioIn();
    mic.start();
    
    jogador = new Nuvem();
    inicializarNivel(1);
    
    if (somFundo) somFundo.setVolume(0.3);
    
    textFont('sans-serif');
    textStyle(BOLD);
}

function draw() {
    if (nivelAtual === 1) background(135, 206, 235);
    else if (nivelAtual === 2) background(253, 140, 80);
    else background(80, 90, 110);

    if (estado === 0) ecraInicio();
    else if (estado === 1) ecraCalibracao();
    else if (estado === 2) ecraJogo();
    else if (estado === 3) ecraVitoria();
    else if (estado === 4) ecraGameOver();
    else if (estado === 5) ecraNivelConcluido();

    desenharRodape(); 
}

// =========================================================
// CLASSES (REQUISITO 11 - Estruturas de Dados e POO)
// =========================================================

class Nuvem {
    constructor() {
        this.x = 400;
        this.y = 150;
        this.reservaAgua = 100;
        this.pontuacao = 0;
    }

    mover() {
        if (keyIsDown(LEFT_ARROW)) this.x -= 5;
        if (keyIsDown(RIGHT_ARROW)) this.x += 5;
        if (keyIsDown(UP_ARROW)) this.y -= 5;
        if (keyIsDown(DOWN_ARROW)) this.y += 5;
        this.x = constrain(this.x, 60, width - 60);
        this.y = constrain(this.y, 60, height - 160);
    }

    desenhar() {
        if (imgNuvem && imgNuvem.width > 0) {
            tint(map(this.reservaAgua, 0, 100, 255, 120)); 
            imageMode(CENTER);
            image(imgNuvem, this.x, this.y, 110, 70);
            noTint();
        } else {
            let corNuvem = map(this.reservaAgua, 0, 100, 255, 100);
            fill(corNuvem); noStroke();
            ellipse(this.x, this.y, 100, 40);
            ellipse(this.x - 25, this.y - 15, 60, 60);
            ellipse(this.x + 25, this.y - 15, 60, 60);
            fill(0); ellipse(this.x - 15, this.y - 5, 6, 6); ellipse(this.x + 15, this.y - 5, 6, 6); 
            noFill(); stroke(0); strokeWeight(2); arc(this.x, this.y + 5, 20, 10, 0, PI); noStroke();
        }
        
        let larguraBarra = 60;
        let preenchimento = map(this.reservaAgua, 0, 100, 0, larguraBarra);
        fill(255, 255, 255, 150);
        rect(this.x - larguraBarra / 2, this.y - 55, larguraBarra, 8, 4); 
        fill(0, 150, 255);
        rect(this.x - larguraBarra / 2, this.y - 55, preenchimento, 8, 4);
    }

    desenhaChuva() {
        stroke(33, 150, 243); strokeWeight(2);
        for(let i = 0; i < 6; i++) {
            let gotaX = this.x + random(-40, 40);
            let gotaY = this.y + random(20, 150);
            line(gotaX, gotaY, gotaX, gotaY + 15);
        }
        noStroke();
    }
}

class Buraco {
    constructor(x) {
        this.x = x;
        this.y = height - 50;
        this.crescimento = 0;
        this.completa = false;
    }

    desenhar(larguraCova) {
        fill(92, 58, 33); 
        ellipse(this.x, this.y, larguraCova, 25); 
        
        if (this.crescimento > 0) {
            let altura = map(this.crescimento, 0, 100, 0, 35);
            let tamanhoFolhas = map(this.crescimento, 0, 100, 0, 35);
            stroke(101, 67, 33); strokeWeight(4);
            line(this.x, this.y, this.x, this.y - altura); 
            noStroke();
            fill(34, 139, 34);
            circle(this.x, this.y - altura, tamanhoFolhas); 
        }
    }
}

class Obstaculo {
    constructor() {
        this.tipo = random(["passaro", "meteoro"]);
        let velBase = random(2, 3) + (nivelAtual - 1) * 2.2;
        let origem = random(["direita", "esquerda", "topo"]);
        
        if (origem === "direita") { this.x = width + 30; this.y = random(50, 220); this.vx = -velBase; this.vy = random(-0.8, 0.8); } 
        else if (origem === "esquerda") { this.x = -30; this.y = random(50, 220); this.vx = velBase; this.vy = random(-0.8, 0.8); } 
        else { this.x = random(100, width - 100); this.y = -30; this.vx = random(-1.5, 1.5); this.vy = velBase; }
    }

    atualizar() {
        if (estadoVento) {
            let angulo = atan2(this.y - jogador.y, this.x - jogador.x);
            this.x += cos(angulo) * 8;
            this.y += sin(angulo) * 8;
        } else {
            this.x += this.vx;
            this.y += this.vy;
        }
    }

    desenhar() {
        imageMode(CENTER);
        if (this.tipo === "passaro") {
            if (imgPassaro && imgPassaro.width > 0) {
                push(); translate(this.x, this.y); if (this.vx > 0) scale(-1, 1); image(imgPassaro, 0, 0, 36, 36); pop();
            } else {
                fill(200, 50, 50); triangle(this.x, this.y, this.x + 18, this.y - 8, this.x + 18, this.y + 8);
            }
        } else {
            if (imgMeteoro && imgMeteoro.width > 0) {
                image(imgMeteoro, this.x, this.y, 42, 42);
            } else {
                fill(80, 0, 80); ellipse(this.x, this.y, 45, 25); ellipse(this.x - 12, this.y - 8, 30, 30); ellipse(this.x + 12, this.y - 8, 30, 30);
            }
        }
    }
}

class GotaAgua {
    constructor() {
        this.x = random(50, width - 50);
        this.y = -10;
        this.vel = random(1.5, 3);
    }

    atualizar() {
        this.y += this.vel;
    }

    desenhar() {
        if (imgGota && imgGota.width > 0) {
            imageMode(CENTER); image(imgGota, this.x, this.y, 20, 26);
        } else {
            fill(0, 191, 255); noStroke(); ellipse(this.x, this.y, 14, 20);
        }
    }
}

// =========================================================
// LÓGICA DE JOGO E ECRÃS
// =========================================================

function inicializarNivel(nivel) {
    buracos = []; obstaculos = []; gotasAgua = [];
    let numBuracos = 3 + (nivel - 1) * 2; 
    let espacamento = width / (numBuracos + 1);
    for (let i = 1; i <= numBuracos; i++) {
        buracos.push(new Buraco(i * espacamento));
    }
}

function ecraInicio() {
    push(); // Guarda as configurações de estilo para não afetar o resto do jogo
    
    // -- Caixa de fundo escurecida (ajuda imenso a ler o texto)
    fill(0, 0, 0, 120);
    noStroke();
    rectMode(CENTER);
    rect(width / 2, height / 2 - 10, 680, 330, 20); // Caixa com cantos arredondados
    
    // -- Título com efeito de sombra
    textAlign(CENTER, CENTER);
    textSize(38);
    fill(0, 150); 
    text("☁️ A NUVEM SEMEADEIRA ☁️", width/2 + 3, 93); // Sombra
    fill(255); 
    text("☁️ A NUVEM SEMEADEIRA ☁️", width/2, 90); // Título branco

    // -- Objetivo (destacado a verde claro)
    textSize(18);
    fill(150, 255, 150); 
    text("🎯 Objetivo: Faz crescer todas as árvores antes que a água acabe.", width/2, 155);

    // -- Instruções / Controlos
    fill(255);
    textSize(18);
    text("🎮 Setas do Teclado: Movem a nuvem", width/2, 210);
    text("🌧️ Som constante (Mic): Faz chover (gasta água)", width/2, 245);
    text("💨 Sopro forte (Mic): Vento que afasta pássaros e meteoros", width/2, 280);
    
    // -- Dica extra (destacada a azul claro)
    fill(135, 206, 250); 
    text("💧 Gotas azuis: Apanha-as para recarregar a tua reserva", width/2, 320);

    // -- Mensagem de Start (pisca suavemente usando a função sin e millis)
    let alphaPiscar = map(sin(millis() / 250), -1, 1, 100, 255);
    fill(255, 215, 0, alphaPiscar); // Amarelo dourado a piscar
    textSize(22);
    text("✨ Prime [ ESPAÇO ] para calibrar o microfone ✨", width/2, 385);
    
    pop(); // Restaura as configurações normais
}

function ecraCalibracao() {
    fill(0); textAlign(CENTER); textSize(20);
    text("A calibrar o microfone...", width / 2, height / 2 - 20);
    text("Por favor, mantém o silêncio durante 3 segundos.", width / 2, height / 2 + 20);

    let v = mic.getLevel();
    somaVolume += v; amostras++;

    if (millis() - inicioCalibracao >= 3000) {
        limiteChuva = (somaVolume / max(1, amostras)) + 0.08; 
        tempoInicioJogo = millis(); 
        estado = 2; 
        if (somFundo && somFundo.isLoaded() && !somFundo.isPlaying()) somFundo.loop();
    }
}

function ecraJogo() {
    desenhaCenario();
    tempoDecorridoSegundos = floor((millis() - tempoInicioJogo) / 1000);
    let vol = mic.getLevel();

    // Histerese corrigida do Vento e da Chuva
    if (vol > limiteVentoOn) {
        estadoVento = true;
        estadoChuva = false;
    } else if (estadoVento && vol < limiteVentoOff) {
        estadoVento = false;
    }

    if (!estadoVento) {
        if (!estadoChuva && vol > limiteChuva) estadoChuva = true;
        else if (estadoChuva && vol < limiteChuva - 0.02) estadoChuva = false;
    } else {
        estadoChuva = false; 
    }

    if (estadoChuva && jogador.reservaAgua > 0) {
        jogador.reservaAgua -= 0.12;
        jogador.desenhaChuva();
        
        let raioAlcance = map(buracos.length, 3, 7, 45, 25);
        for (let b of buracos) {
            if (abs(jogador.x - b.x) < raioAlcance && !b.completa) {
                b.crescimento += 0.5;
                if (b.crescimento >= 100) {
                    b.completa = true;
                    jogador.pontuacao += 10;
                    if (somArvore && somArvore.isLoaded()) somArvore.play();
                }
            }
        }
    }

    if (jogador.reservaAgua <= 0 && estado === 2) {
        estado = 4;
        if (somFundo && somFundo.isPlaying()) somFundo.stop(); 
        if (somFim && somFim.isLoaded()) somFim.play(); 
    }

    jogador.mover();
    gerarAtualizarEntidades();
    verificarProgressoNivel();
    jogador.desenhar();
    desenharHUD();
}

function gerarAtualizarEntidades() {
    // Obstáculos
    if (millis() - tempoUltimoObstaculo > map(nivelAtual, 1, 3, 3000, 800)) {
        let qtd = (nivelAtual === 3 && random() < 0.4) ? 2 : 1;
        for (let k = 0; k < qtd; k++) obstaculos.push(new Obstaculo());
        tempoUltimoObstaculo = millis();
    }
    
    for (let i = obstaculos.length - 1; i >= 0; i--) {
        let obs = obstaculos[i];
        obs.atualizar();
        obs.desenhar();
        
        if (dist(jogador.x, jogador.y, obs.x, obs.y) < 45) {
            jogador.reservaAgua = max(0, jogador.reservaAgua - 15);
            jogador.pontuacao = max(0, jogador.pontuacao - 5);
            if (somDano && somDano.isLoaded()) somDano.play();
            obstaculos.splice(i, 1);
            continue;
        }
        if (obs.x < -60 || obs.x > width + 60 || obs.y < -60 || obs.y > height - 80) obstaculos.splice(i, 1);
    }

    // Gotas
    if (millis() - tempoUltimaGota > 3500) {
        gotasAgua.push(new GotaAgua());
        tempoUltimaGota = millis();
    }
    
    for (let i = gotasAgua.length - 1; i >= 0; i--) {
        let g = gotasAgua[i];
        g.atualizar();
        g.desenhar();
        if (dist(jogador.x, jogador.y, g.x, g.y) < 45) {
            jogador.reservaAgua = min(100, jogador.reservaAgua + 20); 
            if (somGota && somGota.isLoaded()) somGota.play();
            gotasAgua.splice(i, 1);
            continue;
        }
        if (g.y > height - 100) gotasAgua.splice(i, 1);
    }
}

function desenhaCenario() {
    noStroke(); fill(139, 69, 19); rect(0, height - 100, width, 100); 
    fill(34, 139, 34); rect(0, height - 100, width, 10); 
    let larguraBuraco = map(buracos.length, 3, 7, 80, 45);
    for (let b of buracos) b.desenhar(larguraBuraco);
}

function verificarProgressoNivel() {
    if (buracos.every(b => b.completa) && estado === 2) {
        if (nivelAtual < 3) {
            estado = 5; 
            tempoPausaIniciado = millis(); // Guarda o tempo em que parou
            if (somNivel && somNivel.isLoaded()) somNivel.play();
        } else {
            estado = 3; 
            if (somFundo && somFundo.isPlaying()) somFundo.stop(); 
            if (somVitoria && somVitoria.isLoaded()) somVitoria.play(); 
        }
    }
}

function ecraNivelConcluido() {
    fill(0, 100, 0); textAlign(CENTER); textSize(32); text("NÍVEL " + nivelAtual + " CONCLUÍDO!", width / 2, height / 2 - 40);
    fill(0); textSize(20); text("Pontuação Atual: " + jogador.pontuacao + " pts", width / 2, height / 2);
    text("Tempo acumulado: " + formatarTempo(tempoDecorridoSegundos), width / 2, height / 2 + 30);
    fill(50); textSize(16); text("Prime ESPAÇO para avançar para o Nível " + (nivelAtual + 1), width / 2, height / 2 + 75);
}

function ecraVitoria() {
    fill(0, 128, 0); textAlign(CENTER); textSize(32); text("PARABÉNS! JOGO CONCLUÍDO", width / 2, height / 2 - 40);
    fill(0); textSize(22); text("Pontuação Final: " + jogador.pontuacao + " pts", width / 2, height / 2);
    text("Tempo Total: " + formatarTempo(tempoDecorridoSegundos), width / 2, height / 2 + 30);
    textSize(16); text("Prime ESPAÇO para jogar novamente", width / 2, height / 2 + 75);
}

function ecraGameOver() {
    fill(200, 0, 0); textAlign(CENTER); textSize(36); text("GAME OVER", width / 2, height / 2 - 40);
    fill(0); textSize(20); text("A tua reserva de água esgotou-se!", width / 2, height / 2);
    text("Tempo de jogo: " + formatarTempo(tempoDecorridoSegundos), width / 2, height / 2 + 30);
    textSize(16); text("Prime ESPAÇO para tentar novamente", width / 2, height / 2 + 75);
}

function formatarTempo(sTotais) {
    let min = floor(sTotais / 60); let seg = sTotais % 60;
    return (min < 10 ? "0" + min : min) + ":" + (seg < 10 ? "0" + seg : seg);
}

function desenharHUD() {
    fill(255, 255, 255, 120); noStroke(); rect(0, 0, width, 45);
    fill(0); textSize(18);
    textAlign(LEFT, CENTER); text("Pontuação: " + jogador.pontuacao, 20, 22);
    textAlign(CENTER, CENTER); text("Nível: " + nivelAtual + " / 3", width / 2, 22);
    textAlign(RIGHT, CENTER); text("Tempo: " + formatarTempo(tempoDecorridoSegundos), width - 20, 22);

    if (estadoVento) { fill(255, 69, 0); textSize(20); textAlign(CENTER, CENTER); text("SOPRO DE VENTO ATIVO!", width / 2, 70); }
    desenharBarraAudio();
}

function desenharBarraAudio() {
    let barraLargura = 20; let barraAltura = 200; 
    let barraX = width - barraLargura - 30; let barraY = 100;

    let vol = mic.getLevel();
    let volVisual = map(constrain(vol, 0, 0.5), 0, 0.5, 0, barraAltura);
    let limiteChuvaVis = map(constrain(limiteChuva, 0, 0.5), 0, 0.5, 0, barraAltura);
    let limiteVentoVis = map(constrain(limiteVentoOn, 0, 0.5), 0, 0.5, 0, barraAltura);

    fill(0, 0, 0, 50); noStroke(); rect(barraX, barraY, barraLargura, barraAltura, 5);
    if (estadoVento) fill(255, 69, 0); else if (estadoChuva) fill(33, 150, 243); else fill(100, 200, 100); 
    rect(barraX, barraY + barraAltura - volVisual, barraLargura, volVisual, 5);

    stroke(33, 150, 243); strokeWeight(2); line(barraX - 5, barraY + barraAltura - limiteChuvaVis, barraX + barraLargura + 5, barraY + barraAltura - limiteChuvaVis);
    stroke(255, 69, 0); line(barraX - 5, barraY + barraAltura - limiteVentoVis, barraX + barraLargura + 5, barraY + barraAltura - limiteVentoVis);
    noStroke();

    fill(0); textSize(12); textAlign(RIGHT, CENTER);
    text("Vento", barraX - 8, barraY + barraAltura - limiteVentoVis);
    text("Chuva", barraX - 8, barraY + barraAltura - limiteChuvaVis);
    textAlign(CENTER, BOTTOM); text("Mic", barraX + barraLargura / 2, barraY - 10);
}

function desenharRodape() {
    fill(0); textSize(12); textAlign(LEFT, BOTTOM); text("Reforestation of a degraded area", 10, height - 10);
    textAlign(RIGHT, BOTTOM); text("Rodrigo Vieira - 33445 - ECGM", width - 10, height - 10);
}

// =========================================================
// NOVO CONTROLO: APENAS TECLADO (REQUISITO 5)
// =========================================================
function keyPressed() {
    if (key !== ' ') return; // Só avança se a tecla for o ESPAÇO

    userStartAudio(); 

    if (estado === 0) {
        inicioCalibracao = millis();
        somaVolume = 0; amostras = 0; estado = 1; 
    } else if (estado === 5) {
        nivelAtual++;
        jogador.reservaAgua = 100;
        inicializarNivel(nivelAtual);
        tempoInicioJogo += millis() - tempoPausaIniciado; // Desconta o tempo em que o jogo esteve parado no menu
        estado = 2;
    } else if (estado === 3 || estado === 4) {
        nivelAtual = 1;
        jogador.reservaAgua = 100;
        jogador.pontuacao = 0;
        jogador.x = 400; jogador.y = 150;
        inicializarNivel(1);
        tempoInicioJogo = millis();
        estado = 2;
        if (somFundo && somFundo.isLoaded() && !somFundo.isPlaying()) somFundo.loop();
    }
}