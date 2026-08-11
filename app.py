import threading
import time
import sys
import customtkinter as ctk
import pyautogui
import keyboard

# Configuração do PyAutoGUI
pyautogui.FAILSAFE = True  # Mover o cursor para o canto superior esquerdo interrompe a execução

class AutoClickerApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Configurações básicas da janela
        self.title("Auto Clicker Avançado")
        self.geometry("460x680")
        self.resizable(False, False)

        # Tema escuro por padrão
        ctk.set_appearance_mode("Dark")
        ctk.set_default_color_theme("blue")

        # Estado do clicker
        self.is_running = False
        self.click_thread = None
        self.stop_event = threading.Event()

        # Dicionário para mapear opções em português para a biblioteca pyautogui
        self.button_map = {
            "Esquerdo": "left",
            "Direito": "right",
            "Central": "middle"
        }

        # Construção da interface gráfica
        self._build_ui()

        # Registrar atalho global da tecla F8
        self._register_hotkey()

        # Evento de fechamento da janela
        self.protocol("WM_DELETE_WINDOW", self.on_closing)

    def _build_ui(self):
        """Constrói todos os elementos da interface do usuário com CustomTkinter."""

        # Header / Título Principal
        self.title_label = ctk.CTkLabel(
            self,
            text="Auto Clicker",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        self.title_label.pack(pady=(20, 2))

        self.subtitle_label = ctk.CTkLabel(
            self,
            text="Simulador de cliques rápido com movimento customizável",
            font=ctk.CTkFont(size=12),
            text_color="#95A5A6"
        )
        self.subtitle_label.pack(pady=(0, 12))

        # Card de Configurações
        self.config_frame = ctk.CTkFrame(self, corner_radius=12)
        self.config_frame.pack(padx=25, pady=5, fill="x")

        # Campo: Intervalo entre cliques
        self.interval_label = ctk.CTkLabel(
            self.config_frame,
            text="Intervalo entre cliques (segundos):",
            font=ctk.CTkFont(size=14, weight="bold")
        )
        self.interval_label.pack(anchor="w", padx=20, pady=(12, 3))

        self.interval_entry = ctk.CTkEntry(
            self.config_frame,
            placeholder_text="Ex: 0.5",
            font=ctk.CTkFont(size=14),
            height=36
        )
        self.interval_entry.pack(padx=20, pady=(0, 10), fill="x")
        self.interval_entry.insert(0, "0.5")  # Valor padrão 0.5s

        # Campo: Botão do Mouse
        self.button_label = ctk.CTkLabel(
            self.config_frame,
            text="Botão do Mouse:",
            font=ctk.CTkFont(size=14, weight="bold")
        )
        self.button_label.pack(anchor="w", padx=20, pady=(5, 3))

        self.button_menu = ctk.CTkOptionMenu(
            self.config_frame,
            values=["Esquerdo", "Direito", "Central"],
            font=ctk.CTkFont(size=14),
            dropdown_font=ctk.CTkFont(size=13),
            height=36
        )
        self.button_menu.pack(padx=20, pady=(0, 12), fill="x")
        self.button_menu.set("Esquerdo")

        # Campo / Recurso Novo: Movimento Esquerda / Direita
        self.move_switch = ctk.CTkSwitch(
            self.config_frame,
            text="Mover mouse (Esquerda ↔ Direita)",
            font=ctk.CTkFont(size=13, weight="bold"),
            command=self._on_move_switch_toggle
        )
        self.move_switch.pack(anchor="w", padx=20, pady=(5, 5))

        self.move_label = ctk.CTkLabel(
            self.config_frame,
            text="Distância do movimento lateral (1 a 10 px):",
            font=ctk.CTkFont(size=13)
        )
        self.move_label.pack(anchor="w", padx=20, pady=(3, 3))

        self.move_menu = ctk.CTkOptionMenu(
            self.config_frame,
            values=[f"{i} px" for i in range(1, 11)],
            font=ctk.CTkFont(size=13),
            dropdown_font=ctk.CTkFont(size=13),
            height=34
        )
        self.move_menu.pack(padx=20, pady=(0, 15), fill="x")
        self.move_menu.set("5 px")  # Valor padrão 5px

        # Card de Status
        self.status_frame = ctk.CTkFrame(self, corner_radius=10, fg_color="#2B2B2B")
        self.status_frame.pack(padx=25, pady=12, fill="x")

        self.status_title = ctk.CTkLabel(
            self.status_frame,
            text="Status:",
            font=ctk.CTkFont(size=13, weight="bold"),
            text_color="#BDC3C7"
        )
        self.status_title.pack(side="left", padx=(20, 5), pady=10)

        self.status_value = ctk.CTkLabel(
            self.status_frame,
            text="PARADO",
            font=ctk.CTkFont(size=13, weight="bold"),
            text_color="#E74C3C"
        )
        self.status_value.pack(side="left", padx=5, pady=10)

        # Botão Principal de Iniciar / Parar
        self.toggle_btn = ctk.CTkButton(
            self,
            text="Iniciar (F8)",
            font=ctk.CTkFont(size=16, weight="bold"),
            height=48,
            fg_color="#2FA572",
            hover_color="#1E8449",
            command=self.toggle_clicker
        )
        self.toggle_btn.pack(padx=25, pady=(8, 10), fill="x")

        # Dica de Uso & Seguranca (Fail-Safe)
        self.info_label = ctk.CTkLabel(
            self,
            text="💡 Pressione F8 a qualquer momento para Ligar/Desligar.\n⚠️ Emergência (Fail-Safe): Arraste o mouse para o canto superior esquerdo.",
            font=ctk.CTkFont(size=11),
            text_color="#7F8C8D",
            justify="center"
        )
        self.info_label.pack(padx=20, pady=(3, 12))

    def _on_move_switch_toggle(self):
        """Ativa ou desativa visualmente o seletor de distância do movimento."""
        if self.move_switch.get() == 1:
            self.move_menu.configure(state="normal")
        else:
            self.move_menu.configure(state="disabled")

    def _register_hotkey(self):
        """Registra a tecla de atalho global F8 de forma segura."""
        try:
            keyboard.add_hotkey('f8', self._on_hotkey_pressed)
        except Exception as e:
            print(f"[Aviso] Não foi possível registrar o atalho de teclado global: {e}")
            print("Certifique-se de executar o aplicativo como Administrador no Windows se necessário.")

    def _on_hotkey_pressed(self):
        """Callback acionado pela biblioteca 'keyboard' (Thread separada).
        Agenda a alternância na thread principal da interface GUI.
        """
        self.after(0, self.toggle_clicker)

    def get_valid_interval(self) -> float:
        """Obtém e valida o valor do intervalo inserido pelo usuário.
        Se for inválido ou menor/igual a zero, retorna o padrão 0.5s sem quebrar o app.
        """
        raw_val = self.interval_entry.get().strip()
        try:
            val = float(raw_val.replace(',', '.'))
            if val <= 0:
                val = 0.5
            return val
        except (ValueError, TypeError):
            self.interval_entry.delete(0, "end")
            self.interval_entry.insert(0, "0.5")
            return 0.5

    def get_valid_movement_pixels(self) -> int:
        """Obtém e valida os pixels de movimento lateral (de 1 a 10px, padrão 5px)."""
        raw = self.move_menu.get().replace("px", "").strip()
        try:
            val = int(raw)
            return max(1, min(10, val))
        except (ValueError, TypeError):
            self.move_menu.set("5 px")
            return 5

    def toggle_clicker(self):
        """Alterna o estado do Auto Clicker entre Iniciar e Parar."""
        if self.is_running:
            self.stop_clicker()
        else:
            self.start_clicker()

    def start_clicker(self):
        """Inicia a execução dos cliques em uma thread separada."""
        if self.is_running:
            return

        interval = self.get_valid_interval()
        mouse_button_pt = self.button_menu.get()
        mouse_button = self.button_map.get(mouse_button_pt, "left")

        move_enabled = (self.move_switch.get() == 1)
        move_pixels = self.get_valid_movement_pixels()

        self.is_running = True
        self.stop_event.clear()

        # Atualizar Interface para Estado "Executando"
        self.status_value.configure(text="EM EXECUÇÃO...", text_color="#2ECC71")
        self.toggle_btn.configure(
            text="Parar (F8)",
            fg_color="#E74C3C",
            hover_color="#C0392B"
        )
        self.interval_entry.configure(state="disabled")
        self.button_menu.configure(state="disabled")
        self.move_switch.configure(state="disabled")
        self.move_menu.configure(state="disabled")

        # Iniciar thread do loop de cliques
        self.click_thread = threading.Thread(
            target=self._click_loop,
            args=(interval, mouse_button, move_enabled, move_pixels),
            daemon=True
        )
        self.click_thread.start()

    def stop_clicker(self):
        """Interrompe o loop de cliques e restaura a interface."""
        if not self.is_running:
            return

        self.is_running = False
        self.stop_event.set()

        # Atualizar Interface para Estado "Parado"
        self.status_value.configure(text="PARADO", text_color="#E74C3C")
        self.toggle_btn.configure(
            text="Iniciar (F8)",
            fg_color="#2FA572",
            hover_color="#1E8449"
        )
        self.interval_entry.configure(state="normal")
        self.button_menu.configure(state="normal")
        self.move_switch.configure(state="normal")
        if self.move_switch.get() == 1:
            self.move_menu.configure(state="normal")

    def _click_loop(self, interval: float, button: str, move_enabled: bool, move_pixels: int):
        """Loop de cliques e movimento executado em thread dedicada."""
        step_flag = False
        try:
            while not self.stop_event.is_set():
                if move_enabled:
                    # Alterna o movimento lateral entre esquerda (-px) e direita (+px)
                    shift = -move_pixels if not step_flag else move_pixels
                    pyautogui.moveRel(shift, 0)
                    step_flag = not step_flag

                pyautogui.click(button=button)

                # Utiliza o timeout do Event para poder interromper o sleep imediatamente
                if self.stop_event.wait(timeout=interval):
                    break
        except pyautogui.FailSafeException:
            print("[Fail-Safe] Execução do Auto Clicker interrompida pelo usuário movendo o mouse.")
            self.after(0, self._handle_failsafe_stop)
        except Exception as e:
            print(f"[Erro] Ocorreu uma exceção no loop de cliques: {e}")
            self.after(0, self.stop_clicker)

    def _handle_failsafe_stop(self):
        """Ação disparada ao ativar o Fail-Safe: para o clicker e mostra aviso na GUI."""
        self.stop_clicker()
        self.status_value.configure(text="INTERROMPIDO (FAIL-SAFE)", text_color="#F39C12")

    def on_closing(self):
        """Garante a limpeza dos hooks e encerramento correto das threads ao fechar o app."""
        self.stop_clicker()
        try:
            keyboard.unhook_all()
        except Exception:
            pass
        self.destroy()
        sys.exit(0)

if __name__ == "__main__":
    app = AutoClickerApp()
    app.mainloop()
