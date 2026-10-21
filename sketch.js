// =========================================================
// VARIÁVEIS GLOBAIS E CONFIGURAÇÕES
// =========================================================

// -- MÁQUINA DE ESTADOS E NÍVEIS
let estado = 0; // 0: Início, 1: Calibração, 2: Jogo, 3: Vitória, 4: Game Over, 5: Transição
let nivelAtual = 1; 

// -- GESTÃO DE TEMPO E CRONÓMETRO
let tempoInicioJogo = 0;
let tempoDecorridoSegundos = 0;
let tempoPausaIniciado = 0; // Regista o momento exato em que o jogo entra em pausa

// -- MICROFONE E HISTERESE (CONTROLO DE ÁUDIO)
let mic;
let inicioCalibracao;
let somaVolume = 0;
let amostras = 0;
let limiteChuva = 0; // Calculado no ecrã de calibração
let limiteVentoOn = 0.40;  // Volume necessário para ativar o vento
let limiteVentoOff = 0.34; // Volume necessário para desativar o vento (evita intermitência)
let estadoChuva = false;
let estadoVento = false;

// -- ENTIDADES DO JOGO (POO)
let jogador;
let buracos = [];
let obstaculos = [];
let gotasAgua = []; 
let tempoUltimoObstaculo = 0;
let tempoUltimaGota = 0;

// -- RECURSOS MULTIMÉDIA (ÁUDIO E IMAGENS)
let somGota, somArvore, somDano, somNivel, somFim, somVitoria, somFundo;
let imgNuvem, imgPassaro, imgMeteoro, imgGota;

// =========================================================
// FUNÇÕES NATIVAS DO P5.JS
// =========================================================

// Carrega todos os recursos multimédia para a memória antes de o jogo arrancar
function preload() {
    somGota = loadSound('sons/gota.mp3');
    somArvore = loadSound('sons/arvore.mp3');
    somDano = loadSound('sons/dano.mp3');
    somNivel = loadSound('sons/nivel.mp3');
    somFim = loadSound('sons/fim.mp3');         
    somVitoria = loadSound('sons/vitoria.mp3'); 
    somFundo = loadSound('sons/fundo.mp3');     

    // Carrega imagens com funções de erro vazias para ativar o fallback geométrico se falharem
    imgNuvem = loadImage('imagens/nuvem.png', () => {}, () => {});
    imgPassaro = loadImage('imagens/passaro.png', () => {}, () => {});
    imgMeteoro = loadImage('imagens/meteoro.png', () => {}, () => {});
    imgGota = loadImage('imagens/gota_agua.png', () => {}, () => {});
}

// Inicializa o canvas, o microfone, as configurações de texto e a primeira instância do jogador
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

// Ciclo principal do jogo (corre 60 frames por segundo). Roteia a lógica consoante a variável 'estado'
function draw() {
    // Fundo dinâmico conforme o nível (Dia, Pôr do sol, Tempestade)
    if (nivelAtual === 1) background(135, 206, 235);
    else if (nivelAtual === 2) background(253, 140, 80);
    else background(80, 90, 110);

    // Máquina de estados
    if (estado === 0) ecraInicio();
    else if (estado === 1) ecraCalibracao();
    else if (estado === 2) ecraJogo();
    else if (estado === 3) ecraVitoria();
    else if (estado === 4) ecraGameOver();
    else if (estado === 5) ecraNivelConcluido();

    desenharRodape(); 
}

// =========================================================
// CLASSES (PROGRAMAÇÃO ORIENTADA A OBJETOS)
// =========================================================

// Entidade controlada pelo jogador. Gere posição, barra de água e pontuação
class Nuvem {
    constructor() {
        this.x = 400;
        this.y = 150;
        this.reservaAgua = 100;
        this.pontuacao = 0;
    }

    // Processa o input das setas direcionais e restringe o movimento aos limites do canvas
    mover() {
        if (keyIsDown(LEFT_ARROW)) this.x -= 5;
        if (keyIsDown(RIGHT_ARROW)) this.x += 5;
        if (keyIsDown(UP_ARROW)) this.y -= 5;
        if (keyIsDown(DOWN_ARROW)) this.y += 5;
        this.x = constrain(this.x, 60, width - 60);
        this.y = constrain(this.y, 60, height - 160);
    }

    // Desenha o sprite da nuvem (ou formas geométricas em fallback) e a barra de água sobreposta
    desenhar() {
        if (imgNuvem && imgNuvem.width > 0) {
            tint(map(this.reservaAgua, 0, 100, 255, 120)); // Escurece a nuvem com a falta de água
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

    // Desenha traços azuis abaixo da nuvem para simular chuva
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

// Representa uma zona de plantação no chão e o crescimento progressivo da árvore
class Buraco {
    constructor(x) {
        this.x = x;
        this.y = height - 50;
        this.crescimento = 0;
        this.completa = false;
    }

    // Desenha a cova de terra e a árvore dimensionada de acordo com o crescimento (0 a 100)
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

// Inimigos gerados dinamicamente (Pássaros ou Meteoros)
class Obstaculo {
    constructor() {
        this.tipo = random(["passaro", "meteoro"]);
        let velBase = random(2, 3) + (nivelAtual - 1) * 2.2;
        let origem = random(["direita", "esquerda", "topo"]);
        
        // Define as coordenadas de spawn e os vetores de velocidade (vx, vy) consoante a origem
        if (origem === "direita") { this.x = width + 30; this.y = random(50, 220); this.vx = -velBase; this.vy = random(-0.8, 0.8); } 
        else if (origem === "esquerda") { this.x = -30; this.y = random(50, 220); this.vx = velBase; this.vy = random(-0.8, 0.8); } 
        else { this.x = random(100, width - 100); this.y = -30; this.vx = random(-1.5, 1.5); this.vy = velBase; }
    }

    // Atualiza a posição aplicando o vetor de deslocamento. Sofre força de repulsão radial se o vento estiver ativo.
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

    // Desenha o sprite do inimigo correspondente (ou fallback geométrico)
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

// Bónus gerados dinamicamente que recarregam a vida (água) do jogador
class GotaAgua {
    constructor() {
        this.x = random(50, width - 50);
        this.y = -10;
        this.vel = random(1.5, 3);
    }

    // Aplica a gravidade para fazer a gota descer
    atualizar() {
        this.y += this.vel;
    }

    // Desenha o sprite da gota
    desenhar() {
        if (imgGota && imgGota.width > 0) {
            imageMode(CENTER); image(imgGota, this.x, this.y, 20, 26);
        } else {
            fill(0, 191, 255); noStroke(); ellipse(this.x, this.y, 14, 20);
        }
    }
}

// =========================================================
// LÓGICA GERAL DE JOGO E GESTORES DE ECRÃ
// =========================================================

// Limpa os arrays de entidades e distribui novas covas de terra proporcionalmente ao nível
function inicializarNivel(nivel) {
    buracos = []; obstaculos = []; gotasAgua = [];
    let numBuracos = 3 + (nivel - 1) * 2; 
    let espacamento = width / (numBuracos + 1);
    for (let i = 1; i <= numBuracos; i++) {
        buracos.push(new Buraco(i * espacamento));
    }
}

// [Estado 0]: Ecrã inicial com menu, controlos, objetivos e dicas com design de caixa sobreposta
function ecraInicio() {
    push();
    fill(0, 0, 0, 120); noStroke(); rectMode(CENTER);
    rect(width / 2, height / 2, 740, 400, 20); 
    
    textAlign(CENTER, CENTER); textSize(38);
    fill(0, 150); text("☁️ A NUVEM SEMEADEIRA ☁️", width/2 + 3, 83); 
    fill(255); text("☁️ A NUVEM SEMEADEIRA ☁️", width/2, 80); 

    textSize(18); fill(150, 255, 150); 
    text("🎯 Objetivo: Faz crescer todas as árvores antes que a água acabe.", width/2, 140);

    fill(255);
    text("🎮 Setas do Teclado: Movem a nuvem", width/2, 190);
    text("🌧️ Som constante (Mic): Faz chover (gasta água)", width/2, 220);
    text("💨 Sopro forte (Mic): Vento que afasta pássaros e meteoros", width/2, 250);
    
    fill(255, 100, 100); 
    text("⚠️ Cuidado: Evita os obstáculos para não perderes água e pontos!", width/2, 290);

    fill(135, 206, 250); 
    text("💧 Gotas azuis: Apanha-as para recarregar a tua reserva", width/2, 320);

    let alphaPiscar = map(sin(millis() / 250), -1, 1, 100, 255);
    fill(255, 215, 0, alphaPiscar); textSize(22);
    text("✨ Prime [ ESPAÇO ] para calibrar o microfone ✨", width/2, 380);
    pop(); 
}

// [Estado 1]: Capta o som ambiente em silêncio durante 3 segundos para traçar um limiar (ruído médio) seguro para a chuva
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

// [Estado 2]: Motor principal do jogo. Integra todas as classes, colisões, controlos e a histerese do áudio
function ecraJogo() {
    desenhaCenario();
    tempoDecorridoSegundos = floor((millis() - tempoInicioJogo) / 1000);
    let vol = mic.getLevel();

    // Lógica de Histerese para separar chuva de vento e evitar intermitência rápida
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

    // Rega e germinação caso a chuva esteja ativa
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

    // Condição de derrota global
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

// Trata do spawn, movimentação cruzada, cálculo de colisões com o jogador e limpeza de arrays para bónus e inimigos
function gerarAtualizarEntidades() {
    // Gestão de Obstáculos
    if (millis() - tempoUltimoObstaculo > map(nivelAtual, 1, 3, 3000, 800)) {
        let qtd = (nivelAtual === 3 && random() < 0.4) ? 2 : 1;
        for (let k = 0; k < qtd; k++) obstaculos.push(new Obstaculo());
        tempoUltimoObstaculo = millis();
    }
    
    // Iteração inversa para permitir a remoção (splice) segura de instâncias em tempo real
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

    // Gestão de Gotas de Água
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

// Desenha a faixa de terra e desencadeia o desenho de cada árvore
function desenhaCenario() {
    noStroke(); fill(139, 69, 19); rect(0, height - 100, width, 100); 
    fill(34, 139, 34); rect(0, height - 100, width, 10); 
    let larguraBuraco = map(buracos.length, 3, 7, 80, 45);
    for (let b of buracos) b.desenhar(larguraBuraco);
}

// Verifica se todas as árvores (buracos) do nível atingiram os 100% de crescimento para avançar estado
function verificarProgressoNivel() {
    if (buracos.every(b => b.completa) && estado === 2) {
        if (nivelAtual < 3) {
            estado = 5; 
            tempoPausaIniciado = millis(); 
            if (somNivel && somNivel.isLoaded()) somNivel.play();
        } else {
            estado = 3; 
            if (somFundo && somFundo.isPlaying()) somFundo.stop(); 
            if (somVitoria && somVitoria.isLoaded()) somVitoria.play(); 
        }
    }
}

// [Estado 5]: Ecrã de transição/pausa entre níveis consecutivos
function ecraNivelConcluido() {
    fill(0, 100, 0); textAlign(CENTER); textSize(32); text("NÍVEL " + nivelAtual + " CONCLUÍDO!", width / 2, height / 2 - 40);
    fill(0); textSize(20); text("Pontuação Atual: " + jogador.pontuacao + " pts", width / 2, height / 2);
    text("Tempo acumulado: " + formatarTempo(tempoDecorridoSegundos), width / 2, height / 2 + 30);
    fill(50); textSize(16); text("Prime ESPAÇO para avançar para o Nível " + (nivelAtual + 1), width / 2, height / 2 + 75);
}

// [Estado 3]: Ecrã final de conclusão total do jogo
function ecraVitoria() {
    fill(0, 128, 0); textAlign(CENTER); textSize(32); text("PARABÉNS! JOGO CONCLUÍDO", width / 2, height / 2 - 40);
    fill(0); textSize(22); text("Pontuação Final: " + jogador.pontuacao + " pts", width / 2, height / 2);
    text("Tempo Total: " + formatarTempo(tempoDecorridoSegundos), width / 2, height / 2 + 30);
    textSize(16); text("Prime ESPAÇO para jogar novamente", width / 2, height / 2 + 75);
}

// [Estado 4]: Ecrã de punição quando a reserva de água chega a zero
function ecraGameOver() {
    fill(200, 0, 0); textAlign(CENTER); textSize(36); text("GAME OVER", width / 2, height / 2 - 40);
    fill(0); textSize(20); text("A tua reserva de água esgotou-se!", width / 2, height / 2);
    text("Tempo de jogo: " + formatarTempo(tempoDecorridoSegundos), width / 2, height / 2 + 30);
    textSize(16); text("Prime ESPAÇO para tentar novamente", width / 2, height / 2 + 75);
}

// Utilitário para formatar segundos puros em formato visual MM:SS
function formatarTempo(sTotais) {
    let min = floor(sTotais / 60); let seg = sTotais % 60;
    return (min < 10 ? "0" + min : min) + ":" + (seg < 10 ? "0" + seg : seg);
}

// Desenha a Interface Visual de Utilizador (Pontos, Nível e Tempo)
function desenharHUD() {
    fill(255, 255, 255, 120); noStroke(); rect(0, 0, width, 45);
    fill(0); textSize(18);
    textAlign(LEFT, CENTER); text("Pontuação: " + jogador.pontuacao, 20, 22);
    textAlign(CENTER, CENTER); text("Nível: " + nivelAtual + " / 3", width / 2, 22);
    textAlign(RIGHT, CENTER); text("Tempo: " + formatarTempo(tempoDecorridoSegundos), width - 20, 22);

    if (estadoVento) { fill(255, 69, 0); textSize(20); textAlign(CENTER, CENTER); text("SOPRO DE VENTO ATIVO!", width / 2, 70); }
    desenharBarraAudio();
}

// Equalizador dinâmico para dar feedback visual instantâneo da sensibilidade captada pelo microfone e os patamares de histerese
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

// Mantém as referências ao nome e à tarefa sempre fixas na borda inferior do ecrã
function desenharRodape() {
    fill(0); textSize(12); textAlign(LEFT, BOTTOM); text("Reforestation of a degraded area", 10, height - 10);
    textAlign(RIGHT, BOTTOM); text("Rodrigo Vieira - 33445 - ECGM", width - 10, height - 10);
}

// =========================================================
// INPUT HARDWARE - INTERAÇÃO UNICAMENTE POR TECLADO
// =========================================================

// Captura toques nas teclas para avançar o fluxo da máquina de estados. Obriga ao uso da barra de espaços para navegar nos menus.
function keyPressed() {
    if (key !== ' ') return; // Só avança se a tecla primida for explicitamente o ESPAÇO

    userStartAudio(); // Desbloqueia o motor de som interno exigido pelos navegadores

    if (estado === 0) {
        inicioCalibracao = millis();
        somaVolume = 0; amostras = 0; estado = 1; 
    } else if (estado === 5) {
        nivelAtual++;
        jogador.reservaAgua = 100;
        inicializarNivel(nivelAtual);
        tempoInicioJogo += millis() - tempoPausaIniciado; // Desconta a totalidade do tempo despendido no menu
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