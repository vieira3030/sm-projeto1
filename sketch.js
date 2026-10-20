// -- MÁQUINA DE ESTADOS E NÍVEIS
let estado = 0; // 0: Início, 1: Calibração, 2: Jogo, 3: Vitória, 4: Game Over, 5: Transição
let nivelAtual = 1; 

// -- GESTÃO DE TEMPO
let tempoInicioJogo = 0;
let tempoDecorridoSegundos = 0;

// -- MICROFONE E HISTERESE (CONTROLO DE ÁUDIO)
let mic;
let inicioCalibracao;
let somaVolume = 0;
let amostras = 0;
let limiteChuva = 0; // Calculado dinamicamente na calibração
let limiteVento = 0.40; // Valor fixo para detetar sopro forte
let estadoChuva = false;
let estadoVento = false;

// -- JOGADOR (NUVEM) E PROGRESSO
let nuvemX = 400;
let nuvemY = 150;
let reservaAgua = 100; // Percentagem de água disponível (0 a 100)
let pontuacao = 0;

// -- ARRAYS DE ENTIDADES DINÂMICAS
let buracos = [];
let obstaculos = [];
let gotasAgua = []; 
let tempoUltimoObstaculo = 0;
let tempoUltimaGota = 0;

// -- FICHEIROS DE ÁUDIO MULTIMÉDIA
let somGota, somArvore, somDano, somNivel, somFim, somVitoria, somFundo;

// Carrega os recursos para a memória antes do jogo arrancar
function preload() {
    somGota = loadSound('sons/gota.mp3');
    somArvore = loadSound('sons/arvore.mp3');
    somDano = loadSound('sons/dano.mp3');
    somNivel = loadSound('sons/nivel.mp3');
    somFim = loadSound('sons/fim.mp3');         
    somVitoria = loadSound('sons/vitoria.mp3'); 
    somFundo = loadSound('sons/fundo.mp3');     
}

function setup() {
    createCanvas(800, 500);
    
    // Inicia a escuta do microfone
    mic = new p5.AudioIn();
    mic.start();
    
    inicializarNivel(1);
    
    // Volume ambiente mais baixo para não criar loop de feedback no microfone
    if (somFundo) somFundo.setVolume(0.3);
}

// O draw corre 60 vezes por segundo, gerindo qual ecrã está visível
function draw() {
    // -- Muda a cor do céu dinâmica consoante o nível atual
    if (nivelAtual === 1) {
        background(135, 206, 235); // Nível 1: Azul céu / Dia
    } else if (nivelAtual === 2) {
        background(253, 140, 80);  // Nível 2: Alaranjado / Pôr do sol
    } else {
        background(80, 90, 110);   // Nível 3: Escuro / Tempestade
    }

    if (estado === 0) {
        ecraInicio();
    } else if (estado === 1) {
        ecraCalibracao();
    } else if (estado === 2) {
        ecraJogo();
    } else if (estado === 3) {
        ecraVitoria();
    } else if (estado === 4) {
        ecraGameOver();
    } else if (estado === 5) {
        ecraNivelConcluido();
    }

    desenharRodape(); // Mantém o nome e tema sempre visíveis
}

// Configura a quantidade e posição das covas consoante o nível
function inicializarNivel(nivel) {
    buracos = [];
    obstaculos = [];
    gotasAgua = [];
    
    // Nível 1 = 3 covas, Nível 2 = 5 covas, Nível 3 = 7 covas
    let numBuracos = 3 + (nivel - 1) * 2; 
    let espacamento = width / (numBuracos + 1);

    // Distribui as covas uniformemente pelo eixo X
    for (let i = 1; i <= numBuracos; i++) {
        buracos.push({
            x: i * espacamento,
            crescimento: 0,
            completa: false
        });
    }
}

// -- ECRÃ 0: INÍCIO
function ecraInicio() {
    fill(255);
    textAlign(CENTER);
    textSize(32);
    text("A NUVEM SEMEADEIRA", width / 2, height / 2 - 20);
    textSize(18);
    text("Clica para iniciar a calibração do microfone", width / 2, height / 2 + 20);
}

// -- ECRÃ 1: CALIBRAÇÃO (Define o ruído de fundo do ambiente)
function ecraCalibracao() {
    fill(0);
    textAlign(CENTER);
    textSize(20);
    text("A calibrar o microfone...", width / 2, height / 2 - 20);
    text("Por favor, mantém o silêncio durante 3 segundos.", width / 2, height / 2 + 20);

    // Recolhe amostras de volume para calcular a média do ruído local
    let v = mic.getLevel();
    somaVolume += v;
    amostras++;

    if (millis() - inicioCalibracao >= 3000) {
        let ruidoMedio = somaVolume / max(1, amostras);
        limiteChuva = ruidoMedio + 0.08; // Aplica margem de segurança
        tempoInicioJogo = millis(); 
        estado = 2; 
        
        // Inicia a banda sonora
        if (somFundo && somFundo.isLoaded() && !somFundo.isPlaying()) {
            somFundo.loop();
        }
    }
}

// -- ECRÃ 2: MOTOR DE JOGO PRINCIPAL
function ecraJogo() {
    desenhaCenario();

    // Converte os milissegundos em segundos inteiros
    tempoDecorridoSegundos = floor((millis() - tempoInicioJogo) / 1000);

    let vol = mic.getLevel();

    // Lógica de Histerese: Evita flutuações rápidas ativando/desativando estados com margens diferentes
    if (vol > limiteVento) {
        estadoVento = true;
        estadoChuva = false;
    } else if (!estadoChuva && vol > limiteChuva) {
        estadoChuva = true;
        estadoVento = false;
    } else if (estadoChuva && vol < limiteChuva - 0.02) {
        estadoChuva = false;
        estadoVento = false;
    } else {
        estadoVento = false;
    }

    // Se a chuva está ativa, gasta água e tenta germinar as árvores
    if (estadoChuva && reservaAgua > 0) {
        reservaAgua -= 0.12;
        desenhaChuva();
        
        // Ajusta a largura de deteção consoante a quantidade de buracos
        let raioAlcance = map(buracos.length, 3, 7, 45, 25);
        for (let i = 0; i < buracos.length; i++) {
            // Verifica se a nuvem está alinhada verticalmente com a cova
            if (abs(nuvemX - buracos[i].x) < raioAlcance && !buracos[i].completa) {
                buracos[i].crescimento += 0.5;
                
                // Conclui o crescimento e premeia o jogador
                if (buracos[i].crescimento >= 100) {
                    buracos[i].completa = true;
                    pontuacao += 10;
                    if (somArvore && somArvore.isLoaded()) somArvore.play();
                }
            }
        }
    }

    // Condição de Derrota
    if (reservaAgua <= 0 && estado === 2) {
        estado = 4;
        if (somFundo && somFundo.isPlaying()) somFundo.stop(); 
        if (somFim && somFim.isLoaded()) somFim.play(); 
    }

    // Leitura do teclado para movimento (setas direcionais)
    if (keyIsDown(LEFT_ARROW)) nuvemX -= 5;
    if (keyIsDown(RIGHT_ARROW)) nuvemX += 5;
    if (keyIsDown(UP_ARROW)) nuvemY -= 5;
    if (keyIsDown(DOWN_ARROW)) nuvemY += 5;

    // Impede que a nuvem saia dos limites do ecrã
    nuvemX = constrain(nuvemX, 60, width - 60);
    nuvemY = constrain(nuvemY, 60, height - 160);

    // Atualiza lógica das entidades em movimento
    gerarObstaculos();
    atualizarObstaculos();
    gerarGotasAgua();
    atualizarGotasAgua();

    verificarProgressoNivel();

    desenhaNuvem();
    desenharHUD();
}

// -- ECRÃS DE TRANSIÇÃO E FINALIZAÇÃO
function ecraNivelConcluido() {
    fill(0, 100, 0);
    textAlign(CENTER);
    textSize(32);
    text("NÍVEL " + nivelAtual + " CONCLUÍDO!", width / 2, height / 2 - 40);
    fill(0);
    textSize(20);
    text("Pontuação Atual: " + pontuacao + " pts", width / 2, height / 2);
    text("Tempo acumulado: " + formatarTempo(tempoDecorridoSegundos), width / 2, height / 2 + 30);
    fill(50);
    textSize(16);
    text("Clica no ecrã para avançar para o Nível " + (nivelAtual + 1), width / 2, height / 2 + 75);
}

function ecraVitoria() {
    fill(0, 128, 0);
    textAlign(CENTER);
    textSize(32);
    text("PARABÉNS! JOGO CONCLUÍDO", width / 2, height / 2 - 40);
    fill(0);
    textSize(22);
    text("Pontuação Final: " + pontuacao + " pts", width / 2, height / 2);
    text("Tempo Total: " + formatarTempo(tempoDecorridoSegundos), width / 2, height / 2 + 30);
    textSize(16);
    text("Clica para jogar novamente", width / 2, height / 2 + 75);
}

function ecraGameOver() {
    fill(200, 0, 0);
    textAlign(CENTER);
    textSize(36);
    text("GAME OVER", width / 2, height / 2 - 40);
    fill(0);
    textSize(20);
    text("A tua reserva de água esgotou-se!", width / 2, height / 2);
    text("Tempo de jogo: " + formatarTempo(tempoDecorridoSegundos), width / 2, height / 2 + 30);
    textSize(16);
    text("Clica para tentar novamente", width / 2, height / 2 + 75);
}

// Converte os segundos para o formato visual "MM:SS"
function formatarTempo(segundosTotais) {
    let minutos = floor(segundosTotais / 60);
    let segundos = segundosTotais % 60;
    let minStr = minutos < 10 ? "0" + minutos : minutos;
    let segStr = segundos < 10 ? "0" + segundos : segundos;
    return minStr + ":" + segStr;
}

// -- LÓGICA DAS GOTAS EXTRA (RECARGA DE ÁGUA)
function gerarGotasAgua() {
    if (millis() - tempoUltimaGota > 3500) { // Gera uma gota a cada 3.5 segundos
        gotasAgua.push({
            x: random(50, width - 50),
            y: -10,
            vel: random(1.5, 3)
        });
        tempoUltimaGota = millis();
    }
}

function atualizarGotasAgua() {
    for (let i = gotasAgua.length - 1; i >= 0; i--) {
        let g = gotasAgua[i];
        g.y += g.vel; // Aplica gravidade

        fill(0, 191, 255);
        noStroke();
        ellipse(g.x, g.y, 14, 20);

        // Verifica colisão da gota com a nuvem (raio de 45px)
        let d = dist(nuvemX, nuvemY, g.x, g.y);
        if (d < 45) {
            reservaAgua = min(100, reservaAgua + 20); // Recarrega água (máx 100%)
            if (somGota && somGota.isLoaded()) somGota.play();
            gotasAgua.splice(i, 1); // Remove a gota após recolha
            continue;
        }

        // Remove a gota se atingir o chão
        if (g.y > height - 100) {
            gotasAgua.splice(i, 1);
        }
    }
}

// -- LÓGICA DOS OBSTÁCULOS E DIFICULDADE
function gerarObstaculos() {
    // Reduz o tempo de respawn consoante o nível (aumenta dificuldade)
    let intervaloRespawn = map(nivelAtual, 1, 3, 3000, 800);

    if (millis() - tempoUltimoObstaculo > intervaloRespawn) {
        // No nível 3 podem aparecer 2 obstáculos em simultâneo
        let qtdObstaculos = (nivelAtual === 3 && random() < 0.4) ? 2 : 1;

        for (let k = 0; k < qtdObstaculos; k++) {
            let tipoObs = random(["passaro", "nuvemToxica"]);
            let velBase = random(2, 3) + (nivelAtual - 1) * 2.2;
            
            // Sorteia o local de origem do obstáculo
            let origens = ["direita", "esquerda", "topo"];
            let origem = random(origens);
            let ox, oy, vx, vy;

            // Define os vetores de velocidade (vx, vy) consoante a origem
            if (origem === "direita") {
                ox = width + 30; oy = random(50, 220); vx = -velBase; vy = random(-0.8, 0.8);
            } else if (origem === "esquerda") {
                ox = -30; oy = random(50, 220); vx = velBase; vy = random(-0.8, 0.8);
            } else {
                ox = random(100, width - 100); oy = -30; vx = random(-1.5, 1.5); vy = velBase;
            }

            obstaculos.push({ x: ox, y: oy, vx: vx, vy: vy, tipo: tipoObs });
        }
        tempoUltimoObstaculo = millis();
    }
}

function atualizarObstaculos() {
    for (let i = obstaculos.length - 1; i >= 0; i--) {
        let obs = obstaculos[i];

        // Se o vento está ativo, afasta o obstáculo radialmente usando trigonometria
        if (estadoVento) {
            let angulo = atan2(obs.y - nuvemY, obs.x - nuvemX);
            obs.x += cos(angulo) * 8;
            obs.y += sin(angulo) * 8;
        } else {
            obs.x += obs.vx;
            obs.y += obs.vy;
        }

        // Diferencia visualmente pássaros e nuvens tóxicas
        if (obs.tipo === "passaro") {
            fill(200, 50, 50);
            triangle(obs.x, obs.y, obs.x + 18, obs.y - 8, obs.x + 18, obs.y + 8);
        } else {
            fill(80, 0, 80);
            ellipse(obs.x, obs.y, 38, 24);
        }

        // Verifica colisão com o jogador e aplica penalizações
        let d = dist(nuvemX, nuvemY, obs.x, obs.y);
        if (d < 45) {
            reservaAgua = max(0, reservaAgua - 15);
            pontuacao = max(0, pontuacao - 5);
            if (somDano && somDano.isLoaded()) somDano.play();
            obstaculos.splice(i, 1);
            continue;
        }

        // Limpeza de memória: remove obstáculos que já saíram do ecrã
        if (obs.x < -60 || obs.x > width + 60 || obs.y < -60 || obs.y > height - 80) {
            obstaculos.splice(i, 1);
        }
    }
}

// Analisa se todas as árvores do nível atual atingiram os 100%
function verificarProgressoNivel() {
    let todasCompletas = buracos.every(b => b.completa);

    if (todasCompletas && estado === 2) {
        if (nivelAtual < 3) {
            estado = 5; // Pausa no ecrã de transição
            if (somNivel && somNivel.isLoaded()) somNivel.play();
        } else {
            estado = 3; // Vitória Final
            if (somFundo && somFundo.isPlaying()) somFundo.stop(); 
            if (somVitoria && somVitoria.isLoaded()) somVitoria.play(); 
        }
    }
}

// -- DESENHO VISUAL DO CENÁRIO E INTERFACE
function desenhaCenario() {
    noStroke();
    fill(139, 69, 19); 
    rect(0, height - 100, width, 100); // Chão de terra

    // A largura da cova encolhe se houver mais buracos no nível
    let larguraBuraco = map(buracos.length, 3, 7, 80, 45);

    for (let i = 0; i < buracos.length; i++) {
        let bx = buracos[i].x;
        let by = height - 50;

        fill(92, 58, 33); 
        ellipse(bx, by, larguraBuraco, 25); // Cova escura
        
        // Desenha a árvore de forma proporcional ao seu crescimento
        if (buracos[i].crescimento > 0) {
            let altura = map(buracos[i].crescimento, 0, 100, 0, 35);
            let tamanhoFolhas = map(buracos[i].crescimento, 0, 100, 0, 35);
            
            stroke(101, 67, 33);
            strokeWeight(4);
            line(bx, by, bx, by - altura); // Tronco
            noStroke();
            
            fill(34, 139, 34);
            circle(bx, by - altura, tamanhoFolhas); // Folhagem
        }
    }
}

function desenhaNuvem() {
    // Escurece a nuvem consoante a falta de água
    let corNuvem = map(reservaAgua, 0, 100, 255, 100);
    fill(corNuvem);
    noStroke();
    
    // Geometria base da nuvem
    ellipse(nuvemX, nuvemY, 100, 40);
    ellipse(nuvemX - 25, nuvemY - 15, 60, 60);
    ellipse(nuvemX + 25, nuvemY - 15, 60, 60);

    // Expressão facial
    fill(0);
    ellipse(nuvemX - 15, nuvemY - 5, 6, 6); 
    ellipse(nuvemX + 15, nuvemY - 5, 6, 6); 
    noFill();
    stroke(0);
    strokeWeight(2);
    arc(nuvemX, nuvemY + 5, 20, 10, 0, PI); 
    noStroke();
    
    // Indicador numérico de água
    fill(0);
    textSize(14);
    textAlign(CENTER);
    text(floor(reservaAgua) + "%", nuvemX, nuvemY - 45);
}

function desenhaChuva() {
    stroke(33, 150, 243); 
    strokeWeight(2);
    // Gera 6 traços visuais para simular as gotas de chuva
    for(let i = 0; i < 6; i++) {
        let gotaX = nuvemX + random(-40, 40);
        let gotaY = nuvemY + random(20, 150);
        line(gotaX, gotaY, gotaX, gotaY + 15);
    }
    noStroke();
}

function desenharHUD() {
    fill(0);
    textSize(18);
    textAlign(LEFT);
    text("Pontuação: " + pontuacao, 20, 30);
    text("Nível: " + nivelAtual + " / 3", 20, 55);
    text("Tempo: " + formatarTempo(tempoDecorridoSegundos), 20, 80);

    // Alerta visual quando o jogador está a soprar
    if (estadoVento) {
        fill(255, 69, 0);
        textSize(20);
        textAlign(CENTER);
        text("SOPRO DE VENTO ATIVO!", width / 2, 40);
    }
}

function desenharRodape() {
    fill(0);
    textSize(12);
    textAlign(LEFT, BOTTOM);
    text("Reforestation of a degraded area", 10, height - 10);
    textAlign(RIGHT, BOTTOM);
    text("Rodrigo Vieira - 33445 - ECGM", width - 10, height - 10);
}

// -- GESTÃO DE CLIQUES E FLUXO DE ECRÃS
function mousePressed() {
    // Obrigatório nos browsers modernos para iniciar a placa de som
    userStartAudio(); 

    // Arranque inicial
    if (estado === 0) {
        inicioCalibracao = millis();
        somaVolume = 0;
        amostras = 0;
        estado = 1; 
    
    // Avançar de nível a partir do ecrã de transição
    } else if (estado === 5) {
        nivelAtual++;
        reservaAgua = 100;
        inicializarNivel(nivelAtual);
        estado = 2;
    
    // Recomeçar um jogo totalmente novo após Game Over ou Vitória
    } else if (estado === 3 || estado === 4) {
        nivelAtual = 1;
        reservaAgua = 100;
        pontuacao = 0;
        nuvemX = 400;
        nuvemY = 150;
        inicializarNivel(1);
        tempoInicioJogo = millis();
        estado = 2;
        
        if (somFundo && somFundo.isLoaded() && !somFundo.isPlaying()) {
            somFundo.loop();
        }
    }
}