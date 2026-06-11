<script lang="ts">
    import Logo from "$lib/components/shared/Logo.svelte";
</script>

<footer class="py-16 px-6 border-t border-white/5 bg-slate-900 relative z-10">
    <div class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <a href="#" class="flex items-center gap-2 group">
            <Logo showText={true} width="180px" height="32px" />
        </a>

        <p class="text-[9px] font-black uppercase tracking-widest text-slate-500 select-none">
            © 2025 TraderLogPro. Todos os direitos reservados.
        </p>

        <div class="flex items-center gap-6">
            <a href="https://www.instagram.com/traderlogprobr/" target="_blank" rel="noopener noreferrer" class="text-slate-500 hover:text-emerald-400 transition-colors text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
                @traderlogprobr
            </a>
            <span class="text-white/10">|</span>
            <a href="mailto:atendimento@traderlogpro.com.br" class="text-slate-500 hover:text-emerald-400 transition-colors text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                atendimento@traderlogpro.com.br
            </a>
        </div>
    </div>
</footer>
