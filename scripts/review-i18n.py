"""Reviewed terminology for timer controls. Keep full source messages intact."""
import json,re
from pathlib import Path
root=Path('docs/locales');languages=['es','fr','de','pt']
catalogs={lang:json.loads((root/(lang+'.json')).read_text(encoding='utf-8')) for lang in languages}
rows='''Start|Iniciar|Démarrer|Starten|Iniciar
Resume|Reanudar|Reprendre|Fortsetzen|Retomar
Stop|Detener|Arrêter|Stoppen|Parar
Pause|Pausar|Pause|Pausieren|Pausar
Reset|Reiniciar|Réinitialiser|Zurücksetzen|Reiniciar
Next|Siguiente|Suivant|Weiter|Próximo
Next: {0}|Siguiente: {0}|Ensuite : {0}|Als Nächstes: {0}|A seguir: {0}
slot {0}|intervalo {0}|créneau {0}|Zeitabschnitt {0}|intervalo {0}
plan {0}|plan {0}|durée prévue {0}|Plan {0}|plano {0}
gets {0}|dispone de {0}|dispose de {0}|erhält {0}|recebe {0}
gets {0} if you stop now|dispone de {0} si paras ahora|dispose de {0} si vous arrêtez maintenant|erhält {0}, wenn du jetzt stoppst|recebe {0} se você parar agora
Set the match|Configurar la partida|Configurer la partie|Partie einstellen|Configurar a partida
Make start timer|Usar como página de inicio|Utiliser comme page d’accueil|Als Startseite festlegen|Usar como página inicial
Clear start timer|Quitar de la página de inicio|Retirer comme page d’accueil|Startseite zurücksetzen|Remover como página inicial
Search timers|Buscar temporizadores|Rechercher un minuteur|Timer suchen|Buscar temporizadores
Search by name or activity|Buscar por nombre o actividad|Rechercher par nom ou activité|Nach Name oder Aktivität suchen|Buscar por nome ou atividade
Clear search|Borrar búsqueda|Effacer la recherche|Suche löschen|Limpar busca
No timers found. Try another name or activity.|No se encontraron temporizadores. Prueba con otro nombre o actividad.|Aucun minuteur trouvé. Essayez un autre nom ou une autre activité.|Keine Timer gefunden. Versuche einen anderen Namen oder eine andere Aktivität.|Nenhum temporizador encontrado. Tente outro nome ou atividade.
Language|Idioma|Langue|Sprache|Idioma
Add speaker|Añadir participante|Ajouter un intervenant|Sprecher hinzufügen|Adicionar participante
Add a speaker|Añadir un participante|Ajouter un intervenant|Sprecher hinzufügen|Adicionar um participante
Speaker / topic|Participante / tema|Intervenant / sujet|Sprecher / Thema|Participante / assunto
Current speaker timer|Temporizador del participante actual|Minuteur de l’intervenant actuel|Timer des aktuellen Sprechers|Temporizador do participante atual
Add slot|Añadir intervalo|Ajouter un créneau|Zeitabschnitt hinzufügen|Adicionar intervalo
Slot {0}|Intervalo {0}|Créneau {0}|Zeitabschnitt {0}|Intervalo {0}
Slots|Intervalos|Créneaux|Zeitabschnitte|Intervalos
Slot|Intervalo|Créneau|Zeitabschnitt|Intervalo
Drag to change time · releases paused|Arrastra para cambiar el tiempo · al soltar queda en pausa|Faites glisser pour modifier le temps · relâchez pour mettre en pause|Ziehen zum Ändern der Zeit · beim Loslassen pausiert|Arraste para alterar o tempo · ao soltar, fica pausado
Count up within each slot|Contar hacia arriba en cada intervalo|Compter le temps écoulé dans chaque créneau|Verstrichene Zeit pro Abschnitt zählen|Contar o tempo decorrido em cada intervalo
A board supports up to 12 clocks.|Un panel admite hasta 12 temporizadores.|Un tableau peut contenir jusqu’à 12 minuteurs.|Eine Übersicht unterstützt bis zu 12 Timer.|Um painel suporta até 12 temporizadores.
Elapsed time|Tiempo transcurrido|Temps écoulé|Verstrichene Zeit|Tempo decorrido
Actual time|Tiempo real|Durée réelle|Tatsächliche Dauer|Tempo real
Adjust time|Ajustar duración|Ajuster la durée|Dauer anpassen|Ajustar duração
Cue could not load|No se pudo cargar el sonido|Impossible de charger le signal sonore|Signalton konnte nicht geladen werden|Não foi possível carregar o sinal sonoro
Run of show|Programa de la sesión|Déroulé de la séance|Ablaufplan|Roteiro da sessão
Daily stand-up|Reunión diaria|Point quotidien|Tägliches Stand-up|Reunião diária
Split|Parcial|Temps intermédiaire|Zwischenzeit|Parcial
Lap|Vuelta|Tour|Runde|Volta
Heating · not ready|Calentando · aún no está listo|Cuisson en cours · pas encore prêt|Wird erhitzt · noch nicht fertig|Aquecendo · ainda não está pronto
Runny yolk|Yema líquida|Jaune coulant|Flüssiges Eigelb|Gema líquida
Soft yolk|Yema cremosa|Jaune crémeux|Weiches Eigelb|Gema cremosa
Sticky yolk|Yema melosa|Jaune confit|Wachsweiches Eigelb|Gema pastosa
Soft-set yolk|Yema casi cuajada|Jaune presque pris|Fast festes Eigelb|Gema quase firme
Hard-boiled|Huevo duro|Œuf dur|Hartgekocht|Ovo cozido duro
Translucent white · liquid yolk|Clara translúcida · yema líquida|Blanc translucide · jaune liquide|Durchsichtiges Eiweiß · flüssiges Eigelb|Clara translúcida · gema líquida
Set white · flowing centre|Clara cuajada · centro líquido|Blanc pris · cœur coulant|Festes Eiweiß · flüssiger Kern|Clara firme · centro líquido
Set white · thick, soft centre|Clara cuajada · centro espeso y suave|Blanc pris · cœur épais et crémeux|Festes Eiweiß · dickflüssiger, weicher Kern|Clara firme · centro espesso e macio
Firm white · jam-like centre|Clara firme · centro meloso|Blanc ferme · cœur confit|Festes Eiweiß · wachsweicher Kern|Clara firme · centro pastoso
Mostly set · a small soft centre|Casi cuajada · pequeño centro suave|Presque pris · petit cœur tendre|Fast fest · kleiner weicher Kern|Quase firme · pequeno centro macio
Firm white · fully set yolk|Clara firme · yema totalmente cuajada|Blanc ferme · jaune entièrement pris|Festes Eiweiß · vollständig festes Eigelb|Clara firme · gema totalmente firme
Timer|Temporizador|Minuteur|Timer|Temporizador
Timer {0}|Temporizador {0}|Minuteur {0}|Timer {0}|Temporizador {0}
Timers|Temporizadores|Minuteurs|Timer|Temporizadores
Other Timers|Otros temporizadores|Autres minuteurs|Weitere Timer|Outros temporizadores
All timers|Todos los temporizadores|Tous les minuteurs|Alle Timer|Todos os temporizadores
More everyday timers|Más temporizadores cotidianos|Autres minuteurs du quotidien|Weitere Timer für den Alltag|Mais temporizadores do dia a dia
More sports timers|Más temporizadores deportivos|Autres minuteurs de sport|Weitere Sport-Timer|Mais temporizadores esportivos
Black: end turn|Negras: terminar turno|Noirs : terminer le tour|Schwarz: Zug beenden|Pretas: encerrar turno
White: end turn|Blancas: terminar turno|Blancs : terminer le tour|Weiß: Zug beenden|Brancas: encerrar turno
Foundations|Tipos de temporizador|Types de minuteur|Timer-Grundtypen|Tipos de temporizador
Foundation|Tipo de temporizador|Type de minuteur|Timer-Grundtyp|Tipo de temporizador
Sequential slots / countdowns|Intervalos secuenciales / cuentas atrás|Créneaux successifs / comptes à rebours|Aufeinanderfolgende Abschnitte / Countdowns|Intervalos sequenciais / contagens regressivas
Independent stopwatches|Cronómetros independientes|Chronomètres indépendants|Unabhängige Stoppuhren|Cronômetros independentes
Player time banks|Tiempo disponible por jugador|Réserves de temps par joueur|Zeitkonten der Spieler|Tempo disponível por jogador
Clocks / players|Temporizadores / jugadores|Minuteurs / joueurs|Timer / Spieler|Temporizadores / jogadores
At start|Al inicio|Au début|Am Anfang|No início
At end|Al finalizar|À la fin|Am Ende|No final
Count down|Cuenta atrás|Compte à rebours|Rückwärts zählen|Contagem regressiva
Work / active|Trabajo / actividad|Travail / activité|Arbeit / aktiv|Trabalho / atividade
Rest / recovery|Descanso / recuperación|Repos / récupération|Pause / Erholung|Descanso / recuperação
bell|campana|cloche|Glocke|sino
beep|pitido|bip|Piepton|bipe
gong|gong|gong|Gong|gongo
off|desactivado|désactivé|aus|desativado
horn|bocina|corne|Horn|buzina
click|clic|clic|Klick|clique
Paused / ready|En pausa / listo|En pause / prêt|Pausiert / bereit|Pausado / pronto
Running|En marcha|En cours|Läuft|Em execução
Ready for next stage|Listo para la siguiente etapa|Prêt pour l’étape suivante|Bereit für den nächsten Abschnitt|Pronto para a próxima etapa
Finished|Finalizado|Terminé|Beendet|Concluído
Sound on|Sonido activado|Son activé|Ton an|Som ativado
Sound off|Sonido desactivado|Son désactivé|Ton aus|Som desativado
Save setup|Guardar configuración|Enregistrer les réglages|Einstellungen speichern|Salvar configuração
Save current as template|Guardar como plantilla|Enregistrer comme modèle|Als Vorlage speichern|Salvar como modelo
Your stopwatch|Tu cronómetro|Votre chronomètre|Deine Stoppuhr|Seu cronômetro
Show All Timers|Mostrar todos los temporizadores|Afficher tous les minuteurs|Alle Timer anzeigen|Mostrar todos os temporizadores
Collapse to Groups|Agrupar por categoría|Regrouper par catégorie|Nach Kategorien gruppieren|Agrupar por categoria
Skip to timer|Ir al temporizador|Aller au minuteur|Zum Timer springen|Ir para o temporizador
Slot signals|Señales del intervalo|Signaux du créneau|Signale des Abschnitts|Sinais do intervalo
My timers|Mis temporizadores|Mes minuteurs|Meine Timer|Meus temporizadores
My meetings|Mis reuniones|Mes réunions|Meine Besprechungen|Minhas reuniões'''
rows+='''
{0} move|{0} movimiento|{0} coup|{0} Zug|{0} movimento
{0} moves|{0} movimientos|{0} coups|{0} Züge|{0} movimentos
{0} interval|{0} intervalo|{0} intervalle|{0} Intervall|{0} intervalo
{0} intervals|{0} intervalos|{0} intervalles|{0} Intervalle|{0} intervalos
Up next: {0} · {1}|A continuación: {0} · {1}|Ensuite : {0} · {1}|Als Nächstes: {0} · {1}|A seguir: {0} · {1}
Undo|Deshacer|Annuler|Rückgängig|Desfazer
undo|deshacer|annuler|rückgängig|desfazer
Topic|Tema|Sujet|Thema|Assunto
Untitled meeting|Reunión sin título|Réunion sans titre|Unbenannte Besprechung|Reunião sem título
Upper left|Arriba a la izquierda|En haut à gauche|Oben links|Superior esquerdo
Upper right|Arriba a la derecha|En haut à droite|Oben rechts|Superior direito
Toothbrushing|Cepillado dental|Brossage des dents|Zähneputzen|Escovação dos dentes
Focus 3|Concentración 3|Concentration 3|Fokus 3|Foco 3
Focus 4|Concentración 4|Concentration 4|Fokus 4|Foco 4
Focus · minutes|Concentración · minutos|Concentration · minutes|Fokus · Minuten|Foco · minutos
Slot {1}|Intervalo {1}|Créneau {1}|Zeitabschnitt {1}|Intervalo {1}
time bank|tiempo disponible|réserve de temps|Zeitkonto|tempo disponível
under plan|por debajo de lo previsto|en dessous du temps prévu|unter Plan|abaixo do previsto
{0} color|color {0}|couleur {0}|Farbe {0}|cor {0}
{0} icon|icono {0}|icône {0}|Symbol {0}|ícone {0}
{0} minutes|{0} minutos|{0} minutes|{0} Minuten|{0} minutos
{0} to move|Turno de {0}|À {0} de jouer|{0} am Zug|Vez de {0}
{0} move{1}{2}|{0} movimiento{1}{2}|{0} coup{1}{2}|{0} Züge{1}{2}|{0} movimento{1}{2}
{0} slots · {1} · {2} · {3}|{0} intervalos · {1} · {2} · {3}|{0} créneaux · {1} · {2} · {3}|{0} Zeitabschnitte · {1} · {2} · {3}|{0} intervalos · {1} · {2} · {3}
{0}: {1} used / {2} min|{0}: {1} usados / {2} min|{0} : {1} utilisées / {2} min|{0}: {1} verbraucht / {2} Min.|{0}: {1} usados / {2} min
· TOPIC|· TEMA|· SUJET|· THEMA|· ASSUNTO
· current zone|· zona actual|· zone actuelle|· aktueller Bereich|· zona atual
{0} timers|{0} temporizadores|{0} minuteurs|{0} Timer|{0} temporizadores
Sets|Series|Séries|Sätze|Séries
Rounds per set|Rondas por serie|Rounds par série|Runden pro Satz|Rodadas por série
Set recovery · seconds|Descanso entre series · segundos|Récupération entre séries · secondes|Satzpause · Sekunden|Recuperação entre séries · segundos
Cool down · seconds|Vuelta a la calma · segundos|Retour au calme · secondes|Abwärmen · Sekunden|Desaquecimento · segundos
Stage transition tick|Clic al cambiar de etapa|Clic de transition entre étapes|Klick beim Abschnittswechsel|Clique na mudança de etapa
Zero turns a cue off. Warnings apply to work intervals. Final beeps also count into the next interval.|El valor cero desactiva la señal. Los avisos se aplican a los intervalos de trabajo. Los pitidos finales también anuncian la entrada en el siguiente intervalo.|La valeur zéro désactive le signal. Les avertissements concernent les intervalles d’effort. Les bips de fin annoncent également le passage à l’intervalle suivant.|Null schaltet das Signal aus. Warnungen gelten für Belastungsintervalle. Die letzten Pieptöne zählen auch den Übergang zum nächsten Intervall herunter.|O valor zero desativa o sinal. Os avisos se aplicam aos intervalos de esforço. Os bipes finais também anunciam a passagem para o próximo intervalo.
Time to focus|Hora de concentrarse|Place à la concentration|Zeit für Konzentration|Hora de se concentrar
Test sound|Probar sonido|Tester le son|Ton testen|Testar som
Build your workout|Configura tu entrenamiento|Configurez votre entraînement|Training zusammenstellen|Configure seu treino
Build your rounds|Configura tus asaltos|Configurez vos rounds|Runden zusammenstellen|Configure seus rounds
How it works and advice|Cómo funciona y consejos|Fonctionnement et conseils|Anleitung und Tipps|Como funciona e dicas
Egg doneness milestones|Puntos de cocción del huevo|Étapes de cuisson des œufs|Garstufen des Eis|Pontos de cozimento do ovo
Eggs removed at different times|Huevos retirados en distintos momentos|Œufs retirés à différents moments|Zu verschiedenen Zeiten entnommene Eier|Ovos retirados em momentos diferentes
Early|Antes de tiempo|En avance|Vorzeitig|Antes do previsto
Over|Tiempo excedido|Dépassement|Überzogen|Tempo excedido
Elapsed|Transcurrido|Écoulé|Verstrichen|Decorrido
Focus|Concentración|Concentration|Fokus|Foco
Focus 1|Concentración 1|Concentration 1|Fokus 1|Foco 1
Focus 2|Concentración 2|Concentration 2|Fokus 2|Foco 2
First infusion|Primera infusión|Première infusion|Erster Aufguss|Primeira infusão
Second infusion|Segunda infusión|Deuxième infusion|Zweiter Aufguss|Segunda infusão
Third infusion|Tercera infusión|Troisième infusion|Dritter Aufguss|Terceira infusão
First pour|Primer vertido|Premier versement|Erster Aufguss|Primeiro despejo
Draw down|Escurrido|Écoulement|Durchlaufen|Escoamento
Fix|Fijar|Fixer|Fixieren|Fixar
Bloom|Preinfusión|Préinfusion|Vorquellen|Pré-infusão
Everyday|Uso cotidiano|Au quotidien|Alltag|Dia a dia
Export meeting|Exportar reunión|Exporter la réunion|Besprechung exportieren|Exportar reunião
Duplicate|Duplicar|Dupliquer|Duplizieren|Duplicar
Float timer|Abrir ventana flotante|Ouvrir une fenêtre flottante|Schwebendes Fenster öffnen|Abrir janela flutuante
Example: three rounds of bag work|Ejemplo: tres asaltos de entrenamiento con saco|Exemple : trois rounds au sac de frappe|Beispiel: drei Runden am Boxsack|Exemplo: três rounds no saco de pancadas
Example: time both sides of a stretch|Ejemplo: cronometrar el estiramiento de ambos lados|Exemple : chronométrer un étirement des deux côtés|Beispiel: beide Seiten einer Dehnung zeitlich erfassen|Exemplo: cronometrar o alongamento dos dois lados
Example: prepare, shoot and change groups|Ejemplo: preparación, tiro con arco y cambio de grupo|Exemple : préparation, tir à l’arc et changement de groupe|Beispiel: vorbereiten, schießen und Gruppen wechseln|Exemplo: preparação, tiro com arco e troca de grupo
Example: record lane splits|Ejemplo: registrar parciales por calle de natación|Exemple : enregistrer les temps intermédiaires par couloir|Beispiel: Zwischenzeiten pro Schwimmbahn erfassen|Exemplo: registrar tempos parciais por raia
Tomato timer and a notepad|Temporizador con forma de tomate y un bloc de notas|Minuteur en forme de tomate et bloc-notes|Tomatenförmiger Timer und Notizblock|Temporizador em forma de tomate e bloco de notas
Topic or action item|Tema o tarea|Sujet ou action à mener|Thema oder Aufgabe|Assunto ou ação
Topics and fixed slots add up to|Los temas y los intervalos fijos suman|Les sujets et les créneaux fixes totalisent|Themen und feste Zeitabschnitte ergeben insgesamt|Os assuntos e os intervalos fixos somam
Training with a named sample sequence|Entrenamiento con una secuencia de muestras identificadas|Entraînement avec une séquence d’échantillons nommés|Übung mit einer benannten Probensequenz|Treinamento com uma sequência de amostras nomeadas
Turn a goal into a plan.|Convierte un objetivo en un plan.|Transformez un objectif en plan.|Mach aus einem Ziel einen Plan.|Transforme uma meta em um plano.
Undo last switch (Left arrow)|Deshacer el último cambio (flecha izquierda)|Annuler le dernier changement (flèche gauche)|Letzten Wechsel rückgängig machen (Pfeil links)|Desfazer a última troca (seta para a esquerda)
Unlimited timer sessions|Sesiones de temporizador ilimitadas|Sessions de minuteur illimitées|Unbegrenzte Timer-Sitzungen|Sessões de temporizador ilimitadas
Use Green < Amber < Red.|Usa Verde < Ámbar < Rojo.|Respectez Vert < Orange < Rouge.|Es muss Grün < Gelb < Rot gelten.|Use Verde < Âmbar < Vermelho.
Use Start all for a common start; stop each participant separately.|Usa Iniciar todos para empezar a la vez; detén a cada participante por separado.|Utilisez Tout démarrer pour un départ commun ; arrêtez chaque participant séparément.|Nutze Alle starten für einen gemeinsamen Start und stoppe jeden Teilnehmer einzeln.|Use Iniciar todos para começar ao mesmo tempo; pare cada participante separadamente.
Name|Nombre|Nom|Name|Nome
Stage|Etapa|Étape|Abschnitt|Etapa
Time|Tiempo|Temps|Zeit|Tempo
Slot signals|Señales del intervalo|Signaux du créneau|Abschnittssignale|Sinais do intervalo
Start all|Iniciar todos|Tout démarrer|Alle starten|Iniciar todos
Pause all|Pausar todos|Tout mettre en pause|Alle pausieren|Pausar todos
Start first player|Iniciar al primer jugador|Démarrer le premier joueur|Ersten Spieler starten|Iniciar o primeiro jogador
Fullscreen board|Panel en pantalla completa|Tableau en plein écran|Übersicht im Vollbild|Painel em tela cheia
Sign in with Google|Iniciar sesión con Google|Se connecter avec Google|Mit Google anmelden|Entrar com o Google
Next stage|Siguiente etapa|Étape suivante|Nächster Abschnitt|Próxima etapa
Next interval|Siguiente intervalo|Intervalle suivant|Nächstes Intervall|Próximo intervalo
Timer results|Resultados del temporizador|Résultats du minuteur|Timer-Ergebnisse|Resultados do temporizador
Controls|Controles|Commandes|Bedienelemente|Controles
Search results|Resultados de búsqueda|Résultats de recherche|Suchergebnisse|Resultados da busca
Set alarm|Activar alarma|Activer l’alarme|Alarm aktivieren|Ativar alarme'''
titles='''Simple Timer|Temporizador simple|Minuteur simple|Einfacher Timer|Temporizador simples
Online Stopwatch|Cronómetro en línea|Chronomètre en ligne|Online-Stoppuhr|Cronômetro online
Stopwatch|Cronómetro|Chronomètre|Stoppuhr|Cronômetro
Pomodoro Timer|Temporizador Pomodoro|Minuteur Pomodoro|Pomodoro-Timer|Temporizador Pomodoro
Egg Timer|Temporizador para huevos|Minuteur à œufs|Eieruhr|Temporizador para ovos
Kitchen Timer|Temporizador de cocina|Minuteur de cuisine|Küchentimer|Temporizador de cozinha
Meditation Timer|Temporizador de meditación|Minuteur de méditation|Meditationstimer|Temporizador de meditação
Meeting Timer|Temporizador de reuniones|Minuteur de réunion|Besprechungstimer|Temporizador de reuniões
Fitness Timer|Temporizador de entrenamiento|Minuteur de fitness|Fitnesstimer|Temporizador de treino
Boxing Timer|Temporizador de boxeo|Minuteur de boxe|Box-Timer|Temporizador de boxe
Classroom Timer|Temporizador para el aula|Minuteur pour la classe|Unterrichtstimer|Temporizador de sala de aula
Chess Timer|Reloj de ajedrez|Pendule d’échecs|Schachuhr|Relógio de xadrez
Tea Brewing Timer|Temporizador para té|Minuteur pour le thé|Teetimer|Temporizador para chá
Toothbrushing Timer|Temporizador de cepillado dental|Minuteur de brossage des dents|Zahnputztimer|Temporizador de escovação
Breathing Timer|Temporizador de respiración|Minuteur de respiration|Atemtimer|Temporizador de respiração
Yoga Timer|Temporizador de yoga|Minuteur de yoga|Yoga-Timer|Temporizador de yoga
Speech Timer|Temporizador de discursos|Minuteur de prise de parole|Redezeittimer|Temporizador de discursos
New Year Countdown|Cuenta atrás de Año Nuevo|Compte à rebours du Nouvel An|Neujahrs-Countdown|Contagem regressiva de Ano Novo
Multi Stopwatch|Cronómetros múltiples|Chronomètres multiples|Mehrfach-Stoppuhr|Cronômetros múltiplos
Running Coach Timer|Temporizador para entrenadores de carrera|Minuteur d’entraînement à la course|Lauftrainertimer|Temporizador para treino de corrida
Swimming Timer|Cronómetro de natación|Chronomètre de natation|Schwimmtimer|Cronômetro de natação
Circuit Training Timer|Temporizador de entrenamiento en circuito|Minuteur d’entraînement en circuit|Zirkeltraining-Timer|Temporizador de treino em circuito
Multiplayer Board Game Timer|Temporizador multijugador para juegos de mesa|Minuteur multijoueur pour jeux de société|Mehrspieler-Brettspiel-Timer|Temporizador multijogador para jogos de tabuleiro
Debate Timer|Temporizador de debates|Minuteur de débat|Debattentimer|Temporizador de debates
Exam Station Timer|Temporizador de estaciones de examen|Minuteur de postes d’examen|Prüfungsstationen-Timer|Temporizador de estações de exame
Coffee Brewing Timer|Temporizador para preparar café|Minuteur de préparation du café|Kaffeebrühtimer|Temporizador de preparo de café
Climbing Timer|Temporizador de escalada|Minuteur d’escalade|Klettertimer|Temporizador de escalada
Speed Networking Timer|Temporizador de networking rápido|Minuteur de rencontres professionnelles|Speed-Networking-Timer|Temporizador de networking rápido
Bakery Batch Timer|Temporizador de lotes de panadería|Minuteur de fournées|Backchargen-Timer|Temporizador de fornadas
Workshop Job Timer|Temporizador de trabajos de taller|Chronomètre de travaux d’atelier|Werkstatt-Auftragstimer|Cronômetro de trabalhos de oficina
Escape Room Timer|Temporizador de escape room|Minuteur d’escape game|Escape-Room-Timer|Temporizador de escape room
Laboratory Sample Timer|Temporizador de muestras de laboratorio|Minuteur d’échantillons de laboratoire|Laborproben-Timer|Temporizador de amostras de laboratório
Darkroom Timer|Temporizador de cuarto oscuro|Minuteur de chambre noire|Dunkelkammertimer|Temporizador de câmara escura
Archery Timer|Temporizador de tiro con arco|Minuteur de tir à l’arc|Bogenschießtimer|Temporizador de tiro com arco
Sailing Start Timer|Temporizador de salida de regata|Minuteur de départ de régate|Regatta-Starttimer|Temporizador de largada de regata
Sports Timekeeper|Cronometraje deportivo|Chronométrage sportif|Sportzeitmesser|Cronometragem esportiva
Skydiving Ground Preparation Timer|Temporizador de preparación en tierra para paracaidismo|Minuteur de préparation au sol pour le parachutisme|Timer für die Fallschirmsprung-Vorbereitung am Boden|Temporizador de preparação em solo para paraquedismo
Custom Timer|Temporizador personalizado|Minuteur personnalisé|Benutzerdefinierter Timer|Temporizador personalizado'''
suffixes=['Temporizador gratuito en línea','Minuteur gratuit en ligne','Kostenloser Online-Timer','Temporizador online gratuito']
for line in (rows+'\n'+titles).splitlines():
    source,*values=line.split('|');assert len(values)==4,source
    for i,lang in enumerate(languages):catalogs[lang][source]=values[i]
for line in titles.splitlines():
    source,*values=line.split('|')
    for i,lang in enumerate(languages):
        d=catalogs[lang];name=values[i]
        for key in list(d):
            if key==source+' — Free Online Timer | CorpTimer':d[key]=name+' — '+suffixes[i]+' | CorpTimer'
            elif key==source+' | CorpTimer':d[key]=name+' | CorpTimer'
            elif key=='How the '+source+' works':d[key]=['Cómo funciona ','Fonctionnement : ','So funktioniert ','Como funciona '][i]+name
            elif key==source+' controls':d[key]=['Controles de ','Commandes : ','Bedienelemente: ','Controles de '][i]+name
            elif key==source+' on CorpTimer':d[key]=name+[' en CorpTimer',' sur CorpTimer',' auf CorpTimer',' no CorpTimer'][i]
            elif key==source+': example timing setup':d[key]=name+[': ejemplo de configuración de tiempos', ' : exemple de réglage des durées', ': Beispiel für die Zeiteinstellung', ': exemplo de configuração de tempos'][i]
# Correct domain-specific mistranslations throughout the complete copy.
fixes={
 'es':[(r'\branuras\b','intervalos'),(r'\branura\b','intervalo'),(r'Currículum','Reanudar'),(r'currículum','reanudar')],
 'fr':[(r'\bcréneaux horaires\b','créneaux')],
 'de':[(r'Steckplätze','Zeitabschnitte'),(r'Steckplatz','Zeitabschnitt')],
 'pt':[(r'Currículo','Retomar'),(r'currículo','retomar')],
}
for lang,d in catalogs.items():
    for key,value in d.items():
        for pattern,replacement in fixes[lang]:value=re.sub(pattern,replacement,value)
        if 'speaker' in key.lower() and not re.search('audio|device speaker|loudspeaker',key,re.I):
            for before,after in {'es':[('altavoces','participantes'),('altavoz','participante')],'fr':[('haut-parleurs','intervenants'),('haut-parleur','intervenant')],'de':[('Lautsprecher','Sprecher')],'pt':[('alto-falantes','participantes'),('alto-falante','participante')]}[lang]:value=value.replace(before,after)
        d[key]=value
    for term,minute in [('Runny yolk',5),('Soft yolk',6),('Sticky yolk',7),('Soft-set yolk',8),('Hard-boiled',10)]:
        d[f'{term} · {minute} minutes']=d[term]+' · '+str(minute)+{'es':' minutos','fr':' minutes','de':' Minuten','pt':' minutos'}[lang]
    d['At start{11}']=d['At start']+'{11}';d['At end{12}']=d['At end']+'{12}'
    for label,texture in [('Heating · not ready','Translucent white · liquid yolk'),('Runny yolk','Set white · flowing centre'),('Soft yolk','Set white · thick, soft centre'),('Sticky yolk','Firm white · jam-like centre'),('Soft-set yolk','Mostly set · a small soft centre'),('Hard-boiled','Firm white · fully set yolk')]:d[label+': '+texture]=d[label]+': '+d[texture]
    d['/ year']={'es':'/ año','fr':'/ an','de':'/ Jahr','pt':'/ ano'}[lang]
    d['Pro & branding']={'es':'Pro y marca','fr':'Pro et personnalisation','de':'Pro und Branding','pt':'Pro e marca'}[lang]
    d['Pro · Your logo']={'es':'Pro · Tu logotipo','fr':'Pro · Votre logo','de':'Pro · Dein Logo','pt':'Pro · Seu logotipo'}[lang]
    for name in ('English','Español','Français','Deutsch','Português','CorpTimer','Alex','Tabata','HIIT','EMOM','AMRAP'):d[name]=name
    d['. The yolk pictures are illustrations, not measurements of the egg in your pan.']={
      'es':'. Las imágenes de las yemas son ilustraciones, no mediciones del huevo que está en tu olla.',
      'fr':'. Les images de jaunes sont des illustrations, et non des mesures de l’œuf dans votre casserole.',
      'de':'. Die Eigelbbilder sind Illustrationen und keine Messungen des Eis in deinem Topf.',
      'pt':'. As imagens das gemas são ilustrações, não medições do ovo na sua panela.'}[lang]
    d['Opens a compact floating display where supported, or docks it again. Check whether your screen-share mode includes that window.']={
      'es':'Abre una ventana flotante compacta cuando el navegador lo permite, o la devuelve a la página. Comprueba si el modo de compartir pantalla incluye esa ventana.',
      'fr':'Ouvre un affichage flottant compact si le navigateur le permet, ou le réintègre dans la page. Vérifiez si votre mode de partage d’écran inclut cette fenêtre.',
      'de':'Öffnet eine kompakte schwebende Anzeige, sofern unterstützt, oder fügt sie wieder in die Seite ein. Prüfe, ob dein Bildschirmfreigabemodus dieses Fenster einschließt.',
      'pt':'Abre uma janela flutuante compacta quando compatível, ou a devolve à página. Verifique se o modo de compartilhamento de tela inclui essa janela.'}[lang]
    (root/(lang+'.json')).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Applied reviewed timer terminology in all four catalogs.')
