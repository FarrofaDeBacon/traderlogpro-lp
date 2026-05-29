<!-- Logo.svelte -->
<script lang="ts">
  let { showText = true, width = "100%", height = "100%" } = $props();
</script>

<svg 
  xmlns="http://www.w3.org/2000/svg" 
  viewBox={showText ? "0 0 440 120" : "0 0 120 120"} 
  {width} 
  {height}
  class="transition-colors duration-200"
>
  <defs>
    <!-- Gradiente Verde Consistente -->
    <linearGradient id="neonGreen" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#10B981" />
    </linearGradient>
  </defs>

  <!-- Ícone (Brackets + Gráfico de Alta) -->
  <g transform="translate(15, 10)">
    <path 
      d="M 35,10 L 15,10 L 15,90 L 35,90" 
      fill="none" 
      class="stroke-slate-400 dark:stroke-slate-500 transition-colors duration-200" 
      stroke-width="8" 
      stroke-linecap="round" 
      stroke-linejoin="round"
    />
    <path 
      d="M 75,10 L 95,10 L 95,90 L 75,90" 
      fill="none" 
      class="stroke-slate-400 dark:stroke-slate-500 transition-colors duration-200" 
      stroke-width="8" 
      stroke-linecap="round" 
      stroke-linejoin="round"
    />
    <path d="M 28,70 L 48,50 L 58,60 L 80,30" fill="none" stroke="url(#neonGreen)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 64,30 L 80,30 L 80,46" fill="none" stroke="url(#neonGreen)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Tipografia Adaptável -->
  {#if showText}
    <text x="135" y="72" font-family="'Inter', system-ui, -apple-system, sans-serif" font-weight="900" font-size="46" letter-spacing="-0.5">
      <tspan class="fill-slate-900 dark:fill-white transition-colors duration-200">Trader</tspan>
      <tspan fill="#10B981">Log</tspan>
      <tspan class="fill-slate-500 dark:fill-slate-400 transition-colors duration-200" font-weight="500">Pro</tspan>
    </text>
  {/if}
</svg>
