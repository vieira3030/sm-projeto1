🌧️ A Nuvem Semeadeira

Projeto prático desenvolvido para a UC de Sistemas Multimédia (2026/2027)

Curso: Engenharia da Computação Gráfica e Multimédia (ECGM) - IPVC / ESTG

Autor: Rodrigo Vieira (33445)

Tema ONU: Reforestation of a degraded area (Sustentabilidade e Ambiente)

📖 Sobre o Jogo

"A Nuvem Semeadeira" é um jogo interativo desenvolvido em p5.js. O objetivo principal do jogador é assumir o papel de uma nuvem mágica responsável por reflorestar um terreno árido e degradado. Para ter sucesso, o jogador terá de gerir cuidadosamente a sua reserva de água, desviar-se de perigos atmosféricos e utilizar a própria voz para interagir com o mundo.

O jogo apresenta dificuldade progressiva (3 níveis), alteração dinâmica do ambiente visual e mecânicas de controlo híbridas (Teclado + Microfone).

🎮 Como Jogar (Controlos)

O jogo utiliza uma combinação de movimento físico e comandos de áudio:

Movimento: Usa as Setas do Teclado (⬅️ ⬆️ ⬇️ ➡️) para mover a nuvem pelo céu.

Fazer Chover: Faz um ruído contínuo e moderado no microfone (ex: fazer "Shhhh", assobiar suavemente ou falar). A chuva faz crescer as árvores, mas consome a tua reserva de água.

Sopro de Vento (Defesa): Faz um ruído alto ou sopra forte diretamente para o microfone. Isto ativa uma força de repulsão que afasta os inimigos em todas as direções!

⚙️ Mecânicas e Regras

Plantação: Posiciona a nuvem sobre as covas de terra escuras e faz chover até a árvore crescer a 100%. Quando todas as covas do nível estiverem germinadas, passas de nível.

Gestão de Água: A tua nuvem tem uma barra de água. Chover gasta a reserva. Se a água chegar a 0%, é Game Over!

Recarga: Apanha as gotas de água azuis que caem do céu para recuperares +20% de água.

Inimigos: Pássaros e Nuvens Tóxicas vão tentar atravessar o ecrã. Se colidirem contigo, perdes pontuação e água. Usa o Sopro de Vento para os empurrar para longe.

🚀 Como Executar o Jogo

Para jogares localmente no teu computador:

Faz o download ou clona este repositório.

Abre o ficheiro index.html num browser moderno (recomenda-se Google Chrome, Firefox ou Edge). Dica: Se estiveres a usar o VS Code, podes usar a extensão "Live Server".

Clica no ecrã de início para arrancar.

IMPORTANTE: O browser vai pedir permissão para usar o Microfone. Deves aceitar para conseguir jogar.

Fica em silêncio durante 3 segundos no ecrã de calibração para que o jogo se adapte ao ruído de fundo do local onde estás.

🛠️ Tecnologias Utilizadas

HTML5 / CSS3

JavaScript (ES6)

p5.js (Renderização 2D e interatividade)

p5.sound (Captação do microfone e reprodução de efeitos sonoros)
