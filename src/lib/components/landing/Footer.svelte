<script lang="ts">
    import { TrendingUp } from "lucide-svelte";
</script>

<footer class="py-16 px-6 border-t border-white/5 bg-slate-950">
    <div class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <TrendingUp class="text-slate-950 w-5 h-5" />
            </div>
            <span class="font-outfit font-black text-lg tracking-tight uppercase italic text-emerald-500">TraderLog<span class="text-white">Pro</span></span>
        </div>
        
        <p class="text-[9px] font-black uppercase tracking-widest text-slate-600 select-none">
            © 2025 TraderLogPro. Todos os direitos reservados.
        </p>

        <div class="flex gap-6">
            <a href="#" class="text-slate-500 hover:text-emerald-400 transition-colors text-xs font-black uppercase tracking-wider">Suporte</a>
        </div>
    </div>
</footer>
