// -- Variáveis de controlo dos ecrãs
let estado = 0; // 0: Início, 1: Calibração, 2: Jogo, 3: Fim do Jogo
let fonte;

// -- Variáveis do microfone e calibração
let mic;
let inicioCalibracao;
let somaVolume = 0;
let amostras = 0;
let limiteChuva = 0;
let limiteVento = 0.40; 
let estadoChuva = false;

// -- Variáveis da Nuvem (Jogador)
let nuvemX = 400;
let nuvemY = 150;
let reservaAgua = 100; // Começa com 100% de água

function setup() {
    createCanvas(800, 500);
    
    // -- Iniciar o microfone
    mic = new p5.AudioIn();
    mic.start();
}

function draw() {
    background(135, 206, 235); // -- Cor de céu azul

    if (estado === 0) {
        ecraInicio();
    } else if (estado === 1) {
        ecraCalibracao();
    } else if (estado === 2) {
        ecraJogo();
    } else if (estado === 3) {
        ecraResultado();
    }

    desenharRodape();
}

// -- ECRÃ 1: INÍCIO
function ecraInicio() {
    fill(255);
    textAlign(CENTER);
    textSize(32);
    text("A NUVEM SEMEADEIRA", width / 2, height / 2 - 20);
    textSize(18);
    text("Clica para iniciar a calibração do microfone", width / 2, height / 2 + 20);
}

// -- ECRÃ DE CALIBRAÇÃO 
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
        // Aumentei a margem (+0.08) para não detetar chuva com o barulho do PC
        limiteChuva = ruidoMedio + 0.08; 
        estado = 2; 
    }
}

// -- ECRÃ 2: EXECUÇÃO (JOGO)
function ecraJogo() {
    desenhaCenario();

    let vol = mic.getLevel();

    // -- Lógica de Histerese (Chuva e Vento)
    if (vol > limiteVento) {
        fill(255, 0, 0);
        textSize(24);
        textAlign(CENTER);
        text("VENTO ATIVO!", width / 2, 50);
    } else if (!estadoChuva && vol > limiteChuva) {
        estadoChuva = true; 
    } else if (estadoChuva && vol < limiteChuva - 0.02) {
        estadoChuva = false; 
    }

    // -- Gasta água se estiver a chover
    if (estadoChuva && reservaAgua > 0) {
        reservaAgua -= 0.1; // Desce muito mais devagar
        desenhaChuva();
    }

    // -- Movimento da nuvem com o teclado
    if (keyIsDown(LEFT_ARROW)) nuvemX -= 5;
    if (keyIsDown(RIGHT_ARROW)) nuvemX += 5;
    
    // -- Impede a nuvem de sair do ecrã
    nuvemX = constrain(nuvemX, 60, width - 60);

    desenhaNuvem();
}

// -- ECRÃ 3: RESULTADO
function ecraResultado() {
    fill(0);
    textAlign(CENTER);
    textSize(32);
    text("FIM DO JOGO", width / 2, height / 2 - 20);
    textSize(18);
    text("Clica para repetir", width / 2, height / 2 + 20);
}

// -- Função para desenhar a terra e os buracos
function desenhaCenario() {
    // Chão de terra
    noStroke();
    fill(139, 69, 19); 
    rect(0, height - 100, width, 100);

    // Zonas de plantação (Buracos escuros)
    fill(92, 58, 33); 
    ellipse(200, height - 50, 90, 30);
    ellipse(400, height - 50, 90, 30);
    ellipse(600, height - 50, 90, 30);
}

// -- Função para desenhar a nuvem completa
function desenhaNuvem() {
    let corNuvem = map(reservaAgua, 0, 100, 255, 100);
    fill(corNuvem);
    noStroke();
    
    // Forma da nuvem (vários círculos sobrepostos)
    ellipse(nuvemX, nuvemY, 100, 40);
    ellipse(nuvemX - 25, nuvemY - 15, 60, 60);
    ellipse(nuvemX + 25, nuvemY - 15, 60, 60);

    // Rosto
    fill(0);
    ellipse(nuvemX - 15, nuvemY - 5, 6, 6); // Olho esq
    ellipse(nuvemX + 15, nuvemY - 5, 6, 6); // Olho dir
    noFill();
    stroke(0);
    strokeWeight(2);
    arc(nuvemX, nuvemY + 5, 20, 10, 0, PI); // Sorriso
    noStroke();
    
    // Texto da % de água
    fill(0);
    textSize(14);
    textAlign(CENTER);
    text(floor(reservaAgua) + "%", nuvemX, nuvemY - 45);
}

// -- Efeito visual da chuva
function desenhaChuva() {
    stroke(33, 150, 243); // Azul da chuva
    strokeWeight(2);
    for(let i = 0; i < 6; i++) {
        let gotaX = nuvemX + random(-40, 40);
        let gotaY = nuvemY + random(20, 150);
        line(gotaX, gotaY, gotaX, gotaY + 15);
    }
    noStroke();
}

// -- Textos obrigatórios no fundo do ecrã
function desenharRodape() {
    fill(0);
    textSize(12);
    textAlign(LEFT, BOTTOM);
    text("Reforestation of a degraded area", 10, height - 10);
    
    textAlign(RIGHT, BOTTOM);
    text("Rodrigo Vieira - 33445 - ECGM", width - 10, height - 10);
}

// -- Controlo de cliques do rato 
function mousePressed() {
    userStartAudio(); 

    if (estado === 0) {
        inicioCalibracao = millis();
        somaVolume = 0;
        amostras = 0;
        estado = 1; 
    } else if (estado === 3) {
        reservaAgua = 100;
        estado = 0;
    }
}