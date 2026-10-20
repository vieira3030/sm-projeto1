// -- Variáveis globais para controlo de ecrãs e níveis
let estado = 0; // 0: Início, 1: Calibração, 2: Jogo, 3: Resultado
let nivelAtual = 1; // Níveis 1, 2 e 3

// -- Variáveis do microfone e calibração
let mic;
let inicioCalibracao;
let somaVolume = 0;
let amostras = 0;
let limiteChuva = 0;
let limiteVento = 0.40; // Limite fixo para detetar o sopro do vento
let estadoChuva = false;
let estadoVento = false;

// -- Variáveis da Nuvem (Jogador) e jogo
let nuvemX = 400;
let nuvemY = 150;
let reservaAgua = 100;
let pontuacao = 0;

// -- Estrutura de dados para as 3 zonas de plantação
let buracos = [
    { x: 200, crescimento: 0, completa: false },
    { x: 400, crescimento: 0, completa: false },
    { x: 600, crescimento: 0, completa: false }
];

// -- Array de obstáculos dinâmicos e temporizador
let obstaculos = [];
let tempoUltimoObstaculo = 0;

function setup() {
    createCanvas(800, 500);
    mic = new p5.AudioIn();
    mic.start();
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
        ecraResultado();
    }

    desenharRodape(); // Exibe identificação no rodapé
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
        estado = 2; // Inicia o jogo após calibração
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

    // -- Ação de chover (gasta água e faz crescer árvores)
    if (estadoChuva && reservaAgua > 0) {
        reservaAgua -= 0.1;
        desenhaChuva();
        
        for (let i = 0; i < buracos.length; i++) {
            if (abs(nuvemX - buracos[i].x) < 50 && !buracos[i].completa) {
                buracos[i].crescimento += 0.5;
                if (buracos[i].crescimento >= 100) {
                    buracos[i].completa = true;
                    pontuacao += 10;
                }
            }
        }
    }

    // -- Controlo de movimento lateral com teclado
    if (keyIsDown(LEFT_ARROW)) nuvemX -= 5;
    if (keyIsDown(RIGHT_ARROW)) nuvemX += 5;
    nuvemX = constrain(nuvemX, 60, width - 60);

    // -- Gestão e atualização dos obstáculos aleatórios
    gerarObstaculos();
    atualizarObstaculos();

    // -- Verifica se o nível foi concluído (todas as 3 árvores germinadas)
    verificarProgressoNivel();

    desenhaNuvem();
    desenharHUD();
}

function ecraResultado() {
    fill(0);
    textAlign(CENTER);
    textSize(32);
    text("PARABÉNS! JOGO CONCLUÍDO", width / 2, height / 2 - 30);
    textSize(22);
    text("Pontuação Final: " + pontuacao, width / 2, height / 2 + 10);
    textSize(16);
    text("Clica para jogar novamente", width / 2, height / 2 + 50);
}

// -- Gerador de obstáculos com aleatoriedade baseada no nível atual
function gerarObstaculos() {
    // Frequência de respawn diminui (fica mais difícil) em níveis mais altos
    let intervaloRespawn = map(nivelAtual, 1, 3, 3000, 1200);

    if (millis() - tempoUltimoObstaculo > intervaloRespawn) {
        let tipoObs = random(["passaro", "nuvemToxica"]);
        let velocidadeBase = random(2, 4) + nivelAtual; // Aumenta velocidade por nível

        obstaculos.push({
            x: width + 30,
            y: random(80, 220),
            vel: velocidadeBase,
            tipo: tipoObs
        });

        tempoUltimoObstaculo = millis();
    }
}

// -- Movimento, colisão e resposta ao vento forte
function atualizarObstaculos() {
    for (let i = obstaculos.length - 1; i >= 0; i--) {
        let obs = obstaculos[i];

        // Se o VENTO estiver ativo, empurra o obstáculo para trás com força
        if (estadoVento) {
            obs.x += 8; // Efeito de repulsão do vento
        } else {
            obs.x -= obs.vel; // Movimento normal para a esquerda
        }

        // Desenho dos obstáculos
        if (obs.tipo === "passaro") {
            fill(200, 50, 50);
            triangle(obs.x, obs.y, obs.x + 20, obs.y - 10, obs.x + 20, obs.y + 10); // Desenho simplificado do pássaro
        } else {
            fill(80, 0, 80); // Nuvem tóxica roxa
            ellipse(obs.x, obs.y, 40, 25);
        }

        // Deteção de colisão com a nuvem do jogador
        let d = dist(nuvemX, nuvemY, obs.x, obs.y);
        if (d < 45) {
            reservaAgua = max(0, reservaAgua - 15); // Perde 15% de água
            pontuacao = max(0, pontuacao - 5); // Perde 5 pontos
            obstaculos.splice(i, 1); // Remove o obstáculo após colisão
            continue;
        }

        // Remove obstáculos que saiam do ecrã
        if (obs.x < -40 || obs.x > width + 100) {
            obstaculos.splice(i, 1);
        }
    }
}

// -- Verifica se todas as árvores cresceram para passar de nível
function verificarProgressoNivel() {
    let todasCompletas = buracos.every(b => b.completa);

    if (todasCompletas) {
        if (nivelAtual < 3) {
            nivelAtual++; // Avança de nível
            reservaAgua = 100; // Recarrega a água
            obstaculos = []; // Limpa obstáculos do ecrã
            // Reinicia os buracos para o novo nível
            for (let i = 0; i < buracos.length; i++) {
                buracos[i].crescimento = 0;
                buracos[i].completa = false;
            }
        } else {
            estado = 3; // Fim do jogo / Vitória no nível 3
        }
    }
}

function desenhaCenario() {
    noStroke();
    fill(139, 69, 19); 
    rect(0, height - 100, width, 100);

    for (let i = 0; i < buracos.length; i++) {
        let bx = buracos[i].x;
        let by = height - 50;

        fill(92, 58, 33); 
        ellipse(bx, by, 90, 30);
        
        if (buracos[i].crescimento > 0) {
            let altura = map(buracos[i].crescimento, 0, 100, 0, 40);
            let tamanhoFolhas = map(buracos[i].crescimento, 0, 100, 0, 40);
            
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

// -- Apresenta indicadores de jogo (Interface HUD)
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
    } else if (estado === 3) {
        // Reinício completo de variáveis
        nivelAtual = 1;
        reservaAgua = 100;
        pontuacao = 0;
        obstaculos = [];
        for (let i = 0; i < buracos.length; i++) {
            buracos[i].crescimento = 0;
            buracos[i].completa = false;
        }
        estado = 0;
    }
}