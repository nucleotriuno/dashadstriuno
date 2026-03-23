# Spec: Landing Page de Captação de Consultoras — Alexa Semijoias

**Data:** 2026-03-23
**Status:** Aprovado pelo cliente
**Tipo:** Página estática (HTML/CSS/JS single-file)

---

## 1. Objetivo

Criar uma landing page de captação de consultoras para a Alexa Semijoias. O objetivo principal é converter visitantes em leads qualificadas (mulheres interessadas em revender semijoias), capturando Nome, WhatsApp, E-mail e Cidade via formulário com envio a um webhook n8n.

---

## 2. Stack & Entrega

- **Tecnologia:** HTML5 + CSS3 + JavaScript puro (vanilla) — arquivo único `index.html`
- **Sem frameworks, sem dependências externas de JS**
- **Fontes:** Google Fonts (Cormorant + Montserrat) via `<link>` no `<head>`
- **Deploy:** Arquivo estático — pode ser hospedado em qualquer servidor/CDN
- **Webhook:** `fetch()` POST JSON para URL n8n configurável via constante no topo do script

---

## 3. Identidade Visual

### 3.1 Paleta de Cores

| Token | Hex | Uso |
|-------|-----|-----|
| `--off` | `#F4ECE6` | Fundo bege, campos de formulário, cards |
| `--taupe` | `#A39382` | Acentos, ícones, labels, CTAs secundárias |
| `--dark` | `#303030` | Fundos escuros, texto principal, CTAs primárias |
| `--white` | `#FFFFFF` | Fundo seção branca, cards depoimentos |

### 3.2 Tipografia

| Papel | Fonte | Variações |
|-------|-------|-----------|
| Títulos / headlines | Cormorant (serif) | weight 300, italic nos destaques |
| Corpo / UI | Montserrat (sans-serif) | weight 300, 400, 500, 600 |

- Line-height corpo: 1.7–1.8
- Letter-spacing labels: 2–3px
- Tags/labels: uppercase, 8–10px, letter-spacing 3px

### 3.3 Botões

| Variante | Estilo |
|----------|--------|
| CTA primária (pill) | `background: --taupe`, `color: --off`, `border-radius: 30px`, `letter-spacing: 3px` |
| CTA outline | `border: 1px solid --dark`, `color: --dark`, `border-radius: 2px` |
| Submit do formulário | `background: --dark`, `color: --off`, `border-radius: 2px`, `width: 100%` |

---

## 4. Estrutura de Seções (Ordem Final Aprovada)

| # | Seção | Fundo | Descrição |
|---|-------|-------|-----------|
| 1 | **Navbar sticky** | `#303030` semi-transparente | Logo · ALEXA · + links âncora (Benefícios, A Marca, Como Funciona) + pill CTA "Inscreva-se" |
| 2 | **Hero** | Gradiente escuro + foto de modelo (bg) | Tag · Seja consultora Alexa · + H1 Cormorant italic + caixa descritiva arredondada + pill CTA "Quero ser consultora" |
| 3 | **Benefícios** | `#F4ECE6` (bege) | Tag + H2 + 6 cards com ícone SVG: Renda Extra, Flexibilidade, Qualidade, Comunidade, Exclusividade, Suporte + outline CTA |
| 4 | **Sobre a Marca** | `#F4ECE6` (bege) | Faixa superior com título faded + foto flutuante à esquerda + texto à direita |
| 5 | **Como Funciona** | `#303030` (escuro) | Tag + H2 + subtítulo + grid 2×2 com 4 passos numerados (Cormorant): Cadastro → Contato → Conheça → Venda |
| 6 | **Seção Emocional** | Gradiente taupe | Tag + título itálico em Cormorant + 3 cards de pergunta + parágrafo reveal + CTA "Mude sua vida hoje" |
| 7 | **Formulário** | `#FFFFFF` (branco) | Split layout: form à esquerda + foto consultora à direita. 4 campos + checkbox de consentimento + botão submit |
| 8 | **Depoimentos** | `#F4ECE6` (bege) | 2 cards com citação, estrelas, avatar e nome (conteúdo placeholder — cliente inserirá depois) |
| 9 | **CTA Final** | `#303030` (escuro) | Tag + headline Cormorant + pill CTA |
| 10 | **FAQ** | `#F4ECE6` (bege) | 4 perguntas com accordion (expand/collapse via JS) |
| 11 | **Footer** | `#303030` (escuro) | Logo + subtítulo "Semijoias" + copyright |

---

## 5. Formulário e Webhook

### 5.1 Campos

| Campo | Tipo HTML | Autocomplete | Obrigatório |
|-------|-----------|--------------|-------------|
| Nome completo | `text` | `name` | Sim |
| WhatsApp | `tel` | `tel` | Sim |
| E-mail | `email` | `email` | Sim |
| Cidade | `text` | `address-level2` | Sim |
| Checkbox consentimento | `checkbox` | — | Sim |

### 5.2 Envio

- `fetch()` POST com `Content-Type: application/json`
- URL do webhook definida em constante `WEBHOOK_URL` no topo do script
- Estados do botão: padrão → `"Enviando..."` (disabled) → sucesso (mensagem inline) → erro (mensagem inline com retry)
- Payload JSON:
```json
{
  "nome": "...",
  "whatsapp": "...",
  "email": "...",
  "cidade": "...",
  "consentimento": true,
  "origem": "landing-page-consultoras",
  "timestamp": "ISO 8601"
}
```

### 5.3 Estados de feedback

- **Carregando:** botão desabilitado com texto "Enviando..."
- **Sucesso:** esconde o formulário, exibe mensagem: "Recebemos seu cadastro! Nossa equipe entrará em contato em breve pelo WhatsApp."
- **Erro:** exibe mensagem de erro abaixo do botão sem limpar o formulário; permite reenvio

---

## 6. Responsividade

**Mobile-first.** Breakpoints:

| Breakpoint | Largura | Ajustes |
|------------|---------|---------|
| Base (mobile) | 375px | Tudo em coluna, benefícios 2 colunas |
| Tablet | ≥ 768px | Benefícios 3 colunas, como funciona 4 colunas (linha única) |
| Desktop | ≥ 1024px | Max-width 1100px centrado, split do formulário aparece |

O **split layout do formulário** (form + foto lado a lado) é visível apenas a partir de 768px. No mobile, a foto é ocultada e o formulário ocupa largura total.

---

## 7. Navbar e Navegação

- `position: sticky; top: 0; z-index: 100`
- `backdrop-filter: blur(8px)` + fundo semi-transparente
- Links âncora com scroll suave: `scroll-behavior: smooth` no `html`
- No mobile: links âncora ocultos, exibir apenas o CTA pill

---

## 8. FAQ Accordion

- JavaScript puro: `querySelectorAll` + toggle de classe `.open`
- Animação de expand: `max-height` de 0 para valor calculado, `transition: max-height 0.3s ease`
- Ícone: `+` → `×` ao abrir

---

## 9. Ícones

- SVG inline (Lucide-style), stroke-only, `stroke-width: 1.5`
- Tamanho: 18–20px dentro de container circular 40×40px
- Nenhum emoji como ícone estrutural

---

## 10. Acessibilidade

- Todas as imagens com `alt` descritivo
- Todos os campos com `<label for="">` visível
- Contraste mínimo 4.5:1 (WCAG AA) verificado para todas as combinações de texto/fundo
- Focus states visíveis (outline 2px taupe)
- `autocomplete` em todos os campos do formulário
- `aria-label` no botão de fechar accordion

---

## 11. Assets

| Asset | Status | Localização |
|-------|--------|-------------|
| Logo (texto) | Renderizada via CSS — "· ALEXA ·" em Montserrat | — |
| Foto hero (background) | **A providenciar** — placeholder escuro no momento | `assets/hero-bg.jpg` |
| Foto "Sobre a Marca" | **A providenciar** — placeholder bege no momento | `assets/sobre-foto.jpg` |
| Foto formulário | **A providenciar** — placeholder bege no momento | `assets/form-foto.jpg` |
| Fotos depoimentos (avatares) | **A providenciar** — avatares circulares placeholder | `assets/depo-1.jpg`, `assets/depo-2.jpg` |
| Textos depoimentos | **A providenciar** — placeholder no momento | — |

---

## 12. Fora de Escopo

- Login/autenticação
- Painel de administração
- Múltiplos idiomas
- Analytics (GTM, GA4) — pode ser adicionado depois como script externo
- Pixel Meta — pode ser adicionado depois
- Versão multi-página

---

## 13. Critérios de Aceite

- [ ] Página renderiza corretamente em Chrome/Safari/Firefox mobile e desktop
- [ ] Formulário envia POST JSON para `WEBHOOK_URL` com todos os campos
- [ ] Estados de carregando/sucesso/erro funcionam corretamente
- [ ] Accordion do FAQ abre e fecha com animação
- [ ] Navbar fica sticky e links âncora navegam suavemente
- [ ] Layout responsivo correto em 375px, 768px e 1024px+
- [ ] Nenhum erro no console do browser
- [ ] Contraste WCAG AA em todos os textos
