# 🌧️ A Nuvem Semeadeira

Jogo interativo em **p5.js** controlado pelo **teclado e pela voz**. Tu és uma nuvem e a tua missão é reflorestar um terreno degradado.

**UC:** Sistemas Multimédia (2026/2027) · **Curso:** Engenharia da Computação Gráfica e Multimédia (ECGM), UNIPVC / ESTG
**Autor:** Rodrigo Vieira (n.º 33445)
**Tema ONU:** *Reforestation of a degraded area* (Sustentabilidade e Ambiente)

---

## 📖 Sobre o jogo

Há covas vazias na terra. Se fizeres chover sobre elas, nasce uma árvore. Só que a água é limitada, e pássaros e meteoros querem tirá-la à tua nuvem. Planta todas as árvores de cada nível antes que a reserva acabe.

São **3 níveis**, cada um com mais covas, mais obstáculos e um céu diferente: dia, pôr do sol e tempestade.

## 🎮 Controlos

O jogo só usa **teclado + microfone**. Não precisas de rato.

| Ação | Como fazer |
| --- | --- |
| Mover a nuvem | **Setas** do teclado |
| Fazer chover | Som contínuo e moderado no microfone (por exemplo, "shhhh" ou falar) |
| Soprar vento | Som forte ou sopro direto ao microfone |
| Avançar de ecrã | Tecla **ESPAÇO** |

O medidor **Mic**, à direita, mostra o teu volume e as duas linhas de ativação (**Chuva** e **Vento**). Usa-o para perceberes quanto barulho precisas de fazer.

## ⚙️ Regras

- **Plantar:** põe a nuvem em cima de uma cova e faz chover até a árvore chegar a 100%. Cada árvore completa dá **+10 pontos**.
- **Água:** chover gasta a reserva (barra azul por cima da nuvem). Se chegar a 0%, é **Game Over**.
- **Recarga:** as gotas azuis que caem do céu dão **+20%** de água.
- **Perigos:** pássaros e meteoros tiram **15% de água** e **5 pontos** se te tocarem.
- **Vento:** um sopro forte afasta os obstáculos para longe da nuvem. Enquanto sopras, a chuva fica desligada.
- **Níveis:** o nível 1 tem 3 covas, o 2 tem 5 e o 3 tem 7.

## 🚀 Como executar

1. Faz o download ou clona o repositório.
2. Abre a pasta no **VS Code** e usa a extensão **Live Server** para abrir o `index.html`. Abrir o ficheiro com duplo clique pode bloquear o microfone e o carregamento dos sons e imagens.
3. Aceita a permissão do **microfone** quando o browser pedir. Recomenda-se Chrome, Edge ou Firefox.
4. Carrega em **ESPAÇO** no ecrã de início.
5. Fica **em silêncio durante 3 segundos** na calibração. O jogo mede o ruído do teu espaço e ajusta o limite da chuva a ele.

> Se a nuvem fizer chover sozinha, a sala está muito ruidosa. Recarrega a página e calibra de novo.

## 🧱 Estrutura do código

O código está em `sketch.js` e usa quatro classes, mais um controlador feito de funções.

| Elemento | Responsabilidade |
| --- | --- |
| `Nuvem` | Jogador: movimento pelas setas, barra de água, chuva |
| `Buraco` | Cova de plantação e crescimento da árvore |
| `Obstaculo` | Pássaros e meteoros, com velocidade aleatória, que o vento afasta |
| `GotaAgua` | Gota que cai e recarrega a reserva |
| Controlador | Máquina de estados (Início, Calibração, Jogo, Nível Concluído, Vitória, Game Over), HUD e colisões |
| Áudio | Microfone, calibração e histerese da chuva e do vento |

```
.
├── index.html
├── sketch.js
├── p5/            (p5.js e p5.sound)
├── sons/          (efeitos e música de fundo)
├── imagens/       (sprites PNG)
└── README.md
```

**Histerese:** a chuva liga acima do limite calibrado e só desliga um pouco abaixo dele. O vento liga acima de 0.40 e só desliga abaixo de 0.34. Assim o jogo não pisca quando a voz oscila.

## 🛠️ Tecnologias

- HTML5 e JavaScript (ES6, com classes)
- [p5.js](https://p5js.org/) para o desenho 2D e a interação
- p5.sound para o microfone e a reprodução de som

## 🎨 Créditos

Todo o material não original está identificado aqui e no relatório.

| Material | Origem | Licença |
| --- | --- | --- |
| p5.js e p5.sound | [p5js.org](https://p5js.org/) | LGPL 2.1 |
| Sons (`gota`, `arvore`, `dano`, `nivel`, `fim`, `vitoria`, `fundo`) | _(preencher: site ou autor)_ | _(preencher)_ |
| Imagens (`nuvem`, `passaro`, `meteoro`, `gota_agua`) | _(preencher: site ou autor)_ | _(preencher)_ |

## 🤖 Utilização de IA

Foram usadas ferramentas de IA generativa (Google Gemini e Claude) no desenvolvimento do código e da documentação. O detalhe, com finalidades e decisões do estudante, está no relatório final e no diário de desenvolvimento.
