"""Base de conhecimento psicológico para o Psycho Assistant.
Contém resumos de teorias, técnicas, estudos e referências científicas.
"""

KNOWLEDGE_ENTRIES = [
    # ============================================================
    # TERAPIA COGNITIVO-COMPORTAMENTAL (TCC)
    # ============================================================
    {
        "id": "cbt-overview",
        "category": "TCC",
        "title": "Terapia Cognitivo-Comportamental — Visão Geral",
        "content": """A Terapia Cognitivo-Comportamental (TCC) foi desenvolvida por Aaron T. Beck na década de 1960. 
        Baseia-se no modelo cognitivo: pensamentos disfuncionais → emoções negativas → comportamentos desadaptativos.
        O Triângulo Cognitivo (pensamento-emoção-comportamento) é central. A TCC é estruturada, focada no presente 
        e orientada a metas. Meta-análise de Fordham et al. (2021) com 494 revisões e 221.128 participantes demonstrou 
        eficácia consistente em condições mentais e físicas (SMD 0.23, IC 95% 0.14-0.33).""",
        "references": "Beck, A.T. (1979). Cognitive Therapy of Depression. Guilford Press. | Beck, J.S. (2011). Cognitive Behavior Therapy: Basics and Beyond (2nd ed.). | Fordham, B. et al. (2021). Psychological Medicine, 51(1), 21-29.",
        "tags": ["cbt", "tcc", "beck", "cognitivo", "comportamental", "terapia", "cognitive", "behavioral"],
    },
    {
        "id": "cbt-distortions",
        "category": "TCC",
        "title": "Distorções Cognitivas",
        "content": """Distorções cognitivas são padrões de pensamento imprecisos ou exagerados que reforçam crenças negativas. 
        As principais identificadas por Beck: 1) Catastrofização — prever o pior cenário possível; 2) Pensamento 
        tudo-ou-nada — visão extremista sem meios-termos; 3) Leitura mental — presumir o que outros pensam sem evidências; 
        4) Raciocínio emocional — acreditar que sentimentos são fatos; 5) Supergeneralização — aplicar uma experiência 
        negativa a todas as situações; 6) Personalização — assumir responsabilidade por eventos externos; 
        7) Rotulação — definir a si ou outros com rótulos negativos; 8) Filtro mental — focar apenas nos aspectos 
        negativos; 9) Minimização/magnificação; 10) Deveria (should statements).""",
        "references": "Beck, A.T. (1976). Cognitive Therapy and the Emotional Disorders. | Burns, D.D. (1980). Feeling Good: The New Mood Therapy.",
        "tags": ["distorções", "distortions", "cognitive", "pensamento", "crenças", "tcc", "cbt"],
    },
    {
        "id": "cbt-thought-record",
        "category": "TCC",
        "title": "Registro de Pensamentos (Thought Record)",
        "content": """O Registro de Pensamentos é uma ferramenta central da TCC para identificar e reestruturar pensamentos 
        automáticos disfuncionais. Passos: 1) Situação — descreva o que aconteceu; 2) Emoção(s) — nomeie e avalie 
        intensidade (0-100%); 3) Pensamento automático — o que passou pela sua mente; 4) Evidências a favor do 
        pensamento; 5) Evidências contra o pensamento; 6) Pensamento alternativo/equilibrado — uma nova perspectiva 
        baseada nas evidências; 7) Reavaliação emocional — como você se sente agora. Estudos mostram que o uso 
        consistente reduz significativamente sintomas de ansiedade e depressão.""",
        "references": "Greenberger, D. & Padesky, C.A. (1995). Mind Over Mood. Guilford Press.",
        "tags": ["thought record", "registro", "pensamentos", "tcc", "cbt", "reestruturação", "cognitive restructuring"],
    },
    {
        "id": "cbt-behavioral-activation",
        "category": "TCC",
        "title": "Ativação Comportamental",
        "content": """Ativação Comportamental (BA) é uma intervenção baseada em evidências para depressão. Baseia-se na 
        premissa que a depressão leva à evitação e isolamento, que por sua vez pioram a depressão. A BA ajuda a pessoa 
        a: 1) Monitorar atividades diárias e humor associado; 2) Identificar valores e metas; 3) Programar atividades 
        prazerosas e significativas; 4) Resolver barreiras práticas; 5) Reduzir comportamentos de evitação. 
        Meta-análises mostram que BA é tão eficaz quanto TCC completa para depressão (Ekers et al., 2014).""",
        "references": "Ekers, D. et al. (2014). Behavioural activation for depression; an update of meta-analysis. PLoS ONE. | Martell, C.R. et al. (2010). Behavioral Activation for Depression.",
        "tags": ["ativação", "behavioral activation", "depressão", "depression", "tcc", "cbt", "atividades"],
    },

    # ============================================================
    # PSICANÁLISE
    # ============================================================
    {
        "id": "psychoanalysis-freud",
        "category": "Psicanálise",
        "title": "Psicanálise Freudiana — Conceitos Fundamentais",
        "content": """Sigmund Freud (1856-1939) desenvolveu a psicanálise, primeira abordagem sistemática para compreender 
        a mente inconsciente. Conceitos-chave: 1) Aparelho psíquico — id (instintos), ego (realidade), superego (moral); 
        2) Inconsciente — conteúdos reprimidos que influenciam comportamento; 3) Mecanismos de defesa — recalque, 
        projeção, sublimação, formação reativa, racionalização, deslocamento; 4) Desenvolvimento psicossexual — fases 
        oral, anal, fálica, latência, genital; 5) Complexo de Édipo; 6) Interpretação de sonhos como 'via régia para 
        o inconsciente'; 7) Associação livre; 8) Transferência e contratransferência. Freud via a terapia como um 
        processo de trazer conteúdos inconscientes à consciência (insight).""",
        "references": "Freud, S. (1900). The Interpretation of Dreams. | Freud, S. (1923). The Ego and the Id. | Freud, S. (1915). The Unconscious.",
        "tags": ["freud", "psicanálise", "psychoanalysis", "inconsciente", "unconscious", "defesas", "defenses"],
    },
    {
        "id": "jung-analytical",
        "category": "Psicanálise",
        "title": "Psicologia Analítica de Carl Jung",
        "content": """Carl Gustav Jung (1875-1961) desenvolveu a Psicologia Analítica. Principais conceitos: 1) Inconsciente 
        coletivo — camada profunda compartilhada por toda humanidade; 2) Arquétipos — padrões universais (Persona, 
        Sombra, Anima/Animus, Self, Herói, Mãe, Sábio); 3) Processo de individuação — jornada de integração das 
        partes da psique rumo à totalidade; 4) Tipos psicológicos — extroversão/introversão, funções (pensamento, 
        sentimento, sensação, intuição); 5) Sincronicidade — coincidências significativas não causais; 6) Imaginação 
        ativa — técnica de dialogar com imagens do inconsciente. Jung via a terapia como um processo de descoberta 
        de significado e integração da totalidade da psique.""",
        "references": "Jung, C.G. (1964). Man and His Symbols. | Jung, C.G. (1921). Psychological Types. | Jung, C.G. (1951). Aion: Researches into the Phenomenology of the Self.",
        "tags": ["jung", "analítica", "analytical", "arquétipos", "archetypes", "individuação", "individuation"],
    },

    # ============================================================
    # HUMANISMO
    # ============================================================
    {
        "id": "humanist-rogers",
        "category": "Humanismo",
        "title": "Abordagem Centrada na Pessoa — Carl Rogers",
        "content": """Carl Rogers (1902-1987) desenvolveu a Abordagem Centrada na Pessoa (ACP). Três condições 
        fundamentais para a mudança terapêutica: 1) Empatia — compreender o mundo do cliente como se fosse seu; 
        2) Consideração positiva incondicional — aceitação sem julgamentos; 3) Congruência — autenticidade e 
        transparência do terapeuta. Rogers acreditava na tendência atualizante — capacidade inata de crescimento. 
        O self ideal vs. self real: quanto maior a discrepância, maior o sofrimento. A terapia cria um ambiente 
        seguro para reduzir essa discrepância. Pesquisas mostram que a aliança terapêutica (qualidade da relação) 
        é um dos maiores preditores de sucesso terapêutico.""",
        "references": "Rogers, C. (1951). Client-Centered Therapy. | Rogers, C. (1961). On Becoming a Person. | Rogers, C. (1980). A Way of Being.",
        "tags": ["rogers", "humanista", "humanist", "centrado", "person-centered", "empatia", "empathy"],
    },
    {
        "id": "maslow-hierarchy",
        "category": "Humanismo",
        "title": "Hierarquia das Necessidades de Maslow",
        "content": """Abraham Maslow (1908-1970) propôs a Hierarquia das Necessidades em forma de pirâmide: 
        1) Base — necessidades fisiológicas (comida, água, sono); 2) Segurança (abrigo, estabilidade); 3) Amor 
        e pertencimento (afeto, comunidade); 4) Estima (respeito, reconhecimento); 5) Topo — autorrealização 
        (alcançar o potencial máximo). Maslow também estudou experiências de pico (peak experiences) — momentos 
        de intensa felicidade e transcendência. A autorrealização envolve aceitação, espontaneidade, foco nos 
        problemas, independência cultural e criatividade. Maslow é considerado fundador da Psicologia Humanista 
        e da Psicologia Positiva.""",
        "references": "Maslow, A. (1943). A Theory of Human Motivation. Psychological Review, 50(4), 370-396. | Maslow, A. (1962). Toward a Psychology of Being.",
        "tags": ["maslow", "hierarquia", "hierarchy", "necessidades", "needs", "autorrealização", "self-actualization"],
    },

    # ============================================================
    # BEHAVIORISMO
    # ============================================================
    {
        "id": "behaviorism-skinner",
        "category": "Behaviorismo",
        "title": "Behaviorismo Radical — B.F. Skinner",
        "content": """B.F. Skinner (1904-1990) desenvolveu o Behaviorismo Radical, focando no comportamento observável. 
        Condicionamento operante: comportamentos são moldados por suas consequências. Conceitos: 1) Reforço positivo 
        — adicionar estímulo agradável para aumentar comportamento; 2) Reforço negativo — remover estímulo aversivo; 
        3) Punição positiva — adicionar estímulo aversivo; 4) Punição negativa — remover estímulo agradável; 
        5) Extinção — remover reforço para diminuir comportamento; 6) Modelagem — reforçar aproximações sucessivas; 
        7) Esquemas de reforço — contínuo, intermitente (razão fixa/variável, intervalo fixo/variável). 
        Aplicações: terapia comportamental, educação, treinamento de hábitos.""",
        "references": "Skinner, B.F. (1938). The Behavior of Organisms. | Skinner, B.F. (1953). Science and Human Behavior. | Skinner, B.F. (1974). About Behaviorism.",
        "tags": ["skinner", "behaviorismo", "behaviorism", "condicionamento", "operante", "reforço", "reinforcement"],
    },
    {
        "id": "pavlov-classical",
        "category": "Behaviorismo",
        "title": "Condicionamento Clássico — Ivan Pavlov",
        "content": """Ivan Pavlov (1849-1936) descobriu o condicionamento clássico através de experimentos com cães. 
        Um estímulo neutro (sineta) é pareado repetidamente com um estímulo incondicionado (comida) que produz 
        uma resposta incondicionada (salivação). Após o pareamento, o estímulo neutro torna-se um estímulo 
        condicionado que elicia uma resposta condicionada. Princípios: 1) Aquisição; 2) Extinção; 3) Recuperação 
        espontânea; 4) Generalização de estímulos; 5) Discriminação. Aplicações terapêuticas: dessensibilização 
        sistemática (Wolpe) para fobias, terapia de exposição, condicionamento aversivo.""",
        "references": "Pavlov, I.P. (1927). Conditioned Reflexes. Oxford University Press. | Wolpe, J. (1958). Psychotherapy by Reciprocal Inhibition.",
        "tags": ["pavlov", "clássico", "classical", "condicionamento", "conditioning", "exposição", "exposure"],
    },

    # ============================================================
    # DBT — DIALECTICAL BEHAVIOR THERAPY
    # ============================================================
    {
        "id": "dbt-overview",
        "category": "DBT",
        "title": "Terapia Comportamental Dialética (DBT)",
        "content": """A DBT foi desenvolvida por Marsha Linehan para tratar pacientes com comportamento suicida crônico 
        e borderline. Combina TCC com princípios de aceitação (mindfulness). Quatro módulos: 1) Mindfulness — 
        observar, descrever, participar (habilidades 'como': não- julgar, uma-coisa-de-cada-vez, efetividade); 
        2) Tolerância ao sofrimento — sobreviver a crises sem piorar a situação (STOP, TIPP, distração, 
        auto-acalmar); 3) Regulação emocional — identificar emoções, reduzir vulnerabilidade, agir oposto ao 
        impulso; 4) Eficácia interpessoal — DEAR MAN (pedir), GIVE (manter), FAST (auto-respeito). 
        Evidência: Chapman (2006) — DBT é eficaz para TPB, comportamento suicida, transtornos alimentares 
        e dependência química.""",
        "references": "Linehan, M. (1993). Cognitive-Behavioral Treatment of Borderline Personality Disorder. Guilford Press. | Chapman, A.L. (2006). Psychiatry (Edgmont), 3(9), 62-68.",
        "tags": ["dbt", "dialética", "dialectical", "linehan", "mindfulness", "regulação", "emotional regulation"],
    },

    # ============================================================
    # ACT — ACCEPTANCE AND COMMITMENT THERAPY
    # ============================================================
    {
        "id": "act-overview",
        "category": "ACT",
        "title": "Terapia de Aceitação e Compromisso (ACT)",
        "content": """ACT, desenvolvida por Steven Hayes, faz parte das 'terapias de terceira onda'. Baseia-se na Teoria 
        dos Quadros Relacionais (RFT). O objetivo é flexibilidade psicológica — capacidade de estar presente com 
        experiências internas difíceis enquanto age guiado por valores. Hexaflex: seis processos centrais: 
        1) Aceitação — abrir espaço para experiências desconfortáveis; 2) Desfusão cognitiva — observar pensamentos 
        como palavras, não verdades absolutas; 3) Eu-como-contexto — self observador; 4) Contato com o momento 
        presente; 5) Valores — direção de vida escolhida; 6) Ação comprometida — agir de acordo com valores. 
        Metáfora clássica: o 'jardim' (valores) vs. o 'buraco' (evitação experencial).""",
        "references": "Hayes, S.C. et al. (2011). Acceptance and Commitment Therapy (2nd ed.). Guilford Press. | Harris, R. (2009). ACT Made Simple.",
        "tags": ["act", "aceitação", "acceptance", "compromisso", "commitment", "hayes", "flexibilidade", "flexibility"],
    },

    # ============================================================
    # PSICOLOGIA POSITIVA
    # ============================================================
    {
        "id": "positive-psychology",
        "category": "Psicologia Positiva",
        "title": "Psicologia Positiva — Martin Seligman",
        "content": """Psicologia Positiva (Seligman, 1998) estuda o que faz a vida valer a pena. Modelo PERMA: 
        Positive emotion (emoção positiva), Engagement (engajamento), Relationships (relacionamentos), 
        Meaning (significado), Accomplishment (realização). Forças de caráter (24 forças universais, Via 
        Classification). Otimismo aprendido — reestruturar explicações pessimistas. Gratidão — escrever 
        três coisas boas por dia melhora bem-estar (Emmons & McCullough, 2003). Savouring — saborear 
        experiências positivas prolonga seu efeito. Flow (Csikszentmihalyi) — estado de imersão total 
        em atividade desafiadora. Estudos longitudinais mostram que praticar gratidão e forças de caráter 
        aumenta felicidade duradoura.""",
        "references": "Seligman, M. (2011). Flourish. Free Press. | Csikszentmihalyi, M. (1990). Flow. | Emmons, R.A. & McCullough, M.E. (2003). Journal of Personality and Social Psychology, 84(2), 377-389.",
        "tags": ["positiva", "positive", "seligman", "perma", "gratidão", "gratitude", "forças", "strengths", "flow"],
    },

    # ============================================================
    # MINDFULNESS
    # ============================================================
    {
        "id": "mindfulness-overview",
        "category": "Mindfulness",
        "title": "Mindfulness — Atenção Plena",
        "content": """Mindfulness é a capacidade de prestar atenção ao momento presente com intenção, curiosidade e 
        sem julgamento (Kabat-Zinn). MBSR (Mindfulness-Based Stress Reduction) — programa de 8 semanas criado 
        por Jon Kabat-Zinn na UMass Medical School. Evidências neurocientíficas: Harvard (Desbordes, 2012) 
        mostrou que mindfulness altera a atividade da amígdala em resposta a estímulos emocionais. Tang et al. 
        (2015) na Nature Reviews Neuroscience — mindfulness melhora atenção, regulação emocional e autoconsciência. 
        Estudo recente da USC (Kim, 2025) — 30 dias de mindfulness guiado melhora controle atencional em todas 
        as idades. Técnicas: body scan, meditação sentada, movimento consciente, loving-kindness.""",
        "references": "Kabat-Zinn, J. (1990). Full Catastrophe Living. | Desbordes, G. et al. (2012). SCAN. | Tang, Y.Y. et al. (2015). Nature Reviews Neuroscience, 16(4), 213-225. | Kim, A.J. et al. (2025). USC Leonard Davis School.",
        "tags": ["mindfulness", "atenção", "plena", "kabat-zinn", "meditação", "meditation", "mbsr"],
    },

    # ============================================================
    # EXISTENCIAL
    # ============================================================
    {
        "id": "existential-frankl",
        "category": "Psicologia Existencial",
        "title": "Logoterapia — Viktor Frankl",
        "content": """Viktor Frankl (1905-1997) desenvolveu a Logoterapia ('terapia pelo significado') baseada em sua 
        experiência em campos de concentração nazistas. Três vias para encontrar significado: 1) Valores de 
        criação — realizar um trabalho ou tarefa; 2) Valores de experiência — vivenciar o amor, a beleza, a arte; 
        3) Valores de atitude — encontrar significado no sofrimento inevitável. O 'otimismo trágico' — capacidade 
        de manter esperança diante da tragédia. 'Quem tem um porquê viver suporta quase qualquer como' (Nietzsche, 
        citado por Frankl). O 'vácuo existencial' — sensação de falta de sentido, comum na sociedade moderna. 
        A liberdade última: escolher a própria atitude em qualquer circunstância.""",
        "references": "Frankl, V. (1946). Man's Search for Meaning. Beacon Press. | Frankl, V. (1959). The Doctor and the Soul.",
        "tags": ["frankl", "existencial", "existential", "logoterapia", "significado", "meaning", "sentido"],
    },
    {
        "id": "existential-yalom",
        "category": "Psicologia Existencial",
        "title": "Psicoterapia Existencial — Irvin Yalom",
        "content": """Irvin Yalom identifica quatro 'preocupações últimas' (ultimate concerns): 1) Morte — a consciência 
        da mortalidade pode levar à ansiedade ou à vitalidade; 2) Liberdade — com a liberdade vem a responsabilidade 
        e a 'angústia da escolha'; 3) Isolamento existencial — o abismo entre self e outros que nunca pode ser 
        completamente superado; 4) Falta de sentido — a busca por significado em um universo indiferente. Yalom 
        também desenvolveu conceitos de terapia de grupo e o poder do 'aqui-e-agora' na relação terapêutica. 
        Livro clássico: 'Love's Executioner' — contos de casos terapêuticos.""",
        "references": "Yalom, I.D. (1980). Existential Psychotherapy. Basic Books. | Yalom, I.D. (1989). Love's Executioner.",
        "tags": ["yalom", "existencial", "existential", "morte", "death", "liberdade", "freedom", "isolamento", "meaning"],
    },

    # ============================================================
    # TÉCNICAS TERAPÊUTICAS
    # ============================================================
    {
        "id": "breathing-478",
        "category": "Técnicas",
        "title": "Respiração 4-7-8 (Dr. Andrew Weil)",
        "content": """A respiração 4-7-8 é uma técnica de relaxamento que ativa o sistema nervoso parassimpático. 
        Como fazer: 1) Expire completamente pela boca; 2) Inspire pelo nariz contando até 4; 3) Segure a 
        respiração contando até 7; 4) Expire pela boca contando até 8 (com som de 'whoosh'); 5) Repita 4-8 
        vezes. Efeitos: reduz ansiedade, ajuda a adormecer, controla impulsos de raiva, diminui frequência 
        cardíaca. É um calmante natural para o sistema nervoso. Pode causar tontura leve no início — comece 
        com 3-4 ciclos.""",
        "references": "Weil, A. (2011). Spontaneous Happiness. Little, Brown and Company.",
        "tags": ["respiração", "breathing", "4-7-8", "weil", "relaxamento", "relaxation", "parassimpático"],
    },
    {
        "id": "breathing-box",
        "category": "Técnicas",
        "title": "Respiração em Caixa (Box Breathing)",
        "content": """A respiração em caixa (box breathing ou square breathing) é usada por Navy SEALs, atletas 
        e profissionais em situações de alto estresse. Como fazer: Inspire por 4 segundos → Segure por 4 
        segundos → Expire por 4 segundos → Segure vazio por 4 segundos. Repetir 4-8 vezes. Efeitos: regula 
        o sistema nervoso, melhora concentração, reduz estresse agudo, ajuda na preparação para situações 
        desafiadoras. A estrutura quadrada (4-4-4-4) cria um ritmo previsível que o cérebro acha calmante.""",
        "references": "US Navy SEAL stress control protocol.",
        "tags": ["box breathing", "caixa", "square", "respiracao", "respiração", "seal", "estresse"],
    },
    {
        "id": "grounding-54321",
        "category": "Técnicas",
        "title": "Técnica de Aterramento 5-4-3-2-1",
        "content": """A técnica 5-4-3-2-1 é um exercício de grounding que usa os sentidos para ancorar a pessoa 
        no presente durante momentos de ansiedade, pânico ou dissociação. Como fazer: 5 — OLHE ao redor e 
        nomeie 5 coisas que você vê; 4 — TOQUE 4 coisas ao seu redor (texturas, superfícies); 3 — ESCUTE 
        3 sons diferentes; 2 — SINTA 2 cheiros (ou lembre-se de 2); 1 — SINTA 1 sabor (ou tome um gole 
        d'água). Efeito imediato: interrompe o ciclo de pensamentos catastróficos e reconecta com o 
        ambiente físico. Baseia-se em princípios de mindfulness e dessensibilização.""",
        "references": "Linehan, M. (1993). Skills Training Manual for Treating Borderline Personality Disorder.",
        "tags": ["grounding", "aterramento", "54321", "ancoragem", "ansiedade", "anxiety", "crise", "crisis", "pânico", "panic"],
    },
    {
        "id": "grounding-cognitive",
        "category": "Técnicas",
        "title": "Aterramento Cognitivo",
        "content": """O aterramento cognitivo usa processos mentais para desviar o foco de pensamentos angustiantes. 
        Exercícios: 1) Nomeie todas as capitais da América do Sul; 2) Conte de 100 para trás em múltiplos de 7; 
        3) Recite o alfabeto ao contrário; 4) Nomeie animais para cada letra do alfabeto; 5) Descreva em 
        detalhes um cômodo familiar; 6) Faça uma conta matemática complexa (ex: 343 × 27); 7) Liste todas 
        as frutas vermelhas que conhece. Funciona porque ativa o córtex pré-frontal (função executiva) e 
        reduz a ativação da amígdala (centro de medo).""",
        "references": "Najavits, L. (2002). Seeking Safety: A Treatment Manual for PTSD and Substance Abuse.",
        "tags": ["grounding", "aterramento", "cognitivo", "cognitive", "distração", "distraction", "ansiedade"],
    },
    {
        "id": "mindfulness-rain",
        "category": "Técnicas",
        "title": "RAIN — Mindfulness para Emoções Difíceis",
        "content": """RAIN é uma técnica de mindfulness desenvolvida por Michele McDonald e popularizada por Tara Brach. 
        R — Recognize (Reconheça): note o que está presente (emoção, pensamento, sensação). A — Allow (Permita): 
        abra espaço para a experiência sem tentar mudá-la ou resistir. I — Investigate (Investigue): pergunte-se 
        'O que está acontecendo dentro de mim agora?' com curiosidade gentil. N — Nurture (Nutrir): ofereça 
        compaixão a si mesmo. Alternativamente: N — Non-Identification (Não-Identificação): veja que você não 
        é sua experiência. Eficaz para processar emoções intensas de forma saudável.""",
        "references": "Brach, T. (2003). Radical Acceptance. Bantam. | Brach, T. (2019). Radical Compassion.",
        "tags": ["rain", "mindfulness", "emoções", "emotions", "compaixão", "compassion", "tara brach", "aceitação"],
    },
    {
        "id": "mindfulness-body-scan",
        "category": "Técnicas",
        "title": "Body Scan — Varredura Corporal",
        "content": """Body scan é uma prática central do MBSR. Deitado ou sentado confortavelmente, traga atenção 
        sucessivamente para cada parte do corpo: pés → pernas → quadril → tronco → costas → mãos → braços 
        → ombros → pescoço → rosto → cabeça. Em cada área, note sensações (calor, tensão, formigamento, 
        contato) sem julgamento. Se a mente divagar, gentilmente traga de volta. Duração: 10-45 minutos. 
        Benefícios: redução de estresse, melhora do sono, aumento da consciência corporal, redução da 
        dor crônica. Evidência: Kabat-Zinn (1990) demonstrou redução de 50% na dor crônica após 8 semanas.""",
        "references": "Kabat-Zinn, J. (1990). Full Catastrophe Living. | Kabat-Zinn, J. (2013). Mindfulness for Beginners.",
        "tags": ["body scan", "varredura", "corporal", "mindfulness", "mbsr", "meditação", "corpo"],
    },
    {
        "id": "stoic-techniques",
        "category": "Técnicas",
        "title": "Técnicas Estoicas para Saúde Mental",
        "content": """O Estoicismo (Sêneca, Epicteto, Marco Aurélio) oferece ferramentas compatíveis com TCC moderna: 
        1) Dicotomia do controle — focar no que está sob seu controle (ações, pensamentos) e aceitar o que 
        não está; 2) Premeditatio malorum — visualizar adversidades antecipadamente para reduzir ansiedade; 
        3) Momento presente — 'O sofrimento vem da opinião, não da realidade' (Marco Aurélio); 4) Ação virtuosa 
        — perguntar 'O que é melhor fazer agora?'; 5) Memento mori — lembrar da finitude para valorizar a vida. 
        A TCC moderna (ReBT de Ellis) foi diretamente influenciada pelo Estoicismo: 'Não são os eventos que 
        nos perturbam, mas a interpretação que fazemos deles' (Epicteto).""",
        "references": "Aurélio, M. (c. 180). Meditations. | Epicteto (c. 125). Enchiridion. | Sêneca (c. 64). Letters on Ethics. | Robertson, D. (2019). How to Think Like a Roman Emperor.",
        "tags": ["estoicismo", "stoic", "sêneca", "marco aurélio", "epicteto", "tcc", "resiliência", "resilience"],
    },

    # ============================================================
    # TRANSTORNOS & CONDIÇÕES
    # ============================================================
    {
        "id": "anxiety-general",
        "category": "Transtornos",
        "title": "Ansiedade — Mecanismos e Intervenções",
        "content": """A ansiedade é uma resposta natural de 'luta ou fuga' que se torna problemática quando 
        desproporcional ou persistente. Base neurobiológica: amígdala hiperativa, córtex pré-frontal 
        hipoativo. Transtornos de ansiedade: GAD (preocupação excessiva), pânico (ataques súbitos), 
        fobias (medo específico), TAS (ansiedade social). Intervenções baseadas em evidências: 
        1) Psicoeducação sobre o ciclo da ansiedade; 2) Respiração diafragmática; 3) Exposição gradual 
        (hierarquia de medos); 4) Reestruturação cognitiva de pensamentos catastróficos; 5) Relaxamento 
        muscular progressivo; 6) Técnicas de tolerância ao sofrimento (DBT); 7) Ativação comportamental. 
        TCC tem eficácia comprovada (Fordham et al., 2021).""",
        "references": "Barlow, D.H. (2002). Anxiety and Its Disorders (2nd ed.). Guilford Press. | Craske, M.G. et al. (2017). 'What is an anxiety disorder?' FOCUS.",
        "tags": ["ansiedade", "anxiety", "pânico", "panic", "fobia", "phobia", "gad", "transtorno", "disorder"],
    },
    {
        "id": "depression-interventions",
        "category": "Transtornos",
        "title": "Depressão — Intervenções Baseadas em Evidências",
        "content": """A depressão (Transtorno Depressivo Maior) caracteriza-se por humor deprimido, perda de interesse 
        (anedonia), alterações no sono/apetite, fadiga, culpa, baixa concentração e ideação suicida. 
        Intervenções eficazes: 1) Ativação Comportamental — programar atividades prazerosas; 2) TCC — 
        reestruturar tríade cognitiva negativa (self, mundo, futuro); 3) MBCT — mindfulness para prevenir 
        recaída; 4) Exercício físico — tão eficaz quanto medicamento leve (estudo Blumenthal et al.); 
        5) Higiene do sono; 6) Suporte social; 7) Psicoterapia interpessoal. A TCC para depressão tem 
        tamanho de efeito grande (g = 0.71-1.02) em meta-análises.""",
        "references": "Beck, A.T. et al. (1979). Cognitive Therapy of Depression. | Segal, Z. et al. (2002). MBCT for Depression. | Blumenthal, J.A. et al. (1999). Archives of Internal Medicine.",
        "tags": ["depressão", "depression", "tristeza", "sadness", "anedonia", "tcc", "cbt", "mbct", "atividade"],
    },
    {
        "id": "trauma-ptsd",
        "category": "Transtornos",
        "title": "Trauma e TEPT — Abordagens Terapêuticas",
        "content": """O Transtorno de Estresse Pós-Traumático (TEPT) desenvolve-se após exposição a evento traumático. 
        Sintomas: revivência (flashbacks, pesadelos), evitação, alterações negativas no humor/cognição, 
        hipervigilância. Tratamentos baseados em evidências: 1) Terapia de Exposição Prolongada (PE — Foa) 
        — confrontar gradualmente memórias e situações evitadas; 2) EMDR (Shapiro) — dessensibilização 
        por movimentos oculares; 3) TCC focada em trauma — reestruturação de crenças pós-trauma; 
        4) Terapia Cognitivo-Processual (CPT — Resick); 5) Técnicas de grounding para flashbacks; 
        6) Estabilização emocional (DBT) antes do processamento do trauma.""",
        "references": "Foa, E.B. et al. (2007). Prolonged Exposure Therapy for PTSD. | Shapiro, F. (2001). EMDR: Basic Principles and Protocols. | Van der Kolk, B. (2014). The Body Keeps the Score.",
        "tags": ["trauma", "ptsd", "tept", "estresse", "stress", "exposição", "exposure", "emdr", "flashback"],
    },

    # ============================================================
    # BEM-ESTAR E RELACIONAMENTOS
    # ============================================================
    {
        "id": "emotional-intelligence",
        "category": "Bem-Estar",
        "title": "Inteligência Emocional",
        "content": """Inteligência Emocional (Goleman) é a capacidade de reconhecer, compreender e gerenciar 
        emoções próprias e alheias. Quatro pilares: 1) Autoconsciência — reconhecer emoções enquanto 
        ocorrem; 2) Autogestão — regular respostas emocionais; 3) Empatia — compreender emoções alheias; 
        4) Habilidades sociais — navegar relações. Técnicas: diário emocional, pausa antes de reagir, 
        validação de sentimentos, escuta ativa. Estudos mostram que IE é melhor preditora de sucesso 
        profissional que QI (Goleman, 1995). Programas de ensino socioemocional (SEL) melhoram resultados 
        acadêmicos e reduzem problemas comportamentais.""",
        "references": "Goleman, D. (1995). Emotional Intelligence. Bantam. | Brackett, M. (2019). Permission to Feel.",
        "tags": ["inteligência", "emocional", "emotional", "intelligence", "goleman", "empatia", "empathy", "autoconhecimento"],
    },
    {
        "id": "gratitude-practice",
        "category": "Bem-Estar",
        "title": "Prática de Gratidão — Evidências Científicas",
        "content": """A prática da gratidão é uma das intervenções mais estudadas em Psicologia Positiva. 
        Emmons & McCullough (2003) — participantes que escreveram 5 coisas pelas quais eram gratos 
        semanalmente reportaram mais otimismo, mais exercício físico e menos visitas ao médico. 
        Como praticar: 1) Diário de gratidão — escrever 3 coisas boas a cada dia; 2) Carta de gratidão 
        — escrever e entregar a alguém que fez diferença; 3) Visita de gratidão — ler a carta pessoalmente; 
        4) Momento de gratidão — pausa diária para apreciar algo simples. Efeitos: aumenta felicidade em 
        10-25%, melhora sono, reduz depressão, fortalece relacionamentos.""",
        "references": "Emmons, R.A. & McCullough, M.E. (2003). Journal of Personality and Social Psychology. | Seligman, M. et al. (2005). 'Positive psychology progress.' American Psychologist.",
        "tags": ["gratidão", "gratitude", "positiva", "positive", "diário", "journal", "felicidade", "happiness"],
    },
    {
        "id": "sleep-hygiene",
        "category": "Bem-Estar",
        "title": "Higiene do Sono — Intervenções Baseadas em Evidências",
        "content": """A higiene do sono é fundamental para a saúde mental. A TCC-i (TCC para Insônia) é o tratamento 
        de primeira linha para insônia crônica. Recomendações baseadas em evidências: 1) Horário regular 
        — dormir e acordar no mesmo horário (inclusive fins de semana); 2) Exposição à luz matinal (regula 
        ritmo circadiano); 3) Evitar telas 1h antes de dormir (luz azul inibe melatonina); 4) Ambiente 
        escuro, silencioso, fresco (18-20°C); 5) Sem cafeína após 14h; 6) Exercício regular (mas não 
        próximo ao sono); 7) Técnica de relaxamento antes de dormir (body scan, 4-7-8); 8) Se não dormir 
        em 20 min, levante-se e faça algo calmo até sentir sono (controle de estímulo).""",
        "references": "Edinger, J.D. & Carney, C.E. (2015). Overcoming Insomnia: A CBT-I Program. | Walker, M. (2017). Why We Sleep.",
        "tags": ["sono", "sleep", "insônia", "insomnia", "higiene", "hygiene", "tcc-i", "cbt-i", "melatonina"],
    },
    {
        "id": "communication-nonviolent",
        "category": "Bem-Estar",
        "title": "Comunicação Não-Violenta (CNV)",
        "content": """Desenvolvida por Marshall Rosenberg, a CNV é uma abordagem de comunicação que promove empatia 
        e resolução de conflitos. Quatro componentes: 1) Observação — descrever fatos sem julgamento 
        ('Quando você saiu sem avisar...'); 2) Sentimento — expressar emoção ('...me senti preocupado'); 
        3) Necessidade — identificar a necessidade não atendida ('...porque preciso de segurança emocional'); 
        4) Pedido — solicitar ação concreta ('Você poderia me avisar antes de sair na próxima vez?'). 
        A CNV reduz conflitos interpessoais e aumenta a qualidade dos relacionamentos.""",
        "references": "Rosenberg, M. (2003). Nonviolent Communication: A Language of Life. PuddleDancer Press.",
        "tags": ["cnv", "nv", "comunicação", "communication", "não-violenta", "nonviolent", "rosenberg", "conflito"],
    },
]
