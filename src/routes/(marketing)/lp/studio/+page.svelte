<script lang="ts">
  import { onMount } from "svelte";
  import { 
    Settings, Sparkles, Image, RefreshCw, Palette, Download, Key, Lock, Unlock, 
    ChevronLeft, ChevronRight, Plus, Minus, Info, AlertTriangle, Play, HelpCircle,
    Eraser
  } from "lucide-svelte";
  import html2canvas from "html2canvas";

  // State Variables using Svelte 5 Runes
  let passcode = $state("");
  let isUnlocked = $state(false);
  let isSettingPassword = $state(false);
  let newPasscode = $state("");
  let passcodeError = $state("");

  let activeFormat = $state("story"); // "feed" (1:1) or "story" (9:16)
  let activeTemplate = $state("minimalist"); // minimalist, stat, split, quote, alert, checklist, promo, dashboard, feedback, poll
  let activeTheme = $state("neon"); // neon, gold, cyberpunk, light, custom
  
  // Custom Color Palette (if theme is "custom")
  let customBg = $state("#0b0f19");
  let customText = $state("#f3f4f6");
  let customAccent = $state("#10b981");
  let customBorder = $state("#1f2937");

  // Slides data (used for both single post and carousel)
  let slides = $state([
    { 
      title: "NÃO ACREDITE EM PROMESSAS.", 
      desc: "Não confie em setups milagrosos.\nTeste por si mesmo. Veja seus próprios números.", 
      highlight: "A MELHOR PROVA É A EXPERIÊNCIA", 
      cta: "📊 TRADERLOG PRO - BAIXE GRÁTIS",
      image: ""
    }
  ]);
  let currentSlideIndex = $state(0);
  let activePreset = $state("custom"); // sobre, dados, erros, teste, custom
  let activeImageIndex = $state(-1);
  let snapEnabled = $state(true);
  let snapXActive = $state(false);
  let snapYActive = $state(false);
  let isExporting = $state(false);
  let snapAnchorMode = $state("both"); // center, corners, both
  let snapGuideX = $state(0);
  let snapGuideY = $state(0);

  $effect(() => {
    if (currentSlideIndex !== undefined) {
      activeImageIndex = -1;
    }
  });

  // Settings & AI Configuration
  let showSettings = $state(false);
  let aiKeyGemini = $state("");
  let aiKeyOpenAI = $state("");
  let activeAI = $state("gemini"); // gemini, openai
  let aiModel = $state("gemini-2.5-flash");
  let aiTopic = $state("");
  let isGenerating = $state(false);
  let aiError = $state("");

  // System Presets
  const presets = {
    sobre: [
      { title: "PRAZER, EU SOU O CRIADOR", desc: "Do TraderLog Pro.", highlight: "HUMANIZANDO A MARCA", cta: "" },
      { title: "A MEMÓRIA ENGANA", desc: "Como muitos traders, eu percebi que estava tomando decisões baseado na memória.", highlight: "OS NÚMEROS NÃO ENGANAM", cta: "" },
      { title: "EU ACREDITAVA SABER", desc: "Quais setups e operações davam mais resultado no meu dia a dia.", highlight: "MAS ERA APENAS ACHISMO", cta: "" },
      { title: "FOI AÍ QUE ENTENDI:", desc: "Para evoluir, eu precisava parar de operar às cegas e medir cada detalhe.", highlight: "DADOS GERAM CONSISTÊNCIA", cta: "" },
      { title: "CRIEI UMA FERRAMENTA", desc: "Para registrar, analisar e entender cada operação de forma automática.", highlight: "O NASCIMENTO DE UM PROJETO", cta: "" },
      { title: "NECESSIDADE PESSOAL", desc: "O que começou como uma planilha avançada se transformou no ecossistema TraderLog Pro.", highlight: "OFFLINE-FIRST E SEGURO", cta: "" },
      { title: "NOSSO OBJETIVO", desc: "Ajudar você a identificar erros invisíveis, economizar tempo fiscal e operar com consistência profissional.", highlight: "SUA JORNADA PROFISSIONAL", cta: "" },
      { title: "TRANSFORME SUAS OPERAÇÕES", desc: "Pare de operar de forma amadora.\nDescubra o que seus dados têm a dizer hoje.", highlight: "ERROS ANALISADOS VIRAM EXPERIÊNCIA", cta: "📊 TRADERLOG PRO - COMECE HOJE" }
    ],
    dados: [
      { title: "O QUE NÃO É MEDIDO", desc: "Não pode ser melhorado.\nSe você não sabe onde erra, como vai corrigir?", highlight: "MEDIR PARA EVOLUIR", cta: "" },
      { title: "A MEMÓRIA ENGANA", desc: "Os dados não.\nVocê lembra dos seus gains, mas apaga da mente as perdas evitáveis.", highlight: "SEJA RACIONAL", cta: "" },
      { title: "VOCÊ SABE SEU HORÁRIO?", desc: "Qual período do dia você realmente gera lucro consistente? Manhã ou tarde?", highlight: "SAIBA QUANDO PARAR", cta: "" },
      { title: "QUAL O SEU MELHOR SETUP?", desc: "Aquele que você acha que é o melhor realmente tem estatística positiva?", highlight: "COMPROVE EM DADOS", cta: "" },
      { title: "ONDE VOCÊ PERDE DINHEIRO?", desc: "Quais ativos ou comportamentos estão drenando o seu capital acumulado?", highlight: "ESTANQUE O SANGRAMENTO", cta: "" },
      { title: "TODO TRADER TEM PADRÕES", desc: "Os vencedores repetem padrões lucrativos.\nOs perdedores repetem erros previsíveis.", highlight: "CONHEÇA A SI MESMO", cta: "" },
      { title: "OPERAÇÕES GERAM RESULTADOS", desc: "Mas apenas a análise de dados gera evolução real de longo prazo no mercado.", highlight: "DADOS GERAM EVOLUÇÃO", cta: "" },
      { title: "DECISÕES MELHORES", desc: "Começam com dados melhores.\nNão tome decisões baseadas em achismo ou emoção.", highlight: "DADOS NÃO GARANTEM LUCRO", cta: "📊 TRADERLOG PRO - REGISTRE E ANALISE" }
    ],
    erros: [
      { title: "O MERCADO NÃO QUEBRA", desc: "Traders. Os próprios traders fazem isso.\nErros de execução, indisciplina e falta de regras.", highlight: "MERCADO É NEUTRO", cta: "" },
      { title: "O ERRO NÃO É TOMAR LOSS", desc: "O prejuízo faz parte do negócio.\nO verdadeiro erro é repetir o mesmo loss toda semana.", highlight: "LOSS É APRENDIZADO", cta: "" },
      { title: "FALTA DE PROCESSO", desc: "A maioria dos traders não falha por falta de um setup milagroso.\nFalha por falta de gestão e consistência.", highlight: "DISCIPLINA SUPERA TALENTO", cta: "" },
      { title: "OPERAR MAIS NÃO É", desc: "Ganhar mais.\nMais operações significam mais exposição, taxas e chances de errar.", highlight: "QUALIDADE > QUANTIDADE", cta: "" },
      { title: "MERCADO NÃO QUER VINGANÇA", desc: "Ele não sabe que você existe.\nPare de tentar 'recuperar' o prejuízo na força do ódio.", highlight: "OPERE SEM EMOÇÃO", cta: "" },
      { title: "O PROBLEMA É SEU", desc: "O pior erro de um trader é culpar o mercado, a corretora ou a internet pelos seus erros.", highlight: "ASSUMA A RESPONSABILIDADE", cta: "" },
      { title: "TODA OPERAÇÃO ENSINA", desc: "Toda execução deixa uma lição valiosa.\nMas só aprende de verdade quem registra e revisa.", highlight: "ERROS VIRAM EXPERIÊNCIA", cta: "" },
      { title: "ERROS IDENTIFICADOS", desc: "Viram melhorias mecânicas.\nErros ignorados viram prejuízos acumulados repetidamente.", highlight: "PREJUÍZO REPETIDO É UMA LIÇÃO IGNORADA", cta: "📊 TRADERLOG PRO - CORRIJA SEUS ERROS" }
    ]
  };

  // Lifecycle & Storage
  onMount(() => {
    // Load Passcode Configuration
    const savedHash = localStorage.getItem("studio_passcode_hash");
    if (!savedHash) {
      isSettingPassword = true;
    }

    // Load API Keys and Settings
    aiKeyGemini = localStorage.getItem("studio_key_gemini") || "";
    aiKeyOpenAI = localStorage.getItem("studio_key_openai") || "";
    activeAI = localStorage.getItem("studio_active_ai") || "gemini";
    aiModel = localStorage.getItem("studio_ai_model") || "gemini-2.5-flash";
  });

  // Basic SHA-256 for local browser storage security
  async function sha256(message: string) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  async function handleSetPassword() {
    if (newPasscode.trim().length < 4) {
      passcodeError = "A senha deve ter no mínimo 4 caracteres.";
      return;
    }
    const hash = await sha256(newPasscode);
    localStorage.setItem("studio_passcode_hash", hash);
    isSettingPassword = false;
    isUnlocked = true;
    passcodeError = "";
  }

  async function handleUnlock() {
    const savedHash = localStorage.getItem("studio_passcode_hash");
    if (!savedHash) {
      isUnlocked = true;
      return;
    }
    const hash = await sha256(passcode);
    if (hash === savedHash) {
      isUnlocked = true;
      passcodeError = "";
    } else {
      passcodeError = "Senha incorreta.";
    }
  }

  function handleSaveSettings() {
    localStorage.setItem("studio_key_gemini", aiKeyGemini);
    localStorage.setItem("studio_key_openai", aiKeyOpenAI);
    localStorage.setItem("studio_active_ai", activeAI);
    localStorage.setItem("studio_ai_model", aiModel);
    showSettings = false;
  }

  // Preset Loaders
  function loadPreset(key: string) {
    activePreset = key;
    if (key === "custom") return;
    slides = JSON.parse(JSON.stringify(presets[key])).map((s: any) => ({ ...s, image: "" }));
    currentSlideIndex = 0;
  }

  // Slide Editors
  function addSlide() {
    slides = [...slides, { 
      title: "NOVO SLIDE", 
      desc: "Conteúdo do slide...", 
      highlight: "DESTAQUE", 
      cta: "", 
      image: "",
      imageScale: 1,
      imageXOffset: 0,
      imageYOffset: 0,
      imageFit: "cover",
      images: []
    }];
    currentSlideIndex = slides.length - 1;
  }

  function deleteSlide(index: number) {
    if (slides.length === 1) return;
    slides = slides.filter((_, i) => i !== index);
    if (currentSlideIndex >= slides.length) {
      currentSlideIndex = slides.length - 1;
    }
  }

  // AI Content Generator
  async function generateWithAI() {
    if (!aiTopic.trim()) {
      aiError = "Insira um tema para a IA trabalhar.";
      return;
    }
    aiError = "";
    isGenerating = true;

    try {
      if (activeAI === "gemini") {
        if (!aiKeyGemini) throw new Error("API Key do Gemini está faltando.");
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${aiKeyGemini}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Gere um roteiro de carrossel de marketing para Instagram sobre o tema: '${aiTopic}'.
                  Use uma linguagem impactante voltada para traders profissionais.
                  Retorne EXCLUSIVAMENTE um array JSON com objetos contendo os campos:
                  "title" (título gigante do slide, máximo 4 ou 5 palavras em caixa alta),
                  "desc" (1 ou 2 frases curtas explicativas do conceito),
                  "highlight" (uma frase curta de destaque no rodapé do slide),
                  "cta" (preenchido APENAS no último slide com uma chamada como 'BAIXE O DIÁRIO GRÁTIS' ou 'COMECE A MEDIR HOJE').
                  Não inclua nenhuma formatação adicional de markdown, apenas o JSON puro.`
                }]
              }],
              generationConfig: { responseMimeType: "application/json" }
            })
          }
        );

        if (!response.ok) {
          let errMsg = `Erro ${response.status}: `;
          if (response.status === 401) {
            errMsg += "Chave de API do Gemini inválida ou não autorizada. Verifique se copiou a chave corretamente.";
          } else if (response.status === 429) {
            errMsg += "Limite de requisições excedido ou cota esgotada na Google AI Studio. Tente mudar o modelo para Gemini 1.5 Flash ou aguarde um momento.";
          } else if (response.status === 404) {
            errMsg += `O modelo '${aiModel}' não está disponível ou não foi encontrado nesta chave. Tente usar o Gemini 1.5 Flash nas configurações.`;
          } else {
            try {
              const errObj = await response.json();
              errMsg += errObj.error?.message || response.statusText;
            } catch (e) {
              errMsg += response.statusText;
            }
          }
          throw new Error(errMsg);
        }

        const result = await response.json();
        if (!result.candidates || result.candidates.length === 0) {
          throw new Error("O Gemini não retornou nenhum resultado. Tente refinar seu tema.");
        }
        const text = result.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          slides = parsed;
          currentSlideIndex = 0;
          activePreset = "custom";
        } else {
          throw new Error("Formato de resposta inválido retornado pela IA.");
        }
      } else {
        // OpenAI
        if (!aiKeyOpenAI) throw new Error("API Key da OpenAI está faltando.");
        
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${aiKeyOpenAI}`
          },
          body: JSON.stringify({
            model: aiModel,
            messages: [
              {
                role: "system",
                content: "Você é um copywriter sênior especialista em mercado financeiro e trading. Retorne apenas JSON limpo (sem tags markdown) no formato: [{\"title\":\"TITULO GIGANTE\",\"desc\":\"Descrição curta\",\"highlight\":\"Destaque\",\"cta\":\"CTA apenas no ultimo\"}]."
              },
              {
                role: "user",
                content: `Gere um roteiro de carrossel de marketing sobre o tema: ${aiTopic}`
              }
            ],
            response_format: { type: "json_object" }
          })
        });

        if (!response.ok) {
          let errMsg = `Erro ${response.status}: `;
          if (response.status === 401) {
            errMsg += "API Key da OpenAI inválida ou sem autorização.";
          } else if (response.status === 429) {
            errMsg += "Limite de requisições excedido ou falta de saldo na sua conta OpenAI.";
          } else {
            try {
              const errObj = await response.json();
              errMsg += errObj.error?.message || response.statusText;
            } catch (e) {
              errMsg += response.statusText;
            }
          }
          throw new Error(errMsg);
        }

        const result = await response.json();
        const content = JSON.parse(result.choices[0].message.content);
        const list = Array.isArray(content) ? content : (content.slides || Object.values(content)[0]);
        if (Array.isArray(list)) {
          slides = list;
          currentSlideIndex = 0;
          activePreset = "custom";
        } else {
          throw new Error("Formato de resposta inválido retornado pela OpenAI.");
        }
      }
    } catch (err: any) {
      console.error(err);
      aiError = err.message || "Erro inesperado ao gerar conteúdo.";
    } finally {
      isGenerating = false;
    }
  }

  // HTML2Canvas high-res export
  async function exportSinglePNG(index: number, fileName: string) {
    const card = document.getElementById(`slide-canvas-${index}`);
    if (!card) return;

    isExporting = true;
    // Wait briefly for outlines to hide
    await new Promise(r => setTimeout(r, 60));

    try {
      const canvas = await html2canvas(card, {
        backgroundColor: null,
        scale: 3, // 3x upscale for clean, high-res crisp typography
        useCORS: true,
        logging: false
      });

      // Tauri compatibility check and plugin dialog save
      if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
        const { save } = await import("@tauri-apps/plugin-dialog");
        const { writeFile } = await import("@tauri-apps/plugin-fs");
        
        const path = await save({
          title: "Salvar Imagem do Slide",
          defaultPath: `${fileName}.png`,
          filters: [{ name: "PNG Image", extensions: ["png"] }]
        });
        
        if (path) {
          const base64Data = canvas.toDataURL("image/png").split(",")[1];
          const binaryString = window.atob(base64Data);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          await writeFile(path, bytes);
        }
      } else {
        // Standard browser fallback
        const link = document.createElement("a");
        link.download = `${fileName}.png`;
        link.href = canvas.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      console.error("Falha ao exportar imagem:", err);
      alert("Erro ao exportar o slide como imagem: " + (err.message || err));
    } finally {
      isExporting = false;
    }
  }

  async function exportAllSlides() {
    const originalIndex = currentSlideIndex;
    for (let i = 0; i < slides.length; i++) {
      currentSlideIndex = i;
      // Wait for re-rendering to complete in the DOM
      await new Promise(r => setTimeout(r, 300));
      
      const name = `traderlogpro_post_${activePreset}_slide_${i + 1}`;
      await exportSinglePNG(i, name);
      
      // Brief delay to allow sequential browser downloads without spam blocking
      await new Promise(r => setTimeout(r, 300));
    }
    // Restore the original selected slide
    currentSlideIndex = originalIndex;
  }

  // Background Remover State Variables
  let showBgRemover = $state(false);
  let bgImageRaw = $state("");
  let bgImageProcessed = $state("");
  let targetColor = $state("#ffffff");
  let tolerance = $state(30);
  let smoothness = $state(15);
  let isProcessingBg = $state(false);
  let bgRemoverError = $state("");
  let bgRemoverFileSelector: HTMLInputElement;

  function handleOriginalImageClick(e: MouseEvent) {
    try {
      const imgElement = e.currentTarget as HTMLImageElement;
      const canvas = document.createElement("canvas");
      const w = imgElement.naturalWidth || imgElement.width || 1;
      const h = imgElement.naturalHeight || imgElement.height || 1;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(imgElement, 0, 0);

      const rect = imgElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const scaleX = w / rect.width;
      const scaleY = h / rect.height;
      const clickX = Math.floor((e.clientX - rect.left) * scaleX);
      const clickY = Math.floor((e.clientY - rect.top) * scaleY);

      if (isNaN(clickX) || isNaN(clickY) || clickX < 0 || clickX >= w || clickY < 0 || clickY >= h) {
        return;
      }

      const pixel = ctx.getImageData(clickX, clickY, 1, 1).data;
      const r = pixel[0];
      const g = pixel[1];
      const b = pixel[2];
      targetColor = "#" + [r, g, b].map(x => {
        const hexStr = x.toString(16);
        return hexStr.length === 1 ? "0" + hexStr : hexStr;
      }).join("");
      
      processBackgroundRemoval(false);
    } catch (err: any) {
      console.error("Erro ao obter cor no clique da imagem:", err);
      bgRemoverError = err.message || "Erro ao obter a cor do pixel.";
    }
  }

  function processBackgroundRemoval(detectColor = false) {
    if (!bgImageRaw) return;
    isProcessingBg = true;
    bgRemoverError = "";

    setTimeout(() => {
      try {
        const img = new window.Image();
        img.src = bgImageRaw;
        
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const w = img.naturalWidth || img.width || 1;
            const h = img.naturalHeight || img.height || 1;
            canvas.width = w;
            canvas.height = h;
            
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              throw new Error("Não foi possível criar o contexto 2D do Canvas.");
            }

            ctx.drawImage(img, 0, 0);

            if (detectColor) {
              const pixel = ctx.getImageData(0, 0, 1, 1).data;
              const r = pixel[0];
              const g = pixel[1];
              const b = pixel[2];
              targetColor = "#" + [r, g, b].map(x => {
                const hexStr = x.toString(16);
                return hexStr.length === 1 ? "0" + hexStr : hexStr;
              }).join("");
            }

            const imgData = ctx.getImageData(0, 0, w, h);
            const data = imgData.data;

            const hex = (targetColor || "#ffffff").replace("#", "");
            const targetR = parseInt(hex.substring(0, 2) || "ff", 16);
            const targetG = parseInt(hex.substring(2, 4) || "ff", 16);
            const targetB = parseInt(hex.substring(4, 6) || "ff", 16);

            const t = tolerance;
            const s = smoothness;
            const tSq = t * t;
            const tPlusSSq = (t + s) * (t + s);

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const a = data[i + 3];

              if (a === 0) continue;

              const distSq = (r - targetR) ** 2 + (g - targetG) ** 2 + (b - targetB) ** 2;

              if (distSq <= tSq) {
                data[i + 3] = 0;
              } else if (distSq < tPlusSSq && s > 0) {
                const dist = Math.sqrt(distSq);
                const fraction = (dist - t) / s;
                data[i + 3] = Math.floor(a * fraction);
              }
            }

            ctx.putImageData(imgData, 0, 0);
            bgImageProcessed = canvas.toDataURL("image/png");
          } catch (innerErr: any) {
            console.error("Erro ao processar remoção de fundo:", innerErr);
            bgRemoverError = innerErr.message || "Erro ao ler pixels da imagem.";
          } finally {
            isProcessingBg = false;
          }
        };

        img.onerror = () => {
          bgRemoverError = "Falha ao carregar a imagem.";
          isProcessingBg = false;
        };

      } catch (err: any) {
        console.error("Erro ao iniciar processamento de remoção:", err);
        bgRemoverError = err.message || "Não foi possível processar a imagem.";
        isProcessingBg = false;
      }
    }, 50);
  }

  function downloadProcessedPNG() {
    if (!bgImageProcessed) return;
    const link = document.createElement("a");
    link.download = "imagem_sem_fundo.png";
    link.href = bgImageProcessed;
    link.click();
  }

  function resetBgRemover() {
    bgImageRaw = "";
    bgImageProcessed = "";
    targetColor = "#ffffff";
    tolerance = 30;
    smoothness = 15;
    bgRemoverError = "";
    if (bgRemoverFileSelector) {
      bgRemoverFileSelector.value = "";
    }
  }

  function applyBgRemoverImage() {
    if (!slides[currentSlideIndex].image) {
      slides[currentSlideIndex].image = bgImageProcessed;
      slides[currentSlideIndex].imageScale = 1;
      slides[currentSlideIndex].imageXOffset = 0;
      slides[currentSlideIndex].imageYOffset = 0;
      slides[currentSlideIndex].imageFit = "cover";
    } else {
      if (!slides[currentSlideIndex].images) {
        slides[currentSlideIndex].images = [];
      }
      slides[currentSlideIndex].images = [
        ...slides[currentSlideIndex].images,
        { src: bgImageProcessed, scale: 1, x: 0, y: 0, fit: "cover" }
      ];
    }
    showBgRemover = false;
  }

  function getSlideImages(slide: any) {
    if (!slide) return [];
    const list = [];
    if (slide.image) {
      list.push({
        isLegacy: true,
        src: slide.image,
        scale: slide.imageScale || 1,
        x: slide.imageXOffset || 0,
        y: slide.imageYOffset || 0,
        fit: slide.imageFit || 'cover'
      });
    }
    if (slide.images && Array.isArray(slide.images)) {
      list.push(...slide.images);
    }
    return list;
  }

  // Direct Interactive Image Drag & Wheel Zoom Handlers
  let isDraggingImage = $state(false);
  let dragStartX = 0;
  let dragStartY = 0;
  let initialXOffset = 0;
  let initialYOffset = 0;

  function handleImageMouseDown(e: MouseEvent) {
    e.preventDefault();
    const slide = slides[currentSlideIndex];
    if (!slide.image && (!slide.images || slide.images.length === 0)) return;
    
    isDraggingImage = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    let targetImg = null;
    if (activeImageIndex === -1 && slide.image) {
      targetImg = { x: slide.imageXOffset || 0, y: slide.imageYOffset || 0 };
    } else if (activeImageIndex >= 0 && slide.images && slide.images[activeImageIndex]) {
      targetImg = { x: slide.images[activeImageIndex].x || 0, y: slide.images[activeImageIndex].y || 0 };
    } else {
      // Fallback
      if (slide.image) {
        targetImg = { x: slide.imageXOffset || 0, y: slide.imageYOffset || 0 };
        activeImageIndex = -1;
      } else if (slide.images && slide.images.length > 0) {
        targetImg = { x: slide.images[0].x || 0, y: slide.images[0].y || 0 };
        activeImageIndex = 0;
      }
    }
    
    if (!targetImg) {
      isDraggingImage = false;
      return;
    }
    
    initialXOffset = targetImg.x;
    initialYOffset = targetImg.y;
    
    window.addEventListener("mousemove", handleImageMouseMove);
    window.addEventListener("mouseup", handleImageMouseUp);
  }

  function handleImageMouseMove(e: MouseEvent) {
    if (!isDraggingImage) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    
    const slide = slides[currentSlideIndex];
    let targetX = initialXOffset + dx;
    let targetY = initialYOffset + dy;
    
    if (snapEnabled) {
      const threshold = 15;
      
      const isPromo = activeTemplate === "promo";
      const isDashboard = activeTemplate === "dashboard";
      const isPrint = activeTemplate === "print";
      
      let localWidth = activeFormat === 'story' ? 360 : 440;
      let localHeight = activeFormat === 'story' ? 640 : 440;
      
      if (isPromo) {
        localWidth = 240;
        localHeight = 100;
      } else if (isDashboard) {
        localWidth = 280;
        localHeight = 120;
      } else if (isPrint) {
        localWidth = 310;
        localHeight = 165;
      }
      
      const wA = localWidth * (activeImageIndex === -1 ? (slide.imageScale || 1) : (slide.images[activeImageIndex].scale || 1));
      const hA = localHeight * (activeImageIndex === -1 ? (slide.imageScale || 1) : (slide.images[activeImageIndex].scale || 1));

      let bestX = targetX;
      let minDiffX = threshold;
      let snappedX = false;
      let snapGuideXLine = 0;

      let xTargets = [];
      if (snapAnchorMode === "center" || snapAnchorMode === "both") {
        xTargets.push({ value: 0, guide: 0 });
      }
      if (snapAnchorMode === "corners" || snapAnchorMode === "both") {
        xTargets.push({ value: -localWidth/2, guide: -localWidth/2 });
        xTargets.push({ value: localWidth/2, guide: localWidth/2 });
      }

      const otherImages = [];
      if (activeImageIndex !== -1 && slide.image) {
        otherImages.push({
          x: slide.imageXOffset || 0,
          y: slide.imageYOffset || 0,
          w: localWidth * (slide.imageScale || 1),
          h: localHeight * (slide.imageScale || 1)
        });
      }
      if (slide.images && slide.images.length > 0) {
        slide.images.forEach((img, i) => {
          if (i !== activeImageIndex && img.src) {
            otherImages.push({
              x: img.x || 0,
              y: img.y || 0,
              w: localWidth * (img.scale || 1),
              h: localHeight * (img.scale || 1)
            });
          }
        });
      }

      otherImages.forEach(other => {
        const otherLeft = other.x - other.w/2;
        const otherRight = other.x + other.w/2;
        const otherCenter = other.x;

        if (snapAnchorMode === "center" || snapAnchorMode === "both") {
          xTargets.push({ value: otherCenter, guide: otherCenter });
        }
        if (snapAnchorMode === "corners" || snapAnchorMode === "both") {
          xTargets.push({ value: otherLeft, guide: otherLeft });
          xTargets.push({ value: otherRight, guide: otherRight });
        }
      });

      xTargets.forEach(target => {
        if (snapAnchorMode === "center" || snapAnchorMode === "both") {
          const diffCenter = Math.abs(targetX - target.value);
          if (diffCenter < minDiffX) {
            minDiffX = diffCenter;
            bestX = target.value;
            snappedX = true;
            snapGuideXLine = target.guide;
          }
        }
        if (snapAnchorMode === "corners" || snapAnchorMode === "both") {
          const diffLeft = Math.abs((targetX - wA/2) - target.value);
          if (diffLeft < minDiffX) {
            minDiffX = diffLeft;
            bestX = target.value + wA/2;
            snappedX = true;
            snapGuideXLine = target.guide;
          }
          const diffRight = Math.abs((targetX + wA/2) - target.value);
          if (diffRight < minDiffX) {
            minDiffX = diffRight;
            bestX = target.value - wA/2;
            snappedX = true;
            snapGuideXLine = target.guide;
          }
        }
      });

      targetX = bestX;
      snapXActive = snappedX;
      snapGuideX = snapGuideXLine;

      let bestY = targetY;
      let minDiffY = threshold;
      let snappedY = false;
      let snapGuideYLine = 0;

      let yTargets = [];
      if (snapAnchorMode === "center" || snapAnchorMode === "both") {
        yTargets.push({ value: 0, guide: 0 });
      }
      if (snapAnchorMode === "corners" || snapAnchorMode === "both") {
        yTargets.push({ value: -localHeight/2, guide: -localHeight/2 });
        yTargets.push({ value: localHeight/2, guide: localHeight/2 });
      }

      otherImages.forEach(other => {
        const otherTop = other.y - other.h/2;
        const otherBottom = other.y + other.h/2;
        const otherCenter = other.y;

        if (snapAnchorMode === "center" || snapAnchorMode === "both") {
          yTargets.push({ value: otherCenter, guide: otherCenter });
        }
        if (snapAnchorMode === "corners" || snapAnchorMode === "both") {
          yTargets.push({ value: otherTop, guide: otherTop });
          yTargets.push({ value: otherBottom, guide: otherBottom });
        }
      });

      yTargets.forEach(target => {
        if (snapAnchorMode === "center" || snapAnchorMode === "both") {
          const diffCenter = Math.abs(targetY - target.value);
          if (diffCenter < minDiffY) {
            minDiffY = diffCenter;
            bestY = target.value;
            snappedY = true;
            snapGuideYLine = target.guide;
          }
        }
        if (snapAnchorMode === "corners" || snapAnchorMode === "both") {
          const diffTop = Math.abs((targetY - hA/2) - target.value);
          if (diffTop < minDiffY) {
            minDiffY = diffTop;
            bestY = target.value + hA/2;
            snappedY = true;
            snapGuideYLine = target.guide;
          }
          const diffBottom = Math.abs((targetY + hA/2) - target.value);
          if (diffBottom < minDiffY) {
            minDiffY = diffBottom;
            bestY = target.value - hA/2;
            snappedY = true;
            snapGuideYLine = target.guide;
          }
        }
      });

      targetY = bestY;
      snapYActive = snappedY;
      snapGuideY = snapGuideYLine;
    } else {
      snapXActive = false;
      snapYActive = false;
    }
    
    if (activeImageIndex === -1 && slide.image) {
      slide.imageXOffset = targetX;
      slide.imageYOffset = targetY;
    } else if (activeImageIndex >= 0 && slide.images && slide.images[activeImageIndex]) {
      slide.images[activeImageIndex].x = targetX;
      slide.images[activeImageIndex].y = targetY;
    }
  }

  function handleImageMouseUp() {
    isDraggingImage = false;
    snapXActive = false;
    snapYActive = false;
    window.removeEventListener("mousemove", handleImageMouseMove);
    window.removeEventListener("mouseup", handleImageMouseUp);
  }

  function handleImageWheel(e: WheelEvent) {
    const slide = slides[currentSlideIndex];
    if (!slide.image && (!slide.images || slide.images.length === 0)) return;
    
    const zoomFactor = e.deltaY < 0 ? 0.05 : -0.05;
    
    if (activeImageIndex === -1 && slide.image) {
      const currentScale = slide.imageScale ?? 1;
      slide.imageScale = Math.min(2.5, Math.max(0.4, currentScale + zoomFactor));
    } else if (activeImageIndex >= 0 && slide.images && slide.images[activeImageIndex]) {
      const currentScale = slide.images[activeImageIndex].scale ?? 1;
      slide.images[activeImageIndex].scale = Math.min(2.5, Math.max(0.4, currentScale + zoomFactor));
    } else {
      // Fallback
      if (slide.image) {
        const currentScale = slide.imageScale ?? 1;
        slide.imageScale = Math.min(2.5, Math.max(0.4, currentScale + zoomFactor));
      } else if (slide.images && slide.images.length > 0) {
        const currentScale = slide.images[0].scale ?? 1;
        slide.images[0].scale = Math.min(2.5, Math.max(0.4, currentScale + zoomFactor));
      }
    }
  }

  // Direct Interactive Image Drag Resize Handlers
  let isResizingImage = $state(false);
  let resizeStartX = 0;
  let resizeStartY = 0;
  let initialScale = 1;
  let resizeContainerRect: DOMRect | null = null;
  let resizeImgX = 0;
  let resizeImgY = 0;

  function handleResizeMouseDown(e: MouseEvent, targetIndex: number) {
    e.stopPropagation();
    e.preventDefault();
    
    activeImageIndex = targetIndex;
    const slide = slides[currentSlideIndex];
    
    isResizingImage = true;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    
    // Get the container element of the image
    let containerId = `slide-canvas-${currentSlideIndex}`;
    // If it's a template with a specific container, get that instead
    if (["promo", "dashboard", "print"].includes(activeTemplate)) {
      containerId = `image-container-${currentSlideIndex}`;
    }
    
    const container = document.getElementById(containerId);
    if (container) {
      resizeContainerRect = container.getBoundingClientRect();
    }
    
    if (activeImageIndex === -1 && slide.image) {
      initialScale = slide.imageScale || 1;
      resizeImgX = slide.imageXOffset || 0;
      resizeImgY = slide.imageYOffset || 0;
    } else if (activeImageIndex >= 0 && slide.images && slide.images[activeImageIndex]) {
      initialScale = slide.images[activeImageIndex].scale || 1;
      resizeImgX = slide.images[activeImageIndex].x || 0;
      resizeImgY = slide.images[activeImageIndex].y || 0;
    }
    
    window.addEventListener("mousemove", handleResizeMouseMove);
    window.addEventListener("mouseup", handleResizeMouseUp);
  }

  function handleResizeMouseMove(e: MouseEvent) {
    if (!isResizingImage || !resizeContainerRect) return;
    
    const slide = slides[currentSlideIndex];
    
    const isPromo = activeTemplate === "promo";
    const isDashboard = activeTemplate === "dashboard";
    const isPrint = activeTemplate === "print";
    
    let localWidth = activeFormat === 'story' ? 360 : 440;
    let localHeight = activeFormat === 'story' ? 640 : 440;
    
    if (isPromo) {
      localWidth = 240;
      localHeight = 100;
    } else if (isDashboard) {
      localWidth = 280;
      localHeight = 120;
    } else if (isPrint) {
      localWidth = 310;
      localHeight = 165;
    }
    
    const r = resizeContainerRect.width / localWidth;
    
    const centerX = resizeContainerRect.left + resizeContainerRect.width / 2 + resizeImgX * r;
    const centerY = resizeContainerRect.top + resizeContainerRect.height / 2 + resizeImgY * r;
    
    // Original corner distance in screen space at scale 1.0
    const originalDistance = Math.hypot(resizeContainerRect.width / 2, resizeContainerRect.height / 2);
    
    // Current distance from center to pointer
    const currentDistance = Math.hypot(e.clientX - centerX, e.clientY - centerY);
    
    // Compute new scale
    let newScale = currentDistance / originalDistance;
    
    // Constrain scale between 0.2 and 3.0
    newScale = Math.min(3.0, Math.max(0.2, newScale));
    
    // Round to 2 decimal places to prevent float issues
    newScale = Math.round(newScale * 100) / 100;
    
    if (activeImageIndex === -1 && slide.image) {
      slide.imageScale = newScale;
    } else if (activeImageIndex >= 0 && slide.images && slide.images[activeImageIndex]) {
      slide.images[activeImageIndex].scale = newScale;
    }
  }

  function handleResizeMouseUp() {
    isResizingImage = false;
    window.removeEventListener("mousemove", handleResizeMouseMove);
    window.removeEventListener("mouseup", handleResizeMouseUp);
  }

  // Theme styling colors computed derived property
  const themeColors = $derived(() => {
    switch (activeTheme) {
      case "neon":
        return { bg: "#0b0f19", text: "#f3f4f6", accent: "#10b981", border: "rgba(16,185,129,0.15)" };
      case "gold":
        return { bg: "#141517", text: "#f3f4f6", accent: "#d4af37", border: "rgba(212,175,55,0.15)" };
      case "cyberpunk":
        return { bg: "#120224", text: "#00ffff", accent: "#ff007f", border: "rgba(255,0,127,0.15)" };
      case "light":
        return { bg: "#f8fafc", text: "#0f172a", accent: "#059669", border: "rgba(15,23,42,0.1)" };
      case "custom":
      default:
        return { bg: customBg, text: customText, accent: customAccent, border: customBorder };
    }
  });
</script>

<svelte:head>
  <title>TraderLog Pro - Marketing Studio</title>
</svelte:head>

<!-- Theme Container CSS variables wrapper -->
<div 
  class="min-h-screen text-slate-100 font-sans flex flex-col overflow-hidden select-none"
  style="
    background-color: #030712;
    --studio-bg: {themeColors().bg};
    --studio-text: {themeColors().text};
    --studio-accent: {themeColors().accent};
    --studio-border: {themeColors().border};
  "
>

  <!-- PASSWORD GATE OR CREATION -->
  {#if isSettingPassword}
    <div class="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-md">
      <div class="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-6 text-center">
        <div class="mx-auto w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/30 text-emerald-400">
          <Key class="w-8 h-8" />
        </div>
        <div>
          <h2 class="text-2xl font-black tracking-tight text-white">Configurar Acesso</h2>
          <p class="text-slate-400 text-sm mt-1">Crie uma senha para proteger o acesso ao seu estúdio de criação no site.</p>
        </div>
        <div class="space-y-2 text-left">
          <label for="newPasscode" class="text-xs font-bold text-slate-400 tracking-wider">NOVA SENHA</label>
          <input 
            type="password" 
            id="newPasscode"
            bind:value={newPasscode}
            placeholder="Mínimo 4 caracteres"
            class="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-white outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
          />
          {#if passcodeError}
            <p class="text-rose-500 text-xs flex items-center gap-1 mt-1"><AlertTriangle class="w-3.5 h-3.5" />{passcodeError}</p>
          {/if}
        </div>
        <button 
          onclick={handleSetPassword}
          class="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-98 transition-all text-slate-950 font-bold p-3.5 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
        >
          <Unlock class="w-4 h-4" /> Configurar e Entrar
        </button>
      </div>
    </div>
  {:else if !isUnlocked}
    <div class="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-md">
      <div class="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-6 text-center">
        <div class="mx-auto w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/30 text-indigo-400">
          <Lock class="w-8 h-8" />
        </div>
        <div>
          <h2 class="text-2xl font-black tracking-tight text-white">Acesso Restrito</h2>
          <p class="text-slate-400 text-sm mt-1">Insira a senha do estúdio para prosseguir.</p>
        </div>
        <div class="space-y-2 text-left">
          <label for="passcode" class="text-xs font-bold text-slate-400 tracking-wider">SENHA DE ACESSO</label>
          <input 
            type="password" 
            id="passcode"
            bind:value={passcode}
            placeholder="Senha configurada"
            onkeydown={(e) => e.key === 'Enter' && handleUnlock()}
            class="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-white outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
          {#if passcodeError}
            <p class="text-rose-500 text-xs flex items-center gap-1 mt-1"><AlertTriangle class="w-3.5 h-3.5" />{passcodeError}</p>
          {/if}
        </div>
        <button 
          onclick={handleUnlock}
          class="w-full bg-indigo-500 hover:bg-indigo-600 active:scale-98 transition-all text-white font-bold p-3.5 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
        >
          <Unlock class="w-4 h-4" /> Desbloquear Estúdio
        </button>
      </div>
    </div>
  {/if}

  <!-- MAIN APP GRID LAYOUT -->
  <header class="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md relative z-50">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-slate-950 font-black text-sm shadow-[0_0_15px_rgba(16,185,129,0.3)]">
        📊
      </div>
      <div>
        <h1 class="text-md font-black tracking-tight leading-none text-white uppercase">TraderLog Studio</h1>
        <span class="text-[9px] font-bold text-slate-500 tracking-widest uppercase">Gerador de Criativos</span>
      </div>
    </div>
    
    <div class="flex items-center gap-2">
      <button 
        onclick={() => { showBgRemover = true; resetBgRemover(); }}
        class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition-all active:scale-98"
      >
        <Eraser class="w-3.5 h-3.5 text-emerald-400" /> Remover Fundo PNG
      </button>
      <button 
        onclick={() => showSettings = true}
        class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition-all active:scale-98"
      >
        <Settings class="w-3.5 h-3.5" /> Configurações de IA
      </button>
    </div>
  </header>

  <div class="flex-1 flex overflow-hidden">
    <!-- LEFT SIDEBAR: CREATIVE CONTROLS -->
    <aside class="w-[450px] bg-slate-900/30 border-r border-slate-800 flex flex-col overflow-y-auto p-6 space-y-6">
      
      <!-- FORMAT AND PRESETS -->
      <section class="space-y-4">
        <h3 class="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-2">
          <Image class="w-3.5 h-3.5" /> 1. Formato e Roteiro
        </h3>
        
        <div class="grid grid-cols-2 gap-2">
          <button 
            onclick={() => activeFormat = "story"}
            class="py-2.5 rounded-xl text-xs font-bold transition-all border {activeFormat === 'story' ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}"
          >
            📱 Stories / Reels (9:16)
          </button>
          <button 
            onclick={() => activeFormat = "feed"}
            class="py-2.5 rounded-xl text-xs font-bold transition-all border {activeFormat === 'feed' ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}"
          >
            🖼️ Post Feed (1:1)
          </button>
        </div>

        <div class="space-y-2">
          <label for="preset-selector" class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">ROTEIROS PRE-DEFINIDOS</label>
          <select 
            id="preset-selector"
            bind:value={activePreset}
            onchange={(e) => loadPreset((e.target as HTMLSelectElement).value)}
            class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500"
          >
            <option value="custom">✏️ Personalizado (Vazio/AI)</option>
            <option value="sobre">🎨 Sobre o TraderLog Pro (8 Slides)</option>
            <option value="dados">📊 A Importância dos Dados (8 Slides)</option>
            <option value="erros">⚠️ Erros Fatais de Traders (8 Slides)</option>
          </select>
        </div>
      </section>

      <!-- TEMPLATE DESIGN SELECTOR -->
      <section class="space-y-4">
        <h3 class="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-2">
          <Palette class="w-3.5 h-3.5" /> 2. Modelos & Cores
        </h3>

        <div class="space-y-2">
          <label for="template-selector" class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">MODELO DE DESIGN</label>
          <select 
            id="template-selector"
            bind:value={activeTemplate}
            class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500"
          >
            <option value="minimalist">Minimalist Brackets</option>
            <option value="stat">Stat Metric Highlight</option>
            <option value="split">Split Certo vs Errado</option>
            <option value="quote">Big Impact Quote</option>
            <option value="alert">Alert/Warning Box</option>
            <option value="checklist">Modern Steps Checklist</option>
            <option value="promo">Download Promo Card</option>
            <option value="dashboard">Dashboard Mockup Glow</option>
            <option value="feedback">Client Feedback Stars</option>
            <option value="poll">Interactive Instagram Poll</option>
            <option value="print">Print Showcase (Destaque de Imagem)</option>
          </select>
        </div>

        <div class="space-y-2">
          <label for="theme-selector" class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">TEMA VISUAL</label>
          <div class="grid grid-cols-3 gap-1.5">
            {#each ["neon", "gold", "cyberpunk", "light", "custom"] as t}
              <button 
                onclick={() => activeTheme = t}
                class="py-1.5 px-2 rounded-lg text-[10px] font-bold border capitalize transition-all {activeTheme === t ? 'bg-slate-100 text-slate-950 border-slate-100 font-extrabold' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}"
              >
                {t}
              </button>
            {/each}
          </div>
        </div>

        {#if activeTheme === "custom"}
          <div class="bg-slate-950 p-3.5 border border-slate-800 rounded-xl space-y-3">
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="flex items-center justify-between bg-slate-900 p-2 rounded-lg">
                <span class="text-[10px] font-bold text-slate-400">Fundo:</span>
                <input type="color" bind:value={customBg} class="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer" />
              </div>
              <div class="flex items-center justify-between bg-slate-900 p-2 rounded-lg">
                <span class="text-[10px] font-bold text-slate-400">Textos:</span>
                <input type="color" bind:value={customText} class="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer" />
              </div>
              <div class="flex items-center justify-between bg-slate-900 p-2 rounded-lg">
                <span class="text-[10px] font-bold text-slate-400">Destaques:</span>
                <input type="color" bind:value={customAccent} class="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer" />
              </div>
              <div class="flex items-center justify-between bg-slate-900 p-2 rounded-lg">
                <span class="text-[10px] font-bold text-slate-400">Bordas:</span>
                <input type="color" bind:value={customBorder} class="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer" />
              </div>
            </div>
          </div>
        {/if}
      </section>

      <!-- SLIDE CONTENT EDITING -->
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-2">
            <Image class="w-3.5 h-3.5" /> 3. Textos do Slide
          </h3>
          <span class="text-[10px] font-bold bg-slate-800 text-slate-300 py-0.5 px-2 rounded-full">
            Slide {currentSlideIndex + 1} de {slides.length}
          </span>
        </div>

        <div class="space-y-3 bg-slate-950 p-4 border border-slate-800 rounded-xl">
          <div class="form-group space-y-1">
            <label for="slide-title" class="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">TÍTULO PRINCIPAL</label>
            <input 
              type="text" 
              id="slide-title"
              bind:value={slides[currentSlideIndex].title}
              placeholder="Ex: O LOSS É INEVITÁVEL."
              class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div class="form-group space-y-1">
            <label for="slide-desc" class="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">DESCRIÇÃO / CONTEÚDO</label>
            <textarea 
              id="slide-desc"
              rows="3"
              bind:value={slides[currentSlideIndex].desc}
              placeholder="Digite o texto detalhado..."
              class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500"
            ></textarea>
          </div>

          <div class="form-group space-y-1">
            <label for="slide-highlight" class="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">TEXTO DE RELEVO / DESTAQUE</label>
            <input 
              type="text" 
              id="slide-highlight"
              bind:value={slides[currentSlideIndex].highlight}
              placeholder="Destaque inferior..."
              class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div class="form-group space-y-1">
            <label for="slide-cta" class="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">CTA (CHAMADA P/ AÇÃO)</label>
            <input 
              type="text" 
              id="slide-cta"
              bind:value={slides[currentSlideIndex].cta}
              placeholder="Ex: CLIQUE NO LINK DA BIO"
              class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div class="space-y-3 border-t border-slate-850 pt-4 mt-3">
            <div class="flex items-center justify-between">
              <label class="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
                🖼️ Imagens do Slide ({getSlideImages(slides[currentSlideIndex]).length})
              </label>
              <button 
                onclick={() => {
                  if (!slides[currentSlideIndex].images) {
                    slides[currentSlideIndex].images = [];
                  }
                  slides[currentSlideIndex].images = [
                    ...slides[currentSlideIndex].images, 
                    { src: "", scale: 1, x: 0, y: 0, fit: "cover" }
                  ];
                  activeImageIndex = slides[currentSlideIndex].images.length - 1;
                }}
                class="text-[9px] font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 py-1 px-2.5 rounded-lg border border-slate-700 transition-all flex items-center gap-1"
              >
                + Adicionar Sobreposição
              </button>
            </div>

            <!-- SNAP ENABLED TOGGLE & ANCHOR SELECTION -->
            <div class="space-y-2 border-b border-slate-900 pb-2.5 mb-1.5">
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 cursor-pointer select-none hover:text-slate-350 transition-colors">
                  <input 
                    type="checkbox" 
                    bind:checked={snapEnabled} 
                    class="w-3.5 h-3.5 rounded border-slate-805 text-emerald-500 focus:ring-0 accent-emerald-500 bg-slate-950" 
                  />
                  🧲 Ajuste Magnético (Snap)
                </label>
                {#if snapEnabled}
                  <span class="text-[8px] font-black uppercase text-emerald-500/80 bg-emerald-500/5 px-1.5 py-0.5 rounded tracking-wide border border-emerald-500/10">Ativo</span>
                {:else}
                  <span class="text-[8px] font-black uppercase text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded tracking-wide border border-slate-850">Inativo</span>
                {/if}
              </div>

              {#if snapEnabled}
                <div class="space-y-1">
                  <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Ancorar em</span>
                  <div class="grid grid-cols-3 gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-850">
                    <button 
                      onclick={() => snapAnchorMode = "center"}
                      class="py-0.5 rounded-md text-[9px] font-black transition-all {snapAnchorMode === 'center' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}"
                    >
                      Centro
                    </button>
                    <button 
                      onclick={() => snapAnchorMode = "corners"}
                      class="py-0.5 rounded-md text-[9px] font-black transition-all {snapAnchorMode === 'corners' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}"
                    >
                      Cantos
                    </button>
                    <button 
                      onclick={() => snapAnchorMode = "both"}
                      class="py-0.5 rounded-md text-[9px] font-black transition-all {snapAnchorMode === 'both' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}"
                    >
                      Ambos
                    </button>
                  </div>
                </div>
              {/if}
            </div>

            <div class="space-y-3">
              {#if slides[currentSlideIndex].image}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div 
                  class="p-3 rounded-xl border transition-all space-y-3 cursor-pointer {activeImageIndex === -1 ? 'border-emerald-500 bg-slate-900/50 shadow-lg shadow-emerald-500/5' : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'}"
                  onclick={() => activeImageIndex = -1}
                >
                  <div class="flex items-center justify-between">
                    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Imagem 1 (Base)
                    </span>
                    <button 
                      onclick={() => {
                        slides[currentSlideIndex].image = "";
                        slides[currentSlideIndex].imageScale = 1;
                        slides[currentSlideIndex].imageXOffset = 0;
                        slides[currentSlideIndex].imageYOffset = 0;
                        slides[currentSlideIndex].imageFit = "cover";
                      }}
                      class="text-[9px] font-bold text-rose-450 hover:text-rose-400"
                    >
                      Excluir
                    </button>
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="relative w-12 h-12 rounded-lg border border-slate-805 overflow-hidden bg-slate-950 flex-shrink-0">
                      <img src={slides[currentSlideIndex].image} alt="Preview Base" class="w-full h-full object-cover" />
                    </div>
                    <div class="flex-1">
                      <input 
                        type="file" 
                        accept="image/*"
                        onchange={(e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              slides[currentSlideIndex].image = ev.target?.result as string;
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        class="text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[9px] file:font-black file:bg-slate-800 file:text-slate-200"
                      />
                    </div>
                  </div>

                  <div class="space-y-2.5 border-t border-slate-850/40 pt-2.5 mt-2">
                    <div class="space-y-1">
                      <div class="flex items-center justify-between text-[10px]">
                        <span class="text-slate-400 font-bold uppercase">Zoom</span>
                        <span class="font-mono text-emerald-400 font-black">
                          {Math.round((slides[currentSlideIndex].imageScale || 1) * 100)}%
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="0.4" 
                        max="2.5" 
                        step="0.05"
                        value={slides[currentSlideIndex].imageScale ?? 1}
                        oninput={(e) => slides[currentSlideIndex].imageScale = parseFloat((e.target as HTMLInputElement).value)}
                        class="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                      <div class="space-y-1">
                        <div class="flex items-center justify-between text-[9px]">
                          <span class="text-slate-400 font-bold uppercase">Pos Y</span>
                          <span class="font-mono text-emerald-400 font-black">
                            {slides[currentSlideIndex].imageYOffset || 0}px
                          </span>
                        </div>
                        <input 
                          type="range" 
                          min="-200" 
                          max="200" 
                          step="2"
                          value={slides[currentSlideIndex].imageYOffset ?? 0}
                          oninput={(e) => slides[currentSlideIndex].imageYOffset = parseInt((e.target as HTMLInputElement).value)}
                          class="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>

                      <div class="space-y-1">
                        <div class="flex items-center justify-between text-[9px]">
                          <span class="text-slate-400 font-bold uppercase">Pos X</span>
                          <span class="font-mono text-emerald-400 font-black">
                            {slides[currentSlideIndex].imageXOffset || 0}px
                          </span>
                        </div>
                        <input 
                          type="range" 
                          min="-200" 
                          max="200" 
                          step="2"
                          value={slides[currentSlideIndex].imageXOffset ?? 0}
                          oninput={(e) => slides[currentSlideIndex].imageXOffset = parseInt((e.target as HTMLInputElement).value)}
                          class="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    </div>

                    <!-- Base Image Rotation and Borders -->
                    <div class="grid grid-cols-2 gap-2">
                      <div class="space-y-1">
                        <div class="flex items-center justify-between text-[9px]">
                          <span class="text-slate-400 font-bold uppercase">Giro / Rotação</span>
                          <span class="font-mono text-emerald-400 font-black">
                            {slides[currentSlideIndex].imageRotation || 0}°
                          </span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="360" 
                          step="5"
                          value={slides[currentSlideIndex].imageRotation ?? 0}
                          oninput={(e) => slides[currentSlideIndex].imageRotation = parseInt((e.target as HTMLInputElement).value)}
                          class="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>

                      <div class="space-y-1">
                        <div class="flex items-center justify-between text-[9px]">
                          <span class="text-slate-400 font-bold uppercase">Arredondamento</span>
                          <span class="font-mono text-emerald-400 font-black">
                            {slides[currentSlideIndex].imageBorderRadius || 0}px
                          </span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="50" 
                          step="2"
                          value={slides[currentSlideIndex].imageBorderRadius ?? 0}
                          oninput={(e) => slides[currentSlideIndex].imageBorderRadius = parseInt((e.target as HTMLInputElement).value)}
                          class="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                      <div class="space-y-1">
                        <div class="flex items-center justify-between text-[9px]">
                          <span class="text-slate-400 font-bold uppercase">Borda</span>
                          <span class="font-mono text-emerald-400 font-black">
                            {slides[currentSlideIndex].imageBorderWidth || 0}px
                          </span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="15" 
                          step="1"
                          value={slides[currentSlideIndex].imageBorderWidth ?? 0}
                          oninput={(e) => slides[currentSlideIndex].imageBorderWidth = parseInt((e.target as HTMLInputElement).value)}
                          class="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>

                      <div class="space-y-1">
                        <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Cor da Borda</label>
                        <div class="flex items-center gap-2 bg-slate-950 p-1.5 rounded border border-slate-850">
                          <input 
                            type="color" 
                            value={slides[currentSlideIndex].imageBorderColor || "#ffffff"}
                            oninput={(e) => slides[currentSlideIndex].imageBorderColor = (e.target as HTMLInputElement).value}
                            class="w-5 h-5 rounded border border-slate-700 bg-transparent cursor-pointer" 
                          />
                          <span class="font-mono text-[9px] text-slate-300 uppercase select-all">{slides[currentSlideIndex].imageBorderColor || "#ffffff"}</span>
                        </div>
                      </div>
                    </div>

                    <div class="space-y-1">
                      <label class="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Preenchimento</label>
                      <div class="grid grid-cols-2 gap-1.5">
                        <button 
                          onclick={() => slides[currentSlideIndex].imageFit = 'cover'}
                          class="py-0.5 rounded-md text-[9px] font-black transition-all border {(slides[currentSlideIndex].imageFit || 'cover') === 'cover' ? 'bg-emerald-500 text-slate-950 border-emerald-450' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'}"
                        >
                          Cortar (Cover)
                        </button>
                        <button 
                          onclick={() => slides[currentSlideIndex].imageFit = 'contain'}
                          class="py-0.5 rounded-md text-[9px] font-black transition-all border {slides[currentSlideIndex].imageFit === 'contain' ? 'bg-emerald-500 text-slate-950 border-emerald-450' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'}"
                        >
                          Caber (Contain)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              {/if}

              {#if slides[currentSlideIndex].images && slides[currentSlideIndex].images.length > 0}
                {#each slides[currentSlideIndex].images as img, imgIdx}
                  <!-- svelte-ignore a11y_click_events_have_key_events -->
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <div 
                    class="p-3 rounded-xl border transition-all space-y-3 cursor-pointer {activeImageIndex === imgIdx ? 'border-emerald-500 bg-slate-900/50 shadow-lg shadow-emerald-500/5' : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'}"
                    onclick={() => activeImageIndex = imgIdx}
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        Imagem {slides[currentSlideIndex].image ? imgIdx + 2 : imgIdx + 1} (Sobreposição)
                      </span>
                      <button 
                        onclick={() => {
                          slides[currentSlideIndex].images = slides[currentSlideIndex].images.filter((_, idx) => idx !== imgIdx);
                        }}
                        class="text-[9px] font-bold text-rose-450 hover:text-rose-400"
                      >
                        Excluir
                      </button>
                    </div>

                    <div class="flex items-center gap-3">
                      {#if img.src}
                        <div class="relative w-12 h-12 rounded-lg border border-slate-805 overflow-hidden bg-slate-950 flex-shrink-0">
                          <img src={img.src} alt="Preview Overlay" class="w-full h-full object-cover" />
                        </div>
                      {/if}
                      <div class="flex-1">
                        <input 
                          type="file" 
                          accept="image/*"
                          onchange={(e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                img.src = ev.target?.result as string;
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          class="text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[9px] file:font-black file:bg-slate-800 file:text-slate-200"
                        />
                      </div>
                    </div>

                    {#if img.src}
                      <div class="space-y-2.5 border-t border-slate-850/40 pt-2.5 mt-2">
                        <div class="space-y-1">
                          <div class="flex items-center justify-between text-[10px]">
                            <span class="text-slate-400 font-bold uppercase">Zoom</span>
                            <span class="font-mono text-emerald-400 font-black">
                              {Math.round((img.scale || 1) * 100)}%
                            </span>
                          </div>
                          <input 
                            type="range" 
                            min="0.4" 
                            max="2.5" 
                            step="0.05"
                            value={img.scale ?? 1}
                            oninput={(e) => img.scale = parseFloat((e.target as HTMLInputElement).value)}
                            class="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>

                        <div class="grid grid-cols-2 gap-2">
                          <div class="space-y-1">
                            <div class="flex items-center justify-between text-[9px]">
                              <span class="text-slate-400 font-bold uppercase">Pos Y</span>
                              <span class="font-mono text-emerald-400 font-black">
                                {img.y || 0}px
                              </span>
                            </div>
                            <input 
                              type="range" 
                              min="-200" 
                              max="200" 
                              step="2"
                              value={img.y ?? 0}
                              oninput={(e) => img.y = parseInt((e.target as HTMLInputElement).value)}
                              class="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                          </div>

                          <div class="space-y-1">
                            <div class="flex items-center justify-between text-[9px]">
                              <span class="text-slate-400 font-bold uppercase">Pos X</span>
                              <span class="font-mono text-emerald-400 font-black">
                                {img.x || 0}px
                              </span>
                            </div>
                            <input 
                              type="range" 
                              min="-200" 
                              max="200" 
                              step="2"
                              value={img.x ?? 0}
                              oninput={(e) => img.x = parseInt((e.target as HTMLInputElement).value)}
                              class="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                          </div>
                        </div>

                        <!-- Overlay Image Rotation and Borders -->
                        <div class="grid grid-cols-2 gap-2">
                          <div class="space-y-1">
                            <div class="flex items-center justify-between text-[9px]">
                              <span class="text-slate-400 font-bold uppercase">Giro / Rotação</span>
                              <span class="font-mono text-emerald-400 font-black">
                                {img.rotation || 0}°
                              </span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="360" 
                              step="5"
                              value={img.rotation ?? 0}
                              oninput={(e) => img.rotation = parseInt((e.target as HTMLInputElement).value)}
                              class="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                          </div>

                          <div class="space-y-1">
                            <div class="flex items-center justify-between text-[9px]">
                              <span class="text-slate-400 font-bold uppercase">Arredondamento</span>
                              <span class="font-mono text-emerald-400 font-black">
                                {img.borderRadius || 0}px
                              </span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="50" 
                              step="2"
                              value={img.borderRadius ?? 0}
                              oninput={(e) => img.borderRadius = parseInt((e.target as HTMLInputElement).value)}
                              class="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                          </div>
                        </div>

                        <div class="grid grid-cols-2 gap-2">
                          <div class="space-y-1">
                            <div class="flex items-center justify-between text-[9px]">
                              <span class="text-slate-400 font-bold uppercase">Borda</span>
                              <span class="font-mono text-emerald-400 font-black">
                                {img.borderWidth || 0}px
                              </span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="15" 
                              step="1"
                              value={img.borderWidth ?? 0}
                              oninput={(e) => img.borderWidth = parseInt((e.target as HTMLInputElement).value)}
                              class="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                          </div>

                          <div class="space-y-1">
                            <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Cor da Borda</label>
                            <div class="flex items-center gap-2 bg-slate-950 p-1.5 rounded border border-slate-850">
                              <input 
                                type="color" 
                                value={img.borderColor || "#ffffff"}
                                oninput={(e) => img.borderColor = (e.target as HTMLInputElement).value}
                                class="w-5 h-5 rounded border border-slate-700 bg-transparent cursor-pointer" 
                              />
                              <span class="font-mono text-[9px] text-slate-300 uppercase select-all">{img.borderColor || "#ffffff"}</span>
                            </div>
                          </div>
                        </div>

                        <div class="space-y-1">
                          <label class="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Preenchimento</label>
                          <div class="grid grid-cols-2 gap-1.5">
                            <button 
                              onclick={() => img.fit = 'cover'}
                              class="py-0.5 rounded-md text-[9px] font-black transition-all border {(img.fit || 'cover') === 'cover' ? 'bg-emerald-500 text-slate-950 border-emerald-450' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'}"
                            >
                              Cortar (Cover)
                            </button>
                            <button 
                              onclick={() => img.fit = 'contain'}
                              class="py-0.5 rounded-md text-[9px] font-black transition-all border {img.fit === 'contain' ? 'bg-emerald-500 text-slate-950 border-emerald-450' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'}"
                            >
                              Caber (Contain)
                            </button>
                          </div>
                        </div>
                      </div>
                    {/if}
                  </div>
                {/each}
              {/if}

              {#if !slides[currentSlideIndex].image && (!slides[currentSlideIndex].images || slides[currentSlideIndex].images.length === 0)}
                <div class="flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl p-6 bg-slate-950/20 text-center">
                  <Image class="w-6 h-6 text-slate-600 mb-2" />
                  <span class="text-xs text-slate-400">Nenhuma imagem carregada neste slide.</span>
                  <button 
                    onclick={() => {
                      if (!slides[currentSlideIndex].images) {
                        slides[currentSlideIndex].images = [];
                      }
                      slides[currentSlideIndex].images = [...slides[currentSlideIndex].images, { src: "", scale: 1, x: 0, y: 0, fit: "cover" }];
                    }}
                    class="mt-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-bold py-1.5 px-3 rounded-lg active:scale-98 transition-all"
                  >
                    Adicionar Imagem
                  </button>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- SLIDE ACTIONS -->
        <div class="flex gap-2">
          <button 
            onclick={addSlide}
            class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all"
          >
            <Plus class="w-3.5 h-3.5" /> Adicionar Slide
          </button>
          {#if slides.length > 1}
            <button 
              onclick={() => deleteSlide(currentSlideIndex)}
              class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all"
            >
              Excluir
            </button>
          {/if}
        </div>
      </section>

      <!-- AI GENERATION CO-PILOT -->
      <section class="space-y-4 border-t border-slate-800 pt-6">
        <h3 class="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-2">
          <Sparkles class="w-3.5 h-3.5 text-amber-400" /> 4. Gerador Inteligente (IA)
        </h3>

        <div class="space-y-3 bg-slate-950 p-4 border border-slate-800 rounded-xl">
          <div class="form-group space-y-1">
            <label for="ai-topic" class="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">TEMA DO CONTEÚDO</label>
            <textarea 
              id="ai-topic"
              rows="2"
              bind:value={aiTopic}
              placeholder="Ex: Como a estatística de setups ajuda o trader a parar de perder dinheiro..."
              class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500"
            ></textarea>
          </div>

          {#if aiError}
            <p class="text-rose-500 text-[10px] flex items-center gap-1 leading-snug"><AlertTriangle class="w-3.5 h-3.5 shrink-0" />{aiError}</p>
          {/if}

          <button 
            onclick={generateWithAI}
            disabled={isGenerating}
            class="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition-all text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-98 shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
          >
            {#if isGenerating}
              <RefreshCw class="w-3.5 h-3.5 animate-spin" /> Gerando Carrossel...
            {:else}
              <Sparkles class="w-3.5 h-3.5" /> Gerar Conteúdo
            {/if}
          </button>
        </div>
      </section>
    </aside>

    <!-- RIGHT CANVAS PREVIEW WORKSPACE -->
    <main class="flex-1 bg-slate-950 flex flex-col items-center justify-center p-8 overflow-y-auto relative">
      
      <!-- UPPER PANEL: CAROUSEL TRACKER -->
      <div class="mb-6 flex items-center gap-4 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800 shadow-xl max-w-lg w-full justify-between">
        <button 
          onclick={() => currentSlideIndex = Math.max(0, currentSlideIndex - 1)}
          disabled={currentSlideIndex === 0}
          class="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg disabled:opacity-30 border border-slate-800 transition-all"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>

        <!-- Carousel dot indexes -->
        <div class="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[250px]">
          {#each slides as _, idx}
            <button 
              onclick={() => currentSlideIndex = idx}
              class="w-4.5 h-4.5 rounded-md text-[9px] font-black flex items-center justify-center transition-all border {idx === currentSlideIndex ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black scale-108' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-200'}"
            >
              {idx + 1}
            </button>
          {/each}
        </div>

        <button 
          onclick={() => currentSlideIndex = Math.min(slides.length - 1, currentSlideIndex + 1)}
          disabled={currentSlideIndex === slides.length - 1}
          class="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg disabled:opacity-30 border border-slate-800 transition-all"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>

      <!-- EXPORT ACTIONS BAR -->
      <div class="mb-4 flex gap-2 w-full max-w-[360px] justify-center">
        <button 
          onclick={() => exportSinglePNG(currentSlideIndex, `traderlogpro_post_${activePreset}_slide_${currentSlideIndex + 1}`)}
          class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-lg shadow-indigo-600/10"
        >
          <Download class="w-3.5 h-3.5" /> Baixar Atual (PNG)
        </button>

        {#if slides.length > 1}
          <button 
            onclick={exportAllSlides}
            class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-lg shadow-emerald-500/10"
          >
            📦 Baixar Carrossel
          </button>
        {/if}
      </div>

      <!-- CANVAS RENDER CONTAINER (CAPTURED BY HTML2CANVAS) -->
      <div class="relative flex items-center justify-center scale-95 origin-center">
        <!-- Render current slide or container for rendering -->
        <div 
          id={`slide-canvas-${currentSlideIndex}`}
          class="relative flex flex-col font-sans transition-colors overflow-hidden justify-between border"
          style="
            background-color: var(--studio-bg);
            color: var(--studio-text);
            border-color: var(--studio-border);
            width: {activeFormat === 'story' ? '360px' : '440px'};
            height: {activeFormat === 'story' ? '640px' : '440px'};
            padding: {activeFormat === 'story' ? '3rem 2rem 2rem 2rem' : '2.5rem 2.2rem'};
          "
          onmousedown={!["promo", "dashboard", "print"].includes(activeTemplate) ? handleImageMouseDown : null}
          onwheel={!["promo", "dashboard", "print"].includes(activeTemplate) ? handleImageWheel : null}
        >
          <!-- BACKGROUND/OVERLAY IMAGES FOR GENERAL TEMPLATES -->
          {#if !["promo", "dashboard", "print"].includes(activeTemplate) && (slides[currentSlideIndex].image || (slides[currentSlideIndex].images && slides[currentSlideIndex].images.length > 0))}
            <div class="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none" style="z-index: 1;">
              {#if slides[currentSlideIndex].image}
                <img 
                  src={slides[currentSlideIndex].image} 
                  alt="Base BG" 
                  class="absolute inset-0 w-full h-full pointer-events-auto cursor-move"
                  style="
                    object-fit: {slides[currentSlideIndex].imageFit || 'cover'};
                    transform: scale({slides[currentSlideIndex].imageScale || 1}) translate({slides[currentSlideIndex].imageXOffset || 0}px, {slides[currentSlideIndex].imageYOffset || 0}px) rotate({slides[currentSlideIndex].imageRotation || 0}deg);
                    transform-origin: center;
                    z-index: 1;
                    outline: {!isExporting && activeImageIndex === -1 ? '2px dashed var(--studio-accent)' : 'none'};
                    outline-offset: -2px;
                    border: {slides[currentSlideIndex].imageBorderWidth || 0}px solid {slides[currentSlideIndex].imageBorderColor || '#ffffff'};
                    border-radius: {slides[currentSlideIndex].imageBorderRadius || 0}px;
                  "
                  onmousedown={(e) => handleImageMouseDown(e, -1)}
                />
              {/if}
              {#if slides[currentSlideIndex].images && slides[currentSlideIndex].images.length > 0}
                {#each slides[currentSlideIndex].images as img, imgIdx}
                  {#if img.src}
                    <img 
                      src={img.src} 
                      alt="Overlay BG {imgIdx + 1}" 
                      class="absolute inset-0 w-full h-full pointer-events-auto cursor-move"
                      style="
                        object-fit: {img.fit || 'cover'};
                        transform: scale({img.scale || 1}) translate({img.x || 0}px, {img.y || 0}px) rotate({img.rotation || 0}deg);
                        transform-origin: center;
                        z-index: {slides[currentSlideIndex].image ? imgIdx + 2 : imgIdx + 1};
                        outline: {!isExporting && activeImageIndex === imgIdx ? '2px dashed var(--studio-accent)' : 'none'};
                        outline-offset: -2px;
                        border: {img.borderWidth || 0}px solid {img.borderColor || '#ffffff'};
                        border-radius: {img.borderRadius || 0}px;
                      "
                      onmousedown={(e) => handleImageMouseDown(e, imgIdx)}
                    />
                  {/if}
                {/each}
              {/if}
            </div>
          {/if}

          <!-- SNAPPING ALIGNMENT GUIDES -->
          {#if snapXActive && snapEnabled}
            <div class="absolute top-0 bottom-0 w-[1.5px] border-l-2 border-dashed pointer-events-none z-40" style="left: calc(50% + {snapGuideX}px); border-color: var(--studio-accent); opacity: 0.85;"></div>
          {/if}
          {#if snapYActive && snapEnabled}
            <div class="absolute left-0 right-0 h-[1.5px] border-t-2 border-dashed pointer-events-none z-40" style="top: calc(50% + {snapGuideY}px); border-color: var(--studio-accent); opacity: 0.85;"></div>
          {/if}

          <!-- TOP HEADER -->
          <div class="flex flex-col gap-1.5 z-10 relative">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-[9px] font-black text-slate-950 uppercase px-2 py-0.5 rounded" style="background-color: var(--studio-accent)">
                  [{currentSlideIndex + 1 < 10 ? '0' + (currentSlideIndex + 1) : currentSlideIndex + 1}]
                </span>
                <span class="text-[9px] font-extrabold tracking-widest uppercase opacity-85" style="color: var(--studio-accent)">
                  {activePreset === 'custom' ? 'STUDIO' : activePreset}
                </span>
              </div>
              <span class="text-[9px] font-bold opacity-50 tracking-wider">
                TRADERLOG PRO
              </span>
            </div>
            <div class="w-full h-[1.5px]" style="background-color: var(--studio-accent)"></div>
          </div>

          <!-- TEMPLATE-SPECIFIC CENTRAL RENDERS -->
          <div class="flex-1 flex flex-col justify-center items-center text-center gap-4 z-10 relative">
            
            <!-- 1. MINIMALIST BRACKETS -->
            {#if activeTemplate === "minimalist"}
              <div class="space-y-4 w-full">
                <!-- Large Logo brackets visual mockup -->
                <div class="flex items-center justify-center gap-1 opacity-20 text-[20px] font-black">
                  [ 📊 ]
                </div>
                <h2 class="text-xl font-black tracking-tight leading-tight uppercase w-full break-words">
                  {slides[currentSlideIndex].title || "DIGITE UM TÍTULO"}
                </h2>
                <p class="text-xs leading-relaxed opacity-80 font-medium w-full break-words whitespace-pre-line">
                  {slides[currentSlideIndex].desc || "Digite um conteúdo para este slide..."}
                </p>
              </div>

            <!-- 2. STAT METRIC -->
            {:else if activeTemplate === "stat"}
              <div class="space-y-3 w-full">
                <h2 class="text-md font-bold tracking-wider uppercase opacity-60">PROFIT FACTOR: 2.84</h2>
                <div class="py-2.5 px-4 rounded-xl border flex flex-col justify-center items-center w-full max-w-[280px] mx-auto bg-slate-950/20" style="border-color: var(--studio-accent)">
                  <span class="text-3xl font-black tracking-tighter" style="color: var(--studio-accent)">
                    {slides[currentSlideIndex].title || "+ R$ 4.250"}
                  </span>
                  <span class="text-[8px] font-bold opacity-60 tracking-widest uppercase">Performance Semanal</span>
                </div>
                <p class="text-[11px] leading-relaxed opacity-80 w-full break-words">
                  {slides[currentSlideIndex].desc || "Explicação do resultado..."}
                </p>
              </div>

            <!-- 3. SPLIT CERTO VS ERRADO -->
            {:else if activeTemplate === "split"}
              <div class="w-full space-y-3">
                <h3 class="text-[11px] font-black uppercase tracking-wider text-rose-500">❌ AMADOR: Sem Diário</h3>
                <div class="w-full border-b border-dashed border-slate-800"></div>
                <h3 class="text-[11px] font-black uppercase tracking-wider text-emerald-500">✅ PROFISSIONAL: {slides[currentSlideIndex].title || "Mede Padrões"}</h3>
                <div class="bg-slate-950/35 p-3 rounded-lg border border-slate-800 text-[10px] leading-relaxed text-left">
                  {slides[currentSlideIndex].desc || "Explicação da diferença..."}
                </div>
              </div>

            <!-- 4. BIG IMPACT QUOTE -->
            {:else if activeTemplate === "quote"}
              <div class="space-y-4 w-full">
                <span class="text-4xl leading-none font-serif opacity-30 select-none block" style="color: var(--studio-accent)">“</span>
                <h2 class="text-lg font-black tracking-tight leading-snug uppercase italic w-full break-words">
                  {slides[currentSlideIndex].title || "O MERCADO É UM PROFESSOR QUE COBRA CARO."}
                </h2>
                <p class="text-[10px] tracking-wider uppercase font-bold opacity-60">
                  — {slides[currentSlideIndex].highlight || "TRADERLOG PRO"}
                </p>
              </div>

            <!-- 5. ALERT / WARNING BOX -->
            {:else if activeTemplate === "alert"}
              <div class="space-y-4 w-full">
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-rose-500/20 bg-rose-500/5 text-rose-400 text-[9px] font-black uppercase tracking-widest">
                  <AlertTriangle class="w-3 h-3" /> Alerta Crítico
                </div>
                <h2 class="text-lg font-black tracking-tight leading-tight text-rose-500 uppercase">
                  {slides[currentSlideIndex].title || "VINGANÇA CONTRA O LOSS"}
                </h2>
                <p class="text-xs leading-relaxed opacity-80 bg-slate-950/30 p-3 rounded-lg border border-slate-800 whitespace-pre-line text-left">
                  {slides[currentSlideIndex].desc || "Erro de execução clássico..."}
                </p>
              </div>

            <!-- 6. CHECKLIST -->
            {:else if activeTemplate === "checklist"}
              <div class="space-y-3 w-full text-left max-w-[290px] mx-auto">
                <h2 class="text-md font-black tracking-tight uppercase border-b pb-1.5" style="border-color: var(--studio-border)">
                  {slides[currentSlideIndex].title || "COMO EVOLUIR HOJE"}
                </h2>
                <ul class="space-y-2 text-[10px]">
                  <li class="flex items-start gap-2">
                    <span class="font-black" style="color: var(--studio-accent)">1.</span>
                    <span>Registre a operação imediatamente após fechar.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="font-black" style="color: var(--studio-accent)">2.</span>
                    <span>Defina o gatilho e o estado emocional.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="font-black" style="color: var(--studio-accent)">3.</span>
                    <span>{slides[currentSlideIndex].desc || "Revise e filtre semanalmente."}</span>
                  </li>
                </ul>
              </div>

            <!-- 7. INSTALLER PROMO -->
            {:else if activeTemplate === "promo"}
              <div class="space-y-4 w-full">
                {#if slides[currentSlideIndex].image || (slides[currentSlideIndex].images && slides[currentSlideIndex].images.length > 0)}
                  <div class="relative w-full max-w-[240px] mx-auto h-[100px]">
                    <div 
                      id={`image-container-${currentSlideIndex}`}
                      class="w-full h-full rounded-lg border overflow-hidden relative shadow-lg bg-slate-950/20 select-none" 
                      style="border-color: var(--studio-accent)"
                      onwheel={handleImageWheel}
                    >
                      {#if slides[currentSlideIndex].image}
                        <img 
                          src={slides[currentSlideIndex].image} 
                          alt="Promo Base" 
                          class="absolute inset-0 w-full h-full cursor-move"
                          style="
                            object-fit: {slides[currentSlideIndex].imageFit || 'cover'};
                            transform: scale({slides[currentSlideIndex].imageScale || 1}) translate({slides[currentSlideIndex].imageXOffset || 0}px, {slides[currentSlideIndex].imageYOffset || 0}px) rotate({slides[currentSlideIndex].imageRotation || 0}deg);
                            transform-origin: center;
                            z-index: 1;
                            outline: {!isExporting && activeImageIndex === -1 ? '2px dashed var(--studio-accent)' : 'none'};
                            outline-offset: -2px;
                            border: {slides[currentSlideIndex].imageBorderWidth || 0}px solid {slides[currentSlideIndex].imageBorderColor || '#ffffff'};
                            border-radius: {slides[currentSlideIndex].imageBorderRadius || 0}px;
                          "
                          onmousedown={(e) => handleImageMouseDown(e, -1)}
                        />
                      {/if}
                      {#if slides[currentSlideIndex].images && slides[currentSlideIndex].images.length > 0}
                        {#each slides[currentSlideIndex].images as img, imgIdx}
                          {#if img.src}
                            <img 
                              src={img.src} 
                              alt="Promo Overlay {imgIdx + 1}" 
                              class="absolute inset-0 w-full h-full cursor-move"
                              style="
                                object-fit: {img.fit || 'cover'};
                                transform: scale({img.scale || 1}) translate({img.x || 0}px, {img.y || 0}px) rotate({img.rotation || 0}deg);
                                transform-origin: center;
                                z-index: {slides[currentSlideIndex].image ? imgIdx + 2 : imgIdx + 1};
                                outline: {!isExporting && activeImageIndex === imgIdx ? '2px dashed var(--studio-accent)' : 'none'};
                                outline-offset: -2px;
                                border: {img.borderWidth || 0}px solid {img.borderColor || '#ffffff'};
                                border-radius: {img.borderRadius || 0}px;
                              "
                              onmousedown={(e) => handleImageMouseDown(e, imgIdx)}
                            />
                          {/if}
                        {/each}
                      {/if}
                    </div>

                    <!-- Promo Resize Handle -->
                    {#if !isExporting}
                      {#if activeImageIndex === -1 && slides[currentSlideIndex].image}
                        <div 
                          class="absolute z-50 w-3 h-3 bg-emerald-400 rounded-full border border-white shadow shadow-emerald-500/50 cursor-se-resize select-none"
                          style="
                            left: calc(50% + {slides[currentSlideIndex].imageXOffset || 0}px + {(240 * (slides[currentSlideIndex].imageScale || 1)) / 2}px - 6px);
                            top: calc(50% + {slides[currentSlideIndex].imageYOffset || 0}px + {(100 * (slides[currentSlideIndex].imageScale || 1)) / 2}px - 6px);
                          "
                          onmousedown={(e) => handleResizeMouseDown(e, -1)}
                        ></div>
                      {:else if activeImageIndex >= 0 && slides[currentSlideIndex].images && slides[currentSlideIndex].images[activeImageIndex]}
                        {@const img = slides[currentSlideIndex].images[activeImageIndex]}
                        <div 
                          class="absolute z-50 w-3 h-3 bg-emerald-400 rounded-full border border-white shadow shadow-emerald-500/50 cursor-se-resize select-none"
                          style="
                            left: calc(50% + {img.x || 0}px + {(240 * (img.scale || 1)) / 2}px - 6px);
                            top: calc(50% + {img.y || 0}px + {(100 * (img.scale || 1)) / 2}px - 6px);
                          "
                          onmousedown={(e) => handleResizeMouseDown(e, activeImageIndex)}
                        ></div>
                      {/if}
                    {/if}
                  </div>
                {:else}
                  <div class="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center border mx-auto shadow-xl" style="border-color: var(--studio-accent)">
                    🚀
                  </div>
                {/if}
                <h2 class="text-lg font-black tracking-tight leading-none uppercase">
                  {slides[currentSlideIndex].title || "DIÁRIO DE TRADING DEFINITIVO"}
                </h2>
                <div class="py-1 px-3 rounded border text-[9px] font-black w-fit mx-auto select-none uppercase tracking-wider bg-slate-950/20" style="border-color: var(--studio-accent)">
                  💻 Windows / Linux / macOS
                </div>
                <p class="text-[10px] leading-relaxed opacity-75 whitespace-pre-line">
                  {slides[currentSlideIndex].desc || "Instalação offline simples..."}
                </p>
              </div>

            <!-- 8. DASHBOARD GLOW -->
            {:else if activeTemplate === "dashboard"}
              <div class="space-y-3 w-full">
                {#if slides[currentSlideIndex].image || (slides[currentSlideIndex].images && slides[currentSlideIndex].images.length > 0)}
                  <div class="relative w-full max-w-[280px] mx-auto h-[120px]">
                    <div 
                      id={`image-container-${currentSlideIndex}`}
                      class="w-full h-full rounded-lg border overflow-hidden relative shadow-[0_0_15px_var(--studio-accent)] bg-slate-950/20 select-none" 
                      style="border-color: var(--studio-accent)"
                      onwheel={handleImageWheel}
                    >
                      {#if slides[currentSlideIndex].image}
                        <img 
                          src={slides[currentSlideIndex].image} 
                          alt="Dashboard Base" 
                          class="absolute inset-0 w-full h-full cursor-move"
                          style="
                            object-fit: {slides[currentSlideIndex].imageFit || 'cover'};
                            transform: scale({slides[currentSlideIndex].imageScale || 1}) translate({slides[currentSlideIndex].imageXOffset || 0}px, {slides[currentSlideIndex].imageYOffset || 0}px) rotate({slides[currentSlideIndex].imageRotation || 0}deg);
                            transform-origin: center;
                            z-index: 1;
                            outline: {!isExporting && activeImageIndex === -1 ? '2px dashed var(--studio-accent)' : 'none'};
                            outline-offset: -2px;
                            border: {slides[currentSlideIndex].imageBorderWidth || 0}px solid {slides[currentSlideIndex].imageBorderColor || '#ffffff'};
                            border-radius: {slides[currentSlideIndex].imageBorderRadius || 0}px;
                          "
                          onmousedown={(e) => handleImageMouseDown(e, -1)}
                        />
                      {/if}
                      {#if slides[currentSlideIndex].images && slides[currentSlideIndex].images.length > 0}
                        {#each slides[currentSlideIndex].images as img, imgIdx}
                          {#if img.src}
                            <img 
                              src={img.src} 
                              alt="Dashboard Overlay {imgIdx + 1}" 
                              class="absolute inset-0 w-full h-full cursor-move"
                              style="
                                object-fit: {img.fit || 'cover'};
                                transform: scale({img.scale || 1}) translate({img.x || 0}px, {img.y || 0}px) rotate({img.rotation || 0}deg);
                                transform-origin: center;
                                z-index: {slides[currentSlideIndex].image ? imgIdx + 2 : imgIdx + 1};
                                outline: {!isExporting && activeImageIndex === imgIdx ? '2px dashed var(--studio-accent)' : 'none'};
                                outline-offset: -2px;
                                border: {img.borderWidth || 0}px solid {img.borderColor || '#ffffff'};
                                border-radius: {img.borderRadius || 0}px;
                              "
                              onmousedown={(e) => handleImageMouseDown(e, imgIdx)}
                            />
                          {/if}
                        {/each}
                      {/if}
                    </div>

                    <!-- Dashboard Resize Handle -->
                    {#if !isExporting}
                      {#if activeImageIndex === -1 && slides[currentSlideIndex].image}
                        <div 
                          class="absolute z-50 w-3 h-3 bg-emerald-400 rounded-full border border-white shadow shadow-emerald-500/50 cursor-se-resize select-none"
                          style="
                            left: calc(50% + {slides[currentSlideIndex].imageXOffset || 0}px + {(280 * (slides[currentSlideIndex].imageScale || 1)) / 2}px - 6px);
                            top: calc(50% + {slides[currentSlideIndex].imageYOffset || 0}px + {(120 * (slides[currentSlideIndex].imageScale || 1)) / 2}px - 6px);
                          "
                          onmousedown={(e) => handleResizeMouseDown(e, -1)}
                        ></div>
                      {:else if activeImageIndex >= 0 && slides[currentSlideIndex].images && slides[currentSlideIndex].images[activeImageIndex]}
                        {@const img = slides[currentSlideIndex].images[activeImageIndex]}
                        <div 
                          class="absolute z-50 w-3 h-3 bg-emerald-400 rounded-full border border-white shadow shadow-emerald-500/50 cursor-se-resize select-none"
                          style="
                            left: calc(50% + {img.x || 0}px + {(280 * (img.scale || 1)) / 2}px - 6px);
                            top: calc(50% + {img.y || 0}px + {(120 * (img.scale || 1)) / 2}px - 6px);
                          "
                          onmousedown={(e) => handleResizeMouseDown(e, activeImageIndex)}
                        ></div>
                      {/if}
                    {/if}
                  </div>
                {:else}
                  <!-- Simulated App Dashboard Graphic -->
                  <div class="w-full max-w-[280px] mx-auto h-[100px] border border-dashed rounded-lg bg-slate-950/40 relative flex flex-col justify-between p-2" style="border-color: var(--studio-accent)">
                    <div class="flex items-center justify-between text-[7px] opacity-40 uppercase tracking-widest font-black">
                      <span>Performance Curve</span>
                      <span>Profit Factor: 3.12</span>
                    </div>
                    <div class="flex-1 flex items-end gap-1.5 justify-center py-2">
                      <div class="w-6 h-6 bg-slate-800 rounded"></div>
                      <div class="w-6 h-10 bg-slate-800 rounded"></div>
                      <div class="w-6 h-14 bg-emerald-500 rounded animate-pulse"></div>
                      <div class="w-6 h-8 bg-slate-800 rounded"></div>
                      <div class="w-6 h-18 bg-emerald-600 rounded"></div>
                    </div>
                  </div>
                {/if}
                <h2 class="text-md font-black tracking-tight uppercase leading-tight">
                  {slides[currentSlideIndex].title || "DASHBOARD ESTATÍSTICO"}
                </h2>
                <p class="text-[9px] leading-relaxed opacity-75">
                  {slides[currentSlideIndex].desc || "Visualize lucros, perdas e setups..."}
                </p>
              </div>

            <!-- 9. CLIENT FEEDBACK -->
            {:else if activeTemplate === "feedback"}
              <div class="space-y-4 w-full">
                <div class="flex items-center justify-center gap-0.5" style="color: var(--studio-accent)">
                  ★ ★ ★ ★ ★
                </div>
                <p class="text-xs italic leading-relaxed opacity-85 font-medium whitespace-pre-line max-w-[280px] mx-auto">
                  "{slides[currentSlideIndex].desc || "O melhor diário de trading que já usei..."}"
                </p>
                <span class="text-[9px] font-black uppercase tracking-wider block opacity-60">
                  — {slides[currentSlideIndex].title || "TRADER CONSISTENTE"}
                </span>
              </div>

            <!-- 10. INTERACTIVE POLL -->
            {:else if activeTemplate === "poll"}
              <div class="space-y-4 w-full max-w-[280px] mx-auto">
                <h2 class="text-sm font-black tracking-tight uppercase leading-snug">
                  {slides[currentSlideIndex].title || "VOCÊ MEDE SEUS DADOS DE OPERAÇÕES?"}
                </h2>
                <div class="grid grid-cols-2 gap-2">
                  <div class="p-3 rounded-xl border text-center font-black text-xs bg-slate-950/45 cursor-pointer hover:bg-slate-900 border-slate-800 select-none">
                    SIM 👍
                  </div>
                  <div class="p-3 rounded-xl border text-center font-black text-xs bg-slate-950/45 cursor-pointer hover:bg-slate-900 border-slate-800 select-none">
                    NÃO 👎
                  </div>
                </div>
              </div>

            <!-- 11. PRINT SHOWCASE -->
            {:else if activeTemplate === "print"}
              <div class="space-y-3 w-full">
                {#if slides[currentSlideIndex].image || (slides[currentSlideIndex].images && slides[currentSlideIndex].images.length > 0)}
                  <div class="relative w-full max-w-[310px] mx-auto h-[165px]">
                    <div 
                      id={`image-container-${currentSlideIndex}`}
                      class="w-full h-full rounded-lg border overflow-hidden relative shadow-[0_0_15px_var(--studio-accent)] bg-slate-950/20 select-none" 
                      style="border-color: var(--studio-accent)"
                      onwheel={handleImageWheel}
                    >
                      {#if slides[currentSlideIndex].image}
                        <img 
                          src={slides[currentSlideIndex].image} 
                          alt="Showcase Base" 
                          class="absolute inset-0 w-full h-full cursor-move"
                          style="
                            object-fit: {slides[currentSlideIndex].imageFit || 'cover'};
                            transform: scale({slides[currentSlideIndex].imageScale || 1}) translate({slides[currentSlideIndex].imageXOffset || 0}px, {slides[currentSlideIndex].imageYOffset || 0}px) rotate({slides[currentSlideIndex].imageRotation || 0}deg);
                            transform-origin: center;
                            z-index: 1;
                            outline: {!isExporting && activeImageIndex === -1 ? '2px dashed var(--studio-accent)' : 'none'};
                            outline-offset: -2px;
                            border: {slides[currentSlideIndex].imageBorderWidth || 0}px solid {slides[currentSlideIndex].imageBorderColor || '#ffffff'};
                            border-radius: {slides[currentSlideIndex].imageBorderRadius || 0}px;
                          "
                          onmousedown={(e) => handleImageMouseDown(e, -1)}
                        />
                      {/if}
                      {#if slides[currentSlideIndex].images && slides[currentSlideIndex].images.length > 0}
                        {#each slides[currentSlideIndex].images as img, imgIdx}
                          {#if img.src}
                            <img 
                              src={img.src} 
                              alt="Showcase Overlay {imgIdx + 1}" 
                              class="absolute inset-0 w-full h-full cursor-move"
                              style="
                                object-fit: {img.fit || 'cover'};
                                transform: scale({img.scale || 1}) translate({img.x || 0}px, {img.y || 0}px) rotate({img.rotation || 0}deg);
                                transform-origin: center;
                                z-index: {slides[currentSlideIndex].image ? imgIdx + 2 : imgIdx + 1};
                                outline: {!isExporting && activeImageIndex === imgIdx ? '2px dashed var(--studio-accent)' : 'none'};
                                outline-offset: -2px;
                                border: {img.borderWidth || 0}px solid {img.borderColor || '#ffffff'};
                                border-radius: {img.borderRadius || 0}px;
                              "
                              onmousedown={(e) => handleImageMouseDown(e, imgIdx)}
                            />
                          {/if}
                        {/each}
                      {/if}
                    </div>

                    <!-- Print Resize Handle -->
                    {#if !isExporting}
                      {#if activeImageIndex === -1 && slides[currentSlideIndex].image}
                        <div 
                          class="absolute z-50 w-3 h-3 bg-emerald-400 rounded-full border border-white shadow shadow-emerald-500/50 cursor-se-resize select-none"
                          style="
                            left: calc(50% + {slides[currentSlideIndex].imageXOffset || 0}px + {(310 * (slides[currentSlideIndex].imageScale || 1)) / 2}px - 6px);
                            top: calc(50% + {slides[currentSlideIndex].imageYOffset || 0}px + {(165 * (slides[currentSlideIndex].imageScale || 1)) / 2}px - 6px);
                          "
                          onmousedown={(e) => handleResizeMouseDown(e, -1)}
                        ></div>
                      {:else if activeImageIndex >= 0 && slides[currentSlideIndex].images && slides[currentSlideIndex].images[activeImageIndex]}
                        {@const img = slides[currentSlideIndex].images[activeImageIndex]}
                        <div 
                          class="absolute z-50 w-3 h-3 bg-emerald-400 rounded-full border border-white shadow shadow-emerald-500/50 cursor-se-resize select-none"
                          style="
                            left: calc(50% + {img.x || 0}px + {(310 * (img.scale || 1)) / 2}px - 6px);
                            top: calc(50% + {img.y || 0}px + {(165 * (img.scale || 1)) / 2}px - 6px);
                          "
                          onmousedown={(e) => handleResizeMouseDown(e, activeImageIndex)}
                        ></div>
                      {/if}
                    {/if}
                  </div>
                {:else}
                  <div class="w-full max-w-[310px] mx-auto h-[140px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-slate-500 text-[10px] uppercase font-bold" style="border-color: var(--studio-border)">
                    <span>Sem imagem carregada</span>
                    <span class="text-[8px] opacity-65">Faça o upload do seu print no painel esquerdo</span>
                  </div>
                {/if}
                <h2 class="text-xs font-black tracking-widest uppercase opacity-90" style="color: var(--studio-accent)">
                  {slides[currentSlideIndex].title || "CONFIRA OS RESULTADOS"}
                </h2>
              </div>
            {/if}

          </div>

          <!-- BOTTOM BOTTOM SECTION (HIGHLIGHT BOX / CTA / LOGO) -->
          <div class="flex flex-col gap-3 z-10 relative">
            <!-- Optional Highlight Box (if text present) -->
            {#if slides[currentSlideIndex].highlight}
              <div 
                class="border-l-[3px] py-1.5 px-3 rounded text-left bg-slate-950/20"
                style="border-color: var(--studio-accent); background-color: rgba(16,185,129,0.02);"
              >
                <span class="text-[7px] font-black uppercase tracking-wider opacity-60 block">DESTAQUE</span>
                <span class="text-[9px] font-bold tracking-wide leading-tight uppercase block">
                  {slides[currentSlideIndex].highlight}
                </span>
              </div>
            {/if}

            <!-- Optional CTA Box (if text present) -->
            {#if slides[currentSlideIndex].cta}
              <div 
                class="py-2 px-3 rounded-lg border border-dashed text-center font-bold"
                style="border-color: var(--studio-accent); background-color: rgba(16,185,129,0.05);"
              >
                <span class="text-[8px] font-black tracking-wider uppercase" style="color: var(--studio-accent)">
                  {slides[currentSlideIndex].cta}
                </span>
              </div>
            {/if}

            <!-- Footer Logo Row -->
            <div class="flex items-center justify-between text-[8px] font-black opacity-45 pt-1.5 border-t border-slate-900">
              <span class="tracking-widest flex items-center gap-1">
                <span>[📊]</span> TRADERLOG PRO
              </span>
              <span>
                SLIDE {currentSlideIndex + 1}/{slides.length}
              </span>
            </div>
          </div>

          <!-- RESIZE HANDLE FOR GENERAL TEMPLATES -->
          {#if !isExporting && !["promo", "dashboard", "print"].includes(activeTemplate)}
            {#if activeImageIndex === -1 && slides[currentSlideIndex].image}
              <div 
                class="absolute z-50 w-3.5 h-3.5 bg-emerald-400 rounded-full border border-white shadow shadow-emerald-500/50 cursor-se-resize select-none"
                style="
                  left: calc(50% + {slides[currentSlideIndex].imageXOffset || 0}px + {((activeFormat === 'story' ? 360 : 440) * (slides[currentSlideIndex].imageScale || 1)) / 2}px - 7px);
                  top: calc(50% + {slides[currentSlideIndex].imageYOffset || 0}px + {((activeFormat === 'story' ? 640 : 440) * (slides[currentSlideIndex].imageScale || 1)) / 2}px - 7px);
                "
                onmousedown={(e) => handleResizeMouseDown(e, -1)}
              ></div>
            {:else if activeImageIndex >= 0 && slides[currentSlideIndex].images && slides[currentSlideIndex].images.length > 0}
              {@const img = slides[currentSlideIndex].images[activeImageIndex]}
              {#if img && img.src}
                <div 
                  class="absolute z-50 w-3.5 h-3.5 bg-emerald-400 rounded-full border border-white shadow shadow-emerald-500/50 cursor-se-resize select-none"
                  style="
                    left: calc(50% + {img.x || 0}px + {((activeFormat === 'story' ? 360 : 440) * (img.scale || 1)) / 2}px - 7px);
                    top: calc(50% + {img.y || 0}px + {((activeFormat === 'story' ? 640 : 440) * (img.scale || 1)) / 2}px - 7px);
                  "
                  onmousedown={(e) => handleResizeMouseDown(e, activeImageIndex)}
                ></div>
              {/if}
            {/if}
          {/if}
        </div>
      </div>
    </main>
  </div>

  <!-- AI SETTINGS MODAL DIALOG -->
  {#if showSettings}
    <div class="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-6">
        <div>
          <h3 class="text-lg font-black tracking-tight text-white uppercase flex items-center gap-2">
            <Settings class="w-4.5 h-4.5 text-emerald-400" /> Configuração da IA
          </h3>
          <p class="text-slate-400 text-xs mt-1">Coloque as credenciais de API para habilitar a geração de roteiros de marketing automáticos.</p>
        </div>

        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-[10px] font-bold text-slate-400 tracking-wider">PREFERÊNCIA DE IA</label>
            <div class="grid grid-cols-2 gap-2">
              <button 
                onclick={() => { activeAI = "gemini"; aiModel = "gemini-2.5-flash"; }}
                class="py-2 rounded-xl text-xs font-bold border transition-all {activeAI === 'gemini' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400'}"
              >
                Google Gemini
              </button>
              <button 
                onclick={() => { activeAI = "openai"; aiModel = "gpt-4o-mini"; }}
                class="py-2 rounded-xl text-xs font-bold border transition-all {activeAI === 'openai' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'}"
              >
                OpenAI ChatGPT
              </button>
            </div>
          </div>

          {#if activeAI === "gemini"}
            <div class="space-y-2">
              <label for="gemini-key" class="text-[9px] font-bold text-slate-400 tracking-widest uppercase block">GEMINI API KEY (GOOGLE STUDIO)</label>
              <input 
                type="password" 
                id="gemini-key"
                bind:value={aiKeyGemini}
                placeholder="Cole sua API Key da Google..."
                class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-amber-500"
              />
              <span class="text-[9.5px] text-slate-500 leading-tight block">
                Você pode obter uma chave gratuita no site da Google AI Studio.
              </span>
            </div>

            <div class="space-y-2">
              <label for="gemini-model" class="text-[9px] font-bold text-slate-400 tracking-widest uppercase block">MODELO GEMINI</label>
              <select 
                id="gemini-model"
                bind:value={aiModel}
                class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Rápido/Recomendado)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Qualidade de Copy Extrema)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Super compatível)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Alternativa de alta qualidade)</option>
              </select>
            </div>
          {:else}
            <div class="space-y-2">
              <label for="openai-key" class="text-[9px] font-bold text-slate-400 tracking-widest uppercase block">OPENAI API KEY (CHATGPT)</label>
              <input 
                type="password" 
                id="openai-key"
                bind:value={aiKeyOpenAI}
                placeholder="sk-..."
                class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div class="space-y-2">
              <label for="openai-model" class="text-[9px] font-bold text-slate-400 tracking-widest uppercase block">MODELO CHATGPT</label>
              <select 
                id="openai-model"
                bind:value={aiModel}
                class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
              >
                <option value="gpt-4o-mini">gpt-4o-mini (Rápido e Barato)</option>
                <option value="gpt-4o">gpt-4o (Completo)</option>
              </select>
            </div>
          {/if}
        </div>

        <div class="flex gap-2 pt-2">
          <button 
            onclick={() => showSettings = false}
            class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs"
          >
            Cancelar
          </button>
          <button 
            onclick={handleSaveSettings}
            class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 rounded-xl text-xs"
          >
            Salvar Chaves
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- BG REMOVER MODAL -->
  {#if showBgRemover}
    <div class="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh]">
        <!-- Modal Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <Eraser class="w-5 h-5 text-emerald-400" />
            <div>
              <h3 class="text-md font-black tracking-tight text-white uppercase">
                Remover Fundo de Imagem (PNG)
              </h3>
              <p class="text-slate-400 text-[10px] uppercase tracking-wider">
                Remova fundos sólidos localmente com precisão profissional
              </p>
            </div>
          </div>
          <button 
            onclick={() => showBgRemover = false} 
            class="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-all"
          >
            Fechar
          </button>
        </div>

        <!-- Modal Body Grid -->
        <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 py-6 overflow-y-auto min-h-0">
          
          <!-- Column 1: Upload and Controls -->
          <div class="space-y-4">
            <!-- Image Selector -->
            <div class="space-y-2">
              <label class="text-[10px] font-bold text-slate-400 tracking-wider block">1. CARREGAR IMAGEM</label>
              <div class="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 bg-slate-950/40 text-center transition-all cursor-pointer relative group">
                <input 
                  type="file" 
                  accept="image/*"
                  bind:this={bgRemoverFileSelector}
                  onchange={(e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        bgImageRaw = ev.target?.result as string;
                        processBackgroundRemoval(true);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  class="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <Image class="w-6 h-6 text-slate-500 group-hover:text-emerald-400 mb-2 transition-colors" />
                <span class="text-xs font-bold text-slate-300">Escolha uma imagem</span>
                <span class="text-[9px] text-slate-500 mt-1 uppercase">PNG, JPG ou WEBP</span>
              </div>
            </div>

            {#if bgRemoverError}
              <div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-1.5 leading-snug animate-pulse">
                <AlertTriangle class="w-4 h-4 shrink-0" />
                <span>{bgRemoverError}</span>
              </div>
            {/if}

            {#if bgImageRaw}
              <!-- Target Color Picker -->
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <label class="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">2. COR P/ REMOVER</label>
                  <span class="text-[9px] text-slate-500 font-bold uppercase">(Clique no preview para amostrar)</span>
                </div>
                <div class="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <input 
                    type="color" 
                    bind:value={targetColor}
                    oninput={processBackgroundRemoval}
                    class="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer" 
                  />
                  <div class="flex-1">
                    <span class="text-[10px] font-mono uppercase text-slate-300 tracking-wider block">{targetColor}</span>
                    <span class="text-[8px] text-slate-500 uppercase tracking-widest font-black">Cor Selecionada</span>
                  </div>
                </div>
              </div>

              <!-- Sliders -->
              <div class="space-y-4 bg-slate-950 p-3.5 border border-slate-800 rounded-xl">
                <!-- Tolerance Slider -->
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-[10px] font-bold text-slate-400">TOLERÂNCIA</span>
                    <span class="text-[10px] font-mono text-emerald-400 font-bold">{tolerance}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="150" 
                    bind:value={tolerance}
                    oninput={processBackgroundRemoval}
                    class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span class="text-[8px] text-slate-500 uppercase block">Controla a abrangência dos tons removidos</span>
                </div>

                <!-- Smoothness Slider -->
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-[10px] font-bold text-slate-400">SUAVIDADE DE BORDA</span>
                    <span class="text-[10px] font-mono text-emerald-400 font-bold">{smoothness}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    bind:value={smoothness}
                    oninput={processBackgroundRemoval}
                    class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span class="text-[8px] text-slate-500 uppercase block">Suaviza o contorno para evitar serrilhados</span>
                </div>
              </div>
            {/if}
          </div>

          <!-- Column 2 & 3: Original & Processed Previews -->
          <div class="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
            <!-- Original Image Box -->
            <div class="flex flex-col bg-slate-950 rounded-xl border border-slate-800 p-3 h-full justify-between min-h-[250px]">
              <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Imagem Original</span>
              <div class="flex-1 flex items-center justify-center overflow-hidden border border-slate-900 rounded-lg relative bg-slate-900/40">
                {#if bgImageRaw}
                  <!-- svelte-ignore a11y_click_events_have_key_events -->
                  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                  <img 
                    src={bgImageRaw} 
                    alt="Original" 
                    onclick={handleOriginalImageClick}
                    class="max-w-full max-h-[250px] object-contain cursor-crosshair hover:ring-2 hover:ring-emerald-500/30 transition-all" 
                  />
                {:else}
                  <span class="text-[10px] text-slate-500 uppercase font-black">Aguardando imagem...</span>
                {/if}
              </div>
            </div>

            <!-- Processed Image Box -->
            <div class="flex flex-col bg-slate-950 rounded-xl border border-slate-800 p-3 h-full justify-between min-h-[250px]">
              <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Sem Fundo (PNG)</span>
              <div class="flex-1 flex items-center justify-center overflow-hidden border border-slate-900 rounded-lg relative checkerboard-bg">
                {#if isProcessingBg}
                  <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center text-xs font-bold text-slate-300">
                    <RefreshCw class="w-5 h-5 animate-spin text-emerald-400 mr-2" /> Processando...
                  </div>
                {/if}
                
                {#if bgImageProcessed}
                  <img 
                    src={bgImageProcessed} 
                    alt="Sem Fundo" 
                    class="max-w-full max-h-[250px] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" 
                  />
                {:else}
                  <span class="text-[10px] text-slate-500 uppercase font-black">Aguardando processamento...</span>
                {/if}
              </div>
            </div>
          </div>

        </div>

        <!-- Modal Footer Actions -->
        {#if bgImageProcessed}
          <div class="flex gap-3 pt-4 border-t border-slate-800">
            <button 
              onclick={resetBgRemover}
              class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all"
            >
              Resetar
            </button>
            <div class="flex-1 flex gap-2 justify-end">
              <button 
                onclick={downloadProcessedPNG}
                class="bg-slate-800 hover:bg-slate-750 text-emerald-400 font-bold border border-emerald-500/20 py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 active:scale-98 transition-all"
              >
                <Download class="w-3.5 h-3.5" /> Baixar PNG Transparente
              </button>
              <button 
                onclick={applyBgRemoverImage}
                class="bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-black py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 active:scale-98 transition-all shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
              >
                Aplicar no Slide
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}

</div>

<style>
  .checkerboard-bg {
    background-color: #1e293b;
    background-image: 
      linear-gradient(45deg, #0f172a 25%, transparent 25%), 
      linear-gradient(-45deg, #0f172a 25%, transparent 25%), 
      linear-gradient(45deg, transparent 75%, #0f172a 75%), 
      linear-gradient(-45deg, transparent 75%, #0f172a 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  }
</style>
