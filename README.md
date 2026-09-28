# ⚡ Auto Clicker Pro (Electron + Native C# Backend)

Um aplicativo desktop de alta performance para **Auto Clicker**, agora totalmente atualizado com interface moderna em **Electron** e motor nativo de alta precisão em **C# Win32**, além do suporte à versão original em Python.

---

## 🚀 Como Instalar e Rodar na sua Máquina

### 📦 Opção 1: Usando o Instalador Windows (Recomendado)
Após o empacotamento, você encontrará os executáveis prontos dentro da pasta `dist/`:

1. **Instalador Completo com Atalho na Área de Trabalho**:
   - Execute o arquivo: `dist/Auto Clicker Pro Setup 2.0.0.exe`
   - O assistente instalará o aplicativo no seu Windows e criará os atalhos no Menu Iniciar e na Área de Trabalho.
2. **Versão Portátil (Sem Instalação)**:
   - Execute diretamente: `dist/Auto Clicker Pro 2.0.0.exe`

---

### 💻 Opção 2: Rodando no Modo Desenvolvedor (Electron)

Se preferir rodar direto pelo terminal com Node.js:

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Compile o motor nativo (caso faça alterações no código C#):
   ```bash
   npm run compile:backend
   ```
3. Inicie o aplicativo:
   ```bash
   npm start
   ```

---

### 🔨 Como Gerar o Instalador Novamente
Para gerar um novo instalador e executável portátil a qualquer momento:
```bash
npm run dist
```
Os arquivos gerados serão salvos na pasta `dist/`:
- `Auto Clicker Pro Setup 2.0.0.exe` (Instalador NSIS)
- `Auto Clicker Pro 2.0.0.exe` (Executável Portátil Standalone)

---

## 🎮 Recursos e Funcionalidades

### ⚡ Motor Nativo de Alta Precisão (1ms)
- Suporta frequências extremas de **100+ cliques por segundo (CPS)** sem atraso ou travamentos.
- Utiliza a API Win32 `timeBeginPeriod(1)` para resolução precisa de milissegundos.

### ⏱️ Presets Rápidos e Intervalo Customizável
- **10ms**: 100 CPS (Modo Gamer Extremo)
- **50ms**: 20 CPS (Ultra Rápido)
- **100ms**: 10 CPS (Rápido)
- **500ms**: 2 CPS (Padrão Seguro)
- **1000ms**: 1 CPS (Lento)
- Suporte a entrada manual em **Milissegundos (ms)** ou **Segundos (s)**.

### 🖱️ Botões e Modos de Clique
- Botão do mouse: **Esquerdo**, **Direito** ou **Central (Scroll)**.
- Tipo de clique: **Clique Único** ou **Clique Duplo**.
- Modo de repetição: **Infinito** (até parar) ou **Limite de Cliques** (parar após N cliques).

### ↔️ Movimento Lateral Anti-Detecção / Anti-AFK
- Ative o switch de movimento lateral para que o mouse oscile suavemente entre a esquerda e a direita (1 a 25 pixels).
- Ideal para evitar detecção de cliques estáticos e inatividade em jogos e ferramentas.

### 🎯 Localização do Clique
- **Posição Atual do Cursor**: clica onde o mouse estiver apontando.
- **Coordenadas Fixas (X, Y)**: defina coordenadas exatas na tela com botão para capturar a posição atual do ponteiro.

### ⌨️ Atalho Global Customizável
- Tecla padrão: **F8** (funciona mesmo em tela cheia de jogos ou janelas em segundo plano).
- Opções de seleção: **F8**, **F6**, **F7**, **F9**, **F10**, **F12**.

### 🚨 Sistema de Emergência (Fail-Safe)
- Para parar imediatamente em qualquer emergência, **arraste o mouse rapidamente para o canto superior esquerdo da tela (0,0)**.
- O clique é interrompido no mesmo instante e um alerta visual/sonoro é acionado.

### 📌 Janela Flutuante (Always on Top)
- Clique no botão de alfinete (Pin) no canto superior direito da barra de título para manter a janela sempre visível por cima de jogos e outros programas.

---

## 🐍 Versão Clássica em Python
A versão legada construída em Python CustomTkinter continua disponível no projeto:
```bash
pip install -r requirements.txt
python app.py
```
