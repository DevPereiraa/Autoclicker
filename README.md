# Auto Clicker Avançado (CustomTkinter)

Um aplicativo desktop moderno, intuitivo e de alta performance para **Auto Clicker** construído em Python. Utiliza a biblioteca **CustomTkinter** para uma interface com tema escuro elegante, **PyAutoGUI** para simulação de cliques e movimento do mouse, e **Keyboard** para suporte a atalhos de teclado globais.

---

## 📖 Manual de Uso Completo

### 1. Requisitos do Sistema
- **Sistema Operacional**: Windows 10 / 11 (ou Linux / macOS)
- **Python**: Versão 3.8 ou superior instalada.

---

### 2. Instalação das Dependências

As dependências estão listadas no arquivo `requirements.txt`:

```bash
pip install -r requirements.txt
```

*(Dependências: `customtkinter`, `pyautogui`, `keyboard`, `pillow`)*.

---

### 3. Como Executar o Aplicativo

Existem duas formas de executar o aplicativo no Windows:

#### 🟢 Método 1: Execução Padrão (Interface Gráfica)
Abra o terminal (PowerShell ou Prompt de Comando) na pasta do projeto e execute:
```bash
python app.py
```

#### 🛡️ Método 2: Execução como Administrador (Recomendado)
Para que a tecla de atalho **F8** funcione globalmente em segundo plano (enquanto você joga ou utiliza outros programas):

1. Abra o menu Iniciar do Windows e pesquise por **PowerShell** ou **CMD**.
2. Clique com o **botão direito** e selecione **"Executar como Administrador"**.
3. Acesse a pasta do projeto:
   ```powershell
   cd C:\Users\Pichau\Desktop\Autoclicker
   ```
4. Execute o programa:
   ```powershell
   python app.py
   ```

---

### 🎮 Como Usar as Funcionalidades

1. **Intervalo entre Cliques**:
   - Digite o tempo em segundos no campo *"Intervalo entre cliques"*.
   - Aceita valores decimais como `0.1` (100ms), `0.5` (500ms), `2.0` (2s).
   - Se um valor inválido for digitado, o sistema usa o valor padrão seguro de `0.5` segundos.

2. **Botão do Mouse**:
   - Escolha entre **Esquerdo**, **Direito** ou **Central**.

3. **Movimento Lateral do Mouse (Novo 🔥)**:
   - Ative a opção **"Mover mouse (Esquerda ↔ Direita)"**.
   - Escolha a distância do movimento lateral de **1 px** até **10 px** (o valor padrão é **5 px**).
   - A cada clique, o cursor fará uma leve oscilação alternada para a esquerda e para a direita na quantidade de pixels selecionada, evitando a inatividade da tela ou bloqueios por antifraude.

4. **Iniciar / Parar os Cliques**:
   - Pressione a tecla **F8** no teclado a qualquer momento (mesmo minimizado) ou clique no botão **"Iniciar (F8)"**.
   - Para parar, pressione **F8** novamente ou clique em **"Parar (F8)"**.

---

### 🚨 Sistema de Emergência (Fail-Safe)

O aplicativo conta com o recurso **Fail-Safe** ativo do PyAutoGUI:
- Para interromper imediatamente os cliques em caso de emergência, basta **mover rapidamente o cursor do mouse para o canto superior esquerdo da tela**.
- O clique e o movimento serão interrompidos instantaneamente e o status mudará para `INTERROMPIDO (FAIL-SAFE)`.

---

## 🛠️ Tecnologias Utilizadas

- **[CustomTkinter](https://github.com/TomSchimansky/CustomTkinter)**: Interface gráfica moderna e estilizada.
- **[PyAutoGUI](https://pyautogui.readthedocs.io/)**: Automação de eventos do mouse e simulação de movimentos com Fail-Safe.
- **[Keyboard](https://github.com/boppreh/keyboard)**: Captura global da tecla de atalho F8.
- **[Threading](https://docs.python.org/3/library/threading.html)**: Execução assíncrona para manter a GUI fluida.
