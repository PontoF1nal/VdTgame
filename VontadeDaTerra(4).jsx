import { useState, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════
   TIPOS & RARIDADES
═══════════════════════════════════════════════ */
const TYPES = {
  ataque:     { label:"Ataque",     color:"#ff5533", glow:"rgba(255,85,51,0.6)",   grad:"linear-gradient(160deg,#3a0800,#8b1a00,#ff553318)", icon:"⚔️" },
  defesa:     { label:"Defesa",     color:"#22d3ee", glow:"rgba(34,211,238,0.6)",  grad:"linear-gradient(160deg,#001828,#00364a,#22d3ee18)", icon:"🛡️" },
  velocidade: { label:"Velocidade", color:"#4ade80", glow:"rgba(74,222,128,0.6)",  grad:"linear-gradient(160deg,#002010,#004820,#4ade8018)", icon:"💨" },
  estrategia: { label:"Estratégia", color:"#a78bfa", glow:"rgba(167,139,250,0.6)", grad:"linear-gradient(160deg,#0d0028,#1e0054,#a78bfa18)", icon:"🧠" },
  equilibrio: { label:"Equilíbrio", color:"#fbbf24", glow:"rgba(251,191,36,0.6)",  grad:"linear-gradient(160deg,#1a1000,#3d2800,#fbbf2418)", icon:"⚖️" },
  especial:   { label:"Especial",   color:"#f472b6", glow:"rgba(244,114,182,0.6)", grad:"linear-gradient(160deg,#200018,#480030,#f472b618)", icon:"✨" },
};

const RARITIES = {
  comum:    { label:"Comum",    color:"#9ca3af", border:"#6b7280" },
  rara:     { label:"Rara",     color:"#60a5fa", border:"#3b82f6" },
  epica:    { label:"Épica",    color:"#c084fc", border:"#a855f7" },
  lendaria: { label:"Lendária", color:"#fbbf24", border:"#f59e0b" },
};

/* ═══════════════════════════════════════════════
   TIPOS DE CARTA — DISTINÇÃO
   agente    → Personagens / seres com Vontade
   habilidade → Feitiços, técnicas e efeitos instantâneos
   terreno   → Modificam o campo / ambiente de batalha
   criatura  → Monstros e seres sem Vontade definida
═══════════════════════════════════════════════ */
const CARD_KINDS = {
  agente:     { label:"Agente",     color:"#fbbf24", icon:"👤", desc:"Personagem com Vontade própria. Possui atributos completos e passivas." },
  habilidade: { label:"Habilidade", color:"#c084fc", icon:"✦",  desc:"Efeito instantâneo ou técnica. Gasta Vontade ao ser ativada." },
  terreno:    { label:"Terreno",    color:"#4ade80", icon:"🌍",  desc:"Modifica o campo de batalha enquanto estiver ativo." },
  criatura:   { label:"Criatura",   color:"#ff7755", icon:"🐾",  desc:"Ser sem Vontade definida. Combate direto e habilidades instintivas." },
  item:       { label:"Item",       color:"#e2c97e", icon:"🎒",  desc:"Equipamento que pode ser equipado a um Agente em campo, modificando seus atributos permanentemente até ser destruído. Itens Exclusivos só podem ser equipados por Agentes específicos." },
};

/* ── SISTEMA DE ITENS ────────────────────────────────────────────────────
   Itens são equipados a Agentes em campo. Cada Agente pode carregar 1 item.
   Tipos de restrição:
     equipFor: "any_agent"             → qualquer Agente
     equipFor: "tipo:velocidade"       → apenas Agentes do tipo velocidade
     equipFor: "tipo:estrategia"       → apenas Agentes do tipo estratégia
     equipFor: "id:16"                 → apenas Yuji Vangroos (id específico)
     equipFor: "id:17"                 → apenas Jay Bunmi
   Efeitos dos itens aplicam-se enquanto equipados.
────────────────────────────────────────────────────────────────────────── */
function canEquip(item, targetCard) {
  if (!item.isItem) return false;
  if (targetCard.kind !== "agente") return false;
  if (!item.equipFor || item.equipFor === "any_agent") return true;
  if (item.equipFor.startsWith("tipo:")) return targetCard.tipo === item.equipFor.slice(5);
  if (item.equipFor.startsWith("id:")) return String(targetCard.id) === item.equipFor.slice(3);
  if (item.equipFor.startsWith("kind:")) return targetCard.kind === item.equipFor.slice(5);
  return false;
}

function applyItemStats(card) {
  // Returns card with item bonuses applied (non-mutating reference for display)
  if (!card.equippedItem) return card;
  const item = ALL_CARDS.find(c => c.id === card.equippedItem);
  if (!item || !item.itemEffect) return card;
  const e = item.itemEffect;
  return {
    ...card,
    atk:        card.atk + (e.atkBonus||0),
    def:        card.def + (e.defBonus||0),
    velocidade: (card.velocidade||5) + (e.velBonus||0),
    hp:         card.hp + (e.hpBonus||0),
    maxVigor:   (card.maxVigor||10) + (e.vigorBonus||0),
  };
}

/* ═══════════════════════════════════════════════
   CARTAS
═══════════════════════════════════════════════ */
const ALL_CARDS = [
  /* ── AGENTES ─────────────────────────────── */
  {
    id: 16, name:"Yuji Vangroos", kind:"agente",
    tipo:"equilibrio", emoji:"🦎", rarity:"lendaria",
    atk:6, def:10, vontade:5, hp:300,
    isCharacter:true,
    forca:6, resistencia:10, velocidade:8, inteligencia:15, vigor:20, vitalidade:300,
    espirito:"Camaleão", habilidadeVontade:"Fusão Espiritual",

    // Passiva base
    passiva:"Função de Sobrevivência",
    passivaDesc:"Quando o HP de Yuji cai abaixo de 50%, o \"Suporte à Vida\" se ativa automaticamente: +20% de Resistência passiva. Ele pode sobreviver a condições extremas — veneno, privação de oxigênio, dano em cadeia e efeitos adversos perdem potência.",
    passivaTrigger:"hp_below_half",
    passivaEffect:{ defBonus:0.20 },
    ability:"Suporte à Vida",

    // Stats e passiva da Fusão Espiritual do Camaleão
    fusionStats:{ forca:1, resistencia:1, velocidade:3, inteligencia:5, vigor:20, vitalidade:100,
                  atkBonus:3, defBonus:2, velBonus:3, hpBonus:100 },
    fusionPassiva:"Kata do Camaleão",
    fusionPassivaDesc:"Durante a Fusão Espiritual, todos os acertos do tipo Físico de Yuji são multiplicados por ×3. Inspirado no movimento repetido dos camaleões antes de caminhar — o contato físico ecoa três vezes no alvo.",

    desc:"Yuji Vangroos é membro do Time 5 da Central e protagonista de Vontade da Terra. Um ser artificial criado em um passado distante para conquistar planetas e galáxias — mas que acordou esquecido, com a mente pura de uma criança.",
    lore:"Fazendo parte do time responsável por cobrir qualquer função que esteja sobrecarregada, o Time 5 não tem um foco especial. Yuji não se destaca em seu time, mas conta com uma criatividade muito acentuada, agindo na maioria das vezes como suporte para seus companheiros de equipe.\n\nYuji é um ser artificial criado em um passado distante com o intuito de ser um novo marco na antiga humanidade. Criado para conquistar planetas, sistemas solares e galáxias, algo saiu dos planos e o corpo criado para conquistar ficou esquecido em um laboratório abandonado e danificado. Anos se passaram até que Yuji despertasse.\n\nSua idade mental é como a de uma criança, e por este motivo ele se apresenta como alguém confiável, educado, criativo e puro — fator que o contrasta bastante em relação aos seus companheiros.",
    isStarter:true,
  },


  /* ── JAY BUNMI ───────────────────────────── */
  {
    id: 17, name:"Jay Bunmi", kind:"agente",
    tipo:"velocidade", emoji:"⚡", rarity:"lendaria",
    atk:9, def:9, vontade:6, hp:280,
    isCharacter:true,
    forca:12, resistencia:12, velocidade:50, inteligencia:17, vigor:30, vitalidade:280,
    espirito:"Besouro-Tigre", habilidadeVontade:"Ponto Referencial",

    // Passiva — Flash Cego
    passiva:"Flash Cego",
    passivaDesc:"Quando Jay alcança alta velocidade, seus olhos e cérebro deixam de processar imagens em tempo real. Através de memória fotográfica e inteligência espacial anormal, Jay se orienta no espaço sem depender dos sentidos convencionais. Efeitos de cegueira, silêncio de sentidos, névoa, confusão ou qualquer debuff que afete visão e percepção são completamente ignorados. Jay age sempre antes de qualquer carta com Velocidade inferior à sua — e ninguém com Velocidade ≤ 30 pode esquivar de seus ataques.",
    passivaTrigger:"always",
    passivaEffect:{ immuneToBlind:true, immuneToSensoryDebuff:true, alwaysFirst:true, bypassDodgeBelow:30 },
    ability:"Inteligência Espacial",

    desc:"Jay Bunmi é o membro mais forte do Time 6 da Central. Especialista em missões de Captura, Escolta, Armadilha e Defesa. Sua velocidade assustadora combinada com inteligência espacial anormal o tornam um diferencial entre todos os agentes.",
    lore:`Fazendo parte do time responsável por missões de Captura, Escolta, Armadilha e Defesa, Jay se destaca por sua velocidade assustadora e sua inteligência espacial que combinadas em cenário de combate tornam Jay um diferencial dentre todos os agentes. Quando direcionado por Ramon Rondon, ambos formam uma dupla absurda em versatilidade.\n\nSua habilidade é tamanha que Ramon afirma que Jay é o coração do time — a ferramenta principal para a execução dos planos, e a carta na manga quando nem tudo sai como planejado.\n\n"Quando eu corro... É como se eu me lembrasse de cada detalhe. Eu posso sentir tudo sem ver nada."\n— Jay Bunmi`,
    isStarter:false,
  },
  /* ── CRIATURAS ────────────────────────────── */
  { id:0,  name:"Dragão Solar",        kind:"criatura", tipo:"ataque",     emoji:"🐉", rarity:"lendaria", atk:12, def:3,  vontade:8, hp:160,  velocidade:7, desc:"Ao entrar em campo, destrói todas as criaturas inimigas com DEF ≤ 3. Nascido do coração do sol, sua chama é inexorável.",    ability:"Destruição em Massa", passiva:null, passivaTrigger:null },
  { id:1,  name:"Guerreiro Raiz",       kind:"criatura", tipo:"ataque",     emoji:"🪵", rarity:"rara",     atk:7,  def:4,  vontade:5, hp:120,  velocidade:4, desc:"Cada turno que sobrevive ganha +1 de ATK permanentemente. Suas raízes furam qualquer armadura.",                             ability:"Crescimento",         passiva:null, passivaTrigger:"end_of_turn", passivaEffect:{atkBonus:1} },
  { id:2,  name:"Loba da Tempestade",   kind:"criatura", tipo:"ataque",     emoji:"🐺", rarity:"epica",    atk:9,  def:3,  vontade:6, hp:120,  velocidade:8, desc:"Ao atacar um alvo com menos HP que ela, causa 50% de dano extra. Feroz e implacável.",                                        ability:"Predadora",           passiva:null, passivaTrigger:"on_attack",   passivaEffect:{condBonusDmg:0.5} },
  { id:3,  name:"Tartaruga Colossal",   kind:"criatura", tipo:"defesa",     emoji:"🐢", rarity:"epica",    atk:3,  def:12, vontade:5, hp:280,  velocidade:2, desc:"Taunt — Força todas as criaturas inimigas a atacá-la primeiro. Seu casco resiste ao tempo.",                                  ability:"Taunt",               passiva:"Taunt", passivaTrigger:"always",      passivaEffect:{taunt:true} },
  { id:4,  name:"Rocha Viva",           kind:"criatura", tipo:"defesa",     emoji:"🪨", rarity:"rara",     atk:2,  def:9,  vontade:4, hp:200,  velocidade:1, desc:"Absorve o primeiro ataque de cada turno sem tomar dano. Imóvel como a montanha ancestral.",                                   ability:"Barreira",            passiva:"Barreira", passivaTrigger:"first_hit",   passivaEffect:{blockFirst:true} },
  { id:5,  name:"Carvalho Guardião",    kind:"criatura", tipo:"defesa",     emoji:"🌳", rarity:"comum",    atk:2,  def:7,  vontade:3, hp:180,  velocidade:1, desc:"Recupera 20 HP no início de cada turno. Raízes profundas nutrem sua vitalidade infinita.",                                    ability:"Regeneração",         passiva:"Regeneração", passivaTrigger:"start_of_turn", passivaEffect:{healPerTurn:20} },
  { id:6,  name:"Beija-Flor Relâmpago", kind:"criatura", tipo:"velocidade", emoji:"🐦", rarity:"epica",    atk:8,  def:2,  vontade:4, hp:100,  velocidade:16, desc:"Ataca duas vezes por turno por ser extremamente veloz. Tão rápido que os olhos mal conseguem rastrear seu movimento.",       ability:"Duplo Ataque",        passiva:"Duplo Ataque", passivaTrigger:"on_attack",   passivaEffect:{doubleAttack:true} },
  { id:7,  name:"Leopardo das Névoas",  kind:"criatura", tipo:"velocidade", emoji:"🐆", rarity:"rara",     atk:6,  def:3,  vontade:3, hp:120,  velocidade:12, desc:"Esquiva — 40% de chance de ignorar completamente qualquer ataque recebido. Fantasma da floresta.",                          ability:"Esquiva",             passiva:"Esquiva", passivaTrigger:"on_hit",      passivaEffect:{dodgeChance:0.4} },
  { id:8,  name:"Druida Estrategista",  kind:"agente",   tipo:"estrategia", emoji:"🧙", rarity:"epica",    atk:5,  def:5,  vontade:5, hp:140,  velocidade:5, desc:"Ao entrar em campo, compra 2 cartas extras. O conhecimento das eras ancestrais está em suas mãos.",                          ability:"Saber Antigo",        passiva:null, passivaTrigger:"on_enter" },
  { id:9,  name:"Coruja Sábia",         kind:"criatura", tipo:"estrategia", emoji:"🦉", rarity:"comum",    atk:3,  def:5,  vontade:3, hp:120,  velocidade:6, desc:"Revela a próxima carta do inimigo antes dele jogar, permitindo preparar a defesa perfeita.",                                 ability:"Previsão",            passiva:"Previsão", passivaTrigger:"always",      passivaEffect:{revealEnemy:true} },
  { id:10, name:"Fênix do Equilíbrio",  kind:"criatura", tipo:"equilibrio", emoji:"🦅", rarity:"lendaria", atk:8,  def:8,  vontade:7, hp:180,  velocidade:9, desc:"Ao ser destruída, renasce com metade do HP. O equilíbrio da natureza nunca pode ser quebrado.",                            ability:"Renascimento",        passiva:"Renascimento", passivaTrigger:"on_death",    passivaEffect:{reviveHalfHp:true} },
  { id:11, name:"Árvore Sagrada",       kind:"terreno",  tipo:"equilibrio", emoji:"🌲", rarity:"epica",    atk:5,  def:7,  vontade:6, hp:240,  velocidade:0, desc:"No início de cada turno, recupera 20 HP e concede 5 HP ao jogador aliado. Pilar do mundo natural.",                        ability:"Cura Vital",          passiva:"Cura Vital", passivaTrigger:"start_of_turn", passivaEffect:{healPerTurn:20, healPlayerPerTurn:5} },
  { id:12, name:"Fada Anciã",           kind:"agente",   tipo:"especial",   emoji:"🧚", rarity:"lendaria", atk:6,  def:6,  vontade:6, hp:140,  velocidade:10, desc:"Ao entrar em campo, silencia todas as criaturas inimigas por 1 turno — desativando suas passivas. Mistério eterno.",     ability:"Silêncio",            passiva:null, passivaTrigger:"on_enter",    passivaEffect:{silenceEnemy:1} },
  { id:13, name:"Cogumelo Mutante",     kind:"criatura", tipo:"especial",   emoji:"🍄", rarity:"rara",     atk:7,  def:4,  vontade:5, hp:120,  velocidade:4, desc:"Cada ataque aplica Veneno: o alvo perde 10 HP por turno durante 3 turnos. Toxina incontrolável.",                          ability:"Envenenar",           passiva:"Envenenar", passivaTrigger:"on_attack",   passivaEffect:{poison:{dmg:10,turns:3}} },
  { id:14, name:"Espírito da Floresta", kind:"criatura", tipo:"especial",   emoji:"🌿", rarity:"epica",    atk:4,  def:8,  vontade:5, hp:160,  velocidade:5, desc:"Quando uma criatura aliada é destruída, invoca um Broto (ATK 4/DEF 4/HP 80) para proteger o campo.",                       ability:"Invocar Broto",       passiva:"Invocar Broto", passivaTrigger:"ally_death",  passivaEffect:{summonBroto:true} },
  { id:15, name:"Urso Ancestral",       kind:"criatura", tipo:"ataque",     emoji:"🐻", rarity:"comum",    atk:6,  def:5,  vontade:4, hp:140,  velocidade:3, desc:"Entra em campo com Fúria: ganha +4 ATK no primeiro ataque de cada turno. Força bruta da natureza.",                        ability:"Fúria",               passiva:"Fúria", passivaTrigger:"first_attack_turn", passivaEffect:{furyBonus:4} },

  /* ── ITENS — Universais ────────────────────── */
  // Qualquer Agente pode equipar
  {
    id:30, name:"Amuleto das Raízes", kind:"item", tipo:"equilibrio", emoji:"🪬", rarity:"rara",
    atk:0, def:0, vontade:2, hp:1, velocidade:0,
    isItem:true, equipFor:"any_agent",
    itemEffect:{ defBonus:4, hpBonus:30, vigorBonus:3 },
    desc:"Um amuleto forjado com raízes ancestrais que envolve o portador com energia protetora. Enquanto equipado: DEF +4, HP +30, Vigor Máximo +3.",
    ability:"Proteção das Raízes",
  },
  {
    id:31, name:"Lâmina do Caçador", kind:"item", tipo:"ataque", emoji:"🗡️", rarity:"rara",
    atk:0, def:0, vontade:2, hp:1, velocidade:0,
    isItem:true, equipFor:"any_agent",
    itemEffect:{ atkBonus:5, velBonus:1 },
    desc:"Uma lâmina de obsidiana negra usada por caçadores ancestrais. Enquanto equipada: ATK +5, VEL +1.",
    ability:"Golpe Preciso",
  },
  {
    id:32, name:"Faixa de Concentração", kind:"item", tipo:"estrategia", emoji:"🎽", rarity:"comum",
    atk:0, def:0, vontade:1, hp:1, velocidade:0,
    isItem:true, equipFor:"any_agent",
    itemEffect:{ vigorBonus:6, atkBonus:1, defBonus:1 },
    desc:"Uma faixa de tecido imbuída de Vontade que aguça os sentidos. Enquanto equipada: Vigor Máximo +6, ATK +1, DEF +1.",
    ability:"Foco Total",
  },
  {
    id:33, name:"Elmo da Vontade", kind:"item", tipo:"equilibrio", emoji:"⛑️", rarity:"epica",
    atk:0, def:0, vontade:3, hp:1, velocidade:0,
    isItem:true, equipFor:"any_agent",
    itemEffect:{ defBonus:6, hpBonus:50, vigorBonus:5 },
    desc:"Um elmo forjado pela Vontade pura da terra. Enquanto equipado: DEF +6, HP +50, Vigor Máximo +5.",
    ability:"Vontade Inabalável",
  },
  {
    id:34, name:"Cristal de Alma", kind:"item", tipo:"especial", emoji:"💠", rarity:"lendaria",
    atk:0, def:0, vontade:4, hp:1, velocidade:0,
    isItem:true, equipFor:"any_agent",
    itemEffect:{ atkBonus:4, defBonus:4, hpBonus:40, velBonus:2, vigorBonus:8 },
    itemPassiva:"Ressonância",
    itemPassivaDesc:"O portador regenera +1 HP adicional por turno e +3 Vigor adicional por turno enquanto este item estiver equipado.",
    itemPassivaEffect:{ healPerTurn:1, vigorRegenBonus:3 },
    desc:"Um cristal de alma rara que ressoa com a Vontade do portador, amplificando todos os seus atributos. Enquanto equipado: todos os atributos +4~8, regeneração de HP e Vigor aumentada.",
    ability:"Ressonância de Alma",
  },

  /* ── ITENS — Exclusivos ─────────────────────── */
  // Exclusivos para tipo Velocidade
  {
    id:35, name:"Botas do Vento", kind:"item", tipo:"velocidade", emoji:"👟", rarity:"epica",
    atk:0, def:0, vontade:3, hp:1, velocidade:0,
    isItem:true, equipFor:"tipo:velocidade",
    itemEffect:{ velBonus:8, atkBonus:2, hpBonus:20 },
    itemPassiva:"Rajada",
    itemPassivaDesc:"O portador ataca sempre em primeiro lugar no turno, independentemente de qualquer outro modificador de velocidade.",
    itemPassivaEffect:{ alwaysFirst:true },
    desc:"Botas forjadas com penas de tempestade. Exclusivo para Agentes do tipo Velocidade. VEL +8, ATK +2, HP +20. Passiva: sempre age primeiro.",
    ability:"Rajada de Vento",
  },
  {
    id:36, name:"Colar do Besouro-Tigre", kind:"item", tipo:"velocidade", emoji:"🐯", rarity:"lendaria",
    atk:0, def:0, vontade:4, hp:1, velocidade:0,
    isItem:true, equipFor:"id:17",  // Exclusivo: Jay Bunmi
    itemEffect:{ velBonus:15, atkBonus:6, hpBonus:30, vigorBonus:10 },
    itemPassiva:"Frenesi do Besouro",
    itemPassivaDesc:"Enquanto equipado em Jay Bunmi: seus ataques ignoram DEF do alvo se a diferença de Velocidade for maior que 20. O limiar do [Flash Cego] para bypass de esquiva aumenta de 30 para 50.",
    itemPassivaEffect:{ jayIgnoreDefIfFasterBy:20, jayBypassDodgeUpgrade:50 },
    desc:"Um colar com o espírito do Besouro-Tigre, o animal espiritual de Jay. Exclusivo para Jay Bunmi. VEL +15, ATK +6, HP +30, Vigor +10. Potencializa o Flash Cego ao extremo.",
    ability:"Espírito do Besouro-Tigre",
  },
  // Exclusivo para tipo Estratégia
  {
    id:37, name:"Grimório Ancestral", kind:"item", tipo:"estrategia", emoji:"📚", rarity:"epica",
    atk:0, def:0, vontade:3, hp:1, velocidade:0,
    isItem:true, equipFor:"tipo:estrategia",
    itemEffect:{ atkBonus:3, defBonus:3, hpBonus:20, vigorBonus:6 },
    itemPassiva:"Saber Profundo",
    itemPassivaDesc:"Ao entrar em campo, compra 1 carta extra do deck. Ao usar qualquer habilidade ativa, reduz o custo em -2 Vigor (mínimo 1).",
    itemPassivaEffect:{ drawOnEnter:1, vigorCostReduce:2 },
    desc:"Um grimório carregado de conhecimento ancestral. Exclusivo para Agentes do tipo Estratégia. ATK+3, DEF+3, HP+20, Vigor+6. Reduz custo de habilidades em 2 Vigor.",
    ability:"Saber Profundo",
  },
  // Exclusivo para Yuji Vangroos
  {
    id:38, name:"Manto do Camaleão", kind:"item", tipo:"equilibrio", emoji:"🦎", rarity:"lendaria",
    atk:0, def:0, vontade:4, hp:1, velocidade:0,
    isItem:true, equipFor:"id:16",  // Exclusivo: Yuji Vangroos
    itemEffect:{ defBonus:8, hpBonus:60, velBonus:3, vigorBonus:10 },
    itemPassiva:"Pele Iridescente",
    itemPassivaDesc:"Enquanto equipado em Yuji: o bônus de DEF do [Suporte à Vida] aumenta de +20% para +40%. A [Fusão Espiritual do Camaleão] dura 2 turnos extras e o multiplicador do [Kata do Camaleão] passa de ×3 para ×4.",
    itemPassivaEffect:{ yujiDefBonusUpgrade:0.40, fusionDurationBonus:2, kataMultiplierUpgrade:4 },
    desc:"Um manto vivo tecido com a pele de camaleões ancestrais. Exclusivo para Yuji Vangroos. DEF+8, HP+60, VEL+3, Vigor+10. Potencializa todas as habilidades do Camaleão.",
    ability:"Pele Iridescente",
  },
  // Exclusivo para Agentes tipo Equilíbrio
  {
    id:39, name:"Selos do Equilíbrio", kind:"item", tipo:"equilibrio", emoji:"☯️", rarity:"epica",
    atk:0, def:0, vontade:3, hp:1, velocidade:0,
    isItem:true, equipFor:"tipo:equilibrio",
    itemEffect:{ atkBonus:4, defBonus:4, hpBonus:35, vigorBonus:5 },
    itemPassiva:"Harmonia Dual",
    itemPassivaDesc:"Quando o portador causa dano a um inimigo, recupera HP igual a 30% do dano causado. O equilíbrio entre ataque e cura define a natureza deste item.",
    itemPassivaEffect:{ lifeSteal:0.30 },
    desc:"Selos gravados com runas do equilíbrio ancestral. Exclusivo para Agentes do tipo Equilíbrio. ATK+4, DEF+4, HP+35. Passiva: Life Steal de 30% de todo dano causado.",
    ability:"Harmonia Dual",
  },

  /* ── CONSUMÍVEIS — Vigor ─────────────────── */
  { id:20, name:"Erva do Vigor",     kind:"habilidade", tipo:"especial", emoji:"🌿", rarity:"comum",   atk:0, def:0, vontade:1, hp:1, velocidade:0,
    isConsumable:true, consumeEffect:{ type:"vigor_self", value:6 },
    desc:"Ao jogar, restaura 6 pontos de Vigor da carta com menos Vigor em campo. Planta medicinal encontrada nas margens da floresta ancestral.", ability:"Restaurar Vigor" },
  { id:21, name:"Cristal de Vontade", kind:"habilidade", tipo:"especial", emoji:"💎", rarity:"rara",   atk:0, def:0, vontade:0, hp:1, velocidade:0,
    isConsumable:true, consumeEffect:{ type:"vigor_all", value:4 },
    desc:"Ao jogar, restaura 4 pontos de Vigor a todas as cartas aliadas em campo. Cristais formados pela concentração de Vontade pura da terra.", ability:"Restaurar Vigor Total" },
  { id:22, name:"Suco de Força",     kind:"habilidade", tipo:"ataque",   emoji:"🍵", rarity:"comum",   atk:0, def:0, vontade:2, hp:1, velocidade:0,
    isConsumable:true, consumeEffect:{ type:"vigor_and_atk", vigorVal:5, atkVal:2, duration:2 },
    desc:"Ao jogar, restaura 5 Vigor e concede +2 ATK por 2 turnos à carta aliada com menor HP em campo. Extrato de raízes da floresta profunda.", ability:"Potência Imediata" },
  { id:23, name:"Elixir Ancestral",  kind:"habilidade", tipo:"equilibrio", emoji:"⚗️", rarity:"epica",  atk:0, def:0, vontade:3, hp:1, velocidade:0,
    isConsumable:true, consumeEffect:{ type:"vigor_max_up", value:5 },
    desc:"Ao jogar, aumenta permanentemente o Vigor Máximo de uma carta aliada em campo em +5 e restaura todo o Vigor dela. Preparado pelos druidas mais antigos.", ability:"Despertar de Vigor" },
];

const PACKS = [
  { id:"basic",    name:"Pacote da Floresta", desc:"5 cartas aleatórias. Garante ao menos 1 Rara.",          price:200,  art:"📦", rarity:"rara",     color:"#4ade80", cardsCount:5 },
  { id:"premium",  name:"Pacote Ancestral",   desc:"4 cartas. Garante ao menos 1 Épica.",                    price:400,  art:"🎁", rarity:"epica",    color:"#c084fc", cardsCount:4 },
  { id:"legend",   name:"Pacote Lendário",    desc:"3 cartas. Garante 1 Lendária.",                          price:800,  art:"👑", rarity:"lendaria", color:"#fbbf24", cardsCount:3 },
  { id:"gems500",  name:"500 Gemas",          desc:"Carregue sua bolsa com 500 gemas para abrir pacotes.",   price:4.99, art:"💎", isGems:true, gemsVal:500,  color:"#67e8f9" },
  { id:"gems1500", name:"1500 Gemas",         desc:"Melhor custo! 1500 gemas + 200 de bônus.",               price:9.99, art:"💎", isGems:true, gemsVal:1700, color:"#fbbf24" },
];

/* ═══════════════════════════════════════════════
   HABILIDADES ATIVAS — sistema de skills
   Cada skill tem:
     id, name, icon, desc, vigorCost, cooldown (turnos),
     effect: tipo da ação (heal, dmg, buff, debuff, summon...)
═══════════════════════════════════════════════ */
const SKILLS = {
  // ── YUJI VANGROOS ─────────────────────────────
  // Habilidade de Vontade — Transformação completa
  yuji_fusion: {
    id:"yuji_fusion", name:"Fusão Espiritual", icon:"🦎",
    isVontadeSkill: true,
    desc:"Yuji funde sua essência com o espírito do Camaleão. Por 4 turnos: Força+1, Resistência+1, Velocidade+3, Inteligência+5, Vigor+20, HP+100. Ativa a passiva Kata do Camaleão — todos os acertos Físicos são multiplicados por ×3.",
    vigorCost:15, cooldown:8,
    effect:{ type:"spirit_fusion", duration:4,
      statBoosts:{ atkBonus:3, defBonus:2, velBonus:3, hpBonus:100, vigorBonus:20 },
      passiva:"kata_camaleon" },
  },
  // Técnica de Camuflagem — Furtividade real
  yuji_furtividade: {
    id:"yuji_furtividade", name:"Técnica de Camuflagem", icon:"🫥",
    desc:"Yuji reorganiza as células iridóforas de sua pele, alterando como a luz se reflete nele. Entra em estado de Furtividade: torna-se indetectável e não pode ser alvo de ataques enquanto o estado persistir. Efeitos que envolvam olfato, audição aguçada ou técnicas de comunhão podem detectá-lo e remover a Furtividade.",
    vigorCost:8, cooldown:5,
    effect:{ type:"stealth_enter", duration:3, detectBreakers:["olfato","audicao","comunhao"] },
  },
  // Skills de suporte
  yuji_regen_surge: {
    id:"yuji_regen_surge", name:"Pulso de Regeneração", icon:"💚",
    desc:"O Suporte à Vida de Yuji entra em overdrive: as células de reparação se ativam em massa, recuperando 40 HP imediatamente.",
    vigorCost:5, cooldown:3,
    effect:{ type:"heal", value:40, target:"self" },
  },
  yuji_adapt: {
    id:"yuji_adapt", name:"Mimetismo Estrutural", icon:"🎨",
    desc:"Yuji reorienta suas camadas de células iridóforas superiores, copiando a estrutura defensiva de um aliado em campo. Ganha +4 DEF por 3 turnos.",
    vigorCost:4, cooldown:3,
    effect:{ type:"buff_def", value:4, duration:3, target:"self" },
  },


  // ── JAY BUNMI ────────────────────────────────
  // Habilidade de Vontade
  jay_ponto_referencial: {
    id:"jay_ponto_referencial", name:"Ponto Referencial", icon:"📍",
    isVontadeSkill: true,
    desc:"Jay mapeia o campo de batalha inteiro em frações de segundo. Por 3 turnos: todos os seus ataques ignoram Esquiva e Furtividade, sua Velocidade aumenta em +20, e ele pode atacar dois alvos por turno (escolhe o mais fraco e o mais forte simultaneamente).",
    vigorCost:18, cooldown:7,
    effect:{ type:"ponto_referencial", duration:3,
      statBoosts:{ velBonus:20 },
      ignoresDodge:true, ignoresStealth:true, doubleTarget:true },
  },
  // Habilidades ativas
  jay_corrida_relampago: {
    id:"jay_corrida_relampago", name:"Corrida Relâmpago", icon:"💨",
    desc:"Jay percorre o campo numa fração de segundo e golpeia o inimigo mais rápido antes que qualquer reação seja possível. Causa dano = 2× Velocidade de Jay (ignora DEF completamente).",
    vigorCost:10, cooldown:4,
    effect:{ type:"velocity_strike" },
  },
  jay_espaco_memorizado: {
    id:"jay_espaco_memorizado", name:"Espaço Memorizado", icon:"🧠",
    desc:"Jay usa sua memória fotográfica para prever a próxima ação inimiga. No próximo ataque recebido, Jay esquiva automaticamente (100%) e contra-ataca causando seu ATK base como dano.",
    vigorCost:8, cooldown:4,
    effect:{ type:"predict_dodge", counterDmg:"atk" },
  },
  jay_campo_minado: {
    id:"jay_campo_minado", name:"Campo Minado", icon:"💥",
    desc:"Jay usa sua velocidade para posicionar armadilhas instantaneamente. Todos os inimigos que atacarem no próximo turno recebem 15 de dano adicional ao atacar.",
    vigorCost:9, cooldown:4,
    effect:{ type:"minefield", dmg:15, duration:1 },
  },
  jay_pique_pega: {
    id:"jay_pique_pega", name:"Pique-Pega", icon:"🎯",
    desc:"Jay move-se na velocidade do vento provocando todos os inimigos. Por 1 turno: todas as cartas inimigas são forçadas a mirar apenas Jay. Jay ganha 60% de chance de esquiva. Efeitos de dano em área ignoram este efeito.",
    vigorCost:8, cooldown:4,
    effect:{ type:"pique_pega", dodgeChance:0.60, duration:1, forceTaunt:true },
  },
  jay_punho_cego: {
    id:"jay_punho_cego", name:"Punho Cego", icon:"👊",
    desc:"Jay ataca às cegas usando sua memória espacial — sem ver, mas sentindo tudo. Dano = 3 + ⌊(2/3 × Velocidade atual de Jay)⌋. Ignora DEF completamente. Não pode ser esquivado.",
    vigorCost:7, cooldown:3,
    effect:{ type:"punho_cego" },
  },

  // ── DRAGÃO SOLAR ──────────────────────────────
  dragao_chama: {
    id:"dragao_chama", name:"Chama Solar", icon:"🔥",
    desc:"Dispara uma chama concentrada em um inimigo: 18 de dano direto, ignorando DEF.",
    vigorCost:7, cooldown:3,
    effect:{ type:"direct_dmg", value:18, ignoresDef:true },
  },
  dragao_aura: {
    id:"dragao_aura", name:"Aura Ígnea", icon:"☀️",
    desc:"Envolve o campo em chamas. Todos os inimigos perdem 5 HP no início do próximo turno.",
    vigorCost:5, cooldown:4,
    effect:{ type:"aoe_burn", value:5, duration:1 },
  },

  // ── GUERREIRO RAIZ ────────────────────────────
  raiz_espinhos: {
    id:"raiz_espinhos", name:"Espinhos de Madeira", icon:"🌵",
    desc:"Envolve o corpo com espinhos. Qualquer ataque recebido devolve 3 de dano ao atacante por 2 turnos.",
    vigorCost:4, cooldown:3,
    effect:{ type:"thorns", value:3, duration:2 },
  },
  raiz_golpe: {
    id:"raiz_golpe", name:"Golpe Enraizado", icon:"🪵",
    desc:"Golpe com raízes endurecidas: ATK+5 no próximo ataque.",
    vigorCost:3, cooldown:2,
    effect:{ type:"empower_attack", value:5, duration:1 },
  },

  // ── LOBA DA TEMPESTADE ────────────────────────
  loba_uivo: {
    id:"loba_uivo", name:"Uivo da Tempestade", icon:"🌩️",
    desc:"O uivo aterroriza os inimigos. Todos os adversários perdem -2 ATK por 2 turnos.",
    vigorCost:5, cooldown:3,
    effect:{ type:"debuff_atk", value:-2, duration:2, target:"all_enemies" },
  },
  loba_rasgo: {
    id:"loba_rasgo", name:"Rasgo Relampejante", icon:"⚡",
    desc:"Ataque súbito em alta velocidade. Causa 12 de dano e aplica sangramento: 4 HP/turno por 3 turnos.",
    vigorCost:6, cooldown:3,
    effect:{ type:"dmg_bleed", dmg:12, bleed:{ value:4, turns:3 } },
  },

  // ── TARTARUGA COLOSSAL ────────────────────────
  tartaruga_casca: {
    id:"tartaruga_casca", name:"Casca Absoluta", icon:"🐚",
    desc:"Retrai-se completamente na casca. Reduz todo dano recebido em 70% por 1 turno.",
    vigorCost:6, cooldown:4,
    effect:{ type:"damage_reduction", value:0.70, duration:1 },
  },
  tartaruga_colidir: {
    id:"tartaruga_colidir", name:"Colisão Colossal", icon:"💥",
    desc:"Usa o peso massivo para esmagar um inimigo. Causa dano igual ao próprio DEF atual.",
    vigorCost:5, cooldown:3,
    effect:{ type:"def_as_dmg" },
  },

  // ── LEOPARDO DAS NÉVOAS ───────────────────────
  leopardo_sombra: {
    id:"leopardo_sombra", name:"Golpe das Sombras", icon:"🌑",
    desc:"Ataca de dentro da névoa, causando 14 de dano. Se esquivar, ataca novamente.",
    vigorCost:5, cooldown:3,
    effect:{ type:"shadow_strike", dmg:14 },
  },
  leopardo_marca: {
    id:"leopardo_marca", name:"Marca da Presa", icon:"🎯",
    desc:"Marca um inimigo: todos os ataques contra ele causam +4 de dano por 3 turnos.",
    vigorCost:4, cooldown:3,
    effect:{ type:"mark", bonus:4, duration:3 },
  },

  // ── DRUIDA ESTRATEGISTA ───────────────────────
  druida_concentrar: {
    id:"druida_concentrar", name:"Foco Ancestral", icon:"🌀",
    desc:"Concentra toda a sabedoria das eras. Recupera 2 pontos de Vontade imediatamente.",
    vigorCost:4, cooldown:3,
    effect:{ type:"restore_vontade", value:2 },
  },
  druida_barreira: {
    id:"druida_barreira", name:"Barreira Rúnica", icon:"🔮",
    desc:"Conjura uma barreira mágica. Uma criatura aliada escolhida ganha +6 DEF por 2 turnos.",
    vigorCost:5, cooldown:3,
    effect:{ type:"buff_def", value:6, duration:2, target:"ally" },
  },

  // ── FÊNIX DO EQUILÍBRIO ───────────────────────
  fenix_chama: {
    id:"fenix_chama", name:"Chama do Equilíbrio", icon:"🔥",
    desc:"Libera uma chama de equilíbrio que causa 10 de dano a todos os inimigos em campo.",
    vigorCost:6, cooldown:4,
    effect:{ type:"aoe_dmg", value:10 },
  },
  fenix_bencao: {
    id:"fenix_bencao", name:"Bênção da Fênix", icon:"✨",
    desc:"Transfere energia vital para uma criatura aliada, curando 30 HP dela.",
    vigorCost:5, cooldown:3,
    effect:{ type:"heal_ally", value:30 },
  },

  // ── FADA ANCIÃ ────────────────────────────────
  fada_encanto: {
    id:"fada_encanto", name:"Encantamento Senil", icon:"🌸",
    desc:"Encanta um inimigo que perde sua próxima ação — fica paralisado por 1 turno.",
    vigorCost:7, cooldown:4,
    effect:{ type:"stun", duration:1 },
  },
  fada_cura: {
    id:"fada_cura", name:"Cura das Fadas", icon:"💖",
    desc:"Dispersa poeira de fada pelo campo aliado. Todos os aliados recuperam 15 HP.",
    vigorCost:5, cooldown:3,
    effect:{ type:"heal_all_allies", value:15 },
  },

  // ── BEIJA-FLOR RELÂMPAGO ──────────────────────
  beija_turbilhao: {
    id:"beija_turbilhao", name:"Turbilhão de Asas", icon:"🌪️",
    desc:"Gira em velocidade máxima. Atinge todos os inimigos por 6 de dano cada.",
    vigorCost:6, cooldown:3,
    effect:{ type:"aoe_dmg", value:6 },
  },
  beija_velocidade: {
    id:"beija_velocidade", name:"Supercarga Relampejante", icon:"⚡",
    desc:"Velocidade extrema: +6 de Velocidade por 2 turnos, garantindo sempre o primeiro ataque.",
    vigorCost:4, cooldown:3,
    effect:{ type:"buff_vel", value:6, duration:2 },
  },

  // ── URSO ANCESTRAL ────────────────────────────
  urso_rugido: {
    id:"urso_rugido", name:"Rugido Ancestral", icon:"🐻",
    desc:"Rugido que abala o campo. Todos os inimigos perdem -3 ATK e ficam com medo por 1 turno.",
    vigorCost:5, cooldown:3,
    effect:{ type:"fear", atkDebuff:-3, duration:1, target:"all_enemies" },
  },
  urso_slam: {
    id:"urso_slam", name:"Slam da Terra", icon:"👊",
    desc:"Golpe devastador no solo: causa 2× ATK de dano em um único inimigo.",
    vigorCost:6, cooldown:3,
    effect:{ type:"double_atk_dmg" },
  },

  // ── CORUJA SÁBIA ──────────────────────────────
  coruja_sabedoria: {
    id:"coruja_sabedoria", name:"Dom da Sabedoria", icon:"📖",
    desc:"Analisa o campo inimigo e revela os pontos fracos. Todos os aliados ganham +3 ATK por 2 turnos.",
    vigorCost:4, cooldown:3,
    effect:{ type:"buff_atk_all_allies", value:3, duration:2 },
  },
  coruja_prever: {
    id:"coruja_prever", name:"Prever o Inevitável", icon:"🔭",
    desc:"Prevê o próximo ataque inimigo e garante esquiva total para uma criatura aliada neste turno.",
    vigorCost:3, cooldown:2,
    effect:{ type:"grant_dodge", duration:1, target:"ally" },
  },

  // ── COGUMELO MUTANTE ──────────────────────────
  cogumelo_espora: {
    id:"cogumelo_espora", name:"Nuvem de Esporos", icon:"🍄",
    desc:"Libera esporos tóxicos. Todos os inimigos recebem veneno por 3 turnos (6 HP/turno).",
    vigorCost:6, cooldown:4,
    effect:{ type:"aoe_poison", dmg:6, turns:3 },
  },
  cogumelo_mutacao: {
    id:"cogumelo_mutacao", name:"Mutação Acelerada", icon:"🧬",
    desc:"Acelera a mutação: ganha +4 ATK e +2 DEF permanentemente, mas perde 15 HP.",
    vigorCost:7, cooldown:5,
    effect:{ type:"mutate", atkBonus:4, defBonus:2, hpCost:15 },
  },

  // ── ESPÍRITO DA FLORESTA ──────────────────────
  espirito_cura: {
    id:"espirito_cura", name:"Toque da Floresta", icon:"🌿",
    desc:"Canaliza a energia da floresta. Cura 25 HP do aliado com menos HP em campo.",
    vigorCost:5, cooldown:3,
    effect:{ type:"heal_lowest_ally", value:25 },
  },
  espirito_crescer: {
    id:"espirito_crescer", name:"Raízes Vivas", icon:"🌱",
    desc:"Cria raízes que prendem um inimigo. Ele não pode atacar no próximo turno.",
    vigorCost:6, cooldown:4,
    effect:{ type:"root", duration:1 },
  },

  // ── ÁRVORE SAGRADA ────────────────────────────
  arvore_bencao: {
    id:"arvore_bencao", name:"Bênção da Árvore", icon:"🌲",
    desc:"A Árvore canaliza energia sagrada. Todos os aliados recuperam 20 HP e ganham +2 DEF por 1 turno.",
    vigorCost:7, cooldown:4,
    effect:{ type:"heal_buff_all_allies", healVal:20, defVal:2, duration:1 },
  },
  arvore_raizes: {
    id:"arvore_raizes", name:"Rede de Raízes", icon:"🕸️",
    desc:"Raízes gigantes emergem do solo e prendem todos os inimigos por 1 turno, impedindo ataques.",
    vigorCost:8, cooldown:5,
    effect:{ type:"root_all_enemies", duration:1 },
  },

  // ── ROCHA VIVA ────────────────────────────────
  rocha_terraformar: {
    id:"rocha_terraformar", name:"Terraformar", icon:"⛰️",
    desc:"Levanta uma muralha de pedra. O próximo aliado a entrar em campo ganha +8 DEF permanentemente.",
    vigorCost:5, cooldown:4,
    effect:{ type:"next_ally_def_bonus", value:8 },
  },
  rocha_esmagar: {
    id:"rocha_esmagar", name:"Esmagar", icon:"🪨",
    desc:"Usa o peso imenso para esmagar um inimigo: causa dano fixo de 16, ignorando esquiva.",
    vigorCost:5, cooldown:3,
    effect:{ type:"direct_dmg", value:16, ignoresDodge:true },
  },

  // ── CARVALHO GUARDIÃO ─────────────────────────
  carvalho_protetor: {
    id:"carvalho_protetor", name:"Escudo do Carvalho", icon:"🛡️",
    desc:"Estende seus galhos para proteger um aliado. Absorve o próximo ataque direcionado a ele.",
    vigorCost:4, cooldown:3,
    effect:{ type:"shield_ally" },
  },
  carvalho_absorver: {
    id:"carvalho_absorver", name:"Raízes Nutrientes", icon:"💧",
    desc:"As raízes profundas liberam energia. Cura 10 HP a todos os aliados por 2 turnos.",
    vigorCost:5, cooldown:3,
    effect:{ type:"regen_all_allies", value:10, duration:2 },
  },
};

// Mapeamento: id da carta → lista de skill ids
const CARD_SKILLS = {
  16: ["yuji_fusion","yuji_furtividade","yuji_regen_surge","yuji_adapt"],  // Yuji
  0:  ["dragao_chama","dragao_aura"],                                 // Dragão Solar
  1:  ["raiz_espinhos","raiz_golpe"],                                 // Guerreiro Raiz
  2:  ["loba_uivo","loba_rasgo"],                                     // Loba da Tempestade
  3:  ["tartaruga_casca","tartaruga_colidir"],                        // Tartaruga Colossal
  4:  ["rocha_terraformar","rocha_esmagar"],                          // Rocha Viva
  5:  ["carvalho_protetor","carvalho_absorver"],                      // Carvalho Guardião
  6:  ["beija_turbilhao","beija_velocidade"],                         // Beija-Flor Relâmpago
  7:  ["leopardo_sombra","leopardo_marca"],                           // Leopardo das Névoas
  8:  ["druida_concentrar","druida_barreira"],                        // Druida Estrategista
  9:  ["coruja_sabedoria","coruja_prever"],                           // Coruja Sábia
  10: ["fenix_chama","fenix_bencao"],                                 // Fênix do Equilíbrio
  11: ["arvore_bencao","arvore_raizes"],                              // Árvore Sagrada
  12: ["fada_encanto","fada_cura"],                                   // Fada Anciã
  13: ["cogumelo_espora","cogumelo_mutacao"],                         // Cogumelo Mutante
  14: ["espirito_cura","espirito_crescer"],                           // Espírito da Floresta
  15: ["urso_rugido","urso_slam"],                                    // Urso Ancestral
  17: ["jay_ponto_referencial","jay_corrida_relampago","jay_espaco_memorizado","jay_campo_minado","jay_pique_pega","jay_punho_cego"], // Jay Bunmi
};

/* ═══════════════════════════════════════════════
   ILUSTRAÇÕES SVG — compactas por tipo/elemento
═══════════════════════════════════════════════ */
const CARD_SVG = {
  // Por tipo de elemento — retorna SVG string
  ataque:     (c) => `<svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bg_a" cx="50%" cy="50%"><stop offset="0%" stop-color="${c}" stop-opacity=".3"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient></defs><rect width="120" height="160" fill="url(#bg_a)"/><path d="M60,20 L90,100 L60,80 L30,100Z" fill="${c}" opacity=".6"/><path d="M55,95 L65,95 L68,140 L52,140Z" fill="${c}" opacity=".5"/><circle cx="60" cy="20" r="8" fill="${c}" opacity=".8"/><path d="M25,65 L45,55 M75,55 L95,65" stroke="${c}" stroke-width="1.5" opacity=".4"/><circle cx="60" cy="20" r="14" fill="none" stroke="${c}" stroke-width=".8" opacity=".3"/></svg>`,
  defesa:     (c) => `<svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bg_d" cx="50%" cy="50%"><stop offset="0%" stop-color="${c}" stop-opacity=".3"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient></defs><rect width="120" height="160" fill="url(#bg_d)"/><path d="M60,18 L95,35 L95,80 Q95,120 60,140 Q25,120 25,80 L25,35Z" fill="${c}" opacity=".15" stroke="${c}" stroke-width="1.5"/><path d="M60,32 L83,46 L83,78 Q83,108 60,124 Q37,108 37,78 L37,46Z" fill="${c}" opacity=".1" stroke="${c}" stroke-width="1"/><path d="M48,78 L58,88 L78,62" stroke="${c}" stroke-width="2.5" fill="none" opacity=".8" stroke-linecap="round"/></svg>`,
  velocidade: (c) => `<svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg_v" x1="0%" y1="50%" x2="100%" y2="50%"><stop offset="0%" stop-color="${c}" stop-opacity="0"/><stop offset="50%" stop-color="${c}" stop-opacity=".3"/><stop offset="100%" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><rect width="120" height="160" fill="url(#bg_v)"/><path d="M10,50 L80,50 L65,35 M80,50 L65,65" stroke="${c}" stroke-width="2" fill="none" opacity=".7"/><path d="M5,80 L90,80 L75,65 M90,80 L75,95" stroke="${c}" stroke-width="2.5" fill="none" opacity=".9"/><path d="M15,110 L75,110 L60,95 M75,110 L60,125" stroke="${c}" stroke-width="1.5" fill="none" opacity=".5"/><circle cx="95" cy="80" r="12" fill="${c}" opacity=".3" stroke="${c}" stroke-width="1.2"/><path d="M90,80 L100,80 M95,75 L95,85" stroke="${c}" stroke-width="2" opacity=".8"/></svg>`,
  estrategia: (c) => `<svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bg_e" cx="50%" cy="50%"><stop offset="0%" stop-color="${c}" stop-opacity=".25"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient></defs><rect width="120" height="160" fill="url(#bg_e)"/><circle cx="60" cy="70" r="38" fill="none" stroke="${c}" stroke-width=".8" opacity=".4"/><circle cx="60" cy="70" r="26" fill="none" stroke="${c}" stroke-width=".6" opacity=".3" stroke-dasharray="4,6"/><circle cx="60" cy="70" r="12" fill="${c}" opacity=".15" stroke="${c}" stroke-width="1.2"/><line x1="22" y1="70" x2="98" y2="70" stroke="${c}" stroke-width=".7" opacity=".3"/><line x1="60" y1="32" x2="60" y2="108" stroke="${c}" stroke-width=".7" opacity=".3"/><circle cx="60" cy="30" r="5" fill="${c}" opacity=".7"/><circle cx="60" cy="110" r="5" fill="${c}" opacity=".7"/><circle cx="22" cy="70" r="5" fill="${c}" opacity=".7"/><circle cx="98" cy="70" r="5" fill="${c}" opacity=".7"/></svg>`,
  equilibrio: (c) => `<svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bg_eq" cx="50%" cy="50%"><stop offset="0%" stop-color="${c}" stop-opacity=".3"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient></defs><rect width="120" height="160" fill="url(#bg_eq)"/><path d="M60,20 L100,130 L20,130Z" fill="none" stroke="${c}" stroke-width="1.5" opacity=".5"/><path d="M60,140 L20,30 L100,30Z" fill="none" stroke="${c}" stroke-width="1.5" opacity=".4"/><circle cx="60" cy="80" r="18" fill="${c}" opacity=".12" stroke="${c}" stroke-width="1.5"/><circle cx="60" cy="80" r="6" fill="${c}" opacity=".6"/><circle cx="60" cy="80" r="28" fill="none" stroke="${c}" stroke-width=".6" opacity=".2" stroke-dasharray="3,5"/></svg>`,
  item:       (c) => `<svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bg_itm" cx="50%" cy="45%"><stop offset="0%" stop-color="${c}" stop-opacity=".3"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient></defs><rect width="120" height="160" fill="url(#bg_itm)"/><rect x="35" y="40" width="50" height="60" rx="6" fill="${c}" opacity=".15" stroke="${c}" stroke-width="1.5"/><path d="M50,40 L50,30 Q50,22 60,22 Q70,22 70,30 L70,40" fill="none" stroke="${c}" stroke-width="2" opacity=".7"/><circle cx="60" cy="30" r="5" fill="${c}" opacity=".6"/><line x1="35" y1="65" x2="85" y2="65" stroke="${c}" stroke-width="1" opacity=".3"/><path d="M52,55 L58,65 L52,75 M68,55 L62,65 L68,75" stroke="${c}" stroke-width="1.5" fill="none" opacity=".5"/><circle cx="60" cy="120" r="10" fill="${c}" opacity=".12" stroke="${c}" stroke-width="1"/><path d="M55,115 L65,115 M60,110 L60,125" stroke="${c}" stroke-width="1.2" opacity=".4"/></svg>`,
  especial:   (c) => `<svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bg_esp" cx="50%" cy="45%"><stop offset="0%" stop-color="${c}" stop-opacity=".35"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient></defs><rect width="120" height="160" fill="url(#bg_esp)"/><path d="M60,18 L67,52 L100,52 L74,72 L84,106 L60,86 L36,106 L46,72 L20,52 L53,52Z" fill="${c}" opacity=".25" stroke="${c}" stroke-width="1.2"/><path d="M60,30 L65,48 L82,48 L69,58 L74,76 L60,66 L46,76 L51,58 L38,48 L55,48Z" fill="${c}" opacity=".4"/><circle cx="60" cy="60" r="10" fill="${c}" opacity=".5"/></svg>`,
};

function getCardIllustration(card, color, height=160) {
  const svgFn = CARD_SVG[card.tipo];
  const base = svgFn ? svgFn(color) : CARD_SVG.especial(color);
  // Inject preserveAspectRatio and dimensions so SVG fills its container
  return base.replace('<svg ', `<svg width="100%" height="${height}" style="display:block;" `);
}

function getCardSkills(card) {
  const ids = CARD_SKILLS[card.id] || [];
  return ids.map(sid => SKILLS[sid]).filter(Boolean);
}

/* ═══════════════════════════════════════════════
   ESPÍRITO ANIMAL — SVG art para cards de Agente
═══════════════════════════════════════════════ */
const SPIRIT_SVGS = {
  "Camaleão": (c,h) => `<svg viewBox="0 0 120 ${h}" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="sg_cam" cx="50%" cy="45%"><stop offset="0%" stop-color="${c}" stop-opacity=".35"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient></defs>
    <rect width="120" height="${h}" fill="url(#sg_cam)"/>
    <path d="M18,${h*.72} Q30,${h*.52} 52,${h*.46} Q75,${h*.4} 96,${h*.52} Q108,${h*.58} 110,${h*.68}" stroke="${c}" stroke-width="3" fill="none" opacity=".9"/>
    <circle cx="96" cy="${h*.5}" r="6" fill="${c}" opacity=".8"/><circle cx="96" cy="${h*.5}" r="2.5" fill="#000" opacity=".9"/>
    <circle cx="100" cy="${h*.48}" r="2" fill="${c}" opacity=".6"/>
    <path d="M44,${h*.46} L41,${h*.34} L50,${h*.43} L55,${h*.3} L60,${h*.42} L66,${h*.28} L70,${h*.41}" stroke="${c}" stroke-width="1.8" fill="none" opacity=".75"/>
    <path d="M18,${h*.72} Q8,${h*.82} 14,${h*.87} Q20,${h*.9} 24,${h*.83}" stroke="${c}" stroke-width="2" fill="none" opacity=".65"/>
    <polygon points="50,${h*.62} 54,${h*.59} 59,${h*.62} 59,${h*.67} 54,${h*.7} 50,${h*.67}" stroke="${c}" stroke-width=".9" fill="${c}" fill-opacity=".1" opacity=".7"/>
    <polygon points="65,${h*.57} 69,${h*.54} 74,${h*.57} 74,${h*.62} 69,${h*.65} 65,${h*.62}" stroke="${c}" stroke-width=".9" fill="${c}" fill-opacity=".1" opacity=".6"/>
    <polygon points="80,${h*.54} 84,${h*.51} 89,${h*.54} 89,${h*.59} 84,${h*.62} 80,${h*.59}" stroke="${c}" stroke-width=".9" fill="${c}" fill-opacity=".1" opacity=".5"/>
    <circle cx="60" cy="${h*.18}" r="4" fill="${c}" opacity=".45"/>
    <path d="M60,${h*.22} L60,${h*.35}" stroke="${c}" stroke-width=".8" opacity=".3" stroke-dasharray="3,4"/>
    <path d="M36,${h*.72} L34,${h*.84} M48,${h*.75} L47,${h*.86} M62,${h*.76} L62,${h*.87} M76,${h*.74} L77,${h*.84} M90,${h*.7} L93,${h*.8}" stroke="${c}" stroke-width="1.8" opacity=".6"/>
  </svg>`,
  "Besouro-Tigre": (c,h) => `<svg viewBox="0 0 120 ${h}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="sg_bt" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c}" stop-opacity=".3"/><stop offset="100%" stop-color="#fbbf24" stop-opacity=".15"/></linearGradient></defs>
    <rect width="120" height="${h}" fill="url(#sg_bt)"/>
    <ellipse cx="60" cy="${h*.5}" rx="28" ry="22" fill="${c}" opacity=".12" stroke="${c}" stroke-width="1.5"/>
    <line x1="60" y1="${h*.28}" x2="60" y2="${h*.72}" stroke="${c}" stroke-width="1" opacity=".3"/>
    <path d="M32,${h*.5} Q20,${h*.38} 14,${h*.42} M32,${h*.5} Q20,${h*.52} 12,${h*.56}" stroke="${c}" stroke-width="2" fill="none" opacity=".75"/>
    <path d="M88,${h*.5} Q100,${h*.38} 106,${h*.42} M88,${h*.5} Q100,${h*.52} 108,${h*.56}" stroke="${c}" stroke-width="2" fill="none" opacity=".75"/>
    <path d="M38,${h*.38} Q28,${h*.25} 22,${h*.28} M82,${h*.38} Q92,${h*.25} 98,${h*.28}" stroke="${c}" stroke-width="1.5" fill="none" opacity=".6"/>
    <circle cx="47" cy="${h*.42}" r="5" fill="${c}" opacity=".7"/><circle cx="73" cy="${h*.42}" r="5" fill="${c}" opacity=".7"/>
    <circle cx="47" cy="${h*.42}" r="2" fill="#000" opacity=".9"/><circle cx="73" cy="${h*.42}" r="2" fill="#000" opacity=".9"/>
    <path d="M48,${h*.25} L44,${h*.18} L50,${h*.23} M72,${h*.25} L76,${h*.18} L70,${h*.23}" stroke="${c}" stroke-width="1.5" fill="none" opacity=".8"/>
    <path d="M60,${h*.28} L58,${h*.15} M60,${h*.28} L62,${h*.15}" stroke="${c}" stroke-width="1.2" opacity=".7"/>
    <path d="M42,${h*.62} Q30,${h*.72} 25,${h*.68} M78,${h*.62} Q90,${h*.72} 95,${h*.68}" stroke="${c}" stroke-width="2" fill="none" opacity=".6"/>
    ${[0,1,2,3].map(i=>`<line x1="${35+i*14}" y1="${h*.48}" x2="${35+i*14}" y2="${h*.62}" stroke="${c}" stroke-width=".8" opacity=".5"/>`).join('')}
    <ellipse cx="60" cy="${h*.5}" rx="10" ry="8" fill="${c}" opacity=".08" stroke="${c}" stroke-width=".8"/>
    <path d="M25,${h*.38} L18,${h*.32} L22,${h*.38}" stroke="${c}" stroke-width="1.2" opacity=".5"/>
    <path d="M95,${h*.38} L102,${h*.32} L98,${h*.38}" stroke="${c}" stroke-width="1.2" opacity=".5"/>
  </svg>`,
};

function getSpiritAnimalSVG(card, color, height) {
  if (!card.isCharacter || !card.espirito) return getCardIllustration(card, color, height);
  const fn = SPIRIT_SVGS[card.espirito];
  if (!fn) return getCardIllustration(card, color, height);
  const base = fn(color, height);
  return base.replace('<svg ', `<svg width="100%" height="${height}" style="display:block;" `);
}

function CardArt({ card, size="md", glowActive=false, imgSrc=null }) {
  const t = TYPES[card.tipo];
  const r = RARITIES[card.rarity];
  const k = CARD_KINDS[card.kind] || CARD_KINDS.criatura;
  const sizes = { sm:{h:100}, md:{h:160}, lg:{h:220} };
  const s = sizes[size];
  const svgContent = getCardIllustration(card, t.color, s.h);
  return (
    <div style={{ width:"100%", height:s.h, background:t.grad, position:"relative",
      overflow:"hidden",
      boxShadow: glowActive ? `0 0 30px ${t.glow},inset 0 0 40px rgba(0,0,0,0.4)` : "inset 0 0 30px rgba(0,0,0,0.5)",
      transition:"box-shadow 0.4s" }}>

      {/* Textura de fundo cruzada */}
      <div style={{ position:"absolute", inset:0, opacity:0.04,
        backgroundImage:`repeating-linear-gradient(0deg,${t.color} 0,${t.color} 1px,transparent 0,transparent 50%),repeating-linear-gradient(90deg,${t.color} 0,${t.color} 1px,transparent 0,transparent 50%)`,
        backgroundSize:"20px 20px" }} />

      {/* SVG art ou imagem externa */}
      {card.isCharacter ? (
        <div style={{ position:"absolute", inset:0, zIndex:2 }}
          dangerouslySetInnerHTML={{ __html: getSpiritAnimalSVG(card, t.color, s.h) }} />
      ) : (
        <div style={{ position:"absolute", inset:0, zIndex:2 }}
          dangerouslySetInnerHTML={{ __html: svgContent }} />
      )}

      {/* Shimmer para Lendárias */}
      {card.rarity==="lendaria" && (
        <div style={{ position:"absolute", inset:0, background:`linear-gradient(115deg,transparent 25%,${r.color}18 50%,transparent 75%)`,
          animation:"shimmer 3s ease-in-out infinite", zIndex:3, backgroundSize:"200% 200%" }} />
      )}
      {/* Shimmer para Épicas */}
      {card.rarity==="epica" && (
        <div style={{ position:"absolute", inset:0, background:`linear-gradient(115deg,transparent 30%,${t.color}0d 50%,transparent 70%)`,
          animation:"shimmer 5s ease-in-out infinite", zIndex:3 }} />
      )}

      {/* Gradiente inferior */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"55%",
        background:`linear-gradient(transparent,${t.grad.includes('#0a') ? '#080514' : '#08060f'})`, zIndex:4 }} />

      {/* Kind badge */}
      <div style={{ position:"absolute", top:7, left:7, padding:"2px 7px", borderRadius:12,
        background:`rgba(0,0,0,0.7)`, border:`1px solid ${k.color}55`,
        fontSize:"0.48rem", fontWeight:700, color:k.color, fontFamily:"Cinzel,serif",
        letterSpacing:"0.1em", zIndex:6, display:"flex", alignItems:"center", gap:3,
        backdropFilter:"blur(4px)" }}>
        {k.label.toUpperCase()}
      </div>

      {/* Rarity gem top right */}
      <div style={{ position:"absolute", top:7, right:7, zIndex:6 }}>
        <div style={{ width:22, height:22, borderRadius:"50%",
          background:`radial-gradient(circle at 35% 35%,${r.color},${r.color}66)`,
          border:`1px solid ${r.color}99`,
          boxShadow:`0 0 8px ${r.color}88, inset 0 0 6px rgba(255,255,255,0.15)`,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"rgba(255,255,255,0.3)" }} />
        </div>
      </div>

      {/* Starter badge */}
      {card.isStarter && (
        <div style={{ position:"absolute", bottom:26, left:"50%", transform:"translateX(-50%)", padding:"2px 9px", borderRadius:20,
          background:"rgba(0,0,0,0.75)", border:"1px solid rgba(251,191,36,0.7)",
          fontSize:"0.45rem", fontWeight:700, color:"#fef3c7", fontFamily:"Cinzel,serif",
          letterSpacing:"0.1em", zIndex:6, whiteSpace:"nowrap",
          backdropFilter:"blur(4px)" }}>★ CARTA INICIAL</div>
      )}

      {/* Vontade cost orb (bottom left) */}
      <div style={{ position:"absolute", bottom:6, left:8, zIndex:6,
        display:"flex", alignItems:"center", gap:3 }}>
        <div style={{ width:18, height:18, borderRadius:"50%",
          background:"rgba(0,0,0,0.8)", border:"1px solid rgba(251,191,36,0.6)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:"0.55rem", fontWeight:700, color:"#fde68a",
          boxShadow:"0 0 6px rgba(251,191,36,0.4)" }}>{card.vontade}</div>
        <span style={{ fontSize:"0.45rem", color:"rgba(253,230,138,0.7)", fontFamily:"Cinzel,serif" }}>VTD</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   GAME CARD
═══════════════════════════════════════════════ */
function GameCard({ card, onClick, selected, inDeck, dimmed, showAddBtn, onAdd, size="md", imgSrc=null }) {
  const t = TYPES[card.tipo];
  const k = CARD_KINDS[card.kind] || CARD_KINDS.criatura;
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:"#0f0a1e", border:`1px solid ${selected?"#fbbf24":hov?t.color+"88":t.color+"33"}`,
        borderRadius:14, overflow:"hidden", cursor:"pointer",
        transform:selected?"translateY(-10px) scale(1.03)":hov?"translateY(-5px) scale(1.01)":"none",
        boxShadow:selected?`0 0 24px ${t.glow},0 16px 40px rgba(0,0,0,0.6)`:hov?`0 8px 24px rgba(0,0,0,0.5),0 0 16px ${t.color}33`:"0 4px 16px rgba(0,0,0,0.4)",
        transition:"all 0.25s cubic-bezier(0.34,1.4,0.64,1)",
        opacity:dimmed?0.35:1, filter:dimmed?"grayscale(0.7)":"none",
        position:"relative", userSelect:"none" }}>
      <CardArt card={card} size={size} glowActive={hov||selected} imgSrc={imgSrc} />
      <div style={{ padding:"10px 12px 12px" }}>
        <div style={{ fontFamily:"Cinzel,serif", fontWeight:700, fontSize:"0.8rem", color:"#f0e8ff", marginBottom:2, letterSpacing:"0.03em" }}>{card.name}</div>
        <div style={{ fontSize:"0.6rem", color:t.color, marginBottom:6, display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ fontSize:"0.65rem" }}>{t.icon}</span><span style={{ fontFamily:"Cinzel,serif", letterSpacing:"0.05em" }}>{t.label}</span>
          <span style={{ marginLeft:"auto", fontSize:"0.55rem", color:k.color, fontFamily:"Cinzel,serif", padding:"1px 5px", background:`${k.color}15`, borderRadius:8, border:`1px solid ${k.color}33` }}>{k.label}</span>
        </div>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:showAddBtn?8:0 }}>
          {[
            {l:"ATK",v:card.atk,c:"#ff5533"},
            {l:"DEF",v:card.def,c:"#22d3ee"},
            {l:"HP",v:card.hp,c:"#4ade80"},
            {l:"VEL",v:card.velocidade??5,c:"#facc15"},
            {l:"VTD",v:card.vontade,c:"#fde68a"},
          ].map(st=>(
            <div key={st.l} title={st.l} style={{ display:"flex", alignItems:"center", gap:2, padding:"2px 6px", borderRadius:8,
              background:`${st.c}14`, border:`1px solid ${st.c}33`, fontSize:"0.58rem", fontWeight:700, color:st.c,
              fontFamily:"Cinzel,serif" }}>
              <span style={{ fontSize:"0.5rem", opacity:0.7 }}>{st.l}</span>
              <span>{st.v}</span>
            </div>
          ))}
        </div>
        {showAddBtn && (
          <button onClick={e=>{e.stopPropagation();onAdd&&onAdd();}} style={{
            width:"100%", padding:"5px", borderRadius:8, border:"none", cursor:"pointer",
            background:inDeck?"rgba(74,222,128,0.15)":"rgba(167,139,250,0.2)",
            color:inDeck?"#4ade80":"#c4b5fd",
            fontFamily:"Cinzel,serif", fontSize:"0.65rem", fontWeight:700, transition:"all 0.2s" }}>
            {inDeck?"✓ No Deck":"+ Adicionar"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CARD MODAL
═══════════════════════════════════════════════ */
function CardModal({ card, onClose, onAdd, inDeck, owned, imgSrc=null }) {
  const t = TYPES[card.tipo];
  const r = RARITIES[card.rarity];
  const k = CARD_KINDS[card.kind] || CARD_KINDS.criatura;
  const [tab, setTab] = useState("info");
  if (!card) return null;
  const isChar = card.isCharacter;
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{
      position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.88)",
      backdropFilter:"blur(14px)", display:"flex", alignItems:"center", justifyContent:"center",
      padding:16, overflowY:"auto" }}>
      <div style={{ background:"linear-gradient(135deg,#0f0a1e,#1a1030)", border:`1px solid ${t.color}66`,
        borderRadius:22, maxWidth:isChar?520:420, width:"100%", overflow:"hidden",
        boxShadow:`0 0 60px ${t.glow},0 40px 80px rgba(0,0,0,0.8)`,
        animation:"modalIn 0.35s cubic-bezier(0.34,1.4,0.64,1)" }}>

        <CardArt card={card} size="lg" glowActive imgSrc={imgSrc} />

        {card.isStarter && (
          <div style={{ background:`linear-gradient(90deg,${t.color}30,transparent)`, borderBottom:`1px solid ${t.color}33`,
            padding:"7px 24px", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:"0.8rem" }}>★</span>
            <span style={{ fontFamily:"Cinzel,serif", fontSize:"0.68rem", color:t.color, letterSpacing:"0.12em" }}>CARTA INICIAL — PROTAGONISTA</span>
          </div>
        )}

        <div style={{ padding:"20px 24px 24px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
            <div>
              <div style={{ fontFamily:"Cinzel Decorative,cursive", fontSize:"1.25rem", color:"#f0e8ff", marginBottom:4 }}>{card.name}</div>
              <div style={{ fontSize:"0.72rem", color:t.color, display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                <span>{t.icon} {t.label}</span>
                <span style={{ color:r.color }}>✦ {r.label}</span>
                <span style={{ color:k.color }}>{k.icon} {k.label}</span>
                {isChar && card.espirito && <span style={{ color:"#9ca3af" }}>🦎 {card.espirito}</span>}
              </div>
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)", border:"none", color:"#9ca3af", width:32, height:32, borderRadius:"50%", cursor:"pointer", fontSize:"1rem", flexShrink:0 }}>✕</button>
          </div>

          <div style={{ height:1, background:`linear-gradient(90deg,${t.color}55,transparent)`, margin:"12px 0" }} />

          {isChar && (
            <div style={{ display:"flex", gap:4, marginBottom:16 }}>
              {[{k:"info",l:"Info"},{k:"stats",l:"Atributos"},{k:"skills",l:"Habilidades"},{k:"lore",l:"Lore"}].map(tb=>(
                <button key={tb.k} onClick={()=>setTab(tb.k)} style={{
                  flex:1, padding:"6px 4px", borderRadius:8,
                  border:`1px solid ${tab===tb.k?t.color+"88":"rgba(255,255,255,0.08)"}`,
                  background:tab===tb.k?`${t.color}20`:"transparent",
                  color:tab===tb.k?t.color:"#5a4880",
                  fontFamily:"Cinzel,serif", fontSize:"0.58rem", fontWeight:700, cursor:"pointer", transition:"all 0.2s" }}>{tb.l}</button>
              ))}
            </div>
          )}

          {/* TAB INFO */}
          {(!isChar||tab==="info") && (
            <>
              <p style={{ fontSize:"0.82rem", color:"#9080b0", lineHeight:1.8, marginBottom:16 }}>{card.desc}</p>
              {isChar && card.passiva && (
                <div style={{ borderRadius:12, background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.3)", marginBottom:16, overflow:"hidden" }}>
                  <div style={{ background:"rgba(251,191,36,0.12)", padding:"8px 14px", display:"flex", alignItems:"center", gap:8 }}>
                    <span>🛡</span>
                    <span style={{ fontFamily:"Cinzel,serif", fontSize:"0.7rem", fontWeight:700, color:"#fbbf24", letterSpacing:"0.06em" }}>PASSIVA — {card.passiva.toUpperCase()}</span>
                  </div>
                  <div style={{ padding:"10px 14px", fontSize:"0.78rem", color:"#c9b87a", lineHeight:1.75 }}>{card.passivaDesc}</div>
                </div>
              )}
              {!isChar && card.passiva && (
                <div style={{ padding:"8px 14px", borderRadius:10, background:`${t.color}10`, border:`1px solid ${t.color}33`, marginBottom:12, fontSize:"0.72rem", color:t.color }}>
                  🔮 Passiva: <strong>{card.passiva}</strong> — {card.desc}
                </div>
              )}
              {isChar && card.habilidadeVontade && (
                <div style={{ padding:"8px 14px", borderRadius:10, background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.25)", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
                  <span>✨</span>
                  <div>
                    <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.6rem", color:"#7a6a9a", letterSpacing:"0.1em", marginBottom:2 }}>HABILIDADE DE VONTADE</div>
                    <div style={{ fontSize:"0.78rem", color:"#c4b5fd", fontWeight:700, letterSpacing:"0.15em" }}>{card.habilidadeVontade}</div>
                  </div>
                </div>
              )}
              {card.ability && !isChar && (
                <div style={{ padding:"8px 14px", borderRadius:10, background:`${t.color}12`, border:`1px solid ${t.color}33`, marginBottom:16, fontSize:"0.75rem", color:t.color }}>
                  ✦ Habilidade: <strong>{card.ability}</strong>
                </div>
              )}
              {/* Stats grid */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:6, marginBottom:20 }}>
                {[
                  {l:"ATK",v:card.atk,c:"#ff5533",tt:"Ataque"},
                  {l:"DEF",v:card.def,c:"#22d3ee",tt:"Defesa"},
                  {l:"HP",v:card.hp,c:"#4ade80",tt:"HP"},
                  {l:"VEL",v:card.velocidade??5,c:"#facc15",tt:"Velocidade"},
                  {l:"VON",v:card.vontade,c:"#fde68a",tt:"Vontade"},
                ].map(s=>(
                  <div key={s.l} title={s.tt} style={{ textAlign:"center", padding:"8px 2px", borderRadius:10, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
                    <div style={{ fontFamily:"Cinzel,serif", fontSize:"1.1rem", fontWeight:700, color:s.c }}>{s.v}</div>
                    <div style={{ fontSize:"0.5rem", color:"#5a4880", textTransform:"uppercase", letterSpacing:"0.06em", marginTop:2 }}>{s.tt}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* TAB ATRIBUTOS */}
          {isChar && tab==="stats" && (
            <div style={{ marginBottom:20 }}>
              {/* Vitalidade */}
              <div style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontFamily:"Cinzel,serif", fontSize:"0.65rem", color:"#4ade80", letterSpacing:"0.08em" }}>❤️ VITALIDADE (HP Base)</span>
                  <span style={{ fontFamily:"Cinzel,serif", fontSize:"0.85rem", fontWeight:700, color:"#4ade80" }}>{card.vitalidade}</span>
                </div>
                <div style={{ height:8, background:"rgba(255,255,255,0.06)", borderRadius:4, overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:4, background:"linear-gradient(90deg,#22c55e,#4ade80)", width:`${Math.min(card.vitalidade/500*100,100)}%`, transition:"width 0.6s" }} />
                </div>
              </div>
              {/* Atributos principais */}
              {[
                {l:"Força",        v:card.forca,       max:20, c:"#ff5533", icon:"💪", note:"Potência de ataque físico"},
                {l:"Resistência",  v:card.resistencia, max:20, c:"#22d3ee", icon:"🛡️", note:"Capacidade de absorver dano"},
                {l:"Velocidade",   v:card.velocidade,  max:20, c:"#4ade80", icon:"⚡", note:"Ordem de ação no combate"},
                {l:"Inteligência", v:card.inteligencia,max:20, c:"#a78bfa", icon:"🧠", note:"Eficiência e uso de Vontade"},
                {l:"Vigor",        v:card.vigor,       max:20, c:"#fbbf24", icon:"🔥", note:"Stamina e persistência"},
              ].map(st=>(
                <div key={st.l} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <span style={{ fontSize:"0.85rem" }}>{st.icon}</span>
                      <span style={{ fontSize:"0.72rem", color:"#8070a0" }}>{st.l}</span>
                      <span style={{ fontSize:"0.55rem", color:"#4a3870", fontStyle:"italic" }}>{st.note}</span>
                    </div>
                    <span style={{ fontFamily:"Cinzel,serif", fontSize:"0.82rem", fontWeight:700, color:st.c }}>{st.v}</span>
                  </div>
                  <div style={{ height:6, background:"rgba(255,255,255,0.05)", borderRadius:3, overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:3, background:st.c, width:`${st.v/st.max*100}%`, transition:"width 0.5s", boxShadow:`0 0 6px ${st.c}88` }} />
                  </div>
                </div>
              ))}
              {/* Vontade de jogo */}
              <div style={{ marginTop:6, marginBottom:14, display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:10, background:"rgba(253,230,138,0.08)", border:"1px solid rgba(253,230,138,0.2)" }}>
                <span style={{ fontSize:"1rem" }}>✦</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:"0.68rem", color:"#c9a84a" }}>Vontade de Jogo</span>
                    <span style={{ fontFamily:"Cinzel,serif", fontSize:"0.78rem", fontWeight:700, color:"#fde68a" }}>{card.vontade}</span>
                  </div>
                  <div style={{ fontSize:"0.55rem", color:"#6a5840", marginTop:2 }}>Custo para invocar esta carta no campo de batalha</div>
                </div>
              </div>
              {/* Espírito Animal */}
              <div style={{ padding:"12px 16px", borderRadius:12, background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.2)", display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:"1.8rem" }}>🦎</span>
                <div>
                  <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.58rem", color:"#7a6a4a", letterSpacing:"0.1em", marginBottom:2 }}>ESPÍRITO ANIMAL</div>
                  <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.9rem", fontWeight:700, color:"#fbbf24" }}>{card.espirito}</div>
                  <div style={{ fontSize:"0.6rem", color:"#5a4820", marginTop:2 }}>Manifestação espiritual do agente</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB HABILIDADES */}
          {isChar && tab==="skills" && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:"0.65rem", color:"#5a4880", marginBottom:12, lineHeight:1.6 }}>
                Habilidades ativas são usadas no campo de batalha gastando <span style={{ color:"#fbbf24" }}>🔥 Vigor</span>. O Vigor regenera +2 por turno (máx base: <strong style={{ color:"#fbbf24" }}>{card.vigor}</strong>).
              </div>

              {/* Passiva da Fusão — card especial para Yuji */}
              {card.fusionPassiva && (
                <div style={{ marginBottom:14, padding:"12px 14px", borderRadius:12,
                  background:"linear-gradient(135deg,rgba(52,211,153,0.06),rgba(52,211,153,0.02))",
                  border:"1px solid rgba(52,211,153,0.25)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                    <span style={{ fontSize:"1.1rem" }}>🦎</span>
                    <div>
                      <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.7rem", color:"#34d399", fontWeight:700 }}>{card.fusionPassiva}</div>
                      <div style={{ fontSize:"0.52rem", color:"#1a5a40", letterSpacing:"0.06em" }}>PASSIVA DA FUSÃO ESPIRITUAL</div>
                    </div>
                  </div>
                  <div style={{ fontSize:"0.65rem", color:"#2a7a58", lineHeight:1.6, marginBottom:8 }}>{card.fusionPassivaDesc}</div>
                  {card.fusionStats && (
                    <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                      {[
                        {l:"⚔ ATK",v:`+${card.fusionStats.atkBonus}`},
                        {l:"🛡 DEF",v:`+${card.fusionStats.defBonus}`},
                        {l:"⚡ VEL",v:`+${card.fusionStats.velBonus}`},
                        {l:"❤ HP",v:`+${card.fusionStats.hpBonus}`},
                        {l:"🔥 Vigor",v:`+${card.fusionStats.vigorBonus}`},
                      ].map(st=>(
                        <span key={st.l} style={{ fontSize:"0.55rem", padding:"2px 7px", borderRadius:8,
                          background:"rgba(52,211,153,0.1)", color:"#34d399", border:"1px solid rgba(52,211,153,0.2)" }}>
                          {st.l} {st.v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {getCardSkills(card).length === 0
                ? <div style={{ color:"#4a3870", fontSize:"0.75rem" }}>Esta carta não possui habilidades ativas.</div>
                : getCardSkills(card).map(skill => {
                    const isVontade = skill.isVontadeSkill;
                    return (
                      <div key={skill.id} style={{ marginBottom:10, padding:"12px 14px", borderRadius:12,
                        background: isVontade ? "rgba(251,191,36,0.05)" : `${t.color}08`,
                        border:`1px solid ${isVontade?"rgba(251,191,36,0.3)":t.color+"22"}`,
                        boxShadow: isVontade ? "0 0 16px rgba(251,191,36,0.08)" : "none" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                          <span style={{ fontSize:"1.2rem" }}>{skill.icon}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.75rem", color: isVontade ? "#fde68a" : t.color, fontWeight:700 }}>{skill.name}</div>
                            {isVontade && <div style={{ fontSize:"0.52rem", color:"#7a6020", letterSpacing:"0.06em" }}>✦ HABILIDADE DE VONTADE</div>}
                          </div>
                        </div>
                        <div style={{ fontSize:"0.68rem", color:"#7060a0", lineHeight:1.6, marginBottom:8 }}>{skill.desc}</div>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          <span style={{ fontSize:"0.58rem", padding:"2px 8px", borderRadius:10, background:"rgba(251,191,36,0.15)", color:"#fbbf24", border:"1px solid rgba(251,191,36,0.25)" }}>🔥 Custo: {skill.vigorCost} Vigor</span>
                          <span style={{ fontSize:"0.58rem", padding:"2px 8px", borderRadius:10, background:"rgba(167,139,250,0.1)", color:"#a78bfa", border:"1px solid rgba(167,139,250,0.2)" }}>⏱ Recarga: {skill.cooldown} turnos</span>
                        </div>
                      </div>
                    );
                  })
              }
              <div style={{ marginTop:12, padding:"8px 12px", borderRadius:10, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", fontSize:"0.6rem", color:"#4a3870" }}>
                💡 Para usar as habilidades, coloque esta carta no campo de batalha e clique nela.
              </div>
            </div>
          )}

          {/* TAB HABILIDADES — para criaturas (sem tabs, seção inline) */}
          {!isChar && getCardSkills(card).length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.6rem", color:"#5a4880", letterSpacing:"0.1em", marginBottom:8 }}>HABILIDADES ATIVAS</div>
              {getCardSkills(card).map(skill=>(
                <div key={skill.id} style={{ marginBottom:8, padding:"10px 12px", borderRadius:10, background:`${t.color}08`, border:`1px solid ${t.color}22` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                    <span>{skill.icon}</span>
                    <span style={{ fontFamily:"Cinzel,serif", fontSize:"0.68rem", color:t.color, fontWeight:700 }}>{skill.name}</span>
                  </div>
                  <div style={{ fontSize:"0.62rem", color:"#6060a0", lineHeight:1.5, marginBottom:6 }}>{skill.desc}</div>
                  <div style={{ display:"flex", gap:6 }}>
                    <span style={{ fontSize:"0.55rem", padding:"1px 7px", borderRadius:10, background:"rgba(251,191,36,0.12)", color:"#fbbf24" }}>🔥 {skill.vigorCost} Vigor</span>
                    <span style={{ fontSize:"0.55rem", padding:"1px 7px", borderRadius:10, background:"rgba(167,139,250,0.1)", color:"#a78bfa" }}>⏱ {skill.cooldown}t</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB LORE */}
          {isChar && tab==="lore" && (
            <div style={{ marginBottom:20 }}>
              {card.lore && card.lore.split("\n\n").map((para,i)=>(
                <p key={i} style={{ fontSize:"0.8rem", color:"#8070a0", lineHeight:1.9, marginBottom:12, fontStyle:"italic" }}>{para}</p>
              ))}
            </div>
          )}

          <div style={{ display:"flex", gap:10 }}>
            {owned
              ? <button onClick={onAdd} disabled={inDeck} style={{ flex:1, padding:"10px", borderRadius:10, border:"none", cursor:inDeck?"default":"pointer",
                  background:inDeck?"rgba(74,222,128,0.15)":`linear-gradient(135deg,${t.color}aa,${t.color})`,
                  color:inDeck?"#4ade80":"#fff", fontFamily:"Cinzel,serif", fontWeight:700, fontSize:"0.78rem" }}>
                  {inDeck?"✓ Já no Deck":"+ Adicionar ao Deck"}
                </button>
              : <div style={{ flex:1, padding:"10px", borderRadius:10, background:"rgba(100,100,100,0.15)", color:"#555", fontFamily:"Cinzel,serif", fontSize:"0.78rem", textAlign:"center" }}>🔒 Carta não possuída</div>
            }
            <button onClick={onClose} style={{ padding:"10px 20px", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"#9080b0", cursor:"pointer", fontSize:"0.78rem" }}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   BATTLE MINI CARD
═══════════════════════════════════════════════ */
function BattleCard({ card, onClick, selected, enemy, faceDown, imgSrc=null }) {
  const t = card ? TYPES[card.tipo] : null;
  const [hov, setHov] = useState(false);
  if (faceDown) return (
    <div style={{ width:76, height:112, borderRadius:10, background:"linear-gradient(135deg,#1a0a3a,#0d0520)",
      border:"1px solid rgba(167,139,250,0.2)", display:"flex", alignItems:"center", justifyContent:"center",
      boxShadow:"0 4px 12px rgba(0,0,0,0.5)", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(45deg,rgba(167,139,250,0.04) 0,rgba(167,139,250,0.04) 1px,transparent 0,transparent 8px)", }} />
      <div style={{ width:36, height:36, borderRadius:"50%", border:"1px solid rgba(167,139,250,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:16, height:16, borderRadius:"50%", background:"rgba(167,139,250,0.2)" }} />
      </div>
    </div>
  );
  if (!card) return null;
  const isPoisoned = card.status && card.status.includes("poison");
  const isSilenced = card.status && card.status.includes("silence");
  const isPassiveActive = card.passivaActive;
  const isYujiPassive = card.passivaTrigger==="hp_below_half" && card.currentHp !== undefined && card.currentHp < card.hp * 0.5 && !card.silenced;
  const inFusion  = card.inFusion;
  const inStealth = card.stealth;
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={onClick}
      style={{ width:80, height:124, borderRadius:10, cursor:"pointer", overflow:"hidden",
        border: selected ? "2px solid #fbbf24"
               : inFusion  ? "2px solid #34d399"
               : inStealth ? "1px solid rgba(200,200,255,0.35)"
               : isYujiPassive ? "1.5px solid #22d3ee"
               : `1px solid ${enemy ? t.color+"66" : t.color+"55"}`,
        background: t.grad,
        position:"relative",
        transform: selected?"translateY(-14px) scale(1.05)":hov?"translateY(-6px) scale(1.02)":"none",
        boxShadow: selected     ? `0 0 24px #fbbf24,0 12px 28px rgba(0,0,0,0.7),inset 0 0 12px rgba(251,191,36,0.1)`
                  : inFusion    ? `0 0 20px rgba(52,211,153,0.8),0 0 40px rgba(52,211,153,0.3)`
                  : inStealth   ? `0 0 10px rgba(180,180,255,0.25)`
                  : isYujiPassive ? `0 0 14px rgba(34,211,238,0.7),0 0 28px rgba(34,211,238,0.3)`
                  : hov ? `0 8px 20px rgba(0,0,0,0.6),0 0 12px ${t.color}44`
                  : `0 4px 10px rgba(0,0,0,0.4)`,
        opacity: inStealth ? 0.4 : 1,
        transition:"all 0.22s cubic-bezier(0.34,1.4,0.64,1)" }}>
      {/* Aura da Fusão Espiritual */}
      {inFusion && (
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,rgba(52,211,153,0.15),transparent)", animation:"shimmer 1.5s infinite", zIndex:1 }} />
      )}
      {/* Aura de Furtividade */}
      {inStealth && (
        <div style={{ position:"absolute", inset:0, background:"repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(180,180,255,0.04) 3px,rgba(180,180,255,0.04) 6px)", zIndex:1 }} />
      )}
      {/* Aura da passiva Yuji */}
      {isYujiPassive && !inFusion && (
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,rgba(34,211,238,0.08),transparent)", animation:"shimmer 2s infinite", zIndex:1 }} />
      )}
      {/* Illustration: photo if available, else SVG */}
      {imgSrc ? (
        <img src={imgSrc} alt={card.name} style={{
          position:"absolute", inset:0, width:"100%", height:"100%",
          objectFit:"cover", objectPosition:"top 5%", zIndex:2,
          opacity: inStealth ? 0.45 : 0.93,
          transition:"opacity 0.3s, filter 0.3s",
          filter: selected ? "brightness(1.1)" : inFusion ? "brightness(1.05) hue-rotate(5deg)" : "none" }} />
      ) : (
        <div style={{ position:"absolute", inset:0, zIndex:2 }}
          dangerouslySetInnerHTML={{ __html: getCardIllustration(card, t.color, 124) }} />
      )}
      {/* Gradient overlay */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"58%",
        background:"linear-gradient(transparent,rgba(5,2,14,0.97))", zIndex:3 }} />
      {/* Name bar */}
      <div style={{ position:"absolute", bottom:36, left:0, right:0, zIndex:4, padding:"0 5px" }}>
        <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.42rem", fontWeight:700, color:"rgba(240,232,255,0.9)", textAlign:"center", lineHeight:1.3, letterSpacing:"0.04em" }}>{card.name}</div>
      </div>
      {/* Stats row */}
      <div style={{ position:"absolute", bottom:20, left:3, right:3, zIndex:4, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:"0.48rem", color:"#ff7755", fontWeight:700, fontFamily:"Cinzel,serif" }}>{card.atk + (card.atkBuff||0)}</span>
        <span style={{ fontSize:"0.48rem", color:isYujiPassive?"#67e8f9":"#5bc8e8", fontWeight:700, fontFamily:"Cinzel,serif" }}>{isYujiPassive?Math.round((card.def+(card.defBuff||0))*1.2):card.def+(card.defBuff||0)}</span>
        <span style={{ fontSize:"0.48rem", color: card.currentHp/card.hp > 0.5 ? "#5eda94" : card.currentHp/card.hp > 0.25 ? "#fbbf24" : "#ff5533", fontWeight:700, fontFamily:"Cinzel,serif" }}>{card.currentHp}</span>
      </div>
      {/* ATK/DEF/HP labels */}
      <div style={{ position:"absolute", bottom:12, left:3, right:3, zIndex:4, display:"flex", justifyContent:"space-between" }}>
        <span style={{ fontSize:"0.36rem", color:"rgba(255,119,85,0.6)", fontFamily:"Cinzel,serif" }}>ATK</span>
        <span style={{ fontSize:"0.36rem", color:"rgba(91,200,232,0.6)", fontFamily:"Cinzel,serif" }}>DEF</span>
        <span style={{ fontSize:"0.36rem", color:"rgba(94,218,148,0.6)", fontFamily:"Cinzel,serif" }}>HP</span>
      </div>
      {/* Status badges */}
      <div style={{ position:"absolute", top:5, left:0, right:0, zIndex:5, display:"flex", gap:2, justifyContent:"center", flexWrap:"wrap", padding:"0 3px" }}>
        {inFusion   && <span style={{ fontSize:"0.38rem", background:"rgba(52,211,153,0.4)", borderRadius:3, padding:"1px 3px", color:"#34d399", fontWeight:700, fontFamily:"Cinzel,serif" }}>FUS{card.fusionTurns}</span>}
        {card.pontoReferencial && <span style={{ fontSize:"0.38rem", background:"rgba(74,222,128,0.4)", borderRadius:3, padding:"1px 3px", color:"#4ade80", fontWeight:700, fontFamily:"Cinzel,serif" }}>REF{card.pontoReferencialTurns}</span>}
        {card.piquePega && <span style={{ fontSize:"0.38rem", background:"rgba(251,191,36,0.45)", borderRadius:3, padding:"1px 3px", color:"#fbbf24", fontWeight:700, fontFamily:"Cinzel,serif" }}>PQ{card.piquePegaTurns}</span>}
        {card.predictDodge && <span style={{ fontSize:"0.38rem", background:"rgba(167,139,250,0.4)", borderRadius:3, padding:"1px 3px", color:"#a78bfa", fontWeight:700, fontFamily:"Cinzel,serif" }}>PRV</span>}
        {card.equippedItem && (() => {
          const itm = ALL_CARDS.find(c=>c.id===card.equippedItem);
          return itm ? <span style={{ fontSize:"0.38rem", background:"rgba(226,201,126,0.35)", borderRadius:3, padding:"1px 3px", color:"#e2c97e", fontWeight:700, fontFamily:"Cinzel,serif" }}>{itm.emoji}</span> : null;
        })()}
        {inStealth  && <span style={{ fontSize:"0.38rem", background:"rgba(180,180,255,0.25)", borderRadius:3, padding:"1px 3px", color:"#c8c8ff", fontWeight:700, fontFamily:"Cinzel,serif" }}>FRT{card.stealthTurns}</span>}
        {isYujiPassive && <span style={{ fontSize:"0.38rem", background:"rgba(34,211,238,0.35)", borderRadius:3, padding:"1px 3px", color:"#67e8f9", fontWeight:700, fontFamily:"Cinzel,serif" }}>SVD</span>}
        {isPoisoned && <span style={{ fontSize:"0.38rem", background:"rgba(74,222,128,0.3)", borderRadius:3, padding:"1px 3px", color:"#4ade80", fontWeight:700 }}>VEN</span>}
        {isSilenced && <span style={{ fontSize:"0.38rem", background:"rgba(167,139,250,0.3)", borderRadius:3, padding:"1px 3px", color:"#a78bfa", fontWeight:700 }}>SIL</span>}
        {isPassiveActive && !isYujiPassive && <span style={{ fontSize:"0.38rem", background:"rgba(251,191,36,0.35)", borderRadius:3, padding:"1px 3px", color:"#fbbf24", fontWeight:700 }}>PAS</span>}
      </div>
      {/* HP bar */}
      {card.currentHp !== undefined && (
        <div style={{ position:"absolute", bottom:9, left:3, right:3, height:2.5, background:"rgba(255,255,255,0.08)", borderRadius:2, zIndex:6 }}>
          <div style={{ height:"100%", borderRadius:2, transition:"width 0.5s",
            background:card.currentHp/card.hp>0.5?"linear-gradient(90deg,#22c55e,#4ade80)":card.currentHp/card.hp>0.25?"linear-gradient(90deg,#d97706,#fbbf24)":"linear-gradient(90deg,#dc2626,#ff5533)",
            width:`${Math.max(0,card.currentHp/card.hp)*100}%` }} />
        </div>
      )}
      {/* Vigor bar */}
      {card.maxVigor != null && (
        <div style={{ position:"absolute", bottom:5, left:3, right:3, height:2.5, background:"rgba(251,191,36,0.1)", borderRadius:2, zIndex:6 }}>
          <div style={{ height:"100%", borderRadius:2,
            background:"linear-gradient(90deg,#b45309,#f59e0b)",
            width:`${Math.max(0,(card.currentVigor??0)/card.maxVigor*100)}%`, transition:"width 0.5s" }} />
        </div>
      )}
      {/* Speed badge */}
      <div style={{ position:"absolute", bottom:37, right:4, fontSize:"0.38rem", color:"#facc15", fontWeight:700,
        fontFamily:"Cinzel,serif", zIndex:5, background:"rgba(0,0,0,0.6)", borderRadius:3, padding:"1px 4px" }}>
        ⚡{card.velocidade??5}
      </div>
      {/* Vigor value */}
      {!enemy && card.maxVigor != null && (
        <div style={{ position:"absolute", bottom:37, left:4, fontSize:"0.38rem", color:"#f59e0b", fontWeight:700,
          fontFamily:"Cinzel,serif", zIndex:5, background:"rgba(0,0,0,0.6)", borderRadius:3, padding:"1px 4px" }}>
          {card.currentVigor??0}
        </div>
      )}
      {/* Skills indicator */}
      {!enemy && CARD_SKILLS[card.id]?.length > 0 && (
        <div style={{ position:"absolute", bottom:37, left:"50%", transform:"translateX(-50%)",
          fontSize:"0.36rem", color:"#c084fc", fontWeight:700, fontFamily:"Cinzel,serif",
          background:"rgba(0,0,0,0.6)", borderRadius:3, padding:"1px 4px", zIndex:5,
          border:"1px solid rgba(192,132,252,0.25)" }}>
          ✦{CARD_SKILLS[card.id].length}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════ */
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)", background:"rgba(15,10,30,0.96)", border:"1px solid rgba(167,139,250,0.4)", padding:"10px 24px", borderRadius:30, fontSize:"0.82rem", color:"#e0d8ff", boxShadow:"0 8px 28px rgba(0,0,0,0.5)", zIndex:2000, whiteSpace:"nowrap", pointerEvents:"none", animation:"toastIn 0.35s cubic-bezier(0.34,1.4,0.64,1)" }}>
      {msg}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   GLOSSÁRIO DE TERMOS — tooltip inline no log
═══════════════════════════════════════════════ */
const GLOSSARY = {
  "Vontade":       { icon:"✦", color:"#fbbf24", tip:"Recurso de jogo. Gasta-se ao invocar cartas. Regenera +1 por turno, máximo 7." },
  "Vigor":         { icon:"🔥", color:"#f97316", tip:"Stamina da carta. Gasta-se ao usar Habilidades Ativas. Regenera +2 por turno." },
  "Furtividade":   { icon:"🫥", color:"#c8c8ff", tip:"Estado especial: a carta é indetectável e não pode ser alvo de ataques enquanto ativo." },
  "Taunt":         { icon:"🛡", color:"#22d3ee", tip:"Forçar inimigos a atacar esta carta prioritariamente." },
  "Veneno":        { icon:"☠️", color:"#4ade80", tip:"Status: causa dano por turno. Aplicado por certas habilidades." },
  "Sangramento":   { icon:"🩸", color:"#f87171", tip:"Status: causa dano por turno. Mais forte que veneno mas de curta duração." },
  "Item Universal":{ icon:"🎒", color:"#e2c97e", tip:"Pode ser equipado em qualquer Agente em campo. Concede bônus permanentes de stats enquanto equipado." },
  "Item Exclusivo":{ icon:"🔶", color:"#f97316", tip:"Só pode ser equipado por um Agente específico ou de um tipo específico. Mais poderoso que itens universais." },
  "Life Steal":    { icon:"☯️", color:"#fbbf24", tip:"Recupera HP igual a uma porcentagem do dano causado ao atacar. Passiva dos Selos do Equilíbrio." },
  "Barreira":      { icon:"🪨", color:"#a78bfa", tip:"Absorve o primeiro ataque do turno sem tomar dano. Passiva da Rocha Viva." },
  "Esquiva":       { icon:"💨", color:"#4ade80", tip:"40% de chance de ignorar completamente qualquer ataque recebido." },
  "Silêncio":      { icon:"🔇", color:"#a78bfa", tip:"Desativa todas as passivas de uma carta por 1 turno." },
  "Renascimento":  { icon:"🔥", color:"#f97316", tip:"Ao ser destruída, esta carta renasce com 50% do HP máximo." },
  "Fusão":         { icon:"🦎", color:"#34d399", tip:"Forma transformada de Yuji. Stats amplificados e Kata do Camaleão ativa: dano físico ×3." },
  "Kata do Camaleão": { icon:"🦎", color:"#34d399", tip:"Passiva da Fusão: todos os acertos físicos são multiplicados por ×3." },
  "Suporte à Vida":{ icon:"💙", color:"#22d3ee", tip:"Passiva de Yuji: quando HP < 50%, DEF +20% automaticamente." },
  "Flash Cego":    { icon:"⚡", color:"#4ade80", tip:"Passiva de Jay: imune a cegueira e debuffs sensoriais. Alvos com VEL ≤ 30 não podem esquivar de seus ataques." },
  "Pique-Pega":   { icon:"🎯", color:"#fbbf24", tip:"Habilidade de Jay: força todos os inimigos a mirá-lo por 1 turno. Jay ganha 60% de esquiva. Dano em área ignora este efeito." },
  "Punho Cego":   { icon:"👊", color:"#4ade80", tip:"Habilidade de Jay: dano = 3 + ⌊(2/3 × VEL atual)⌋. Ignora DEF e Esquiva completamente." },
  "Ponto Referencial":{ icon:"📍", color:"#4ade80", tip:"Habilidade de Vontade de Jay: mapeia todo o campo, ignora Esquiva e Furtividade, ataca dois alvos por 3 turnos." },
  "Espaço Memorizado":{ icon:"🧠", color:"#a78bfa", tip:"Jay prevê o próximo ataque inimigo e contra-ataca automaticamente." },
  "Fúria":         { icon:"🔥", color:"#ff5533", tip:"Primeiro ataque do turno ganha +4 ATK bônus. Passiva do Urso Ancestral." },
  "Crescimento":   { icon:"🌿", color:"#4ade80", tip:"+1 ATK permanente a cada turno que a carta sobrevive. Passiva do Guerreiro Raiz." },
  "Duplo Ataque":  { icon:"⚡", color:"#fbbf24", tip:"Ataca duas vezes por turno. Passiva do Beija-Flor Relâmpago." },
  "Predadora":     { icon:"🐺", color:"#ff5533", tip:"+50% de dano quando atacar alvo com menos HP que a atacante." },
};

function LogLine({ msg, cls }) {
  const [tooltip, setTooltip] = useState(null);
  const color = cls==="log-system"?"#fbbf24":cls==="log-player"?"#4ade80":cls==="log-enemy"?"#ff7755":cls==="log-skill"?"#c084fc":cls==="log-fusion"?"#34d399":cls==="log-info"?"#a78bfa":"#6b5a8a";

  // Highlight special terms inside brackets [Term]
  const parts = msg.split(/(\[^\]+\])/g);
  return (
    <div style={{ fontSize:"0.7rem", lineHeight:1.9, color, position:"relative" }}>
      {parts.map((part, i) => {
        const inner = part.replace(/^\[|\]$/g,"");
        const entry = GLOSSARY[inner];
        if (part.startsWith("[") && part.endsWith("]") && entry) {
          return (
            <span key={i} style={{ position:"relative", display:"inline-block" }}>
              <span
                onMouseEnter={()=>setTooltip(i)}
                onMouseLeave={()=>setTooltip(null)}
                style={{ cursor:"help", borderBottom:`1px dashed ${entry.color}88`, color:entry.color, fontWeight:700, fontSize:"0.68rem" }}>
                {entry.icon} {inner}
              </span>
              {tooltip===i && (
                <div style={{ position:"absolute", bottom:"110%", left:"50%", transform:"translateX(-50%)", zIndex:999,
                  background:"rgba(8,5,20,0.98)", border:`1px solid ${entry.color}66`, borderRadius:10,
                  padding:"7px 11px", minWidth:180, maxWidth:260, fontSize:"0.6rem", color:"#c8c0e0",
                  lineHeight:1.6, boxShadow:`0 4px 16px rgba(0,0,0,0.6),0 0 12px ${entry.color}22`,
                  whiteSpace:"normal", pointerEvents:"none" }}>
                  <div style={{ fontFamily:"Cinzel,serif", color:entry.color, fontWeight:700, marginBottom:3, fontSize:"0.62rem" }}>{entry.icon} {inner}</div>
                  {entry.tip}
                  <div style={{ position:"absolute", bottom:-5, left:"50%", transform:"translateX(-50%)",
                    width:8, height:8, background:"rgba(8,5,20,0.98)", border:`1px solid ${entry.color}44`,
                    borderTop:"none", borderLeft:"none", transform:"translateX(-50%) rotate(45deg)" }} />
                </div>
              )}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE: COLEÇÃO
═══════════════════════════════════════════════ */
function CollectionPage({ collection, onAddDeck, deck, showToast, getCardImg }) {
  const [filter, setFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [sort, setSort] = useState("name");
  const [selectedCard, setSelectedCard] = useState(null);

  const filtered = ALL_CARDS
    .filter(c => filter==="all" || c.tipo===filter)
    .filter(c => kindFilter==="all" || c.kind===kindFilter)
    .sort((a,b) => sort==="name" ? a.name.localeCompare(b.name) : sort==="vel" ? b.velocidade-a.velocidade : sort==="atk" ? b.atk-a.atk : 0);

  const owned = ALL_CARDS.filter(c=>collection[c.id]).length;

  return (
    <div style={{ padding:"24px 20px 40px", maxWidth:1200, margin:"0 auto" }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontFamily:"Cinzel Decorative,cursive", fontSize:"1.8rem", background:"linear-gradient(135deg,#a8e063,#fbbf24)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:6 }}>Biblioteca de Cartas</h2>
        <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
          <span style={{ color:"#5a4880", fontSize:"0.82rem" }}>Possuídas: <strong style={{ color:"#a78bfa" }}>{owned}</strong> / {ALL_CARDS.length}</span>
          <div style={{ flex:1, minWidth:120, height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, maxWidth:200 }}>
            <div style={{ height:"100%", borderRadius:3, background:"linear-gradient(90deg,#4ade80,#a78bfa)", width:`${owned/ALL_CARDS.length*100}%`, transition:"width 0.5s" }} />
          </div>
        </div>
      </div>

      {/* Filtro por Tipo de Carta */}
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:"0.62rem", color:"#3a2a6a", letterSpacing:"0.1em", marginBottom:6, fontFamily:"Cinzel,serif" }}>TIPO DE CARTA</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {[{k:"all",l:"Todos",c:"#9080b0",icon:"◈"}, ...Object.entries(CARD_KINDS).map(([k,v])=>({k,l:v.label,c:v.color,icon:v.icon}))].map(f=>(
            <button key={f.k} onClick={()=>setKindFilter(f.k)} style={{
              padding:"4px 12px", borderRadius:20, border:`1px solid ${kindFilter===f.k?f.c:"rgba(255,255,255,0.08)"}`,
              background:kindFilter===f.k?`${f.c}20`:"transparent", color:kindFilter===f.k?f.c:"#5a4880",
              fontFamily:"Cinzel,serif", fontSize:"0.68rem", cursor:"pointer", transition:"all 0.2s",
              display:"flex", alignItems:"center", gap:4 }}>
              <span>{f.icon}</span>{f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro por Elemento */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
        {[{k:"all",l:"Todos os Elementos",c:"#a78bfa"}, ...Object.entries(TYPES).map(([k,v])=>({k,l:`${v.icon} ${v.label}`,c:v.color}))].map(f=>(
          <button key={f.k} onClick={()=>setFilter(f.k)} style={{
            padding:"4px 12px", borderRadius:20, border:`1px solid ${filter===f.k?f.c:"rgba(255,255,255,0.08)"}`,
            background:filter===f.k?`${f.c}20`:"transparent", color:filter===f.k?f.c:"#5a4880",
            fontFamily:"Cinzel,serif", fontSize:"0.68rem", cursor:"pointer", transition:"all 0.2s" }}>{f.l}</button>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", gap:5 }}>
          {[{k:"name",l:"A-Z"},{k:"vel",l:"⚡VEL"},{k:"atk",l:"⚔ATK"}].map(s=>(
            <button key={s.k} onClick={()=>setSort(s.k)} style={{ padding:"4px 10px", borderRadius:20,
              border:`1px solid ${sort===s.k?"#a78bfa":"rgba(255,255,255,0.08)"}`,
              background:sort===s.k?"rgba(167,139,250,0.15)":"transparent",
              color:sort===s.k?"#a78bfa":"#5a4880", fontFamily:"Cinzel,serif", fontSize:"0.65rem", cursor:"pointer", transition:"all 0.2s" }}>{s.l}</button>
          ))}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(165px,1fr))", gap:12 }}>
        {filtered.map(c=>(
          <GameCard key={c.id} card={c} dimmed={!collection[c.id]}
            onClick={()=>setSelectedCard(c)} selected={false}
            showAddBtn={!!collection[c.id]}
            inDeck={deck.some(d=>d.id===c.id)}
            imgSrc={getCardImg?getCardImg(c):null}
            onAdd={()=>{onAddDeck(c);showToast(`✨ ${c.name} adicionada ao deck!`);}}
          />
        ))}
      </div>

      {/* Legenda dos tipos de carta — visual aprimorado */}
      <div style={{ marginTop:40 }}>
        <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.72rem", color:"#5a4880", marginBottom:14, letterSpacing:"0.12em", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ height:1, flex:1, background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.3))" }} />
          CATEGORIAS DE CARTA
          <span style={{ height:1, flex:1, background:"linear-gradient(90deg,rgba(167,139,250,0.3),transparent)" }} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
          {Object.entries(CARD_KINDS).map(([k,v])=>{
            const kindCards = ALL_CARDS.filter(c=>c.kind===k);
            const ownedKind = kindCards.filter(c=>collection[c.id]).length;
            return (
              <div key={k} onClick={()=>setKindFilter(kindFilter===k?"all":k)}
                style={{ padding:"14px 16px", borderRadius:14, cursor:"pointer",
                  background: kindFilter===k ? `${v.color}18` : "rgba(255,255,255,0.02)",
                  border:`1px solid ${kindFilter===k?v.color+"66":v.color+"22"}`,
                  transition:"all 0.2s",
                  boxShadow: kindFilter===k ? `0 0 16px ${v.color}22` : "none" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:`${v.color}20`, border:`1px solid ${v.color}44`,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem" }}>{v.icon}</div>
                  <div>
                    <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.82rem", color:v.color, fontWeight:700 }}>{v.label}</div>
                    <div style={{ fontSize:"0.58rem", color:"#5a4880", marginTop:1 }}>{ownedKind}/{kindCards.length} possuídas</div>
                  </div>
                </div>
                <div style={{ fontSize:"0.65rem", color:"#4a3870", lineHeight:1.6, marginBottom:8 }}>{v.desc}</div>
                {/* Mini progress */}
                <div style={{ height:3, background:"rgba(255,255,255,0.04)", borderRadius:2, overflow:"hidden" }}>
                  <div style={{ height:"100%", background:v.color, width:`${kindCards.length>0?ownedKind/kindCards.length*100:0}%`, borderRadius:2, transition:"width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedCard && (
        <CardModal card={selectedCard} onClose={()=>setSelectedCard(null)}
          owned={collection[selectedCard.id]}
          inDeck={deck.some(d=>d.id===selectedCard.id)}
          imgSrc={getCardImg?getCardImg(selectedCard):null}
          onAdd={()=>{onAddDeck(selectedCard);showToast(`✨ ${selectedCard.name} adicionada!`);setSelectedCard(null);}}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE: DECK BUILDER
═══════════════════════════════════════════════ */
function DeckPage({ collection, deck, setDeck, showToast, getCardImg }) {
  const [selectedCard, setSelectedCard] = useState(null);
  const [deckName, setDeckName] = useState("Meu Deck");
  const [editing, setEditing] = useState(false);

  const ownedCards = ALL_CARDS.filter(c=>collection[c.id]);
  const addCard = c => {
    if (deck.some(d=>d.id===c.id)) { showToast("Carta já está no deck!"); return; }
    if (deck.length>=10) { showToast("Deck cheio! Máximo 10 cartas."); return; }
    setDeck([...deck,c]); showToast(`✨ ${c.name} adicionada!`);
  };
  const removeCard = id => setDeck(deck.filter(c=>c.id!==id));
  const kindCount = Object.keys(CARD_KINDS).reduce((acc,k)=>({...acc,[k]:deck.filter(c=>c.kind===k).length}),{});

  return (
    <div style={{ padding:"24px 20px 40px", maxWidth:1300, margin:"0 auto" }}>
      <h2 style={{ fontFamily:"Cinzel Decorative,cursive", fontSize:"1.8rem", background:"linear-gradient(135deg,#a78bfa,#f472b6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:6 }}>Deck Builder</h2>
      <p style={{ color:"#5a4880", fontSize:"0.82rem", marginBottom:24 }}>Monte seu deck com até 10 cartas. Combine Agentes, Criaturas, Habilidades e Terrenos com estratégia.</p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:20, alignItems:"start" }}>
        <div>
          <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.75rem", color:"#5a4880", letterSpacing:"0.1em", marginBottom:12 }}>
            CARTAS DISPONÍVEIS ({ownedCards.length})
          </div>
          {ownedCards.length===0 ? (
            <div style={{ padding:40, textAlign:"center", color:"#3a2a6a", fontSize:"0.88rem", border:"1px dashed rgba(167,139,250,0.2)", borderRadius:14 }}>
              Você ainda não possui cartas! Visite a <strong style={{color:"#a78bfa"}}>Loja</strong> para abrir pacotes.
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:10 }}>
              {ownedCards.map(c=>(
                <GameCard key={c.id} card={c} onClick={()=>setSelectedCard(c)}
                  inDeck={deck.some(d=>d.id===c.id)} showAddBtn selected={false}
                  imgSrc={getCardImg?getCardImg(c):null}
                  onAdd={()=>addCard(c)} />
              ))}
            </div>
          )}
        </div>

        <div style={{ background:"rgba(10,5,25,0.9)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:16, padding:20, position:"sticky", top:72 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
            {editing ? (
              <input value={deckName} onChange={e=>setDeckName(e.target.value)} onBlur={()=>setEditing(false)} autoFocus
                style={{ flex:1, background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.4)", borderRadius:8, padding:"6px 10px", color:"#f0e8ff", fontFamily:"Cinzel,serif", fontSize:"0.85rem", outline:"none" }} />
            ) : (
              <div style={{ flex:1, fontFamily:"Cinzel,serif", fontSize:"0.9rem", color:"#fbbf24", fontWeight:700 }}>{deckName}</div>
            )}
            <button onClick={()=>setEditing(!editing)} style={{ background:"none", border:"none", color:"#5a4880", cursor:"pointer", fontSize:"0.85rem" }}>✏️</button>
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <span style={{ fontFamily:"Cinzel,serif", fontSize:"0.72rem", color:"#5a4880" }}>{deck.length}/10 cartas</span>
            <div style={{ width:80, height:5, background:"rgba(255,255,255,0.06)", borderRadius:3 }}>
              <div style={{ height:"100%", borderRadius:3, background:"linear-gradient(90deg,#a78bfa,#f472b6)", width:`${deck.length/10*100}%`, transition:"width 0.4s" }} />
            </div>
          </div>

          {deck.length>0 && (
            <div style={{ marginBottom:12, display:"flex", flexWrap:"wrap", gap:4 }}>
              {Object.entries(kindCount).filter(([,v])=>v>0).map(([k,v])=>(
                <div key={k} style={{ padding:"2px 8px", borderRadius:20, background:`${CARD_KINDS[k].color}18`, border:`1px solid ${CARD_KINDS[k].color}44`, fontSize:"0.6rem", color:CARD_KINDS[k].color }}>
                  {CARD_KINDS[k].icon} {CARD_KINDS[k].label}: {v}
                </div>
              ))}
            </div>
          )}

          <div style={{ height:1, background:"rgba(255,255,255,0.06)", marginBottom:12 }} />

          {deck.length===0 ? (
            <div style={{ padding:"20px 0", textAlign:"center", color:"#3a2a5a", fontSize:"0.78rem" }}>Nenhuma carta no deck</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
              {deck.map(c=>{
                const t=TYPES[c.tipo]; const k=CARD_KINDS[c.kind]||CARD_KINDS.criatura;
                return (
                  <div key={c.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 8px", borderRadius:8, background:`${t.color}08`, border:`1px solid ${t.color}22`, transition:"all 0.2s" }}>
                    <span style={{ fontSize:"1.1rem" }}>{c.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.68rem", color:"#d0c0f0" }}>{c.name}</div>
                      <div style={{ fontSize:"0.58rem", color:k.color }}>{k.icon} {k.label} · ⚡{c.velocidade??5}</div>
                    </div>
                    <div style={{ display:"flex", gap:4, fontSize:"0.58rem" }}>
                      <span style={{ color:"#ff5533" }}>⚔{c.atk}</span>
                      <span style={{ color:"#4ade80" }}>❤{c.hp}</span>
                    </div>
                    <button onClick={()=>removeCard(c.id)} style={{ background:"none", border:"none", color:"#ff5533", cursor:"pointer", fontSize:"0.85rem", padding:"0 2px", opacity:0.7 }}>✕</button>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{setDeck([]);showToast("Deck limpo!");}} style={{ flex:1, padding:"8px", borderRadius:10, border:"1px solid rgba(255,85,51,0.3)", background:"rgba(255,85,51,0.1)", color:"#ff5533", fontFamily:"Cinzel,serif", fontSize:"0.68rem", cursor:"pointer" }}>🗑 Limpar</button>
            <button onClick={()=>{if(deck.length<3){showToast("Adicione pelo menos 3 cartas!");return;}showToast(`✅ "${deckName}" salvo!`);}} style={{ flex:2, padding:"8px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#3a7f10,#6abe2a)", color:"#fff", fontFamily:"Cinzel,serif", fontSize:"0.68rem", fontWeight:700, cursor:"pointer" }}>💾 Salvar Deck</button>
          </div>
        </div>
      </div>

      {selectedCard && (
        <CardModal card={selectedCard} onClose={()=>setSelectedCard(null)}
          owned={collection[selectedCard.id]}
          inDeck={deck.some(d=>d.id===selectedCard.id)}
          imgSrc={getCardImg?getCardImg(selectedCard):null}
          onAdd={()=>{addCard(selectedCard);setSelectedCard(null);}}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE: LOJA
═══════════════════════════════════════════════ */
function ShopPage({ gems, setGems, collection, setCollection, showToast }) {
  const [openResult, setOpenResult] = useState(null);
  const [opening, setOpening] = useState(false);

  const buyPack = pack => {
    if (pack.isGems) {
      if (pack.price > gems) { showToast("💸 Saldo insuficiente!"); return; }
      setGems(g=>g-pack.price+pack.gemsVal);
      showToast(`💎 +${pack.gemsVal} gemas!`); return;
    }
    if (gems<pack.price) { showToast("💎 Gemas insuficientes!"); return; }
    setGems(g=>g-pack.price);
    setOpening(true);
    setTimeout(()=>{
      const pool = ALL_CARDS.filter(c=>{
        if (pack.rarity==="lendaria") return true;
        if (pack.rarity==="epica") return c.rarity!=="lendaria"||Math.random()<0.15;
        return c.rarity==="comum"||c.rarity==="rara"||Math.random()<0.1;
      });
      const picks=[]; const guarantee=pack.rarity; let hasGuarantee=false;
      const shuffled=[...pool].sort(()=>Math.random()-0.5);
      for(let i=0;i<pack.cardsCount;i++){
        let card=shuffled[i%shuffled.length];
        if(!hasGuarantee&&i===pack.cardsCount-1){
          const g=ALL_CARDS.filter(c=>c.rarity===guarantee);
          card=g[Math.floor(Math.random()*g.length)]; hasGuarantee=true;
        }
        picks.push(card);
      }
      const newCol={...collection};
      picks.forEach(c=>{newCol[c.id]=true;});
      setCollection(newCol); setOpenResult(picks); setOpening(false);
    },800);
  };

  return (
    <div style={{ padding:"24px 20px 40px", maxWidth:1100, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12, marginBottom:28 }}>
        <div>
          <h2 style={{ fontFamily:"Cinzel Decorative,cursive", fontSize:"1.8rem", background:"linear-gradient(135deg,#fbbf24,#f472b6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:4 }}>Mercado da Floresta</h2>
          <p style={{ color:"#5a4880", fontSize:"0.82rem" }}>Abra pacotes para expandir sua coleção com cartas poderosas</p>
        </div>
        <div style={{ background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.3)", borderRadius:30, padding:"8px 20px", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:"1.2rem" }}>💎</span>
          <span style={{ fontFamily:"Cinzel,serif", fontSize:"1.1rem", fontWeight:700, color:"#fbbf24" }}>{gems.toLocaleString()}</span>
          <span style={{ color:"#5a4880", fontSize:"0.72rem" }}>gemas</span>
        </div>
      </div>

      {opening && (
        <div style={{ textAlign:"center", padding:60 }}>
          <div style={{ fontSize:"4rem", animation:"spin 0.8s linear infinite" }}>🌀</div>
          <div style={{ fontFamily:"Cinzel,serif", color:"#a78bfa", marginTop:16 }}>Abrindo pacote...</div>
        </div>
      )}

      {openResult && (
        <div style={{ marginBottom:32, padding:24, borderRadius:18, background:"rgba(10,5,25,0.9)", border:"1px solid rgba(251,191,36,0.3)" }}>
          <div style={{ fontFamily:"Cinzel Decorative,cursive", fontSize:"1.1rem", color:"#fbbf24", textAlign:"center", marginBottom:20 }}>✦ Cartas Obtidas! ✦</div>
          <div style={{ display:"flex", gap:14, flexWrap:"wrap", justifyContent:"center", marginBottom:20 }}>
            {openResult.map((c,i)=>(
              <div key={i} style={{ width:140, animation:`cardReveal 0.4s ease ${i*0.15}s both` }}>
                <GameCard card={c} onClick={()=>{}} selected={false} />
              </div>
            ))}
          </div>
          <div style={{ textAlign:"center" }}>
            <button onClick={()=>setOpenResult(null)} style={{ padding:"10px 28px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#3a7f10,#6abe2a)", color:"#fff", fontFamily:"Cinzel,serif", fontWeight:700, fontSize:"0.78rem", cursor:"pointer" }}>Continuar</button>
          </div>
        </div>
      )}

      {!opening && !openResult && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:20 }}>
          {PACKS.map(pack=>{
            const r=RARITIES[pack.rarity]||{color:"#67e8f9"};
            return (
              <div key={pack.id} style={{ background:"linear-gradient(160deg,#0a0520,#12082a)", border:`1px solid ${pack.color}44`, borderRadius:18, overflow:"hidden", transition:"all 0.3s" }}
                onMouseEnter={e=>e.currentTarget.style.transform="translateY(-5px)"}
                onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                <div style={{ height:140, display:"flex", alignItems:"center", justifyContent:"center", background:`radial-gradient(ellipse at 50% 50%,${pack.color}22,transparent 70%)`, fontSize:"4.5rem", position:"relative" }}>
                  <span style={{ filter:`drop-shadow(0 0 20px ${pack.color})` }}>{pack.art}</span>
                  {pack.rarity && <div style={{ position:"absolute", top:10, right:10, padding:"3px 10px", borderRadius:20, background:`${r.color}22`, border:`1px solid ${r.color}55`, fontSize:"0.62rem", fontFamily:"Cinzel,serif", color:r.color }}>{r.label}</div>}
                </div>
                <div style={{ padding:"16px 20px 20px" }}>
                  <div style={{ fontFamily:"Cinzel,serif", fontSize:"1rem", fontWeight:700, color:"#f0e8ff", marginBottom:6 }}>{pack.name}</div>
                  <div style={{ fontSize:"0.78rem", color:"#5a4880", marginBottom:16, lineHeight:1.6 }}>{pack.desc}</div>
                  {!pack.isGems && (
                    <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
                      {["comum","rara","epica","lendaria"].map(rr=>{
                        const prob=pack.id==="legend"?[0,10,40,50]:pack.id==="premium"?[15,40,40,5]:[40,45,14,1];
                        const pidx=["comum","rara","epica","lendaria"].indexOf(rr);
                        return <div key={rr} style={{ fontSize:"0.58rem", padding:"2px 6px", borderRadius:10, background:`${RARITIES[rr].color}18`, color:RARITIES[rr].color, border:`1px solid ${RARITIES[rr].color}33` }}>{RARITIES[rr].label} {prob[pidx]}%</div>;
                      })}
                    </div>
                  )}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ fontFamily:"Cinzel,serif", fontSize:"1.15rem", fontWeight:700, color:pack.isGems?"#67e8f9":"#fbbf24", display:"flex", alignItems:"center", gap:6 }}>
                      {pack.isGems?`R$ ${pack.price}`:<><span>💎</span>{pack.price.toLocaleString()}</>}
                    </div>
                    <button onClick={()=>buyPack(pack)} style={{ padding:"8px 20px", borderRadius:10, border:"none", cursor:"pointer", background:`linear-gradient(135deg,${pack.color}88,${pack.color})`, color:"#fff", fontFamily:"Cinzel,serif", fontSize:"0.72rem", fontWeight:700, boxShadow:`0 4px 16px ${pack.color}44`, transition:"all 0.2s" }}>
                      {pack.isGems?"Comprar":"Abrir Pacote"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SISTEMA DE COMBATE — PASSIVAS & MECÂNICAS
═══════════════════════════════════════════════ */

function applyPassiveTrigger(card, trigger, context={}) {
  if (!card || !card.passivaTrigger || card.silenced) return {};
  const e = card.passivaEffect || {};
  const result = {};

  // hp_below_half → Yuji: +20% DEF
  if (card.passivaTrigger==="hp_below_half" && trigger==="check_def") {
    if (card.currentHp < card.hp * 0.5) {
      result.defBonus = e.defBonus || 0;
      result.passivaActive = true;
    }
  }
  // Flash Cego (Jay) — sempre ativo; imunidade a debuffs sensoriais já é lógica do combat loop
  if (card.passivaTrigger==="always" && e.immuneToBlind && trigger==="check_immune") {
    result.immuneSensory = true;
  }
  // end_of_turn → Crescimento (Guerreiro Raiz)
  if (card.passivaTrigger==="end_of_turn" && trigger==="end_of_turn") {
    result.atkBonus = e.atkBonus || 0;
  }
  // on_hit → Esquiva (Leopardo)
  if (card.passivaTrigger==="on_hit" && trigger==="on_hit") {
    if (Math.random() < (e.dodgeChance||0)) result.dodge = true;
  }
  // first_hit → Barreira (Rocha Viva)
  if (card.passivaTrigger==="first_hit" && trigger==="first_hit") {
    if (e.blockFirst && !card.barrierUsed) result.block = true;
  }
  // start_of_turn → Regeneração / Árvore Sagrada
  if (card.passivaTrigger==="start_of_turn" && trigger==="start_of_turn") {
    result.heal = e.healPerTurn || 0;
    result.healPlayer = e.healPlayerPerTurn || 0;
  }
  // always taunt
  if (card.passivaTrigger==="always" && e.taunt) {
    result.taunt = true;
  }
  // on_attack → condBonusDmg (Loba), doubleAttack (Beija-Flor), envenenar (Cogumelo)
  if (card.passivaTrigger==="on_attack" && trigger==="on_attack") {
    if (e.doubleAttack) result.doubleAttack = true;
    if (e.condBonusDmg && context.targetHp < card.currentHp) result.condBonusDmg = e.condBonusDmg;
    if (e.poison) result.poison = e.poison;
  }
  // on_death → Fênix
  if (card.passivaTrigger==="on_death" && trigger==="on_death") {
    if (e.reviveHalfHp) result.revive = Math.floor(card.hp * 0.5);
  }
  // first_attack_turn → Fúria (Urso)
  if (card.passivaTrigger==="first_attack_turn" && trigger==="first_attack_turn") {
    result.furyBonus = e.furyBonus || 0;
  }

  return result;
}

function calcDmg(attacker, target, isFury=false, isCond=false) {
  // Calcula DEF efetiva — base: DEF reduz dano de forma gradual
  let baseDef = target.def;
  let yujiPassive = false;

  // Passiva Yuji: "Suporte à Vida" — quando HP < 50%, +20% de DEF
  if (target.passivaTrigger==="hp_below_half" && target.currentHp !== undefined && target.currentHp < target.hp * 0.5 && !target.silenced) {
    const yujiBonus = target.yujiDefBonusUpgrade || 0.20; // Manto do Camaleão upgrades this to 0.40
    baseDef = Math.round(baseDef * (1 + yujiBonus));
    yujiPassive = true;
  }

  // Fórmula: dano base = ATK do atacante - (DEF / 3) do defensor, mínimo 1
  // Fúria: +4 ATK bônus
  const atkTotal = attacker.atk + (isFury ? 4 : 0);
  const dmgReduction = Math.floor(baseDef / 3);
  let dmg = Math.max(1, atkTotal - dmgReduction);

  // Loba da Tempestade: +50% se alvo com menos HP
  if (isCond) dmg = Math.floor(dmg * 1.5);

  return { dmg, yujiPassive };
}

/* ═══════════════════════════════════════════════
   PAGE: BATALHA
═══════════════════════════════════════════════ */
function BattlePage({ deck, collection, showToast, getCardImg }) {
  // ── INICIALIZAR CARTA (compartilhado jogador/inimigo) ────────────────
  const initCard = (c, prefix="p") => {
    // Vigor base por tipo de carta
    const baseVigor = c.vigor ?? (c.kind==="agente"?15:c.kind==="criatura"?10:c.kind==="terreno"?8:4);
    return {
    ...c,
    currentHp: c.hp,
    uid: `${prefix}_${c.id}_${Math.random().toString(36).slice(2)}`,
    status: [], barrierUsed:false, passivaActive:false, turnAttacked:false,
    skillCooldowns: {},
    stunned:false, rooted:false, feared:false, marked:false, markedBonus:0, markedDur:0,
    defBuff:0, defBuffDur:0, atkBuff:0, atkBuffDur:0, velBuff:0, velBuffDur:0,
    thorns:0, thornsDur:0, dmgReduction:0, dmgReductionDur:0,
    shielded:false, regenBuff:0, regenBuffDur:0, grantDodge:false,
    stealth:false, stealthTurns:0,
    inFusion:false, fusionTurns:0, fusionPassiva:null,
    pontoReferencial:false, pontoReferencialTurns:0,
    predictDodge:false, predictDodgeCounter:0,
    piquePega:false, piquePegaTurns:0, piquePegaDodge:0,
    equippedItem:null,
    lifeSteal:0, itemAlwaysFirst:false, itemVigorDiscount:0,
    itemHealPerTurn:0, itemVigorRegenBonus:0,
    yujiDefBonusUpgrade:0, kataMultiplierUpgrade:3,
    jayBypassDodgeUpgrade:0,
    currentVigor: baseVigor,
    maxVigor: baseVigor,
  };
  };

  // Gera um deck de 8 cartas para o inimigo (não inclui consumíveis próprios, mas inclui cartas do pool)
  const makeEnemyDeck = () => {
    const pool = ALL_CARDS.filter(c => !c.isStarter && !c.isConsumable && !c.isItem);
    const shuffled = [...pool].sort(()=>Math.random()-0.5);
    // Garante ao menos 1 Lendária, 2 Épicas
    const lend = shuffled.filter(c=>c.rarity==="lendaria").slice(0,1);
    const epic = shuffled.filter(c=>c.rarity==="epica").slice(0,2);
    const rest = shuffled.filter(c=>!lend.includes(c)&&!epic.includes(c)).slice(0,5);
    return [...lend,...epic,...rest].slice(0,8).map(c=>initCard(c,"e"));
  };

  const makeEnemy = () => makeEnemyDeck();
  const makeHand = (cards) => cards.map(c => initCard(c, "p"));

  const getPlayDeck = useCallback(()=>{
    if (deck.length>=3) return deck;
    const fallback = ALL_CARDS.filter(c=>collection[c.id]);
    return fallback.length>=3?fallback.slice(0,8):ALL_CARDS.slice(0,8);
  },[deck,collection]);

  const [phase, setPhase] = useState("menu");
  const [mode, setMode] = useState(null);
  const [G, setG] = useState(null);
  const [log, setLog] = useState([]);
  const [selected, setSelected] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [skillPanel, setSkillPanel] = useState(null);
  const [targetedEnemy, setTargetedEnemy] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [floats, setFloats] = useState([]);
  const spawnFloat = useCallback((text, color="#ff5533", side="enemy") => {
    const id = Date.now()+Math.random();
    setFloats(f=>[...f,{id,text,color,side}]);
    setTimeout(()=>setFloats(f=>f.filter(x=>x.id!==id)),1400);
  },[]);

  const addLog = useCallback((msg, cls="log-normal") =>
    setLog(l=>[...l.slice(-30), {msg,cls,id:Date.now()+Math.random()}]), []);

  // ── USE SKILL ──────────────────────────────────────────────
  const useSkill = (casterUid, skillId) => {
    if (!G || animating || G.turn !== "player") return;
    const skill = SKILLS[skillId];
    if (!skill) return;

    const casterIdx = G.playerField.findIndex(c => c.uid === casterUid);
    if (casterIdx === -1) return;
    const caster = G.playerField[casterIdx];

    const effectiveCost = Math.max(1, skill.vigorCost - (caster.itemVigorDiscount||0));
    if ((caster.currentVigor ?? 0) < effectiveCost) {
      showToast(`Vigor insuficiente! (precisa ${effectiveCost}, tem ${caster.currentVigor})`); return;
    }
    const cd = (caster.skillCooldowns && caster.skillCooldowns[skillId]) || 0;
    if (cd > 0) { showToast(`Habilidade em recarga! (${cd} turnos)`); return; }

    setAnimating(true);
    let newG = {
      ...G,
      playerField: G.playerField.map(c=>({...c})),
      enemyField: G.enemyField.map(c=>({...c})),
    };

    const C = newG.playerField[casterIdx];
    C.currentVigor -= effectiveCost;
    C.skillCooldowns = { ...C.skillCooldowns, [skillId]: skill.cooldown };

    const e = skill.effect;
    addLog(`✦ ${caster.emoji} ${caster.name} usa "${skill.name}"!`, "log-skill");

    switch(e.type) {
      // ── Cura própria
      case "heal":
        C.currentHp = Math.min(C.hp, C.currentHp + e.value);
        addLog(`💚 ${caster.name} recuperou ${e.value} HP! (HP: ${C.currentHp})`, "log-skill");
        break;

      // ── Dano direto (ignora DEF se e.ignoresDef)
      case "direct_dmg": {
        const target = newG.enemyField[0];
        if (!target) { addLog("Nenhum alvo disponível.", "log-skill"); break; }
        const tidx = newG.enemyField.findIndex(c=>c.uid===target.uid);
        const dmg = e.ignoresDef ? e.value : Math.max(1, e.value - Math.floor(target.def/3));
        const blocked = !e.ignoresDodge && target.grantDodge && Math.random() < 0.4;
        if (blocked) { addLog(`💨 ${target.name} esquivou da habilidade!`, "log-enemy"); break; }
        if (target.shielded) { newG.enemyField[tidx].shielded = false; addLog(`🛡 ${target.name} absorveu o ataque com escudo!`, "log-enemy"); break; }
        newG.enemyField[tidx].currentHp = Math.max(0, target.currentHp - dmg);
        addLog(`💥 ${caster.name} causou ${dmg} de dano em ${target.name}!`, "log-skill");
        if (newG.enemyField[tidx].currentHp <= 0) { newG.enemyField.splice(tidx, 1); addLog(`💀 ${target.name} foi destruído!`, "log-skill"); }
        break;
      }

      // ── Dano área (todos inimigos)
      case "aoe_dmg": case "aoe_burn":
        newG.enemyField = newG.enemyField.map(t => {
          const dmg = Math.max(1, e.value - Math.floor(t.def/3));
          const nhp = Math.max(0, t.currentHp - dmg);
          addLog(`💥 ${t.name} recebeu ${dmg} de dano!`, "log-skill");
          return {...t, currentHp: nhp};
        }).filter(t => t.currentHp > 0);
        break;

      // ── Veneno em área
      case "aoe_poison":
        newG.enemyField = newG.enemyField.map(t => ({
          ...t, status:[...t.status.filter(s=>s!=="poison"),"poison"],
          poisonTurns: e.turns, poisonDmg: e.dmg,
        }));
        addLog(`☠️ Todos os inimigos [Veneno]s! (${e.dmg} HP/turno × ${e.turns} turnos)`, "log-skill");
        break;

      // ── Buff DEF (self ou aliado)
      case "buff_def": {
        const targets = e.target==="self" ? [casterIdx] : newG.playerField.map((_,i)=>i);
        targets.forEach(i => {
          newG.playerField[i].defBuff = (newG.playerField[i].defBuff||0) + e.value;
          newG.playerField[i].defBuffDur = e.duration;
        });
        addLog(`🛡 ${caster.name} ganhou +${e.value} DEF por ${e.duration} turnos!`, "log-skill");
        break;
      }

      // ── Buff ATK todos aliados
      case "buff_atk_all_allies":
        newG.playerField = newG.playerField.map(c => ({...c, atkBuff:(c.atkBuff||0)+e.value, atkBuffDur:e.duration}));
        addLog(`⚔️ Todos os aliados ganham +${e.value} ATK por ${e.duration} turnos!`, "log-skill");
        break;

      // ── Buff VEL
      case "buff_vel":
        C.velBuff = (C.velBuff||0) + e.value;
        C.velBuffDur = e.duration;
        addLog(`⚡ ${caster.name} ganhou +${e.value} Velocidade por ${e.duration} turnos!`, "log-skill");
        break;

      // ── Debuff ATK inimigos
      case "debuff_atk":
      case "fear":
        newG.enemyField = newG.enemyField.map(t => ({
          ...t, atkBuff:(t.atkBuff||0)+e.value, atkBuffDur:e.duration||1,
          feared: e.type==="fear" ? true : t.feared,
        }));
        addLog(`😨 Inimigos com -${Math.abs(e.value)} ATK por ${e.duration} turnos!`, "log-skill");
        break;

      // ── Poder de ataque temporário
      case "empower_attack":
        C.atkBuff = (C.atkBuff||0) + e.value;
        C.atkBuffDur = e.duration;
        addLog(`⚔️ Próximo ataque de ${caster.name} com +${e.value} ATK!`, "log-skill");
        break;

      // ── Espinhos (thorns)
      case "thorns":
        C.thorns = e.value; C.thornsDur = e.duration;
        addLog(`🌵 ${caster.name} com Espinhos! Devolve ${e.value} de dano por ${e.duration} turnos.`, "log-skill");
        break;

      // ── Redução de dano
      case "damage_reduction":
        C.dmgReduction = e.value; C.dmgReductionDur = e.duration;
        addLog(`🐚 ${caster.name} reduz dano em ${Math.round(e.value*100)}% por ${e.duration} turno!`, "log-skill");
        break;

      // ── DEF como dano
      case "def_as_dmg": {
        const target = newG.enemyField[0];
        if (!target) break;
        const tidx = newG.enemyField.findIndex(c=>c.uid===target.uid);
        const dmg = C.def + (C.defBuff||0);
        newG.enemyField[tidx].currentHp = Math.max(0, target.currentHp - dmg);
        addLog(`💥 ${caster.name} usa sua DEF (${dmg}) como dano!`, "log-skill");
        if (newG.enemyField[tidx].currentHp <= 0) { newG.enemyField.splice(tidx,1); addLog(`💀 ${target.name} destruído!`, "log-skill"); }
        break;
      }

      // ── Dano + Sangramento
      case "dmg_bleed": {
        const target = newG.enemyField[0];
        if (!target) break;
        const tidx = newG.enemyField.findIndex(c=>c.uid===target.uid);
        const dmg = Math.max(1, e.dmg - Math.floor(target.def/3));
        newG.enemyField[tidx].currentHp = Math.max(0, target.currentHp - dmg);
        newG.enemyField[tidx].bleed = { value: e.bleed.value, turns: e.bleed.turns };
        newG.enemyField[tidx].status = [...(newG.enemyField[tidx].status||[]).filter(s=>s!=="bleed"), "bleed"];
        addLog(`🩸 ${target.name} recebeu ${dmg} dano + [Sangramento]mento (${e.bleed.value}/turno)!`, "log-skill");
        if (newG.enemyField[tidx].currentHp <= 0) { newG.enemyField.splice(tidx,1); addLog(`💀 ${target.name} destruído!`, "log-skill"); }
        break;
      }

      // ── Stun (paralisia)
      case "stun": {
        const target = newG.enemyField[0];
        if (!target) break;
        const tidx = newG.enemyField.findIndex(c=>c.uid===target.uid);
        newG.enemyField[tidx].stunned = true;
        newG.enemyField[tidx].status = [...(newG.enemyField[tidx].status||[]).filter(s=>s!=="stun"), "stun"];
        addLog(`😵 ${target.name} está paralisado por ${e.duration} turno!`, "log-skill");
        break;
      }

      // ── Root (raízes — não pode atacar)
      case "root": {
        const target = newG.enemyField[0];
        if (!target) break;
        const tidx = newG.enemyField.findIndex(c=>c.uid===target.uid);
        newG.enemyField[tidx].rooted = true;
        newG.enemyField[tidx].status = [...(newG.enemyField[tidx].status||[]).filter(s=>s!=="root"), "root"];
        addLog(`🌿 ${target.name} foi aprisionado por raízes!`, "log-skill");
        break;
      }

      // ── Root todos inimigos
      case "root_all_enemies":
        newG.enemyField = newG.enemyField.map(t => ({
          ...t, rooted:true, status:[...(t.status||[]).filter(s=>s!=="root"),"root"]
        }));
        addLog(`🕸️ Todos os inimigos foram aprisionados por raízes!`, "log-skill");
        break;

      // ── Golpe sombra (pode double strike on dodge)
      case "shadow_strike": {
        const target = newG.enemyField[0];
        if (!target) break;
        const tidx = newG.enemyField.findIndex(c=>c.uid===target.uid);
        const dmg = Math.max(1, e.dmg - Math.floor(target.def/3));
        const didDodge = Math.random() < (C.passivaEffect?.dodgeChance||0.4);
        newG.enemyField[tidx].currentHp = Math.max(0, target.currentHp - (didDodge ? dmg*2 : dmg));
        addLog(`🌑 ${caster.name} causou ${didDodge?dmg*2:dmg} dano${didDodge?" (ataque duplo das sombras!)":""}!`, "log-skill");
        if (newG.enemyField[tidx].currentHp <= 0) { newG.enemyField.splice(tidx,1); addLog(`💀 ${target.name} destruído!`, "log-skill"); }
        break;
      }

      // ── Marcar inimigo
      case "mark": {
        const target = newG.enemyField[0];
        if (!target) break;
        const tidx = newG.enemyField.findIndex(c=>c.uid===target.uid);
        newG.enemyField[tidx].marked = true;
        newG.enemyField[tidx].markedBonus = e.bonus;
        newG.enemyField[tidx].markedDur = e.duration;
        addLog(`🎯 ${target.name} foi marcado! Ataques causam +${e.bonus} dano por ${e.duration} turnos.`, "log-skill");
        break;
      }

      // ── Restaurar Vontade
      case "restore_vontade":
        newG.playerVontade = Math.min(7, newG.playerVontade + e.value);
        addLog(`✦ ${caster.name} restaurou ${e.value} Vontade! (Total: ${newG.playerVontade})`, "log-skill");
        break;

      // ── 2× ATK como dano
      case "double_atk_dmg": {
        const target = newG.enemyField[0];
        if (!target) break;
        const tidx = newG.enemyField.findIndex(c=>c.uid===target.uid);
        const dmg = (C.atk + (C.atkBuff||0)) * 2;
        newG.enemyField[tidx].currentHp = Math.max(0, target.currentHp - dmg);
        addLog(`👊 ${caster.name} SLAM! ${dmg} de dano em ${target.name}!`, "log-skill");
        if (newG.enemyField[tidx].currentHp <= 0) { newG.enemyField.splice(tidx,1); addLog(`💀 ${target.name} destruído!`, "log-skill"); }
        break;
      }

      // ── Cura aliado com menos HP
      case "heal_lowest_ally": {
        if (newG.playerField.length === 0) break;
        const minIdx = newG.playerField.reduce((acc,c,i) => c.currentHp < newG.playerField[acc].currentHp ? i : acc, 0);
        newG.playerField[minIdx].currentHp = Math.min(newG.playerField[minIdx].hp, newG.playerField[minIdx].currentHp + e.value);
        addLog(`💚 ${newG.playerField[minIdx].name} recuperou ${e.value} HP!`, "log-skill");
        break;
      }

      // ── Cura todos aliados
      case "heal_all_allies": case "heal_buff_all_allies":
        newG.playerField = newG.playerField.map(c => {
          const healed = Math.min(c.hp, c.currentHp + (e.healVal ?? e.value ?? 0));
          return { ...c, currentHp:healed, defBuff:(c.defBuff||0)+(e.defVal||0), defBuffDur:e.duration||1 };
        });
        addLog(`💚 Todos os aliados curados em ${e.healVal??e.value} HP!`, "log-skill");
        break;

      // ── Regen todos aliados
      case "regen_all_allies":
        newG.playerField = newG.playerField.map(c => ({...c, regenBuff:e.value, regenBuffDur:e.duration}));
        addLog(`🌿 Todos os aliados recuperarão ${e.value} HP/turno por ${e.duration} turnos!`, "log-skill");
        break;

      // ── Cura aliado específico
      case "heal_ally": {
        const allyIdx = newG.playerField.findIndex(c => c.uid !== casterUid);
        const tIdx = allyIdx !== -1 ? allyIdx : casterIdx;
        newG.playerField[tIdx].currentHp = Math.min(newG.playerField[tIdx].hp, newG.playerField[tIdx].currentHp + e.value);
        addLog(`💚 ${newG.playerField[tIdx].name} curado em ${e.value} HP!`, "log-skill");
        break;
      }

      // ── Escudo (bloqueia próximo ataque)
      case "shield_ally": {
        const allyIdx = newG.playerField.findIndex(c => c.uid !== casterUid);
        const tIdx = allyIdx !== -1 ? allyIdx : casterIdx;
        newG.playerField[tIdx].shielded = true;
        addLog(`🛡 ${newG.playerField[tIdx].name} protegido! Próximo ataque será absorvido.`, "log-skill");
        break;
      }

      // ── Conceder esquiva
      case "grant_dodge": {
        const allyIdx = newG.playerField.findIndex(c => c.uid !== casterUid);
        const tIdx = allyIdx !== -1 ? allyIdx : casterIdx;
        newG.playerField[tIdx].grantDodge = true;
        addLog(`💨 ${newG.playerField[tIdx].name} garante esquiva total neste turno!`, "log-skill");
        break;
      }

      // ── Bônus DEF para próximo aliado a entrar
      case "next_ally_def_bonus":
        newG.nextAllyDefBonus = (newG.nextAllyDefBonus || 0) + e.value;
        addLog(`⛰️ Próximo aliado a entrar ganha +${e.value} DEF permanente!`, "log-skill");
        break;

      // ── Sem alvo (invulnerable)
      case "untargetable":
        C.untargetable = true;
        C.untargetableDur = e.duration;
        addLog(`🌫️ ${caster.name} desapareceu! Não pode ser alvo por ${e.duration} turno.`, "log-skill");
        break;

      // ── Mutação (Cogumelo)
      case "mutate":
        C.atk += e.atkBonus; C.def += e.defBonus;
        C.currentHp = Math.max(1, C.currentHp - e.hpCost);
        addLog(`🧬 ${caster.name} mutou! ATK+${e.atkBonus}, DEF+${e.defBonus}, HP-${e.hpCost}.`, "log-skill");
        break;

      // ══ JAY BUNMI — HABILIDADES ════════════════════

      // Ponto Referencial — Habilidade de Vontade
      case "ponto_referencial": {
        const sb = e.statBoosts || {};
        C.velBuff = (C.velBuff||0) + (sb.velBonus||0);
        C.velBuffDur = e.duration;
        C.pontoReferencial = true;
        C.pontoReferencialTurns = e.duration;
        C.status = [...(C.status||[]).filter(s=>s!=="ponto_ref"), "ponto_ref"];
        addLog(`📍 PONTO REFERENCIAL! ${caster.emoji} ${caster.name} mapeia o campo inteiro!`, "log-fusion");
        addLog(`⚡ VEL +${sb.velBonus} por ${e.duration} turnos · Todos os ataques ignoram [Esquiva] e [Furtividade] · Duplo alvo ativo!`, "log-fusion");
        break;
      }

      // Corrida Relâmpago — dano baseado em Velocidade
      case "velocity_strike": {
        const target = newG.enemyField[0];
        if (!target) { addLog("Nenhum alvo no campo.", "log-info"); break; }
        const tidx = newG.enemyField.findIndex(x=>x.uid===target.uid);
        // Dano = 2× Velocidade de Jay, ignora DEF
        const jayVel = (C.velocidade??5) + (C.velBuff||0);
        const dmg = jayVel * 2;
        newG.enemyField[tidx].currentHp = Math.max(0, target.currentHp - dmg);
        addLog(`💨 ${caster.emoji} ${caster.name} [Corrida Relâmpago]! VEL(${jayVel})×2 = ${dmg} dano direto — ignora DEF!`, "log-fusion");
        addLog(`  ${target.emoji} ${target.name}: ${newG.enemyField[tidx].currentHp}/${target.hp} HP`, "log-info");
        if (newG.enemyField[tidx].currentHp <= 0) {
          const dr = applyPassiveTrigger(newG.enemyField[tidx], "on_death");
          if (dr.revive) { newG.enemyField[tidx].currentHp = dr.revive; addLog(`🔥 ${target.emoji} ${target.name} renasce!`, "log-enemy"); }
          else { newG.enemyField.splice(tidx,1); addLog(`💀 ${target.emoji} ${target.name} destruído!`, "log-fusion"); }
        }
        break;
      }

      // Espaço Memorizado — esquiva + contra-ataque garantidos
      case "predict_dodge": {
        C.predictDodge = true;
        C.predictDodgeCounter = C.atk + (C.atkBuff||0);
        C.status = [...(C.status||[]).filter(s=>s!=="predict"), "predict"];
        addLog(`🧠 ${caster.emoji} ${caster.name} [Espaço Memorizado] — próximo ataque recebido será esquivado e revertido!`, "log-fusion");
        break;
      }

      // Campo Minado — armadilhas instantâneas
      case "minefield": {
        newG.mineActive = true;
        newG.mineDmg = e.dmg;
        newG.mineTurns = e.duration;
        addLog(`💥 ${caster.emoji} ${caster.name} [Campo Minado] — qualquer inimigo que atacar recebe ${e.dmg} de dano extra!`, "log-fusion");
        break;
      }

      // Pique-Pega — Taunt + Esquiva 60%
      case "pique_pega": {
        C.piquePega = true;
        C.piquePegaTurns = e.duration;
        C.piquePegaDodge = e.dodgeChance;
        // Remove qualquer esquiva base atual e sobrescreve
        C.status = [...(C.status||[]).filter(s=>s!=="pique_pega"), "pique_pega"];
        addLog(`🎯 ${caster.emoji} ${caster.name} [Pique-Pega]! Todos os inimigos agora devem mirar somente Jay por ${e.duration} turno(s)!`, "log-fusion");
        addLog(`  ⚡ Jay ganha 60% de [Esquiva] enquanto Pique-Pega estiver ativo. Dano em área ignora este efeito.`, "log-fusion");
        break;
      }

      // Punho Cego — 3 + (2/3 × VEL), ignora DEF e Esquiva
      case "punho_cego": {
        const target = newG.enemyField[0];
        if (!target) { addLog("Nenhum alvo no campo.", "log-info"); break; }
        const tidx = newG.enemyField.findIndex(x=>x.uid===target.uid);
        const jayVelNow = (C.velocidade??5) + (C.velBuff||0);
        const pbDmg = 3 + Math.floor(jayVelNow * 2 / 3);
        newG.enemyField[tidx].currentHp = Math.max(0, target.currentHp - pbDmg);
        addLog(`👊 ${caster.emoji} ${caster.name} [Punho Cego]! VEL(${jayVelNow}) → 3 + ⌊${jayVelNow}×⅔⌋ = ${pbDmg} dano direto — sem DEF, sem [Esquiva]!`, "log-fusion");
        addLog(`  ${target.emoji} ${target.name}: ${newG.enemyField[tidx].currentHp}/${target.hp} HP`, "log-info");
        if (newG.enemyField[tidx].currentHp <= 0) {
          const dr = applyPassiveTrigger(newG.enemyField[tidx], "on_death");
          if (dr.revive) { newG.enemyField[tidx].currentHp = dr.revive; addLog(`🔥 ${target.emoji} ${target.name} renasce!`, "log-enemy"); }
          else { newG.enemyField.splice(tidx,1); addLog(`💀 ${target.emoji} ${target.name} destruído!`, "log-fusion"); }
        }
        break;
      }

      // ══ FUSÃO ESPIRITUAL ════════════════════
      case "spirit_fusion": {
        const sb = e.statBoosts;
        // Aplicar bônus de stats na instância de batalha
        C.atk  += (sb.atkBonus  || 0);
        C.def  += (sb.defBonus  || 0);
        C.velocidade += (sb.velBonus || 0);
        // HP extra: aumenta hp max E currentHp
        const hpGain = sb.hpBonus || 0;
        C.hp        += hpGain;
        C.currentHp = Math.min(C.hp, C.currentHp + hpGain);
        // Vigor extra
        C.maxVigor    += (sb.vigorBonus || 0);
        C.currentVigor = Math.min(C.maxVigor, C.currentVigor + (sb.vigorBonus || 0));
        // Estado de fusão
        C.inFusion      = true;
        C.fusionTurns   = e.duration;
        C.fusionPassiva = e.passiva;   // "kata_camaleon"
        // Aura visual
        C.status = [...(C.status||[]).filter(s=>s!=="fusion"), "fusion"];
        addLog(`🦎✨ FUSÃO ESPIRITUAL DO CAMALEÃO! Yuji transforma-se! ATK+${sb.atkBonus} DEF+${sb.defBonus} VEL+${sb.velBonus} HP+${hpGain}`, "log-fusion");
        addLog(`✦ [Kata do Camaleão] ativa — ataques Físicos causam ×3 de dano por ${e.duration} turnos!`, "log-fusion");
        break;
      }

      // ══ TÉCNICA DE CAMUFLAGEM — FURTIVIDADE ═══════
      case "stealth_enter": {
        C.stealth      = true;
        C.stealthTurns = e.duration;
        C.stealthBreakers = e.detectBreakers || [];
        C.status = [...(C.status||[]).filter(s=>s!=="stealth"), "stealth"];
        addLog(`🫥 ${caster.name} desaparece! As células iridóforas reorganizam a reflexão de luz — [Furtividade] ativa por ${e.duration} turnos.`, "log-fusion");
        addLog(`⚠️ Olfato, audição aguçada ou técnicas de comunhão podem detectar Yuji e remover a [Furtividade].`, "log-info");
        break;
      }

      default:
        addLog(`✦ ${caster.name} ativou "${skill.name}".`, "log-skill");
    }

    setSkillPanel(null);
    setG(newG);
    setTimeout(() => setAnimating(false), 400);
  };

  const startGame = (m) => {
    setMode(m);
    const playDeck = getPlayDeck();
    const enemyFullDeck = makeEnemyDeck();
    // Inclui consumíveis na mão do jogador (1 por partida)
    const consumables = ALL_CARDS.filter(c=>c.isConsumable).sort(()=>Math.random()-0.5).slice(0,1);
    // Give player 1 random universal item to start
    const startItems = ALL_CARDS.filter(c=>c.isItem && c.equipFor==="any_agent").sort(()=>Math.random()-0.5).slice(0,1);
    const startingHand = [...makeHand(playDeck.slice(0,4)), ...makeHand([...consumables, ...startItems])];
    setG({
      playerHp:300, enemyHp:300,
      playerMaxHp:300, enemyMaxHp:300,
      playerVontade:5, enemyVontade:5,
      playerHand: startingHand,
      playerDeck: makeHand(playDeck.slice(4)),
      enemyHand: enemyFullDeck.slice(0,4),
      enemyDeck: enemyFullDeck.slice(4),
      enemyField: [],
      playerField: [],
      turn:"player", turnNum:1,
    });
    setLog([{msg:"✦ A batalha começa! Ambos os lados preparam seus guerreiros...", cls:"log-system", id:Date.now()}]);
    setSelected(null);
    setPhase("playing");
  };

  const selectCard = (uid) => {
    if (!G||G.turn!=="player"||animating) return;
    const c = G.playerHand.find(x=>x.uid===uid);
    if (!c) return;
    setSelected(prev=>prev?.uid===uid?null:c);
  };

  const playCard = () => {
    if (!selected||!G||animating) { showToast("Selecione uma carta primeiro!"); return; }
    if (selected.vontade > G.playerVontade) { showToast(`Vontade insuficiente! Precisa de ${selected.vontade} ✦, você tem ${G.playerVontade}.`); return; }
    setAnimating(true);
    let newG = {...G, playerField:[...G.playerField], enemyField:[...G.enemyField.map(c=>({...c}))]};
    newG.playerHand = newG.playerHand.filter(c=>c.uid!==selected.uid);
    newG.playerVontade -= selected.vontade;

    // ── ITENS: equipar em um Agente do campo ──────────────────────────
    if (selected.isItem) {
      // Find valid targets in field
      const validTargets = newG.playerField.filter(c => canEquip(selected, c));
      if (validTargets.length === 0) {
        newG.playerVontade += selected.vontade; // refund
        newG.playerHand = [...newG.playerHand, selected]; // return to hand
        setG(newG); setSelected(null);
        setTimeout(()=>setAnimating(false),100);
        showToast(`⚠️ Nenhum Agente compatível em campo! ${selected.equipFor?.startsWith("id:")?"Exclusivo para um Agente específico.":selected.equipFor?.startsWith("tipo:")?"Exclusivo para Agentes do tipo "+selected.equipFor.slice(5)+".":"Precisa de um Agente no campo."}`);
        return;
      }
      // Auto-equip to first valid target (future: UI selection)
      const tgtIdx = newG.playerField.findIndex(c => canEquip(selected, c));
      const tgt = newG.playerField[tgtIdx];
      if (tgt.equippedItem) {
        // Unequip old item first (drop it, bonuses removed)
        const oldItem = ALL_CARDS.find(c=>c.id===tgt.equippedItem);
        addLog(`🎒 ${tgt.emoji} ${tgt.name} desequipa ${oldItem?.emoji||""} ${oldItem?.name||"item anterior"} para equipar o novo!`, "log-skill");
      }
      // Apply item stat bonuses permanently to this instance
      const e = selected.itemEffect || {};
      newG.playerField[tgtIdx] = {
        ...tgt,
        equippedItem: selected.id,
        atk:        tgt.atk        + (e.atkBonus||0),
        def:        tgt.def        + (e.defBonus||0),
        velocidade: (tgt.velocidade||5) + (e.velBonus||0),
        hp:         tgt.hp         + (e.hpBonus||0),
        currentHp:  tgt.currentHp  + (e.hpBonus||0),
        maxVigor:   (tgt.maxVigor||10) + (e.vigorBonus||0),
      };
      addLog(`🎒 ${selected.emoji} ${selected.name} equipado em ${tgt.emoji} ${tgt.name}!`, "log-skill");
      if (e.atkBonus)   addLog(`  ⚔ ATK +${e.atkBonus} (${newG.playerField[tgtIdx].atk})`, "log-skill");
      if (e.defBonus)   addLog(`  🛡 DEF +${e.defBonus} (${newG.playerField[tgtIdx].def})`, "log-skill");
      if (e.hpBonus)    addLog(`  ❤ HP +${e.hpBonus} (${newG.playerField[tgtIdx].currentHp}/${newG.playerField[tgtIdx].hp})`, "log-skill");
      if (e.velBonus)   addLog(`  ⚡ VEL +${e.velBonus} (${newG.playerField[tgtIdx].velocidade})`, "log-skill");
      if (e.vigorBonus) addLog(`  🔥 Vigor Máx +${e.vigorBonus} (${newG.playerField[tgtIdx].maxVigor})`, "log-skill");
      if (selected.itemPassiva) addLog(`  ✦ Passiva de Item: ${selected.itemPassiva}`, "log-skill");
      // Apply special item passives immediately
      if (selected.itemPassivaEffect) {
        const pe = selected.itemPassivaEffect;
        // Botas do Vento / alwaysFirst
        if (pe.alwaysFirst) {
          newG.playerField[tgtIdx].itemAlwaysFirst = true;
          addLog(`  ⚡ Passiva [Rajada]: sempre age primeiro!`, "log-fusion");
        }
        // Colar do Besouro-Tigre / Jay upgrade
        if (pe.jayBypassDodgeUpgrade) {
          newG.playerField[tgtIdx].jayBypassDodgeUpgrade = pe.jayBypassDodgeUpgrade;
          addLog(`  ⚡ [Frenesi do Besouro]: limiar de [Flash Cego] aumentado para VEL ${pe.jayBypassDodgeUpgrade}!`, "log-fusion");
        }
        // Selos do Equilíbrio / life steal
        if (pe.lifeSteal) {
          newG.playerField[tgtIdx].lifeSteal = pe.lifeSteal;
          addLog(`  ⚡ Passiva [Harmonia Dual]: Life Steal ${Math.round(pe.lifeSteal*100)}% ativo!`, "log-fusion");
        }
        // Manto do Camaleão / Yuji upgrades
        if (pe.yujiDefBonusUpgrade) {
          newG.playerField[tgtIdx].yujiDefBonusUpgrade = pe.yujiDefBonusUpgrade;
          newG.playerField[tgtIdx].kataMultiplierUpgrade = pe.kataMultiplierUpgrade||3;
          addLog(`  ⚡ [Pele Iridescente]: [Suporte à Vida] agora +40% DEF, [Kata do Camaleão] ×${pe.kataMultiplierUpgrade}!`, "log-fusion");
        }
        // Cristal de Alma passiva regen
        if (pe.healPerTurn) {
          newG.playerField[tgtIdx].itemHealPerTurn = pe.healPerTurn;
          newG.playerField[tgtIdx].itemVigorRegenBonus = pe.vigorRegenBonus||0;
        }
        // Grimório / vigorCostReduce
        if (pe.vigorCostReduce) {
          newG.playerField[tgtIdx].itemVigorDiscount = pe.vigorCostReduce;
          addLog(`  ⚡ [Saber Profundo]: habilidades custam -${pe.vigorCostReduce} Vigor!`, "log-fusion");
        }
        // Grimório / drawOnEnter
        if (pe.drawOnEnter && newG.playerDeck.length > 0) {
          const [drawn,...rest] = newG.playerDeck;
          newG.playerHand = [...newG.playerHand, drawn];
          newG.playerDeck = rest;
          addLog(`  📚 [Saber Profundo]: ${drawn.emoji} ${drawn.name} comprada!`, "log-skill");
        }
      }
      setG(newG); setSelected(null);
      setTimeout(()=>setAnimating(false), 350);
      return;
    }

    // ── CONSUMÍVEIS: uso imediato, não vão ao campo ─────────────────────
    if (selected.isConsumable && selected.consumeEffect) {
      const e = selected.consumeEffect;
      addLog(`🧪 ${selected.emoji} ${selected.name} consumido!`, "log-skill");
      if (e.type === "vigor_self") {
        // Restaura Vigor da carta aliada com menos Vigor em campo
        if (newG.playerField.length > 0) {
          const minIdx = newG.playerField.reduce((acc,c,i) => (c.currentVigor??0) < (newG.playerField[acc].currentVigor??0) ? i : acc, 0);
          const tgt = newG.playerField[minIdx];
          const restored = Math.min(tgt.maxVigor, (tgt.currentVigor??0) + e.value) - (tgt.currentVigor??0);
          newG.playerField[minIdx] = {...tgt, currentVigor: Math.min(tgt.maxVigor, (tgt.currentVigor??0) + e.value)};
          addLog(`🔥 ${tgt.emoji} ${tgt.name} recupera ${restored} Vigor! (${newG.playerField[minIdx].currentVigor}/${tgt.maxVigor})`, "log-skill");
        } else { addLog(`⚠️ Nenhuma carta aliada em campo para receber o Vigor.`, "log-info"); }
      } else if (e.type === "vigor_all") {
        if (newG.playerField.length > 0) {
          let totalRestored = 0;
          newG.playerField = newG.playerField.map(c => {
            const restored = Math.min(c.maxVigor, (c.currentVigor??0) + e.value) - (c.currentVigor??0);
            totalRestored += restored;
            return {...c, currentVigor: Math.min(c.maxVigor, (c.currentVigor??0) + e.value)};
          });
          addLog(`💎 Cristal de Vontade: todas as cartas aliadas recuperam até ${e.value} [Vigor] cada!`, "log-skill");
        } else { addLog(`⚠️ Nenhuma carta em campo para receber o [Vigor].`, "log-info"); }
      } else if (e.type === "vigor_and_atk") {
        if (newG.playerField.length > 0) {
          const minHpIdx = newG.playerField.reduce((acc,c,i) => c.currentHp < newG.playerField[acc].currentHp ? i : acc, 0);
          const tgt = newG.playerField[minHpIdx];
          newG.playerField[minHpIdx] = {...tgt,
            currentVigor: Math.min(tgt.maxVigor, (tgt.currentVigor??0) + e.vigorVal),
            atkBuff: (tgt.atkBuff||0) + e.atkVal, atkBuffDur: e.duration };
          addLog(`🍵 ${tgt.emoji} ${tgt.name}: +${e.vigorVal} Vigor, +${e.atkVal} ATK por ${e.duration} turnos!`, "log-skill");
        }
      } else if (e.type === "vigor_max_up") {
        if (newG.playerField.length > 0) {
          const idx = Math.floor(Math.random() * newG.playerField.length);
          const tgt = newG.playerField[idx];
          const newMax = tgt.maxVigor + e.value;
          newG.playerField[idx] = {...tgt, maxVigor: newMax, currentVigor: newMax};
          addLog(`⚗️ ${tgt.emoji} ${tgt.name}: Vigor Máximo aumentado para ${newMax}! Vigor totalmente restaurado!`, "log-skill");
        }
      }
      setG(newG); setSelected(null);
      setTimeout(()=>setAnimating(false), 350);
      return;
    }

    // ── CARTA NORMAL: vai ao campo ───────────────────────────────────────
    newG.playerField = [...newG.playerField, {...selected}];
    addLog(`${selected.emoji} ${selected.name} entra no campo de batalha!  ⚔${selected.atk} 🛡${selected.def} ❤${selected.hp} ⚡${selected.velocidade??5}${selected.passiva?" — Passiva: "+selected.passiva:""}`, "log-player");

    // On-enter effects
    if (selected.passivaTrigger==="on_enter") {
      if (selected.passivaEffect?.silenceEnemy) {
        newG.enemyField = newG.enemyField.map(c=>({...c, silenced:1, status:[...(c.status||[]),"silence"]}));
        addLog(`🔇 ${selected.name}: [Silêncio] — todas as criaturas inimigas em campo perdem suas passivas por 1 turno!`, "log-player");
      }
      if (selected.name === "Druida Estrategista") {
        // Compra 2 cartas extras
        const drawn = newG.playerDeck.slice(0,2);
        newG.playerDeck = newG.playerDeck.slice(2);
        newG.playerHand = [...newG.playerHand, ...drawn];
        drawn.forEach(c => addLog(`📚 Saber Antigo: ${c.emoji} ${c.name} comprada!`, "log-player"));
      }
    }
    setG(newG); setSelected(null);
    setTimeout(()=>setAnimating(false),300);
  };

  const attack = () => {
    if (!G||animating) return;
    if (G.playerField.length===0) { showToast("Coloque uma carta no campo primeiro!"); return; }
    setAnimating(true);
    let newG = {...G, targetedEnemy, enemyField:[...G.enemyField.map(c=>({...c}))], playerField:[...G.playerField.map(c=>({...c}))]};

    // Ordenar atacantes por Velocidade (mais rápido primeiro)
    const attackers = [...newG.playerField].sort((a,b)=>(b.velocidade??5)-(a.velocidade??5));

    attackers.forEach(attacker => {
      const idx = newG.playerField.findIndex(c=>c.uid===attacker.uid);
      if (idx===-1) return;
      const isFury = attacker.passivaTrigger==="first_attack_turn" && !attacker.turnAttacked;
      if (isFury) newG.playerField[idx].turnAttacked = true;

      // Alvo: prioridade → mira do jogador → Taunt → primeiro da fila
      const tauntTarget = newG.enemyField.find(c=>c.passivaTrigger==="always"&&c.passivaEffect?.taunt&&!c.silenced);
      const manualTarget = G.targetedEnemy ? newG.enemyField.find(c=>c.uid===G.targetedEnemy) : null;
      const target = tauntTarget || manualTarget || (newG.enemyField.length>0?newG.enemyField[0]:null);
      const eIdx = newG.enemyField.findIndex(c=>c.uid===target?.uid);

      if (target && eIdx!==-1) {
        // Ponto Referencial de Jay — ignora furtividade
        if (attacker.pontoReferencial && target.stealth) {
          addLog(`📍 [Ponto Referencial] ${attacker.emoji} ${attacker.name} ignora [Furtividade] de ${target.emoji} ${target.name}!`, "log-fusion");
        }
        // Furtividade do alvo (Yuji em stealth atacando — revelar ao atacar)
        if (attacker.stealth) {
          attacker.stealth = false;
          attacker.stealthTurns = 0;
          attacker.status = (attacker.status||[]).filter(s=>s!=="stealth");
          newG.playerField[idx].stealth = false;
          newG.playerField[idx].stealthTurns = 0;
          newG.playerField[idx].status = newG.playerField[idx].status.filter(s=>s!=="stealth");
          addLog(`🫥→👁 Yuji saiu da [Furtividade] para atacar!`, "log-fusion");
        }

        // Esquiva — Jay Bunmi bypassa esquiva em alvos com VEL ≤ 30 (Flash Cego)
        const attVel = (attacker.velocidade??5) + (attacker.velBuff||0);
        const targetVel = (target.velocidade??5);
        const jayBypassLimit = attacker.jayBypassDodgeUpgrade || (attacker.passivaEffect?.bypassDodgeBelow||30);
        const jayBypassesDodge = attacker.id===17 && targetVel <= jayBypassLimit;
        const dodgeResult = applyPassiveTrigger(target,"on_hit");
        if (dodgeResult.dodge && !jayBypassesDodge) {
          addLog(`💨 ${target.emoji} ${target.name} esquivou do ataque de ${attacker.emoji} ${attacker.name}!`, "log-enemy"); return;
        } else if (dodgeResult.dodge && jayBypassesDodge) {
          addLog(`⚡ [Flash Cego] ${attacker.emoji} ${attacker.name} é veloz demais — ${target.emoji} ${target.name} não consegue esquivar!`, "log-fusion");
        }
        // Barreira
        const barrierResult = applyPassiveTrigger(target,"first_hit");
        if (barrierResult.block) {
          newG.enemyField[eIdx].barrierUsed = true;
          addLog(`🪨 ${target.name} bloqueou com [Barreira]! 0 dano`, "log-enemy"); return;
        }
        // Calcular dano — Loba: se alvo tem menos HP que atacante
        const isCond = attacker.passivaTrigger==="on_attack" && attacker.passivaEffect?.condBonusDmg && target.currentHp < attacker.currentHp;
        let {dmg, yujiPassive} = calcDmg(attacker, target, isFury, isCond);

        // ✦ KATA DO CAMALEÃO — Fusão Espiritual: ataques físicos ×3
        const isKataActive = attacker.inFusion && attacker.fusionPassiva === "kata_camaleon";
        if (isKataActive) {
          const rawDmg = dmg;
          const kataX = attacker.kataMultiplierUpgrade || 3;
          dmg = dmg * kataX;
          addLog(`🦎 KATA DO CAMALEÃO${kataX>3?" (Pele Iridescente: ×"+kataX+")":""}! ${rawDmg} → ×${kataX} = ${dmg} de dano!`, "log-fusion");
        }

        newG.enemyField[eIdx].currentHp = Math.max(0, target.currentHp-dmg);
        const passiveNote = yujiPassive?" (✦Suporte à Vida)":"";
        const furyNote = isFury?" [Fúria]":"";
        const condNote = isCond?" [Predadora]":"";
        addLog(`⚔️ ${attacker.emoji} ${attacker.name}${furyNote}${condNote} → ${target.emoji} ${target.name}: ${dmg} dano${passiveNote} (HP: ${newG.enemyField[eIdx].currentHp}/${target.hp})`, "log-player");
        spawnFloat(`-${dmg}`,"#ff5533","enemy");
        // Life Steal (Selos do Equilíbrio / item passiva)
        if (attacker.lifeSteal && dmg > 0) {
          const healed = Math.max(1, Math.floor(dmg * attacker.lifeSteal));
          newG.playerField[idx].currentHp = Math.min(newG.playerField[idx].hp, newG.playerField[idx].currentHp + healed);
          addLog(`  ☯️ [Harmonia Dual] ${attacker.emoji} ${attacker.name} recupera ${healed} HP!`, "log-skill");
        }

        // Veneno
        const poisonResult = applyPassiveTrigger(attacker,"on_attack",{});
        if (poisonResult.poison) {
          newG.enemyField[eIdx].status = [...(newG.enemyField[eIdx].status||[]).filter(s=>s!=="poison"), "poison"];
          newG.enemyField[eIdx].poisonStacks = (newG.enemyField[eIdx].poisonStacks||0)+1;
          newG.enemyField[eIdx].poisonTurns = poisonResult.poison.turns;
          addLog(`☠️ ${target.name} [Veneno]! (${poisonResult.poison.dmg} HP/turno)`, "log-player");
        }

        // Morte
        if (newG.enemyField[eIdx].currentHp<=0) {
          // Fênix: renasce
          const deathResult = applyPassiveTrigger(newG.enemyField[eIdx],"on_death");
          if (deathResult.revive) {
            newG.enemyField[eIdx].currentHp = deathResult.revive;
            newG.enemyField[eIdx].passivaActive = false;
            addLog(`🔥 ${target.name} renasce com ${deathResult.revive} HP! ([Renascimento])`, "log-enemy");
          } else {
            addLog(`💥 ${target.name} destruído!`, "log-player");
            newG.enemyField = newG.enemyField.filter(c=>c.uid!==target.uid);
          }
        }

        // Duplo Ataque (Beija-Flor) — segundo golpe
        const doubleAtk = applyPassiveTrigger(attacker,"on_attack");
        if (doubleAtk.doubleAttack && newG.enemyField.length>0) {
          const t2 = newG.enemyField[0];
          const eIdx2 = newG.enemyField.findIndex(c=>c.uid===t2.uid);
          if (eIdx2!==-1) {
            const {dmg:dmg2} = calcDmg(attacker, t2);
            newG.enemyField[eIdx2].currentHp = Math.max(0, t2.currentHp-dmg2);
            addLog(`⚡ ${attacker.name} ataca 2× → ${t2.name}: ${dmg2} dano extra!`, "log-player");
            if (newG.enemyField[eIdx2].currentHp<=0) {
              addLog(`💥 ${t2.name} destruído!`, "log-player");
              newG.enemyField = newG.enemyField.filter(c=>c.uid!==t2.uid);
            }
          }
        }
      } else if (newG.enemyField.length === 0) {
        // Campo inimigo vazio — ataque direto à vida do oponente
        const {dmg} = calcDmg(attacker, {def:0,hp:newG.enemyMaxHp||300,currentHp:newG.enemyHp}, isFury);
        const isKataDir = attacker.inFusion && attacker.fusionPassiva === "kata_camaleon";
        const finalDmg = isKataDir ? dmg * 3 : dmg;
        if (isKataDir) addLog(`🦎 KATA DO CAMALEÃO! Ataque direto amplificado: ${dmg} → ×3 = ${finalDmg}!`, "log-fusion");
        newG.enemyHp = Math.max(0, newG.enemyHp - finalDmg);
        addLog(`🎯 ${attacker.emoji} ${attacker.name} ataca diretamente o Guardião! −${finalDmg} HP (Guardião: ${newG.enemyHp}/${newG.enemyMaxHp||300})`, "log-player");
      } else {
        // Inimigo tem campo mas nosso ataque não tem alvo (raro): bloqueado
        addLog(`🛡 ${attacker.emoji} ${attacker.name} não encontrou alvo — o campo inimigo bloqueou o ataque!`, "log-info");
      }
    });

    if (newG.enemyHp<=0) {
      setG(newG); setPhase("result"); addLog("✦ VOCÊ VENCEU! ✦","log-system"); setAnimating(false); return;
    }
    setTargetedEnemy(null);
    setG(newG);
    setTimeout(()=>enemyTurn(newG), 900);
  };

  // ── HELPER: processa status e buffs de uma carta (fim de turno) ─────────
  const tickCard = (nc, side="player") => {
    nc.barrierUsed=false; nc.turnAttacked=false; nc.grantDodge=false; nc.untargetable=false;
    if(nc.silenced>0){nc.silenced--;if(nc.silenced===0)nc.status=(nc.status||[]).filter(s=>s!=="silence");}
    if(nc.stunned)nc.stunned=false;
    if(nc.rooted)nc.rooted=false;
    if(nc.feared)nc.feared=false;
    if(nc.markedDur>0){nc.markedDur--;if(nc.markedDur<=0){nc.marked=false;nc.markedBonus=0;}}
    if(nc.defBuffDur>0){nc.defBuffDur--;if(nc.defBuffDur<=0)nc.defBuff=0;}
    if(nc.atkBuffDur>0){nc.atkBuffDur--;if(nc.atkBuffDur<=0)nc.atkBuff=0;}
    if(nc.velBuffDur>0){nc.velBuffDur--;if(nc.velBuffDur<=0)nc.velBuff=0;}
    if(nc.thornsDur>0){nc.thornsDur--;if(nc.thornsDur<=0)nc.thorns=0;}
    if(nc.dmgReductionDur>0){nc.dmgReductionDur--;if(nc.dmgReductionDur<=0)nc.dmgReduction=0;}
    if(nc.regenBuffDur>0){nc.regenBuffDur--;if(nc.regenBuffDur<=0)nc.regenBuff=0;}
    // Vigor: regenera passivamente por turno
    const vigorRegen = (nc.kind==="agente" || nc.kind==="criatura") ? 2 : 1;
    const oldVigor = nc.currentVigor ?? 0;
    nc.currentVigor = Math.min(nc.maxVigor, oldVigor + vigorRegen + (nc.itemVigorRegenBonus||0));
    // Cristal de Alma — heal per turn bonus
    if (nc.itemHealPerTurn && nc.currentHp < nc.hp) {
      nc.currentHp = Math.min(nc.hp, nc.currentHp + nc.itemHealPerTurn);
    }
    if(nc.skillCooldowns){
      const cds={};
      Object.entries(nc.skillCooldowns).forEach(([k,v])=>{if(v>1)cds[k]=v-1;});
      nc.skillCooldowns=cds;
    }
    return nc;
  };

  const enemyTurn = (gState) => {
    let newG = {
      ...gState,
      playerField: gState.playerField.map(c=>({...c})),
      enemyField:  gState.enemyField.map(c=>({...c})),
      enemyHand:   [...(gState.enemyHand||[])],
      enemyDeck:   [...(gState.enemyDeck||[])],
    };
    const turnLabel = `Turno ${newG.turnNum||1}`;

    // ── FASE 1: IA JOGA CARTAS DA MÃO ─────────────────────────────────────
    // IA usa estratégia simples: joga a carta mais forte que sua Vontade permite
    {
      let played = 0;
      const maxPlays = 2; // IA pode jogar até 2 cartas por turno
      while (played < maxPlays && newG.enemyHand.length > 0 && newG.enemyVontade > 0 && newG.enemyField.length < 5) {
        const affordable = newG.enemyHand
          .filter(c => c.vontade <= newG.enemyVontade)
          .sort((a,b) => b.atk - a.atk); // prioriza alto ATK
        if (affordable.length === 0) break;
        const chosen = affordable[0];
        newG.enemyHand = newG.enemyHand.filter(c=>c.uid!==chosen.uid);
        newG.enemyField = [...newG.enemyField, {...chosen}];
        newG.enemyVontade -= chosen.vontade;
        addLog(`👹 Guardião invoca ${chosen.emoji} ${chosen.name} em campo! (⚔${chosen.atk} 🛡${chosen.def} ❤${chosen.hp} ⚡${chosen.velocidade??5})`, "log-enemy");
        // On-enter effects do inimigo
        if (chosen.passivaTrigger==="on_enter" && chosen.passivaEffect?.silenceEnemy) {
          newG.playerField = newG.playerField.map(c=>({...c, silenced:1, status:[...(c.status||[]),"silence"]}));
          addLog(`🔇 ${chosen.name} silencia todas as cartas do jogador por 1 turno!`, "log-enemy");
        }
        played++;
      }
    }

    // ── FASE 2: ATAQUE DAS CARTAS INIMIGAS ────────────────────────────────
    addLog(`⚔️ — ${turnLabel}: Guardião ataca —`, "log-system");
    const eAttackers = [...newG.enemyField].sort((a,b)=>(b.velocidade??5)-(a.velocidade??5));

    eAttackers.forEach(attacker => {
      // Ignorar se stunado ou enraizado
      if (attacker.stunned || attacker.rooted) {
        addLog(`😵 ${attacker.emoji} ${attacker.name} está imobilizado e não pode atacar!`, "log-enemy"); return;
      }
      const isFury = attacker.passivaTrigger==="first_attack_turn" && !attacker.turnAttacked;
      const tauntTarget = newG.playerField.find(c=>c.passivaTrigger==="always"&&c.passivaEffect?.taunt&&!c.silenced);
      const visibleTargets = newG.playerField.filter(c => !c.stealth);
      const targetPool = visibleTargets.length > 0 ? visibleTargets : newG.playerField;
      const target = tauntTarget || (targetPool.length > 0 ? targetPool[0] : null);
      const pIdx = target ? newG.playerField.findIndex(c=>c.uid===target.uid) : -1;

      if (!target || pIdx === -1) {
        // Campo do jogador vazio — ataque direto à vida do jogador
        if (newG.playerField.length === 0) {
          const {dmg} = calcDmg(attacker, {def:0, hp:newG.playerMaxHp||300, currentHp:newG.playerHp}, isFury);
          newG.playerHp = Math.max(0, newG.playerHp - dmg);
          addLog(`💥 ${attacker.emoji} ${attacker.name} ataca diretamente! Jogador perde ${dmg} HP (HP: ${newG.playerHp}/${newG.playerMaxHp||300})`, "log-enemy");
          spawnFloat(`-${dmg} ❤`,"#ff5533","player");
        } else {
          addLog(`🫥 ${attacker.emoji} ${attacker.name} não encontrou alvo visível — [Furtividade] bloqueou!`, "log-fusion");
        }
        return;
      }
      // Campo Minado de Jay — dano extra ao atacante
      if (newG.mineActive && newG.mineTurns > 0) {
        const mineIdx = newG.enemyField.findIndex(c=>c.uid===attacker.uid);
        if (mineIdx !== -1) {
          newG.enemyField[mineIdx].currentHp = Math.max(0, newG.enemyField[mineIdx].currentHp - newG.mineDmg);
          addLog(`💥 [Campo Minado] ${attacker.emoji} ${attacker.name} ativa uma armadilha! -${newG.mineDmg} HP`, "log-fusion");
        }
      }

      // Esquiva
      // Pique-Pega esquiva (60%)
      if (target.piquePega && target.piquePegaTurns > 0) {
        if (Math.random() < (target.piquePegaDodge || 0.6)) {
          addLog(`🎯 [Pique-Pega] ${target.emoji} ${target.name} esquivou com reflexo! (60%)`, "log-fusion");
          return;
        }
      }
      const dodgeR = applyPassiveTrigger(target,"on_hit");
      const eAttVel = (attacker.velocidade??5) + (attacker.velBuff||0);
      const eTgtVel = (target.velocidade??5) + (target.velBuff||0);
      const eJayBypass = attacker.id===17 && eTgtVel <= (attacker.passivaEffect?.bypassDodgeBelow||30);
      if (dodgeR.dodge && !eJayBypass) {
        addLog(`💨 ${target.emoji} ${target.name} esquivou!`, "log-player"); return;
      } else if (dodgeR.dodge && eJayBypass) {
        addLog(`⚡ [Flash Cego] ${attacker.emoji} ${attacker.name} — sem escapatória!`, "log-fusion");
      }
      // Barreira (Rocha Viva)
      const barrierR = applyPassiveTrigger(target,"first_hit");
      if (barrierR.block && !target.barrierUsed) {
        newG.playerField[pIdx].barrierUsed=true;
        addLog(`🪨 ${target.emoji} ${target.name} absorveu o ataque com sua [Barreira]! 0 dano recebido`, "log-player"); return;
      }
      // Escudo de habilidade
      if (target.shielded) {
        newG.playerField[pIdx].shielded=false;
        addLog(`🛡 ${target.emoji} ${target.name} bloqueou com Escudo Mágico! 0 dano recebido`, "log-player"); return;
      }

      // Espaço Memorizado — Jay prevê e contra-ataca
      if (target.predictDodge) {
        const counterDmg = target.predictDodgeCounter || target.atk;
        const attIdx = newG.enemyField.findIndex(c=>c.uid===attacker.uid);
        if (attIdx !== -1) {
          newG.enemyField[attIdx].currentHp = Math.max(0, newG.enemyField[attIdx].currentHp - counterDmg);
          addLog(`🧠 [Espaço Memorizado] ${target.emoji} ${target.name} previu o ataque de ${attacker.emoji} ${attacker.name} e contra-atacou! -${counterDmg} HP`, "log-fusion");
          newG.playerField[pIdx].predictDodge = false;
          newG.playerField[pIdx].status = (newG.playerField[pIdx].status||[]).filter(s=>s!=="predict");
          if (newG.enemyField[attIdx].currentHp <= 0) {
            const dr = applyPassiveTrigger(newG.enemyField[attIdx],"on_death");
            if (!dr.revive) { newG.enemyField.splice(attIdx,1); addLog(`💀 ${attacker.emoji} ${attacker.name} destruído pelo contra-ataque!`, "log-fusion"); }
            else { newG.enemyField[attIdx].currentHp = dr.revive; }
          }
        }
        return; // Attack is completely negated
      }
      const {dmg: rawDmg, yujiPassive} = calcDmg(attacker, target, isFury);
      // Redução de dano (Casca Absoluta / habilidade)
      const finalDmg = target.dmgReduction > 0
        ? Math.max(1, Math.floor(rawDmg * (1 - target.dmgReduction)))
        : rawDmg;
      const reduceNote = target.dmgReduction > 0 ? ` (🐚 -${Math.round(target.dmgReduction*100)}%)` : "";

      newG.playerField[pIdx].currentHp = Math.max(0, target.currentHp - finalDmg);
      const yujiNote = yujiPassive?" ✦[Suporte à Vida — DEF+20%]":"";
      const furyNote = isFury?" 🔥[Fúria]":"";
      addLog(`👹 ${attacker.emoji} ${attacker.name}${furyNote} ataca ${target.emoji} ${target.name}: ${finalDmg} dano${reduceNote}${yujiNote} (HP: ${newG.playerField[pIdx].currentHp}/${target.hp})`, "log-enemy");

      // Espinhos — devolve dano ao atacante
      if (target.thorns > 0) {
        const eAttIdx = newG.enemyField.findIndex(c=>c.uid===attacker.uid);
        if (eAttIdx !== -1) {
          newG.enemyField[eAttIdx].currentHp = Math.max(0, newG.enemyField[eAttIdx].currentHp - target.thorns);
          addLog(`🌵 Espinhos! ${attacker.emoji} ${attacker.name} sofre ${target.thorns} de dano de retorno`, "log-player");
        }
      }

      // Veneno inimigo
      const poisonR = applyPassiveTrigger(attacker,"on_attack",{});
      if (poisonR.poison && !target.silenced) {
        newG.playerField[pIdx].status=[...(newG.playerField[pIdx].status||[]).filter(s=>s!=="poison"),"poison"];
        newG.playerField[pIdx].poisonTurns=poisonR.poison.turns;
        newG.playerField[pIdx].poisonDmg=poisonR.poison.dmg||10;
        addLog(`☠️ ${attacker.emoji} ${attacker.name} envenena ${target.emoji} ${target.name}! (${poisonR.poison.dmg||10} HP/turno por ${poisonR.poison.turns} turnos)`, "log-enemy");
      }

      // Morte
      if (newG.playerField[pIdx].currentHp <= 0) {
        const deathR = applyPassiveTrigger(newG.playerField[pIdx],"on_death");
        if (deathR.revive) {
          newG.playerField[pIdx].currentHp = deathR.revive;
          addLog(`🔥 ${target.emoji} ${target.name} ativa [Renascimento]! Retorna com ${deathR.revive} HP!`, "log-player");
        } else {
          addLog(`💀 ${target.emoji} ${target.name} foi destruído em combate!`, "log-enemy");
          newG.playerField = newG.playerField.filter(c=>c.uid!==target.uid);
        }
      }

      // Duplo Ataque (Beija-Flor)
      const dblR = applyPassiveTrigger(attacker,"on_attack");
      if (dblR.doubleAttack && newG.playerField.length > 0) {
        const t2 = newG.playerField[0];
        const pIdx2 = newG.playerField.findIndex(c=>c.uid===t2.uid);
        if (pIdx2 !== -1) {
          const {dmg:d2} = calcDmg(attacker,t2);
          newG.playerField[pIdx2].currentHp = Math.max(0,t2.currentHp-d2);
          addLog(`⚡ ${attacker.emoji} ${attacker.name} [Duplo Ataque] → ${t2.emoji} ${t2.name}: ${d2} dano extra!`, "log-enemy");
          if (newG.playerField[pIdx2].currentHp<=0) {
            addLog(`💀 ${t2.emoji} ${t2.name} destruído!`, "log-enemy");
            newG.playerField=newG.playerField.filter(c=>c.uid!==t2.uid);
          }
        }
      }
    });

    if (newG.playerHp<=0) { setG(newG); setPhase("result"); addLog("✦ VOCÊ FOI DERROTADO — A Vontade da Terra se cala... ✦","log-system"); setAnimating(false); return; }

    // ── FASE 3: PROCESSAMENTO DE FIM DE TURNO ─────────────────────────────
    addLog(`🌀 — Fim do turno do Guardião — Processando efeitos —`, "log-system");

    // Processar cartas do jogador
    newG.playerField = newG.playerField.map(c=>{
      let nc = {...c};
      // Regeneração passiva (start_of_turn)
      const regen = applyPassiveTrigger(nc,"start_of_turn");
      if (regen.heal>0) { nc.currentHp=Math.min(nc.hp,nc.currentHp+regen.heal); addLog(`💚 ${nc.emoji} ${nc.name}: Regeneração +${regen.heal} HP (${nc.currentHp}/${nc.hp})`, "log-player"); }
      if (regen.healPlayer>0) { newG.playerHp=Math.min(newG.playerMaxHp||300,newG.playerHp+regen.healPlayer); addLog(`🌲 ${nc.emoji} ${nc.name} cura o jogador: +${regen.healPlayer} HP (${newG.playerHp}/${newG.playerMaxHp||300})`, "log-player"); }
      // Veneno tick
      if (nc.status?.includes("poison") && nc.poisonTurns>0) {
        const pdmg = nc.poisonDmg || 10;
        nc.currentHp=Math.max(0,nc.currentHp-pdmg); nc.poisonTurns--;
        if (nc.poisonTurns<=0){nc.status=nc.status.filter(s=>s!=="poison"); addLog(`✓ Veneno de ${nc.emoji} ${nc.name} se dissipou.`,"log-info");}
        else addLog(`☠️ ${nc.emoji} ${nc.name} perde ${pdmg} HP por veneno (${nc.poisonTurns} turno${nc.poisonTurns>1?"s":""} restante${nc.poisonTurns>1?"s":""})`, "log-enemy");
      }
      // Sangramento
      if (nc.bleed && nc.bleed.turns>0) {
        nc.currentHp=Math.max(0,nc.currentHp-nc.bleed.value); nc.bleed.turns--;
        addLog(`🩸 ${nc.emoji} ${nc.name} [Sangramento]: -${nc.bleed.value} HP (${nc.bleed.turns} turnos restantes)`, "log-enemy");
        if(nc.bleed.turns<=0){delete nc.bleed; nc.status=(nc.status||[]).filter(s=>s!=="bleed");}
      }
      // Regen buff de skill
      if (nc.regenBuff>0) { nc.currentHp=Math.min(nc.hp,nc.currentHp+nc.regenBuff); }
      // Tick status/buffs
      nc = tickCard(nc, "player");
      // Fusão Espiritual
      if (nc.inFusion && nc.fusionTurns > 0) {
        nc.fusionTurns--;
        if (nc.fusionTurns <= 0) {
          const base = ALL_CARDS.find(c=>c.id===nc.id);
          if (base && base.fusionStats) {
            const fb=base.fusionStats;
            nc.atk=Math.max(base.atk, nc.atk-(fb.atkBonus||0));
            nc.def=Math.max(base.def, nc.def-(fb.defBonus||0));
            nc.velocidade=Math.max(base.velocidade||5, nc.velocidade-(fb.velBonus||0));
            nc.hp=Math.max(1, nc.hp-(fb.hpBonus||0));
            nc.currentHp=Math.min(nc.hp,nc.currentHp);
            nc.maxVigor=Math.max(base.vigor||10, nc.maxVigor-(fb.vigorBonus||0));
            nc.currentVigor=Math.min(nc.maxVigor,nc.currentVigor);
          }
          nc.inFusion=false; nc.fusionPassiva=null;
          nc.status=(nc.status||[]).filter(s=>s!=="fusion");
          addLog(`🦎 A [Fusão] de ${nc.emoji} ${nc.name} terminou. Stats retornam ao normal.`, "log-fusion");
        }
      }
      // Furtividade
      if (nc.stealth && nc.stealthTurns > 0) {
        nc.stealthTurns--;
        if (nc.stealthTurns<=0){nc.stealth=false; nc.status=(nc.status||[]).filter(s=>s!=="stealth"); addLog(`🫥→👁 [Furtividade] de ${nc.emoji} ${nc.name} expirou.`, "log-fusion");}
      }
      // Crescimento (Guerreiro Raiz)
      const grow = applyPassiveTrigger(nc,"end_of_turn");
      if (grow.atkBonus) { nc.atk+=grow.atkBonus; addLog(`🌿 ${nc.emoji} ${nc.name} [Crescimento]: ATK aumenta para ${nc.atk}!`, "log-player"); }
      // Verificar passiva Yuji
      const yujiCheck = applyPassiveTrigger(nc,"check_def");
      nc.passivaActive = !!yujiCheck.defBonus;
      if (nc.passivaActive && !nc._yujiLogged) {
        nc._yujiLogged=true;
        addLog(`✦ ${nc.emoji} ${nc.name} [Função de Sobrevivência] — HP abaixo de 50%, DEF +20% ativo!`, "log-fusion");
      } else if (!nc.passivaActive) { nc._yujiLogged=false; }
      return nc;
    }).filter(c=>c.currentHp>0);

    // Processar cartas inimigas
    newG.enemyField = newG.enemyField.map(c=>{
      let nc={...c};
      const regen=applyPassiveTrigger(nc,"start_of_turn");
      if(regen.heal>0){nc.currentHp=Math.min(nc.hp,nc.currentHp+regen.heal); addLog(`💊 ${nc.emoji} ${nc.name} [Regeneração]: +${regen.heal} HP`,"log-enemy");}
      if(nc.status?.includes("poison")&&nc.poisonTurns>0){
        const pdmg=nc.poisonDmg||10;
        nc.currentHp=Math.max(0,nc.currentHp-pdmg);nc.poisonTurns--;
        if(nc.poisonTurns<=0){nc.status=nc.status.filter(s=>s!=="poison"); addLog(`✓ Veneno em ${nc.emoji} ${nc.name} dissipado.`,"log-info");}
        else addLog(`☠️ ${nc.emoji} ${nc.name} sofre ${pdmg} HP de veneno (${nc.poisonTurns} turnos restantes)`,"log-player");
      }
      if(nc.bleed&&nc.bleed.turns>0){nc.currentHp=Math.max(0,nc.currentHp-nc.bleed.value);nc.bleed.turns--;addLog(`🩸 ${nc.emoji} ${nc.name} [Sangramento]: -${nc.bleed.value} HP`,"log-player");if(nc.bleed.turns<=0){delete nc.bleed;nc.status=(nc.status||[]).filter(s=>s!=="bleed");}}
      nc=tickCard(nc,"enemy");
      const grow=applyPassiveTrigger(nc,"end_of_turn");
      if(grow.atkBonus){nc.atk+=grow.atkBonus; addLog(`🌿 ${nc.emoji} ${nc.name} [Crescimento]: ATK → ${nc.atk}!`,"log-enemy");}
      const yuji=applyPassiveTrigger(nc,"check_def");
      nc.passivaActive=!!yuji.defBonus;
      return nc;
    }).filter(c=>c.currentHp>0);

    // ── FASE 4: REPOR VONTADE, COMPRAR CARTAS, VIRADA ─────────────────────
    newG.playerVontade = Math.min(7, (newG.playerVontade||0)+1);
    newG.enemyVontade  = Math.min(7, (newG.enemyVontade||0)+1);
    newG.turnNum = (newG.turnNum||1)+1;

    // Jogador compra carta
    if (newG.playerDeck.length>0 && newG.playerHand.length<7) {
      const [drawn,...rest]=newG.playerDeck;
      newG.playerHand=[...newG.playerHand, drawn];
      newG.playerDeck=rest;
      addLog(`🃏 Você compra: ${drawn.emoji} ${drawn.name}`, "log-info");
    }
    // Inimigo compra carta
    if ((newG.enemyDeck||[]).length>0 && (newG.enemyHand||[]).length<5) {
      const [eDrawn,...eRest]=newG.enemyDeck;
      newG.enemyHand=[...(newG.enemyHand||[]), eDrawn];
      newG.enemyDeck=eRest;
      addLog(`🃏 Guardião compra uma carta do baralho.`, "log-enemy");
    }
    // Virada
    newG.turn="player";
    addLog(`✦ — Turno ${newG.turnNum} começa — Você tem ${newG.playerVontade} ✦ Vontade —`, "log-system");
    setG(newG);
    setAnimating(false);
  };

  const endTurn = () => {
    if (!G||animating||G.turn!=="player") return;
    setAnimating(true);
    const snapshot = {...G, turn:"enemy"};
    setG(snapshot);
    addLog(`🔄 Fim do seu turno ${G.turnNum}. O Guardião prepara sua resposta...`, "log-system");
    setTimeout(()=>enemyTurn(snapshot), 700);
  };

  /* ── UI: MENU ─────────── */
  if (phase==="menu") return (
    <div style={{ padding:"40px 20px", maxWidth:700, margin:"0 auto", textAlign:"center" }}>
      <h2 style={{ fontFamily:"Cinzel Decorative,cursive", fontSize:"2rem", background:"linear-gradient(135deg,#ff5533,#fbbf24)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:10 }}>Arena da Terra</h2>
      <p style={{ color:"#5a4880", fontSize:"0.88rem", marginBottom:40 }}>Escolha seu oponente e entre na batalha!</p>
      {deck.length<3 && (
        <div style={{ padding:"12px 20px", borderRadius:12, background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.3)", color:"#fbbf24", fontSize:"0.82rem", marginBottom:32 }}>
          ⚠️ Seu deck tem {deck.length} carta(s). Adicione pelo menos 3 para usar seu deck. Será usado um deck padrão.
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:40 }}>
        {[{id:"bot",emoji:"🤖",title:"Desafiar IA",desc:"Jogue contra um bot. Bom para praticar estratégias!",color:"#4ade80"},{id:"pvp",emoji:"👥",title:"Jogador vs Jogador",desc:"Passe o dispositivo e jogue contra um amigo!",color:"#a78bfa"}].map(opt=>(
          <div key={opt.id} onClick={()=>startGame(opt.id)} style={{ padding:28, borderRadius:18, background:`radial-gradient(ellipse at 50% 0%,${opt.color}15,transparent 70%),rgba(10,5,25,0.9)`, border:`1px solid ${opt.color}44`, cursor:"pointer", transition:"all 0.3s" }}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-5px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="none"}>
            <div style={{ fontSize:"3rem", marginBottom:12 }}>{opt.emoji}</div>
            <div style={{ fontFamily:"Cinzel,serif", fontSize:"1.05rem", color:"#f0e8ff", fontWeight:700, marginBottom:8 }}>{opt.title}</div>
            <div style={{ fontSize:"0.78rem", color:"#5a4880", lineHeight:1.6 }}>{opt.desc}</div>
            <div style={{ marginTop:16, padding:"8px 20px", borderRadius:10, background:`${opt.color}22`, color:opt.color, fontFamily:"Cinzel,serif", fontSize:"0.72rem", fontWeight:700, display:"inline-block" }}>Jogar →</div>
          </div>
        ))}
      </div>
      {/* Mecânicas info */}
      <div style={{ padding:18, borderRadius:14, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(167,139,250,0.1)", textAlign:"left", marginBottom:28 }}>
        <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.7rem", color:"#5a4880", letterSpacing:"0.1em", marginBottom:10 }}>MECÂNICAS DE COMBATE</div>
        {[
          {icon:"⚡","txt":"Velocidade determina a ordem de ataque — o mais rápido age primeiro."},
          {icon:"🛡","txt":"Passivas são ativadas automaticamente com base em gatilhos (ex: Suporte à Vida)."},
          {icon:"🔇","txt":"Silêncio desativa passivas por 1 turno. Taunt força ser o alvo."},
          {icon:"☠️","txt":"Veneno causa 10 de dano por turno durante 3 turnos."},
          {icon:"❤️","txt":"HP base agora reflete o lore — Yuji tem 300 HP como na ficha."},
        ].map((m,i)=>(
          <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:6, fontSize:"0.72rem", color:"#6b5a8a" }}>
            <span>{m.icon}</span><span>{m.txt}</span>
          </div>
        ))}
      </div>
      {deck.length>0 && (
        <div style={{ padding:20, borderRadius:16, background:"rgba(10,5,25,0.9)", border:"1px solid rgba(167,139,250,0.15)" }}>
          <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.75rem", color:"#5a4880", letterSpacing:"0.1em", marginBottom:14 }}>SEU DECK ATUAL ({deck.length} cartas)</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
            {deck.map(c=><span key={c.id} style={{ fontSize:"1.6rem", filter:`drop-shadow(0 0 8px ${TYPES[c.tipo].glow})` }} title={`${c.name} — ⚡${c.velocidade??5}`}>{c.emoji}</span>)}
          </div>
        </div>
      )}
    </div>
  );

  if (phase==="result") return (
    <div style={{ padding:"60px 20px", maxWidth:600, margin:"0 auto", textAlign:"center" }}>
      <div style={{ fontSize:"5rem", marginBottom:20 }}>{G.playerHp>0?"🏆":"💀"}</div>
      <h2 style={{ fontFamily:"Cinzel Decorative,cursive", fontSize:"2rem", color:G.playerHp>0?"#4ade80":"#ff5533", marginBottom:10 }}>{G.playerHp>0?"Vitória!":"Derrota"}</h2>
      <p style={{ color:"#5a4880", marginBottom:32 }}>{G.playerHp>0?"Parabéns! Você derrotou o inimigo!":"O inimigo foi mais forte desta vez..."}</p>
      <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
        <button onClick={()=>startGame(mode)} style={{ padding:"12px 28px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#3a7f10,#6abe2a)", color:"#fff", fontFamily:"Cinzel,serif", fontWeight:700, fontSize:"0.82rem", cursor:"pointer" }}>🔄 Jogar Novamente</button>
        <button onClick={()=>setPhase("menu")} style={{ padding:"12px 28px", borderRadius:12, border:"1px solid rgba(255,255,255,0.15)", background:"transparent", color:"#9080b0", fontFamily:"Cinzel,serif", fontSize:"0.82rem", cursor:"pointer" }}>← Menu</button>
      </div>
    </div>
  );

  if (!G) return null;

  /* ── UI: CAMPO DE BATALHA ─────────── */
  const renderSkillPanel = () => {
      const sc = G.playerField.find(c=>c.uid===skillPanel);
      if (!sc) return null;
      const skills = getCardSkills(sc);
      const t = TYPES[sc.tipo];
      return (
        <div style={{ marginBottom:8, borderRadius:14, background:`linear-gradient(135deg,#0a0520,#12082a)`, border:`1px solid ${sc.inFusion?"#34d399":(sc.stealth?"rgba(200,200,255,0.4)":t.color+"55")}`, overflow:"hidden", animation:"modalIn 0.25s ease" }}>
          {/* Banner de estado especial — Fusão / Furtividade */}
          {(sc.inFusion || sc.stealth) && (
            <div style={{ padding:"7px 16px", display:"flex", alignItems:"center", gap:8,
              background: sc.inFusion ? "linear-gradient(90deg,rgba(52,211,153,0.18),rgba(52,211,153,0.06))"
                                      : "linear-gradient(90deg,rgba(200,200,255,0.1),rgba(200,200,255,0.03))",
              borderBottom: `1px solid ${sc.inFusion?"rgba(52,211,153,0.25)":"rgba(200,200,255,0.15)"}` }}>
              {sc.inFusion && <>
                <span style={{ fontSize:"1rem" }}>🦎</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.65rem", color:"#34d399", fontWeight:700 }}>FUSÃO ESPIRITUAL ATIVA</div>
                  <div style={{ fontSize:"0.55rem", color:"#1a7a5a" }}>Kata do Camaleão: ataques Físicos ×3 · {sc.fusionTurns} turno(s) restante(s)</div>
                </div>
              </>}
              {sc.stealth && !sc.inFusion && <>
                <span style={{ fontSize:"1rem" }}>🫥</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.65rem", color:"#c8c8ff", fontWeight:700 }}>FURTIVIDADE ATIVA</div>
                  <div style={{ fontSize:"0.55rem", color:"#686890" }}>Indetectável · {sc.stealthTurns} turno(s) restante(s) · Sair da furtividade ao atacar</div>
                </div>
              </>}
            </div>
          )}
          {/* Header */}
          <div style={{ padding:"10px 16px", background:`${t.color}15`, borderBottom:`1px solid ${t.color}28`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:"1.2rem" }}>{sc.emoji}</span>
              <div>
                <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.78rem", color:"#f0e8ff", fontWeight:700 }}>{sc.name}</div>
                <div style={{ fontSize:"0.58rem", color:"#6a5880" }}>Habilidades Ativas — clique para usar</div>
              </div>
            </div>
            {/* Vigor display — compacto, máximo 20 pontos visíveis */}
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:"0.58rem", color:"#a07820", letterSpacing:"0.08em", marginBottom:3 }}>🔥 VIGOR</div>
                <div style={{ display:"flex", gap:2, justifyContent:"flex-end", flexWrap:"wrap", maxWidth:120 }}>
                  {Array.from({length: Math.min(sc.maxVigor, 20)}, (_,i) => (
                    <div key={i} style={{ width:5, height:5, borderRadius:1, background: i < sc.currentVigor ? "#fbbf24" : "rgba(251,191,36,0.12)", transition:"background 0.2s" }} />
                  ))}
                </div>
                <div style={{ fontSize:"0.6rem", color:"#fbbf24", fontFamily:"Cinzel,serif", fontWeight:700, marginTop:2 }}>{sc.currentVigor}/{sc.maxVigor}</div>
              </div>
              <button onClick={()=>setSkillPanel(null)} style={{ background:"rgba(255,255,255,0.06)", border:"none", color:"#6a5880", width:24, height:24, borderRadius:"50%", cursor:"pointer", fontSize:"0.8rem" }}>✕</button>
            </div>
          </div>

          {/* Skills list */}
          {skills.length === 0
            ? <div style={{ padding:"16px 18px", color:"#4a3870", fontSize:"0.75rem" }}>Esta carta não possui habilidades ativas.</div>
            : (
              <div style={{ padding:"10px 12px", display:"flex", flexDirection:"column", gap:8 }}>
                {skills.map(skill => {
                  const cd = (sc.skillCooldowns ? sc.skillCooldowns[skill.id] : 0) || 0;
                  const isVontade = skill.isVontadeSkill;
                  const canUse = sc.currentVigor >= skill.vigorCost && cd === 0 && G.turn === "player" && !animating;
                  const borderColor = isVontade ? "#fbbf24" : (canUse ? t.color+"44" : "rgba(255,255,255,0.06)");
                  const bgColor    = isVontade ? "rgba(251,191,36,0.07)" : (canUse ? `${t.color}0d` : "rgba(255,255,255,0.02)");
                  return (
                    <div key={skill.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10,
                      background: bgColor, border: `1px solid ${borderColor}`,
                      opacity: cd > 0 ? 0.5 : 1, transition:"all 0.2s",
                      boxShadow: isVontade && canUse ? "0 0 12px rgba(251,191,36,0.15)" : "none" }}>
                      {/* Ícone + badge Vontade */}
                      <div style={{ position:"relative", flexShrink:0 }}>
                        <div style={{ width:38, height:38, borderRadius:9, background: isVontade ? "rgba(251,191,36,0.15)" : `${t.color}18`,
                          border:`1px solid ${isVontade?"rgba(251,191,36,0.4)":t.color+"33"}`,
                          display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.25rem" }}>
                          {skill.icon}
                        </div>
                        {isVontade && <div style={{ position:"absolute", top:-4, right:-4, fontSize:"0.42rem", background:"#fbbf24", color:"#1a0a00", borderRadius:4, padding:"1px 3px", fontWeight:700, fontFamily:"Cinzel,serif" }}>✦V</div>}
                      </div>
                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.72rem", color: canUse ? (isVontade?"#fde68a":"#f0e8ff") : "#5a4880", fontWeight:700, marginBottom:2 }}>
                          {skill.name}
                          {isVontade && <span style={{ marginLeft:6, fontSize:"0.55rem", color:"#a07820" }}>Habilidade de Vontade</span>}
                        </div>
                        <div style={{ fontSize:"0.6rem", color:"#5a4880", lineHeight:1.5 }}>{skill.desc}</div>
                        <div style={{ display:"flex", gap:8, marginTop:4, flexWrap:"wrap" }}>
                          <span style={{ fontSize:"0.55rem", padding:"1px 6px", borderRadius:10, background:"rgba(251,191,36,0.15)", color:"#fbbf24", border:"1px solid rgba(251,191,36,0.25)" }}>🔥 {skill.vigorCost} Vigor</span>
                          <span style={{ fontSize:"0.55rem", padding:"1px 6px", borderRadius:10, background:"rgba(167,139,250,0.1)", color:"#a78bfa", border:"1px solid rgba(167,139,250,0.2)" }}>⏱ {skill.cooldown}t CD</span>
                          {cd > 0 && <span style={{ fontSize:"0.55rem", padding:"1px 6px", borderRadius:10, background:"rgba(255,85,51,0.15)", color:"#ff7755", border:"1px solid rgba(255,85,51,0.25)" }}>🔒 {cd}t</span>}
                        </div>
                      </div>
                      {/* Botão usar */}
                      <button
                        disabled={!canUse}
                        onClick={()=>useSkill(sc.uid, skill.id)}
                        style={{ flexShrink:0, padding:"7px 14px", borderRadius:9, border:"none",
                          cursor: canUse ? "pointer" : "not-allowed",
                          background: canUse ? `linear-gradient(135deg,${t.color}99,${t.color})` : "rgba(255,255,255,0.04)",
                          color: canUse ? "#fff" : "#3a2a5a",
                          fontFamily:"Cinzel,serif", fontSize:"0.62rem", fontWeight:700,
                          boxShadow: canUse ? `0 3px 12px ${t.color}44` : "none",
                          transition:"all 0.2s" }}>
                        {cd > 0 ? `${cd}t` : "Usar"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      );
  };


  return (
    <div style={{ padding:"12px 12px 32px", maxWidth:1000, margin:"0 auto", position:"relative" }}>
      {/* Arena ambient glow layer */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0, borderRadius:16 }}>
        {/* Enemy side glow */}
        <div style={{ position:"absolute", top:80, left:"50%", transform:"translateX(-50%)",
          width:"70%", height:120, background:"radial-gradient(ellipse,rgba(255,85,51,0.06),transparent 70%)",
          filter:"blur(30px)" }} />
        {/* Player side glow */}
        <div style={{ position:"absolute", bottom:200, left:"50%", transform:"translateX(-50%)",
          width:"70%", height:120, background:"radial-gradient(ellipse,rgba(74,222,128,0.06),transparent 70%)",
          filter:"blur(30px)" }} />
        {/* Center VS line */}
        <div style={{ position:"absolute", top:"50%", left:"5%", right:"5%", height:1,
          background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.1),rgba(167,139,250,0.18),rgba(167,139,250,0.1),transparent)" }} />
        {floats.map(f=>(
          <div key={f.id} style={{ position:"absolute", pointerEvents:"none", zIndex:100, left:f.side==="enemy"?"60%":"30%", top:f.side==="enemy"?"25%":"65%", transform:"translateX(-50%)", fontFamily:"Cinzel Decorative,cursive", fontWeight:900, fontSize:f.text.length>4?"1.1rem":"1.5rem", color:f.color, textShadow:`0 0 12px ${f.color}, 0 2px 4px rgba(0,0,0,0.8)`, animation:"floatDmg 1.4s ease-out forwards", userSelect:"none", whiteSpace:"nowrap" }}>
            {f.text}
          </div>
        ))}
      </div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <button onClick={()=>setPhase("menu")} style={{ background:"none", border:"1px solid rgba(255,255,255,0.1)", color:"#5a4880", padding:"5px 12px", borderRadius:8, cursor:"pointer", fontSize:"0.75rem" }}>← Sair</button>
        <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.72rem", color:"#5a4880", letterSpacing:"0.1em" }}>TURNO {G.turnNum} · {G.turn==="player"?"Seu Turno":"Turno Inimigo"}</div>
        <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.78rem", color:"#fde68a" }}>✦ {G.playerVontade} Vontade</div>
      </div>

      {/* HP bars */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 50px 1fr", gap:10, alignItems:"center", marginBottom:12 }}>
        <div style={{ background:"linear-gradient(135deg,rgba(10,5,25,0.95),rgba(15,8,30,0.9))", border:"1px solid rgba(74,222,128,0.25)", borderRadius:12, padding:"10px 14px", boxShadow:"0 4px 16px rgba(0,0,0,0.4),inset 0 0 20px rgba(74,222,128,0.03)" }}>
          <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.75rem", color:"#d0c0f0", marginBottom:4 }}>👤 Você</div>
          <div style={{ height:8, background:"rgba(255,255,255,0.06)", borderRadius:4, overflow:"hidden", marginBottom:3 }}>
            <div style={{ height:"100%", borderRadius:4, background:"linear-gradient(90deg,#4ade80,#22c55e)", width:`${Math.max(0,G.playerHp/300*100)}%`, transition:"width 0.5s" }} />
          </div>
          <div style={{ fontSize:"0.68rem", color:"#5a4880", marginBottom:4 }}>❤️ {Math.max(0,G.playerHp)}/300</div>
          <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
            {Array.from({length:7},(_,i)=><div key={i} style={{ width:10, height:10, borderRadius:"50%", background:i<G.playerVontade?"#fbbf24":"rgba(251,191,36,0.12)", border:`1px solid ${i<G.playerVontade?"#fbbf24":"rgba(251,191,36,0.15)"}`, transition:"all 0.3s" }} />)}
          </div>
        </div>
        <div style={{ textAlign:"center", fontFamily:"Cinzel Decorative,cursive", fontSize:"0.9rem", color:"#ff5533", textShadow:"0 0 10px rgba(255,85,51,0.5)" }}>VS</div>
        <div style={{ background:"linear-gradient(135deg,rgba(10,5,25,0.95),rgba(20,5,5,0.9))", border:"1px solid rgba(255,85,51,0.25)", borderRadius:12, padding:"10px 14px", textAlign:"right", boxShadow:"0 4px 16px rgba(0,0,0,0.4),inset 0 0 20px rgba(255,85,51,0.03)" }}>
          <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.75rem", color:"#d0c0f0", marginBottom:4 }}>👹 Guardião</div>
          <div style={{ height:8, background:"rgba(255,255,255,0.06)", borderRadius:4, overflow:"hidden", marginBottom:3 }}>
            <div style={{ height:"100%", borderRadius:4, background:"linear-gradient(90deg,#ff5533,#dc2626)", width:`${Math.max(0,G.enemyHp/(G.enemyMaxHp||300)*100)}%`, transition:"width 0.5s", marginLeft:"auto" }} />
          </div>
          <div style={{ fontSize:"0.68rem", color:"#5a4880" }}>❤️ {Math.max(0,G.enemyHp)}/{G.enemyMaxHp||300}</div>
        </div>
      </div>

      {/* Enemy field */}
      <div style={{ position:"relative", background:"linear-gradient(180deg,rgba(255,85,51,0.07),rgba(255,85,51,0.02))",
        border:"1px solid rgba(255,85,51,0.22)", borderRadius:14, padding:"10px 14px", marginBottom:6, minHeight:132,
        boxShadow:"inset 0 0 30px rgba(255,85,51,0.04), 0 2px 12px rgba(0,0,0,0.3)" }}>
        {/* Arena lines */}
        <div style={{ position:"absolute", bottom:0, left:"8%", right:"8%", height:1,
          background:"linear-gradient(90deg,transparent,rgba(255,85,51,0.12),transparent)", borderRadius:1 }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.6rem", color:"#5a3030", letterSpacing:"0.1em" }}>CAMPO INIMIGO — {targetedEnemy?"🎯 Alvo selecionado! Clique em Atacar":"Clique num inimigo para mirar ⚔"}</div>
          <div style={{ display:"flex", gap:8, fontSize:"0.55rem", color:"#5a3030" }}>
            <span>🃏 Mão: {(G.enemyHand||[]).length}</span>
            <span>📚 Deck: {(G.enemyDeck||[]).length}</span>
            <span>✦ Vontade: {G.enemyVontade}</span>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", minHeight:100, alignItems:"center" }}>
          {G.enemyField.length===0
            ? <span style={{ color:"#3a1a1a", fontSize:"0.78rem" }}>Campo vazio</span>
            : [...G.enemyField].sort((a,b)=>(b.velocidade??5)-(a.velocidade??5)).map(c=>(
              <div key={c.uid} style={{ position:"relative", cursor: G.turn==="player"?"crosshair":"default" }}
                onClick={()=>{ if(G.turn==="player"&&!animating) setTargetedEnemy(t=>t===c.uid?null:c.uid); }}>
                <BattleCard card={c} enemy selected={targetedEnemy===c.uid} imgSrc={getCardImg?getCardImg(c):null} />
                {targetedEnemy===c.uid && (
                  <div style={{ position:"absolute", inset:-3, borderRadius:12,
                    border:"2px solid #ff5533", boxShadow:"0 0 14px rgba(255,85,51,0.7)",
                    pointerEvents:"none", animation:"pulse 0.8s ease-in-out infinite" }}>
                    <div style={{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)",
                      background:"#ff5533", color:"#fff", fontSize:"0.4rem", fontFamily:"Cinzel,serif",
                      fontWeight:700, padding:"2px 6px", borderRadius:6, whiteSpace:"nowrap" }}>🎯 ALVO</div>
                  </div>
                )}
              </div>
            ))
          }
        </div>
      </div>

      {/* Player field — drop zone */}
      <div style={{ position:"relative",
        background: dragOver
          ? "linear-gradient(0deg,rgba(74,222,128,0.18),rgba(74,222,128,0.08))"
          : "linear-gradient(0deg,rgba(74,222,128,0.07),rgba(74,222,128,0.02))",
        border: dragOver ? "2px dashed rgba(74,222,128,0.8)" : "1px solid rgba(74,222,128,0.22)",
        borderRadius:14, padding:"10px 14px", marginBottom:6, minHeight:132,
        boxShadow:"inset 0 0 30px rgba(74,222,128,0.04), 0 2px 12px rgba(0,0,0,0.3)",
        transition:"all 0.15s" }}
        onDragOver={e=>{ e.preventDefault(); e.dataTransfer.dropEffect="move"; setDragOver(true); }}
        onDragLeave={()=>setDragOver(false)}
        onDrop={e=>{ e.preventDefault(); setDragOver(false); if(dragging&&G&&G.turn==="player"&&!animating){ const c=dragging; setDragging(null); setSelected(c); playCardDirect(c); } }}>
        {/* Arena lines */}
        <div style={{ position:"absolute", top:0, left:"8%", right:"8%", height:1,
          background:"linear-gradient(90deg,transparent,rgba(74,222,128,0.12),transparent)", borderRadius:1 }} />
        <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.6rem", color:"#1a4a28", letterSpacing:"0.1em", marginBottom:8 }}>SEU CAMPO — {dragOver?"Solte para jogar!":"Arraste cartas aqui · clique numa carta para habilidades ✦"}</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", minHeight:100, alignItems:"center" }}>
          {G.playerField.length===0
            ? <span style={{ color:"#1a3a28", fontSize:"0.78rem" }}>Jogue uma carta da mão</span>
            : [...G.playerField].sort((a,b)=>(b.velocidade??5)-(a.velocidade??5)).map(c=>(
                <div key={c.uid} style={{ position:"relative" }}>
                  <BattleCard card={c} selected={skillPanel===c.uid} onClick={()=>{ if(G.turn==="player"&&!animating) setSkillPanel(sp=>sp===c.uid?null:c.uid); }} imgSrc={getCardImg?getCardImg(c):null} />
                </div>
              ))
          }
        </div>
      </div>

      {/* SKILL PANEL — painel de habilidades da carta selecionada */}
      {skillPanel && renderSkillPanel()}

      {/* Player hand */}
      <div style={{ background:"rgba(10,5,25,0.8)", border:"1px solid rgba(167,139,250,0.18)", borderRadius:14, padding:"10px 14px", marginBottom:10, minHeight:128 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.6rem", color:"#3a2a6a", letterSpacing:"0.1em" }}>SUA MÃO ({G.playerHand.length} cartas) — arraste para o campo ou clique para selecionar</div>
          <div style={{ fontSize:"0.55rem", color:"#3a2a6a" }}>📚 Deck: {G.playerDeck.length} · ✦ {G.playerVontade}/7</div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", minHeight:100, alignItems:"center" }}>
          {G.playerHand.length===0
            ? <span style={{ color:"#3a2a6a", fontSize:"0.78rem" }}>Sem cartas na mão — arraste uma carta para o campo</span>
            : G.playerHand.map(c=>(
              <div key={c.uid} style={{ position:"relative", cursor:"grab" }}
                draggable
                onDragStart={e=>{ setDragging(c); setSelected(c); e.dataTransfer.effectAllowed="move"; }}
                onDragEnd={()=>setDragging(null)}
                onClick={()=>selectCard(c.uid)}>
                <BattleCard card={c} selected={selected?.uid===c.uid || dragging?.uid===c.uid} imgSrc={getCardImg?getCardImg(c):null} />
                {c.isConsumable && (
                  <div style={{ position:"absolute", top:-6, left:"50%", transform:"translateX(-50%)",
                    fontSize:"0.42rem", background:"linear-gradient(90deg,#9333ea,#c084fc)", color:"#fff",
                    borderRadius:6, padding:"1px 5px", fontFamily:"Cinzel,serif", fontWeight:700,
                    whiteSpace:"nowrap", boxShadow:"0 2px 6px rgba(192,132,252,0.4)", zIndex:3 }}>
                    CONSUMÍVEL
                  </div>
                )}
                {c.isItem && (
                  <div style={{ position:"absolute", top:-6, left:"50%", transform:"translateX(-50%)",
                    fontSize:"0.42rem", color:"#1a1000", fontWeight:700, fontFamily:"Cinzel,serif",
                    whiteSpace:"nowrap", zIndex:3, borderRadius:6, padding:"1px 6px",
                    background: c.equipFor==="any_agent"
                      ? "linear-gradient(90deg,#b45309,#e2c97e)"
                      : "linear-gradient(90deg,#7c2d12,#f97316)",
                    boxShadow: c.equipFor==="any_agent"
                      ? "0 2px 6px rgba(226,201,126,0.5)"
                      : "0 2px 6px rgba(249,115,22,0.5)" }}>
                    {c.equipFor==="any_agent" ? "ITEM UNIVERSAL" : "ITEM EXCLUSIVO"}
                  </div>
                )}
              </div>
            ))
          }
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center", marginBottom:10 }}>
        {[
          {label:"Jogar Carta", icon:"▶", action:playCard, color:"#4ade80", disabled:!selected},
          {label:"Atacar", icon:"⚔", action:attack, color:"#ff5533", disabled:G.playerField.length===0},
          {label:"Fim de Turno", icon:"⏭", action:endTurn, color:"#a78bfa", disabled:animating},
        ].map(btn=>(
          <button key={btn.label} onClick={btn.action} disabled={btn.disabled||animating} style={{
            padding:"9px 20px", borderRadius:10, border:`1px solid ${btn.disabled||animating?"rgba(255,255,255,0.04)":btn.color+"44"}`,
            cursor:btn.disabled||animating?"not-allowed":"pointer",
            background:btn.disabled||animating
              ? "rgba(255,255,255,0.03)"
              : `linear-gradient(135deg,rgba(0,0,0,0.4),rgba(0,0,0,0.2)),linear-gradient(135deg,${btn.color}55,${btn.color}88)`,
            color:btn.disabled||animating?"#2a1a4a":"#fff",
            fontFamily:"Cinzel,serif", fontWeight:700, fontSize:"0.75rem", letterSpacing:"0.05em",
            boxShadow:btn.disabled||animating?"none":`0 4px 16px ${btn.color}33, inset 0 1px 0 rgba(255,255,255,0.1)`,
            transition:"all 0.2s", display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:"0.85rem" }}>{btn.icon}</span>
            {btn.label}
          </button>
        ))}
      </div>

      {/* Glossary legend strip */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:4, padding:"4px 8px" }}>
        {Object.entries({Vontade:"#fbbf24",Vigor:"#f97316",Veneno:"#4ade80",Sangramento:"#f87171",Furtividade:"#c8c8ff",Fusão:"#34d399"}).map(([k,c])=>(
          <span key={k} style={{ fontSize:"0.48rem", color:c, padding:"1px 6px", borderRadius:8,
            background:`${c}12`, border:`1px solid ${c}33`, cursor:"default" }}
            title={`Passe o mouse nos termos [${k}] no log para ver detalhes`}>
            {k}
          </span>
        ))}
        <span style={{ fontSize:"0.48rem", color:"#6b5a8a", marginLeft:"auto" }}>↑ termos clicáveis no log</span>
      </div>

      {/* Battle log */}
      <div style={{ background:"rgba(5,2,15,0.92)", border:"1px solid rgba(167,139,250,0.12)", borderRadius:12, padding:"10px 14px", maxHeight:150, overflowY:"auto", display:"flex", flexDirection:"column-reverse" }}>
        <div>
          {[...log].reverse().map(l=>(
            <LogLine key={l.id} msg={l.msg} cls={l.cls} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════ */
const STARS = [{w: 2, x: 0, y: 0, o: 0.3}, {w: 1, x: 37, y: 53, o: 0.37}, {w: 1, x: 74, y: 6, o: 0.44}, {w: 1, x: 11, y: 59, o: 0.51}, {w: 1, x: 48, y: 12, o: 0.58}, {w: 2, x: 85, y: 65, o: 0.65}, {w: 1, x: 22, y: 18, o: 0.72}, {w: 1, x: 59, y: 71, o: 0.3}, {w: 1, x: 96, y: 24, o: 0.37}, {w: 1, x: 33, y: 77, o: 0.44}, {w: 2, x: 70, y: 30, o: 0.51}, {w: 1, x: 7, y: 83, o: 0.58}, {w: 1, x: 44, y: 36, o: 0.65}, {w: 1, x: 81, y: 89, o: 0.72}, {w: 1, x: 18, y: 42, o: 0.3}, {w: 2, x: 55, y: 95, o: 0.37}, {w: 1, x: 92, y: 48, o: 0.44}, {w: 1, x: 29, y: 1, o: 0.51}, {w: 1, x: 66, y: 54, o: 0.58}, {w: 1, x: 3, y: 7, o: 0.65}, {w: 2, x: 40, y: 60, o: 0.72}, {w: 1, x: 77, y: 13, o: 0.3}, {w: 1, x: 14, y: 66, o: 0.37}, {w: 1, x: 51, y: 19, o: 0.44}, {w: 1, x: 88, y: 72, o: 0.51}, {w: 2, x: 25, y: 25, o: 0.58}, {w: 1, x: 62, y: 78, o: 0.65}, {w: 1, x: 99, y: 31, o: 0.72}, {w: 1, x: 36, y: 84, o: 0.3}, {w: 1, x: 73, y: 37, o: 0.37}, {w: 2, x: 10, y: 90, o: 0.44}, {w: 1, x: 47, y: 43, o: 0.51}, {w: 1, x: 84, y: 96, o: 0.58}, {w: 1, x: 21, y: 49, o: 0.65}, {w: 1, x: 58, y: 2, o: 0.72}, {w: 2, x: 95, y: 55, o: 0.3}, {w: 1, x: 32, y: 8, o: 0.37}, {w: 1, x: 69, y: 61, o: 0.44}, {w: 1, x: 6, y: 14, o: 0.51}, {w: 1, x: 43, y: 67, o: 0.58}];

export default function App() {
  const [page, setPage] = useState("home");
  const [gems, setGems] = useState(1250);
  const [deck, setDeck] = useState([]);
  const [collection, setCollection] = useState(()=>{
    const col={};
    ALL_CARDS.forEach(c=>{
      if (c.isStarter) { col[c.id]=true; return; }
      if (Math.random()>0.5) col[c.id]=true;
    });
    return col;
  });
  const [toast, setToast] = useState("");
  const [toastTimer, setToastTimer] = useState(null);

  const getCardImg = (card) => null; // Fotos removidas — arte via SVG espiritual

  const showToast = useCallback((msg)=>{
    setToast(msg);
    if (toastTimer) clearTimeout(toastTimer);
    setToastTimer(setTimeout(()=>setToast(""),2800));
  },[toastTimer]);

  const addToDeck = (card) => {
    if (deck.some(c=>c.id===card.id)) { showToast("Carta já está no deck!"); return; }
    if (deck.length>=10) { showToast("Deck cheio! (máx 10)"); return; }
    setDeck(d=>[...d,card]);
  };

  const navItems = [
    {id:"home",icon:"🌿",label:"Início"},
    {id:"collection",icon:"📚",label:"Coleção"},
    {id:"deck",icon:"🎴",label:"Deck"},
    {id:"battle",icon:"⚔️",label:"Batalha"},
    {id:"shop",icon:"🏪",label:"Loja"},
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#050210", fontFamily:"Raleway,sans-serif", color:"#e8d9ff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;600;700&family=Raleway:wght@300;400;500;600&display=swap');
        * { box-sizing:border-box; }
        body { margin:0; }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes shimmerSlide { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes floatCard { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.88) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(20px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes cardReveal { from{opacity:0;transform:rotateY(90deg) scale(0.8)} to{opacity:1;transform:rotateY(0) scale(1)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes floatDmg { 0%{opacity:1;transform:translateY(0) scale(1)} 60%{opacity:1;transform:translateY(-32px) scale(1.1)} 100%{opacity:0;transform:translateY(-52px) scale(0.9)} }
        @keyframes floatBg { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-20px)} }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:rgba(167,139,250,0.3);border-radius:2px}
      `}</style>

      {/* Background */}
      <div style={{ position:"fixed", inset:0, zIndex:0, overflow:"hidden", pointerEvents:"none" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 15% 15%,#1a0a3e,transparent 55%),radial-gradient(ellipse at 85% 85%,#0a1a3e,transparent 55%),radial-gradient(ellipse at 50% 50%,#0a0520,#020110 100%)" }} />
        <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"#2a1060", filter:"blur(120px)", opacity:0.12, top:-150, left:-150, animation:"floatBg 15s ease-in-out infinite" }} />
        <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"#103060", filter:"blur(100px)", opacity:0.10, bottom:-100, right:-100, animation:"floatBg 12s ease-in-out infinite reverse" }} />
        {STARS.map((s,i)=><div key={i} style={{ position:"absolute", width:s.w, height:s.w, borderRadius:"50%", background:"rgba(255,255,255,0.4)", left:s.x+"%", top:s.y+"%", opacity:s.o }} />)}
      </div>

      {/* NAVBAR */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background:"rgba(5,2,16,0.92)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(167,139,250,0.15)", height:62, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", gap:8 }}>
        <div style={{ fontFamily:"Cinzel Decorative,cursive", fontSize:"1.05rem", background:"linear-gradient(135deg,#a8e063,#56ab2f,#fbbf24)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", whiteSpace:"nowrap", filter:"drop-shadow(0 0 8px rgba(100,200,50,0.35))" }}>
          🌿 Vontade da Terra
        </div>
        <div style={{ display:"flex", gap:4 }}>
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>setPage(item.id)} style={{
              background:"none", border:"none", cursor:"pointer",
              padding:"6px 12px", borderRadius:8,
              color:page===item.id?"#f0e8ff":"#5a4880",
              fontFamily:"Cinzel,serif", fontSize:"0.7rem", fontWeight:600,
              letterSpacing:"0.05em", textTransform:"uppercase",
              backgroundColor:page===item.id?"rgba(167,139,250,0.15)":"transparent",
              borderBottom:page===item.id?"2px solid #a8e063":"2px solid transparent",
              transition:"all 0.2s" }}>{item.icon} {item.label}</button>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.25)", padding:"5px 14px", borderRadius:20, whiteSpace:"nowrap" }}>
          <span>💎</span>
          <span style={{ fontFamily:"Cinzel,serif", fontWeight:700, color:"#fbbf24", fontSize:"0.85rem" }}>{gems.toLocaleString()}</span>
        </div>
      </nav>

      <div style={{ position:"relative", zIndex:1, paddingTop:62 }}>
        {page==="home" && (
          <div style={{ minHeight:"calc(100vh - 62px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 20px", textAlign:"center" }}>
            <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.72rem", letterSpacing:"0.2em", color:"#fbbf24", border:"1px solid rgba(251,191,36,0.35)", padding:"5px 18px", borderRadius:20, background:"rgba(251,191,36,0.07)", marginBottom:24 }}>
              ✦ TEMPORADA 1 — O DESPERTAR DA FLORESTA ANTIGA ✦
            </div>
            <h1 style={{ fontFamily:"Cinzel Decorative,cursive", fontSize:"clamp(2rem,6vw,4.5rem)", lineHeight:1.1, marginBottom:14 }}>
              <span style={{ color:"#a8e063", textShadow:"0 0 30px rgba(168,224,99,0.5)" }}>Vontade</span>{" "}
              <span style={{ color:"#56ab2f", textShadow:"0 0 30px rgba(86,171,47,0.5)" }}>da Terra</span>
            </h1>
            <p style={{ fontSize:"1rem", color:"#6b5a8a", maxWidth:480, lineHeight:1.8, marginBottom:32 }}>
              Colete cartas lendárias, monte seu deck e entre em batalhas épicas pela força da natureza. Agentes, Criaturas, Habilidades e Terrenos aguardam você.
            </p>
            <div style={{ display:"flex", gap:14, flexWrap:"wrap", justifyContent:"center", marginBottom:60 }}>
              <button onClick={()=>setPage("battle")} style={{ padding:"12px 30px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#3a7f10,#6abe2a)", color:"#fff", fontFamily:"Cinzel,serif", fontWeight:700, fontSize:"0.82rem", cursor:"pointer", boxShadow:"0 4px 20px rgba(74,222,128,0.4)" }}>⚔️ Batalhar Agora</button>
              <button onClick={()=>setPage("collection")} style={{ padding:"12px 30px", borderRadius:12, border:"1px solid rgba(167,139,250,0.4)", background:"rgba(167,139,250,0.1)", color:"#c4b5fd", fontFamily:"Cinzel,serif", fontWeight:700, fontSize:"0.82rem", cursor:"pointer" }}>📚 Ver Coleção</button>
            </div>
            <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap", maxWidth:800, marginBottom:60 }}>
              {ALL_CARDS.filter(c=>c.rarity==="lendaria").map((c,i)=>(
                <div key={c.id} style={{ width:130, transform:`rotate(${[-6,-2,2,6,10][i]||0}deg)`, transition:"all 0.3s" }}
                  onMouseEnter={e=>e.currentTarget.style.transform="rotate(0) scale(1.08) translateY(-10px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform=`rotate(${[-6,-2,2,6,10][i]||0}deg)`}>
                  <GameCard card={c} onClick={()=>setPage("collection")} size="sm" imgSrc={getCardImg(c)} />
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:32, flexWrap:"wrap", justifyContent:"center" }}>
              {[{v:ALL_CARDS.length,l:"Cartas",c:"#fbbf24"},{v:6,l:"Elementos",c:"#a78bfa"},{v:4,l:"Tipos",c:"#4ade80"},{v:"∞",l:"Estratégias",c:"#22d3ee"}].map(s=>(
                <div key={s.l} style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:"Cinzel Decorative,cursive", fontSize:"1.8rem", color:s.c }}>{s.v}</div>
                  <div style={{ fontSize:"0.7rem", color:"#3a2a6a", textTransform:"uppercase", letterSpacing:"0.1em" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {page==="collection" && <CollectionPage collection={collection} onAddDeck={addToDeck} deck={deck} showToast={showToast} getCardImg={getCardImg} />}
        {page==="deck" && <DeckPage collection={collection} deck={deck} setDeck={setDeck} showToast={showToast} getCardImg={getCardImg} />}
        {page==="battle" && <BattlePage deck={deck} collection={collection} showToast={showToast} getCardImg={getCardImg} />}
        {page==="shop" && <ShopPage gems={gems} setGems={setGems} collection={collection} setCollection={setCollection} showToast={showToast} />}
      </div>

      <Toast msg={toast} />
    </div>
  );
}