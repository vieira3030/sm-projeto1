// -- Variáveis globais para controlo de ecrãs e níveis
let estado = 0; // 0: Início, 1: Calibração, 2: Jogo, 3: Vitória, 4: Game Over
let nivelAtual = 1; // Nível 1 (3 covas), Nível 2 (5 covas), Nível 3 (7 covas)

// -- Variáveis do microfone e calibração
let mic;
let inicioCalibracao;
let somaVolume = 0;
let amostras = 0;
let limiteChuva = 0;
let limiteVento = 0.40; // Limite fixo para detetar o sopro
let estadoChuva = false;
let estadoVento = false;

// -- Variáveis da Nuvem e Estado do Jogo
let nuvemX = 400;
let nuvemY = 150;
let reservaAgua = 100;
let pontuacao = 0;

// -- Estruturas de dados dinâmicas para buracos, obstáculos e gotas
let buracos = [];
let obstaculos = [];
let gotasAgua = []; // Gotas extras para recarregar a reserva de água
let tempoUltimoObstaculo = 0;
let tempoUltimaGota = 0;

function setup() {
    createCanvas(800, 500);
    // -- Inicializa a captação de áudio do microfone
    mic = new p5.AudioIn();
    mic.start();
    // -- Inicializa a estrutura do nível 1
    inicializarNivel(1);
}

function draw() {
    background(135, 206, 235); // Fundo azul céu

    // -- Máquina de estados
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
    }

    desenharRodape(); // Textos obrigatórios no rodapé
}

// -- Cria dinamicamente o número de zonas de plantação conforme o nível
function inicializarNivel(nivel) {
    buracos = [];
    obstaculos = [];
    gotasAgua = [];
    
    let numBuracos = 3 + (nivel - 1) * 2; // Nível 1: 3, Nível 2: 5, Nível 3: 7
    let espacamento = width / (numBuracos + 1);

    for (let i = 1; i <= numBuracos; i++) {
        buracos.push({
            x: i * espacamento,
            crescimento: 0,
            completa: false
        });
    }
}

function ecraInicio() {
    fill(255);
    textAlign(CENTER);
    textSize(32);
    text("A NUVEM SEMEADEIRA", width / 2, height / 2 - 20);
    textSize(18);
    text("Clica para iniciar a calibração do microfone", width / 2, height / 2 + 20);
}

function ecraCalibracao() {
    fill(0);
    textAlign(CENTER);
    textSize(20);
    text("A calibrar o microfone...", width / 2, height / 2 - 20);
    text("Por favor, mantém o silêncio durante 3 segundos.", width / 2, height / 2 + 20);

    let v = mic.getLevel();
    somaVolume += v;
    amostras++;

    if (millis() - inicioCalibracao >= 3000) {
        let ruidoMedio = somaVolume / max(1, amostras);
        limiteChuva = ruidoMedio + 0.08;
        estado = 2; // Avança para o ecrã de execução do jogo
    }
}

function ecraJogo() {
    desenhaCenario();

    let vol = mic.getLevel();

    // -- Histerese de áudio: Separação entre Chuva e Vento
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

    // -- Ação de chover (consome água e aciona germinação)
    if (estadoChuva && reservaAgua > 0) {
        reservaAgua -= 0.12;
        desenhaChuva();
        
        let raioAlcance = map(buracos.length, 3, 7, 45, 25);
        for (let i = 0; i < buracos.length; i++) {
            if (abs(nuvemX - buracos[i].x) < raioAlcance && !buracos[i].completa) {
                buracos[i].crescimento += 0.5;
                if (buracos[i].crescimento >= 100) {
                    buracos[i].completa = true;
                    pontuacao += 10;
                }
            }
        }
    }

    // -- Game Over caso a reserva de água chegue a zero
    if (reservaAgua <= 0) {
        estado = 4;
    }

    // -- Controlo de movimento omnidirecional via teclado (setas)
    if (keyIsDown(LEFT_ARROW)) nuvemX -= 5;
    if (keyIsDown(RIGHT_ARROW)) nuvemX += 5;
    if (keyIsDown(UP_ARROW)) nuvemY -= 5;
    if (keyIsDown(DOWN_ARROW)) nuvemY += 5;

    nuvemX = constrain(nuvemX, 60, width - 60);
    nuvemY = constrain(nuvemY, 60, height - 160);

    // -- Atualização e gestão de entidades dinâmicas
    gerarObstaculos();
    atualizarObstaculos();
    gerarGotasAgua();
    atualizarGotasAgua();

    verificarProgressoNivel();

    desenhaNuvem();
    desenharHUD();
}

function ecraVitoria() {
    fill(0);
    textAlign(CENTER);
    textSize(32);
    text("PARABÉNS! JOGO CONCLUÍDO", width / 2, height / 2 - 30);
    textSize(22);
    text("Pontuação Final: " + pontuacao, width / 2, height / 2 + 10);
    textSize(16);
    text("Clica para jogar novamente", width / 2, height / 2 + 50);
}

function ecraGameOver() {
    fill(200, 0, 0);
    textAlign(CENTER);
    textSize(36);
    text("GAME OVER", width / 2, height / 2 - 30);
    fill(0);
    textSize(20);
    text("A tua reserva de água esgotou-se!", width / 2, height / 2 + 10);
    textSize(16);
    text("Clica para tentar novamente", width / 2, height / 2 + 50);
}

// -- Gerador de gotas recarregáveis caindo do céu
function gerarGotasAgua() {
    if (millis() - tempoUltimaGota > 3500) {
        gotasAgua.push({
            x: random(50, width - 50),
            y: -10,
            vel: random(1.5, 3)
        });
        tempoUltimaGota = millis();
    }
}

// -- Movimento e deteção de captura das gotas de água
function atualizarGotasAgua() {
    for (let i = gotasAgua.length - 1; i >= 0; i--) {
        let g = gotasAgua[i];
        g.y += g.vel;

        fill(0, 191, 255);
        noStroke();
        ellipse(g.x, g.y, 14, 20);

        let d = dist(nuvemX, nuvemY, g.x, g.y);
        if (d < 45) {
            reservaAgua = min(100, reservaAgua + 20); // Recarrega +20% de água
            gotasAgua.splice(i, 1);
            continue;
        }

        if (g.y > height - 100) {
            gotasAgua.splice(i, 1);
        }
    }
}

// -- Gerador de obstáculos vindo de múltiplas direções (Direita, Esquerda e Topo)
function gerarObstaculos() {
    let intervaloRespawn = map(nivelAtual, 1, 3, 2800, 1000);

    if (millis() - tempoUltimoObstaculo > intervaloRespawn) {
        let tipoObs = random(["passaro", "nuvemToxica"]);
        let velBase = random(2, 3.5) + nivelAtual * 0.5;
        let origens = ["direita", "esquerda", "topo"];
        let origem = random(origens);
        let ox, oy, vx, vy;

        if (origem === "direita") {
            ox = width + 30;
            oy = random(50, 220);
            vx = -velBase;
            vy = random(-0.8, 0.8);
        } else if (origem === "esquerda") {
            ox = -30;
            oy = random(50, 220);
            vx = velBase;
            vy = random(-0.8, 0.8);
        } else { // Origem pelo topo
            ox = random(100, width - 100);
            oy = -30;
            vx = random(-1.5, 1.5);
            vy = velBase;
        }

        obstaculos.push({
            x: ox,
            y: oy,
            vx: vx,
            vy: vy,
            tipo: tipoObs
        });

        tempoUltimoObstaculo = millis();
    }
}

// -- Movimento multidirecional, colisão e repelimento radial por sopro (Vento)
function atualizarObstaculos() {
    for (let i = obstaculos.length - 1; i >= 0; i--) {
        let obs = obstaculos[i];

        // Se o VENTO estiver ativo, empurra os obstáculos para fora em redor da nuvem
        if (estadoVento) {
            let angulo = atan2(obs.y - nuvemY, obs.x - nuvemX);
            obs.x += cos(angulo) * 7;
            obs.y += sin(angulo) * 7;
        } else {
            obs.x += obs.vx;
            obs.y += obs.vy;
        }

        // Desenho visual dos obstáculos
        if (obs.tipo === "passaro") {
            fill(200, 50, 50);
            triangle(obs.x, obs.y, obs.x + 18, obs.y - 8, obs.x + 18, obs.y + 8);
        } else {
            fill(80, 0, 80);
            ellipse(obs.x, obs.y, 38, 24);
        }

        // Deteção de colisão com a nuvem do jogador
        let d = dist(nuvemX, nuvemY, obs.x, obs.y);
        if (d < 45) {
            reservaAgua = max(0, reservaAgua - 15);
            pontuacao = max(0, pontuacao - 5);
            obstaculos.splice(i, 1);
            continue;
        }

        // Remove obstáculos que saiam bastante da área visível do canvas
        if (obs.x < -60 || obs.x > width + 60 || obs.y < -60 || obs.y > height - 80) {
            obstaculos.splice(i, 1);
        }
    }
}

// -- Valida a transição de nível ou a vitória final
function verificarProgressoNivel() {
    let todasCompletas = buracos.every(b => b.completa);

    if (todasCompletas) {
        if (nivelAtual < 3) {
            nivelAtual++;
            reservaAgua = 100;
            inicializarNivel(nivelAtual);
        } else {
            estado = 3; // Ecrã de vitória final
        }
    }
}

function desenhaCenario() {
    noStroke();
    fill(139, 69, 19); 
    rect(0, height - 100, width, 100);

    let larguraBuraco = map(buracos.length, 3, 7, 80, 45);

    for (let i = 0; i < buracos.length; i++) {
        let bx = buracos[i].x;
        let by = height - 50;

        fill(92, 58, 33); 
        ellipse(bx, by, larguraBuraco, 25);
        
        if (buracos[i].crescimento > 0) {
            let altura = map(buracos[i].crescimento, 0, 100, 0, 35);
            let tamanhoFolhas = map(buracos[i].crescimento, 0, 100, 0, 35);
            
            stroke(101, 67, 33);
            strokeWeight(4);
            line(bx, by, bx, by - altura);
            noStroke();
            
            fill(34, 139, 34);
            circle(bx, by - altura, tamanhoFolhas);
        }
    }
}

function desenhaNuvem() {
    let corNuvem = map(reservaAgua, 0, 100, 255, 100);
    fill(corNuvem);
    noStroke();
    
    ellipse(nuvemX, nuvemY, 100, 40);
    ellipse(nuvemX - 25, nuvemY - 15, 60, 60);
    ellipse(nuvemX + 25, nuvemY - 15, 60, 60);

    fill(0);
    ellipse(nuvemX - 15, nuvemY - 5, 6, 6); 
    ellipse(nuvemX + 15, nuvemY - 5, 6, 6); 
    noFill();
    stroke(0);
    strokeWeight(2);
    arc(nuvemX, nuvemY + 5, 20, 10, 0, PI); 
    noStroke();
    
    fill(0);
    textSize(14);
    textAlign(CENTER);
    text(floor(reservaAgua) + "%", nuvemX, nuvemY - 45);
}

function desenhaChuva() {
    stroke(33, 150, 243); 
    strokeWeight(2);
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

function mousePressed() {
    userStartAudio(); 

    if (estado === 0) {
        inicioCalibracao = millis();
        somaVolume = 0;
        amostras = 0;
        estado = 1; 
    } else if (estado === 3 || estado === 4) {
        // Reinício completo do jogo
        nivelAtual = 1;
        reservaAgua = 100;
        pontuacao = 0;
        nuvemX = 400;
        nuvemY = 150;
        inicializarNivel(1);
        estado = 0;
    }
}