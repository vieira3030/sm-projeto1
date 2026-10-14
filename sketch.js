// -- Variáveis globais para controlo de ecrãs
let estado = 0; // 0: Início, 1: Calibração, 2: Jogo, 3: Resultado
let fonte;

// -- Variáveis do microfone e calibração de ruído
let mic;
let inicioCalibracao;
let somaVolume = 0;
let amostras = 0;
let limiteChuva = 0; // Definido dinamicamente na calibração
let limiteVento = 0.40; // Valor fixo para detetar um sopro forte
let estadoChuva = false;

// -- Variáveis do jogador (Nuvem) e progresso
let nuvemX = 400;
let nuvemY = 150;
let reservaAgua = 100; // Inicia com 100% de capacidade
let pontuacao = 0;

// -- Zonas de plantação (coordenada X, % crescimento, estado de conclusão)
let buracos = [
    { x: 200, crescimento: 0, completa: false },
    { x: 400, crescimento: 0, completa: false },
    { x: 600, crescimento: 0, completa: false }
];

function setup() {
    createCanvas(800, 500);
    // -- Inicializa o microfone
    mic = new p5.AudioIn();
    mic.start();
}

function draw() {
    background(135, 206, 235); // Fundo azul céu

    // -- Máquina de estados para alternar entre os ecrãs da aplicação
    if (estado === 0) {
        ecraInicio();
    } else if (estado === 1) {
        ecraCalibracao();
    } else if (estado === 2) {
        ecraJogo();
    } else if (estado === 3) {
        ecraResultado();
    }

    desenharRodape(); // Textos obrigatórios visíveis em todos os ecrãs
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

    // -- Regista o volume do ambiente para calcular a média
    let v = mic.getLevel();
    somaVolume += v;
    amostras++;

    // -- Termina calibração após 3 segundos e define o limite da chuva
    if (millis() - inicioCalibracao >= 3000) {
        let ruidoMedio = somaVolume / max(1, amostras);
        limiteChuva = ruidoMedio + 0.08; // Margem para ignorar ruído de fundo
        estado = 2; // Avança para o ecrã de execução do jogo
    }
}

function ecraJogo() {
    desenhaCenario();

    let vol = mic.getLevel();

    // -- Histerese: Deteta sopro forte (Vento) ou som contínuo (Chuva)
    if (vol > limiteVento) {
        fill(255, 0, 0);
        textSize(24);
        textAlign(CENTER);
        text("VENTO ATIVO!", width / 2, 50);
    } else if (!estadoChuva && vol > limiteChuva) {
        estadoChuva = true; // Liga chuva ao passar o limite superior
    } else if (estadoChuva && vol < limiteChuva - 0.02) {
        estadoChuva = false; // Desliga chuva ao cair abaixo do limite inferior
    }

    // -- Consome água e aciona o crescimento das árvores se estiver a chover
    if (estadoChuva && reservaAgua > 0) {
        reservaAgua -= 0.1; // Reduz a barra de água lentamente
        desenhaChuva();
        
        // -- Verifica a colisão visual da chuva com as zonas de plantação
        for (let i = 0; i < buracos.length; i++) {
            // Cresce a árvore se a nuvem estiver alinhada e a árvore não estiver no máximo
            if (abs(nuvemX - buracos[i].x) < 50 && !buracos[i].completa) {
                buracos[i].crescimento += 0.5; 
                
                // Conclui o crescimento e atribui pontos finais
                if (buracos[i].crescimento >= 100) {
                    buracos[i].completa = true;
                    pontuacao += 10;
                }
            }
        }
    }

    // -- Controla o movimento horizontal da nuvem através do teclado
    if (keyIsDown(LEFT_ARROW)) nuvemX -= 5;
    if (keyIsDown(RIGHT_ARROW)) nuvemX += 5;
    
    // -- Impede a nuvem de sair dos limites laterais do ecrã
    nuvemX = constrain(nuvemX, 60, width - 60);

    desenhaNuvem();
    
    // -- Apresenta a pontuação atual no canto superior
    fill(0);
    textSize(20);
    textAlign(LEFT);
    text("Pontuação: " + pontuacao, 20, 30);
}

function ecraResultado() {
    fill(0);
    textAlign(CENTER);
    textSize(32);
    text("FIM DO JOGO", width / 2, height / 2 - 20);
    textSize(18);
    text("Clica para repetir", width / 2, height / 2 + 20);
}

function desenhaCenario() {
    // -- Desenha o chão de terra
    noStroke();
    fill(139, 69, 19); 
    rect(0, height - 100, width, 100);

    // -- Desenha as covas e as árvores em crescimento
    for (let i = 0; i < buracos.length; i++) {
        let bx = buracos[i].x;
        let by = height - 50;

        // -- Cova na terra
        fill(92, 58, 33); 
        ellipse(bx, by, 90, 30);
        
        // -- Árvore visível apenas se já tiver começado a germinar
        if (buracos[i].crescimento > 0) {
            // Mapeia o valor de crescimento (0 a 100) para pixels visuais
            let altura = map(buracos[i].crescimento, 0, 100, 0, 40);
            let tamanhoFolhas = map(buracos[i].crescimento, 0, 100, 0, 40);
            
            // Tronco
            stroke(101, 67, 33);
            strokeWeight(4);
            line(bx, by, bx, by - altura);
            noStroke();
            
            // Folhagem
            fill(34, 139, 34);
            circle(bx, by - altura, tamanhoFolhas);
        }
    }
}

function desenhaNuvem() {
    // -- Escurece a cor da nuvem consoante a quantidade de água disponível
    let corNuvem = map(reservaAgua, 0, 100, 255, 100);
    fill(corNuvem);
    noStroke();
    
    // -- Corpo principal da nuvem
    ellipse(nuvemX, nuvemY, 100, 40);
    ellipse(nuvemX - 25, nuvemY - 15, 60, 60);
    ellipse(nuvemX + 25, nuvemY - 15, 60, 60);

    // -- Olhos e sorriso (Expressão da nuvem)
    fill(0);
    ellipse(nuvemX - 15, nuvemY - 5, 6, 6); 
    ellipse(nuvemX + 15, nuvemY - 5, 6, 6); 
    noFill();
    stroke(0);
    strokeWeight(2);
    arc(nuvemX, nuvemY + 5, 20, 10, 0, PI); 
    noStroke();
    
    // -- Indicador textual da percentagem da reserva de água
    fill(0);
    textSize(14);
    textAlign(CENTER);
    text(floor(reservaAgua) + "%", nuvemX, nuvemY - 45);
}

function desenhaChuva() {
    // -- Gera gotas de chuva azuis em posições aleatórias debaixo da nuvem
    stroke(33, 150, 243); 
    strokeWeight(2);
    for(let i = 0; i < 6; i++) {
        let gotaX = nuvemX + random(-40, 40);
        let gotaY = nuvemY + random(20, 150);
        line(gotaX, gotaY, gotaX, gotaY + 15);
    }
    noStroke();
}

function desenharRodape() {
    // -- Informações exigidas no enunciado do projeto
    fill(0);
    textSize(12);
    textAlign(LEFT, BOTTOM);
    text("Reforestation of a degraded area", 10, height - 10);
    
    textAlign(RIGHT, BOTTOM);
    text("Rodrigo Vieira - 33445 - ECGM", width - 10, height - 10);
}

function mousePressed() {
    // -- Obrigatório para o navegador autorizar a captura de áudio
    userStartAudio(); 

    if (estado === 0) {
        // Reinicia as variáveis antes de começar a calibração
        inicioCalibracao = millis();
        somaVolume = 0;
        amostras = 0;
        estado = 1; 
    } else if (estado === 3) {
        // Reinicia todos os valores para começar um novo jogo
        reservaAgua = 100;
        pontuacao = 0;
        for (let i = 0; i < buracos.length; i++) {
            buracos[i].crescimento = 0;
            buracos[i].completa = false;
        }
        estado = 0;
    }
}