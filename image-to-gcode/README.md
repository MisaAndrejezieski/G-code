# Image to G-Code Professional Converter

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

Conversor profissional de imagens para G-Code CNC com simulador integrado. Transforme qualquer imagem em trajetórias de corte para máquinas CNC.

## 🚀 Características

- **Upload intuitivo**: Arraste e solte ou selecione arquivos
- **Pré-visualização em tempo real**: Veja a imagem antes de processar
- **Parâmetros ajustáveis**: Controle total sobre profundidade, velocidade e resolução
- **Simulador 2D/3D**: Visualize o caminho da ferramenta antes de enviar para a máquina
- **Exportação multi-formato**: .nc, .tap, .txt
- **Otimização de caminho**: Algoritmo para minimizar o tempo de usinagem
- **Tema claro/escuro**: Interface adaptável
- **Responsivo**: Funciona em desktop, tablet e mobile

## 📋 Pré-requisitos

- Node.js 14.x ou superior
- Navegador moderno (Chrome, Firefox, Edge, Safari)

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/image-to-gcode.git
cd image-to-gcode
Instale as dependências:

bash
npm install
Inicie o servidor de desenvolvimento:

bash
npm start
Acesse http://localhost:3000 no seu navegador

📖 Como usar
1. Upload da imagem
Arraste uma imagem para a área demarcada ou clique para selecionar

Formatos suportados: PNG, JPG, JPEG, BMP, GIF (máx. 10MB)

2. Configurar parâmetros
Profundidade de corte: Valor negativo para baixo (ex: -1.0mm)

Velocidades: Avanço e penetração em mm/min

Resolução: Distância entre linhas (menor = mais detalhe)

Limiar: Sensibilidade do corte (0-255)

Escala: Dimensões finais da peça em mm

3. Gerar G-Code
Clique em "Gerar G-Code" para processar

O código será exibido no painel direito

4. Simular
Use o botão "Simular" para visualizar o caminho

Controles de zoom e pan para inspeção detalhada

5. Exportar
Copie para área de transferência

Faça download no formato desejado

⚙️ Parâmetros detalhados
Parâmetro	Descrição	Faixa típica
Profundidade de corte	Profundidade Z durante o corte	-10 a 0 mm
Velocidade de avanço	Velocidade de corte em XY	500-3000 mm/min
Velocidade de penetração	Velocidade de descida em Z	100-1000 mm/min
Altura de segurança	Altura para movimentos rápidos	2-20 mm
Altura de recuo	Altura entre passes	1-5 mm
Resolução	Distância entre linhas	0.1-5 mm
Limiar	Sensibilidade do corte	0-255
🏗️ Estrutura do projeto
text
image-to-gcode/
├── src/                    # Código fonte
│   ├── index.html          # Página principal
│   ├── css/                # Estilos
│   │   └── style.css       # CSS principal
│   ├── js/                 # JavaScript
│   │   ├── main.js         # Ponto de entrada
│   │   ├── image-processor.js  # Processamento de imagem
│   │   ├── gcode-generator.js  # Geração de G-Code
│   │   └── simulator.js    # Simulador
│   └── assets/             # Recursos estáticos